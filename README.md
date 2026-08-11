# UCUP 2026 — Next.js (fondation)

Conversion du projet Laravel + Inertia.js `ucup2026` vers un stack full Next.js 15
(App Router) + Prisma + Neon Postgres, remplaçant entièrement le backend Laravel.

## Ce qui est déjà fait (Phase 0 — Fondation)

- `prisma/schema.prisma` : schéma complet traduit fidèlement des **35 migrations**
  Laravel (users, universities, teams, players, matches — avec toutes les stats
  agrégées/manuelles/avancées —, match_events, match_lineups, lineups, standings,
  gallery_items).
- `lib/prisma.ts` : client Prisma singleton.
- `lib/auth.ts` : sessions JWT (`jose` + `bcryptjs`), même pattern que ton projet
  `estam-tournoi`.
- Squelette App Router avec dossiers pour toutes les routes équivalentes
  (`/matches`, `/teams`, `/players`, `/standings`, `/admin`, `/api/*`).
- Deux exemples fonctionnels : `POST /api/auth/login`, `GET /api/matches`.
- Page d'accueil (Server Component) qui interroge Neon via Prisma.

## Démarrage

```bash
npm install
cp .env.example .env   # renseigner DATABASE_URL / DIRECT_URL (Neon) + JWT_SECRET
npx prisma migrate dev --name init
npm run dev
```

## Phase 2 — Live Center (fait)

- `lib/elapsed-time.ts` : calcul du temps écoulé, **fidèle à
  `MatchModel::getElapsedTime()`** du projet Laravel (base + temps écoulé depuis
  `start_time` si le match est `live` et non en pause).
- `lib/actions/timer.ts` : démarrer / pause / reprendre / terminer, temps
  additionnel (1ère/2e mi-temps), prolongation, tirs au but. `stopTimer`
  recalcule automatiquement le classement.
- `lib/actions/events.ts` : ajout/suppression d'événements de match (but,
  but sur penalty, csc, cartons, remplacements…) avec répercussion automatique
  sur le score du match et les statistiques du joueur (buts, passes,
  cartons), et opération inverse à la suppression.
- `app/api/matches/[id]/live/route.ts` : endpoint public de polling (temps
  réel calculé côté serveur, score, fil d'événements).
- `components/LiveMatchView.tsx` : composant client qui interroge cet endpoint
  **toutes les 12 secondes** (indicateur "live" pulsant), même pattern que
  `estam-tournoi`.
- `app/matches/[id]` : page publique du match avec le fil en direct.
- `app/admin/matches/[id]/live` : salle de contrôle admin (minuteur, saisie
  d'événements, liste avec suppression).

**Choix d'architecture** : contrairement au Laravel d'origine qui diffuse via
Pusher/Laravel Echo (scheduler `everySecond()`), cette version s'appuie
uniquement sur le **polling** décrit comme solution de repli dans
`TIMER_SYSTEM_DOCUMENTATION.md`. C'est plus simple à héberger sur Vercel
(pas de process persistant nécessaire pour le scheduler ni de serveur
WebSocket dédié) et c'est déjà le choix que tu as fait pour `estam-tournoi`.
Si un jour le temps réel doit être plus réactif que 12s, on peut brancher
Pusher (ou Ably) en Phase ultérieure sans toucher au modèle de données.

## Phase 3 — Frontend public (fait)

- Toutes les pages publiques déplacées dans un groupe de routes
  **`app/(site)/`** (n'affecte pas les URLs) avec un layout partagé
  (`components/PublicNav.tsx`) — séparé du layout admin à sidebar.
- `/matches` : liste en direct / à venir / résultats.
- `/matches/[id]` : page match enrichie (round, groupe, lieu, arbitre) +
  fil en direct (`LiveMatchView`, Phase 2).
- `/teams`, `/teams/[id]` : liste + effectif et 10 derniers matchs par équipe.
- `/players`, `/players/[id]` : liste + fiche joueur avec toutes les stats de
  carrière (buts, passes, cartons, tacles, interceptions, précision de
  passes…).
- `/players/leaderboard` : meilleurs buteurs, passeurs, cartons.
- `/standings` : classement par groupe (J/G/N/P/BP/BC/Diff/Pts).
- `/galerie` : grille photos/vidéos.
- Endpoints publics `GET /api/teams`, `GET /api/players`, `GET /api/standings`
  ajoutés pour compléter `GET /api/matches` (utile pour une future app
  mobile ou intégration externe).

## Phase 4 — Lineups & compositions (fait)

- `lib/actions/lineups.ts` : `saveLineup` (remplace toutes les lignes
  `match_lineups` d'une équipe pour un match donné — titulaire/remplaçant,
  position tactique, ordre —, plafonne à 11 titulaires, et marque
  `home/awayCompositionReady`), `setFormation`, `resetLineup`. Mirrors
  `LiveMatchController::updateLineup()`.
- `app/admin/matches/[id]/lineup` : éditeur de composition pour les deux
  équipes (statut par joueur, position, ordre, sélecteur de formation parmi
  4-4-2 / 4-3-3 / 4-2-3-1 / 3-5-2 / 5-3-2 / 4-1-4-1 / 3-4-3).
- `app/matches/[id]/lineup` : vue publique des compositions (titulaires +
  remplaçants par équipe, formation), liée depuis la page match.
- **Note** : seule la table `match_lineups` est utilisée par l'app (voir
  remarque dans "Notes de migration" plus bas — la table `lineups`
  redondante du Laravel d'origine reste dans le schéma pour fidélité mais
  n'est pas exploitée).

## Phase 5 — Auth complète (fait)

- **Inscription joueur** (`/inscription-joueur`) : formulaire public
  (`components/RegistrationForm.tsx`, `React 19 useActionState`) qui crée
  directement un `Player` rattaché à l'équipe choisie, avec vérification
  qu'un numéro de maillot n'est pas déjà pris dans l'équipe. Équivalent
  ouvert (non modéré) de la route Laravel du même nom — si une validation
  manuelle est souhaitée plus tard, il suffit d'ajouter un statut
  `pending/approved` sur `Player`.
- **Gestion des comptes admin** (`/admin/users`) : créer des comptes
  admin/staff, changer le rôle, supprimer (sauf soi-même).
  `lib/actions/users.ts`.
- **2FA (TOTP)** : implémentation **RFC 6238 sans dépendance externe**
  (`lib/totp.ts`, uniquement le module `crypto` de Node) — génération de
  secret, QR code (via l'API publique qrserver.com, pas de lib supplémentaire),
  vérification à ±30s de dérive d'horloge, et codes de récupération à usage
  unique. Colonnes déjà présentes dans le schéma (`two_factor_*`).
  - `/admin/account/2fa` : activation/désactivation avec assistant QR code
    (`components/TwoFactorSetup.tsx`).
  - Connexion en deux temps : `POST /api/auth/login` renvoie
    `{ requiresTwoFactor: true }` si la 2FA est confirmée sur le compte, pose
    un cookie temporaire (5 min) ; `POST /api/auth/verify-2fa` valide le code
    (ou un code de récupération) puis ouvre la session complète.

Avec cette phase, les **5 phases de la feuille de route sont terminées**. Le
squelette Next.js couvre désormais : CRUD admin, minuteur + événements en
direct, frontend public complet, compositions d'équipe, et authentification
avec 2FA.

## Phase 6 — Design unifié, inscription sécurisée, synchro temps réel (fait)

- **Design unifié admin/public** : l'admin (qui était en thème sombre séparé)
  utilise maintenant la même palette rouge/blanc/noir que le site public
  (`bg-brand-500`, `text-ink`, cartes `.site-card`). Le login admin aussi.
  Deux jeux de classes coexistent dans `globals.css` :
  `.input`/`.btn` (rectangulaires, denses — admin) et
  `.site-input`/`.site-btn` (pilule, aérés — site public), même palette.
- **Inscription joueur sécurisée** (`/inscription-joueur`) :
  - Un **code d'accès** (`REGISTRATION_CODE` dans `.env`) est requis pour
    soumettre le formulaire — à communiquer aux entraîneurs/joueurs
    légitimes, pas affiché publiquement.
  - Le modèle `Player` a un nouveau champ **`status`**
    (`pending` / `approved` / `rejected`). Une inscription publique crée le
    joueur en `pending` : il n'apparaît **nulle part** sur le site public
    (listes, recherche, effectif d'équipe, classements, sélection en
    composition/événements de match) tant qu'un admin ne l'a pas approuvé
    depuis `/admin/players` (nouvelle file de modération avec compteur sur
    le tableau de bord). Les joueurs créés directement par un admin restent
    `approved` par défaut.
  - ⚠️ Comme le schéma a changé, il faut relancer
    `npx prisma migrate dev --name add-player-status` après avoir remplacé
    les fichiers.
- **Synchronisation temps réel (sans rafraîchir)** :
  - `lib/hooks/usePolling.ts` : hook générique qui hydrate avec les données
    rendues côté serveur (pas de flash de chargement) puis interroge une
    route API à intervalle régulier.
  - `components/LiveFeed.tsx` (poll `/api/matches` toutes les 10s) : utilisé
    par la page d'accueil et `/matches` — un changement fait dans l'admin
    (score, statut, nouveau match) apparaît côté public sans reload.
  - `components/LiveStandings.tsx` (poll `/api/standings` toutes les 15s) :
    utilisé par `/standings`.
  - Le fil d'un match individuel (`/matches/[id]`) pollait déjà `/api/matches/[id]/live`
    toutes les 12s depuis la Phase 2 — inchangé.
  - **Ce qui n'est volontairement pas en temps réel** : les listes
    équipes/joueurs et la galerie restent rendues côté serveur (rafraîchies à
    la navigation). Ce sont des données administratives qui changent
    rarement pendant qu'un visiteur regarde la page — les rendre "live"
    aurait ajouté du polling pour peu de valeur. Dis-le-moi si tu veux
    quand même les basculer sur le même hook `usePolling`.

## Phase 7 — Match Centre, fiche joueur enrichie, stats en direct (fait)

- **Match Centre public** (`components/MatchCentre.tsx`, remplace l'ancienne
  `LiveMatchView` sur `/matches/[id]`) : thème sombre dédié (contrairement au
  reste du site, clair), en-tête dégradé rouge, 4 onglets **Scores / Stats /
  Résumé / Compositions**. Poll `/api/matches/[id]/live` (étendu pour inclure
  toutes les stats de match et les compositions) toutes les 10s. Les liens
  "Statistiques"/"Compositions"/"Direct Live" des cartes de match pointent
  vers `/matches/[id]?tab=...` pour arriver directement sur le bon onglet.
  L'ancienne route `/matches/[id]/lineup` a été retirée (fusionnée dans
  l'onglet Compositions).
- **Fiche joueur enrichie** (`/players/[id]`) : grille de stats, informations
  clés, graphique "forme récente" (buts sur les 5 derniers matchs,
  `components/RecentFormChart.tsx` via recharts), et tableau "Parcours"
  (date, adversaire, score, titulaire/remplaçant, buts, cartons) reconstruit
  à partir de `MatchLineup` + `MatchEvent` — **pas de note de performance
  fictive** : on n'a pas de système de notation par match, donc je ne l'ai
  pas inventé. Si tu veux une vraie note de performance, il faudra définir
  la formule (ex. pondération buts/passes/cartons/minutes) et je l'ajoute.
- **Stats en direct par boutons d'action rapide** (admin) :
  `lib/actions/matchStats.ts` (`bumpMatchStat`, `setPossession`) et
  `components/QuickStatButtons.tsx` sur `/admin/matches/[id]/live` — un clic
  +/- par équipe pour tirs, tirs cadrés, corners, fautes, hors-jeu, arrêts,
  coups francs, touches, 6 mètres, pénalties, plus un curseur de possession.
  Ces boutons écrivent directement dans les colonnes déjà présentes du
  modèle `Match` (aucune migration nécessaire) — et comme le Match Centre
  public lit ces mêmes colonnes via le polling, chaque clic apparaît côté
  public en quelques secondes, sans rechargement.
- **Non fait (périmètre à discuter si besoin)** : l'onglet "Show &
  Artistes" (contenu marketing événementiel — pas de modèle de données) et
  le fil de réactions/commentaires en direct (nécessiterait un modèle
  `Comment` + modération + un flux d'écriture public, pas juste de lecture).

## Phase 8 — Photo de joueur, page joueurs en grille de cartes (fait)

- **Upload de photo** (`components/PhotoUploadField.tsx`) : redimensionne et
  compresse l'image côté navigateur (max 480px, JPEG qualité 0.82) via
  `canvas`, puis l'envoie en `data:` URL dans le champ `Player.photo`
  (colonne texte déjà présente dans le schéma — **aucune migration, aucun
  service de stockage externe (S3/Cloudinary) nécessaire**). Suffisant pour
  un tournoi universitaire ; si le volume de photos grossit beaucoup plus
  tard, on pourra migrer vers Vercel Blob sans casser le champ `photo`.
- **Admin** : le formulaire de création de joueur a maintenant un champ
  photo, et chaque ligne du tableau a un lien **Modifier**
  (`/admin/players/[id]/edit`, nouvelle page) pour changer la photo et les
  infos d'un joueur existant — cette page manquait jusqu'ici.
- **Page `/players` publique** : transformée en **grille de cartes** (photo
  en grand, numéro de maillot, badge buts si >0, nom, équipe avec logo,
  poste) au lieu du tableau. Triée par buts marqués.
- **Fiche joueur** (`/players/[id]`) : affiche la vraie photo si elle existe,
  sinon retombe sur l'avatar à initiales comme avant.

## Phase 9 — Garder Neon éveillé (fait)

- **Pourquoi pas un Cron Vercel ?** Sur le plan Hobby (gratuit), les Cron
  Jobs Vercel ne peuvent tourner qu'**une fois par jour** — bien trop rare
  pour empêcher Neon de suspendre son compute après 5 minutes d'inactivité
  (ce délai est fixe sur le plan gratuit de Neon, non configurable).
- **Solution retenue** : `.github/workflows/keep-neon-awake.yml`, une
  GitHub Action planifiée qui ping `GET /api/health` (nouvelle route,
  `app/api/health/route.ts`, fait un `SELECT 1` pour vraiment toucher la
  base) toutes les 5 minutes. GitHub Actions est gratuit et indépendant des
  quotas Vercel.
- **Mise en place** (une fois le site déployé sur Vercel) :
  1. Dans les réglages du repo GitHub → **Settings → Secrets and variables
     → Actions → Variables**, ajoute une variable **`APP_URL`** avec l'URL
     de production (ex. `https://ucup2026.vercel.app`, sans slash final).
  2. Pousse ces fichiers sur GitHub — la Action se déclenche automatiquement
     selon le planning. Tu peux aussi la lancer manuellement depuis l'onglet
     **Actions** du repo (bouton "Run workflow").
- **⚠️ Compromis à connaître** : le plan gratuit de Neon inclut ~100
  heures-CU de compute par mois. Un ping toutes les 5 minutes 24h/24
  maintient le compute quasi en permanence actif, ce qui **peut dépasser ce
  quota** sur un mois complet (le compute étant alors simplement suspendu
  jusqu'au mois suivant, pas de facturation surprise sur le plan gratuit
  sans carte enregistrée — mais le site redeviendrait aussi lent qu'avant).
  Si tu veux limiter la consommation, restreins le ping à tes heures
  d'affluence réelles (ex. journées de match) en changeant la ligne `cron`
  du fichier, par exemple pour ne pinguer qu'entre 6h et 23h (heure de
  Pointe-Noire, UTC+1) :
  ```yaml
  - cron: "*/5 5-22 * * *" # toutes les 5 min, 5h-22h UTC = 6h-23h Pointe-Noire
  ```
  Dans ce cas le compute pourra s'endormir la nuit (premier chargement du
  matin un peu plus lent, ~300-500ms), mais tu restes largement dans le
  quota gratuit.

## Phase 10 — Durcissement critique + galerie/sponsors/logos (fait)

**Nouveau dans le schéma** (⚠️ migration nécessaire, voir plus bas) :
`AuditLog`, `RateLimitAttempt`, `Sponsor`, `Player.status` (déjà en Phase 6).

### 🔴 Critique

- **Tests automatisés** (`vitest`, `npm test`) : `lib/elapsed-time.test.ts`
  (moteur du minuteur — base + temps écoulé, pause, jamais négatif) et
  `lib/totp.test.ts` (implémentation TOTP maison). 13 tests, exécutés et
  vérifiés verts avant livraison. Ce n'est pas une couverture complète —
  c'est un socle sur la logique la plus sensible aux régressions
  silencieuses (calcul du temps, sécurité 2FA). Dis-moi si tu veux que
  j'étende à la recalculation des classements ou aux server actions.
- **Rate limiting** (`lib/rateLimit.ts`, backé par Postgres, pas de
  Redis/service externe) : login (5/10 min/IP), vérification 2FA
  (8/10 min/IP), recherche publique (60/min/IP), inscription joueur
  (5/heure/IP).
- **Confirmations de suppression** (`components/ConfirmButton.tsx`) sur
  toutes les actions destructrices admin (universités, équipes, joueurs,
  matchs, comptes, réinitialisation de composition, suppression
  d'événement).
- **Journal d'audit** (`/admin/audit`) : qui a fait quoi et quand — créations,
  suppressions, changements de score/statut/rôle, réinitialisations de mot
  de passe. `lib/audit.ts`, appelé depuis toutes les actions sensibles.
- **Doublon de numéro de maillot** vérifié aussi côté admin (pas seulement à
  l'inscription publique), avec un écran d'erreur propre
  (`app/admin/players/error.tsx`) au lieu d'un crash.

### 🟠 Gains rapides

- **Admin galerie** (`/admin/gallery`) : upload photo (compressée) ou lien
  vidéo externe (YouTube — intégré automatiquement en iframe côté public),
  réordonnancement, suppression.
- **Upload de logo** pour les universités (`/admin/universities/[id]/edit`,
  nouvelle page — il n'y avait pas d'édition avant, seulement création) —
  réutilise le composant `PhotoUploadField` déjà construit pour les joueurs.
- **Sponsors** (`/admin/sponsors`) : logos en niveaux de gris, lien externe
  optionnel, réordonnancement. Bandeau affiché en bas de chaque page
  publique (`components/SponsorBar.tsx`, intégré au footer).

### Pas fait dans cette passe (volontairement)

Bracket/tableau à élimination directe, vrai push temps réel (WebSocket/SSE),
CI, monitoring d'erreurs, SEO/Open Graph, `next/image`, export CSV — toujours
sur la liste, à la demande.

### ⚠️ À faire après avoir remplacé les fichiers

```powershell
npx prisma migrate dev --name add-audit-ratelimit-sponsors
npm install   # ajoute vitest
npm test      # optionnel, pour vérifier que tout passe chez toi aussi
```

## Phase 11 — Polish 🟡 : erreurs, SEO, export, requêtes allégées (fait)

- **Pages d'erreur/chargement** : `not-found.tsx` et `error.tsx` dédiés au
  site public (au lieu de l'écran blanc générique de Next.js), plus des
  `loading.tsx` (skeletons) pour l'accueil, `/players`, et `/matches/[id]` —
  affichés automatiquement pendant le chargement des données serveur.
- **SEO / partage de liens** : `generateMetadata` sur les pages match,
  joueur, équipe (titre + description dynamiques, utile quand un lien est
  partagé sur WhatsApp/réseaux) ; `app/sitemap.ts` (généré dynamiquement à
  partir de tous les matchs/équipes/joueurs) et `app/robots.ts`. Nouvelle
  variable `NEXT_PUBLIC_SITE_URL` dans `.env` — **à renseigner avec ta vraie
  URL Vercel une fois déployé**, sinon les métadonnées pointent vers
  localhost.
  - ⚠️ **Limite honnête** : les photos de joueurs sont des `data:` URLs
    (base64), pas de vraies URLs d'image — les robots de prévisualisation
    (WhatsApp, Facebook…) ne peuvent généralement pas les utiliser comme
    image de partage (`og:image`). Le titre/la description s'afficheront
    bien, mais sans vignette. Pour avoir une vraie vignette il faudrait un
    hébergement d'image externe (Vercel Blob, Cloudinary…) — dis-le-moi si
    tu veux qu'on migre les photos dans ce sens.
- **Export CSV** (`GET /api/admin/export?type=standings|players`,
  protégé admin) : classement complet ou liste des joueurs approuvés avec
  leurs stats, en `;`-séparé (compatible Excel FR direct). Liens
  "Exporter" sur le tableau de bord et sur `/admin/players`.
- **Requêtes allégées** : les listes qui n'affichent pas de photo
  (recherche, classements individuels, widget top buteurs, endpoint public
  `/api/players`) utilisaient `include: { team: true }`, qui rapatriait
  `Player.photo` en entier à chaque ligne sans jamais l'afficher — remplacé
  par des `select` explicites. Réduit nettement le poids de ces réponses
  une fois des photos ajoutées en masse.
- `loading="lazy"` sur les grilles d'images (joueurs, galerie).

### Pas fait dans cette passe (toujours sur la liste)

`next/image` (peu de valeur ici tant que les photos restent en base64 — voir
la limite ci-dessus), notifications WhatsApp/email, page mentions
légales/confidentialité, CI de build, monitoring d'erreurs (Sentry).

## Phase 12 — Bracket, vrai push temps réel, photos hébergées (fait)

**Nouveau dans le schéma** (⚠️ migration nécessaire) : `Match.bracketRound`,
`Match.bracketPosition`.

**Nouveaux services externes à configurer** (⚠️ voir section dédiée
ci-dessous) : Vercel Blob (photos) et Pusher (push temps réel).

### Lien admin dans le footer

`components/SiteFooter.tsx` est maintenant asynchrone, vérifie la session,
et n'affiche le bouton **"Administration"** que si le visiteur est connecté
en tant qu'admin — invisible pour tout le monde d'autre.

### Photos migrées vers Vercel Blob (fini le base64 en base)

- `lib/blob.ts` : `uploadImage()` envoie le fichier (déjà redimensionné/
  compressé côté navigateur par `PhotoUploadField`) vers Vercel Blob et
  renvoie une vraie URL publique ; `deleteImage()` nettoie l'ancien fichier
  quand une photo est remplacée ou qu'un joueur/université/sponsor/élément
  de galerie est supprimé.
- **La base de données stocke la référence (l'URL), pas le fichier** — c'est
  ce que tu voulais dire par "stockées dans la bd" : la colonne `photo`
  existe toujours dans `Player`, elle contient juste une URL
  `https://*.blob.vercel-storage.com/...` au lieu d'un bloc base64 de
  plusieurs centaines de Ko. Résultat : requêtes plus légères, et — point
  important — ces URLs sont de vraies images, donc elles fonctionnent enfin
  comme vignette de partage (`og:image`) sur WhatsApp/réseaux, ce qui était
  impossible avec le base64 (voir la limite notée en Phase 11).
- `PhotoUploadField.tsx` a été réécrit : il redimensionne toujours côté
  navigateur (canvas, 480px, JPEG 0.82), mais soumet maintenant un vrai
  fichier (via le tour de passe-passe `DataTransfer` sur l'`<input
  type="file">`) plutôt qu'une chaîne base64 cachée.
- **Fiche joueur** : la photo est maintenant affichée **dans l'en-tête**, à
  droite du nom/texte "Profil joueur" (comme demandé, façon maquette), en
  grand (96-128px), plus seulement en petit médaillon plus bas.
- **⚠️ Configuration requise** : crée un Blob Store dans l'onglet
  **Storage** de ton projet Vercel, connecte-le au projet — Vercel ajoute
  automatiquement `BLOB_READ_WRITE_TOKEN` aux variables d'environnement. En
  local, copie cette même valeur dans ton `.env`. Vercel Blob a un tier
  gratuit ; vérifie les limites actuelles sur
  vercel.com/docs/storage/vercel-blob si ton volume de photos grossit
  beaucoup.

### Vrai push temps réel (Pusher Channels)

- Remplace le polling (10-15s) par un **vrai push** : `lib/realtime.ts`
  (serveur, déclenche un événement Pusher quasi instantanément après
  chaque action admin qui touche un match/classement/joueur) +
  `lib/hooks/useRealtime.ts` (client, s'abonne au canal Pusher concerné).
  `MatchCentre`, `LiveFeed` et `LiveStandings` utilisent ce nouveau hook.
- **Filet de sécurité gardé volontairement** : chaque composant garde aussi
  un poll de secours toutes les 45s, au cas où un événement push serait
  manqué (coupure réseau, etc.) — mieux vaut un léger délai occasionnel
  qu'un écran figé. Le hook `usePolling` d'origine a été supprimé
  (entièrement remplacé par `useRealtime`).
- **Ce que ça change concrètement pour la latence** : une action admin
  (but, changement de statut, composition publiée…) apparaît côté public en
  **moins d'une seconde** au lieu de 10-15s. Sans Pusher configuré, l'app
  continue de fonctionner normalement mais retombe uniquement sur le poll
  de secours (45s) — dégradation silencieuse, pas de crash.
- **⚠️ Configuration requise** : crée une app sur
  [dashboard.pusher.com](https://dashboard.pusher.com) (plan Sandbox
  gratuit — ~100-200 connexions simultanées et 200k messages/jour, largement
  suffisant pour un tournoi universitaire, et c'est justement la techno que
  le Laravel d'origine utilisait). Renseigne les 6 variables Pusher dans
  `.env` (voir `.env.example`) — les 4 préfixées `NEXT_PUBLIC_` sont
  publiques (clé + cluster seulement, jamais le secret), servent au client
  pour s'abonner aux canaux.

### Bracket à élimination directe

- `/bracket` (page publique) + `components/Bracket.tsx` : rendu par
  colonnes (un tour = une colonne), espacement calculé pour que les paires
  convergent visuellement comme un vrai tableau, ligne connectrice simple
  entre chaque match et le tour suivant, indicateur live pulsant.
- Deux nouveaux champs sur `Match` : `bracketRound` (numéro de tour — 1,
  2, 3…) et `bracketPosition` (position verticale dans le tour, 0-indexée) —
  renseignés dans le formulaire de création de match et dans une
  **nouvelle page d'édition de match** (`/admin/matches/[id]/edit`, qui
  manquait jusqu'ici — seule la création existait).
- **Portée volontairement limitée** : pas de progression automatique du
  vainqueur vers le match suivant (ça demanderait une vraie machine à
  états — quel match suit lequel, gestion des égalités/tirs au but qui
  décident qui avance…). Pour l'instant, l'admin crée chaque match du
  bracket manuellement avec son tour/position, comme pour n'importe quel
  match. Dis-moi si tu veux qu'on ajoute l'avancement automatique ensuite.

### ⚠️ À faire après avoir remplacé les fichiers

```powershell
npx prisma migrate dev --name add-bracket-fields
npm install   # ajoute @vercel/blob, pusher, pusher-js
```

Puis configurer `BLOB_READ_WRITE_TOKEN` (Vercel Storage) et les 6 variables
Pusher dans `.env` — voir `.env.example` pour la liste complète. **Le site
fonctionne sans ces deux configs** (dégradation silencieuse : upload photo
échouera proprement avec un message d'erreur si Blob n'est pas configuré ;
le temps réel retombe sur le poll de 45s si Pusher n'est pas configuré) —
mais les deux fonctionnalités demandées ne seront actives qu'une fois
renseignées.

## Phase 13 — Confort (🟢) + refonte admin sombre (fait)

### 🟢 Confort

- **Mentions légales / confidentialité** (`/mentions-legales`) : nécessaire
  car le site collecte des données personnelles (date de naissance,
  nationalité, photo). Lien dans le footer et sur le formulaire
  d'inscription.
- **CI basique** (`.github/workflows/ci.yml`) : sur chaque push/PR vers
  `main`, GitHub Actions installe les dépendances, lance `npm test`, génère
  le client Prisma et vérifie que `next build` passe. Détecte les régressions
  avant qu'elles n'atteignent la prod.
- **Notifications email aux admins** (`lib/notifications.ts`, via
  [Resend](https://resend.com), tier gratuit) : à chaque nouvelle inscription
  joueur en attente, et quand un match démarre. Désactivé proprement (aucun
  crash) si `RESEND_API_KEY` n'est pas renseigné.
- **Partage WhatsApp** (`components/WhatsAppShareLink.tsx`) : simple lien
  `wa.me` pré-rempli avec le score et le lien du direct — pas besoin de
  l'API WhatsApp Business (lourde à mettre en place, validation Meta
  requise). Disponible sur la page Live Center admin.

### Refonte admin — thème sombre (nouvelle maquette)

L'admin repasse en thème sombre rouge/noir (le site public reste clair —
seule l'interface d'administration change), avec un tableau de bord
largement enrichi :

- **Sidebar** : logo mains-cœur, mise en avant de la page active en rouge.
- **Cartes stats avec icônes** (universités, équipes, joueurs, matchs, en
  direct, inscriptions en attente).
- **Boutons d'export** proéminents : classement en CSV **et PDF**
  désormais (`pdf-lib`, génération légère sans navigateur headless), joueurs
  en CSV.
- **Widget Match Live Monitor** : aperçu compact du match en cours (minute,
  score, dernier buteur), cliquable vers le Live Center.
- **Widget Sponsors** : logos + nombre de sponsors actifs (je n'ai pas
  inventé de fausses métriques de "performance" sponsor — on n'a pas ces
  données ; le widget montre des chiffres réels).
- **Widget Prochains matchs** et **widget Journal de sécurité** (extrait des
  5 dernières entrées du journal d'audit) directement sur le tableau de
  bord, avec lien vers la vue complète.
- Tous les formulaires/tableaux admin existants (universités, équipes,
  joueurs, matchs, galerie, sponsors, comptes, 2FA) ont été convertis au
  thème sombre — aucune fonctionnalité n'a changé, uniquement l'habillage.

### ⚠️ À faire après avoir remplacé les fichiers

```powershell
npm install   # ajoute resend, pdf-lib
```

Pour activer les notifications email : crée un compte sur resend.com,
renseigne `RESEND_API_KEY` dans `.env` (voir `.env.example`). Sans ça,
l'app fonctionne normalement, juste sans emails.

## Phase 14 — Fiche équipe avancée (fait)

**Nouveau dans le schéma** (⚠️ migration nécessaire) : `University.city`,
`University.foundedYear`, `Team.captainId`.

- **Palette conservée rouge/blanc** — la maquette fournie était en bleu,
  reprise avec la palette `brand` existante du site (pas de nouvelle
  couleur introduite).
- **Hero** : dégradé rouge, écusson, nom de l'équipe, université, ville,
  badges (groupe, catégorie), 4 blocs stats — **Trophées et Finales sont
  calculés à partir des vrais matchs** (`round` contenant "final",
  gagné/perdu), pas des compteurs inventés.
- **Onglets** (`components/TeamProfile.tsx`, gestion client comme
  `MatchCentre`, support `?tab=`) : Aperçu / Effectif / Matchs /
  Statistiques / Actualités.
  - **Actualités** : pas de système d'articles/news dans l'app — l'onglet
    affiche honnêtement "Pas encore d'actualités" plutôt que de simuler du
    contenu. Dis-moi si tu veux qu'on construise un vrai système d'actus.
- **Nouveaux champs admin** : ville et année de fondation sur les
  universités, **capitaine d'équipe** (sélectionné parmi l'effectif) — et au
  passage, ajout des **pages d'édition d'équipe qui manquaient**
  (`/admin/teams/[id]/edit`, seule la création existait jusqu'ici).
- CTA de soutien à l'équipe en bas de page.

### ⚠️ À faire après avoir remplacé les fichiers

```powershell
npx prisma migrate dev --name add-team-university-fields
```

## Phase 15 — Actualités, page équipes avancée, favoris (fait)

**Nouveau dans le schéma** (⚠️ migration nécessaire) : modèle `NewsArticle`.

### Système d'actualités (pour de vrai, cette fois)

- `NewsArticle` : titre, slug auto-généré (unique), résumé, contenu
  (paragraphes séparés par une ligne vide), image de couverture (Vercel
  Blob), rattachement optionnel à une équipe, statut publié/brouillon.
- **Admin** (`/admin/news`) : créer, modifier, publier/dépublier, supprimer.
- **Public** : `/actualites` (liste), `/actualites/[slug]` (article, avec
  métadonnées Open Graph pour le partage), et l'onglet **Actualités** de la
  fiche équipe affiche maintenant les vrais articles de cette équipe.

### Page Équipes reconstruite (`components/TeamsExplorer.tsx`)

- Hero avec 4 stats réelles (équipes, joueurs, matchs joués, édition).
- Widget sidebar **Aperçu général** (total équipes/joueurs/matchs, buts
  marqués/encaissés — agrégés depuis les classements).
- **Filtres** : recherche par nom, filtre par groupe, tri (nom/effectif/
  matchs joués), bouton réinitialiser — tout côté client, réactif.
- Bascule **grille/liste**, et onglets **Toutes les équipes / Par groupe**.
- **Favoris fonctionnels** (`lib/hooks/useFavorites.ts`) : étoile cliquable
  sur chaque carte équipe, persistée en `localStorage` — pas de compte
  utilisateur public sur le site, donc pas de synchronisation entre
  appareils, mais ça survit aux rafraîchissements/fermetures du navigateur.
  Nouvelle page `/favoris` listant les matchs des équipes suivies, bouton
  "Favoris" de la nav maintenant fonctionnel (menait nulle part avant).

### Nouveaux champs admin (suite de la Phase 14)

Ville et année de fondation (université), capitaine d'équipe — déjà
documentés en Phase 14, migration commune.

### ⚠️ À faire après avoir remplacé les fichiers

```powershell
npx prisma migrate dev --name add-news-articles
```

## Phase 16 — La liste "expert" complète (fait)

**Nouveau dans le schéma** (⚠️ migration nécessaire) : `MatchCommentary`,
`PushSubscription`.

1. **Zones de qualification colorées** — top 2 de chaque groupe en vert
   (qualifié), dernier en rouge (élimination), sur `/standings` et le widget
   sidebar. Légende affichée sous le tableau.
2. **Confrontations directes (H2H)** — nouvel onglet "Face-à-face" dans le
   Match Centre : bilan victoires/nuls/défaites + 5 dernières rencontres
   entre les deux équipes. Calculé côté serveur (donnée statique, pas dans
   le flux temps réel).
3. **Notation des joueurs par match** — `lib/rating.ts`, **formule
   transparente et testée** (base 6.0, +1.0/but, +0.7/passe D., -0.5/jaune,
   -1.5/rouge, ±0.3 selon le résultat de l'équipe, clampé 1-10). Visible
   dans le tableau "Parcours" de la fiche joueur (colonne Note) et en note
   moyenne dans les stats. Dis-moi si tu veux ajuster la pondération.
4. **Commentaire minute par minute** — nouveau modèle `MatchCommentary`
   (texte libre + minute), formulaire dédié dans le Live Center admin,
   fusionné chronologiquement avec les événements suivis dans l'onglet
   Résumé du Match Centre public.
5. **Notifications push navigateur** (`lib/push.ts`, `web-push`,
   `public/sw.js`) : abonnement par équipe suivie (lié aux favoris), déclenché
   à chaque **but marqué** et à chaque **début de match** pour les équipes
   favorites. Page `/favoris` a maintenant un bouton "Activer les
   notifications".
   - **⚠️ Configuration requise** : génère une paire de clés VAPID avec
     `npx web-push generate-vapid-keys`, renseigne les 4 variables dans
     `.env` (voir `.env.example`). Sans ça, le bouton affiche un message
     et rien ne casse.
   - Un fichier `public/icon.png` optionnel améliore le rendu des
     notifications (sinon, icône par défaut du navigateur).

## Idées pour la suite (au-delà des 5 phases)

*(Phases 1 à 5 sont toutes faites, voir ci-dessus.)*

- Import des données réelles depuis `public/sauvegarde_ucup.sql` via un
  script de seed dédié.
- Modération de l'inscription joueur (statut `pending/approved`).
- Notifications (email ou WhatsApp, comme dans `TicketFlow`) à la publication
  d'une composition ou à la fin d'un match.
- Rate limiting sur `/api/auth/login` et `/api/auth/verify-2fa`.
- Tests end-to-end du minuteur (démarrage, pause, reprise, temps additionnel)
  avant mise en production.

## Notes de migration importantes

- Les tables `match_lineups` et `lineups` existent toutes les deux dans le
  projet Laravel d'origine (usage qui se chevauche) — j'ai gardé les deux telles
  quelles dans le schéma Prisma pour fidélité, mais tu voudras probablement
  n'en garder qu'une lors de la Phase 1.
- `standings.won/drawn/lost` sont les colonnes réellement utilisées par le
  modèle Laravel (`Standing.php`) ; les colonnes `wins/losses/draws` ajoutées
  par une migration ultérieure semblent redondantes et n'ont pas été reprises.
- Le panneau **Filament** (`app/Filament`) n'a pas d'équivalent direct : la
  Phase 1 (CRUD admin Next.js) le remplace.
- Import des données existantes : un script `prisma/seed.ts` (à écrire) peut
  lire `public/sauvegarde_ucup.sql` pour réinjecter les données réelles dans
  Neon.

## Recommandation

Vu la taille du projet d'origine, la suite (phases 1 à 5) se prête bien à
**Claude Code** — tu peux pointer Claude Code sur ce dossier et lui demander
d'enchaîner les phases une par une, avec un vrai accès au système de fichiers
et la possibilité de lancer `npm run build` / `prisma migrate` pour valider
chaque étape.
