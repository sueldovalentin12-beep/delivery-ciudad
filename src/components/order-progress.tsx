import { STATUS_LABEL, type OrderStatus } from "@/lib/order-status";

export const ORDER_STEPS: OrderStatus[] = [
  "recibido",
  "preparando",
  "en camino",
  "entregado",
];

/**
 * Las 4 etapas del pedido: las que ya pasaron se llenan con una transición
 * y la actual late suave.
 */
export function OrderProgress({ status }: { status: OrderStatus }) {
  const stepIndex = ORDER_STEPS.indexOf(status);

  return (
    <ol
      className="flex gap-1.5"
      aria-label={`Progreso del pedido: ${STATUS_LABEL[status]}`}
    >
      {ORDER_STEPS.map((step, index) => {
        const done = index <= stepIndex;
        const current = index === stepIndex && status !== "entregado";
        return (
          <li key={step} className="flex-1">
            <div className="h-1.5 overflow-hidden rounded-full bg-line">
              <div
                className={`h-full origin-left rounded-full bg-brand transition-transform duration-700 ease-out ${
                  done ? "scale-x-100" : "scale-x-0"
                } ${current ? "anim-step-pulse" : ""}`}
                style={{ transitionDelay: done ? `${index * 90}ms` : "0ms" }}
              />
            </div>
            <span
              className={`mt-1 block text-center text-[9.5px] leading-tight transition-colors duration-300 ${
                index === stepIndex ? "font-bold text-foreground" : "text-muted"
              }`}
            >
              {STATUS_LABEL[step]}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
