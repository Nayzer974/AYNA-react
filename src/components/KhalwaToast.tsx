import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, Modal } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import { X } from 'lucide-react-native';

interface KhalwaToastProps {
  message: string | null;
  onClose: () => void;
}

/**
 * Composant Toast pour afficher les messages de guidage pendant la session Khalwa
 */
export function KhalwaToast({ message, onClose }: KhalwaToastProps) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(50);

  useEffect(() => {
    if (message) {
      opacity.value = withTiming(1, { duration: 300 });
      translateY.value = withSpring(0, { damping: 30, stiffness: 300 });
      
      // Fermer automatiquement après 8 secondes
      const timer = setTimeout(() => {
        onClose();
      }, 8000);

      return () => clearTimeout(timer);
    } else {
      opacity.value = withTiming(0, { duration: 300 });
      translateY.value = withTiming(50, { duration: 300 });
    }
  }, [message, onClose]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  if (!message) return null;

  return (
    <Modal transparent visible={!!message} animationType="none">
      <View style={styles.overlay} pointerEvents="box-none">
        <Animated.View style={[styles.container, animatedStyle]}>
          <View
            style={[
              styles.content,
              {
                backgroundColor: 'rgba(90, 45, 130, 0.95)',
                borderColor: 'rgba(255, 255, 255, 0.1)',
              },
            ]}
          >
            <View style={styles.textContainer}>
              <Text style={styles.message}>{message}</Text>
            </View>
            <Pressable
              onPress={onClose}
              style={styles.closeButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X size={20} color="rgba(255, 255, 255, 0.6)" />
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

/**
 * Hook pour gérer les messages Toast
 */
export function useKhalwaToast() {
  const [currentMessage, setCurrentMessage] = useState<string | null>(null);
  const messageQueueRef = useRef<string[]>([]);
  const isShowingRef = useRef(false);

  const showMessage = useCallback((message: string) => {
    if (isShowingRef.current) {
      // Ajouter à la queue si un message est déjà affiché
      messageQueueRef.current.push(message);
    } else {
      // Afficher immédiatement
      setCurrentMessage(message);
      isShowingRef.current = true;
    }
  }, []);

  const closeMessage = useCallback(() => {
    setCurrentMessage(null);
    isShowingRef.current = false;

    // Afficher le message suivant dans la queue après un court délai
    setTimeout(() => {
      if (messageQueueRef.current.length > 0) {
        const nextMessage = messageQueueRef.current.shift();
        if (nextMessage) {
          setCurrentMessage(nextMessage);
          isShowingRef.current = true;
        }
      }
    }, 500);
  }, []);

  return {
    currentMessage,
    showMessage,
    closeMessage,
  };
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'flex-end',
    pointerEvents: 'box-none',
    zIndex: 9999,
  },
  container: {
    width: '90%',
    maxWidth: 500,
    paddingHorizontal: 16,
  },
  content: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  textContainer: {
    flex: 1,
    minWidth: 0,
  },
  message: {
    color: '#ffffff',
    fontSize: 14,
    lineHeight: 20,
    fontFamily: 'System',
  },
  closeButton: {
    padding: 4,
    marginTop: -4,
    marginRight: -4,
  },
});


