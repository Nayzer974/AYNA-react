import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
  ListRenderItem,
  ScrollView,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const ANIMATION_DURATION = 300;
const STAGGER_DELAY = 50;

export interface AnimatedListItem {
  id: string;
  label: string;
  value?: any;
}

interface AnimatedListProps {
  data: AnimatedListItem[];
  onItemSelect?: (item: AnimatedListItem, index: number) => void;
  selectedItemId?: string;
  itemHeight?: number;
  gradientHeight?: number;
  gradientColors?: {
    top: [string, string, ...string[]];
    bottom: [string, string, ...string[]];
  };
  renderItem?: (item: AnimatedListItem, index: number, isSelected: boolean) => React.ReactNode;
  contentContainerStyle?: any;
  style?: any;
  scrollEnabled?: boolean;
}

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export function AnimatedList({
  data,
  onItemSelect,
  selectedItemId,
  itemHeight = 60,
  gradientHeight = 40,
  gradientColors = {
    top: ['rgba(0, 0, 0, 0.3)', 'rgba(0, 0, 0, 0)'] as [string, string],
    bottom: ['rgba(0, 0, 0, 0)', 'rgba(0, 0, 0, 0.3)'] as [string, string],
  },
  renderItem,
  contentContainerStyle,
  style,
  scrollEnabled = true,
}: AnimatedListProps) {
  const flatListRef = useRef<FlatList>(null);
  const [showTopGradient, setShowTopGradient] = React.useState(false);
  const [showBottomGradient, setShowBottomGradient] = React.useState(false);

  const handleScroll = (event: any) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const scrollY = contentOffset.y;
    const contentHeight = contentSize.height;
    const containerHeight = layoutMeasurement.height;

    // Afficher le gradient du haut si on n'est pas en haut
    setShowTopGradient(scrollY > 10);

    // Afficher le gradient du bas si on n'est pas en bas
    setShowBottomGradient(scrollY + containerHeight < contentHeight - 10);
  };

  const handleItemPress = (item: AnimatedListItem, index: number) => {
    onItemSelect?.(item, index);
  };

  const renderListItem: ListRenderItem<AnimatedListItem> = ({ item, index }) => {
    const isSelected = selectedItemId === item.id;

    if (renderItem) {
      return (
        <AnimatedTouchableOpacity
          entering={FadeIn.duration(ANIMATION_DURATION).delay(index * STAGGER_DELAY)}
          exiting={FadeOut.duration(200)}
          onPress={() => handleItemPress(item, index)}
          activeOpacity={0.7}
        >
          {renderItem(item, index, isSelected)}
        </AnimatedTouchableOpacity>
      );
    }

    return (
      <AnimatedTouchableOpacity
        entering={FadeIn.duration(ANIMATION_DURATION).delay(index * STAGGER_DELAY)}
        exiting={FadeOut.duration(200)}
        style={[styles.itemContainer, { height: itemHeight }]}
        onPress={() => handleItemPress(item, index)}
        activeOpacity={0.7}
      >
        <View
          style={[
            styles.itemContent,
            isSelected && styles.itemSelected,
          ]}
        >
          <Text style={[styles.itemText, isSelected && styles.itemTextSelected]}>
            {item.label}
          </Text>
          {isSelected && (
            <Animated.View
              entering={FadeIn.duration(200)}
              style={styles.checkmark}
            >
              <Text style={styles.checkmarkText}>✓</Text>
            </Animated.View>
          )}
        </View>
      </AnimatedTouchableOpacity>
    );
  };

  // Si scrollEnabled est false, utiliser un ScrollView interne pour éviter l'imbrication avec FlatList
  if (!scrollEnabled) {
    return (
      <View style={[styles.container, style]}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.listContent, contentContainerStyle]}
          showsVerticalScrollIndicator={true}
          nestedScrollEnabled={true}
        >
          {data.map((item, index) => {
            const isSelected = selectedItemId === item.id;
            return (
              <React.Fragment key={item.id}>
                {renderListItem({ item, index } as any)}
                {index < data.length - 1 && <View style={styles.separator} />}
              </React.Fragment>
            );
          })}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      {/* Gradient du haut */}
      {showTopGradient && (
        <LinearGradient
          colors={gradientColors.top}
          style={[styles.gradient, styles.gradientTop, { height: gradientHeight }]}
          pointerEvents="none"
        />
      )}

      {/* Liste */}
      <FlatList
        ref={flatListRef}
        data={data}
        renderItem={renderListItem}
        keyExtractor={(item) => item.id}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        scrollEnabled={scrollEnabled}
        contentContainerStyle={[
          styles.listContent,
          contentContainerStyle,
        ]}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />

      {/* Gradient du bas */}
      {showBottomGradient && (
        <LinearGradient
          colors={gradientColors.bottom}
          style={[styles.gradient, styles.gradientBottom, { height: gradientHeight }]}
          pointerEvents="none"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  listContent: {
    paddingVertical: 8,
  },
  itemContainer: {
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  itemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  itemSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  itemText: {
    fontSize: 16,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.9)',
    fontFamily: 'System',
  },
  itemTextSelected: {
    fontWeight: '600',
    color: '#fff',
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'System',
  },
  separator: {
    height: 8,
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 1,
  },
  gradientTop: {
    top: 0,
  },
  gradientBottom: {
    bottom: 0,
  },
});

