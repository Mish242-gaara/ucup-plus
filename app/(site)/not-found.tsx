import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 text-center">
      <p className="text-6xl font-extrabold text-brand-500">404</p>
      <h1 className="mt-2 text-xl font-bold text-ink">Page introuvable</h1>
      <p className="mt-2 text-sm text-gray-500">
        Ce match, ce joueur ou cette page n&apos;existe pas (ou plus).
      </p>
      <Link href="/" className="site-btn mt-6">
        Retour à l&apos;accueil
      </Link>
    </main>
  );
}
