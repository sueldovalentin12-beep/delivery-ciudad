import Link from "next/link";

export function SectionHeader({
  title,
  href,
  action = "Ver todo",
}: {
  title: string;
  href?: string;
  action?: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 px-4">
      <h2 className="text-[15px] font-bold tracking-tight text-foreground">{title}</h2>
      {href ? (
        <Link
          href={href}
          className="rounded-full bg-brand-soft px-2.5 py-1 text-[11px] font-semibold text-brand-dark"
        >
          {action}
        </Link>
      ) : null}
    </div>
  );
}
