export type SelectedChat = {
    id: string;
    name: string;
    avatar: string;
    isOnline: boolean;
    isGroup?: boolean;
    groupAvatars?: string[]; // array of avatar URLs for stacked group preview
    lastMessage?: string;
    lastSender?: string;     // "Azan: " prefix shown in group chats
    time?: string;
    unreadCount?: number;
};



export type Props = {
  selectedChat?: SelectedChat | null;
  onSelectChat?: (chat: SelectedChat) => void;
  isSidebarOpen? : boolean,
  setIsSidebarOpen? : (value : boolean) => void,
  isProfileOpen? : boolean,
  setIsProfileOpen? : (value : boolean) => void,
  onLogout?: () => void;
};