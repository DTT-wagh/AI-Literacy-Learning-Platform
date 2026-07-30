import type {GameLearningRecord} from './types/game';

export const LEARNING_POINTS = {
  evidenceSelection: 10,
  aiCorrectionExplanation: 10,
} as const;

export function calculateLearningScore(record: GameLearningRecord): number {
  let score = 0;

  if (record.selectedEvidenceIds.length > 0) {
    score += LEARNING_POINTS.evidenceSelection;
  }

  if (record.aiCorrectionReason !== null) {
    score += LEARNING_POINTS.aiCorrectionExplanation;
  }

  return score;
}

export function getLearningActions(record: GameLearningRecord): string[] {
  const actions: string[] = [];

  if (record.selectedEvidenceIds.length > 0) {
    actions.push('选择并比较语境证据');
  }

  if (record.aiCorrectionReason !== null) {
    actions.push('解释AI候选结果可能遗漏的信息');
  }

  return actions;
}
