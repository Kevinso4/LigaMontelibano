import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { Picker } from '@react-native-picker/picker';
import { Team, Match } from '../types';
import { getTeams, addMatch } from '../utils/storage';
import { Colors, Spacing, BorderRadius, FontSize } from '../utils/theme';

export default function CreateMatchScreen() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [homeTeamId, setHomeTeamId] = useState<string>('');
  const [awayTeamId, setAwayTeamId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadTeams();
  }, []);

  const loadTeams = async () => {
    const loadedTeams = await getTeams();
    setTeams(loadedTeams);
    if (loadedTeams.length > 0) {
      setHomeTeamId(loadedTeams[0].id);
      if (loadedTeams.length > 1) {
        setAwayTeamId(loadedTeams[1].id);
      }
    }
  };

  const handleCreateMatch = async () => {
    if (!homeTeamId || !awayTeamId) {
      Alert.alert('Error', 'Debes seleccionar ambos equipos.');
      return;
    }

    if (homeTeamId === awayTeamId) {
      Alert.alert('Error', 'Un equipo no puede jugar contra sí mismo.');
      return;
    }

    setIsSubmitting(true);

    try {
      const homeTeam = teams.find(t => t.id === homeTeamId);
      const awayTeam = teams.find(t => t.id === awayTeamId);

      if (!homeTeam || !awayTeam) {
        Alert.alert('Error', 'Equipos no encontrados.');
        setIsSubmitting(false);
        return;
      }

      const newMatch: Match = {
        id: Date.now().toString(),
        homeTeamId: homeTeam.id,
        awayTeamId: awayTeam.id,
        homeTeamName: homeTeam.name,
        awayTeamName: awayTeam.name,
        homeScore: 0,
        awayScore: 0,
        date: new Date().toISOString(),
        status: 'pending',
      };

      const success = await addMatch(newMatch);

      if (success) {
        Alert.alert(
          'Éxito',
          'Partido creado correctamente.',
          [
            {
              text: 'Ver Partidos',
              onPress: () => router.push('/(tabs)/partidos'),
            },
            {
              text: 'Registrar Resultado',
              onPress: () => router.push(`/registrar-resultado?matchId=${newMatch.id}`),
            },
          ]
        );
      } else {
        Alert.alert('Error', 'No se pudo crear el partido.');
      }
    } catch (error) {
      console.error('Error creando partido:', error);
      Alert.alert('Error', 'Ocurrió un error al crear el partido.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (teams.length < 2) {
    return (
      <View style={styles.container}>
        <View style={styles.warningContainer}>
          <Text style={styles.warningEmoji}>⚠️</Text>
          <Text style={styles.warningTitle}>Equipos Insuficientes</Text>
          <Text style={styles.warningText}>
            Necesitas al menos 2 equipos registrados para crear un partido.
          </Text>
          <TouchableOpacity
            style={styles.warningButton}
            onPress={() => router.push('/crear-equipo')}
          >
            <Text style={styles.warningButtonText}>Registrar Equipos</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.form}>
        <Text style={styles.title}>Nuevo Partido</Text>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Equipo Local:</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={homeTeamId}
              onValueChange={(value) => setHomeTeamId(value)}
              style={styles.picker}
            >
              {teams.map((team) => (
                <Picker.Item key={team.id} label={team.name} value={team.id} />
              ))}
            </Picker>
          </View>
        </View>

        <View style={styles.vsContainer}>
          <Text style={styles.vsText}>VS</Text>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Equipo Visitante:</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={awayTeamId}
              onValueChange={(value) => setAwayTeamId(value)}
              style={styles.picker}
            >
              {teams.map((team) => (
                <Picker.Item key={team.id} label={team.name} value={team.id} />
              ))}
            </Picker>
          </View>
        </View>

        <View style={styles.preview}>
          <Text style={styles.previewTitle}>Partido a crear:</Text>
          <Text style={styles.previewMatch}>
            {teams.find(t => t.id === homeTeamId)?.name} vs{' '}
            {teams.find(t => t.id === awayTeamId)?.name}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.button, isSubmitting && styles.buttonDisabled]}
          onPress={handleCreateMatch}
          disabled={isSubmitting}
        >
          <Text style={styles.buttonText}>
            {isSubmitting ? 'Creando...' : 'Crear Partido'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  form: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  pickerContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    overflow: 'hidden',
  },
  picker: {
    height: Platform.OS === 'ios' ? 180 : 50,
  },
  vsContainer: {
    alignItems: 'center',
    marginVertical: 10,
  },
  vsText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  preview: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  previewTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  previewMatch: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  warningContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  warningEmoji: {
    fontSize: 60,
    marginBottom: 15,
  },
  warningTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  warningText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 24,
  },
  warningButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 8,
  },
  warningButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});