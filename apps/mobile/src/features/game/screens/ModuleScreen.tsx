import React from 'react';
import {ScrollView, StyleSheet, Text, View} from 'react-native';

import {colors, spacing} from '../../../shared/theme/tokens';
import {ProgressBar} from '../components/ProgressBar';
import {TaskCard} from '../components/TaskCard';
import {offlineTaskManager} from '../storage/OfflineTaskManager';
import type {GameModule, GameTask} from '../types/game';

type ModuleScreenProps = {
  module: GameModule;
  onBack: () => void;
  onTaskPress: (task: GameTask) => void;
};

export function ModuleScreen({module, onBack, onTaskPress}: ModuleScreenProps): React.JSX.Element {
  const [tasks, setTasks] = React.useState(() => offlineTaskManager.getTasks());
  const moduleTasks = tasks.filter(task => task.module === module.id);

  React.useEffect(() => {
    const unsubscribe = offlineTaskManager.subscribe(() => setTasks(offlineTaskManager.getTasks()));
    offlineTaskManager.refreshTasks().catch(() => undefined);
    return unsubscribe;
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text accessibilityRole="button" onPress={onBack} style={styles.back}>返回游戏中心</Text>
      <View style={styles.intro}>
        <Text style={styles.eyebrow}>{module.goal}</Text>
        <Text style={styles.title}>{module.name}</Text>
        <Text style={styles.subtitle}>{module.description}</Text>
        <ProgressBar value={module.progress} />
      </View>
      <Text style={styles.sectionTitle}>选择任务</Text>
      {module.levels ? (
        <View style={styles.path}>
          <Text style={styles.pathTitle}>语言侦探社成长路径</Text>
          <Text style={styles.pathText}>每关从先判断开始，经过找线索、核对候选和复盘；综合挑战把四项能力放在一起。</Text>
          {module.levels.map(level => (
            <View key={level.id} style={styles.levelRow}>
              <Text style={styles.levelId}>{level.id}</Text>
              <View style={styles.levelCopy}>
                <Text style={styles.levelTitle}>{level.title}</Text>
                <Text style={styles.levelQuestion}>{level.question}</Text>
              </View>
            </View>
          ))}
        </View>
      ) : null}
      <View style={styles.list}>
        {moduleTasks.map(task => (
          <TaskCard key={task.id} task={task} onPress={() => onTaskPress(task)} />
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {gap: spacing.md, paddingVertical: spacing.md, paddingBottom: spacing.xl},
  back: {alignSelf: 'flex-start', minHeight: 40, color: colors.brand, fontSize: 15, lineHeight: 40, fontWeight: '700', paddingHorizontal: spacing.sm},
  intro: {gap: spacing.sm},
  eyebrow: {color: colors.brand, fontSize: 14, lineHeight: 20, fontWeight: '700'},
  title: {color: colors.text, fontSize: 26, lineHeight: 34, fontWeight: '700'},
  subtitle: {color: colors.mutedText, fontSize: 15, lineHeight: 22},
  sectionTitle: {color: colors.text, fontSize: 20, lineHeight: 28, fontWeight: '700'},
  list: {gap: spacing.sm},
  path: {gap: spacing.sm, padding: spacing.md, borderWidth: 1, borderColor: '#D8CBEA', borderRadius: 12, backgroundColor: '#FAF8FD'},
  pathTitle: {color: '#7656A8', fontSize: 16, lineHeight: 24, fontWeight: '800'},
  pathText: {color: colors.mutedText, fontSize: 13, lineHeight: 20},
  levelRow: {flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: '#E8E0F1'},
  levelId: {width: 32, color: '#7656A8', fontSize: 13, lineHeight: 20, fontWeight: '800'},
  levelCopy: {flex: 1, minWidth: 0, gap: 2},
  levelTitle: {color: colors.text, fontSize: 14, lineHeight: 20, fontWeight: '700'},
  levelQuestion: {color: colors.mutedText, fontSize: 13, lineHeight: 20},
});
