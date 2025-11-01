import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@linq/ui";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Workspace preferences</CardTitle>
          <p className="text-sm text-muted-foreground">General knobs live here as the product grows.</p>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Account, backup, and notification controls moved to the <Link href="/account" className="text-primary underline">My Page</Link> dashboard.
          </p>
          <p className="text-sm text-muted-foreground">
            Expect more workspace-level settings soon—team sharing, AI assistance, and integration keys.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Privacy map</CardTitle>
          <p className="text-sm text-muted-foreground">A quick look at what LINQ observes.</p>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>Data: people, routines, touchpoints, and notes you add locally.</p>
          <p>Metrics: recency decay, frequency, responsiveness, sentiment, and topic diversity.</p>
          <p>Recommendations: radar states, Top 5 nudges, and optional D-1 reminders.</p>
        </CardContent>
      </Card>
    </div>
  );
}
