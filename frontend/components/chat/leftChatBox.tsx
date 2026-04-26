"use client";

import AddChatButton from "./addChatButton";
import { MoreVertical, User } from "lucide-react";
import type { SelectedChat , Props } from "@/types/chat.types";
import GroupAvatar from "./groupAvatar";
import SingleAvatar from "./singleAvatar";
import { Popover , PopoverContent , PopoverTrigger } from "../ui/popover";
import Image from "next/image";
import type { LoggedInUser } from "@/types/auth.types";
import { useSelector } from "react-redux";
import LogoutDialog from "@/components/auth/shared/LogoutDialog";

// ── mock chat list ─────────────────────────────────────────────────────────
const MOCK_CHATS: SelectedChat[] = [
  {
    id: "1",
    name: "User Name",
    avatar: "/images/test.png",
    isOnline: true,
    isGroup: false,
    lastMessage: "no message yet",
    time: "a few seconds",
    unreadCount: 3,
  },
  {
    id: "2",
    name: "Developers Group",
    avatar: "/images/test.png",
    isOnline: false,
    isGroup: true,
    groupAvatars: ["/images/test.png", "/images/test.png"],
    lastMessage: "Hey guys, checking out the new chat UI!",
    lastSender: "Azan",
    time: "12:30 PM",
    unreadCount: 3,
  },
];

const LeftChatBox = ({ selectedChat, onSelectChat , setIsSidebarOpen, setIsProfileOpen }: Props) => {

  const {details , isAuthenticated} : LoggedInUser = useSelector((items : {auth : LoggedInUser}) => items?.auth)
  return (
    <div className="w-full h-screen border-r border-gray-600/30 flex flex-col bg-white/5 backdrop-blur-xl shadow-2xl">


      {/* ── Logged-In User Header ── */}
      <div className="w-full py-4 px-6 flex justify-between items-center border-b border-gray-500/30 shrink-0 bg-[#1e2029]/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Image
            src={details ? details?.avatar : ""}
            alt={details?.username || "USER"}
            width={48}
            height={48}
            className="w-[45px] h-[45px] rounded-full object-cover border border-[#6c75f5]/50 shadow-[0_0_10px_rgba(108,117,245,0.2)]"
          />
          <div className="hidden sm:block">
            <h2 className="text-white font-medium">{details?.username}</h2>
          </div>
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <button className="p-2 hover:bg-gray-500/20 rounded-full transition-colors text-gray-300 pointer-events-auto">
              <MoreVertical className="cursor-pointer" size={20} />
            </button>
          </PopoverTrigger>

          <PopoverContent side="bottom" align="end" className="w-48 bg-[#1e2029] border border-gray-600/50 p-1 shadow-xl rounded-xl">
             <button
               onClick={() => setIsProfileOpen?.(true)}
               className="w-full cursor-pointer flex items-center gap-3 text-left px-3 py-2.5 hover:bg-white/5 rounded-lg text-sm text-gray-200 transition-colors"
             >
               <User size={16} /> My Profile
             </button>
             
             <div className="h-px w-full bg-gray-600/50 my-1" />
             <LogoutDialog
               trigger={
                 <button className="w-full cursor-pointer flex items-center gap-3 text-left px-3 py-2.5 hover:bg-red-500/10 text-red-400 rounded-lg text-sm transition-colors">
                   Logout
                 </button>
               }
             />
          </PopoverContent>

        </Popover>
      </div>


      {/* Search + add */}
      <div className="w-full py-4 px-4 flex gap-3 items-center shrink-0">
        <input
          type="text"
          placeholder="Search user or group"
          className="flex-1 text-[15px] bg-black/20 placeholder:text-gray-500 h-12 pl-4 pr-3 py-3 focus:outline-none focus:ring-1 focus:ring-[#6c75f5] border border-gray-600/30 rounded-2xl transition-all"
        />
        <AddChatButton />
      </div>

      {/* Chat list */}
      <div className="flex-1 overflow-y-auto px-4 mt-2 pb-4 space-y-3 custom-scrollbar">
        {MOCK_CHATS.map((chat) => {
          const isActive = selectedChat?.id === chat.id;

          return (
            <div
              key={chat.id}
              onClick={() => onSelectChat && onSelectChat(chat)}
              className={`group relative flex items-center cursor-pointer w-full min-h-[85px] rounded-2xl overflow-hidden transition-all duration-300
                ${isActive
                  ? "bg-linear-to-r from-[#6c75f5]/20 to-[#6c75f5]/5 border border-[#6c75f5]/30 shadow-lg"
                  : "bg-transparent border border-transparent hover:bg-white/5 hover:border-white/10"
                }`}
             >
              {/* MoreVertical hover icon */}
              <div className="flex items-center w-full h-full pl-3 sm:pl-4 group-hover:pl-10 transition-all duration-300 relative">
                <div className="absolute left-2 sm:left-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <Popover>
                     <PopoverTrigger asChild>
                       <button
                         onClick={(e) => e.stopPropagation()}
                         className="cursor-pointer p-1.5 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white"
                       >
                         <MoreVertical  size={18} />
                       </button>
                     </PopoverTrigger>

                     <PopoverContent side="right" className="w-48 bg-[#1e2029] border border-gray-600/50 p-1 shadow-xl rounded-xl">
                        <button onClick={(e) => { 
                          e.stopPropagation();
                          if (onSelectChat) onSelectChat(chat);
                          if (setIsSidebarOpen) setIsSidebarOpen(true);
                        }} className="w-full cursor-pointer text-left px-3 py-2.5 hover:bg-white/5 text-gray-200 rounded-lg text-sm transition-colors">
                          View details
                        </button>
                     </PopoverContent>
                  </Popover>
                </div>

                <div className={`w-full h-full flex items-center py-3 ${chat.isGroup ? "gap-x-4" : "gap-x-3"}`}>
                  {/* Avatar — single or stacked group */}
                  <div className="relative shrink-0">
                    {chat.isGroup && chat.groupAvatars?.length
                      ? <GroupAvatar avatars={chat.groupAvatars} />
                      : <SingleAvatar src={chat.avatar} alt={chat.name} />
                    }
                    {chat.isOnline && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-[#1e2029] rounded-full" />
                    )}
                  </div>

                  {/* Name + last message */}
                  <div className="flex flex-col flex-1 pr-14 sm:pr-16 overflow-hidden">
                    <h1 className="text-[16px] font-semibold text-gray-100 truncate">{chat.name}</h1>
                    <p className="text-[13px] text-gray-400 truncate w-full">
                      {chat.isGroup && chat.lastSender && (
                        <span className="text-[#6c75f5] font-medium">{chat.lastSender}: </span>
                      )}
                      {chat.lastMessage ?? "no message yet"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Time + unread badge */}
              <div className="absolute top-1/2 -translate-y-1/2 right-3 sm:right-4 flex flex-col items-end gap-y-1.5">
                <p className={`text-[11px] ${chat.unreadCount ? "text-[#6c75f5] font-medium" : "text-gray-500"}`}>{chat.time}</p>
                {chat.unreadCount && (
                  <div className="bg-[#6c75f5] text-white text-[10px] font-bold px-1.5 py-0.5 min-w-[20px] text-center rounded-full shadow-[0_0_8px_rgba(108,117,245,0.4)]">
                    {chat.unreadCount}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default LeftChatBox;
