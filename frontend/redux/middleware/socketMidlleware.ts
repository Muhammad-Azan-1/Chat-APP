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
};

// Initialize it safely if it doesn't exist
if (globalForSocket.socketInstance === undefined) {
  globalForSocket.socketInstance = null;
}

const socketMiddleware: Middleware = (store) => (next) => (action: any) => {
  // Test logging - remove these after testing
  // console.log('=== SOCKET MIDDLEWARE ===')
  // console.log("Action" , action)
  // console.log('Action Type:', action.type)
  // console.log('Action Payload:', action.payload)

  // Handle CONNECT_SOCKET action

  if (action.type === "socket/CONNECT_SOCKET") {
    // console.log("received socket connection request")

    if (globalForSocket.socketInstance) {
      // console.log("Connection attempt already in progress or established")
      return next(action);
    }

    //? 1. Initialize the connection
    globalForSocket.socketInstance = io("http://localhost:4000", { withCredentials: true });

    //? 2. Listen for the 'connected' event emitted by backend
    globalForSocket.socketInstance.on("connected", () => {
      console.log(
        "Socket connected successfully!",
        globalForSocket.socketInstance?.id,
      );
      store.dispatch(SOCKET_CONNECTED());
    });

    //? 3. Listen for the 'disconnect' event emitted by backend
    globalForSocket.socketInstance.on("disconnect", () => {
      console.log("Socket disconnected", globalForSocket.socketInstance?.id);
      store.dispatch(SOCKET_DISCONNECTED());
      globalForSocket.socketInstance = null;
    });

    //? 4. Listen for the 'connect_error' event emitted by socket it self
    globalForSocket.socketInstance.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
      store.dispatch(SOCKET_ERROR(error.message));
      globalForSocket.socketInstance = null;
    });

    // Listen for chat events
    globalForSocket.socketInstance.on("newChat", (data) => {
      console.log("New chat received:", data);
    });

    globalForSocket.socketInstance.on("messageReceived", (data) => {
      console.log("New message received:", data);
    });

    
    // for CONNECT_SOCKET action
    // console.log("RUnning first next return")
    return next(action);
  }

  if (action.type === "socket/SOCKET_DISCONNECTED") {
    if (globalForSocket.socketInstance) {
      globalForSocket.socketInstance.disconnect();
      globalForSocket.socketInstance = null;
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
