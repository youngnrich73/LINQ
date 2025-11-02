"use client";

import { type ChangeEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, CardContent, CardHeader, CardTitle } from "@linq/ui";
import { useToast } from "../../components/toast-provider";
import { useData } from "../../state/data-context";
import type { RoutinePreset, SuggestionExecution } from "../../state/types";
import type { AuthSession } from "../../lib/auth-types";

const routinePresetOptions: { value: RoutinePreset; label: string; description: string }[] = [
  { value: "monthly-call", label: "Monthly call", description: "Call twice each month." },
  { value: "biweekly-message", label: "Bi-weekly message", description: "Send a quick check-in every other week." },
  { value: "quarterly-check-in", label: "Quarterly check-in", description: "Share a thoughtful note once a quarter." },
];

export function AccountDashboard({ session }: { session: AuthSession }) {
  const { deleteAll, toggleNotifications, settings, updateSettings, people } = useData();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [deviceSummary, setDeviceSummary] = useState("This device");
  const { push } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (typeof window === "undefined") return;
    setDeviceSummary(describeDevice());
  }, []);

  const calendarBadge = useMemo(() => {
    const status = settings.calendarStatus ?? "disconnected";
    if (status === "connected") {
      return <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-300">Connected</span>;
    }
    if (status === "error") {
      return <span className="inline-flex items-center rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">Error</span>;
    }
    return <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">Not connected</span>;
  }, [settings.calendarStatus]);

  const handleNotificationToggle = async (event: ChangeEvent<HTMLInputElement>) => {
    const nextEnabled = await toggleNotifications(event.target.checked);
    push({
      title: nextEnabled ? "D-1 alerts on" : "D-1 alerts off",
      description: nextEnabled
        ? "We’ll remind you a day before each scheduled touch."
        : "Notifications are paused.",
    });
  };

  const handleQuietWeekToggle = async (event: ChangeEvent<HTMLInputElement>) => {
    await updateSettings((prev) => ({ ...prev, quietWeek: event.target.checked }));
    push({
      title: event.target.checked ? "Quiet Week enabled" : "Quiet Week disabled",
      description: event.target.checked
        ? "Suggestions and pings will be softened until you turn this off."
        : "We’ll resume your usual cadence.",
    });
  };

  const handleNotificationTime = async (event: ChangeEvent<HTMLInputElement>) => {
    await updateSettings((prev) => ({ ...prev, notificationTime: event.target.value }));
    push({ title: "Reminder time updated", description: `Next alerts will send around ${event.target.value}.` });
  };

  const handleFavoriteGoalPreset = async (value: number) => {
    await updateSettings((prev) => ({ ...prev, favoriteGoalPerWeek: value }));
    push({ title: "Goal frequency updated", description: `Favorites reset to ${value} touch(es) per week.` });
  };

  const handleRoutinePreset = async (event: ChangeEvent<HTMLSelectElement>) => {
    const preset = event.target.value as RoutinePreset;
    await updateSettings((prev) => ({ ...prev, defaultRoutinePreset: preset }));
    push({ title: "Routine preset saved", description: `New routines will start from the ${event.target.selectedOptions[0]?.text}.` });
  };

  const handleCalendarAction = async () => {
    const nextStatus = settings.calendarStatus === "connected" ? "disconnected" : "connected";
    await updateSettings((prev) => ({ ...prev, calendarStatus: nextStatus }));
    push({
      title: nextStatus === "connected" ? "Calendar linked" : "Calendar disconnected",
      description:
        nextStatus === "connected"
          ? "We’ll sync read-only availability to inform recommendations."
          : "Calendar data will no longer feed suggestions.",
    });
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteAll();
      push({ title: "Data deleted", description: "Your local records were cleared.", variant: "destructive" });
      router.replace("/overview");
    } finally {
      setIsDeleting(false);
      setConfirmDelete(false);
      setConfirmText("");
    }
  };

  const recentExecutions = settings.recentExecutions ?? [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile & session</CardTitle>
          <p className="text-sm text-muted-foreground">Signed in with your email</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-base font-semibold">{session.user.name ?? session.user.email}</p>
              {session.user.email ? <p className="text-sm text-muted-foreground">{session.user.email}</p> : null}
            </div>
            <div className="text-sm text-muted-foreground" aria-label="Current device">{deviceSummary}</div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              variant="secondary"
              className="min-h-[44px] px-4"
              onClick={() =>
                push({
                  title: "Other devices",
                  description: "Sign out from the security dashboard (coming soon).",
                })
              }
              aria-disabled
            >
              Sign out other devices
            </Button>
            <p className="text-xs text-muted-foreground">Cross-device controls arrive once multi-device sync ships.</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Data permissions & sources</CardTitle>
          <p className="text-sm text-muted-foreground">Control which signals inform your radar.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-medium">Google Calendar</p>
              <p className="text-sm text-muted-foreground">Read-only availability improves scheduling suggestions.</p>
            </div>
            <div className="flex items-center gap-3">
              {calendarBadge}
              <Button
                type="button"
                variant={settings.calendarStatus === "connected" ? "outline" : "secondary"}
                className="min-h-[40px] px-3"
                onClick={() => void handleCalendarAction()}
              >
                {settings.calendarStatus === "connected" ? "Disconnect" : "Connect"}
              </Button>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 opacity-60">
            <div>
              <p className="font-medium">Contacts sync</p>
              <p className="text-sm text-muted-foreground">Planned: import favorites from Google Contacts.</p>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" disabled aria-disabled /> Allow
            </label>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 opacity-60">
            <div>
              <p className="font-medium">File uploads</p>
              <p className="text-sm text-muted-foreground">Planned: enrich profiles with slides, briefs, and docs.</p>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" disabled aria-disabled /> Allow
            </label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Backup, restore & delete</CardTitle>
          <p className="text-sm text-muted-foreground">Local-first storage lives in your browser.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm">Backups export an encrypted snapshot to your device. Restores replace existing local data.</p>
          <div className="flex flex-wrap gap-3">
            <Button type="button" variant="outline" className="min-h-[40px] px-3" disabled aria-disabled>
              Backup (coming soon)
            </Button>
            <Button type="button" variant="outline" className="min-h-[40px] px-3" disabled aria-disabled>
              Restore (coming soon)
            </Button>
          </div>
          <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4">
            <p className="text-sm font-semibold text-destructive">Delete everything</p>
            <p className="text-xs text-muted-foreground">Removes people, notes, routines, and preferences. This cannot be undone.</p>
            <label className="mt-3 flex items-center gap-2 text-xs text-foreground">
              <input
                type="checkbox"
                checked={confirmDelete}
                onChange={(event) => setConfirmDelete(event.target.checked)}
                aria-label="Confirm permanent deletion"
              />
              I understand this will erase my data.
            </label>
            <label className="mt-3 flex flex-col text-xs text-foreground">
              <span className="font-medium">Type DELETE to confirm</span>
              <input
                value={confirmText}
                onChange={(event) => setConfirmText(event.target.value)}
                placeholder="DELETE"
                inputMode="text"
                className="mt-1 rounded-md border border-border bg-background px-3 py-2 text-sm"
                aria-describedby="delete-instructions"
              />
            </label>
            <p id="delete-instructions" className="mt-2 text-xs text-muted-foreground">
              After deletion, the app reloads to a fresh state.
            </p>
            <Button
              type="button"
              variant="destructive"
              className="mt-3 min-h-[44px] px-4"
              disabled={!confirmDelete || confirmText !== "DELETE" || isDeleting}
              onClick={() => void handleDelete()}
            >
              {isDeleting ? "Deleting…" : "Delete local data"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notifications & Quiet Week</CardTitle>
          <p className="text-sm text-muted-foreground">Fine-tune how often we nudge you.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-medium">D-1 reminders</p>
              <p className="text-sm text-muted-foreground">Requires at least one person in your graph.</p>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={Boolean(settings.notificationsEnabled)}
                onChange={handleNotificationToggle}
                disabled={people.length === 0}
                aria-label="Toggle day-before notifications"
              />
              Enabled
            </label>
          </div>
          <label className="flex flex-col gap-2 text-sm text-foreground">
            Preferred reminder time
            <input
              type="time"
              inputMode="numeric"
              value={settings.notificationTime ?? "09:00"}
              onChange={handleNotificationTime}
              className="w-40 rounded-md border border-border bg-background px-3 py-2"
              aria-label="Preferred reminder time"
            />
          </label>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-medium">Quiet Week</p>
              <p className="text-sm text-muted-foreground">Dials back recommendations when life gets busy.</p>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={Boolean(settings.quietWeek)}
                onChange={handleQuietWeekToggle}
                aria-label="Toggle Quiet Week"
              />
              Enabled
            </label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Goals & routine defaults</CardTitle>
          <p className="text-sm text-muted-foreground">Reset how often you aim to reach out.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="font-medium">Favorite 12 people goal</p>
            <p className="text-sm text-muted-foreground">Choose how many touchpoints per week you expect from top relationships.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {[1, 2, 3, 4].map((value) => (
                <Button
                  key={value}
                  type="button"
                  variant={settings.favoriteGoalPerWeek === value ? "secondary" : "outline"}
                  className="min-h-[40px] px-3"
                  onClick={() => void handleFavoriteGoalPreset(value)}
                >
                  {value} / week
                </Button>
              ))}
            </div>
          </div>
          <div>
            <label className="flex flex-col gap-2 text-sm text-foreground">
              Default routine preset
              <select
                value={settings.defaultRoutinePreset ?? "monthly-call"}
                onChange={handleRoutinePreset}
                className="w-full rounded-md border border-border bg-background px-3 py-2"
                aria-label="Default routine preset"
              >
                {routinePresetOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label} — {option.description}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>How LINQ works</CardTitle>
          <p className="text-sm text-muted-foreground">Data → metrics → recommendations</p>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>We start with the people, notes, and routines you add on this device.</p>
          <p>From there, we calculate relationship health scores—recency, frequency, responsiveness, and more.</p>
          <p>Finally, we surface the next five nudges and schedule D-1 reminders so nothing slips.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent actions</CardTitle>
          <p className="text-sm text-muted-foreground">Your last ten recommendation runs.</p>
        </CardHeader>
        <CardContent>
          {recentExecutions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No history yet—complete a touch or apply a suggestion to see it here.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {recentExecutions.map((entry: SuggestionExecution) => (
                <li key={entry.id} className="rounded-md border border-border bg-card/40 px-3 py-2">
                  <p className="font-medium text-foreground">{entry.action}</p>
                  <p className="text-xs text-muted-foreground">
                    {entry.personName ? `${entry.personName} · ` : ""}
                    {new Date(entry.executedAt).toLocaleString()}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function describeDevice() {
  const { userAgent, platform, language } = window.navigator;
  const browserMatch = userAgent.match(/(Edg|Chrome|Safari|Firefox|Opera|Brave|CriOS)\/[\d.]+/);
  const browser = browserMatch ? browserMatch[0].replace("/", " ") : "Browser";
  return `${platform ?? "Device"} · ${browser} · ${language}`;
}
