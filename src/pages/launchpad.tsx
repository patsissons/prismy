import { useMemo } from "react";
import { githubPrSearchUrl } from "@shared/links";
import { launchpadSummary } from "@shared/metrics/launchpad";
import { cycleHours } from "@shared/metrics/pr";
import type { Session } from "@shared/types";
import { AppShell } from "@/components/app-shell";
import { HistogramChart } from "@/components/charts/histogram-chart";
import { LinesChart } from "@/components/charts/lines-chart";
import { ThroughputChart } from "@/components/charts/throughput-chart";
import { CoverageBanner } from "@/components/coverage-banner";
import { EmptyState } from "@/components/empty-state";
import { PrTable } from "@/components/pr-table";
import { ReposTable } from "@/components/repos-table";
import { StatTile } from "@/components/stat-tile";
import { SyncChip } from "@/components/sync-chip";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { WindowSelect } from "@/components/window-select";
import { openDb } from "@/db/schema";
import { useAuthoredPrs } from "@/hooks/use-records";
import { useSync } from "@/hooks/use-sync";
import { useWindow } from "@/hooks/use-window";
import { useSession } from "@/lib/session";
import {
  delta,
  formatCompact,
  formatDate,
  formatHours,
  formatInt,
  formatPercent,
  formatRelative,
} from "@/lib/utils";

/** Your impact across every repository, for the selected window. */
export function LaunchpadPage({ session }: { session: Session }) {
  const { logout } = useSession();
  const login = session.viewer.login;
  const db = useMemo(() => openDb(login), [login]);
  const { key, window, now, setKey } = useWindow();
  const sync = useSync({
    db,
    login,
    source: "authored",
    from: new Date(window.from),
    now,
  });
  const prs = useAuthoredPrs(db, login);
  const summary = useMemo(
    () => (prs ? launchpadSummary(prs, login, window) : null),
    [prs, login, window],
  );
  const loading = !summary || (prs!.length === 0 && sync.running);
  const stale = sync.running;
  const k = summary?.kpis;
  const p = summary?.priorKpis;

  return (
    <AppShell
      viewer={session.viewer}
      onLogout={logout}
      controls={
        <>
          <WindowSelect value={key} onChange={setKey} />
          <SyncChip sync={sync} now={now} />
        </>
      }
    >
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Your impact</h1>
          <p className="text-sm text-muted-foreground">
            {formatDate(window.from)} to {formatDate(window.to)}, compared with
            the previous {key === "365d" ? "year" : key.replace("d", " days")}.
          </p>
        </div>
        {session.scope === "public" ? (
          <p className="text-xs text-muted-foreground">
            Public repositories only.{" "}
            <a
              href="/api/auth/login?scope=private"
              className="underline hover:text-foreground"
            >
              Include private
            </a>
          </p>
        ) : null}
      </div>

      {sync.authExpired ? (
        <EmptyState title="Your GitHub session expired">
          <a href="/api/auth/login" className="underline">
            Sign in again
          </a>
        </EmptyState>
      ) : null}

      <CoverageBanner state={sync.state} windowFrom={window.from} />

      {loading || !summary || !k || !p ? (
        <LaunchpadSkeleton />
      ) : k.opened === 0 && k.merged === 0 && !sync.running ? (
        <EmptyState title="No pull requests in this window">
          Widen the window above, or include private repositories when signing
          in.
        </EmptyState>
      ) : (
        <>
          <section
            className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
            aria-label="Headline numbers"
          >
            <StatTile
              label="Merged pull requests"
              value={formatInt(k.merged)}
              delta={delta(k.merged, p.merged)}
              detail={`${formatInt(k.opened)} opened`}
              href={githubPrSearchUrl({ author: login, mergedIn: window })}
            />
            <StatTile
              label="Merge rate"
              value={formatPercent(k.mergeRate)}
              delta={delta(k.mergeRate, p.mergeRate)}
              detail={
                k.declined
                  ? `${formatInt(k.declined)} closed unmerged`
                  : "nothing closed unmerged"
              }
              href={githubPrSearchUrl({
                author: login,
                state: "closed",
                createdIn: window,
              })}
            />
            <StatTile
              label="Median cycle time"
              value={formatHours(k.medianCycleHours)}
              delta={delta(k.medianCycleHours, p.medianCycleHours)}
              higherIsBetter={false}
              detail={
                k.p75CycleHours !== null
                  ? `p75 ${formatHours(k.p75CycleHours)}`
                  : undefined
              }
            />
            <StatTile
              label="Lines changed"
              value={formatCompact(k.lines)}
              delta={delta(k.lines, p.lines)}
              detail={`+${formatCompact(k.additions)} −${formatCompact(k.deletions)} in ${formatInt(k.changedFiles)} files`}
            />
          </section>

          <section
            className="grid gap-4 lg:grid-cols-[3fr_2fr]"
            aria-label="Throughput and cycle time"
          >
            <ThroughputChart summary={summary} stale={stale} />
            <HistogramChart
              title="Cycle time"
              description={`Open to merge, ${formatInt(k.merged)} merged pull requests; median ${formatHours(k.medianCycleHours)}`}
              bucketLabel="Duration"
              data={summary.cycleHistogram}
              stale={stale}
            />
          </section>

          <section
            className="grid gap-4 lg:grid-cols-[3fr_2fr]"
            aria-label="Code volume"
          >
            <LinesChart activity={summary.activity} stale={stale} />
            <HistogramChart
              title="Pull request size"
              description={`Lines changed per merged pull request; median ${formatCompact(k.medianLines)}`}
              bucketLabel="Size"
              data={summary.sizeDistribution}
              stale={stale}
            />
          </section>

          <section
            className="grid gap-4 lg:grid-cols-[3fr_2fr]"
            aria-label="Repositories"
          >
            <Card>
              <CardHeader>
                <CardTitle>Repositories</CardTitle>
                <CardDescription>
                  Where your merged pull requests landed. Open one to compare
                  with its contributors.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ReposTable rows={summary.repos} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Open the longest</CardTitle>
                <CardDescription>
                  {k.openNow} open now
                  {k.draftNow ? `, ${k.draftNow} drafts` : ""}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {summary.longestOpen.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Nothing open. Nice.
                  </p>
                ) : (
                  <ul className="divide-y">
                    {summary.longestOpen.map((pr) => (
                      <li
                        key={pr.id}
                        className="flex items-center justify-between gap-3 py-2 text-sm"
                      >
                        <a
                          href={pr.url}
                          target="_blank"
                          rel="noreferrer"
                          className="min-w-0 truncate hover:underline"
                        >
                          <span className="font-medium">{pr.title}</span>
                          <span className="block truncate text-xs text-muted-foreground">
                            {pr.repo} #{pr.number}
                          </span>
                        </a>
                        <span
                          className="tabular shrink-0 text-muted-foreground"
                          title={`opened ${formatRelative(pr.createdAt, now)}`}
                        >
                          {formatHours(
                            cycleHours({ ...pr, mergedAt: now.toISOString() }),
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </section>

          <Card>
            <CardHeader>
              <CardTitle>Recent pull requests</CardTitle>
              <CardDescription>
                Opened or merged in this window, newest activity first.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PrTable prs={summary.recent} now={now} />
            </CardContent>
          </Card>
        </>
      )}
    </AppShell>
  );
}

function LaunchpadSkeleton() {
  return (
    <div
      className="flex flex-col gap-4"
      aria-busy="true"
      aria-label="Loading your pull requests"
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-[3fr_2fr]">
        <Skeleton className="h-72 rounded-xl" />
        <Skeleton className="h-72 rounded-xl" />
      </div>
      <Skeleton className="h-64 rounded-xl" />
    </div>
  );
}
