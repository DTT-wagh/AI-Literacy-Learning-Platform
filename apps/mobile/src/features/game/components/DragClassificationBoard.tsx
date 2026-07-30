import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';

import {colors, radius, spacing} from '../../../shared/theme/tokens';
import type {GameL1Category, GameL1Word} from '../types/game';
import {GameButton} from './GameButton';

type DragClassificationBoardProps = {
  cards: GameL1Word[];
  categories: GameL1Category[];
  assignments: Record<string, string>;
  onAssign: (wordId: string, categoryId: string) => void;
  onUndo: (wordId: string) => void;
};

export function DragClassificationBoard({cards, categories, assignments, onAssign, onUndo}: DragClassificationBoardProps): React.JSX.Element {
  const [orderedCards] = React.useState(() => shuffle(cards));
  const [orderedCategories] = React.useState(() => shuffle(categories));
  const [activeCategoryId, setActiveCategoryId] = React.useState<string | null>(null);
  const [selectedWordIds, setSelectedWordIds] = React.useState<string[]>([]);
  const [lastCommittedWordIds, setLastCommittedWordIds] = React.useState<string[]>([]);
  const activeCategory = categories.find(category => category.id === activeCategoryId);
  const assignedCount = Object.keys(assignments).length;

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
    availableWordIds.forEach(wordId => onAssign(wordId, activeCategoryId));
    setLastCommittedWordIds(availableWordIds);
    setSelectedWordIds([]);
  };

  const undoLastCommit = () => {
    lastCommittedWordIds.forEach(wordId => onUndo(wordId));
    setLastCommittedWordIds([]);
  };

  return (
    <View style={styles.board}>
      <Text style={styles.instruction}>先选择标签，再多选词语；再点一次可取消选择，确认后归纳到标签。</Text>
      <View style={styles.categories}>
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
      {lastCommittedWordIds.length > 0 ? <GameButton label="撤销最近归纳" onPress={undoLastCommit} variant="secondary" /> : null}
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

const styles = StyleSheet.create({
  board: {gap: spacing.md},
  instruction: {color: colors.mutedText, fontSize: 14, lineHeight: 21},
  categories: {flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm},
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
});
