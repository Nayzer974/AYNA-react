/**
 * Composant ColorPicker pour sélectionner des couleurs
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput } from 'react-native';
import { getTheme } from '@/data/themes';

interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (color: string) => void;
  themeId?: string;
}

// Extraire toutes les couleurs de tous les thèmes disponibles
import { themes } from '@/data/themes';

const getAllThemeColors = () => {
  const colors = {
    primary: new Set<string>(),
    secondary: new Set<string>(),
    accent: new Set<string>(),
    background: new Set<string>(),
    backgroundSecondary: new Set<string>(),
    text: new Set<string>(),
    textSecondary: new Set<string>(),
  };

  Object.values(themes).forEach(theme => {
    colors.primary.add(theme.colors.primary);
    colors.secondary.add(theme.colors.secondary);
    colors.accent.add(theme.colors.accent);
    colors.background.add(theme.colors.background);
    colors.backgroundSecondary.add(theme.colors.backgroundSecondary);
    colors.text.add(theme.colors.text);
    colors.textSecondary.add(theme.colors.textSecondary);
  });

  return {
    primary: Array.from(colors.primary),
    secondary: Array.from(colors.secondary),
    accent: Array.from(colors.accent),
    background: Array.from(colors.background),
    backgroundSecondary: Array.from(colors.backgroundSecondary),
    text: Array.from(colors.text),
    textSecondary: Array.from(colors.textSecondary),
  };
};

const COLOR_PALETTES = getAllThemeColors();

export function ColorPicker({ label, value, onChange, themeId = 'default' }: ColorPickerProps) {
  const theme = getTheme(themeId);
  const [showPicker, setShowPicker] = useState(false);
  const [hexValue, setHexValue] = useState(value);

  const palette = COLOR_PALETTES[label as keyof typeof COLOR_PALETTES] || COLOR_PALETTES.primary;

  const handleColorSelect = (color: string) => {
    onChange(color);
    setHexValue(color);
    setShowPicker(false);
  };

  const handleHexChange = (hex: string) => {
    setHexValue(hex);
    // Valider le format hex
    if (/^#[0-9A-Fa-f]{6}$/.test(hex)) {
      onChange(hex);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: theme.colors.text }]}>{label}</Text>
      
      {/* Aperçu de la couleur */}
      <Pressable
        onPress={() => setShowPicker(!showPicker)}
        style={[styles.colorPreview, { backgroundColor: value }]}
      >
        <View style={[styles.colorPreviewInner, { borderColor: theme.colors.textSecondary }]}>
          <Text style={[styles.colorHex, { color: theme.colors.text }]}>
            {value}
          </Text>
        </View>
      </Pressable>

      {/* Input hex */}
      <View style={[styles.hexInputContainer, { backgroundColor: theme.colors.backgroundSecondary }]}>
        <Text style={[styles.hexLabel, { color: theme.colors.textSecondary }]}>#</Text>
        <TextInput
          style={[styles.hexInput, { color: theme.colors.text }]}
          value={hexValue.replace('#', '')}
          onChangeText={(text) => handleHexChange('#' + text.toUpperCase())}
          placeholder="FFFFFF"
          placeholderTextColor={theme.colors.textSecondary}
          maxLength={6}
          autoCapitalize="characters"
        />
      </View>

      {/* Palette de couleurs */}
      {showPicker && (
        <View style={[styles.paletteContainer, { backgroundColor: theme.colors.backgroundSecondary }]}>
          <View style={styles.paletteGrid}>
            {palette.map((color, index) => (
              <Pressable
                key={index}
                onPress={() => handleColorSelect(color)}
                style={[
                  styles.colorSwatch,
                  { backgroundColor: color },
                  value === color && styles.colorSwatchSelected,
                ]}
              >
                {value === color && (
                  <View style={styles.checkmark}>
                    <Text style={styles.checkmarkText}>✓</Text>
                  </View>
                )}
              </Pressable>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'System',
    marginBottom: 8,
    textTransform: 'capitalize',
  },
  colorPreview: {
    width: '100%',
    height: 60,
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorPreviewInner: {
    width: '95%',
    height: '90%',
    borderRadius: 10,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  colorHex: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'System',
  },
  hexInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  hexLabel: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'System',
    marginRight: 4,
  },
  hexInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'System',
    letterSpacing: 1,
  },
  paletteContainer: {
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
  },
  paletteGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorSwatch: {
    width: 50,
    height: 50,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorSwatchSelected: {
    borderWidth: 3,
    borderColor: '#FFFFFF',
    transform: [{ scale: 1.1 }],
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'System',
  },
});

