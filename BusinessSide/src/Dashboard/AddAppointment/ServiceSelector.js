// src/Dashboard/AddAppointment/ServiceSelector.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert
} from 'react-native';
import { ScaledSheet } from 'react-native-size-matters';
import { FontAwesome5 } from '@expo/vector-icons';
import ApiService from '../Service/ApiService';

const ServiceSelector = ({ selectedService, onServiceSelect, theme }) => {
  const [services, setServices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    setIsLoading(true);
    try {
      const businessData = await ApiService.getBusinessData();
      const businessId = businessData?.businessId || businessData?.business?.id;
      
      if (businessId) {
        const businessServices = await ApiService.getBusinessServices(businessId);
        setServices(businessServices);
      } else {
        Alert.alert('Error', 'Business information not found');
      }
    } catch (error) {
      console.error('Error loading services:', error);
      Alert.alert('Error', 'Failed to load services');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
          Loading services...
        </Text>
      </View>
    );
  }

  if (services.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <FontAwesome5 name="cut" size={40} color={theme.textLight} />
        <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
          No services available
        </Text>
        <Text style={[styles.emptySubtext, { color: theme.textLight }]}>
          Add services in your business settings
        </Text>
      </View>
    );
  }

  return (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.servicesContainer}
    >
      {services.map(service => (
        <TouchableOpacity
          key={service._id || service.id}
          style={[
            styles.serviceCard,
            { 
              backgroundColor: theme.background,
              borderColor: selectedService && (selectedService.id === (service._id || service.id) || selectedService._id === (service._id || service.id))
                ? theme.primary 
                : theme.border 
            }
          ]}
          onPress={() => onServiceSelect({ ...service, id: service._id || service.id })}
        >
          <View style={[
            styles.serviceIconContainer,
            { 
              backgroundColor: selectedService && (selectedService.id === (service._id || service.id) || selectedService._id === (service._id || service.id))
                ? theme.primaryBackground 
                : theme.backgroundGray 
            }
          ]}>
            <FontAwesome5
              name="cut"
              size={22}
              color={selectedService && (selectedService.id === (service._id || service.id) || selectedService._id === (service._id || service.id))
                ? theme.primary 
                : theme.textLight}
            />
          </View>
          
          <Text style={[
            styles.serviceName,
            { color: theme.textPrimary }
          ]} numberOfLines={2}>
            {service.name}
          </Text>
          
          {service.price && (
            <Text style={[styles.servicePrice, { color: theme.textSecondary }]}>
              ${service.price}
            </Text>
          )}
          
          <Text style={[styles.serviceDuration, { color: theme.textLight }]}>
            {service.durationMinutes || service.duration || 60} min
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

const styles = ScaledSheet.create({
  loadingContainer: {
    alignItems: 'center',
    padding: '40@s',
  },
  loadingText: {
    marginTop: '15@s',
    fontSize: '16@s',
    fontFamily: 'Inter-Regular',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: '40@s',
  },
  emptyText: {
    fontSize: '18@s',
    fontFamily: 'Inter-SemiBold',
    marginTop: '15@s',
  },
  emptySubtext: {
    fontSize: '14@s',
    fontFamily: 'Inter-Regular',
    marginTop: '8@s',
    textAlign: 'center',
  },
  servicesContainer: {
    paddingVertical: '8@s',
  },
  serviceCard: {
    width: '140@s',
    borderRadius: '16@s',
    padding: '14@s',
    marginRight: '12@s',
    alignItems: 'center',
    borderWidth: 2,
    shadowOffset: { width: 0, height: '3@s' },
    shadowOpacity: 0.1,
    shadowRadius: '6@s',
    elevation: 2,
  },
  serviceIconContainer: {
    width: '50@s',
    height: '50@s',
    borderRadius: '25@s',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: '10@s',
  },
  serviceName: {
    fontSize: '14@s',
    fontFamily: 'Poppins-SemiBold',
    textAlign: 'center',
    marginBottom: '8@s',
    minHeight: '32@s',
  },
  servicePrice: {
    fontSize: '16@s',
    fontFamily: 'Poppins-Bold',
    marginBottom: '4@s',
  },
  serviceDuration: {
    fontSize: '12@s',
    fontFamily: 'Poppins-Regular',
  },
});

export default ServiceSelector;