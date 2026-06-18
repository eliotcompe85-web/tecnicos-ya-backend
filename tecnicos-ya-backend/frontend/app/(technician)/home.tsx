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
import { serviceRequestService } from '@/src/services/api';
import { Colors } from '@/src/constants/colors';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { AdBanner } from '@/src/components/AdBanner';
import { AvailabilityStatus } from '@/src/components/AvailabilityStatus';

type ServiceRequest = {
  _id: string;
  title: string;
  description: string;
  category_name: string;
  client_name: string;
  address: string;
  distance_km?: number;
  estimated_price?: {
    base: number;
    distance_charge: number;
    total: number;
  };
  created_at: string;
};

export default function TechnicianHomeScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [jobs, setJobs] = useState<ServiceRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [availability, setAvailability] = useState<'available' | 'scheduling' | 'unavailable'>('available');

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    try {
      setIsLoading(true);
      const data = await serviceRequestService.getAll({ status: 'open' });
      setJobs(data);
    } catch (error) {
      console.error('Error loading jobs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hola, {user?.full_name}!</Text>
          <Text style={styles.subtitle}>Trabajos disponibles cerca de ti</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={loadJobs} />
        }
      >
        <AvailabilityStatus
          currentStatus={availability}
          onStatusChange={setAvailability}
        />
        
        {jobs.length === 0 && !isLoading && (
          <View style={styles.emptyState}>
            <Ionicons name="briefcase-outline" size={64} color={Colors.disabled} />
            <Text style={styles.emptyText}>No hay trabajos disponibles</Text>
            <Text style={styles.emptySubtext}>
              Te notificaremos cuando haya nuevos trabajos
            </Text>
          </View>
        )}
        
        {jobs.map((job) => (
          <TouchableOpacity
            key={job._id}
            style={styles.jobCard}
            onPress={() => router.push(`/technician/job-detail/${job._id}`)}
          >
            <View style={styles.jobHeader}>
              <Text style={styles.jobTitle}>{job.title}</Text>
              {job.estimated_price && (
                <View style={styles.priceContainer}>
                  <Text style={styles.priceLabel}>Estimado:</Text>
                  <Text style={styles.priceValue}>
                    ${job.estimated_price.total.toLocaleString()}
                  </Text>
                </View>
              )}
            </View>
            
            <View style={styles.clientInfo}>
              <Ionicons name="person-circle-outline" size={16} color={Colors.textSecondary} />
              <Text style={styles.clientName}>{job.client_name}</Text>
            </View>
            
            <Text style={styles.categoryName}>{job.category_name}</Text>
            <Text style={styles.jobDescription} numberOfLines={2}>
              {job.description}
            </Text>
            
            <View style={styles.jobFooter}>
              <View style={styles.locationInfo}>
                <Ionicons name="location-outline" size={16} color={Colors.textSecondary} />
                <Text style={styles.locationText} numberOfLines={1}>
                  {job.address}
                </Text>
                {job.distance_km && (
                  <Text style={styles.distanceText}>({job.distance_km} km)</Text>
                )}
              </View>
              <Text style={styles.dateText}>
                {format(new Date(job.created_at), 'dd MMM', { locale: es })}
              </Text>
            </View>
            
            <TouchableOpacity
              style={styles.applyButton}
              onPress={() => router.push(`/technician/job-detail/${job._id}`)}
            >
              <Text style={styles.applyButtonText}>Ver Detalles</Text>
              <Ionicons name="arrow-forward" size={16} color="#FFF" />
            </TouchableOpacity>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <AdBanner />
      <View style={styles.brandContainer}>
        <Text style={styles.brandText}>Created by J.Conpe © 2026</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  brandContainer: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  brandText: {
    fontSize: 10,
    color: '#CCCCCC',
    fontStyle: 'italic',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  header: {
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
  scrollContent: {
    padding: 16,
    flexGrow: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  jobCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  jobTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginRight: 8,
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  priceLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  priceValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.success,
  },
  clientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  clientName: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginLeft: 4,
  },
  categoryName: {
    fontSize: 14,
    color: Colors.accent,
    fontWeight: '600',
    marginBottom: 6,
  },
  jobDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  jobFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  locationText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginLeft: 4,
    flex: 1,
  },
  distanceText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '600',
    marginLeft: 4,
  },
  dateText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  applyButton: {
    flexDirection: 'row',
    backgroundColor: Colors.accent,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
    marginRight: 8,
  },
});