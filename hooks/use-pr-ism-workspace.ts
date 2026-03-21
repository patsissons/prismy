"use client";

import { useCallback } from "react";

import { useLocalStorageState } from "@/hooks/use-local-storage-state";
import { syncRepository } from "@/lib/github";
import { loadRepositories, loadSettings, saveRepositories, saveSettings } from "@/lib/storage";
import type { AppSettings, RepositoryConnection } from "@/lib/types";
import { parseGitHubUrl } from "@/lib/utils";

export function usePrIsmWorkspace() {
  const [repositories, setRepositories, repositoriesReady] = useLocalStorageState(loadRepositories, saveRepositories);
  const [settings, setSettings, settingsReady] = useLocalStorageState(loadSettings, saveSettings);

  const addRepository = useCallback((url: string) => {
    const parsed = parseGitHubUrl(url);
    if (!parsed) {
      throw new Error("Enter a valid GitHub repository URL.");
    }

    setRepositories((current) => {
      if (current.some((repository) => repository.id === parsed.fullName)) {
        throw new Error("Repository already connected.");
      }

      return [
        {
          id: parsed.fullName,
          owner: parsed.owner,
          name: parsed.name,
          url: parsed.url,
          addedAt: new Date().toISOString(),
          lastSyncedAt: null,
          pullRequests: [],
          syncStatus: "idle",
          syncError: null
        },
        ...current
      ];
    });
  }, [setRepositories]);

  const removeRepository = useCallback((id: string) => {
    setRepositories((current) => current.filter((repository) => repository.id !== id));
  }, [setRepositories]);

  const updateSettings = useCallback((updates: Partial<AppSettings>) => {
    setSettings((current) => ({
      ...current,
      ...updates,
      alerts: {
        ...current.alerts,
        ...updates.alerts
      }
    }));
  }, [setSettings]);

  const syncRepositoryById = useCallback(async (id: string) => {
    const repository = repositories.find((candidate) => candidate.id === id);
    if (!repository) {
      throw new Error("Repository connection not found.");
    }

    setRepositories((current) =>
      current.map((candidate) =>
        candidate.id === id
          ? {
              ...candidate,
              syncStatus: "syncing",
              syncError: null
            }
          : candidate
      )
    );

    try {
      const pullRequests = await syncRepository(repository, settings.authToken);

      setRepositories((current) =>
        current.map((candidate) =>
          candidate.id === id
            ? {
                ...candidate,
                pullRequests,
                lastSyncedAt: new Date().toISOString(),
                syncStatus: "idle",
                syncError: null
              }
            : candidate
        )
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Sync failed.";

      setRepositories((current) =>
        current.map((candidate) =>
          candidate.id === id
            ? {
                ...candidate,
                syncStatus: "error",
                syncError: message
              }
            : candidate
        )
      );

      throw error;
    }
  }, [repositories, settings.authToken, setRepositories]);

  return {
    repositories,
    settings,
    ready: repositoriesReady && settingsReady,
    addRepository,
    removeRepository,
    updateSettings,
    syncRepositoryById
  };
}
