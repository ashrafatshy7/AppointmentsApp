// src/Dashboard/CalendarView/MonthCalendarView.js
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { ScaledSheet } from 'react-native-size-matters';
import { FontAwesome5 } from '@expo/vector-icons';
import { useTheme } from '../../Context/ThemeContext';

const MonthCalendarView = ({ 
  appointments = [], 
  selectedDate, 
  onDateSelect, 
  onMonthChange 
}) => {
  const { theme } = useTheme();
  const [currentDate, setCurrentDate] = useState(selectedDate || new Date());
  
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  useEffect(() => {
    if (selectedDate) {
      setCurrentDate(selectedDate);
    }
  }, [selectedDate]);

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    
    // Start from Sunday of the week containing the first day
    startDate.setDate(startDate.getDate() - startDate.getDay());
    
    const days = [];
    const current = new Date(startDate);
    
    // Generate 6 weeks (42 days) to ensure full calendar grid
    for (let i = 0; i < 42; i++) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    return days;
  };

  const getAppointmentsForDate = (date) => {
    const dateString = date.toISOString().split('T')[0];
    return appointments.filter(appointment => appointment.date === dateString);
  };

  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSameMonth = (date) => {
    return date.getMonth() === currentDate.getMonth();
  };

  const isSelected = (date) => {
    return selectedDate && date.toDateString() === selectedDate.toDateString();
  };

  const handleDatePress = (date) => {
    onDateSelect?.(date);
  };

  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + direction);
    setCurrentDate(newDate);
    onMonthChange?.(newDate);
  };

  const renderDayCell = (date, index) => {
    const dayAppointments = getAppointmentsForDate(date);
    const isCurrentMonth = isSameMonth(date);
    const isTodayDate = isToday(date);
    const isSelectedDate = isSelected(date);
    
    // Appointment status counts
    const bookedCount = dayAppointments.filter(apt => apt.status === 'booked').length;
    const completedCount = dayAppointments.filter(apt => apt.status === 'completed').length;
    const canceledCount = dayAppointments.filter(apt => apt.status === 'canceled').length;

    return (
      <TouchableOpacity
        key={index}
        style={[
          styles.dayCell,
          !isCurrentMonth && styles.otherMonthDay,
          isTodayDate && [styles.todayCell, { borderColor: theme.primary }],
          isSelectedDate && [styles.selectedCell, { backgroundColor: theme.primaryBackground }]
        ]}
        onPress={() => handleDatePress(date)}
        activeOpacity={0.7}
      >
        <Text style={[
          styles.dayNumber,
          { color: isCurrentMonth ? theme.textPrimary : theme.textLight },
          isTodayDate && { color: theme.primary, fontWeight: 'bold' },
          isSelectedDate && { color: theme.primary }
        ]}>
          {date.getDate()}
        </Text>
        
        {/* Appointment indicators */}
        {dayAppointments.length > 0 && (
          <View style={styles.appointmentIndicators}>
            {bookedCount > 0 && (
              <View style={[styles.appointmentDot, { backgroundColor: theme.primary }]} />
            )}
            {completedCount > 0 && (
              <View style={[styles.appointmentDot, { backgroundColor: theme.success }]} />
            )}
            {canceledCount > 0 && (
              <View style={[styles.appointmentDot, { backgroundColor: theme.danger }]} />
            )}
            
            {/* Count indicator for many appointments */}
            {dayAppointments.length > 3 && (
              <Text style={[styles.appointmentCount, { color: theme.textSecondary }]}>
                +{dayAppointments.length - 3}
              </Text>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const days = getDaysInMonth(currentDate);

  return (
    <View style={[styles.container, { backgroundColor: theme.surface }]}>
      {/* Header with month navigation */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => navigateMonth(-1)}
        >
          <FontAwesome5 name="chevron-left" size={16} color={theme.textPrimary} />
        </TouchableOpacity>
        
        <Text style={[styles.monthTitle, { color: theme.textPrimary }]}>
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </Text>
        
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => navigateMonth(1)}
        >
          <FontAwesome5 name="chevron-right" size={16} color={theme.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Week day headers */}
      <View style={styles.weekDaysHeader}>
        {weekDays.map((day, index) => (
          <View key={index} style={styles.weekDayCell}>
            <Text style={[styles.weekDayText, { color: theme.textSecondary }]}>
              {day}
            </Text>
          </View>
        ))}
      </View>

      {/* Calendar grid */}
      <ScrollView style={styles.calendarContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.calendarGrid}>
          {days.map((day, index) => renderDayCell(day, index))}
        </View>
        
        {/* Legend */}
        <View style={styles.legend}>
          <Text style={[styles.legendTitle, { color: theme.textPrimary }]}>
            Appointment Status:
          </Text>
          <View style={styles.legendItems}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: theme.primary }]} />
              <Text style={[styles.legendText, { color: theme.textSecondary }]}>
                Booked
              </Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: theme.success }]} />
              <Text style={[styles.legendText, { color: theme.textSecondary }]}>
                Completed
              </Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: theme.danger }]} />
              <Text style={[styles.legendText, { color: theme.textSecondary }]}>
                Canceled
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: '16@s',
    paddingVertical: '16@vs',
  },
  navButton: {
    padding: '8@s',
  },
  monthTitle: {
    fontSize: '18@s',
    fontFamily: 'Poppins-SemiBold',
  },
  weekDaysHeader: {
    flexDirection: 'row',
    paddingHorizontal: '8@s',
    paddingBottom: '8@s',
  },
  weekDayCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: '8@s',
  },
  weekDayText: {
    fontSize: '12@s',
    fontFamily: 'Inter-SemiBold',
  },
  calendarContainer: {
    flex: 1,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: '8@s',
  },
  dayCell: {
    width: '14.28%', // 100% / 7 days
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: '8@s',
    paddingHorizontal: '2@s',
    position: 'relative',
  },
  otherMonthDay: {
    opacity: 0.3,
  },
  todayCell: {
    borderWidth: 2,
    borderRadius: '8@s',
  },
  selectedCell: {
    borderRadius: '8@s',
  },
  dayNumber: {
    fontSize: '14@s',
    fontFamily: 'Inter-Medium',
    marginBottom: '4@s',
  },
  appointmentIndicators: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '2@s',
    minHeight: '12@s',
  },
  appointmentDot: {
    width: '6@s',
    height: '6@s',
    borderRadius: '3@s',
  },
  appointmentCount: {
    fontSize: '8@s',
    fontFamily: 'Inter-Bold',
  },
  legend: {
    padding: '16@s',
    marginTop: '16@s',
  },
  legendTitle: {
    fontSize: '14@s',
    fontFamily: 'Inter-SemiBold',
    marginBottom: '8@s',
  },
  legendItems: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: '6@s',
  },
  legendDot: {
    width: '8@s',
    height: '8@s',
    borderRadius: '4@s',
  },
  legendText: {
    fontSize: '12@s',
    fontFamily: 'Inter-Regular',
  },
});

export default MonthCalendarView;