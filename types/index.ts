export interface Team {
  id: string;
  name: string;
  captain: string;
  createdAt: string;
  wins?: number;
  losses?: number;
  draws?: number;
  points?: number;
}

export interface Match {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  date: string;
}