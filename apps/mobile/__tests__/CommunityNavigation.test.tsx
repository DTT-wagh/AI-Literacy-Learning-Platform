import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import {FlatList, Text} from 'react-native';

import {mainTabs} from '../src/constants/navigation';
import {CommunityScreen} from '../src/features/community/screens/CommunityScreen';
import {AppNavigator} from '../src/navigation/AppNavigator';
import {userStore} from '../src/store/userStore';

test('uses four primary tabs without a standalone explore tab', () => {
  expect(mainTabs.map(tab => tab.id)).toEqual([
    'home',
    'learn',
    'community',
    'profile',
  ]);
});

test('organizes the community tab into safe content sections', async () => {
  let screen: ReactTestRenderer.ReactTestRenderer;

  await ReactTestRenderer.act(async () => {
    screen = ReactTestRenderer.create(
      <CommunityScreen
        onOpenAiChallenge={() => undefined}
        onOpenModule={() => undefined}
      />,
    );
  });

  const list = screen!.root.findByType(FlatList);
  let headerRenderer: ReactTestRenderer.ReactTestRenderer;
  let footerRenderer: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    headerRenderer = ReactTestRenderer.create(list.props.ListHeaderComponent);
    footerRenderer = ReactTestRenderer.create(list.props.ListFooterComponent);
  });
  const header = headerRenderer!.root;
  const footer = footerRenderer!.root;
  const rendered = [...header.findAllByType(Text), ...footer.findAllByType(Text)]
    .map(node => String(node.props.children))
    .join(' ');
  expect(rendered).toContain('新闻资讯');
  expect(rendered).toContain('AI讨论');
  expect(rendered).toContain('作品展示');
  expect(rendered).toContain('互助任务');
  expect(rendered).toContain('审核状态：已审核');
  expect(rendered).toContain('举报');
  expect(rendered).toContain('新闻资讯暂未开放');
  expect(rendered).toContain('互助任务暂未开放');
});

test('opens Explore as a module inside the Community screen', async () => {
  let screen: ReactTestRenderer.ReactTestRenderer;
  let openedModuleId: string | null = null;

  await ReactTestRenderer.act(async () => {
    screen = ReactTestRenderer.create(
      <CommunityScreen
        onOpenAiChallenge={() => undefined}
        onOpenModule={module => {
          openedModuleId = module.id;
        }}
      />,
    );
  });

  const exploreTab = screen!.root.find(
    node =>
      node.props.accessibilityRole === 'tab' &&
      node.props.children?.props?.children === '探索 AI',
  );
  await ReactTestRenderer.act(async () => {
    exploreTab.props.onPress();
  });

  const rendered = JSON.stringify(screen!.toJSON());
  expect(rendered).toContain('探索AI');
  expect(rendered).toContain('语言侦探社');
  expect(rendered).toContain('数据训练营');
  expect(rendered).toContain('艺术岛');
  expect(rendered).toContain('科学岛');
  expect(rendered).toContain('选择主题 · 动态出题');
  expect(rendered).not.toContain('AI图片识别挑战');
  expect(rendered).not.toContain('AI互动实验');

  const mathModule = screen!.root.find(
    node =>
      node.props.accessibilityRole === 'button' &&
      node.props.accessibilityLabel?.startsWith('数据训练营'),
  );
  await ReactTestRenderer.act(async () => {
    mathModule.props.onPress();
  });
  expect(openedModuleId).toBe('math');
});

test('opens the Math interaction directly from Data Training Camp', async () => {
  const previousLogin = userStore.isLoggedIn;
  const previousUser = userStore.userInfo;
  userStore.isLoggedIn = true;
  userStore.userInfo = {id: 0, username: 'test-student', phone: '00000000000'};
  let screen: ReactTestRenderer.ReactTestRenderer;

  try {
    await ReactTestRenderer.act(async () => {
      screen = ReactTestRenderer.create(<AppNavigator />);
    });

    const communityTab = screen!.root.find(
      node => node.props.accessibilityLabel === '切换到社区',
    );
    await ReactTestRenderer.act(async () => {
      communityTab.props.onPress();
    });

    const exploreTab = screen!.root.find(
      node =>
        node.props.accessibilityRole === 'tab' &&
        node.props.children?.props?.children === '探索 AI',
    );
    await ReactTestRenderer.act(async () => {
      exploreTab.props.onPress();
    });

    const mathModule = screen!.root.find(
      node =>
        node.props.accessibilityRole === 'button' &&
        node.props.accessibilityLabel?.startsWith('数据训练营'),
    );
    expect(mathModule.props.accessibilityHint).toBe('直接开始AI规律互动');
    await ReactTestRenderer.act(async () => {
      mathModule.props.onPress();
    });
    await ReactTestRenderer.act(async () => {
      await new Promise(resolve => setTimeout(resolve, 250));
    });

    const interaction = JSON.stringify(screen!.toJSON());
    expect(interaction).toContain('AI如何发现规律');
    expect(interaction).toContain('Step 1 数据观察');
    expect(interaction).not.toContain('选择任务');

    const exitButton = screen!.root.find(
      node =>
        node.props.accessibilityRole === 'button' &&
        node.findAllByType(Text).some(text => text.props.children === '退出任务'),
    );
    await ReactTestRenderer.act(async () => {
      exitButton.props.onPress();
    });
    expect(JSON.stringify(screen!.toJSON())).toContain('数据训练营');
  } finally {
    await ReactTestRenderer.act(async () => {
      screen?.unmount();
    });
    userStore.isLoggedIn = previousLogin;
    userStore.userInfo = previousUser;
  }
});
