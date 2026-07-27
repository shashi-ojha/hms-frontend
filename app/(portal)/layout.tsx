"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Loader2, HeartPulse, PhoneCall } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Sidebar } from "@/components/Sidebar";
import { MobileNav } from "@/components/MobileNav";

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, hydrated, patientLoading, patientMissing, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!hydrated) return;
    if (!user) router.replace("/login");
  }, [hydrated, user, router]);

  if (!hydrated || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F7FAF9]">
        <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#F7FAF9]">
      <Sidebar />
      <div className="flex min-h-screen flex-1 flex-col pb-16 lg:pb-0">
        {patientLoading ? (
          <div className="flex flex-1 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
          </div>
        ) : patientMissing ? (
          <ProfilePending onLogout={logout} />
        ) : (
          <div key={pathname} className="animate-[fadeIn_.25s_ease-out]">
            {children}
          </div>
        )}
      </div>
      <MobileNav />
    </div>
  );
}

function ProfilePending({ onLogout }: { onLogout: () => void }) {
  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <div className="max-w-md rounded-3xl border border-ink-100 bg-white p-8 text-center shadow-card">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
          <HeartPulse className="h-6 w-6" />
        </div>
        <h2 className="mt-4 font-display text-lg font-semibold text-ink-900">
          Your patient profile is being set up
        </h2>
        <p className="mt-2 text-sm text-ink-500">
          Your account was created, but our front desk still needs to link
          your medical profile before you can book appointments. This
          usually takes a few minutes during clinic hours.
        </p>
        <div className="mt-5 flex items-center justify-center gap-2 rounded-xl bg-ink-100 px-4 py-3 text-sm text-ink-700">
          <PhoneCall className="h-4 w-4" />
          Call reception to speed this up
        </div>
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