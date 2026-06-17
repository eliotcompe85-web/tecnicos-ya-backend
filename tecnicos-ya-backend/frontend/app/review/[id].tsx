import React, { useState } from 'react';
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
import { reviewService } from '@/src/services/api';
import { Colors } from '@/src/constants/colors';

export default function ReviewScreen() {
  const router = useRouter();
  const { visit_id, to_user_id, to_user_name } = useLocalSearchParams<{
    visit_id: string;
    to_user_id: string;
    to_user_name: string;
  }>();

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const RATING_LABELS = ['', 'Muy malo', 'Malo', 'Regular', 'Bueno', '¡Excelente!'];
  const RATING_COLORS = ['', Colors.error, Colors.error, Colors.warning, Colors.success, Colors.success];

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert('Calificación requerida', 'Por favor selecciona una calificación de 1 a 5 estrellas.');
      return;
    }
    try {
      setSubmitting(true);
      await reviewService.create({
        visit_id: parseInt(visit_id!),
        to_user_id: parseInt(to_user_id!),
        rating,
        comment: comment.trim() || undefined,
      });
      Alert.alert(
        '⭐ ¡Gracias por tu reseña!',
        'Tu calificación ayuda a mejorar la comunidad.',
        [{ text: 'Aceptar', onPress: () => router.back() }]
      );
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.detail || 'No se pudo enviar la reseña');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Dejar Reseña</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* User card */}
        <View style={styles.userCard}>
          <View style={styles.userAvatar}>
            <Text style={styles.userAvatarText}>
              {(to_user_name || 'U').charAt(0).toUpperCase()}
            </Text>
          </View>
          <View>
            <Text style={styles.userCardLabel}>Calificando a</Text>
            <Text style={styles.userCardName}>{to_user_name || 'Usuario'}</Text>
          </View>
        </View>

        {/* Star Rating */}
        <Text style={styles.sectionTitle}>¿Cómo fue tu experiencia?</Text>
        <View style={styles.starsRow}>
          {[1, 2, 3, 4, 5].map((star) => (
            <TouchableOpacity
              key={star}
              onPress={() => setRating(star)}
              style={styles.starBtn}
              activeOpacity={0.7}
            >
              <Ionicons
                name={star <= rating ? 'star' : 'star-outline'}
                size={48}
                color={star <= rating ? '#F59E0B' : Colors.border}
              />
            </TouchableOpacity>
          ))}
        </View>

        {rating > 0 && (
          <Text style={[styles.ratingLabel, { color: RATING_COLORS[rating] }]}>
            {RATING_LABELS[rating]}
          </Text>
        )}

        {/* Comment */}
        <Text style={styles.label}>Comentario (opcional)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Cuéntanos más sobre tu experiencia..."
          placeholderTextColor={Colors.textSecondary}
          value={comment}
          onChangeText={setComment}
          multiline
          numberOfLines={5}
          textAlignVertical="top"
          maxLength={500}
        />
        <Text style={styles.charCount}>{comment.length}/500</Text>

        {/* Quick tags */}
        <Text style={styles.label}>Etiquetas rápidas</Text>
        <View style={styles.tagsRow}>
          {[
            '✅ Puntual', '🔧 Trabajo prolijo', '💬 Buena comunicación',
            '💰 Precio justo', '🏆 Muy profesional', '🔄 Lo contrataría de nuevo',
          ].map((tag) => {
            const isSelected = comment.includes(tag.split(' ').slice(1).join(' '));
            return (
              <TouchableOpacity
                key={tag}
                style={[styles.tag, isSelected && styles.tagActive]}
                onPress={() => {
                  const tagText = tag.split(' ').slice(1).join(' ');
                  setComment((prev) =>
                    prev.includes(tagText)
                      ? prev.replace(tagText, '').trim()
                      : (prev ? prev + '. ' : '') + tagText
                  );
                }}
              >
                <Text style={[styles.tagText, isSelected && styles.tagTextActive]}>{tag}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity
          style={[styles.submitBtn, (submitting || rating === 0) && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={submitting || rating === 0}
        >
          {submitting ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <Ionicons name="star" size={18} color="white" />
              <Text style={styles.submitBtnText}>Enviar Reseña</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
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
  headerTitle: { fontSize: 18, fontWeight: '700', color: Colors.text },
  content: { padding: 20, paddingBottom: 40 },
  userCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: Colors.card, borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: Colors.border, marginBottom: 28,
  },
  userAvatar: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center',
  },
  userAvatarText: { color: 'white', fontSize: 22, fontWeight: '800' },
  userCardLabel: { fontSize: 12, color: Colors.textSecondary, marginBottom: 2 },
  userCardName: { fontSize: 18, fontWeight: '700', color: Colors.text },
  sectionTitle: {
    fontSize: 17, fontWeight: '700', color: Colors.text,
    textAlign: 'center', marginBottom: 20,
  },
  starsRow: {
    flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 12,
  },
  starBtn: { padding: 4 },
  ratingLabel: {
    fontSize: 18, fontWeight: '700', textAlign: 'center', marginBottom: 28,
  },
  label: {
    fontSize: 12, fontWeight: '700', color: Colors.textSecondary,
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10,
  },
  input: {
    backgroundColor: Colors.surface, borderRadius: 12, padding: 14,
    fontSize: 15, color: Colors.text, borderWidth: 1, borderColor: Colors.border,
  },
  textArea: { minHeight: 120, textAlignVertical: 'top', marginBottom: 6 },
  charCount: {
    fontSize: 12, color: Colors.textSecondary,
    textAlign: 'right', marginBottom: 24,
  },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 32 },
  tag: {
    paddingHorizontal: 14, paddingVertical: 9,
    borderRadius: 100, borderWidth: 1.5, borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  tagActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  tagText: { fontSize: 13, fontWeight: '600', color: Colors.text },
  tagTextActive: { color: Colors.primaryDark },
  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: '#F59E0B', borderRadius: 14, padding: 17,
  },
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnText: { color: 'white', fontSize: 17, fontWeight: '700' },
});
