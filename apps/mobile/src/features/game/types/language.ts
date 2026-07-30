import type {
  ClassificationResult,
  ContextLayer,
  FactClaim,
  LanguageGame as ContractLanguageGame,
  LanguageGameId,
  LanguageGameStage,
  LanguageLearningEvidence,
  LanguageMachineState,
  LanguageProgress,
  ReviewedStoryCandidate,
  SafetyStatus,
  SourceCard,
  StoryRevision,
  TrainingSample,
} from '../../../../../../packages/contracts/language-games';

export type {
  ClassificationResult,
  ContextLayer,
  FactClaim,
  LanguageGameId,
  LanguageGameStage,
  LanguageLearningEvidence,
  LanguageMachineState,
  LanguageProgress,
  ReviewedStoryCandidate,
  SafetyStatus,
  SourceCard,
  StoryRevision,
  TrainingSample,
};

export type LanguageLabel = 'person' | 'place' | 'action' | 'emotion';

export type LanguageLabelDefinition = {
  id: LanguageLabel;
  label: string;
  prompt: string;
};

export type LanguageWordCard = {
  id: string;
  text: string;
  label: LanguageLabel;
  representative?: boolean;
};

export type LanguageOption = {
  id: string;
  label: string;
};

export type LanguageStoryCandidate = ReviewedStoryCandidate;

export type LanguageGameContent = {
  labels?: LanguageLabelDefinition[];
  basicCards?: LanguageWordCard[];
  samplePool?: TrainingSample[];
  testItems?: LanguageWordCard[];
  diagnosisOptions?: LanguageOption[];
  repairSampleIds?: string[];
  primaryUtterance?: string;
  bareOptions?: LanguageOption[];
  wordPairs?: Array<{word: string; sentence: string; meaning: string}>;
  contextLayers?: ContextLayer[];
  toneVariants?: Array<{id: string; label: string; meaning: string}>;
  caseLibrary?: Array<{utterance: string; contexts: string[]}>;
  unknownCase?: {
    utterance: string;
    options: LanguageOption[];
    correctId: string;
  };
  themes?: string[];
  blocks?: Record<string, string[]>;
  candidates?: LanguageStoryCandidate[];
  claims?: FactClaim[];
  sources?: SourceCard[];
  topics?: string[];
  riskOptions?: LanguageOption[];
  carefulRevision?: string;
  report: string;
};

export type LanguageGame = Omit<ContractLanguageGame, 'content' | 'version'> & {
  version: 2;
  content: LanguageGameContent;
};

export type LanguageSessionData = {
  labels: Record<string, LanguageLabel>;
  trainingSampleIds: string[];
  testResults: ClassificationResult[];
  diagnosisId: string | null;
  repairSampleIds: string[];
  bareJudgement: string | null;
  wordMeaningChoice: string | null;
  contextEvidenceIds: string[];
  toneId: string | null;
  unknownChoice: string | null;
  storyIntent: Record<string, string>;
  storyCandidateId: string | null;
  candidateRatings: string[];
  paragraphOrder: string[];
  revisions: StoryRevision[];
  attributionConfirmed: boolean;
  claimKinds: Record<string, 'fact' | 'opinion' | 'uncertain'>;
  selectedClaimId: string | null;
  sourceLinks: Record<string, string[]>;
  riskCodes: string[];
  carefulRevision: string | null;
  publicationChecks: string[];
  safetyStatus: SafetyStatus;
  safetyMessage: string | null;
};

export type LanguageGameSnapshot = {
  gameId: LanguageGameId;
  stageIndex: number;
  stageId: LanguageGameStage | 'complete';
  completed: boolean;
  data: LanguageSessionData;
  evidence: LanguageLearningEvidence[];
  updatedAt: string;
};

export type LanguageAIResult = {
  title: string;
  candidate: string;
  confidence: 'high' | 'medium' | 'low';
  evidence: string[];
  limitations: string[];
  fallback: boolean;
};
