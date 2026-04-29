import { customFetch } from "@/lib/customFetch";
import { useSelector } from "react-redux";
import React, { useState } from "react";
import Image from "next/image";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { User, Mail, Save, LogOut } from "lucide-react";
import { LoggedInUser } from "@/types/auth.types";
import LogoutDialog from "@/components/auth/shared/LogoutDialog";
import { LOGIN_USER_ACTION } from "@/redux/actions/authAction";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/redux/store/store";

type ProfileSidebarProps = {
  isProfileOpen: boolean;
  setIsProfileOpen: (value: boolean) => void;
};

const ProfileSidebar = ({
  isProfileOpen,
  setIsProfileOpen,
}: ProfileSidebarProps) => {
  const { details, isAuthenticated }: LoggedInUser = useSelector(
    (items: { auth: LoggedInUser }) => items?.auth,
  );
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState("")
  const [successMsg, setSuccessMsg] = useState("")

  const [loading, setLoading] = useState(false)

  const dispatch = useDispatch<AppDispatch>()
  // Single state object for all editable profile fields.
  // Populated from Redux when the user clicks "Edit Profile".
  const [profileData, setProfileData] = useState<{
    username: string;
    email: string;
    avatar: string;
    avatarFile: File | null;
  }>({
    username: "",
    email: "",
    avatar: "", // holds a preview URL while editing
    avatarFile: null, // holds the ACTUAL file to send to the backend
  });

  const handleEditStart = () => {
    setIsEditing(true);
    // Seed the form with the current logged-in user data
    setProfileData({
      username: details?.username ?? "",
      email: details?.email ?? "",
      avatar: details?.avatar ?? "",
      avatarFile: null,
    });
  };

  const handleSave = async () => {

    setLoading(true)
    try {

      const formData = new FormData()
      formData.append("username", profileData.username)
      formData.append("email", profileData.email)
      
      // ONLY append the avatar if they actually picked a new file!
      if (profileData.avatarFile) {
        formData.append("avatar", profileData.avatarFile)
      }

      console.log("Saving profile data:",formData);

      const response = await customFetch('/api/v1/users/editProfile', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      console.log(data , "DATA")
      if (!response.ok) {
        throw new Error(data.message)
      }
      setSuccessMsg(data.message)
      
      dispatch(LOGIN_USER_ACTION(data.data))
    
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to update profile")
    } finally {
      // Don't auto-close the edit mode so the user can see the spinner, just stop loading
      setLoading(false)
      setIsEditing(false);
    }
  };

  return (
    <Sheet open={isProfileOpen} onOpenChange={setIsProfileOpen}>
      <SheetContent
        side="left"
        className="w-[400px] sm:w-[450px] bg-[#1e2029] border-r-gray-600/50 p-6 flex flex-col overflow-y-auto"
      >
        <SheetTitle className="sr-only">My Profile</SheetTitle>
        <SheetDescription className="sr-only">
          View and edit your profile details.
        </SheetDescription>

        <div className="flex flex-col items-center mt-8">
          {/* Avatar editable preview */}
          <div className="relative w-[150px] h-[150px] group rounded-full overflow-hidden border-4 border-gray-600/30">
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity z-20 cursor-pointer">
              <span className="text-white text-sm font-medium">CHANGE</span>
            </div>

            <Image
              src={
                isEditing
                  ? profileData.avatar || "/images/test.png"
                  : details?.avatar || "/images/test.png"
              }
              alt={details?.username ?? "User"}
              fill
              className="object-cover"
            />

            {/* Transparent file input sits on top — clicking the avatar overlay triggers it */}
            {isEditing && (
              <input
                type="file"
                accept="image/*"
                className="absolute inset-0 opacity-0 cursor-pointer z-30"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  console.log(e.target, file);
                  if (file) {
                    // It's a blob: URL — a special URL format the browser creates to point to data stored in your computer's RAM.
                    const previewUrl = URL.createObjectURL(file);
                    console.log(previewUrl , 'url');
                    // Save BOTH the preview string for the UI, and the actual File object for the backend!
                    setProfileData((prev) => ({ 
                      ...prev, 
                      avatar: previewUrl, 
                      avatarFile: file 
                    }));
                  }
                }}
              />
            )}
          </div>

          <h2 className="text-2xl font-semibold text-white mt-6">My Profile</h2>
        </div>

        <div className="h-px w-full bg-gray-500/30 mt-8 mb-6" />

        <div className="flex flex-col flex-1 space-y-6">
          {/* Name Info */}
          <div className="space-y-2">
            <label className="text-gray-400 text-xs uppercase tracking-wider font-medium flex items-center gap-2">
              <User size={14} /> Name
            </label>
            {isEditing ? (
              <input
                type="text"
                value={profileData.username}
                onChange={(e) =>
                  setProfileData((prev) => ({
                    ...prev,
                    username: e.target.value,
                  }))
                }
                className="w-full bg-gray-300/15 border border-gray-500 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-[#6c75f5] transition-colors"
              />
            ) : (
              <p className="text-white text-lg bg-white/5 px-4 py-2 rounded-xl border border-transparent">
                {details?.username}
              </p>
            )}
          </div>

          {/* Email Info */}
          <div className="space-y-2">
            <label className="text-gray-400 text-xs uppercase tracking-wider font-medium flex items-center gap-2">
              <Mail size={14} /> Email
            </label>
            {isEditing ? (
              <input
                type="email"
                value={profileData.email}
                onChange={(e) =>
                  setProfileData((prev) => ({ ...prev, email: e.target.value }))
                }
                className="w-full bg-gray-300/15 border border-gray-500 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-[#6c75f5] transition-colors"
              />
            ) : (
              <p className="text-white text-lg bg-white/5 px-4 py-2 rounded-xl border border-transparent">
                {details?.email}
              </p>
            )}
          </div>

          <div className="pt-6 mt-auto flex flex-col gap-3">
            {isEditing ? (
              <button
                onClick={handleSave}
                disabled={loading}
                className="w-full flex items-center cursor-pointer justify-center gap-2 bg-[#6c75f5] hover:bg-[#5a63eb] disabled:bg-[#6c75f5]/60 disabled:cursor-not-allowed text-white py-3.5 rounded-2xl font-medium transition-colors"
              >
                {loading ? (
                    <>
                        <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        Updating Profile...
                    </>
                ) : (
                    <>
                        <Save size={18} />
                        Save Changes
                    </>
                )}
              </button>
            ) : (
              <button
                onClick={handleEditStart}
                className="w-full flex items-center cursor-pointer justify-center gap-2 bg-white/10 hover:bg-white/15 border border-white/10 text-white py-3.5 rounded-2xl font-medium transition-colors"
              >
                Edit Profile
              </button>
            )}

            <LogoutDialog
              trigger={
                <button className="w-full cursor-pointer flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white py-3.5 rounded-2xl font-medium transition-colors border border-red-500/20">
                  <LogOut size={18} />
                  Logout
                </button>
              }
            />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ProfileSidebar;

// Your hard drive  →  User picks photo.jpg
//                             ↓
//                   Browser reads it into RAM
//                             ↓
//               Browser creates a pointer to that RAM slot
//                             ↓
//             "blob:http://localhost:3000/abc123"  ← that's the previewUrl
