import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Match } from '../types';
import { getMatches, updateMatchResult } from '../utils/storage';
import { Colors, Spacing, BorderRadius, FontSize } from '../utils/theme';

export default function RegisterResultScreen() {
  const { matchId } = useLocalSearchParams();
  const [match, setMatch] = useState<Match | null>(null);
  const [homeScore, setHomeScore] = useState('0');
  const [awayScore, setAwayScore] = useState('0');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadMatch();
  }, [matchId]);

  const loadMatch = async () => {
    const matches = await getMatches();
    const foundMatch = matches.find(m => m.id === matchId);
    if (foundMatch) {
      setMatch(foundMatch);
      if (foundMatch.status === 'finished') {
        setHomeScore(foundMatch.homeScore.toString());
        setAwayScore(foundMatch.awayScore.toString());
      }
    }
  };

  const handleSaveResult = async () => {
    const home = parseInt(homeScore);
    const away = parseInt(awayScore);

    if (isNaN(home) || isNaN(away) || home < 0 || away < 0) {
      Alert.alert('Error', 'Los marcadores deben ser números válidos.');
      return;
    }

    setIsSubmitting(true);

    try {
      const success = await updateMatchResult(matchId as string, home, away);

      if (success) {
        Alert.alert(
          'Éxito',
          'Resultado guardado correctamente.',
          [
            {
              text: 'Ver Partidos',
              onPress: () => router.push('/(tabs)/partidos'),
            },
          ]
        );
      } else {
        Alert.alert('Error', 'No se pudo guardar el resultado.');
      }
    } catch (error) {
      console.error('Error guardando resultado:', error);
      Alert.alert('Error', 'Ocurrió un error al guardar.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const incrementScore = (team: 'home' | 'away') => {
    if (team === 'home') {
      setHomeScore((parseInt(homeScore) + 1).toString());
    } else {
      setAwayScore((parseInt(awayScore) + 1).toString());
    }
  };

  const decrementScore = (team: 'home' | 'away') => {
    if (team === 'home') {
      const current = parseInt(homeScore);
      if (current > 0) setHomeScore((current - 1).toString());
    } else {
      const current = parseInt(awayScore);
      if (current > 0) setAwayScore((current - 1).toString());
    }
  };

  if (!match) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Cargando partido...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Registrar Resultado</Text>
        <Text style={styles.date}>
          {new Date(match.date).toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </Text>
      </View>

      <View style={styles.scoreContainer}>
        {/* Equipo Local */}
        <View style={styles.teamContainer}>
          <Text style={styles.teamName}>{match.homeTeamName}</Text>
          <View style={styles.scoreControls}>
            <TouchableOpacity
              style={styles.controlButton}
              onPress={() => decrementScore('home')}
            >
              <Text style={styles.controlButtonText}>−</Text>
            </TouchableOpacity>

            <TextInput
              style={styles.scoreInput}
              value={homeScore}
              onChangeText={setHomeScore}
              keyboardType="numeric"
              maxLength={2}
            />

            <TouchableOpacity
              style={styles.controlButton}
              onPress={() => incrementScore('home')}
            >
              <Text style={styles.controlButtonText}>+</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.teamLabel}>LOCAL</Text>
        </View>

        <Text style={styles.vsText}>VS</Text>

        {/* Equipo Visitante */}
        <View style={styles.teamContainer}>
          <Text style={styles.teamName}>{match.awayTeamName}</Text>
          <View style={styles.scoreControls}>
            <TouchableOpacity
              style={styles.controlButton}
              onPress={() => decrementScore('away')}
            >
              <Text style={styles.controlButtonText}>−</Text>
            </TouchableOpacity>

            <TextInput
              style={styles.scoreInput}
              value={awayScore}
              onChangeText={setAwayScore}
              keyboardType="numeric"
              maxLength={2}
            />

            <TouchableOpacity
              style={styles.controlButton}
              onPress={() => incrementScore('away')}
            >
              <Text style={styles.controlButtonText}>+</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.teamLabel}>VISITANTE</Text>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.saveButton, isSubmitting && styles.saveButtonDisabled]}
        onPress={handleSaveResult}
        disabled={isSubmitting}
      >
        <Text style={styles.saveButtonText}>
          {isSubmitting ? 'Guardando...' : 'Guardar Resultado'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#007AFF',
    padding: 20,
    paddingTop: 40,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  date: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 50,
  },
  scoreContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    padding: 20,
    marginTop: 20,
  },
  teamContainer: {
    flex: 1,
    alignItems: 'center',
  },
  teamName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
  },
  scoreControls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  controlButton: {
    width: 50,
    height: 50,
    backgroundColor: '#007AFF',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlButtonText: {
    fontSize: 32,
    color: '#fff',
    fontWeight: 'bold',
  },
  scoreInput: {
    width: 80,
    height: 80,
    fontSize: 48,
    fontWeight: 'bold',
    color: '#007AFF',
    textAlign: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 10,
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  teamLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
    marginTop: 5,
  },
  vsText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#999',
  },
  saveButton: {
    backgroundColor: '#34C759',
    margin: 20,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});