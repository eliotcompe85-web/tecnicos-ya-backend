import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, SafeAreaView, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { reviewService } from '@/src/services/api';
import { Colors } from '@/src/constants/colors';

export default function ReviewScreen() {
  const router = useRouter();
  const { visitId, toUserId, userName, userRole } = useLocalSearchParams<{
    visitId: string;
    toUserId: string;
    userName: string;
    userRole: string;
  }>();

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert('Error', 'Por favor selecciona una calificación');
      return;
    }
    if (!comment.trim()) {
      Alert.alert('Error', 'Por favor escribe un comentario');
      return;
    }

    setIsSubmitting(true);
    try {
      await reviewService.create({
        visit_id: visitId,
        to_user_id: toUserId,
        rating,
        comment: comment.trim(),
      });

      Alert.alert(
        '¡Gracias por tu reseña!',
        'Tu calificación ha sido enviada',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'No se pudo enviar la reseña');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRatingText = (r: number) => {
    switch (r) {
      case 1: return 'Muy malo';
      case 2: return 'Malo';
      case 3: return 'Regular';
      case 4: return 'Bueno';
      case 5: return 'Excelente';
      default: return 'Toca las estrellas';
    }
  };

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
          <Text style={styles.title}>Calificar</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.userCard}>
            <Ionicons
              name={userRole === 'client' ? 'person-circle' : 'hammer'}
              size={80}
              color={userRole === 'client' ? Colors.primary : Colors.accent}
            />
            <Text style={styles.userName}>{userName}</Text>
            <Text style={styles.userRole}>
              {userRole === 'client' ? 'Cliente' : 'Técnico'}
            </Text>
          </View>

          <Text style={styles.ratingLabel}>¿Cómo fue tu experiencia?</Text>

          <View style={styles.starsContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                onPress={() => setRating(star)}
                style={styles.starButton}
              >
                <Ionicons
                  name={star <= rating ? 'star' : 'star-outline'}
                  size={48}
                  color={star <= rating ? Colors.warning : Colors.disabled}
                />
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.ratingText}>{getRatingText(rating)}</Text>

          <Text style={styles.label}>Tu Reseña</Text>
          <TextInput
            style={styles.input}
            placeholder={
              userRole === 'client'
                ? 'Comparte tu experiencia con este cliente. Tu reseña ayudará a otros técnicos.'
                : 'Comparte tu experiencia con este técnico. Tu reseña ayudará a otros clientes.'
            }
            value={comment}
            onChangeText={setComment}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
            maxLength={500}
          />
          <Text style={styles.charCount}>{comment.length}/500</Text>

          <View style={styles.privacyBox}>
            <Ionicons name="lock-closed" size={18} color={Colors.info} />
            <Text style={styles.privacyText}>
              {userRole === 'client'
                ? 'Esta reseña solo será visible para otros técnicos.'
                : 'Esta reseña solo será visible para otros clientes.'}
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.submitButton, isSubmitting && { opacity: 0.6 }]}
            onPress={handleSubmit}
            disabled={isSubmitting || rating === 0}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <Ionicons name="paper-plane" size={20} color="#FFF" />
                <Text style={styles.submitButtonText}>Enviar Reseña</Text>
              </>
            )}
          </TouchableOpacity>
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
  userCard: { alignItems: 'center', backgroundColor: Colors.card, padding: 24, borderRadius: 12, marginBottom: 24 },
  userName: { fontSize: 20, fontWeight: 'bold', color: Colors.text, marginTop: 12 },
  userRole: { fontSize: 14, color: Colors.textSecondary, marginTop: 4 },
  ratingLabel: { fontSize: 18, fontWeight: 'bold', color: Colors.text, textAlign: 'center', marginBottom: 16 },
  starsContainer: { flexDirection: 'row', justifyContent: 'center', marginBottom: 12 },
  starButton: { padding: 4 },
  ratingText: { fontSize: 16, color: Colors.textSecondary, textAlign: 'center', marginBottom: 24, fontWeight: '600' },
  label: { fontSize: 14, fontWeight: 'bold', color: Colors.text, marginBottom: 8 },
  input: { backgroundColor: Colors.surface, borderRadius: 12, padding: 12, fontSize: 14, color: Colors.text, borderWidth: 1, borderColor: Colors.border, minHeight: 120 },
  charCount: { fontSize: 12, color: Colors.textSecondary, textAlign: 'right', marginTop: 4 },
  privacyBox: { flexDirection: 'row', backgroundColor: Colors.primaryLight, padding: 12, borderRadius: 8, marginTop: 16 },
  privacyText: { flex: 1, fontSize: 13, color: Colors.text, marginLeft: 8 },
  submitButton: { flexDirection: 'row', backgroundColor: Colors.primary, paddingVertical: 16, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 24, marginBottom: 32 },
  submitButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold', marginLeft: 8 },
});
