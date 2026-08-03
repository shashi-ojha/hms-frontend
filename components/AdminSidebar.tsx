"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Stethoscope,
  Building2,
  Users,
  Receipt,
  CalendarDays,
  HeartPulse,
  LogOut,
  Clock,
  UserCog,
  ClipboardList,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { useAuth } from "@/lib/auth-context";
import { getPendingPatientsCount } from "@/lib/api";

// ─── Types ────────────────────────────────────────────────
interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  badge?: number;
}

// ─── Static nav ───────────────────────────────────────────
const staticNav: NavItem[] = [
  { href: "/admin/dashboard",         label: "Dashboard",         icon: LayoutDashboard },
  { href: "/admin/appointments",      label: "Appointments",      icon: CalendarDays },
  { href: "/admin/doctors",           label: "Doctors",           icon: Stethoscope },
  { href: "/admin/departments",       label: "Departments",       icon: Building2 },
  { href: "/admin/patients",          label: "Patients",          icon: Users },
  { href: "/admin/pending-approvals", label: "Pending Approvals", icon: Clock },
  { href: "/admin/users",             label: "Users",             icon: UserCog },
  { href: "/admin/bills",             label: "Bills",             icon: Receipt },
  { href: "/admin/records",           label: "Records",           icon: ClipboardList },
];

// ─── Hook — live pending count ────────────────────────────
function useAdminNav(): NavItem[] {
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    async function fetchCount() {
      try {
        const data = await getPendingPatientsCount();
        setPendingCount(data.count ?? 0);
      } catch {
        setPendingCount(0);
      }
    }

    // Load immediately
    fetchCount();

    // Auto-refresh every 60 seconds
    const interval = setInterval(fetchCount, 60_000);
    return () => clearInterval(interval);
  }, []);

  return staticNav.map((item) =>
    item.href === "/admin/pending-approvals"
      ? { ...item, badge: pendingCount }
      : item
  );
}

// ─── Sidebar ──────────────────────────────────────────────
export function AdminSidebar() {
  const pathname = usePathname();
  const { logout } = useAuth();
  const navRef = useRef<HTMLDivElement>(null);

  // ✅ Dynamic nav with live badge
  const nav = useAdminNav();

  const [indicator, setIndicator] = useState({
    top: 0,
    height: 0,
    opacity: 0,
  });

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

      {/* Logo */}
      <div className="flex items-center gap-2 px-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-700 text-white">
          <HeartPulse className="h-5 w-5" />
        </div>
        <div className="leading-tight">
          <span className="block font-display text-lg font-semibold text-ink-900">
            AarogyaAI
          </span>
          <span className="block text-[11px] font-medium uppercase tracking-wide text-ink-500">
            Admin
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav ref={navRef} className="relative mt-8 flex-1 space-y-1">

        {/* Sliding indicator */}
        <div
          className="absolute left-0 w-full rounded-xl bg-brand-50 transition-[top,height] duration-300 ease-out"
          style={{
            top: indicator.top,
            height: indicator.height,
            opacity: indicator.opacity,
          }}
        />

        {nav.map(({ href, label, icon: Icon, badge }) => {
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

              {/* Label */}
              <span className="flex-1">{label}</span>

              {/* ✅ Badge — only shows when count > 0 */}
              {badge != null && badge > 0 && (
                <span
                  className="flex h-5 min-w-[1.25rem] items-center
                             justify-center rounded-full bg-amber-500
                             px-1.5 text-xs font-semibold text-white"
                >
                  {badge > 99 ? "99+" : badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
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
