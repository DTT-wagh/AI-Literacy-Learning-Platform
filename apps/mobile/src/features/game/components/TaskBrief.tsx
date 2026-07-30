import React from 'react';
import {StyleSheet, Text, View} from 'react-native';

import {colors, radius, spacing} from '../../../shared/theme/tokens';
import type {LanguageGame} from '../types/language';
import {AIAvatar} from './AIAvatar';
import {OfflineNotice} from './OfflineNotice';

export function TaskBrief({game, offline}: {game: LanguageGame; offline: boolean}): React.JSX.Element {
  return (
    <View style={styles.card}>
      <View style={styles.heading}>
        <Text accessibilityLabel={game.title + '图标'} style={styles.icon}>{game.icon}</Text>
        <View style={styles.copy}>
          <Text style={styles.title}>{game.title}</Text>
          <Text style={styles.goal}>{game.goal}</Text>
        </View>
      </View>
      <Text style={styles.meta}>约 {game.durationMinutes} 分钟 · 可离线完成</Text>
      <Text style={styles.recommendation}>{game.recommendation}</Text>
      <OfflineNotice offline={offline} />
      <AIAvatar message="我是文文，AI学习助手。我会展示可以核对的候选，不会替你做最后决定。" />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {gap: spacing.md, padding: spacing.md, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, backgroundColor: colors.surface},
  heading: {flexDirection: 'row', alignItems: 'center', gap: spacing.sm},
  icon: {fontSize: 30, lineHeight: 38},
  copy: {flex: 1, minWidth: 0, gap: spacing.xs},
  title: {color: colors.text, fontSize: 21, lineHeight: 28, fontWeight: '800'},
  goal: {color: colors.mutedText, fontSize: 14, lineHeight: 21},
  meta: {color: colors.brand, fontSize: 13, lineHeight: 20, fontWeight: '800'},
  recommendation: {color: colors.text, fontSize: 14, lineHeight: 21},
});
