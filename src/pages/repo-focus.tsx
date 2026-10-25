import { ChevronRight, ExternalLink } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, Navigate, useParams } from "react-router";
import { githubPrSearchUrl, githubRepoUrl } from "@shared/links";
import { repoSummary, type RankInfo } from "@shared/metrics/repo";
import { REPO_CAP, REPO_CAP_MAX, REPO_CAP_STEP } from "@shared/sync/engine";
import { repoSource, type Session } from "@shared/types";
import { AppShell } from "@/components/app-shell";
import { CycleCompare } from "@/components/charts/cycle-compare";
import { LeaderboardChart } from "@/components/charts/leaderboard-chart";
import { RepoThroughputChart } from "@/components/charts/repo-throughput-chart";
import { CoverageBanner } from "@/components/coverage-banner";
import { EmptyState } from "@/components/empty-state";
import { PrTable } from "@/components/pr-table";
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
import { useRepoPrs } from "@/hooks/use-records";
import { useSync } from "@/hooks/use-sync";
import { useWindow } from "@/hooks/use-window";
import { useSession } from "@/lib/session";
import {
  cn,
  delta,
  formatCompact,
  formatHours,
  formatInt,
  formatPercent,
} from "@/lib/utils";

/** One repository: you against everyone else who contributed to it. */
export function RepoFocusPage({ session }: { session: Session }) {
  const params = useParams();
  const repo = `${params.owner}/${params.name}`;
  if (!params.owner || !params.name) return <Navigate to="/" replace />;
  return <RepoFocus key={repo} session={session} repo={repo} />;
}

function RepoFocus({ session, repo }: { session: Session; repo: string }) {
  const { logout } = useSession();
  const login = session.viewer.login;
  const db = useMemo(() => openDb(login), [login]);
  const { key, window, now, setKey } = useWindow();
  const source = repoSource(repo);
  const [cap, setCap] = useState<number | undefined>(undefined);
  const sync = useSync({
    db,
    login,
    source,
    from: new Date(window.from),
    now,
    cap,
  });
  const effectiveCap = sync.state?.cap ?? cap ?? REPO_CAP;
  const prs = useRepoPrs(db, repo);
  const summary = useMemo(
    () => (prs ? repoSummary(prs, repo, login, window) : null),
    [prs, repo, login, window],
  );
  const [onlyYou, setOnlyYou] = useState(true);
  const loading = !summary || (prs!.length === 0 && sync.running);
  const stale = sync.running;

  const tablePrs = useMemo(() => {
    if (!prs) return [];
    return prs
      .filter((pr) => !onlyYou || pr.authorLogin === login)
      .filter(
        (pr) =>
          (pr.createdAt >= window.from && pr.createdAt < window.to) ||
          (pr.mergedAt !== null &&
            pr.mergedAt >= window.from &&
            pr.mergedAt < window.to),
      )
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .slice(0, 50);
  }, [prs, onlyYou, login, window]);

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
        <div className="min-w-0">
          <nav
            aria-label="Breadcrumb"
            className="flex items-center gap-1 text-sm text-muted-foreground"
          >
            <Link
              to={key === "90d" ? "/" : `/?window=${key}`}
              className="hover:text-foreground hover:underline"
            >
              Launchpad
            </Link>
            <ChevronRight aria-hidden className="size-3.5" />
            <span>Repository</span>
          </nav>
          <h1 className="mt-1 flex flex-wrap items-center gap-2 text-2xl font-semibold tracking-tight">
            <span className="break-all">{repo}</span>
            <a
              href={githubRepoUrl(repo)}
              target="_blank"
              rel="noreferrer"
              aria-label={`${repo} on GitHub`}
              className="text-muted-foreground hover:text-foreground"
            >
              <ExternalLink className="size-4" />
            </a>
          </h1>
        </div>
      </div>

      {sync.authExpired ? (
        <EmptyState title="Your GitHub session expired">
          <a href="/api/auth/login" className="underline">
            Sign in again
          </a>
        </EmptyState>
      ) : null}

      <CoverageBanner
        state={sync.state}
        windowFrom={window.from}
        canLoadMore={effectiveCap < REPO_CAP_MAX}
        onLoadMore={() =>
          setCap(Math.min(REPO_CAP_MAX, effectiveCap + REPO_CAP_STEP))
        }
      />

      {loading || !summary ? (
        <RepoSkeleton />
      ) : summary.everyone.opened === 0 &&
        summary.everyone.merged === 0 &&
        !sync.running ? (
        <EmptyState title="No pull requests in this window">
          {sync.error
            ? sync.error
            : "Widen the window above, or check the repository name."}
        </EmptyState>
      ) : (
        <>
          <section
            className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
            aria-label="You against the repository"
          >
            <StatTile
              label="Merged pull requests"
              value={formatInt(summary.you.merged)}
              delta={delta(summary.you.merged, summary.priorYou.merged)}
              detail={<Rank info={summary.ranks.merged} format={formatInt} />}
              href={githubPrSearchUrl({
                repo,
                author: login,
                mergedIn: window,
              })}
            />
            <StatTile
              label="Lines changed"
              value={formatCompact(summary.you.lines)}
              delta={delta(summary.you.lines, summary.priorYou.lines)}
              detail={
                <Rank info={summary.ranks.lines} format={formatCompact} />
              }
            />
            <StatTile
              label="Median cycle time"
              value={formatHours(summary.you.medianCycleHours)}
              delta={delta(
                summary.you.medianCycleHours,
                summary.priorYou.medianCycleHours,
              )}
              higherIsBetter={false}
              detail={
                <Rank
                  info={summary.ranks.cycle}
                  format={formatHours}
                  lowerIsBetter
                />
              }
            />
            <StatTile
              label="Share of merged"
              value={formatPercent(
                summary.share,
                summary.share !== null && summary.share < 10 ? 1 : 0,
              )}
              detail={`${formatInt(summary.everyone.merged)} merged by ${formatInt(summary.contributors.filter((c) => c.merged > 0).length)} people`}
              href={githubPrSearchUrl({ repo, mergedIn: window })}
            />
          </section>

          <section
            className="grid items-start gap-4 lg:grid-cols-2"
            aria-label="Contributors and throughput"
          >
            <LeaderboardChart
              contributors={summary.contributors}
              stale={stale}
            />
            <div className="flex flex-col gap-4">
              <RepoThroughputChart weekly={summary.weekly} stale={stale} />
              <CycleCompare
                you={summary.cycle.you}
                others={summary.cycle.others}
                stale={stale}
              />
            </div>
          </section>

          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <CardTitle>Pull requests</CardTitle>
                  <CardDescription>
                    Opened or merged in this window, newest activity first.
                  </CardDescription>
                </div>
                <div
                  role="group"
                  aria-label="Author"
                  className="inline-flex rounded-md border p-0.5"
                >
                  {[
                    { value: true, label: "Yours" },
                    { value: false, label: "Everyone" },
                  ].map((option) => (
                    <button
                      key={option.label}
                      type="button"
                      aria-pressed={onlyYou === option.value}
                      onClick={() => setOnlyYou(option.value)}
                      className={cn(
                        "h-7 cursor-pointer rounded px-2 text-xs font-medium text-muted-foreground transition hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                        onlyYou === option.value && "bg-muted text-foreground",
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <PrTable
                prs={tablePrs}
                now={now}
                showRepo={false}
                showAuthor={!onlyYou}
              />
            </CardContent>
          </Card>
        </>
      )}
    </AppShell>
  );
}

function Rank({
  info,
  format,
  lowerIsBetter = false,
}: {
  info: RankInfo;
  format: (value: number | null) => string;
  lowerIsBetter?: boolean;
}) {
  if (info.rank === null) return <>no merged pull requests</>;
  return (
    <>
      #{info.rank} of {info.count}
      {info.count > 1
        ? `, top ${Math.ceil((info.rank / info.count) * 100)}%`
        : ""}
      {info.median !== null
        ? ` · median ${format(info.median)}${lowerIsBetter ? "" : ""}`
        : ""}
    </>
  );
}

function RepoSkeleton() {
  return (
    <div
      className="flex flex-col gap-4"
      aria-busy="true"
      aria-label="Loading the repository"
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-96 rounded-xl" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    </div>
  );
}
