import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/src/constants/colors';

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="construct" size={80} color={Colors.primary} />
        <Text style={styles.title}>Técnicos Ya</Text>
        <Text style={styles.subtitle}>
          Conectamos clientes con especialistas de confianza
        </Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.question}>¿Cómo quieres usar la app?</Text>

        <TouchableOpacity
          style={[styles.button, styles.clientButton]}
          onPress={() => router.push('/auth/register?role=client')}
        >
          <Ionicons name="person" size={40} color="#FFF" />
          <View style={styles.buttonContent}>
            <Text style={styles.buttonTitle}>Soy Cliente</Text>
            <Text style={styles.buttonText}>
              Busco un especialista para solucionar mi problema
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.technicianButton]}
          onPress={() => router.push('/auth/register?role=technician')}
        >
          <Ionicons name="hammer" size={40} color="#FFF" />
          <View style={styles.buttonContent}>
            <Text style={styles.buttonTitle}>Soy Técnico</Text>
            <Text style={styles.buttonText}>
              Quiero ofrecer mis servicios y encontrar clientes
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.loginLink}
        onPress={() => router.push('/auth/login')}
      >
        <Text style={styles.loginLinkText}>
          ¿Ya tienes cuenta? <Text style={styles.loginLinkBold}>Inicia sesión</Text>
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: 24,
  },
  header: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: 16,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
  content: {
    flex: 2,
  },
  question: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 24,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  clientButton: {
    backgroundColor: Colors.primary,
  },
  technicianButton: {
    backgroundColor: Colors.accent,
  },
  buttonContent: {
    flex: 1,
    marginLeft: 16,
  },
  buttonTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  buttonText: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  loginLink: {
    marginTop: 16,
    alignItems: 'center',
  },
  loginLinkText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  loginLinkBold: {
    fontWeight: 'bold',
    color: Colors.primary,
  },
});