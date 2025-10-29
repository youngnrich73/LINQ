import { Button } from "@linq/ui";

export function Header() {
  return (
    <header className="flex h-16 items-center justify-between border-b bg-card/80 px-6 backdrop-blur">
      <div>
        <h1 className="text-lg font-semibold">LINQ Relationship OS</h1>
        <p className="text-sm text-muted-foreground">Build stronger relationships with focused nudges.</p>
      </div>
      <Button variant="secondary">New Action</Button>
    </header>
  );
}
