import { Team, Match } from '../types';
import { Platform, Share } from 'react-native';

export const generateStandingsText = (teams: Team[]): string => {
  const sorted = [...teams].sort((a, b) => {
    const pointsDiff = (b.points || 0) - (a.points || 0);
    if (pointsDiff !== 0) return pointsDiff;
    return ((b.goalsFor || 0) - (b.goalsAgainst || 0)) - ((a.goalsFor || 0) - (a.goalsAgainst || 0));
  });

  let text = '⚽ TABLA DE POSICIONES - LIGA MONTELIBANO\n\n';
  text += 'Pos | Equipo | PJ | G | E | P | GF | GC | DG | Pts\n';
  text += '─'.repeat(60) + '\n';

  sorted.forEach((team, index) => {
    const played = (team.wins || 0) + (team.draws || 0) + (team.losses || 0);
    const goalDiff = (team.goalsFor || 0) - (team.goalsAgainst || 0);
    
    text += `${(index + 1).toString().padStart(2)} | `;
    text += `${team.name.substring(0, 15).padEnd(15)} | `;
    text += `${played.toString().padStart(2)} | `;
    text += `${(team.wins || 0).toString().padStart(2)} | `;
    text += `${(team.draws || 0).toString().padStart(2)} | `;
    text += `${(team.losses || 0).toString().padStart(2)} | `;
    text += `${(team.goalsFor || 0).toString().padStart(2)} | `;
    text += `${(team.goalsAgainst || 0).toString().padStart(2)} | `;
    text += `${(goalDiff >= 0 ? '+' : '')}${goalDiff.toString().padStart(2)} | `;
    text += `${(team.points || 0).toString().padStart(3)}\n`;
  });

  text += '\nGenerado desde Liga Montelibano App';
  return text;
};

export const generateMatchesText = (matches: Match[]): string => {
  let text = '⚽ RESULTADOS - LIGA MONTELIBANO\n\n';
  
  const finished = matches.filter(m => m.status === 'finished');
  const pending = matches.filter(m => m.status === 'pending');

  if (finished.length > 0) {
    text += '✅ PARTIDOS FINALIZADOS:\n';
    text += '─'.repeat(50) + '\n';
    finished.forEach(match => {
      const date = new Date(match.date).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
      text += `${date} | ${match.homeTeamName} ${match.homeScore} - ${match.awayScore} ${match.awayTeamName}\n`;
    });
    text += '\n';
  }

  if (pending.length > 0) {
    text += '⏳ PARTIDOS PENDIENTES:\n';
    text += '─'.repeat(50) + '\n';
    pending.forEach(match => {
      const date = new Date(match.date).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
      text += `${date} | ${match.homeTeamName} vs ${match.awayTeamName}\n`;
    });
  }

  text += '\nGenerado desde Liga Montelibano App';
  return text;
};

export const shareStandings = async (teams: Team[]): Promise<boolean> => {
  try {
    const text = generateStandingsText(teams);
    
    if (Platform.OS === 'web') {
      // En web, copiar al portapapeles
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        return true;
      }
      return false;
    }

    const result = await Share.share({
      message: text,
      title: 'Tabla de Posiciones - Liga Montelibano',
    });

    return result.action === Share.sharedAction;
  } catch (error) {
    console.error('Error compartiendo:', error);
    return false;
  }
};

export const shareMatches = async (matches: Match[]): Promise<boolean> => {
  try {
    const text = generateMatchesText(matches);
    
    if (Platform.OS === 'web') {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        return true;
      }
      return false;
    }

    const result = await Share.share({
      message: text,
      title: 'Resultados - Liga Montelibano',
    });

    return result.action === Share.sharedAction;
  } catch (error) {
    console.error('Error compartiendo:', error);
    return false;
  }
};

export const exportAllData = async (teams: Team[], matches: Match[]): Promise<string> => {
  const data = {
    exportDate: new Date().toISOString(),
    version: '1.0',
    teams,
    matches,
  };

  return JSON.stringify(data, null, 2);
};