import Router from 'express'
import { createOneOnONeChat , getAllChats , deleteOneOnOneChat, getChatById} from '../controllers/chat.controllers.js'

import {verifyJWT} from '../middleware/verifyJwt.middleware.js'

const router = Router()


router.route('/create/:receiverId').post(verifyJWT,createOneOnONeChat)
router.route("/getAllChats").get(verifyJWT , getAllChats)
router.route('/:chatId').get(verifyJWT, getChatById)
router.route('/delete/:chatId').delete(verifyJWT , deleteOneOnOneChat)

export default router