import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { LoggedInUser, User } from "@/types/auth.types";

const initialState: LoggedInUser = {
    details: null,
    isAuthenticated: false
}

const authSlice = createSlice({
    name: 'auth',
    initialState: initialState,
    reducers: {

        LOGIN_USER: (state, action: PayloadAction<User>) => {
            console.log("LOGIN USER REDUCER", action.payload)
            state.details = action.payload
            state.isAuthenticated = true
        },

        LOGOUT_USER: (state) => {
            state.details = null
            state.isAuthenticated = false
        }
    }

})


export const { LOGIN_USER, LOGOUT_USER } = authSlice.actions
export default authSlice.reducer