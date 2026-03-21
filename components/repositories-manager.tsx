"use client";

import { useState } from "react";
import { Eye, EyeOff, Folder, KeyRound, RefreshCw, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { RangePreset, RepositoryConnection } from "@/lib/types";
import { formatRelativeTime } from "@/lib/utils";

const rangeOptions: { label: string; value: RangePreset }[] = [
  { label: "7 Days", value: "7d" },
  { label: "30 Days", value: "30d" },
  { label: "90 Days", value: "90d" },
  { label: "180 Days", value: "180d" }
];

export function RepositoriesManager({
  repositories,
  authToken,
  defaultRange,
  alerts,
  onAddRepository,
  onRemoveRepository,
  onSyncRepository,
  onUpdateToken,
  onUpdateDefaultRange,
  onUpdateAlert
}: {
  repositories: RepositoryConnection[];
  authToken: string;
  defaultRange: RangePreset;
  alerts: {
    weeklyDigest: boolean;
    slackIntegration: boolean;
    syncFailures: boolean;
  };
  onAddRepository: (url: string) => Promise<void> | void;
  onRemoveRepository: (id: string) => void;
  onSyncRepository: (id: string) => Promise<void>;
  onUpdateToken: (token: string) => void;
  onUpdateDefaultRange: (range: RangePreset) => void;
  onUpdateAlert: (key: "weeklyDigest" | "slackIntegration" | "syncFailures", value: boolean) => void;
}) {
  const [repositoryUrl, setRepositoryUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showToken, setShowToken] = useState(false);

  async function handleConnect(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    try {
      await onAddRepository(repositoryUrl);
      setRepositoryUrl("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to connect repository.");
    }
  }

  return (
    <div className="space-y-10">
      <div className="grid gap-px bg-background/60 xl:grid-cols-[0.95fr_1.4fr]">
        <Card className="p-6 md:p-8">
          <h1 className="font-display text-5xl font-extrabold tracking-[-0.06em]">Add Repository</h1>
          <p className="mt-4 max-w-xl text-xl leading-8 text-muted-foreground">
            Connect GitHub repositories to track PR creation rate, merge throughput, and cycle time analytics.
          </p>
        </Card>

        <Card className="p-6 md:p-8">
          <div className="text-xs uppercase tracking-[0.32em] text-muted-foreground">GitHub Repository URL</div>
          <form className="mt-5 space-y-4" onSubmit={handleConnect}>
            <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
              <Input
                value={repositoryUrl}
                onChange={(event) => setRepositoryUrl(event.target.value)}
                placeholder="https://github.com/org/repo"
              />
              <Button type="submit">Connect</Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Public repos can sync without a token until GitHub rate limits apply. Private repos require a PAT stored below.
            </p>
            {error ? <p className="text-sm text-[#ff716c]">{error}</p> : null}
          </form>
        </Card>
      </div>

      <section>
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-4xl font-extrabold tracking-[-0.05em]">Active Connections</h2>
          <div className="rounded-sm bg-surface-high px-4 py-2 text-xs uppercase tracking-[0.24em] text-foreground">
            {repositories.length} connected
          </div>
        </div>

        <div className="mt-6 space-y-1">
          {repositories.length ? (
            repositories.map((repository) => (
              <RepositoryRow
                key={repository.id}
                repository={repository}
                onRemove={() => onRemoveRepository(repository.id)}
                onSync={() => onSyncRepository(repository.id)}
              />
            ))
          ) : (
            <Card className="p-5 text-muted-foreground">No repositories connected yet.</Card>
          )}
        </div>
      </section>

      <section>
        <h2 className="font-display text-4xl font-extrabold tracking-[-0.05em]">Global Settings</h2>
        <div className="mt-6 grid gap-px bg-background/60 xl:grid-cols-3">
          <Card className="p-6">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.28em] text-muted-foreground">
              <KeyRound className="h-4 w-4 text-primary" />
              Auth Tokens
            </div>
            <label className="mt-6 flex items-center gap-3 rounded-sm bg-surface-high px-4 py-3">
              <input
                type={showToken ? "text" : "password"}
                value={authToken}
                onChange={(event) => onUpdateToken(event.target.value)}
                placeholder="GitHub personal access token"
                className="w-full bg-transparent text-sm outline-none"
              />
              <button type="button" onClick={() => setShowToken((value) => !value)} className="text-muted-foreground">
                {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </label>
            <p className="mt-4 text-sm text-muted-foreground">Stored locally only. Use repo read access for private repositories.</p>
          </Card>

          <Card className="p-6">
            <div className="text-xs uppercase tracking-[0.28em] text-muted-foreground">Default View</div>
            <div className="mt-6 grid grid-cols-2 gap-2">
              {rangeOptions.map((option) => (
                <Button
                  key={option.value}
                  variant={defaultRange === option.value ? "default" : "secondary"}
                  onClick={() => onUpdateDefaultRange(option.value)}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </Card>

          <Card className="space-y-5 p-6">
            <div className="text-xs uppercase tracking-[0.28em] text-muted-foreground">Data Alerts</div>
            <ToggleRow
              label="Weekly digest email"
              checked={alerts.weeklyDigest}
              onChange={(checked) => onUpdateAlert("weeklyDigest", checked)}
            />
            <ToggleRow
              label="Slack integration"
              checked={alerts.slackIntegration}
              onChange={(checked) => onUpdateAlert("slackIntegration", checked)}
            />
            <ToggleRow
              label="Sync failure alerts"
              checked={alerts.syncFailures}
              onChange={(checked) => onUpdateAlert("syncFailures", checked)}
            />
          </Card>
        </div>
      </section>
    </div>
  );
}

function RepositoryRow({
  repository,
  onRemove,
  onSync
}: {
  repository: RepositoryConnection;
  onRemove: () => void;
  onSync: () => Promise<void>;
}) {
  return (
    <Card className="grid gap-5 p-5 md:grid-cols-[auto_1fr_auto] md:items-center">
      <div className="grid h-16 w-16 place-items-center rounded-sm bg-surface-high text-primary">
        <Folder className="h-7 w-7" />
      </div>

      <div>
        <div className="text-3xl font-semibold tracking-[-0.05em]">{repository.name}</div>
        <div className="mt-1 text-base text-muted-foreground">{repository.url.replace("https://", "")}</div>
        {repository.syncError ? <div className="mt-3 text-sm text-[#ff716c]">{repository.syncError}</div> : null}
      </div>

      <div className="flex items-center gap-5 md:justify-end">
        <div className="min-w-[140px] text-right">
          <div className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Last Synced</div>
          <div className="mt-1 text-lg font-semibold">
            {repository.lastSyncedAt ? formatRelativeTime(repository.lastSyncedAt) : "Not synced"}
          </div>
        </div>
        <button
          onClick={onSync}
          disabled={repository.syncStatus === "syncing"}
          className="grid h-11 w-11 place-items-center rounded-sm bg-surface-high text-muted-foreground transition hover:text-foreground disabled:opacity-50"
        >
          <RefreshCw className={`h-5 w-5 ${repository.syncStatus === "syncing" ? "animate-spin" : ""}`} />
        </button>
        <button
          onClick={onRemove}
          className="grid h-11 w-11 place-items-center rounded-sm bg-surface-high text-muted-foreground transition hover:text-[#ff716c]"
        >
          <Trash2 className="h-5 w-5" />
        </button>
      </div>
    </Card>
  );
}

function ToggleRow({
  label,
  checked,
  onChange
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-lg">{label}</span>
      <button
        onClick={() => onChange(!checked)}
        className={`relative h-7 w-12 rounded-sm transition ${checked ? "bg-primary" : "bg-surface-bright"}`}
      >
        <span
          className={`absolute top-1 h-5 w-5 rounded-[2px] bg-white transition ${checked ? "left-6" : "left-1"}`}
        />
      </button>
    </div>
  );
}
