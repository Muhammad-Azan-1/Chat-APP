import { useState, useEffect, useCallback } from "react";

/**
 * useAuthCooldown
 *
 * A reusable hook that manages a countdown timer for auth rate-limiting flows.
 * The cooldown is persisted in localStorage as an expiry Unix timestamp so it
 * survives page refreshes and navigation between auth pages.
 *
 * @param cacheKey - A unique string like 'login', 'signup', etc. so different pages don't share the same timer
 */
export const useAuthCooldown = (cacheKey: string) => {
  const dynamicStorageKey = `auth_cooldown_${cacheKey}_expires_at`;

  const [cooldown, setCooldownState] = useState<number>(() => {
    // Initialise from localStorage on first render (SSR-safe)
    if (typeof window === "undefined") return 0;
    const expiresAt = localStorage.getItem(dynamicStorageKey);
    if (!expiresAt) return 0;
    const secondsLeft = Math.ceil((parseInt(expiresAt) - Date.now()) / 1000);
    return secondsLeft > 0 ? secondsLeft : 0;
  });

  // Tick down every second
  useEffect(() => {
    if (cooldown <= 0) {
      localStorage.removeItem(dynamicStorageKey); // Clean up when done
      return;
    }

    const timer = setInterval(() => {
      setCooldownState((prev) => {
        const next = prev - 1;
        if (next <= 0) localStorage.removeItem(dynamicStorageKey);
        return next;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [cooldown, dynamicStorageKey]);

  // Public setter — saves the expiry timestamp to localStorage, then updates state
  const setCooldown = useCallback((seconds: number) => {
    if (seconds <= 0) {
      localStorage.removeItem(dynamicStorageKey);
      setCooldownState(0);
      return;
    }
    const expiresAt = Date.now() + seconds * 1000;
    localStorage.setItem(dynamicStorageKey, expiresAt.toString());
    setCooldownState(seconds);
  }, [dynamicStorageKey]);

  return { cooldown, setCooldown };
};
