import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';

import {colors, radius, spacing} from '../shared/theme/tokens';

type LearningCardProps = {
  compact: boolean;
  item?: {
    title: string;
    description: string;
  };
  onContinue?: () => void;
};

export function LearningCard({compact, item, onContinue}: LearningCardProps): React.JSX.Element {
  if (!item) {
    return (
      <View style={[styles.learningCard, styles.learningCardUnavailable, compact && styles.learningCardCompact]}>
        <View style={styles.cardCopy}>
          <Text style={styles.eyebrow}>继续学习</Text>
          <Text style={styles.unavailableTitle}>还没有可继续的学习内容</Text>
          <Text style={styles.cardDescriptionUnavailable}>完成课程后，这里会显示你的真实学习进度。</Text>
          <Text style={styles.unavailableHint}>学习记录接入后开放</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.learningCard, compact && styles.learningCardCompact]}>
      <View style={styles.cardCopy}>
        <Text style={styles.eyebrow}>继续学习</Text>
        <Text numberOfLines={2} style={styles.cardTitle}>{item.title}</Text>
        <Text numberOfLines={2} style={styles.cardDescription}>{item.description}</Text>
        <Pressable accessibilityLabel={`继续学习${item.title}`} onPress={onContinue} style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>继续学习</Text>
        </Pressable>
      </View>
      {!compact && <View accessibilityLabel="图像识别课程插图占位" style={styles.courseVisual} />}
    </View>
  );
}

const styles = StyleSheet.create({
  learningCard: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: colors.brand,
    borderRadius: radius.md,
    padding: spacing.lg,
  },
  learningCardCompact: {
    padding: spacing.md,
  },
  learningCardUnavailable: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardCopy: {
    flex: 1,
    gap: spacing.sm,
  },
  eyebrow: {
    color: '#D8F5F7',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
  },
  cardTitle: {
    color: colors.surface,
    fontSize: 22,
    lineHeight: 30,
    fontWeight: '700',
  },
  cardDescription: {
    color: '#E5F7F8',
    fontSize: 14,
    lineHeight: 20,
  },
  cardDescriptionUnavailable: {
    color: colors.mutedText,
    fontSize: 14,
    lineHeight: 20,
  },
  unavailableTitle: {
    color: colors.text,
    fontSize: 18,
    lineHeight: 26,
    fontWeight: '700',
  },
  unavailableHint: {
    color: colors.mutedText,
    fontSize: 14,
    lineHeight: 20,
  },
  primaryButton: {
    alignSelf: 'flex-start',
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
  },
  primaryButtonText: {
    color: colors.brand,
    fontSize: 16,
    fontWeight: '700',
  },
  courseVisual: {
    width: 96,
    height: 96,
    flexShrink: 0,
    alignSelf: 'center',
    borderRadius: radius.lg,
    backgroundColor: colors.sun,
  },
});
