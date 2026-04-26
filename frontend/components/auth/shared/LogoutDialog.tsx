"use client";

import { LogOut, AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useLogout } from "@/hooks/useLogout";

type LogoutDialogProps = {
  // Whatever element you wrap with this becomes the trigger
  trigger: React.ReactNode;
};

const LogoutDialog = ({ trigger }: LogoutDialogProps) => {
  const { logout, isLoading } = useLogout();

  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>

      <DialogContent className="bg-[#1e2029] border border-gray-600/40 text-white max-w-sm rounded-2xl shadow-2xl p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-0">
          {/* Icon */}
          <div className="flex items-center justify-center w-14 h-14 rounded-full bg-red-500/10 border border-red-500/20 mx-auto mb-4">
            <AlertTriangle className="w-7 h-7 text-red-400" />
          </div>

          <DialogTitle className="text-center text-xl font-semibold text-white">
            Logout
          </DialogTitle>
          <DialogDescription className="text-center text-gray-400 text-sm mt-1">
            Are you sure you want to log out? You'll need to sign in again to
            access your chats.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="flex flex-col sm:flex-row gap-3 px-6 py-6">
          {/* Cancel — closes the dialog without logging out */}
          <button
            type="button"
            onClick={(e) => {
              // Close the dialog by clicking the closest Dialog close trigger
              const dialog = (e.target as HTMLElement).closest("[role='dialog']");
              const closeBtn = dialog?.querySelector("[data-radix-dialog-close]") as HTMLElement | null;
              closeBtn?.click();
            }}
            className="flex-1 cursor-pointer py-3 rounded-xl bg-white/8 hover:bg-white/12 border border-white/10 text-gray-300 font-medium text-sm transition-colors"
          >
            Cancel
          </button>

          {/* Confirm logout */}
          <button
            type="button"
            onClick={logout}
            disabled={isLoading}
            className="flex-1 cursor-pointer flex items-center justify-center gap-2 py-3 rounded-xl bg-red-500/15 hover:bg-red-500 border border-red-500/30 text-red-400 hover:text-white font-medium text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="w-4 h-4 border-2 border-red-400/40 border-t-red-400 rounded-full animate-spin" />
            ) : (
              <LogOut className="w-4 h-4" />
            )}
            {isLoading ? "Logging out…" : "Yes, Logout"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default LogoutDialog;
