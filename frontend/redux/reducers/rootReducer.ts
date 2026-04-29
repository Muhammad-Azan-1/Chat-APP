import { combineReducers } from "redux";
import authReducer from './authReducer'
import socketReducer from './socketReducer'
import chatReducer from './chatReducers'

export const rootReducers = combineReducers({
    auth : authReducer,
    socket : socketReducer,
    chat : chatReducer
})