import React, {useEffect, useState} from 'react';
import {ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';

import {CourseApiError, getCourseDetail, type CourseDetail, type CourseLesson} from '../../../api/course';
import {colors, radius, spacing} from '../../../shared/theme/tokens';

type CourseDetailScreenProps = {
  courseId: number;
  onBack: () => void;
  onLessonPress: (detail: CourseDetail, lesson: CourseLesson) => Promise<void>;
};

export function CourseDetailScreen({courseId, onBack, onLessonPress}: CourseDetailScreenProps): React.JSX.Element {
  const [detail, setDetail] = useState<CourseDetail | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [featureMessage, setFeatureMessage] = useState<string | null>(null);
  const [startingLessonId, setStartingLessonId] = useState<number | null>(null);

  useEffect(() => {
    let mounted = true;
    setDetail(null);
    setErrorMessage(null);
    setFeatureMessage(null);
    getCourseDetail(courseId).then(data => {
      if (mounted) setDetail(data);
    }).catch(error => {
      if (mounted) setErrorMessage(error instanceof CourseApiError ? error.message : '课程详情加载失败，请稍后重试。');
    });
    return () => { mounted = false; };
  }, [courseId]);

  if (!detail) {
    return <View style={styles.centered}>
      <Pressable accessibilityRole="button" onPress={onBack} style={styles.backButton}><Text style={styles.backText}>返回首页</Text></Pressable>
      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : <ActivityIndicator color={colors.brand} size="large" />}
    </View>;
  }

  const lessons = detail?.lessons ?? [];
  const firstLesson = detail?.lessons?.[0];
  const startLesson = async (lesson: CourseLesson): Promise<void> => {
    setStartingLessonId(lesson.id);
    setErrorMessage(null);
    try {
      await onLessonPress(detail, lesson);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '开始学习失败，请稍后重试。');
    } finally {
      setStartingLessonId(null);
    }
  };
  return <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
    <Pressable accessibilityRole="button" onPress={onBack} style={styles.backButton}><Text style={styles.backText}>返回首页</Text></Pressable>
    {detail.course.coverUrl ? <Image accessibilityLabel={`${detail.course.title}课程封面`} source={{uri: detail.course.coverUrl}} style={styles.cover} /> : <View style={styles.coverPlaceholder} />}
    <View style={styles.introCard}>
      <Text style={styles.title}>{detail.course.title}</Text>
      <Text style={styles.description}>{detail.course.description}</Text>
      <View style={styles.metadata}>
        <Text style={styles.metaItem}>讲师：{detail.course.teacherName}</Text>
        <Text style={styles.metaItem}>难度：{detail.course.level}</Text>
        <Text style={styles.metaItem}>时长：{detail.course.duration}</Text>
      </View>
      <View style={styles.actions}>
        <Pressable accessibilityRole="button" onPress={() => setFeatureMessage('收藏功能暂未开放，等待内容服务接入。')} style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>收藏</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={() => setFeatureMessage('下载功能暂未开放，授权资源接入后开放。')} style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>下载</Text>
        </Pressable>
      </View>
      {firstLesson ? <Pressable accessibilityRole="button" disabled={startingLessonId !== null} onPress={() => void startLesson(firstLesson)} style={[styles.primaryButton, startingLessonId !== null && styles.buttonDisabled]}><Text style={styles.primaryButtonText}>开始学习</Text></Pressable> : null}
      {errorMessage ? <Text style={styles.inlineErrorText}>{errorMessage}</Text> : null}
      {featureMessage ? <Text accessibilityLiveRegion="polite" style={styles.statusText}>{featureMessage}</Text> : null}
    </View>
    <Text style={styles.sectionTitle}>课程章节</Text>
    <View style={styles.lessonCard}>
      {lessons.map((lesson, index) => <Pressable accessibilityRole="button" accessibilityLabel={`学习第${lesson.sort}章 ${lesson.title}`} disabled={startingLessonId !== null} key={lesson.id} onPress={() => void startLesson(lesson)} style={[styles.lessonRow, index < lessons.length - 1 && styles.lessonBorder, startingLessonId !== null && styles.buttonDisabled]}>
        <View style={styles.lessonNumber}><Text style={styles.lessonNumberText}>{lesson.sort}</Text></View>
        <View style={styles.lessonCopy}><Text style={styles.lessonTitle}>{lesson.title}</Text><Text style={styles.lessonDuration}>{lesson.videoUrl ? '视频' : '图文内容暂未接入'} · {lesson.duration}</Text></View>
        <Text style={styles.lessonAction}>学习</Text>
      </Pressable>)}
      {lessons.length === 0 ? <Text style={styles.emptyText}>暂无课程章节</Text> : null}
    </View>
  </ScrollView>;
}

const styles = StyleSheet.create({
  content: {gap: spacing.md, paddingVertical: spacing.md, paddingBottom: spacing.xl},
  centered: {flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md},
  backButton: {alignSelf: 'flex-start', minHeight: 40, justifyContent: 'center', paddingHorizontal: spacing.sm},
  backText: {color: colors.brand, fontSize: 15, lineHeight: 22, fontWeight: '700'},
  cover: {width: '100%', height: 200, borderRadius: radius.lg, backgroundColor: colors.sun},
  coverPlaceholder: {height: 200, borderRadius: radius.lg, backgroundColor: colors.sun},
  introCard: {gap: spacing.md, padding: spacing.lg, borderRadius: radius.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border},
  title: {color: colors.text, fontSize: 26, lineHeight: 34, fontWeight: '700'},
  description: {color: colors.mutedText, fontSize: 15, lineHeight: 22},
  metadata: {flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm},
  metaItem: {color: colors.brand, fontSize: 14, lineHeight: 20, fontWeight: '600'},
  actions: {flexDirection: 'row', gap: spacing.sm},
  secondaryButton: {minHeight: 44, justifyContent: 'center', paddingHorizontal: spacing.md, borderWidth: 1, borderColor: colors.brand, borderRadius: radius.sm},
  secondaryButtonText: {color: colors.brand, fontSize: 15, lineHeight: 22, fontWeight: '700'},
  primaryButton: {minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: radius.sm, backgroundColor: colors.brand},
  buttonDisabled: {opacity: 0.65},
  primaryButtonText: {color: colors.surface, fontSize: 16, lineHeight: 24, fontWeight: '700'},
  sectionTitle: {color: colors.text, fontSize: 20, lineHeight: 28, fontWeight: '700'},
  lessonCard: {overflow: 'hidden', borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface},
  lessonRow: {minHeight: 72, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.md},
  lessonBorder: {borderBottomWidth: 1, borderBottomColor: colors.border},
  lessonNumber: {width: 32, height: 32, alignItems: 'center', justifyContent: 'center', borderRadius: 16, backgroundColor: '#E5F7F8'},
  lessonNumberText: {color: colors.brand, fontSize: 14, fontWeight: '700'},
  lessonCopy: {flex: 1, gap: spacing.xs},
  lessonTitle: {color: colors.text, fontSize: 16, lineHeight: 22, fontWeight: '700'},
  lessonDuration: {color: colors.mutedText, fontSize: 13, lineHeight: 18},
  lessonAction: {color: colors.brand, fontSize: 14, fontWeight: '700'},
  emptyText: {padding: spacing.md, color: colors.mutedText, fontSize: 14, lineHeight: 20},
  errorText: {color: colors.coral, fontSize: 15, lineHeight: 22, textAlign: 'center'},
  inlineErrorText: {color: colors.coral, fontSize: 14, lineHeight: 20},
  statusText: {color: colors.mutedText, fontSize: 14, lineHeight: 20},
});
