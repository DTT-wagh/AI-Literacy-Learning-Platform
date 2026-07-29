import React from 'react';
import {PanResponder, Pressable, StyleSheet, Text, View} from 'react-native';

import {colors, radius, spacing} from '../../../shared/theme/tokens';
import type {GameEvidence} from '../types/game';

type EvidenceCardProps = {
  evidence: GameEvidence;
  selected: boolean;
  onToggle: () => void;
};

export function EvidenceCard({evidence, selected, onToggle}: EvidenceCardProps): React.JSX.Element {
  const dragged = React.useRef(false);
  const panResponder = React.useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dx) + Math.abs(gesture.dy) > 8,
    onPanResponderMove: () => {
      dragged.current = true;
    },
    onPanResponderRelease: () => {
      if (dragged.current) onToggle();
      dragged.current = false;
    },
    onPanResponderTerminate: () => {
      dragged.current = false;
    },
  }), [onToggle]);

  return (
    <Pressable
      {...panResponder.panHandlers}
      accessibilityHint="点击或拖动后松开以选择证据"
      accessibilityRole="checkbox"
      accessibilityState={{checked: selected}}
      onPress={onToggle}
      style={({pressed}) => [styles.card, selected && styles.selected, pressed && styles.pressed]}>
      <View style={styles.header}>
        <Text style={[styles.label, selected && styles.selectedLabel]}>{evidence.label}</Text>
        <Text style={[styles.status, selected && styles.selectedStatus]}>{selected ? '已选择' : '拖动选择'}</Text>
      </View>
      <Text style={styles.content}>{evidence.content}</Text>
      {evidence.source ? <Text style={styles.source}>来源：{evidence.source}</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {gap: spacing.sm, padding: spacing.md, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, backgroundColor: colors.surface},
  selected: {borderColor: colors.brand, backgroundColor: '#E5F7F8'},
  pressed: {opacity: 0.8},
  header: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm},
  label: {flex: 1, color: colors.text, fontSize: 16, lineHeight: 24, fontWeight: '700'},
  selectedLabel: {color: colors.brand},
  status: {color: colors.mutedText, fontSize: 12, lineHeight: 18, fontWeight: '600'},
  selectedStatus: {color: colors.success},
  content: {color: colors.mutedText, fontSize: 14, lineHeight: 21},
  source: {color: colors.brand, fontSize: 12, lineHeight: 18, fontWeight: '600'},
});
