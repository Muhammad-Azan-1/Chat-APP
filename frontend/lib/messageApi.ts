import { customFetch } from "./customFetch";
import { BackendMessage, Message } from "@/types/chat.types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Transform backend message to frontend format
export function transformBackendMessageToUI(
  backendMessage: BackendMessage,
  currentUserId: string
): Message {
  return {
    id: backendMessage._id,
    senderId: backendMessage.sender._id,
    senderName: backendMessage.sender.username,
    senderAvatar: backendMessage.sender.avatar,
    content: backendMessage.message,
    attachments: backendMessage.attachements.map((att) => ({ url: att.url })),
    chatId: backendMessage.chat,
    timestamp: backendMessage.createdAt,
    isOwnMessage: backendMessage.sender._id === currentUserId,
  };
}

// Get all messages for a chat
export async function getAllMessages(
  chatId: string,
  currentUserId: string
): Promise<Message[]> {
  const response = await customFetch(
    `/api/v1/message/get/${chatId}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
        const error = await response.json();
    throw new Error(error.message || "Failed to fetch messages");
  }

  const data = await response.json();
  const messages: BackendMessage[] = data.data;
  // console.log("messages data received " , messages)

  return messages.map((msg) => transformBackendMessageToUI(msg, currentUserId));
}

// Send a new message
export async function sendMessage(
  chatId: string,
  message: string,
  attachments: File[]
): Promise<BackendMessage> {
  const formData = new FormData();
  formData.append("message", message);

  // Add attachments if any
  attachments.forEach((file) => {
    formData.append("attachments", file);
  });

  const response = await customFetch(
    `/api/v1/message/send/${chatId}`,
    {
      method: "POST",
      body: formData,
      // Don't set Content-Type - browser will set it with correct boundary for multipart/form-data
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to send message");
  }

  const data = await response.json();
  // console.log("data" , data)
  return data.data;
}

// Delete a message
export async function deleteMessage(
  chatId: string,
  messageId: string
): Promise<void> {
  const response = await customFetch(
    `/api/v1/message/delete/${chatId}/${messageId}`,
    {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to delete message");
  }
}
