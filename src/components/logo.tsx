import { appConfig } from "@/lib/config";

/**
 * El logo de Al Toque: un pin de ubicación con líneas de velocidad ("llega
 * ya") en blanco sobre un cuadrado verde redondeado.
 * El mismo dibujo se usa para el ícono de la app (public/icons).
 */
export function LogoMark({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden>
      <rect width="48" height="48" rx="13" fill="var(--brand)" />
      <g transform="translate(2.5 -0.5)">
        <path
          d="M27 9c-6.6 0-12 5.2-12 11.8C15 29 27 40 27 40s12-11 12-19.2C39 14.2 33.6 9 27 9z"
          fill="#fff"
        />
        <circle cx="27" cy="20.5" r="4.5" fill="var(--brand)" />
        <path
          d="M6 17h6M4 23h7M7 29h5"
          stroke="#fff"
          strokeWidth="2.6"
          strokeLinecap="round"
          fill="none"
        />
      </g>
    </svg>
  );
}

/** Logo completo: el rayo + el nombre, para el encabezado. */
export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`flex items-center gap-2 ${className}`}>
      <LogoMark />
      <span className="leading-none">
        <span className="block text-[19px] font-extrabold italic tracking-tight text-foreground">
          {appConfig.name.toLowerCase()}
        </span>
        <span className="mt-0.5 block text-[10.5px] font-medium uppercase tracking-wide text-muted">
          {appConfig.city}
        </span>
      </span>
    </span>
  );
}
