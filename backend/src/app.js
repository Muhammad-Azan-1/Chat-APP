import express from 'express'
import {errorHandler} from './middleware/error.middleware.js'
import cors from 'cors'
import morganMiddleware from './logger/morgan.logger.js'
import logger from './logger/winston.logger.js'
import userRouter from './routes/user.routes.js'
import chatRouter from './routes/chat.routes.js'
import mongoSanitize from 'express-mongo-sanitize'
import cookieParser from "cookie-parser"
import http from 'http'
import {Server} from 'socket.io'


const app = express()

const server = http.createServer(app)


const io = new  Server(server,{
  cors : {
    origin : process.env.CORS_ORIGIN,
    methods: ["GET", "POST", "DELETE", "PUT"],
    credentials : true
  }
})



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



app.set("io" , io)

//? Auth Routes
app.use("/api/v1/users" , userRouter)

//? Chat Routes
app.use("/api/v1/chat" , chatRouter)



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
