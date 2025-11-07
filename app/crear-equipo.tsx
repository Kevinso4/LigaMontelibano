import React, { useState, useEffect } from 'react';
import { 
  Alert, 
  Button, 
  Keyboard, 
  SafeAreaView, 
  StyleSheet, 
  Text, 
  TextInput, 
  TouchableWithoutFeedback, 
  View,
  BackHandler,
  Platform
} from 'react-native';
import { router } from 'expo-router';
import { Team } from '../types';
import { getTeams, saveTeams } from '../utils/storage';
import { Colors, Spacing, BorderRadius, FontSize } from '../utils/theme';

export default function CreateTeamScreen() {
  const [teamName, setTeamName] = useState('');
  const [captainName, setCaptainName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Confirmación al salir con datos sin guardar (solo en Android)
  useEffect(() => {
    if (Platform.OS !== 'android') {
      return; // Solo funciona en Android
    }

    const backAction = () => {
      if (teamName.trim() || captainName.trim()) {
        Alert.alert(
          'Confirmar',
          '¿Salir sin guardar los cambios?',
          [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Salir', onPress: () => router.back() }
          ]
        );
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [teamName, captainName]);

  // Función para validar y registrar el equipo
  const handleRegisterTeam = async () => {
    // Validación: campos vacíos
    if (!teamName.trim() || !captainName.trim()) {
      Alert.alert('Error', 'Por favor completa todos los campos.');
      return;
    }

    // Validación: longitud mínima
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
      // Obtener equipos existentes
      const teams = await getTeams();

      // Validar nombre duplicado
      const isDuplicate = teams.some(
        (team) => team.name.toLowerCase() === teamName.trim().toLowerCase()
      );

      if (isDuplicate) {
        Alert.alert('Error', 'Ya existe un equipo con ese nombre.');
        setIsSubmitting(false);
        return;
      }

      // Crear nuevo equipo
      const newTeam: Team = {
        id: Date.now().toString(),
        name: teamName.trim(),
        captain: captainName.trim(),
        createdAt: new Date().toISOString(),
      };

      // Guardar en AsyncStorage
      teams.push(newTeam);
      const success = await saveTeams(teams);

      if (success) {
        Alert.alert(
          'Éxito',
          `Equipo "${newTeam.name}" registrado correctamente.`,
          [
            {
              text: 'Aceptar',
              onPress: () => {
                setTeamName('');
                setCaptainName('');
                Keyboard.dismiss();
              }
            }
          ]
        );
      } else {
        Alert.alert('Error', 'No se pudo guardar el equipo. Intenta de nuevo.');
      }

    } catch (error) {
      console.error('Error guardando equipo:', error);
      Alert.alert('Error', 'No se pudo guardar el equipo. Intenta de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Verificar si el formulario es válido
  const isFormValid = teamName.trim().length >= 3 && captainName.trim().length >= 3;

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView style={styles.container}>
        <View style={styles.form}>
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
            placeholder="Ej: Kevin"
            value={captainName}
            onChangeText={setCaptainName}
            maxLength={30}
            editable={!isSubmitting}
          />

          <Button
            title={isSubmitting ? "Registrando..." : "Registrar Equipo"}
            onPress={handleRegisterTeam}
            disabled={!isFormValid || isSubmitting}
          />
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
  form: {
    padding: 20,
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
});