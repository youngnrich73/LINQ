"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";
import { Button } from "@linq/ui";

function validateEmail(value: string) {
  return /.+@.+\..+/.test(value);
}

export function LoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "submitting" | "sent">("idle");

  const callbackUrl = searchParams.get("callbackUrl") ?? "/overview";

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (status === "submitting") return;

    if (!validateEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    setStatus("submitting");
    setError(null);

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, callbackUrl })
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      setError(payload.error ?? "Unable to send magic link. Please try again.");
      setStatus("idle");
      return;
    }

    setStatus("sent");
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-muted/40 px-4 py-12">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-8 shadow-sm">
        <h1 className="text-2xl font-semibold">Log in</h1>
        {status === "sent" ? (
          <div className="mt-6 space-y-4 text-sm text-muted-foreground">
            <p>We sent a magic link to {email}. Check your inbox to finish signing in.</p>
            <Button type="button" variant="secondary" className="w-full" onClick={() => router.push("/overview")}>
              Return to overview
            </Button>
          </div>
        ) : (
          <form className="mt-6 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-foreground">
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            </div>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <Button type="submit" className="w-full" disabled={status === "submitting"}>
              {status === "submitting" ? "Sending magic link..." : "Send magic link"}
            </Button>
          </form>
        )}
        <p className="mt-6 text-center text-xs text-muted-foreground">
          Having trouble? Contact support or <Link className="underline" href="/">go back</Link>.
        </p>
      </div>
    </main>
  );
}
