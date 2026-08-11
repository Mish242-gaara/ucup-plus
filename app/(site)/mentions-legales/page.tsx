export const metadata = { title: "Mentions légales & confidentialité — UCUP 2026" };
export const dynamic = "force-dynamic";
export default function MentionsLegalesPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-extrabold text-ink">Mentions légales &amp; confidentialité</h1>
      <p className="mt-1 text-sm text-gray-400">Dernière mise à jour : {new Date().toLocaleDateString("fr-FR")}</p>

      <div className="mt-8 space-y-8 text-sm leading-relaxed text-gray-600">
        <section>
          <h2 className="text-base font-bold text-ink">Éditeur du site</h2>
          <p className="mt-2">
            UCUP 2026 est un championnat universitaire de football organisé à Pointe-Noire et
            Brazzaville. Ce site est édité à titre non commercial pour la gestion et la diffusion
            des résultats du tournoi.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-ink">Données collectées</h2>
          <p className="mt-2">Dans le cadre de l&apos;inscription des joueurs, nous collectons :</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Nom, prénom, date de naissance, nationalité, taille</li>
            <li>Photo (facultative, ajoutée par l&apos;organisation après validation)</li>
            <li>Équipe, poste, numéro de maillot</li>
            <li>Statistiques de jeu (buts, passes, cartons, matchs joués)</li>
          </ul>
          <p className="mt-2">
            Ces informations sont fournies volontairement lors de l&apos;inscription et sont
            nécessaires à l&apos;organisation du tournoi (composition des équipes, classements,
            arbitrage des litiges).
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-ink">Utilisation des données</h2>
          <p className="mt-2">
            Les données sont utilisées uniquement pour la gestion du championnat : affichage des
            profils joueurs, classements, compositions d&apos;équipe et statistiques publiques du
            tournoi. Elles ne sont ni vendues ni transmises à des tiers à des fins commerciales.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-ink">Modération des inscriptions</h2>
          <p className="mt-2">
            Toute inscription soumise via le formulaire public reste invisible sur le site tant
            qu&apos;elle n&apos;a pas été validée par l&apos;organisation, qui vérifie
            l&apos;identité et l&apos;éligibilité du joueur avant publication.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-ink">Hébergement</h2>
          <p className="mt-2">
            Le site est hébergé par Vercel Inc. La base de données est hébergée par Neon (Neon,
            Inc.). Les photos sont hébergées par Vercel Blob.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-ink">Tes droits</h2>
          <p className="mt-2">
            Tu peux demander la correction ou la suppression de tes informations (y compris ta
            photo) en contactant l&apos;organisation du tournoi directement — un joueur ou son
            responsable d&apos;équipe peut demander le retrait de son profil à tout moment.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-ink">Cookies</h2>
          <p className="mt-2">
            Le site utilise uniquement un cookie de session technique, nécessaire à la connexion
            des comptes administrateurs. Aucun cookie de suivi publicitaire ou analytique tiers
            n&apos;est utilisé.
          </p>
        </section>
      </div>
    </main>
  );
}
