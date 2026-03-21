import { Suspense } from "react";

import { HistoryPageClient } from "@/components/pages/history-page-client";

export default function HistoryPage() {
  return (
    <Suspense fallback={null}>
      <HistoryPageClient />
    </Suspense>
  );
}
