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
import { serviceRequestService } from '@/src/services/api';
import { Colors } from '@/src/constants/colors';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

type ServiceRequest = {
  _id: string;
  title: string;
  description: string;
  status: string;
  category_name: string;
  created_at: string;
  address: string;
};

export default function ClientRequestsScreen() {
  const router = useRouter();
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      setIsLoading(true);
      const data = await serviceRequestService.getAll();
      setRequests(data);
    } catch (error) {
      console.error('Error loading requests:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return Colors.info;
      case 'assigned':
        return Colors.warning;
      case 'in_progress':
        return Colors.primary;
      case 'completed':
        return Colors.success;
      case 'cancelled':
        return Colors.error;
      default:
        return Colors.textSecondary;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'open':
        return 'Abierta';
      case 'assigned':
        return 'Asignada';
      case 'in_progress':
        return 'En Progreso';
      case 'completed':
        return 'Completada';
      case 'cancelled':
        return 'Cancelada';
      default:
        return status;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mis Solicitudes</Text>
        <TouchableOpacity
          style={styles.newButton}
          onPress={() => router.push('/client/new-request')}
        >
          <Ionicons name="add" size={24} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={loadRequests} />
        }
      >
        {requests.length === 0 && !isLoading && (
          <View style={styles.emptyState}>
            <Ionicons name="document-outline" size={64} color={Colors.disabled} />
            <Text style={styles.emptyText}>No tienes solicitudes aún</Text>
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => router.push('/client/new-request')}
            >
              <Text style={styles.createButtonText}>Crear Solicitud</Text>
            </TouchableOpacity>
          </View>
        )}

        {requests.map((request) => (
          <TouchableOpacity
            key={request._id}
            style={styles.requestCard}
            onPress={() => router.push(`/client/request-detail/${request._id}`)}
          >
            <View style={styles.requestHeader}>
              <Text style={styles.requestTitle}>{request.title}</Text>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: getStatusColor(request.status) },
                ]}
              >
                <Text style={styles.statusText}>
                  {getStatusText(request.status)}
                </Text>
              </View>
            </View>

            <Text style={styles.categoryName}>{request.category_name}</Text>
            <Text style={styles.requestDescription} numberOfLines={2}>
              {request.description}
            </Text>

            <View style={styles.requestFooter}>
              <View style={styles.locationInfo}>
                <Ionicons name="location-outline" size={16} color={Colors.textSecondary} />
                <Text style={styles.locationText} numberOfLines={1}>
                  {request.address}
                </Text>
              </View>
              <Text style={styles.dateText}>
                {format(new Date(request.created_at), 'dd MMM', { locale: es })}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
  },
  newButton: {
    padding: 8,
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
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: 16,
    marginBottom: 24,
  },
  createButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  requestCard: {
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
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  requestTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  categoryName: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
    marginBottom: 6,
  },
  requestDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  requestFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  },
  dateText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
});