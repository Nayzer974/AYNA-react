import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Pressable,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import { X, Plus, Trash2 } from 'lucide-react-native';
import { Swipeable } from 'react-native-gesture-handler';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MENU_WIDTH = SCREEN_WIDTH * 0.75;
const ANIMATION_DURATION = 300;
const STAGGER_DELAY = 50;

export interface StaggeredMenuItem {
  id: string;
  title: string;
  subtitle?: string;
  timestamp?: Date;
  onPress: () => void;
  onDelete?: () => void;
}

interface StaggeredMenuProps {
  visible: boolean;
  items: StaggeredMenuItem[];
  onClose: () => void;
  theme: any;
  emptyMessage?: string;
  onNewConversation?: () => void;
  showNewConversationButton?: boolean;
}

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface ConversationItemProps {
  item: StaggeredMenuItem;
  index: number;
  theme: any;
  formatDate: (date: Date) => string;
  onPress: () => void;
  onDelete?: () => void;
}

function ConversationItem({ item, index, theme, formatDate, onPress, onDelete }: ConversationItemProps) {
  const renderRightActions = () => {
    if (!onDelete) return null;
    
    return (
      <View style={styles.deleteButtonContainer}>
        <Pressable
          onPress={onDelete}
          style={[styles.deleteButton, { backgroundColor: '#EF4444' }]}
        >
          <Trash2 size={20} color="#FFFFFF" />
        </Pressable>
      </View>
    );
  };

  return (
    <View style={styles.swipeableWrapper}>
      <Swipeable
        renderRightActions={renderRightActions}
        overshootRight={false}
        rightThreshold={40}
        containerStyle={styles.swipeableContainer}
      >
        <Animated.View
          entering={FadeIn.duration(ANIMATION_DURATION).delay(index * STAGGER_DELAY)}
          exiting={FadeOut.duration(200)}
          style={[
            styles.menuItem,
            {
              borderColor: 'rgba(255, 255, 255, 0.1)',
            },
          ]}
        >
          <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.6}
            style={styles.menuItemTouchable}
          >
            <View style={styles.menuItemContent}>
              <View style={styles.menuItemTextContainer}>
                <View style={styles.menuItemHeaderRow}>
                  <Text
                    style={[styles.menuItemTitle, { color: theme.colors.text }]}
                    numberOfLines={1}
                  >
                    {item.title || 'Sans titre'}
                  </Text>
                  {item.timestamp && (
                    <Text
                      style={[styles.menuItemTime, { color: theme.colors.text }]}
                    >
                      {formatDate(item.timestamp)}
                    </Text>
                  )}
                </View>
                {item.subtitle && (
                  <Text
                    style={[styles.menuItemSubtitle, { color: theme.colors.text }]}
                    numberOfLines={1}
                  >
                    {item.subtitle}
                  </Text>
                )}
              </View>
            </View>
          </TouchableOpacity>
        </Animated.View>
      </Swipeable>
    </View>
  );
}

export function StaggeredMenu({
  visible,
  items,
  onClose,
  theme,
  emptyMessage = 'Aucune conversation',
  onNewConversation,
  showNewConversationButton = true,
}: StaggeredMenuProps) {
  const menuOpacity = useSharedValue(0);
  const menuTranslateX = useSharedValue(-MENU_WIDTH);

  useEffect(() => {
    if (visible) {
      menuOpacity.value = withTiming(1, {
        duration: ANIMATION_DURATION,
        easing: Easing.out(Easing.ease),
      });
      menuTranslateX.value = withTiming(0, {
        duration: ANIMATION_DURATION,
        easing: Easing.out(Easing.back(1.1)),
      });
    } else {
      menuOpacity.value = withTiming(0, {
        duration: ANIMATION_DURATION,
        easing: Easing.in(Easing.ease),
      });
      menuTranslateX.value = withTiming(-MENU_WIDTH, {
        duration: ANIMATION_DURATION,
        easing: Easing.in(Easing.ease),
      });
    }
  }, [visible]);

  const overlayStyle = useAnimatedStyle(() => {
    return {
      opacity: menuOpacity.value,
      pointerEvents: visible ? 'auto' : 'none',
    };
  });

  const menuStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: menuTranslateX.value }],
    };
  });

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) {
      return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return 'Hier';
    } else if (days < 7) {
      return `Il y a ${days} jours`;
    } else {
      return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
    }
  };

  if (!visible) return null;

  return (
    <>
      {/* Overlay */}
      <AnimatedPressable
        style={[styles.overlay, overlayStyle]}
        onPress={onClose}
      />

      {/* Menu */}
      <Animated.View
        style={[
          styles.menuContainer,
          {
            backgroundColor: theme.colors.backgroundSecondary,
            borderRightColor: 'rgba(255, 255, 255, 0.1)',
          },
          menuStyle,
        ]}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: 'rgba(255, 255, 255, 0.1)' }]}>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
            Conversations
          </Text>
          <Pressable onPress={onClose} style={styles.closeButton}>
            <X size={24} color={theme.colors.text} />
          </Pressable>
        </View>

        {/* Bouton Nouvelle conversation */}
        {showNewConversationButton && onNewConversation && (
          <Animated.View
            entering={FadeIn.duration(ANIMATION_DURATION)}
            style={[styles.newConversationButton, { borderBottomColor: 'rgba(255, 255, 255, 0.1)' }]}
          >
            <TouchableOpacity
              onPress={() => {
                onNewConversation();
                onClose();
              }}
              style={[
                styles.newConversationButtonContent,
                { backgroundColor: theme.colors.accent },
              ]}
              activeOpacity={0.8}
            >
              <Plus size={20} color="#0A0F2C" />
              <Text style={[styles.newConversationButtonText, { color: '#0A0F2C' }]}>
                Nouvelle conversation
              </Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Items */}
        <View style={styles.itemsContainer}>
          {items.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                {emptyMessage}
              </Text>
            </View>
          ) : (
            items.map((item, index) => (
              <ConversationItem
                key={item.id}
                item={item}
                index={index}
                theme={theme}
                formatDate={formatDate}
                onPress={() => {
                  item.onPress();
                  onClose();
                }}
                onDelete={item.onDelete}
              />
            ))
          )}
        </View>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 999,
  },
  menuContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: MENU_WIDTH,
    zIndex: 1000,
    borderRightWidth: StyleSheet.hairlineWidth,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingTop: 8,
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: '700',
    fontFamily: 'System',
    letterSpacing: 0.4,
  },
  closeButton: {
    padding: 8,
  },
  itemsContainer: {
    flex: 1,
    padding: 0,
    backgroundColor: 'transparent',
  },
  menuItem: {
    marginBottom: 0,
    borderRadius: 0,
    borderWidth: 0,
    minHeight: 76,
    backgroundColor: 'transparent',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  menuItemContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 76,
    justifyContent: 'center',
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemTitle: {
    fontSize: 17,
    fontWeight: '400',
    fontFamily: 'System',
    marginBottom: 2,
    flexShrink: 1,
    flex: 1,
    letterSpacing: -0.4,
  },
  menuItemSubtitle: {
    fontSize: 15,
    fontFamily: 'System',
    marginBottom: 0,
    flexShrink: 1,
    flex: 1,
    opacity: 0.6,
    letterSpacing: -0.3,
  },
  menuItemTime: {
    fontSize: 15,
    fontFamily: 'System',
    marginTop: 0,
    marginLeft: 8,
    opacity: 0.5,
    fontWeight: '400',
    letterSpacing: -0.3,
    flexShrink: 0,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: 'System',
    textAlign: 'center',
  },
  newConversationButton: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  newConversationButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
  },
  newConversationButtonText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'System',
  },
  menuItemTouchable: {
    width: '100%',
    minHeight: 76,
    backgroundColor: 'transparent',
  },
  menuItemTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  menuItemHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  swipeableWrapper: {
    marginBottom: 0,
    width: '100%',
    backgroundColor: 'transparent',
  },
  swipeableContainer: {
    width: '100%',
    backgroundColor: 'transparent',
  },
  deleteButtonContainer: {
    justifyContent: 'center',
    alignItems: 'flex-end',
    marginBottom: 0,
    minHeight: 76,
    width: 80,
    paddingRight: 16,
  },
  deleteButton: {
    width: 64,
    minHeight: 64,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 32,
    marginRight: 8,
  },
});

