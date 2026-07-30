import React from 'react';
import {StyleSheet, Text, View} from 'react-native';

import {colors, radius, spacing} from '../../../shared/theme/tokens';
import type {GameAIResult} from '../types/game';
import {AIAvatar} from './AIAvatar';
import {ConfidenceBadge} from './ConfidenceBadge';

export function AIResultPanel({result}: {result: GameAIResult}): React.JSX.Element {
  const avatarMessage = result.safetyStatus === 'blocked'
    ? '检测到个人信息，本次没有调用AI。'
    : '这是根据当前证据生成的候选结果，请继续核对。';

  return (
    <View style={styles.panel}>
      <AIAvatar message={avatarMessage} />
      <Text style={styles.label}>AI候选结果</Text>
      <Text style={styles.result}>{result.result}</Text>
      <ConfidenceBadge confidence={result.confidence} />
      <View style={styles.evidence}>
        <Text style={styles.evidenceTitle}>可核对证据</Text>
        {result.evidence.length > 0
          ? result.evidence.map(item => <Text key={item} style={styles.evidenceItem}>• {item}</Text>)
          : <Text style={styles.evidenceItem}>本次没有可核对的AI依据</Text>}
      </View>
      {result.notice ? <Text style={styles.notice}>{result.notice}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {gap: spacing.md, padding: spacing.md, borderWidth: 1, borderColor: '#B9DDE1', borderRadius: radius.md, backgroundColor: colors.surface},
  label: {color: colors.mutedText, fontSize: 13, lineHeight: 20, fontWeight: '700'},
  result: {color: colors.text, fontSize: 22, lineHeight: 30, fontWeight: '800'},
  evidence: {gap: spacing.xs},
  evidenceTitle: {color: colors.text, fontSize: 15, lineHeight: 22, fontWeight: '700'},
  evidenceItem: {color: colors.mutedText, fontSize: 14, lineHeight: 21},
  notice: {color: colors.mutedText, fontSize: 12, lineHeight: 18},
});
