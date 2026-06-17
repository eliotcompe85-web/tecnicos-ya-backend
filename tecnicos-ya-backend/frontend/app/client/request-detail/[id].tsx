import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, SafeAreaView, Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { serviceRequestService, applicationService } from '@/src/services/api';
import { Colors } from '@/src/constants/colors';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function ClientRequestDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [request, setRequest] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => { loadData(); }, [id]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const data = await serviceRequestService.getById(id!);
      setRequest(data);
    } catch (error) {
      Alert.alert('Error', 'No se pudo cargar la solicitud');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccept = async (appId: string) => {
    Alert.alert(
      'Aceptar Postulación',
      '¿Confirmas que quieres aceptar a este técnico?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Aceptar',
          onPress: async () => {
            try {
              await applicationService.accept(appId);
              Alert.alert('Éxito', 'Técnico aceptado. Contacta para coordinar la visita.');
              loadData();
            } catch (error: any) {
              Alert.alert('Error', error.message);
            }
          },
        },
      ]
    );
  };

  if (isLoading || !request) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color={Colors.primary} style={{ flex: 1 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Detalle de Solicitud</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <Text style={styles.requestTitle}>{request.title}</Text>
          <Text style={styles.category}>{request.category_name}</Text>
          <Text style={styles.description}>{request.description}</Text>

          <View style={styles.infoRow}>
            <Ionicons name="location" size={18} color={Colors.textSecondary} />
            <Text style={styles.infoText}>{request.address}</Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="time" size={18} color={Colors.textSecondary} />
            <Text style={styles.infoText}>
              {format(new Date(request.created_at), 'dd MMM yyyy, HH:mm', { locale: es })}
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>
          Postulaciones ({request.applications?.length || 0})
        </Text>

        {!request.applications?.length ? (
          <View style={styles.emptyState}>
            <Ionicons name="hourglass-outline" size={48} color={Colors.disabled} />
            <Text style={styles.emptyText}>Esperando postulaciones...</Text>
            <Text style={styles.emptySubtext}>
              Los técnicos cercanos verán tu solicitud y postularán pronto
            </Text>
          </View>
        ) : (
          request.applications.map((app: any) => (
            <View key={app._id} style={styles.applicationCard}>
              <View style={styles.appHeader}>
                <View>
                  <Text style={styles.appName}>{app.technician_name}</Text>
                  <View style={styles.appRating}>
                    <Ionicons name="star" size={14} color={Colors.warning} />
                    <Text style={styles.appRatingText}>
                      {app.technician_rating?.toFixed(1) || '0.0'}
                    </Text>
                  </View>
                </View>
                <View style={styles.appPriceContainer}>
                  <Text style={styles.appPriceLabel}>Propuesta</Text>
                  <Text style={styles.appPrice}>
                    ${app.proposed_price.toLocaleString()}
                  </Text>
                </View>
              </View>
              <Text style={styles.appMessage}>{app.message}</Text>

              {app.status === 'pending' && request.status === 'open' && (
                <TouchableOpacity
                  style={styles.acceptButton}
                  onPress={() => handleAccept(app._id)}
                >
                  <Ionicons name="checkmark-circle" size={18} color="#FFF" />
                  <Text style={styles.acceptButtonText}>Aceptar Técnico</Text>
                </TouchableOpacity>
              )}

              {app.status === 'accepted' && (
                <View style={styles.acceptedBadge}>
                  <Ionicons name="checkmark-circle" size={18} color={Colors.success} />
                  <Text style={styles.acceptedText}>Aceptado</Text>
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: Colors.card, borderBottomWidth: 1, borderBottomColor: Colors.border },
  backButton: { padding: 8 },
  title: { fontSize: 20, fontWeight: 'bold', color: Colors.text },
  placeholder: { width: 40 },
  scrollContent: { padding: 16 },
  card: { backgroundColor: Colors.card, borderRadius: 12, padding: 16, marginBottom: 24 },
  requestTitle: { fontSize: 22, fontWeight: 'bold', color: Colors.text, marginBottom: 4 },
  category: { fontSize: 14, color: Colors.primary, fontWeight: '600', marginBottom: 12 },
  description: { fontSize: 14, color: Colors.textSecondary, lineHeight: 22, marginBottom: 16 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  infoText: { fontSize: 14, color: Colors.textSecondary, marginLeft: 8, flex: 1 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.text, marginBottom: 12 },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 16, fontWeight: '600', color: Colors.text, marginTop: 12 },
  emptySubtext: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', marginTop: 4, paddingHorizontal: 32 },
  applicationCard: { backgroundColor: Colors.card, borderRadius: 12, padding: 16, marginBottom: 12 },
  appHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  appName: { fontSize: 16, fontWeight: 'bold', color: Colors.text, marginBottom: 4 },
  appRating: { flexDirection: 'row', alignItems: 'center' },
  appRatingText: { fontSize: 13, color: Colors.textSecondary, marginLeft: 4 },
  appPriceContainer: { alignItems: 'flex-end' },
  appPriceLabel: { fontSize: 11, color: Colors.textSecondary },
  appPrice: { fontSize: 18, fontWeight: 'bold', color: Colors.success },
  appMessage: { fontSize: 14, color: Colors.textSecondary, lineHeight: 20, marginBottom: 12 },
  acceptButton: { flexDirection: 'row', backgroundColor: Colors.success, paddingVertical: 12, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  acceptButtonText: { color: '#FFF', fontSize: 14, fontWeight: 'bold', marginLeft: 8 },
  acceptedBadge: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.primaryLight, paddingVertical: 10, borderRadius: 8 },
  acceptedText: { color: Colors.success, fontSize: 14, fontWeight: 'bold', marginLeft: 8 },
});
