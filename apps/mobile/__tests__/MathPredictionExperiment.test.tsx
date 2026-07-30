import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import {Text} from 'react-native';
import {createActor} from 'xstate';

import {AIPredictionExperiment} from '../src/features/game/components/AIPredictionExperiment';
import {gameTasks} from '../src/features/game/config/gameConfig';
import {gameMachine} from '../src/features/game/machine/gameMachine';
import {GamePlayScreen} from '../src/features/game/screens/GamePlayScreen';

const predictionTask = gameTasks.find(task => task.id === 'math.prediction.v1');

function renderedText(renderer: ReactTestRenderer.ReactTestRenderer): string {
  return renderer.root.findAllByType(Text)
    .map(node => Array.isArray(node.props.children) ? node.props.children.join('') : String(node.props.children ?? ''))
    .join(' ');
}

function findButton(renderer: ReactTestRenderer.ReactTestRenderer, label: string): ReactTestRenderer.ReactTestInstance | undefined {
  return renderer.root.findAll(node => node.props.accessibilityRole === 'button')
    .find(button => button.findAllByType(Text).some(text => String(text.props.children).includes(label)));
}

test('merges Math Island into one four-step AI pattern task', () => {
  const mathTasks = gameTasks.filter(task => task.module === 'math');
  expect(mathTasks).toHaveLength(1);
  expect(predictionTask).toMatchObject({
    title: 'AI如何发现规律',
    description: expect.stringContaining('数据输入、规律发现、数学计算、概率预测和输出判断'),
  });
  expect(predictionTask?.steps.map(step => [step.id, step.type])).toEqual([
    ['data-observation', 'intro'],
    ['pattern-discovery', 'prediction'],
    ['prediction-challenge', 'initialChoice'],
    ['ai-explanation', 'prediction'],
  ]);

  const records = predictionTask!.predictionExperiment!.records;
  const total = records.reduce((sum, record) => sum + record.count, 0);
  const related = [...records].sort((left, right) => right.count - left.count)
    .slice(0, 2)
    .reduce((sum, record) => sum + record.count, 0);
  expect(total).toBe(17);
  expect(Math.round((related / total) * 100)).toBe(predictionTask!.predictionExperiment!.prediction.relation.score);
});

test('renders data, pattern, challenge and AI explanation as distinct stages', async () => {
  expect(predictionTask?.predictionExperiment).toBeDefined();
  const experiment = predictionTask!.predictionExperiment!;
  let data: ReactTestRenderer.ReactTestRenderer;
  let pattern: ReactTestRenderer.ReactTestRenderer;
  let choice: ReactTestRenderer.ReactTestRenderer;
  let analysis: ReactTestRenderer.ReactTestRenderer;
  const onSelectOption = jest.fn();

  await ReactTestRenderer.act(async () => {
    data = ReactTestRenderer.create(
      <AIPredictionExperiment
        experiment={experiment}
        onSelectOption={onSelectOption}
        selectedOptionId={null}
        stage="data"
      />,
    );
    pattern = ReactTestRenderer.create(
      <AIPredictionExperiment
        experiment={experiment}
        onSelectOption={onSelectOption}
        selectedOptionId={null}
        stage="pattern"
      />,
    );
    choice = ReactTestRenderer.create(
      <AIPredictionExperiment
        experiment={experiment}
        onSelectOption={onSelectOption}
        selectedOptionId={null}
        stage="choice"
      />,
    );
    analysis = ReactTestRenderer.create(
      <AIPredictionExperiment
        experiment={experiment}
        onSelectOption={onSelectOption}
        selectedOptionId="ai-drawing"
        stage="analysis"
      />,
    );
  });

  const dataText = renderedText(data!);
  const patternText = renderedText(pattern!);
  const choiceText = renderedText(choice!);
  const analysisText = renderedText(analysis!);
  expect(dataText).toContain('17 条学习记录');
  expect(dataText).toContain('这些次数只是输入');
  expect(patternText).toContain('14 ÷ 17 ≈ 82%');
  expect(patternText).toContain('AI不是在理解兴趣');
  expect(choiceText).toContain('8 次');
  expect(choiceText).toContain('AI绘画课程');
  expect(analysisText).toContain('预测概率约82%');
  expect(analysisText).toContain('AI不是像人一样理解，而是通过数据和数学规律进行预测');

  const option = choice!.root.find(node => node.props.testID === 'prediction-option-ai-drawing');
  await ReactTestRenderer.act(async () => {
    option.props.onPress();
  });
  expect(onSelectOption).toHaveBeenCalledWith('ai-drawing');
});

test('keeps the student prediction while the shared machine completes all four steps', async () => {
  expect(predictionTask).toBeDefined();
  const actor = createActor(gameMachine).start();

  actor.send({type: 'START', task: predictionTask!});
  await new Promise(resolve => setTimeout(resolve, 250));
  expect(actor.getSnapshot().value).toBe('playing');
  expect(actor.getSnapshot().context.currentStepIndex).toBe(0);

  actor.send({type: 'NEXT'});
  expect(actor.getSnapshot().context.currentStepIndex).toBe(1);
  actor.send({type: 'NEXT'});
  expect(actor.getSnapshot().context.currentStepIndex).toBe(2);

  actor.send({type: 'ANSWER', answer: 'ai-drawing'});
  expect(actor.getSnapshot().context.studentAnswer).toBe('ai-drawing');
  actor.send({type: 'NEXT'});

  expect(actor.getSnapshot().context.currentStepIndex).toBe(3);
  expect(actor.getSnapshot().context.studentAnswer).toBe('ai-drawing');
  expect(actor.getSnapshot().context.task?.steps[3].id).toBe('ai-explanation');

  actor.send({type: 'NEXT'});
  expect(actor.getSnapshot().value).toBe('completed');
  actor.stop();
});

test('renders the full four-step task through the shared game screen', async () => {
  let renderer: ReactTestRenderer.ReactTestRenderer;

  await ReactTestRenderer.act(async () => {
    renderer = ReactTestRenderer.create(
      <GamePlayScreen task={predictionTask!} onBack={() => undefined} onComplete={() => undefined} />,
    );
  });
  await ReactTestRenderer.act(async () => {
    await new Promise(resolve => setTimeout(resolve, 300));
  });

  expect(renderedText(renderer!)).toContain('Step 1 数据观察');
  await ReactTestRenderer.act(async () => {
    findButton(renderer!, '下一步')!.props.onPress();
  });
  expect(renderedText(renderer!)).toContain('Step 2 规律发现');
  expect(renderedText(renderer!)).toContain('14 ÷ 17 ≈ 82%');
  await ReactTestRenderer.act(async () => {
    findButton(renderer!, '下一步')!.props.onPress();
  });
  expect(renderedText(renderer!)).toContain('Step 3 预测挑战');

  const option = renderer!.root.find(node => node.props.testID === 'prediction-option-ai-drawing');
  await ReactTestRenderer.act(async () => {
    option.props.onPress();
  });

  const nextButton = findButton(renderer!, '下一步');
  expect(nextButton).toBeDefined();
  await ReactTestRenderer.act(async () => {
    nextButton!.props.onPress();
  });

  expect(renderedText(renderer!)).toContain('Step 4 AI解释');
  expect(renderedText(renderer!)).toContain('预测概率约82%');
  expect(renderedText(renderer!)).toContain('AI不是像人一样理解');

  const completeButton = findButton(renderer!, '领取完成奖励');
  expect(completeButton).toBeDefined();
  await ReactTestRenderer.act(async () => {
    completeButton!.props.onPress();
  });

  expect(JSON.stringify(renderer!.toJSON())).toContain('任务完成');
  await ReactTestRenderer.act(async () => {
    renderer!.unmount();
  });
});
