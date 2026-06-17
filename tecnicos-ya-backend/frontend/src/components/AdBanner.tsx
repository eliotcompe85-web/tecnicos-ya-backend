import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/src/constants/colors';

/**
 * Banner publicitario placeholder
 * En producción se reemplaza con Google AdMob:
 * import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';
 * 
 * Para activar AdMob real:
 * 1. Crear cuenta en https://admob.google.com
 * 2. yarn expo install react-native-google-mobile-ads
 * 3. Configurar app.json con tu AdMob App ID
 * 4. Reemplazar este componente con <BannerAd unitId={adUnitId} size={BannerAdSize.BANNER} />
 */
export function AdBanner() {
  return (
    <TouchableOpacity
      style={styles.banner}
      onPress={() => Linking.openURL('https://admob.google.com')}
      activeOpacity={0.8}
    >
      <View style={styles.adContent}>
        <View style={styles.adIcon}>
          <Ionicons name="megaphone" size={20} color={Colors.primary} />
        </View>
        <View style={styles.adText}>
          <Text style={styles.adTitle}>Publicidad</Text>
          <Text style={styles.adSubtitle}>Espacio reservado para AdMob</Text>
        </View>
        <Text style={styles.adLabel}>Ad</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  banner: {
    height: 60,
    backgroundColor: '#F5F5F5',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  adContent: { flexDirection: 'row', alignItems: 'center' },
  adIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  adText: { flex: 1 },
  adTitle: { fontSize: 13, fontWeight: 'bold', color: Colors.text },
  adSubtitle: { fontSize: 11, color: Colors.textSecondary },
  adLabel: {
    fontSize: 10,
    color: Colors.textSecondary,
    backgroundColor: Colors.surface,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
});
