export function SearchBar() {
  return (
    <label className="flex items-center gap-2 rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-muted focus-within:border-brand">
      <svg
        aria-hidden
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        className="h-4 w-4 shrink-0"
      >
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </svg>
      <input
        type="search"
        placeholder="Buscar comercio o comida"
        className="w-full bg-transparent text-foreground outline-none placeholder:text-muted"
      />
    </label>
  );
}
