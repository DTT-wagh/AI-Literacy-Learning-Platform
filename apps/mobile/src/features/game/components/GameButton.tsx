import React from 'react';
import {Pressable, StyleSheet, Text} from 'react-native';

import {colors, radius, spacing} from '../../../shared/theme/tokens';

type GameButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary';
  testID?: string;
};

export function GameButton({
  label,
  onPress,
  disabled = false,
  variant = 'primary',
  testID,
}: GameButtonProps): React.JSX.Element {
  const secondary = variant === 'secondary';

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      testID={testID}
      style={({pressed}) => [
        styles.button,
        secondary ? styles.secondary : styles.primary,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
      ]}>
      <Text
        style={[
          styles.label,
          secondary ? styles.secondaryLabel : styles.primaryLabel,
        ]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
  },
  primary: {backgroundColor: colors.brand},
  secondary: {
    borderWidth: 1,
    borderColor: colors.brand,
    backgroundColor: colors.surface,
  },
  label: {fontSize: 16, lineHeight: 24, fontWeight: '700', textAlign: 'center'},
  primaryLabel: {color: colors.surface},
  secondaryLabel: {color: colors.brand},
  disabled: {opacity: 0.45},
  pressed: {opacity: 0.8},
});
