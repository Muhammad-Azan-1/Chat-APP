import { AppDispatch } from "../store/store";
import { SelectedChat} from "@/types/chat.types";
import { ADD_CHAT , SET_CHAT , DELETE_CHAT } from "../reducers/chatReducers";


const ADD_CHAT_ACTION = (chats : SelectedChat) =>{
    console.log("chat data recieved" , chats)

    return (dispatch : AppDispatch) => {
        dispatch(ADD_CHAT(chats))
    }
}


const SET_CHAT_ACTION = (chats : SelectedChat[]) =>{
    console.log("chat data recieved" , chats)

    return (dispatch : AppDispatch) => {
        dispatch(SET_CHAT(chats))
    }
}


const DELETE_CHAT_ACTION = (chatId : string) =>{
    return (dispatch : AppDispatch) => {
        dispatch(DELETE_CHAT(chatId))
    }
}


export {ADD_CHAT_ACTION , SET_CHAT_ACTION , DELETE_CHAT_ACTION }