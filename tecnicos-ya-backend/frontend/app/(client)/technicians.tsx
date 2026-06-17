import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { technicianService } from '@/src/services/api';
import { Colors } from '@/src/constants/colors';

type Technician = {
  _id: string;
  user_id: string;
  description: string;
  experience_years: number;
  availability_status: 'available' | 'scheduling' | 'unavailable';
  membership_type: 'none' | 'basic' | 'premium';
  category_ids: string[];
  distance_km: number | null;
  user: {
    _id: string;
    full_name: string;
    email: string;
    phone: string;
    rating_avg: number;
    rating_count: number;
  };
};

const AVAILABILITY_LABELS: Record<string, { label: string; color: string }> = {
  available: { label: 'Disponible', color: Colors.success },
  scheduling: { label: 'Agendando', color: Colors.warning },
  unavailable: { label: 'No disponible', color: Colors.disabled },
};

const MEMBERSHIP_COLORS: Record<string, string> = {
  premium: '#F59E0B',
  basic: Colors.primary,
  none: Colors.textSecondary,
};

function StarRating({ rating }: { rating: number }) {
  const stars = Math.round(rating);
  return (
    <Text style={{ fontSize: 12, color: '#F59E0B', letterSpacing: 1 }}>
      {'★'.repeat(stars)}{'☆'.repeat(5 - stars)}
    </Text>
  );
}

function TechnicianCard({ item, onPress }: { item: Technician; onPress: () => void }) {
  const avail = AVAILABILITY_LABELS[item.availability_status] || AVAILABILITY_LABELS.unavailable;
  const memberColor = MEMBERSHIP_COLORS[item.membership_type] || Colors.textSecondary;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      {/* Header row */}
      <View style={styles.cardHeader}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarInitial}>
            {item.user.full_name.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.cardHeaderInfo}>
          <View style={styles.cardNameRow}>
            <Text style={styles.cardName}>{item.user.full_name}</Text>
            {item.membership_type !== 'none' && (
              <View style={[styles.memberBadge, { borderColor: memberColor }]}>
                <Text style={[styles.memberBadgeText, { color: memberColor }]}>
                  {item.membership_type === 'premium' ? '⭐ PREMIUM' : '✓ BASIC'}
                </Text>
              </View>
            )}
          </View>
          <StarRating rating={item.user.rating_avg || 0} />
          <Text style={styles.ratingCount}>
            {(item.user.rating_avg || 0).toFixed(1)} ({item.user.rating_count || 0} reseñas)
          </Text>
        </View>
        <View style={[styles.availBadge, { backgroundColor: avail.color + '20' }]}>
          <View style={[styles.availDot, { backgroundColor: avail.color }]} />
          <Text style={[styles.availText, { color: avail.color }]}>{avail.label}</Text>
        </View>
      </View>

      {/* Description */}
      {item.description ? (
        <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>
      ) : null}

      {/* Footer row */}
      <View style={styles.cardFooter}>
        <View style={styles.cardStat}>
          <Ionicons name="briefcase" size={14} color={Colors.textSecondary} />
          <Text style={styles.cardStatText}>{item.experience_years} años exp.</Text>
        </View>
        {item.distance_km != null && (
          <View style={styles.cardStat}>
            <Ionicons name="location" size={14} color={Colors.textSecondary} />
            <Text style={styles.cardStatText}>{item.distance_km.toFixed(1)} km</Text>
          </View>
        )}
        <View style={styles.cardStat}>
          <Ionicons name="cash" size={14} color={Colors.textSecondary} />
          <Text style={styles.cardStatText}>
            $
            {item.distance_km != null && item.distance_km > 6
              ? (9990 + (item.distance_km - 6) * 1000).toLocaleString('es-CL')
              : '9.990'}
          </Text>
        </View>
        <TouchableOpacity style={styles.contactBtn} onPress={onPress}>
          <Text style={styles.contactBtnText}>Ver perfil</Text>
          <Ionicons name="chevron-forward" size={14} color={Colors.primary} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

export default function TechniciansScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ category?: string; name?: string }>();

  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [filtered, setFiltered] = useState<Technician[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [filterAvail, setFilterAvail] = useState<string>('all');

  const load = useCallback(async (refresh = false) => {
    try {
      refresh ? setIsRefreshing(true) : setIsLoading(true);
      const data = await technicianService.search({
        category_id: params.category,
        latitude: -33.4372,
        longitude: -70.6506,
        max_distance_km: 50,
      });
      setTechnicians(data);
      setFiltered(data);
    } catch {
      // silently fail
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [params.category]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    let result = technicians;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (t) =>
          t.user.full_name.toLowerCase().includes(q) ||
          (t.description || '').toLowerCase().includes(q)
      );
    }
    if (filterAvail !== 'all') {
      result = result.filter((t) => t.availability_status === filterAvail);
    }
    setFiltered(result);
  }, [search, filterAvail, technicians]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Técnicos</Text>
          {params.name ? (
            <Text style={styles.headerSub}>{params.name}</Text>
          ) : null}
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Search */}
      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color={Colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar técnico..."
          placeholderTextColor={Colors.textSecondary}
          value={search}
          onChangeText={setSearch}
        />
        {search ? (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color={Colors.textSecondary} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Availability filter */}
      <View style={styles.filterRow}>
        {(['all', 'available', 'scheduling'] as const).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterChip, filterAvail === f && styles.filterChipActive]}
            onPress={() => setFilterAvail(f)}
          >
            <Text style={[styles.filterChipText, filterAvail === f && styles.filterChipTextActive]}>
              {f === 'all' ? 'Todos' : f === 'available' ? '🟢 Disponibles' : '🟡 Agendando'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* List */}
      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Buscando técnicos...</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={() => load(true)} />
          }
          renderItem={({ item }) => (
            <TechnicianCard
              item={item}
              onPress={() => router.push(`/technician/${item.user_id}`)}
            />
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>👷</Text>
              <Text style={styles.emptyTitle}>
                {search ? 'Sin resultados' : 'No hay técnicos disponibles'}
              </Text>
              <Text style={styles.emptyDesc}>
                {search
                  ? 'Prueba con otro término de búsqueda'
                  : 'Intenta ampliar el radio de búsqueda o busca otra categoría'}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: Colors.card, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  backBtn: { padding: 4 },
  headerCenter: { alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: Colors.text },
  headerSub: { fontSize: 13, color: Colors.primary, fontWeight: '500' },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    margin: 16, paddingHorizontal: 14, paddingVertical: 12,
    backgroundColor: Colors.surface, borderRadius: 12,
    borderWidth: 1, borderColor: Colors.border,
  },
  searchInput: { flex: 1, fontSize: 15, color: Colors.text },
  filterRow: {
    flexDirection: 'row', gap: 10, paddingHorizontal: 16, marginBottom: 8,
  },
  filterChip: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 100, borderWidth: 1.5, borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  filterChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterChipText: { fontSize: 13, fontWeight: '600', color: Colors.text },
  filterChipTextActive: { color: 'white' },
  listContent: { padding: 16, paddingTop: 8, gap: 14 },
  card: {
    backgroundColor: Colors.card, borderRadius: 16, padding: 16,
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 8, borderWidth: 1, borderColor: Colors.border,
  },
  cardHeader: { flexDirection: 'row', gap: 12, marginBottom: 10 },
  avatarCircle: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center',
  },
  avatarInitial: { fontSize: 20, fontWeight: '800', color: 'white' },
  cardHeaderInfo: { flex: 1 },
  cardNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' },
  cardName: { fontSize: 16, fontWeight: '700', color: Colors.text },
  memberBadge: {
    borderWidth: 1, borderRadius: 100, paddingHorizontal: 7, paddingVertical: 2,
  },
  memberBadgeText: { fontSize: 10, fontWeight: '700' },
  ratingCount: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  availBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 8, paddingVertical: 5, borderRadius: 100, alignSelf: 'flex-start',
  },
  availDot: { width: 7, height: 7, borderRadius: 4 },
  availText: { fontSize: 11, fontWeight: '700' },
  cardDesc: { fontSize: 13, color: Colors.textSecondary, lineHeight: 18, marginBottom: 12 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', gap: 16, flexWrap: 'wrap' },
  cardStat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cardStatText: { fontSize: 13, color: Colors.textSecondary },
  contactBtn: {
    marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.primaryLight, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 100,
  },
  contactBtnText: { fontSize: 13, fontWeight: '600', color: Colors.primary },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  loadingText: { marginTop: 12, fontSize: 15, color: Colors.textSecondary },
  empty: { alignItems: 'center', padding: 40 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.text, marginBottom: 8 },
  emptyDesc: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20 },
});
