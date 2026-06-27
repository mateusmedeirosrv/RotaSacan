import type { ReactNode } from "react";

export function PageHeader({
  title,
  action,
}: {
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between">
      <h1
        className="border-l-[3px] pl-3 text-xl font-semibold"
        style={{ borderColor: "var(--brand-orange)", color: "var(--brand-navy)" }}
      >
        {title}
      </h1>
      {action}
    </div>
  );
}
