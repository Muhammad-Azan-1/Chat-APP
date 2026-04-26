import Router from 'express'
import { createOneOnONeChat} from '../controllers/chat.controllers.js'

import {verifyJWT} from '../middleware/verifyJwt.middleware.js'

const router = Router()


router.route('/c/:receiverId').post( verifyJWT,createOneOnONeChat)


export default router