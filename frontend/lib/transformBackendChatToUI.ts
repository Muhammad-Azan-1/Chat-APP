// utils/formatChats.ts

import { BackendChatPayload, SelectedChat } from "@/types/chat.types";

export const transformBackendChatToUI = (
  chat: BackendChatPayload,
  loggedInUserId: string | undefined
): SelectedChat => {
  
  // 1. Find the people who are NOT the logged-in user
  const otherParticipants = chat.participants.filter(
    (p) => p._id.toString() !== loggedInUserId?.toString()
  );

  // 2. Determine the "main" other person for 1-on-1 chats
  const mainOtherUser = otherParticipants[0]

  return {
    id: chat._id,
    
    // UI Math: If group, use the new `groupName` field. Else, use the OTHER person's username.
    name: chat.isGroupChat ? (chat.groupName || "Group Chat") : mainOtherUser?.username || "Unknown User",
    
    //  person's avatar.
    avatar: (mainOtherUser?.avatar || ""),

    email : mainOtherUser.email,
    
    // Group avatar For stacking up to 3 little avatars in group chats or showing direct group avatar
    groupAvatar: chat.isGroupChat &&  chat.groupAvatar ? chat.groupAvatar :  chat.participants.map(p => p.avatar).slice(0, 3),
    
    isGroup: chat.isGroupChat,
    isOnline: false, // Default to false until Socket.io connects
    
    // Safely check if lastMessage exists (using your newly updated 'message' key)
    lastMessage: chat.lastMessage?.message || "No messages yet",
    lastSender: chat.lastMessage?.sender?.username,
    time: chat.lastMessage?.createdAt || chat.updatedAt, 
    
    unreadCount: 0, 
    rawParticipants: chat.participants, // Keep the raw data around just in case
  };
};