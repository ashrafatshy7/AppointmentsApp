// src/Dashboard/Screens/ManageHoursScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScaledSheet } from 'react-native-size-matters';
import { FontAwesome5 } from '@expo/vector-icons';
import { useTheme } from '../../Context/ThemeContext';
import ApiService from '../Service/ApiService';
import WeeklyScheduleEditor from './WeeklyScheduleEditor';
import TemporaryClosuresTab from './TemporaryClosuresTab';
import TemporaryBreaksTab from './TemporaryBreaksTab';

const ManageHoursScreen = ({ navigation, route }) => {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState('weekly');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [businessId, setBusinessId] = useState(null);
  const [scheduleData, setScheduleData] = useState({
    workingHours: {},
    temporaryClosures: [],
    temporaryBreaks: []
  });

  useEffect(() => {
    loadBusinessData();
  }, []);

  const loadBusinessData = async () => {
    try {
      setIsLoading(true);
      const businessData = await ApiService.getBusinessData();
      const id = businessData?.businessId || businessData?.business?.id;
      setBusinessId(id);

      if (id) {
        const schedule = await ApiService.getBusinessSchedule(id);
        setScheduleData(schedule);
      }
    } catch (error) {
      console.error('Error loading business data:', error);
      Alert.alert('Error', 'Failed to load business schedule');
    } finally {
      setIsLoading(false);
    }
  };

  const handleWorkingHoursUpdate = async (newWorkingHours) => {
    try {
      setIsSaving(true);
      await ApiService.updateWorkingHours(businessId, newWorkingHours);
      setScheduleData(prev => ({ ...prev, workingHours: newWorkingHours }));
      Alert.alert('Success', 'Working hours updated successfully');
    } catch (error) {
      console.error('Error updating working hours:', error);
      Alert.alert('Error', 'Failed to update working hours');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTemporaryClosureAdd = async (closureData) => {
    try {
      const result = await ApiService.addTemporaryClosure(businessId, closureData);
      setScheduleData(prev => ({
        ...prev,
        temporaryClosures: [...prev.temporaryClosures, result.closure]
      }));
      return result;
    } catch (error) {
      console.error('Error adding temporary closure:', error);
      throw error;
    }
  };

  const handleTemporaryBreakAdd = async (breakData) => {
    try {
      const result = await ApiService.addTemporaryBreak(businessId, breakData);
      setScheduleData(prev => ({
        ...prev,
        temporaryBreaks: [...prev.temporaryBreaks, result.break]
      }));
      return result;
    } catch (error) {
      console.error('Error adding temporary break:', error);
      throw error;
    }
  };

  const renderTabButton = (tabKey, title, icon) => (
    <TouchableOpacity
      key={tabKey}
      style={[
        styles.tabButton,
        activeTab === tabKey && [styles.activeTabButton, { backgroundColor: theme.primary }]
      ]}
      onPress={() => setActiveTab(tabKey)}
    >
      <FontAwesome5 
        name={icon} 
        size={16} 
        color={activeTab === tabKey ? theme.white : theme.textSecondary} 
        style={styles.tabIcon}
      />
      <Text style={[
        styles.tabText,
        { color: activeTab === tabKey ? theme.white : theme.textSecondary }
      ]}>
        {title}
      </Text>
    </TouchableOpacity>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'weekly':
        return (
          <WeeklyScheduleEditor
            workingHours={scheduleData.workingHours}
            onUpdate={handleWorkingHoursUpdate}
            isSaving={isSaving}
            theme={theme}
          />
        );
      case 'closures':
        return (
          <TemporaryClosuresTab
            closures={scheduleData.temporaryClosures}
            businessId={businessId}
            onAdd={handleTemporaryClosureAdd}
            onRefresh={loadBusinessData}
            theme={theme}
          />
        );
      case 'breaks':
        return (
          <TemporaryBreaksTab
            breaks={scheduleData.temporaryBreaks}
            businessId={businessId}
            onAdd={handleTemporaryBreakAdd}
            onRefresh={loadBusinessData}
            theme={theme}
          />
        );
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
            Loading schedule...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <View style={styles.container}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <FontAwesome5 name="arrow-left" size={20} color={theme.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
            Manage Hours
          </Text>
          <View style={styles.placeholder} />
        </View>

        {/* Tab Navigation */}
        <View style={[styles.tabContainer, { backgroundColor: theme.backgroundLight }]}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabScrollContainer}
          >
            {renderTabButton('weekly', 'Weekly Schedule', 'calendar-week')}
            {renderTabButton('closures', 'Temporary Closures', 'calendar-times')}
            {renderTabButton('breaks', 'Temporary Breaks', 'pause-circle')}
          </ScrollView>
        </View>

        {/* Tab Content */}
        <View style={styles.contentContainer}>
          {renderTabContent()}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = ScaledSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: '16@vs',
    fontSize: '16@s',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: '16@s',
    paddingVertical: '16@vs',
    borderBottomWidth: 1,
  },
  backButton: {
    padding: '4@s',
  },
  headerTitle: {
    fontSize: '20@s',
    fontWeight: 'bold',
  },
  placeholder: {
    width: '32@s',
  },
  tabContainer: {
    paddingVertical: '12@vs',
  },
  tabScrollContainer: {
    paddingHorizontal: '16@s',
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: '10@vs',
    paddingHorizontal: '16@s',
    borderRadius: '20@s',
    marginRight: '12@s',
    backgroundColor: 'transparent',
  },
  activeTabButton: {
    shadowOffset: { width: 0, height: '2@s' },
    shadowOpacity: 0.1,
    shadowRadius: '4@s',
    elevation: 2,
  },
  tabIcon: {
    marginRight: '8@s',
  },
  tabText: {
    fontSize: '14@s',
    fontWeight: '500',
  },
  contentContainer: {
    flex: 1,
  },
});

export default ManageHoursScreen;