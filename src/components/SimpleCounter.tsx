// Compteur générique simple qui fonctionne
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface SimpleCounterProps {
  value: number;
  target: number;
  fontSize?: number;
  textColor?: string;
  targetColor?: string;
}

export default function SimpleCounter({
  value,
  target,
  fontSize = 60,
  textColor = '#FFFFFF',
  targetColor = '#888888',
}: SimpleCounterProps) {
  return (
    <View style={styles.container}>
      <Text style={[styles.number, { fontSize, color: textColor }]}>
        {value}
      </Text>
      <Text style={[styles.separator, { fontSize: fontSize * 0.5, color: targetColor }]}>
        /
      </Text>
      <Text style={[styles.number, { fontSize, color: targetColor }]}>
        {target}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  number: {
    fontFamily: 'System',
    fontWeight: '900',
    textAlign: 'center',
    includeFontPadding: false,
  },
  separator: {
    fontFamily: 'System',
    fontWeight: '900',
    includeFontPadding: false,
  },
});


