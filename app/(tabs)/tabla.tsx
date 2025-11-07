import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
    Alert,
    FlatList,
    Platform,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { Team } from '../../types';
import { shareStandings } from '../../utils/export';
import { getTeams } from '../../utils/storage';
import { BorderRadius, Colors, FontSize, Spacing } from '../../utils/theme';

export default function StandingsScreen() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [sortBy, setSortBy] = useState<'points' | 'goalDiff'>('points');

  const loadTeams = async () => {
    try {
      const loadedTeams = await getTeams();
      const sorted = [...loadedTeams].sort((a, b) => {
        const aPoints = a.points || 0;
        const bPoints = b.points || 0;
        const aGoalDiff = (a.goalsFor || 0) - (a.goalsAgainst || 0);
        const bGoalDiff = (b.goalsFor || 0) - (b.goalsAgainst || 0);

        if (sortBy === 'points') {
          if (bPoints !== aPoints) return bPoints - aPoints;
          return bGoalDiff - aGoalDiff;
        } else {
          return bGoalDiff - aGoalDiff;
        }
      });
      setTeams(sorted);
    } catch (error) {
      console.error('Error cargando tabla:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTeams();
    setRefreshing(false);
  };

  useFocusEffect(
    useCallback(() => {
      loadTeams();
    }, [sortBy])
  );

  const handleShare = async () => {
    const success = await shareStandings(teams);
    if (success) {
      Alert.alert(
        'Éxito',
        Platform.OS === 'web' 
          ? 'Tabla copiada al portapapeles' 
          : 'Tabla compartida correctamente'
      );
    } else {
      Alert.alert('Error', 'No se pudo compartir la tabla');
    }
  };

  const renderHeader = () => (
    <View style={styles.tableHeader}>
      <Text style={[styles.headerText, styles.positionCol]}>#</Text>
      <Text style={[styles.headerText, styles.teamCol]}>Equipo</Text>
      <Text style={[styles.headerText, styles.statCol]}>PJ</Text>
      <Text style={[styles.headerText, styles.statCol]}>G</Text>
      <Text style={[styles.headerText, styles.statCol]}>E</Text>
      <Text style={[styles.headerText, styles.statCol]}>P</Text>
      <Text style={[styles.headerText, styles.statCol]}>GF</Text>
      <Text style={[styles.headerText, styles.statCol]}>GC</Text>
      <Text style={[styles.headerText, styles.statCol]}>DG</Text>
      <Text style={[styles.headerText, styles.pointsCol]}>Pts</Text>
    </View>
  );

  const renderTeamRow = ({ item, index }: { item: Team; index: number }) => {
    const played = (item.wins || 0) + (item.draws || 0) + (item.losses || 0);
    const goalDiff = (item.goalsFor || 0) - (item.goalsAgainst || 0);
    const position = index + 1;

    let positionStyle = styles.positionNormal;
    if (position === 1) positionStyle = styles.positionFirst;
    else if (position === 2) positionStyle = styles.positionSecond;
    else if (position === 3) positionStyle = styles.positionThird;

    return (
      <View style={styles.tableRow}>
        <View style={[styles.positionBadge, positionStyle]}>
          <Text style={styles.positionText}>{position}</Text>
        </View>
        <Text style={[styles.cellText, styles.teamCol]} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={[styles.cellText, styles.statCol]}>{played}</Text>
        <Text style={[styles.cellText, styles.statCol]}>{item.wins || 0}</Text>
        <Text style={[styles.cellText, styles.statCol]}>{item.draws || 0}</Text>
        <Text style={[styles.cellText, styles.statCol]}>{item.losses || 0}</Text>
        <Text style={[styles.cellText, styles.statCol]}>{item.goalsFor || 0}</Text>
        <Text style={[styles.cellText, styles.statCol]}>{item.goalsAgainst || 0}</Text>
        <Text style={[styles.cellText, styles.statCol, goalDiff >= 0 ? styles.positive : styles.negative]}>
          {goalDiff >= 0 ? '+' : ''}{goalDiff}
        </Text>
        <Text style={[styles.cellText, styles.pointsCol, styles.pointsText]}>
          {item.points || 0}
        </Text>
      </View>
    );
  };

  if (teams.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>📊</Text>
          <Text style={styles.emptyTitle}>No hay datos</Text>
          <Text style={styles.emptyText}>
            La tabla se actualizará automáticamente cuando se registren partidos.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Tabla de Posiciones</Text>
        
        <View style={styles.sortContainer}>
          <TouchableOpacity
            style={[styles.sortButton, sortBy === 'points' && styles.sortButtonActive]}
            onPress={() => setSortBy('points')}
          >
            <Text style={[styles.sortText, sortBy === 'points' && styles.sortTextActive]}>
              Por Puntos
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.sortButton, sortBy === 'goalDiff' && styles.sortButtonActive]}
            onPress={() => setSortBy('goalDiff')}
          >
            <Text style={[styles.sortText, sortBy === 'goalDiff' && styles.sortTextActive]}>
              Por Diferencia
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
          <Text style={styles.shareButtonText}>📤 Compartir Tabla</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendBox, styles.positionFirst]} />
          <Text style={styles.legendText}>1° Lugar</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendBox, styles.positionSecond]} />
          <Text style={styles.legendText}>2° Lugar</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendBox, styles.positionThird]} />
          <Text style={styles.legendText}>3° Lugar</Text>
        </View>
      </View>

      <FlatList
        data={teams}
        keyExtractor={(item) => item.id}
        renderItem={renderTeamRow}
        ListHeaderComponent={renderHeader}
        stickyHeaderIndices={[0]}
        contentContainerStyle={styles.tableContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          PJ: Partidos Jugados • G: Ganados • E: Empates • P: Perdidos
        </Text>
        <Text style={styles.footerText}>
          GF: Goles a Favor • GC: Goles en Contra • DG: Diferencia de Goles
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    padding: Spacing.lg,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: 'bold',
    marginBottom: Spacing.md,
    color: Colors.text,
  },
  sortContainer: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  sortButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
  },
  sortButtonActive: {
    backgroundColor: Colors.primary,
  },
  sortText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  sortTextActive: {
    color: '#fff',
  },
  shareButton: {
    backgroundColor: Colors.success,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  shareButtonText: {
    color: '#fff',
    fontSize: FontSize.base,
    fontWeight: '600',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: Spacing.md,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendBox: {
    width: 20,
    height: 20,
    borderRadius: 4,
  },
  legendText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  tableContainer: {
    backgroundColor: Colors.card,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f8f8f8',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    alignItems: 'center',
  },
  headerText: {
    fontSize: FontSize.xs,
    fontWeight: 'bold',
    color: Colors.text,
    textAlign: 'center',
  },
  cellText: {
    fontSize: FontSize.sm,
    color: Colors.text,
    textAlign: 'center',
  },
  positionCol: {
    width: 40,
  },
  teamCol: {
    flex: 1,
    textAlign: 'left',
    paddingLeft: 5,
  },
  statCol: {
    width: 35,
  },
  pointsCol: {
    width: 40,
  },
  positionBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  positionNormal: {
    backgroundColor: '#e0e0e0',
  },
  positionFirst: {
    backgroundColor: Colors.gold,
  },
  positionSecond: {
    backgroundColor: Colors.silver,
  },
  positionThird: {
    backgroundColor: Colors.bronze,
  },
  positionText: {
    fontSize: FontSize.sm,
    fontWeight: 'bold',
    color: '#fff',
  },
  pointsText: {
    fontWeight: 'bold',
    color: Colors.primary,
    fontSize: FontSize.base,
  },
  positive: {
    color: Colors.success,
    fontWeight: '600',
  },
  negative: {
    color: Colors.danger,
    fontWeight: '600',
  },
  footer: {
    padding: Spacing.md,
    backgroundColor: '#f8f8f8',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  footerText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginVertical: 2,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  emptyEmoji: {
    fontSize: 60,
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    fontSize: FontSize.xl,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  emptyText: {
    fontSize: FontSize.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
});