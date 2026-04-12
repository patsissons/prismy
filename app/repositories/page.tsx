"use client";

import { RepositoriesManager } from "@/components/repositories-manager";
import { usePrIsmyWorkspace } from "@/hooks/use-pr-ismy-workspace";

export default function RepositoriesPage() {
  const { repositories, settings, ready, addRepository, removeRepository, syncRepositoryById, updateSettings } = usePrIsmyWorkspace();

  if (!ready) {
    return null;
  }

  return (
    <RepositoriesManager
      repositories={repositories}
      authToken={settings.authToken}
      defaultRange={settings.defaultRange}
      alerts={settings.alerts}
      onAddRepository={addRepository}
      onRemoveRepository={removeRepository}
      onSyncRepository={syncRepositoryById}
      onUpdateToken={(authToken) => updateSettings({ authToken })}
      onUpdateDefaultRange={(defaultRange) => updateSettings({ defaultRange })}
      onUpdateAlert={(key, value) =>
        updateSettings({
          alerts: {
            ...settings.alerts,
            [key]: value
          }
        })
      }
    />
  );
}
