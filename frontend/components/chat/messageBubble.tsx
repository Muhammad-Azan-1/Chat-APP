"use client";

import Image from "next/image";
import { Trash2 } from "lucide-react";
import { Message } from "@/types/chat.types";
import { useState } from "react";
import ImageModal from "./imageModal";

interface MessageBubbleProps {
  message: Message;
  onDelete?: (messageId: string) => void;
}

const MessageBubble = ({ message, onDelete }: MessageBubbleProps) => {
  const isOwn = message.isOwnMessage;
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  return (
    <div className={`flex gap-3 mb-4 ${isOwn ? "flex-row-reverse" : "flex-row"}`}>
      {/* Avatar */}
      <div className="shrink-0">
        <Image
          src={message.senderAvatar}
          alt={message.senderName}
          width={40}
          height={40}
          className="w-10 h-10 rounded-full object-cover border border-gray-600/30"
        />
      </div>

      {/* Message content */}
      <div className={`flex flex-col max-w-[70%] ${isOwn ? "items-end" : "items-start"}`}>
        {/* Sender name (only show for other users) */}
        {!isOwn && (
          <span className="text-xs text-gray-400 mb-1 px-1">{message.senderName}</span>
        )}

        {/* Message bubble */}
        <div
          className={`relative group px-4 py-2.5 rounded-2xl ${
            isOwn
              ? "bg-[#6c75f5] text-white rounded-tr-sm"
              : "bg-white/10 text-white rounded-tl-sm"
          }`}
        >
          {/* Message text */}
          {message.content && (
            <p className="text-[15px] leading-relaxed break-words">{message.content}</p>
          )}

          {/* Attachments */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="mt-2 space-y-2">
              {message.attachments.map((attachment, index) => (
                <div
                  key={index}
                  className="relative cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => setSelectedImage(attachment.url)}
                >
                  <Image
                    src={attachment.url}
                    alt="Attachment"
                    width={300}
                    height={200}
                    className="rounded-lg max-w-full h-auto"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Delete button (only for own messages) */}
          {isOwn && onDelete && (
            <button
              onClick={() => onDelete(message.id)}
              className="absolute -left-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 bg-red-500/20 hover:bg-red-500/30 rounded-lg"
              title="Delete message"
            >
              <Trash2 size={14} className="text-red-400" />
            </button>
          )}
        </div>

        {/* Timestamp */}
        <span className="text-[11px] text-gray-500 mt-1 px-1">
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <ImageModal imageUrl={selectedImage} onClose={() => setSelectedImage(null)} />
      )}
    </div>
  );
};

export default MessageBubble;
