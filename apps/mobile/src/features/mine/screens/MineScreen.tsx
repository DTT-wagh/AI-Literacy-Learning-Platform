import React, {useEffect, useState} from 'react';
import {Alert, Image, Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';

import {getLearningStats, type LearningStats} from '../../../api/learning';
import type {UserInfo} from '../../../api/user';
import {colors, radius, spacing} from '../../../shared/theme/tokens';
import {getLocalAvatarUri, getProfileAvatar} from '../profileAvatars';

type MineScreenProps = {
  onLogout: () => void;
  onOpenGrowth: () => void;
  onOpenProfileEdit: () => void;
  userInfo: UserInfo;
};

const menuItems = [
  {icon: 'Courses', title: '我的课程', description: '课程入口暂未开放'},
  {icon: 'Report', title: '学习报告', description: '详细报告等待内容接入'},
  {icon: 'Favorites', title: '我的收藏', description: '收藏功能暂未开放'},
  {icon: 'Settings', title: '设置', description: '设置功能等待接入'},
];

export function MineScreen({onLogout, onOpenGrowth, onOpenProfileEdit, userInfo}: MineScreenProps): React.JSX.Element {
  const [stats, setStats] = useState<LearningStats>({courseCount: 0, lessonCount: 0, studyMinutes: 0});
  const [statsAvailable, setStatsAvailable] = useState(false);

  useEffect(() => {
    let mounted = true;
    getLearningStats().then(data => {
      if (mounted) {
        setStats(data);
        setStatsAvailable(true);
      }
    }).catch(() => undefined);
    return () => { mounted = false; };
  }, []);

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      style={styles.scrollView}>
      <Pressable accessibilityLabel="编辑个人资料" accessibilityRole="button" onPress={onOpenProfileEdit} style={styles.profileCard}>
        <ProfileAvatarView avatar={userInfo.avatar} username={userInfo.username} />
        <View style={styles.userDetails}>
          <Text style={styles.username}>{userInfo.username}</Text>
          <Text style={styles.phone}>{userInfo.phone}</Text>
        </View>
      </Pressable>

      <View style={styles.statsCard}>
        <Text style={styles.statsTitle}>学习数据</Text>
        {statsAvailable ? <View style={styles.statsRow}>
          <StatItem label="已学习课程" value={`${stats.courseCount}`} />
          <StatItem label="学习章节" value={`${stats.lessonCount}`} />
          <StatItem label="学习时长" value={`${stats.studyMinutes}分钟`} />
        </View> : <Text style={styles.statsUnavailable}>学习统计暂未接入</Text>}
      </View>

      <View style={styles.menuCard}>
        <Pressable accessibilityRole="button" onPress={onOpenGrowth} style={styles.menuItem}>
          <View style={styles.menuCopy}><Text style={styles.menuTitle}>AI成长中心</Text><Text style={styles.menuDescription}>查看等级、经验与领航员认证</Text></View>
        </Pressable>
        {menuItems.map(item => (
          <Pressable accessibilityRole="button" key={item.title} onPress={() => Alert.alert(item.title, `${item.description}，当前不会创建或修改任何数据。`)} style={styles.menuItem}>
            <View style={styles.menuCopy}>
              <Text style={styles.menuTitle}>{item.title}</Text>
              <Text style={styles.menuDescription}>{item.description}</Text>
            </View>
          </Pressable>
        ))}
      </View>

      <Pressable accessibilityRole="button" onPress={onLogout} style={styles.logoutButton}>
        <Text style={styles.logoutText}>退出登录</Text>
      </Pressable>
    </ScrollView>
  );
}

function StatItem({label, value}: {label: string; value: string}): React.JSX.Element {
  return <View style={styles.statItem}><Text style={styles.statValue}>{value}</Text><Text style={styles.statLabel}>{label}</Text></View>;
}

function ProfileAvatarView({avatar, username}: {avatar?: string | null; username: string}): React.JSX.Element {
  const option = getProfileAvatar(avatar);
  const localAvatarUri = getLocalAvatarUri(avatar);
  return <View accessibilityLabel={`用户头像：${localAvatarUri ? '自定义照片' : option.label}`} style={[styles.avatar, {backgroundColor: option.backgroundColor}]}>
    {localAvatarUri ? <Image source={{uri: localAvatarUri}} style={styles.avatarImage} /> : <Text style={[styles.avatarText, {color: option.foregroundColor}]}>{avatar ? option.mark : username.slice(0, 1).toUpperCase()}</Text>}
  </View>;
}

const styles = StyleSheet.create({
  scrollView: {flex: 1},
  content: {flexGrow: 1, gap: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.xl + 60},
  profileCard: {flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg, borderRadius: radius.lg, backgroundColor: colors.brand},
  avatar: {width: 64, height: 64, alignItems: 'center', justifyContent: 'center', borderRadius: 32, backgroundColor: colors.sun},
  avatarImage: {width: '100%', height: '100%', borderRadius: 32},
  avatarText: {color: colors.text, fontSize: 24, fontWeight: '700'},
  userDetails: {flex: 1, gap: spacing.xs},
  username: {color: colors.surface, fontSize: 22, lineHeight: 30, fontWeight: '700'},
  phone: {color: '#D8F5F7', fontSize: 15, lineHeight: 22},
  statsCard: {gap: spacing.md, padding: spacing.md, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, backgroundColor: colors.surface},
  statsTitle: {color: colors.text, fontSize: 18, lineHeight: 26, fontWeight: '700'},
  statsRow: {flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm},
  statItem: {flex: 1, alignItems: 'center', gap: spacing.xs},
  statValue: {color: colors.brand, fontSize: 18, lineHeight: 26, fontWeight: '700'},
  statLabel: {color: colors.mutedText, fontSize: 12, lineHeight: 18, textAlign: 'center'},
  statsUnavailable: {color: colors.mutedText, fontSize: 14, lineHeight: 20},
  menuCard: {overflow: 'hidden', borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, backgroundColor: colors.surface},
  menuItem: {minHeight: 72, justifyContent: 'center', paddingHorizontal: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border},
  menuCopy: {gap: spacing.xs},
  menuTitle: {color: colors.text, fontSize: 16, lineHeight: 24, fontWeight: '700'},
  menuDescription: {color: colors.mutedText, fontSize: 13, lineHeight: 20},
  logoutButton: {minHeight: 48, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.coral, borderRadius: radius.sm, backgroundColor: colors.surface},
  logoutText: {color: colors.coral, fontSize: 16, lineHeight: 24, fontWeight: '700'},
});
