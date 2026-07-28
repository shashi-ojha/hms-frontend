"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, Users, Droplet, CalendarDays, X } from "lucide-react";
import { Topbar } from "@/components/Topbar";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { useAuth } from "@/lib/auth-context";
import { getDoctorAppointments, searchPatients } from "@/lib/api";
import { PatientResponse } from "@/lib/types";
import { formatDate, initials } from "@/lib/format";

interface MyPatient {
  patientId: number;
  patientName: string;
  lastVisitDate: string;
  visitCount: number;
}

export default function PatientsPage() {
  const { doctor } = useAuth();

  // "My Patients" — derived from this doctor's own appointment history
  const [myPatients, setMyPatients] = useState<MyPatient[]>([]);
  const [myPatientsLoading, setMyPatientsLoading] = useState(true);

  // Broader search across all patients
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<PatientResponse[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    async function loadMyPatients() {
      if (!doctor) return;
      setMyPatientsLoading(true);
      try {
        const data = await getDoctorAppointments(doctor.id, 0, 300);
        const map = new Map<number, MyPatient>();
        for (const a of data.content) {
          const existing = map.get(a.patientId);
          if (!existing) {
            map.set(a.patientId, {
              patientId: a.patientId,
              patientName: a.patientName,
              lastVisitDate: a.appointmentDate,
              visitCount: 1,
            });
          } else {
            existing.visitCount += 1;
            if (new Date(a.appointmentDate) > new Date(existing.lastVisitDate)) {
              existing.lastVisitDate = a.appointmentDate;
            }
          }
        }
        setMyPatients(
          [...map.values()].sort(
            (a, b) =>
              new Date(b.lastVisitDate).getTime() -
              new Date(a.lastVisitDate).getTime()
          )
        );
      } catch {
        setMyPatients([]);
      } finally {
        setMyPatientsLoading(false);
      }
    }
    loadMyPatients();
  }, [doctor]);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    setSearched(true);
    try {
      const data = await searchPatients({ name: query, size: 20 });
      setSearchResults(data.content);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }

  function clearSearch() {
    setQuery("");
    setSearched(false);
    setSearchResults([]);
  }

  const isSearchMode = searched;

  return (
    <>
      <Topbar
        title="Patients"
        subtitle={isSearchMode ? "Search results" : "Patients you've consulted"}
        profileHref="/doctor/profile"
      />

      <div className="space-y-6 px-6 pb-10 lg:px-10">
        <form
          onSubmit={handleSearch}
          className="flex gap-3 rounded-2xl border border-ink-100 bg-white p-4 shadow-card"
        >
          <Input
            placeholder="Search any patient by name"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1"
          />
          {isSearchMode && (
            <Button type="button" variant="ghost" onClick={clearSearch}>
              <X className="h-4 w-4" />
              Clear
            </Button>
          )}
          <Button type="submit" loading={searching}>
            <Search className="h-4 w-4" />
            Search
          </Button>
        </form>

        {isSearchMode ? (
          searching ? (
            <PatientGridSkeleton />
          ) : searchResults.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No patients found"
              description="Try a different spelling or a shorter search term."
            />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {searchResults.map((p) => (
                <Link key={p.id} href={`/doctor/patients/${p.id}`}>
                  <Card className="flex items-center gap-3 transition-shadow duration-200 hover:shadow-[0_1px_2px_rgba(15,23,42,0.04),0_16px_36px_-14px_rgba(15,118,110,0.28)]">
                    <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-brand-700 text-sm font-semibold text-white">
                      {initials(p.patientName)}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-ink-900">
                        {p.patientName}
                      </p>
                      <p className="flex items-center gap-1 text-xs text-ink-500">
                        <Droplet className="h-3 w-3" />
                        {p.bloodGroup?.replace("_", " ") || "—"}
                      </p>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )
        ) : myPatientsLoading ? (
          <PatientGridSkeleton />
        ) : myPatients.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No patients yet"
            description="Once you have appointments, the patients you've consulted will show up here."
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {myPatients.map((p) => (
              <Link key={p.patientId} href={`/doctor/patients/${p.patientId}`}>
                <Card className="flex items-center gap-3 transition-shadow duration-200 hover:shadow-[0_1px_2px_rgba(15,23,42,0.04),0_16px_36px_-14px_rgba(15,118,110,0.28)]">
                  <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-brand-700 text-sm font-semibold text-white">
                    {initials(p.patientName)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink-900">
                      {p.patientName}
                    </p>
                    <p className="flex items-center gap-1 text-xs text-ink-500">
                      <CalendarDays className="h-3 w-3" />
                      Last visit {formatDate(p.lastVisitDate)}
                    </p>
                  </div>
                  <Badge tone="teal">{p.visitCount}x</Badge>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function PatientGridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} className="h-20 w-full" />
      ))}
    </div>
  );
}