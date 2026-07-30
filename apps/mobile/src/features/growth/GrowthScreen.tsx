import React, {useEffect, useState} from 'react';
import {ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';

import {applyForMentor, getMentorApplyStatus, getMyMentorApply, getUserLevel, type MentorApply, type MentorApplyStatus, type UserLevel} from '../../api/growth';
import {colors, radius, spacing} from '../../shared/theme/tokens';

type GrowthScreenProps = {onBack: () => void; onOpenMentorProfile: () => void};

export function GrowthScreen({onBack, onOpenMentorProfile}: GrowthScreenProps): React.JSX.Element {
  const [level, setLevel] = useState<UserLevel | null>(null);
  const [status, setStatus] = useState<MentorApplyStatus | null>(null);
  const [application, setApplication] = useState<MentorApply | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async (): Promise<void> => {
    setError(null);
    try {
      const [nextLevel, nextStatus, nextApplication] = await Promise.all([getUserLevel(), getMentorApplyStatus(), getMyMentorApply()]);
      setLevel(nextLevel); setStatus(nextStatus); setApplication(nextApplication);
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : '成长数据加载失败。'); }
    finally { setLoading(false); }
  };

  useEffect(() => { void load(); }, []);

  const submit = async (): Promise<void> => {
    setSubmitting(true); setError(null);
    try { await applyForMentor(); await load(); }
    catch (requestError) { setError(requestError instanceof Error ? requestError.message : '申请提交失败。'); }
    finally { setSubmitting(false); }
  };

  if (loading) return <View style={styles.centered}><ActivityIndicator color={colors.brand} size="large" /><Text style={styles.statusText}>正在加载成长数据...</Text></View>;
  if (!level || !status) return <View style={styles.centered}><Text style={styles.errorText}>{error || '成长数据加载失败。'}</Text><Pressable onPress={() => void load()} style={styles.retryButton}><Text style={styles.retryText}>重试</Text></Pressable></View>;
  const progress = level.nextLevelExperience === 0 ? 100 : Math.min(100, level.experience / level.nextLevelExperience * 100);

  return <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
    <Pressable accessibilityRole="button" onPress={onBack} style={styles.backButton}><Text style={styles.backText}>返回我的</Text></Pressable>
    <Text style={styles.title}>AI成长中心</Text>
    <View style={styles.levelCard}><Text style={styles.levelLabel}>Lv{level.level} · {level.title}</Text><Text style={styles.experience}>{level.experience} / {level.nextLevelExperience} 经验</Text><View style={styles.track}><View style={[styles.fill, {width: `${progress}%`}]} /></View><Text style={styles.nextHint}>{level.level >= 5 ? '你已达到最高等级' : `距离下一等级还需 ${Math.max(0, level.nextLevelExperience - level.experience)} 经验`}</Text></View>
    <Text style={styles.sectionTitle}>成长数据</Text>
    <View style={styles.metrics}><Metric label="课程完成率" value={`${status.courseProgress}%`} /><Metric label="AI挑战成绩" value={`${status.challengeScore}%`} /></View>
    <Text style={styles.sectionTitle}>AI领航员认证</Text>
    <View style={styles.mentorCard}><Text style={styles.mentorTitle}>成为AI领航员</Text>{application?.applyStatus === 'PASS' ? <><Text style={styles.passedText}>你已成为AI领航员</Text><Pressable accessibilityRole="button" onPress={onOpenMentorProfile} style={styles.applyButton}><Text style={styles.applyButtonText}>我的AI领航员数据</Text></Pressable></> : application ? <Text style={styles.passedText}>当前申请状态：{application.applyStatus}</Text> : status.canApply ? <><Text style={styles.mentorDescription}>你已满足申请条件，可以提交认证申请。</Text><Pressable accessibilityRole="button" disabled={submitting} onPress={() => void submit()} style={[styles.applyButton, submitting && styles.disabledButton]}><Text style={styles.applyButtonText}>{submitting ? '正在提交...' : '申请成为AI领航员'}</Text></Pressable></> : <><Text style={styles.mentorDescription}>距离AI领航员还需：</Text><Text style={styles.reason}>{status.reason}</Text></>}{error ? <Text style={styles.errorText}>{error}</Text> : null}</View>
  </ScrollView>;
}

function Metric({label, value}: {label: string; value: string}): React.JSX.Element { return <View style={styles.metric}><Text style={styles.metricValue}>{value}</Text><Text style={styles.metricLabel}>{label}</Text></View>; }

const styles = StyleSheet.create({
  content: {gap: spacing.md, paddingVertical: spacing.md, paddingBottom: spacing.xl}, centered: {flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm}, statusText: {color: colors.mutedText, fontSize: 15, lineHeight: 22},
  backButton: {alignSelf: 'flex-start', minHeight: 40, justifyContent: 'center', paddingHorizontal: spacing.sm}, backText: {color: colors.brand, fontSize: 15, lineHeight: 22, fontWeight: '700'}, title: {color: colors.text, fontSize: 26, lineHeight: 34, fontWeight: '700'},
  levelCard: {gap: spacing.sm, padding: spacing.lg, borderRadius: radius.lg, backgroundColor: colors.brand}, levelLabel: {color: colors.surface, fontSize: 22, lineHeight: 30, fontWeight: '700'}, experience: {color: '#D8F5F7', fontSize: 15, lineHeight: 22}, track: {height: 10, overflow: 'hidden', borderRadius: 5, backgroundColor: '#E5F7F8'}, fill: {height: '100%', borderRadius: 5, backgroundColor: colors.sun}, nextHint: {color: '#D8F5F7', fontSize: 13, lineHeight: 20},
  sectionTitle: {color: colors.text, fontSize: 20, lineHeight: 28, fontWeight: '700', marginTop: spacing.sm}, metrics: {flexDirection: 'row', gap: spacing.sm}, metric: {flex: 1, alignItems: 'center', gap: spacing.xs, padding: spacing.md, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, backgroundColor: colors.surface}, metricValue: {color: colors.brand, fontSize: 22, lineHeight: 30, fontWeight: '700'}, metricLabel: {color: colors.mutedText, fontSize: 13, lineHeight: 20, textAlign: 'center'},
  mentorCard: {gap: spacing.sm, padding: spacing.md, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, backgroundColor: colors.surface}, mentorTitle: {color: colors.text, fontSize: 18, lineHeight: 26, fontWeight: '700'}, mentorDescription: {color: colors.mutedText, fontSize: 14, lineHeight: 20}, reason: {color: colors.coral, fontSize: 15, lineHeight: 22, fontWeight: '700'}, applyButton: {minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: radius.sm, backgroundColor: colors.brand}, disabledButton: {opacity: 0.6}, applyButtonText: {color: colors.surface, fontSize: 16, lineHeight: 24, fontWeight: '700'}, passedText: {color: colors.success, fontSize: 15, lineHeight: 22, fontWeight: '700'}, errorText: {color: colors.coral, fontSize: 14, lineHeight: 20}, retryButton: {minHeight: 40, justifyContent: 'center', paddingHorizontal: spacing.md, borderRadius: radius.sm, backgroundColor: colors.brand}, retryText: {color: colors.surface, fontSize: 14, fontWeight: '700'},
});
