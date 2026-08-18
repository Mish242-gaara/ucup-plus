import { getSession } from "@/lib/auth";
import AdminShell from "@/components/AdminShell";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  return (
    <AdminShell userEmail={session?.email ?? "Administrateur"}>
      {children}
    </AdminShell>
  );
}