import {languageGames} from '../config/languageGameConfig';
import type {StoredGameProgress} from './GameProgressStorage';
import {GameProgressStorage, gameProgressStorage} from './GameProgressStorage';
import {LanguageProgressStorage, languageProgressStorage} from './LanguageProgressStorage';
import type {LanguageGame, LanguageGameSnapshot} from '../types/language';

export function migrateLegacyLanguageProgress(
  userId: number,
  legacyStorage: Pick<GameProgressStorage, 'list'> = gameProgressStorage,
  targetStorage: Pick<LanguageProgressStorage, 'has' | 'save'> = languageProgressStorage,
): LanguageGameSnapshot[] {
  const oldProgress = legacyStorage.list(userId);
  const created: LanguageGameSnapshot[] = [];

  languageGames.forEach(game => {
    if (targetStorage.has(userId, game.id)) return;
    const related = oldProgress.filter(progress => game.legacyTaskIds.includes(progress.taskId));
    if (related.length === 0) return;

    const snapshot = migrateGame(game, related);
    targetStorage.save(userId, snapshot);
    created.push(snapshot);
  });

  return created;
}

function migrateGame(game: LanguageGame, related: StoredGameProgress[]): LanguageGameSnapshot {
  const complete = related.length === game.legacyTaskIds.length && related.every(progress => progress.completed);
  const furthest = Math.max(...related.map(progress => progress.currentStep), 0);
  const stageIndex = complete
    ? game.stages.length
    : Math.min(game.stages.length - 1, Math.max(1, furthest));
  const stage = complete ? 'complete' : game.stages[stageIndex].id;

  return {
    gameId: game.id,
    stageIndex,
    stageId: stage,
    completed: complete,
    data: {
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
    },
    evidence: [{
      dimension: dimensionForGame(game.id),
      level: complete ? 'independent' : 'attempted',
      taskBehavior: '已从旧版子任务迁移进度',
    }],
    updatedAt: related.map(progress => progress.updatedAt).sort().at(-1) ?? new Date().toISOString(),
  };
}

function dimensionForGame(gameId: LanguageGame['id']): 'modeling' | 'observation' | 'verification' | 'responsibility' {
  if (gameId === 'language-label-training') return 'modeling';
  if (gameId === 'language-context-reasoning') return 'observation';
  if (gameId === 'language-story-director') return 'responsibility';
  return 'verification';
}
