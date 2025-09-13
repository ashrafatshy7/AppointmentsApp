// src/Dashboard/Screens/ServicesSetupScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { ScaledSheet } from 'react-native-size-matters';
import { FontAwesome5 } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useBusiness } from '../../Context/BusinessContext';
import { useTheme } from '../../Context/ThemeContext';
import Colors from '../../Constants/Colors';

const ServicesSetupScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const { businessServices, addBusinessService, updateBusinessService, deleteBusinessService, refreshServices } = useBusiness();
  
  const [modalVisible, setModalVisible] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    durationMinutes: '',
  });

  useEffect(() => {
    refreshServices();
  }, []);

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      durationMinutes: '',
    });
    setEditingService(null);
  };

  const openAddModal = () => {
    resetForm();
    setModalVisible(true);
  };

  const openEditModal = (service) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      description: service.description || '',
      price: service.price ? service.price.replace('$', '') : '',
      durationMinutes: service.durationMinutes?.toString() || '',
    });
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Service name is required');
      return;
    }

    if (!formData.price.trim() || isNaN(formData.price)) {
      Alert.alert('Error', 'Valid price is required');
      return;
    }

    if (!formData.durationMinutes.trim() || isNaN(formData.durationMinutes)) {
      Alert.alert('Error', 'Valid duration in minutes is required');
      return;
    }

    setLoading(true);
    try {
      const serviceData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        price: parseFloat(formData.price),
        durationMinutes: parseInt(formData.durationMinutes),
      };

      let result;
      if (editingService) {
        result = await updateBusinessService(editingService.id, serviceData);
      } else {
        result = await addBusinessService(serviceData);
      }

      if (result.success) {
        setModalVisible(false);
        resetForm();
        Alert.alert('Success', `Service ${editingService ? 'updated' : 'created'} successfully`);
      } else {
        Alert.alert('Error', result.error?.message || 'Failed to save service');
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (service) => {
    Alert.alert(
      'Delete Service',
      `Are you sure you want to delete "${service.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const result = await deleteBusinessService(service.id);
            if (result.success) {
              Alert.alert('Success', 'Service deleted successfully');
            } else {
              Alert.alert('Error', result.error?.message || 'Failed to delete service');
            }
          },
        },
      ]
    );
  };

  const ServiceItem = ({ item }) => (
    <View style={[styles.serviceItem, { backgroundColor: theme.background }]}>
      <View style={styles.serviceInfo}>
        <Text style={[styles.serviceName, { color: theme.textPrimary }]}>{item.name}</Text>
        {item.description ? (
          <Text style={[styles.serviceDescription, { color: theme.textSecondary }]}>
            {item.description}
          </Text>
        ) : null}
        <View style={styles.serviceDetails}>
          <Text style={[styles.servicePrice, { color: Colors.success }]}>{item.price}</Text>
          <Text style={[styles.serviceDuration, { color: theme.textSecondary }]}>
            {item.duration || item.durationMinutes} min
          </Text>
        </View>
      </View>
      <View style={styles.serviceActions}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: Colors.primary + '20' }]}
          onPress={() => openEditModal(item)}
        >
          <FontAwesome5 name="edit" size={16} color={Colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: Colors.danger + '20' }]}
          onPress={() => handleDelete(item)}
        >
          <FontAwesome5 name="trash" size={16} color={Colors.danger} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <FontAwesome5 name="arrow-left" size={20} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Manage Services</Text>
        <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
          <FontAwesome5 name="plus" size={20} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={businessServices}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ServiceItem item={item} />}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <FontAwesome5 name="concierge-bell" size={48} color={theme.textSecondary} />
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
              No services added yet
            </Text>
            <TouchableOpacity style={styles.emptyButton} onPress={openAddModal}>
              <Text style={styles.emptyButtonText}>Add Your First Service</Text>
            </TouchableOpacity>
          </View>
        }
      />

      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: theme.background }]}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={[styles.cancelButton, { color: Colors.danger }]}>Cancel</Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>
              {editingService ? 'Edit Service' : 'Add Service'}
            </Text>
            <TouchableOpacity onPress={handleSave} disabled={loading}>
              <Text style={[styles.saveButton, { color: Colors.primary }]}>
                {loading ? 'Saving...' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.textPrimary }]}>Service Name *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.surface, color: theme.textPrimary }]}
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                placeholder="Enter service name"
                placeholderTextColor={theme.textSecondary}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.textPrimary }]}>Description</Text>
              <TextInput
                style={[styles.textArea, { backgroundColor: theme.surface, color: theme.textPrimary }]}
                value={formData.description}
                onChangeText={(text) => setFormData({ ...formData, description: text })}
                placeholder="Enter service description"
                placeholderTextColor={theme.textSecondary}
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.inputRow}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={[styles.inputLabel, { color: theme.textPrimary }]}>Price ($) *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.surface, color: theme.textPrimary }]}
                  value={formData.price}
                  onChangeText={(text) => setFormData({ ...formData, price: text })}
                  placeholder="0.00"
                  placeholderTextColor={theme.textSecondary}
                  keyboardType="numeric"
                />
              </View>

              <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={[styles.inputLabel, { color: theme.textPrimary }]}>Duration (min) *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.surface, color: theme.textPrimary }]}
                  value={formData.durationMinutes}
                  onChangeText={(text) => setFormData({ ...formData, durationMinutes: text })}
                  placeholder="60"
                  placeholderTextColor={theme.textSecondary}
                  keyboardType="numeric"
                />
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = ScaledSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: '20@s',
    paddingVertical: '16@s',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: '18@s',
    fontFamily: 'Poppins-SemiBold',
  },
  addButton: {
    padding: '8@s',
  },
  listContainer: {
    padding: '16@s',
  },
  serviceItem: {
    flexDirection: 'row',
    padding: '16@s',
    marginBottom: '12@vs',
    borderRadius: '12@s',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: '16@s',
    fontWeight: 'bold',
    marginBottom: '4@vs',
  },
  serviceDescription: {
    fontSize: '14@s',
    marginBottom: '8@vs',
  },
  serviceDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  servicePrice: {
    fontSize: '16@s',
    fontFamily: 'Inter-Bold',
    marginRight: '16@s',
  },
  serviceDuration: {
    fontSize: '14@s',
    fontFamily: 'Inter-Regular',
  },
  serviceActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: '8@s',
    borderRadius: '8@s',
    marginLeft: '8@s',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: '80@s',
  },
  emptyText: {
    fontSize: '16@s',
    fontFamily: 'Inter-Medium',
    marginTop: '16@s',
    marginBottom: '24@s',
  },
  emptyButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: '24@s',
    paddingVertical: '12@vs',
    borderRadius: '8@s',
  },
  emptyButtonText: {
    color: 'white',
    fontSize: '16@s',
    fontFamily: 'Inter-Bold',
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: '20@s',
    paddingVertical: '16@s',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: '18@s',
    fontFamily: 'Poppins-SemiBold',
  },
  cancelButton: {
    fontSize: '16@s',
  },
  saveButton: {
    fontSize: '16@s',
    fontFamily: 'Inter-Bold',
  },
  modalContent: {
    flex: 1,
    padding: '20@s',
  },
  inputGroup: {
    marginBottom: '20@s',
  },
  inputLabel: {
    fontSize: '16@s',
    fontFamily: 'Inter-Medium',
    marginBottom: '8@s',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: '8@s',
    paddingHorizontal: '16@s',
    paddingVertical: '12@vs',
    fontSize: '16@s',
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: '8@s',
    paddingHorizontal: '16@s',
    paddingVertical: '12@s',
    fontSize: '16@s',
    minHeight: '80@s',
    textAlignVertical: 'top',
  },
  inputRow: {
    flexDirection: 'row',
  },
});

export default ServicesSetupScreen;