import Link from "next/link";
import { FolderPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function EmptyDashboard() {
  return (
    <Card className="mx-auto max-w-3xl p-8 text-center md:p-12">
      <div className="mx-auto grid h-16 w-16 place-items-center rounded-sm bg-primary/12 text-primary">
        <FolderPlus className="h-8 w-8" />
      </div>
      <h1 className="mt-6 font-display text-4xl font-extrabold tracking-[-0.05em]">Connect a repository to start analyzing PR flow</h1>
      <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-muted-foreground">
        `pr-ismy` stores repository connections and GitHub tokens in your browser, then drives the dashboard from synced pull
        request history.
      </p>
      <div className="mt-8">
        <Link href="/repositories">
          <Button>Open repository settings</Button>
        </Link>
      </div>
    </Card>
  );
}
