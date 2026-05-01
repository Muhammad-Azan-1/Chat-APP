"use client";

import { useEffect, useRef } from "react";
import MessageBubble from "./messageBubble";
import { Message } from "@/types/chat.types";
import Image from "next/image";

interface MessageListProps {
  messages: Message[];
  chatAvatar: string;
  chatName: string;
  onDeleteMessage?: (messageId: string) => void;
}

const MessageList = ({
  messages,
  chatAvatar,
  chatName,
  onDeleteMessage,
}: MessageListProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // console.log("Messsage length" , messages.length)

  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-60">
        <div className="w-24 h-24 bg-[#6c75f5]/10 rounded-full flex items-center justify-center">
          <Image
            src={chatAvatar}
            width={60}
            height={60}
            alt=""
            className="rounded-full opacity-50"
          />
        </div>
        <p className="text-gray-400">
          This is the start of your conversation with{" "}
          <span className="font-semibold text-white">{chatName}</span>
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {Array.isArray(messages) && messages.length > 0 && messages.map((message) => (
        <MessageBubble
          key={message.id}
          message={message}
          onDelete={onDeleteMessage}
        />
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;
