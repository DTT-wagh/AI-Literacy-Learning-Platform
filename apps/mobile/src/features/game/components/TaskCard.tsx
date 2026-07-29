import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';

import {colors, radius, spacing} from '../../../shared/theme/tokens';
import type {GameTask} from '../types/game';

const difficultyLabels: Record<GameTask['difficulty'], string> = {
  easy: '入门',
  medium: '进阶',
  hard: '挑战',
};

type TaskCardProps = {
  task: GameTask;
  onPress: () => void;
};

export function TaskCard({task, onPress}: TaskCardProps): React.JSX.Element {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({pressed}) => [styles.card, pressed && styles.pressed]}>
      <View style={styles.header}>
        <Text style={styles.title}>{task.title}</Text>
        <Text style={styles.difficulty}>{difficultyLabels[task.difficulty]}</Text>
      </View>
      <Text style={styles.description}>{task.description}</Text>
      <Text style={styles.meta}>
        {task.levelId ? `${task.levelId} · ` : ''}{task.steps.length} 个步骤{task.durationMinutes ? ` · 约 ${task.durationMinutes} 分钟` : ''}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {gap: spacing.sm, padding: spacing.md, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, backgroundColor: colors.surface},
  header: {flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.sm},
  title: {flex: 1, color: colors.text, fontSize: 18, lineHeight: 26, fontWeight: '700'},
  difficulty: {color: colors.brand, fontSize: 12, lineHeight: 18, fontWeight: '700', paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: radius.sm, backgroundColor: '#E5F7F8'},
  description: {color: colors.mutedText, fontSize: 14, lineHeight: 21},
  meta: {color: colors.mutedText, fontSize: 13, lineHeight: 20},
  pressed: {opacity: 0.8},
});
