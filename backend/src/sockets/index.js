import cookie from 'cookie'
import { User } from '../models/user.model.js'
import jwt from 'jsonwebtoken'
import {ChatEventEnum} from '../constant.js'



//? Socket.io, "mounting" simply means attaching an event listener to the socket


//? 1- This function is responsible to allow user to join the chat represented by chatId (chatId). 
//? event happens when user switches between the chats

const mountJoinChatEvent = (socket) =>{
    socket.on(ChatEventEnum.JOIN_CHAT_EVENT , (chatId)=>{
        console.log("User joined chat room" , chatId)
        socket.join(chatId)
    })
}


//?  This function is responsible to emit the typing event to the other participants of the chat
const mountTypingEvent = (socket) =>{
    socket.on(ChatEventEnum.TYPING_EVENT , (chatId)=>{
        socket.in(chatId).emit(ChatEventEnum.TYPING_EVENT , chatId)
    })

}


//  When User A types, here's what happens:                                                                                                                     
                                                                                                                                                            
//   // User A's frontend                                                                                                                                        
//   socket.emit("typing", chatId)  // This goes through User A's socket connection                                                                              
                                                                                                                                                              
//   On the backend:                                                                                                                                             
//   const mountTypingEvent = (socket) => {                                                                                                                      
//       socket.on(ChatEventEnum.TYPING_EVENT, (chatId) => {                                                                                                     
//           socket.in(chatId).emit(ChatEventEnum.TYPING_EVENT, chatId)                                                                                          
//       })                                                                                                                                                      
//   }                                                                                                                                                           
                                                                                                                                                              
//   The socket parameter is User A's specific socket connection!                                                                                                
                                                                                                                                                              
//   Visual Breakdown                                                                                                                                            
                                                                                                                                                              
//   Backend has 3 socket connections:                                                                                                                           
//   ├── socket_A (User A's connection)                                                                                                                          
//   ├── socket_B (User B's connection)                                                                                                                          
//   └── socket_C (User C's connection)                                                                                                                          
                                                                                                                                                              
//   When User A types:                                                                                                                                          
//       ↓                                                                                                                                                       
//   Event arrives through socket_A                                                                                                                              
//       ↓                                                                                                                                                       
//   Backend executes: socket_A.in(chatId).emit("typing", chatId)                                                                                                
//       ↓                                                                                                                                                       
//   Broadcasts to everyone in chatId EXCEPT socket_A                                                                                                            
//       ↓                                                                                                                                                       
//   socket_B receives ✅                                                                                                                                        
//   socket_C receives ✅                                                                                                                                        
//   socket_A does NOT receive ❌                                                                                                                                
                                                                                                                                                              
//   The Key Insight                                                                                                                                             
                                                                                                                                                              
//   Each user has their own unique socket connection. When you call socket.on(), that socket variable is bound to that specific user's connection.              
                                                                                                                                                            
//   So:                                                                                                                                                         
//   - socket.in(chatId) = "From THIS specific user's socket, broadcast to others"                                                                             
//   - io.in(chatId) = "From the server (no specific user), broadcast to everyone" 

//? This function is responsible to emit the stopped typing event to the other participants of the chat

const mountStoppedTypingEvent = (socket) => {
  socket.on(ChatEventEnum.STOP_TYPING_EVENT, (chatId) => {
    socket.in(chatId).emit(ChatEventEnum.STOP_TYPING_EVENT, chatId);
  });
};



const intitializeSocketIO = (io) =>{
    console.log("Socket.IO initialized")

    return io.on("connect" , async (socket) =>{
     console.log("🔌 New connection attempt - Socket ID:", socket.id)
     try {

        //1
        const cookies = cookie.parse(socket.handshake.headers.cookie || "") 
        let token = cookies?.accessToken;

        // console.log("Socket connected" , socket.id)

        // 2. Fallback: check handshake auth (for mobile apps or non-cookie clients)
        if (!token) {
        token = socket.handshake.auth?.token;
      }

        if (!token) {
        throw new Error("Un-authorized handshake. Token is missing");
      }

       // 3. Verify the JWT
       const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

       // 4. Find the user
       const user = await User.findById(decodedToken?.id).select(
        "-password -refreshToken"
      );

       if (!user) {
        throw new Error("Un-authorized handshake. Token is invalid");
      }


       //5 attaching user to socket
       socket.user = user

      // 6. Join a personal room (for sending notifications even without active chat)
      // socket.join(user._id) is basically saying "create a permanent address for this user
      // on the server for as long as they are connected".

      // Phone  → Socket A ──┐
      //                     ├── both join room "user_123_id"
      // Laptop → Socket B ──┘
      // io.to("user_123_id").emit('newMessage', data)
      //         ↓
      // BOTH Phone and Laptop receive it ✅
      socket.join(user.id.toString())



     // 7 Tell client: "You're socket connection is established!"
      socket.emit(ChatEventEnum.CONNECTED_EVENT)
      console.log("User connected with USER ID : " , user.id.toString() , "socket id is" , socket.id)


    // 8 Mount all event listeners
    mountJoinChatEvent(socket)
    mountTypingEvent(socket)
    mountStoppedTypingEvent(socket)
    


    //9 when user disconnects 
    socket.on(ChatEventEnum.DISCONNECT_EVENT , ()=>{
         console.log("User disconnected 🚫. userId: " + socket.user?.id);
        if(socket.user.id){
            socket.leave(socket.user.id.toString())
        }
    })




     } catch (error) {

        socket.emit(
            ChatEventEnum.SOCKET_ERROR_EVENT,
           error?.message || "Something went wrong"
        )
     }



    })

}

const emitSocketEvents = (req , roomId , event , payload) =>{
        console.log("Event" , event , "is emitted")
    req.app.get('io').in(roomId).emit(event , payload) 
    // for emitting message into a roomId ensure that room with this Id must already exists
    // and we have already created the Room with every user id inside the intitializeSocketIO function
}



export {emitSocketEvents , intitializeSocketIO}



// .on() is the EAR 👂: It means "Listen for this event to happen."

// .in() is the MEGAPHONE 📢: It means "Go IN to this specific room, 
// and shout this message only to the people inside."



//? Socket Room 


// ```
// User opens app on 3 devices
//         ↓
// Phone   → Socket A ──┐
// Tablet  → Socket B ──┼── all join room "user_123"
// Laptop  → Socket C ──┘

// Someone sends message to user_123
//         ↓
// io.to("user_123").emit('newMessage', data)
//         ↓
// Socket A receives it ✅  (Phone)
// Socket B receives it ✅  (Tablet)
// Socket C receives it ✅  (Laptop)
// ```

// ---

// ## Real Life Example

// Exactly like **WhatsApp Web + Phone**:

// ```
// You open WhatsApp on Phone  → Socket A → joins room "your_id"
// You open WhatsApp on Laptop → Socket B → joins room "your_id"

// Friend sends you a message
//         ↓
// Server: io.to("your_id").emit('newMessage', data)
//         ↓
// Phone gets message  ✅
// Laptop gets message ✅

// You disconnect Phone
//         ↓
// Socket A removed from room automatically
// Room "your_id" now only has Socket B
//         ↓
// Next message comes
//         ↓
// Only Laptop gets it ✅  (because phone is offline)
// ```

// ---

// ## Summary

// ```
// room "user_id" = post office box

// Jitne bhi devices connect hon        → sab usi box mein
// Koi message bheje us user ko         → box mein dalo
// Socket.IO khud deliver karta hai     → sab connected devices ko

// Aapko individual sockets ki
// bilkul bhi parwah nahi ✅
// ```


///? 


// To break down exactly what you just said, here is the flow:

// 1. **The Target (`in(roomID)`):** You tell the server exactly which "box" of connections to look at in its memory.
// 2. **The Delivery (`emit(event, payload)`):** The server shoots the data *only* down the specific TCP pipes inside that box. 
// 3. **The Listener (`socket.on(...)`):** The frontend at the end of those specific pipes catches the packet, matches the event name, and runs the function.
// 4. **The Isolation:** Every other user in every other room on the server hears absolutely nothing. Total privacy and zero wasted bandwidth.

// This is the exact fundamental concept behind private messaging, multiplayer game lobbies, and targeted live notifications. You've officially conquered the core architecture of real-time web development!