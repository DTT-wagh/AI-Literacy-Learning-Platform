export type GameModuleId = 'language' | 'math' | 'science' | 'creative';

export type GameDifficulty = 'easy' | 'medium' | 'hard';

export type GameStepType =
  | 'intro'
  | 'choice'
  | 'initialChoice'
  | 'evidence'
  | 'category'
  | 'multiChoice'
  | 'sampleTraining'
  | 'ambiguity'
  | 'toneChoice'
  | 'uncertainty'
  | 'storyIntent'
  | 'draftComparison'
  | 'revision'
  | 'factLabel'
  | 'sourceEvidence'
  | 'factRevision'
  | 'publish'
  | 'prediction'
  | 'aiResult'
  | 'counterexample'
  | 'aiCorrection'
  | 'review'
  | 'reward';

export type GameConfidence = 'high' | 'medium' | 'low';

export type GameChoiceOption = {
  id: string;
  label: string;
  feedback?: string;
};

export type GamePredictionRecord = {
  id: string;
  label: string;
  count: number;
};

export type GamePredictionFeature = {
  title: string;
  description: string;
  unit: string;
  maxCount: number;
};

export type GamePredictionExperiment = {
  records: GamePredictionRecord[];
  feature: GamePredictionFeature;
  options: GameChoiceOption[];
  prediction: {
    relation: {
      label: string;
      score: number;
      explanation: string;
    };
    result: {
      title: string;
      optionId: string;
      label: string;
      explanation: string;
    };
    takeaway: {
      title: string;
      text: string;
    };
  };
};

export type GameL1Category = {
  id: string;
  label: string;
  prompt: string;
};

export type GameL1Word = {
  id: string;
  text: string;
  category: string;
};

export type GameL1TutorialExample = {
  word: string;
  category: string;
  explanation: string;
};

export type GameL1Experiment = {
  story: {
    title: string;
    content: string;
  };
  tutorial: GameL1TutorialExample[];
  categories: GameL1Category[];
  cards: GameL1Word[];
  aiMistake: {
    wordId: string;
    word: string;
    predictedCategory: string;
    confidence: GameConfidence;
    reason: string;
    correctCategory: string;
    correctExplanationId: string;
  };
  explanationOptions: GameChoiceOption[];
  reviewSummary: string;
};

export type GameEvidence = {
  id: string;
  label: string;
  content: string;
  type?: string;
  source?: string;
  metadata?: string;
};

export type GameAIResult = {
  result: string;
  confidence: GameConfidence;
  evidence: string[];
  notice?: string;
  safetyStatus?: 'safe' | 'blocked';
};

export type GameStep = {
  id: string;
  type: GameStepType;
  title: string;
  content: string;
  options?: GameChoiceOption[];
  previewOptions?: string[];
  evidence?: GameEvidence[];
  aiResult?: GameAIResult;
  aiInput?: string;
  context?: string;
  prompt?: string;
  hint?: string;
  evidenceLimit?: number;
  minSelections?: number;
  audioLabel?: string;
  sourceCards?: GameEvidence[];
  prediction?: GamePredictionExperiment;
  reward?: {
    title: string;
    message: string;
    badge: string;
  };
};

export type GameModule = {
  id: GameModuleId;
  name: string;
  goal: string;
  description: string;
  progress: number;
  unlocked: boolean;
  accentColor?: string;
  levels?: GameModuleLevel[];
};

export type GameModuleLevel = {
  id: string;
  title: string;
  question: string;
  subtasks: string[];
};

export type GameTask = {
  id: string;
  title: string;
  description: string;
  module: GameModuleId;
  difficulty: GameDifficulty;
  steps: GameStep[];
  version?: number;
  levelId?: string;
  ageBand?: string;
  durationMinutes?: number;
  objectives?: string[];
  aiMode?: 'local_rule' | 'reviewed_candidate' | 'online_candidate';
  safety?: {
    inputPolicy: string;
    publishLevel: 'local' | 'reviewed';
  };
  l1Experiment?: GameL1Experiment;
  predictionExperiment?: GamePredictionExperiment;
};

export type GameState = 'idle' | 'loading' | 'playing' | 'completed' | GameL1Phase;

export type GameLearningRecord = {
  studentAnswer: string | null;
  selectedEvidenceIds: string[];
  aiCorrectionReason: string | null;
  finalAnswer: string | null;
  selectedOptionIds?: string[];
};

export type GameL1Phase = 'INTRO' | 'TUTORIAL' | 'CLASSIFY' | 'AI_PREDICT' | 'CORRECT_AI' | 'EXPLAIN' | 'REVIEW' | 'REWARD';
