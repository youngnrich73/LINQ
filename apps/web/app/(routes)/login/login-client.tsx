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
      setError("올바른 이메일 주소를 입력해 주세요.");
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
      setError(payload.error ?? "로그인 링크를 보낼 수 없어요. 다시 시도해 주세요.");
      setStatus("idle");
      return;
    }

    setStatus("sent");
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-muted/40 px-4 py-12">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-8 shadow-sm">
        <h1 className="text-2xl font-semibold">로그인</h1>
        {status === "sent" ? (
          <div className="mt-6 space-y-4 text-sm text-muted-foreground">
            <p>{email} 주소로 로그인 링크를 보냈어요. 받은 편지함을 확인해 마무리하세요.</p>
            <Button type="button" variant="secondary" className="w-full" onClick={() => router.push("/overview")}> 
              요약으로 돌아가기
            </Button>
          </div>
        ) : (
          <form className="mt-6 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-foreground">
                이메일 주소
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
              {status === "submitting" ? "로그인 링크 전송 중…" : "로그인 링크 보내기"}
            </Button>
          </form>
        )}
        <p className="mt-6 text-center text-xs text-muted-foreground">
          문제가 있나요? 지원팀에 문의하거나 <Link className="underline" href="/">돌아가기</Link>를 눌러 주세요.
        </p>
      </div>
    </main>
  );
}
