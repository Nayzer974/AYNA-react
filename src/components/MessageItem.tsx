import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Clipboard } from 'react-native';
import Animated, { FadeInDown, FadeInRight, SlideInRight, SlideInLeft } from 'react-native-reanimated';
import { Message } from '@/pages/Chat';
import { Copy, Check } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

interface MessageItemProps {
  message: Message;
  theme: {
    colors: {
      accent: string;
      backgroundSecondary: string;
      text: string;
      textSecondary: string;
    };
  };
  formatTime: (date: Date) => string;
}

/**
 * Composant mémorisé pour afficher un message dans le chat
 */
export const MessageItem = React.memo<MessageItemProps>(({ message, theme, formatTime }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!message.text) return;
    Clipboard.setString(message.text);
    setCopied(true);

    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      // Ignorer si les haptics ne sont pas dispos
    }

    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Animated.View
      style={[
        styles.messageContainer,
        message.sender === 'user' ? styles.userMessage : styles.aynaMessage,
      ]}
      entering={message.sender === 'user'
        ? SlideInRight.duration(300).springify()
        : SlideInLeft.duration(300).springify()}
    >
      <Animated.View
        style={[
          styles.messageBubble,
          message.sender === 'user'
            ? { backgroundColor: theme.colors.accent }
            : { backgroundColor: theme.colors.backgroundSecondary },
        ]}
        entering={FadeInDown.duration(200)}
      >
        <Text
          style={[
            styles.messageText,
            {
              color: message.sender === 'user' ? '#0A0F2C' : theme.colors.text,
            },
          ]}
        >
          {message.text}
        </Text>

        <View style={styles.messageFooter}>
          <Text
            style={[
              styles.messageTime,
              {
                color:
                  message.sender === 'user'
                    ? 'rgba(10, 15, 44, 0.6)'
                    : theme.colors.textSecondary,
              },
            ]}
          >
            {formatTime(message.timestamp)}
          </Text>

          {message.sender === 'ayna' && (
            <Pressable
              onPress={handleCopy}
              style={({ pressed }) => [
                styles.copyButton,
                pressed && { opacity: 0.7 }
              ]}
              hitSlop={8}
            >
              {copied ? (
                <Check size={14} color={theme.colors.accent} />
              ) : (
                <Copy size={14} color={theme.colors.textSecondary} />
              )}
            </Pressable>
          )}
        </View>
      </Animated.View>
    </Animated.View>
  );
}, (prevProps, nextProps) => {
  // Comparaison personnalisée pour éviter les re-renders inutiles
  return (
    prevProps.message.id === nextProps.message.id &&
    prevProps.message.text === nextProps.message.text &&
    prevProps.message.liked === nextProps.message.liked &&
    prevProps.theme.colors.accent === nextProps.theme.colors.accent &&
    prevProps.theme.colors.backgroundSecondary === nextProps.theme.colors.backgroundSecondary
  );
});

MessageItem.displayName = 'MessageItem';

const styles = StyleSheet.create({
  messageContainer: {
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  userMessage: {
    alignItems: 'flex-end',
  },
  aynaMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '85%',
    padding: 12,
    borderRadius: 16,
  },
  messageText: {
    fontSize: 16,
    fontFamily: 'System',
    marginBottom: 4,
    lineHeight: 22,
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
    gap: 8,
  },
  messageTime: {
    fontSize: 11,
    fontFamily: 'System',
  },
  copyButton: {
    padding: 2,
    marginLeft: 4,
  },
});

