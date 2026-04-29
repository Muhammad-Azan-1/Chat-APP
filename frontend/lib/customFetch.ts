// ============================================================================
// CUSTOM FETCH — Auto-refresh wrapper for all authenticated API calls
// ============================================================================
//
// HOW IT WORKS:
// 1. Makes the original request
// 2. If server returns 401 (access token expired), tries to refresh
// 3. If refresh succeeds → retries the original request with new tokens
// 4. If refresh ALSO fails (refresh token expired too) → clears session → /login
//
// WHY:
// Without this, every component would need its own 401-handling logic.
// This centralizes it in one place — just use customFetch() instead of fetch().
//
// IMPORTANT: This does NOT hardcode Content-Type. This means it works for:
//   - JSON requests (you set Content-Type yourself)
//   - FormData/file uploads (browser sets the correct multipart boundary)
// ============================================================================

// WHY we import the store directly instead of using useDispatch:
// useDispatch is a REACT HOOK — it can only be called inside React components.
// customFetch is a plain utility function, not a component.
// Importing the store directly (store.dispatch) is the standard Redux pattern
// for dispatching actions from outside React (utils, interceptors, etc.)

import { store } from "@/redux/store/store";
import { LOGOUT_USER } from "@/redux/reducers/authReducer";

// Flag to prevent multiple simultaneous refresh attempts.
// If 3 API calls all get 401 at the same time, only ONE refresh happens.
let isRefreshing = false;

// Queue of requests waiting for the refresh to complete
let refreshQueue: Array<{
  resolve: (value: Response) => void;
  reject: (reason: unknown) => void;
  url: RequestInfo | URL;
  options: RequestInit;
}> = [];

// Process all queued requests after refresh completes
function processQueue(success: boolean) {
  if (success) {
    // Refresh worked! Retry all queued requests
    refreshQueue.forEach(({ resolve, reject, url, options }) => {
      fetch(url, options).then(resolve).catch(reject);
    });
  } else {
    // Refresh failed — reject everything
    refreshQueue.forEach(({ reject }) => {
      reject(new Error("Session expired"));
    });
  }
  refreshQueue = [];
}

export async function customFetch(
  url: RequestInfo | URL,
  options: RequestInit = {}
): Promise<Response> {
  // Always include credentials so cookies (accessToken, refreshToken) are sent
  options.credentials = "include";

  // 1. Make the original request
  let response = await fetch(url, options);

  // 2. If NOT a 401, return immediately — nothing to do
  if (response.status !== 401) {
    return response;
  }

  // 3. Access token expired (401) — try to refresh

  // If a refresh is already in progress, queue this request
  if (isRefreshing) {
    return new Promise((resolve, reject) => {
      refreshQueue.push({ resolve, reject, url, options });
    });
  }

  isRefreshing = true;

  try {
    // 4. Call the refresh endpoint
    const refreshResponse = await fetch("/api/v1/users/refreshAcessToken", {
      method: "POST",
      credentials: "include", // Sends the refresh token cookie
    });

    if (refreshResponse.ok) {
      // 5. Refresh succeeded! Process any queued requests
      processQueue(true);

      // 6. Retry the ORIGINAL request (new access token is now in cookies)
      response = await fetch(url, options);
      return response;

    } else {
      // 7. Refresh token is ALSO expired — session is completely dead.
      // Call the logout API to:
      //   - Clear the accessToken + refreshToken cookies from the browser (res.clearCookie)
      //   - Unset the refreshToken in the DB
      // This works even with expired tokens because the logout route uses
      // verifyJWTSoft (ignoreExpiration: true) — we built it exactly for this.
      processQueue(false);

      try {
        await fetch("/api/v1/users/logout", {
          method: "POST",
          credentials: "include", // Send the expired access token cookie for verifyJWTSoft to decode
        });
      } catch {
        // If logout API fails (network down etc.), proceed anyway — cookies will
        // expire naturally, and we still clear the client state below
      }

      // Clear Redux state (and redux-persist storage) via store.dispatch
      // Cannot use useDispatch here — hooks only work inside React components
      store.dispatch(LOGOUT_USER());

      // Hard redirect to login — user can no longer access any protected route
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }

      return refreshResponse;
    }
  } catch (error) {
    // Network error during refresh — clean up anyway
    processQueue(false);

    try {
      await fetch("/api/v1/users/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch {
      // Ignore — just clear client state
    }

    store.dispatch(LOGOUT_USER());

    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }

    throw error;
  } finally {
    isRefreshing = false;
  }
}
