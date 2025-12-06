import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, ScrollView } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Sparkles, X } from 'lucide-react-native';
import { useUser } from '@/contexts/UserContext';
import { getTheme } from '@/data/themes';

interface NiyyaScreenProps {
  onSave: (intention: string) => void;
  onClose?: () => void;
  initialIntention?: string;
}

export function NiyyaScreen({
  onSave,
  onClose,
  initialIntention = ''
}: NiyyaScreenProps) {
  const { user } = useUser();
  const theme = getTheme(user?.theme || 'default');
  const [intention, setIntention] = useState(initialIntention);

  return (
    <Animated.View entering={FadeInDown.duration(500)} style={[styles.container, { backgroundColor: theme.colors.backgroundSecondary }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Sparkles size={24} color="#FFD369" />
            <Text style={[styles.title, { color: theme.colors.text }]}>
              Votre Niyya (Intention)
            </Text>
          </View>
          {onClose && (
            <Pressable onPress={onClose} style={styles.closeButton}>
              <X size={20} color={theme.colors.text} />
            </Pressable>
          )}
        </View>
        <Text style={[styles.description, { color: theme.colors.textSecondary }]}>
          Écrivez votre intention pour ce défi de 40 jours. Cette intention vous guidera tout au long de votre parcours spirituel.
        </Text>
        <TextInput
          value={intention}
          onChangeText={setIntention}
          placeholder="Écrivez votre intention pour ces 40 jours..."
          placeholderTextColor="rgba(255, 255, 255, 0.5)"
          style={[styles.textInput, { 
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            color: theme.colors.text,
            borderColor: theme.colors.accent,
          }]}
          multiline
          numberOfLines={6}
          textAlignVertical="top"
        />
        <View style={styles.buttons}>
          {onClose && (
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [
                styles.button,
                styles.cancelButton,
                { 
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <Text style={[styles.buttonText, { color: theme.colors.text }]}>
                Annuler
              </Text>
            </Pressable>
          )}
          <Pressable
            onPress={() => onSave(intention)}
            disabled={!intention.trim()}
            style={({ pressed }) => [
              styles.button,
              styles.saveButton,
              {
                backgroundColor: intention.trim() ? '#FFD369' : 'rgba(255, 211, 105, 0.5)',
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            <Text style={[styles.buttonText, { color: '#0A0F2C' }]}>
              {initialIntention ? 'Mettre à jour' : 'Enregistrer'}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  content: {
    flexGrow: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    fontFamily: 'Poppins',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  description: {
    fontSize: 14,
    marginBottom: 16,
    fontFamily: 'Poppins',
    lineHeight: 20,
  },
  textInput: {
    borderRadius: 12,
    padding: 16,
    fontSize: 14,
    fontFamily: 'Poppins',
    minHeight: 120,
    borderWidth: 2,
    marginBottom: 16,
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    // Styles handled inline
  },
  saveButton: {
    // Styles handled inline
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Poppins',
  },
});

