import React, { useState } from 'react';
import { View, TextInput, Pressable, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';

export interface PasswordInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  style?: ViewStyle;
  inputStyle?: TextStyle;
  testID?: string;
}

/**
 * Composant Input pour mot de passe avec bouton pour afficher/masquer
 */
export function PasswordInput({
  value,
  onChangeText,
  placeholder = 'Mot de passe',
  style,
  inputStyle,
  testID,
}: PasswordInputProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <View style={[styles.container, style]}>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="rgba(255, 255, 255, 0.5)"
        secureTextEntry={!isVisible}
        style={[styles.input, inputStyle]}
        testID={testID}
        autoCapitalize="none"
        autoCorrect={false}
      />
      <Pressable
        onPress={() => setIsVisible(!isVisible)}
        style={styles.eyeButton}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        {isVisible ? (
          <EyeOff size={20} color="rgba(255, 255, 255, 0.7)" />
        ) : (
          <Eye size={20} color="rgba(255, 255, 255, 0.7)" />
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    height: 48,
    paddingHorizontal: 16,
    paddingRight: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'System',
  },
  eyeButton: {
    position: 'absolute',
    right: 12,
    padding: 4,
  },
});

