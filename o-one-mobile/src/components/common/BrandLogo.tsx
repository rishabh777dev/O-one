import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import Svg, { Circle, Rect } from 'react-native-svg';

interface BrandLogoProps {
  size?: number;
  fontSize?: number;
  color?: string;
  showText?: boolean;
  subtext?: string;
  onPress?: () => void;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 24,
  fontSize = 20,
  color = '#2563EB',
  showText = true,
  subtext,
  onPress,
}) => {
  // Eye glance micro-animation
  const eyeShift = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(4000),
        Animated.timing(eyeShift, {
          toValue: 2,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.delay(1200),
        Animated.timing(eyeShift, {
          toValue: -2,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.delay(1500),
        Animated.timing(eyeShift, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const content = (
    <View style={styles.container}>
      {/* The "O" Agent Face Glyph */}
      <View style={[styles.avatarGlyph, { width: size, height: size }]}>
        <Svg width={size} height={size} viewBox="0 0 100 100">
          {/* Circular Face Contour */}
          <Circle cx="50" cy="50" r="46" fill={color} />

          {/* Slanted Pill Eyes (Steve Signature Geometry) */}
          <Rect
            x="54"
            y="32"
            width="7.5"
            height="16"
            rx="3.75"
            fill="#FFFFFF"
            transform="rotate(22 54 32)"
          />
          <Rect
            x="71"
            y="39"
            width="7.5"
            height="16"
            rx="3.75"
            fill="#FFFFFF"
            transform="rotate(22 71 39)"
          />
        </Svg>
      </View>

      {/* The "one" Text */}
      {showText && (
        <View style={styles.textRow}>
          <Text style={[styles.brandWord, { fontSize }]}>
            {' '}one
          </Text>
          {subtext && (
            <View style={styles.subtextBadge}>
              <Text style={styles.subtext}>{subtext}</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.7} onPress={onPress}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarGlyph: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 999,
    overflow: 'hidden',
  },
  textRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandWord: {
    color: '#FFFFFF',
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  subtextBadge: {
    marginLeft: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: '#27272A',
  },
  subtext: {
    color: '#A1A1AA',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
});
