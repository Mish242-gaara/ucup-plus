// lib/utils/h2h.ts

export type MatchResult = "V" | "N" | "D";

export interface TeamForm {
  recent: MatchResult[]; // ex: ['V', 'V', 'N', 'D', 'V']
  points: number;       // Points accumulés sur les 5 derniers matchs
}

export interface H2HAdvancedStats {
  homeForm: TeamForm;
  awayForm: TeamForm;
  probabilities: {
    homeWin: number; // en %
    draw: number;    // en %
    awayWin: number; // en %
  };
  h2hSummary: {
    homeWins: number;
    draws: number;
    awayWins: number;
    totalMatches: number;
  };
}

interface BasicMatch {
  id: number;
  homeTeamId: number;
  awayTeamId: number;
  homeScore: number | null;
  awayScore: number | null;
  matchDate: Date;
}

/**
 * Extrait le résultat d'un match du point de vue d'une équipe donnée
 */
function getMatchResultForTeam(match: BasicMatch, teamId: number): MatchResult | null {
  if (match.homeScore === null || match.awayScore === null) return null;

  const isHome = match.homeTeamId === teamId;
  const teamScore = isHome ? match.homeScore : match.awayScore;
  const opponentScore = isHome ? match.awayScore : match.homeScore;

  if (teamScore > opponentScore) return "V";
  if (teamScore === opponentScore) return "N";
  return "D";
}

/**
 * Calcule la forme récente (5 derniers matchs joués)
 */
export function calculateTeamForm(matches: BasicMatch[], teamId: number): TeamForm {
  const completedMatches = matches
    .filter((m) => m.homeScore !== null && m.awayScore !== null)
    .sort((a, b) => new Date(b.matchDate).getTime() - new Date(a.matchDate).getTime())
    .slice(0, 5);

  const recent: MatchResult[] = [];
  let points = 0;

  // Parcourir du plus ancien au plus récent
  completedMatches.reverse().forEach((m) => {
    const res = getMatchResultForTeam(m, teamId);
    if (res) {
      recent.push(res);
      if (res === "V") points += 3;
      if (res === "N") points += 1;
    }
  });

  return { recent, points };
}

/**
 * Algorithme simple de probabilités (Forme récente + Historique Direct)
 */
export function calculateH2HAdvanced(
  homeTeamId: number,
  awayTeamId: number,
  homeMatches: BasicMatch[],
  awayMatches: BasicMatch[],
  directMatches: BasicMatch[]
): H2HAdvancedStats {
  const homeForm = calculateTeamForm(homeMatches, homeTeamId);
  const awayForm = calculateTeamForm(awayMatches, awayTeamId);

  // Historique direct
  let homeWins = 0;
  let draws = 0;
  let awayWins = 0;

  const validDirect = directMatches.filter((m) => m.homeScore !== null && m.awayScore !== null);

  validDirect.forEach((m) => {
    const isHomeTeamDominant =
      (m.homeTeamId === homeTeamId && m.homeScore! > m.awayScore!) ||
      (m.awayTeamId === homeTeamId && m.awayScore! > m.homeScore!);

    const isAwayTeamDominant =
      (m.homeTeamId === awayTeamId && m.homeScore! > m.awayScore!) ||
      (m.awayTeamId === awayTeamId && m.awayScore! > m.homeScore!);

    if (m.homeScore === m.awayScore) {
      draws++;
    } else if (isHomeTeamDominant) {
      homeWins++;
    } else if (isAwayTeamDominant) {
      awayWins++;
    }
  });

  // Calcul du score de force (Weighting: 60% forme récente + 40% historique direct)
  const maxFormPoints = 15; // 5 victoires = 15 pts
  const homeFormRating = homeForm.points / (maxFormPoints || 1);
  const awayFormRating = awayForm.points / (maxFormPoints || 1);

  const totalDirect = validDirect.length;
  const homeDirectRating = totalDirect > 0 ? homeWins / totalDirect : 0.33;
  const awayDirectRating = totalDirect > 0 ? awayWins / totalDirect : 0.33;
  const drawDirectRating = totalDirect > 0 ? draws / totalDirect : 0.34;

  let rawHome = homeFormRating * 0.6 + homeDirectRating * 0.4 + 0.05; // +5% avantage domicile
  let rawAway = awayFormRating * 0.6 + awayDirectRating * 0.4;
  let rawDraw = 0.25 + drawDirectRating * 0.15; // Nul de base ~25%

  const totalRaw = rawHome + rawAway + rawDraw;

  // Normalisation en pourcentage
  const homeWin = Math.round((rawHome / totalRaw) * 100);
  const awayWin = Math.round((rawAway / totalRaw) * 100);
  const draw = 100 - homeWin - awayWin;

  return {
    homeForm,
    awayForm,
    probabilities: { homeWin, draw, awayWin },
    h2hSummary: {
      homeWins,
      draws,
      awayWins,
      totalMatches: totalDirect,
    },
  };
}