import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/src/constants/colors';
import { availabilityService } from '@/src/services/api';

type Status = 'available' | 'scheduling' | 'unavailable';

const STATUS_CONFIG: Record<Status, { color: string; label: string; emoji: string; description: string }> = {
  available: {
    color: Colors.available,
    label: 'Disponible',
    emoji: '🟢',
    description: 'Disponible para visitas inmediatas',
  },
  scheduling: {
    color: Colors.scheduling,
    label: 'Agendando',
    emoji: '🟡',
    description: 'Solo acepto visitas agendadas',
  },
  unavailable: {
    color: Colors.unavailable,
    label: 'No Disponible',
    emoji: '⚫',
    description: 'No estoy aceptando trabajos',
  },
};

type Props = {
  currentStatus: Status;
  onStatusChange?: (status: Status) => void;
};

export function AvailabilityStatus({ currentStatus, onStatusChange }: Props) {
  const [modalVisible, setModalVisible] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const config = STATUS_CONFIG[currentStatus];

  const handleChange = async (status: Status) => {
    if (status === currentStatus) {
      setModalVisible(false);
      return;
    }

    setIsUpdating(true);
    try {
      await availabilityService.update(status);
      onStatusChange?.(status);
      setModalVisible(false);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'No se pudo actualizar');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <>
      <TouchableOpacity style={styles.container} onPress={() => setModalVisible(true)}>
        <View style={[styles.statusDot, { backgroundColor: config.color }]} />
        <View style={styles.textContainer}>
          <Text style={styles.label}>Mi Disponibilidad</Text>
          <Text style={styles.status}>{config.emoji} {config.label}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Cambiar Disponibilidad</Text>
            <Text style={styles.modalSubtitle}>
              Los clientes verán tu estado en sus búsquedas
            </Text>

            {(Object.keys(STATUS_CONFIG) as Status[]).map((key) => {
              const item = STATUS_CONFIG[key];
              const isSelected = key === currentStatus;
              return (
                <TouchableOpacity
                  key={key}
                  style={[styles.option, isSelected && styles.optionSelected]}
                  onPress={() => handleChange(key)}
                  disabled={isUpdating}
                >
                  <View style={[styles.optionDot, { backgroundColor: item.color }]} />
                  <View style={styles.optionText}>
                    <Text style={styles.optionLabel}>{item.label}</Text>
                    <Text style={styles.optionDescription}>{item.description}</Text>
                  </View>
                  {isSelected && (
                    <Ionicons name="checkmark-circle" size={24} color={Colors.success} />
                  )}
                </TouchableOpacity>
              );
            })}

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.cancelButtonText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  statusDot: { width: 16, height: 16, borderRadius: 8, marginRight: 12 },
  textContainer: { flex: 1 },
  label: { fontSize: 12, color: Colors.textSecondary, marginBottom: 2 },
  status: { fontSize: 16, fontWeight: 'bold', color: Colors.text },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
  },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: Colors.text, marginBottom: 4 },
  modalSubtitle: { fontSize: 14, color: Colors.textSecondary, marginBottom: 24 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.card,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  optionSelected: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  optionDot: { width: 20, height: 20, borderRadius: 10, marginRight: 12 },
  optionText: { flex: 1 },
  optionLabel: { fontSize: 16, fontWeight: 'bold', color: Colors.text },
  optionDescription: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  cancelButton: { padding: 16, alignItems: 'center', marginTop: 8 },
  cancelButtonText: { fontSize: 16, color: Colors.textSecondary, fontWeight: '600' },
});
