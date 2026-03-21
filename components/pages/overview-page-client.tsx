"use client";

import { useEffect } from "react";

import { DashboardFilters } from "@/components/dashboard-filters";
import { EmptyDashboard } from "@/components/empty-dashboard";
import { MetricCards } from "@/components/metric-cards";
import { PriorityReviews } from "@/components/priority-reviews";
import { StackedBarChart } from "@/components/stacked-bar-chart";
import { StatusComposition } from "@/components/status-composition";
import { usePrIsmQueryState } from "@/hooks/use-pr-ism-query-state";
import { usePrIsmWorkspace } from "@/hooks/use-pr-ism-workspace";
import {
  buildStackedSeries,
  filterRecords,
  getAvailableUsers,
  getPriorityReviews,
  getRepositoryRecords,
  getStatusComposition,
  summarizeKpis
} from "@/lib/analytics";

export function OverviewPageClient() {
  const { repositories, settings, ready } = usePrIsmWorkspace();
  const { filters, setFilters } = usePrIsmQueryState(settings.defaultRange);

  useEffect(() => {
    if (!ready || !repositories.length) {
      return;
    }

    const match = repositories.some((repository) => repository.id === filters.repoId);
    if (!filters.repoId || !match) {
      setFilters({ repoId: repositories[0].id });
    }
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
  const kpis = summarizeKpis(filteredRecords);
  const priorityReviews = getPriorityReviews(filteredRecords);
  const status = getStatusComposition(filteredRecords);
  const stackedSeries = buildStackedSeries(filteredRecords, filters.metric, filters.bucket, visibleUsers, filters.range);

  return (
    <div className="space-y-8">
      <MetricCards {...kpis} />

      <DashboardFilters
        repositories={repositories}
        filters={{ ...filters, repoId: repository.id }}
        availableUsers={availableUsers}
        onChange={setFilters}
      />

      <StackedBarChart
        title="Pull Request Velocity"
        subtitle={`Tracking ${filters.metric} volume for ${repository.owner}/${repository.name} across ${filters.range}.`}
        data={stackedSeries}
        users={visibleUsers}
        metric={filters.metric}
      />

      <div className="grid gap-8 xl:grid-cols-[1.2fr_0.9fr]">
        <PriorityReviews items={priorityReviews} />
        <StatusComposition {...status} />
      </div>
    </div>
  );
}
