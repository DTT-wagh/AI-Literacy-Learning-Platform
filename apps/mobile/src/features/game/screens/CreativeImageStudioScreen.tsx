import React from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  fallbackCreativeKeywordGroups,
  generateCreativeImage,
  getCreativeKeywordGroups,
  type CreativeImageGeneration,
  type CreativeKeywordGroup,
} from '../../../api/creativeImage';
import {colors, radius, spacing} from '../../../shared/theme/tokens';
import {GameButton} from '../components/GameButton';

type CreativeImageStudioScreenProps = {
  onBack: () => void;
};

let previousSelectionSignature = '';

export function CreativeImageStudioScreen({
  onBack,
}: CreativeImageStudioScreenProps): React.JSX.Element {
  const [groups, setGroups] = React.useState<CreativeKeywordGroup[]>(
    fallbackCreativeKeywordGroups,
  );
  const [selected, setSelected] = React.useState<Record<string, string>>(() =>
    pickSelection(fallbackCreativeKeywordGroups),
  );
  const [result, setResult] = React.useState<CreativeImageGeneration | null>(
    null,
  );
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [imageFailed, setImageFailed] = React.useState(false);
  const hasInteracted = React.useRef(false);

  React.useEffect(() => {
    let active = true;
    getCreativeKeywordGroups()
      .then(remoteGroups => {
        if (!active || remoteGroups.length === 0) return;
        setGroups(remoteGroups);
        if (!hasInteracted.current) {
          setSelected(pickSelection(remoteGroups));
        }
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  const labelFor = (groupId: string): string => {
    const group = groups.find(item => item.id === groupId);
    return (
      group?.options.find(option => option.id === selected[groupId])?.label ??
      ''
    );
  };
  const labels = ['subject', 'setting', 'mood', 'style'].map(labelFor);
  const hasCompleteSelection =
    groups.length > 0 && groups.every(group => Boolean(selected[group.id]));
  const previewPrompt = hasCompleteSelection
    ? `一张适合儿童学习的原创插画：${labels[0]}在${labels[1]}中，整体氛围是${labels[2]}，采用${labels[3]}风格。`
    : '选择四组关键词后，AI会把它们组合成一份创作提示。';
  const chooseKeyword = (groupId: string, optionId: string): void => {
    hasInteracted.current = true;
    setSelected(current => ({...current, [groupId]: optionId}));
    setResult(null);
    setImageFailed(false);
    setError(null);
  };

  const generate = async (): Promise<void> => {
    if (!hasCompleteSelection) return;
    setLoading(true);
    setError(null);
    setImageFailed(false);
    try {
      const next = await generateCreativeImage({
        sceneId: 'art-studio',
        subjectId: selected.subject,
        settingId: selected.setting,
        moodId: selected.mood,
        styleId: selected.style,
      });
      setResult(next);
    } catch (generationError) {
      setError(
        generationError instanceof Error
          ? generationError.message
          : '图片生成失败，请稍后重试。',
      );
    } finally {
      setLoading(false);
    }
  };

  const startAnotherIdea = (): void => {
    setSelected(pickSelection(groups));
    setResult(null);
    setImageFailed(false);
    setError(null);
  };

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}>
      <Pressable
        accessibilityLabel="返回探索"
        accessibilityRole="button"
        onPress={onBack}
        style={styles.backButton}>
        <Text style={styles.backText}>‹ 返回探索</Text>
      </Pressable>

      <View style={styles.header}>
        <Text style={styles.eyebrow}>艺术岛 · 创作实验</Text>
        <Text style={styles.title}>关键词创作工作室</Text>
        <Text style={styles.subtitle}>
          从关键词开始，把你的画面想法交给绘图 AI，生成一张图片。
        </Text>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeading}>
          <Text style={styles.sectionStep}>第一步 · 组合关键词</Text>
          <Text style={styles.sectionTitle}>你想让AI画什么？</Text>
        </View>
        {groups.map(group => (
          <View key={group.id} style={styles.group}>
            <Text style={styles.groupLabel}>{group.label}</Text>
            <View style={styles.options}>
              {group.options.map(option => {
                const isSelected = selected[group.id] === option.id;
                return (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{selected: isSelected}}
                    key={option.id}
                    onPress={() => chooseKeyword(group.id, option.id)}
                    testID={`creative-option-${group.id}-${option.id}`}
                    style={[
                      styles.option,
                      isSelected && styles.optionSelected,
                    ]}>
                    <Text
                      style={[
                        styles.optionText,
                        isSelected && styles.optionTextSelected,
                      ]}>
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ))}
      </View>

      <View style={styles.promptPanel}>
        <Text style={styles.promptLabel}>Prompt 预览</Text>
        <Text
          accessibilityLabel={`Prompt预览：${previewPrompt}`}
          style={styles.promptText}>
          {previewPrompt}
        </Text>
        <Text style={styles.promptNotice}>
          关键词由课程词库提供，点击生成后，绘图 AI 会把图片直接返回到这里。
        </Text>
        <GameButton
          disabled={loading || !hasCompleteSelection}
          label={
            loading
              ? 'AI正在生成...'
              : result
              ? '按当前关键词重新生成'
              : '生成图片'
          }
          onPress={generate}
          testID="creative-generate"
        />
        <GameButton
          label="换一组灵感"
          onPress={startAnotherIdea}
          variant="secondary"
          testID="creative-randomize"
        />
      </View>

      {loading ? (
        <View accessibilityLabel="AI正在生成图片" style={styles.loading}>
          <ActivityIndicator color={colors.brand} size="small" />
          <Text style={styles.loadingText}>绘图 AI 正在生成图片...</Text>
        </View>
      ) : null}

      {error ? (
        <View style={styles.error}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {result ? (
        <View style={styles.resultPanel}>
          <View style={styles.resultHeading}>
            <Text style={styles.sectionStep}>第二步 · 查看图片</Text>
            <Text style={styles.resultBadge}>AI生成结果</Text>
          </View>
          {imageFailed ? (
            <View style={styles.imageError}>
              <Text style={styles.imageErrorTitle}>图片加载失败</Text>
              <Text style={styles.imageErrorText}>
                绘图 AI 已返回结果，但当前设备无法读取图片，请重新生成。
              </Text>
            </View>
          ) : (
            <Image
              accessibilityLabel="AI生成的图片"
              onError={() => setImageFailed(true)}
              source={{uri: result.imageUrl}}
              style={styles.resultImage}
            />
          )}
          <Text style={styles.resultPrompt}>{result.prompt}</Text>
          <Text style={styles.resultNotice}>{result.notice}</Text>
        </View>
      ) : null}
    </ScrollView>
  );
}

function pickSelection(groups: CreativeKeywordGroup[]): Record<string, string> {
  if (groups.length === 0) return {};
  let next: Record<string, string> = {};
  let signature = '';
  for (let attempt = 0; attempt < 8; attempt += 1) {
    next = Object.fromEntries(
      groups.map(group => {
        const index = Math.floor(Math.random() * group.options.length);
        return [group.id, group.options[index]?.id ?? ''];
      }),
    );
    signature = groups.map(group => next[group.id]).join('|');
    if (signature !== previousSelectionSignature || groups.length === 1) break;
  }
  previousSelectionSignature = signature;
  return next;
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingBottom: spacing.xl,
  },
  backButton: {
    alignSelf: 'flex-start',
    minHeight: 40,
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  backText: {
    color: colors.brand,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '700',
  },
  header: {gap: spacing.sm},
  eyebrow: {
    color: colors.brand,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
  },
  title: {color: colors.text, fontSize: 26, lineHeight: 34, fontWeight: '700'},
  subtitle: {color: colors.mutedText, fontSize: 15, lineHeight: 22},
  section: {
    gap: spacing.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
  },
  sectionHeading: {gap: spacing.xs},
  sectionStep: {
    color: colors.brand,
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '800',
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 21,
    lineHeight: 29,
    fontWeight: '800',
  },
  group: {gap: spacing.sm},
  groupLabel: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '800',
  },
  options: {gap: spacing.sm},
  option: {
    minHeight: 46,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
  },
  optionSelected: {borderColor: colors.brand, backgroundColor: '#E5F7F8'},
  optionText: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '600',
  },
  optionTextSelected: {color: colors.brand, fontWeight: '800'},
  promptPanel: {
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: '#FFF8E8',
  },
  promptLabel: {
    color: '#8A5B00',
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '800',
  },
  promptText: {
    color: colors.text,
    fontSize: 16,
    lineHeight: 25,
    fontWeight: '700',
  },
  promptNotice: {color: colors.mutedText, fontSize: 13, lineHeight: 20},
  loading: {
    minHeight: 96,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  loadingText: {color: colors.mutedText, fontSize: 15, lineHeight: 22},
  error: {
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: '#FFF0ED',
  },
  errorText: {color: '#A64636', fontSize: 14, lineHeight: 21},
  resultPanel: {
    gap: spacing.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: '#9ACCC4',
    borderRadius: radius.lg,
    backgroundColor: '#F0FAF6',
  },
  resultHeading: {gap: spacing.sm},
  resultBadge: {
    alignSelf: 'flex-start',
    color: '#8A5B00',
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '800',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    backgroundColor: '#FFF0C2',
  },
  resultImage: {
    width: '100%',
    aspectRatio: 1.45,
    borderRadius: radius.md,
    backgroundColor: '#DDECE8',
  },
  imageError: {
    minHeight: 180,
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: '#FFF0ED',
  },
  imageErrorTitle: {
    color: '#A64636',
    fontSize: 17,
    lineHeight: 24,
    fontWeight: '800',
  },
  imageErrorText: {color: colors.mutedText, fontSize: 14, lineHeight: 21},
  resultPrompt: {color: colors.text, fontSize: 14, lineHeight: 22},
  resultNotice: {color: colors.mutedText, fontSize: 14, lineHeight: 21},
});
