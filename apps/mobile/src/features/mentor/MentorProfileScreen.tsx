import React, {useEffect, useState} from 'react';
import {ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';

import {addMentorContribution, getMentorProfile, type MentorProfile} from '../../api/growth';
import {colors, radius, spacing} from '../../shared/theme/tokens';

export function MentorProfileScreen({onBack}: {onBack: () => void}): React.JSX.Element {
  const [profile, setProfile] = useState<MentorProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const load = async (): Promise<void> => { try { setProfile(await getMentorProfile()); } catch (requestError) { setError(requestError instanceof Error ? requestError.message : '领航员数据加载失败。'); } };
  useEffect(() => { void load(); }, []);
  const contribute = async (type: 'HELP_NEW_USER' | 'RECOMMEND_COURSE' | 'ANSWER_QUESTION'): Promise<void> => { setSaving(true); try { await addMentorContribution(type); await load(); } catch (requestError) { setError(requestError instanceof Error ? requestError.message : '贡献记录失败。'); } finally { setSaving(false); } };
  if (!profile) return <View style={styles.centered}>{error ? <Text style={styles.error}>{error}</Text> : <ActivityIndicator color={colors.brand} size="large" />}</View>;
  return <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
    <Pressable accessibilityRole="button" onPress={onBack} style={styles.backButton}><Text style={styles.backText}>返回成长中心</Text></Pressable>
    <View style={styles.identityCard}><Text style={styles.eyebrow}>AI领航员身份</Text><Text style={styles.identity}>AI领航员</Text><Text style={styles.status}>认证状态：{profile.mentorStatus === 'PASS' ? '已通过' : profile.mentorStatus}</Text></View>
    <Text style={styles.sectionTitle}>我的AI领航员数据</Text><View style={styles.metrics}><Metric value={`${profile.helpCount}`} label="帮助人数" /><Metric value={`${profile.contributionExperience}`} label="贡献经验" /><Metric value={`#${profile.ranking}`} label="成长排名" /></View>
    <Text style={styles.sectionTitle}>记录贡献</Text><View style={styles.contributionCard}>{[['HELP_NEW_USER', '帮助新同学 +30'], ['RECOMMEND_COURSE', '推荐课程 +15'], ['ANSWER_QUESTION', '回答问题 +10']].map(([type, label]) => <Pressable accessibilityRole="button" disabled={saving} key={type} onPress={() => void contribute(type as 'HELP_NEW_USER' | 'RECOMMEND_COURSE' | 'ANSWER_QUESTION')} style={styles.contributionButton}><Text style={styles.contributionText}>{label}</Text></Pressable>)}</View>{error ? <Text style={styles.error}>{error}</Text> : null}
  </ScrollView>;
}

function Metric({value, label}: {value: string; label: string}): React.JSX.Element { return <View style={styles.metric}><Text style={styles.metricValue}>{value}</Text><Text style={styles.metricLabel}>{label}</Text></View>; }

const styles = StyleSheet.create({
  content: {gap: spacing.md, paddingVertical: spacing.md, paddingBottom: spacing.xl}, centered: {flex: 1, alignItems: 'center', justifyContent: 'center'}, backButton: {alignSelf: 'flex-start', minHeight: 40, justifyContent: 'center', paddingHorizontal: spacing.sm}, backText: {color: colors.brand, fontSize: 15, lineHeight: 22, fontWeight: '700'}, identityCard: {gap: spacing.xs, padding: spacing.lg, borderRadius: radius.lg, backgroundColor: colors.brand}, eyebrow: {color: '#D8F5F7', fontSize: 13, lineHeight: 20, fontWeight: '700'}, identity: {color: colors.surface, fontSize: 26, lineHeight: 34, fontWeight: '700'}, status: {color: '#D8F5F7', fontSize: 14, lineHeight: 20}, sectionTitle: {color: colors.text, fontSize: 20, lineHeight: 28, fontWeight: '700', marginTop: spacing.sm}, metrics: {flexDirection: 'row', gap: spacing.sm}, metric: {flex: 1, alignItems: 'center', gap: spacing.xs, padding: spacing.md, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, backgroundColor: colors.surface}, metricValue: {color: colors.brand, fontSize: 20, lineHeight: 28, fontWeight: '700'}, metricLabel: {color: colors.mutedText, fontSize: 12, lineHeight: 18, textAlign: 'center'}, contributionCard: {gap: spacing.sm, padding: spacing.md, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, backgroundColor: colors.surface}, contributionButton: {minHeight: 44, justifyContent: 'center', paddingHorizontal: spacing.md, borderWidth: 1, borderColor: colors.brand, borderRadius: radius.sm}, contributionText: {color: colors.brand, fontSize: 14, lineHeight: 20, fontWeight: '700'}, error: {color: colors.coral, fontSize: 14, lineHeight: 20},
});
