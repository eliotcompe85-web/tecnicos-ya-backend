import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, SafeAreaView, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { serviceRequestService, applicationService } from '@/src/services/api';
import { Colors } from '@/src/constants/colors';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function TechnicianJobDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [job, setJob] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showApplyForm, setShowApplyForm] = useState(false);
  const [message, setMessage] = useState('');
  const [proposedPrice, setProposedPrice] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => { loadData(); }, [id]);

  const loadData = async () => {
    try {
      const data = await serviceRequestService.getById(id!);
      setJob(data);
      // Set suggested price from estimate
      if (data.estimated_price) {
        setProposedPrice(data.estimated_price.total.toString());
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo cargar el trabajo');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = async () => {
    if (!message || !proposedPrice) {
      Alert.alert('Error', 'Completa todos los campos');
      return;
    }

    setIsSubmitting(true);
    try {
      await applicationService.create({
        service_request_id: id,
        message,
        proposed_price: parseFloat(proposedPrice),
      });

      Alert.alert(
        'Postulación Enviada',
        'El cliente revisará tu propuesta. Te notificaremos si es aceptada.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo enviar la postulación');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || !job) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color={Colors.accent} style={{ flex: 1 }} />
      </SafeAreaView>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Detalle del Trabajo</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.card}>
            <Text style={styles.jobTitle}>{job.title}</Text>
            <Text style={styles.category}>{job.category_name}</Text>

            <View style={styles.clientCard}>
              <Ionicons name="person-circle" size={40} color={Colors.primary} />
              <View style={styles.clientInfo}>
                <Text style={styles.clientName}>{job.client_name}</Text>
                <View style={styles.ratingRow}>
                  <Ionicons name="star" size={14} color={Colors.warning} />
                  <Text style={styles.ratingText}>
                    {job.client_rating?.toFixed(1) || '0.0'}
                  </Text>
                </View>
              </View>
            </View>

            <Text style={styles.sectionLabel}>Descripción</Text>
            <Text style={styles.description}>{job.description}</Text>

            <Text style={styles.sectionLabel}>Ubicación</Text>
            <View style={styles.infoRow}>
              <Ionicons name="location" size={18} color={Colors.textSecondary} />
              <Text style={styles.infoText}>{job.address}</Text>
            </View>

            {job.estimated_price && (
              <View style={styles.priceCard}>
                <Text style={styles.priceTitle}>Precio Estimado</Text>
                <View style={styles.priceRow}>
                  <Text style={styles.priceLabel}>Base (hasta 6km):</Text>
                  <Text style={styles.priceValue}>
                    ${job.estimated_price.base.toLocaleString()}
                  </Text>
                </View>
                {job.estimated_price.distance_charge > 0 && (
                  <View style={styles.priceRow}>
                    <Text style={styles.priceLabel}>Distancia extra:</Text>
                    <Text style={styles.priceValue}>
                      ${job.estimated_price.distance_charge.toLocaleString()}
                    </Text>
                  </View>
                )}
                <View style={[styles.priceRow, styles.totalRow]}>
                  <Text style={styles.totalLabel}>Total:</Text>
                  <Text style={styles.totalValue}>
                    ${job.estimated_price.total.toLocaleString()}
                  </Text>
                </View>
                <Text style={styles.commissionNote}>
                  * Comisión plataforma: 15% (${Math.round(job.estimated_price.total * 0.15).toLocaleString()})
                </Text>
                <Text style={styles.commissionNote}>
                  ✓ Tu pago: ${Math.round(job.estimated_price.total * 0.85).toLocaleString()}
                </Text>
              </View>
            )}

            <Text style={styles.date}>
              Publicado: {format(new Date(job.created_at), 'dd MMM yyyy, HH:mm', { locale: es })}
            </Text>
          </View>

          {!showApplyForm ? (
            <TouchableOpacity
              style={styles.applyButton}
              onPress={() => setShowApplyForm(true)}
            >
              <Ionicons name="paper-plane" size={20} color="#FFF" />
              <Text style={styles.applyButtonText}>Postular a este Trabajo</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.formCard}>
              <Text style={styles.formTitle}>Tu Postulación</Text>

              <Text style={styles.label}>Precio Propuesto (CLP)</Text>
              <TextInput
                style={styles.input}
                placeholder="9990"
                value={proposedPrice}
                onChangeText={setProposedPrice}
                keyboardType="numeric"
              />

              <Text style={styles.label}>Mensaje al Cliente</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Cuéntale al cliente por qué eres el indicado, tu experiencia, cuándo puedes ir..."
                value={message}
                onChangeText={setMessage}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />

              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setShowApplyForm(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.submitButton, isSubmitting && { opacity: 0.6 }]}
                  onPress={handleApply}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <Text style={styles.submitButtonText}>Enviar Postulación</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: Colors.card, borderBottomWidth: 1, borderBottomColor: Colors.border },
  backButton: { padding: 8 },
  title: { fontSize: 20, fontWeight: 'bold', color: Colors.text },
  placeholder: { width: 40 },
  scrollContent: { padding: 16 },
  card: { backgroundColor: Colors.card, borderRadius: 12, padding: 16, marginBottom: 16 },
  jobTitle: { fontSize: 22, fontWeight: 'bold', color: Colors.text },
  category: { fontSize: 14, color: Colors.accent, fontWeight: '600', marginTop: 4, marginBottom: 16 },
  clientCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, padding: 12, borderRadius: 8, marginBottom: 16 },
  clientInfo: { marginLeft: 12 },
  clientName: { fontSize: 16, fontWeight: 'bold', color: Colors.text },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  ratingText: { fontSize: 13, color: Colors.textSecondary, marginLeft: 4 },
  sectionLabel: { fontSize: 14, fontWeight: 'bold', color: Colors.text, marginTop: 12, marginBottom: 6 },
  description: { fontSize: 14, color: Colors.textSecondary, lineHeight: 22 },
  infoRow: { flexDirection: 'row', alignItems: 'center' },
  infoText: { fontSize: 14, color: Colors.textSecondary, marginLeft: 8, flex: 1 },
  priceCard: { backgroundColor: Colors.surface, padding: 16, borderRadius: 8, marginTop: 16 },
  priceTitle: { fontSize: 16, fontWeight: 'bold', color: Colors.text, marginBottom: 12 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  priceLabel: { fontSize: 14, color: Colors.textSecondary },
  priceValue: { fontSize: 14, color: Colors.text, fontWeight: '600' },
  totalRow: { borderTopWidth: 1, borderTopColor: Colors.border, marginTop: 8, paddingTop: 12 },
  totalLabel: { fontSize: 16, fontWeight: 'bold', color: Colors.text },
  totalValue: { fontSize: 20, fontWeight: 'bold', color: Colors.success },
  commissionNote: { fontSize: 12, color: Colors.textSecondary, marginTop: 6 },
  date: { fontSize: 12, color: Colors.textSecondary, marginTop: 16 },
  applyButton: { flexDirection: 'row', backgroundColor: Colors.accent, paddingVertical: 16, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  applyButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold', marginLeft: 8 },
  formCard: { backgroundColor: Colors.card, borderRadius: 12, padding: 16 },
  formTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.text, marginBottom: 12 },
  label: { fontSize: 14, fontWeight: '600', color: Colors.text, marginTop: 12, marginBottom: 6 },
  input: { backgroundColor: Colors.surface, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16, color: Colors.text, borderWidth: 1, borderColor: Colors.border },
  textArea: { height: 100, paddingTop: 10 },
  buttonRow: { flexDirection: 'row', gap: 12, marginTop: 16 },
  cancelButton: { flex: 1, paddingVertical: 12, borderRadius: 8, borderWidth: 1, borderColor: Colors.border, alignItems: 'center' },
  cancelButtonText: { color: Colors.textSecondary, fontSize: 14, fontWeight: 'bold' },
  submitButton: { flex: 2, paddingVertical: 12, borderRadius: 8, backgroundColor: Colors.accent, alignItems: 'center' },
  submitButtonText: { color: '#FFF', fontSize: 14, fontWeight: 'bold' },
});
