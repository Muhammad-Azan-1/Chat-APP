import 'dotenv/config';
import {server} from './app.js'
import dbConnect from './db/main.js'
import logger from './logger/winston.logger.js'



dbConnect()
.then(()=>{
    server.listen(process.env.PORT,()=>{
        logger.info(`Server is running on port ${process.env.PORT}`)
    })
})
.catch((err)=>{
    logger.info("Error connecting to database",err)
})