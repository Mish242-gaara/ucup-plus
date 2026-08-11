import { prisma } from "@/lib/prisma";

export default async function AuditLogPage() {
  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-white">Journal d&apos;activité</h1>
      <p className="mt-1 text-sm text-gray-400">
        Les 200 dernières actions sensibles (créations, suppressions, changements de statut, de
        score, de rôle…), avec qui les a faites et quand.
      </p>

      <table className="mt-6 w-full text-left text-sm">
        <thead className="text-gray-400">
          <tr>
            <th className="pb-2">Date</th>
            <th className="pb-2">Acteur</th>
            <th className="pb-2">Action</th>
            <th className="pb-2">Cible</th>
            <th className="pb-2">Détail</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr key={log.id} className="border-t border-white/10 align-top">
              <td className="whitespace-nowrap py-2 text-gray-400">
                {new Date(log.createdAt).toLocaleString("fr-FR")}
              </td>
              <td className="py-2">{log.actorEmail}</td>
              <td className="py-2 font-mono text-xs text-brand-600">{log.action}</td>
              <td className="py-2 text-gray-500">
                {log.entityType}
                {log.entityId ? ` #${log.entityId}` : ""}
              </td>
              <td className="max-w-xs truncate py-2 text-xs text-gray-400">{log.detail}</td>
            </tr>
          ))}
          {logs.length === 0 && (
            <tr>
              <td colSpan={5} className="py-6 text-center text-gray-400">
                Aucune activité enregistrée pour le moment.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
