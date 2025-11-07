import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  TouchableWithoutFeedback,
  Keyboard,
  ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Team } from '../../types';
import { getTeamById, updateTeam } from '../../utils/storage';
import { Colors, Spacing, BorderRadius, FontSize } from '../../utils/theme';

export default function EditTeamScreen() {
  const { id } = useLocalSearchParams();
  const [team, setTeam] = useState<Team | null>(null);
  const [teamName, setTeamName] = useState('');
  const [captainName, setCaptainName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTeam();
  }, [id]);

  const loadTeam = async () => {
    try {
      const loadedTeam = await getTeamById(id as string);
      if (loadedTeam) {
        setTeam(loadedTeam);
        setTeamName(loadedTeam.name);
        setCaptainName(loadedTeam.captain);
      } else {
        Alert.alert('Error', 'Equipo no encontrado', [
          { text: 'Volver', onPress: () => router.back() }
        ]);
      }
    } catch (error) {
      console.error('Error cargando equipo:', error);
      Alert.alert('Error', 'No se pudo cargar el equipo');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateTeam = async () => {
    if (!teamName.trim() || !captainName.trim()) {
      Alert.alert('Error', 'Por favor completa todos los campos.');
      return;
    }

    if (teamName.trim().length < 3) {
      Alert.alert('Error', 'El nombre del equipo debe tener al menos 3 caracteres.');
      return;
    }

    if (captainName.trim().length < 3) {
      Alert.alert('Error', 'El nombre del capitán debe tener al menos 3 caracteres.');
      return;
    }

    setIsSubmitting(true);

    try {
      const success = await updateTeam(id as string, {
        name: teamName.trim(),
        captain: captainName.trim(),
      });

      if (success) {
        Alert.alert(
          'Éxito',
          'Equipo actualizado correctamente.',
          [
            {
              text: 'Aceptar',
              onPress: () => router.back(),
            }
          ]
        );
      } else {
        Alert.alert('Error', 'No se pudo actualizar el equipo.');
      }
    } catch (error) {
      console.error('Error actualizando equipo:', error);
      Alert.alert('Error', 'Ocurrió un error al actualizar.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasChanges = team && (
    teamName.trim() !== team.name || 
    captainName.trim() !== team.captain
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Cargando equipo...</Text>
      </View>
    );
  }

  if (!team) {
    return null;
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView style={styles.container}>
        <View style={styles.form}>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Equipo creado:</Text>
            <Text style={styles.infoValue}>
              {new Date(team.createdAt).toLocaleDateString('es-ES', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </Text>
          </View>

          <Text style={styles.label}>Nombre del Equipo:</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej: Los Invencibles"
            value={teamName}
            onChangeText={setTeamName}
            maxLength={30}
            editable={!isSubmitting}
          />

          <Text style={styles.label}>Nombre del Capitán:</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej: Juan Pérez"
            value={captainName}
            onChangeText={setCaptainName}
            maxLength={30}
            editable={!isSubmitting}
          />

          {team.wins !== undefined && (
            <View style={styles.statsCard}>
              <Text style={styles.statsTitle}>Estadísticas</Text>
              <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{team.points || 0}</Text>
                  <Text style={styles.statLabel}>Puntos</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{team.wins || 0}</Text>
                  <Text style={styles.statLabel}>Ganados</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{team.draws || 0}</Text>
                  <Text style={styles.statLabel}>Empates</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{team.losses || 0}</Text>
                  <Text style={styles.statLabel}>Perdidos</Text>
                </View>
              </View>
            </View>
          )}

          <TouchableOpacity
            style={[
              styles.button,
              (!hasChanges || isSubmitting) && styles.buttonDisabled
            ]}
            onPress={handleUpdateTeam}
            disabled={!hasChanges || isSubmitting}
          >
            <Text style={styles.buttonText}>
              {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => router.back()}
            disabled={isSubmitting}
          >
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  form: {
    padding: 20,
  },
  infoCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  infoLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
    fontSize: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  statsCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
});