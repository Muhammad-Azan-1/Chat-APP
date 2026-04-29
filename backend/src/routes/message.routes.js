import Router from 'express'
import { upload } from '../middleware/mutler.middleware.js'
import { verifyJWT } from '../middleware/verifyJwt.middleware.js'
import { sendMessage } from '../controllers/message.controllers.js'

const router = Router()



router.route('/send/:chatId').post
(    verifyJWT , 
    upload.fields([{name : "attachements" , maxCount : 5}]) , 
    sendMessage)




export default router