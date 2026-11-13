import { EmptyState } from "@/components/empty-state";
import { PageShell } from "@/components/page-shell";

export const metadata = { title: "Perfil" };

export default function ProfilePage() {
  return (
    <PageShell title="Mi perfil">
      <EmptyState
        emoji="👤"
        title="Todavía no iniciaste sesión"
        description="En la próxima etapa vas a poder entrar con tu número de teléfono y guardar tus direcciones."
      />
    </PageShell>
  );
}
