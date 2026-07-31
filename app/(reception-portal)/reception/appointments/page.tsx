"use client";

import { Topbar } from "@/components/Topbar";
import { AppointmentsOverview } from "@/components/AppointmentsOverview";

export default function ReceptionAppointmentsPage() {
  return (
    <>
      <Topbar
        title="Appointments"
        subtitle="Search and filter every appointment"
        profileHref="/reception/dashboard"
      />
      <AppointmentsOverview />
    </>
  );
}