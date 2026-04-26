"use client";

import { ShieldAlert, MailCheck } from "lucide-react";
import { useEffect, useState } from "react";

interface AuthAlertsProps {
  /** 429 rate-limit message — shown as an orange warning banner */
  rateLimit?: string;
  /** General error message — shown as a red error banner (hidden if rateLimit is active) */
  error?: string;
  /** Success message — shown as a green success banner */
  success?: string;
}

/**
 * AuthAlerts
 *
 * A universal alerts component for all auth pages.
 * Renders rate-limit (orange), error (red), and success (green) banners
 * from a single import instead of copy-pasting the same JSX blocks across
 * Login, Signup, VerifyEmail, ResendVerification, etc.
 *
 * Priority: rateLimit > error > success (only one banner shows at a time
 * except that success can coexist unless a rate limit or error is active).
 * All banners auto-dismiss after 3 seconds.
 *
 * Usage:
 *   <AuthAlerts
 *     rateLimit={rateLimitMessage}
 *     error={errorMessage}
 *     success={successMessage}
 *   />
 */
export const AuthAlerts = ({ rateLimit, error, success }: AuthAlertsProps) => {
  const [visibleRateLimit, setVisibleRateLimit] = useState<string | undefined>(rateLimit);
  const [visibleError, setVisibleError]         = useState<string | undefined>(error);
  const [visibleSuccess, setVisibleSuccess]     = useState<string | undefined>(success);

  // Auto-dismiss rateLimit banner after 3 seconds
  useEffect(() => {
    if (rateLimit) {
      setVisibleRateLimit(rateLimit);
      const timer = setTimeout(() => setVisibleRateLimit(undefined), 3000);
      return () => clearTimeout(timer);
    } else {
      setVisibleRateLimit(undefined);
    }
  }, [rateLimit]);

  // Auto-dismiss error after 3 seconds
  useEffect(() => {
    if (error) {
      setVisibleError(error);
      const timer = setTimeout(() => setVisibleError(undefined), 3000);
      return () => clearTimeout(timer);
    } else {
      setVisibleError(undefined);
    }
  }, [error]);

  // Auto-dismiss success after 3 seconds
  useEffect(() => {
    if (success) {
      setVisibleSuccess(success);
      const timer = setTimeout(() => setVisibleSuccess(undefined), 3000);
      return () => clearTimeout(timer);
    } else {
      setVisibleSuccess(undefined);
    }
  }, [success]);

  return (
    <div className="space-y-3">
      {/* Rate Limit — orange */}
      {visibleRateLimit && (
        <div className="flex items-center gap-3 bg-orange-500/10 border border-orange-500/30 rounded-[14px] px-5 py-4">
          <ShieldAlert className="w-5 h-5 text-orange-400 shrink-0" />
          <p className="text-orange-300 text-[14px]">{visibleRateLimit}</p>
        </div>
      )}

      {/* Error — red (only if no rate-limit banner is showing) */}
      {visibleError && !visibleRateLimit && (
        <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 rounded-[14px] px-5 py-4">
          <ShieldAlert className="w-5 h-5 text-red-400 shrink-0" />
          <p className="text-red-300 text-[14px]">{visibleError}</p>
        </div>
      )}

      {/* Success — green (only if no rate-limit or error banner is showing) */}
      {visibleSuccess && !visibleRateLimit && !visibleError && (
        <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/30 rounded-[14px] px-5 py-4">
          <MailCheck className="w-5 h-5 text-emerald-400 shrink-0" />
          <p className="text-emerald-300 text-[14px]">{visibleSuccess}</p>
        </div>
      )}
    </div>
  );
};
