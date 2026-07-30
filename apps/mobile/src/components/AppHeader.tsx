import React from 'react';
import {StyleSheet, Text, View} from 'react-native';

import {colors, spacing} from '../shared/theme/tokens';

export function AppHeader(): React.JSX.Element {
  return (
    <View style={styles.header}>
      <View>
        <Text style={styles.brand}>智趣AI学堂</Text>
        <Text style={styles.greeting}>下午好，准备探索 AI 吗？</Text>
      </View>
      <View accessibilityLabel="今日学习进度" style={styles.progressBadge}>
        <Text style={styles.progressText}>1/3</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  brand: {
    color: colors.brand,
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '700',
  },
  greeting: {
    color: colors.mutedText,
    fontSize: 16,
    lineHeight: 24,
  },
  progressBadge: {
    minWidth: 48,
    minHeight: 48,
    borderRadius: 24,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressText: {
    color: colors.brand,
    fontSize: 14,
    fontWeight: '700',
  },
});
