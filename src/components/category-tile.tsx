import Link from "next/link";
import { Photo } from "@/components/photo";
import type { Category } from "@/lib/demo-data";

export function CategoryTile({ category }: { category: Category }) {
  return (
    <Link
      href={`/buscar?categoria=${category.id}`}
      className="tile-press block w-[5.5rem] shrink-0 text-center"
    >
      <div className="relative aspect-square overflow-hidden rounded-3xl bg-surface">
        <Photo
          src={category.photo}
          emoji={category.emoji}
          gradient={category.gradient}
          sizes="88px"
        />
      </div>
      <span className="mt-1.5 block truncate text-[12px] font-semibold text-foreground">
        {category.label}
      </span>
    </Link>
  );
}
