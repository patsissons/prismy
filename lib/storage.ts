import type { AppSettings, RepositoryConnection } from "@/lib/types";

const REPOSITORIES_KEY = "pr-ismy.repositories";
const SETTINGS_KEY = "pr-ismy.settings";
const LAST_SELECTED_REPOSITORY_KEY = "pr-ismy.last-selected-repository";

export const defaultSettings: AppSettings = {
  authToken: "",
  defaultRange: "30d",
  alerts: {
    weeklyDigest: true,
    slackIntegration: false,
    syncFailures: true
  }
};

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") {
    return fallback;
  }

  const raw = window.localStorage.getItem(key);
  if (!raw) {
    return fallback;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function loadRepositories() {
  return readJson<RepositoryConnection[]>(REPOSITORIES_KEY, []);
}

export function saveRepositories(repositories: RepositoryConnection[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(REPOSITORIES_KEY, JSON.stringify(repositories));
}

export function loadSettings() {
  return {
    ...defaultSettings,
    ...readJson<AppSettings>(SETTINGS_KEY, defaultSettings)
  };
}

export function saveSettings(settings: AppSettings) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function loadLastSelectedRepositoryId() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(LAST_SELECTED_REPOSITORY_KEY);
}

export function saveLastSelectedRepositoryId(repositoryId: string | null) {
  if (typeof window === "undefined") {
    return;
  }

  if (!repositoryId) {
    window.localStorage.removeItem(LAST_SELECTED_REPOSITORY_KEY);
    return;
  }

  window.localStorage.setItem(LAST_SELECTED_REPOSITORY_KEY, repositoryId);
}
