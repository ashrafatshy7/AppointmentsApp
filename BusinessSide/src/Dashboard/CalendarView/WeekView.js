// src/Dashboard/CalendarView/WeekView.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Dimensions
} from 'react-native';
import { ScaledSheet } from 'react-native-size-matters';
import { useTheme } from '../../Context/ThemeContext';

const screenWidth = Dimensions.get('window').width;

const WeekView = ({ startDate, appointments, onDayPress, onAppointmentPress }) => {
  const { theme } = useTheme();
  const [weekDays, setWeekDays] = useState([]);
  const [appointmentsByDay, setAppointmentsByDay] = useState({});

  // Generate week days
  useEffect(() => {
    const days = [];
    const start = new Date(startDate);
    
    // Adjust to start on Monday
    const dayOfWeek = start.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // If Sunday, go back 6 days, else adjust to Monday
    start.setDate(start.getDate() + diff);
    
    // Generate 7 days from Monday
    for (let i = 0; i < 7; i++) {
      const day = new Date(start);
      day.setDate(day.getDate() + i);
      days.push(day);
    }
    
    setWeekDays(days);
  }, [startDate]);

  // Organize appointments by day
  useEffect(() => {
    const groupedAppointments = {};
    
    if (appointments && appointments.length > 0) {
      appointments.forEach(appointment => {
        const date = new Date(appointment.dateTime).toISOString().split('T')[0];
        
        if (!groupedAppointments[date]) {
          groupedAppointments[date] = [];
        }
        
        groupedAppointments[date].push(appointment);
      });
    }
    
    setAppointmentsByDay(groupedAppointments);
  }, [appointments]);

  // Format date as day name
  const formatDayName = (date) => {
    return date.toLocaleDateString(undefined, { weekday: 'short' });
  };

  // Format date as day number
  const formatDayNumber = (date) => {
    return date.getDate();
  };

  // Check if date is today
  const isToday = (date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  // Get count of appointments for a day
  const getAppointmentCount = (date) => {
    const dateString = date.toISOString().split('T')[0];
    return appointmentsByDay[dateString]?.length || 0;
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.daysContainer}
      >
        {weekDays.map((day, index) => {
          const dateString = day.toISOString().split('T')[0];
          const dayAppointments = appointmentsByDay[dateString] || [];
          const appointmentCount = dayAppointments.length;
          
          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.dayColumn,
                { width: screenWidth / 3.5 }
              ]}
              onPress={() => onDayPress(day)}
            >
              <View style={[
                styles.dayHeader,
                isToday(day) && { backgroundColor: theme.primary }
              ]}>
                <Text style={[
                  styles.dayName,
                  { color: isToday(day) ? theme.white : theme.textPrimary }
                ]}>
                  {formatDayName(day)}
                </Text>
                <View style={[
                  styles.dayNumberContainer,
                  isToday(day) ? { backgroundColor: theme.white } : { backgroundColor: theme.backgroundLight }
                ]}>
                  <Text style={[
                    styles.dayNumber,
                    { color: isToday(day) ? theme.primary : theme.textPrimary }
                  ]}>
                    {formatDayNumber(day)}
                  </Text>
                </View>
              </View>
              
              <View style={styles.appointmentsContainer}>
                {appointmentCount > 0 ? (
                  dayAppointments.slice(0, 3).map((appointment, idx) => (
                    <TouchableOpacity
                      key={appointment.id}
                      style={[
                        styles.appointmentItem,
                        { 
                          backgroundColor: 
                            appointment.status === 'booked' ? theme.primaryBackground : 
                            appointment.status === 'completed' ? '#E6F9F0' :
                            appointment.status === 'canceled' ? '#FEEEEE' : '#FEF3D7'
                        }
                      ]}
                      onPress={() => onAppointmentPress(appointment)}
                    >
                      <Text style={[styles.appointmentTime, { color: theme.textSecondary }]}>
                        {new Date(appointment.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                      </Text>
                      <Text style={[styles.appointmentName, { color: theme.textPrimary }]} numberOfLines={1}>
                        {appointment.customerName}
                      </Text>
                    </TouchableOpacity>
                  ))
                ) : (
                  <View style={styles.emptyDay}>
                    <Text style={[styles.emptyDayText, { color: theme.textLight }]}>
                      No appointments
                    </Text>
                  </View>
                )}
                
                {appointmentCount > 3 && (
                  <TouchableOpacity
                    style={[styles.moreButton, { backgroundColor: theme.backgroundLight }]}
                    onPress={() => onDayPress(day)}
                  >
                    <Text style={[styles.moreButtonText, { color: theme.textSecondary }]}>
                      +{appointmentCount - 3} more
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = ScaledSheet.create({
  container: {
    flex: 1,
  },
  daysContainer: {
    paddingHorizontal: '8@s',
  },
  dayColumn: {
    marginHorizontal: '4@s',
    borderRadius: '12@s',
    overflow: 'hidden',
    backgroundColor: 'white',
    shadowOffset: { width: 0, height: '2@s' },
    shadowOpacity: 0.1,
    shadowRadius: '4@s',
    elevation: 2,
    height: '220@vs',
  },
  dayHeader: {
    padding: '8@s',
    alignItems: 'center',
  },
  dayName: {
    fontSize: '14@s',
    fontWeight: '500',
    marginBottom: '4@vs',
  },
  dayNumberContainer: {
    width: '24@s',
    height: '24@s',
    borderRadius: '12@s',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: '2@vs',
  },
  dayNumber: {
    fontSize: '14@s',
    fontWeight: 'bold',
  },
  appointmentsContainer: {
    flex: 1,
    padding: '8@s',
  },
  appointmentItem: {
    padding: '6@s',
    borderRadius: '6@s',
    marginBottom: '6@vs',
  },
  appointmentTime: {
    fontSize: '12@s',
    marginBottom: '2@vs',
  },
  appointmentName: {
    fontSize: '12@s',
    fontWeight: '500',
  },
  emptyDay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyDayText: {
    fontSize: '12@s',
  },
  moreButton: {
    alignSelf: 'center',
    paddingHorizontal: '8@s',
    paddingVertical: '4@vs',
    borderRadius: '12@s',
    marginTop: '4@vs',
  },
  moreButtonText: {
    fontSize: '12@s',
    fontWeight: '500',
  },
});

export default WeekView;
