import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "@/redux/store/store";
import {
  SET_MESSAGES_ACTION,
  ADD_MESSAGE_ACTION,
  DELETE_MESSAGE_ACTION,
  CLEAR_CHAT_MESSAGES_ACTION,
  SET_LOADING_ACTION,
  SET_ERROR_ACTION,
} from "@/redux/actions/messageAction";
import {
  getAllMessages as fetchAllMessages,
  sendMessage as sendMessageApi,
  deleteMessage as deleteMessageApi,
} from "@/lib/messageApi";


export function useMessages(chatId: string) {
  const dispatch = useDispatch<AppDispatch>();

  // Use shallowEqual to detect array changes properly
  const messages = useSelector(
    (state: RootState) => state.message.messages[chatId] || []
  );

  // console.log("🔍 useMessages hook - chatId:", chatId, "messages count:", messages.length)


  const loading = useSelector((state: RootState) => state.message.loading);
  const error = useSelector((state: RootState) => state.message.error);
  const currentUserId = useSelector((state: RootState) => state.auth.details?._id);

  // Fetch all messages for the current chat
  const loadMessages = useCallback(async () => {
    if (!currentUserId) return;

    try {
      dispatch(SET_LOADING_ACTION(true));
      const fetchedMessages = await fetchAllMessages(chatId, currentUserId);
      dispatch(SET_MESSAGES_ACTION(chatId, fetchedMessages));
    } catch (err: any) {
      // console.log(err , "error")
      dispatch(SET_ERROR_ACTION(err.message || "Failed to load messages"));
    }
  }, [chatId, currentUserId, dispatch]);



  
  // Send a new message
  const sendMessage = useCallback(
    async (content: string, attachments: File[] = []) => {
      if (!currentUserId) return;

      try {
        const backendMessage = await sendMessageApi(chatId, content, attachments);
        // Transform and add to Redux
        const transformedMessage = {
          id: backendMessage._id,
          senderId: backendMessage.sender._id,
          senderName: backendMessage.sender.username,
          senderAvatar: backendMessage.sender.avatar,
          content: backendMessage.message,
          attachments: backendMessage.attachements?.map((att) => ({ url: att.url })) || [],
          chatId: backendMessage.chat,
          timestamp: backendMessage.createdAt,
          isOwnMessage: backendMessage.sender._id === currentUserId,
        };
        dispatch(ADD_MESSAGE_ACTION(chatId, transformedMessage));

        // Update chat metadata (lastMessage, time, move to top)
        dispatch({
          type: "chat/UPDATE_CHAT_ON_MESSAGE",
          payload: {
            chatId: chatId,
            message: backendMessage.message,
            senderName: backendMessage.sender.username,
            timestamp: backendMessage.createdAt,
            isCurrentChat: true // Don't increment unread for sender
          }
        });
      } catch (err: any) {
        dispatch(SET_ERROR_ACTION(err.message || "Failed to send message"));
        throw err;
      }
    },
    [chatId, currentUserId, dispatch]
  );




  // Delete a message
  const deleteMessage = useCallback(
    async (messageId: string) => {
      try {
        await deleteMessageApi(chatId, messageId);
        // Message will be removed via socket event, but we can optimistically remove it
        dispatch(DELETE_MESSAGE_ACTION(chatId, messageId));
      } catch (err: any) {
        dispatch(SET_ERROR_ACTION(err.message || "Failed to delete message"));
        throw err;
      }
    },
    [chatId, dispatch]
  );

  // Clear messages for this chat
  const clearMessages = useCallback(() => {
    dispatch(CLEAR_CHAT_MESSAGES_ACTION(chatId));
  }, [chatId, dispatch]);

  return {
    messages,
    loading,
    error,
    loadMessages,
    sendMessage,
    deleteMessage,
    clearMessages,
  };
}
