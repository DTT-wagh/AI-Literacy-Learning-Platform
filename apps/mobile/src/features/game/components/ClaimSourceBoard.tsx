import React from 'react';
import {Pressable, StyleSheet, Text, TextInput, View} from 'react-native';

import {colors, radius, spacing} from '../../../shared/theme/tokens';
import {checkLanguageTextSafety} from '../safety/languageSafety';
import type {LanguageGame, LanguageSessionData} from '../types/language';

type ClaimSourceBoardProps = {
  game: LanguageGame;
  stageId: string;
  data: LanguageSessionData;
  onChange: (patch: Partial<LanguageSessionData>) => void;
};

export function ClaimSourceBoard({game, stageId, data, onChange}: ClaimSourceBoardProps): React.JSX.Element | null {
  const content = game.content;

  if (stageId === 'claim-splitting') {
    return (
      <View style={styles.section}>
        <Text style={styles.help}>逐条查看短文声明。事实可以核对，观点要保留说话主体，信息不够时标为不确定。</Text>
        {(content.claims ?? []).map(claim => (
          <View key={claim.id} style={styles.claim}>
            <Text style={styles.claimText}>{claim.text}</Text>
            <View style={styles.chips}>
              {claimKinds.map(kind => {
                const selected = data.claimKinds[claim.id] === kind.id;
                return (
                  <Pressable accessibilityRole="radio" accessibilityState={{selected}} key={kind.id} onPress={() => onChange({claimKinds: {...data.claimKinds, [claim.id]: kind.id}})} style={[styles.chip, selected && styles.chipSelected]}>
                    <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{kind.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ))}
      </View>
    );
  }

  if (stageId === 'source-linking') {
    const selectedClaim = data.selectedClaimId ?? content.claims?.[0]?.id ?? null;
    const linked = selectedClaim ? data.sourceLinks[selectedClaim] ?? [] : [];
    return (
      <View style={styles.section}>
        <Text style={styles.help}>先选一条声明，再点击来源卡建立连线。第一条声明至少需要两张审核来源卡。</Text>
        <View style={styles.claimList}>
          {(content.claims ?? []).map(claim => {
            const selected = claim.id === selectedClaim;
            const count = data.sourceLinks[claim.id]?.length ?? 0;
            return (
              <Pressable accessibilityRole="radio" accessibilityState={{selected}} key={claim.id} onPress={() => onChange({selectedClaimId: claim.id})} style={[styles.claimSelector, selected && styles.claimSelectorSelected]}>
                <Text style={styles.claimText}>{claim.text}</Text>
                <Text style={styles.linkCount}>{count} 张来源卡</Text>
              </Pressable>
            );
          })}
        </View>
        <View style={styles.sourceList}>
          {(content.sources ?? []).map(source => {
            const selected = linked.includes(source.id);
            return (
              <Pressable
                accessibilityRole="checkbox"
                accessibilityState={{checked: selected}}
                disabled={!selectedClaim}
                key={source.id}
                onPress={() => {
                  if (!selectedClaim) return;
                  onChange({sourceLinks: {...data.sourceLinks, [selectedClaim]: toggle(linked, source.id)}});
                }}
                style={[styles.source, selected && styles.sourceSelected]}>
                <Text style={styles.sourceTitle}>{source.provider}</Text>
                <Text style={styles.sourceMeta}>日期：{source.publishedAt} · 审核：{source.reviewStatus === 'reviewed' ? '已审核' : source.reviewStatus === 'outdated' ? '过时' : '未核验'}</Text>
                <Text style={styles.sourceMeta}>证据：{source.evidenceType}</Text>
                <Text style={styles.sourceMeta}>范围：{source.scope}</Text>
                <Text style={styles.sourceText}>{source.content}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    );
  }

  if (stageId === 'risk-diagnosis') {
    return (
      <View style={styles.section}>
        <Text style={styles.help}>AI只提示需要核对的地方。请由你选择这条说法的风险。</Text>
        <Text style={styles.focusClaim}>“向日葵一定能长到两米高。”</Text>
        <View style={styles.chips}>
          {(content.riskOptions ?? []).map(option => {
            const selected = data.riskCodes.includes(option.id);
            return (
              <Pressable accessibilityRole="checkbox" accessibilityState={{checked: selected}} key={option.id} onPress={() => onChange({riskCodes: toggle(data.riskCodes, option.id)})} style={[styles.chip, selected && styles.chipSelected]}>
                <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{option.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    );
  }

  if (stageId === 'careful-revision') {
    return <CarefulRevision content={content.carefulRevision ?? ''} data={data} onChange={onChange} />;
  }

  if (stageId === 'publication-check') {
    const checks = [
      {id: 'privacy', label: '没有个人信息'},
      {id: 'sources', label: '来源可核对'},
      {id: 'ai-note', label: '已说明AI参与'},
      {id: 'pending', label: '只进入待审核'},
    ];
    return (
      <View style={styles.section}>
        <Text style={styles.help}>发布前检查不能跳过。完成后只有“待审核”，不会直接公开。</Text>
        {checks.map(check => {
          const selected = data.publicationChecks.includes(check.id);
          return (
            <Pressable accessibilityRole="checkbox" accessibilityState={{checked: selected}} key={check.id} onPress={() => onChange({publicationChecks: toggle(data.publicationChecks, check.id)})} style={[styles.check, selected && styles.checkSelected]}>
              <Text style={styles.checkText}>{selected ? '已检查：' : '检查：'}{check.label}</Text>
            </Pressable>
          );
        })}
        <Text style={styles.pending}>文章状态：待教师审核</Text>
      </View>
    );
  }

  return null;
}

function CarefulRevision({content, data, onChange}: {content: string; data: LanguageSessionData; onChange: (patch: Partial<LanguageSessionData>) => void}): React.JSX.Element {
  const [draft, setDraft] = React.useState(data.carefulRevision ?? content);
  const saveRevision = () => {
    const safety = checkLanguageTextSafety(draft);
    if (safety.status !== 'safe') {
      onChange({safetyStatus: safety.status, safetyMessage: safety.message});
      return;
    }
    if (draft.trim().length > 10) onChange({carefulRevision: draft.trim(), safetyStatus: 'safe', safetyMessage: null});
  };
  return (
    <View style={styles.section}>
      <Text style={styles.help}>删去“ 一定 ”这样的绝对词，补上条件和适用范围。</Text>
      <View style={styles.original}><Text style={styles.originalLabel}>原句</Text><Text style={styles.claimText}>向日葵一定能长到两米高。</Text></View>
      <TextInput accessibilityLabel="谨慎改写稿" maxLength={160} multiline onChangeText={setDraft} style={styles.input} value={draft} />
      <Pressable accessibilityRole="button" onPress={saveRevision} style={styles.save}><Text style={styles.saveText}>保存谨慎改写</Text></Pressable>
      {data.carefulRevision ? <Text style={styles.pending}>已保留修改类型：补充条件与去除绝对化表达</Text> : null}
    </View>
  );
}

const claimKinds = [
  {id: 'fact' as const, label: '事实'},
  {id: 'opinion' as const, label: '观点'},
  {id: 'uncertain' as const, label: '不确定'},
];

function toggle(current: string[], value: string): string[] {
  return current.includes(value) ? current.filter(item => item !== value) : [...current, value];
}

const styles = StyleSheet.create({
  section: {gap: spacing.md},
  help: {color: colors.mutedText, fontSize: 14, lineHeight: 21},
  claim: {gap: spacing.sm, padding: spacing.md, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md},
  claimText: {color: colors.text, fontSize: 16, lineHeight: 24, fontWeight: '700'},
  chips: {flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm},
  chip: {minHeight: 40, justifyContent: 'center', paddingHorizontal: spacing.sm, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm},
  chipSelected: {borderColor: colors.brand, backgroundColor: '#E5F7F8'},
  chipText: {color: colors.text, fontSize: 13, lineHeight: 19, fontWeight: '700'},
  chipTextSelected: {color: colors.brand},
  claimList: {gap: spacing.sm},
  claimSelector: {gap: spacing.xs, padding: spacing.sm, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm},
  claimSelectorSelected: {borderColor: colors.brand, backgroundColor: '#E5F7F8'},
  linkCount: {color: colors.success, fontSize: 12, lineHeight: 18, fontWeight: '800'},
  sourceList: {gap: spacing.sm},
  source: {gap: spacing.xs, padding: spacing.md, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md},
  sourceSelected: {borderColor: colors.success, backgroundColor: '#F0FAF6'},
  sourceTitle: {color: colors.text, fontSize: 16, lineHeight: 23, fontWeight: '800'},
  sourceMeta: {color: colors.brand, fontSize: 12, lineHeight: 18, fontWeight: '700'},
  sourceText: {color: colors.mutedText, fontSize: 13, lineHeight: 20},
  focusClaim: {color: colors.text, fontSize: 19, lineHeight: 28, fontWeight: '800', padding: spacing.md, borderRadius: radius.md, backgroundColor: '#FFF4D6'},
  original: {gap: spacing.xs, padding: spacing.md, borderRadius: radius.md, backgroundColor: '#FFF4F1'},
  originalLabel: {color: '#A3483A', fontSize: 13, lineHeight: 19, fontWeight: '800'},
  input: {minHeight: 92, padding: spacing.sm, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, color: colors.text, fontSize: 15, lineHeight: 22, textAlignVertical: 'top', backgroundColor: colors.surface},
  save: {minHeight: 44, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.md, borderRadius: radius.sm, backgroundColor: colors.brand},
  saveText: {color: colors.surface, fontSize: 15, lineHeight: 22, fontWeight: '800'},
  check: {minHeight: 50, justifyContent: 'center', paddingHorizontal: spacing.md, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm},
  checkSelected: {borderColor: colors.success, backgroundColor: '#F0FAF6'},
  checkText: {color: colors.text, fontSize: 15, lineHeight: 22, fontWeight: '700'},
  pending: {color: colors.success, fontSize: 14, lineHeight: 21, fontWeight: '800'},
});
