import React from "react";
import Image from "next/image";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Users, Pencil, UserPlus, Trash2 } from "lucide-react";
import type { Props } from "@/types/chat.types";

const MOCK_PARTICIPANTS = [
  {
    id: 1,
    name: "serenity74",
    email: "rosanna_ratke@yahoo.com",
    avatar: "/images/test.png",
    role: "member",
  },
  {
    id: 2,
    name: "one",
    email: "one@one.com",
    avatar: "/images/test.png",
    role: "admin",
  },
  {
    id: 3,
    name: "two",
    email: "two@two.com",
    avatar: "/images/test.png",
    role: "member",
  },
];

const SideBar = ({ isSidebarOpen, setIsSidebarOpen, selectedChat }: Props) => {
  if (!selectedChat) return null;

  const isGroup = selectedChat.isGroup;

  return (
    <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
      <SheetContent
        side="right"
        className="w-[400px] sm:w-[450px] bg-[#1e2029] border-l-gray-600/50 p-6 flex flex-col overflow-y-auto"
      >
        <SheetTitle className="sr-only">Chat Details</SheetTitle>
        <SheetDescription className="sr-only">
          View and manage the details of this chat.
        </SheetDescription>

        {/* Header Avatar */}
        <div className="flex flex-col items-center mt-8 cursor-pointer">
          {isGroup ? (
            <div className="relative w-[150px] h-[150px] group">
              <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity z-20">
                <span className="text-white text-sm font-medium">CHANGE</span>
              </div>
              <Image
                src={selectedChat.groupAvatars?.[0] || "/images/test.png"}
                alt="Member 1"
                width={200}
                height={200}
                className="absolute top-0 right-0 rounded-full w-[105px] h-[105px] object-cover border-4 border-[#1e2029]"
              />
              <Image
                src={selectedChat.groupAvatars?.[1] || "/images/test.png"}
                alt="Member 2"
                width={200}
                height={200}
                className="absolute bottom-0 left-0 rounded-full w-[105px] h-[105px] object-cover border-4 border-[#1e2029] z-10"
              />
            </div>
          ) : (
            <div className="relative w-[150px] h-[150px] group rounded-full overflow-hidden border-4 border-gray-600/30">
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity z-20">
                <span className="text-white text-sm font-medium">VIEW</span>
              </div>
              <Image
                src={selectedChat.avatar || "/images/test.png"}
                alt={selectedChat.name}
                fill
                className="object-cover"
              />
            </div>
          )}

          {/* Chat Name */}
          <div className="flex items-center gap-2 mt-6">
            <h2 className="text-2xl font-semibold text-white">
              {selectedChat.name}
            </h2>
            {isGroup && (
              <button className="p-1 hover:bg-gray-500/20 rounded-md transition-colors text-gray-300">
                <Pencil size={18} />
              </button>
            )}
          </div>
          
          {/* Subtitle */}
          {isGroup ? (
            <p className="text-gray-400 text-sm mt-1">
              Group · {MOCK_PARTICIPANTS.length} participants
            </p>
          ) : (
            <p className="text-gray-400 text-sm mt-1 block max-w-full truncate px-4">
              {selectedChat.name.toLowerCase().replace(/\s/g, "")}@example.com
            </p>
          )}
        </div>

        {/* Divider */}
        <div className="h-[1px] w-full bg-gray-500/30 mt-8 mb-6" />

        {isGroup ? (
          /* GROUP LAYOUT */
          <div className="flex flex-col flex-1">
            <div className="flex items-center gap-2 mb-4">
              <Users size={18} className="text-gray-300" />
              <span className="text-white font-medium">
                {MOCK_PARTICIPANTS.length} Participants
              </span>
            </div>

            <div className="flex flex-col flex-1 overflow-y-auto mb-6 pr-2 space-y-2">
              {MOCK_PARTICIPANTS.map((participant) => (
                <div
                  key={participant.id}
                  className="flex items-center gap-3 w-full group/p hover:bg-white/5 p-2 rounded-xl transition-colors cursor-pointer"
                >
                  <Image
                    src={participant.avatar}
                    alt={participant.name}
                    width={48}
                    height={48}
                    className="w-[48px] h-[48px] rounded-full object-cover shrink-0 border border-gray-600/50"
                  />
                  <div className="flex flex-col flex-1 overflow-hidden">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium truncate">
                        {participant.name}
                      </span>
                      {participant.role === "admin" && (
                        <span className="text-[10px] uppercase tracking-wider bg-[#2a3c30] text-[#4caf50] px-2 py-0.5 rounded-full font-bold border border-[#4caf50]/20">
                          admin
                        </span>
                      )}
                    </div>
                    <span className="text-gray-400 text-sm truncate">
                      {participant.email}
                    </span>
                  </div>
                  <button className="bg-red-500/10 text-red-500 hover:bg-red-500 text-sm hover:text-white px-4 py-1.5 rounded-full transition-all opacity-100 sm:opacity-0 sm:group-hover/p:opacity-100">
                    Remove
                  </button>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-3 mt-auto shrink-0 pb-4">
              <button className="w-full flex items-center justify-center gap-2 bg-[#5d68eb] hover:bg-[#525de0] text-white py-3.5 rounded-2xl font-medium transition-colors">
                <UserPlus size={18} />
                Add participant
              </button>
              <button className="w-full flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white py-3.5 rounded-2xl font-medium transition-colors">
                <Trash2 size={18} />
                Delete group
              </button>
            </div>
          </div>
        ) : (
          /* SINGLE USER LAYOUT */
          <div className="flex flex-col flex-1">
            <h3 className="text-gray-400 font-medium mb-4 uppercase text-xs tracking-wider">
              About
            </h3>
            <div className="bg-white/5 rounded-2xl p-4 border border-white/5 mb-6">
              <p className="text-white text-[15px] leading-relaxed">
                Hey there! I am using this amazing chat application. Connect with me! 🎉
              </p>
              <p className="text-gray-500 text-xs mt-3 text-right">
                Updated yesterday
              </p>
            </div>
            
            <div className="flex flex-col gap-3 mt-auto shrink-0 pb-4">
               <button className="w-full flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white py-3.5 rounded-2xl font-medium transition-colors">
                <Trash2 size={18} />
                Delete chat
              </button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default SideBar;