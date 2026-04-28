"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { setAdminToken } from "@/app/lib/admin-api";

function AdminAuthCallbackInner() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get("token");
    if (token) {
      setAdminToken(token);
    }
    window.location.href = "/backoffice/dashboard";
  }, [searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-warning border-t-transparent" />
    </div>
  );
}

export default function AdminAuthCallback() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-warning border-t-transparent" />
        </div>
      }
    >
      <AdminAuthCallbackInner />
    </Suspense>
  );
}
