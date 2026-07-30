import React, {useState} from 'react';
import {Alert, Pressable, StyleSheet, Text, View} from 'react-native';

import {colors, radius, spacing} from '../../../shared/theme/tokens';

type PostCardProps = {name: string; time: string; content: string; likes: number; comments: number; hasImage?: boolean};

export function PostCard({name, time, content, likes, comments, hasImage = false}: PostCardProps): React.JSX.Element {
  const [liked, setLiked] = useState(false);
  return <View style={styles.card}>
    <View style={styles.authorRow}><View style={styles.avatar}><Text style={styles.avatarText}>{name.slice(0, 1)}</Text></View><View><Text style={styles.name}>{name}</Text><Text style={styles.time}>{time}</Text></View></View>
    <Text style={styles.reviewStatus}>审核状态：已审核</Text>
    <Text style={styles.content}>{content}</Text>
    {hasImage ? <View accessibilityLabel="帖子图片占位" style={styles.imagePlaceholder}><Text style={styles.imageText}>学习作品图片</Text></View> : null}
    <View style={styles.actions}>
      <Pressable accessibilityRole="button" onPress={() => setLiked(current => !current)} style={styles.action}><Text style={[styles.actionText, liked && styles.actionActive]}>点赞 {likes + (liked ? 1 : 0)}</Text></Pressable>
      <Pressable accessibilityRole="button" onPress={() => Alert.alert('评论', '评论功能正在准备中。')} style={styles.action}><Text style={styles.actionText}>评论 {comments}</Text></Pressable>
      <Pressable accessibilityRole="button" onPress={() => Alert.alert('举报入口', '举报服务等待审核能力接入。')} style={styles.action}><Text style={styles.actionText}>举报</Text></Pressable>
      <Pressable accessibilityRole="button" onPress={() => Alert.alert('屏蔽内容', '屏蔽功能等待审核能力接入。')} style={styles.action}><Text style={styles.actionText}>屏蔽</Text></Pressable>
    </View>
  </View>;
}

const styles = StyleSheet.create({
  card: {gap: spacing.sm, padding: spacing.md, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, backgroundColor: colors.surface},
  authorRow: {flexDirection: 'row', alignItems: 'center', gap: spacing.sm}, avatar: {width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 18, backgroundColor: '#E5F7F8'}, avatarText: {color: colors.brand, fontSize: 15, fontWeight: '700'}, name: {color: colors.text, fontSize: 15, lineHeight: 20, fontWeight: '700'}, time: {color: colors.mutedText, fontSize: 12, lineHeight: 18},
  reviewStatus: {color: colors.success, fontSize: 12, lineHeight: 18, fontWeight: '600'}, content: {color: colors.text, fontSize: 15, lineHeight: 22}, actions: {flexDirection: 'row', gap: spacing.lg, flexWrap: 'wrap'}, action: {minHeight: 32, justifyContent: 'center'}, actionText: {color: colors.mutedText, fontSize: 13, lineHeight: 20, fontWeight: '600'}, actionActive: {color: colors.brand},
  imagePlaceholder: {minHeight: 140, alignItems: 'center', justifyContent: 'center', borderRadius: radius.sm, backgroundColor: '#E5F7F8'}, imageText: {color: colors.brand, fontSize: 14, fontWeight: '700'},
});
