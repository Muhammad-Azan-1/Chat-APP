import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import { SelectedChat } from "@/types/chat.types";


let initialState  : {chats : SelectedChat[]} =  {
        chats : []
}


const chatSlice = createSlice({
    name : 'chat',
    initialState,
    reducers : {
        // To set all chats on initial load
        SET_CHAT : ( state , action : PayloadAction< SelectedChat[]>) =>{
            state.chats = action.payload

        },

        // To add a newly created chat to the top of the list
        ADD_CHAT : (state , action : PayloadAction< SelectedChat>) =>{
            state.chats.unshift(action.payload)
        },

        // To remove a deleted chat from the list
        DELETE_CHAT : (state , action : PayloadAction< string>) =>{
            state.chats = state.chats.filter(chat => chat.id !== action.payload)
        }

    }

})



export const {SET_CHAT , ADD_CHAT , DELETE_CHAT} = chatSlice.actions
export default chatSlice.reducer