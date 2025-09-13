// src/CustomerManager/Components/CustomerSearchBar.js
import React, { useState, useEffect } from 'react';
import { View, TextInput, TouchableOpacity } from 'react-native';
import { ScaledSheet } from 'react-native-size-matters';
import { FontAwesome5 } from '@expo/vector-icons';
import { useTheme } from '../../Context/ThemeContext';

const CustomerSearchBar = ({ 
  onSearch, 
  onClear, 
  placeholder = "Search customers...",
  autoFocus = false 
}) => {
  const { theme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // Debounce search
    const timeoutId = setTimeout(() => {
      onSearch?.(searchQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, onSearch]);

  const handleClear = () => {
    setSearchQuery('');
    onClear?.();
  };

  return (
    <View style={[styles.searchContainer, { backgroundColor: theme.surface }]}>
      <View style={[styles.searchInputContainer, { backgroundColor: theme.backgroundGray }]}>
        <FontAwesome5 
          name="search" 
          size={16} 
          color={theme.textLight} 
          style={styles.searchIcon} 
        />
        
        <TextInput
          style={[styles.searchInput, { color: theme.textPrimary }]}
          placeholder={placeholder}
          placeholderTextColor={theme.textLight}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoFocus={autoFocus}
          returnKeyType="search"
          autoCorrect={false}
          autoCapitalize="words"
        />
        
        {searchQuery.length > 0 && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={handleClear}
          >
            <FontAwesome5 
              name="times-circle" 
              size={16} 
              color={theme.textLight} 
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = ScaledSheet.create({
  searchContainer: {
    paddingHorizontal: '16@s',
    paddingVertical: '12@vs',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: '10@s',
    paddingHorizontal: '12@s',
    paddingVertical: '10@vs',
  },
  searchIcon: {
    marginRight: '10@s',
  },
  searchInput: {
    flex: 1,
    fontSize: '16@s',
    paddingVertical: 0, // Remove default padding on Android
  },
  clearButton: {
    padding: '4@s',
  },
});

export default CustomerSearchBar;