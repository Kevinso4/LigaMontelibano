import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
} from 'react-native';
import { router } from 'expo-router';
import { getTeams, generateRoundRobinFixture, saveMatches } from '../utils/storage';
import { Team, Match } from '../types';
import { Colors, Spacing, BorderRadius, FontSize } from '../utils/theme';
import Card from '../components/Card';

export default function GenerateFixtureScreen() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeams, setSelectedTeams] = useState<Set<string>>(new Set());
  const [homeAndAway, setHomeAndAway] = useState(true);
  const [generatedMatches, setGeneratedMatches] = useState<Match[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    loadTeams();
  }, []);

  const loadTeams = async () => {
    const loadedTeams = await getTeams();
    setTeams(loadedTeams);
    // Seleccionar todos por defecto
    setSelectedTeams(new Set(loadedTeams.map(t => t.id)));
  };

  const toggleTeam = (teamId: string) => {
    const newSelected = new Set(selectedTeams);
    if (newSelected.has(teamId)) {
      newSelected.delete(teamId);
    } else {
      newSelected.add(teamId);
    }
    setSelectedTeams(newSelected);
  };

  const handleGenerate = async () => {
    if (selectedTeams.size < 2) {
      Alert.alert('Error', 'Selecciona al menos 2 equipos');
      return;
    }

    if (selectedTeams.size % 2 !== 0) {
      Alert.alert(
        'Advertencia',
        'Es recomendable tener un número par de equipos para un fixture balanceado. ¿Continuar?',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Continuar', onPress: generateFixture },
        ]
      );
      return;
    }

    generateFixture();
  };

  const generateFixture = async () => {
    setIsGenerating(true);
    try {
      const teamIds = Array.from(selectedTeams);
      const matches = await generateRoundRobinFixture(teamIds, homeAndAway);
      setGeneratedMatches(matches);
      
      Alert.alert(
        'Fixture Generado',
        `Se han generado ${matches.length} partidos.`,
        [
          {
            text: 'Ver Partidos',
            onPress: () => {},
          },
          {
            text: 'Guardar Fixture',
            onPress: saveFixture,
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'No se pudo generar el fixture');
    } finally {
      setIsGenerating(false);
    }
  };

  const saveFixture = async () => {
    const success = await saveMatches(generatedMatches);
    if (success) {
      Alert.alert(
        'Éxito',
        'Fixture guardado correctamente',
        [{ text: 'Ir a Partidos', onPress: () => router.push('/(tabs)/partidos') }]
      );
    } else {
      Alert.alert('Error', 'No se pudo guardar el fixture');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>⚽ Generar Fixture</Text>
        <Text style={styles.subtitle}>
          Crea automáticamente todos los partidos del torneo
        </Text>
      </View>

      <View style={styles.content}>
        <Card>
          <View style={styles.option}>
            <Text style={styles.optionLabel}>Ida y Vuelta</Text>
            <Switch
              value={homeAndAway}
              onValueChange={setHomeAndAway}
              trackColor={{ false: '#ccc', true: Colors.primary }}
            />
          </View>
          <Text style={styles.optionDescription}>
            {homeAndAway
              ? 'Cada equipo jugará 2 veces contra cada rival (local y visitante)'
              : 'Cada equipo jugará 1 vez contra cada rival'}
          </Text>
        </Card>

        <Text style={styles.sectionTitle}>
          Selecciona Equipos ({selectedTeams.size} seleccionados)
        </Text>

        {teams.map((team) => (
          <TouchableOpacity
            key={team.id}
            style={[
              styles.teamCard,
              selectedTeams.has(team.id) && styles.teamCardSelected,
            ]}
            onPress={() => toggleTeam(team.id)}
          >
            <View style={styles.teamInfo}>
              <Text style={styles.teamName}>{team.name}</Text>
              <Text style={styles.teamCaptain}>Cap: {team.captain}</Text>
            </View>
            {selectedTeams.has(team.id) && (
              <Text style={styles.checkmark}>✓</Text>
            )}
          </TouchableOpacity>
        ))}

        {generatedMatches.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>
              Vista Previa ({generatedMatches.length} partidos)
            </Text>
            {generatedMatches.slice(0, 5).map((match, index) => (
              <Card key={match.id} style={styles.matchPreview}>
                <Text style={styles.matchText}>
                  Fecha {Math.floor(index / (selectedTeams.size / 2)) + 1}
                </Text>
                <Text style={styles.matchTeams}>
                  {match.homeTeamName} vs {match.awayTeamName}
                </Text>
              </Card>
            ))}
            {generatedMatches.length > 5 && (
              <Text style={styles.moreText}>
                ... y {generatedMatches.length - 5} partidos más
              </Text>
            )}
          </>
        )}

        <TouchableOpacity
          style={[styles.generateButton, isGenerating && styles.buttonDisabled]}
          onPress={handleGenerate}
          disabled={isGenerating || selectedTeams.size < 2}
        >
          <Text style={styles.generateButtonText}>
            {isGenerating ? 'Generando...' : '⚡ Generar Fixture'}
          </Text>
        </TouchableOpacity>

        {generatedMatches.length > 0 && (
          <TouchableOpacity
            style={styles.saveButton}
            onPress={saveFixture}
          >
            <Text style={styles.saveButtonText}>💾 Guardar Fixture</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
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
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: FontSize.base,
    color: Colors.textSecondary,
  },
  content: {
    padding: Spacing.lg,
  },
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  optionLabel: {
    fontSize: FontSize.base,
    fontWeight: '600',
    color: Colors.text,
  },
  optionDescription: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
  },
  teamCard: {
    backgroundColor: Colors.card,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.border,
  },
  teamCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: '#E3F2FD',
  },
  teamInfo: {
    flex: 1,
  },
  teamName: {
    fontSize: FontSize.base,
    fontWeight: '600',
    color: Colors.text,
  },
  teamCaptain: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  checkmark: {
    fontSize: 24,
    color: Colors.primary,
  },
  matchPreview: {
    marginBottom: Spacing.sm,
  },
  matchText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: 5,
  },
  matchTeams: {
    fontSize: FontSize.base,
    fontWeight: '600',
    color: Colors.text,
  },
  moreText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  generateButton: {
    backgroundColor: Colors.primary,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  generateButtonText: {
    color: '#fff',
    fontSize: FontSize.base,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: Colors.success,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: FontSize.base,
    fontWeight: '600',
  },
});