import {assign, setup} from 'xstate';

import type {StoredGameProgress} from '../storage/GameProgressStorage';
import type {GameL1Phase, GameLearningRecord, GameTask} from '../types/game';
import {getLocalLanguageCandidate} from '../services/languageLocalCandidateService';
import type {
  LanguageAIResult,
  LanguageGame,
  LanguageGameSnapshot,
  LanguageMachineState,
  LanguageSessionData,
} from '../types/language';

type GameContext = {
  task: GameTask | null;
  currentStepIndex: number;
  answer: string | null;
  selectedOptionIds: string[];
  l1Phase: GameL1Phase | null;
  l1Assignments: Record<string, string>;
  l1History: string[];
  l1Corrected: boolean;
  l1Explanation: string | null;
} & GameLearningRecord;

type GameEvent =
  | {type: 'START'; task: GameTask}
  | {type: 'RESTORE'; task: GameTask; progress: StoredGameProgress}
  | {type: 'NEXT'}
  | {type: 'ANSWER'; answer: string}
  | {type: 'TOGGLE_EVIDENCE'; evidenceId: string}
  | {type: 'TOGGLE_OPTION'; optionId: string}
  | {type: 'CLASSIFY_WORD'; wordId: string; categoryId: string}
  | {type: 'UNDO_CLASSIFY'; wordId: string}
  | {type: 'CORRECT_AI'; categoryId: string}
  | {type: 'EXPLAIN'; explanationId: string}
  | {type: 'RESET'};

const initialContext: GameContext = {
  task: null,
  currentStepIndex: 0,
  answer: null,
  studentAnswer: null,
  selectedEvidenceIds: [],
  selectedOptionIds: [],
  l1Phase: null,
  l1Assignments: {},
  l1History: [],
  l1Corrected: false,
  l1Explanation: null,
  aiCorrectionReason: null,
  finalAnswer: null,
};

const l1PhaseIndexes: Record<GameL1Phase, number> = {
  INTRO: 0,
  TUTORIAL: 1,
  CLASSIFY: 2,
  AI_PREDICT: 3,
  CORRECT_AI: 4,
  EXPLAIN: 5,
  REVIEW: 6,
  REWARD: 7,
};

function getRecordedAnswer(task: GameTask | null, currentStepIndex: number, answer: string): Partial<GameContext> {
  const stepType = task?.steps[currentStepIndex]?.type;

  if (stepType === 'initialChoice') return {answer, studentAnswer: answer};
  if (stepType === 'counterexample' || stepType === 'uncertainty') return {answer, finalAnswer: answer};
  if (stepType === 'aiCorrection') return {answer, aiCorrectionReason: answer};
  return {answer};
}

function phaseForProgress(progress: StoredGameProgress): GameL1Phase {
  if (progress.phase) return progress.phase;
  const index = Math.min(Math.max(progress.currentStep, 0), 7);
  return (Object.keys(l1PhaseIndexes) as GameL1Phase[]).find(phase => l1PhaseIndexes[phase] === index) ?? 'INTRO';
}

export const gameMachine = setup({
  types: {} as {context: GameContext; events: GameEvent},
  guards: {
    isL1Task: ({context}) => context.task?.id === 'language.labels.v1',
    allL1WordsClassified: ({context}) => context.task?.l1Experiment?.cards.every(card => Boolean(context.l1Assignments[card.id])) ?? false,
    correctL1Category: ({context, event}) =>
      event.type === 'CORRECT_AI' && event.categoryId === context.task?.l1Experiment?.aiMistake.correctCategory,
    correctL1Explanation: ({context, event}) =>
      event.type === 'EXPLAIN' && event.explanationId === context.task?.l1Experiment?.aiMistake.correctExplanationId,
    restoredProgressIsComplete: ({event}) => event.type === 'RESTORE' && event.progress.completed,
    phaseIsIntro: ({context}) => context.l1Phase === 'INTRO',
    phaseIsTutorial: ({context}) => context.l1Phase === 'TUTORIAL',
    phaseIsClassify: ({context}) => context.l1Phase === 'CLASSIFY',
    phaseIsAIPredict: ({context}) => context.l1Phase === 'AI_PREDICT',
    phaseIsCorrectAI: ({context}) => context.l1Phase === 'CORRECT_AI',
    phaseIsExplain: ({context}) => context.l1Phase === 'EXPLAIN',
    phaseIsReview: ({context}) => context.l1Phase === 'REVIEW',
    phaseIsReward: ({context}) => context.l1Phase === 'REWARD',
  },
}).createMachine({
  id: 'game',
  initial: 'idle',
  context: initialContext,
  states: {
    idle: {
      on: {
        START: {target: 'loading', actions: assign(({event}) => startContext(event.task))},
        RESTORE: [
          {target: 'completed', guard: 'restoredProgressIsComplete', actions: assign(({event}) => restoredContext(event.task, event.progress))},
          {target: 'loading', actions: assign(({event}) => restoredContext(event.task, event.progress))},
        ],
      },
    },
    loading: {
      after: {
        200: [
          {target: 'INTRO', guard: 'phaseIsIntro'},
          {target: 'TUTORIAL', guard: 'phaseIsTutorial'},
          {target: 'CLASSIFY', guard: 'phaseIsClassify'},
          {target: 'AI_PREDICT', guard: 'phaseIsAIPredict'},
          {target: 'CORRECT_AI', guard: 'phaseIsCorrectAI'},
          {target: 'EXPLAIN', guard: 'phaseIsExplain'},
          {target: 'REVIEW', guard: 'phaseIsReview'},
          {target: 'REWARD', guard: 'phaseIsReward'},
          {target: 'playing'},
        ],
      },
      on: {RESET: {target: 'idle', actions: assign(initialContext)}},
    },
    playing: {
      on: {
        ANSWER: {actions: assign(({context, event}) => getRecordedAnswer(context.task, context.currentStepIndex, event.answer))},
        TOGGLE_EVIDENCE: {actions: assign(({context, event}) => ({
          selectedEvidenceIds: context.selectedEvidenceIds.includes(event.evidenceId)
            ? context.selectedEvidenceIds.filter(id => id !== event.evidenceId)
            : [...context.selectedEvidenceIds, event.evidenceId],
        }))},
        TOGGLE_OPTION: {actions: assign(({context, event}) => ({
          selectedOptionIds: context.selectedOptionIds.includes(event.optionId)
            ? context.selectedOptionIds.filter(id => id !== event.optionId)
            : [...context.selectedOptionIds, event.optionId],
        }))},
        NEXT: [
          {target: 'playing', guard: ({context}) => context.task !== null && context.currentStepIndex < context.task.steps.length - 1, reenter: true, actions: assign(({context}) => ({currentStepIndex: context.currentStepIndex + 1, answer: null, selectedOptionIds: []}))},
          {target: 'completed'},
        ],
        RESET: {target: 'idle', actions: assign(initialContext)},
      },
    },
    INTRO: {on: {NEXT: {target: 'TUTORIAL', actions: assign({l1Phase: 'TUTORIAL', currentStepIndex: l1PhaseIndexes.TUTORIAL})}, RESET: {target: 'idle', actions: assign(initialContext)}}},
    TUTORIAL: {on: {NEXT: {target: 'CLASSIFY', actions: assign({l1Phase: 'CLASSIFY', currentStepIndex: l1PhaseIndexes.CLASSIFY})}, RESET: {target: 'idle', actions: assign(initialContext)}}},
    CLASSIFY: {
      on: {
        CLASSIFY_WORD: {actions: assign(({context, event}) => ({
          l1Assignments: {...context.l1Assignments, [event.wordId]: event.categoryId},
          l1History: [...context.l1History.filter(id => id !== event.wordId), event.wordId],
        }))},
        UNDO_CLASSIFY: {actions: assign(({context, event}) => {
          const assignments = {...context.l1Assignments};
          delete assignments[event.wordId];
          return {l1Assignments: assignments, l1History: context.l1History.filter(id => id !== event.wordId)};
        })},
        NEXT: {target: 'AI_PREDICT', guard: 'allL1WordsClassified', actions: assign({l1Phase: 'AI_PREDICT', currentStepIndex: l1PhaseIndexes.AI_PREDICT, answer: null})},
        RESET: {target: 'idle', actions: assign(initialContext)},
      },
    },
    AI_PREDICT: {on: {NEXT: {target: 'CORRECT_AI', actions: assign({l1Phase: 'CORRECT_AI', currentStepIndex: l1PhaseIndexes.CORRECT_AI, answer: null})}, RESET: {target: 'idle', actions: assign(initialContext)}}},
    CORRECT_AI: {
      on: {
        CORRECT_AI: [
          {target: 'EXPLAIN', guard: 'correctL1Category', actions: assign(({event}) => ({l1Corrected: true, answer: event.categoryId, aiCorrectionReason: null, l1Phase: 'EXPLAIN', currentStepIndex: l1PhaseIndexes.EXPLAIN}))},
          {actions: assign(({event}) => ({l1Corrected: false, answer: event.categoryId, aiCorrectionReason: '再看看它表示谁，还是表示做什么。'}))},
        ],
        RESET: {target: 'idle', actions: assign(initialContext)},
      },
    },
    EXPLAIN: {
      on: {
        EXPLAIN: [
          {target: 'REVIEW', guard: 'correctL1Explanation', actions: assign(({event}) => ({l1Explanation: event.explanationId, answer: event.explanationId, aiCorrectionReason: null, l1Phase: 'REVIEW', currentStepIndex: l1PhaseIndexes.REVIEW}))},
          {actions: assign(({event}) => ({l1Explanation: event.explanationId, answer: event.explanationId, aiCorrectionReason: '这个想法用到了一个类别提示，再看看“画家”是在说谁、哪里、做什么，还是感觉。'}))},
        ],
        RESET: {target: 'idle', actions: assign(initialContext)},
      },
    },
    REVIEW: {on: {NEXT: {target: 'REWARD', actions: assign({l1Phase: 'REWARD', currentStepIndex: l1PhaseIndexes.REWARD, answer: null})}, RESET: {target: 'idle', actions: assign(initialContext)}}},
    REWARD: {on: {NEXT: {target: 'completed', actions: assign({l1Phase: null})}, RESET: {target: 'idle', actions: assign(initialContext)}}},
    completed: {
      on: {
        RESET: {target: 'idle', actions: assign(initialContext)},
        START: {target: 'loading', actions: assign(({event}) => startContext(event.task))},
      },
    },
  },
});

function startContext(task: GameTask): GameContext {
  return {
    ...initialContext,
    task,
    l1Phase: task.id === 'language.labels.v1' ? 'INTRO' : null,
  };
}

function restoredContext(task: GameTask, progress: StoredGameProgress): GameContext {
  return {
    ...initialContext,
    task,
    currentStepIndex: Math.min(Math.max(progress.currentStep, 0), task.steps.length - 1),
    answer: progress.answers.current,
    studentAnswer: progress.answers.student,
    selectedEvidenceIds: progress.selectedEvidence,
    selectedOptionIds: progress.answers.options ?? [],
    l1Phase: task.id === 'language.labels.v1' ? phaseForProgress(progress) : null,
    l1Assignments: progress.answers.l1Assignments ?? {},
    l1History: progress.answers.l1History ?? [],
    l1Corrected: progress.answers.l1Corrected ?? false,
    l1Explanation: progress.answers.l1Explanation ?? null,
    aiCorrectionReason: progress.answers.aiCorrectionReason,
    finalAnswer: progress.answers.final,
  };
}

type LanguageGameContext = {
  game: LanguageGame | null;
  stageIndex: number;
  data: LanguageSessionData;
  history: LanguageSessionData[];
  candidate: LanguageAIResult | null;
  evidence: LanguageGameSnapshot['evidence'];
  offline: boolean;
  fallbackUsed: boolean;
  error: string | null;
};

type LanguageGameEvent =
  | {type: 'START'; game: LanguageGame; offline: boolean}
  | {type: 'RESTORE'; game: LanguageGame; snapshot: LanguageGameSnapshot; offline: boolean}
  | {type: 'ACTION'; patch: Partial<LanguageSessionData>; evidence?: LanguageGameSnapshot['evidence'][number]}
  | {type: 'NEXT'}
  | {type: 'UNDO'}
  | {type: 'AI_READY'; candidate: LanguageAIResult; patch?: Partial<LanguageSessionData>}
  | {type: 'AI_TIMEOUT'; candidate: LanguageAIResult; patch?: Partial<LanguageSessionData>}
  | {type: 'SET_OFFLINE'; offline: boolean}
  | {type: 'RETRY'}
  | {type: 'CANCEL'}
  | {type: 'FAIL'; message: string}
  | {type: 'RESET'};

const initialLanguageData: LanguageSessionData = {
  labels: {},
  trainingSampleIds: [],
  testResults: [],
  diagnosisId: null,
  repairSampleIds: [],
  bareJudgement: null,
  wordMeaningChoice: null,
  contextEvidenceIds: [],
  toneId: null,
  unknownChoice: null,
  storyIntent: {},
  storyCandidateId: null,
  candidateRatings: [],
  paragraphOrder: [],
  revisions: [],
  attributionConfirmed: false,
  claimKinds: {},
  selectedClaimId: null,
  sourceLinks: {},
  riskCodes: [],
  carefulRevision: null,
  publicationChecks: [],
  safetyStatus: 'safe',
  safetyMessage: null,
};

const initialLanguageContext: LanguageGameContext = {
  game: null,
  stageIndex: 0,
  data: initialLanguageData,
  history: [],
  candidate: null,
  evidence: [],
  offline: true,
  fallbackUsed: false,
  error: null,
};

export function createLanguageSessionData(): LanguageSessionData {
  return {
    ...initialLanguageData,
    labels: {},
    trainingSampleIds: [],
    testResults: [],
    repairSampleIds: [],
    contextEvidenceIds: [],
    storyIntent: {},
    candidateRatings: [],
    paragraphOrder: [],
    revisions: [],
    claimKinds: {},
    sourceLinks: {},
    riskCodes: [],
    publicationChecks: [],
  };
}

export const languageGameMachine = setup({
  types: {} as {context: LanguageGameContext; events: LanguageGameEvent},
  guards: {
    restoredComplete: ({event}) => event.type === 'RESTORE' && event.snapshot.completed,
    restoredStageIs: ({context}, params: {mode: LanguageGame['stages'][number]['mode']}) => currentStageMode(context) === params.mode,
    nextStageIs: ({context}, params: {mode: LanguageGame['stages'][number]['mode']}) => nextStageMode(context) === params.mode,
  },
  actions: {
    startLanguageGame: assign(({event}) => event.type === 'START'
      ? {
        game: event.game,
        stageIndex: 0,
        data: createLanguageSessionData(),
        history: [],
        candidate: null,
        evidence: [],
        offline: event.offline,
        fallbackUsed: false,
        error: null,
      }
      : {}),
    restoreLanguageGame: assign(({event}) => event.type === 'RESTORE'
      ? {
        game: event.game,
        stageIndex: event.snapshot.stageIndex,
        data: event.snapshot.data,
        history: [],
        candidate: null,
        evidence: event.snapshot.evidence,
        offline: event.offline,
        fallbackUsed: false,
        error: null,
      }
      : {}),
    applyAction: assign(({context, event}) => {
      if (event.type !== 'ACTION') return {};
      return {
        data: {...context.data, ...event.patch},
        history: [...context.history, context.data].slice(-20),
        evidence: event.evidence ? [...context.evidence, event.evidence] : context.evidence,
        error: null,
      };
    }),
    undoAction: assign(({context}) => {
      const previous = context.history.at(-1);
      return previous
        ? {data: previous, history: context.history.slice(0, -1), error: null}
        : {};
    }),
    advanceStage: assign(({context}) => ({
      stageIndex: Math.min(context.stageIndex + 1, Math.max((context.game?.stages.length ?? 1) - 1, 0)),
      error: null,
    })),
    rewindStage: assign(({context}) => ({
      stageIndex: Math.max(context.stageIndex - 1, 0),
      candidate: null,
      error: null,
    })),
    setCandidate: assign(({context, event}) => event.type === 'AI_READY'
      ? {candidate: event.candidate, data: event.patch ? {...context.data, ...event.patch} : context.data, fallbackUsed: event.candidate.fallback, error: null}
      : {}),
    setFallbackCandidate: assign(({context, event}) => event.type === 'AI_TIMEOUT'
      ? {candidate: event.candidate, data: event.patch ? {...context.data, ...event.patch} : context.data, fallbackUsed: true, error: null}
      : {}),
    setAutomaticFallback: assign(({context}) => ({
      candidate: context.game ? getLocalLanguageCandidate(context.game.id, context.data, true) : null,
      fallbackUsed: true,
      error: null,
    })),
    setError: assign(({event}) => event.type === 'FAIL' ? {error: event.message} : {}),
    setOffline: assign(({event}) => event.type === 'SET_OFFLINE' ? {offline: event.offline} : {}),
    clearCandidate: assign({candidate: null, fallbackUsed: false, error: null}),
  },
}).createMachine({
  id: 'languageGame',
  initial: 'INIT',
  context: initialLanguageContext,
  on: {
    SET_OFFLINE: {actions: 'setOffline'},
  },
  states: {
    INIT: {
      on: {
        START: {target: 'BRIEFING', actions: 'startLanguageGame'},
        RESTORE: [
          {target: 'COMPLETE', guard: 'restoredComplete', actions: 'restoreLanguageGame'},
          {target: 'BRIEFING', guard: {type: 'restoredStageIs', params: {mode: 'briefing'}}, actions: 'restoreLanguageGame'},
          {target: 'STUDENT_ACTION', guard: {type: 'restoredStageIs', params: {mode: 'action'}}, actions: 'restoreLanguageGame'},
          {target: 'AI_PROCESSING', guard: {type: 'restoredStageIs', params: {mode: 'ai'}}, actions: 'restoreLanguageGame'},
          {target: 'COMPARING', guard: {type: 'restoredStageIs', params: {mode: 'compare'}}, actions: 'restoreLanguageGame'},
          {target: 'REVISING', guard: {type: 'restoredStageIs', params: {mode: 'revise'}}, actions: 'restoreLanguageGame'},
          {target: 'RESULT', actions: 'restoreLanguageGame'},
        ],
      },
    },
    BRIEFING: {
      on: {
        NEXT: {target: 'STUDENT_ACTION', actions: 'advanceStage'},
        RESET: {target: 'INIT', actions: assign(initialLanguageContext)},
      },
    },
    STUDENT_ACTION: {
      on: {
        ACTION: {actions: 'applyAction'},
        UNDO: {actions: 'undoAction'},
        NEXT: {target: 'VALIDATING'},
        CANCEL: {target: 'INIT'},
        FAIL: {target: 'ERROR', actions: 'setError'},
        RESET: {target: 'INIT', actions: assign(initialLanguageContext)},
      },
    },
    VALIDATING: {
      after: {
        120: [
          {target: 'AI_PROCESSING', guard: {type: 'nextStageIs', params: {mode: 'ai'}}, actions: ['advanceStage', 'clearCandidate']},
          {target: 'STUDENT_ACTION', guard: {type: 'nextStageIs', params: {mode: 'action'}}, actions: 'advanceStage'},
          {target: 'COMPARING', guard: {type: 'nextStageIs', params: {mode: 'compare'}}, actions: 'advanceStage'},
          {target: 'REVISING', guard: {type: 'nextStageIs', params: {mode: 'revise'}}, actions: 'advanceStage'},
          {target: 'RESULT', actions: 'advanceStage'},
        ],
      },
      on: {CANCEL: {target: 'STUDENT_ACTION'}},
    },
    AI_PROCESSING: {
      after: {
        8000: {target: 'COMPARING', actions: 'setAutomaticFallback'},
      },
      on: {
        AI_READY: {target: 'COMPARING', actions: 'setCandidate'},
        AI_TIMEOUT: {target: 'COMPARING', actions: 'setFallbackCandidate'},
        CANCEL: {target: 'STUDENT_ACTION', actions: 'rewindStage'},
        FAIL: {target: 'ERROR', actions: 'setError'},
      },
    },
    COMPARING: {
      on: {
        ACTION: {actions: 'applyAction'},
        UNDO: {actions: 'undoAction'},
        NEXT: [
          {target: 'STUDENT_ACTION', guard: {type: 'nextStageIs', params: {mode: 'action'}}, actions: 'advanceStage'},
          {target: 'REVISING', guard: {type: 'nextStageIs', params: {mode: 'revise'}}, actions: 'advanceStage'},
          {target: 'RESULT', guard: {type: 'nextStageIs', params: {mode: 'result'}}, actions: 'advanceStage'},
          {target: 'COMPARING', guard: {type: 'nextStageIs', params: {mode: 'compare'}}, actions: 'advanceStage'},
        ],
        CANCEL: {target: 'INIT'},
        RESET: {target: 'INIT', actions: assign(initialLanguageContext)},
      },
    },
    REVISING: {
      on: {
        ACTION: {actions: 'applyAction'},
        UNDO: {actions: 'undoAction'},
        NEXT: [
          {target: 'STUDENT_ACTION', guard: {type: 'nextStageIs', params: {mode: 'action'}}, actions: 'advanceStage'},
          {target: 'RESULT', actions: 'advanceStage'},
        ],
        CANCEL: {target: 'INIT'},
        RESET: {target: 'INIT', actions: assign(initialLanguageContext)},
      },
    },
    RESULT: {
      on: {
        NEXT: {target: 'COMPLETE', actions: 'advanceStage'},
        UNDO: {actions: 'undoAction'},
        RESET: {target: 'INIT', actions: assign(initialLanguageContext)},
      },
    },
    COMPLETE: {
      on: {
        START: {target: 'BRIEFING', actions: 'startLanguageGame'},
        RESET: {target: 'INIT', actions: assign(initialLanguageContext)},
      },
    },
    ERROR: {
      on: {
        RETRY: {target: 'AI_PROCESSING'},
        CANCEL: {target: 'STUDENT_ACTION'},
        RESET: {target: 'INIT', actions: assign(initialLanguageContext)},
      },
    },
  },
});

function currentStageMode(context: LanguageGameContext): LanguageGame['stages'][number]['mode'] | null {
  return context.game?.stages[context.stageIndex]?.mode ?? null;
}

function nextStageMode(context: LanguageGameContext): LanguageGame['stages'][number]['mode'] | null {
  return context.game?.stages[context.stageIndex + 1]?.mode ?? null;
}

export function languageMachineState(snapshot: {value: unknown}): LanguageMachineState {
  return snapshot.value as LanguageMachineState;
}

export function toLanguageGameSnapshot(context: LanguageGameContext, complete = false): LanguageGameSnapshot | null {
  if (!context.game) return null;
  const stage = complete
    ? 'complete'
    : context.game.stages[context.stageIndex]?.id ?? 'complete';
  return {
    gameId: context.game.id,
    stageIndex: complete ? context.game.stages.length : context.stageIndex,
    stageId: stage,
    completed: complete,
    data: context.data,
    evidence: context.evidence,
    updatedAt: new Date().toISOString(),
  };
}
