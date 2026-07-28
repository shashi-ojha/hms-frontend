"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarClock,
  Users,
  UserCircle2,
  HeartPulse,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { useAuth } from "@/lib/auth-context";

const nav = [
  { href: "/doctor/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/doctor/schedule", label: "Schedule", icon: CalendarClock },
  { href: "/doctor/patients", label: "Patients", icon: Users },
  { href: "/doctor/profile", label: "Profile", icon: UserCircle2 },
];

export function DoctorSidebar() {
  const pathname = usePathname();
  const { logout } = useAuth();
  const navRef = useRef<HTMLDivElement>(null);
  const [indicator, setIndicator] = useState({ top: 0, height: 0, opacity: 0 });

  useEffect(() => {
    const activeEl = navRef.current?.querySelector<HTMLAnchorElement>(
      '[data-active="true"]'
    );
    if (activeEl) {
      setIndicator({
        top: activeEl.offsetTop,
        height: activeEl.offsetHeight,
        opacity: 1,
      });
    }
  }, [pathname]);

  return (
    <aside className="hidden w-64 flex-shrink-0 flex-col border-r border-ink-100 bg-white px-4 py-6 lg:flex">
      <div className="flex items-center gap-2 px-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-700 text-white">
          <HeartPulse className="h-5 w-5" />
        </div>
        <div className="leading-tight">
          <span className="block font-display text-lg font-semibold text-ink-900">
            MedCare
          </span>
          <span className="block text-[11px] font-medium uppercase tracking-wide text-ink-500">
            Doctor
          </span>
        </div>
      </div>

      <nav ref={navRef} className="relative mt-8 flex-1 space-y-1">
        <div
          className="absolute left-0 w-full rounded-xl bg-brand-50 transition-[top,height] duration-300 ease-out"
          style={{
            top: indicator.top,
            height: indicator.height,
            opacity: indicator.opacity,
          }}
        />
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              data-active={active}
              className={cn(
                "relative z-10 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "text-brand-800"
                  : "text-ink-500 hover:bg-ink-100 hover:text-ink-900"
              )}
            >
              <Icon
                className={cn(
                  "h-4.5 w-4.5 transition-colors",
                  active ? "text-brand-700" : "text-ink-500"
                )}
              />
              {label}
            </Link>
          );
        })}
      </nav>

      <button
        onClick={logout}
        className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-ink-500 transition-colors hover:bg-coral-50 hover:text-coral-600"
      >
        <LogOut className="h-4.5 w-4.5" />
        Log out
      </button>
    </aside>
  );
}