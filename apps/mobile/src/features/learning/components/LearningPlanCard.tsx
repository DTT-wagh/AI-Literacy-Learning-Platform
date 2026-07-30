import React from 'react';
import {StyleSheet, Text, View} from 'react-native';

import {colors, radius, spacing} from '../../../shared/theme/tokens';

export function LearningPlanCard(): React.JSX.Element {
  return <View accessibilityLabel="学习计划暂未开放" style={styles.card}>
    <View style={styles.copy}><Text style={styles.title}>学习计划暂未开放</Text><Text style={styles.description}>计划服务接入后，会根据真实学习记录展示进度。</Text></View>
  </View>;
}

const styles = StyleSheet.create({
  card: {gap: spacing.sm, padding: spacing.md, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, backgroundColor: colors.surface},
  copy: {gap: spacing.xs},
  title: {color: colors.text, fontSize: 17, lineHeight: 24, fontWeight: '700'},
  description: {color: colors.mutedText, fontSize: 14, lineHeight: 20},
});
