import { LogOut } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router";
import { githubUserUrl } from "@shared/links";
import type { Viewer } from "@shared/types";
import { GitHubIcon } from "@/components/github-icon";
import { PrismMark } from "@/components/prism-mark";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/** Page frame: brand, the controls row, and the content column. */
export function AppShell({
  viewer,
  onLogout,
  controls,
  children,
}: {
  viewer?: Viewer;
  onLogout?: () => void;
  /** Window selector, sync chip: the one filter row above everything. */
  controls?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="safe-x mx-auto flex min-h-dvh max-w-6xl flex-col pt-5 pb-12 sm:pt-7">
      <header className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <Link
          to="/"
          className="flex items-center gap-2.5 rounded-md text-xl font-semibold tracking-tight focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          <PrismMark className="size-8 text-primary" />
          Prismy
        </Link>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {controls}
          <ThemeToggle />
          {viewer ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                aria-label={`Account: ${viewer.login}`}
                className="inline-flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full border bg-card transition hover:border-primary/50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              >
                <img
                  src={viewer.avatarUrl}
                  alt=""
                  width={32}
                  height={32}
                  className="size-8 rounded-full"
                />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>
                  <div className="font-medium">
                    {viewer.name ?? viewer.login}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    @{viewer.login}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <a
                    href={githubUserUrl(viewer.login)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <GitHubIcon className="size-4" />
                    GitHub profile
                  </a>
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={onLogout}>
                  <LogOut aria-hidden className="size-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
        </div>
      </header>
      <main className="mt-8 flex flex-1 flex-col gap-6 sm:mt-10">
        {children}
      </main>
      <footer className="mt-16 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
        <a
          href="https://github.com/patsissons/prismy"
          className="hover:text-foreground"
        >
          Source on GitHub
        </a>
        <a href="https://lgtm.page" className="hover:text-foreground">
          More on lgtm.page
        </a>
        <span className="ml-auto">Your PR data stays in this browser.</span>
      </footer>
    </div>
  );
}
