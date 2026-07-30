import React from 'react';
import {ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';

import {colors, radius, spacing} from '../../../shared/theme/tokens';
import {userStore} from '../../../store/userStore';
import {
  gameLearningService,
  type LearningCenterSnapshot,
} from '../services/gameLearningService';

type LearningCenterScreenProps = {
  onBack: () => void;
};

export function LearningCenterScreen({onBack}: LearningCenterScreenProps): React.JSX.Element {
  const userId = userStore.userInfo?.id;
  const [snapshot, setSnapshot] = React.useState<LearningCenterSnapshot | null>(
    () => userId ? gameLearningService.getSnapshot(userId) : null,
  );
  const [refreshing, setRefreshing] = React.useState(true);

  const refresh = React.useCallback(async (): Promise<void> => {
    if (!userId) return;
    setRefreshing(true);
    const next = await gameLearningService.refresh(userId);
    setSnapshot(next);
    setRefreshing(false);
  }, [userId]);

  React.useEffect(() => {
    refresh().catch(() => setRefreshing(false));
  }, [refresh]);

  if (!snapshot) {
    return <View style={styles.loading}><ActivityIndicator color={colors.brand} size="large" /></View>;
  }

  const statusText = snapshot.pendingEventCount > 0
    ? `${snapshot.pendingEventCount} 条学习记录等待联网同步`
    : snapshot.offline
      ? '当前展示已保存的学习记录'
      : '学习记录已同步';

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.topBar}>
        <Pressable accessibilityRole="button" onPress={onBack} style={styles.textButton}>
          <Text style={styles.textButtonLabel}>返回游戏中心</Text>
        </Pressable>
        <Pressable accessibilityRole="button" disabled={refreshing} onPress={() => refresh().catch(() => setRefreshing(false))} style={styles.textButton}>
          <Text style={styles.textButtonLabel}>{refreshing ? '同步中' : '刷新'}</Text>
        </Pressable>
      </View>

      <View style={styles.intro}>
        <Text style={styles.eyebrow}>我的学习记录</Text>
        <Text style={styles.title}>学习中心</Text>
        <Text style={styles.subtitle}>{statusText}</Text>
      </View>

      <View style={styles.metrics}>
        <Metric label="AI探索次数" value={snapshot.aiExplorationCount} />
        <Metric label="完成任务" value={snapshot.completedTaskCount} />
        <Metric label="纠正AI次数" value={snapshot.aiCorrectionCount} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>学习足迹</Text>
        <View style={styles.tags}>
          {snapshot.abilityTags.map(tag => <Text key={tag} style={styles.tag}>{tag}</Text>)}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>任务进度</Text>
        {snapshot.progress.length === 0 ? (
          <Text style={styles.empty}>完成一次互动任务后，这里会出现学习记录。</Text>
        ) : snapshot.progress.map(item => (
          <View key={item.taskId} style={styles.progressRow}>
            <View style={styles.progressCopy}>
              <Text numberOfLines={2} style={styles.taskId}>{item.taskId}</Text>
              <Text style={styles.updated}>{formatTime(item.updatedTime)}</Text>
            </View>
            <Text style={[styles.status, item.completed && styles.statusComplete]}>
              {item.completed ? '已完成' : '进行中'}
            </Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

function Metric({label, value}: {label: string; value: number}): React.JSX.Element {
  return (
    <View style={styles.metric}>
      <Text adjustsFontSizeToFit numberOfLines={1} style={styles.metricValue}>{value}</Text>
      <Text numberOfLines={2} style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function formatTime(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? '已保存'
    : date.toLocaleDateString('zh-CN', {month: 'numeric', day: 'numeric'});
}

const styles = StyleSheet.create({
  content: {gap: spacing.lg, paddingVertical: spacing.md, paddingBottom: spacing.xl},
  loading: {flex: 1, alignItems: 'center', justifyContent: 'center'},
  topBar: {minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
  textButton: {minHeight: 44, justifyContent: 'center', paddingHorizontal: spacing.sm},
  textButtonLabel: {color: colors.brand, fontSize: 14, lineHeight: 20, fontWeight: '700'},
  intro: {gap: spacing.xs},
  eyebrow: {color: colors.brand, fontSize: 13, lineHeight: 20, fontWeight: '700'},
  title: {color: colors.text, fontSize: 26, lineHeight: 34, fontWeight: '700'},
  subtitle: {color: colors.mutedText, fontSize: 14, lineHeight: 21},
  metrics: {flexDirection: 'row', gap: spacing.sm},
  metric: {flex: 1, minWidth: 0, minHeight: 104, justifyContent: 'center', gap: spacing.xs, padding: spacing.sm, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, backgroundColor: colors.surface},
  metricValue: {color: colors.brand, fontSize: 25, lineHeight: 32, fontWeight: '800', textAlign: 'center'},
  metricLabel: {minHeight: 40, color: colors.mutedText, fontSize: 13, lineHeight: 20, fontWeight: '600', textAlign: 'center'},
  section: {gap: spacing.sm},
  sectionTitle: {color: colors.text, fontSize: 19, lineHeight: 27, fontWeight: '700'},
  tags: {flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm},
  tag: {color: colors.text, fontSize: 14, lineHeight: 20, fontWeight: '600', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.sm, backgroundColor: '#E7F6EC'},
  empty: {color: colors.mutedText, fontSize: 14, lineHeight: 21, paddingVertical: spacing.md},
  progressRow: {minHeight: 68, flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border},
  progressCopy: {flex: 1, minWidth: 0, gap: spacing.xs},
  taskId: {color: colors.text, fontSize: 15, lineHeight: 22, fontWeight: '700'},
  updated: {color: colors.mutedText, fontSize: 12, lineHeight: 18},
  status: {color: colors.brand, fontSize: 13, lineHeight: 20, fontWeight: '700'},
  statusComplete: {color: colors.success},
});
