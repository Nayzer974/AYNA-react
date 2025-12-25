import React from 'react';
import { View, Platform, StyleSheet, ViewStyle } from 'react-native';

// Couleurs de base pour le neumorphisme
export const NEU_COLORS = {
  background: '#E0E5EC',
  lightShadow: '#FFFFFF',
  darkShadow: '#A3B1C6',
};

export interface NeumorphicViewProps {
  style?: ViewStyle;
  children?: React.ReactNode;
  inset?: boolean;
  borderRadius?: number;
  padding?: number;
}

/**
 * Composant NeumorphicView - Style neumorphique cross-platform
 * 
 * Compatible iOS et Android avec gestion native des ombres
 */
export const NeumorphicView = ({ 
  children, 
  style, 
  inset = false, 
  borderRadius = 16,
  padding = 16 
}: NeumorphicViewProps) => {
  return (
    <View 
      style={[
        styles.container, 
        { 
          backgroundColor: NEU_COLORS.background,
          borderRadius,
          padding,
        },
        inset && styles.inset, 
        style
      ]}
    >
      {!inset && (
        <>
          <View 
            style={[
              styles.lightShadow, 
              { borderRadius }
            ]} 
          />
          <View 
            style={[
              styles.darkShadow, 
              { borderRadius }
            ]} 
          />
        </>
      )}
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: Platform.OS === 'android' ? 'hidden' : 'visible',
  },
  lightShadow: {
    position: 'absolute',
    top: -4,
    left: -4,
    right: 4,
    bottom: 4,
    ...Platform.select({
      ios: {
        shadowColor: NEU_COLORS.lightShadow,
        shadowOffset: { width: -6, height: -6 },
        shadowOpacity: 1,
        shadowRadius: 6,
      },
      android: {
        backgroundColor: NEU_COLORS.lightShadow,
        opacity: 0.7,
        elevation: 8,
      },
    }),
  },
  darkShadow: {
    position: 'absolute',
    top: 4,
    left: 4,
    right: -4,
    bottom: -4,
    ...Platform.select({
      ios: {
        shadowColor: NEU_COLORS.darkShadow,
        shadowOffset: { width: 6, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
      },
      android: {
        backgroundColor: NEU_COLORS.darkShadow,
        opacity: 0.3,
        elevation: 4,
      },
    }),
  },
  inset: {
    shadowColor: 'transparent',
  },
});

