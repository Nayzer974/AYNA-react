/**
 * Écran de debug pour la boussole Qibla
 * Affiche toutes les données en temps réel pour diagnostiquer les problèmes
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useQibla } from '@/hooks/useQibla';
import { useUser } from '@/contexts/UserContext';
import { getTheme } from '@/data/themes';

export function CompassDebugScreen() {
  const { user } = useUser();
  const theme = getTheme(user?.theme || 'default');
  
  const {
    location,
    heading,
    bearingKaaba,
    rotation,
    pitch,
    roll,
    loading,
    error,
  } = useQibla();

  const formatNumber = (value: number | null, decimals: number = 2): string => {
    if (value === null || !Number.isFinite(value)) return '—';
    return value.toFixed(decimals);
  };

  const formatAngle = (value: number | null): string => {
    if (value === null || !Number.isFinite(value)) return '—';
    return `${value.toFixed(1)}°`;
  };

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.content}
    >
      <Text style={[styles.title, { color: theme.colors.text }]}>
        Debug Boussole Qibla
      </Text>

      {/* GPS */}
      <View style={[styles.section, { backgroundColor: theme.colors.backgroundSecondary }]}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>GPS</Text>
        <DebugRow label="Latitude" value={formatNumber(location?.latitude ?? null, 6)} />
        <DebugRow label="Longitude" value={formatNumber(location?.longitude ?? null, 6)} />
        <DebugRow label="Accuracy" value={location?.accuracy ? `${location.accuracy.toFixed(1)} m` : '—'} />
        <DebugRow label="Speed" value={location?.speed ? `${location.speed.toFixed(2)} m/s` : '—'} />
        <DebugRow label="GPS Heading" value={formatAngle(location?.heading ?? null)} />
        <DebugRow label="Altitude" value={location?.altitude ? `${location.altitude.toFixed(1)} m` : '—'} />
      </View>

      {/* Orientation */}
      <View style={[styles.section, { backgroundColor: theme.colors.backgroundSecondary }]}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Orientation</Text>
        <DebugRow label="Heading" value={formatAngle(heading)} />
        <DebugRow label="Pitch" value={formatAngle(pitch)} />
        <DebugRow label="Roll" value={formatAngle(roll)} />
      </View>

      {/* Qibla */}
      <View style={[styles.section, { backgroundColor: theme.colors.backgroundSecondary }]}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Qibla</Text>
        <DebugRow label="Bearing Kaaba" value={formatAngle(bearingKaaba)} />
        <DebugRow label="Rotation finale" value={formatAngle(rotation)} />
        <DebugRow 
          label="Calcul" 
          value={bearingKaaba !== null && heading !== null 
            ? `${formatAngle(bearingKaaba)} - ${formatAngle(heading)} = ${formatAngle(rotation)}`
            : '—'
          } 
        />
      </View>

      {/* État */}
      <View style={[styles.section, { backgroundColor: theme.colors.backgroundSecondary }]}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>État</Text>
        <DebugRow label="Loading" value={loading ? 'Oui' : 'Non'} />
        <DebugRow label="Error" value={error || '—'} />
      </View>

      {/* Instructions */}
      <View style={[styles.section, { backgroundColor: theme.colors.backgroundSecondary }]}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Tests</Text>
        <Text style={[styles.instruction, { color: theme.colors.textSecondary }]}>
          • Se placer face au Nord réel (Google Maps){'\n'}
          • Heading devrait être ≈ 0°{'\n'}
          • Tourner lentement sur soi{'\n'}
          • Heading devrait être fluide, sans sauts{'\n'}
          • Viser la Kaaba → Rotation finale ≈ 0°{'\n'}
          • Comparer avec Google Maps (±5° acceptable)
        </Text>
      </View>
    </ScrollView>
  );
}

interface DebugRowProps {
  label: string;
  value: string;
}

function DebugRow({ label, value }: DebugRowProps) {
  const { user } = useUser();
  const theme = getTheme(user?.theme || 'default');

  return (
    <View style={styles.row}>
      <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
        {label}:
      </Text>
      <Text style={[styles.value, { color: theme.colors.text }]}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 24,
    fontFamily: 'System',
  },
  section: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    fontFamily: 'System',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  label: {
    fontSize: 14,
    fontFamily: 'System',
    flex: 1,
  },
  value: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'System',
    flex: 1,
    textAlign: 'right',
  },
  instruction: {
    fontSize: 12,
    fontFamily: 'System',
    lineHeight: 20,
  },
});

