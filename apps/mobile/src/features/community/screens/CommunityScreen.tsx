import React, {useState} from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import {ExploreScreen} from '../../explore/screens/ExploreScreen';
import type {GameModule} from '../../game/types/game';
import {colors, radius, spacing} from '../../../shared/theme/tokens';
import {PostCard} from '../components/PostCard';

type CommunityScreenProps = {
  activeModule?: CommunityModule;
  onActiveModuleChange?: (module: CommunityModule) => void;
  onOpenModule: (module: GameModule) => void;
  onOpenAiChallenge: () => void;
};

export type CommunityModule = 'community' | 'explore';

const posts = [
  {
    name: '张三',
    time: '10分钟前',
    content:
      '我完成了第一个Python AI项目，遇到了模型训练速度慢的问题，大家有什么优化建议？',
    likes: 25,
    comments: 8,
    hasImage: true,
  },
  {
    name: '小李',
    time: '1小时前',
    content: '有没有推荐的AI学习资料？我想更好地理解机器学习。',
    likes: 12,
    comments: 3,
  },
];

const works = [
  {title: '我的AI绘画作品', author: '小雨'},
  {title: '垃圾分类AI小程序', author: '阿杰'},
  {title: '植物识别模型实验', author: '乐乐'},
];

const discussions = [
  {
    question: '为什么AI可以识别人脸？',
    answer: '因为模型通过大量图片学习脸部特征。',
    likes: 18,
  },
  {
    question: '训练数据为什么重要？',
    answer: '高质量数据能帮助AI学到更准确的规律。',
    likes: 11,
  },
];

export function CommunityScreen({
  activeModule: controlledActiveModule,
  onActiveModuleChange,
  onOpenModule,
  onOpenAiChallenge,
}: CommunityScreenProps): React.JSX.Element {
  const [localActiveModule, setLocalActiveModule] =
    useState<CommunityModule>('community');
  const [likedWorks, setLikedWorks] = useState<Set<string>>(new Set());
  const activeModule = controlledActiveModule ?? localActiveModule;
  const selectModule = (module: CommunityModule): void => {
    if (controlledActiveModule === undefined) setLocalActiveModule(module);
    onActiveModuleChange?.(module);
  };
  return (
    <View style={styles.screen}>
      <View accessibilityRole="tablist" style={styles.moduleTabs}>
        <ModuleTab
          active={activeModule === 'community'}
          label="社区动态"
          onPress={() => selectModule('community')}
        />
        <ModuleTab
          active={activeModule === 'explore'}
          label="探索 AI"
          onPress={() => selectModule('explore')}
        />
      </View>
      {activeModule === 'explore' ? (
        <ExploreScreen
          onOpenAiChallenge={onOpenAiChallenge}
          onOpenModule={onOpenModule}
        />
      ) : (
        <FlatList
          contentContainerStyle={styles.content}
          data={posts}
          keyExtractor={item => `${item.name}-${item.time}`}
          ListHeaderComponent={
            <View style={styles.header}>
              <Text style={styles.title}>AI学习社区</Text>
              <TextInput
                accessibilityLabel="搜索社区内容"
                placeholder="搜索AI问题、作品、学习经验"
                placeholderTextColor={colors.mutedText}
                style={styles.searchInput}
              />
              <Text style={styles.sectionTitle}>新闻资讯</Text>
              <UnavailableSection
                title="新闻资讯暂未开放"
                message="AI教育资讯接入审核内容后，会在这里展示。"
              />
              <Text style={styles.sectionTitle}>AI讨论</Text>
              <Text style={styles.sectionHint}>仅展示受审核的学习交流内容</Text>
              <View style={styles.group}>
                {discussions.map(item => (
                  <DiscussionCard key={item.question} {...item} />
                ))}
              </View>
            </View>
          }
          renderItem={({item}) => <PostCard {...item} />}
          ListFooterComponent={
            <View style={styles.footer}>
              <Text style={styles.sectionTitle}>作品展示</Text>
              <View style={styles.group}>
                {works.map(work => (
                  <WorkCard
                    key={work.title}
                    liked={likedWorks.has(work.title)}
                    onLike={() =>
                      setLikedWorks(current => toggleLike(current, work.title))
                    }
                    {...work}
                  />
                ))}
              </View>
              <Text style={styles.sectionTitle}>互助任务</Text>
              <UnavailableSection
                title="互助任务暂未开放"
                message="学习挑战和协作任务接入后，会显示任务状态与审核提示。"
              />
            </View>
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

function ModuleTab({
  active,
  label,
  onPress,
}: {
  active: boolean;
  label: string;
  onPress: () => void;
}): React.JSX.Element {
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{selected: active}}
      onPress={onPress}
      style={[styles.moduleTab, active && styles.moduleTabActive]}>
      <Text
        style={[styles.moduleTabText, active && styles.moduleTabTextActive]}>
        {label}
      </Text>
    </Pressable>
  );
}

function WorkCard({
  title,
  author,
  liked,
  onLike,
}: {
  title: string;
  author: string;
  liked: boolean;
  onLike: () => void;
}): React.JSX.Element {
  return (
    <View style={styles.workCard}>
      <View accessibilityLabel="AI作品图片占位" style={styles.workImage}>
        <Text style={styles.workImageText}>AI作品</Text>
      </View>
      <Text style={styles.workTitle}>{title}</Text>
      <Text style={styles.author}>作者：{author}</Text>
      <Text style={styles.reviewStatus}>审核状态：已审核</Text>
      <View style={styles.workActions}>
        <Pressable
          accessibilityRole="button"
          onPress={onLike}
          style={styles.likeButton}>
          <Text style={[styles.likeText, liked && styles.likedText]}>
            {liked ? '已点赞' : '点赞'}
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => Alert.alert('举报入口', '举报服务等待审核能力接入。')}
          style={styles.likeButton}>
          <Text style={styles.likeText}>举报</Text>
        </Pressable>
      </View>
    </View>
  );
}

function DiscussionCard({
  question,
  answer,
  likes,
}: {
  question: string;
  answer: string;
  likes: number;
}): React.JSX.Element {
  const [liked, setLiked] = useState(false);
  return (
    <View style={styles.discussionCard}>
      <Text style={styles.reviewStatus}>审核状态：已审核</Text>
      <Text style={styles.question}>{question}</Text>
      <Text style={styles.answer}>{answer}</Text>
      <View style={styles.discussionActions}>
        <Pressable
          accessibilityRole="button"
          onPress={() => Alert.alert('回答', answer)}>
          <Text style={styles.linkText}>查看回答</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => setLiked(current => !current)}>
          <Text style={[styles.linkText, liked && styles.likedText]}>
            点赞 {likes + (liked ? 1 : 0)}
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => Alert.alert('举报入口', '举报服务等待审核能力接入。')}>
          <Text style={styles.linkText}>举报</Text>
        </Pressable>
      </View>
    </View>
  );
}

function UnavailableSection({title, message}: {title: string; message: string}): React.JSX.Element {
  return <View accessibilityLabel={`${title}，${message}`} style={styles.unavailableSection}>
    <Text style={styles.unavailableTitle}>{title}</Text>
    <Text style={styles.unavailableText}>{message}</Text>
  </View>;
}

function toggleLike(current: Set<string>, title: string): Set<string> {
  const next = new Set(current);
  if (next.has(title)) next.delete(title);
  else next.add(title);
  return next;
}

const styles = StyleSheet.create({
  screen: {flex: 1},
  moduleTabs: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.md,
    padding: spacing.xs,
    borderRadius: radius.sm,
    backgroundColor: '#E8EEF1',
  },
  moduleTab: {
    flex: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
  },
  moduleTabActive: {backgroundColor: colors.surface},
  moduleTabText: {
    color: colors.mutedText,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
  },
  moduleTabTextActive: {color: colors.brand},
  content: {
    gap: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl + 60,
  },
  header: {gap: spacing.md},
  footer: {gap: spacing.md},
  title: {color: colors.text, fontSize: 26, lineHeight: 34, fontWeight: '700'},
  searchInput: {
    minHeight: 44,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    color: colors.text,
    fontSize: 14,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '700',
    marginTop: spacing.sm,
  },
  sectionHint: {color: colors.mutedText, fontSize: 13, lineHeight: 20},
  group: {gap: spacing.sm},
  workCard: {
    gap: spacing.xs,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  workImage: {
    minHeight: 140,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
    backgroundColor: '#E5F7F8',
  },
  workImageText: {color: colors.brand, fontSize: 15, fontWeight: '700'},
  workTitle: {
    color: colors.text,
    fontSize: 17,
    lineHeight: 24,
    fontWeight: '700',
  },
  author: {color: colors.mutedText, fontSize: 13, lineHeight: 20},
  likeButton: {
    alignSelf: 'flex-start',
    minHeight: 32,
    justifyContent: 'center',
  },
  workActions: {flexDirection: 'row', gap: spacing.lg, flexWrap: 'wrap'},
  likeText: {
    color: colors.mutedText,
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '700',
  },
  likedText: {color: colors.brand},
  reviewStatus: {color: colors.success, fontSize: 12, lineHeight: 18, fontWeight: '600'},
  discussionCard: {
    gap: spacing.sm,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  question: {
    color: colors.text,
    fontSize: 17,
    lineHeight: 24,
    fontWeight: '700',
  },
  answer: {color: colors.mutedText, fontSize: 14, lineHeight: 20},
  discussionActions: {flexDirection: 'row', gap: spacing.lg},
  linkText: {
    color: colors.brand,
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '700',
  },
  unavailableSection: {gap: spacing.xs, padding: spacing.md, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, backgroundColor: colors.surface},
  unavailableTitle: {color: colors.text, fontSize: 16, lineHeight: 24, fontWeight: '700'},
  unavailableText: {color: colors.mutedText, fontSize: 14, lineHeight: 20},
});
