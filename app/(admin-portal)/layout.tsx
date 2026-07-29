"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { AdminSidebar } from "@/components/AdminSidebar";
import { AdminMobileNav } from "@/components/AdminMobileNav";

export default function AdminPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, hydrated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!hydrated) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (user.role !== "ADMIN") {
      router.replace("/login");
    }
  }, [hydrated, user, router]);

  if (!hydrated || !user || user.role !== "ADMIN") {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F7FAF9]">
        <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#F7FAF9]">
      <AdminSidebar />
      <main className="flex min-h-screen flex-1 flex-col pb-16 lg:pb-0">
        {children}
      </main>
      <AdminMobileNav />
    </div>
  );
}