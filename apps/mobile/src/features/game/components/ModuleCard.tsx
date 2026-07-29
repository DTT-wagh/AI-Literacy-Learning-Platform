import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';

import {colors, radius, spacing} from '../../../shared/theme/tokens';
import type {GameModule} from '../types/game';
import {ProgressBar} from './ProgressBar';

type ModuleCardProps = {
  module: GameModule;
  onPress: () => void;
};

export function ModuleCard({module, onPress}: ModuleCardProps): React.JSX.Element {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={!module.unlocked}
      onPress={onPress}
      style={({pressed}) => [
        styles.card,
        module.accentColor ? {borderTopColor: module.accentColor, borderTopWidth: 4} : null,
        !module.unlocked && styles.locked,
        pressed && styles.pressed,
      ]}>
      <View style={styles.header}>
        <View style={styles.heading}>
          <Text style={styles.title}>{module.name}</Text>
          <Text style={styles.goal}>{module.goal}</Text>
        </View>
        <View style={[styles.badge, module.unlocked ? styles.badgeUnlocked : styles.badgeLocked]}>
          <Text style={[styles.badgeText, module.unlocked ? styles.unlockedText : styles.lockedText]}>
            {module.unlocked ? '已解锁' : '未解锁'}
          </Text>
        </View>
      </View>
      <Text style={styles.description}>{module.description}</Text>
      {module.levels ? (
        <View style={styles.levels}>
          {module.levels.map(level => (
            <Text key={level.id} style={styles.level}>
              {level.id} {level.title}
            </Text>
          ))}
        </View>
      ) : null}
      <ProgressBar value={module.progress} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {gap: spacing.md, padding: spacing.lg, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, backgroundColor: colors.surface},
  header: {flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.sm},
  heading: {flex: 1, gap: spacing.xs},
  title: {color: colors.text, fontSize: 21, lineHeight: 28, fontWeight: '700'},
  goal: {color: colors.brand, fontSize: 14, lineHeight: 20, fontWeight: '700'},
  description: {color: colors.mutedText, fontSize: 14, lineHeight: 21},
  levels: {gap: spacing.xs},
  level: {color: colors.mutedText, fontSize: 12, lineHeight: 18},
  badge: {paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: radius.sm},
  badgeUnlocked: {backgroundColor: '#E7F6EC'},
  badgeLocked: {backgroundColor: '#EEF2F4'},
  badgeText: {fontSize: 12, lineHeight: 18, fontWeight: '700'},
  unlockedText: {color: colors.success},
  lockedText: {color: colors.mutedText},
  locked: {opacity: 0.65},
  pressed: {opacity: 0.8},
});
