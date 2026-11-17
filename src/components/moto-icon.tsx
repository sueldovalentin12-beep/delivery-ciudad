/**
 * Repartidor en moto, de costado, con la caja de reparto atrás.
 * Mira hacia la derecha. Los colores salen de las variables de la marca
 * (--brand, --brand-dark, --foreground), así que acompaña cualquier cambio
 * de identidad sin tocar el dibujo.
 *
 * Se exporta de dos formas: el componente de React (para la interfaz) y el
 * texto SVG crudo (para los marcadores de Leaflet, que no son React).
 */

export const MOTO_VIEWBOX = "0 0 100 68";
/** Proporción del dibujo (ancho / alto). */
export const MOTO_RATIO = 100 / 68;

const SKIN = "#f1c9a5";

/** El dibujo en sí, sin la etiqueta <svg>. */
export const MOTO_INNER = `
<g transform="translate(0 4)">
  <ellipse cx="51" cy="60.5" rx="40" ry="2.6" fill="var(--foreground)" opacity="0.16"/>

  <!-- Faro: haz de luz -->
  <polygon points="80,24 94,19 94,35 80,29" fill="#fde68a" opacity="0.38"/>

  <!-- Rueda de atrás -->
  <g>
    <circle cx="24" cy="49" r="11" fill="var(--foreground)"/>
    <circle cx="24" cy="49" r="7.4" fill="#e5e7eb"/>
    <g class="moto-spokes" stroke="#9ca3af" stroke-width="1.3" stroke-linecap="round">
      <line x1="24" y1="43" x2="24" y2="55"/>
      <line x1="18" y1="49" x2="30" y2="49"/>
      <line x1="19.8" y1="44.8" x2="28.2" y2="53.2"/>
      <line x1="28.2" y1="44.8" x2="19.8" y2="53.2"/>
    </g>
    <circle cx="24" cy="49" r="2.3" fill="var(--foreground)"/>
  </g>

  <!-- Rueda de adelante -->
  <g>
    <circle cx="78" cy="49" r="11" fill="var(--foreground)"/>
    <circle cx="78" cy="49" r="7.4" fill="#e5e7eb"/>
    <g class="moto-spokes" stroke="#9ca3af" stroke-width="1.3" stroke-linecap="round">
      <line x1="78" y1="43" x2="78" y2="55"/>
      <line x1="72" y1="49" x2="84" y2="49"/>
      <line x1="73.8" y1="44.8" x2="82.2" y2="53.2"/>
      <line x1="82.2" y1="44.8" x2="73.8" y2="53.2"/>
    </g>
    <circle cx="78" cy="49" r="2.3" fill="var(--foreground)"/>
  </g>

  <!-- Barrales -->
  <path d="M12 44.5 A13 13 0 0 1 36 44.5" fill="none" stroke="var(--brand-dark)" stroke-width="3" stroke-linecap="round"/>
  <path d="M66 44.5 A13 13 0 0 1 90 44.5" fill="none" stroke="var(--brand-dark)" stroke-width="3" stroke-linecap="round"/>

  <!-- Horquilla -->
  <line x1="78" y1="49" x2="71" y2="23" stroke="var(--foreground)" stroke-width="3.6" stroke-linecap="round"/>

  <!-- Carrocería: cola, piso y escudo delantero -->
  <path d="M11 41 C11 32 19 29 29 29 L46 29 C51 29 54 32 55.5 37 L57 42 L60 42 L63 28 C64 24 67 22 71 22 L75 22 L71 43 L58 44 L34 44 L34 41 L16 41 Z" fill="var(--brand-dark)"/>
  <path d="M34 44 L58 44 L58 46.5 L34 46.5 Z" fill="var(--foreground)"/>

  <!-- Faro -->
  <path d="M73 24 L77 24 A3.2 3.2 0 0 1 77 30.4 L73 30.4 Z" fill="#fef3c7" stroke="var(--foreground)" stroke-width="0.8"/>

  <!-- Manubrio y espejo -->
  <line x1="66" y1="21" x2="73" y2="21" stroke="var(--foreground)" stroke-width="3" stroke-linecap="round"/>
  <line x1="68" y1="19.5" x2="66.5" y2="14" stroke="var(--foreground)" stroke-width="1.3" stroke-linecap="round"/>
  <ellipse cx="66" cy="13.3" rx="2.2" ry="1.4" fill="var(--foreground)"/>

  <!-- Asiento -->
  <rect x="31" y="24.5" width="24" height="6" rx="3" fill="var(--foreground)"/>

  <!-- Caja de reparto -->
  <rect x="3" y="6" width="29" height="23" rx="3.2" fill="var(--brand)"/>
  <rect x="3" y="6" width="29" height="7" rx="3.2" fill="var(--brand-dark)"/>
  <rect x="3" y="10" width="29" height="3" fill="var(--brand-dark)"/>
  <rect x="11" y="18" width="13" height="3.4" rx="1.7" fill="#ffffff" opacity="0.9"/>
  <rect x="1.4" y="19" width="2.4" height="5" rx="1.2" fill="#ef4444"/>

  <!-- Piloto: pierna -->
  <path d="M40 27 L55 29 L54 41" fill="none" stroke="#475569" stroke-width="5.4" stroke-linecap="round" stroke-linejoin="round"/>
  <rect x="50" y="39.5" width="10" height="4.6" rx="2.3" fill="var(--foreground)"/>

  <!-- Piloto: torso con campera -->
  <path d="M35 28 C34 19 39 11 46 10 L53 13 C55 19 51 25 47 29 Z" fill="var(--foreground)"/>
  <path d="M38 25 C37.5 20 39.5 15.5 42.5 13.5" fill="none" stroke="#ffffff" stroke-width="1.6" stroke-linecap="round" opacity="0.75"/>

  <!-- Piloto: brazo -->
  <path d="M49 14 Q58 17 66.5 21" fill="none" stroke="var(--foreground)" stroke-width="4.6" stroke-linecap="round"/>
  <circle cx="67.5" cy="21" r="2.7" fill="${SKIN}"/>

  <!-- Piloto: casco -->
  <circle cx="51" cy="5.6" r="6.6" fill="#ffffff" stroke="var(--foreground)" stroke-width="1"/>
  <path d="M53.5 2.8 C57.5 2.8 59.6 4.8 59.6 8.2 L52.6 8.8 Z" fill="var(--foreground)" opacity="0.88"/>
  <path d="M44.6 6.6 C44.6 2.5 47.6 -0.2 51.6 -0.2" fill="none" stroke="var(--brand)" stroke-width="2.2" stroke-linecap="round"/>
</g>`;

/** El SVG completo como texto (para Leaflet y para usar fuera de React). */
export const MOTO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${MOTO_VIEWBOX}" width="100%" height="100%" aria-hidden="true" focusable="false">${MOTO_INNER}</svg>`;

/**
 * La moto como componente. `moving` hace girar las ruedas; `flip` la da
 * vuelta para que mire hacia la izquierda.
 */
export function MotoIcon({
  className = "h-10 w-auto",
  moving = false,
  flip = false,
}: {
  className?: string;
  moving?: boolean;
  flip?: boolean;
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={MOTO_VIEWBOX}
      aria-hidden="true"
      focusable="false"
      className={`${className}${moving ? " is-moving" : ""}`}
      style={flip ? { transform: "scaleX(-1)" } : undefined}
      dangerouslySetInnerHTML={{ __html: MOTO_INNER }}
    />
  );
}
