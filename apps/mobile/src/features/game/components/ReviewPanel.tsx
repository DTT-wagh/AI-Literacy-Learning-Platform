import React from 'react';
import {StyleSheet, Text, View} from 'react-native';

import {colors, radius, spacing} from '../../../shared/theme/tokens';
import type {GameEvidence, GameLearningRecord} from '../types/game';

const answerLabels: Record<string, string> = {
  praise: '称赞',
  blame: '责备',
  uncertain: '不确定',
};

type ReviewPanelProps = {
  record?: GameLearningRecord;
  evidence?: GameEvidence[];
  aiResult?: string;
  rows?: Array<{label: string; value: string}>;
};

export function ReviewPanel({record, evidence = [], aiResult = '未记录', rows}: ReviewPanelProps): React.JSX.Element {
  if (rows) {
    return (
      <View style={styles.panel}>
        {rows.map(row => <ReviewRow key={row.label} label={row.label} value={row.value} />)}
      </View>
    );
  }

  const currentRecord = record ?? {
    studentAnswer: null,
    selectedEvidenceIds: [],
    aiCorrectionReason: null,
    finalAnswer: null,
  };
  const selectedEvidence = evidence.filter(item => currentRecord.selectedEvidenceIds.includes(item.id));

  return (
    <View style={styles.panel}>
      <ReviewRow label="第一次判断" value={answerLabels[currentRecord.studentAnswer ?? ''] ?? '未记录'} />
      <ReviewRow label="选择的证据" value={selectedEvidence.map(item => item.label).join('、') || '未记录'} />
      <ReviewRow label="AI候选结果" value={aiResult} />
      <ReviewRow label="最终理解" value={(answerLabels[currentRecord.finalAnswer ?? ''] ?? '未记录') + '：同一句话会因事件、表情和语气而改变含义。'} />
    </View>
  );
}

function ReviewRow({label, value}: {label: string; value: string}): React.JSX.Element {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {gap: spacing.sm, padding: spacing.md, borderRadius: radius.md, backgroundColor: '#F3F7F9'},
  row: {gap: spacing.xs, paddingBottom: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border},
  label: {color: colors.brand, fontSize: 13, lineHeight: 20, fontWeight: '700'},
  value: {color: colors.text, fontSize: 15, lineHeight: 22},
});
