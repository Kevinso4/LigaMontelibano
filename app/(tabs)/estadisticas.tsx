import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Team, Match } from '../../types';
import { getTeams, getMatches } from '../../utils/storage';
import { Colors, Spacing, BorderRadius, FontSize } from '../../utils/theme';

interface TopScorer {
  teamName: string;
  goals: number;
}

export default function StatsScreen() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'general' | 'attack' | 'defense'>('general');

  const loadData = async () => {
    try {
      const [loadedTeams, loadedMatches] = await Promise.all([
        getTeams(),
        getMatches(),
      ]);
      setTeams(loadedTeams);
      setMatches(loadedMatches.filter(m => m.status === 'finished'));
    } catch (error) {
      console.error('Error cargando datos:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  // Estadísticas generales
  const totalMatches = matches.length;
  const totalGoals = matches.reduce((sum, m) => sum + m.homeScore + m.awayScore, 0);
  const avgGoalsPerMatch = totalMatches > 0 ? (totalGoals / totalMatches).toFixed(2) : '0.00';

  // Mejor ataque (más goles a favor)
  const bestAttack = [...teams].sort((a, b) => (b.goalsFor || 0) - (a.goalsFor || 0))[0];

  // Mejor defensa (menos goles en contra)
  const bestDefense = [...teams]
    .filter(t => (t.goalsAgainst || 0) > 0 || (t.wins || 0) > 0)
    .sort((a, b) => (a.goalsAgainst || 0) - (b.goalsAgainst || 0))[0];

  // Equipo más ganador
  const mostWins = [...teams].sort((a, b) => (b.wins || 0) - (a.wins || 0))[0];

  // Partido con más goles
  const highestScoringMatch = [...matches].sort((a, b) => 
    (b.homeScore + b.awayScore) - (a.homeScore + a.awayScore)
  )[0];

  // Top 5 equipos goleadores
  const topScorers = [...teams]
    .filter(t => (t.goalsFor || 0) > 0)
    .sort((a, b) => (b.goalsFor || 0) - (a.goalsFor || 0))
    .slice(0, 5);

  // Top 5 mejores defensas
  const topDefenses = [...teams]
    .filter(t => (t.wins || 0) > 0 || (t.goalsAgainst || 0) > 0)
    .sort((a, b) => (a.goalsAgainst || 0) - (b.goalsAgainst || 0))
    .slice(0, 5);

  // Equipos invictos
  const undefeatedTeams = teams.filter(t => (t.losses || 0) === 0 && (t.wins || 0) > 0);

  const renderGeneralStats = () => (
    <View>
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{totalMatches}</Text>
          <Text style={styles.statLabel}>Partidos Jugados</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{totalGoals}</Text>
          <Text style={styles.statLabel}>Goles Totales</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{avgGoalsPerMatch}</Text>
          <Text style={styles.statLabel}>Promedio por Partido</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{teams.length}</Text>
          <Text style={styles.statLabel}>Equipos Activos</Text>
        </View>
      </View>

      {bestAttack && (
        <View style={styles.highlightCard}>
          <Text style={styles.highlightIcon}>⚔️</Text>
          <Text style={styles.highlightTitle}>Mejor Ataque</Text>
          <Text style={styles.highlightTeam}>{bestAttack.name}</Text>
          <Text style={styles.highlightValue}>{bestAttack.goalsFor || 0} goles</Text>
        </View>
      )}

      {bestDefense && (
        <View style={styles.highlightCard}>
          <Text style={styles.highlightIcon}>🛡️</Text>
          <Text style={styles.highlightTitle}>Mejor Defensa</Text>
          <Text style={styles.highlightTeam}>{bestDefense.name}</Text>
          <Text style={styles.highlightValue}>{bestDefense.goalsAgainst || 0} goles recibidos</Text>
        </View>
      )}

      {mostWins && (mostWins.wins || 0) > 0 && (
        <View style={styles.highlightCard}>
          <Text style={styles.highlightIcon}>👑</Text>
          <Text style={styles.highlightTitle}>Más Victorias</Text>
          <Text style={styles.highlightTeam}>{mostWins.name}</Text>
          <Text style={styles.highlightValue}>{mostWins.wins || 0} victorias</Text>
        </View>
      )}

      {highestScoringMatch && (
        <View style={styles.highlightCard}>
          <Text style={styles.highlightIcon}>🔥</Text>
          <Text style={styles.highlightTitle}>Partido con Más Goles</Text>
          <Text style={styles.highlightMatch}>
            {highestScoringMatch.homeTeamName} {highestScoringMatch.homeScore} - {highestScoringMatch.awayScore} {highestScoringMatch.awayTeamName}
          </Text>
          <Text style={styles.highlightValue}>
            {highestScoringMatch.homeScore + highestScoringMatch.awayScore} goles
          </Text>
        </View>
      )}

      {undefeatedTeams.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⭐ Equipos Invictos</Text>
          {undefeatedTeams.map((team) => (
            <View key={team.id} style={styles.listItem}>
              <Text style={styles.listItemName}>{team.name}</Text>
              <Text style={styles.listItemValue}>
                {team.wins || 0}G {team.draws || 0}E
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );

  const renderAttackStats = () => (
    <View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>⚽ Top 5 Goleadores</Text>
        {topScorers.length === 0 ? (
          <Text style={styles.emptyText}>No hay datos disponibles</Text>
        ) : (
          topScorers.map((team, index) => (
            <View key={team.id} style={styles.rankItem}>
              <View style={styles.rankBadge}>
                <Text style={styles.rankNumber}>#{index + 1}</Text>
              </View>
              <Text style={styles.rankName}>{team.name}</Text>
              <Text style={styles.rankValue}>{team.goalsFor || 0} goles</Text>
            </View>
          ))
        )}
      </View>

      {bestAttack && (
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Promedio de goles por partido</Text>
          <Text style={styles.infoValue}>
            {((bestAttack.goalsFor || 0) / Math.max((bestAttack.wins || 0) + (bestAttack.draws || 0) + (bestAttack.losses || 0), 1)).toFixed(2)}
          </Text>
          <Text style={styles.infoTeam}>{bestAttack.name}</Text>
        </View>
      )}
    </View>
  );

  const renderDefenseStats = () => (
    <View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🛡️ Top 5 Mejores Defensas</Text>
        {topDefenses.length === 0 ? (
          <Text style={styles.emptyText}>No hay datos disponibles</Text>
        ) : (
          topDefenses.map((team, index) => (
            <View key={team.id} style={styles.rankItem}>
              <View style={styles.rankBadge}>
                <Text style={styles.rankNumber}>#{index + 1}</Text>
              </View>
              <Text style={styles.rankName}>{team.name}</Text>
              <Text style={styles.rankValue}>{team.goalsAgainst || 0} goles</Text>
            </View>
          ))
        )}
      </View>

      {bestDefense && (
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Promedio de goles recibidos</Text>
          <Text style={styles.infoValue}>
            {((bestDefense.goalsAgainst || 0) / Math.max((bestDefense.wins || 0) + (bestDefense.draws || 0) + (bestDefense.losses || 0), 1)).toFixed(2)}
          </Text>
          <Text style={styles.infoTeam}>{bestDefense.name}</Text>
        </View>
      )}
    </View>
  );

  if (teams.length === 0 || matches.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>📈</Text>
          <Text style={styles.emptyTitle}>No hay estadísticas</Text>
          <Text style={styles.emptyText}>
            Las estadísticas se generarán automáticamente cuando se registren partidos.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Estadísticas</Text>

        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'general' && styles.tabActive]}
            onPress={() => setSelectedTab('general')}
          >
            <Text style={[styles.tabText, selectedTab === 'general' && styles.tabTextActive]}>
              General
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, selectedTab === 'attack' && styles.tabActive]}
            onPress={() => setSelectedTab('attack')}
          >
            <Text style={[styles.tabText, selectedTab === 'attack' && styles.tabTextActive]}>
              Ataque
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, selectedTab === 'defense' && styles.tabActive]}
            onPress={() => setSelectedTab('defense')}
          >
            <Text style={[styles.tabText, selectedTab === 'defense' && styles.tabTextActive]}>
              Defensa
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {selectedTab === 'general' && renderGeneralStats()}
        {selectedTab === 'attack' && renderAttackStats()}
        {selectedTab === 'defense' && renderDefenseStats()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  tabContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: '#007AFF',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#fff',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  highlightCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  highlightIcon: {
    fontSize: 40,
    marginBottom: 10,
  },
  highlightTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  highlightTeam: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  highlightMatch: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
    textAlign: 'center',
  },
  highlightValue: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  section: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  listItemName: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  listItemValue: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
  rankItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  rankBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  rankNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  rankName: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  rankValue: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: 'bold',
  },
  infoCard: {
    backgroundColor: '#E3F2FD',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 15,
  },
  infoTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  infoValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 5,
  },
  infoTeam: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyEmoji: {
    fontSize: 60,
    marginBottom: 15,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
});