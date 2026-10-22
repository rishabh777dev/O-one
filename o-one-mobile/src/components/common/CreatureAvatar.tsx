import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, { Path, Rect, Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { Pencil } from 'lucide-react-native';

export const CREATURE_COLORS = [
  '#EF4444', // Red
  '#F97316', // Orange
  '#F59E0B', // Amber / Yellow
  '#10B981', // Emerald / Green
  '#06B6D4', // Cyan / Mint
  '#3B82F6', // Blue
  '#8B5CF6', // Purple
  '#EC4899', // Pink
];

interface CreatureAvatarProps {
  shapeIndex?: number;
  color?: string;
  size?: number;
  showGlow?: boolean;
  isEditable?: boolean;
  onEditPress?: () => void;
}

export const CreatureAvatar: React.FC<CreatureAvatarProps> = ({
  shapeIndex = 0,
  color = '#3B82F6',
  size = 48,
  showGlow = false,
  isEditable = false,
  onEditPress,
}) => {
  const normIndex = Math.abs(shapeIndex) % 12;

  // Render the specific creature body and eyes based on index
  const renderShape = () => {
    switch (normIndex) {
      case 0: // Steve: Iconic Blue Circle with two slanted pill eyes in top-right (matching dense_015 / dense_041)
        return (
          <>
            <Circle cx="50" cy="50" r="42" fill={color} />
            <Rect x="52" y="32" width="6" height="13" rx="3" fill="#FFFFFF" transform="rotate(22 52 32)" />
            <Rect x="67" y="38" width="6" height="13" rx="3" fill="#FFFFFF" transform="rotate(22 67 38)" />
          </>
        );

      case 1: // Triangle with horizontal eyes
        return (
          <>
            <Path
              d="M 50 14 C 54 14 58 18 61 24 L 88 68 C 92 75 88 84 79 84 L 21 84 C 12 84 8 75 12 68 L 39 24 C 42 18 46 14 50 14 Z"
              fill={color}
            />
            <Rect x="38" y="52" width="7" height="3" rx="1.5" fill="#FFFFFF" />
            <Rect x="55" y="52" width="7" height="3" rx="1.5" fill="#FFFFFF" />
          </>
        );

      case 2: // Cute circle with tilted eyes
        return (
          <>
            <Circle cx="50" cy="50" r="42" fill={color} />
            <Circle cx="38" cy="46" r="3.5" fill="#FFFFFF" />
            <Circle cx="62" cy="46" r="3.5" fill="#FFFFFF" />
          </>
        );

      case 3: // Bean / asymmetric blob with eyes on right
        return (
          <>
            <Path
              d="M 50 10 C 74 10 90 28 90 52 C 90 74 72 90 48 90 C 24 90 10 74 10 50 C 10 26 26 10 50 10 Z"
              fill={color}
            />
            <Rect x="54" y="38" width="5" height="12" rx="2.5" fill="#FFFFFF" transform="rotate(25 54 38)" />
            <Rect x="68" y="44" width="5" height="12" rx="2.5" fill="#FFFFFF" transform="rotate(25 68 44)" />
          </>
        );

      case 4: // Hexagon with tiny eyes
        return (
          <>
            <Path
              d="M 50 12 L 84 31 L 84 69 L 50 88 L 16 69 L 16 31 Z"
              fill={color}
            />
            <Circle cx="42" cy="50" r="3" fill="#FFFFFF" />
            <Circle cx="58" cy="50" r="3" fill="#FFFFFF" />
          </>
        );

      case 5: // Cloud creature
        return (
          <>
            <Path
              d="M 32 30 C 22 30 14 38 14 48 C 14 58 22 66 32 66 L 68 66 C 78 66 86 58 86 48 C 86 38 78 30 68 30 C 66 22 58 16 50 16 C 42 16 34 22 32 30 Z"
              fill={color}
            />
            <Circle cx="44" cy="44" r="3" fill="#FFFFFF" />
            <Circle cx="56" cy="44" r="3" fill="#FFFFFF" />
          </>
        );

      case 6: // Roger: Horizontal rounded bean with centered slit eyes (matching dense_041)
        return (
          <>
            <Rect x="12" y="24" width="76" height="52" rx="26" fill={color} />
            <Rect x="38" y="48" width="7" height="4" rx="2" fill="#FFFFFF" />
            <Rect x="56" y="48" width="7" height="4" rx="2" fill="#FFFFFF" />
          </>
        );

      case 7: // Rounded triangle with angry/focused eyes
        return (
          <>
            <Path
              d="M 50 14 C 54 14 58 18 61 24 L 88 68 C 92 75 88 84 79 84 L 21 84 C 12 84 8 75 12 68 L 39 24 C 42 18 46 14 50 14 Z"
              fill={color}
            />
            <Rect x="37" y="52" width="8" height="3" rx="1.5" fill="#FFFFFF" transform="rotate(15 37 52)" />
            <Rect x="55" y="54" width="8" height="3" rx="1.5" fill="#FFFFFF" transform="rotate(-15 55 54)" />
          </>
        );

      case 8: // Soft square with 2 close dots
        return (
          <>
            <Rect x="14" y="14" width="72" height="72" rx="24" fill={color} />
            <Circle cx="43" cy="50" r="3.5" fill="#FFFFFF" />
            <Circle cx="57" cy="50" r="3.5" fill="#FFFFFF" />
          </>
        );

      case 9: // Capsule with horizontal slits
        return (
          <>
            <Rect x="16" y="28" width="68" height="44" rx="22" fill={color} />
            <Rect x="38" y="48" width="6" height="4" rx="2" fill="#FFFFFF" />
            <Rect x="56" y="48" width="6" height="4" rx="2" fill="#FFFFFF" />
          </>
        );

      case 10: // Tall vertical bean with vertical pill eyes
        return (
          <>
            <Rect x="24" y="14" width="52" height="72" rx="26" fill={color} />
            <Rect x="42" y="46" width="3.5" height="9" rx="1.7" fill="#FFFFFF" />
            <Rect x="54" y="46" width="3.5" height="9" rx="1.7" fill="#FFFFFF" />
          </>
        );

      default: // Round with wide apart eyes
        return (
          <>
            <Circle cx="50" cy="50" r="40" fill={color} />
            <Circle cx="35" cy="50" r="3.5" fill="#FFFFFF" />
            <Circle cx="65" cy="50" r="3.5" fill="#FFFFFF" />
          </>
        );
    }
  };

  return (
    <View style={[styles.wrapper, { width: size, height: size }]}>
      {/* Optional ambient background glow */}
      {showGlow && (
        <View
          style={[
            styles.glowEffect,
            {
              backgroundColor: color,
              width: size * 1.6,
              height: size * 1.6,
              borderRadius: (size * 1.6) / 2,
            },
          ]}
        />
      )}

      <Svg width={size} height={size} viewBox="0 0 100 100">
        {renderShape()}
      </Svg>

      {/* Pencil edit badge */}
      {isEditable && (
        <TouchableOpacity
          style={styles.pencilBadge}
          onPress={onEditPress}
          activeOpacity={0.8}
        >
          <Pencil size={11} color="#FFFFFF" strokeWidth={2.4} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  glowEffect: {
    position: 'absolute',
    opacity: 0.18,
    filter: 'blur(28px)',
  },
  pencilBadge: {
    position: 'absolute',
    right: -4,
    bottom: -4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#26262B',
    borderWidth: 1.5,
    borderColor: '#121214',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
