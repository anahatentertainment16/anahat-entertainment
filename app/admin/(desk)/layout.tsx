import { requireStaff } from "@/lib/admin";
import { AdminShell } from "@/app/admin/ui";

// Every staff page shares this frame. Layouts persist across navigation, so the sidebar never reloads;
// only the page beside it swaps (with loading.tsx as the instant placeholder).
export default async function DeskLayout({ children }: { children: React.ReactNode }) {
  const me = await requireStaff();
  return <AdminShell me={me}>{children}</AdminShell>;
}
