import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeInDown, FadeInRight, SlideInRight, SlideInLeft } from 'react-native-reanimated';
import { Message } from '@/pages/Chat';

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
  index?: number;
}

/**
 * Composant mémorisé pour afficher un message dans le chat
 */
export const MessageItem = React.memo<MessageItemProps>(({ message, theme, formatTime, index = 0 }) => {
  // Animation staggerée basée sur l'index
  const staggerDelay = index * 30; // 30ms entre chaque message
  
  return (
    <Animated.View
      style={[
        styles.messageContainer,
        message.sender === 'user' ? styles.userMessage : styles.aynaMessage,
      ]}
      entering={message.sender === 'user' 
        ? SlideInRight.delay(staggerDelay).duration(300).springify()
        : SlideInLeft.delay(staggerDelay).duration(300).springify()}
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
      </Animated.View>
    </Animated.View>
  );
}, (prevProps, nextProps) => {
  // Comparaison personnalisée pour éviter les re-renders inutiles
  // Note: index n'est pas comparé car il peut changer sans affecter le rendu
  return (
    prevProps.message.id === nextProps.message.id &&
    prevProps.message.text === nextProps.message.text &&
    prevProps.message.sender === nextProps.message.sender &&
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
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
  },
  messageText: {
    fontSize: 16,
    fontFamily: 'System',
    marginBottom: 4,
  },
  messageTime: {
    fontSize: 12,
    fontFamily: 'System',
  },
});

