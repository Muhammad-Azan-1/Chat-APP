
import { Socket } from 'socket.io-client'

export interface SocketState {
    isConnected : boolean,
    isConnecting : boolean,
    error : string | null
}