import { GitPullRequestArrow, Lock, Scale, Timer } from "lucide-react";
import { useState } from "react";
import { useSearchParams } from "react-router";
import type { OAuthScope } from "@shared/types";
import { AppShell } from "@/components/app-shell";
import { GitHubIcon } from "@/components/github-icon";
import { PrismMark } from "@/components/prism-mark";
import { Button } from "@/components/ui/button";
import { loginUrl } from "@/lib/session";
import { cn } from "@/lib/utils";

const ERRORS: Record<string, string> = {
  auth: "GitHub didn't finish signing you in. Try again.",
  state: "The sign-in link expired. Try again.",
  exchange: "GitHub rejected the sign-in. Try again.",
  access_denied: "You cancelled the GitHub authorization.",
};

const FEATURES = [
  {
    Icon: GitPullRequestArrow,
    title: "Throughput",
    text: "Pull requests opened and merged per week, across every repo you touch, with the trend against the prior period.",
  },
  {
    Icon: Scale,
    title: "Code volume",
    text: "Lines added and deleted, files touched, and how your pull requests size up.",
  },
  {
    Icon: Timer,
    title: "Cycle time",
    text: "How long your work takes to land, and how that compares with everyone else on a repo.",
  },
];

export function LandingPage() {
  const [params] = useSearchParams();
  const [scope, setScope] = useState<OAuthScope>("public");
  const error = params.get("error");

  return (
    <AppShell>
      <section className="grid items-center gap-10 py-6 lg:grid-cols-[1.1fr_1fr] lg:gap-16 lg:py-12">
        <div>
          <PrismMark className="size-16 text-primary" />
          <h1 className="mt-6 text-4xl font-bold tracking-tight text-balance sm:text-5xl">
            See your impact through pull requests.
          </h1>
          <p className="mt-4 max-w-xl text-lg text-pretty text-muted-foreground">
            Prismy signs in with your GitHub account, gathers your pull requests
            across every repository you contribute to, and turns them into
            throughput, code volume and cycle time you can act on. Focus a
            repository to see how you compare with its other contributors.
          </p>
        </div>

        <form
          method="get"
          action="/api/auth/login"
          className="rounded-2xl border bg-card p-6 shadow-sm"
          aria-labelledby="signin-title"
        >
          <h2 id="signin-title" className="text-lg font-semibold">
            Connect GitHub
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Choose what Prismy may read.
          </p>
          <fieldset className="mt-4 space-y-2">
            <legend className="sr-only">Repository access</legend>
            <ScopeOption
              checked={scope === "public"}
              onChange={() => setScope("public")}
              title="Public repositories only"
              text="Your profile and public activity. Nothing else."
            />
            <ScopeOption
              checked={scope === "private"}
              onChange={() => setScope("private")}
              title="Include private repositories"
              text="Adds GitHub's repo scope so work in private repositories counts too."
            />
          </fieldset>
          {error ? (
            <p role="alert" className="mt-4 text-sm text-destructive">
              {ERRORS[error] ?? "Sign-in failed. Try again."}
            </p>
          ) : null}
          <Button asChild size="lg" className="mt-5 w-full">
            <a href={loginUrl(scope)}>
              <GitHubIcon className="size-4" />
              Continue with GitHub
            </a>
          </Button>
          <p className="mt-4 flex items-start gap-2 text-xs text-muted-foreground">
            <Lock aria-hidden className="mt-0.5 size-3.5 shrink-0" />
            <span>
              Your token lives in an encrypted, HttpOnly cookie and is never
              visible to this page. Pull request data is cached only in this
              browser. Signing out revokes the token.
            </span>
          </p>
        </form>
      </section>

      <section className="grid gap-4 sm:grid-cols-3" aria-label="What you get">
        {FEATURES.map((feature) => (
          <div key={feature.title} className="rounded-xl border bg-card p-5">
            <feature.Icon aria-hidden className="size-5 text-primary" />
            <h3 className="mt-3 font-semibold">{feature.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{feature.text}</p>
          </div>
        ))}
      </section>
    </AppShell>
  );
}

function ScopeOption({
  checked,
  onChange,
  title,
  text,
}: {
  checked: boolean;
  onChange: () => void;
  title: string;
  text: string;
}) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition has-focus-visible:ring-2 has-focus-visible:ring-ring",
        checked ? "border-primary bg-primary/5" : "hover:border-primary/40",
      )}
    >
      <input
        type="radio"
        name="scope"
        checked={checked}
        onChange={onChange}
        className="mt-1 accent-(--primary)"
      />
      <span>
        <span className="block text-sm font-medium">{title}</span>
        <span className="block text-xs text-muted-foreground">{text}</span>
      </span>
    </label>
  );
}
