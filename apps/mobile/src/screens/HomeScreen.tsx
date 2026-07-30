import React, {useEffect, useState} from 'react';
import {FlatList, Image, Pressable, StyleSheet, Text, View} from 'react-native';

import {
  CourseApiError,
  getCourseList,
  getRecommendCourses,
  type Course,
} from '../api/course';
import {getMyLearning, type LearningRecord} from '../api/learning';
import {AppHeader} from '../components/AppHeader';
import {LearningCard} from '../components/LearningCard';
import {colors, radius, spacing} from '../shared/theme/tokens';

type HomeScreenProps = {
  compact: boolean;
  wide: boolean;
  onCoursePress: (courseId: number) => void;
  onContinueLearning?: (courseId: number, lessonId: number) => void;
};

type ContinueItem = {
  courseId: number;
  lessonId: number;
  title: string;
  description: string;
};

export function HomeScreen({compact, wide, onCoursePress, onContinueLearning}: HomeScreenProps): React.JSX.Element {
  const [courses, setCourses] = useState<Course[]>([]);
  const [hotCourses, setHotCourses] = useState<Course[]>([]);
  const [continueItem, setContinueItem] = useState<ContinueItem | undefined>();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    void Promise.allSettled([getRecommendCourses(), getCourseList(), getMyLearning()]).then(results => {
      if (!mounted) return;

      const recommendations = results[0];
      const catalog = results[1];
      const learning = results[2];
      const availableRecommendations = recommendations.status === 'fulfilled' ? recommendations.value : [];
      const availableCatalog = catalog.status === 'fulfilled' ? catalog.value : [];
      const allCourses = mergeCourses(availableRecommendations, availableCatalog);

      setCourses(availableRecommendations);
      setHotCourses([...allCourses].sort((left, right) => right.viewCount - left.viewCount).slice(0, 3));

      if (learning.status === 'fulfilled') {
        const record = learning.value.find(item => item.progress < 100);
        const course = record ? allCourses.find(item => item.id === record.courseId) : undefined;
        setContinueItem(record && course ? toContinueItem(record, course) : undefined);
      }

      if (recommendations.status === 'rejected' && catalog.status === 'rejected') {
        const error = recommendations.reason;
        setErrorMessage(error instanceof CourseApiError ? error.message : '课程加载失败，请稍后重试。');
      }
    });

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <FlatList
      contentContainerStyle={[styles.listContent, wide && styles.listContentWide]}
      data={courses}
      keyExtractor={course => String(course.id)}
      ListEmptyComponent={errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
      ListHeaderComponent={<View style={styles.headerContent}>
        <AppHeader />
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>今天也一起探索 AI 吧</Text>
          <Text style={styles.welcomeDescription}>选择一门感兴趣的课程，开始新的学习旅程。</Text>
        </View>
        <LearningCard
          compact={compact}
          item={continueItem && {
            title: continueItem.title,
            description: continueItem.description,
          }}
          onContinue={continueItem ? () => onContinueLearning?.(continueItem.courseId, continueItem.lessonId) : undefined}
        />
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>为你推荐</Text>
          <Text style={styles.sectionAction}>来自学习记录与内容质量</Text>
        </View>
      </View>}
      renderItem={({item}) => <CourseCard course={item} onPress={onCoursePress} />}
      ListFooterComponent={<View style={styles.footerContent}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>热门内容</Text>
          <Text style={styles.sectionAction}>按已有内容热度</Text>
        </View>
        {hotCourses.length > 0 ? hotCourses.map(course => <CourseCard key={`hot-${course.id}`} course={course} onPress={onCoursePress} />) : <StatusPanel title="热门内容" message="热门内容等待接入" />}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>AI 小知识</Text>
        </View>
        <StatusPanel title="AI 小知识内容暂未开放" message="审核后的知识卡接入后，会在这里展示适龄内容。" />
      </View>}
      showsVerticalScrollIndicator={false}
    />
  );
}

function mergeCourses(...groups: Course[][]): Course[] {
  return [...new Map(groups.flat().map(course => [course.id, course])).values()];
}

function toContinueItem(record: LearningRecord, course: Course): ContinueItem {
  const progress = Math.max(0, Math.min(100, record.progress));
  return {
    courseId: record.courseId,
    lessonId: record.lessonId,
    title: course.title,
    description: `${course.category} · 已完成 ${progress}%`,
  };
}

function CourseCard({course, onPress}: {course: Course; onPress: (courseId: number) => void}): React.JSX.Element {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`查看${course.title}课程详情`} onPress={() => onPress(course.id)} style={styles.recommendationCard}>
      {course.coverUrl ? (
        <Image accessibilityLabel={`${course.title}课程封面`} source={{uri: course.coverUrl}} style={styles.cover} />
      ) : (
        <View style={styles.cardMarker} />
      )}
      <Text numberOfLines={2} style={styles.recommendationTitle}>{course.title}</Text>
      <Text numberOfLines={3} style={styles.recommendationDescription}>{course.description}</Text>
      <Text style={styles.recommendationMeta}>{course.level} · {course.duration}</Text>
    </Pressable>
  );
}

function StatusPanel({title, message}: {title: string; message: string}): React.JSX.Element {
  return <View accessibilityLabel={`${title}，${message}`} style={styles.statusPanel}>
    <Text style={styles.statusTitle}>{title}</Text>
    <Text style={styles.statusMessage}>{message}</Text>
  </View>;
}

const styles = StyleSheet.create({
  listContent: {
    flexGrow: 1,
    gap: spacing.md,
    paddingTop: spacing.md,
    // Keeps the final card clear of the navigator's 60px footer.
    paddingBottom: spacing.xl + 60,
  },
  listContentWide: {
    paddingHorizontal: spacing.md,
  },
  headerContent: {
    gap: spacing.lg,
  },
  footerContent: {
    gap: spacing.md,
    paddingTop: spacing.lg,
  },
  welcomeSection: {
    gap: spacing.xs,
  },
  welcomeTitle: {
    color: colors.text,
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '700',
  },
  welcomeDescription: {
    color: colors.mutedText,
    fontSize: 14,
    lineHeight: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '700',
  },
  sectionAction: {
    color: colors.brand,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
  },
  recommendationCard: {
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
  },
  cardMarker: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: radius.sm,
    backgroundColor: colors.sun,
  },
  cover: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: radius.sm,
    backgroundColor: colors.sun,
  },
  recommendationTitle: {
    color: colors.text,
    fontSize: 17,
    lineHeight: 24,
    fontWeight: '700',
  },
  recommendationMeta: {
    color: colors.mutedText,
    fontSize: 14,
    lineHeight: 20,
  },
  recommendationDescription: {
    color: colors.mutedText,
    fontSize: 14,
    lineHeight: 20,
  },
  statusPanel: {
    gap: spacing.xs,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  statusTitle: {
    color: colors.text,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '700',
  },
  statusMessage: {
    color: colors.mutedText,
    fontSize: 14,
    lineHeight: 20,
  },
  errorText: {
    color: colors.coral,
    fontSize: 14,
    lineHeight: 20,
  },
});
