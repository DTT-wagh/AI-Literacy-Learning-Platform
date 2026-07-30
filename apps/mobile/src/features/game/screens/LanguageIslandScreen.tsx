import React from 'react';
import {Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';

import {colors, radius, spacing} from '../../../shared/theme/tokens';
import {ClaimSourceBoard} from '../components/ClaimSourceBoard';
import {ContextEvidenceRail} from '../components/ContextEvidenceRail';
import {GameButton} from '../components/GameButton';
import {ProgressBar} from '../components/ProgressBar';
import {ReviewPanel} from '../components/ReviewPanel';
import {WordLabelBoard} from '../components/WordLabelBoard';
import {getLanguageGame} from '../config/languageGameConfig';
import {createLanguageSessionData} from '../machine/gameMachine';
import type {LanguageSessionData} from '../types/language';

type LanguageIslandScreenProps = {
  onBack: () => void;
};

type UnifiedPhase = 'labels' | 'context' | 'claims' | 'summary';

const phases: Array<{id: UnifiedPhase; label: string; title: string; description: string}> = [
  {id: 'labels', label: '标签', title: '整理词语训练样本', description: '先选标签，再把词语归纳成人物、地点、动作和情绪。'},
  {id: 'context', label: '语境', title: '用上下文修正判断', description: '同一句话会因前后文、事件和语气改变意思。'},
  {id: 'claims', label: '声明', title: '拆分AI短文中的说法', description: '区分可核对的事实、带有主体的观点和信息不足的说法。'},
  {id: 'summary', label: '总结', title: '完成语言AI调查', description: '回顾词语标签、语境线索和说法分类。'},
];

const labelGame = getLanguageGame('language-label-training');
const contextGame = getLanguageGame('language-context-reasoning');
const truthGame = getLanguageGame('language-truth-editor');

export function LanguageIslandScreen({onBack}: LanguageIslandScreenProps): React.JSX.Element {
  const [phase, setPhase] = React.useState<UnifiedPhase>('labels');
  const [data, setData] = React.useState<LanguageSessionData>(createLanguageSessionData);
  const [validationMessage, setValidationMessage] = React.useState<string | null>(null);
  const phaseIndex = phases.findIndex(item => item.id === phase);
  const currentPhase = phases[phaseIndex];

  const applyChange = (patch: Partial<LanguageSessionData>): void => {
    setValidationMessage(null);
    setData(current => ({...current, ...patch}));
  };

  const advance = (): void => {
    const validation = validatePhase(phase, data);
    if (validation) {
      setValidationMessage(validation);
      return;
    }
    setValidationMessage(null);
    setPhase(phases[Math.min(phaseIndex + 1, phases.length - 1)].id);
  };

  const restart = (): void => {
    setData(createLanguageSessionData());
    setValidationMessage(null);
    setPhase('labels');
  };

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Pressable accessibilityRole="button" onPress={onBack} style={styles.backButton}>
        <Text style={styles.backText}>‹ 返回游戏中心</Text>
      </Pressable>

      <View style={styles.header}>
        <Text style={styles.eyebrow}>语文岛 · 综合互动任务</Text>
        <Text style={styles.title}>语言AI调查</Text>
        <Text style={styles.subtitle}>从词语标签出发，加入语境，再判断AI短文中的不同说法。</Text>
        <ProgressBar label={`阶段 ${phaseIndex + 1} / ${phases.length}`} value={((phaseIndex + 1) / phases.length) * 100} />
      </View>

      <View accessibilityLabel="语言AI调查阶段" style={styles.phaseTrack}>
        {phases.map((item, index) => (
          <View key={item.id} style={styles.phaseItem}>
            <View style={[styles.phaseNumber, index <= phaseIndex && styles.phaseNumberActive]}>
              <Text style={[styles.phaseNumberText, index <= phaseIndex && styles.phaseNumberTextActive]}>{index + 1}</Text>
            </View>
            <Text numberOfLines={2} style={[styles.phaseLabel, index === phaseIndex && styles.phaseLabelActive]}>{item.label}</Text>
          </View>
        ))}
      </View>

      <View style={styles.stage}>
        <View style={styles.stageHeading}>
          <Text style={styles.stageStep}>第 {phaseIndex + 1} 阶段</Text>
          <Text testID="language-phase-title" style={styles.stageTitle}>{currentPhase.title}</Text>
          <Text style={styles.stageDescription}>{currentPhase.description}</Text>
        </View>

        {phase === 'labels' ? (
          <View style={styles.stageBody}>
            <WordLabelBoard data={data} game={labelGame} onChange={applyChange} stageId="label-rules" />
            {Object.keys(data.labels).length > 0 ? (
              <GameButton label="重新整理词语" onPress={() => applyChange({labels: {}})} variant="secondary" />
            ) : null}
          </View>
        ) : null}

        {phase === 'context' ? (
          <View style={styles.stageBody}>
            <Text style={styles.subheading}>先只看一句话</Text>
            <ContextEvidenceRail data={data} game={contextGame} onChange={applyChange} stageId="bare-judgement" />
            <View style={styles.divider} />
            <Text style={styles.subheading}>再加入关键语境</Text>
            <ContextEvidenceRail data={data} game={contextGame} onChange={applyChange} stageId="context-evidence" />
            <View style={styles.divider} />
            <Text style={styles.subheading}>最后比较语气</Text>
            <ContextEvidenceRail data={data} game={contextGame} onChange={applyChange} stageId="tone-comparison" />
            {data.bareJudgement && data.contextEvidenceIds.length > 0 && data.toneId ? (
              <View style={styles.insight}>
                <Text style={styles.insightTitle}>判断发生了变化</Text>
                <Text style={styles.insightText}>AI只能依据收到的线索给出候选；没有语境时，应保留不确定。</Text>
              </View>
            ) : null}
          </View>
        ) : null}

        {phase === 'claims' ? (
          <ClaimSourceBoard data={data} game={truthGame} onChange={applyChange} stageId="claim-splitting" />
        ) : null}

        {phase === 'summary' ? <LanguageSummary data={data} onBack={onBack} onRestart={restart} /> : null}

        {validationMessage ? (
          <View accessibilityLiveRegion="polite" style={styles.validation}>
            <Text style={styles.validationText}>{validationMessage}</Text>
          </View>
        ) : null}

        {phase !== 'summary' ? <GameButton label="继续下一阶段" onPress={advance} testID="language-next" /> : null}
      </View>
    </ScrollView>
  );
}

function LanguageSummary({data, onRestart, onBack}: {data: LanguageSessionData; onRestart: () => void; onBack: () => void}): React.JSX.Element {
  const evidenceLabels = (contextGame.content.contextLayers ?? [])
    .filter(item => data.contextEvidenceIds.includes(item.id))
    .map(item => item.label)
    .join('、');
  return (
    <View style={styles.stageBody}>
      <ReviewPanel rows={[
        {label: '词语标签', value: `已归纳 ${Object.keys(data.labels).length} 张词语卡`},
        {label: '语境证据', value: evidenceLabels || '未记录'},
        {label: '说法分类', value: `已分类 ${Object.keys(data.claimKinds).length} 条说法`},
      ]} />
      <View style={styles.takeaway}>
        <Text style={styles.takeawayTitle}>本次调查结论</Text>
        <Text style={styles.takeawayText}>AI依赖人提供的标签和语境。面对一段流畅的文字，也要分清哪些是事实、观点或信息不足的说法。</Text>
      </View>
      <GameButton label="重新开始调查" onPress={onRestart} />
      <GameButton label="完成并返回游戏中心" onPress={onBack} variant="secondary" />
    </View>
  );
}

function validatePhase(phase: UnifiedPhase, data: LanguageSessionData): string | null {
  if (phase === 'labels') {
    const cards = labelGame.content.basicCards ?? [];
    if (Object.keys(data.labels).length !== cards.length) return '先把全部8张词语卡归纳到标签。';
    if (cards.some(card => data.labels[card.id] !== card.label)) return '有词语和标签不匹配，请重新整理后再继续。';
  }
  if (phase === 'context') {
    if (!data.bareJudgement) return '先记录只看一句话时的初步判断。';
    if (data.contextEvidenceIds.length === 0) return '至少选择一条关键语境证据。';
    if (!data.toneId) return '比较一种表情和语气后再继续。';
  }
  if (phase === 'claims') {
    const claims = truthGame.content.claims ?? [];
    if (Object.keys(data.claimKinds).length !== claims.length) return '先给每一条声明标记事实、观点或不确定。';
    if (claims.some(claim => data.claimKinds[claim.id] !== claim.expectedKind)) return '还有声明类型需要调整，请根据是否能核对重新判断。';
  }
  return null;
}

const styles = StyleSheet.create({
  content: {gap: spacing.lg, paddingVertical: spacing.md, paddingBottom: spacing.xl},
  backButton: {alignSelf: 'flex-start', minHeight: 40, justifyContent: 'center', paddingHorizontal: spacing.sm},
  backText: {color: colors.brand, fontSize: 15, lineHeight: 22, fontWeight: '800'},
  header: {gap: spacing.sm},
  eyebrow: {color: colors.brand, fontSize: 13, lineHeight: 20, fontWeight: '800'},
  title: {color: colors.text, fontSize: 28, lineHeight: 36, fontWeight: '800'},
  subtitle: {color: colors.mutedText, fontSize: 15, lineHeight: 22},
  phaseTrack: {flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.xs},
  phaseItem: {flex: 1, minWidth: 0, alignItems: 'center', gap: spacing.xs},
  phaseNumber: {width: 30, height: 30, alignItems: 'center', justifyContent: 'center', borderRadius: 15, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface},
  phaseNumberActive: {borderColor: colors.brand, backgroundColor: colors.brand},
  phaseNumberText: {color: colors.mutedText, fontSize: 13, lineHeight: 18, fontWeight: '800'},
  phaseNumberTextActive: {color: colors.surface},
  phaseLabel: {color: colors.mutedText, fontSize: 11, lineHeight: 16, textAlign: 'center'},
  phaseLabelActive: {color: colors.brand, fontWeight: '800'},
  stage: {gap: spacing.lg},
  stageHeading: {gap: spacing.xs},
  stageStep: {color: colors.brand, fontSize: 13, lineHeight: 20, fontWeight: '800'},
  stageTitle: {color: colors.text, fontSize: 22, lineHeight: 30, fontWeight: '800'},
  stageDescription: {color: colors.mutedText, fontSize: 15, lineHeight: 22},
  stageBody: {gap: spacing.lg},
  subheading: {color: colors.text, fontSize: 17, lineHeight: 24, fontWeight: '800'},
  divider: {height: 1, backgroundColor: colors.border},
  insight: {gap: spacing.xs, padding: spacing.md, borderLeftWidth: 4, borderLeftColor: colors.brand, backgroundColor: '#EEF8F9'},
  insightTitle: {color: colors.brand, fontSize: 15, lineHeight: 22, fontWeight: '800'},
  insightText: {color: colors.text, fontSize: 14, lineHeight: 21},
  validation: {padding: spacing.md, borderRadius: radius.sm, backgroundColor: '#FFF4D6'},
  validationText: {color: colors.text, fontSize: 14, lineHeight: 21, fontWeight: '700'},
  takeaway: {gap: spacing.sm, padding: spacing.md, borderLeftWidth: 4, borderLeftColor: colors.success, backgroundColor: '#F0FAF6'},
  takeawayTitle: {color: colors.success, fontSize: 16, lineHeight: 23, fontWeight: '800'},
  takeawayText: {color: colors.text, fontSize: 15, lineHeight: 23},
});
