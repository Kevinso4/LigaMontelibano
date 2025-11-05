import AsyncStorage from '@react-native-async-storage/async-storage';
import { Team } from '../types';
import { Platform } from 'react-native';

export const StorageKeys = {
  TEAMS: 'teams',
  MATCHES: 'matches',
} as const;

// Función helper para manejar storage en web
const getStorageItem = async (key: string): Promise<string | null> => {
  try {
    if (Platform.OS === 'web') {
      // En web, usar localStorage como fallback
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key);
      }
    }
    return await AsyncStorage.getItem(key);
  } catch (error) {
    console.error('Error reading storage:', error);
    return null;
  }
};

const setStorageItem = async (key: string, value: string): Promise<void> => {
  try {
    if (Platform.OS === 'web') {
      // En web, usar localStorage como fallback
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
        return;
      }
    }
    await AsyncStorage.setItem(key, value);
  } catch (error) {
    console.error('Error writing storage:', error);
    throw error;
  }
};

export const getTeams = async (): Promise<Team[]> => {
  try {
    const data = await getStorageItem(StorageKeys.TEAMS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error loading teams:', error);
    return [];
  }
};

export const saveTeams = async (teams: Team[]): Promise<boolean> => {
  try {
    await setStorageItem(StorageKeys.TEAMS, JSON.stringify(teams));
    return true;
  } catch (error) {
    console.error('Error saving teams:', error);
    return false;
  }
};

export const deleteTeam = async (teamId: string): Promise<boolean> => {
  try {
    const teams = await getTeams();
    const updatedTeams = teams.filter(team => team.id !== teamId);
    return await saveTeams(updatedTeams);
  } catch (error) {
    console.error('Error deleting team:', error);
    return false;
  }
};

export const getTeamById = async (teamId: string): Promise<Team | null> => {
  try {
    const teams = await getTeams();
    return teams.find(team => team.id === teamId) || null;
  } catch (error) {
    console.error('Error getting team:', error);
    return null;
  }
};