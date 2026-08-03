"use client";

import { Topbar } from "@/components/Topbar";
import { AppointmentsOverview } from "@/components/AppointmentsOverview";

export default function AdminAppointmentsPage() {
  return (
    <>
      <Topbar
        title="Appointments"
        subtitle="Every appointment across the hospital"
        profileHref="/admin/dashboard"
      />
      {/* ✅ showDelete=true — admin can delete */}
      <AppointmentsOverview showDelete={true} />
    </>
  );
}
