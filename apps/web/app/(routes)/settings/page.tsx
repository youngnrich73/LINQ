"use client";

import { useState } from "react";
import { Button, Card, CardContent, CardHeader, CardTitle } from "@linq/ui";
import { useData } from "../../state/data-context";

export default function SettingsPage() {
  const { deleteAll, settings } = useData();
  const [confirmChecked, setConfirmChecked] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    await deleteAll();
    setIsDeleting(false);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Privacy map</CardTitle>
          <p className="text-sm text-muted-foreground">How data flows from your device to insights.</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div>
              <p className="font-semibold">Data</p>
              <ul className="ml-4 list-disc text-muted-foreground">
                <li>People you add (name, group, target frequency)</li>
                <li>Interactions and notes you log</li>
                <li>Routines and scheduled touches</li>
              </ul>
            </div>
            <div>
              <p className="font-semibold">→ Metrics</p>
              <ul className="ml-4 list-disc text-muted-foreground">
                <li>Recency decay (exp(-λ·Δt))</li>
                <li>Frequency in the last 30 / 90 days</li>
                <li>Responsiveness ratio and reply latency</li>
                <li>Valence derived from check-ins and notes</li>
                <li>Topic diversity from tags and routines</li>
              </ul>
            </div>
            <div>
              <p className="font-semibold">→ Recommendations</p>
              <ul className="ml-4 list-disc text-muted-foreground">
                <li>Radar status labels (Warm / Cooling / Cold / Strained)</li>
                <li>Top 5 suggestions with explainable context</li>
                <li>D-1 notifications for the next touch</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Backup & security</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>Encryption: {settings.encryptionSummary ?? "AES-256 at rest (browser IndexedDB)"}</p>
          <p>Stored fields: people, routines, interactions, scheduled touches, settings.</p>
          <p>Everything stays local-first. Export functionality is coming soon.</p>
        </CardContent>
      </Card>

      <Card className="border-destructive/40">
        <CardHeader>
          <CardTitle className="text-destructive">Delete all data</CardTitle>
          <p className="text-sm text-muted-foreground">This removes people, metrics, routines, and settings. The app will restart in onboarding mode.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={confirmChecked}
              onChange={(event) => setConfirmChecked(event.target.checked)}
            />
            <span>I understand this cannot be undone.</span>
          </label>
          <label className="flex flex-col text-sm">
            <span className="font-medium">Type DELETE to confirm</span>
            <input
              value={confirmText}
              onChange={(event) => setConfirmText(event.target.value)}
              className="mt-1 rounded-md border border-border bg-background px-3 py-2"
              placeholder="DELETE"
            />
          </label>
          <Button
            variant="destructive"
            disabled={!confirmChecked || confirmText !== "DELETE" || isDeleting}
            onClick={() => void handleDelete()}
          >
            {isDeleting ? "Deleting…" : "Delete everything"}
          </Button>
          <p className="text-xs text-muted-foreground">
            After deletion, reload the app to go through onboarding again.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
