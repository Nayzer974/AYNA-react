import React, { useRef, useState } from 'react';
import {
  View,
  FlatList,
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ViewToken,
  StyleSheet,
  ListRenderItem,
  Pressable,
} from 'react-native';
// Animations supprimées pour améliorer les performances

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface CarouselProps<T> {
  data: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  itemWidth?: number;
  onIndexChange?: (index: number) => void;
  onItemPress?: (item: T, index: number) => void;
  autoPlay?: boolean;
  autoPlayInterval?: number;
  showIndicators?: boolean;
  indicatorActiveColor?: string;
  indicatorInactiveColor?: string;
}

export function Carousel<T>({
  data,
  renderItem,
  itemWidth = SCREEN_WIDTH - 64,
  onIndexChange,
  onItemPress,
  autoPlay = false,
  autoPlayInterval = 5000,
  showIndicators = false,
  indicatorActiveColor = '#fff',
  indicatorInactiveColor = 'rgba(255, 255, 255, 0.3)',
}: CarouselProps<T>) {
  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / itemWidth);
    
    if (index !== currentIndex && index >= 0 && index < data.length) {
      setCurrentIndex(index);
      onIndexChange?.(index);
    }
  };

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0) {
        const index = viewableItems[0].index;
        if (index !== null && index !== undefined && index !== currentIndex) {
          setCurrentIndex(index);
          onIndexChange?.(index);
        }
      }
    }
  ).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  // Auto-play functionality
  React.useEffect(() => {
    if (!autoPlay || data.length <= 1) return;

    const interval = setInterval(() => {
      const nextIndex = (currentIndex + 1) % data.length;
      flatListRef.current?.scrollToIndex({
        index: nextIndex,
        animated: true,
      });
      setCurrentIndex(nextIndex);
      onIndexChange?.(nextIndex);
    }, autoPlayInterval);

    return () => clearInterval(interval);
  }, [autoPlay, autoPlayInterval, currentIndex, data.length, onIndexChange]);

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={data}
        renderItem={({ item, index }) => (
          <View
            style={[styles.itemContainer, { width: itemWidth }]}
          >
            {onItemPress ? (
              <Pressable onPress={() => onItemPress(item, index)} style={{ width: '100%' }}>
            {renderItem(item, index)}
              </Pressable>
            ) : (
              renderItem(item, index)
            )}
          </View>
        )}
        keyExtractor={(_, index) => `carousel-item-${index}`}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        snapToInterval={itemWidth}
        decelerationRate="fast"
        getItemLayout={(_, index) => ({
          length: itemWidth,
          offset: itemWidth * index,
          index,
        })}
        onScrollToIndexFailed={(info) => {
          // Fallback if scrollToIndex fails
          const wait = new Promise((resolve) => setTimeout(resolve, 500));
          wait.then(() => {
            flatListRef.current?.scrollToIndex({
              index: info.index,
              animated: true,
            });
          });
        }}
      />
      {showIndicators && (
        <View style={styles.indicatorsContainer}>
          {data.map((_, index) => (
            <View
              key={`indicator-${index}`}
              style={[
                styles.indicator,
                {
                  backgroundColor:
                    index === currentIndex
                      ? indicatorActiveColor
                      : indicatorInactiveColor,
                },
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  itemContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  indicatorsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    gap: 8,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});

