import React from 'react';
import { View, Text, StyleSheet, Modal, Pressable } from 'react-native';
import { X } from 'lucide-react-native';
import Animated, { SlideInUp, SlideOutDown } from 'react-native-reanimated';

interface BlockUnavailableModalProps {
  visible: boolean;
  onClose: () => void;
  blockName?: string;
  message?: string;
  theme: {
    background: string;
    backgroundSecondary: string;
    text: string;
    textSecondary: string;
    accent: string;
  };
}

export function BlockUnavailableModal({
  visible,
  onClose,
  blockName,
  message,
  theme,
}: BlockUnavailableModalProps) {
  const defaultMessage = blockName
    ? `Le bloc "${blockName}" n'est pas encore disponible. Il sera bientôt accessible.`
    : "Ce bloc n'est pas encore disponible. Il sera bientôt accessible.";

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Animated.View
          entering={SlideInUp.duration(300).springify()}
          exiting={SlideOutDown.duration(200)}
        >
          <Pressable onPress={(e) => e.stopPropagation()}>
            <View
              style={[
                styles.modalContent,
                { backgroundColor: theme.backgroundSecondary },
              ]}
            >
              <View style={styles.header}>
                <Text style={[styles.title, { color: theme.text }]}>
                  Bloc non disponible
                </Text>
                <Pressable onPress={onClose} style={styles.closeButton}>
                  <X size={20} color={theme.text} />
                </Pressable>
              </View>

              <View style={styles.body}>
                <Text style={[styles.message, { color: theme.textSecondary }]}>
                  {message || defaultMessage}
                </Text>
              </View>

              <Pressable
                onPress={onClose}
                style={[styles.button, { backgroundColor: theme.accent }]}
              >
                <Text style={styles.buttonText}>Compris</Text>
              </Pressable>
            </View>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '50%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  body: {
    marginBottom: 24,
  },
  message: {
    fontSize: 15,
    lineHeight: 22,
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});

