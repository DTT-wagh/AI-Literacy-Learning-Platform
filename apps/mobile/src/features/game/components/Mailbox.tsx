import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';

import {colors, radius, spacing} from '../../../shared/theme/tokens';
import type {GameL1Category} from '../types/game';

type MailboxProps = {
  category: GameL1Category;
  selected?: boolean;
  count: number;
  onPress: () => void;
  mailboxRef?: React.RefObject<View | null>;
  onLayout?: () => void;
};

export function Mailbox({category, selected = false, count, onPress, mailboxRef, onLayout}: MailboxProps): React.JSX.Element {
  return (
    <View ref={mailboxRef} onLayout={onLayout} style={styles.wrapper}>
      <Pressable accessibilityRole="button" accessibilityLabel={category.label + '邮筒，' + count + '张'} onPress={onPress} style={[styles.mailbox, selected && styles.selected]}>
        <Text style={styles.icon}>✉</Text>
        <View style={styles.copy}>
          <Text style={styles.label}>{category.label}</Text>
          <Text style={styles.prompt}>{category.prompt}</Text>
        </View>
        <Text style={styles.count}>{count}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {width: '48%', minHeight: 76},
  mailbox: {minHeight: 76, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.sm, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, backgroundColor: '#FFF8E8'},
  selected: {borderColor: colors.brand, backgroundColor: '#E5F7F8'},
  icon: {fontSize: 26, lineHeight: 32},
  copy: {flex: 1, gap: 2},
  label: {color: colors.text, fontSize: 16, lineHeight: 22, fontWeight: '800'},
  prompt: {color: colors.mutedText, fontSize: 12, lineHeight: 17},
  count: {color: colors.brand, fontSize: 16, lineHeight: 22, fontWeight: '800'},
});
