import React from 'react';
import {Pressable, Text} from 'react-native';
import ReactTestRenderer from 'react-test-renderer';

import {ClaimSourceBoard} from '../src/features/game/components/ClaimSourceBoard';
import {ContextEvidenceRail} from '../src/features/game/components/ContextEvidenceRail';
import {WordLabelBoard} from '../src/features/game/components/WordLabelBoard';
import {languageGames} from '../src/features/game/config/languageGameConfig';
import {LanguageIslandScreen} from '../src/features/game/screens/LanguageIslandScreen';
import {createLanguageSessionData} from '../src/features/game/machine/gameMachine';

function findPressableByText(
  renderer: ReactTestRenderer.ReactTestRenderer,
  textValue: string,
  role?: string,
): ReactTestRenderer.ReactTestInstance {
  return renderer.root.findAll(node => node.type === Pressable && (!role || node.props.accessibilityRole === role))
    .find(node => node.findAllByType(Text).some(text => String(text.props.children).includes(textValue)))!;
}

test('renders one unified Language Island task instead of separate game cards', async () => {
  let renderer: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    renderer = ReactTestRenderer.create(
      <LanguageIslandScreen onBack={() => undefined} />,
    );
    await Promise.resolve();
  });

  let output = JSON.stringify(renderer!.toJSON());
  expect(output).toContain('语言AI调查');
  expect(output).toContain('整理词语训练样本');
  expect(output).toContain('阶段 1 / 4');
  expect(output).not.toContain('标签训练场');
  expect(output).not.toContain('语境推理局');
  expect(output).not.toContain('真相编辑部');
  expect(output).not.toContain('故事导演台');
  expect(output).not.toContain('连接来源并谨慎改写');

  await ReactTestRenderer.act(async () => {
    renderer!.root.findByProps({testID: 'language-next'}).props.onPress();
  });
  output = JSON.stringify(renderer!.toJSON());
  expect(output).toContain('先把全部8张词语卡归纳到标签');
});

test('reuses the reviewed label, context and source interactions in the unified task', async () => {
  const data = createLanguageSessionData();
  const onChange = jest.fn();
  let g1: ReactTestRenderer.ReactTestRenderer;
  let g2: ReactTestRenderer.ReactTestRenderer;
  let g3: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    g1 = ReactTestRenderer.create(<WordLabelBoard data={data} game={languageGames[0]} onChange={onChange} stageId="training-samples" />);
    g2 = ReactTestRenderer.create(<ContextEvidenceRail data={data} game={languageGames[1]} onChange={onChange} stageId="context-evidence" />);
    g3 = ReactTestRenderer.create(<ClaimSourceBoard data={data} game={languageGames[2]} onChange={onChange} stageId="claim-splitting" />);
    await Promise.resolve();
  });

  expect(JSON.stringify(g1!.toJSON())).toContain('每类选择2至4张样本');
  expect(JSON.stringify(g2!.toJSON())).toContain('选1至2条最关键的证据');
  expect(JSON.stringify(g3!.toJSON())).toContain('逐条查看短文声明');

  const firstCheckbox = g1!.root.findAll(node => node.props.accessibilityRole === 'checkbox')[0];
  await ReactTestRenderer.act(async () => {
    firstCheckbox.props.onPress();
  });
  expect(onChange).toHaveBeenCalled();
});

test('label rules select a label before multi-selecting and confirming word cards', async () => {
  const data = createLanguageSessionData();
  const onChange = jest.fn();
  let renderer: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    renderer = ReactTestRenderer.create(<WordLabelBoard data={data} game={languageGames[0]} onChange={onChange} stageId="label-rules" />);
    await Promise.resolve();
  });

  const getWordCards = () => renderer!.root.findAll(node => node.type === Pressable && node.props.accessibilityRole === 'checkbox');
  const labelButtons = renderer!.root.findAll(node => node.type === Pressable && node.props.accessibilityRole === 'radio');
  expect(getWordCards().every(card => card.props.accessibilityState.disabled)).toBe(true);

  await ReactTestRenderer.act(async () => {
    labelButtons[0].props.onPress();
  });
  const selectableCards = getWordCards().filter(card => !card.props.accessibilityState.disabled);
  expect(selectableCards).toHaveLength(8);

  await ReactTestRenderer.act(async () => {
    selectableCards[0].props.onPress();
    selectableCards[1].props.onPress();
  });
  expect(getWordCards().filter(card => card.props.accessibilityState.checked)).toHaveLength(2);

  await ReactTestRenderer.act(async () => {
    selectableCards[0].props.onPress();
  });
  expect(getWordCards().filter(card => card.props.accessibilityState.checked)).toHaveLength(1);

  const confirmButton = renderer!.root.findAll(node => node.type === Pressable && node.props.accessibilityRole === 'button')
    .find(button => button.findAllByType(Text).some(text => String(text.props.children).includes('确认归纳')));
  expect(confirmButton).toBeDefined();
  await ReactTestRenderer.act(async () => {
    confirmButton!.props.onPress();
  });

  expect(onChange).toHaveBeenCalledWith({labels: expect.objectContaining({})});
  expect(Object.keys(onChange.mock.calls[0][0].labels)).toHaveLength(1);
});

test('completes the unified label, context and claim flow without verification', async () => {
  let renderer: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    renderer = ReactTestRenderer.create(<LanguageIslandScreen onBack={() => undefined} />);
  });

  const groups = [
    {label: '人物', words: ['老师', '医生']},
    {label: '地点', words: ['学校', '公园']},
    {label: '动作', words: ['跑', '阅读']},
    {label: '情绪', words: ['开心', '害怕']},
  ];
  for (const group of groups) {
    await ReactTestRenderer.act(async () => {
      findPressableByText(renderer!, group.label, 'radio').props.onPress();
    });
    for (const word of group.words) {
      await ReactTestRenderer.act(async () => {
        findPressableByText(renderer!, word, 'checkbox').props.onPress();
      });
    }
    await ReactTestRenderer.act(async () => {
      findPressableByText(renderer!, `确认归纳到「${group.label}」`, 'button').props.onPress();
    });
  }
  await ReactTestRenderer.act(async () => {
    renderer!.root.findByProps({testID: 'language-next'}).props.onPress();
  });
  expect(renderer!.root.findByProps({testID: 'language-phase-title'}).props.children).toBe('用上下文修正判断');
  const contextOutput = JSON.stringify(renderer!.toJSON());
  expect(contextOutput).not.toContain('像是在不高兴');
  expect(contextOutput).not.toContain('更像责备');
  expect(contextOutput).not.toContain('无奈拉长');

  await ReactTestRenderer.act(async () => {
    findPressableByText(renderer!, '像是在称赞', 'radio').props.onPress();
  });
  await ReactTestRenderer.act(async () => {
    findPressableByText(renderer!, '前一句', 'checkbox').props.onPress();
  });
  await ReactTestRenderer.act(async () => {
    findPressableByText(renderer!, '轻快上扬', 'radio').props.onPress();
  });
  await ReactTestRenderer.act(async () => {
    renderer!.root.findByProps({testID: 'language-next'}).props.onPress();
  });
  expect(renderer!.root.findByProps({testID: 'language-phase-title'}).props.children).toBe('拆分AI短文中的说法');

  for (const radioIndex of [2, 3, 7]) {
    await ReactTestRenderer.act(async () => {
      renderer!.root.findAll(node => node.type === Pressable && node.props.accessibilityRole === 'radio')[radioIndex].props.onPress();
    });
  }
  await ReactTestRenderer.act(async () => {
    renderer!.root.findByProps({testID: 'language-next'}).props.onPress();
  });

  const output = JSON.stringify(renderer!.toJSON());
  expect(output).toContain('本次调查结论');
  expect(output).toContain('已分类 3 条说法');
  expect(output).not.toContain('来源卡');
  expect(output).not.toContain('谨慎改写');
});
