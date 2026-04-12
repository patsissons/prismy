"use client";

import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";
import { useState, type ComponentType, type ReactNode } from "react";
import { BarChart3, Bell, FolderKanban, LayoutGrid, PanelLeftClose, PanelLeftOpen, RefreshCcw, Search, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const navigation = [
  { href: "/", label: "Overview", icon: LayoutGrid },
  { href: "/team", label: "Team", icon: Users },
  { href: "/history", label: "History", icon: BarChart3 },
  { href: "/repositories", label: "Repositories", icon: FolderKanban }
] satisfies ReadonlyArray<{ href: Route; label: string; icon: ComponentType<{ className?: string }> }>;

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const title = pathname === "/repositories" ? "Repositories" : "PR-ismy";
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen overflow-x-clip bg-background text-foreground">
      <div className="flex min-h-screen flex-col md:flex-row">
        <aside
          className={cn(
            "hidden shrink-0 border-r border-transparent bg-surface transition-[width] duration-200 md:flex md:flex-col",
            sidebarCollapsed ? "w-[88px]" : "w-[300px]"
          )}
        >
          <div className="border-b border-transparent px-8 py-8">
            <div className={cn("flex items-center", sidebarCollapsed ? "justify-center" : "gap-4")}>
              <div className="grid h-12 w-12 place-items-center rounded-sm bg-primary/14 text-primary">
                <span className="font-display text-2xl font-bold tracking-tight">P</span>
              </div>
              {!sidebarCollapsed ? (
                <div>
                  <div className="font-display text-[2rem] font-extrabold tracking-[-0.04em]">PR-ismy</div>
                  <div className="font-body text-xs uppercase tracking-[0.35em] text-muted-foreground">Data Editorial</div>
                </div>
              ) : null}
            </div>
          </div>

          <nav className="flex-1 px-4 py-6">
            <div className="space-y-2">
              {navigation.map((item) => {
                const active = pathname === item.href;
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center rounded-sm px-5 py-4 font-body text-[1.05rem] text-foreground/72 transition hover:bg-surface-low hover:text-foreground",
                      sidebarCollapsed ? "justify-center" : "gap-4",
                      active && "bg-surface-low text-foreground"
                    )}
                    aria-label={item.label}
                    title={sidebarCollapsed ? item.label : undefined}
                  >
                    <Icon className={cn("h-5 w-5", active && "text-primary")} />
                    {!sidebarCollapsed ? <span>{item.label}</span> : null}
                  </Link>
                );
              })}
            </div>
          </nav>

          {!sidebarCollapsed ? (
            <div className="mt-auto border-t border-transparent px-6 py-5">
              <div className="rounded-sm bg-surface-low p-4">
                <div className="font-display text-lg font-semibold">Local-first analytics</div>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Repository connections and tokens stay in browser storage. Dashboard state rides in the URL.
                </p>
              </div>
            </div>
          ) : null}
        </aside>

        <main className="flex min-h-screen min-w-0 flex-1 flex-col overflow-x-clip">
          <header className="overflow-x-clip border-b border-transparent bg-surface px-4 py-4 md:px-8 md:py-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center justify-between gap-3 md:hidden">
                <div>
                  <div className="font-display text-3xl font-extrabold tracking-[-0.04em]">PR-ismy</div>
                  <div className="font-body text-[11px] uppercase tracking-[0.35em] text-muted-foreground">Data Editorial</div>
                </div>
                <Badge className="bg-primary/12 text-primary">Local state</Badge>
              </div>

              <div className="hidden min-w-0 items-center gap-5 md:flex">
                <button
                  type="button"
                  onClick={() => setSidebarCollapsed((value) => !value)}
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-sm bg-surface-high text-muted-foreground transition hover:text-foreground"
                  aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                  title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                >
                  {sidebarCollapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
                </button>
                <div className="font-display text-[2rem] font-extrabold uppercase tracking-[0.14em]">{title}</div>
                <div className="flex min-w-0 items-center gap-6">
                  {navigation.slice(0, 3).map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "font-body text-xl text-foreground/72 transition hover:text-foreground",
                        pathname === item.href && "text-primary"
                      )}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>

              <div className="flex min-w-0 items-center gap-3">
                <label className="flex min-w-0 flex-1 items-center gap-3 rounded-sm bg-surface-high px-4 py-3 md:min-w-[280px] lg:min-w-[320px]">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <input
                    aria-label="Search data"
                    placeholder="Search repos, authors, PR titles..."
                    className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                  />
                </label>
                <button className="grid h-11 w-11 place-items-center rounded-sm bg-surface-high text-muted-foreground transition hover:text-foreground">
                  <Bell className="h-5 w-5" />
                </button>
                <button className="grid h-11 w-11 place-items-center rounded-sm bg-surface-high text-muted-foreground transition hover:text-foreground">
                  <RefreshCcw className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-4 gap-2 md:hidden">
              {navigation.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex flex-col items-center gap-2 rounded-sm bg-surface-high px-2 py-3 text-center text-[11px] uppercase tracking-[0.18em] text-muted-foreground",
                      active && "bg-primary/12 text-primary"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </header>

          <div className="min-w-0 flex-1 px-4 py-6 md:px-8 md:py-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
