"use client";

import { VendorRow } from "@/components/vendor-row";
import type { Merchant } from "@/lib/demo-data";
import { isOpenAt } from "@/lib/hours";
import { useNow } from "@/lib/use-open-status";

/**
 * "Abierto ahora": solo los comercios que atienden en este momento (hora de
 * Argentina). La página es estática, así que hasta hidratar mostramos
 * lugares en gris del mismo alto, y se actualiza sola cada minuto.
 */
export function OpenNowList({ merchants }: { merchants: Merchant[] }) {
  const now = useNow();

  if (!now) {
    return (
      <ul className="mt-3 space-y-2.5 px-4" aria-hidden>
        {merchants.map((merchant) => (
          <li key={merchant.id} className="skeleton h-[5.75rem] rounded-2xl" />
        ))}
      </ul>
    );
  }

  const open = merchants.filter((merchant) => isOpenAt(merchant, now));

  if (open.length === 0) {
    return (
      <p className="anim-fade-in mx-4 mt-3 rounded-2xl border border-line bg-surface p-4 text-center text-[12.5px] leading-relaxed text-muted">
        Ahora no hay comercios abiertos. Mirá los horarios de cada uno en su
        página y volvé cuando abran.
      </p>
    );
  }

  return (
    <ul className="mt-3 space-y-2.5 px-4">
      {open.map((merchant) => (
        <li key={merchant.id} className="anim-fade-in">
          <VendorRow merchant={merchant} />
        </li>
      ))}
    </ul>
  );
}
