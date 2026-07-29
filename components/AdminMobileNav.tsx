"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Stethoscope,
  Building2,
  Users,
  Receipt,
} from "lucide-react";
import { cn } from "@/lib/cn";

const nav = [
  { href: "/admin/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/admin/doctors", label: "Doctors", icon: Stethoscope },
  { href: "/admin/departments", label: "Depts", icon: Building2 },
  { href: "/admin/patients", label: "Patients", icon: Users },
  { href: "/admin/bills", label: "Bills", icon: Receipt },
];

export function AdminMobileNav() {
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