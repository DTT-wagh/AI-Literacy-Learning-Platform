import React from 'react';
import {Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';

import {colors, radius, spacing} from '../../../shared/theme/tokens';
import {userStore} from '../../../store/userStore';
import {ReviewPanel} from '../components/ReviewPanel';
import {languageGames} from '../config/languageGameConfig';
import {languageProgressStorage} from '../storage/LanguageProgressStorage';

export function LanguageReportScreen({onBack}: {onBack: () => void}): React.JSX.Element {
  const userId = userStore.userInfo?.id ?? 0;
  const [reflection, setReflection] = React.useState<string | null>(null);
  const progress = languageProgressStorage.list(userId);
  const complete = languageGames.every(game => progress.find(item => item.gameId === game.id)?.completed);

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Pressable accessibilityRole="button" onPress={onBack} style={styles.back}><Text style={styles.backText}>返回语文岛</Text></Pressable>
      <View style={styles.card}>
        <Text style={styles.eyebrow}>结业评估</Text>
        <Text style={styles.title}>语言调查报告</Text>
        <Text style={styles.subtitle}>这份报告只复用三个游戏中的过程证据，不会新增第四套玩法。</Text>
        <ReviewPanel rows={[
          {label: '训练', value: 'G1：修复一组词语分类样本'},
          {label: '理解', value: 'G2：判断含义不清的留言，并保留不确定'},
          {label: '核验', value: 'G3：连接来源并谨慎改写提醒'},
        ]} />
        <Text style={styles.prompt}>完成这句话：</Text>
        <View style={styles.choices}>
          {['AI可以帮助我整理候选，但我需要观察、修改和核验。', 'AI可以替我做最后决定。'].map(choice => {
            const selected = reflection === choice;
            return (
              <Pressable accessibilityRole="radio" accessibilityState={{selected}} key={choice} onPress={() => setReflection(choice)} style={[styles.choice, selected && styles.choiceSelected]}>
                <Text style={[styles.choiceText, selected && styles.choiceTextSelected]}>{choice}</Text>
              </Pressable>
            );
          })}
        </View>
        {complete && reflection?.startsWith('AI可以帮助') ? <Text style={styles.complete}>已完成语言调查报告。本次记录关注观察、建模和核验，不显示排名或单一总分。</Text> : <Text style={styles.locked}>完成三个游戏并选择负责任的总结后，即可完成报告。</Text>}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {gap: spacing.md, paddingVertical: spacing.md, paddingBottom: spacing.xl},
  back: {alignSelf: 'flex-start', minHeight: 40, justifyContent: 'center', paddingHorizontal: spacing.sm},
  backText: {color: colors.brand, fontSize: 15, lineHeight: 22, fontWeight: '800'},
  card: {gap: spacing.md, padding: spacing.md, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, backgroundColor: colors.surface},
  eyebrow: {color: colors.brand, fontSize: 13, lineHeight: 20, fontWeight: '800'},
  title: {color: colors.text, fontSize: 26, lineHeight: 34, fontWeight: '800'},
  subtitle: {color: colors.mutedText, fontSize: 15, lineHeight: 22},
  prompt: {color: colors.text, fontSize: 16, lineHeight: 23, fontWeight: '800'},
  choices: {gap: spacing.sm},
  choice: {minHeight: 54, justifyContent: 'center', padding: spacing.md, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm},
  choiceSelected: {borderColor: colors.brand, backgroundColor: '#E5F7F8'},
  choiceText: {color: colors.text, fontSize: 15, lineHeight: 22, fontWeight: '700'},
  choiceTextSelected: {color: colors.brand},
  complete: {color: colors.success, fontSize: 14, lineHeight: 21, fontWeight: '800'},
  locked: {color: '#8A5B00', fontSize: 14, lineHeight: 21, fontWeight: '700'},
});
