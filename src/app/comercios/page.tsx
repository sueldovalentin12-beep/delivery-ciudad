import { PageShell } from "@/components/page-shell";
import { VendorRow } from "@/components/vendor-row";
import { merchants } from "@/lib/demo-data";

export const metadata = { title: "Comercios" };

export default function MerchantsPage() {
  return (
    <PageShell title="Comercios" backHref="/">
      <ul className="space-y-2.5">
        {merchants.map((merchant) => (
          <li key={merchant.id}>
            <VendorRow merchant={merchant} />
          </li>
        ))}
      </ul>
    </PageShell>
  );
}
