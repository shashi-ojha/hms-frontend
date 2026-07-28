"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarClock,
  Users,
  UserCircle2,
} from "lucide-react";
import { cn } from "@/lib/cn";

const nav = [
  { href: "/doctor/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/doctor/schedule", label: "Schedule", icon: CalendarClock },
  { href: "/doctor/patients", label: "Patients", icon: Users },
  { href: "/doctor/profile", label: "Profile", icon: UserCircle2 },
];

export function DoctorMobileNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t border-ink-100 bg-white lg:hidden">
      {nav.map(({ href, label, icon: Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium",
              active ? "text-brand-700" : "text-ink-500"
            )}
          >
            <Icon className="h-5 w-5" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}