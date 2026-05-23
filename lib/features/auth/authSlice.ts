//core auth part, revisit regularly jic

import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";

export interface AuthUser {
    id: string;
    email: string;
    name: string;
    role: string;
}

export interface AuthState {
    user: AuthUser | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
    rateLimitRetryAfter: number | null;
}

const initialState: AuthState = {
    user: null,
    token: typeof window !== "undefined" ? localStorage.getItem("auth_token") : null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
    rateLimitRetryAfter: null,
};

export const loginUser = createAsyncThunk(
    "auth/login",
    async (
        credentials: { email: string; password: string; rememberMe: boolean },
        { rejectWithValue }
    ) => {
        try {
            // To be replaced with actual API call
            const response = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: credentials.email,
                    password: credentials.password,
                }),
            });

            const data = await response.json();

            if (response.status === 429) {
                return rejectWithValue({
                    type: "RATE_LIMIT",
                    message: data.message || "Too many login attempts",
                    retryAfter: data.retryAfter || 60,
                });
            }

            if (!response.ok || !data.success) {
                return rejectWithValue({
                    type: "AUTH_ERROR",
                    message: data.message || "Invalid credentials",
                });
            }

            // Persist token
            if (credentials.rememberMe) {
                localStorage.setItem("auth_token", data.token);
                localStorage.setItem("auth_user", JSON.stringify(data.user));
            } else {
                sessionStorage.setItem("auth_token", data.token);
                sessionStorage.setItem("auth_user", JSON.stringify(data.user));
            }

            return { token: data.token, user: data.user };
        } catch {
            return rejectWithValue({
                type: "NETWORK_ERROR",
                message: "Network error. Please check your connection.",
            });
        }
    }
);

export const restoreSession = createAsyncThunk(
    "auth/restoreSession",
    async (_, { rejectWithValue }) => {
        try {
            const token =
                localStorage.getItem("auth_token") ||
                sessionStorage.getItem("auth_token");
            const userStr =
                localStorage.getItem("auth_user") ||
                sessionStorage.getItem("auth_user");

            if (!token || !userStr) return rejectWithValue("No session");

            // Verify token with backend
            const response = await fetch("/api/auth/verify", {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!response.ok) {
                // Token invalid or expired — clear storage
                localStorage.removeItem("auth_token");
                localStorage.removeItem("auth_user");
                sessionStorage.removeItem("auth_token");
                sessionStorage.removeItem("auth_user");
                return rejectWithValue("Session invalid");
            }

            const user = JSON.parse(userStr);
            return { token, user };
        } catch {
            return rejectWithValue("Session invalid");
        }
    }
);

const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        logout(state) {
            state.user = null;
            state.token = null;
            state.isAuthenticated = false;
            state.error = null;
            state.rateLimitRetryAfter = null;
            localStorage.removeItem("auth_token");
            localStorage.removeItem("auth_user");
            sessionStorage.removeItem("auth_token");
            sessionStorage.removeItem("auth_user");
        },
        clearError(state) {
            state.error = null;
            state.rateLimitRetryAfter = null;
        },
        setRateLimitExpired(state) {
            state.rateLimitRetryAfter = null;
        },
    },
    extraReducers: (builder) => {
        builder
            // Login
            .addCase(loginUser.pending, (state) => {
                state.isLoading = true;
                state.error = null;
                state.rateLimitRetryAfter = null;
            })
            .addCase(loginUser.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isAuthenticated = true;
                state.token = action.payload.token;
                state.user = action.payload.user;
                state.error = null;
            })
            .addCase(loginUser.rejected, (state, action: PayloadAction<unknown>) => {
                state.isLoading = false;
                state.isAuthenticated = false;
                const payload = action.payload as {
                    type: string;
                    message: string;
                    retryAfter?: number;
                };
                state.error = payload?.message || "An error occurred";
                if (payload?.type === "RATE_LIMIT") {
                    state.rateLimitRetryAfter = payload.retryAfter ?? 60;
                }
            })
            // Restore session
            .addCase(restoreSession.fulfilled, (state, action) => {
                state.isAuthenticated = true;
                state.token = action.payload.token;
                state.user = action.payload.user;
            })
            .addCase(restoreSession.rejected, (state) => {
                state.isAuthenticated = false;
                state.token = null;
                state.user = null;
            });
    },
});

export const { logout, clearError, setRateLimitExpired } = authSlice.actions;
export default authSlice.reducer;