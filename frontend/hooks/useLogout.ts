"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/redux/store/store";
import { LOGOUT_USER } from "@/redux/reducers/authReducer";

export function useLogout() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const logout = async () => {
    setIsLoading(true);
    setError("");
    try {
      const response = await fetch("/api/v1/users/logout", {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Logout failed");
      }

      // Clear Redux state regardless of API response
      dispatch(LOGOUT_USER());
      router.push("/login");

    } catch (err: any) {
      setError(err.message || "Something went wrong");
      // Still clear client-side state even if API fails
      dispatch(LOGOUT_USER());
      router.push("/login");
    } finally {
      setIsLoading(false);
    }
  };

  return { logout, isLoading, error };
}
