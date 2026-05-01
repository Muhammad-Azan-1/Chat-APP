"use client";

import { useEffect } from "react";
import Image from "next/image";
import { Button } from "../ui/button";
import { MoreVertical, Phone, Video } from "lucide-react";
import type { Props } from "@/types/chat.types";
import NoChatSelected from "./noSelectedChat";
import MessageList from "./messageList";
import MessageInput from "./messageInput";
import TypingIndicator from "./typingIndicator";
import { useMessages } from "@/hooks/useMessages";
import { useDispatch, useSelector } from "react-redux";
import { emitJoinChat } from "@/lib/socketEmit";

// ── Main component ────────────────────────────────────────────────────────────
const RightChatBox = ({ selectedChat, onLogout }: Props) => {
  // console.log("🎯 RightChatBox render - selectedChat:", selectedChat);

  const dispatch = useDispatch();

  // Get typing status for current chat
  const isOtherUserTyping = useSelector((state: any) =>
    selectedChat?.id ? state.chat.typingUsers[selectedChat.id] : false
  );

  const {
    messages,
    loading,
    error,
    loadMessages,
    sendMessage,
    deleteMessage,
  } = useMessages(selectedChat?.id || "");

  // Load messages when chat is selected
  useEffect(() => {
    if (selectedChat?.id) {
      loadMessages();

      // Set this chat as currently selected in Redux
      dispatch({ type: "chat/SET_SELECTED_CHAT", payload: selectedChat.id });

      // Reset unread count when opening this chat
      dispatch({ type: "chat/RESET_UNREAD_COUNT", payload: selectedChat.id });

      // Emit joinChat event to join this chat room
      emitJoinChat(selectedChat.id);
    } else {
      // Clear selected chat when none is selected
      dispatch({ type: "chat/SET_SELECTED_CHAT", payload: null });
    }
  }, [selectedChat?.id, loadMessages, dispatch]);

  const handleSendMessage = async (content: string, attachments: File[]) => {
    await sendMessage(content, attachments);
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (confirm("Are you sure you want to delete this message?")) {
      await deleteMessage(messageId);
    }
  };


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
          <div className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar z-10">
            {loading && messages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-gray-400">Loading messages...</div>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-red-400">Error: {error}</div>
              </div>
            ) : (
              <MessageList
                messages={messages}
                chatAvatar={selectedChat.avatar}
                chatName={selectedChat.name}
                onDeleteMessage={handleDeleteMessage}
              />
            )}
          </div>

          {/* ── Typing indicator ── */}
          {isOtherUserTyping && <TypingIndicator />}

          {/* ── Message input bar ── */}
          <MessageInput
            onSendMessage={handleSendMessage}
            disabled={loading}
            chatId={selectedChat.id}
          />
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
