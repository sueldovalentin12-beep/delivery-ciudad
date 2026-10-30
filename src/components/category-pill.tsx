import type { Category } from "@/lib/demo-data";

export function CategoryPill({ category }: { category: Category }) {
  return (
    <button
      type="button"
      className="flex shrink-0 flex-col items-center gap-1 rounded-2xl border border-line bg-white px-4 py-3 text-xs font-medium text-foreground transition hover:border-brand hover:text-brand"
    >
      <span className="text-xl" aria-hidden>
        {category.emoji}
      </span>
      {category.label}
    </button>
  );
}
