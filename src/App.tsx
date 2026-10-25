import { Suspense, lazy } from "react";
import { Navigate, Route, Routes } from "react-router";
import { AppShell } from "@/components/app-shell";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SessionContext, useSession, useSessionState } from "@/lib/session";
import { LandingPage } from "@/pages/landing";

// The signed-in pages carry the chart library; the landing page needn't.
const LaunchpadPage = lazy(() =>
  import("@/pages/launchpad").then((module) => ({
    default: module.LaunchpadPage,
  })),
);
const RepoFocusPage = lazy(() =>
  import("@/pages/repo-focus").then((module) => ({
    default: module.RepoFocusPage,
  })),
);

export default function App() {
  const session = useSessionState();
  return (
    <SessionContext.Provider value={session}>
      <TooltipProvider>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/repo/:owner/:name" element={<Repo />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </TooltipProvider>
    </SessionContext.Provider>
  );
}

function Home() {
  const { state, refresh } = useSession();
  if (state.status === "loading") return <Loading />;
  if (state.status === "error") return <SessionError onRetry={refresh} />;
  if (state.status === "anonymous") return <LandingPage />;
  return (
    <Suspense fallback={<Loading />}>
      <LaunchpadPage session={state.session} />
    </Suspense>
  );
}

function Repo() {
  const { state, refresh } = useSession();
  if (state.status === "loading") return <Loading />;
  if (state.status === "error") return <SessionError onRetry={refresh} />;
  if (state.status === "anonymous") return <Navigate to="/" replace />;
  return (
    <Suspense fallback={<Loading />}>
      <RepoFocusPage session={state.session} />
    </Suspense>
  );
}

function Loading() {
  return (
    <AppShell>
      <div
        aria-busy="true"
        aria-label="Loading"
        className="flex flex-col gap-4"
      >
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    </AppShell>
  );
}

function SessionError({ onRetry }: { onRetry: () => void }) {
  return (
    <AppShell>
      <EmptyState title="Couldn't reach Prismy's server">
        <Button variant="outline" size="sm" className="mt-3" onClick={onRetry}>
          Try again
        </Button>
      </EmptyState>
    </AppShell>
  );
}
