import Link from "next/link";
import type { Metadata } from "next";
import { MotoIcon } from "@/components/moto-icon";
import { PageShell } from "@/components/page-shell";
import { appConfig } from "@/lib/config";
import { JoinForm } from "./join-form";

/**
 * Página para los comercios que quieren sumarse.
 * Explica cómo funciona y termina en un formulario corto que abre WhatsApp
 * con los datos del local ya escritos.
 * Ojo: acá no hay precios ni comisiones a propósito. Las condiciones las
 * define el dueño de la app con cada comercio.
 */

export const metadata: Metadata = {
  title: "Sumá tu comercio",
  description: `Vendé a domicilio en ${appConfig.city} con ${appConfig.name}: recibís los pedidos en tu celular y nosotros los llevamos.`,
};

const steps = [
  {
    title: "Armamos tu menú",
    text: "Nos pasás tus productos, precios y horarios. Lo cargamos nosotros, con fotos, y lo revisás antes de publicarlo.",
  },
  {
    title: "Te llegan los pedidos al celular",
    text: "Cada pedido aparece en tu panel con un aviso sonoro: qué pidieron, a nombre de quién, la dirección y cómo paga.",
  },
  {
    title: "Lo preparás y sale",
    text: "Marcás el pedido como listo, el repartidor lo retira y tu cliente lo sigue en el mapa hasta la puerta.",
  },
];

const benefits = [
  {
    title: "Vendés sin atender el teléfono",
    text: "El pedido llega escrito y completo. Se terminan los audios y los “¿me repetís la dirección?”.",
  },
  {
    title: "No necesitás repartidor propio",
    text: "Vos cocinás. De llevarlo nos ocupamos nosotros.",
  },
  {
    title: "Tus precios, tus horarios",
    text: "Tu local aparece abierto solo cuando atendés. Cambiás precios o sumás una promo avisándonos.",
  },
  {
    title: "Tu cliente sabe dónde está su pedido",
    text: "Ve cada paso y al repartidor moviéndose en el mapa. Menos llamados preguntando cuánto falta.",
  },
];

const faqs = [
  {
    question: "¿Necesito una computadora?",
    answer: "No. Con el celular alcanza: el panel de pedidos se abre desde el navegador.",
  },
  {
    question: "¿Cómo me entero de que entró un pedido?",
    answer: "Suena un aviso y el pedido aparece arriba de todo en tu panel. El cliente además puede avisarte por WhatsApp.",
  },
  {
    question: "¿Cómo cobro?",
    answer: "El cliente elige efectivo al recibir o transferencia, y lo ves en cada pedido antes de prepararlo.",
  },
  {
    question: "¿Cuánto cuesta?",
    answer: "Lo vemos con vos según tu local, sin letra chica. Dejanos tus datos acá abajo y te lo contamos.",
  },
];

export default function JoinPage() {
  return (
    <PageShell title="Sumá tu comercio" backHref="/">
      <div className="space-y-7 pb-4">
        <section className="relative overflow-hidden rounded-3xl bg-brand-soft p-5">
          <p className="text-[11px] font-bold uppercase tracking-wide text-brand-dark">
            Para comercios de {appConfig.city}
          </p>
          <h2 className="mt-1.5 max-w-[15rem] text-[22px] font-extrabold leading-tight tracking-tight text-foreground">
            Vendé a domicilio sin armar tu propio reparto
          </h2>
          <p className="mt-2 max-w-[17rem] text-[13px] leading-relaxed text-foreground/75">
            {appConfig.name} lleva los pedidos de tu local a las casas de{" "}
            {appConfig.city}. Vos recibís el pedido en el celular y lo preparás.
          </p>
          <a
            href="#sumate"
            className="mt-4 inline-block rounded-full bg-brand px-5 py-2.5 text-[13.5px] font-bold text-white"
          >
            Quiero sumarme
          </a>
          <MotoIcon
            className="pointer-events-none absolute -bottom-1 right-2 h-16 w-auto opacity-95"
            moving
          />
        </section>

        <section>
          <h2 className="text-[16px] font-bold tracking-tight text-foreground">
            Cómo funciona
          </h2>
          <ol className="mt-3 space-y-3">
            {steps.map((step, index) => (
              <li key={step.title} className="flex gap-3">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand text-[14px] font-bold text-white">
                  {index + 1}
                </span>
                <div>
                  <p className="text-[14px] font-semibold text-foreground">
                    {step.title}
                  </p>
                  <p className="mt-0.5 text-[12.5px] leading-relaxed text-muted">
                    {step.text}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section>
          <h2 className="text-[16px] font-bold tracking-tight text-foreground">
            Qué ganás
          </h2>
          <ul className="mt-3 grid grid-cols-1 gap-2.5">
            {benefits.map((benefit) => (
              <li
                key={benefit.title}
                className="rounded-2xl border border-line bg-white p-3.5"
              >
                <p className="text-[13.5px] font-semibold text-foreground">
                  {benefit.title}
                </p>
                <p className="mt-0.5 text-[12.5px] leading-relaxed text-muted">
                  {benefit.text}
                </p>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-line bg-surface p-4">
          <p className="text-[13.5px] font-semibold text-foreground">
            Mirá cómo lo ve tu cliente
          </p>
          <p className="mt-0.5 text-[12.5px] leading-relaxed text-muted">
            Recorré la app como si fueras a pedir: así va a aparecer tu local.
          </p>
          <Link
            href="/comercios"
            className="mt-3 inline-block rounded-full border border-brand bg-white px-4 py-2 text-[12.5px] font-bold text-brand-dark"
          >
            Ver los comercios
          </Link>
        </section>

        <section>
          <h2 className="text-[16px] font-bold tracking-tight text-foreground">
            Preguntas comunes
          </h2>
          <div className="mt-3 divide-y divide-line rounded-2xl border border-line bg-white">
            {faqs.map((faq) => (
              <details key={faq.question} className="group px-3.5 py-3">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-[13.5px] font-semibold text-foreground">
                  {faq.question}
                  <span
                    className="text-[18px] font-normal leading-none text-muted transition-transform group-open:rotate-45"
                    aria-hidden
                  >
                    +
                  </span>
                </summary>
                <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>
        </section>

        <section id="sumate" className="scroll-mt-20">
          <h2 className="text-[16px] font-bold tracking-tight text-foreground">
            Sumá tu local
          </h2>
          <p className="mt-1 text-[12.5px] leading-relaxed text-muted">
            Completá estos datos y te escribimos para coordinar. No te
            compromete a nada.
          </p>
          <JoinForm />
        </section>
      </div>
    </PageShell>
  );
}
