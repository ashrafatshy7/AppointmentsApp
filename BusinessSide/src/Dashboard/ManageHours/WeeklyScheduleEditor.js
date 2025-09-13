// src/Dashboard/Components/WeeklyScheduleEditor.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator
} from 'react-native';
import { ScaledSheet } from 'react-native-size-matters';
import { FontAwesome5 } from '@expo/vector-icons';
import DayScheduleEditor from './DayScheduleEditor';

const WeeklyScheduleEditor = ({ workingHours, onUpdate, isSaving, theme }) => {
  const [editedHours, setEditedHours] = useState({});
  const [hasChanges, setHasChanges] = useState(false);

  const daysOfWeek = [
    { key: 'sun', label: 'Sunday' },
    { key: 'mon', label: 'Monday' },
    { key: 'tue', label: 'Tuesday' },
    { key: 'wed', label: 'Wednesday' },
    { key: 'thu', label: 'Thursday' },
    { key: 'fri', label: 'Friday' },
    { key: 'sat', label: 'Saturday' },
  ];

  useEffect(() => {
    setEditedHours(workingHours || {});
  }, [workingHours]);

  const handleDayUpdate = (dayKey, daySchedule) => {
    const newHours = { ...editedHours, [dayKey]: daySchedule };
    setEditedHours(newHours);
    setHasChanges(true);
  };

  const handleSave = () => {
    if (!hasChanges) {
      Alert.alert('No Changes', 'No changes have been made to save.');
      return;
    }

    Alert.alert(
      'Save Changes',
      'Are you sure you want to update the working hours?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Save',
          onPress: async () => {
            await onUpdate(editedHours);
            setHasChanges(false);
          }
        }
      ]
    );
  };

  const handleReset = () => {
    Alert.alert(
      'Reset Changes',
      'Are you sure you want to discard all changes?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          onPress: () => {
            setEditedHours(workingHours || {});
            setHasChanges(false);
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.instructionsContainer}>
          <FontAwesome5 name="info-circle" size={16} color={theme.info} style={styles.infoIcon} />
          <Text style={[styles.instructionsText, { color: theme.textSecondary }]}>
            Set your regular weekly working hours. You can add breaks for each day and manage temporary closures separately.
          </Text>
        </View>

        {daysOfWeek.map((day) => (
          <DayScheduleEditor
            key={day.key}
            dayKey={day.key}
            dayLabel={day.label}
            schedule={editedHours[day.key]}
            onUpdate={(schedule) => handleDayUpdate(day.key, schedule)}
            theme={theme}
          />
        ))}

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Action Buttons */}
      {hasChanges && (
        <View style={[styles.actionContainer, { backgroundColor: theme.background, borderTopColor: theme.border }]}>
          <TouchableOpacity
            style={[styles.resetButton, { borderColor: theme.border }]}
            onPress={handleReset}
            disabled={isSaving}
          >
            <Text style={[styles.resetButtonText, { color: theme.textPrimary }]}>
              Reset
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: theme.primary }]}
            onPress={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color={theme.white} />
            ) : (
              <>
                <FontAwesome5 name="save" size={16} color={theme.white} style={styles.saveIcon} />
                <Text style={[styles.saveButtonText, { color: theme.white }]}>
                  Save Changes
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = ScaledSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  instructionsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: '16@s',
    marginBottom: '8@vs',
  },
  infoIcon: {
    marginRight: '8@s',
    marginTop: '2@vs',
  },
  instructionsText: {
    flex: 1,
    fontSize: '14@s',
    lineHeight: '20@vs',
  },
  bottomPadding: {
    height: '80@vs',
  },
  actionContainer: {
    flexDirection: 'row',
    padding: '16@s',
    borderTopWidth: 1,
  },
  resetButton: {
    flex: 1,
    height: '50@vs',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: '8@s',
    borderWidth: 1,
    marginRight: '12@s',
  },
  resetButtonText: {
    fontSize: '16@s',
    fontWeight: '600',
  },
  saveButton: {
    flex: 2,
    height: '50@vs',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: '8@s',
  },
  saveIcon: {
    marginRight: '8@s',
  },
  saveButtonText: {
    fontSize: '16@s',
    fontWeight: '600',
  },
});

export default WeeklyScheduleEditor;