import React from 'react';
import {Animated, PanResponder, Pressable, StyleSheet, Text} from 'react-native';

import {colors, radius, spacing} from '../../../shared/theme/tokens';
import type {GameL1Word} from '../types/game';

type WordCardProps = {
  word: GameL1Word;
  selected?: boolean;
  assignedCategory?: string;
  onPress: () => void;
  onDragEnd: (moveX: number, moveY: number) => void;
};

export function WordCard({word, selected = false, assignedCategory, onPress, onDragEnd}: WordCardProps): React.JSX.Element {
  const position = React.useRef(new Animated.ValueXY()).current;
  const panResponder = React.useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dx) + Math.abs(gesture.dy) > 8,
    onPanResponderMove: Animated.event([null, {dx: position.x, dy: position.y}], {useNativeDriver: false}),
    onPanResponderRelease: (_, gesture) => {
      onDragEnd(gesture.moveX, gesture.moveY);
      Animated.spring(position, {toValue: {x: 0, y: 0}, useNativeDriver: false, bounciness: 6}).start();
    },
    onPanResponderTerminate: () => Animated.spring(position, {toValue: {x: 0, y: 0}, useNativeDriver: false}).start(),
  }), [onDragEnd, position]);

  return (
    <Animated.View style={[styles.wrapper, {transform: position.getTranslateTransform()}]}>
      <Pressable
        {...panResponder.panHandlers}
        accessibilityLabel={assignedCategory ? word.text + '，已放入' + assignedCategory : word.text}
        accessibilityRole="button"
        accessibilityState={{selected}}
        onPress={onPress}
        style={[styles.card, selected && styles.selected, assignedCategory && styles.assigned]}
      >
        <Text style={[styles.word, selected && styles.selectedWord]}>{word.text}</Text>
        {assignedCategory ? <Text style={styles.assignedText}>{assignedCategory}</Text> : null}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {width: '48%', minHeight: 58},
  card: {minHeight: 58, alignItems: 'center', justifyContent: 'center', gap: 2, paddingHorizontal: spacing.sm, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, backgroundColor: colors.surface},
  selected: {borderColor: colors.brand, backgroundColor: '#E5F7F8'},
  assigned: {borderColor: '#9ACCC4', backgroundColor: '#F0FAF6'},
  word: {color: colors.text, fontSize: 17, lineHeight: 24, fontWeight: '700'},
  selectedWord: {color: colors.brand},
  assignedText: {color: colors.success, fontSize: 11, lineHeight: 16, fontWeight: '700'},
});
