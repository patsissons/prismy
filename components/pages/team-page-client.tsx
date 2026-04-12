"use client";

import { useEffect } from "react";

import { DashboardFilters } from "@/components/dashboard-filters";
import { EmptyDashboard } from "@/components/empty-dashboard";
import { StackedBarChart } from "@/components/stacked-bar-chart";
import { TeamSummary } from "@/components/team-summary";
import { usePrIsmyQueryState } from "@/hooks/use-pr-ismy-query-state";
import { usePrIsmyWorkspace } from "@/hooks/use-pr-ismy-workspace";
import { buildStackedSeries, filterRecords, getAvailableUsers, getRepositoryRecords, getVisibleWindow, summarizeUsers } from "@/lib/analytics";

export function TeamPageClient() {
  const { repositories, settings, ready } = usePrIsmyWorkspace();
  const { filters, setFilters, ready: queryReady } = usePrIsmyQueryState(settings.defaultRange);

  useEffect(() => {
    if (!ready || !queryReady || !repositories.length || filters.repoId) {
      return;
    }

    setFilters({ repoId: repositories[0].id, metric: "merged" });
  }, [filters.repoId, queryReady, ready, repositories, setFilters]);

  if (!ready || !queryReady) {
    return null;
  }

  if (!repositories.length) {
    return <EmptyDashboard />;
  }

  const repository = repositories.find((item) => item.id === filters.repoId) ?? repositories[0];
  const visibleWindow = getVisibleWindow(filters.range, filters.offset);
  const allRecords = getRepositoryRecords(repository);
  const availableUsers = getAvailableUsers(allRecords);
  const peopleFilterRecords = filterRecords(allRecords, filters.range, [], filters.offset);
  const peopleOptions = summarizeUsers(peopleFilterRecords, availableUsers, filters.metric, filters.peopleSort);
  const visibleUsers = filters.users.length
    ? availableUsers.filter((user) => filters.users.includes(user.login))
    : availableUsers;
  const filteredRecords = filterRecords(allRecords, filters.range, filters.users, filters.offset);
  const summaries = summarizeUsers(filteredRecords, visibleUsers, filters.metric, filters.peopleSort);
  const stackedSeries = buildStackedSeries(filteredRecords, filters.metric, filters.bucket, visibleUsers, filters.range, filters.offset);

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
        peopleOptions={peopleOptions}
        onChange={setFilters}
      />

      <StackedBarChart
        title="Contribution Mix"
        subtitle="Stacked by owner so team output stays comparable while individual share remains visible."
        data={stackedSeries}
        users={visibleUsers}
        metric={filters.metric}
        repository={repository}
        timeWindow={visibleWindow}
      />

      <TeamSummary summaries={summaries} repository={repository} metric={filters.metric} timeWindow={visibleWindow} />
    </div>
  );
}
