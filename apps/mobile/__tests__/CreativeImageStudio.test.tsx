import React from 'react';
import ReactTestRenderer from 'react-test-renderer';

import {
  fallbackCreativeKeywordGroups,
  generateCreativeImage,
  getCreativeKeywordGroups,
} from '../src/api/creativeImage';
import {CreativeImageStudioScreen} from '../src/features/game/screens/CreativeImageStudioScreen';

jest.mock('../src/api/creativeImage', () => {
  const actual = jest.requireActual('../src/api/creativeImage');
  return {
    ...actual,
    getCreativeKeywordGroups: jest
      .fn()
      .mockResolvedValue(actual.fallbackCreativeKeywordGroups),
    generateCreativeImage: jest.fn().mockResolvedValue({
      generationId: 'generation-1',
      status: 'SUCCESS',
      prompt:
        '森林里的小狐狸在清晨草地中，整体氛围是好奇探索，采用水彩插画风格。',
      imageUrl: 'data:image/png;base64,iVBORw0KGgo=',
      candidate: true,
      safetyStatus: 'candidate',
      notice: '图片已由绘图AI生成。',
      provider: 'mock',
      createdAt: '2026-07-30T00:00:00Z',
    }),
  };
});

test('lets students choose keywords and view the returned AI image', async () => {
  let screen: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    screen = ReactTestRenderer.create(
      <CreativeImageStudioScreen onBack={() => undefined} />,
    );
  });

  expect(
    screen!.root.findByProps({testID: 'creative-option-subject-forest-fox'}),
  ).toBeTruthy();
  await ReactTestRenderer.act(async () => {
    screen!.root
      .findByProps({testID: 'creative-option-subject-space-garden'})
      .props.onPress();
  });
  await ReactTestRenderer.act(async () => {
    screen!.root.findByProps({testID: 'creative-generate'}).props.onPress();
  });

  expect(generateCreativeImage).toHaveBeenCalledWith(
    expect.objectContaining({
      sceneId: 'art-studio',
      subjectId: 'space-garden',
    }),
  );
  expect(JSON.stringify(screen!.toJSON())).toContain('AI生成结果');
  expect(JSON.stringify(screen!.toJSON())).not.toContain('检查候选');

  await ReactTestRenderer.act(async () => {
    screen!.unmount();
  });
  expect(getCreativeKeywordGroups).toHaveBeenCalled();
  expect(fallbackCreativeKeywordGroups).toHaveLength(4);
});
