import { ChevronRight, Lock } from "lucide-react";
import { Link } from "react-router";
import type { RepoRow } from "@shared/metrics/launchpad";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCompact, formatHours, formatPercent } from "@/lib/utils";

/** Repos ranked by the user's merged PRs; each row opens the repo focus. */
export function ReposTable({ rows }: { rows: RepoRow[] }) {
  if (rows.length === 0) {
    return (
      <p className="px-1 py-6 text-sm text-muted-foreground">
        No repositories in this window.
      </p>
    );
  }
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Repository</TableHead>
            <TableHead className="text-right">Merged</TableHead>
            <TableHead className="text-right">Opened</TableHead>
            <TableHead className="text-right">Lines</TableHead>
            <TableHead className="text-right">Median cycle</TableHead>
            <TableHead className="text-right">Share</TableHead>
            <TableHead className="w-8" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.repo} className="relative">
              <TableCell className="font-medium">
                <Link
                  to={`/repo/${row.repo}`}
                  className="inline-flex items-center gap-1.5 after:absolute after:inset-0 hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                >
                  {row.repo}
                  {row.isPrivate ? (
                    <Lock
                      aria-label="private"
                      className="size-3 text-muted-foreground"
                    />
                  ) : null}
                </Link>
              </TableCell>
              <TableCell className="tabular text-right">{row.merged}</TableCell>
              <TableCell className="tabular text-right text-muted-foreground">
                {row.opened}
              </TableCell>
              <TableCell className="tabular text-right text-muted-foreground">
                {formatCompact(row.lines)}
              </TableCell>
              <TableCell className="tabular text-right text-muted-foreground">
                {formatHours(row.medianCycleHours)}
              </TableCell>
              <TableCell className="tabular text-right text-muted-foreground">
                {formatPercent(row.share)}
              </TableCell>
              <TableCell className="text-muted-foreground">
                <ChevronRight aria-hidden className="size-4" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
