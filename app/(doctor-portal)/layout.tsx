"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, HeartPulse } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { DoctorSidebar } from "@/components/DoctorSidebar";
import { DoctorMobileNav } from "@/components/DoctorMobileNav";

export default function DoctorPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, hydrated, doctorLoading, doctorMissing, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!hydrated) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (user.role !== "DOCTOR") {
      router.replace("/login");
    }
  }, [hydrated, user, router]);

  if (!hydrated || !user || user.role !== "DOCTOR") {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F7FAF9]">
        <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#F7FAF9]">
      <DoctorSidebar />
      <div className="flex min-h-screen flex-1 flex-col pb-16 lg:pb-0">
        {doctorLoading ? (
          <div className="flex flex-1 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
          </div>
        ) : doctorMissing ? (
          <DoctorProfileMissing onLogout={logout} />
        ) : (
          children
        )}
      </div>
      <DoctorMobileNav />
    </div>
  );
}

function DoctorProfileMissing({ onLogout }: { onLogout: () => void }) {
  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <div className="max-w-md rounded-3xl border border-ink-100 bg-white p-8 text-center shadow-card">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
          <HeartPulse className="h-6 w-6" />
        </div>
        <h2 className="mt-4 font-display text-lg font-semibold text-ink-900">
          Your doctor profile isn't linked yet
        </h2>
        <p className="mt-2 text-sm text-ink-500">
          An admin needs to create your Doctor record (specialization,
          department, fee) before you can access the schedule. Reach out to
          your hospital admin.
        </p>
        <button
          onClick={onLogout}
          className="mt-5 text-sm font-medium text-ink-500 hover:text-ink-900"
        >
          Log out
        </button>
      </div>
    </div>
  );
}