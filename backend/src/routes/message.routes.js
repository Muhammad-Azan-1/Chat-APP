import Router from 'express'
import { upload } from '../middleware/mutler.middleware.js'
import { verifyJWT } from '../middleware/verifyJwt.middleware.js'
import {
    getAllMessages,
    sendMessage,
    deleteMessage
} from '../controllers/message.controllers.js'

const router = Router()

// Get all messages for a specific chat
router.route('/get/:chatId').get(verifyJWT, getAllMessages)

// Send a new message with optional attachments
router.route('/send/:chatId').post(
    verifyJWT,
    upload.fields([{ name: "attachments", maxCount: 5 }]),
    sendMessage
)

// Delete a specific message
router.route('/delete/:chatId/:messageId').delete(verifyJWT, deleteMessage)

export default router