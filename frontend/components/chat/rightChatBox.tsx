"use client";

import Image from "next/image";
import { Button } from "../ui/button";
import { Paperclip, SendHorizontal, MoreVertical, Phone, Video } from "lucide-react";
import type { Props } from "@/types/chat.types";
import NoChatSelected from "./noSelectedChat";

// ── Main component ────────────────────────────────────────────────────────────
const RightChatBox = ({ selectedChat, onLogout }: Props) => {
  return (
    <div className="w-full h-screen flex flex-col bg-[#12141D] backdrop-blur-3xl relative">
      {/* Optional subtle gradient background effect */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#6c75f5]/10 rounded-full blur-[120px] pointer-events-none" />

      {selectedChat ? (
        <>
          {/* ── Header ── */}
          <div className="w-full min-h-[88px] border-b border-gray-600/30 flex justify-between items-center px-6 shrink-0 bg-[#1e2029]/60 backdrop-blur-md z-10">
            <div className="flex justify-start h-full items-center gap-x-4 cursor-pointer hover:opacity-80 transition-opacity">
              <div className="relative">
                <Image
                  src={selectedChat.avatar}
                  alt="Profile picture"
                  width={100}
                  height={100}
                  className="w-[50px] h-[50px] rounded-full object-cover border border-[#6c75f5]/30 shadow-md"
                />
                {selectedChat.isOnline && (
                  <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-[#1e2029] rounded-full" />
                )}
              </div>
              
              <div className="flex flex-col">
                <h1 className="text-lg font-semibold text-white tracking-wide">{selectedChat.name}</h1>
                <p className={`text-xs font-medium ${selectedChat.isOnline ? "text-green-400" : "text-gray-400"}`}>
                  {selectedChat.isOnline ? "Online" : "Offline"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
              <button className="p-2.5 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl transition-all shadow-sm">
                <Phone size={18} />
              </button>
              <button className="p-2.5 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl transition-all shadow-sm">
                <Video size={18} />
              </button>
              <div className="w-px h-6 bg-gray-600/50 mx-1 hidden sm:block" />
              <button className="p-2.5 hover:bg-white/10 text-gray-400 rounded-xl transition-colors">
                <MoreVertical size={20} />
              </button>
            </div>
          </div>

          {/* ── Messages area (grows to fill space) ── */}
          <div className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar z-10 flex flex-col justify-end">
            {/* Example empty state/mock messages */}
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-60">
               <div className="w-24 h-24 bg-[#6c75f5]/10 rounded-full flex items-center justify-center">
                 <Image src={selectedChat.avatar} width={60} height={60} alt="" className="rounded-full opacity-50" />
               </div>
               <p className="text-gray-400">This is the start of your conversation with <span className="font-semibold text-white">{selectedChat.name}</span></p>
            </div>
          </div>

          {/* ── Message input bar ── */}
          <div className="w-full border-t border-gray-600/30 py-4 px-6 shrink-0 bg-[#1e2029]/80 backdrop-blur-xl z-10">
            <div className="flex items-center gap-3">
              <button className="text-gray-400 cursor-pointer hover:bg-white/10 hover:text-white transition-all shrink-0 p-3 rounded-full">
                <Paperclip size={22} className="rotate-45" />
              </button>

              <div className="flex-1 relative border border-gray-500/40 rounded-2xl bg-white/5 focus-within:bg-white/10 focus-within:border-[#6c75f5]/50 transition-all shadow-inner">
                <input
                  type="text"
                  placeholder="Type a message…"
                  className="w-full bg-transparent px-5 py-3.5 text-[15px] text-white placeholder:text-gray-500 focus:outline-none"
                />
              </div>

              <button className="bg-[#6c75f5] hover:bg-[#5a63eb] text-white cursor-pointer transition-all shadow-lg shadow-[#6c75f5]/20 shrink-0 p-3.5 rounded-full flex items-center justify-center">
                <SendHorizontal size={20} className="ml-0.5" />
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="w-full h-full z-10 flex items-center justify-center">
          <NoChatSelected />
        </div>
      )}
    </div>
  );
};

export default RightChatBox;