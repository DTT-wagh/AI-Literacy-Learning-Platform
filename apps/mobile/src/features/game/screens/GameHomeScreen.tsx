import React from 'react';
import {Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';

import {colors, spacing} from '../../../shared/theme/tokens';
import modulesConfig from '../config/modules.json';
import {ModuleCard} from '../components/ModuleCard';
import type {GameModule} from '../types/game';

const modules = modulesConfig as GameModule[];

type GameHomeScreenProps = {
  onBack: () => void;
  onOpenLearningCenter: () => void;
  onModulePress: (module: GameModule) => void;
};

export function GameHomeScreen({onBack, onOpenLearningCenter, onModulePress}: GameHomeScreenProps): React.JSX.Element {
  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text accessibilityRole="button" onPress={onBack} style={styles.back}>返回探索</Text>
      <View style={styles.intro}>
        <Text style={styles.eyebrow}>AI互动游戏</Text>
        <Text style={styles.title}>选择你的学习岛屿</Text>
        <Text style={styles.subtitle}>在小任务中认识AI怎样理解、分类、识别和创作；艺术岛会把绘图AI返回的图片直接展示出来。</Text>
      </View>
      <Pressable accessibilityRole="button" onPress={onOpenLearningCenter} style={styles.learningCenterButton}>
        <View style={styles.learningCenterCopy}>
          <Text style={styles.learningCenterTitle}>学习中心</Text>
          <Text style={styles.learningCenterText}>查看任务进度与AI探索记录</Text>
        </View>
        <Text style={styles.learningCenterAction}>查看</Text>
      </Pressable>
      <View style={styles.list}>
        {modules.map(module => (
          <ModuleCard key={module.id} module={module} onPress={() => onModulePress(module)} />
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {gap: spacing.md, paddingVertical: spacing.md, paddingBottom: spacing.xl},
  back: {alignSelf: 'flex-start', minHeight: 40, color: colors.brand, fontSize: 15, lineHeight: 40, fontWeight: '700', paddingHorizontal: spacing.sm},
  intro: {gap: spacing.xs},
  eyebrow: {color: colors.brand, fontSize: 13, lineHeight: 20, fontWeight: '700'},
  title: {color: colors.text, fontSize: 26, lineHeight: 34, fontWeight: '700'},
  subtitle: {color: colors.mutedText, fontSize: 15, lineHeight: 22},
  list: {gap: spacing.md},
  learningCenterButton: {minHeight: 72, flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, borderWidth: 1, borderColor: colors.border, borderRadius: 8, backgroundColor: colors.surface},
  learningCenterCopy: {flex: 1, minWidth: 0, gap: spacing.xs},
  learningCenterTitle: {color: colors.text, fontSize: 17, lineHeight: 24, fontWeight: '700'},
  learningCenterText: {color: colors.mutedText, fontSize: 13, lineHeight: 20},
  learningCenterAction: {color: colors.brand, fontSize: 14, lineHeight: 20, fontWeight: '700'},
});
