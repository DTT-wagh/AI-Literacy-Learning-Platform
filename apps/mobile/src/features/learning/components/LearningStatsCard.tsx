import React from 'react';
import {StyleSheet, Text, View} from 'react-native';

import type {LearningStats} from '../../../api/learning';
import {colors, radius, spacing} from '../../../shared/theme/tokens';

export function LearningStatsCard({stats}: {stats: LearningStats}): React.JSX.Element {
  return <View style={styles.card}>
    <StatItem label="学习课程" value={`${stats.courseCount}`} />
    <StatItem label="完成章节" value={`${stats.lessonCount}`} />
    <StatItem label="学习分钟" value={`${stats.studyMinutes}`} />
  </View>;
}

function StatItem({label, value}: {label: string; value: string}): React.JSX.Element {
  return <View style={styles.item}><Text style={styles.value}>{value}</Text><Text style={styles.label}>{label}</Text></View>;
}

const styles = StyleSheet.create({
  card: {flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm, padding: spacing.lg, borderRadius: radius.lg, backgroundColor: colors.brand},
  item: {flex: 1, alignItems: 'center', gap: spacing.xs},
  value: {color: colors.surface, fontSize: 24, lineHeight: 32, fontWeight: '700'},
  label: {color: '#D8F5F7', fontSize: 13, lineHeight: 20, textAlign: 'center'},
});
