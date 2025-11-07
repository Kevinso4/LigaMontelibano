import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Platform,
} from 'react-native';
import { useFocusEffect, router } from 'expo-router';
import { Match } from '../../types';
import { getMatches, deleteMatch } from '../../utils/storage';
import { shareMatches } from '../../utils/export';
import { Colors, Spacing, BorderRadius, FontSize } from '../../utils/theme';

export default function MatchesScreen() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'finished'>('all');

  const loadMatches = async () => {
    try {
      const loadedMatches = await getMatches();
      setMatches(loadedMatches.reverse()); // Más recientes primero
    } catch (error) {
      console.error('Error cargando partidos:', error);
      Alert.alert('Error', 'No se pudieron cargar los partidos.');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMatches();
    setRefreshing(false);
  };

  useFocusEffect(
    useCallback(() => {
      loadMatches();
    }, [])
  );

  const filteredMatches = matches.filter(match => {
    if (filter === 'all') return true;
    return match.status === filter;
  });

  const renderMatchItem = ({ item }: { item: Match }) => (
    <TouchableOpacity
      style={styles.matchCard}
      onPress={() => {
        if (item.status === 'pending') {
          router.push(`/registrar-resultado?matchId=${item.id}`);
        }
      }}
    >
      <View style={styles.matchDate}>
        <Text style={styles.dateText}>
          {new Date(item.date).toLocaleDateString('es-ES', {
            day: '2-digit',
            month: 'short',
          })}
        </Text>
      </View>

      <View style={styles.matchContent}>
        <View style={styles.teamRow}>
          <Text style={styles.teamName}>{item.homeTeamName}</Text>
          <Text style={[styles.score, item.status === 'pending' && styles.pendingScore]}>
            {item.status === 'finished' ? item.homeScore : '-'}
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.teamRow}>
          <Text style={styles.teamName}>{item.awayTeamName}</Text>
          <Text style={[styles.score, item.status === 'pending' && styles.pendingScore]}>
            {item.status === 'finished' ? item.awayScore : '-'}
          </Text>
        </View>
      </View>

      {item.status === 'pending' && (
        <View style={styles.pendingBadge}>
          <Text style={styles.pendingText}>Pendiente</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const handleShare = async () => {
    const success = await shareMatches(matches);
    if (success) {
      Alert.alert(
        'Éxito',
        Platform.OS === 'web' 
          ? 'Resultados copiados al portapapeles' 
          : 'Resultados compartidos correctamente'
      );
    } else {
      Alert.alert('Error', 'No se pudo compartir los resultados');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Partidos</Text>

        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={[styles.filterButton, filter === 'all' && styles.filterButtonActive]}
            onPress={() => setFilter('all')}
          >
            <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
              Todos
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterButton, filter === 'pending' && styles.filterButtonActive]}
            onPress={() => setFilter('pending')}
          >
            <Text style={[styles.filterText, filter === 'pending' && styles.filterTextActive]}>
              Pendientes
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterButton, filter === 'finished' && styles.filterButtonActive]}
            onPress={() => setFilter('finished')}
          >
            <Text style={[styles.filterText, filter === 'finished' && styles.filterTextActive]}>
              Finalizados
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push('/crear-partido')}
        >
          <Text style={styles.addButtonText}>+ Nuevo Partido</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.shareButton}
          onPress={handleShare}
        >
          <Text style={styles.shareButtonText}>📤 Compartir</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.fixtureButton}
          onPress={() => router.push('/generar-fixture' as any)}
        >
          <Text style={styles.fixtureButtonText}>⚡ Generar Fixture</Text>
        </TouchableOpacity>
      </View>

      {filteredMatches.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            {filter === 'all' ? 'No hay partidos registrados' : `No hay partidos ${filter === 'pending' ? 'pendientes' : 'finalizados'}`}
          </Text>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => router.push('/crear-partido')}
          >
            <Text style={styles.emptyButtonText}>Crear primer partido</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredMatches}
          keyExtractor={(item) => item.id}
          renderItem={renderMatchItem}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
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
  filterContainer: {
    flexDirection: 'row',
    marginBottom: 15,
    gap: 10,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#007AFF',
  },
  filterText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#fff',
  },
  addButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  shareButton: {
    backgroundColor: '#28a745',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  shareButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  fixtureButton: {
    backgroundColor: Colors.secondary,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  fixtureButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  listContainer: {
    padding: 20,
  },
  matchCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 15,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  matchDate: {
    backgroundColor: '#007AFF',
    padding: 10,
    alignItems: 'center',
  },
  dateText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  matchContent: {
    padding: 15,
  },
  teamRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  teamName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  score: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
    minWidth: 40,
    textAlign: 'center',
  },
  pendingScore: {
    color: '#999',
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 5,
  },
  pendingBadge: {
    backgroundColor: '#FFA500',
    padding: 8,
    alignItems: 'center',
  },
  pendingText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    color: '#999',
    marginBottom: 20,
    textAlign: 'center',
  },
  emptyButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});