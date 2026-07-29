import {assign, setup} from 'xstate';

import type {StoredGameProgress} from '../storage/GameProgressStorage';
import type {GameLearningRecord, GameTask} from '../types/game';

type GameContext = {
  task: GameTask | null;
  currentStepIndex: number;
  answer: string | null;
  selectedOptionIds: string[];
} & GameLearningRecord;

type GameEvent =
  | {type: 'START'; task: GameTask}
  | {type: 'RESTORE'; task: GameTask; progress: StoredGameProgress}
  | {type: 'NEXT'}
  | {type: 'ANSWER'; answer: string}
  | {type: 'TOGGLE_EVIDENCE'; evidenceId: string}
  | {type: 'TOGGLE_OPTION'; optionId: string}
  | {type: 'RESET'};

const initialContext: GameContext = {
  task: null,
  currentStepIndex: 0,
  answer: null,
  studentAnswer: null,
  selectedEvidenceIds: [],
  selectedOptionIds: [],
  aiCorrectionReason: null,
  finalAnswer: null,
};

function getRecordedAnswer(task: GameTask | null, currentStepIndex: number, answer: string): Partial<GameContext> {
  const stepType = task?.steps[currentStepIndex]?.type;

  if (stepType === 'initialChoice') {
    return {answer, studentAnswer: answer};
  }

  if (stepType === 'counterexample' || stepType === 'uncertainty') {
    return {answer, finalAnswer: answer};
  }

  if (stepType === 'aiCorrection') {
    return {answer, aiCorrectionReason: answer};
  }

  return {answer};
}

export const gameMachine = setup({
  types: {} as {
    context: GameContext;
    events: GameEvent;
  },
  guards: {
    hasMoreSteps: ({context}) =>
      context.task !== null &&
      context.currentStepIndex < context.task.steps.length - 1,
    restoredProgressIsComplete: ({event}) => event.type === 'RESTORE' && event.progress.completed,
  },
}).createMachine({
  id: 'game',
  initial: 'idle',
  context: initialContext,
  states: {
    idle: {
      on: {
        START: {
          target: 'loading',
          actions: assign(({event}) => ({
            task: event.task,
            currentStepIndex: 0,
            answer: null,
            studentAnswer: null,
            selectedEvidenceIds: [],
            selectedOptionIds: [],
            aiCorrectionReason: null,
            finalAnswer: null,
          })),
        },
        RESTORE: [
          {
            target: 'completed',
            guard: 'restoredProgressIsComplete',
            actions: assign(({event}) => restoredContext(event.task, event.progress)),
          },
          {
            target: 'loading',
            actions: assign(({event}) => restoredContext(event.task, event.progress)),
          },
        ],
      },
    },
    loading: {
      after: {
        200: 'playing',
      },
      on: {
        RESET: {
          target: 'idle',
          actions: assign(initialContext),
        },
      },
    },
    playing: {
      on: {
        ANSWER: {
          actions: assign(({context, event}) =>
            getRecordedAnswer(context.task, context.currentStepIndex, event.answer),
          ),
        },
        TOGGLE_EVIDENCE: {
          actions: assign(({context, event}) => ({
            selectedEvidenceIds: context.selectedEvidenceIds.includes(event.evidenceId)
              ? context.selectedEvidenceIds.filter(id => id !== event.evidenceId)
              : [...context.selectedEvidenceIds, event.evidenceId],
          })),
        },
        TOGGLE_OPTION: {
          actions: assign(({context, event}) => ({
            selectedOptionIds: context.selectedOptionIds.includes(event.optionId)
              ? context.selectedOptionIds.filter(id => id !== event.optionId)
              : [...context.selectedOptionIds, event.optionId],
          })),
        },
        NEXT: [
          {
            target: 'playing',
            guard: 'hasMoreSteps',
            reenter: true,
            actions: assign(({context}) => ({
              currentStepIndex: context.currentStepIndex + 1,
              answer: null,
              selectedOptionIds: [],
            })),
          },
          {target: 'completed'},
        ],
        RESET: {
          target: 'idle',
          actions: assign(initialContext),
        },
      },
    },
    completed: {
      on: {
        RESET: {
          target: 'idle',
          actions: assign(initialContext),
        },
        START: {
          target: 'loading',
          actions: assign(({event}) => ({
            task: event.task,
            currentStepIndex: 0,
            answer: null,
            studentAnswer: null,
            selectedEvidenceIds: [],
            selectedOptionIds: [],
            aiCorrectionReason: null,
            finalAnswer: null,
          })),
        },
      },
    },
  },
});

function restoredContext(task: GameTask, progress: StoredGameProgress): GameContext {
  return {
    task,
    currentStepIndex: Math.min(Math.max(progress.currentStep, 0), task.steps.length - 1),
    answer: progress.answers.current,
    studentAnswer: progress.answers.student,
    selectedEvidenceIds: progress.selectedEvidence,
    selectedOptionIds: progress.answers.options ?? [],
    aiCorrectionReason: progress.answers.aiCorrectionReason,
    finalAnswer: progress.answers.final,
  };
}
