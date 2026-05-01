import express from 'express'
import {errorHandler} from './middleware/error.middleware.js'
import cors from 'cors'
import morganMiddleware from './logger/morgan.logger.js'
import logger from './logger/winston.logger.js'
import userRouter from './routes/user.routes.js'
import chatRouter from './routes/chat.routes.js'
import messageRouter from './routes/message.routes.js'
import mongoSanitize from 'express-mongo-sanitize'
import cookieParser from "cookie-parser"
import http from 'http'
import {Server} from 'socket.io'
import { intitializeSocketIO } from './sockets/index.js'

const app = express()

const server = http.createServer(app)


const io = new  Server(server,{
  cors : {
    origin : process.env.CORS_ORIGIN,
    methods: ["GET", "POST", "DELETE", "PUT"],
    credentials : true
  },
  // --- THE HEARTBEAT SETTINGS ---
  pingTimeout: 60000,   // How long to wait for a pong before giving up (in ms)
  pingInterval: 25000,  // How often to send a ping (in ms)
})
// Every 25 seconds, your Node.js server asks the React frontend, "Are you still there?" (Ping). means
// send a ping packet to the frontend

// After sending the ping packet, the server waits 60 seconds. If the React frontend doesn't reply "Yes,
// I'm here!" means does not reply with (Pong) packet within those 60 seconds, the server officially kills 
// the connection and logs "User disconnected".



const allowedOrigins = [process.env.CORS_ORIGIN , "custom domain"]
const corsOptions = {
  origin : function( origin ,  callback){

    if(allowedOrigins.indexOf(origin) !== -1 || !origin){
    callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }

  },
  credentials: true
}


app.use((req, res, next) => {
  Object.defineProperty(req, 'query', {
    value: { ...req.query },
    writable: true, // This is the magic line that fixes the error
    configurable: true,
    enumerable: true,
  });
  next();
});

app.use(mongoSanitize())
app.use(express.json({limit: "16kb"}))
app.use(express.urlencoded({extended: true, limit: "16kb"}))
app.use(express.static("public"))
app.use(cookieParser())
app.use(morganMiddleware)
app.use(cors(corsOptions))


//?
const isProd = process.env.NODE_ENV === 'production';
const prefix = isProd ? '/backend' : '';

//? socket 
app.set("io" , io)
intitializeSocketIO(io)

//? Auth Routes
app.use(`${prefix}/api/v1/users`, userRouter);

//? Chat Routes
app.use(`${prefix}/api/v1/chats`, chatRouter);

//? Message Routes
app.use(`${prefix}/api/v1/message`, messageRouter);


//? Health check
app.get("/health", (req, res) => {
    logger.info("Someone hit the /health route!")
    res.status(200).json({ status: "OK", message: "Server is running" })
})




app.use(errorHandler)

export { server }












// ✨ Test Route to trigger all loggers
// app.get('/test-logger', (req, res, next) => {
//     // 1. Manually test an 'info' log
//     logger.info("Someone hit the /test-logger route!")
    
//     try {
//         // 2. Intentionally throw an error to test the Error Middleware & Error Logger
//         throw new ApiError(400, "This is a dummy test error purely for Winston!")
//     } catch (error) {
//         next(error)
//     }
// })
