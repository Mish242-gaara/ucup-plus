import PublicNav from "@/components/PublicNav";
import SiteFooter from "@/components/SiteFooter";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen bg-gray-50 text-ink">
      {/* Decorative diagonal red band, mirrors the mockup's split background */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0 bg-brand-500"
        style={{ clipPath: "polygon(0 0, 42% 0, 18% 100%, 0 100%)" }}
      />
      <div className="relative z-10 flex min-h-screen flex-col">
        <PublicNav />
        <div className="flex-1">{children}</div>
        <SiteFooter />
      </div>
    </div>
  );
}
