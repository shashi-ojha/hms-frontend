import { CalendarCheck2, HeartPulse, ShieldCheck } from "lucide-react";

const points = [
  {
    icon: CalendarCheck2,
    title: "Book in under a minute",
    desc: "Find the right specialist and grab a slot that fits your day.",
  },
  {
    icon: HeartPulse,
    title: "Your history, always on hand",
    desc: "Diagnoses, prescriptions and bills in one clean timeline.",
  },
  {
    icon: ShieldCheck,
    title: "Private by design",
    desc: "Only you and your care team ever see your records.",
  },
];

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[1.05fr_1fr]">
      {/* Left — brand panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-brand-800 p-12 text-white lg:flex">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.15]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, white 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />
        <div
          className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(245,158,11,0.35), transparent 70%)",
          }}
        />
        <div
          className="pointer-events-none absolute -bottom-32 left-0 h-96 w-96 rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(251,113,133,0.25), transparent 70%)",
          }}
        />

        <div className="relative z-10 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15">
            <HeartPulse className="h-5 w-5" />
          </div>
          <span className="font-display text-lg font-semibold tracking-tight">
            MedCare
          </span>
        </div>

        <div className="relative z-10 max-w-md">
          <h1 className="font-display text-4xl font-semibold leading-[1.15] tracking-tight">
            Healthcare that fits around your life.
          </h1>
          <p className="mt-4 text-brand-100">
            One portal for appointments, records and billing — built for
            patients who don&apos;t have time to chase paperwork.
          </p>

          <div className="mt-10 space-y-5">
            {points.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-start gap-3.5">
                <div className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-white/10">
                  <Icon className="h-4.5 w-4.5" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{title}</p>
                  <p className="text-sm text-brand-100/90">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-xs text-brand-200/70">
          © {new Date().getFullYear()} MedCare Hospital Management System
        </p>
      </div>

      {/* Right — form panel */}
      <div className="flex items-center justify-center bg-[#F7FAF9] px-6 py-12">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}