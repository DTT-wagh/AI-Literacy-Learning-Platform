import React from 'react';
import {ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import {useMachine} from '@xstate/react';

import {colors, radius, spacing} from '../../../shared/theme/tokens';
import {userStore} from '../../../store/userStore';
import {AIAvatar} from '../components/AIAvatar';
import {AIResultPanel} from '../components/AIResultPanel';
import {EvidenceCard} from '../components/EvidenceCard';
import {GameButton} from '../components/GameButton';
import {ProgressBar} from '../components/ProgressBar';
import {ReviewPanel} from '../components/ReviewPanel';
import {calculateLearningScore, getLearningActions} from '../evaluation';
import {gameMachine} from '../machine/gameMachine';
import {evaluateGameAI} from '../services/gameAIService';
import {gameEventSyncService} from '../services/GameEventSyncService';
import {eventQueue} from '../storage/EventQueue';
import {gameProgressStorage} from '../storage/GameProgressStorage';
import type {GameAIResult, GameLearningRecord, GameStep, GameTask} from '../types/game';

type GamePlayScreenProps = {
  task: GameTask;
  onBack: () => void;
  onComplete: () => void;
};

export function GamePlayScreen({task, onBack, onComplete}: GamePlayScreenProps): React.JSX.Element {
  const [state, send] = useMachine(gameMachine);
  const {currentStepIndex, answer, selectedEvidenceIds, selectedOptionIds} = state.context;
  const currentStep = task.steps[currentStepIndex];
  const loading = state.matches('loading');
  const playing = state.matches('playing');
  const completed = state.matches('completed');
  const [aiResult, setAIResult] = React.useState<GameAIResult | null>(null);
  const [aiLoading, setAILoading] = React.useState(false);
  const aiRequestKey = React.useRef<string | null>(null);
  const userId = userStore.userInfo?.id;

  React.useEffect(() => {
    aiRequestKey.current = null;
    setAIResult(null);
    setAILoading(false);
    const storedProgress = userId ? gameProgressStorage.load(userId, task.id) : null;
    send(storedProgress
      ? {type: 'RESTORE', task, progress: storedProgress}
      : {type: 'START', task});
  }, [send, task, userId]);

  React.useEffect(() => {
    if (!userId || (!playing && !completed)) return;
    gameProgressStorage.save(userId, {
      taskId: task.id,
      currentStep: state.context.currentStepIndex,
      answers: {
        current: state.context.answer,
        student: state.context.studentAnswer,
        aiCorrectionReason: state.context.aiCorrectionReason,
        final: state.context.finalAnswer,
        options: state.context.selectedOptionIds,
      },
      selectedEvidence: state.context.selectedEvidenceIds,
      completed,
      updatedAt: new Date().toISOString(),
    });
  }, [completed, playing, state.context, task.id, userId]);

  React.useEffect(() => {
    if (!playing || currentStep?.type !== 'aiResult') {
      return;
    }

    const evidenceStep = task.steps.find(step => step.type === 'evidence');
    const evidence = (evidenceStep?.evidence ?? [])
      .filter(item => selectedEvidenceIds.includes(item.id))
      .map(item => item.label);
    const requestKey = `${task.id}:${currentStep.id}:${selectedEvidenceIds.join(',')}`;

    if (aiRequestKey.current === requestKey) {
      return;
    }
    aiRequestKey.current = requestKey;

    if (task.aiMode !== 'online_candidate') {
      setAIResult(currentStep.aiResult ?? null);
      setAILoading(false);
      return;
    }

    setAILoading(true);

    let active = true;
    evaluateGameAI({
      taskId: task.id,
      input: currentStep.aiInput ?? task.title,
      evidence,
    }).then(response => {
      if (active) {
        setAIResult({
          result: response.candidate,
          confidence: response.confidenceBand,
          evidence: response.evidence,
          notice: response.explanation,
          safetyStatus: response.safetyStatus,
        });
        if (userId) {
          eventQueue.enqueue(userId, eventQueue.createEvent(userId, {
            taskId: task.id,
            stepId: currentStep.id,
            eventType: 'AI_RESULT_VIEWED',
            outcomeCode: response.safetyStatus === 'blocked' ? 'SAFETY_BLOCKED' : 'CANDIDATE_RECEIVED',
          }));
        }
      }
    }).finally(() => {
      if (active) {
        setAILoading(false);
      }
    });

    return () => {
      active = false;
    };
  }, [currentStep, playing, selectedEvidenceIds, task, userId]);

  const restartTask = () => {
    aiRequestKey.current = null;
    setAIResult(null);
    setAILoading(false);
    if (userId) gameProgressStorage.remove(userId, task.id);
    send({type: 'START', task});
  };

  const answerStep = (selectedAnswer: string): void => {
    if (userId && currentStep) {
      const eventType = currentStep.type === 'aiCorrection'
        ? 'AI_CORRECTION_SELECTED'
        : 'ANSWER_SELECTED';
      eventQueue.enqueue(userId, eventQueue.createEvent(userId, {
        taskId: task.id,
        stepId: currentStep.id,
        eventType,
        outcomeCode: `${toOutcomeCode(selectedAnswer)}_SELECTED`,
      }));
    }
    send({type: 'ANSWER', answer: selectedAnswer});
  };

  const toggleEvidence = (evidenceId: string): void => {
    if (currentStep?.evidenceLimit
      && !selectedEvidenceIds.includes(evidenceId)
      && selectedEvidenceIds.length >= currentStep.evidenceLimit) {
      return;
    }
    if (userId && currentStep && !selectedEvidenceIds.includes(evidenceId)) {
      eventQueue.enqueue(userId, eventQueue.createEvent(userId, {
        taskId: task.id,
        stepId: currentStep.id,
        eventType: 'EVIDENCE_SELECTED',
        outcomeCode: `${toOutcomeCode(evidenceId)}_SELECTED`,
      }));
    }
    send({type: 'TOGGLE_EVIDENCE', evidenceId});
  };

  const toggleOption = (optionId: string): void => {
    send({type: 'TOGGLE_OPTION', optionId});
  };

  const continueGame = (): void => {
    if (userId && currentStep) {
      eventQueue.enqueue(userId, eventQueue.createEvent(userId, {
        taskId: task.id,
        stepId: currentStep.id,
        eventType: 'STEP_COMPLETED',
        outcomeCode: 'CONTINUED',
      }));
      if (currentStepIndex === task.steps.length - 1) {
        eventQueue.enqueue(userId, eventQueue.createEvent(userId, {
          taskId: task.id,
          stepId: currentStep.id,
          eventType: 'TASK_COMPLETED',
          outcomeCode: 'COMPLETED',
        }));
      }
      gameEventSyncService.sync(userId).catch(() => undefined);
    }
    send({type: 'NEXT'});
  };

  if (loading) {
    return (
      <View accessibilityLabel="正在准备游戏" style={styles.loading}>
        <ActivityIndicator color={colors.brand} size="large" />
        <Text style={styles.loadingText}>正在准备任务...</Text>
      </View>
    );
  }

  if (completed) {
    return (
      <View style={styles.completed}>
        <Text style={styles.completedEyebrow}>任务完成</Text>
        <Text style={styles.completedTitle}>你完成了「{task.title}」</Text>
        <Text style={styles.completedText}>学习记录已保存在本机，联网后会同步枚举事件，不上传自由文本。</Text>
        <GameButton label="返回任务列表" onPress={onComplete} />
        <GameButton label="再玩一次" onPress={restartTask} variant="secondary" />
      </View>
    );
  }

  if (!playing || !currentStep) {
    return <View style={styles.loading} />;
  }

  const record: GameLearningRecord = state.context;
  const progress = ((currentStepIndex + 1) / task.steps.length) * 100;
  const continueDisabled = (stepRequiresSelection(currentStep) && answer === null)
    || ((currentStep.type === 'evidence' || currentStep.type === 'sourceEvidence') && selectedEvidenceIds.length === 0)
    || (currentStep.type === 'multiChoice' && selectedOptionIds.length < (currentStep.minSelections ?? 1))
    || (currentStep.type === 'aiResult' && (aiLoading || aiResult === null));

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Pressable accessibilityRole="button" onPress={onBack} style={styles.backButton}>
        <Text style={styles.backText}>退出任务</Text>
      </Pressable>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>{task.title}</Text>
        <ProgressBar label={`步骤 ${currentStepIndex + 1} / ${task.steps.length}`} value={progress} />
      </View>
      <View style={styles.card}>
        <Text style={styles.stepType}>{getStepLabel(currentStep)}</Text>
        <Text style={styles.title}>{currentStep.title}</Text>
        <Text style={styles.description}>{currentStep.content}</Text>
        <StepContent
          aiLoading={aiLoading}
          aiResult={aiResult}
          answer={answer}
          onAnswer={answerStep}
          onToggleEvidence={toggleEvidence}
          onToggleOption={toggleOption}
          record={record}
          selectedEvidenceIds={selectedEvidenceIds}
          selectedOptionIds={selectedOptionIds}
          step={currentStep}
          task={task}
        />
        <GameButton
          disabled={continueDisabled}
          label={currentStepIndex === task.steps.length - 1 ? '领取完成奖励' : '下一步'}
          onPress={continueGame}
        />
      </View>
    </ScrollView>
  );
}

type StepContentProps = {
  step: GameStep;
  task: GameTask;
  aiLoading: boolean;
  aiResult: GameAIResult | null;
  answer: string | null;
  selectedEvidenceIds: string[];
  selectedOptionIds: string[];
  record: GameLearningRecord;
  onAnswer: (answer: string) => void;
  onToggleEvidence: (evidenceId: string) => void;
  onToggleOption: (optionId: string) => void;
};

function StepContent({step, task, aiLoading, aiResult, answer, selectedEvidenceIds, selectedOptionIds, record, onAnswer, onToggleEvidence, onToggleOption}: StepContentProps): React.JSX.Element | null {
  if (step.type === 'intro' && step.previewOptions) {
    return <View style={styles.previewOptions}>{step.previewOptions.map(option => <Text key={option} style={styles.previewOption}>{option}</Text>)}</View>;
  }

  if (step.type === 'evidence' || step.type === 'sourceEvidence') {
    const evidence = step.type === 'sourceEvidence' ? step.sourceCards ?? [] : step.evidence ?? [];
    return (
      <View style={styles.options}>
        {evidence.map(item => (
          <EvidenceCard
            evidence={item}
            key={item.id}
            onToggle={() => onToggleEvidence(item.id)}
            selected={selectedEvidenceIds.includes(item.id)}
          />
        ))}
        <Text style={styles.selectionNote}>已选择 {selectedEvidenceIds.length} 条证据</Text>
      </View>
    );
  }

  if (step.type === 'aiResult') {
    if (aiLoading) {
      return (
        <View accessibilityLabel="AI正在整理线索" style={styles.aiLoading}>
          <ActivityIndicator color={colors.brand} size="small" />
          <Text style={styles.loadingText}>正在整理可核对的线索...</Text>
        </View>
      );
    }
    const displayResult = aiResult ?? step.aiResult;
    return displayResult ? <AIResultPanel result={displayResult} /> : null;
  }

  if (step.type === 'counterexample') {
    return (
      <View style={styles.options}>
        {step.context ? <View style={styles.contextBox}><Text style={styles.contextLabel}>新语境</Text><Text style={styles.contextText}>{step.context}</Text></View> : null}
        <ChoiceOptions answer={answer} onAnswer={onAnswer} step={step} />
        <ChoiceFeedback answer={answer} step={step} />
      </View>
    );
  }

  if (step.type === 'uncertainty') {
    return (
      <View style={styles.options}>
        <ChoiceOptions answer={answer} onAnswer={onAnswer} step={step} />
        <ChoiceFeedback answer={answer} step={step} />
      </View>
    );
  }

  if (step.type === 'multiChoice') {
    return (
      <View style={styles.options}>
        {step.options?.map(option => {
          const selected = selectedOptionIds.includes(option.id);
          return (
            <Pressable
              accessibilityRole="checkbox"
              accessibilityState={{checked: selected}}
              key={option.id}
              onPress={() => onToggleOption(option.id)}
              style={[styles.option, selected && styles.optionSelected]}>
              <Text style={[styles.optionText, selected && styles.optionTextSelected]}>{option.label}</Text>
            </Pressable>
          );
        })}
        <Text style={styles.selectionNote}>已选择 {selectedOptionIds.length} 项，至少需要 {step.minSelections ?? 1} 项</Text>
      </View>
    );
  }

  if (step.type === 'aiCorrection') {
    return (
      <View style={styles.options}>
        {step.aiResult ? <AIResultPanel result={step.aiResult} /> : null}
        <Text style={styles.prompt}>选择一个原因帮助检查候选结果：</Text>
        <ChoiceOptions answer={answer} onAnswer={onAnswer} step={step} />
        <ChoiceFeedback answer={answer} step={step} />
      </View>
    );
  }

  if (step.type === 'review') {
    const evidence = task.steps.find(item => item.type === 'evidence')?.evidence ?? [];
    const recordedAIResult = aiResult?.result
      ?? task.steps.find(item => item.type === 'aiResult')?.aiResult?.result
      ?? '未记录';
    return <ReviewPanel aiResult={recordedAIResult} evidence={evidence} record={record} />;
  }

  if (step.type === 'reward' && step.reward) {
    const score = calculateLearningScore(record);
    const actions = getLearningActions(record);
    return (
      <View style={styles.reward}>
        <Text style={styles.rewardBadge}>{step.reward.badge}</Text>
        <Text style={styles.rewardTitle}>{step.reward.title}</Text>
        <Text style={styles.rewardMessage}>{step.reward.message}</Text>
        <Text style={styles.score}>学习分 +{score}</Text>
        {actions.map(action => <Text key={action} style={styles.action}>• {action}</Text>)}
        <AIAvatar message="学习分记录的是你选择证据和检查候选结果的学习行为。" />
      </View>
    );
  }

  if (step.options) {
    return <ChoiceOptions answer={answer} onAnswer={onAnswer} step={step} />;
  }

  return null;
}

function ChoiceOptions({step, answer, onAnswer}: {step: GameStep; answer: string | null; onAnswer: (answer: string) => void}): React.JSX.Element {
  return (
    <View style={styles.options}>
      {step.options?.map(option => {
        const selected = answer === option.id;
        return (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{selected}}
            key={option.id}
            onPress={() => onAnswer(option.id)}
            style={[styles.option, selected && styles.optionSelected]}>
            <Text style={[styles.optionText, selected && styles.optionTextSelected]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function ChoiceFeedback({step, answer}: {step: GameStep; answer: string | null}): React.JSX.Element | null {
  const feedback = step.options?.find(option => option.id === answer)?.feedback;
  return feedback ? <View style={styles.feedback}><Text style={styles.feedbackText}>{feedback}</Text></View> : null;
}

function stepRequiresSelection(step: GameStep): boolean {
  return [
    'choice',
    'initialChoice',
    'counterexample',
    'aiCorrection',
    'uncertainty',
    'category',
    'storyIntent',
    'draftComparison',
    'factLabel',
    'factRevision',
    'publish',
  ].includes(step.type);
}

function toOutcomeCode(value: string): string {
  return value.replace(/[^A-Za-z0-9]+/g, '_').replace(/^_+|_+$/g, '').toUpperCase();
}

function getStepLabel(step: GameStep): string {
  const labels: Record<GameStep['type'], string> = {
    intro: '任务介绍',
    choice: '选择挑战',
    initialChoice: '初次判断',
    evidence: '证据探索',
    category: '标签分类',
    multiChoice: '多项选择',
    sampleTraining: '训练样本',
    ambiguity: '多义词调查',
    toneChoice: '语气线索',
    uncertainty: '信息不足',
    storyIntent: '创作意图',
    draftComparison: '候选比较',
    revision: '人工改写',
    factLabel: '事实标签',
    sourceEvidence: '来源证据',
    factRevision: '修正发布',
    publish: '负责发布',
    aiResult: 'AI候选分析',
    counterexample: '语境变化',
    aiCorrection: '检查AI候选结果',
    review: '学习复盘',
    reward: '完成奖励',
  };
  return labels[step.type];
}

const styles = StyleSheet.create({
  content: {gap: spacing.md, paddingVertical: spacing.md, paddingBottom: spacing.xl},
  loading: {flex: 1, minHeight: 260, alignItems: 'center', justifyContent: 'center', gap: spacing.sm},
  loadingText: {color: colors.mutedText, fontSize: 15, lineHeight: 22},
  aiLoading: {minHeight: 96, alignItems: 'center', justifyContent: 'center', gap: spacing.sm},
  backButton: {alignSelf: 'flex-start', minHeight: 40, justifyContent: 'center', paddingHorizontal: spacing.sm},
  backText: {color: colors.brand, fontSize: 15, lineHeight: 22, fontWeight: '700'},
  header: {gap: spacing.sm},
  eyebrow: {color: colors.brand, fontSize: 14, lineHeight: 20, fontWeight: '700'},
  card: {gap: spacing.md, padding: spacing.lg, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, backgroundColor: colors.surface},
  stepType: {color: colors.brand, fontSize: 13, lineHeight: 20, fontWeight: '700'},
  title: {color: colors.text, fontSize: 24, lineHeight: 32, fontWeight: '700'},
  description: {color: colors.mutedText, fontSize: 16, lineHeight: 24},
  options: {gap: spacing.sm},
  option: {minHeight: 48, justifyContent: 'center', paddingHorizontal: spacing.md, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm},
  optionSelected: {borderColor: colors.brand, backgroundColor: '#E5F7F8'},
  optionText: {color: colors.text, fontSize: 15, lineHeight: 22, fontWeight: '600'},
  optionTextSelected: {color: colors.brand},
  previewOptions: {flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm},
  previewOption: {color: colors.text, fontSize: 15, lineHeight: 22, fontWeight: '700', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.sm, backgroundColor: '#F3F7F9'},
  selectionNote: {color: colors.success, fontSize: 13, lineHeight: 20, fontWeight: '700'},
  contextBox: {gap: spacing.xs, padding: spacing.md, borderRadius: radius.md, backgroundColor: '#FFF4D6'},
  contextLabel: {color: '#8A5B00', fontSize: 13, lineHeight: 20, fontWeight: '700'},
  contextText: {color: colors.text, fontSize: 14, lineHeight: 21},
  prompt: {color: colors.text, fontSize: 15, lineHeight: 22, fontWeight: '700'},
  feedback: {padding: spacing.md, borderRadius: radius.md, backgroundColor: '#EEF8F9'},
  feedbackText: {color: colors.text, fontSize: 14, lineHeight: 21},
  reward: {alignItems: 'flex-start', gap: spacing.sm, padding: spacing.md, borderRadius: radius.md, backgroundColor: '#FFF8E8'},
  rewardBadge: {color: '#8A5B00', fontSize: 13, lineHeight: 20, fontWeight: '800'},
  rewardTitle: {color: colors.text, fontSize: 21, lineHeight: 28, fontWeight: '800'},
  rewardMessage: {color: colors.mutedText, fontSize: 15, lineHeight: 22},
  score: {color: colors.success, fontSize: 20, lineHeight: 28, fontWeight: '800'},
  action: {color: colors.text, fontSize: 14, lineHeight: 21},
  completed: {flex: 1, justifyContent: 'center', gap: spacing.md, paddingVertical: spacing.xl},
  completedEyebrow: {color: colors.success, fontSize: 14, lineHeight: 20, fontWeight: '700'},
  completedTitle: {color: colors.text, fontSize: 26, lineHeight: 34, fontWeight: '700'},
  completedText: {color: colors.mutedText, fontSize: 16, lineHeight: 24},
});
