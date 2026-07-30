import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';

import {colors, radius, spacing} from '../../../shared/theme/tokens';
import type {LanguageGame, LanguageSessionData} from '../types/language';

type ContextEvidenceRailProps = {
  game: LanguageGame;
  stageId: string;
  data: LanguageSessionData;
  onChange: (patch: Partial<LanguageSessionData>) => void;
};

export function ContextEvidenceRail({game, stageId, data, onChange}: ContextEvidenceRailProps): React.JSX.Element | null {
  const content = game.content;

  if (stageId === 'bare-judgement') {
    return (
      <View style={styles.section}>
        <Text style={styles.utterance}>“{content.primaryUtterance}”</Text>
        <Text style={styles.help}>现在只有这一句话。你可以先猜，也可以选择还不确定。</Text>
        <OptionList options={content.bareOptions ?? []} selected={data.bareJudgement} onSelect={id => onChange({bareJudgement: id})} />
      </View>
    );
  }

  if (stageId === 'word-meaning') {
    return (
      <View style={styles.section}>
        <Text style={styles.help}>同一个“画”字，在不同句子里表示什么？</Text>
        {(content.wordPairs ?? []).map((pair, index) => {
          const selected = data.wordMeaningChoice === String(index);
          return (
            <Pressable accessibilityRole="radio" accessibilityState={{selected}} key={pair.sentence} onPress={() => onChange({wordMeaningChoice: String(index)})} style={[styles.layer, selected && styles.layerSelected]}>
              <Text style={styles.layerLabel}>{pair.sentence}</Text>
              <Text style={styles.layerText}>{pair.meaning}</Text>
            </Pressable>
          );
        })}
        <Text style={styles.note}>单看“画”这个字还不够，要看它在句子里做什么。</Text>
      </View>
    );
  }

  if (stageId === 'context-evidence') {
    return (
      <View style={styles.section}>
        <Text style={styles.help}>从已打开的线索里选1至2条最关键的证据。</Text>
        {(content.contextLayers ?? []).slice(0, 3).map(layer => {
          const selected = data.contextEvidenceIds.includes(layer.id);
          return (
            <Pressable
              accessibilityRole="checkbox"
              accessibilityState={{checked: selected}}
              key={layer.id}
              onPress={() => {
                if (!selected && data.contextEvidenceIds.length >= 2) return;
                onChange({contextEvidenceIds: toggle(data.contextEvidenceIds, layer.id)});
              }}
              style={[styles.layer, selected && styles.layerSelected]}>
              <Text style={styles.layerLabel}>{layer.label}</Text>
              <Text style={styles.layerText}>{layer.content}</Text>
              <Text style={styles.status}>{selected ? '已放入证据栏' : '点击加入证据栏'}</Text>
            </Pressable>
          );
        })}
      </View>
    );
  }

  if (stageId === 'tone-comparison') {
    return (
      <View style={styles.section}>
        <Text style={styles.utterance}>“你可真行”</Text>
        <Text style={styles.help}>看看表情和语气会怎样影响判断。</Text>
        {(content.toneVariants ?? []).map(tone => {
          const selected = data.toneId === tone.id;
          return (
            <Pressable accessibilityRole="radio" accessibilityState={{selected}} key={tone.id} onPress={() => onChange({toneId: tone.id})} style={[styles.layer, selected && styles.layerSelected]}>
              <Text style={styles.layerLabel}>{tone.label}</Text>
              <Text style={styles.layerText}>{tone.meaning}</Text>
            </Pressable>
          );
        })}
      </View>
    );
  }

  if (stageId === 'unknown-case' && content.unknownCase) {
    const unknown = content.unknownCase;
    return (
      <View style={styles.section}>
        <Text style={styles.utterance}>“{unknown.utterance}”</Text>
        <Text style={styles.help}>这次没有给表情、语气或前后文。负责任的判断可以是需要更多信息。</Text>
        <OptionList options={unknown.options} selected={data.unknownChoice} onSelect={id => onChange({unknownChoice: id})} />
      </View>
    );
  }

  return null;
}

function OptionList({options, selected, onSelect}: {options: Array<{id: string; label: string}>; selected: string | null; onSelect: (id: string) => void}): React.JSX.Element {
  return (
    <View style={styles.options}>
      {options.map(option => {
        const active = option.id === selected;
        return (
          <Pressable accessibilityRole="radio" accessibilityState={{selected: active}} key={option.id} onPress={() => onSelect(option.id)} style={[styles.option, active && styles.optionSelected]}>
            <Text style={[styles.optionText, active && styles.optionTextSelected]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function toggle(current: string[], value: string): string[] {
  return current.includes(value) ? current.filter(item => item !== value) : [...current, value];
}

const styles = StyleSheet.create({
  section: {gap: spacing.md},
  utterance: {alignSelf: 'flex-start', color: colors.text, fontSize: 25, lineHeight: 34, fontWeight: '800', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.md, backgroundColor: '#FFF4D6'},
  help: {color: colors.mutedText, fontSize: 14, lineHeight: 21},
  options: {gap: spacing.sm},
  option: {minHeight: 50, justifyContent: 'center', paddingHorizontal: spacing.md, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm},
  optionSelected: {borderColor: colors.brand, backgroundColor: '#E5F7F8'},
  optionText: {color: colors.text, fontSize: 16, lineHeight: 23, fontWeight: '700'},
  optionTextSelected: {color: colors.brand},
  layer: {gap: spacing.xs, padding: spacing.md, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, backgroundColor: colors.surface},
  layerSelected: {borderColor: colors.brand, backgroundColor: '#E5F7F8'},
  layerLabel: {color: colors.brand, fontSize: 14, lineHeight: 20, fontWeight: '800'},
  layerText: {color: colors.text, fontSize: 15, lineHeight: 22},
  status: {color: colors.success, fontSize: 12, lineHeight: 18, fontWeight: '700'},
  note: {color: '#8A5B00', fontSize: 13, lineHeight: 20, fontWeight: '700'},
});
