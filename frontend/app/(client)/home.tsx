import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/src/context/AuthContext';
import { categoryService } from '@/src/services/api';
import { Colors } from '@/src/constants/colors';

type ServiceCategory = {
  _id: string;
  name: string;
  description: string;
  icon: string;
};

export default function ClientHomeScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setIsLoading(true);
      const data = await categoryService.getAll();
      setCategories(data);
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getIconName = (icon: string): any => {
    const iconMap: Record<string, any> = {
      flash: 'flash',
      water: 'water',
      hammer: 'hammer',
      build: 'build',
      construct: 'construct',
      'color-palette': 'color-palette',
      thermometer: 'thermometer',
      key: 'key',
      leaf: 'leaf',
      sparkles: 'sparkles',
      car: 'car',
      desktop: 'desktop',
    };
    return iconMap[icon] || 'construct';
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hola, {user?.full_name}!</Text>
          <Text style={styles.subtitle}>¿Qué servicio necesitas hoy?</Text>
        </View>
        <TouchableOpacity
          style={styles.newRequestButton}
          onPress={() => router.push('/client/new-request')}
        >
          <Ionicons name="add-circle" size={28} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={loadCategories} />
        }
      >
        <View style={styles.categoriesGrid}>
          {categories.map((category) => (
            <TouchableOpacity
              key={category._id}
              style={styles.categoryCard}
              onPress={() =>
                router.push(
                  `/client/search-technicians?category=${category._id}&name=${category.name}`
                )
              }
            >
              <View style={styles.iconContainer}>
                <Ionicons
                  name={getIconName(category.icon)}
                  size={40}
                  color={Colors.primary}
                />
              </View>
              <Text style={styles.categoryName}>{category.name}</Text>
              <Text style={styles.categoryDescription} numberOfLines={2}>
                {category.description}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  newRequestButton: {
    padding: 8,
  },
  scrollContent: {
    padding: 16,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryCard: {
    width: '48%',
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  categoryDescription: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
});