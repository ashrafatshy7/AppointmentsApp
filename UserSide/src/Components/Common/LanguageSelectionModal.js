// src/Components/Common/LanguageSelectionModal.js
import React from 'react';
import { 
  View, 
  Text, 
  Modal, 
  TouchableOpacity, 
  TouchableWithoutFeedback,
  FlatList,
  StyleSheet 
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { ScaledSheet } from 'react-native-size-matters';
import { LANGUAGES } from '../../Context/UserContext';
import Colors from '../../Constants/Colors';

const LanguageSelectionModal = ({ 
  visible, 
  onClose, 
  onSelectLanguage, 
  currentLanguage 
}) => {
  
  // Render language item
  const renderLanguageItem = ({ item }) => {
    const isSelected = item.code === currentLanguage;
    
    return (
      <TouchableOpacity
        style={[
          styles.languageItem,
          { borderBottomColor: Colors.border },
          isSelected && [styles.selectedLanguageItem, { backgroundColor: Colors.primary }]
        ]}
        onPress={() => {
          onSelectLanguage(item.code);
          onClose();
        }}
      >
        <View style={styles.languageTextContainer}>
          <Text style={[
            styles.languageName,
            { color: Colors.textPrimary },
            isSelected && styles.selectedLanguageName
          ]}>
            {item.name}
          </Text>
        </View>
        
        {isSelected && (
          <FontAwesome5 
            name="check" 
            size={16} 
            color={Colors.white} 
          />
        )}
      </TouchableOpacity>
    );
  };
  
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={[styles.overlay, { backgroundColor: Colors.overlay }]}>
          <TouchableWithoutFeedback onPress={e => e.stopPropagation()}>
            <View style={[styles.modalContent, { backgroundColor: Colors.background }]}>
              <View style={[styles.header, { borderBottomColor: Colors.border }]}>
                <Text style={[styles.title, { color: Colors.textPrimary }]}>Select Language</Text>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <FontAwesome5 name="times" size={20} color={Colors.textPrimary} />
                </TouchableOpacity>
              </View>
              
              <FlatList
                data={LANGUAGES}
                renderItem={renderLanguageItem}
                keyExtractor={(item) => item.code}
                contentContainerStyle={styles.listContainer}
              />
              
              <View style={[styles.footer, { borderTopColor: Colors.border }]}>
                <Text style={[styles.noteText, { color: Colors.textLight }]}>
                  App will restart after changing language
                </Text>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = ScaledSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    borderRadius: '12@s',
    overflow: 'hidden',
    maxHeight: '60%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '15@s',
    borderBottomWidth: 1,
  },
  title: {
    fontSize: '18@s',
    fontFamily: 'Poppins-SemiBold',
  },
  closeButton: {
    padding: '5@s',
  },
  listContainer: {
    paddingVertical: '10@s',
  },
  languageItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: '15@s',
    paddingHorizontal: '20@s',
    borderBottomWidth: 1,
  },
  selectedLanguageItem: {
    borderBottomWidth: 0,
  },
  languageTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  languageName: {
    fontSize: '16@s',
    fontFamily: 'Poppins-Medium',
  },
  selectedLanguageName: {
    color: 'white',
  },
  footer: {
    padding: '15@s',
    borderTopWidth: 1,
    alignItems: 'center',
  },
  noteText: {
    fontSize: '14@s',
    fontFamily: 'Poppins-Regular',
    textAlign: 'center',
  },
});

export default LanguageSelectionModal;