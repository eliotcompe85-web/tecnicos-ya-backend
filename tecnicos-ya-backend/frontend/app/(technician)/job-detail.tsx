import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { serviceRequestService, applicationService } from '@/src/services/api';
import { Colors } from '@/src/constants/colors';
import { useAuth } from '@/src/context/AuthContext';

type ServiceRequest = {
  _id: string;
  title: string;
  description: string;
  address: string;
  status: string;
  category_name: string;
  client_name: string;
  client_rating: number;
  created_at: string;
  distance_km: number | null;
  estimated_price: { base: number; distance_charge: number; total: number };
  applications: any[];
};

export default function JobDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();

  const [job, setJob] = useState<ServiceRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [proposedPrice, setProposedPrice] = useState('');
  const [applying, setApplying] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);

  useEffect(() => { if (id) load(); }, [id]);

  const load = async () => {
    try {
      setIsLoading(true);
      const data = await serviceRequestService.getById(id!);
      setJob(data);
      // Check if current technician already applied
      if (user && data.applications) {
        const alreadyApplied = data.applications.some(
          (a: any) => String(a.technician_id) === String(user._id)
        );
        setHasApplied(alreadyApplied);
      }
    } catch {
      Alert.alert('Error', 'No se pudo cargar el trabajo');
      router.back();
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = async () => {
    if (!proposedPrice || isNaN(parseFloat(proposedPrice))) {
      Alert.alert('Precio requerido', 'Ingresa el precio que cobrarás por este servicio.');
      return;
    }

    Alert.alert(
      'Confirmar postulación',
      `¿Postular con precio de $${parseFloat(proposedPrice).toLocaleString('es-CL')}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Postular',
          onPress: async () => {
            try {
              setApplying(true);
              await applicationService.create({
                service_request_id: id,
                proposed_price: parseFloat(proposedPrice),
                message: message.trim() || undefined,
              });
              setHasApplied(true);
              Alert.alert('✅ Postulación enviada', 'El cliente recibirá tu propuesta y podrá aceptarla.');
            } catch (e: any) {
              Alert.alert('Error', e?.response?.data?.detail || 'No se pudo enviar la postulación');
            } finally {
              setApplying(false);
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </SafeAreaView>
    );
  }

  if (!job) return null;

  const estimatedPrice = job.estimated_price?.total || 9990;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>Detalle del Trabajo</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Category tag */}
        {job.category_name ? (
          <View style={styles.catTag}>
            <Text style={styles.catTagText}>🔧 {job.category_name}</Text>
          </View>
        ) : null}

        {/* Title */}
        <Text style={styles.jobTitle}>{job.title}</Text>

        {/* Location & distance */}
        <View style={styles.infoRow}>
          <Ionicons name="location" size={16} color={Colors.primary} />
          <Text style={styles.infoText}>{job.address}</Text>
          {job.distance_km != null && (
            <View style={styles.distanceBadge}>
              <Text style={styles.distanceBadgeText}>{job.distance_km.toFixed(1)} km</Text>
            </View>
          )}
        </View>

        {/* Client info */}
        <View style={styles.clientCard}>
          <View style={styles.clientAvatar}>
            <Text style={styles.clientAvatarText}>{job.client_name?.charAt(0).toUpperCase() || 'C'}</Text>
          </View>
          <View>
            <Text style={styles.clientLabel}>Cliente</Text>
            <Text style={styles.clientName}>{job.client_name}</Text>
            <Text style={styles.clientRating}>
              {'★'.repeat(Math.round(job.client_rating || 0))} {(job.client_rating || 0).toFixed(1)}
            </Text>
          </View>
          <Text style={styles.clientDate}>
            {job.created_at ? new Date(job.created_at).toLocaleDateString('es-CL', { day: '2-digit', month: 'short' }) : ''}
          </Text>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Descripción</Text>
          <Text style={styles.descText}>{job.description}</Text>
        </View>

        {/* Estimated price */}
        <View style={styles.priceCard}>
          <View style={styles.priceCardHeader}>
            <Text style={styles.priceCardTitle}>💰 Precio estimado del servicio</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Tarifa base</Text>
            <Text style={styles.priceValue}>${(job.estimated_price?.base || 9990).toLocaleString('es-CL')}</Text>
          </View>
          {(job.estimated_price?.distance_charge || 0) > 0 && (
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Por distancia ({(job.distance_km || 0).toFixed(1)} km)</Text>
              <Text style={styles.priceValue}>+${(job.estimated_price.distance_charge).toLocaleString('es-CL')}</Text>
            </View>
          )}
          <View style={[styles.priceRow, styles.priceTotalRow]}>
            <Text style={styles.priceTotalLabel}>Total sugerido</Text>
            <Text style={styles.priceTotalValue}>${estimatedPrice.toLocaleString('es-CL')}</Text>
          </View>
          <Text style={styles.priceNote}>
            * Comisión del 15% descontada automáticamente al completar el trabajo.
          </Text>
        </View>

        {/* Application section */}
        {hasApplied ? (
          <View style={styles.appliedBanner}>
            <Ionicons name="checkmark-circle" size={22} color={Colors.success} />
            <Text style={styles.appliedText}>Ya enviaste tu postulación. Esperando respuesta del cliente.</Text>
          </View>
        ) : job.status !== 'open' ? (
          <View style={styles.closedBanner}>
            <Ionicons name="lock-closed" size={22} color={Colors.textSecondary} />
            <Text style={styles.closedText}>Esta solicitud ya no está disponible para postular.</Text>
          </View>
        ) : (
          <View style={styles.applySection}>
            <Text style={styles.applySectionTitle}>📤 Enviar Postulación</Text>

            <Text style={styles.label}>Tu precio (CLP) *</Text>
            <View style={styles.priceInputRow}>
              <Text style={styles.priceCurrency}>$</Text>
              <TextInput
                style={styles.priceInput}
                placeholder={estimatedPrice.toString()}
                placeholderTextColor={Colors.textSecondary}
                keyboardType="numeric"
                value={proposedPrice}
                onChangeText={setProposedPrice}
              />
            </View>
            <TouchableOpacity
              style={styles.suggestBtn}
              onPress={() => setProposedPrice(String(estimatedPrice))}
            >
              <Text style={styles.suggestBtnText}>Usar precio sugerido (${estimatedPrice.toLocaleString('es-CL')})</Text>
            </TouchableOpacity>

            <Text style={styles.label}>Mensaje al cliente (opcional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Describe cómo resolverás el problema, tu experiencia, etc."
              placeholderTextColor={Colors.textSecondary}
              value={message}
              onChangeText={setMessage}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />

            <TouchableOpacity
              style={[styles.applyBtn, applying && styles.applyBtnDisabled]}
              onPress={handleApply}
              disabled={applying}
            >
              {applying ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <>
                  <Ionicons name="send" size={18} color="white" />
                  <Text style={styles.applyBtnText}>Postularme a este trabajo</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: { justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: Colors.card, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  backBtn: { padding: 4 },
  headerTitle: { flex: 1, fontSize: 17, fontWeight: '700', color: Colors.text, textAlign: 'center', marginHorizontal: 8 },
  content: { padding: 16, paddingBottom: 40 },
  catTag: {
    alignSelf: 'flex-start', backgroundColor: Colors.primaryLight,
    paddingHorizontal: 12, paddingVertical: 5, borderRadius: 100, marginBottom: 14,
  },
  catTagText: { fontSize: 13, fontWeight: '600', color: Colors.primaryDark },
  jobTitle: { fontSize: 24, fontWeight: '800', color: Colors.text, marginBottom: 14, lineHeight: 30 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16 },
  infoText: { flex: 1, fontSize: 14, color: Colors.textSecondary },
  distanceBadge: {
    backgroundColor: Colors.primaryLight, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100,
  },
  distanceBadgeText: { fontSize: 12, fontWeight: '700', color: Colors.primaryDark },
  clientCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.card, borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: Colors.border, marginBottom: 20,
  },
  clientAvatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.accent, justifyContent: 'center', alignItems: 'center',
  },
  clientAvatarText: { color: 'white', fontWeight: '800', fontSize: 18 },
  clientLabel: { fontSize: 11, color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  clientName: { fontSize: 15, fontWeight: '700', color: Colors.text },
  clientRating: { fontSize: 13, color: '#F59E0B', marginTop: 2 },
  clientDate: { marginLeft: 'auto', fontSize: 13, color: Colors.textSecondary },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 10 },
  descText: { fontSize: 15, color: Colors.textSecondary, lineHeight: 22 },
  priceCard: {
    backgroundColor: '#E8F5E9', borderRadius: 12, padding: 16, marginBottom: 20,
  },
  priceCardHeader: { marginBottom: 12 },
  priceCardTitle: { fontSize: 15, fontWeight: '700', color: '#2E7D32' },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  priceLabel: { fontSize: 14, color: Colors.textSecondary },
  priceValue: { fontSize: 14, color: Colors.text, fontWeight: '600' },
  priceTotalRow: { borderTopWidth: 1, borderTopColor: Colors.success + '40', paddingTop: 10, marginTop: 4 },
  priceTotalLabel: { fontSize: 16, fontWeight: '700', color: Colors.text },
  priceTotalValue: { fontSize: 18, fontWeight: '800', color: Colors.success },
  priceNote: { fontSize: 12, color: Colors.textSecondary, marginTop: 8, fontStyle: 'italic' },
  appliedBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#E8F5E9', borderRadius: 12, padding: 16,
  },
  appliedText: { flex: 1, fontSize: 14, color: Colors.success, fontWeight: '600', lineHeight: 20 },
  closedBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.surface, borderRadius: 12, padding: 16,
  },
  closedText: { flex: 1, fontSize: 14, color: Colors.textSecondary, lineHeight: 20 },
  applySection: {
    backgroundColor: Colors.card, borderRadius: 16,
    borderWidth: 1, borderColor: Colors.border, padding: 20,
  },
  applySectionTitle: { fontSize: 17, fontWeight: '700', color: Colors.text, marginBottom: 20 },
  label: { fontSize: 12, fontWeight: '700', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  priceInputRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surface, borderRadius: 10, borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: 14, marginBottom: 8,
  },
  priceCurrency: { fontSize: 18, color: Colors.textSecondary, marginRight: 4 },
  priceInput: { flex: 1, fontSize: 20, fontWeight: '700', color: Colors.text, paddingVertical: 14 },
  suggestBtn: { marginBottom: 20, alignSelf: 'flex-start' },
  suggestBtnText: { fontSize: 13, color: Colors.primary, fontWeight: '600' },
  input: {
    backgroundColor: Colors.surface, borderRadius: 10, padding: 14,
    fontSize: 15, color: Colors.text, borderWidth: 1, borderColor: Colors.border, marginBottom: 20,
  },
  textArea: { minHeight: 90, textAlignVertical: 'top' },
  applyBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: Colors.primary, borderRadius: 12, padding: 16,
  },
  applyBtnDisabled: { opacity: 0.6 },
  applyBtnText: { color: 'white', fontSize: 16, fontWeight: '700' },
});
