export type StaminaLevel = 1 | 2 | 3 | 4 | 5;

export type Player = {
  id: string;
  name: string;
  active: boolean;
  joinedAtRound: number; // 0-indexed: which round the player joined
  stamina: StaminaLevel;
};

export type Match = {
  courtIndex: number;
  team1: [string, string]; // player IDs
  team2: [string, string]; // player IDs
};

export type Round = {
  roundIndex: number;
  matches: Match[];
  benchPlayerIds: string[];
  status: 'pending' | 'confirmed';
};

export type RoundCandidate = {
  matches: Match[];
  benchPlayerIds: string[];
  score: number;
};

// Statistics tracking
export type PlayerStats = {
  playerId: string;
  gamesPlayed: number;
  gamesAvailable: number; // rounds since joined
  benchCount: number;
  playRate: number; // gamesPlayed / gamesAvailable
  targetPlayRate: number; // based on stamina
};

export type PairCount = {
  player1Id: string;
  player2Id: string;
  count: number;
};

export type OpponentCount = {
  playerId: string;
  opponentId: string;
  count: number;
};
