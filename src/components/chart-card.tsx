import { BarChart3, Table2 } from "lucide-react";
import { useState, type ReactNode } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

export interface ChartTable {
  head: string[];
  rows: (string | number)[][];
}

/**
 * A chart with its table twin: every value in the chart is reachable as text.
 * While data refetches, the previous render stays at reduced opacity.
 */
export function ChartCard({
  title,
  description,
  action,
  table,
  stale = false,
  children,
}: {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  table: ChartTable;
  stale?: boolean;
  children: ReactNode;
}) {
  const [view, setView] = useState<"chart" | "table">("chart");
  return (
    <Card className="min-w-0">
      <CardHeader className="gap-2">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <h2 className="text-base leading-snug font-medium">{title}</h2>
            {description ? (
              <CardDescription>{description}</CardDescription>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            {action}
            <div
              role="group"
              aria-label="View"
              className="inline-flex rounded-md border p-0.5"
            >
              <ViewButton
                active={view === "chart"}
                onClick={() => setView("chart")}
                label="Chart view"
              >
                <BarChart3 aria-hidden className="size-4" />
              </ViewButton>
              <ViewButton
                active={view === "table"}
                onClick={() => setView("table")}
                label="Table view"
              >
                <Table2 aria-hidden className="size-4" />
              </ViewButton>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className={cn("transition-opacity", stale && "opacity-60")}>
        {view === "chart" ? (
          children
        ) : (
          <div className="max-h-80 overflow-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  {table.head.map((cell, index) => (
                    <TableHead
                      key={cell}
                      className={cn(index > 0 && "text-right")}
                    >
                      {cell}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {table.rows.map((row, rowIndex) => (
                  <TableRow key={rowIndex}>
                    {row.map((cell, index) => (
                      <TableCell
                        key={index}
                        className={cn(index > 0 && "tabular text-right")}
                      >
                        {typeof cell === "number"
                          ? cell.toLocaleString()
                          : cell}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ViewButton({
  active,
  onClick,
  label,
  children,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={label}
      title={label}
      onClick={onClick}
      className={cn(
        "inline-flex size-7 cursor-pointer items-center justify-center rounded text-muted-foreground transition hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
        active && "bg-muted text-foreground",
      )}
    >
      {children}
    </button>
  );
}
