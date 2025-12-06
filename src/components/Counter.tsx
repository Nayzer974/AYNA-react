import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

interface CounterProps {
  value: number;
  fontSize?: number;
  padding?: number;
  places?: number[];
  gap?: number;
  textColor?: string;
  fontWeight?: string | number;
  containerStyle?: any;
}

function Digit({ place, value, height, fontSize, textColor, fontWeight }: {
  place: number;
  value: number;
  height: number;
  fontSize: number;
  textColor: string;
  fontWeight: string | number;
}) {
  const valueRoundedToPlace = Math.floor(value / place);
  const animatedValue = useSharedValue(valueRoundedToPlace);

  useEffect(() => {
    const newValue = Math.floor(value / place);
    animatedValue.value = withSpring(newValue, {
      damping: 20,
      stiffness: 100,
    });
  }, [value, place, animatedValue]);

  const digit = valueRoundedToPlace % 10;

  return (
    <View style={[styles.digitContainer, { height, width: fontSize * 0.7, paddingHorizontal: 4 }]}>
      <Text
        style={[
          styles.number,
          {
            fontSize,
            color: textColor,
            fontWeight: fontWeight as any,
          },
        ]}
      >
        {digit}
      </Text>
    </View>
  );
}

export default function Counter({
  value,
  fontSize = 100,
  padding = 0,
  places = [100, 10, 1],
  gap = 8,
  textColor = 'white',
  fontWeight = 'bold',
  containerStyle,
}: CounterProps) {
  const height = fontSize + padding;

  return (
    <View style={[styles.container, containerStyle]}>
      <View style={[styles.counter, { gap }]}>
        {places.map((place) => (
          <Digit
            key={place}
            place={place}
            value={value}
            height={height}
            fontSize={fontSize}
            textColor={textColor}
            fontWeight={fontWeight}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'visible',
    flexShrink: 1,
  },
  counter: {
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'visible',
    flexShrink: 1,
  },
  digitContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
    flexShrink: 0,
  },
  number: {
    fontVariant: ['tabular-nums'],
    textAlign: 'center',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
});
