"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { HeartPulse, LogIn } from "lucide-react";
import { AuthShell } from "@/components/AuthShell";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { login, apiErrorMessage } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

export default function LoginPage() {
  const router = useRouter();
  const { setSession } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const auth = await login(email, password);
      if (auth.role === "PATIENT") {
        setSession(auth);
        router.replace("/dashboard");
        return;
      }
      if (auth.role === "DOCTOR") {
        setSession(auth);
        router.replace("/doctor/dashboard");
        return;
      }
      setError(
        "This portal doesn't have a screen for your role yet. Please check back soon."
      );
      setLoading(false);
    } catch (err) {
      setError(apiErrorMessage(err, "Couldn't sign you in. Check your details and try again."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell>
      <div className="mb-8 flex items-center gap-2 lg:hidden">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-700 text-white">
          <HeartPulse className="h-5 w-5" />
        </div>
        <span className="font-display text-lg font-semibold text-ink-900">
          MedCare
        </span>
      </div>

      <h2 className="font-display text-2xl font-semibold text-ink-900">
        Welcome back
      </h2>
      <p className="mt-1.5 text-sm text-ink-500">
        Sign in to manage your appointments and records.
      </p>

      <form onSubmit={handleSubmit} className="mt-7 space-y-4">
        <Input
          id="email"
          type="email"
          label="Email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Input
          id="password"
          type="password"
          label="Password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {error && <Alert tone="error">{error}</Alert>}

        <Button
          type="submit"
          className="w-full"
          size="lg"
          loading={loading}
        >
          <LogIn className="h-4 w-4" />
          Sign in
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-500">
        New here?{" "}
        <Link
          href="/register"
          className="font-semibold text-brand-700 hover:text-brand-800"
        >
          Create a patient account
        </Link>
      </p>
    </AuthShell>
  );
}