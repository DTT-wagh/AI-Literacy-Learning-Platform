import NetInfo from '@react-native-community/netinfo';
import {useMachine} from '@xstate/react';
import React from 'react';
import {ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';

import {colors, radius, spacing} from '../../../shared/theme/tokens';
import {userStore} from '../../../store/userStore';
import {AIResultPanel} from '../components/AIResultPanel';
import {ClaimSourceBoard} from '../components/ClaimSourceBoard';
import {ContextEvidenceRail} from '../components/ContextEvidenceRail';
import {GameButton} from '../components/GameButton';
import {OfflineNotice} from '../components/OfflineNotice';
import {ProgressBar} from '../components/ProgressBar';
import {ReviewPanel} from '../components/ReviewPanel';
import {SafetyNotice} from '../components/SafetyNotice';
import {StoryDirectorBoard} from '../components/StoryDirectorBoard';
import {TaskBrief} from '../components/TaskBrief';
import {WordLabelBoard} from '../components/WordLabelBoard';
import {createLanguageSessionData, languageGameMachine, toLanguageGameSnapshot} from '../machine/gameMachine';
import {getLocalG1TestResults, getLocalLanguageCandidate} from '../services/languageLocalCandidateService';
import {validateLanguageStage} from '../services/languageGameValidation';
import {gameEventSyncService} from '../services/GameEventSyncService';
import {eventQueue} from '../storage/EventQueue';
import {languageProgressStorage} from '../storage/LanguageProgressStorage';
import type {LanguageAIResult, LanguageGame, LanguageLearningEvidence, LanguageSessionData} from '../types/language';

type LanguageGameScreenProps = {
  game: LanguageGame;
  onBack: () => void;
  onComplete: () => void;
};

export function LanguageGameScreen({game, onBack, onComplete}: LanguageGameScreenProps): React.JSX.Element {
  const [state, send] = useMachine(languageGameMachine);
  const [offline, setOffline] = React.useState(true);
  const [validationMessage, setValidationMessage] = React.useState<string | null>(null);
  const completionSent = React.useRef(false);
  const userId = userStore.userInfo?.id ?? 0;
  const complete = state.matches('COMPLETE');
  const stage = state.context.game?.stages[state.context.stageIndex] ?? game.stages[0];
  const stageId = stage?.id ?? 'briefing';

  React.useEffect(() => {
    let active = true;
    const update = (connected: boolean) => {
      if (active) setOffline(!connected);
    };
    NetInfo.fetch().then(network => update(Boolean(network.isConnected && network.isInternetReachable !== false))).catch(() => update(true));
    const unsubscribe = NetInfo.addEventListener(network => update(Boolean(network.isConnected && network.isInternetReachable !== false)));
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  React.useEffect(() => {
    const stored = languageProgressStorage.load(userId, game.id);
    send(stored
      ? {type: 'RESTORE', game, snapshot: stored, offline}
      : {type: 'START', game, offline});
  }, [game, send, userId]);

  React.useEffect(() => {
    send({type: 'SET_OFFLINE', offline});
  }, [offline, send]);

  React.useEffect(() => {
    const snapshot = toLanguageGameSnapshot(state.context, complete);
    if (snapshot) languageProgressStorage.save(userId, snapshot);
  }, [complete, state.context, userId]);

  React.useEffect(() => {
    if (!state.matches('AI_PROCESSING') || !state.context.game) return;
    const patch = game.id === 'language-label-training'
      ? {testResults: getLocalG1TestResults(state.context.data)}
      : undefined;
    const readyTimer = setTimeout(() => {
      send({type: 'AI_READY', candidate: getLocalLanguageCandidate(game.id, state.context.data), patch});
    }, 3000);
    const timeoutTimer = setTimeout(() => {
      send({type: 'AI_TIMEOUT', candidate: getLocalLanguageCandidate(game.id, state.context.data, true), patch});
    }, 8000);
    return () => {
      clearTimeout(readyTimer);
      clearTimeout(timeoutTimer);
    };
  }, [game.id, send, state.context.data, state.context.game, state.value]);

  React.useEffect(() => {
    if (!complete || completionSent.current || userId <= 0) return;
    completionSent.current = true;
    eventQueue.enqueue(userId, eventQueue.createEvent(userId, {
      taskId: game.id,
      stepId: 'complete',
      eventType: 'TASK_COMPLETED',
      outcomeCode: 'COMPLETED',
    }));
    gameEventSyncService.sync(userId).catch(() => undefined);
  }, [complete, game.id, userId]);

  const applyChange = (patch: Partial<LanguageSessionData>) => {
    setValidationMessage(null);
    send({
      type: 'ACTION',
      patch,
      evidence: evidenceForGame(game.id, stageId),
    });
  };

  const continueStage = () => {
    if (state.matches('STUDENT_ACTION') || state.matches('COMPARING') || state.matches('REVISING')) {
      if (state.context.data.safetyStatus === 'blocked') {
        setValidationMessage(state.context.data.safetyMessage ?? '请先处理安全提醒。');
        return;
      }
      const validation = validateLanguageStage(game, stageId, state.context.data);
      if (!validation.valid) {
        setValidationMessage(validation.message);
        return;
      }
    }
    if (userId > 0 && !state.matches('BRIEFING') && !state.matches('RESULT')) {
      eventQueue.enqueue(userId, eventQueue.createEvent(userId, {
        taskId: game.id,
        stepId: stageId,
        eventType: 'STEP_COMPLETED',
        outcomeCode: 'CONTINUED',
      }));
    }
    setValidationMessage(null);
    send({type: 'NEXT'});
  };

  const saveAndExit = () => {
    const snapshot = toLanguageGameSnapshot(state.context, complete);
    if (snapshot) languageProgressStorage.save(userId, snapshot);
    onBack();
  };

  if (state.matches('INIT')) {
    return <View accessibilityLabel="正在恢复游戏进度" style={styles.loading}><ActivityIndicator color={colors.brand} size="large" /></View>;
  }

  if (complete) {
    return (
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.back} onPress={onBack}>返回语文岛</Text>
        <View style={styles.completeCard}>
          <Text style={styles.completeIcon}>{game.icon}</Text>
          <Text style={styles.completeTitle}>完成「{game.title}」</Text>
          <Text style={styles.completeText}>{game.content.report}</Text>
          <ReviewPanel rows={reviewRows(game, state.context.data)} />
          <GameButton label="返回语文岛" onPress={onComplete} />
          <GameButton label="再玩一次" onPress={() => {completionSent.current = false; send({type: 'START', game, offline});}} variant="secondary" />
        </View>
      </ScrollView>
    );
  }

  if (state.matches('ERROR')) {
    return (
      <View style={styles.loading}>
        <Text style={styles.errorTitle}>这次处理没有完成</Text>
        <Text style={styles.errorText}>{state.context.error ?? '当前进度已经保存在本机。'}</Text>
        <GameButton label="重试本地候选" onPress={() => send({type: 'RETRY'})} />
        <GameButton label="保存并退出" onPress={saveAndExit} variant="secondary" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Pressable accessibilityRole="button" onPress={saveAndExit} style={styles.back}>
        <Text style={styles.backText}>保存并退出</Text>
      </Pressable>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>{game.title}</Text>
        <ProgressBar label={'阶段 ' + (state.context.stageIndex + 1) + ' / ' + game.stages.length} value={((state.context.stageIndex + 1) / game.stages.length) * 100} />
      </View>
      <View style={styles.card}>
        <Text style={styles.stageLabel}>{stage?.title}</Text>
        <Text style={styles.title}>{stage?.description}</Text>
        <OfflineNotice offline={offline} />
        <SafetyNotice message={state.context.data.safetyMessage} />
        {state.matches('BRIEFING') ? <TaskBrief game={game} offline={offline} /> : null}
        {state.matches('STUDENT_ACTION') || state.matches('REVISING') || state.matches('COMPARING')
          ? <GameStageBoard data={state.context.data} game={game} stageId={stageId} onChange={applyChange} />
          : null}
        {state.matches('AI_PROCESSING') ? <AIProcessing onCancel={() => send({type: 'CANCEL'})} /> : null}
        {state.matches('COMPARING') ? <LanguageCandidate candidate={state.context.candidate ?? getLocalLanguageCandidate(game.id, state.context.data, true)} /> : null}
        {state.matches('RESULT') ? <ReviewPanel rows={reviewRows(game, state.context.data)} /> : null}
        {validationMessage ? <View accessibilityLiveRegion="polite" style={styles.validation}><Text style={styles.validationText}>{validationMessage}</Text></View> : null}
        {state.context.history.length > 0 && (state.matches('STUDENT_ACTION') || state.matches('COMPARING') || state.matches('REVISING'))
          ? <GameButton label="撤销上一步操作" onPress={() => send({type: 'UNDO'})} variant="secondary" />
          : null}
        <PrimaryAction state={state.value as string} stageId={stageId} onPress={continueStage} />
      </View>
    </ScrollView>
  );
}

function GameStageBoard({game, stageId, data, onChange}: {game: LanguageGame; stageId: string; data: LanguageSessionData; onChange: (patch: Partial<LanguageSessionData>) => void}): React.JSX.Element | null {
  if (game.id === 'language-label-training') return <WordLabelBoard data={data} game={game} onChange={onChange} stageId={stageId} />;
  if (game.id === 'language-context-reasoning') return <ContextEvidenceRail data={data} game={game} onChange={onChange} stageId={stageId} />;
  if (game.id === 'language-story-director') return <StoryDirectorBoard data={data} game={game} onChange={onChange} stageId={stageId} />;
  return <ClaimSourceBoard data={data} game={game} onChange={onChange} stageId={stageId} />;
}

function AIProcessing({onCancel}: {onCancel: () => void}): React.JSX.Element {
  return (
    <View accessibilityLabel="AI正在整理可核对线索" style={styles.processing}>
      <ActivityIndicator color={colors.brand} size="large" />
      <Text style={styles.processingTitle}>AI正在整理你刚才提供的线索</Text>
      <Text style={styles.processingText}>3秒后显示可核对候选；超过8秒会使用本地候选或允许重试。</Text>
      <GameButton label="取消并返回上一阶段" onPress={onCancel} variant="secondary" />
    </View>
  );
}

function LanguageCandidate({candidate}: {candidate: LanguageAIResult}): React.JSX.Element {
  return (
    <View style={styles.candidate}>
      <AIResultPanel result={{
        result: candidate.candidate,
        confidence: candidate.confidence,
        evidence: candidate.evidence,
        notice: candidate.limitations.join(' '),
        safetyStatus: 'safe',
      }} />
      {candidate.fallback ? <Text style={styles.fallback}>已使用本地审核候选，当前进度会在联网后同步。</Text> : null}
    </View>
  );
}

function PrimaryAction({state, stageId, onPress}: {state: string; stageId: string; onPress: () => void}): React.JSX.Element | null {
  if (state === 'AI_PROCESSING') return null;
  if (state === 'BRIEFING') return <GameButton label="开始调查" onPress={onPress} />;
  if (state === 'RESULT') return <GameButton label="完成本次游戏" onPress={onPress} />;
  if (state === 'COMPARING' && stageId === 'classification-test') return <GameButton label="诊断这次错分" onPress={onPress} />;
  if (state === 'COMPARING' && stageId === 'ai-comparison') return <GameButton label="处理未知案件" onPress={onPress} />;
  if (state === 'COMPARING' && stageId === 'draft-audition') return <GameButton label="编排故事镜头" onPress={onPress} />;
  if (state === 'COMPARING' && stageId === 'risk-diagnosis') return <GameButton label="开始谨慎改写" onPress={onPress} />;
  if (state === 'REVISING') return <GameButton label="保存修改并继续" onPress={onPress} />;
  return <GameButton label="继续" onPress={onPress} />;
}

function evidenceForGame(gameId: LanguageGame['id'], stageId: string): LanguageLearningEvidence {
  if (gameId === 'language-label-training') return {dimension: 'modeling', level: 'attempted', taskBehavior: stageId};
  if (gameId === 'language-context-reasoning') return {dimension: 'observation', level: 'attempted', taskBehavior: stageId};
  if (gameId === 'language-story-director') return {dimension: 'responsibility', level: 'attempted', taskBehavior: stageId};
  return {dimension: 'verification', level: 'attempted', taskBehavior: stageId};
}

function reviewRows(game: LanguageGame, data: LanguageSessionData): Array<{label: string; value: string}> {
  if (game.id === 'language-label-training') {
    return [
      {label: '学生标签', value: '已整理 ' + Object.keys(data.labels).length + ' 张基础词语卡'},
      {label: '训练样本', value: '已选择 ' + (data.trainingSampleIds.length + data.repairSampleIds.length) + ' 张样本'},
      {label: '修复结果', value: data.repairSampleIds.length >= 2 ? '补充情绪样本后重新训练' : '等待补充样本'},
      {label: '最终规律', value: game.content.report},
    ];
  }
  if (game.id === 'language-context-reasoning') {
    return [
      {label: '初步判断', value: data.bareJudgement ?? '未记录'},
      {label: '关键证据', value: data.contextEvidenceIds.join('、') || '未记录'},
      {label: '未知案件', value: data.unknownChoice === 'need-more' ? '需要更多信息' : '未记录'},
      {label: '最终规律', value: game.content.report},
    ];
  }
  if (game.id === 'language-story-director') {
    return [
      {label: '导演意图', value: Object.values(data.storyIntent).slice(0, 3).join('；') || '未记录'},
      {label: '人工修改', value: '完成 ' + new Set(data.revisions.map(item => item.type)).size + ' 类'},
      {label: 'AI参与说明', value: data.attributionConfirmed ? '已保留审核候选参与说明' : '未确认'},
      {label: '作品状态', value: '待审核，不会直接公开发布'},
    ];
  }
  return [
    {label: '声明标记', value: '已标记 ' + Object.keys(data.claimKinds).length + ' 条'},
    {label: '来源连线', value: '高度声明连接 ' + (data.sourceLinks['claim-height']?.length ?? 0) + ' 张来源卡'},
    {label: '谨慎改写', value: data.carefulRevision ?? '未记录'},
    {label: '发布状态', value: '待教师审核'},
  ];
}

const styles = StyleSheet.create({
  content: {gap: spacing.md, paddingVertical: spacing.md, paddingBottom: spacing.xl},
  loading: {flex: 1, minHeight: 280, alignItems: 'center', justifyContent: 'center', gap: spacing.md},
  back: {alignSelf: 'flex-start', minHeight: 40, justifyContent: 'center', paddingHorizontal: spacing.sm, color: colors.brand, fontSize: 15, lineHeight: 40, fontWeight: '800'},
  backText: {color: colors.brand, fontSize: 15, lineHeight: 22, fontWeight: '800'},
  header: {gap: spacing.sm},
  eyebrow: {color: colors.brand, fontSize: 14, lineHeight: 20, fontWeight: '800'},
  card: {gap: spacing.md, padding: spacing.md, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, backgroundColor: colors.surface},
  stageLabel: {color: colors.brand, fontSize: 13, lineHeight: 20, fontWeight: '800'},
  title: {color: colors.text, fontSize: 20, lineHeight: 28, fontWeight: '800'},
  processing: {minHeight: 210, alignItems: 'center', justifyContent: 'center', gap: spacing.md, padding: spacing.md, borderRadius: radius.md, backgroundColor: '#F3F7F9'},
  processingTitle: {color: colors.text, fontSize: 17, lineHeight: 24, fontWeight: '800', textAlign: 'center'},
  processingText: {color: colors.mutedText, fontSize: 14, lineHeight: 21, textAlign: 'center'},
  candidate: {gap: spacing.sm},
  fallback: {color: '#8A5B00', fontSize: 13, lineHeight: 20, fontWeight: '700'},
  validation: {padding: spacing.md, borderRadius: radius.md, backgroundColor: '#FFF4D6'},
  validationText: {color: colors.text, fontSize: 14, lineHeight: 21, fontWeight: '700'},
  errorTitle: {color: colors.text, fontSize: 21, lineHeight: 29, fontWeight: '800'},
  errorText: {color: colors.mutedText, fontSize: 15, lineHeight: 22, textAlign: 'center'},
  completeCard: {gap: spacing.md, padding: spacing.lg, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, backgroundColor: colors.surface},
  completeIcon: {alignSelf: 'center', fontSize: 46, lineHeight: 56},
  completeTitle: {color: colors.text, fontSize: 24, lineHeight: 32, fontWeight: '800', textAlign: 'center'},
  completeText: {color: colors.mutedText, fontSize: 15, lineHeight: 22, textAlign: 'center'},
});
