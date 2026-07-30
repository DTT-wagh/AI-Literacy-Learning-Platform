import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';

import {colors, radius, spacing} from '../../../shared/theme/tokens';
import {GameButton} from './GameButton';
import {getLocalG1TestResults} from '../services/languageLocalCandidateService';
import type {LanguageGame, LanguageSessionData, LanguageWordCard} from '../types/language';

type WordLabelBoardProps = {
  game: LanguageGame;
  stageId: string;
  data: LanguageSessionData;
  onChange: (patch: Partial<LanguageSessionData>) => void;
};

export function WordLabelBoard({game, stageId, data, onChange}: WordLabelBoardProps): React.JSX.Element | null {
  const content = game.content;

  if (stageId === 'label-rules') {
    const cards = (content.basicCards ?? []).map(toLegacyCard);
    const categories = (content.labels ?? []).map(label => ({id: label.id, label: label.label, prompt: label.prompt}));
    return (
      <View style={styles.section}>
        <LabelClassificationBoard
          assignments={data.labels}
          cards={cards}
          categories={categories}
          onConfirm={(wordIds, categoryId) => {
            const labels = {...data.labels};
            wordIds.forEach(wordId => {
              labels[wordId] = categoryId as LanguageWordCard['label'];
            });
            onChange({labels});
          }}
        />
      </View>
    );
  }

  if (stageId === 'training-samples') {
    return (
      <View style={styles.section}>
        <Text style={styles.help}>每类选择2至4张样本。样本太少或太像，AI就很难学到规律。</Text>
        {(content.labels ?? []).map(label => {
          const samples = (content.samplePool ?? []).filter(sample => sample.label === label.id);
          const count = data.trainingSampleIds.filter(id => samples.some(sample => sample.id === id)).length;
          return (
            <View key={label.id} style={styles.sampleGroup}>
              <Text style={styles.groupTitle}>{label.label} · 已选 {count} / 2–4</Text>
              <View style={styles.chips}>
                {samples.map(sample => {
                  const selected = data.trainingSampleIds.includes(sample.id);
                  return (
                    <Pressable
                      accessibilityRole="checkbox"
                      accessibilityState={{checked: selected}}
                      key={sample.id}
                      onPress={() => onChange({trainingSampleIds: toggleSample(data.trainingSampleIds, sample.id, count, selected)})}
                      style={[styles.chip, selected && styles.chipSelected]}>
                      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{sample.text}</Text>
                    </Pressable>
                  );
                })}
              </View>
              {count < 2 ? <Text style={styles.warning}>AI还没有看够这一类的例子。</Text> : null}
            </View>
          );
        })}
      </View>
    );
  }

  if (stageId === 'misclassification-diagnosis') {
    return (
      <View style={styles.section}>
        <Text style={styles.help}>“疑惑”被错分时，最可能出了什么问题？</Text>
        {(content.diagnosisOptions ?? []).map(option => {
          const selected = option.id === data.diagnosisId;
          return (
            <Pressable accessibilityRole="radio" accessibilityState={{selected}} key={option.id} onPress={() => onChange({diagnosisId: option.id})} style={[styles.option, selected && styles.optionSelected]}>
              <Text style={[styles.optionText, selected && styles.optionTextSelected]}>{option.label}</Text>
            </Pressable>
          );
        })}
      </View>
    );
  }

  if (stageId === 'repair-training') {
    const before = getLocalG1TestResults({...data, repairSampleIds: []}).find(result => result.itemId === 'test-confused');
    const after = getLocalG1TestResults(data).find(result => result.itemId === 'test-confused');
    return (
      <View style={styles.section}>
        <Text style={styles.help}>补几张不同的情绪样本，再看看测试结果会不会变化。</Text>
        <View style={styles.chips}>
          {(content.samplePool ?? [])
            .filter(sample => (content.repairSampleIds ?? []).includes(sample.id))
            .map(sample => {
              const selected = data.repairSampleIds.includes(sample.id);
              return (
                <Pressable accessibilityRole="checkbox" accessibilityState={{checked: selected}} key={sample.id} onPress={() => onChange({repairSampleIds: toggleId(data.repairSampleIds, sample.id)})} style={[styles.chip, selected && styles.chipSelected]}>
                  <Text style={[styles.chipText, selected && styles.chipTextSelected]}>补充：{sample.text}</Text>
                </Pressable>
              );
            })}
        </View>
        <ResultCompare before={before?.label ?? '未知'} after={after?.label ?? '未知'} />
      </View>
    );
  }

  return null;
}

type LabelClassificationBoardProps = {
  cards: Array<{id: string; text: string; category: string}>;
  categories: Array<{id: string; label: string; prompt: string}>;
  assignments: Record<string, string>;
  onConfirm: (wordIds: string[], categoryId: string) => void;
};

function LabelClassificationBoard({cards, categories, assignments, onConfirm}: LabelClassificationBoardProps): React.JSX.Element {
  const [orderedCards] = React.useState(() => shuffle(cards));
  const [orderedCategories] = React.useState(() => shuffle(categories));
  const [activeCategoryId, setActiveCategoryId] = React.useState<string | null>(null);
  const [selectedWordIds, setSelectedWordIds] = React.useState<string[]>([]);
  const assignedCount = Object.keys(assignments).length;
  const activeCategory = categories.find(category => category.id === activeCategoryId);

  const selectCategory = (categoryId: string) => {
    setActiveCategoryId(current => {
      if (current === categoryId) return current;
      setSelectedWordIds([]);
      return categoryId;
    });
  };

  const toggleWord = (wordId: string) => {
    if (!activeCategoryId || assignments[wordId]) return;
    setSelectedWordIds(current => current.includes(wordId)
      ? current.filter(id => id !== wordId)
      : [...current, wordId]);
  };

  const confirmSelection = () => {
    if (!activeCategoryId || selectedWordIds.length === 0) return;
    const availableWordIds = selectedWordIds.filter(wordId => !assignments[wordId]);
    if (availableWordIds.length > 0) onConfirm(availableWordIds, activeCategoryId);
    setSelectedWordIds([]);
  };

  return (
    <View style={styles.board}>
      <Text style={styles.help}>先选择标签，再多选词语；再点一次可取消选择，确认后归纳到标签。</Text>
      <View style={styles.categoryList}>
        {orderedCategories.map(category => {
          const count = Object.values(assignments).filter(id => id === category.id).length;
          const active = activeCategoryId === category.id;
          return (
            <Pressable
              accessibilityRole="radio"
              accessibilityState={{selected: active}}
              key={category.id}
              onPress={() => selectCategory(category.id)}
              style={[styles.category, active && styles.categorySelected]}>
              <View style={styles.categoryCopy}>
                <Text style={[styles.categoryLabel, active && styles.categoryLabelSelected]}>{category.label}</Text>
                <Text style={styles.categoryPrompt}>{category.prompt}</Text>
              </View>
              <Text style={styles.categoryCount}>{count}</Text>
            </Pressable>
          );
        })}
      </View>
      <Text style={styles.selectionHint}>
        {activeCategory ? `当前标签：${activeCategory.label} · 已选 ${selectedWordIds.length} 张` : '请先选择一个标签'}
      </Text>
      <View style={styles.cards}>
        {orderedCards.map(card => {
          const assignedCategoryId = assignments[card.id];
          const assignedCategory = categories.find(category => category.id === assignedCategoryId);
          const selected = selectedWordIds.includes(card.id);
          const disabled = Boolean(assignedCategoryId) || !activeCategoryId;
          return (
            <Pressable
              accessibilityRole="checkbox"
              accessibilityState={{checked: selected, disabled}}
              disabled={disabled}
              key={card.id}
              onPress={() => toggleWord(card.id)}
              style={[styles.wordCard, selected && styles.wordCardSelected, assignedCategory && styles.wordCardAssigned, disabled && !assignedCategory && styles.wordCardDisabled]}>
              <Text style={[styles.wordText, selected && styles.wordTextSelected]}>{card.text}</Text>
              {assignedCategory ? <Text style={styles.assignedText}>已归纳：{assignedCategory.label}</Text> : null}
            </Pressable>
          );
        })}
      </View>
      <GameButton
        disabled={!activeCategoryId || selectedWordIds.length === 0}
        label={activeCategory ? `确认归纳到「${activeCategory.label}」` : '确认归纳'}
        onPress={confirmSelection}
      />
      <Text style={styles.progress}>已归纳 {assignedCount} / {cards.length} 张词语卡</Text>
    </View>
  );
}

function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

function ResultCompare({before, after}: {before: string; after: string}): React.JSX.Element {
  return (
    <View style={styles.compare}>
      <Text style={styles.compareTitle}>重新训练前后</Text>
      <Text style={styles.compareText}>之前：疑惑 → {before}</Text>
      <Text style={styles.compareText}>现在：疑惑 → {after}</Text>
    </View>
  );
}

function toggleSample(current: string[], id: string, count: number, selected: boolean): string[] {
  if (selected) return current.filter(item => item !== id);
  if (count >= 4) return current;
  return [...current, id];
}

function toggleId(current: string[], id: string): string[] {
  return current.includes(id) ? current.filter(item => item !== id) : [...current, id];
}

function toLegacyCard(card: LanguageWordCard): {id: string; text: string; category: string} {
  return {id: card.id, text: card.text, category: card.label};
}

const styles = StyleSheet.create({
  section: {gap: spacing.md},
  help: {color: colors.mutedText, fontSize: 14, lineHeight: 21},
  board: {gap: spacing.md},
  categoryList: {flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm},
  category: {width: '48%', minHeight: 72, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.sm, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, backgroundColor: '#FFF8E8'},
  categorySelected: {borderColor: colors.brand, backgroundColor: '#E5F7F8'},
  categoryCopy: {flex: 1, minWidth: 0, gap: 2},
  categoryLabel: {color: colors.text, fontSize: 16, lineHeight: 22, fontWeight: '800'},
  categoryLabelSelected: {color: colors.brand},
  categoryPrompt: {color: colors.mutedText, fontSize: 12, lineHeight: 17},
  categoryCount: {color: colors.brand, fontSize: 16, lineHeight: 22, fontWeight: '800'},
  selectionHint: {color: colors.text, fontSize: 14, lineHeight: 21, fontWeight: '700'},
  cards: {flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: spacing.sm},
  wordCard: {width: '48%', minHeight: 62, alignItems: 'center', justifyContent: 'center', gap: 2, paddingHorizontal: spacing.sm, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, backgroundColor: colors.surface},
  wordCardSelected: {borderColor: colors.brand, backgroundColor: '#E5F7F8'},
  wordCardAssigned: {borderColor: '#9ACCC4', backgroundColor: '#F0FAF6'},
  wordCardDisabled: {opacity: 0.55},
  wordText: {color: colors.text, fontSize: 17, lineHeight: 24, fontWeight: '700'},
  wordTextSelected: {color: colors.brand},
  assignedText: {color: colors.success, fontSize: 11, lineHeight: 16, fontWeight: '700'},
  progress: {color: colors.success, fontSize: 14, lineHeight: 21, fontWeight: '700'},
  sampleGroup: {gap: spacing.sm, padding: spacing.sm, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm},
  groupTitle: {color: colors.text, fontSize: 15, lineHeight: 22, fontWeight: '800'},
  chips: {flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm},
  chip: {minHeight: 40, justifyContent: 'center', paddingHorizontal: spacing.sm, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, backgroundColor: colors.surface},
  chipSelected: {borderColor: colors.brand, backgroundColor: '#E5F7F8'},
  chipText: {color: colors.text, fontSize: 14, lineHeight: 20, fontWeight: '700'},
  chipTextSelected: {color: colors.brand},
  warning: {color: '#8A5B00', fontSize: 13, lineHeight: 19, fontWeight: '700'},
  option: {minHeight: 50, justifyContent: 'center', paddingHorizontal: spacing.md, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm},
  optionSelected: {borderColor: colors.brand, backgroundColor: '#E5F7F8'},
  optionText: {color: colors.text, fontSize: 16, lineHeight: 23, fontWeight: '700'},
  optionTextSelected: {color: colors.brand},
  compare: {gap: spacing.xs, padding: spacing.md, borderRadius: radius.md, backgroundColor: '#F0FAF6'},
  compareTitle: {color: colors.success, fontSize: 14, lineHeight: 20, fontWeight: '800'},
  compareText: {color: colors.text, fontSize: 15, lineHeight: 22},
});
