"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@linq/ui";
import { useToast } from "./toast-provider";
import { useAuth } from "../state/auth-context";

export function Header() {
  const { session, status, login, logout } = useAuth();
  const { push } = useToast();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const avatarButtonRef = useRef<HTMLButtonElement | null>(null);

  const initials = useMemo(() => {
    const name = session?.user?.name ?? session?.user?.email ?? "";
    return name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("");
  }, [session?.user?.email, session?.user?.name]);

  useEffect(() => {
    if (!menuOpen) return;
    function onPointer(event: MouseEvent) {
      if (!menuRef.current) return;
      if (
        !menuRef.current.contains(event.target as Node) &&
        !avatarButtonRef.current?.contains(event.target as Node)
      ) {
        setMenuOpen(false);
      }
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    }
    window.addEventListener("mousedown", onPointer);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onPointer);
      window.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  const handleLogin = () => {
    try {
      login("/overview");
    } catch (error) {
      push({
        title: "Sign-in unavailable",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleLogout = async () => {
    setMenuOpen(false);
    await logout("/overview");
  };

  return (
    <header className="flex h-16 items-center justify-between border-b bg-card/80 px-6 backdrop-blur">
      <div>
        <h1 className="text-lg font-semibold">LINQ Relationship OS</h1>
        <p className="text-sm text-muted-foreground">Build stronger relationships with focused nudges.</p>
      </div>
      {status === "authenticated" && session?.user ? (
        <div className="relative flex items-center">
          <button
            ref={avatarButtonRef}
            type="button"
            className="h-11 w-11 min-h-[44px] min-w-[44px] rounded-full border border-border bg-card/60 text-sm font-medium text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            aria-label="Account menu"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {session.user.image ? (
              <Image
                src={session.user.image}
                alt={session.user.name ?? session.user.email ?? "User avatar"}
                width={44}
                height={44}
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              <span aria-hidden className="inline-flex h-full w-full items-center justify-center">
                {initials || "ME"}
              </span>
            )}
          </button>
          {menuOpen ? (
            <div
              ref={menuRef}
              role="menu"
              aria-label="Account actions"
              className="absolute right-0 top-14 z-40 w-48 rounded-lg border border-border bg-popover p-1 shadow-lg"
            >
              <button
                type="button"
                role="menuitem"
                className="flex w-full items-center justify-between rounded-md px-3 py-2 text-sm text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                onClick={() => {
                  setMenuOpen(false);
                  router.push("/account");
                }}
              >
                My Page
              </button>
              <button
                type="button"
                role="menuitem"
                className="flex w-full items-center justify-between rounded-md px-3 py-2 text-sm text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                onClick={() => void handleLogout()}
              >
                Log out
              </button>
            </div>
          ) : null}
        </div>
      ) : (
        <Button
          type="button"
          variant="secondary"
          className="h-11 min-h-[44px] min-w-[44px] px-4"
          onClick={handleLogin}
        >
          Log in
        </Button>
      )}
    </header>
  );
}
