import React from 'react';
import {StyleSheet, Text, View} from 'react-native';

import {colors, radius, spacing} from '../../../shared/theme/tokens';

type ProgressBarProps = {
  value: number;
  label?: string;
};

export function ProgressBar({value, label}: ProgressBarProps): React.JSX.Element {
  const normalizedValue = Math.min(100, Math.max(0, value));
  const displayValue = Math.round(normalizedValue);

  return (
    <View
      accessibilityLabel={`${label ?? '完成进度'} ${displayValue}%`}
      accessibilityRole="progressbar"
      accessibilityValue={{min: 0, max: 100, now: displayValue}}
      style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label ?? '完成进度'}</Text>
        <Text style={styles.value}>{displayValue}%</Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, {width: `${normalizedValue}%`}]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {gap: spacing.xs},
  labelRow: {flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm},
  label: {color: colors.mutedText, fontSize: 13, lineHeight: 20},
  value: {color: colors.brand, fontSize: 13, lineHeight: 20, fontWeight: '700'},
  track: {height: 8, overflow: 'hidden', borderRadius: radius.sm, backgroundColor: '#E5EEF2'},
  fill: {height: '100%', borderRadius: radius.sm, backgroundColor: colors.brand},
});
