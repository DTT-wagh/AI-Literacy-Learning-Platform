import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import modulesConfig from '../../game/config/modules.json';
import type {GameModule, GameModuleId} from '../../game/types/game';
import {colors, radius, spacing} from '../../../shared/theme/tokens';

type ExploreScreenProps = {
  onOpenModule: (module: GameModule) => void;
  onOpenAiChallenge: () => void;
};

type ModulePresentation = {
  id: GameModuleId;
  title: string;
  description: string;
  icon: string;
  accentColor: string;
  surfaceColor: string;
};

const gameModules = modulesConfig as GameModule[];

const modulePresentations: ModulePresentation[] = [
  {
    id: 'language',
    title: '语言侦探社',
    description: '让AI听懂词句，也学会检查它的回答。',
    icon: '文',
    accentColor: '#6550B9',
    surfaceColor: '#F1EEFB',
  },
  {
    id: 'math',
    title: '数据训练营',
    description: '用样本和规律理解AI怎样做出判断。',
    icon: '数',
    accentColor: '#3978C5',
    surfaceColor: '#EAF2FB',
  },
  {
    id: 'creative',
    title: '艺术岛',
    description: '选择关键词，让绘图AI返回一张图片。',
    icon: '艺',
    accentColor: '#D95F59',
    surfaceColor: '#FCEDEC',
  },
  {
    id: 'science',
    title: '科学岛',
    description: '把图片变成数据，观察AI怎样寻找规律并作出预测。',
    icon: '科',
    accentColor: '#278460',
    surfaceColor: '#EAF6F0',
  },
];

const exploreModules = modulePresentations.map(presentation => ({
  presentation,
  module: getGameModule(presentation.id),
}));

export function ExploreScreen({
  onOpenModule,
  onOpenAiChallenge,
}: ExploreScreenProps): React.JSX.Element {
  const {width, fontScale} = useWindowDimensions();
  const useSingleColumn = width < 360 || fontScale >= 1.6;

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      style={styles.scrollView}>
      <View style={styles.intro}>
        <Text style={styles.title}>探索AI</Text>
        <Text style={styles.subtitle}>
          在四个领域亲手理解AI怎样学习、判断和创作
        </Text>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>继续探索</Text>
        <Text style={styles.sectionHint}>选择一个领域，每个任务约5-10分钟</Text>
      </View>

      <View accessibilityRole="list" style={styles.moduleGrid}>
        {exploreModules.map(({module, presentation}) => (
          <ExploreModuleCard
            key={module.id}
            module={module}
            presentation={presentation}
            singleColumn={useSingleColumn}
            onPress={() => onOpenModule(module)}
          />
        ))}
      </View>

      <View style={styles.challengeSection}>
        <Text style={styles.sectionTitle}>AI知识挑战</Text>
        <Pressable
          accessibilityHint="进入独立知识挑战页面"
          accessibilityLabel="AI知识挑战，选择主题，动态出题，约2分钟"
          accessibilityRole="button"
          onPress={onOpenAiChallenge}
          style={({pressed}) => [
            styles.challengeEntry,
            pressed && styles.pressed,
          ]}>
          <View style={styles.challengeCopy}>
            <Text style={styles.challengeTitle}>选择主题 · 动态出题</Text>
            <Text style={styles.challengeDescription}>每次约2分钟</Text>
          </View>
          <Text aria-hidden style={styles.challengeArrow}>
            ›
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

function ExploreModuleCard({
  module,
  presentation,
  singleColumn,
  onPress,
}: {
  module: GameModule;
  presentation: ModulePresentation;
  singleColumn: boolean;
  onPress: () => void;
}): React.JSX.Element {
  const progress = Math.max(0, Math.min(100, module.progress));
  const status = !module.unlocked
    ? '内容准备中'
    : progress >= 100
    ? '已完成 · 可再挑战'
    : progress > 0
    ? `继续探索 · ${progress}%`
    : '开始探索';

  return (
    <Pressable
      accessibilityHint={module.unlocked
        ? module.id === 'math' ? '直接开始AI规律互动' : '进入模块详情'
        : '查看开放说明'}
      accessibilityLabel={`${presentation.title}，${presentation.description}，${status}，按钮`}
      accessibilityRole="button"
      accessibilityState={{disabled: !module.unlocked}}
      disabled={!module.unlocked}
      onPress={onPress}
      style={({pressed}) => [
        styles.moduleCard,
        singleColumn ? styles.moduleCardSingle : styles.moduleCardGrid,
        {backgroundColor: presentation.surfaceColor},
        !module.unlocked && styles.moduleCardLocked,
        pressed && styles.pressed,
      ]}>
      <View style={styles.moduleTopRow}>
        <View
          style={[
            styles.moduleIcon,
            {backgroundColor: presentation.accentColor},
          ]}>
          <Text style={styles.moduleIconText}>{presentation.icon}</Text>
        </View>
        <Text
          aria-hidden
          style={[styles.moduleArrow, {color: presentation.accentColor}]}>
          ›
        </Text>
      </View>

      <View style={styles.moduleCopy}>
        <Text style={styles.moduleTitle}>{presentation.title}</Text>
        <Text style={styles.moduleDescription}>{presentation.description}</Text>
      </View>

      <View style={styles.moduleProgress}>
        <Text style={[styles.moduleStatus, {color: presentation.accentColor}]}>
          {status}
        </Text>
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              {
                backgroundColor: presentation.accentColor,
                width: `${progress}%`,
              },
            ]}
          />
        </View>
      </View>
    </Pressable>
  );
}

function getGameModule(id: GameModuleId): GameModule {
  const module = gameModules.find(item => item.id === id);
  if (!module) {
    throw new Error(`Missing game module configuration: ${id}`);
  }
  return module;
}

const styles = StyleSheet.create({
  scrollView: {flex: 1},
  content: {
    gap: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl + 60,
  },
  intro: {gap: spacing.xs},
  title: {
    color: colors.text,
    fontSize: 26,
    lineHeight: 34,
    fontWeight: '700',
  },
  subtitle: {color: colors.mutedText, fontSize: 14, lineHeight: 21},
  sectionHeader: {gap: spacing.xs},
  sectionTitle: {
    color: colors.text,
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '700',
  },
  sectionHint: {color: colors.mutedText, fontSize: 13, lineHeight: 20},
  moduleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    alignItems: 'stretch',
  },
  moduleCard: {
    minHeight: 220,
    justifyContent: 'space-between',
    gap: spacing.md,
    overflow: 'hidden',
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
  },
  moduleCardGrid: {width: '48%'},
  moduleCardSingle: {width: '100%', minHeight: 196},
  moduleCardLocked: {opacity: 0.68},
  pressed: {opacity: 0.78},
  moduleTopRow: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  moduleIcon: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
  },
  moduleIconText: {
    color: colors.surface,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700',
  },
  moduleArrow: {fontSize: 28, lineHeight: 32, fontWeight: '600'},
  moduleCopy: {gap: spacing.xs},
  moduleTitle: {
    color: colors.text,
    fontSize: 17,
    lineHeight: 24,
    fontWeight: '700',
  },
  moduleDescription: {
    color: colors.mutedText,
    fontSize: 13,
    lineHeight: 20,
  },
  moduleProgress: {gap: spacing.xs},
  moduleStatus: {fontSize: 12, lineHeight: 18, fontWeight: '700'},
  progressTrack: {
    height: 6,
    overflow: 'hidden',
    borderRadius: 3,
    backgroundColor: 'rgba(21, 35, 43, 0.12)',
  },
  progressFill: {height: '100%', borderRadius: 3},
  challengeSection: {gap: spacing.sm},
  challengeEntry: {
    minHeight: 76,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  challengeCopy: {flex: 1, minWidth: 0, gap: spacing.xs},
  challengeTitle: {
    color: colors.text,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '700',
  },
  challengeDescription: {
    color: colors.mutedText,
    fontSize: 13,
    lineHeight: 20,
  },
  challengeArrow: {
    color: colors.brand,
    fontSize: 28,
    lineHeight: 32,
    fontWeight: '600',
  },
});
