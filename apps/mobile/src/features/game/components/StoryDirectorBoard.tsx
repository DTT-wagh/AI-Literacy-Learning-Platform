import React from 'react';
import {Pressable, StyleSheet, Text, TextInput, View} from 'react-native';

import {colors, radius, spacing} from '../../../shared/theme/tokens';
import {checkLanguageTextSafety} from '../safety/languageSafety';
import type {LanguageGame, LanguageSessionData, StoryRevision} from '../types/language';

type StoryDirectorBoardProps = {
  game: LanguageGame;
  stageId: string;
  data: LanguageSessionData;
  onChange: (patch: Partial<LanguageSessionData>) => void;
};

const blockLabels: Record<string, string> = {
  protagonist: '主角',
  goal: '目标',
  setting: '地点',
  emotionArc: '情绪变化',
  mustInclude: '必须包含',
  mustAvoid: '必须避免',
};

export function StoryDirectorBoard({game, stageId, data, onChange}: StoryDirectorBoardProps): React.JSX.Element | null {
  const content = game.content;

  if (stageId === 'director-intent') {
    return (
      <View style={styles.section}>
        <Text style={styles.help}>先拼好导演积木，AI候选才知道要朝哪里写。</Text>
        {Object.entries(content.blocks ?? {}).map(([key, values]) => (
          <View key={key} style={styles.blockGroup}>
            <Text style={styles.groupTitle}>{blockLabels[key] ?? key}</Text>
            <View style={styles.chips}>
              {values.map(value => {
                const selected = data.storyIntent[key] === value;
                return (
                  <Pressable accessibilityRole="radio" accessibilityState={{selected}} key={value} onPress={() => onChange({storyIntent: {...data.storyIntent, [key]: value}})} style={[styles.chip, selected && styles.chipSelected]}>
                    <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{value}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ))}
      </View>
    );
  }

  if (stageId === 'draft-audition') {
    return (
      <View style={styles.section}>
        <Text style={styles.help}>候选都经过内容审核，但不一定都符合你的目标。先选择一份值得继续修改的草稿。</Text>
        {(content.candidates ?? []).map(candidate => {
          const selected = candidate.id === data.storyCandidateId;
          return (
            <Pressable
              accessibilityRole="radio"
              accessibilityState={{selected}}
              key={candidate.id}
              onPress={() => onChange({storyCandidateId: candidate.id, paragraphOrder: candidate.paragraphs})}
              style={[styles.draft, selected && styles.draftSelected]}>
              <Text style={styles.draftTitle}>{candidate.title}</Text>
              <Text style={styles.draftStatus}>{candidate.supportsGoal ? '符合目标' : '目标还不完整'} · {candidate.suitableAge ? '适龄' : '需要安全修改'}</Text>
              {candidate.paragraphs.map(paragraph => <Text key={paragraph} style={styles.paragraph}>{paragraph}</Text>)}
            </Pressable>
          );
        })}
        <Text style={styles.groupTitle}>比较记录</Text>
        <View style={styles.chips}>
          {['符合目标', '叙事连贯', '语言适龄', '值得继续修改'].map(item => {
            const selected = data.candidateRatings.includes(item);
            return (
              <Pressable accessibilityRole="checkbox" accessibilityState={{checked: selected}} key={item} onPress={() => onChange({candidateRatings: toggle(data.candidateRatings, item)})} style={[styles.chip, selected && styles.chipSelected]}>
                <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{item}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    );
  }

  if (stageId === 'scene-arrangement') {
    const paragraphs = data.paragraphOrder;
    return (
      <View style={styles.section}>
        <Text style={styles.help}>用上下箭头编排镜头。这里是故事骨架，不是语境证据栏。</Text>
        {paragraphs.length === 0 ? <Text style={styles.warning}>请先在三稿试镜中选择一份草稿。</Text> : null}
        {paragraphs.map((paragraph, index) => (
          <View key={paragraph} style={styles.scene}>
            <Text style={styles.sceneIndex}>镜头 {index + 1}</Text>
            <Text style={styles.paragraph}>{paragraph}</Text>
            <View style={styles.sceneButtons}>
              <Pressable accessibilityRole="button" disabled={index === 0} onPress={() => onChange({paragraphOrder: move(paragraphs, index, -1)})} style={[styles.smallButton, index === 0 && styles.disabled]}><Text style={styles.smallButtonText}>上移</Text></Pressable>
              <Pressable accessibilityRole="button" disabled={index === paragraphs.length - 1} onPress={() => onChange({paragraphOrder: move(paragraphs, index, 1)})} style={[styles.smallButton, index === paragraphs.length - 1 && styles.disabled]}><Text style={styles.smallButtonText}>下移</Text></Pressable>
            </View>
          </View>
        ))}
      </View>
    );
  }

  if (stageId === 'human-revision') {
    return <RevisionPanel data={data} onChange={onChange} />;
  }

  if (stageId === 'work-attribution') {
    return (
      <View style={styles.section}>
        <View style={styles.attribution}>
          <Text style={styles.groupTitle}>作品说明</Text>
          <Text style={styles.paragraph}>学生负责：创意设定、候选比较、段落编排和人工修改。</Text>
          <Text style={styles.paragraph}>AI参与：提供经过审核的候选草稿。</Text>
          <Text style={styles.status}>作品只能进入待审核，不能直接公开发布。</Text>
        </View>
        <Pressable accessibilityRole="checkbox" accessibilityState={{checked: data.attributionConfirmed}} onPress={() => onChange({attributionConfirmed: !data.attributionConfirmed})} style={[styles.confirm, data.attributionConfirmed && styles.confirmSelected]}>
          <Text style={styles.confirmText}>{data.attributionConfirmed ? '已确认作品说明' : '确认人工修改并保留AI参与说明'}</Text>
        </Pressable>
      </View>
    );
  }

  return null;
}

function RevisionPanel({data, onChange}: Pick<StoryDirectorBoardProps, 'data' | 'onChange'>): React.JSX.Element {
  const [addition, setAddition] = React.useState('');
  const revisionTypes = new Set(data.revisions.map(item => item.type));
  const addRevision = (revision: StoryRevision) => onChange({revisions: [...data.revisions, revision]});
  const addText = () => {
    const safety = checkLanguageTextSafety(addition);
    if (safety.status !== 'safe') {
      onChange({safetyStatus: safety.status, safetyMessage: safety.message});
      return;
    }
    if (addition.trim().length < 4) return;
    addRevision({type: 'add', before: '', after: addition.trim()});
    setAddition('');
  };

  return (
    <View style={styles.section}>
      <Text style={styles.help}>至少完成两类修改。修改是人对作品负责的一部分。</Text>
      <View style={styles.chips}>
        <RevisionButton active={revisionTypes.has('delete')} label="删除多余句" onPress={() => addRevision({type: 'delete', before: '机器人不告诉任何人，独自冲进黑暗的仓库。', after: ''})} />
        <RevisionButton active={revisionTypes.has('replace')} label="替换生硬说法" onPress={() => addRevision({type: 'replace', before: '它走了过去。', after: '机器人先核对线索，再和同学一起走向归还箱。'})} />
        <RevisionButton active={revisionTypes.has('reorder')} label="重排线索" onPress={() => addRevision({type: 'reorder', before: '先找到钥匙，再看借书卡。', after: '先看借书卡，再根据线索找到钥匙。'})} />
      </View>
      <View style={styles.addition}>
        <Text style={styles.groupTitle}>补写一句</Text>
        <TextInput accessibilityLabel="补写故事句子" maxLength={80} multiline onChangeText={setAddition} placeholder="补一个角色行动或情绪变化" style={styles.input} value={addition} />
        <Pressable accessibilityRole="button" onPress={addText} style={styles.smallButton}><Text style={styles.smallButtonText}>加入补写</Text></Pressable>
      </View>
      <Text style={styles.status}>已完成 {revisionTypes.size} / 2 类人工修改</Text>
      {data.revisions.map((revision, index) => <Text key={index + revision.after} style={styles.revision}>已{revision.type === 'delete' ? '删除' : revision.type === 'replace' ? '替换' : revision.type === 'reorder' ? '重排' : '补写'}：{revision.after || revision.before}</Text>)}
    </View>
  );
}

function RevisionButton({active, label, onPress}: {active: boolean; label: string; onPress: () => void}): React.JSX.Element {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={[styles.chip, active && styles.chipSelected]}>
      <Text style={[styles.chipText, active && styles.chipTextSelected]}>{active ? '已完成：' : ''}{label}</Text>
    </Pressable>
  );
}

function toggle(current: string[], value: string): string[] {
  return current.includes(value) ? current.filter(item => item !== value) : [...current, value];
}

function move(items: string[], index: number, offset: number): string[] {
  const nextIndex = index + offset;
  if (nextIndex < 0 || nextIndex >= items.length) return items;
  const next = [...items];
  [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
  return next;
}

const styles = StyleSheet.create({
  section: {gap: spacing.md},
  help: {color: colors.mutedText, fontSize: 14, lineHeight: 21},
  blockGroup: {gap: spacing.sm, padding: spacing.sm, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm},
  groupTitle: {color: colors.text, fontSize: 15, lineHeight: 22, fontWeight: '800'},
  chips: {flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm},
  chip: {minHeight: 40, justifyContent: 'center', paddingHorizontal: spacing.sm, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm},
  chipSelected: {borderColor: colors.brand, backgroundColor: '#E5F7F8'},
  chipText: {color: colors.text, fontSize: 14, lineHeight: 20, fontWeight: '700'},
  chipTextSelected: {color: colors.brand},
  draft: {gap: spacing.xs, padding: spacing.md, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md},
  draftSelected: {borderColor: colors.brand, backgroundColor: '#E5F7F8'},
  draftTitle: {color: colors.text, fontSize: 17, lineHeight: 24, fontWeight: '800'},
  draftStatus: {color: colors.brand, fontSize: 13, lineHeight: 19, fontWeight: '700'},
  paragraph: {color: colors.text, fontSize: 14, lineHeight: 21},
  warning: {color: '#8A5B00', fontSize: 14, lineHeight: 21, fontWeight: '700'},
  scene: {gap: spacing.sm, padding: spacing.md, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, backgroundColor: '#F7FAFC'},
  sceneIndex: {color: colors.brand, fontSize: 13, lineHeight: 19, fontWeight: '800'},
  sceneButtons: {flexDirection: 'row', gap: spacing.sm},
  smallButton: {minHeight: 36, justifyContent: 'center', paddingHorizontal: spacing.sm, borderWidth: 1, borderColor: colors.brand, borderRadius: radius.sm, backgroundColor: colors.surface},
  smallButtonText: {color: colors.brand, fontSize: 13, lineHeight: 19, fontWeight: '800'},
  disabled: {opacity: 0.4},
  attribution: {gap: spacing.sm, padding: spacing.md, borderRadius: radius.md, backgroundColor: '#F3F7F9'},
  status: {color: colors.success, fontSize: 13, lineHeight: 20, fontWeight: '800'},
  confirm: {minHeight: 52, justifyContent: 'center', padding: spacing.md, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm},
  confirmSelected: {borderColor: colors.success, backgroundColor: '#F0FAF6'},
  confirmText: {color: colors.text, fontSize: 15, lineHeight: 22, fontWeight: '700'},
  addition: {gap: spacing.sm, padding: spacing.md, borderRadius: radius.md, backgroundColor: '#FFF8E8'},
  input: {minHeight: 74, padding: spacing.sm, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, color: colors.text, fontSize: 15, lineHeight: 22, textAlignVertical: 'top', backgroundColor: colors.surface},
  revision: {color: colors.mutedText, fontSize: 13, lineHeight: 20},
});
