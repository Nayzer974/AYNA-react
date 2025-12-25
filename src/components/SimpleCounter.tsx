// Compteur générique simple qui fonctionne
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface SimpleCounterProps {
  value: number;
  target: number | null;
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
  // Pour les sessions illimitées, n'afficher que la valeur
  if (target === null) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['rgba(255, 211, 105, 0.2)', 'rgba(255, 211, 105, 0.1)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientContainer}
        >
          <View style={styles.valueContainer}>
            <Text style={[styles.number, { fontSize: fontSize * 1.2, color: textColor }]}>
              {value.toLocaleString()}
            </Text>
            <View style={styles.pulseDot} />
          </View>
        </LinearGradient>
      </View>
    );
  }

  // Pour les sessions limitées, afficher avec la cible
  const progress = target > 0 ? (value / target) * 100 : 0;
  
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['rgba(255, 211, 105, 0.2)', 'rgba(255, 211, 105, 0.1)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientContainer}
      >
        <View style={styles.valueContainer}>
          <Text style={[styles.number, { fontSize, color: textColor }]}>
            {value.toLocaleString()}
          </Text>
          <View style={styles.progressIndicator}>
            <View style={[styles.progressBar, { width: `${Math.min(progress, 100)}%` }]} />
          </View>
        </View>
        <View style={styles.separatorContainer}>
          <View style={styles.separatorLine} />
        </View>
        <View style={styles.targetContainer}>
          <Text style={[styles.targetText, { fontSize: fontSize * 0.7, color: targetColor }]}>
            {target.toLocaleString()}
          </Text>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradientContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 32,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(255, 211, 105, 0.3)',
    width: '100%',
    minHeight: 120,
  },
  valueContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  number: {
    fontFamily: 'System',
    fontWeight: '900',
    textAlign: 'center',
    includeFontPadding: false,
    letterSpacing: 1,
  },
  pulseDot: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10b981',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 5,
  },
  progressIndicator: {
    marginTop: 8,
    width: '80%',
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#FFD369',
    borderRadius: 2,
  },
  separatorContainer: {
    width: 2,
    height: 60,
    marginHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  separatorLine: {
    width: 2,
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 1,
  },
  targetContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  targetText: {
    fontFamily: 'System',
    fontWeight: '600',
    textAlign: 'center',
    includeFontPadding: false,
    opacity: 0.7,
  },
});


