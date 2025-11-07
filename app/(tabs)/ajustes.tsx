import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getTeams, getMatches } from '../../utils/storage';
import { exportAllData } from '../../utils/export';
import { Colors, Spacing, BorderRadius, FontSize } from '../../utils/theme';
import Card from '../../components/Card';

export default function SettingsScreen() {
  const [isExporting, setIsExporting] = useState(false);

  const handleExportData = async () => {
    try {
      setIsExporting(true);
      const [teams, matches] = await Promise.all([getTeams(), getMatches()]);
      const jsonData = await exportAllData(teams, matches);

      if (Platform.OS === 'web') {
        // En web, descargar como archivo
        const blob = new Blob([jsonData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `liga-montelibano-backup-${new Date().getTime()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        Alert.alert('Éxito', 'Datos exportados correctamente');
      } else {
        // En móvil, copiar al portapapeles o compartir
        Alert.alert(
          'Exportar',
          '¿Cómo deseas exportar los datos?',
          [
            {
              text: 'Copiar',
              onPress: async () => {
                // Aquí podrías usar Clipboard de expo
                Alert.alert('Info', 'Función de copiar disponible próximamente');
              },
            },
            {
              text: 'Compartir',
              onPress: async () => {
                Alert.alert('Info', 'Función de compartir disponible próximamente');
              },
            },
            { text: 'Cancelar', style: 'cancel' },
          ]
        );
      }
    } catch (error) {
      console.error('Error exportando:', error);
      Alert.alert('Error', 'No se pudieron exportar los datos');
    } finally {
      setIsExporting(false);
    }
  };

  const handleClearData = () => {
    Alert.alert(
      '⚠️ Advertencia',
      '¿Estás seguro de que deseas borrar TODOS los datos? Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Borrar Todo',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.clear();
              Alert.alert('Éxito', 'Todos los datos han sido borrados', [
                { text: 'OK', onPress: () => router.replace('/(tabs)') },
              ]);
            } catch (error) {
              Alert.alert('Error', 'No se pudieron borrar los datos');
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>⚙️ Ajustes</Text>
      </View>

      <View style={styles.content}>
        {/* Sección de Datos */}
        <Text style={styles.sectionTitle}>📊 Datos</Text>

        <Card style={styles.option}>
          <TouchableOpacity onPress={handleExportData} disabled={isExporting}>
            <View style={styles.optionContent}>
              <View>
                <Text style={styles.optionTitle}>Exportar Datos</Text>
                <Text style={styles.optionDescription}>
                  Guarda una copia de seguridad de todos tus datos
                </Text>
              </View>
              <Text style={styles.optionIcon}>📤</Text>
            </View>
          </TouchableOpacity>
        </Card>

        <Card style={styles.option}>
          <TouchableOpacity onPress={handleClearData}>
            <View style={styles.optionContent}>
              <View>
                <Text style={[styles.optionTitle, { color: Colors.danger }]}>
                  Borrar Todos los Datos
                </Text>
                <Text style={styles.optionDescription}>
                  Elimina todos los equipos, partidos y estadísticas
                </Text>
              </View>
              <Text style={styles.optionIcon}>🗑️</Text>
            </View>
          </TouchableOpacity>
        </Card>

        {/* Sección de Información */}
        <Text style={styles.sectionTitle}>ℹ️ Información</Text>

        <Card style={styles.infoCard}>
          <Text style={styles.infoLabel}>Versión</Text>
          <Text style={styles.infoValue}>1.0.0</Text>
        </Card>

        <Card style={styles.infoCard}>
          <Text style={styles.infoLabel}>Desarrollado por</Text>
          <Text style={styles.infoValue}>Tu Nombre/Equipo</Text>
        </Card>

        <Card style={styles.infoCard}>
          <Text style={styles.infoLabel}>Liga</Text>
          <Text style={styles.infoValue}>Montelibano</Text>
        </Card>

        {/* Sección de Ayuda */}
        <Text style={styles.sectionTitle}>❓ Ayuda</Text>

        <Card style={styles.helpCard}>
          <Text style={styles.helpTitle}>¿Cómo usar la app?</Text>
          <Text style={styles.helpText}>
            1. Registra equipos en la pestaña "Equipos"{'\n'}
            2. Crea partidos desde "Partidos"{'\n'}
            3. Registra resultados de los partidos{'\n'}
            4. La tabla y estadísticas se actualizan automáticamente
          </Text>
        </Card>

        <Card style={styles.helpCard}>
          <Text style={styles.helpTitle}>Características principales:</Text>
          <Text style={styles.helpText}>
            • Gestión completa de equipos{'\n'}
            • Registro y seguimiento de partidos{'\n'}
            • Tabla de posiciones automática{'\n'}
            • Estadísticas detalladas{'\n'}
            • Exportar y compartir datos
          </Text>
        </Card>
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
  },
  content: {
    padding: Spacing.lg,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
  },
  option: {
    marginBottom: Spacing.sm,
  },
  optionContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  optionTitle: {
    fontSize: FontSize.base,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  optionIcon: {
    fontSize: 24,
  },
  infoCard: {
    marginBottom: Spacing.sm,
  },
  infoLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: FontSize.base,
    fontWeight: '600',
    color: Colors.text,
  },
  helpCard: {
    marginBottom: Spacing.md,
  },
  helpTitle: {
    fontSize: FontSize.base,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  helpText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
});