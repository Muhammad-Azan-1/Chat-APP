

// Shape of the user object returned by the backend on login.
// Both manual login (/auth/login) and Google login (/auth/googleAuth) return this same set of fields.
// Sensitive fields (password, refreshToken, verificationOTP, etc.) are excluded by the backend .select() call.
export interface User {
    _id: string;
    username: string;
    email: string;
    avatar: string;
    roles: "ADMIN" | "USER";
    // "isVerified" is only included in the manual login response (excluded from Google's .select())
    // We make it optional so both login paths satisfy the same type.
    isVerified?: boolean;
    createdAt: string;
    updatedAt: string;
}

// Shape of the Redux auth slice state
export interface LoggedInUser {
    details: null | User;
    isAuthenticated: boolean;
}