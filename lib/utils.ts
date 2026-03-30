import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

import type { MetricKey, PullRequestState } from "@/lib/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRelativeTime(dateIso: string) {
  const date = new Date(dateIso).getTime();
  const diffHours = Math.round((Date.now() - date) / (1000 * 60 * 60));

  if (diffHours < 1) {
    return "just now";
  }

  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }

  const diffDays = Math.round(diffHours / 24);
  if (diffDays < 7) {
    return `${diffDays}d ago`;
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric"
  }).format(new Date(dateIso));
}

export function formatDurationDays(hours: number) {
  if (!Number.isFinite(hours) || hours <= 0) {
    return "0d";
  }

  const days = hours / 24;
  return `${days.toFixed(days >= 10 ? 0 : 1)}d`;
}

export function initialsFromName(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function parseGitHubUrl(input: string) {
  try {
    const normalized = input.startsWith("http") ? input : `https://${input}`;
    const url = new URL(normalized);
    const [, owner, repo] = url.pathname.replace(/\/+$/, "").split("/");

    if (url.hostname !== "github.com" || !owner || !repo) {
      return null;
    }

    return {
      owner,
      name: repo.replace(/\.git$/, ""),
      fullName: `${owner}/${repo.replace(/\.git$/, "")}`,
      url: `https://github.com/${owner}/${repo.replace(/\.git$/, "")}`
    };
  } catch {
    return null;
  }
}

export function getGitHubRepoUrl(repository: { url: string }) {
  return repository.url.replace(/\/+$/, "");
}

export function getGitHubUserUrl(login: string) {
  return `https://github.com/${login}`;
}

export function getGitHubPullListUrl(
  repository: { url: string },
  options: {
    authorLogin?: string;
    metric?: MetricKey;
    state?: PullRequestState | "inReview";
    window?: { start: Date; end: Date };
  } = {}
) {
  const baseUrl = `${getGitHubRepoUrl(repository)}/pulls`;
  const query = ["is:pr"];

  if (options.authorLogin) {
    query.push(`author:${options.authorLogin}`);
  }

  if (options.state === "merged" || options.metric === "merged" || options.metric === "duration") {
    query.push("is:merged");
  } else if (options.state === "draft") {
    query.push("is:draft");
  } else if (options.state === "open" || options.state === "inReview") {
    query.push("is:open");
  } else if (options.state === "closed") {
    query.push("is:closed");
  }

  if (options.window) {
    query.push(
      getGitHubDateQualifier({
        metric: options.metric,
        state: options.state,
        window: options.window
      })
    );
  }

  const url = new URL(baseUrl);
  url.searchParams.set("q", query.join(" "));
  return url.toString();
}

function getGitHubDateQualifier(options: {
  metric?: MetricKey;
  state?: PullRequestState | "inReview";
  window: { start: Date; end: Date };
}) {
  const start = formatDateOnly(options.window.start);
  const end = formatDateOnly(options.window.end);

  if (options.state === "merged" || options.metric === "merged" || options.metric === "duration") {
    return `merged:${start}..${end}`;
  }

  if (options.state === "closed") {
    return `closed:${start}..${end}`;
  }

  return `created:${start}..${end}`;
}

function formatDateOnly(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}
