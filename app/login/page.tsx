"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { loginUser, clearError, setRateLimitExpired } from "@/lib/features/auth/authSlice";
import {
    selectIsAuthenticated,
    selectAuthLoading,
    selectAuthError,
    selectRateLimitRetryAfter,
} from "@/lib/features/auth/authSelectors";
import Toast, { useToast } from "@/app/components/ui/toast";
import styles from "./login.module.css";

export default function LoginPage() {
    const dispatch = useAppDispatch();
    const router = useRouter();

    const isAuthenticated = useAppSelector(selectIsAuthenticated);
    const isLoading = useAppSelector(selectAuthLoading);
    const authError = useAppSelector(selectAuthError);
    const rateLimitRetryAfter = useAppSelector(selectRateLimitRetryAfter);

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [darkMode, setDarkMode] = useState(true);
    const [isExiting, setIsExiting] = useState(false);

    // Field-level validation
    const [touched, setTouched] = useState({ email: false, password: false });
    const [fieldErrors, setFieldErrors] = useState({ email: "", password: "" });

    // Rate limit countdown
    const [countdown, setCountdown] = useState(0);
    const countdownRef = useRef<NodeJS.Timeout | null>(null);

    const { toasts, addToast, removeToast } = useToast();

    // Redirect if already authenticated
    useEffect(() => {
        if (isAuthenticated) {
            setIsExiting(true);
            setTimeout(() => router.replace("/dashboard"), 2000);
        }
    }, [isAuthenticated, router]);

    // Load remembered email
    useEffect(() => {
        const remembered = localStorage.getItem("remembered_email");
        if (remembered) {
            setEmail(remembered);
            setRememberMe(true);
        }
    }, []);

    // Handle auth errors from Redux
    useEffect(() => {
        if (authError) {
            addToast(authError, "error");
        }
    }, [authError]);

    // Handle rate limit countdown
    useEffect(() => {
        if (rateLimitRetryAfter && rateLimitRetryAfter > 0) {
            setCountdown(rateLimitRetryAfter);
            countdownRef.current = setInterval(() => {
                setCountdown((prev) => {
                    if (prev <= 1) {
                        clearInterval(countdownRef.current!);
                        dispatch(setRateLimitExpired());
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => {
            if (countdownRef.current) clearInterval(countdownRef.current);
        };
    }, [rateLimitRetryAfter, dispatch]);

    const validate = () => {
        const errors = { email: "", password: "" };
        if (!email.trim()) {
            errors.email = "Email is required";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            errors.email = "Enter a valid email address";
        }
        if (!password) {
            errors.password = "Password is required";
        } else if (password.length < 6) {
            errors.password = "Password must be at least 6 characters";
        }
        setFieldErrors(errors);
        return !errors.email && !errors.password;
    };

    const handleBlur = (field: "email" | "password") => {
        setTouched((prev) => ({ ...prev, [field]: true }));
        validate();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setTouched({ email: true, password: true });
        if (!validate()) return;

        dispatch(clearError());

        if (rememberMe) {
            localStorage.setItem("remembered_email", email);
        } else {
            localStorage.removeItem("remembered_email");
        }

        const result = await dispatch(loginUser({ email, password, rememberMe }));

        if (loginUser.fulfilled.match(result)) {
            addToast("Welcome back! Redirecting…", "success");
        }
    };

    const isRateLimited = countdown > 0;
    const isDisabled = isLoading || isRateLimited;

    return (
        <div className={`${styles.root} ${darkMode ? styles.dark : styles.light} ${isExiting ? styles.blurOut : ""}`}>
            <Toast toasts={toasts} onRemove={removeToast} />

            {/* Theme toggle */}
            <button
                className={styles.themeToggle}
                onClick={() => setDarkMode((d) => !d)}
                aria-label="Toggle theme"
            >
                {darkMode ? "☀" : "☾"}
            </button>

            <main className={`${styles.card} ${isExiting ? styles.exitAnimation : ""}`}>
                {/* Header */}
                <div className={styles.header}>
                    <div className={`${isExiting ? styles.textExit : ""}`}>
                        <span className={styles.logoText1}>TEDx </span>
                        <span className={styles.logoText2}>IIT Patna</span>
                    </div>
                    <h1 className={styles.title}>Admin Portal</h1>
                    <p className={styles.subtitle}>Sign in to your account</p>
                </div>

                <form className={styles.form} onSubmit={handleSubmit} noValidate>
                    {/* Email */}
                    <div className={styles.fieldGroup}>
                        <label className={styles.label} htmlFor="email">
                            Email address
                        </label>
                        <div
                            className={`${styles.inputWrap} ${touched.email && fieldErrors.email ? styles.inputError : ""
                                }`}
                        >
                            <span className={styles.inputIcon}>✉</span>
                            <input
                                id="email"
                                type="email"
                                className={styles.input}
                                placeholder="admin@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                onBlur={() => handleBlur("email")}
                                disabled={isDisabled}
                                autoComplete="email"
                            />
                        </div>
                        {touched.email && fieldErrors.email && (
                            <span className={styles.errorMsg}>{fieldErrors.email}</span>
                        )}
                    </div>

                    {/* Password */}
                    <div className={styles.fieldGroup}>
                        <label className={styles.label} htmlFor="password">
                            Password
                        </label>
                        <div
                            className={`${styles.inputWrap} ${touched.password && fieldErrors.password ? styles.inputError : ""
                                }`}
                        >
                            <span className={styles.inputIcon}>⚿</span>
                            <input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                className={styles.input}
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                onBlur={() => handleBlur("password")}
                                disabled={isDisabled}
                                autoComplete="current-password"
                            />
                            <button
                                type="button"
                                className={styles.togglePassword}
                                onClick={() => setShowPassword((s) => !s)}
                                aria-label={showPassword ? "Hide password" : "Show password"}
                                tabIndex={-1}
                            >
                                {showPassword ? "🙈" : "👁"}
                            </button>
                        </div>
                        {touched.password && fieldErrors.password && (
                            <span className={styles.errorMsg}>{fieldErrors.password}</span>
                        )}
                    </div>

                    {/* Remember me */}
                    <div className={styles.rememberRow}>
                        <label className={styles.checkLabel}>
                            <input
                                type="checkbox"
                                className={styles.checkbox}
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                                disabled={isDisabled}
                            />
                            <span className={styles.checkCustom} />
                            Remember me
                        </label>
                    </div>

                    {/* Rate limit banner */}
                    {isRateLimited && (
                        <div className={styles.rateLimitBanner} role="alert">
                            <span className={styles.rateLimitIcon}>⏱</span>
                            <span>
                                Too many attempts. Try again in{" "}
                                <strong>{countdown}s</strong>
                            </span>
                        </div>
                    )}

                    {/* Submit */}
                    <button
                        type="submit"
                        className={styles.submitBtn}
                        disabled={isDisabled}
                    >
                        {isLoading ? (
                            <>
                                <span className={styles.spinner} />
                                Signing in…
                            </>
                        ) : isRateLimited ? (
                            `Try again in ${countdown}s`
                        ) : (
                            "Sign in"
                        )}
                    </button>
                </form>
            </main>
        </div>
    );
}
