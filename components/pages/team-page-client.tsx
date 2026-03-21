"use client";

import { useEffect } from "react";

import { DashboardFilters } from "@/components/dashboard-filters";
import { EmptyDashboard } from "@/components/empty-dashboard";
import { StackedBarChart } from "@/components/stacked-bar-chart";
import { TeamSummary } from "@/components/team-summary";
import { usePrIsmQueryState } from "@/hooks/use-pr-ism-query-state";
import { usePrIsmWorkspace } from "@/hooks/use-pr-ism-workspace";
import { buildStackedSeries, filterRecords, getAvailableUsers, getRepositoryRecords, summarizeUsers } from "@/lib/analytics";

export function TeamPageClient() {
  const { repositories, settings, ready } = usePrIsmWorkspace();
  const { filters, setFilters } = usePrIsmQueryState(settings.defaultRange);

  useEffect(() => {
    if (!ready || !repositories.length || filters.repoId) {
      return;
    }

    setFilters({ repoId: repositories[0].id, metric: "merged" });
  }, [filters.repoId, ready, repositories, setFilters]);

  if (!ready) {
    return null;
  }

  if (!repositories.length) {
    return <EmptyDashboard />;
  }

  const repository = repositories.find((item) => item.id === filters.repoId) ?? repositories[0];
  const allRecords = getRepositoryRecords(repository);
  const availableUsers = getAvailableUsers(allRecords);
  const visibleUsers = filters.users.length
    ? availableUsers.filter((user) => filters.users.includes(user.login))
    : availableUsers;
  const filteredRecords = filterRecords(allRecords, filters.range, filters.users);
  const summaries = summarizeUsers(filteredRecords, visibleUsers);
  const stackedSeries = buildStackedSeries(filteredRecords, filters.metric, filters.bucket, visibleUsers, filters.range);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-5xl font-extrabold tracking-[-0.06em]">Team Breakdown</h1>
        <p className="mt-3 max-w-3xl text-xl leading-8 text-muted-foreground">
          Compare contribution volume and merge velocity by PR owner, then isolate any subset of people directly from the URL.
        </p>
      </div>

      <DashboardFilters
        repositories={repositories}
        filters={{ ...filters, repoId: repository.id }}
        availableUsers={availableUsers}
        onChange={setFilters}
      />

      <StackedBarChart
        title="Contribution Mix"
        subtitle="Stacked by owner so team output stays comparable while individual share remains visible."
        data={stackedSeries}
        users={visibleUsers}
        metric={filters.metric}
      />

      <TeamSummary summaries={summaries} />
    </div>
  );
}
