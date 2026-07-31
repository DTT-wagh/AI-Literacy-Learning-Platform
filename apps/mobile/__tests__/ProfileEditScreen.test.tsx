import React from 'react';
import * as ImagePicker from 'expo-image-picker';
import ReactTestRenderer from 'react-test-renderer';

import {ProfileEditScreen} from '../src/features/mine/screens/ProfileEditScreen';

beforeEach(() => {
  jest.clearAllMocks();
});

test('saves a nickname and a preset avatar', async () => {
  const onSave = jest.fn().mockResolvedValue(undefined);
  let screen: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    screen = ReactTestRenderer.create(<ProfileEditScreen
      onBack={jest.fn()}
      onSave={onSave}
      userInfo={{id: 1, username: '学习者8000', phone: '13800138000', avatar: 'preset:sun'}}
    />);
  });

  await ReactTestRenderer.act(async () => {
    screen!.root.findByProps({accessibilityLabel: '昵称'}).props.onChangeText('student002');
    screen!.root.findByProps({accessibilityLabel: '选择海洋头像'}).props.onPress();
  });
  await ReactTestRenderer.act(async () => {
    screen!.root.findByProps({accessibilityLabel: '保存资料'}).props.onPress();
    await Promise.resolve();
  });

  expect(onSave).toHaveBeenCalledWith({username: 'student002', avatar: 'preset:ocean'});
});

test('selects a square album photo and keeps its URI local-only', async () => {
  const picker = ImagePicker as unknown as {
    getMediaLibraryPermissionsAsync: jest.Mock;
    launchImageLibraryAsync: jest.Mock;
  };
  picker.getMediaLibraryPermissionsAsync.mockResolvedValue({granted: true, canAskAgain: true});
  picker.launchImageLibraryAsync.mockResolvedValue({canceled: false, assets: [{uri: 'file:///avatar.jpg'}]});
  const onSave = jest.fn().mockResolvedValue(undefined);
  let screen: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    screen = ReactTestRenderer.create(<ProfileEditScreen
      onBack={jest.fn()}
      onSave={onSave}
      userInfo={{id: 1, username: '学习者8000', phone: '13800138000', avatar: 'preset:sun'}}
    />);
  });

  await ReactTestRenderer.act(async () => {
    screen!.root.findByProps({accessibilityLabel: '从相册选择头像'}).props.onPress();
    await Promise.resolve();
    await Promise.resolve();
  });

  expect(picker.launchImageLibraryAsync).toHaveBeenCalledWith(expect.objectContaining({
    allowsEditing: true,
    aspect: [1, 1],
    mediaTypes: ['images'],
    quality: 0.8,
  }));

  await ReactTestRenderer.act(async () => {
    screen!.root.findByProps({accessibilityLabel: '保存资料'}).props.onPress();
    await Promise.resolve();
  });
  expect(onSave).toHaveBeenCalledWith({
    username: '学习者8000',
    avatar: 'preset:sun',
    localAvatarUri: 'file:///avatar.jpg',
  });
});

test('keeps the preset avatar when album permission is denied', async () => {
  const picker = ImagePicker as unknown as {
    getMediaLibraryPermissionsAsync: jest.Mock;
    requestMediaLibraryPermissionsAsync: jest.Mock;
    launchImageLibraryAsync: jest.Mock;
  };
  picker.getMediaLibraryPermissionsAsync.mockResolvedValue({granted: false, canAskAgain: false});
  picker.requestMediaLibraryPermissionsAsync.mockResolvedValue({granted: false, canAskAgain: false});
  let screen: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    screen = ReactTestRenderer.create(<ProfileEditScreen
      onBack={jest.fn()}
      onSave={jest.fn()}
      userInfo={{id: 1, username: '学习者8000', phone: '13800138000', avatar: 'preset:sun'}}
    />);
  });

  await ReactTestRenderer.act(async () => {
    screen!.root.findByProps({accessibilityLabel: '从相册选择头像'}).props.onPress();
    await Promise.resolve();
    await Promise.resolve();
  });

  expect(picker.launchImageLibraryAsync).not.toHaveBeenCalled();
  expect(JSON.stringify(screen!.toJSON())).toContain('相册权限已关闭');
});

test('shows an update prompt in an older development build', async () => {
  const picker = ImagePicker as unknown as {launchImageLibraryAsync: jest.Mock};
  const expoModules = (globalThis as typeof globalThis & {
    expo: {modules: Record<string, unknown>};
  }).expo.modules;
  const nativeImagePicker = expoModules.ExponentImagePicker;
  delete expoModules.ExponentImagePicker;

  try {
    let screen: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      screen = ReactTestRenderer.create(<ProfileEditScreen
        onBack={jest.fn()}
        onSave={jest.fn()}
        userInfo={{id: 1, username: '学习者8000', phone: '13800138000', avatar: 'preset:sun'}}
      />);
    });
    await ReactTestRenderer.act(async () => {
      screen!.root.findByProps({accessibilityLabel: '从相册选择头像'}).props.onPress();
      await Promise.resolve();
    });

    expect(picker.launchImageLibraryAsync).not.toHaveBeenCalled();
    expect(JSON.stringify(screen!.toJSON())).toContain('当前应用版本暂不支持相册和相机头像');
  } finally {
    expoModules.ExponentImagePicker = nativeImagePicker;
  }
});
