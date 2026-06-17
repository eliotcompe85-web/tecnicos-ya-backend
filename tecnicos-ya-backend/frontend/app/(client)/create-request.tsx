import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
  TextInput,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/src/context/AuthContext';
import { categoryService, serviceRequestService } from '@/src/services/api';
import { Colors } from '@/src/constants/colors';

type Category = { _id: string; name: string; description: string; icon: string };

const ICON_MAP: Record<string, string> = {
  flash_on: '⚡', water_drop: '💧', build: '🔧', carpenter: '🪵',
  format_paint: '🎨', ac_unit: '❄️', yard: '🌿', cleaning_services: '🧹',
  computer: '💻', key: '🔑', local_shipping: '🚛', home_repair_service: '🏗️',
};

export default function CreateRequestScreen() {
  const { user } = useAuth();
  const router = useRouter();

  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [budgetMin, setBudgetMin] = useState('');
  const [budgetMax, setBudgetMax] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingCats, setLoadingCats] = useState(true);

  useEffect(() => { loadCategories(); }, []);

  const loadCategories = async () => {
    try {
      setLoadingCats(true);
      const data = await categoryService.getAll();
      setCategories(data);
    } catch {
      Alert.alert('Error', 'No se pudieron cargar las categorías');
    } finally {
      setLoadingCats(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedCategory || !title.trim() || !description.trim() || !address.trim()) {
      Alert.alert('Campos incompletos', 'Por favor completa todos los campos obligatorios.');
      return;
    }

    try {
      setIsLoading(true);
      await serviceRequestService.create({
        category_id: selectedCategory,
        title: title.trim(),
        description: description.trim(),
        address: address.trim(),
        location: { type: 'Point', coordinates: [-70.6506, -33.4372] }, // Santiago default
        budget_min: budgetMin ? parseFloat(budgetMin) : undefined,
        budget_max: budgetMax ? parseFloat(budgetMax) : undefined,
      });
      Alert.alert('✅ Solicitud creada', 'Los técnicos disponibles podrán ver tu solicitud y postular.', [
        { text: 'Ver mis solicitudes', onPress: () => router.replace('/(client)/requests') },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error?.response?.data?.detail || 'No se pudo crear la solicitud');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nueva Solicitud</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Category picker */}
        <Text style={styles.sectionTitle}>Categoría de Servicio *</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat._id}
              style={[styles.catChip, selectedCategory === cat._id && styles.catChipActive]}
              onPress={() => setSelectedCategory(cat._id)}
            >
              <Text style={styles.catChipEmoji}>{ICON_MAP[cat.icon] || '🔧'}</Text>
              <Text style={[styles.catChipText, selectedCategory === cat._id && styles.catChipTextActive]}>
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Title */}
        <Text style={styles.label}>Título *</Text>
        <TextInput
          style={styles.input}
          placeholder="Ej: Instalar lámpara en living"
          placeholderTextColor={Colors.textSecondary}
          value={title}
          onChangeText={setTitle}
          maxLength={80}
        />

        {/* Description */}
        <Text style={styles.label}>Descripción detallada *</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Describe el problema o lo que necesitas hacer..."
          placeholderTextColor={Colors.textSecondary}
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />

        {/* Address */}
        <Text style={styles.label}>Dirección *</Text>
        <View style={styles.inputRow}>
          <Ionicons name="location" size={18} color={Colors.primary} style={styles.inputIcon} />
          <TextInput
            style={[styles.input, { flex: 1, marginBottom: 0 }]}
            placeholder="Ej: Av. Providencia 1234, Santiago"
            placeholderTextColor={Colors.textSecondary}
            value={address}
            onChangeText={setAddress}
          />
        </View>

        {/* Budget */}
        <Text style={styles.label}>Presupuesto estimado (opcional)</Text>
        <View style={styles.budgetRow}>
          <View style={styles.budgetInput}>
            <Text style={styles.budgetPrefix}>$</Text>
            <TextInput
              style={styles.budgetField}
              placeholder="Mínimo"
              placeholderTextColor={Colors.textSecondary}
              keyboardType="numeric"
              value={budgetMin}
              onChangeText={setBudgetMin}
            />
          </View>
          <Text style={styles.budgetSep}>—</Text>
          <View style={styles.budgetInput}>
            <Text style={styles.budgetPrefix}>$</Text>
            <TextInput
              style={styles.budgetField}
              placeholder="Máximo"
              placeholderTextColor={Colors.textSecondary}
              keyboardType="numeric"
              value={budgetMax}
              onChangeText={setBudgetMax}
            />
          </View>
        </View>

        {/* Info card */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={20} color={Colors.info} />
          <Text style={styles.infoText}>
            El precio final incluye tarifa base de $9.990 + $1.000 por km adicional sobre 6 km.
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.submitBtn, isLoading && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={isLoading}
        >
          <Ionicons name="send" size={20} color="white" />
          <Text style={styles.submitBtnText}>
            {isLoading ? 'Publicando...' : 'Publicar Solicitud'}
          </Text>
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
  sectionTitle: { fontSize: 15, fontWeight: '700', color: Colors.text, marginBottom: 12 },
  catScroll: { marginBottom: 24, marginHorizontal: -20, paddingHorizontal: 20 },
  catChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 10, paddingHorizontal: 16,
    backgroundColor: Colors.surface, borderRadius: 100,
    marginRight: 10, borderWidth: 1.5, borderColor: Colors.border,
  },
  catChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  catChipEmoji: { fontSize: 18 },
  catChipText: { fontSize: 14, fontWeight: '600', color: Colors.text },
  catChipTextActive: { color: 'white' },
  label: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.4 },
  input: {
    backgroundColor: Colors.surface, borderRadius: 10, padding: 14,
    fontSize: 15, color: Colors.text, borderWidth: 1, borderColor: Colors.border, marginBottom: 20,
  },
  textArea: { minHeight: 110, textAlignVertical: 'top' },
  inputRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  inputIcon: { marginRight: 8, marginBottom: 0 },
  budgetRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  budgetInput: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surface, borderRadius: 10, borderWidth: 1, borderColor: Colors.border, padding: 12,
  },
  budgetPrefix: { fontSize: 16, color: Colors.textSecondary, marginRight: 4 },
  budgetField: { flex: 1, fontSize: 15, color: Colors.text },
  budgetSep: { fontSize: 18, color: Colors.textSecondary },
  infoCard: {
    flexDirection: 'row', gap: 10, alignItems: 'flex-start',
    backgroundColor: '#E3F2FD', borderRadius: 10, padding: 14, marginBottom: 28,
  },
  infoText: { flex: 1, fontSize: 13, color: '#1565C0', lineHeight: 18 },
  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.primary, borderRadius: 12, padding: 16,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: 'white', fontSize: 17, fontWeight: '700' },
});
