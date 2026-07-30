import http from '../../../api/http';

export type GameAISafetyStatus = 'safe' | 'blocked';
export type GameAIConfidenceBand = 'high' | 'medium' | 'low';

export type GameAIEvaluationRequest = {
  taskId: string;
  input: string;
  evidence: string[];
};

export type GameAIEvaluationResponse = {
  candidate: string;
  confidenceBand: GameAIConfidenceBand;
  evidence: string[];
  explanation: string;
  safetyStatus: GameAISafetyStatus;
};

type ApiResponse<T> = {
  code: number;
  message: string;
  data: T;
};

export async function evaluateGameAI(request: GameAIEvaluationRequest): Promise<GameAIEvaluationResponse> {
  try {
    const response = await http.post<ApiResponse<GameAIEvaluationResponse>>(
      '/api/v1/game/ai-evaluate',
      request,
    );
    const payload = response.data;

    return payload.code === 200 && isEvaluationResponse(payload.data)
      ? payload.data
      : fallbackEvaluation();
  } catch {
    return fallbackEvaluation();
  }
}

function isEvaluationResponse(value: GameAIEvaluationResponse | null | undefined): value is GameAIEvaluationResponse {
  return Boolean(
    value
      && typeof value.candidate === 'string'
      && ['high', 'medium', 'low'].includes(value.confidenceBand)
      && Array.isArray(value.evidence)
      && typeof value.explanation === 'string'
      && ['safe', 'blocked'].includes(value.safetyStatus),
  );
}

function fallbackEvaluation(): GameAIEvaluationResponse {
  return {
    candidate: 'AI暂时无法判断，请结合线索继续探索',
    confidenceBand: 'low',
    evidence: ['当前没有新的AI候选依据'],
    explanation: '可以继续比较上下文、表情和语气，再形成自己的判断',
    safetyStatus: 'safe',
  };
}
