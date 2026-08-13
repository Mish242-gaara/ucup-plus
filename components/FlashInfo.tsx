export default function FlashInfo() {
  const announcements = [
    "🏆 Championnat Universitaire UCUP 2026 - Restez connectés pour les scores en direct !",
    "⚠️ Pensez à vérifier la validité de vos licences joueurs avant chaque match.",
    "📍 Rendez-vous ce week-end au Camp Militaire pour les grands chocs de la journée !",
  ];

  return (
    <div className="bg-red-600 text-white text-xs font-semibold py-2 px-4 overflow-hidden shadow-inner flex items-center gap-3">
      <span className="bg-white text-red-600 text-[10px] font-black uppercase px-2 py-0.5 rounded shrink-0">
        FLASH INFO
      </span>
      <div className="whitespace-nowrap animate-marquee flex gap-8">
        {announcements.map((text, i) => (
          <span key={i} className="inline-block">
            {text}
          </span>
        ))}
      </div>
    </div>
  );
}