import { Card } from "@/components/ui/card";

export function StatusComposition({
  inReview,
  draft,
  merged
}: {
  inReview: number;
  draft: number;
  merged: number;
}) {
  const blocks = [
    { label: "In Review", value: inReview, color: "bg-primary" },
    { label: "Draft", value: draft, color: "bg-secondary" },
    { label: "Merged", value: merged, color: "bg-tertiary" }
  ];

  return (
    <div className="min-w-0">
      <h3 className="font-display text-2xl font-bold tracking-[-0.04em]">Status Composition</h3>
      <div className="mt-4 grid gap-px bg-background/60 md:grid-cols-3">
        {blocks.map((block) => (
          <Card key={block.label} className="min-w-0 p-6 text-center">
            <div className={`mx-auto h-2 w-20 rounded-sm ${block.color}`} />
            <div className="mt-6 font-display text-5xl font-extrabold tracking-[-0.04em]">{block.value}%</div>
            <div className="mt-2 text-sm uppercase tracking-[0.2em] text-muted-foreground">{block.label}</div>
          </Card>
        ))}
      </div>
    </div>
  );
}
