import React from 'react';
import {StyleSheet, Text, View} from 'react-native';

import {colors, spacing} from '../shared/theme/tokens';

type PlaceholderScreenProps = {
  title: string;
};

export function PlaceholderScreen({title}: PlaceholderScreenProps): React.JSX.Element {
  return (
    <View style={styles.placeholder}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.placeholderText}>该模块的内容与状态将在对应功能迭代中接入。</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    flex: 1,
    gap: spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '700',
  },
  placeholderText: {
    maxWidth: 300,
    color: colors.mutedText,
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
  },
});
