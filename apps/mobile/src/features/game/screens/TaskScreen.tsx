import React from 'react';
import {ScrollView, StyleSheet, Text, View} from 'react-native';

import {colors, radius, spacing} from '../../../shared/theme/tokens';
import {GameButton} from '../components/GameButton';
import type {GameModule, GameTask} from '../types/game';

type TaskScreenProps = {
  module: GameModule;
  task: GameTask;
  onBack: () => void;
  onStart: () => void;
};

export function TaskScreen({module, task, onBack, onStart}: TaskScreenProps): React.JSX.Element {
  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text accessibilityRole="button" onPress={onBack} style={styles.back}>返回{module.name}</Text>
      <View style={styles.card}>
        <Text style={styles.eyebrow}>{module.name} · 入门任务</Text>
        <Text style={styles.title}>{task.title}</Text>
        <Text style={styles.description}>{task.description}</Text>
        <View style={styles.info}>
          <Text style={styles.infoTitle}>任务流程</Text>
          <Text style={styles.infoText}>共 {task.steps.length} 个步骤，先判断、找线索，再比较候选并复盘。</Text>
          <Text style={styles.infoText}>任务会缓存到本机，断网时也可以继续；只同步枚举学习事件。</Text>
        </View>
        <GameButton label="开始游戏" onPress={onStart} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {gap: spacing.md, paddingVertical: spacing.md, paddingBottom: spacing.xl},
  back: {alignSelf: 'flex-start', minHeight: 40, color: colors.brand, fontSize: 15, lineHeight: 40, fontWeight: '700', paddingHorizontal: spacing.sm},
  card: {gap: spacing.md, padding: spacing.lg, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, backgroundColor: colors.surface},
  eyebrow: {color: colors.brand, fontSize: 13, lineHeight: 20, fontWeight: '700'},
  title: {color: colors.text, fontSize: 26, lineHeight: 34, fontWeight: '700'},
  description: {color: colors.mutedText, fontSize: 15, lineHeight: 22},
  info: {gap: spacing.sm, padding: spacing.md, borderRadius: radius.md, backgroundColor: '#EEF8F9'},
  infoTitle: {color: colors.text, fontSize: 16, lineHeight: 24, fontWeight: '700'},
  infoText: {color: colors.mutedText, fontSize: 14, lineHeight: 21},
});
