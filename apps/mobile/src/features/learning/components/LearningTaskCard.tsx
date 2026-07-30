import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';

import {colors, radius, spacing} from '../../../shared/theme/tokens';

export function LearningTaskCard({onStart}: {onStart?: () => void}): React.JSX.Element {
  return <View style={styles.card}>
    <Text style={styles.eyebrow}>AI助手建议</Text>
    {onStart ? <>
      <Text style={styles.title}>今天建议完成的学习任务</Text>
      <Text style={styles.description}>任务内容接入后，会根据你的学习记录生成下一步建议。</Text>
      <Pressable accessibilityRole="button" onPress={onStart} style={styles.button}><Text style={styles.buttonText}>开始学习</Text></Pressable>
    </> : <>
      <Text style={styles.title}>学习任务暂未开放</Text>
      <Text style={styles.description}>任务推荐接入后，这里会显示适合当前学习阶段的内容。</Text>
    </>}
  </View>;
}

const styles = StyleSheet.create({
  card: {gap: spacing.sm, padding: spacing.md, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, backgroundColor: colors.surface},
  eyebrow: {color: colors.brand, fontSize: 13, lineHeight: 20, fontWeight: '700'},
  title: {color: colors.text, fontSize: 17, lineHeight: 24, fontWeight: '700'},
  description: {color: colors.mutedText, fontSize: 14, lineHeight: 20},
  button: {alignSelf: 'flex-start', minHeight: 40, justifyContent: 'center', paddingHorizontal: spacing.md, borderRadius: radius.sm, backgroundColor: colors.brand},
  buttonText: {color: colors.surface, fontSize: 14, lineHeight: 20, fontWeight: '700'},
});
