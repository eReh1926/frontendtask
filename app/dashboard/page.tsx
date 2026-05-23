"use client";

import ProtectedRoute from "@/app/components/auth/ProtectedRoute";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { logout } from "@/lib/features/auth/authSlice";
import { selectAuthUser } from "@/lib/features/auth/authSelectors";
import { useRouter } from "next/navigation";
import styles from "./dashboard.module.css";

export default function DashboardPage() {
    return (
        <ProtectedRoute>
            <DashboardContent />
        </ProtectedRoute>
    );
}

function DashboardContent() {
    const dispatch = useAppDispatch();
    const router = useRouter();
    const user = useAppSelector(selectAuthUser);

    const handleLogout = () => {
        dispatch(logout());
        router.replace("/login");
    };

    return (
        <div className={styles.page}>
            <div className={styles.topbar}>
                <h1 className={styles.logoText1}>TEDx</h1>
                <h2 className={styles.logoText2}>IITPatna</h2>
                <button className={styles.logoutBtn} onClick={handleLogout}>
                    Sign out
                </button>
            </div>
            <div className={styles.card}>
                <div className={styles.header}>
                    <div>
                        <h1 className={`${styles.logoText2} ${styles.withPadding}`}>Welcome to the</h1>
                        <span className={styles.logoText1}>Dashboard</span>
                    </div>
                </div>

                <p className={styles.info}>
                    You are securely signed in. Yay
                </p>
            </div>
        </div>
    );
}
