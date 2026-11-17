"use client";

import { useState } from "react";
import { appConfig } from "@/lib/config";
import { isValidName, isValidPhone } from "@/lib/customer";

/**
 * Formulario para comercios interesados.
 * No guarda nada en ningún servidor: arma un mensaje y abre WhatsApp con
 * todo escrito, dirigido al número de atención de la app.
 */

const RUBROS = [
  "Pizzería",
  "Hamburguesería",
  "Rotisería",
  "Heladería",
  "Panadería",
  "Kiosco o almacén",
  "Farmacia",
  "Otro",
];

const inputClass =
  "w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-[16px] text-foreground outline-none focus:border-brand";

export function JoinForm() {
  const [shop, setShop] = useState("");
  const [rubro, setRubro] = useState(RUBROS[0]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  /** Recién mostramos los errores cuando la persona intentó enviar. */
  const [tried, setTried] = useState(false);

  const shopOk = shop.trim().length >= 2;
  const nameOk = isValidName(name);
  const phoneOk = isValidPhone(phone);

  function send(event: React.FormEvent) {
    event.preventDefault();
    setTried(true);
    if (!shopOk || !nameOk || !phoneOk) return;

    const lines = [
      `Hola, quiero sumar mi local a ${appConfig.name}.`,
      "",
      `*Local:* ${shop.trim()}`,
      `*Rubro:* ${rubro}`,
      `*Contacto:* ${name.trim()} · ${phone.trim()}`,
    ];
    if (note.trim()) lines.push(`*Comentario:* ${note.trim()}`);

    const url = `https://wa.me/${appConfig.whatsapp}?text=${encodeURIComponent(lines.join("\n"))}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <form onSubmit={send} noValidate className="mt-3 space-y-3">
      <Field label="Nombre del local" error={tried && !shopOk ? "Escribí el nombre del local." : null}>
        <input
          type="text"
          value={shop}
          onChange={(event) => setShop(event.target.value)}
          placeholder="Ej: Pizzería La Esquina"
          maxLength={80}
          autoComplete="organization"
          className={inputClass}
        />
      </Field>

      <Field label="Rubro" error={null}>
        <select
          value={rubro}
          onChange={(event) => setRubro(event.target.value)}
          className={inputClass}
        >
          {RUBROS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Tu nombre" error={tried && !nameOk ? "Escribí tu nombre." : null}>
        <input
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Ej: Lucía Gómez"
          maxLength={80}
          autoComplete="name"
          className={inputClass}
        />
      </Field>

      <Field
        label="Tu teléfono"
        error={tried && !phoneOk ? "Revisá el teléfono: tiene que tener el número completo." : null}
      >
        <input
          type="tel"
          inputMode="tel"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          placeholder="Ej: 3455 123456"
          maxLength={30}
          autoComplete="tel"
          className={inputClass}
        />
      </Field>

      <Field label="Algo que quieras contarnos (opcional)" error={null}>
        <textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Ej: abrimos solo de noche, tenemos 20 productos"
          maxLength={300}
          rows={2}
          className={`${inputClass} resize-none`}
        />
      </Field>

      <button
        type="submit"
        className="w-full rounded-2xl bg-brand py-3.5 text-[14.5px] font-bold text-white transition active:scale-[0.99]"
      >
        Enviar por WhatsApp
      </button>
      <p className="text-center text-[11.5px] leading-relaxed text-muted">
        Se abre WhatsApp con tus datos ya escritos: solo falta tocar enviar.
      </p>
    </form>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error: string | null;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11.5px] font-semibold text-muted">
        {label}
      </span>
      {children}
      {error ? (
        <span className="mt-1 block text-[11.5px] font-semibold text-red-600">
          {error}
        </span>
      ) : null}
    </label>
  );
}
