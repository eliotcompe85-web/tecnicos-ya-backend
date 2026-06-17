import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { technicianService } from '@/src/services/api';
import { Colors } from '@/src/constants/colors';

type Technician = {
  _id: string;
  user_id: string;
  description: string;
  experience_years: number;
  availability_status: string;
  membership_type: string;
  distance_km?: number;
  user: {
    full_name: string;
    rating_avg: number;
    rating_count: number;
    phone: string;
  };
};

export default function SearchTechniciansScreen() {
  const router = useRouter();
  const { category, name } = useLocalSearchParams<{ category: string; name: string }>();
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    loadTechnicians();
  }, [filter]);

  const loadTechnicians = async () => {
    try {
      setIsLoading(true);
      let userLocation = null;
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({});
        userLocation = loc.coords;
      }

      const params: any = { category_id: category };
      if (userLocation) {
        params.latitude = userLocation.latitude;
        params.longitude = userLocation.longitude;
      }
      if (filter !== 'all') {
        params.availability = filter;
      }

      const data = await technicianService.search(params);
      setTechnicians(data);
    } catch (error) {
      console.error('Error loading technicians:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getAvailabilityColor = (status: string) => {
    switch (status) {
      case 'available': return Colors.available;
      case 'scheduling': return Colors.scheduling;
      default: return Colors.unavailable;
    }
  };

  const getAvailabilityText = (status: string) => {
    switch (status) {
      case 'available': return 'Disponible';
      case 'scheduling': return 'Agendando';
      default: return 'No disponible';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>{name || 'Técnicos'}</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterContainer}
      >
        {[
          { key: 'all', label: 'Todos', color: Colors.primary },
          { key: 'available', label: '🟢 Disponibles', color: Colors.available },
          { key: 'scheduling', label: '🟡 Agendando', color: Colors.scheduling },
        ].map((item) => (
          <TouchableOpacity
            key={item.key}
            style={[
              styles.filterChip,
              filter === item.key && { backgroundColor: item.color, borderColor: item.color },
            ]}
            onPress={() => setFilter(item.key)}
          >
            <Text style={[styles.filterChipText, filter === item.key && styles.filterChipTextActive]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {isLoading ? (
          <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 40 }} />
        ) : technicians.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="search-outline" size={64} color={Colors.disabled} />
            <Text style={styles.emptyText}>No hay técnicos disponibles</Text>
            <Text style={styles.emptySubtext}>Prueba con otra categoría o crea una solicitud</Text>
            <TouchableOpacity style={styles.createButton} onPress={() => router.push('/client/new-request')}>
              <Text style={styles.createButtonText}>Crear Solicitud</Text>
            </TouchableOpacity>
          </View>
        ) : (
          technicians.map((tech) => (
            <TouchableOpacity
              key={tech._id}
              style={styles.technicianCard}
              onPress={() => router.push(`/client/technician-detail/${tech.user_id}`)}
            >
              <View style={styles.cardHeader}>
                <View style={styles.avatarContainer}>
                  <Ionicons name="person-circle" size={50} color={Colors.primary} />
                  <View style={[styles.statusDot, { backgroundColor: getAvailabilityColor(tech.availability_status) }]} />
                </View>
                <View style={styles.cardInfo}>
                  <View style={styles.nameRow}>
                    <Text style={styles.techName}>{tech.user.full_name}</Text>
                    {tech.membership_type === 'premium' && (
                      <View style={styles.premiumBadge}>
                        <Ionicons name="star" size={12} color="#FFF" />
                        <Text style={styles.premiumText}>PRO</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.ratingRow}>
                    <Ionicons name="star" size={14} color={Colors.warning} />
                    <Text style={styles.rating}>
                      {tech.user.rating_avg?.toFixed(1) || '0.0'} ({tech.user.rating_count || 0})
                    </Text>
                  </View>
                  <Text style={styles.availability}>{getAvailabilityText(tech.availability_status)}</Text>
                </View>
              </View>

              {tech.description && (
                <Text style={styles.description} numberOfLines={2}>{tech.description}</Text>
              )}

              <View style={styles.cardFooter}>
                <View style={styles.infoItem}>
                  <Ionicons name="briefcase-outline" size={14} color={Colors.textSecondary} />
                  <Text style={styles.infoText}>{tech.experience_years} años</Text>
                </View>
                {tech.distance_km !== undefined && (
                  <View style={styles.infoItem}>
                    <Ionicons name="location-outline" size={14} color={Colors.textSecondary} />
                    <Text style={styles.infoText}>{tech.distance_km} km</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
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
  filterScroll: { maxHeight: 60 },
  filterContainer: { paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surface, flexShrink: 0 },
  filterChipText: { fontSize: 14, color: Colors.textSecondary, fontWeight: '600' },
  filterChipTextActive: { color: '#FFF' },
  scrollContent: { padding: 16, flexGrow: 1 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 18, fontWeight: '600', color: Colors.text, marginTop: 16 },
  emptySubtext: { fontSize: 14, color: Colors.textSecondary, marginTop: 8, marginBottom: 24, textAlign: 'center' },
  createButton: { backgroundColor: Colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  createButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  technicianCard: { backgroundColor: Colors.card, borderRadius: 12, padding: 16, marginBottom: 12, elevation: 2 },
  cardHeader: { flexDirection: 'row', marginBottom: 12 },
  avatarContainer: { position: 'relative', marginRight: 12 },
  statusDot: { position: 'absolute', bottom: 2, right: 2, width: 14, height: 14, borderRadius: 7, borderWidth: 2, borderColor: Colors.card },
  cardInfo: { flex: 1, justifyContent: 'center' },
  nameRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  techName: { fontSize: 16, fontWeight: 'bold', color: Colors.text },
  premiumBadge: { flexDirection: 'row', backgroundColor: Colors.accent, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginLeft: 8, alignItems: 'center' },
  premiumText: { fontSize: 10, color: '#FFF', fontWeight: 'bold', marginLeft: 2 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  rating: { fontSize: 13, color: Colors.textSecondary, marginLeft: 4 },
  availability: { fontSize: 12, color: Colors.textSecondary, fontWeight: '600' },
  description: { fontSize: 14, color: Colors.textSecondary, lineHeight: 20, marginBottom: 12 },
  cardFooter: { flexDirection: 'row', paddingTop: 8, borderTopWidth: 1, borderTopColor: Colors.border, gap: 16 },
  infoItem: { flexDirection: 'row', alignItems: 'center' },
  infoText: { fontSize: 12, color: Colors.textSecondary, marginLeft: 4 },
});
