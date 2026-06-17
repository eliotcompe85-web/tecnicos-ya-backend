import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { serviceRequestService, applicationService } from '@/src/services/api';
import { Colors } from '@/src/constants/colors';
import { useAuth } from '@/src/context/AuthContext';

type Application = {
  _id: string;
  technician_id: number;
  technician_name: string;
  technician_rating: number;
  proposed_price: number;
  message: string;
  status: string;
};

type ServiceRequest = {
  _id: string;
  title: string;
  description: string;
  address: string;
  status: string;
  category_name: string;
  client_name: string;
  created_at: string;
  estimated_price: { base: number; distance_charge: number; total: number };
  applications: Application[];
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  open: { label: 'Abierta', color: Colors.primary, bg: '#E3F2FD' },
  in_progress: { label: 'En progreso', color: Colors.warning, bg: '#FFF8E1' },
  completed: { label: 'Completada', color: Colors.success, bg: '#E8F5E9' },
  cancelled: { label: 'Cancelada', color: Colors.error, bg: '#FFEBEE' },
};

export default function RequestDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [request, setRequest] = useState<ServiceRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [accepting, setAccepting] = useState<string | null>(null);

  useEffect(() => { if (id) load(); }, [id]);

  const load = async () => {
    try {
      setIsLoading(true);
      const data = await serviceRequestService.getById(id!);
      setRequest(data);
    } catch {
      Alert.alert('Error', 'No se pudo cargar la solicitud');
      router.back();
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccept = async (appId: string, techName: string) => {
    Alert.alert(
      'Aceptar postulación',
      `¿Confirmas contratar a ${techName}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          style: 'default',
          onPress: async () => {
            try {
              setAccepting(appId);
              await applicationService.accept(appId);
              Alert.alert('✅ ¡Aceptado!', `Has contratado a ${techName}. Te contactará pronto.`);
              load();
            } catch (e: any) {
              Alert.alert('Error', e?.response?.data?.detail || 'No se pudo aceptar');
            } finally {
              setAccepting(null);
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

  if (!request) return null;
  const status = STATUS_CONFIG[request.status] || STATUS_CONFIG.open;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{request.title}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={false} onRefresh={load} />}
      >
        {/* Status banner */}
        <View style={[styles.statusBanner, { backgroundColor: status.bg }]}>
          <View style={[styles.statusDot, { backgroundColor: status.color }]} />
          <Text style={[styles.statusLabel, { color: status.color }]}>{status.label}</Text>
        </View>

        {/* Title & category */}
        <View style={styles.section}>
          <Text style={styles.requestTitle}>{request.title}</Text>
          <View style={styles.tagRow}>
            {request.category_name ? (
              <View style={styles.catTag}>
                <Text style={styles.catTagText}>{request.category_name}</Text>
              </View>
            ) : null}
          </View>
          <Text style={styles.requestDesc}>{request.description}</Text>
        </View>

        {/* Details */}
        <View style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <Ionicons name="location" size={18} color={Colors.primary} />
            <Text style={styles.detailText}>{request.address}</Text>
          </View>
          <View style={styles.separator} />
          <View style={styles.detailRow}>
            <Ionicons name="time" size={18} color={Colors.textSecondary} />
            <Text style={styles.detailText}>
              {request.created_at ? new Date(request.created_at).toLocaleDateString('es-CL', {
                day: '2-digit', month: 'long', year: 'numeric',
              }) : '—'}
            </Text>
          </View>
        </View>

        {/* Estimated price */}
        <View style={styles.priceCard}>
          <Text style={styles.priceCardTitle}>💰 Precio estimado</Text>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Tarifa base</Text>
            <Text style={styles.priceValue}>${request.estimated_price.base.toLocaleString('es-CL')}</Text>
          </View>
          {request.estimated_price.distance_charge > 0 && (
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Cargo por distancia</Text>
              <Text style={styles.priceValue}>+${request.estimated_price.distance_charge.toLocaleString('es-CL')}</Text>
            </View>
          )}
          <View style={[styles.priceRow, styles.priceTotalRow]}>
            <Text style={styles.priceTotalLabel}>Total estimado</Text>
            <Text style={styles.priceTotalValue}>${request.estimated_price.total.toLocaleString('es-CL')}</Text>
          </View>
        </View>

        {/* Applications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Postulaciones ({request.applications.length})
          </Text>
          {request.applications.length === 0 ? (
            <View style={styles.emptyApps}>
              <Text style={styles.emptyAppsIcon}>⏳</Text>
              <Text style={styles.emptyAppsText}>Esperando postulaciones de técnicos...</Text>
            </View>
          ) : (
            request.applications.map((app) => (
              <View key={app._id} style={styles.appCard}>
                <View style={styles.appHeader}>
                  <View style={styles.appAvatar}>
                    <Text style={styles.appAvatarText}>
                      {app.technician_name?.charAt(0).toUpperCase() || '?'}
                    </Text>
                  </View>
                  <View style={styles.appInfo}>
                    <Text style={styles.appName}>{app.technician_name}</Text>
                    <Text style={styles.appRating}>
                      {'★'.repeat(Math.round(app.technician_rating || 0))} {(app.technician_rating || 0).toFixed(1)}
                    </Text>
                  </View>
                  <Text style={styles.appPrice}>
                    ${(app.proposed_price || 0).toLocaleString('es-CL')}
                  </Text>
                </View>
                {app.message ? (
                  <Text style={styles.appMessage}>"{app.message}"</Text>
                ) : null}
                {request.status === 'open' && app.status === 'pending' && (
                  <TouchableOpacity
                    style={[styles.acceptBtn, accepting === app._id && styles.acceptBtnDisabled]}
                    onPress={() => handleAccept(String(app._id), app.technician_name)}
                    disabled={accepting === app._id}
                  >
                    {accepting === app._id ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <>
                        <Ionicons name="checkmark-circle" size={18} color="white" />
                        <Text style={styles.acceptBtnText}>Aceptar postulación</Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
                {app.status === 'accepted' && (
                  <View style={styles.acceptedBadge}>
                    <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
                    <Text style={styles.acceptedBadgeText}>Aceptado</Text>
                  </View>
                )}
              </View>
            ))
          )}
        </View>
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
  statusBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, marginBottom: 16,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusLabel: { fontSize: 14, fontWeight: '700' },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 14 },
  requestTitle: { fontSize: 22, fontWeight: '800', color: Colors.text, marginBottom: 12 },
  tagRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  catTag: {
    backgroundColor: Colors.primaryLight, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 100,
  },
  catTagText: { fontSize: 13, fontWeight: '600', color: Colors.primaryDark },
  requestDesc: { fontSize: 15, color: Colors.textSecondary, lineHeight: 22 },
  detailsCard: {
    backgroundColor: Colors.card, borderRadius: 12,
    borderWidth: 1, borderColor: Colors.border, padding: 16, marginBottom: 16,
  },
  detailRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  detailText: { flex: 1, fontSize: 14, color: Colors.text, lineHeight: 20 },
  separator: { height: 1, backgroundColor: Colors.border, marginVertical: 12 },
  priceCard: {
    backgroundColor: '#E3F2FD', borderRadius: 12, padding: 16, marginBottom: 20,
  },
  priceCardTitle: { fontSize: 15, fontWeight: '700', color: Colors.primaryDark, marginBottom: 12 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  priceLabel: { fontSize: 14, color: Colors.textSecondary },
  priceValue: { fontSize: 14, color: Colors.text, fontWeight: '600' },
  priceTotalRow: { borderTopWidth: 1, borderTopColor: Colors.primary + '30', paddingTop: 10, marginTop: 4 },
  priceTotalLabel: { fontSize: 16, fontWeight: '700', color: Colors.text },
  priceTotalValue: { fontSize: 18, fontWeight: '800', color: Colors.primary },
  emptyApps: { alignItems: 'center', padding: 32, backgroundColor: Colors.surface, borderRadius: 12 },
  emptyAppsIcon: { fontSize: 36, marginBottom: 10 },
  emptyAppsText: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center' },
  appCard: {
    backgroundColor: Colors.card, borderRadius: 12, padding: 14,
    marginBottom: 12, borderWidth: 1, borderColor: Colors.border,
  },
  appHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  appAvatar: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center',
  },
  appAvatarText: { color: 'white', fontWeight: '800', fontSize: 18 },
  appInfo: { flex: 1 },
  appName: { fontSize: 15, fontWeight: '700', color: Colors.text },
  appRating: { fontSize: 13, color: '#F59E0B' },
  appPrice: { fontSize: 17, fontWeight: '800', color: Colors.primary },
  appMessage: {
    fontSize: 14, color: Colors.textSecondary, fontStyle: 'italic',
    backgroundColor: Colors.surface, borderRadius: 8, padding: 10, marginBottom: 10,
  },
  acceptBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.success, borderRadius: 10, padding: 12, marginTop: 4,
  },
  acceptBtnDisabled: { opacity: 0.6 },
  acceptBtnText: { color: 'white', fontSize: 15, fontWeight: '700' },
  acceptedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#E8F5E9', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 100,
    alignSelf: 'flex-start',
  },
  acceptedBadgeText: { color: Colors.success, fontWeight: '700', fontSize: 14 },
});
