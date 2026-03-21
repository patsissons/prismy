"use client";

import { RepositoriesManager } from "@/components/repositories-manager";
import { usePrIsmWorkspace } from "@/hooks/use-pr-ism-workspace";

export default function RepositoriesPage() {
  const { repositories, settings, ready, addRepository, removeRepository, syncRepositoryById, updateSettings } = usePrIsmWorkspace();

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
