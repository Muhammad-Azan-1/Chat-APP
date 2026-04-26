"use client";

import { RefreshCw } from "lucide-react";

interface AuthButtonProps {
  /** The label shown on the button when it is idle */
  text: string;
  /** Show spinning loader — set to true while an API call is in-flight */
  isLoading?: boolean;
  /** Remaining seconds for a rate-limit cooldown; shows "Try again in Xs" when > 0 */
  cooldown?: number;
  /** Any extra boolean condition that should disable the button (e.g. empty fields) */
  disabled?: boolean;
  /** Override the countdown label; defaults to "Try again in ${cooldown}s" */
  cooldownLabel?: (seconds: number) => string;
}

/**
 * AuthButton
 *
 * A universal smart submit button for all auth pages.
 * Automatically handles three states:
 *   1. Idle          → purple, shows `text`
 *   2. Loading       → gray + spinning icon, disabled
 *   3. Rate-limited  → gray + countdown label, disabled
 *
 * Eliminates the duplicated disabled/className ternary logic spread across
 * Login, Signup, VerifyEmail, ResendVerification, ForgotPassword, and NewPassword.
 *
 * Usage:
 *   <AuthButton
 *     text="Send Verification Email"
 *     isLoading={isLoading}
 *     cooldown={cooldown}
 *     disabled={!email}
 *   />
 */
export const AuthButton = ({
  text,
  isLoading = false,
  cooldown = 0,
  disabled = false,
  cooldownLabel,
}: AuthButtonProps) => {
  const isLocked = isLoading || cooldown > 0 || disabled;

  const label = (() => {
    if (isLoading) return text; // keep label stable while spinning
    if (cooldown > 0) {
      return cooldownLabel ? cooldownLabel(cooldown) : `Try again in ${cooldown}s`;
    }
    return text;
  })();

  return (
    <button
      type="submit"
      disabled={isLocked}
      className={`w-full flex justify-center items-center gap-2 font-medium text-[16px] rounded-[18px] py-[18px] transition-colors mt-2 shadow-sm
        ${
          isLocked
            ? "bg-[#3a3d4a] text-gray-500 cursor-not-allowed"
            : "bg-[#5260A3] hover:bg-[#46538f] text-white cursor-pointer"
        }`}
    >
      {isLoading && <RefreshCw className="w-5 h-5 animate-spin" />}
      {label}
    </button>
  );
};
