/**
 * Horarios de los comercios: ¿está abierto ahora? ¿cuándo cambia?
 *
 * Reglas:
 * - La hora SIEMPRE es la del comercio (config.timeZone), nunca la del
 *   celular ni la del servidor: así un cliente de viaje, o un servidor en
 *   otro huso, ven y validan lo mismo.
 * - Cada día tiene una lista de turnos [abre, cierra] en "HH:MM".
 *   Hay turnos cortados (mediodía y noche) y turnos que pasan la
 *   medianoche: si "cierra" es menor o igual a "abre" (ej. 19:00 → 00:30,
 *   o 12:00 → 00:00) el turno termina al día siguiente.
 * - Un turno que pasa la medianoche pertenece al día en que empieza: el
 *   sábado 19:00 → 00:30 sigue abierto el domingo a las 00:10.
 *
 * Es código puro (sin React ni datos globales): se usa en el servidor
 * (para rechazar pedidos) y en el navegador (para las etiquetas).
 */

import { appConfig } from "@/lib/config";

/** "HH:MM", 24 horas. */
export type Clock = string;
/** Un turno: [abre, cierra]. */
export type TimeRange = readonly [open: Clock, close: Clock];
/** Día de la semana: 0 = domingo … 6 = sábado (como Date.getDay). */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;
/** Los turnos de cada día de la semana. Un día vacío = cerrado todo el día. */
export type WeekHours = Record<Weekday, readonly TimeRange[]>;

/** Lo mínimo que hace falta de un comercio (así se puede probar sin el catálogo). */
export type HasHours = { hours: WeekHours };

export const WEEKDAY_NAMES = [
  "domingo",
  "lunes",
  "martes",
  "miércoles",
  "jueves",
  "viernes",
  "sábado",
] as const;

const DAY_MINUTES = 24 * 60;

/** Mismos turnos los 7 días de la semana. */
export function everyDay(...ranges: TimeRange[]): WeekHours {
  return { 0: ranges, 1: ranges, 2: ranges, 3: ranges, 4: ranges, 5: ranges, 6: ranges };
}

function toMinutes(clock: Clock): number {
  const [hours, minutes] = clock.split(":").map(Number);
  return hours * 60 + minutes;
}

/** Un turno en minutos desde las 00:00 de su día. `end` puede pasar de 1440. */
function span(range: TimeRange): { start: number; end: number } {
  const start = toMinutes(range[0]);
  let end = toMinutes(range[1]);
  if (end <= start) end += DAY_MINUTES; // cierra después de medianoche
  return { start, end };
}

const WEEKDAY_BY_SHORT: Record<string, Weekday> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

let formatter: Intl.DateTimeFormat | null = null;

/**
 * Día de la semana y minutos desde medianoche en la hora del comercio.
 * Usa Intl con la zona horaria explícita: no depende del reloj del equipo.
 */
export function localParts(date: Date): { weekday: Weekday; minutes: number } {
  formatter ??= new Intl.DateTimeFormat("en-US", {
    timeZone: appConfig.timeZone,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  let weekday: Weekday = 0;
  let hour = 0;
  let minute = 0;
  for (const part of formatter.formatToParts(date)) {
    if (part.type === "weekday") weekday = WEEKDAY_BY_SHORT[part.value] ?? 0;
    else if (part.type === "hour") hour = Number(part.value) % 24;
    else if (part.type === "minute") minute = Number(part.value);
  }
  return { weekday, minutes: hour * 60 + minute };
}

function previousDay(weekday: Weekday): Weekday {
  return ((weekday + 6) % 7) as Weekday;
}

/** ¿Está abierto en este instante? */
export function isOpenAt(merchant: HasHours, date: Date): boolean {
  return currentShift(merchant, date) !== null;
}

/**
 * El turno en el que estamos (si hay uno): hora de cierre y minutos que faltan.
 * Mira los turnos de hoy y la "cola" de los de ayer que pasaron la medianoche.
 */
function currentShift(
  merchant: HasHours,
  date: Date,
): { close: Clock; minutesLeft: number } | null {
  const { weekday, minutes } = localParts(date);

  for (const range of merchant.hours[weekday]) {
    const { start, end } = span(range);
    if (minutes >= start && minutes < end) {
      return { close: range[1], minutesLeft: end - minutes };
    }
  }
  for (const range of merchant.hours[previousDay(weekday)]) {
    const { end } = span(range);
    // Lo que pasó de las 24:00 de ayer cae en las primeras horas de hoy.
    if (end > DAY_MINUTES && minutes < end - DAY_MINUTES) {
      return { close: range[1], minutesLeft: end - DAY_MINUTES - minutes };
    }
  }
  return null;
}

export type NextChange = {
  /** Cómo está ahora: true = abierto (y lo próximo es cerrar). */
  open: boolean;
  /** Hora del próximo cambio, "HH:MM". */
  time: Clock;
  /** 0 = hoy, 1 = mañana, … (siempre 0 si está abierto). */
  dayOffset: number;
  /** Día de la semana del próximo cambio. */
  weekday: Weekday;
};

/**
 * Lo próximo que pasa: si está abierto, a qué hora cierra; si está cerrado,
 * cuándo vuelve a abrir. null si el comercio nunca abre (sin horarios).
 */
export function nextChange(merchant: HasHours, date: Date): NextChange | null {
  const { weekday, minutes } = localParts(date);

  const shift = currentShift(merchant, date);
  if (shift) {
    return { open: true, time: shift.close, dayOffset: 0, weekday };
  }

  // Cerrado: el primer turno que empieza después de ahora (hoy o en los próximos días).
  for (let offset = 0; offset <= 7; offset += 1) {
    const day = ((weekday + offset) % 7) as Weekday;
    const starts = merchant.hours[day]
      .map((range) => ({ range, start: span(range).start }))
      .filter((entry) => offset > 0 || entry.start > minutes)
      .sort((a, b) => a.start - b.start);
    if (starts.length > 0) {
      return {
        open: false,
        time: starts[0].range[0],
        dayOffset: offset,
        weekday: day,
      };
    }
  }
  return null;
}

/** "19:00", "mañana 11:00" o "el lunes 11:00": para etiquetas cortas. */
export function whenShort(change: NextChange): string {
  if (change.dayOffset === 0) return change.time;
  if (change.dayOffset === 1) return `mañana ${change.time}`;
  return `el ${WEEKDAY_NAMES[change.weekday]} ${change.time}`;
}

/** "a las 19:00", "mañana a las 11:00" o "el lunes a las 11:00": para frases. */
export function whenLong(change: NextChange): string {
  if (change.dayOffset === 0) return `a las ${change.time}`;
  if (change.dayOffset === 1) return `mañana a las ${change.time}`;
  return `el ${WEEKDAY_NAMES[change.weekday]} a las ${change.time}`;
}

/** "Abierto · cierra 00:30" o "Cerrado · abre mañana 11:00". */
export function statusLabel(change: NextChange | null): string {
  if (!change) return "Cerrado";
  return change.open
    ? `Abierto · cierra ${change.time}`
    : `Cerrado · abre ${whenShort(change)}`;
}

/** "11:00 – 15:00 · 19:00 – 00:30", o "Cerrado" si el día no abre. */
export function formatRanges(ranges: readonly TimeRange[]): string {
  if (ranges.length === 0) return "Cerrado";
  return ranges.map(([open, close]) => `${open} – ${close}`).join(" · ");
}

/** Los turnos de hoy (en la hora del comercio), ya formateados. */
export function todayHours(merchant: HasHours, date: Date): string {
  return formatRanges(merchant.hours[localParts(date).weekday]);
}

/**
 * La semana completa para mostrar, de lunes a domingo. Los días seguidos con
 * los mismos horarios se juntan ("Todos los días" si es toda la semana).
 */
export function weekSchedule(
  merchant: HasHours,
): { days: string; hours: string }[] {
  const order: Weekday[] = [1, 2, 3, 4, 5, 6, 0];
  const cap = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);
  const groups: { days: Weekday[]; hours: string }[] = [];
  for (const day of order) {
    const hours = formatRanges(merchant.hours[day]);
    const last = groups[groups.length - 1];
    if (last && last.hours === hours) last.days.push(day);
    else groups.push({ days: [day], hours });
  }
  if (groups.length === 1) return [{ days: "Todos los días", hours: groups[0].hours }];
  return groups.map(({ days, hours }) => ({
    days:
      days.length === 1
        ? cap(WEEKDAY_NAMES[days[0]])
        : `${cap(WEEKDAY_NAMES[days[0]])} a ${WEEKDAY_NAMES[days[days.length - 1]]}`,
    hours,
  }));
}
