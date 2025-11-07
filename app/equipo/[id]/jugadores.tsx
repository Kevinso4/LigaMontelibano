import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Player } from '../../../types';
import { getPlayersByTeam, addPlayer, deletePlayer, getTeamById } from '../../../utils/storage';
import { Colors, Spacing, BorderRadius, FontSize } from '../../../utils/theme';
import AnimatedCard from '../../../components/AnimatedCard';

export default function TeamPlayersScreen() {
  const { id } = useLocalSearchParams();
  const [players, setPlayers] = useState<Player[]>([]);
  const [teamName, setTeamName] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [newPlayer, setNewPlayer] = useState({
    name: '',
    number: '',
    position: 'Delantero' as Player['position'],
  });

  const loadPlayers = async () => {
    const loadedPlayers = await getPlayersByTeam(id as string);
    setPlayers(loadedPlayers);
    const team = await getTeamById(id as string);
    if (team) setTeamName(team.name);
  };

  useFocusEffect(
    useCallback(() => {
      loadPlayers();
    }, [])
  );

  const handleAddPlayer = async () => {
    if (!newPlayer.name.trim() || !newPlayer.number) {
      Alert.alert('Error', 'Completa todos los campos');
      return;
    }

    const player: Player = {
      id: Date.now().toString(),
      name: newPlayer.name.trim(),
      teamId: id as string,
      number: parseInt(newPlayer.number),
      position: newPlayer.position,
      goals: 0,
      assists: 0,
      yellowCards: 0,
      redCards: 0,
      isSuspended: false,
      matchesPlayed: 0,
    };

    const success = await addPlayer(player);
    if (success) {
      setPlayers([...players, player]);
      setModalVisible(false);
      setNewPlayer({ name: '', number: '', position: 'Delantero' });
      Alert.alert('Éxito', 'Jugador agregado correctamente');
    }
  };

  const handleDeletePlayer = (player: Player) => {
    Alert.alert(
      'Confirmar',
      `¿Eliminar a ${player.name}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            const success = await deletePlayer(player.id);
            if (success) {
              setPlayers(players.filter(p => p.id !== player.id));
            }
          },
        },
      ]
    );
  };

  const getPositionEmoji = (position: Player['position']) => {
    switch (position) {
      case 'Portero': return '🧤';
      case 'Defensa': return '🛡️';
      case 'Medio': return '⚙️';
      case 'Delantero': return '⚽';
    }
  };

  const renderPlayer = ({ item, index }: { item: Player; index: number }) => (
    <AnimatedCard delay={index * 100}>
      <View style={styles.playerCard}>
        <View style={styles.playerNumber}>
          <Text style={styles.numberText}>{item.number}</Text>
        </View>

        <View style={styles.playerInfo}>
          <View style={styles.playerHeader}>
            <Text style={styles.playerName}>{item.name}</Text>
            {item.isSuspended && (
              <View style={styles.suspendedBadge}>
                <Text style={styles.suspendedText}>🚫 Suspendido</Text>
              </View>
            )}
          </View>
          <View style={styles.playerStats}>
            <Text style={styles.position}>{getPositionEmoji(item.position)} {item.position}</Text>
            <Text style={styles.stat}>⚽ {item.goals}G</Text>
            <Text style={styles.stat}>🟨 {item.yellowCards}</Text>
            <Text style={styles.stat}>🟥 {item.redCards}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeletePlayer(item)}
        >
          <Text style={styles.deleteIcon}>🗑️</Text>
        </TouchableOpacity>
      </View>
    </AnimatedCard>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Jugadores de {teamName}</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setModalVisible(true)}
        >
          <Text style={styles.addButtonText}>+ Agregar Jugador</Text>
        </TouchableOpacity>
      </View>

      {players.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>👥</Text>
          <Text style={styles.emptyText}>No hay jugadores registrados</Text>
        </View>
      ) : (
        <FlatList
          data={players}
          keyExtractor={(item) => item.id}
          renderItem={renderPlayer}
          contentContainerStyle={styles.list}
        />
      )}

      {/* Modal para agregar jugador */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Nuevo Jugador</Text>

            <TextInput
              style={styles.input}
              placeholder="Nombre del jugador"
              value={newPlayer.name}
              onChangeText={(text) => setNewPlayer({ ...newPlayer, name: text })}
            />

            <TextInput
              style={styles.input}
              placeholder="Número de camiseta"
              keyboardType="numeric"
              value={newPlayer.number}
              onChangeText={(text) => setNewPlayer({ ...newPlayer, number: text })}
              maxLength={2}
            />

            <Text style={styles.label}>Posición:</Text>
            <View style={styles.positionButtons}>
              {(['Portero', 'Defensa', 'Medio', 'Delantero'] as Player['position'][]).map((pos) => (
                <TouchableOpacity
                  key={pos}
                  style={[
                    styles.positionButton,
                    newPlayer.position === pos && styles.positionButtonActive,
                  ]}
                  onPress={() => setNewPlayer({ ...newPlayer, position: pos })}
                >
                  <Text
                    style={[
                      styles.positionButtonText,
                      newPlayer.position === pos && styles.positionButtonTextActive,
                    ]}
                  >
                    {pos}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleAddPlayer}
              >
                <Text style={styles.confirmButtonText}>Agregar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  addButton: {
    backgroundColor: Colors.primary,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: FontSize.base,
    fontWeight: '600',
  },
  list: {
    padding: Spacing.lg,
  },
  playerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  playerNumber: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  numberText: {
    fontSize: FontSize.xl,
    fontWeight: 'bold',
    color: '#fff',
  },
  playerInfo: {
    flex: 1,
  },
  playerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: 5,
  },
  playerName: {
    fontSize: FontSize.base,
    fontWeight: 'bold',
    color: Colors.text,
  },
  suspendedBadge: {
    backgroundColor: Colors.danger,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  suspendedText: {
    fontSize: FontSize.xs,
    color: '#fff',
    fontWeight: '600',
  },
  playerStats: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  position: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  stat: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  deleteButton: {
    padding: Spacing.sm,
  },
  deleteIcon: {
    fontSize: 20,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyEmoji: {
    fontSize: 60,
    marginBottom: Spacing.md,
  },
  emptyText: {
    fontSize: FontSize.base,
    color: Colors.textSecondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modalContent: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: FontSize.xl,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  input: {
    backgroundColor: Colors.background,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    fontSize: FontSize.base,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  label: {
    fontSize: FontSize.base,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  positionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  positionButton: {
    flex: 1,
    minWidth: '45%',
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.background,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  positionButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  positionButtonText: {
    fontSize: FontSize.sm,
    color: Colors.text,
    fontWeight: '600',
  },
  positionButtonTextActive: {
    color: '#fff',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  modalButton: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: Colors.background,
  },
  cancelButtonText: {
    color: Colors.text,
    fontSize: FontSize.base,
    fontWeight: '600',
  },
  confirmButton: {
    backgroundColor: Colors.primary,
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: FontSize.base,
    fontWeight: '600',
  },
});