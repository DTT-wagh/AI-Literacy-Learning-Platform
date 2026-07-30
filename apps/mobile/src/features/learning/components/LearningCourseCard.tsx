import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';

import type {LearningRecord} from '../../../api/learning';
import {colors, radius, spacing} from '../../../shared/theme/tokens';

export type LearningCourseCardData = {
  record: LearningRecord;
  courseTitle: string;
  lessonTitle: string;
};

type LearningCourseCardProps = {
  item: LearningCourseCardData;
  onContinue?: (item: LearningCourseCardData) => void;
  history?: boolean;
};

export function LearningCourseCard({item, onContinue, history = false}: LearningCourseCardProps): React.JSX.Element {
  const {record, courseTitle, lessonTitle} = item;
  return <View style={styles.card}>
    <Text numberOfLines={2} style={styles.title}>{courseTitle}</Text>
    <Text numberOfLines={1} style={styles.lesson}>第 {record.lessonId} 章 · {lessonTitle}</Text>
    <View style={styles.progressRow}><Text style={styles.progressLabel}>完成进度</Text><Text style={styles.progressValue}>{record.progress}%</Text></View>
    <View style={styles.progressTrack}><View style={[styles.progressFill, {width: `${Math.min(100, Math.max(0, record.progress))}%`}]} /></View>
    {history ? <Text style={styles.time}>最近学习：{formatRecordTime(record.updateTime)}</Text> : <Pressable accessibilityRole="button" onPress={() => onContinue?.(item)} style={styles.button}><Text style={styles.buttonText}>继续学习</Text></Pressable>}
  </View>;
}

function formatRecordTime(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '刚刚' : `${date.getMonth() + 1}月${date.getDate()}日`;
}

const styles = StyleSheet.create({
  card: {gap: spacing.sm, padding: spacing.md, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, backgroundColor: colors.surface},
  title: {color: colors.text, fontSize: 17, lineHeight: 24, fontWeight: '700'},
  lesson: {color: colors.mutedText, fontSize: 14, lineHeight: 20},
  progressRow: {flexDirection: 'row', justifyContent: 'space-between'},
  progressLabel: {color: colors.mutedText, fontSize: 13, lineHeight: 20},
  progressValue: {color: colors.brand, fontSize: 13, lineHeight: 20, fontWeight: '700'},
  progressTrack: {height: 8, overflow: 'hidden', borderRadius: 4, backgroundColor: '#E5F7F8'},
  progressFill: {height: '100%', borderRadius: 4, backgroundColor: colors.brand},
  button: {alignSelf: 'flex-start', minHeight: 40, justifyContent: 'center', paddingHorizontal: spacing.md, borderRadius: radius.sm, backgroundColor: colors.brand},
  buttonText: {color: colors.surface, fontSize: 14, lineHeight: 20, fontWeight: '700'},
  time: {color: colors.mutedText, fontSize: 13, lineHeight: 20},
});
