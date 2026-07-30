import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';

import {colors, radius, spacing} from '../../../shared/theme/tokens';
import type {GameChoiceOption} from '../types/game';

type EvidenceSelectorProps = {
  options: GameChoiceOption[];
  selectedId: string | null;
  onSelect: (id: string) => void;
};

export function EvidenceSelector({options, selectedId, onSelect}: EvidenceSelectorProps): React.JSX.Element {
  return (
    <View style={styles.options}>
      {options.map(option => {
        const selected = option.id === selectedId;
        return (
          <Pressable accessibilityRole="radio" accessibilityState={{selected}} key={option.id} onPress={() => onSelect(option.id)} style={[styles.option, selected && styles.selected]}>
            <Text style={[styles.label, selected && styles.selectedLabel]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  options: {gap: spacing.sm},
  option: {minHeight: 50, justifyContent: 'center', paddingHorizontal: spacing.md, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, backgroundColor: colors.surface},
  selected: {borderColor: colors.brand, backgroundColor: '#E5F7F8'},
  label: {color: colors.text, fontSize: 16, lineHeight: 24, fontWeight: '700'},
  selectedLabel: {color: colors.brand},
});
