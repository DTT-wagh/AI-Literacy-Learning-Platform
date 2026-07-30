import React from 'react';
import ReactTestRenderer from 'react-test-renderer';

import {AIWorldUnderstandingScreen} from '../src/features/game/screens/AIWorldUnderstandingScreen';

function textByTestId(
  screen: ReactTestRenderer.ReactTestRenderer,
  testID: string,
): string {
  const node = screen.root.findByProps({testID});
  return node.props.accessibilityLabel;
}

test('shows a different reviewed image when the student enters another round', async () => {
  let firstScreen: ReactTestRenderer.ReactTestRenderer;
  let secondScreen: ReactTestRenderer.ReactTestRenderer;

  await ReactTestRenderer.act(async () => {
    firstScreen = ReactTestRenderer.create(
      <AIWorldUnderstandingScreen onBack={() => undefined} />,
    );
  });
  const firstScenario = textByTestId(firstScreen!, 'scenario-name');
  await ReactTestRenderer.act(async () => {
    firstScreen!.unmount();
  });

  await ReactTestRenderer.act(async () => {
    secondScreen = ReactTestRenderer.create(
      <AIWorldUnderstandingScreen onBack={() => undefined} />,
    );
  });
  const secondScenario = textByTestId(secondScreen!, 'scenario-name');

  expect(secondScenario).not.toBe(firstScenario);
  await ReactTestRenderer.act(async () => {
    secondScreen!.unmount();
  });
});

test('completes the observation, data conversion and clarity experiment', async () => {
  let screen: ReactTestRenderer.ReactTestRenderer;

  await ReactTestRenderer.act(async () => {
    screen = ReactTestRenderer.create(
      <AIWorldUnderstandingScreen onBack={() => undefined} />,
    );
  });

  await ReactTestRenderer.act(async () => {
    screen!.root.findByProps({testID: 'feature-option-0'}).props.onPress();
    screen!.root.findByProps({testID: 'feature-option-1'}).props.onPress();
  });
  await ReactTestRenderer.act(async () => {
    screen!.root.findByProps({testID: 'human-next'}).props.onPress();
  });

  for (let step = 0; step < 5; step += 1) {
    await ReactTestRenderer.act(async () => {
      screen!.root.findByProps({testID: 'ai-next'}).props.onPress();
    });
  }

  await ReactTestRenderer.act(async () => {
    screen!.root.findByProps({testID: 'image-choice-clear'}).props.onPress();
  });
  expect(JSON.stringify(screen!.toJSON())).toContain('判断正确');

  await ReactTestRenderer.act(async () => {
    screen!.root.findByProps({testID: 'experiment-next'}).props.onPress();
  });
  const rendered = JSON.stringify(screen!.toJSON());
  expect(rendered).toContain('信息');
  expect(rendered).toContain('数据');
  expect(rendered).toContain('规律');
  expect(rendered).toContain('预测');
  expect(rendered).toContain('高概率也不等于一定正确');

  await ReactTestRenderer.act(async () => {
    screen!.unmount();
  });
});
