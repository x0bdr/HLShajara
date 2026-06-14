import { SkeletonCard } from "@/components";

export default function Loading() {
  return (
    <div className="page-container-narrow" style={{ paddingBlock: "var(--space-8)" }}>
      <div className="flex-col" style={{ gap: "var(--space-4)" }}>
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </div>
  );
}
