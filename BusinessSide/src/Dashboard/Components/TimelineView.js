// src/Dashboard/Components/TimelineView.js
import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { ScaledSheet } from 'react-native-size-matters';
import { FontAwesome5 } from '@expo/vector-icons';
import { useTheme } from '../../Context/ThemeContext';
import StatusBadge from '../AppointmentDetails/StatusBadge';

const TimelineView = ({ 
  selectedDate = new Date(), 
  appointments = [], 
  onAppointmentPress,
  onTimeSlotPress,
  businessHours = { start: '09:00', end: '17:00' },
  showEmptySlots = true 
}) => {
  const { theme } = useTheme();

  // Generate time slots for the day
  const generateTimeSlots = () => {
    const slots = [];
    const startHour = parseInt(businessHours.start.split(':')[0]);
    const endHour = parseInt(businessHours.end.split(':')[0]);
    
    for (let hour = startHour; hour <= endHour; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
      if (hour < endHour) {
        slots.push(`${hour.toString().padStart(2, '0')}:30`);
      }
    }
    
    return slots;
  };

  const timeSlots = generateTimeSlots();
  const selectedDateString = selectedDate.toISOString().split('T')[0];
  
  // Filter appointments for the selected date
  const dayAppointments = appointments.filter(
    appointment => appointment.date === selectedDateString
  );

  // Get appointments for a specific time slot
  const getAppointmentsForSlot = (timeSlot) => {
    return dayAppointments.filter(appointment => {
      const appointmentTime = appointment.time;
      const appointmentHour = parseInt(appointmentTime.split(':')[0]);
      const appointmentMinute = parseInt(appointmentTime.split(':')[1]);
      
      const slotHour = parseInt(timeSlot.split(':')[0]);
      const slotMinute = parseInt(timeSlot.split(':')[1]);
      
      // Check if appointment falls within this 30-minute slot
      const appointmentTotalMinutes = appointmentHour * 60 + appointmentMinute;
      const slotTotalMinutes = slotHour * 60 + slotMinute;
      
      return appointmentTotalMinutes >= slotTotalMinutes && 
             appointmentTotalMinutes < slotTotalMinutes + 30;
    });
  };

  const formatTime = (timeString) => {
    const [hours, minutes] = timeString.split(':');
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const isCurrentTime = (timeSlot) => {
    const now = new Date();
    const currentDate = now.toISOString().split('T')[0];
    
    if (currentDate !== selectedDateString) return false;
    
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTotalMinutes = currentHour * 60 + currentMinute;
    
    const slotHour = parseInt(timeSlot.split(':')[0]);
    const slotMinute = parseInt(timeSlot.split(':')[1]);
    const slotTotalMinutes = slotHour * 60 + slotMinute;
    
    return currentTotalMinutes >= slotTotalMinutes && 
           currentTotalMinutes < slotTotalMinutes + 30;
  };

  const renderAppointment = (appointment) => (
    <TouchableOpacity
      key={appointment._id}
      style={[styles.appointmentCard, { backgroundColor: theme.background }]}
      onPress={() => onAppointmentPress?.(appointment)}
      activeOpacity={0.7}
    >
      <View style={styles.appointmentHeader}>
        <View style={styles.appointmentInfo}>
          <Text style={[styles.customerName, { color: theme.textPrimary }]}>
            {appointment.user?.name || 'Unknown Customer'}
          </Text>
          <Text style={[styles.serviceName, { color: theme.textSecondary }]}>
            {appointment.service?.name || 'Unknown Service'}
          </Text>
        </View>
        <StatusBadge status={appointment.status} />
      </View>
      
      <View style={styles.appointmentDetails}>
        <Text style={[styles.appointmentTime, { color: theme.textSecondary }]}>
          {formatTime(appointment.time)} 
          {appointment.durationMinutes && ` (${appointment.durationMinutes}min)`}
        </Text>
      </View>
      
      {appointment.notes && (
        <Text style={[styles.appointmentNotes, { color: theme.textLight }]} numberOfLines={2}>
          {appointment.notes}
        </Text>
      )}
    </TouchableOpacity>
  );

  const renderTimeSlot = (timeSlot) => {
    const slotAppointments = getAppointmentsForSlot(timeSlot);
    const isCurrent = isCurrentTime(timeSlot);
    const isEmpty = slotAppointments.length === 0;

    return (
      <View key={timeSlot} style={styles.timeSlotContainer}>
        {/* Time label */}
        <View style={[
          styles.timeLabel,
          isCurrent && [styles.currentTimeLabel, { backgroundColor: theme.primaryBackground }]
        ]}>
          <Text style={[
            styles.timeLabelText,
            { color: isCurrent ? theme.primary : theme.textSecondary }
          ]}>
            {formatTime(timeSlot)}
          </Text>
          {isCurrent && (
            <View style={[styles.currentTimeDot, { backgroundColor: theme.primary }]} />
          )}
        </View>

        {/* Appointment content */}
        <View style={styles.slotContent}>
          {slotAppointments.length > 0 ? (
            slotAppointments.map((appointment) => renderAppointment(appointment))
          ) : showEmptySlots ? (
            <TouchableOpacity
              style={[styles.emptySlot, { borderColor: theme.borderColor }]}
              onPress={() => onTimeSlotPress?.(timeSlot)}
              activeOpacity={0.5}
            >
              <Text style={[styles.emptySlotText, { color: theme.textLight }]}>
                Available
              </Text>
              <FontAwesome5 name="plus" size={12} color={theme.textLight} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.surface }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.dateTitle, { color: theme.textPrimary }]}>
          {formatDate(selectedDate)}
        </Text>
        <Text style={[styles.appointmentCount, { color: theme.textSecondary }]}>
          {dayAppointments.length} appointment{dayAppointments.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {/* Timeline */}
      <ScrollView 
        style={styles.timeline}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.timelineContent}
      >
        {timeSlots.map((timeSlot) => renderTimeSlot(timeSlot))}
        
        {/* End of day indicator */}
        <View style={styles.endOfDay}>
          <Text style={[styles.endOfDayText, { color: theme.textLight }]}>
            End of business hours
          </Text>
        </View>
      </ScrollView>

      {/* Summary */}
      {dayAppointments.length > 0 && (
        <View style={[styles.summary, { backgroundColor: theme.backgroundGray }]}>
          <Text style={[styles.summaryText, { color: theme.textSecondary }]}>
            {dayAppointments.filter(apt => apt.status === 'booked').length} booked • {' '}
            {dayAppointments.filter(apt => apt.status === 'completed').length} completed • {' '}
            {dayAppointments.filter(apt => apt.status === 'canceled').length} canceled
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = ScaledSheet.create({
  container: {
    flex: 1,
    borderRadius: '12@s',
    overflow: 'hidden',
  },
  header: {
    padding: '16@s',
    alignItems: 'center',
  },
  dateTitle: {
    fontSize: '18@s',
    fontFamily: 'Poppins-SemiBold',
    marginBottom: '4@s',
  },
  appointmentCount: {
    fontSize: '14@s',
    fontFamily: 'Inter-Regular',
  },
  timeline: {
    flex: 1,
  },
  timelineContent: {
    paddingHorizontal: '16@s',
    paddingBottom: '16@vs',
  },
  timeSlotContainer: {
    flexDirection: 'row',
    marginBottom: '8@s',
    minHeight: '60@s',
  },
  timeLabel: {
    width: '70@s',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: '8@s',
    paddingRight: '12@s',
    position: 'relative',
  },
  currentTimeLabel: {
    borderRadius: '8@s',
    paddingHorizontal: '8@s',
    paddingVertical: '4@s',
  },
  timeLabelText: {
    fontSize: '12@s',
    fontFamily: 'Inter-Medium',
  },
  currentTimeDot: {
    position: 'absolute',
    right: '6@s',
    top: '12@s',
    width: '6@s',
    height: '6@s',
    borderRadius: '3@s',
  },
  slotContent: {
    flex: 1,
    paddingLeft: '12@s',
    minHeight: '50@s',
  },
  appointmentCard: {
    padding: '12@s',
    borderRadius: '8@s',
    marginBottom: '4@s',
    borderLeftWidth: '3@s',
    borderLeftColor: '#007AFF',
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '8@s',
  },
  appointmentInfo: {
    flex: 1,
    marginRight: '8@s',
  },
  customerName: {
    fontSize: '14@s',
    fontFamily: 'Inter-SemiBold',
    marginBottom: '2@s',
  },
  serviceName: {
    fontSize: '13@s',
    fontFamily: 'Inter-Regular',
  },
  appointmentDetails: {
    marginBottom: '4@s',
  },
  appointmentTime: {
    fontSize: '12@s',
    fontFamily: 'Inter-Medium',
  },
  appointmentNotes: {
    fontSize: '12@s',
    fontFamily: 'Inter-Regular',
    fontStyle: 'italic',
  },
  emptySlot: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '12@s',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: '8@s',
    gap: '6@s',
    minHeight: '44@vs',
  },
  emptySlotText: {
    fontSize: '12@s',
  },
  endOfDay: {
    alignItems: 'center',
    paddingVertical: '16@vs',
    marginTop: '16@vs',
  },
  endOfDayText: {
    fontSize: '12@s',
    fontStyle: 'italic',
  },
  summary: {
    padding: '12@s',
    alignItems: 'center',
  },
  summaryText: {
    fontSize: '12@s',
  },
});

export default TimelineView;