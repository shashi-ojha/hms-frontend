"use client";

import { useEffect, useState } from "react";
import {
  Stethoscope,
  Users,
  Building2,
  CalendarDays,
  IndianRupee,
  AlertCircle,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Topbar } from "@/components/Topbar";
import { StatCard } from "@/components/ui/StatCard";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { getDashboardStats, getAllBills } from "@/lib/api";
import { DashboardResponse } from "@/lib/types";
import { formatCurrency } from "@/lib/format";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [revenueTrend, setRevenueTrend] = useState<{ month: string; revenue: number }[]>([]);
  const [trendLoading, setTrendLoading] = useState(true);

  useEffect(() => {
    getDashboardStats()
      .then(setStats)
      .finally(() => setLoading(false));

    getAllBills(0, 500)
      .then((data) => {
        const paid = data.content.filter((b) => b.status === "PAID");
        const byMonth = new Map<string, number>();

        // Build the last 6 months so the chart always has a consistent shape
        const now = new Date();
        for (let i = 5; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const key = d.toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
          byMonth.set(key, 0);
        }

        paid.forEach((b) => {
          const d = new Date(b.createdAt);
          const key = d.toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
          if (byMonth.has(key)) {
            byMonth.set(key, (byMonth.get(key) || 0) + b.totalAmount);
          }
        });

        setRevenueTrend(
          Array.from(byMonth.entries()).map(([month, revenue]) => ({ month, revenue }))
        );
      })
      .catch(() => setRevenueTrend([]))
      .finally(() => setTrendLoading(false));
  }, []);

  const chartData = stats
    ? [
        { name: "Pending", count: stats.pendingAppointments, fill: "#F59E0B" },
        { name: "Confirmed", count: stats.confirmedAppointments, fill: "#0F9488" },
        { name: "Completed", count: stats.completedAppointments, fill: "#64748B" },
        { name: "Cancelled", count: stats.cancelledAppointments, fill: "#FB7185" },
      ]
    : [];

  return (
    <>
      <Topbar title="Admin Dashboard" subtitle="Hospital-wide overview" profileHref="/admin/dashboard" />

      <div className="space-y-8 px-6 pb-10 lg:px-10">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            icon={Stethoscope}
            label="Total doctors"
            value={loading || !stats ? "—" : String(stats.totalDoctors)}
            tone="teal"
          />
          <StatCard
            icon={Users}
            label="Total patients"
            value={loading || !stats ? "—" : String(stats.totalPatients)}
            tone="violet"
          />
          <StatCard
            icon={Building2}
            label="Departments"
            value={loading || !stats ? "—" : String(stats.totalDepartments)}
            tone="amber"
          />
          <StatCard
            icon={CalendarDays}
            label="Total appointments"
            value={loading || !stats ? "—" : String(stats.totalAppointments)}
            tone="coral"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card className="flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-100 text-brand-700">
              <IndianRupee className="h-5 w-5" />
            </div>
            <div>
              <p className="font-display text-xl font-semibold text-ink-900">
                {loading || !stats ? "—" : formatCurrency(stats.totalRevenue)}
              </p>
              <p className="text-xs text-ink-500">Total revenue collected</p>
            </div>
          </Card>
          <Card className="flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
              <AlertCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="font-display text-xl font-semibold text-ink-900">
                {loading || !stats
                  ? "—"
                  : `${formatCurrency(stats.pendingBillsAmount)} · ${stats.pendingBillsCount} bills`}
              </p>
              <p className="text-xs text-ink-500">Pending payments</p>
            </div>
          </Card>
        </div>

        <Card>
          <h3 className="mb-4 font-display text-base font-semibold text-ink-900">
            Appointments by status
          </h3>
          {loading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12, fill: "#64748B" }}
                    axisLine={{ stroke: "#F1F5F9" }}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 12, fill: "#64748B" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    cursor={{ fill: "#F1F5F9" }}
                    contentStyle={{
                      borderRadius: 12,
                      border: "1px solid #F1F5F9",
                      fontSize: 13,
                    }}
                  />
                  <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={index} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        <Card>
          <h3 className="mb-4 font-display text-base font-semibold text-ink-900">
            Revenue — last 6 months
          </h3>
          {trendLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueTrend} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 12, fill: "#64748B" }}
                    axisLine={{ stroke: "#F1F5F9" }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: "#64748B" }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `₹${v >= 1000 ? `${v / 1000}k` : v}`}
                  />
                  <Tooltip
                    formatter={(value) =>
                      typeof value === "number" ? formatCurrency(value) : ""
                    }
                    contentStyle={{
                      borderRadius: 12,
                      border: "1px solid #F1F5F9",
                      fontSize: 13,
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#0F9488"
                    strokeWidth={2.5}
                    dot={{ fill: "#0F9488", r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </div>
    </>
  );
}