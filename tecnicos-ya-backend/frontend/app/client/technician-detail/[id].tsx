import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  Linking,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { technicianService, reviewService } from '@/src/services/api';
import { Colors } from '@/src/constants/colors';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function TechnicianDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [profile, setProfile] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => { loadData(); }, [id]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const profileData = await technicianService.getProfile(id!);
      setProfile(profileData);
      try {
        const reviewsData = await reviewService.getUserReviews(id!);
        setReviews(reviewsData.reviews || []);
      } catch {
        setReviews([]);
      }
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', 'No se pudo cargar el perfil');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || !profile) {
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
        <Text style={styles.title}>Perfil del Técnico</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <Ionicons name="person-circle" size={100} color={Colors.primary} />
            {profile.membership_type === 'premium' && (
              <View style={styles.premiumBadge}>
                <Ionicons name="star" size={16} color="#FFF" />
              </View>
            )}
          </View>
          <Text style={styles.name}>{profile.user.full_name}</Text>

          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={20} color={Colors.warning} />
            <Text style={styles.ratingText}>{profile.user.rating_avg?.toFixed(1) || '0.0'}</Text>
            <Text style={styles.ratingCount}>({profile.user.rating_count || 0} reseñas)</Text>
          </View>

          <View style={styles.availabilityBadge}>
            <View style={[styles.statusDot, { backgroundColor:
              profile.availability_status === 'available' ? Colors.available :
              profile.availability_status === 'scheduling' ? Colors.scheduling : Colors.unavailable
            }]} />
            <Text style={styles.availabilityText}>
              {profile.availability_status === 'available' ? 'Disponible Ahora' :
               profile.availability_status === 'scheduling' ? 'Agendando Visitas' : 'No Disponible'}
            </Text>
          </View>
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity style={[styles.actionButton, styles.primaryAction]} onPress={() => router.push('/client/new-request')}>
            <Ionicons name="add-circle" size={24} color="#FFF" />
            <Text style={[styles.actionText, { color: '#FFF' }]}>Solicitar</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sobre Mí</Text>
          <Text style={styles.description}>
            {profile.description || 'Sin descripción disponible'}
          </Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Ionicons name="briefcase" size={24} color={Colors.primary} />
            <Text style={styles.statValue}>{profile.experience_years || 0}</Text>
            <Text style={styles.statLabel}>Años exp.</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="ribbon" size={24} color={Colors.accent} />
            <Text style={styles.statValue}>{profile.certifications?.length || 0}</Text>
            <Text style={styles.statLabel}>Certif.</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="chatbubbles" size={24} color={Colors.success} />
            <Text style={styles.statValue}>{reviews.length}</Text>
            <Text style={styles.statLabel}>Reseñas</Text>
          </View>
        </View>

        {profile.certifications?.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Certificaciones</Text>
            {profile.certifications.map((cert: string, idx: number) => (
              <View key={idx} style={styles.certItem}>
                <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
                <Text style={styles.certText}>{cert}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Reseñas ({reviews.length})</Text>
          {reviews.length === 0 ? (
            <Text style={styles.noReviews}>Aún no hay reseñas</Text>
          ) : (
            reviews.map((review) => (
              <View key={review._id} style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <Text style={styles.reviewerName}>{review.from_user_name}</Text>
                  <View style={styles.reviewStars}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Ionicons
                        key={star}
                        name={star <= review.rating ? 'star' : 'star-outline'}
                        size={14}
                        color={Colors.warning}
                      />
                    ))}
                  </View>
                </View>
                <Text style={styles.reviewComment}>{review.comment}</Text>
                <Text style={styles.reviewDate}>
                  {format(new Date(review.created_at), 'dd MMM yyyy', { locale: es })}
                </Text>
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
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: Colors.card, borderBottomWidth: 1, borderBottomColor: Colors.border },
  backButton: { padding: 8 },
  title: { fontSize: 20, fontWeight: 'bold', color: Colors.text },
  placeholder: { width: 40 },
  scrollContent: { padding: 16 },
  profileSection: { alignItems: 'center', marginBottom: 24 },
  avatarContainer: { position: 'relative', marginBottom: 16 },
  premiumBadge: { position: 'absolute', bottom: 8, right: 8, backgroundColor: Colors.accent, borderRadius: 14, width: 28, height: 28, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: Colors.background },
  name: { fontSize: 24, fontWeight: 'bold', color: Colors.text, marginBottom: 8 },
  ratingContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  ratingText: { fontSize: 18, fontWeight: 'bold', color: Colors.text, marginLeft: 6 },
  ratingCount: { fontSize: 14, color: Colors.textSecondary, marginLeft: 4 },
  availabilityBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  statusDot: { width: 10, height: 10, borderRadius: 5, marginRight: 6 },
  availabilityText: { fontSize: 13, color: Colors.text, fontWeight: '600' },
  actionsRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  actionButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.card, paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: Colors.border },
  primaryAction: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  actionText: { fontSize: 14, fontWeight: 'bold', color: Colors.text, marginLeft: 8 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.text, marginBottom: 12 },
  description: { fontSize: 14, color: Colors.textSecondary, lineHeight: 22 },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  statCard: { flex: 1, backgroundColor: Colors.card, padding: 16, borderRadius: 12, alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: 'bold', color: Colors.text, marginTop: 4 },
  statLabel: { fontSize: 12, color: Colors.textSecondary, marginTop: 4 },
  certItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6 },
  certText: { fontSize: 14, color: Colors.text, marginLeft: 8 },
  noReviews: { fontSize: 14, color: Colors.textSecondary, fontStyle: 'italic' },
  reviewCard: { backgroundColor: Colors.card, padding: 12, borderRadius: 8, marginBottom: 8 },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  reviewerName: { fontSize: 14, fontWeight: 'bold', color: Colors.text },
  reviewStars: { flexDirection: 'row' },
  reviewComment: { fontSize: 14, color: Colors.textSecondary, marginBottom: 6 },
  reviewDate: { fontSize: 12, color: Colors.textSecondary },
});
