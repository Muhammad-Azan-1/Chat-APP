
import { AppDispatch } from "../store/store"
import { LOGIN_USER } from '@/redux/reducers/authReducer'
import type { User } from "@/types/auth.types"


function LOGIN_USER_ACTION(user: User) {

    return (dispatch: AppDispatch) => {
        dispatch(LOGIN_USER(user))
    }
}


export { LOGIN_USER_ACTION }
