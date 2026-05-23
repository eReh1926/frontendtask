"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector, useAppDispatch } from "@/lib/hooks";
import { selectIsAuthenticated } from "@/lib/features/auth/authSelectors";
import { restoreSession } from "@/lib/features/auth/authSlice";

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export default function ProtectedRoute({
  children,
  redirectTo = "/login",
}: ProtectedRouteProps) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);

  useEffect(() => {
    // Try to restore session from storage on mount
    dispatch(restoreSession()).then((result) => {
      if (result.meta.requestStatus === "rejected") {
        router.replace(redirectTo);
      }
    });
  }, [dispatch, router, redirectTo]);

  if (!isAuthenticated) {
    // To render nothing while the session is being checked
    return (
      <div className="auth-loading-screen">
        <div className="auth-loading-spinner" />
      </div>
    );
  }

  return <>{children}</>;
}
