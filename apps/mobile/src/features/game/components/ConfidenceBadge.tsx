import React from 'react';
import {StyleSheet, Text, View} from 'react-native';

import {colors, radius, spacing} from '../../../shared/theme/tokens';
import type {GameConfidence} from '../types/game';

const labels: Record<GameConfidence, string> = {
  high: '高',
  medium: '中',
  low: '低',
};

export function ConfidenceBadge({confidence}: {confidence: GameConfidence}): React.JSX.Element {
  return (
    <View accessibilityLabel={`置信度${labels[confidence]}`} style={[styles.badge, styles[confidence]]}>
      <Text style={[styles.text, styles[`${confidence}Text`]]}>置信度：{labels[confidence]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {alignSelf: 'flex-start', paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: radius.sm},
  text: {fontSize: 13, lineHeight: 20, fontWeight: '700'},
  high: {backgroundColor: '#E7F6EC'},
  medium: {backgroundColor: '#FFF4D6'},
  low: {backgroundColor: '#FCEAE6'},
  highText: {color: colors.success},
  mediumText: {color: '#8A5B00'},
  lowText: {color: colors.coral},
});
