"use client";

import { useEffect } from "react";

import { DashboardFilters } from "@/components/dashboard-filters";
import { EmptyDashboard } from "@/components/empty-dashboard";
import { MetricCards } from "@/components/metric-cards";
import { PriorityReviews } from "@/components/priority-reviews";
import { StackedBarChart } from "@/components/stacked-bar-chart";
import { StatusComposition } from "@/components/status-composition";
import { usePrIsmyQueryState } from "@/hooks/use-pr-ismy-query-state";
import { usePrIsmyWorkspace } from "@/hooks/use-pr-ismy-workspace";
import {
  buildStackedSeries,
  filterRecords,
  getAvailableUsers,
  getPriorityReviews,
  getRepositoryRecords,
  getStatusComposition,
  getVisibleWindow,
  summarizeUsers,
  summarizeKpis
} from "@/lib/analytics";

export function OverviewPageClient() {
  const { repositories, settings, ready } = usePrIsmyWorkspace();
  const { filters, setFilters, ready: queryReady } = usePrIsmyQueryState(settings.defaultRange);

  useEffect(() => {
    if (!ready || !queryReady || !repositories.length) {
      return;
    }

    const match = repositories.some((repository) => repository.id === filters.repoId);
    if (!filters.repoId || !match) {
      setFilters({ repoId: repositories[0].id });
    }
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
  const previousRecords = filterRecords(allRecords, filters.range, filters.users, filters.offset - 1);
  const kpis = summarizeKpis(filteredRecords);
  const previousKpis = summarizeKpis(previousRecords);
  const priorityReviews = getPriorityReviews(filteredRecords);
  const status = getStatusComposition(filteredRecords);
  const previousStatus = getStatusComposition(previousRecords);
  const stackedSeries = buildStackedSeries(filteredRecords, filters.metric, filters.bucket, visibleUsers, filters.range, filters.offset);

  return (
    <div className="space-y-8">
      <MetricCards current={kpis} previous={previousKpis} repository={repository} timeWindow={visibleWindow} />

      <DashboardFilters
        repositories={repositories}
        filters={{ ...filters, repoId: repository.id }}
        peopleOptions={peopleOptions}
        onChange={setFilters}
      />

      <StackedBarChart
        title="Pull Request Velocity"
        subtitle={`Tracking ${filters.metric} volume for ${repository.owner}/${repository.name} across ${filters.range}.`}
        data={stackedSeries}
        users={visibleUsers}
        metric={filters.metric}
        repository={repository}
        timeWindow={visibleWindow}
      />

      <div className="space-y-8">
        <StatusComposition current={status} previous={previousStatus} repository={repository} timeWindow={visibleWindow} />
        <PriorityReviews items={priorityReviews} repository={repository} timeWindow={visibleWindow} />
      </div>
    </div>
  );
}
