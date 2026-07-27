"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { HeartPulse, UserPlus } from "lucide-react";
import { AuthShell } from "@/components/AuthShell";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { register, apiErrorMessage } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

export default function RegisterPage() {
  const router = useRouter();
  const { setSession } = useAuth();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirm: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function update(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirm) {
      setError("Passwords don't match.");
      return;
    }
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      const auth = await register({
        name: form.name,
        email: form.email,
        phone: form.phone,
        password: form.password,
        role: "PATIENT",
      });
      setSession(auth);
      router.replace("/dashboard");
    } catch (err) {
      setError(apiErrorMessage(err, "Couldn't create your account. Please try again."));
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
        Create your account
      </h2>
      <p className="mt-1.5 text-sm text-ink-500">
        Takes less than a minute. No paperwork.
      </p>

      <form onSubmit={handleSubmit} className="mt-7 space-y-4">
        <Input
          id="name"
          label="Full name"
          placeholder="Priya Sharma"
          value={form.name}
          onChange={(e) => update("name", e.target.value)}
          required
        />
        <Input
          id="email"
          type="email"
          label="Email"
          placeholder="you@example.com"
          value={form.email}
          onChange={(e) => update("email", e.target.value)}
          required
        />
        <Input
          id="phone"
          type="tel"
          label="Phone number"
          placeholder="9876543210"
          value={form.phone}
          onChange={(e) => update("phone", e.target.value)}
          required
        />
        <div className="grid grid-cols-2 gap-3">
          <Input
            id="password"
            type="password"
            label="Password"
            placeholder="••••••••"
            value={form.password}
            onChange={(e) => update("password", e.target.value)}
            required
          />
          <Input
            id="confirm"
            type="password"
            label="Confirm"
            placeholder="••••••••"
            value={form.confirm}
            onChange={(e) => update("confirm", e.target.value)}
            required
          />
        </div>

        {error && <Alert tone="error">{error}</Alert>}

        <Button type="submit" className="w-full" size="lg" loading={loading}>
          <UserPlus className="h-4 w-4" />
          Create account
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-500">
        Already registered?{" "}
        <Link
          href="/login"
          className="font-semibold text-brand-700 hover:text-brand-800"
        >
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}