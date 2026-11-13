import Link from "next/link";
import type { Category } from "@/lib/demo-data";

export function CategoryTile({ category }: { category: Category }) {
  return (
    <Link
      href={`/buscar?categoria=${category.id}`}
      className="block w-[5.25rem] shrink-0 text-center"
    >
      <div
        className={`grid aspect-square place-items-center rounded-2xl bg-gradient-to-br ${category.gradient}`}
      >
        <span className="text-2xl" aria-hidden>
          {category.emoji}
        </span>
      </div>
      <span className="mt-1.5 block truncate text-[11.5px] font-medium text-foreground">
        {category.label}
      </span>
    </Link>
  );
}
