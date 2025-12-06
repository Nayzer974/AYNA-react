import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useUser } from '@/contexts/UserContext';
import { getTheme } from '@/data/themes';

interface QiblaInfoProps {
  qiblaAngle: number | null;
  deviceHeading: number | null;
  rotation: number | null;
}

/**
 * Composant d'affichage des informations Qibla
 * Affiche l'angle Qibla, l'orientation du téléphone et la différence angulaire
 */
export function QiblaInfo({ qiblaAngle, deviceHeading, rotation }: QiblaInfoProps) {
  const { user } = useUser();
  const theme = getTheme(user?.theme || 'default');

  const formatAngle = (angle: number | null): string => {
    if (angle === null) return '--';
    return `${Math.round(angle)}°`;
  };

  const getDifference = (): number | null => {
    if (qiblaAngle === null || deviceHeading === null) return null;
    const diff = Math.abs(qiblaAngle - deviceHeading);
    return Math.min(diff, 360 - diff);
  };

  const difference = getDifference();
  const isAligned = difference !== null && difference < 5;

  return (
    <View style={[styles.container, { backgroundColor: 'rgba(255, 255, 255, 0.05)', borderColor: 'rgba(255, 255, 255, 0.1)' }]}>
      <View style={styles.row}>
        <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
          Direction Qibla
        </Text>
        <Text style={[styles.value, { color: theme.colors.text }]}>
          {formatAngle(qiblaAngle)}
        </Text>
      </View>

      <View style={styles.row}>
        <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
          Orientation téléphone
        </Text>
        <Text style={[styles.value, { color: theme.colors.text }]}>
          {formatAngle(deviceHeading)}
        </Text>
      </View>

      <View style={[styles.divider, { backgroundColor: 'rgba(255, 255, 255, 0.1)' }]} />

      <View style={styles.row}>
        <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
          Différence angulaire
        </Text>
        <Text style={[styles.value, { color: theme.colors.text }]}>
          {formatAngle(difference)}
        </Text>
      </View>

      {/* Message "Direction correcte" si aligné */}
      {isAligned && (
        <View style={[styles.alignedMessage, { backgroundColor: 'rgba(34, 197, 94, 0.2)', borderColor: 'rgba(34, 197, 94, 0.5)' }]}>
          <Text style={[styles.alignedText, { color: '#22c55e' }]}>
            ✓ Direction correcte
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'System',
  },
  value: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'System',
  },
  divider: {
    height: 1,
    marginVertical: 16,
  },
  alignedMessage: {
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  alignedText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'System',
  },
});


