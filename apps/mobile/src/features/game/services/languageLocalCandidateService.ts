import {getLanguageGame} from '../config/languageGameConfig';
import type {ClassificationResult, LanguageAIResult, LanguageGameId, LanguageSessionData} from '../types/language';

export function getLocalLanguageCandidate(
  gameId: LanguageGameId,
  data: LanguageSessionData,
  fallback = false,
): LanguageAIResult {
  if (gameId === 'language-label-training') return g1Candidate(data, fallback);
  if (gameId === 'language-context-reasoning') return g2Candidate(data, fallback);
  if (gameId === 'language-story-director') return g3Candidate(data, fallback);
  return g4Candidate(data, fallback);
}

export function getLocalG1TestResults(data: LanguageSessionData): ClassificationResult[] {
  const game = getLanguageGame('language-label-training');
  const pool = game.content.samplePool ?? [];
  const selected = pool.filter(sample => data.trainingSampleIds.includes(sample.id) || data.repairSampleIds.includes(sample.id));
  const emotionCount = selected.filter(sample => sample.label === 'emotion').length;

  return (game.content.testItems ?? []).map(item => {
    const isEmotionBoundary = item.id === 'test-confused';
    const wrong = isEmotionBoundary && emotionCount < 2;
    return {
      itemId: item.id,
      label: wrong ? '动作' : labelText(item.label),
      confidenceBand: wrong ? 'low' : emotionCount >= 2 ? 'medium' : 'high',
      evidence: wrong
        ? ['AI几乎没有见过情绪词样本']
        : ['人提供了' + labelText(item.label) + '标签和代表性例子'],
      limitation: item.text === '画家' || item.text === '画'
        ? '单看词语不够时，需要进入语境推理局继续调查。'
        : undefined,
    };
  });
}

function g1Candidate(data: LanguageSessionData, fallback: boolean): LanguageAIResult {
  const results = getLocalG1TestResults(data);
  const confused = results.find(result => result.itemId === 'test-confused');
  const repaired = confused?.label === '情绪';
  return {
    title: '本地分类测试',
    candidate: repaired ? '“疑惑”更像情绪' : '“疑惑”被分成了动作',
    confidence: repaired ? 'medium' : 'low',
    evidence: confused?.evidence ?? [],
    limitations: repaired
      ? ['本地规则仍会在多义词上保留不确定。']
      : ['情绪样本太少，补充不同情绪词后再测试。'],
    fallback,
  };
}

function g2Candidate(data: LanguageSessionData, fallback: boolean): LanguageAIResult {
  const evidence = data.contextEvidenceIds.length > 0
    ? ['收到的线索：' + data.contextEvidenceIds.join('、'), '语气：' + (data.toneId ?? '未提供')]
    : ['还没有收到前后文或语气线索'];
  const praise = data.toneId === 'happy-tone' || data.contextEvidenceIds.includes('previous');
  return {
    title: '本地语境候选',
    candidate: praise ? '更像称赞；也可以继续核对。' : '还不确定，需要更多语境。',
    confidence: praise ? 'medium' : 'low',
    evidence,
    limitations: ['候选只使用学生打开的线索，不会猜测隐藏背景。'],
    fallback,
  };
}

function g3Candidate(data: LanguageSessionData, fallback: boolean): LanguageAIResult {
  const game = getLanguageGame('language-story-director');
  const candidate = game.content.candidates?.find(item => item.id === data.storyCandidateId)
    ?? game.content.candidates?.[0];
  return {
    title: '审核候选草稿',
    candidate: candidate ? candidate.title + '：' + (candidate.supportsGoal ? '较符合目标' : '还需要修改') : '本地候选草稿已准备好',
    confidence: candidate?.supportsGoal ? 'medium' : 'low',
    evidence: ['候选均为内容团队审核的草稿', '最终故事必须经过人工选择和改写'],
    limitations: ['候选不能直接发布，不能替代学生的编辑决定。'],
    fallback,
  };
}

function g4Candidate(data: LanguageSessionData, fallback: boolean): LanguageAIResult {
  const linked = data.sourceLinks['claim-height'] ?? [];
  return {
    title: '本地核验提示',
    candidate: linked.length >= 2 ? '这条说法需要改成有条件的表达。' : '还缺少两张可核对的来源卡。',
    confidence: linked.length >= 2 ? 'medium' : 'low',
    evidence: linked.length >= 2 ? ['已连接两张审核来源卡'] : ['来源数量不足或来源状态不可核对'],
    limitations: ['事实结论来自审核知识卡，不由开放模型单独决定。'],
    fallback,
  };
}

function labelText(label: string): string {
  return ({person: '人物', place: '地点', action: '动作', emotion: '情绪'} as Record<string, string>)[label] ?? label;
}
