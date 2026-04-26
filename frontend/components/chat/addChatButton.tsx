"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "../ui/dialog";
import { Switch } from "../ui/switch";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  useComboboxAnchor,
} from "@/components/ui/combobox";
import { X, Users, Camera } from "lucide-react";

const AddChatButton = () => {
  const [isGroupChat, setIsGroupChat] = useState<boolean>(false);
  const [isOpen, setIsOpen] = useState<boolean>(false);

  // group avatar upload
  const [groupAvatar, setGroupAvatar] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // group-chat: multiple users
  const [participants, setParticipants] = useState<
    { _id: string; username: string, avatar:string  }[]
  >([]);



  const [searchResults, setSearchResults] = useState<{ _id: string; username: string; avatar: string }[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");


   const skipNextFetch = useRef(false)
  const anchor = useComboboxAnchor();

  // ── Debounce typing ──
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // ── Fetch users ──
  useEffect(() => {
    if (!debouncedQuery) {
      setSearchResults([]);
      return;
    }

    if(skipNextFetch.current){
      skipNextFetch.current = false
      console.log("Skipping fetch")
      return
    }

    const fetchUsers = async () => {
      try {
        const res = await fetch(`/api/v1/users/search?query=${debouncedQuery}`);
        const data = await res.json();

        console.log("RESPONSE" , data)

        
        if (data.success && data.data) {
          setSearchResults(data.data);
        }
      } catch (error) {
        console.error("Search failed:", error);
      }
    };
    fetchUsers();
  }, [debouncedQuery]);




  //** only for group chat  started*/
  // ids that are already selected (so we can grey them out / skip adding twice)
  const selectedIds = new Set(participants.map((p) => p._id));

  const addParticipant = (user: { _id: string; username: string; avatar: string }) => {
    if (!selectedIds.has(user._id)) {
      setParticipants((prev) => [...prev, user]);
    }
  };

  const removeParticipant = (id: string) => {
    setParticipants((prev) => prev.filter((p) => p._id !== id)); 
  };

  // Handle group avatar file selection
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setGroupAvatar(url);
    }
  }; 

    // Switch between modes clears selections
  const handleGroupToggle = (value: boolean) => {
    setIsGroupChat(value);
    setParticipants([]);
    setGroupAvatar(null);
  };
    //** only for group chat  ends*/


    
  // Reset everything when dialog closes
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setIsGroupChat(false);
      setParticipants([]);
      setGroupAvatar(null);
    }
  };



  return (
    <>
      <Dialog modal={false} open={isOpen} onOpenChange={handleOpenChange}>
        
        <DialogTrigger asChild>
          <Button variant={"chat-primary"} size={"none"}>
            + Add Chat
          </Button>
        </DialogTrigger>

        <DialogContent className="sm:max-w-[40rem]">
          <DialogHeader>
            <DialogTitle className="text-xl">Create Chat</DialogTitle>
            <DialogDescription className="text-lg">
              Create chats with your friends or groups
            </DialogDescription>
          </DialogHeader>

          {/* ── Group-chat toggle ── */}
          <div className="flex items-center gap-3">
            <Switch
              id="group-chat"
              onCheckedChange={handleGroupToggle}
              checked={isGroupChat}
              className="cursor-pointer"
            />
            <label className="text-lg cursor-pointer" htmlFor="group-chat">
              Group Chat
            </label>
          </div>

          {/* ── Group avatar upload + group name (only when group) ── */}
          {isGroupChat && (
            <div className="flex items-center gap-4 animate-in fade-in slide-in-from-top-4 duration-300 ease-out">
              {/* Clickable avatar circle */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />      
              {/* When user clicks this pretty circle → it calls fileInputRef.current?.click() → which programmatically clicks the hidden <input type="file"> → native file picker opens. */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="relative w-16 h-16 shrink-0 rounded-full border-2 border-dashed border-gray-500 hover:border-[#6c75f5] bg-gray-300/10 hover:bg-[#6c75f5]/10 flex items-center justify-center cursor-pointer transition-all group/avatar overflow-hidden"
              >
                {groupAvatar ? (
                  <Image
                    src={groupAvatar}
                    alt="Group avatar"
                    fill
                    className="object-cover rounded-full"
                  />
                ) : (
                  <Camera size={24} className="text-gray-400 group-hover/avatar:text-[#6c75f5] transition-colors" />
                )}
              </button>

              {/* Group name input */}
              <input
                type="text"
                className="flex-1 h-14 pl-4 pr-2 py-3 focus:outline-none border-2 bg-gray-300/15 border-gray-500 rounded-xl placeholder:text-white/60 placeholder:text-lg text-lg"
                placeholder="Enter group name…"
              />
            </div>
          )}

          {/* ── Combobox Search ── */}
          <div ref={anchor} className="w-full">

            <Combobox items={searchResults.map((u) => u.username)}>  {/*// got all user name ["azan", "john", "alex", "sarah"]*/}
              <ComboboxInput
                value={searchQuery}
                onChange={(e: any) => (
                  setSearchQuery(e.target.value)
                )}
                className="w-full h-14 pl-4 pr-2 py-3 bg-gray-300/15 focus:outline-none border-2 border-gray-500 rounded-xl [&_input]:text-lg [&_input]:md:text-lg [&_input]:placeholder:text-lg [&_input]:placeholder:text-white/60"
                placeholder={
                  isGroupChat
                    ? "Search and add participants…"
                    : "Search or select a user…"
                }
              />

              <ComboboxContent anchor={anchor}>
                <ComboboxEmpty>{searchQuery ? "No users found." : "Type to search..."}</ComboboxEmpty>

                {/* this comboboxlist component will iterate over each item pass inside the items props */}
                <ComboboxList>

                  {(item) => {
                    const user = searchResults.find((u) => u.username === item);
                    if (!user) return null;
                    
                    const alreadyAdded = selectedIds.has(user._id);

                    return (
                      <ComboboxItem
                        key={user._id}
                        value={item}
                        className={`text-lg py-2  ${alreadyAdded ? "opacity-40 pointer-events-none" : ""}`}
                        onClick={() => {
                          if (isGroupChat) {
                            addParticipant(user);
                            setSearchQuery("")
                          }else{
                              skipNextFetch.current = true
                              setSearchQuery(user.username)
                          }


                        }}
                      >
                        <span className="flex items-center gap-2">
                          <Image src={user.avatar} width={28} height={28} alt="avatar" className="rounded-full object-cover w-7 h-7" />
                          {user.username}
                          {alreadyAdded && (
                            <span className="ml-auto text-xs text-gray-400">
                              added
                            </span>
                          )}
                        </span>
                      </ComboboxItem>
                    );

                  }}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
          </div>



          {/* ── Group-chat: participant chips ── */}
          {isGroupChat && participants.length > 0 && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
              {/* section label */}
              <div className="flex items-center gap-2 mb-3">
                <Users size={16} className="text-gray-400" />
                <span className="text-sm font-semibold text-gray-300">
                  Selected participants
                </span>
                <span className="ml-auto text-xs text-gray-400 bg-gray-300/10 px-2 py-0.5 rounded-full">
                  {participants.length}
                </span>
              </div>

              {/* chips row — scrollable if too many */}
              <div className="flex flex-wrap gap-2 max-h-[100px] overflow-y-auto pr-1 scrollbar-thin">
                {participants.map((p) => (
                  <ParticipantChip
                    key={p._id}
                    name={p.username}
                    onRemove={() => removeParticipant(p._id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* ── Action buttons ── */}
          <DialogClose className="flex justify-center items-center my-2 gap-x-3">
            <Button
              variant={"chat-secondary"}
              size={"none"}
              className="w-[50%] ml-0 text-lg"
            >
              Close
            </Button>
            <Button
              variant={"chat-primary"}
              size={"none"}
              className="w-[50%] ml-0 text-lg"
            >
              Create
            </Button>
          </DialogClose>
        </DialogContent>
      </Dialog>

      {isOpen && (
        <div className="fixed top-0 h-screen w-full z-40 bg-black/10 backdrop-blur-sm pointer-events-none" />
      )}
    </>
  );
};

export default AddChatButton ;





function ParticipantChip({
  name,
  onRemove,
}: {
  name: string;
  onRemove: () => void;
}) {
  const initials = name.slice(0, 2).toUpperCase();
  return (
    <div className="flex items-center gap-2 bg-gray-300/15 border border-gray-500/60 rounded-full pl-1 pr-2 py-1 animate-in fade-in zoom-in-95 duration-200">
      {/* avatar */}
      <div className="w-8 h-8 rounded-full bg-[#6c75f5]/80 flex items-center  justify-center text-xs font-bold text-white shrink-0">
        {initials}
      </div>

      <span className="text-sm font-medium text-white">{name}</span>
      <button
        onClick={onRemove}
        className="ml-0.5 w-5 h-5 rounded-full bg-gray-500/50 hover:bg-red-500/70 flex items-center justify-center transition-colors shrink-0"
        aria-label={`Remove ${name}`}
      >
        <X size={11} strokeWidth={3} />
      </button>
    </div>
  );
}