import AsyncStorage from '@react-native-async-storage/async-storage';
import { Achievement, Match, MatchEvent, News, Player, Team } from '../types';
import { isWeb } from './network';

// Función auxiliar para obtener datos
const getData = async (key: string): Promise<any> => {
  try {
    if (isWeb()) {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } else {
      const data = await AsyncStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    }
  } catch (error) {
    console.error(`Error getting ${key}:`, error);
    return null;
  }
};

// Función auxiliar para guardar datos
const saveData = async (key: string, data: any): Promise<boolean> => {
  try {
    const jsonData = JSON.stringify(data);
    if (isWeb()) {
      localStorage.setItem(key, jsonData);
    } else {
      await AsyncStorage.setItem(key, jsonData);
    }
    return true;
  } catch (error) {
    console.error(`Error saving ${key}:`, error);
    return false;
  }
};

// ==================== TEAMS ====================
export const getTeams = async (): Promise<Team[]> => {
  try {
    const data = await getData('teams');
    return data || [];
  } catch (error) {
    console.error('Error getting teams:', error);
    return [];
  }
};

export const getTeamById = async (teamId: string): Promise<Team | null> => {
  try {
    const teams = await getTeams();
    return teams.find(t => t.id === teamId) || null;
  } catch (error) {
    console.error('Error getting team by id:', error);
    return null;
  }
};

export const addTeam = async (team: Team): Promise<boolean> => {
  try {
    const teams = await getTeams();
    teams.push(team);
    return await saveData('teams', teams);
  } catch (error) {
    console.error('Error adding team:', error);
    return false;
  }
};

export const updateTeam = async (teamId: string, updates: Partial<Team>): Promise<boolean> => {
  try {
    const teams = await getTeams();
    const index = teams.findIndex(t => t.id === teamId);
    if (index !== -1) {
      teams[index] = { ...teams[index], ...updates };
      return await saveData('teams', teams);
    }
    return false;
  } catch (error) {
    console.error('Error updating team:', error);
    return false;
  }
};

export const deleteTeam = async (teamId: string): Promise<boolean> => {
  try {
    const teams = await getTeams();
    const filtered = teams.filter(t => t.id !== teamId);
    return await saveData('teams', filtered);
  } catch (error) {
    console.error('Error deleting team:', error);
    return false;
  }
};

export const saveTeams = async (teams: Team[]): Promise<boolean> => {
  try {
    return await saveData('teams', teams);
  } catch (error) {
    console.error('Error saving teams:', error);
    return false;
  }
};

// ==================== MATCHES ====================
export const getMatches = async (): Promise<Match[]> => {
  try {
    const data = await getData('matches');
    return data || [];
  } catch (error) {
    console.error('Error getting matches:', error);
    return [];
  }
};

export const addMatch = async (match: Match): Promise<boolean> => {
  try {
    const matches = await getMatches();
    matches.push(match);
    return await saveData('matches', matches);
  } catch (error) {
    console.error('Error adding match:', error);
    return false;
  }
};

export const saveMatches = async (newMatches: Match[]): Promise<boolean> => {
  try {
    const existingMatches = await getMatches();
    const allMatches = [...existingMatches, ...newMatches];
    return await saveData('matches', allMatches);
  } catch (error) {
    console.error('Error saving matches:', error);
    return false;
  }
};

export const updateMatch = async (matchId: string, updates: Partial<Match>): Promise<boolean> => {
  try {
    const matches = await getMatches();
    const index = matches.findIndex(m => m.id === matchId);
    if (index !== -1) {
      matches[index] = { ...matches[index], ...updates };

      // Si el partido se finalizó, actualizar estadísticas
      if (updates.status === 'finished') {
        await updateTeamStatsFromMatch(matches[index]);
      }

      return await saveData('matches', matches);
    }
    return false;
  } catch (error) {
    console.error('Error updating match:', error);
    return false;
  }
};

export const deleteMatch = async (matchId: string): Promise<boolean> => {
  try {
    const matches = await getMatches();
    const filtered = matches.filter(m => m.id !== matchId);
    return await saveData('matches', filtered);
  } catch (error) {
    console.error('Error deleting match:', error);
    return false;
  }
};

export const updateMatchResult = async (
  matchId: string,
  homeScore: number,
  awayScore: number
): Promise<boolean> => {
  try {
    const matches = await getMatches();
    const index = matches.findIndex(m => m.id === matchId);
    
    if (index !== -1) {
      matches[index].homeScore = homeScore;
      matches[index].awayScore = awayScore;
      matches[index].status = 'finished';

      // Actualizar estadísticas de equipos
      await updateTeamStatsFromMatch(matches[index]);

      return await saveData('matches', matches);
    }
    return false;
  } catch (error) {
    console.error('Error updating match result:', error);
    return false;
  }
};

const updateTeamStatsFromMatch = async (match: Match): Promise<void> => {
  const teams = await getTeams();
  const homeTeamIndex = teams.findIndex(t => t.id === match.homeTeamId);
  const awayTeamIndex = teams.findIndex(t => t.id === match.awayTeamId);

  if (homeTeamIndex === -1 || awayTeamIndex === -1) return;

  const homeTeam = teams[homeTeamIndex];
  const awayTeam = teams[awayTeamIndex];

  // Actualizar estadísticas del equipo local
  homeTeam.goalsFor = (homeTeam.goalsFor || 0) + match.homeScore;
  homeTeam.goalsAgainst = (homeTeam.goalsAgainst || 0) + match.awayScore;

  // Actualizar estadísticas del equipo visitante
  awayTeam.goalsFor = (awayTeam.goalsFor || 0) + match.awayScore;
  awayTeam.goalsAgainst = (awayTeam.goalsAgainst || 0) + match.homeScore;

  // Determinar resultado
  if (match.homeScore > match.awayScore) {
    homeTeam.wins = (homeTeam.wins || 0) + 1;
    homeTeam.points = (homeTeam.points || 0) + 3;
    awayTeam.losses = (awayTeam.losses || 0) + 1;
  } else if (match.homeScore < match.awayScore) {
    awayTeam.wins = (awayTeam.wins || 0) + 1;
    awayTeam.points = (awayTeam.points || 0) + 3;
    homeTeam.losses = (homeTeam.losses || 0) + 1;
  } else {
    homeTeam.draws = (homeTeam.draws || 0) + 1;
    homeTeam.points = (homeTeam.points || 0) + 1;
    awayTeam.draws = (awayTeam.draws || 0) + 1;
    awayTeam.points = (awayTeam.points || 0) + 1;
  }

  teams[homeTeamIndex] = homeTeam;
  teams[awayTeamIndex] = awayTeam;

  await saveData('teams', teams);
};

// ==================== PLAYERS ====================
export const getPlayers = async (): Promise<Player[]> => {
  try {
    const data = await getData('players');
    return data || [];
  } catch (error) {
    console.error('Error getting players:', error);
    return [];
  }
};

export const getPlayersByTeam = async (teamId: string): Promise<Player[]> => {
  try {
    const players = await getPlayers();
    return players.filter(p => p.teamId === teamId);
  } catch (error) {
    console.error('Error getting players by team:', error);
    return [];
  }
};

export const addPlayer = async (player: Player): Promise<boolean> => {
  try {
    const players = await getPlayers();
    players.push(player);
    return await saveData('players', players);
  } catch (error) {
    console.error('Error adding player:', error);
    return false;
  }
};

export const updatePlayer = async (playerId: string, updates: Partial<Player>): Promise<boolean> => {
  try {
    const players = await getPlayers();
    const index = players.findIndex(p => p.id === playerId);
    if (index !== -1) {
      players[index] = { ...players[index], ...updates };
      return await saveData('players', players);
    }
    return false;
  } catch (error) {
    console.error('Error updating player:', error);
    return false;
  }
};

export const deletePlayer = async (playerId: string): Promise<boolean> => {
  try {
    const players = await getPlayers();
    const filtered = players.filter(p => p.id !== playerId);
    return await saveData('players', filtered);
  } catch (error) {
    console.error('Error deleting player:', error);
    return false;
  }
};

// ==================== MATCH EVENTS ====================
export const getMatchEvents = async (matchId: string): Promise<MatchEvent[]> => {
  try {
    const data = await getData(`match_events_${matchId}`);
    return data || [];
  } catch (error) {
    console.error('Error getting match events:', error);
    return [];
  }
};

export const addMatchEvent = async (event: MatchEvent): Promise<boolean> => {
  try {
    const events = await getMatchEvents(event.matchId);
    events.push(event);
    
    // Actualizar estadísticas del jugador
    if (event.type === 'goal') {
      const players = await getPlayers();
      const playerIndex = players.findIndex(p => p.id === event.playerId);
      if (playerIndex !== -1) {
        players[playerIndex].goals += 1;
        await saveData('players', players);
      }
    } else if (event.type === 'yellow_card' || event.type === 'red_card') {
      const players = await getPlayers();
      const playerIndex = players.findIndex(p => p.id === event.playerId);
      if (playerIndex !== -1) {
        if (event.type === 'yellow_card') {
          players[playerIndex].yellowCards += 1;
          // Suspender si tiene 3 amarillas
          if (players[playerIndex].yellowCards >= 3) {
            players[playerIndex].isSuspended = true;
          }
        } else {
          players[playerIndex].redCards += 1;
          players[playerIndex].isSuspended = true;
        }
        await saveData('players', players);
      }
    }
    
    return await saveData(`match_events_${event.matchId}`, events);
  } catch (error) {
    console.error('Error adding match event:', error);
    return false;
  }
};

// ==================== ACHIEVEMENTS ====================
export const getAchievements = async (entityId: string): Promise<Achievement[]> => {
  try {
    const data = await getData(`achievements_${entityId}`);
    return data || [];
  } catch (error) {
    console.error('Error getting achievements:', error);
    return [];
  }
};

export const unlockAchievement = async (
  entityId: string,
  achievement: Achievement
): Promise<boolean> => {
  try {
    const achievements = await getAchievements(entityId);
    // Verificar que no esté ya desbloqueado
    if (!achievements.find(a => a.id === achievement.id)) {
      achievements.push(achievement);
      return await saveData(`achievements_${entityId}`, achievements);
    }
    return false;
  } catch (error) {
    console.error('Error unlocking achievement:', error);
    return false;
  }
};

// ==================== NEWS ====================
export const getAllNews = async (): Promise<News[]> => {
  try {
    const data = await getData('news');
    return data || [];
  } catch (error) {
    console.error('Error getting news:', error);
    return [];
  }
};

export const addNews = async (news: News): Promise<boolean> => {
  try {
    const allNews = await getAllNews();
    allNews.unshift(news); // Agregar al inicio
    return await saveData('news', allNews);
  } catch (error) {
    console.error('Error adding news:', error);
    return false;
  }
};

// ==================== FIXTURE GENERATOR ====================
export const generateRoundRobinFixture = async (
  teamIds: string[],
  homeAndAway: boolean = true
): Promise<Match[]> => {
  const matches: Match[] = [];
  const teams = await getTeams();
  const teamsMap = new Map(teams.map(t => [t.id, t]));
  
  const teamIdsCopy = [...teamIds];
  const n = teamIdsCopy.length;
  
  // Si es impar, agregar "BYE"
  if (n % 2 !== 0) {
    teamIdsCopy.push('BYE');
  }
  
  const totalRounds = homeAndAway ? (teamIdsCopy.length - 1) * 2 : teamIdsCopy.length - 1;
  
  for (let round = 0; round < totalRounds; round++) {
    const isSecondLeg = homeAndAway && round >= teamIdsCopy.length - 1;
    
    for (let i = 0; i < teamIdsCopy.length / 2; i++) {
      const home = teamIdsCopy[i];
      const away = teamIdsCopy[teamIdsCopy.length - 1 - i];
      
      if (home !== 'BYE' && away !== 'BYE') {
        const homeTeam = teamsMap.get(home);
        const awayTeam = teamsMap.get(away);
        
        if (homeTeam && awayTeam) {
          // Invertir local y visitante en la segunda vuelta
          const finalHome = isSecondLeg ? away : home;
          const finalAway = isSecondLeg ? home : away;
          const finalHomeTeam = isSecondLeg ? awayTeam : homeTeam;
          const finalAwayTeam = isSecondLeg ? homeTeam : awayTeam;
          
          const match: Match = {
            id: `${Date.now()}_${round}_${i}_${Math.random()}`,
            homeTeamId: finalHome,
            awayTeamId: finalAway,
            homeTeamName: finalHomeTeam.name,
            awayTeamName: finalAwayTeam.name,
            homeScore: 0,
            awayScore: 0,
            date: new Date(Date.now() + round * 7 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'pending',
          };
          matches.push(match);
        }
      }
    }
    
    // Rotar equipos (excepto el primero)
    const last = teamIdsCopy.pop();
    if (last) {
      teamIdsCopy.splice(1, 0, last);
    }
  }
  
  return matches;
};
