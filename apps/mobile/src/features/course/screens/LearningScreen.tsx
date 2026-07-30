import React, {useState} from 'react';
import {ActivityIndicator, Pressable, StyleSheet, Text, View} from 'react-native';

import {updateLearningProgress, type LearningRecord} from '../../../api/learning';
import type {Course, CourseLesson} from '../../../api/course';
import {colors, radius, spacing} from '../../../shared/theme/tokens';

type LearningScreenProps = { course: Course; lesson: CourseLesson; nextLesson?: CourseLesson; initialRecord: LearningRecord; onBack: () => void; onNextLesson: (lesson: CourseLesson) => void; };

export function LearningScreen({course, lesson, nextLesson, initialRecord, onBack, onNextLesson}: LearningScreenProps): React.JSX.Element {
  const [record, setRecord] = useState(initialRecord);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const completeAndContinue = async (): Promise<void> => {
    setSaving(true); setErrorMessage(null);
    try {
      const updatedRecord = await updateLearningProgress(course.id, lesson.id, 100);
      setRecord(updatedRecord);
      if (nextLesson) onNextLesson(nextLesson);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '学习进度保存失败，请重试。');
    } finally { setSaving(false); }
  };
  return <View style={styles.content}>
    <Pressable accessibilityRole="button" onPress={onBack} style={styles.backButton}><Text style={styles.backText}>返回课程详情</Text></Pressable>
    {lesson.videoUrl ? <View accessibilityLabel="视频播放区域占位" style={styles.videoArea}><Text style={styles.videoIcon}>▶</Text><Text style={styles.videoHint}>视频学习区域</Text></View> : <View accessibilityLabel="图文内容暂未接入" style={styles.unavailableArea}><Text style={styles.unavailableTitle}>图文内容暂未接入</Text><Text style={styles.unavailableText}>当前课程没有可读取的正文，等待内容服务接入。</Text></View>}
    <View style={styles.lessonCard}>
      <Text style={styles.courseTitle}>{course.title}</Text>
      <Text style={styles.lessonTitle}>第 {lesson.sort} 章 · {lesson.title}</Text>
      <Text style={styles.duration}>{lesson.duration}</Text>
      <View style={styles.progressHeader}><Text style={styles.progressLabel}>学习进度</Text><Text style={styles.progressValue}>{record.progress}%</Text></View>
      <View style={styles.progressTrack}><View style={[styles.progressFill, {width: `${record.progress}%`}]} /></View>
      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
      <Pressable accessibilityRole="button" disabled={saving || !lesson.videoUrl} onPress={() => void completeAndContinue()} style={[styles.nextButton, (saving || !lesson.videoUrl) && styles.nextButtonDisabled]}>{saving ? <ActivityIndicator color={colors.surface} /> : <Text style={styles.nextButtonText}>{lesson.videoUrl ? nextLesson ? '下一章节' : '完成本课程' : '等待内容接入'}</Text>}</Pressable>
    </View>
  </View>;
}

const styles = StyleSheet.create({
  content: {flex: 1, gap: spacing.md, paddingVertical: spacing.md}, backButton: {alignSelf: 'flex-start', minHeight: 40, justifyContent: 'center', paddingHorizontal: spacing.sm}, backText: {color: colors.brand, fontSize: 15, lineHeight: 22, fontWeight: '700'}, videoArea: {minHeight: 220, alignItems: 'center', justifyContent: 'center', gap: spacing.sm, borderRadius: radius.lg, backgroundColor: colors.text}, videoIcon: {color: colors.sun, fontSize: 42, lineHeight: 50}, videoHint: {color: colors.surface, fontSize: 15, lineHeight: 22, fontWeight: '600'}, unavailableArea: {minHeight: 220, alignItems: 'center', justifyContent: 'center', gap: spacing.sm, padding: spacing.lg, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface}, unavailableTitle: {color: colors.text, fontSize: 18, lineHeight: 26, fontWeight: '700'}, unavailableText: {color: colors.mutedText, fontSize: 14, lineHeight: 20, textAlign: 'center'}, lessonCard: {gap: spacing.md, padding: spacing.lg, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface}, courseTitle: {color: colors.mutedText, fontSize: 14, lineHeight: 20}, lessonTitle: {color: colors.text, fontSize: 22, lineHeight: 30, fontWeight: '700'}, duration: {color: colors.brand, fontSize: 14, lineHeight: 20, fontWeight: '600'}, progressHeader: {flexDirection: 'row', justifyContent: 'space-between'}, progressLabel: {color: colors.text, fontSize: 15, lineHeight: 22, fontWeight: '700'}, progressValue: {color: colors.brand, fontSize: 15, lineHeight: 22, fontWeight: '700'}, progressTrack: {height: 10, overflow: 'hidden', borderRadius: 5, backgroundColor: '#E5F7F8'}, progressFill: {height: '100%', borderRadius: 5, backgroundColor: colors.brand}, nextButton: {minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: radius.sm, backgroundColor: colors.brand}, nextButtonDisabled: {opacity: 0.7}, nextButtonText: {color: colors.surface, fontSize: 16, lineHeight: 24, fontWeight: '700'}, errorText: {color: colors.coral, fontSize: 14, lineHeight: 20},
});
