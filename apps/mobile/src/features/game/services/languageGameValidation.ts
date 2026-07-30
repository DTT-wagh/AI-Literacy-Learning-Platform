import type {LanguageGame, LanguageSessionData} from '../types/language';

export type LanguageStageValidation = {
  valid: boolean;
  message: string | null;
};

export function validateLanguageStage(game: LanguageGame, stageId: string, data: LanguageSessionData): LanguageStageValidation {
  if (game.id === 'language-label-training') return validateG1(game, stageId, data);
  if (game.id === 'language-context-reasoning') return validateG2(game, stageId, data);
  if (game.id === 'language-story-director') return validateG3(game, stageId, data);
  return validateG4(game, stageId, data);
}

function validateG1(game: LanguageGame, stageId: string, data: LanguageSessionData): LanguageStageValidation {
  if (stageId === 'label-rules') {
    const expected = game.content.basicCards?.length ?? 0;
    return pass(Object.keys(data.labels).length === expected, '先把8张基础词语卡都归纳到标签。');
  }
  if (stageId === 'training-samples') {
    const valid = (game.content.labels ?? []).every(label => {
      const count = (game.content.samplePool ?? []).filter(sample => sample.label === label.id && data.trainingSampleIds.includes(sample.id)).length;
      return count >= 2 && count <= 4;
    });
    return pass(valid, '每一类都要选择2至4张样本，AI才有比较的例子。');
  }
  if (stageId === 'misclassification-diagnosis') return pass(Boolean(data.diagnosisId), '选择一个你认为最可能的错分原因。');
  if (stageId === 'repair-training') return pass(data.repairSampleIds.length >= 2, '补充至少两张不同的情绪样本后再重新训练。');
  return pass(true, null);
}

function validateG2(game: LanguageGame, stageId: string, data: LanguageSessionData): LanguageStageValidation {
  if (stageId === 'bare-judgement') return pass(Boolean(data.bareJudgement), '先保留一个初步判断，或选择还不确定。');
  if (stageId === 'word-meaning') return pass(data.wordMeaningChoice !== null, '选择“画”在当前句子里的意思。');
  if (stageId === 'context-evidence') return pass(data.contextEvidenceIds.length >= 1, '至少把一条前后文或事件线索放进证据栏。');
  if (stageId === 'tone-comparison') return pass(Boolean(data.toneId), '比较一种表情和语气线索。');
  if (stageId === 'unknown-case') {
    const correct = game.content.unknownCase?.correctId;
    return pass(data.unknownChoice === correct, '只看这一句话还不能确定。选择“需要更多信息”是负责任的判断。');
  }
  return pass(true, null);
}

function validateG3(game: LanguageGame, stageId: string, data: LanguageSessionData): LanguageStageValidation {
  if (stageId === 'director-intent') return pass(Object.keys(data.storyIntent).length >= 5, '先完成至少五种导演积木，让故事目标更清楚。');
  if (stageId === 'draft-audition') return pass(Boolean(data.storyCandidateId) && data.candidateRatings.length >= 2, '选择一份候选，并记录至少两项比较理由。');
  if (stageId === 'scene-arrangement') return pass(data.paragraphOrder.length >= 3, '先从候选中挑选并编排三个镜头。');
  if (stageId === 'human-revision') return pass(new Set(data.revisions.map(revision => revision.type)).size >= 2, '至少完成两类人工修改。');
  if (stageId === 'work-attribution') return pass(data.attributionConfirmed, '确认学生的编辑和AI的候选参与说明。');
  return pass(true, null);
}

function validateG4(game: LanguageGame, stageId: string, data: LanguageSessionData): LanguageStageValidation {
  if (stageId === 'claim-splitting') return pass(Object.keys(data.claimKinds).length === (game.content.claims?.length ?? 0), '给每一条声明标记事实、观点或不确定。');
  if (stageId === 'source-linking') {
    const sourceIds = data.sourceLinks['claim-height'] ?? [];
    const approved = (game.content.sources ?? []).filter(source => source.reviewStatus === 'reviewed' && sourceIds.includes(source.id));
    return pass(approved.length >= 2, '给“高度”声明连接两张已审核来源卡。');
  }
  if (stageId === 'risk-diagnosis') return pass(data.riskCodes.includes('absolute'), '找出“一定”带来的绝对化表达风险。');
  if (stageId === 'careful-revision') return pass(Boolean(data.carefulRevision), '保存一条有条件、有适用范围的谨慎改写。');
  if (stageId === 'publication-check') return pass(data.publicationChecks.length === 4, '完成四项发布检查后，文章才能进入待审核。');
  return pass(true, null);
}

function pass(valid: boolean, message: string | null): LanguageStageValidation {
  return {valid, message: valid ? null : message};
}
