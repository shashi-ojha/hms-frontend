"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarDays, UserPlus, CalendarPlus, Receipt } from "lucide-react";
import { Topbar } from "@/components/Topbar";
import { StatCard } from "@/components/ui/StatCard";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { searchAllAppointments, getAllBills } from "@/lib/api";

function todayISO() {
  return new Date().toISOString().split("T")[0];
}

export default function ReceptionDashboardPage() {
  const [todayCount, setTodayCount] = useState<number | null>(null);
  const [pendingCount, setPendingCount] = useState<number | null>(null);

  useEffect(() => {
    const today = todayISO();
    searchAllAppointments({ dateFrom: today, dateTo: today, size: 1 })
      .then((data) => setTodayCount(data.totalElements))
      .catch(() => setTodayCount(0));

    getAllBills(0, 200)
      .then((data) =>
        setPendingCount(data.content.filter((b) => b.status === "PENDING").length)
      )
      .catch(() => setPendingCount(0));
  }, []);

  const shortcuts = [
    {
      href: "/reception/register-patient",
      icon: UserPlus,
      title: "Register a patient",
      description: "Set up a login + profile for a walk-in patient",
    },
    {
      href: "/reception/book-appointment",
      icon: CalendarPlus,
      title: "Book an appointment",
      description: "Find a doctor and schedule a visit for a patient",
    },
    {
      href: "/reception/bills",
      icon: Receipt,
      title: "Manage bills",
      description: "Create bills and record payments",
    },
  ];

  return (
    <>
      <Topbar title="Front Desk" subtitle="Reception overview" profileHref="/reception/dashboard" />

      <div className="space-y-8 px-6 pb-10 lg:px-10">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <StatCard
            icon={CalendarDays}
            label="Appointments today"
            value={todayCount === null ? "—" : String(todayCount)}
            tone="teal"
          />
          <StatCard
            icon={Receipt}
            label="Pending bills"
            value={pendingCount === null ? "—" : String(pendingCount)}
            tone="amber"
          />
        </div>

        <div>
          <h2 className="mb-3 font-display text-lg font-semibold text-ink-900">
            Quick actions
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {shortcuts.map(({ href, icon: Icon, title, description }) => (
              <Card key={href} className="flex flex-col gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-ink-900">{title}</p>
                  <p className="mt-1 text-xs text-ink-500">{description}</p>
                </div>
                <Link href={href} className="mt-auto">
                  <Button size="sm" variant="secondary" className="w-full">
                    Go
                  </Button>
                </Link>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}