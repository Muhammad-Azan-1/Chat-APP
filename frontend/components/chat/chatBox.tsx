"use client"
import React from 'react'
import { useState } from 'react'
import LeftChatBox from './leftChatBox'
import RightChatBox from './rightChatBox'
import SideBar from './sidebar'
import ProfileSidebar from './profileSidebar'
import type { SelectedChat } from "@/types/chat.types";

const ChatBox = () => {
  const [selectedChat, setSelectedChat] = useState<SelectedChat | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  

  return (
    <div className="w-full h-screen grid grid-cols-[380px_1fr] sm:grid-cols-[450px_1fr] bg-linear-to-br from-[#12141d] to-[#1e2029] text-white overflow-hidden">
      <LeftChatBox 
        isSidebarOpen={isSidebarOpen} 
        setIsSidebarOpen={setIsSidebarOpen} 
        selectedChat={selectedChat} 
        onSelectChat={setSelectedChat}
        isProfileOpen={isProfileOpen}
        setIsProfileOpen={setIsProfileOpen}
      />
      
      <RightChatBox  
        selectedChat={selectedChat} 
      />
      
      {/* Sheet sidebar — controlled by isSidebarOpen state */}
      <SideBar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} selectedChat={selectedChat} />
       
      {/* Sheet profile — controlled by isProfileOpen state */}
      <ProfileSidebar isProfileOpen={isProfileOpen} setIsProfileOpen={setIsProfileOpen} />
    </div>
  );
};

export default ChatBox;