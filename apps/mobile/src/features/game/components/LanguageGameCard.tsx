import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';

import {colors, radius, spacing} from '../../../shared/theme/tokens';
import type {LanguageGame, LanguageGameSnapshot} from '../types/language';
import {ProgressBar} from './ProgressBar';

type LanguageGameCardProps = {
  game: LanguageGame;
  progress: LanguageGameSnapshot | null;
  onPress: () => void;
};

export function LanguageGameCard({game, progress, onPress}: LanguageGameCardProps): React.JSX.Element {
  const stageCount = game.stages.length;
  const completed = progress?.completed ?? false;
  const current = completed ? stageCount : progress?.stageIndex ?? 0;
  const progressValue = Math.round((current / stageCount) * 100);
  const action = completed ? '查看记录' : progress ? '继续上次任务' : '开始游戏';

  return (
    <Pressable accessibilityRole="button" accessibilityLabel={game.title + '，' + action} onPress={onPress} style={({pressed}) => [styles.card, pressed && styles.pressed]}>
      <View style={styles.header}>
        <Text accessibilityLabel={game.title + '图标'} style={styles.icon}>{game.icon}</Text>
        <View style={styles.heading}>
          <Text style={styles.title}>{game.title}</Text>
          <Text style={styles.goal}>{game.goal}</Text>
        </View>
      </View>
      <View style={styles.metaRow}>
        <Text style={styles.meta}>约 {game.durationMinutes} 分钟</Text>
        <Text style={styles.meta}>◌ 可离线</Text>
      </View>
      <Text style={styles.reason}>推荐：{game.recommendation}</Text>
      <ProgressBar label={completed ? '已完成' : '当前进度'} value={progressValue} />
      <Text style={styles.action}>{action} ›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {gap: spacing.sm, padding: spacing.md, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, backgroundColor: colors.surface},
  header: {flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm},
  icon: {fontSize: 30, lineHeight: 38},
  heading: {flex: 1, minWidth: 0, gap: spacing.xs},
  title: {color: colors.text, fontSize: 20, lineHeight: 28, fontWeight: '800'},
  goal: {color: colors.mutedText, fontSize: 14, lineHeight: 20},
  metaRow: {flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm},
  meta: {color: colors.brand, fontSize: 12, lineHeight: 18, fontWeight: '700'},
  reason: {color: colors.text, fontSize: 13, lineHeight: 20},
  action: {color: colors.brand, fontSize: 15, lineHeight: 22, fontWeight: '800'},
  pressed: {opacity: 0.8},
});
