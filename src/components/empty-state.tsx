export function EmptyState({
  emoji,
  title,
  description,
}: {
  emoji: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <span className="grid h-20 w-20 place-items-center rounded-full bg-surface text-4xl" aria-hidden>
        {emoji}
      </span>
      <h2 className="mt-4 text-[15px] font-bold text-foreground">{title}</h2>
      <p className="mt-1 max-w-[16rem] text-[12.5px] leading-relaxed text-muted">{description}</p>
    </div>
  );
}
