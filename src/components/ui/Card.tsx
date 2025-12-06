import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';

export interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  testID?: string;
}

/**
 * Composant Card - Conteneur de carte
 */
export function Card({ children, style, testID }: CardProps) {
  return (
    <View
      style={[styles.card, style]}
      testID={testID}
    >
      {children}
    </View>
  );
}

export interface CardHeaderProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

/**
 * En-tête de carte
 */
export function CardHeader({ children, style }: CardHeaderProps) {
  return (
    <View style={[styles.header, style]}>
      {children}
    </View>
  );
}

export interface CardTitleProps {
  children: React.ReactNode;
  style?: TextStyle;
}

/**
 * Titre de carte
 */
export function CardTitle({ children, style }: CardTitleProps) {
  return (
    <Text style={[styles.title, style]}>
      {children}
    </Text>
  );
}

export interface CardDescriptionProps {
  children: React.ReactNode;
  style?: TextStyle;
}

/**
 * Description de carte
 */
export function CardDescription({ children, style }: CardDescriptionProps) {
  return (
    <Text style={[styles.description, style]}>
      {children}
    </Text>
  );
}

export interface CardContentProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

/**
 * Contenu de carte
 */
export function CardContent({ children, style }: CardContentProps) {
  return (
    <View style={[styles.content, style]}>
      {children}
    </View>
  );
}

export interface CardFooterProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

/**
 * Pied de carte
 */
export function CardFooter({ children, style }: CardFooterProps) {
  return (
    <View style={[styles.footer, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: '#1E1E2F',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    flexDirection: 'column',
    padding: 20,
    gap: 6,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    fontFamily: 'System',
    color: '#FFFFFF',
  },
  description: {
    fontSize: 14,
    fontFamily: 'System',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  content: {
    padding: 20,
    paddingTop: 0,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: 0,
  },
});

