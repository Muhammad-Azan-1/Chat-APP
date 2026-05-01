//* This middleware intercepts Redux actions and handles socket connection logic. Here's the flow:

import { Middleware } from "redux";
import { io, Socket } from "socket.io-client";
import {
  SOCKET_CONNECTED,
  SOCKET_DISCONNECTED,
  SOCKET_ERROR,
} from "../reducers/socketReducer";




// Define a globally persistent object for the socket so it survives Next.js HMR (Fast Refresh)
// 💡 Note on TypeScript Casting (as unknown as ...):
// TypeScript doesn't natively know about our custom 'socketInstance' property on the global window object.
// We use "as unknown" to strip its strict default type, and then cast it to our custom object type
// so TypeScript stops complaining and lets us save the socket connection persistently!
const globalForSocket = globalThis as unknown as {
  socketInstance: Socket | null;
  listenersAttached: boolean;
};

// Initialize it safely if it doesn't exist
if (globalForSocket.socketInstance === undefined) {
  globalForSocket.socketInstance = null;
}

if (globalForSocket.listenersAttached === undefined) {
  globalForSocket.listenersAttached = false;
}

// Track if listeners have been set up to avoid duplicates
const socketMiddleware: Middleware = (store) => (next) => (action: any) => {

  // Function to set up socket event listeners (only called once per socket instance)
  const setupSocketEvents = (socket: Socket) => {
    // Skip if listeners are already set up for this socket instance
    if (globalForSocket.listenersAttached) {
      // console.log("⚠️ Socket listeners already set up, skipping...");
      return;
    }

    // console.log("🔧 Setting up socket event listeners...");
    globalForSocket.listenersAttached = true;

    // Listen for backend's custom 'connected' event
    socket.on("connected", () => {
      // console.log("✅ Socket connected successfully!", socket.id);
      store.dispatch(SOCKET_CONNECTED());
    });

    // Listen for disconnect
    socket.on("disconnect", (reason) => {
      // console.log("⚠️ Socket disconnected:", reason);
      store.dispatch(SOCKET_DISCONNECTED());
      // console.log("🔄 Socket.io will attempt to reconnect...");
    });

    // Listen for connection errors
    socket.on("connect_error", (error) => {
      // console.error("❌ Socket connection error:", error.message);
      store.dispatch(SOCKET_ERROR(error.message));
    });

    // Listen for chat events (keeping for future use, but not adding to Redux immediately)
    socket.on("newChat", (data) => {
      // console.log("📨 New chat created (not adding to list until first message):", data._id);
    });

    // Listen for message events
    socket.on("messageReceived", async (data) => {
      // console.log("New message received:", data);
      const currentUserId = store.getState().auth.details?._id;
      // console.log("Current user ID in middleware:", currentUserId);

      if (currentUserId && data) {
        const chatId = data.chat;

        // Check if chat exists in Redux
        const existingChat = store.getState().chat.chats.find((c: any) => c.id === chatId);

        if (!existingChat) {
          // console.log("🆕 Chat not found in Redux, fetching from backend...");

          // Fetch specific chat from backend
          try {
            const response = await fetch(`http://localhost:4000/api/v1/chats/${chatId}`, {
              credentials: 'include'
            });

            if (response.ok) {
              const result = await response.json();
              const backendChat = result.data;

              // Transform and add to Redux
              const { transformBackendChatToUI } = await import("@/lib/transformBackendChatToUI");
              const transformedChat = transformBackendChatToUI(backendChat, currentUserId);

              store.dispatch({
                type: "chat/ADD_CHAT",
                payload: transformedChat
              });

              // console.log("✅ Chat added to Redux:", transformedChat.id, transformedChat.name);
            }
          } catch (error) {
            // console.error("Failed to fetch chat:", error);
          }
        }

        // Now add the message
        // console.log("✅ Dispatching message to Redux for chat:", data.chat);
        const message = {
          id: data._id,
          senderId: data.sender._id,
          senderName: data.sender.username,
          senderAvatar: data.sender.avatar,
          content: data.message,
          attachments: data.attachements?.map((att: any) => ({ url: att.url })) || [],
          chatId: data.chat,
          timestamp: data.createdAt,
          isOwnMessage: data.sender._id === currentUserId,
        };

        // console.log("📦 Transformed message object:", { chatId: data.chat, messageId: message.id });

        store.dispatch({
          type: "message/ADD_MESSAGE",
          payload: { chatId: data.chat, message }
        });

        // Check if this chat is currently selected/open
        const currentlySelectedChatId = store.getState().chat.currentlySelectedChatId;
        const isCurrentChat = currentlySelectedChatId === data.chat;

        store.dispatch({
          type: "chat/UPDATE_CHAT_ON_MESSAGE",
          payload: {
            chatId: data.chat,
            message: data.message,
            senderName: data.sender.username,
            timestamp: data.createdAt,
            isCurrentChat: isCurrentChat
          }
        });

        // console.log("🚀 Dispatch completed. Current state:", store.getState().message.messages[data.chat]?.length || 0, "messages");
        // console.log("📊 FULL STATE FOR THIS USER:", {
        //   userId: currentUserId,
        //   allChats: store.getState().chat.chats.map((c: any) => c.id),
        //   allMessageChatIds: Object.keys(store.getState().message.messages),
        //   thisChat: store.getState().message.messages[data.chat]
        // });

      }
    });

    socket.on("messageDeleted", (data) => {
      // console.log("Message deleted:", data);
      // Remove message from Redux
      if (data && data._id && data.chat) {
        store.dispatch({
          type: "message/DELETE_MESSAGE",
          payload: { chatId: data.chat, messageId: data._id }
        });
      }
    });

    // Listen for typing events
    socket.on("typing", (chatId) => {
      // console.log("User is typing in chat:", chatId);
      store.dispatch({
        type: "chat/SET_TYPING",
        payload: { chatId, isTyping: true }
      });
    });

    // Listen for stop typing events
    socket.on("stopTyping", (chatId) => {
      // console.log("User stopped typing in chat:", chatId);
      store.dispatch({
        type: "chat/SET_TYPING",
        payload: { chatId, isTyping: false }
      });
    });
  };
  

  //? Handle CONNECT_SOCKET action

  if (action.type === "socket/CONNECT_SOCKET") {
    // console.log("received socket connection request")

    if (globalForSocket.socketInstance?.connected) {
      // console.log("Socket already connected");
      return next(action);
    }

    if (globalForSocket.socketInstance && !globalForSocket.socketInstance.connected) {
      // console.log("Socket exists but disconnected, reconnecting...");
      globalForSocket.socketInstance.connect();
      return next(action);
    }

    //? 1. Initialize the connection with auto-reconnect enabled
    // console.log("🔌 Initializing new socket connection...");

    // Reset listener flag since we're creating a new socket instance
    globalForSocket.listenersAttached = false;

    globalForSocket.socketInstance = io("http://localhost:4000", {
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });

    const socket = globalForSocket.socketInstance;

    // Set up socket event listeners
    setupSocketEvents(socket);

    // Set up manager-level reconnection handlers (only once)
    socket.io.on("reconnect_attempt", (attempt) => {
      // console.log(`🔄 Reconnection attempt #${attempt}...`);
    });

    socket.io.on("reconnect", (attempt) => {
      // console.log(`✅ Reconnected successfully after ${attempt} attempts!`);
      store.dispatch(SOCKET_CONNECTED());
      // Listeners persist across reconnections, no need to re-setup
    });

    socket.io.on("reconnect_error", (error) => {
      // console.error("❌ Reconnection error:", error.message);
    });

    socket.io.on("reconnect_failed", () => {
      // console.error("❌ Reconnection failed after all attempts");
      store.dispatch(SOCKET_ERROR("Failed to reconnect"));
    });


    // for CONNECT_SOCKET action
    // console.log("RUnning first next return")
    return next(action);
  }

  // Handle manual disconnect action (only for logout or explicit disconnect)
  if (action.type === "socket/DISCONNECT_SOCKET") {
    if (globalForSocket.socketInstance) {
      // console.log("🔌 Manually disconnecting socket...");
      globalForSocket.socketInstance.disconnect();
      globalForSocket.socketInstance = null;
      // Reset listener flag so they can be set up again on next connection
      globalForSocket.listenersAttached = false;
    }
  }

  // for all other reducer actions
  // console.log("RUnning second next return")
  return next(action);
};

export { socketMiddleware };
















//*     -----------------------------------------------------------------------------------------------       *//
//*     -----------------------------------------------------------------------------------------------       *//

//? Explanation

// Yeh line dekhne mein thori ajeeb aur khofnaak lagti hai kyunke isme lagatar teen dafa arrow `=>` use hua hai! JavaScript aur React ki duniya mein is technique ko **Currying** kehte hain.

// Redux ka har custom middleware strictly isi pattern par likha jata hai. Chaliye main isko chote chote hisson mein tod kar aasan Roman Urdu mein samjhata hoon:

// ### 1. TypeScript ka Hissa (`Middleware<{}, RootState>`)
// Yeh sirf TypeScript ko batane ke liye hai ke yeh function koi aam function nahi, balki ek Redux Middleware hai.
// * **`{}`**: Yeh `Dispatch` ki type hai (Aam tor par isko khali object chor dete hain ya `Dispatch` type likhte hain).
// * **`RootState`**: Yeh aapki poori app ki global state ka map hai. Iska faida yeh hai ke jab aap middleware ke andar `store.getState()` type karenge, toh VS Code aapko automatically bata dega ke state mein `auth` aur `socket` mojood hain.

// ---

// ### 2. Teen Arrows ka Raaz (`store => next => action =>`)
// Redux middlewares isi chain (zanjeer) ki shakal mein kaam karte hain. In teenon parameters ka ek maqsad hai:

// #### A. `store` (The Manager)
// Yeh aapko Redux store ki taqat deta hai. Is parameter ki madad se aap middleware ke andar do kaam kar sakte hain:
// 1. `store.getState()`: Poori app ki current state dekh sakte hain (e.g. user logged in hai ya nahi).
// 2. `store.dispatch()`: Koi naya action trigger kar sakte hain (jaise aapne `SOCKET_CONNECTED` fire kiya tha).

// #### B. `next` (The Conveyor Belt)
// Yeh sab se important parameter hai! Middleware raste ka chowkidar hota hai. Jab aapka kaam (jaise socket connect karna) khatam ho jaye, toh aapko action ko aage **Reducer** tak bhejna hota hai.
// Jab aap function ke end mein `return next(action)` likhte hain, toh iska matlab hai: *"Mera kaam ho gaya, ab is action ko aage guzarne do taake Reducer state update kar sake."*
// *(Agar aap `next(action)` nahi likhenge, toh app wahi stuck ho jayegi aur Reducer tak baat pohnchegi hi nahi!)*

// #### C. `action` (The Order/Box)
// Yeh wo actual action object hai jo aapke component ne dispatch kiya hai.
// Jaise: `{ type: 'socket/CONNECT_SOCKET', payload: { user } }`.
// Middleware is `action.type` ko check karta hai aur uske mutabiq apna kaam karta hai.

// ---

// ### Aasan Misaal (Analogy)
// Farz karein Redux ek **Pizza Factory** hai. Aapke Component ne ek order bheja hai (Action).
// * **`action`** = Aapka Pizza ka Order.
// * **`store`** = Factory ka Manager (Jisko factory ki har detail pata hai).
// * **Middleware** = Quality Control Checkpost.
// * **`next`** = Conveyor Belt (Jis par rakh kar pizza aage final packing ke liye jayega).

// Is line ka matlab hai:
// *"Main ek Middleware hoon, mujhe Manager (`store`) ka number do, phir main dekhta hoon aage bhejna hai (`next`) ya nahi, aur akhir mein mujhe batao ke order (`action`) kya hai!"*

//*     -----------------------------------------------------------------------------------------------       *//
//*     -----------------------------------------------------------------------------------------------       *//

//? FLOW

// Page Refresh
//         ↓
// Redux store initializes fresh
// all state = initial values
// isAuthenticated = false
//         ↓
// redux-persist wakes up
// reads your saved auth data from localStorage
//         ↓
// redux-persist automatically dispatches
// { type: "persist/REHYDRATE", payload: { auth: { isAuthenticated: true, user: {...} } } }
//         ↓
// This action passes through YOUR middleware
// (that's why you see it in logs)
//         ↓
// return next(action) sends it to reducer
//         ↓
// reducer merges saved data into state
// isAuthenticated = true ✅
// user = { ...your user data } ✅
//         ↓
// PersistGate sees rehydration complete
//         ↓
// SocketProvider re-renders
// sees isAuthenticated = true
// dispatches CONNECT_SOCKET()



// //? extra 


// //? recconet Events
//     const socket = globalForSocket.socketInstance;

//     // 1. See if it even tries
//     socket.io.on("reconnect_attempt", (attempt) => {
//       console.log(`[Socket.io] Auto-reconnect attempt #${attempt}...`);
//     });

//     // 2. See if it throws an error while trying
//     socket.io.on("reconnect_error", (error) => {
//       console.log(`[Socket.io] Auto-reconnect failed:`, error.message);
//     });

//     // 3. See if it actually succeeds!
//     socket.io.on("reconnect", (attempt) => {
//       console.log(`[Socket.io] SUCCESS! Reconnected after ${attempt} tries.`);
//        store.dispatch(SOCKET_CONNECTED()); // Tell Redux we are back!
//     });
