import { combineReducers } from "redux";
import authReducer from './authReducer'
import socketReducer from './socketReducer'
import chatReducer from './chatReducers'
import messageReducer from './messageReducer'

export const rootReducers = combineReducers({
    auth : authReducer,
    socket : socketReducer,
    chat : chatReducer,
    message : messageReducer
})