import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';

import {colors, radius, spacing} from '../../../shared/theme/tokens';
import type {LearningCourseCardData} from './LearningCourseCard';

type LearningContinueCardProps = {
  item: LearningCourseCardData;
  onContinue: () => void;
};

export function LearningContinueCard({item, onContinue}: LearningContinueCardProps): React.JSX.Element {
  const progress = Math.min(100, Math.max(0, item.record.progress));
  return <View style={styles.card}>
    <Text style={styles.eyebrow}>当前课程</Text>
    <Text numberOfLines={2} style={styles.title}>{item.courseTitle}</Text>
    <Text numberOfLines={1} style={styles.lesson}>第 {item.record.lessonId} 章 · {item.lessonTitle}</Text>
    <View style={styles.progressRow}><Text style={styles.progressLabel}>学习进度</Text><Text style={styles.progressValue}>{progress}%</Text></View>
    <View style={styles.progressTrack}><View style={[styles.progressFill, {width: `${progress}%`}]} /></View>
    <Pressable accessibilityRole="button" onPress={onContinue} style={styles.button}><Text style={styles.buttonText}>继续学习</Text></Pressable>
  </View>;
}

const styles = StyleSheet.create({
  card: {gap: spacing.sm, padding: spacing.lg, borderRadius: radius.lg, backgroundColor: colors.brand},
  eyebrow: {color: '#D8F5F7', fontSize: 13, lineHeight: 20, fontWeight: '600'},
  title: {color: colors.surface, fontSize: 22, lineHeight: 30, fontWeight: '700'},
  lesson: {color: '#E5F7F8', fontSize: 14, lineHeight: 20},
  progressRow: {flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.xs},
  progressLabel: {color: '#D8F5F7', fontSize: 13, lineHeight: 20},
  progressValue: {color: colors.surface, fontSize: 13, lineHeight: 20, fontWeight: '700'},
  progressTrack: {height: 8, overflow: 'hidden', borderRadius: 4, backgroundColor: '#E5F7F8'},
  progressFill: {height: '100%', borderRadius: 4, backgroundColor: colors.sun},
  button: {alignSelf: 'flex-start', minHeight: 40, justifyContent: 'center', paddingHorizontal: spacing.md, borderRadius: radius.sm, backgroundColor: colors.surface},
  buttonText: {color: colors.brand, fontSize: 14, lineHeight: 20, fontWeight: '700'},
});
