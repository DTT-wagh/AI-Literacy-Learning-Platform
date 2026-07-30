import React from 'react';
import {StyleSheet, Text, View} from 'react-native';

import {colors, radius, spacing} from '../../../shared/theme/tokens';
import type {GameL1Experiment} from '../types/game';
import {AIAvatar} from './AIAvatar';
import {ConfidenceBadge} from './ConfidenceBadge';

export function AIFeedbackAnimation({experiment}: {experiment: GameL1Experiment}): React.JSX.Element {
  const mistake = experiment.aiMistake;
  const predictedLabel = experiment.categories.find(category => category.id === mistake.predictedCategory)?.label ?? mistake.predictedCategory;
  return (
    <View style={styles.panel}>
      <AIAvatar message="AI正在观察你贴的标签和例子。它会先试着找规律，也可能看漏线索。" />
      <Text style={styles.label}>AI第一次尝试</Text>
      <Text style={styles.result}>{mistake.word} → {predictedLabel}</Text>
      <ConfidenceBadge confidence={mistake.confidence} />
      <View style={styles.reason}>
        <Text style={styles.reasonTitle}>为什么会这样？</Text>
        <Text style={styles.reasonText}>{mistake.reason}</Text>
      </View>
      <Text style={styles.hint}>请检查它的判断，不需要猜AI在想什么。</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {gap: spacing.md, padding: spacing.md, borderWidth: 1, borderColor: '#F0D28A', borderRadius: radius.md, backgroundColor: '#FFFDF5'},
  label: {color: colors.mutedText, fontSize: 13, lineHeight: 20, fontWeight: '700'},
  result: {color: colors.text, fontSize: 24, lineHeight: 32, fontWeight: '800'},
  reason: {gap: spacing.xs, padding: spacing.sm, borderRadius: radius.sm, backgroundColor: '#FFF4D6'},
  reasonTitle: {color: '#8A5B00', fontSize: 14, lineHeight: 20, fontWeight: '800'},
  reasonText: {color: colors.text, fontSize: 14, lineHeight: 21},
  hint: {color: colors.mutedText, fontSize: 13, lineHeight: 20},
});
