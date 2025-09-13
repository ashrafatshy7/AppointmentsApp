// src/Dashboard/CalendarView/DayView.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator
} from 'react-native';
import { ScaledSheet } from 'react-native-size-matters';
import { FontAwesome5 } from '@expo/vector-icons';
import { useTheme } from '../../Context/ThemeContext';

const DayView = ({ date, appointments, onAppointmentPress, isLoading }) => {
  const { theme } = useTheme();
  const [timeSlots, setTimeSlots] = useState([]);
  const [dayAppointments, setDayAppointments] = useState({});

  // Generate time slots from 8am to 8pm
  useEffect(() => {
    const slots = [];
    for (let hour = 8; hour <= 20; hour++) {
      slots.push(`${hour}:00`);
      slots.push(`${hour}:30`);
    }
    setTimeSlots(slots);
  }, []);

  // Organize appointments by time
  useEffect(() => {
    const appointmentsByTime = {};
    if (appointments && appointments.length > 0) {
      appointments.forEach(appointment => {
        const appointmentDate = new Date(appointment.dateTime);
        const hours = appointmentDate.getHours();
        const minutes = appointmentDate.getMinutes();
        const timeKey = `${hours}:${minutes >= 30 ? '30' : '00'}`;
        
        if (!appointmentsByTime[timeKey]) {
          appointmentsByTime[timeKey] = [];
        }
        
        appointmentsByTime[timeKey].push(appointment);
      });
    }
    setDayAppointments(appointmentsByTime);
  }, [appointments]);

  // Format time slot for display
  const formatTimeSlot = (timeSlot) => {
    const [hours, minutes] = timeSlot.split(':');
    const date = new Date();
    date.setHours(parseInt(hours, 10));
    date.setMinutes(parseInt(minutes, 10));
    
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  // Check if current time slot is now
  const isCurrentTime = (timeSlot) => {
    const now = new Date();
    const [slotHours, slotMinutes] = timeSlot.split(':').map(Number);
    return now.getHours() === slotHours && 
           (now.getMinutes() >= slotMinutes && now.getMinutes() < slotMinutes + 30);
  };

  // Render appointment in time slot
  const renderAppointment = (appointment) => (
    <TouchableOpacity
      key={appointment.id}
      style={[
        styles.appointment,
        { 
          backgroundColor: 
            appointment.status === 'booked' ? theme.primaryBackground : 
            appointment.status === 'completed' ? '#E6F9F0' :
            appointment.status === 'canceled' ? '#FEEEEE' : '#FEF3D7',
          borderLeftColor:
            appointment.status === 'booked' ? theme.primary : 
            appointment.status === 'completed' ? theme.success :
            appointment.status === 'canceled' ? theme.danger : theme.warning,
        }
      ]}
      onPress={() => onAppointmentPress(appointment)}
    >
      <Text style={[styles.appointmentCustomer, { color: theme.textPrimary }]} numberOfLines={1}>
        {appointment.customerName}
      </Text>
      <Text style={[styles.appointmentService, { color: theme.textSecondary }]} numberOfLines={1}>
        {appointment.serviceName}
      </Text>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
          Loading schedule...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {timeSlots.map(timeSlot => (
        <View 
          key={timeSlot} 
          style={[
            styles.timeSlot,
            isCurrentTime(timeSlot) && { backgroundColor: theme.backgroundLight }
          ]}
        >
          <View style={styles.timeContainer}>
            <Text style={[styles.timeText, { color: theme.textPrimary }]}>
              {formatTimeSlot(timeSlot)}
            </Text>
            {isCurrentTime(timeSlot) && (
              <View style={[styles.nowIndicator, { backgroundColor: theme.primary }]} />
            )}
          </View>
          
          <View style={styles.appointmentsContainer}>
            {dayAppointments[timeSlot] ? 
              dayAppointments[timeSlot].map(appointment => renderAppointment(appointment)) :
              <TouchableOpacity
                style={[styles.emptySlot, { borderColor: theme.border }]}
                onPress={() => {
                  const [hours, minutes] = timeSlot.split(':').map(Number);
                  const slotDate = new Date(date);
                  slotDate.setHours(hours, minutes);
                  onAppointmentPress({ dateTime: slotDate.toISOString() }, 'add');
                }}
              >
                <FontAwesome5 name="plus" size={12} color={theme.textLight} />
              </TouchableOpacity>
            }
          </View>
        </View>
      ))}
    </ScrollView>
  );
};

const styles = ScaledSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: '40@vs',
  },
  loadingText: {
    marginTop: '16@vs',
    fontSize: '16@s',
  },
  timeSlot: {
    flexDirection: 'row',
    height: '60@vs',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  timeContainer: {
    width: '60@s',
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#F0F0F0',
  },
  timeText: {
    fontSize: '12@s',
  },
  nowIndicator: {
    width: '6@s',
    height: '6@s',
    borderRadius: '3@s',
    marginTop: '4@vs',
  },
  appointmentsContainer: {
    flex: 1,
    padding: '4@s',
  },
  appointment: {
    flex: 1,
    padding: '8@s',
    borderRadius: '4@s',
    borderLeftWidth: '4@s',
    justifyContent: 'center',
  },
  appointmentCustomer: {
    fontSize: '14@s',
    fontWeight: '600',
  },
  appointmentService: {
    fontSize: '12@s',
    marginTop: '2@vs',
  },
  emptySlot: {
    flex: 1,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: '4@s',
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.5,
  },
});

export default DayView;
