import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useFocusEffect, router } from 'expo-router';
import { Team, Match } from '../../types';
import { getTeams, getMatches } from '../../utils/storage';
import { Colors, Spacing, BorderRadius, FontSize } from '../../utils/theme';
import Card from '../../components/Card';

export default function HomeScreen() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const [loadedTeams, loadedMatches] = await Promise.all([
        getTeams(),
        getMatches(),
      ]);
      setTeams(loadedTeams);
      setMatches(loadedMatches);
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

  const totalMatches = matches.length;
  const finishedMatches = matches.filter(m => m.status === 'finished').length;
  const pendingMatches = matches.filter(m => m.status === 'pending').length;
  const totalGoals = matches
    .filter(m => m.status === 'finished')
    .reduce((sum, m) => sum + m.homeScore + m.awayScore, 0);

  const topTeams = [...teams]
    .sort((a, b) => (b.points || 0) - (a.points || 0))
    .slice(0, 3);

  const recentMatches = [...matches]
    .filter(m => m.status === 'finished')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 3);

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Header con gradiente simulado */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.greeting}>⚽ Liga Montelibano</Text>
          <Text style={styles.subtitle}>Temporada 2025</Text>
        </View>
      </View>

      {/* Estadísticas rápidas */}
      <View style={styles.statsContainer}>
        <Card style={styles.statCard}>
          <Text style={styles.statNumber}>{teams.length}</Text>
          <Text style={styles.statLabel}>Equipos</Text>
        </Card>

        <Card style={styles.statCard}>
          <Text style={styles.statNumber}>{finishedMatches}</Text>
          <Text style={styles.statLabel}>Partidos</Text>
        </Card>

        <Card style={styles.statCard}>
          <Text style={styles.statNumber}>{totalGoals}</Text>
          <Text style={styles.statLabel}>Goles</Text>
        </Card>

        <Card style={styles.statCard}>
          <Text style={styles.statNumber}>{pendingMatches}</Text>
          <Text style={styles.statLabel}>Pendientes</Text>
        </Card>
      </View>

      {/* Acciones rápidas */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>⚡ Acciones Rápidas</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: Colors.primary }]}
            onPress={() => router.push('/crear-equipo')}
          >
            <Text style={styles.actionIcon}>➕</Text>
            <Text style={styles.actionText}>Nuevo Equipo</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: Colors.success }]}
            onPress={() => router.push('/crear-partido')}
          >
            <Text style={styles.actionIcon}>🏆</Text>
            <Text style={styles.actionText}>Nuevo Partido</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: Colors.secondary }]}
            onPress={() => router.push('/(tabs)/tabla')}
          >
            <Text style={styles.actionIcon}>📊</Text>
            <Text style={styles.actionText}>Ver Tabla</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: Colors.warning }]}
            onPress={() => router.push('/(tabs)/estadisticas')}
          >
            <Text style={styles.actionIcon}>📈</Text>
            <Text style={styles.actionText}>Estadísticas</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Top 3 equipos */}
      {topTeams.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🏅 Top 3 Equipos</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/tabla')}>
              <Text style={styles.seeMoreText}>Ver más →</Text>
            </TouchableOpacity>
          </View>

          {topTeams.map((team, index) => (
            <Card key={team.id} style={styles.teamCard}>
              <View style={styles.teamRank}>
                <View
                  style={[
                    styles.rankBadge,
                    index === 0 && { backgroundColor: Colors.gold },
                    index === 1 && { backgroundColor: Colors.silver },
                    index === 2 && { backgroundColor: Colors.bronze },
                  ]}
                >
                  <Text style={styles.rankText}>#{index + 1}</Text>
                </View>
              </View>

              <View style={styles.teamInfo}>
                <Text style={styles.teamName}>{team.name}</Text>
                <Text style={styles.teamCaptain}>Cap: {team.captain}</Text>
              </View>

              <View style={styles.teamStats}>
                <Text style={styles.teamPoints}>{team.points || 0} pts</Text>
                <Text style={styles.teamRecord}>
                  {team.wins || 0}G {team.draws || 0}E {team.losses || 0}P
                </Text>
              </View>
            </Card>
          ))}
        </View>
      )}

      {/* Últimos partidos */}
      {recentMatches.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>⏱️ Últimos Resultados</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/partidos')}>
              <Text style={styles.seeMoreText}>Ver más →</Text>
            </TouchableOpacity>
          </View>

          {recentMatches.map((match) => (
            <Card key={match.id} style={styles.matchCard}>
              <View style={styles.matchRow}>
                <Text style={styles.matchTeam}>{match.homeTeamName}</Text>
                <Text style={styles.matchScore}>{match.homeScore}</Text>
              </View>

              <View style={styles.matchDivider} />

              <View style={styles.matchRow}>
                <Text style={styles.matchTeam}>{match.awayTeamName}</Text>
                <Text style={styles.matchScore}>{match.awayScore}</Text>
              </View>

              <Text style={styles.matchDate}>
                {new Date(match.date).toLocaleDateString('es-ES', {
                  day: 'numeric',
                  month: 'short',
                })}
              </Text>
            </Card>
          ))}
        </View>
      )}

      {/* Mensaje si no hay datos */}
      {teams.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>🚀</Text>
          <Text style={styles.emptyTitle}>¡Bienvenido!</Text>
          <Text style={styles.emptyText}>
            Comienza registrando tu primer equipo para gestionar tu liga.
          </Text>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => router.push('/crear-equipo')}
          >
            <Text style={styles.emptyButtonText}>Registrar Primer Equipo</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={{ height: Spacing.xl }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    backgroundColor: Colors.primary,
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: Spacing.lg,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerContent: {
    alignItems: 'center',
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: FontSize.base,
    color: '#fff',
    opacity: 0.9,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: Spacing.lg,
    gap: Spacing.sm,
    marginTop: -20,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  statNumber: {
    fontSize: FontSize.xxl,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 5,
  },
  statLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: 'bold',
    color: Colors.text,
  },
  seeMoreText: {
    fontSize: FontSize.sm,
    color: Colors.primary,
    fontWeight: '600',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  actionCard: {
    flex: 1,
    minWidth: '47%',
    aspectRatio: 1.5,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionIcon: {
    fontSize: 32,
    marginBottom: Spacing.sm,
  },
  actionText: {
    color: '#fff',
    fontSize: FontSize.sm,
    fontWeight: '600',
    textAlign: 'center',
  },
  teamCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    padding: Spacing.md,
  },
  teamRank: {
    marginRight: Spacing.md,
  },
  rankBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.border,
  },
  rankText: {
    fontSize: FontSize.base,
    fontWeight: 'bold',
    color: '#fff',
  },
  teamInfo: {
    flex: 1,
  },
  teamName: {
    fontSize: FontSize.base,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 3,
  },
  teamCaptain: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  teamStats: {
    alignItems: 'flex-end',
  },
  teamPoints: {
    fontSize: FontSize.lg,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 3,
  },
  teamRecord: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  matchCard: {
    marginBottom: Spacing.sm,
    padding: Spacing.md,
  },
  matchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  matchTeam: {
    fontSize: FontSize.base,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
  },
  matchScore: {
    fontSize: FontSize.xl,
    fontWeight: 'bold',
    color: Colors.primary,
    marginLeft: Spacing.sm,
  },
  matchDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.xs,
  },
  matchDate: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
    padding: Spacing.xl,
  },
  emptyEmoji: {
    fontSize: 60,
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    fontSize: FontSize.xxl,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  emptyText: {
    fontSize: FontSize.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
    lineHeight: 24,
  },
  emptyButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.md,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: FontSize.base,
    fontWeight: '600',
  },
});