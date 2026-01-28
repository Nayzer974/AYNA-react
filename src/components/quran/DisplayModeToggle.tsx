/**
 * DisplayModeToggle - Toggle pour changer entre mode liste et verset par verset
 */

import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { List, Square } from 'lucide-react-native';
import { Theme } from '@/data/themes';

type DisplayMode = 'list' | 'single';

interface DisplayModeToggleProps {
  mode: DisplayMode;
  onToggle: (mode: DisplayMode) => void;
  theme: Theme;
}

export const DisplayModeToggle: React.FC<DisplayModeToggleProps> = ({
  mode,
  onToggle,
  theme,
}) => {
  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.backgroundSecondary,
          borderColor: theme.colors.accent + '30',
        },
      ]}
    >
      <Pressable
        onPress={() => onToggle('list')}
        style={({ pressed }) => [
          styles.button,
          mode === 'list' && {
            backgroundColor: theme.colors.accent,
          },
          pressed && styles.pressed,
        ]}
      >
        <List
          size={18}
          color={mode === 'list' ? theme.colors.background : theme.colors.text}
        />
      </Pressable>

      <View
        style={[
          styles.separator,
          {
            backgroundColor: theme.colors.textSecondary + '30',
          },
        ]}
      />

      <Pressable
        onPress={() => onToggle('single')}
        style={({ pressed }) => [
          styles.button,
          mode === 'single' && {
            backgroundColor: theme.colors.accent,
          },
          pressed && styles.pressed,
        ]}
      >
        <Square
          size={18}
          color={mode === 'single' ? theme.colors.background : theme.colors.text}
        />
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    gap: 4,
  },
  button: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 44,
  },
  separator: {
    width: 1,
    marginVertical: 4,
  },
  pressed: {
    opacity: 0.7,
  },
});

