"use client"

import React  from 'react'
import { useDispatch , useSelector } from 'react-redux'
import { useEffect  } from 'react'
import { RootState } from '../redux/store/store'
import  {CONNECT_SOCKET , SOCKET_DISCONNECTED} from '../redux/reducers/socketReducer'

const SocketProvider = ({children} : {children : React.ReactNode}) => {
      console.log("component rendered Socket Provider")

    const dispatch = useDispatch()
    const {isAuthenticated} = useSelector((item : RootState) => item.auth)
    const { isConnecting, isConnected } = useSelector((item: RootState) => item.socket)

    console.log(isConnected , isConnecting , isAuthenticated)

  useEffect(()=>{
 
    console.log("SocketProvider Effect executing. Current state:", { isAuthenticated, isConnecting, isConnected });

    if(isAuthenticated  && !isConnecting && !isConnected){
      console.log('User authenticated, connecting socket...')
      dispatch(CONNECT_SOCKET())
    }
    
    if(!isAuthenticated && isConnected){
      console.log('User not authenticated, disconnecting socket...')
      dispatch(SOCKET_DISCONNECTED())
    }
  },[isAuthenticated , isConnected , isConnecting , dispatch])
  
  return (
    <>{children}</>
  )
}

export default SocketProvider