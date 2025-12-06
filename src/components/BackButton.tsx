import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useUser } from '@/contexts/UserContext';
import { getTheme } from '@/data/themes';

interface BackButtonProps {
  style?: any;
}

export function BackButton({ style }: BackButtonProps) {
  const navigation = useNavigation();
  const { user } = useUser();
  const theme = getTheme(user?.theme || 'default');

  return (
    <Pressable
      onPress={() => navigation.goBack()}
      style={({ pressed }) => [
        styles.button,
        { opacity: pressed ? 0.7 : 1 },
        style,
      ]}
    >
      <ArrowLeft size={20} color={theme.colors.textSecondary || 'rgba(255, 255, 255, 0.8)'} />
      <Text style={[styles.text, { color: theme.colors.textSecondary || 'rgba(255, 255, 255, 0.8)' }]}>
        Retour
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
    paddingVertical: 4,
  },
  text: {
    fontSize: 14,
    fontFamily: 'System',
  },
});


