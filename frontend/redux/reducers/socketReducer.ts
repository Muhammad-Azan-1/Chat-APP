import { createSlice } from "@reduxjs/toolkit";
import { SocketState } from "@/types/socket.types";


const initialState : SocketState = {
    isConnected : false,
    isConnecting : false,
    error : null
}


const socketSlice = createSlice({
    name : "socket",
    initialState : initialState,
    reducers : {

        CONNECT_SOCKET : (state) =>{
            console.log("connect socket is dispatched")
            state.isConnecting = true
            state.error = null
        },

        SOCKET_CONNECTED : (state) =>{
            state.isConnected = true
            state.isConnecting = false
            state.error = null

        },

        SOCKET_DISCONNECTED : (state) =>{
            state.isConnected =false
            state.isConnecting = false
            state.error =  null

        },

        SOCKET_ERROR: (state, action) => {
        state.error = action.payload
        state.isConnecting = false
        state.isConnected =false

    }

    }
})



export default  socketSlice.reducer
export const {CONNECT_SOCKET , SOCKET_CONNECTED , SOCKET_DISCONNECTED , SOCKET_ERROR} = socketSlice.actions