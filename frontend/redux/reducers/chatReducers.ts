import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import { SelectedChat } from "@/types/chat.types";


let initialState  : {chats : SelectedChat[], currentlySelectedChatId: string | null, typingUsers: Record<string, boolean>} =  {
        chats : [],
        currentlySelectedChatId: null,
        typingUsers: {} // chatId -> isTyping
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
        },

        // Update chat when new message arrives
        UPDATE_CHAT_ON_MESSAGE: (state, action: PayloadAction<{
            chatId: string;
            message: string;
            senderName: string;
            timestamp: string;
            isCurrentChat: boolean;
        }>) => {
            const { chatId, message, senderName, timestamp, isCurrentChat } = action.payload;
            const chatIndex = state.chats.findIndex(c => c.id === chatId);

            if (chatIndex !== -1) {
                const chat = state.chats[chatIndex];

                // Update last message info
                chat.lastMessage = message;
                chat.lastSender = senderName;
                chat.time = timestamp;

                // Increment unread count only if this is NOT the currently open chat
                if (!isCurrentChat) {
                    chat.unreadCount = (chat.unreadCount || 0) + 1;
                }

                // Move chat to top of list
                state.chats = [chat, ...state.chats.filter((_, i) => i !== chatIndex)];
            }
        },

        // Reset unread count when user opens a chat
        RESET_UNREAD_COUNT: (state, action: PayloadAction<string>) => {
            const chat = state.chats.find(c => c.id === action.payload);
            if (chat) {
                chat.unreadCount = 0;
            }
        },

        // Set the currently selected chat ID
        SET_SELECTED_CHAT: (state, action: PayloadAction<string | null>) => {
            state.currentlySelectedChatId = action.payload;
        },

        // Set typing status for a chat
        SET_TYPING: (state, action: PayloadAction<{ chatId: string; isTyping: boolean }>) => {
            const { chatId, isTyping } = action.payload;
            state.typingUsers[chatId] = isTyping;
        }

    }

})



export const {SET_CHAT , ADD_CHAT , DELETE_CHAT, UPDATE_CHAT_ON_MESSAGE, RESET_UNREAD_COUNT, SET_SELECTED_CHAT, SET_TYPING} = chatSlice.actions
export default chatSlice.reducer