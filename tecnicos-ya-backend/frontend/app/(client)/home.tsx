import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/src/context/AuthContext';
import { categoryService } from '@/src/services/api';
import { Colors } from '@/src/constants/colors';

type ServiceCategory = {
  _id: string;
  name: string;
  description: string;
  icon: string;
};

const ICON_EMOJI: Record<string, string> = {
  flash_on: '⚡', water_drop: '💧', build: '🔧', carpenter: '🪵',
  format_paint: '🎨', ac_unit: '❄️', yard: '🌿', cleaning_services: '🧹',
  computer: '💻', key: '🔑', local_shipping: '🚛', home_repair_service: '🏗️',
  // Legacy icons
  flash: '⚡', water: '💧', hammer: '🔨', construct: '🏗️',
  'color-palette': '🎨', thermometer: '🌡️', leaf: '🌿',
  sparkles: '✨', car: '🚗', desktop: '💻',
};

const CARD_COLORS = [
  ['#EFF6FF', '#DBEAFE'],
  ['#FFF7ED', '#FED7AA'],
  ['#F0FDF4', '#BBF7D0'],
  ['#FDF4FF', '#E9D5FF'],
  ['#FFFBEB', '#FDE68A'],
  ['#F0FDFA', '#99F6E4'],
];

export default function ClientHomeScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches';

  useEffect(() => { loadCategories(); }, []);

  const loadCategories = async () => {
    try {
      setIsLoading(true);
      const data = await categoryService.getAll();
      setCategories(data);
    } catch {
      // silently fail
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />

      {/* Header gradient */}
      <LinearGradient
        colors={[Colors.primary, Colors.primaryDark]}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>{greeting} 👋</Text>
            <Text style={styles.userName}>{user?.full_name?.split(' ')[0] || 'Cliente'}</Text>
          </View>
          <TouchableOpacity
            style={styles.notifBtn}
            onPress={() => router.push('/(client)/profile')}
          >
            <Ionicons name="notifications-outline" size={24} color="white" />
          </TouchableOpacity>
        </View>

        {/* Search bar */}
        <TouchableOpacity
          style={styles.searchBar}
          onPress={() => router.push('/(client)/technicians')}
          activeOpacity={0.85}
        >
          <Ionicons name="search" size={18} color={Colors.textSecondary} />
          <Text style={styles.searchPlaceholder}>Buscar técnico o servicio...</Text>
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={loadCategories} colors={[Colors.primary]} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Quick actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={[styles.quickAction, { backgroundColor: '#EFF6FF' }]}
            onPress={() => router.push('/(client)/create-request')}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: Colors.primary }]}>
              <Ionicons name="add" size={22} color="white" />
            </View>
            <Text style={styles.quickActionText}>Nueva{'\n'}Solicitud</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickAction, { backgroundColor: '#FFF7ED' }]}
            onPress={() => router.push('/(client)/technicians')}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: Colors.accent }]}>
              <Ionicons name="search" size={22} color="white" />
            </View>
            <Text style={styles.quickActionText}>Buscar{'\n'}Técnicos</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickAction, { backgroundColor: '#F0FDF4' }]}
            onPress={() => router.push('/(client)/requests')}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: Colors.success }]}>
              <Ionicons name="document-text" size={22} color="white" />
            </View>
            <Text style={styles.quickActionText}>Mis{'\n'}Solicitudes</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickAction, { backgroundColor: '#FDF4FF' }]}
            onPress={() => router.push('/(client)/profile')}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: '#8B5CF6' }]}>
              <Ionicons name="person" size={22} color="white" />
            </View>
            <Text style={styles.quickActionText}>Mi{'\n'}Perfil</Text>
          </TouchableOpacity>
        </View>

        {/* Banner CTA */}
        <TouchableOpacity
          style={styles.ctaBanner}
          onPress={() => router.push('/(client)/create-request')}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={[Colors.primary, '#6366F1']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.ctaBannerGradient}
          >
            <View style={styles.ctaBannerContent}>
              <Text style={styles.ctaBannerTitle}>¿Necesitas un técnico?</Text>
              <Text style={styles.ctaBannerSub}>Publica tu solicitud gratis</Text>
            </View>
            <View style={styles.ctaBannerIcon}>
              <Text style={{ fontSize: 36 }}>🔧</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.7)" />
          </LinearGradient>
        </TouchableOpacity>

        {/* Categories */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Categorías de Servicio</Text>
          <TouchableOpacity onPress={() => router.push('/(client)/technicians')}>
            <Text style={styles.sectionLink}>Ver todos</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.categoriesGrid}>
          {categories.map((cat, idx) => {
            const [bg1, bg2] = CARD_COLORS[idx % CARD_COLORS.length];
            return (
              <TouchableOpacity
                key={cat._id}
                style={[styles.categoryCard, { backgroundColor: bg1 }]}
                onPress={() =>
                  router.push(`/(client)/technicians?category=${cat._id}&name=${encodeURIComponent(cat.name)}`)
                }
                activeOpacity={0.8}
              >
                <Text style={styles.categoryEmoji}>{ICON_EMOJI[cat.icon] || '🔧'}</Text>
                <Text style={styles.categoryName} numberOfLines={1}>{cat.name}</Text>
                <Text style={styles.categoryDesc} numberOfLines={2}>{cat.description}</Text>
                <View style={[styles.categoryArrow, { backgroundColor: bg2 }]}>
                  <Ionicons name="arrow-forward" size={12} color={Colors.textSecondary} />
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Pricing info */}
        <View style={styles.pricingCard}>
          <Text style={styles.pricingTitle}>💰 ¿Cómo se calcula el precio?</Text>
          <View style={styles.pricingRow}>
            <Text style={styles.pricingLabel}>Tarifa base</Text>
            <Text style={styles.pricingValue}>$9.990</Text>
          </View>
          <View style={styles.pricingRow}>
            <Text style={styles.pricingLabel}>Por km adicional (sobre 6 km)</Text>
            <Text style={styles.pricingValue}>+$1.000/km</Text>
          </View>
          <Text style={styles.pricingNote}>
            El precio final lo acuerda el técnico al postular a tu solicitud.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  headerTop: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    marginBottom: 20,
  },
  greeting: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginBottom: 2 },
  userName: { fontSize: 24, fontWeight: '800', color: 'white' },
  notifBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
  },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: 'white', borderRadius: 14,
    paddingHorizontal: 16, paddingVertical: 13,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1, shadowRadius: 8, elevation: 4,
  },
  searchPlaceholder: { fontSize: 15, color: Colors.textSecondary },
  scrollContent: { padding: 16, paddingBottom: 32 },
  quickActions: {
    flexDirection: 'row', gap: 10, marginBottom: 16, marginTop: 4,
  },
  quickAction: {
    flex: 1, alignItems: 'center', gap: 8,
    padding: 14, borderRadius: 14,
  },
  quickActionIcon: {
    width: 44, height: 44, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
  },
  quickActionText: {
    fontSize: 11, fontWeight: '700', color: Colors.text,
    textAlign: 'center', lineHeight: 15,
  },
  ctaBanner: { marginBottom: 24, borderRadius: 16, overflow: 'hidden' },
  ctaBannerGradient: {
    flexDirection: 'row', alignItems: 'center', padding: 18, gap: 12,
  },
  ctaBannerContent: { flex: 1 },
  ctaBannerTitle: { fontSize: 16, fontWeight: '800', color: 'white', marginBottom: 2 },
  ctaBannerSub: { fontSize: 13, color: 'rgba(255,255,255,0.8)' },
  ctaBannerIcon: {
    width: 52, height: 52, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
  },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14,
  },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: Colors.text },
  sectionLink: { fontSize: 14, color: Colors.primary, fontWeight: '600' },
  categoriesGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20,
  },
  categoryCard: {
    width: '47%', borderRadius: 16, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  categoryEmoji: { fontSize: 32, marginBottom: 10 },
  categoryName: { fontSize: 15, fontWeight: '700', color: Colors.text, marginBottom: 4 },
  categoryDesc: { fontSize: 12, color: Colors.textSecondary, lineHeight: 16, marginBottom: 12 },
  categoryArrow: {
    width: 24, height: 24, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center', alignSelf: 'flex-end',
  },
  pricingCard: {
    backgroundColor: 'white', borderRadius: 16, padding: 18,
    borderWidth: 1, borderColor: Colors.border,
  },
  pricingTitle: { fontSize: 15, fontWeight: '700', color: Colors.text, marginBottom: 12 },
  pricingRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  pricingLabel: { fontSize: 14, color: Colors.textSecondary },
  pricingValue: { fontSize: 14, fontWeight: '700', color: Colors.primary },
  pricingNote: { fontSize: 12, color: Colors.textSecondary, marginTop: 8, fontStyle: 'italic' },
});