import React, {useEffect, useState} from 'react';
import {ActivityIndicator, FlatList, Pressable, StyleSheet, Text, TextInput, View} from 'react-native';

import {getCourseDetail, getCourseList, type Course, type CourseDetail} from '../../../api/course';
import {getLearningStats, getMyLearning, type LearningRecord, type LearningStats} from '../../../api/learning';
import {colors, radius, spacing} from '../../../shared/theme/tokens';
import {LearningContinueCard} from '../components/LearningContinueCard';
import {LearningCourseCard, type LearningCourseCardData} from '../components/LearningCourseCard';
import {LearningPlanCard} from '../components/LearningPlanCard';
import {LearningTaskCard} from '../components/LearningTaskCard';

type LearningScreenProps = {
  onContinueLearning: (item: LearningCourseCardData, detail: CourseDetail) => void;
  onCoursePress: (courseId: number) => void;
};

const emptyStats: LearningStats = {courseCount: 0, lessonCount: 0, studyMinutes: 0};

export function LearningScreen({onContinueLearning, onCoursePress}: LearningScreenProps): React.JSX.Element {
  const [records, setRecords] = useState<LearningRecord[]>([]);
  const [details, setDetails] = useState<Record<number, CourseDetail>>({});
  const [stats, setStats] = useState<LearningStats>(emptyStats);
  const [catalog, setCatalog] = useState<Course[]>([]);
  const [catalogQuery, setCatalogQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('全部');
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogFailed, setCatalogFailed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let mounted = true;
    Promise.allSettled([getMyLearning(), getLearningStats()]).then(async ([recordsResult, statsResult]) => {
      if (!mounted) return;
      if (recordsResult.status === 'fulfilled') {
        const nextRecords = recordsResult.value;
        const courseIds = [...new Set(nextRecords.map(record => record.courseId))];
        const results = await Promise.allSettled(courseIds.map(courseId => getCourseDetail(courseId)));
        const nextDetails: Record<number, CourseDetail> = {};
        results.forEach((result, index) => {
          if (result.status === 'fulfilled') nextDetails[courseIds[index]] = result.value;
        });
        if (mounted) {
          setRecords(nextRecords);
          setDetails(nextDetails);
        }
      }
      if (statsResult.status === 'fulfilled' && mounted) setStats(statsResult.value);
      if (recordsResult.status === 'rejected' && statsResult.status === 'rejected' && mounted) setFailed(true);
    }).catch(() => { if (mounted) setFailed(true); }).finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    let mounted = true;
    getCourseList().then(nextCatalog => {
      if (mounted) setCatalog(nextCatalog);
    }).catch(() => {
      if (mounted) setCatalogFailed(true);
    }).finally(() => {
      if (mounted) setCatalogLoading(false);
    });
    return () => { mounted = false; };
  }, []);

  const items = records.map(record => toCardData(record, details[record.courseId]));
  const continueItem = items.find(item => item.record.progress < 100);
  const recentItems = items.slice(0, 3);
  const categories = ['全部', ...new Set(catalog.map(course => course.category).filter(Boolean))];
  const normalizedQuery = catalogQuery.trim().toLowerCase();
  const filteredCatalog = catalog.filter(course => {
    const matchesCategory = activeCategory === '全部' || course.category === activeCategory;
    const matchesQuery = !normalizedQuery || `${course.title} ${course.description} ${course.category}`.toLowerCase().includes(normalizedQuery);
    return matchesCategory && matchesQuery;
  });

  if (loading) return <View style={styles.centered}><ActivityIndicator color={colors.brand} size="large" /><Text style={styles.statusText}>正在加载学习内容...</Text></View>;
  if (failed) return <View style={styles.centered}><Text style={styles.errorText}>学习数据加载失败</Text></View>;

  return <FlatList
    contentContainerStyle={styles.content}
    data={recentItems}
    keyExtractor={item => String(item.record.id)}
    ListHeaderComponent={<View style={styles.header}>
      <Text style={styles.title}>学习中心</Text>
      <Text style={styles.subtitle}>AI陪伴你的学习成长</Text>
      <Text style={styles.today}>今天{continueItem ? `继续学习 ${continueItem.courseTitle}` : '开始你的AI学习之旅'}</Text>
      <Text style={styles.sectionTitle}>继续学习</Text>
      {continueItem ? <LearningContinueCard item={continueItem} onContinue={() => continueWithItem(continueItem, details, onContinueLearning)} /> : <EmptyContinueCard />}
      <Text style={styles.sectionTitle}>今日学习任务</Text>
      <LearningTaskCard />
      <Text style={styles.sectionTitle}>学习计划</Text>
      <LearningPlanCard />
      <Text style={styles.sectionTitle}>课程内容</Text>
      <TextInput
        accessibilityLabel="搜索课程"
        onChangeText={setCatalogQuery}
        placeholder="搜索课程、主题或知识点"
        placeholderTextColor={colors.mutedText}
        style={styles.searchInput}
        value={catalogQuery}
      />
      <View accessibilityRole="tablist" style={styles.categoryRow}>
        {categories.map(category => <Pressable
          accessibilityRole="tab"
          accessibilityState={{selected: activeCategory === category}}
          key={category}
          onPress={() => setActiveCategory(category)}
          style={[styles.categoryButton, activeCategory === category && styles.categoryButtonActive]}>
          <Text style={[styles.categoryText, activeCategory === category && styles.categoryTextActive]}>{category}</Text>
        </Pressable>)}
      </View>
      {catalogLoading ? <Text style={styles.statusText}>正在加载课程内容...</Text> : null}
      {catalogFailed ? <UnavailablePanel title="课程内容暂未接入" message="课程服务不可用时，这里不会展示虚构内容。" /> : null}
      {!catalogLoading && !catalogFailed && filteredCatalog.length === 0 ? <UnavailablePanel title="暂无匹配课程" message="课程内容接入后，可以按主题和关键词查找。" /> : null}
      {!catalogLoading && !catalogFailed ? filteredCatalog.map(course => <CatalogCourseCard key={course.id} course={course} onPress={onCoursePress} />) : null}
      {recentItems.length > 0 ? <Text style={styles.sectionTitle}>最近学习</Text> : null}
      {stats.lessonCount > 0 ? <Text style={styles.summary}>已完成 {stats.lessonCount} 个章节，继续保持！</Text> : null}
    </View>}
    renderItem={({item}) => <LearningCourseCard history item={item} />}
    showsVerticalScrollIndicator={false}
  />;
}

function continueWithItem(item: LearningCourseCardData, details: Record<number, CourseDetail>, onContinue: LearningScreenProps['onContinueLearning']): void {
  const detail = details[item.record.courseId];
  if (detail) onContinue(item, detail);
}

function toCardData(record: LearningRecord, detail?: CourseDetail): LearningCourseCardData {
  const lesson = detail?.lessons.find(item => item.id === record.lessonId);
  return {record, courseTitle: detail?.course.title ?? 'AI学习课程', lessonTitle: lesson?.title ?? '课程章节'};
}

function EmptyContinueCard(): React.JSX.Element {
  return <View style={styles.emptyCard}><Text style={styles.emptyTitle}>还没有可继续的学习内容</Text><Text style={styles.emptyText}>课程列表会显示在本页，完成学习后这里会出现真实进度。</Text></View>;
}

function CatalogCourseCard({course, onPress}: {course: Course; onPress: (courseId: number) => void}): React.JSX.Element {
  return <Pressable accessibilityRole="button" accessibilityLabel={`查看${course.title}课程详情`} onPress={() => onPress(course.id)} style={styles.catalogCard}>
    <View style={styles.catalogCopy}>
      <Text numberOfLines={2} style={styles.catalogTitle}>{course.title}</Text>
      <Text numberOfLines={2} style={styles.catalogDescription}>{course.description}</Text>
      <Text style={styles.catalogMeta}>{course.category} · {course.level} · {course.duration}</Text>
    </View>
    <Text style={styles.catalogAction}>查看</Text>
  </Pressable>;
}

function UnavailablePanel({title, message}: {title: string; message: string}): React.JSX.Element {
  return <View accessibilityLabel={`${title}，${message}`} style={styles.unavailablePanel}><Text style={styles.emptyTitle}>{title}</Text><Text style={styles.emptyText}>{message}</Text></View>;
}

const styles = StyleSheet.create({
  content: {flexGrow: 1, gap: spacing.md, paddingTop: spacing.md, paddingBottom: spacing.xl + 60},
  header: {gap: spacing.md},
  title: {color: colors.text, fontSize: 26, lineHeight: 34, fontWeight: '700'},
  subtitle: {color: colors.mutedText, fontSize: 14, lineHeight: 20},
  today: {color: colors.brand, fontSize: 15, lineHeight: 22, fontWeight: '700'},
  sectionTitle: {color: colors.text, fontSize: 20, lineHeight: 28, fontWeight: '700', marginTop: spacing.sm},
  summary: {color: colors.mutedText, fontSize: 14, lineHeight: 20},
  centered: {flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm},
  statusText: {color: colors.mutedText, fontSize: 15, lineHeight: 22},
  errorText: {color: colors.coral, fontSize: 15, lineHeight: 22},
  emptyCard: {alignItems: 'flex-start', gap: spacing.sm, padding: spacing.md, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, backgroundColor: colors.surface},
  emptyTitle: {color: colors.text, fontSize: 17, lineHeight: 24, fontWeight: '700'},
  emptyText: {color: colors.mutedText, fontSize: 14, lineHeight: 20},
  searchInput: {minHeight: 44, paddingHorizontal: spacing.md, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, backgroundColor: colors.surface, color: colors.text, fontSize: 14},
  categoryRow: {flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs},
  categoryButton: {minHeight: 36, justifyContent: 'center', paddingHorizontal: spacing.sm, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, backgroundColor: colors.surface},
  categoryButtonActive: {borderColor: colors.brand, backgroundColor: '#E5F7F8'},
  categoryText: {color: colors.mutedText, fontSize: 13, lineHeight: 20, fontWeight: '600'},
  categoryTextActive: {color: colors.brand},
  catalogCard: {minHeight: 84, flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, backgroundColor: colors.surface},
  catalogCopy: {flex: 1, minWidth: 0, gap: spacing.xs},
  catalogTitle: {color: colors.text, fontSize: 16, lineHeight: 23, fontWeight: '700'},
  catalogDescription: {color: colors.mutedText, fontSize: 13, lineHeight: 19},
  catalogMeta: {color: colors.brand, fontSize: 12, lineHeight: 18, fontWeight: '600'},
  catalogAction: {color: colors.brand, fontSize: 14, lineHeight: 20, fontWeight: '700'},
  unavailablePanel: {gap: spacing.xs, padding: spacing.md, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, backgroundColor: colors.surface},
});
