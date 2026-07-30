import React from 'react';
import {ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import {useMachine} from '@xstate/react';

import {colors, radius, spacing} from '../../../shared/theme/tokens';
import {userStore} from '../../../store/userStore';
import {AIAvatar} from '../components/AIAvatar';
import {AIFeedbackAnimation} from '../components/AIFeedbackAnimation';
import {AIResultPanel} from '../components/AIResultPanel';
import {AIPredictionExperiment} from '../components/AIPredictionExperiment';
import {DragClassificationBoard} from '../components/DragClassificationBoard';
import {EvidenceCard} from '../components/EvidenceCard';
import {EvidenceSelector} from '../components/EvidenceSelector';
import {GameButton} from '../components/GameButton';
import {ProgressBar} from '../components/ProgressBar';
import {ReviewPanel} from '../components/ReviewPanel';
import {calculateLearningScore, getLearningActions} from '../evaluation';
import {gameMachine} from '../machine/gameMachine';
import {evaluateGameAI} from '../services/gameAIService';
import {gameEventSyncService} from '../services/GameEventSyncService';
import {eventQueue} from '../storage/EventQueue';
import {gameProgressStorage} from '../storage/GameProgressStorage';
import type {GameAIResult, GameL1Experiment, GameL1Phase, GameLearningRecord, GameStep, GameTask} from '../types/game';

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
  const l1Phase = state.context.l1Phase;
  const isL1Active = task.id === 'language.labels.v1' && l1Phase !== null;
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
    if (!userId || (!playing && !isL1Active && !completed)) return;
    gameProgressStorage.save(userId, {
      taskId: task.id,
      currentStep: state.context.currentStepIndex,
      answers: {
        current: state.context.answer,
        student: state.context.studentAnswer,
        aiCorrectionReason: state.context.aiCorrectionReason,
        final: state.context.finalAnswer,
        options: state.context.selectedOptionIds,
        l1Assignments: state.context.l1Assignments,
        l1History: state.context.l1History,
        l1Corrected: state.context.l1Corrected,
        l1Explanation: state.context.l1Explanation,
      },
      selectedEvidence: state.context.selectedEvidenceIds,
      completed,
      updatedAt: new Date().toISOString(),
      phase: l1Phase,
    });
  }, [completed, isL1Active, l1Phase, playing, state.context, task.id, userId]);

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

  if (isL1Active && l1Phase && task.l1Experiment) {
    return (
      <L1ExperimentView
        answer={state.context.answer}
        assignments={state.context.l1Assignments}
        correctionFeedback={state.context.aiCorrectionReason}
        experiment={task.l1Experiment}
        explanationId={state.context.l1Explanation}
        onAssign={(wordId, categoryId) => send({type: 'CLASSIFY_WORD', wordId, categoryId})}
        onBack={onBack}
        onCorrect={categoryId => {
          if (userId) {
            eventQueue.enqueue(userId, eventQueue.createEvent(userId, {
              taskId: task.id,
              stepId: 'correct-ai',
              eventType: 'AI_CORRECTION_SELECTED',
              outcomeCode: toOutcomeCode(categoryId) + '_SELECTED',
            }));
          }
          send({type: 'CORRECT_AI', categoryId});
        }}
        onExplain={explanationId => send({type: 'EXPLAIN', explanationId})}
        onNext={() => {
          if (userId && l1Phase === 'REWARD') {
            eventQueue.enqueue(userId, eventQueue.createEvent(userId, {
              taskId: task.id,
              stepId: 'reward',
              eventType: 'TASK_COMPLETED',
              outcomeCode: 'COMPLETED',
            }));
            gameEventSyncService.sync(userId).catch(() => undefined);
          }
          send({type: 'NEXT'});
        }}
        onUndo={wordId => send({type: 'UNDO_CLASSIFY', wordId})}
        phase={l1Phase}
        task={task}
      />
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

type L1ExperimentViewProps = {
  task: GameTask;
  experiment: GameL1Experiment;
  phase: GameL1Phase;
  assignments: Record<string, string>;
  answer: string | null;
  explanationId: string | null;
  correctionFeedback: string | null;
  onAssign: (wordId: string, categoryId: string) => void;
  onUndo: (wordId: string) => void;
  onCorrect: (categoryId: string) => void;
  onExplain: (explanationId: string) => void;
  onNext: () => void;
  onBack: () => void;
};

const l1PhaseOrder: GameL1Phase[] = ['INTRO', 'TUTORIAL', 'CLASSIFY', 'AI_PREDICT', 'CORRECT_AI', 'EXPLAIN', 'REVIEW', 'REWARD'];

function L1ExperimentView({task, experiment, phase, assignments, answer, explanationId, correctionFeedback, onAssign, onUndo, onCorrect, onExplain, onNext, onBack}: L1ExperimentViewProps): React.JSX.Element {
  const phaseIndex = l1PhaseOrder.indexOf(phase);
  const step = task.steps[phaseIndex];
  const allClassified = experiment.cards.every(card => Boolean(assignments[card.id]));
  const correctCategory = experiment.categories.find(category => category.id === experiment.aiMistake.correctCategory)?.label ?? '人物';
  const predictedCategory = experiment.categories.find(category => category.id === experiment.aiMistake.predictedCategory)?.label ?? '动作';

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Pressable accessibilityRole="button" onPress={onBack} style={styles.backButton}>
        <Text style={styles.backText}>退出任务</Text>
      </Pressable>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>{task.title}</Text>
        <ProgressBar label={'实验步骤 ' + (phaseIndex + 1) + ' / ' + l1PhaseOrder.length} value={((phaseIndex + 1) / l1PhaseOrder.length) * 100} />
      </View>
      <View style={styles.card}>
        <Text style={styles.stepType}>{getL1PhaseLabel(phase)}</Text>
        <Text style={styles.title}>{step?.title ?? experiment.story.title}</Text>
        <Text style={styles.description}>{step?.content ?? experiment.story.content}</Text>

        {phase === 'INTRO' ? (
          <View style={styles.storyPanel}>
            <Text style={styles.storyTitle}>{experiment.story.title}</Text>
            <Text style={styles.storyText}>{experiment.story.content}</Text>
            <AIAvatar message="标签机器不会自己知道每张邮件属于哪一类。我们先给它看标签和例子。" />
          </View>
        ) : null}

        {phase === 'TUTORIAL' ? (
          <View style={styles.tutorialList}>
            {experiment.tutorial.map(example => (
              <View key={example.word} style={styles.tutorialRow}>
                <View style={styles.tutorialWord}><Text style={styles.tutorialWordText}>{example.word}</Text></View>
                <Text style={styles.tutorialArrow}>→</Text>
                <View style={styles.tutorialCopy}>
                  <Text style={styles.tutorialCategory}>{example.category}</Text>
                  <Text style={styles.tutorialExplanation}>{example.explanation}</Text>
                </View>
              </View>
            ))}
            <AIAvatar message="这些是人先贴好的标签。AI看过许多这样的例子，才会慢慢找到规律。" />
          </View>
        ) : null}

        {phase === 'CLASSIFY' ? (
          <DragClassificationBoard assignments={assignments} cards={experiment.cards} categories={experiment.categories} onAssign={onAssign} onUndo={onUndo} />
        ) : null}

        {phase === 'AI_PREDICT' ? <AIFeedbackAnimation experiment={experiment} /> : null}

        {phase === 'CORRECT_AI' ? (
          <View style={styles.correctionPanel}>
            <Text style={styles.correctionFlag}>⚑ 纠错旗</Text>
            <Text style={styles.correctionQuestion}>“{experiment.aiMistake.word}”应该放进哪个邮筒？</Text>
            <View style={styles.options}>
              {experiment.categories.map(category => (
                <Pressable accessibilityRole="button" accessibilityState={{selected: answer === category.id}} key={category.id} onPress={() => onCorrect(category.id)} style={[styles.option, answer === category.id && styles.optionSelected]}>
                  <Text style={[styles.optionText, answer === category.id && styles.optionTextSelected]}>{category.label} · {category.prompt}</Text>
                </Pressable>
              ))}
            </View>
            {answer && answer !== experiment.aiMistake.correctCategory ? (
              <View style={styles.feedback}><Text style={styles.feedbackText}>{correctionFeedback ?? '这个想法用到了词语的一部分，再看看它表示谁，还是表示做什么。'}</Text></View>
            ) : null}
          </View>
        ) : null}

        {phase === 'EXPLAIN' ? (
          <View style={styles.explainPanel}>
            <View style={styles.newSample}>
              <Text style={styles.newSampleLabel}>新增学习样本</Text>
              <Text style={styles.newSampleValue}>{experiment.aiMistake.word} → {correctCategory}</Text>
            </View>
            <Text style={styles.prompt}>为什么“{experiment.aiMistake.word}”属于{correctCategory}？</Text>
            <EvidenceSelector onSelect={onExplain} options={experiment.explanationOptions} selectedId={explanationId} />
            {explanationId && explanationId !== experiment.aiMistake.correctExplanationId ? (
              <View style={styles.feedback}><Text style={styles.feedbackText}>{correctionFeedback}</Text></View>
            ) : null}
          </View>
        ) : null}

        {phase === 'REVIEW' ? (
          <View style={styles.l1Review}>
            <L1ReviewRow label="学生标签" value={formatAssignmentSummary(experiment, assignments)} />
            <L1ReviewRow label="AI第一次判断" value={experiment.aiMistake.word + ' → ' + predictedCategory} />
            <L1ReviewRow label="学生纠正" value={experiment.aiMistake.word + ' → ' + correctCategory} />
            <L1ReviewRow label="最终规律" value={experiment.reviewSummary} strong />
          </View>
        ) : null}

        {phase === 'REWARD' ? (
          <View style={styles.l1Reward}>
            <Text style={styles.rewardBadge}>L1 实验完成</Text>
            <Text style={styles.rewardChip}>▣</Text>
            <Text style={styles.rewardTitle}>标签整理员芯片</Text>
            <Text style={styles.rewardMessage}>{experiment.reviewSummary}</Text>
            <AIAvatar message="你先给AI看标签和例子，又检查并纠正了它的候选结果。" />
          </View>
        ) : null}

        {phase === 'INTRO' ? <GameButton label="查看标签示例" onPress={onNext} /> : null}
        {phase === 'TUTORIAL' ? <GameButton label="开始整理邮件" onPress={onNext} /> : null}
        {phase === 'CLASSIFY' ? <GameButton disabled={!allClassified} label={allClassified ? '让AI试一试' : '整理完12张卡后继续'} onPress={onNext} /> : null}
        {phase === 'AI_PREDICT' ? <GameButton label="举起纠错旗" onPress={onNext} /> : null}
        {phase === 'REVIEW' ? <GameButton label="领取标签整理员芯片" onPress={onNext} /> : null}
        {phase === 'REWARD' ? <GameButton label="完成实验" onPress={onNext} /> : null}
      </View>
    </ScrollView>
  );
}

function L1ReviewRow({label, value, strong = false}: {label: string; value: string; strong?: boolean}): React.JSX.Element {
  return (
    <View style={styles.l1ReviewRow}>
      <Text style={styles.l1ReviewLabel}>{label}</Text>
      <Text style={[styles.l1ReviewValue, strong && styles.l1ReviewStrong]}>{value}</Text>
    </View>
  );
}

function formatAssignmentSummary(experiment: GameL1Experiment, assignments: Record<string, string>): string {
  return experiment.categories.map(category => {
    const words = experiment.cards.filter(card => assignments[card.id] === category.id).map(card => card.text);
    return category.label + '：' + (words.join('、') || '暂无');
  }).join('；');
}

function getL1PhaseLabel(phase: GameL1Phase): string {
  const labels: Record<GameL1Phase, string> = {
    INTRO: '故事简报',
    TUTORIAL: '热身教学',
    CLASSIFY: '词语标签实验',
    AI_PREDICT: 'AI尝试分类',
    CORRECT_AI: '学生纠错',
    EXPLAIN: '说出依据',
    REVIEW: '学习复盘',
    REWARD: '完成奖励',
  };
  return labels[phase];
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
  if (task.predictionExperiment && step.id === 'data-observation') {
    return (
      <AIPredictionExperiment
        experiment={task.predictionExperiment}
        onSelectOption={() => undefined}
        selectedOptionId={null}
        stage="data"
      />
    );
  }

  if (task.predictionExperiment && step.id === 'pattern-discovery') {
    return (
      <AIPredictionExperiment
        experiment={task.predictionExperiment}
        onSelectOption={() => undefined}
        selectedOptionId={null}
        stage="pattern"
      />
    );
  }

  if (step.type === 'intro' && step.previewOptions) {
    return <View style={styles.previewOptions}>{step.previewOptions.map(option => <Text key={option} style={styles.previewOption}>{option}</Text>)}</View>;
  }

  if (task.predictionExperiment && step.type === 'initialChoice') {
    return (
      <AIPredictionExperiment
        experiment={task.predictionExperiment}
        onSelectOption={onAnswer}
        selectedOptionId={answer ?? record.studentAnswer}
        stage="choice"
      />
    );
  }

  if (task.predictionExperiment && step.type === 'prediction') {
    return (
      <AIPredictionExperiment
        experiment={task.predictionExperiment}
        onSelectOption={() => undefined}
        selectedOptionId={record.studentAnswer}
        stage="analysis"
      />
    );
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
  const mathPredictionLabels: Record<string, string> = {
    'data-observation': '数据输入',
    'pattern-discovery': '发现规律与数学计算',
    'prediction-challenge': '概率预测',
    'ai-explanation': '输出判断与AI解释',
  };
  if (mathPredictionLabels[step.id]) return mathPredictionLabels[step.id];

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
    prediction: 'AI预测分析',
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
  storyPanel: {gap: spacing.md, padding: spacing.md, borderRadius: radius.md, backgroundColor: '#FFF8E8'},
  storyTitle: {color: colors.text, fontSize: 20, lineHeight: 28, fontWeight: '800'},
  storyText: {color: colors.mutedText, fontSize: 15, lineHeight: 23},
  tutorialList: {gap: spacing.md},
  tutorialRow: {flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.sm, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, backgroundColor: '#F7FAFC'},
  tutorialWord: {minWidth: 72, minHeight: 52, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.sm, borderRadius: radius.sm, backgroundColor: colors.surface},
  tutorialWordText: {color: colors.text, fontSize: 18, lineHeight: 26, fontWeight: '800'},
  tutorialArrow: {color: colors.brand, fontSize: 22, lineHeight: 28, fontWeight: '800'},
  tutorialCopy: {flex: 1, gap: spacing.xs},
  tutorialCategory: {color: colors.brand, fontSize: 16, lineHeight: 22, fontWeight: '800'},
  tutorialExplanation: {color: colors.mutedText, fontSize: 13, lineHeight: 19},
  correctionPanel: {gap: spacing.md},
  correctionFlag: {alignSelf: 'flex-start', color: '#B34C3D', fontSize: 18, lineHeight: 26, fontWeight: '800'},
  correctionQuestion: {color: colors.text, fontSize: 18, lineHeight: 27, fontWeight: '800'},
  explainPanel: {gap: spacing.md},
  newSample: {gap: spacing.xs, padding: spacing.md, borderWidth: 1, borderColor: '#9ACCC4', borderRadius: radius.md, backgroundColor: '#F0FAF6'},
  newSampleLabel: {color: colors.success, fontSize: 13, lineHeight: 20, fontWeight: '800'},
  newSampleValue: {color: colors.text, fontSize: 22, lineHeight: 30, fontWeight: '800'},
  l1Review: {gap: spacing.sm, padding: spacing.md, borderRadius: radius.md, backgroundColor: '#F3F7F9'},
  l1ReviewRow: {gap: spacing.xs, paddingBottom: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border},
  l1ReviewLabel: {color: colors.brand, fontSize: 13, lineHeight: 20, fontWeight: '800'},
  l1ReviewValue: {color: colors.text, fontSize: 15, lineHeight: 23},
  l1ReviewStrong: {color: colors.success, fontWeight: '800'},
  l1Reward: {alignItems: 'center', gap: spacing.sm, padding: spacing.md, borderRadius: radius.md, backgroundColor: '#FFF8E8'},
  rewardChip: {color: '#B27700', fontSize: 50, lineHeight: 58, fontWeight: '800'},
  completed: {flex: 1, justifyContent: 'center', gap: spacing.md, paddingVertical: spacing.xl},
  completedEyebrow: {color: colors.success, fontSize: 14, lineHeight: 20, fontWeight: '700'},
  completedTitle: {color: colors.text, fontSize: 26, lineHeight: 34, fontWeight: '700'},
  completedText: {color: colors.mutedText, fontSize: 16, lineHeight: 24},
});
