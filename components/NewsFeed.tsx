import Link from "next/link";

export default function NewsFeed() {
  const news = [
    {
      id: 1,
      title: "Lancement officiel de la Phase de Poules UCUP 2026",
      date: "Avril 2026",
      category: "Organisation",
      snippet: "Retrouvez le calendrier complet et la répartition officielle des groupes...",
    },
    {
      id: 2,
      title: "Règlement disciplinaire et protocole des rencontres",
      date: "Mai 2026",
      category: "Règlement",
      snippet: "Rappel sur les accréditations, licences officielles et cartons cumulés...",
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-extrabold uppercase tracking-wide text-ink">
          📰 Fil d'Actualités
        </h2>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {news.map((item) => (
          <div key={item.id} className="site-card p-4 hover:border-red-200 transition">
            <div className="flex items-center justify-between text-[11px] text-gray-400 mb-1">
              <span className="font-bold text-red-600 uppercase">{item.category}</span>
              <span>{item.date}</span>
            </div>
            <h3 className="font-bold text-ink text-sm hover:text-red-600 transition">
              {item.title}
            </h3>
            <p className="text-xs text-gray-500 mt-1 line-clamp-2">{item.snippet}</p>
          </div>
        ))}
      </div>
    </div>
  );
}