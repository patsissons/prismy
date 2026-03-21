import { Suspense } from "react";

import { TeamPageClient } from "@/components/pages/team-page-client";

export default function TeamPage() {
  return (
    <Suspense fallback={null}>
      <TeamPageClient />
    </Suspense>
  );
}
