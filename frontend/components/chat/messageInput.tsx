"use client";

import { useState, useRef, ChangeEvent, KeyboardEvent, useEffect } from "react";
import { Paperclip, SendHorizontal, X } from "lucide-react";
import { emitTyping, emitStopTyping } from "@/lib/socketEmit";

interface MessageInputProps {
  onSendMessage: (content: string, attachments: File[]) => Promise<void>;
  disabled?: boolean;
  chatId?: string;
}

const MessageInput = ({ onSendMessage, disabled, chatId }: MessageInputProps) => {
  const [message, setMessage] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Handle typing indicator
  useEffect(() => {
    if (!chatId) return;

    if (message.trim().length > 0 && !isTyping) {
      // User started typing
      setIsTyping(true);
      emitTyping(chatId);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to emit stopTyping after 2 seconds of inactivity
    if (message.trim().length > 0) {
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        emitStopTyping(chatId);
      }, 2000);
    } else if (isTyping) {
      // User cleared the input
      setIsTyping(false);
      emitStopTyping(chatId);
    }

    // Cleanup on unmount
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [message, chatId, isTyping]);

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachments((prev) => [...prev, ...files]);
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSend = async () => {
    if ((!message.trim() && attachments.length === 0) || isSending || disabled) {
      return;
    }

    try {
      setIsSending(true);

      // Stop typing indicator before sending
      if (isTyping && chatId) {
        setIsTyping(false);
        emitStopTyping(chatId);
      }

      await onSendMessage(message.trim(), attachments);
      setMessage("");
      setAttachments([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      // console.error("Failed to send message:", error);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="w-full border-t border-gray-600/30 py-4 px-6 shrink-0 bg-[#1e2029]/80 backdrop-blur-xl z-10">
      {/* Attachment preview */}
      {attachments.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {attachments.map((file, index) => (
            <div
              key={index}
              className="relative bg-white/10 rounded-lg px-3 py-2 flex items-center gap-2 text-sm"
            >
              <span className="text-gray-300 truncate max-w-[150px]">
                {file.name}
              </span>
              <button
                onClick={() => removeAttachment(index)}
                className="text-gray-400 hover:text-red-400 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-3">
        {/* Attachment button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || isSending}
          className="text-gray-400 cursor-pointer hover:bg-white/10 hover:text-white transition-all shrink-0 p-3 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Paperclip size={22} className="rotate-45" />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          accept="image/*,video/*,application/pdf"
        />

        {/* Message input */}
        <div className="flex-1 relative border border-gray-500/40 rounded-2xl bg-white/5 focus-within:bg-white/10 focus-within:border-[#6c75f5]/50 transition-all shadow-inner">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled || isSending}
            placeholder="Type a message…"
            className="w-full bg-transparent px-5 py-3.5 text-[15px] text-white placeholder:text-gray-500 focus:outline-none disabled:opacity-50"
          />
        </div>

        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={disabled || isSending || (!message.trim() && attachments.length === 0)}
          className="bg-[#6c75f5] hover:bg-[#5a63eb] text-white cursor-pointer transition-all shadow-lg shadow-[#6c75f5]/20 shrink-0 p-3.5 rounded-full flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <SendHorizontal size={20} className="ml-0.5" />
        </button>
      </div>
    </div>
  );
};

export default MessageInput;
