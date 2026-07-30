import React from 'react';
import {ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import {useMachine} from '@xstate/react';
import {assign, fromPromise, setup} from 'xstate';

import {createQuestionTask, submitAiAnswer, waitForQuestionTask, type AiChallengeQuestion} from '../../api/aiChallenge';
import {colors, radius, spacing} from '../../shared/theme/tokens';

type ChallengeContext = {subject: string; difficulty: string; taskId: string | null; question: AiChallengeQuestion | null; selectedAnswer: string | null; correct: boolean | null; error: string | null};
type ChallengeEvent =
  | {type: 'START'; subject: string; difficulty: string}
  | {type: 'SELECT'; answer: string}
  | {type: 'SUBMIT'}
  | {type: 'SHOW_ANALYSIS'}
  | {type: 'NEXT'};

const challengeMachine = setup({
  types: {} as {context: ChallengeContext; events: ChallengeEvent},
  actors: {
    generate: fromPromise(({input}: {input: {subject: string; difficulty: string}}) => createQuestionTask(input.subject, input.difficulty)),
    poll: fromPromise(({input, signal}: {input: {taskId: string}; signal: AbortSignal}) => waitForQuestionTask(input.taskId, signal)),
    submit: fromPromise(({input}: {input: {question: AiChallengeQuestion; answer: string}}) => submitAiAnswer(input.question, input.answer)),
  },
}).createMachine({
  id: 'aiChallenge',
  initial: 'idle',
  context: {subject: '', difficulty: '基础', taskId: null, question: null, selectedAnswer: null, correct: null, error: null},
  states: {
    idle: {on: {START: {target: 'generating', actions: assign(({event}) => ({subject: event.subject, difficulty: event.difficulty, taskId: null, question: null, error: null}))}}},
    generating: {
      invoke: {src: 'generate', input: ({context}) => ({subject: context.subject, difficulty: context.difficulty}), onDone: {target: 'polling', actions: assign(({event}) => ({taskId: event.output.taskId, error: null}))}, onError: {target: 'idle', actions: assign(({event}) => ({error: event.error instanceof Error ? event.error.message : '题目生成失败'}))}},
    },
    polling: {
      invoke: {src: 'poll', input: ({context}) => ({taskId: context.taskId as string}), onDone: {target: 'answering', actions: assign(({event}) => ({question: event.output, selectedAnswer: null, correct: null, error: null}))}, onError: {target: 'idle', actions: assign(({event}) => ({error: event.error instanceof Error ? event.error.message : '题目生成失败'}))}},
    },
    answering: {on: {SELECT: {actions: assign(({event}) => ({selectedAnswer: event.answer}))}, SUBMIT: {target: 'submitted', guard: ({context}) => context.selectedAnswer !== null}}},
    submitted: {
      invoke: {src: 'submit', input: ({context}) => ({question: context.question as AiChallengeQuestion, answer: context.selectedAnswer as string}), onDone: {target: 'analysis', actions: assign(({event}) => ({correct: event.output.correct}))}, onError: {target: 'analysis', actions: assign(({context}) => ({correct: context.selectedAnswer === context.question?.answer}))}},
    },
    analysis: {on: {SHOW_ANALYSIS: 'analysis', NEXT: 'next'}},
    next: {entry: assign(() => ({question: null, selectedAnswer: null, correct: null, error: null})), always: 'generating'},
  },
});

const subjects = ['人工智能基础', '机器学习', '图像识别', '语音识别', '机器人'];

export function AIChallengeScreen({onBack}: {onBack: () => void}): React.JSX.Element {
  const [state, send] = useMachine(challengeMachine);
  const {question, selectedAnswer, correct, error} = state.context;
  const choosingSubject = state.matches('idle');
  const preparing = state.matches('generating') || state.matches('polling');
  const submitting = state.matches('submitted');
  const loading = preparing || submitting;
  const showAnalysis = state.matches('analysis');

  return <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
    <Pressable accessibilityRole="button" onPress={onBack} style={styles.backButton}><Text style={styles.backText}>返回探索</Text></Pressable>
    <Text style={styles.title}>AI知识挑战</Text>
    {choosingSubject ? <TopicPicker error={error} onStart={(subject, difficulty) => send({type: 'START', subject, difficulty})} /> : null}
    {loading ? <View style={styles.loading}><ActivityIndicator color={colors.brand} size="large" /><Text style={styles.status}>{preparing ? 'AI正在准备题目...' : '正在提交答案...'}</Text></View> : null}
    {question && !choosingSubject && !loading ? <View style={styles.card}>
      <Text style={styles.progress}>动态挑战 · {state.context.subject} · {state.context.difficulty}</Text>
      <Text style={styles.question}>{question.question}</Text>
      {question.options.map(option => <Pressable accessibilityRole="button" disabled={showAnalysis} key={option} onPress={() => send({type: 'SELECT', answer: option})} style={[styles.option, selectedAnswer === option && styles.optionSelected, showAnalysis && option === question.answer && styles.optionCorrect, showAnalysis && selectedAnswer === option && selectedAnswer !== question.answer && styles.optionWrong]}><Text style={styles.optionText}>{option}</Text></Pressable>)}
      {!showAnalysis ? <Pressable accessibilityRole="button" disabled={!selectedAnswer} onPress={() => send({type: 'SUBMIT'})} style={[styles.primaryButton, !selectedAnswer && styles.buttonDisabled]}><Text style={styles.primaryButtonText}>提交答案</Text></Pressable> : <View style={[styles.analysis, correct ? styles.analysisCorrect : styles.analysisWrong]}>
        <Text style={[styles.analysisTitle, correct ? styles.correctText : styles.wrongText]}>{correct ? '回答正确！' : '回答错误'}</Text>
        {!correct ? <Text style={styles.analysisText}>正确答案：{question.answer}</Text> : null}
        <Text style={styles.analysisText}>AI解析：{question.analysis}</Text>
        <Pressable accessibilityRole="button" onPress={() => send({type: 'NEXT'})} style={styles.primaryButton}><Text style={styles.primaryButtonText}>下一题</Text></Pressable>
      </View>}
    </View> : null}
  </ScrollView>;
}

function TopicPicker({error, onStart}: {error: string | null; onStart: (subject: string, difficulty: string) => void}): React.JSX.Element {
  const [subject, setSubject] = React.useState(subjects[0]);
  const [difficulty, setDifficulty] = React.useState('基础');
  return <View style={styles.card}><Text style={styles.subtitle}>选择知识主题，AI会为你生成一题新的选择题。</Text><Text style={styles.label}>知识主题</Text><View style={styles.chips}>{subjects.map(item => <Pressable key={item} onPress={() => setSubject(item)} style={[styles.chip, subject === item && styles.chipActive]}><Text style={[styles.chipText, subject === item && styles.chipTextActive]}>{item}</Text></Pressable>)}</View><Text style={styles.label}>难度</Text><View style={styles.chips}>{['基础', '进阶'].map(item => <Pressable key={item} onPress={() => setDifficulty(item)} style={[styles.chip, difficulty === item && styles.chipActive]}><Text style={[styles.chipText, difficulty === item && styles.chipTextActive]}>{item}</Text></Pressable>)}</View>{error ? <Text style={styles.error}>{error}</Text> : null}<Pressable accessibilityRole="button" onPress={() => onStart(subject, difficulty)} style={styles.primaryButton}><Text style={styles.primaryButtonText}>开始挑战</Text></Pressable></View>;
}

const styles = StyleSheet.create({
  content: {gap: spacing.md, paddingVertical: spacing.md, paddingBottom: spacing.xl},
  backButton: {alignSelf: 'flex-start', minHeight: 40, justifyContent: 'center', paddingHorizontal: spacing.sm}, backText: {color: colors.brand, fontSize: 15, lineHeight: 22, fontWeight: '700'},
  title: {color: colors.text, fontSize: 26, lineHeight: 34, fontWeight: '700'}, subtitle: {color: colors.mutedText, fontSize: 15, lineHeight: 22},
  card: {gap: spacing.md, padding: spacing.lg, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, backgroundColor: colors.surface}, loading: {minHeight: 220, alignItems: 'center', justifyContent: 'center', gap: spacing.sm}, status: {color: colors.mutedText, fontSize: 15, lineHeight: 22},
  label: {color: colors.text, fontSize: 15, lineHeight: 22, fontWeight: '700'}, chips: {flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm}, chip: {minHeight: 36, justifyContent: 'center', paddingHorizontal: spacing.sm, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm}, chipActive: {borderColor: colors.brand, backgroundColor: '#E5F7F8'}, chipText: {color: colors.mutedText, fontSize: 13, lineHeight: 20}, chipTextActive: {color: colors.brand, fontWeight: '700'},
  progress: {color: colors.brand, fontSize: 13, lineHeight: 20, fontWeight: '700'}, question: {color: colors.text, fontSize: 20, lineHeight: 28, fontWeight: '700'}, option: {minHeight: 48, justifyContent: 'center', paddingHorizontal: spacing.md, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm}, optionSelected: {borderColor: colors.brand, backgroundColor: '#E5F7F8'}, optionCorrect: {borderColor: colors.success, backgroundColor: '#E7F6EC'}, optionWrong: {borderColor: colors.coral, backgroundColor: '#FCEAE6'}, optionText: {color: colors.text, fontSize: 15, lineHeight: 22, fontWeight: '600'},
  primaryButton: {minHeight: 48, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.md, borderRadius: radius.sm, backgroundColor: colors.brand}, buttonDisabled: {opacity: 0.5}, primaryButtonText: {color: colors.surface, fontSize: 16, lineHeight: 24, fontWeight: '700'}, analysis: {gap: spacing.sm, padding: spacing.md, borderRadius: radius.sm}, analysisCorrect: {backgroundColor: '#E7F6EC'}, analysisWrong: {backgroundColor: '#FCEAE6'}, analysisTitle: {fontSize: 17, lineHeight: 24, fontWeight: '700'}, correctText: {color: colors.success}, wrongText: {color: colors.coral}, analysisText: {color: colors.text, fontSize: 14, lineHeight: 20}, error: {color: colors.coral, fontSize: 14, lineHeight: 20},
});
