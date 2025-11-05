import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ImageBackground,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, router } from 'expo-router';

interface Team {
  id: string;
  name: string;
  captain: string;
  createdAt: string;
}

export default function HomeScreen() {
  const [totalTeams, setTotalTeams] = useState(0);
  const [recentTeams, setRecentTeams] = useState<Team[]>([]);

  // Cargar estadísticas
  const loadStats = async () => {
    try {
      const storedTeams = await AsyncStorage.getItem('teams');
      if (storedTeams) {
        const teams: Team[] = JSON.parse(storedTeams);
        setTotalTeams(teams.length);
        // Obtener los 3 equipos más recientes
        const sorted = teams.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setRecentTeams(sorted.slice(0, 3));
      }
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadStats();
    }, [])
  );

  return (
    <ScrollView style={styles.container}>
      {/* Header con gradiente */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>⚽ Liga Montelibano</Text>
        <Text style={styles.headerSubtitle}>Sistema de Gestión Deportiva</Text>
      </View>

      {/* Tarjetas de estadísticas */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{totalTeams}</Text>
          <Text style={styles.statLabel}>Equipos Registrados</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>0</Text>
          <Text style={styles.statLabel}>Partidos Jugados</Text>
        </View>
      </View>

      {/* Accesos rápidos */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Accesos Rápidos</Text>
        
        <TouchableOpacity
          style={styles.quickActionCard}
          onPress={() => router.push('/crear-equipo')}
        >
          <View style={styles.quickActionIcon}>
            <Text style={styles.iconText}>➕</Text>
          </View>
          <View style={styles.quickActionContent}>
            <Text style={styles.quickActionTitle}>Registrar Equipo</Text>
            <Text style={styles.quickActionDescription}>
              Agrega un nuevo equipo a la liga
            </Text>
          </View>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickActionCard}
          onPress={() => router.push('/(tabs)/equipos')}
        >
          <View style={styles.quickActionIcon}>
            <Text style={styles.iconText}>👥</Text>
          </View>
          <View style={styles.quickActionContent}>
            <Text style={styles.quickActionTitle}>Ver Equipos</Text>
            <Text style={styles.quickActionDescription}>
              Consulta todos los equipos registrados
            </Text>
          </View>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.quickActionCard, styles.disabledCard]}
          disabled
        >
          <View style={styles.quickActionIcon}>
            <Text style={styles.iconText}>🏆</Text>
          </View>
          <View style={styles.quickActionContent}>
            <Text style={styles.quickActionTitle}>Tabla de Posiciones</Text>
            <Text style={styles.quickActionDescription}>
              Próximamente disponible
            </Text>
          </View>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Equipos recientes */}
      {recentTeams.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Últimos Equipos Registrados</Text>
          {recentTeams.map((team) => (
            <View key={team.id} style={styles.recentTeamCard}>
              <View style={styles.teamBadge}>
                <Text style={styles.teamBadgeText}>⚽</Text>
              </View>
              <View style={styles.recentTeamInfo}>
                <Text style={styles.recentTeamName}>{team.name}</Text>
                <Text style={styles.recentTeamCaptain}>
                  Capitán: {team.captain}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Mensaje de bienvenida si no hay equipos */}
      {totalTeams === 0 && (
        <View style={styles.welcomeContainer}>
          <Text style={styles.welcomeEmoji}>🎉</Text>
          <Text style={styles.welcomeTitle}>¡Bienvenido a Liga Montelibano!</Text>
          <Text style={styles.welcomeText}>
            Comienza registrando tu primer equipo para empezar a gestionar tu liga deportiva.
          </Text>
          <TouchableOpacity
            style={styles.welcomeButton}
            onPress={() => router.push('/crear-equipo')}
          >
            <Text style={styles.welcomeButtonText}>Registrar Primer Equipo</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Liga Montelibano © 2025
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#007AFF',
    padding: 30,
    paddingTop: 40,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 15,
  },
  statCard: {
    flex: 1,
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
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  quickActionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  disabledCard: {
    opacity: 0.5,
  },
  quickActionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  iconText: {
    fontSize: 24,
  },
  quickActionContent: {
    flex: 1,
  },
  quickActionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 3,
  },
  quickActionDescription: {
    fontSize: 13,
    color: '#666',
  },
  arrow: {
    fontSize: 24,
    color: '#ccc',
    marginLeft: 10,
  },
  recentTeamCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  teamBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  teamBadgeText: {
    fontSize: 20,
  },
  recentTeamInfo: {
    flex: 1,
  },
  recentTeamName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  recentTeamCaptain: {
    fontSize: 13,
    color: '#666',
  },
  welcomeContainer: {
    backgroundColor: '#fff',
    margin: 20,
    padding: 30,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  welcomeEmoji: {
    fontSize: 60,
    marginBottom: 15,
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  welcomeText: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  welcomeButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 8,
  },
  welcomeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    padding: 20,
    alignItems: 'center',
    marginTop: 20,
  },
  footerText: {
    fontSize: 12,
    color: '#999',
  },
});