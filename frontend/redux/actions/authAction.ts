
import { AppDispatch } from "../store/store"
import { LOGIN_USER } from '@/redux/reducers/authReducer'
import type { User } from "@/types/auth.types"


function LOGIN_USER_ACTION(user: User) {
    
    console.log("USER received", user)

    return (dispatch: AppDispatch) => {
        console.log("action dispatched")
        dispatch(LOGIN_USER(user))
    }
}


export { LOGIN_USER_ACTION }
