import { cycleHours, linesChanged, sizeBucket } from "@shared/metrics/pr";
import type { PrRecord } from "@shared/types";
import { PrState } from "@/components/pr-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCompact, formatHours, formatRelative } from "@/lib/utils";

/** Recent PRs with the facts the charts summarize. */
export function PrTable({
  prs,
  now,
  showRepo = true,
  showAuthor = false,
}: {
  prs: PrRecord[];
  now: Date;
  showRepo?: boolean;
  showAuthor?: boolean;
}) {
  if (prs.length === 0) {
    return (
      <p className="px-1 py-6 text-sm text-muted-foreground">
        No pull requests in this window.
      </p>
    );
  }
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-24">State</TableHead>
            <TableHead>Pull request</TableHead>
            {showAuthor ? <TableHead>Author</TableHead> : null}
            <TableHead className="text-right">Size</TableHead>
            <TableHead className="text-right">Cycle</TableHead>
            <TableHead className="text-right">Updated</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {prs.map((pr) => (
            <TableRow key={pr.id}>
              <TableCell>
                <PrState pr={pr} />
              </TableCell>
              <TableCell className="max-w-md">
                <a
                  href={pr.url}
                  target="_blank"
                  rel="noreferrer"
                  className="block truncate font-medium hover:underline"
                  title={pr.title}
                >
                  {pr.title}
                </a>
                <span className="block truncate text-xs text-muted-foreground">
                  {showRepo ? `${pr.repo} ` : ""}#{pr.number}
                </span>
              </TableCell>
              {showAuthor ? (
                <TableCell className="text-muted-foreground">
                  {pr.authorLogin}
                </TableCell>
              ) : null}
              <TableCell className="tabular text-right whitespace-nowrap">
                <span className="mr-1.5 rounded border px-1 text-[10px] font-semibold text-muted-foreground">
                  {sizeBucket(linesChanged(pr))}
                </span>
                <span className="text-(--status-good-text)">
                  +{formatCompact(pr.additions)}
                </span>{" "}
                <span className="text-destructive">
                  −{formatCompact(pr.deletions)}
                </span>
              </TableCell>
              <TableCell className="tabular text-right text-muted-foreground">
                {formatHours(cycleHours(pr))}
              </TableCell>
              <TableCell className="text-right whitespace-nowrap text-muted-foreground">
                {formatRelative(pr.updatedAt, now)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
