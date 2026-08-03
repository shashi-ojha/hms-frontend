"use client";

import { useState } from "react";
import { ChevronDown, KeyRound, LogOut, UserCircle2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { initials } from "@/lib/format";
import { ChangePasswordModal } from "@/components/ChangePasswordModal";
import { NotificationBell } from "@/components/NotificationBell";

export function Topbar({
  title,
  subtitle,
  profileHref = "/profile",
}: {
  title: string;
  subtitle?: string;
  profileHref?: string;
}) {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between border-b border-ink-100 bg-[#F7FAF9] px-6 py-5 lg:px-10">
      <div>
        <h1 className="font-display text-xl font-semibold text-ink-900 sm:text-2xl">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-0.5 text-sm text-ink-500">{subtitle}</p>
        )}
      </div>

      <div className="flex items-center gap-3">
        <NotificationBell />
        <div className="relative">
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-2.5 rounded-2xl border border-ink-100 bg-white px-2.5 py-1.5 pr-3 shadow-soft"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-700 text-xs font-semibold text-white">
            {initials(user?.name || "")}
          </div>
          <span className="hidden text-sm font-medium text-ink-900 sm:block">
            {user?.name}
          </span>
          <ChevronDown className="h-4 w-4 text-ink-500" />
        </button>

        {open && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setOpen(false)}
            />
            <div className="absolute right-0 z-20 mt-2 w-48 overflow-hidden rounded-2xl border border-ink-100 bg-white py-1.5 shadow-card">
              <a
                href={profileHref}
                className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-ink-700 hover:bg-ink-100"
              >
                <UserCircle2 className="h-4 w-4" />
                My profile
              </a>
              <button
                onClick={() => {
                  setOpen(false);
                  setPasswordModalOpen(true);
                }}
                className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-ink-700 hover:bg-ink-100"
              >
                <KeyRound className="h-4 w-4" />
                Change password
              </button>
              <button
                onClick={logout}
                className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-coral-600 hover:bg-coral-50"
              >
                <LogOut className="h-4 w-4" />
                Log out
              </button>
            </div>
          </>
        )}
        </div>
      </div>

      <ChangePasswordModal
        open={passwordModalOpen}
        onClose={() => setPasswordModalOpen(false)}
      />
    </header>
  );
}