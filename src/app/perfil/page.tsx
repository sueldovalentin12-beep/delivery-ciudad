import { PageShell } from "@/components/page-shell";
import { ProfileView } from "./profile-view";

export const metadata = { title: "Perfil" };

export default function ProfilePage() {
  return (
    <PageShell title="Mi perfil">
      <ProfileView />
    </PageShell>
  );
}
