import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, Alert, ActivityIndicator, Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/src/constants/colors';
import { paymentService } from '@/src/services/api';

const MEMBERSHIPS = [
  {
    id: 'basic' as const,
    name: 'Básica',
    price: 5500,
    color: Colors.primary,
    features: [
      'Acceso a todos los trabajos disponibles',
      'Postula a trabajos ilimitados',
      'Perfil profesional completo',
      'Recibe pagos semanales',
      'Sistema de calificaciones',
    ],
  },
  {
    id: 'premium' as const,
    name: 'Premium',
    price: 15000,
    color: Colors.accent,
    isPremium: true,
    features: [
      'Todo lo de Básica',
      '⭐ Apareces PRIMERO en búsquedas',
      '🏆 Badge Premium visible',
      '📊 Estadísticas avanzadas',
      '🎯 Prioridad en soporte',
      '💼 Postulaciones ilimitadas',
    ],
  },
];

export default function MembershipScreen() {
  const router = useRouter();
  const [selected, setSelected] = useState<'basic' | 'premium'>('basic');
  const [isLoading, setIsLoading] = useState(false);

  const handlePay = async (plan: typeof MEMBERSHIPS[0]) => {
    setIsLoading(true);
    try {
      const baseUrl = process.env.EXPO_PUBLIC_BACKEND_URL || '';
      const result = await paymentService.createMembershipCheckout(
        plan.id,
        `${baseUrl}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
        `${baseUrl}/payment-cancel`,
      );

      // Open Stripe Checkout in browser
      const canOpen = await Linking.canOpenURL(result.checkout_url);
      if (canOpen) {
        await Linking.openURL(result.checkout_url);
        Alert.alert(
          'Pago Iniciado',
          'Complete el pago en su navegador. La membresía se activará automáticamente.',
          [{ text: 'OK', onPress: () => router.back() }]
        );
      } else {
        Alert.alert('Error', 'No se pudo abrir el navegador');
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'No se pudo iniciar el pago');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Membresías</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.heroSection}>
          <Ionicons name="rocket" size={64} color={Colors.accent} />
          <Text style={styles.heroTitle}>Elige tu Plan</Text>
          <Text style={styles.heroSubtitle}>
            Primer mes GRATIS al registrarte como técnico
          </Text>
        </View>

        {MEMBERSHIPS.map((plan) => (
          <TouchableOpacity
            key={plan.id}
            style={[
              styles.planCard,
              selected === plan.id && { borderColor: plan.color, borderWidth: 2 },
            ]}
            onPress={() => setSelected(plan.id)}
          >
            {plan.isPremium && (
              <View style={[styles.popularBadge, { backgroundColor: plan.color }]}>
                <Ionicons name="star" size={12} color="#FFF" />
                <Text style={styles.popularText}>RECOMENDADO</Text>
              </View>
            )}

            <View style={styles.planHeader}>
              <Text style={[styles.planName, { color: plan.color }]}>{plan.name}</Text>
              <View style={styles.priceRow}>
                <Text style={styles.currency}>$</Text>
                <Text style={styles.price}>{plan.price.toLocaleString()}</Text>
                <Text style={styles.period}>/mes</Text>
              </View>
            </View>

            <View style={styles.featuresList}>
              {plan.features.map((feature, idx) => (
                <View key={idx} style={styles.featureRow}>
                  <Ionicons name="checkmark-circle" size={20} color={plan.color} />
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.payButton, { backgroundColor: plan.color }, isLoading && { opacity: 0.6 }]}
              onPress={() => handlePay(plan)}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.payButtonText}>
                  Pagar con Stripe - ${plan.price.toLocaleString()}
                </Text>
              )}
            </TouchableOpacity>
          </TouchableOpacity>
        ))}

        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={20} color={Colors.info} />
          <View style={{ flex: 1, marginLeft: 8 }}>
            <Text style={styles.infoTitle}>¿Cómo funciona?</Text>
            <Text style={styles.infoText}>
              • El primer mes es completamente gratis{'\n'}
              • A partir del 2do mes, se cobra mensualmente{'\n'}
              • Si no pagas, tu cuenta se bloquea hasta regularizar{'\n'}
              • Puedes cancelar en cualquier momento
            </Text>
          </View>
        </View>

        <View style={styles.commissionBox}>
          <Text style={styles.commissionTitle}>💰 Comisión por Servicio</Text>
          <Text style={styles.commissionText}>
            Además de la membresía, la plataforma retiene 15% de comisión por cada visita confirmada. Recibes el 85% restante de forma semanal.
          </Text>
        </View>

        <View style={styles.securityBox}>
          <Ionicons name="shield-checkmark" size={20} color={Colors.success} />
          <Text style={styles.securityText}>
            Pagos seguros procesados por Stripe. Aceptamos tarjetas Visa, Mastercard y más.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Membresías</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.heroSection}>
          <Ionicons name="rocket" size={64} color={Colors.accent} />
          <Text style={styles.heroTitle}>Elige tu Plan</Text>
          <Text style={styles.heroSubtitle}>
            Primer mes GRATIS al registrarte como técnico
          </Text>
        </View>

        {MEMBERSHIPS.map((plan) => (
          <TouchableOpacity
            key={plan.id}
            style={[
              styles.planCard,
              selected === plan.id && { borderColor: plan.color, borderWidth: 2 },
            ]}
            onPress={() => setSelected(plan.id)}
          >
            {plan.isPremium && (
              <View style={[styles.popularBadge, { backgroundColor: plan.color }]}>
                <Ionicons name="star" size={12} color="#FFF" />
                <Text style={styles.popularText}>RECOMENDADO</Text>
              </View>
            )}

            <View style={styles.planHeader}>
              <Text style={[styles.planName, { color: plan.color }]}>
                {plan.name}
              </Text>
              <View style={styles.priceRow}>
                <Text style={styles.currency}>$</Text>
                <Text style={styles.price}>{plan.price.toLocaleString()}</Text>
                <Text style={styles.period}>/mes</Text>
              </View>
            </View>

            <View style={styles.featuresList}>
              {plan.features.map((feature, idx) => (
                <View key={idx} style={styles.featureRow}>
                  <Ionicons name="checkmark-circle" size={20} color={plan.color} />
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.payButton, { backgroundColor: plan.color }]}
              onPress={() => handlePay(plan)}
            >
              <Text style={styles.payButtonText}>
                Seleccionar {plan.name}
              </Text>
            </TouchableOpacity>
          </TouchableOpacity>
        ))}

        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={20} color={Colors.info} />
          <View style={{ flex: 1, marginLeft: 8 }}>
            <Text style={styles.infoTitle}>¿Cómo funciona?</Text>
            <Text style={styles.infoText}>
              • El primer mes es completamente gratis{'\n'}
              • A partir del 2do mes, se cobra mensualmente{'\n'}
              • Si no pagas, tu cuenta se bloquea hasta regularizar{'\n'}
              • Puedes cancelar en cualquier momento
            </Text>
          </View>
        </View>

        <View style={styles.commissionBox}>
          <Text style={styles.commissionTitle}>💰 Comisión por Servicio</Text>
          <Text style={styles.commissionText}>
            Además de la membresía, la plataforma retiene 15% de comisión por cada visita confirmada. Recibes el 85% restante de forma semanal.
          </Text>
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
  heroSection: { alignItems: 'center', paddingVertical: 24 },
  heroTitle: { fontSize: 28, fontWeight: 'bold', color: Colors.text, marginTop: 12 },
  heroSubtitle: { fontSize: 14, color: Colors.textSecondary, marginTop: 8, textAlign: 'center' },
  planCard: { backgroundColor: Colors.card, borderRadius: 16, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: Colors.border, position: 'relative' },
  popularBadge: { position: 'absolute', top: -10, right: 16, flexDirection: 'row', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, alignItems: 'center' },
  popularText: { fontSize: 10, color: '#FFF', fontWeight: 'bold', marginLeft: 4 },
  planHeader: { marginBottom: 16 },
  planName: { fontSize: 24, fontWeight: 'bold' },
  priceRow: { flexDirection: 'row', alignItems: 'flex-end', marginTop: 8 },
  currency: { fontSize: 18, color: Colors.text, fontWeight: 'bold' },
  price: { fontSize: 36, color: Colors.text, fontWeight: 'bold', marginHorizontal: 2 },
  period: { fontSize: 14, color: Colors.textSecondary, marginBottom: 6 },
  featuresList: { marginBottom: 16 },
  featureRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6 },
  featureText: { fontSize: 14, color: Colors.text, marginLeft: 8, flex: 1 },
  payButton: { paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  payButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  infoBox: { flexDirection: 'row', backgroundColor: Colors.primaryLight, padding: 12, borderRadius: 8, marginTop: 16 },
  infoTitle: { fontSize: 14, fontWeight: 'bold', color: Colors.text, marginBottom: 4 },
  infoText: { fontSize: 13, color: Colors.text, lineHeight: 18 },
  commissionBox: { backgroundColor: '#FFF5E6', padding: 16, borderRadius: 8, marginTop: 16, borderWidth: 1, borderColor: Colors.accent },
  commissionTitle: { fontSize: 14, fontWeight: 'bold', color: Colors.text, marginBottom: 8 },
  commissionText: { fontSize: 13, color: Colors.text, lineHeight: 18 },
  securityBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E8F5E9', padding: 12, borderRadius: 8, marginTop: 16 },
  securityText: { flex: 1, fontSize: 13, color: Colors.text, marginLeft: 8 },
});
