import React from 'react';
import { Modal, Pressable, Text, View, StyleSheet } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { getTheme } from '@/data/themes';
import { useUser } from '@/contexts/UserContext';

export interface ConfirmationModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmVariant?: 'default' | 'destructive';
  theme?: 'default' | 'ocean' | 'sunset' | 'forest' | 'royal' | 'galaxy';
}

export function ConfirmationModal({
  visible,
  title,
  message,
  confirmText = 'Confirmer',
  cancelText = 'Annuler',
  onConfirm,
  onCancel,
  confirmVariant = 'default',
  theme: themeName,
}: ConfirmationModalProps) {
  const { user } = useUser();
  const theme = getTheme(themeName || user?.theme || 'default');

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onCancel}
      statusBarTranslucent={true}
    >
      <Pressable 
        style={styles.modalOverlay}
        onPress={onCancel}
        activeOpacity={1}
      >
        <Pressable 
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
        >
          <Animated.View
            entering={FadeIn}
            exiting={FadeOut}
            style={[
              styles.modalContainer,
              {
                backgroundColor: theme.colors.backgroundSecondary,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
              {title}
            </Text>
            <Text style={[styles.modalMessage, { color: theme.colors.textSecondary }]}>
              {message}
            </Text>
            <View style={styles.modalButtons}>
              <Pressable
                onPress={onCancel}
                style={({ pressed }) => [
                  styles.modalButton,
                  styles.modalButtonCancel,
                  {
                    backgroundColor: theme.colors.backgroundTertiary,
                    borderColor: theme.colors.border,
                  },
                  pressed && styles.buttonPressed,
                ]}
              >
                <Text style={[styles.modalButtonText, { color: theme.colors.text }]}>
                  {cancelText}
                </Text>
              </Pressable>
              <Pressable
                onPress={onConfirm}
                style={({ pressed }) => [
                  styles.modalButton,
                  styles.modalButtonConfirm,
                  confirmVariant === 'destructive' ? {
                    backgroundColor: 'rgba(220, 38, 38, 0.2)',
                    borderColor: 'rgba(220, 38, 38, 0.4)',
                  } : {
                    backgroundColor: theme.colors.primary,
                    borderColor: theme.colors.primary,
                  },
                  pressed && styles.buttonPressed,
                ]}
              >
                <Text style={[
                  styles.modalButtonText,
                  confirmVariant === 'destructive' 
                    ? { color: '#fca5a5' }
                    : { color: theme.colors.background }
                ]}>
                  {confirmText}
                </Text>
              </Pressable>
            </View>
          </Animated.View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    zIndex: 9999,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
    zIndex: 10000,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '600',
    fontFamily: 'System',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 16,
    fontFamily: 'System',
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  modalButtonCancel: {
    // Styles déjà définis dans modalButton
  },
  modalButtonConfirm: {
    // Styles déjà définis dans modalButton
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'System',
  },
  buttonPressed: {
    opacity: 0.7,
  },
});

