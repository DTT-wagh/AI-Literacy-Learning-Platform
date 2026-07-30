import http from '../src/api/http';
import {evaluateGameAI} from '../src/features/game/services/gameAIService';

jest.mock('../src/api/http', () => ({
  __esModule: true,
  default: {
    post: jest.fn(),
  },
}));

const postMock = http.post as jest.Mock;

beforeEach(() => {
  postMock.mockReset();
});

test('posts selected evidence to the game AI gateway and returns its candidate', async () => {
  postMock.mockResolvedValue({
    data: {
      code: 200,
      message: '操作成功',
      data: {
        candidate: '更像称赞',
        confidenceBand: 'medium',
        evidence: ['完成困难任务', '语气积极'],
        explanation: 'AI根据已有线索判断，但信息不足时可能出现错误',
        safetyStatus: 'safe',
      },
    },
  });

  const request = {
    taskId: 'language.context.v1',
    input: '你可真行',
    evidence: ['前一句话', '语气'],
  };
  const response = await evaluateGameAI(request);

  expect(postMock).toHaveBeenCalledWith('/api/v1/game/ai-evaluate', request);
  expect(response).toMatchObject({
    candidate: '更像称赞',
    confidenceBand: 'medium',
    safetyStatus: 'safe',
  });
});

test('returns a learning-safe fallback when the gateway cannot be reached', async () => {
  postMock.mockRejectedValue(new Error('network unavailable'));

  const response = await evaluateGameAI({
    taskId: 'language.context.v1',
    input: '你可真行',
    evidence: ['语气'],
  });

  expect(response).toEqual({
    candidate: 'AI暂时无法判断，请结合线索继续探索',
    confidenceBand: 'low',
    evidence: ['当前没有新的AI候选依据'],
    explanation: '可以继续比较上下文、表情和语气，再形成自己的判断',
    safetyStatus: 'safe',
  });
});
