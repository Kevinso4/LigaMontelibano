export interface Team {
  id: string;
  name: string;
  captain: string;
  wins?: number;
  draws?: number;
  losses?: number;
  goalsFor?: number;
  goalsAgainst?: number;
  points?: number;
  createdAt: string;
  logo?: string;
  color?: string;
  players?: Player[];
  achievements?: Achievement[];
}

export interface Player {
  id: string;
  name: string;
  teamId: string;
  number: number;
  position: 'Portero' | 'Defensa' | 'Medio' | 'Delantero';
  goals: number;
  assists?: number;
  yellowCards: number;
  redCards: number;
  photo?: string;
  isSuspended: boolean;
  matchesPlayed: number;
}

export interface Match {
  id: string;
  homeTeamId: string;
  awayTeamId: string;
  homeTeamName: string;
  awayTeamName: string;
  homeScore: number;
  awayScore: number;
  date: string;
  time?: string;
  location?: string;
  status: 'pending' | 'live' | 'finished';
  homeLineup?: string[];
  awayLineup?: string[];
  events?: MatchEvent[];
  mvpVotes?: { [playerId: string]: number };
  predictions?: Prediction[];
  liveUpdates?: LiveUpdate[];
}

export interface MatchEvent {
  id: string;
  matchId: string;
  minute: number;
  type: 'goal' | 'yellow_card' | 'red_card' | 'substitution' | 'penalty';
  playerId: string;
  playerName: string;
  teamId: string;
  assistPlayerId?: string;
  description?: string;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt: string;
  type: 'team' | 'player';
}

export interface Prediction {
  id: string;
  matchId: string;
  userId: string;
  userName: string;
  predictedHomeScore: number;
  predictedAwayScore: number;
  points?: number;
}

export interface LiveUpdate {
  id: string;
  matchId: string;
  timestamp: string;
  message: string;
  type: 'goal' | 'card' | 'substitution' | 'comment';
}

export interface News {
  id: string;
  title: string;
  content: string;
  author: string;
  createdAt: string;
  image?: string;
  category: 'resultado' | 'noticia' | 'entrevista' | 'highlight';
  likes: number;
  comments: Comment[];
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  teamId: string;
  userId: string;
  userName: string;
  message: string;
  timestamp: string;
  type: 'text' | 'image' | 'video';
  mediaUrl?: string;
}

export interface FixtureConfig {
  id: string;
  name: string;
  teams: string[];
  type: 'round_robin' | 'knockout' | 'groups';
  homeAndAway: boolean;
  startDate: string;
  endDate?: string;
  matches: Match[];
}

export interface Vote {
  id: string;
  title: string;
  description: string;
  options: VoteOption[];
  createdAt: string;
  expiresAt: string;
  type: 'mvp' | 'best_goal' | 'team_of_week';
}

export interface VoteOption {
  id: string;
  label: string;
  playerId?: string;
  matchId?: string;
  votes: number;
}

export interface UserProfile {
  id: string;
  name: string;
  email?: string;
  favoriteTeamId?: string;
  predictionPoints: number;
  achievements: Achievement[];
}