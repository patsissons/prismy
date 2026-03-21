import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

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
