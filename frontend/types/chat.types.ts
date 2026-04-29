// types/chat.types.ts

// ─── 1. RAW BACKEND TYPES ──────────────────────────────────────────────────

export interface BackendParticipant {
  _id: string;
  username: string;
  avatar: string;
  email: string;
  roles : string;
  createdAt : string;
  updatedAt : string
}

export interface BackendAttachment {
  url: string;
  localPath: string;
  _id?: string;
}
export interface BackendLastMessage {
_id: string;
  message: string;
  sender: BackendParticipant;
  attachements: BackendAttachment[]; 
  chat: string; 
  createdAt: string;
  updatedAt: string;
}



export interface BackendChatPayload {
  _id: string;
  name?: string; // Usually used for Group Chats
  isGroupChat: boolean;
  groupAvatar : string ;
  groupName : string;
  participants: BackendParticipant[];
  admins : BackendChatPayload[]
  lastMessage?: BackendLastMessage;
  chatCreatedBy: string;
  createdAt: string;
  updatedAt: string;
}



// ─── 2. FRONTEND UI TYPES (Slightly Refined) ──────────────────────────────

export type SelectedChat = {
  id: string;
  name: string;
  avatar: string;
  isOnline: boolean;
  email : string;
  isGroup: boolean;
  groupAvatar?: string | string[]; // Made this an array based on your mock data usage
  lastMessage?: string;
  lastSender?: string;     
  time?: string;
  unreadCount?: number;
  rawParticipants?: BackendParticipant[]; // Helpful to keep around for future logic
};

export interface ChatState {
  chats: SelectedChat[];
}

export type Props = {
  selectedChat?: SelectedChat | null;
  onSelectChat?: (chat: SelectedChat) => void;
  isSidebarOpen?: boolean;
  setIsSidebarOpen?: (value: boolean) => void;
  isProfileOpen?: boolean;
  setIsProfileOpen?: (value: boolean) => void;
  onLogout?: () => void;
};