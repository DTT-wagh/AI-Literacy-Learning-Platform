import React from 'react';
import {StyleSheet, Text, View} from 'react-native';

import {colors, radius, spacing} from '../../../shared/theme/tokens';

export function SafetyNotice({message}: {message: string | null}): React.JSX.Element | null {
  if (!message) return null;
  return (
    <View accessibilityLiveRegion="assertive" style={styles.notice}>
      <Text style={styles.title}>安全提醒</Text>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  notice: {gap: spacing.xs, padding: spacing.md, borderWidth: 1, borderColor: '#E8B0A7', borderRadius: radius.md, backgroundColor: '#FFF4F1'},
  title: {color: '#A3483A', fontSize: 14, lineHeight: 20, fontWeight: '800'},
  message: {color: colors.text, fontSize: 14, lineHeight: 21},
});
