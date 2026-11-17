"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

/**
 * Foto de un comercio, plato o categoría. Llena el contenedor que la
 * contiene (que tiene que ser `relative`, con su tamaño y `overflow-hidden`).
 *
 * - Mientras carga se ve un gris con brillo (shimmer) y después aparece con
 *   un fundido suave.
 * - Si no hay foto, o el archivo no existe / no carga, se ve el tile de
 *   siempre: degradé + emoji. Nunca queda un ícono de imagen rota.
 * - Carga perezosa por defecto; `preload` solo para la portada que se ve
 *   primero (la del comercio).
 */
export function Photo({
  src,
  emoji,
  gradient = "from-surface to-line",
  sizes,
  alt = "",
  preload = false,
  emojiClassName = "text-2xl",
}: {
  /** Ruta pública (/fotos/…). Si falta, se muestra el emoji. */
  src?: string;
  emoji: string;
  /** Clases de Tailwind del degradado del tile de respaldo. */
  gradient?: string;
  /** Ancho que ocupa la foto en pantalla (para que baje el tamaño justo). */
  sizes: string;
  /** Texto alternativo. Vacío cuando el nombre ya está escrito al lado. */
  alt?: string;
  preload?: boolean;
  /** Tamaño del emoji de respaldo. */
  emojiClassName?: string;
}) {
  const [state, setState] = useState<"loading" | "loaded" | "error">("loading");
  const imgRef = useRef<HTMLImageElement>(null);

  // Si la foto falló antes de que React se enganchara (HTML del servidor),
  // nadie nos avisó: lo revisamos al montar.
  useEffect(() => {
    const img = imgRef.current;
    if (img?.complete) setState(img.naturalWidth > 0 ? "loaded" : "error");
  }, []);

  if (!src || state === "error") {
    return (
      <span
        className={`absolute inset-0 grid place-items-center bg-gradient-to-br ${gradient}`}
        aria-hidden
      >
        <span className={`${emojiClassName} drop-shadow-sm`}>{emoji}</span>
      </span>
    );
  }

  return (
    <>
      {state === "loading" ? (
        <span className="skeleton absolute inset-0" aria-hidden />
      ) : null}
      <Image
        ref={imgRef}
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        preload={preload}
        loading={preload ? undefined : "lazy"}
        onLoad={(event) =>
          setState(event.currentTarget.naturalWidth > 0 ? "loaded" : "error")
        }
        onError={() => setState("error")}
        className={`object-cover transition-opacity duration-500 ${
          state === "loaded" ? "opacity-100" : "opacity-0"
        }`}
      />
    </>
  );
}
