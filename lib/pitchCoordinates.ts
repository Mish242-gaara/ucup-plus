export interface StarterPlayer {
  id?: number;
  playerId?: number;
  jerseyNumber?: number;
  playerName?: string;
  lastName?: string;
  photo?: string | null;
  player?: {
    jerseyNumber?: number;
    lastName?: string;
    photo?: string | null;
  };
}

export function getCoordinatesForFormation(
  formation: string = "4-3-3",
  isStarterList: StarterPlayer[] = []
) {
  // Coordonnées prédéfinies pour la moitié supérieure (0,0 = haut-gauche, 100,100 = bas-droite)
  // Y: 10-12 = GK, 28-32 = DEF, 48-70 = MID, 85-90 = ATT
  const presets: Record<string, { x: number; y: number }[]> = {
    "4-3-3": [
      { x: 50, y: 10 }, // GK
      { x: 15, y: 28 }, { x: 38, y: 28 }, { x: 62, y: 28 }, { x: 85, y: 28 }, // DEF
      { x: 30, y: 55 }, { x: 70, y: 55 }, { x: 50, y: 68 }, // MID
      { x: 20, y: 88 }, { x: 50, y: 90 }, { x: 80, y: 88 }, // ATT
    ],
    "4-2-3-1": [
      { x: 50, y: 10 }, // GK
      { x: 15, y: 28 }, { x: 38, y: 28 }, { x: 62, y: 28 }, { x: 85, y: 28 }, // DEF
      { x: 35, y: 48 }, { x: 65, y: 48 }, // MDC
      { x: 20, y: 70 }, { x: 50, y: 70 }, { x: 80, y: 70 }, // MOC
      { x: 50, y: 90 }, // BU
    ],
    "4-4-2": [
      { x: 50, y: 10 }, // GK
      { x: 15, y: 28 }, { x: 38, y: 28 }, { x: 62, y: 28 }, { x: 85, y: 28 }, // DEF
      { x: 15, y: 58 }, { x: 38, y: 58 }, { x: 62, y: 58 }, { x: 85, y: 58 }, // MID
      { x: 35, y: 88 }, { x: 65, y: 88 }, // ATT
    ],
    "3-5-2": [
      { x: 50, y: 10 }, // GK
      { x: 25, y: 28 }, { x: 50, y: 28 }, { x: 75, y: 28 }, // DC
      { x: 12, y: 55 }, { x: 37, y: 58 }, { x: 63, y: 58 }, { x: 88, y: 55 }, { x: 50, y: 72 }, // MID
      { x: 35, y: 88 }, { x: 65, y: 88 }, // ATT
    ],
    "3-4-3": [
      { x: 50, y: 10 }, // GK
      { x: 25, y: 28 }, { x: 50, y: 28 }, { x: 75, y: 28 }, // DC
      { x: 15, y: 55 }, { x: 38, y: 58 }, { x: 62, y: 58 }, { x: 85, y: 55 }, // MID
      { x: 20, y: 88 }, { x: 50, y: 90 }, { x: 80, y: 88 }, // ATT
    ],
  };

  const coords = presets[formation] || presets["4-3-3"];

  return isStarterList.slice(0, 11).map((player, index) => {
    // Extraction intelligente du nom de famille ou prénom/nom
    const rawName = player.playerName || player.lastName || player.player?.lastName || "Joueur";
    const displayName = rawName.split(" ").slice(-1)[0]; // Prend seulement le dernier mot (nom de famille)

    return {
      id: player.id || player.playerId || index,
      jerseyNumber: player.jerseyNumber || player.player?.jerseyNumber || index + 1,
      name: displayName,
      photo: player.photo || player.player?.photo || null,
      x: coords[index]?.x ?? 50,
      y: coords[index]?.y ?? 50,
    };
  });
}