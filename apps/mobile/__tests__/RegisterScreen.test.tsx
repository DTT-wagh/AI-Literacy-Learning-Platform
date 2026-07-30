import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import {Pressable, TextInput} from 'react-native';

import {RegisterScreen} from '../src/features/auth/screens/RegisterScreen';

jest.mock('../src/api/user', () => ({
  UserApiError: class UserApiError extends Error {},
  register: jest.fn().mockResolvedValue({
    token: 'registration-token',
    tokenType: 'Bearer',
    expiresIn: 3600,
    user: {id: 1, username: '学习者8000', phone: '13800138000'},
  }),
  sendRegistrationCode: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../src/store/userStore', () => ({
  userStore: {login: jest.fn().mockResolvedValue(undefined)},
}));

test('submits phone, verification code, and password then signs in', async () => {
  const {register, sendRegistrationCode} = jest.requireMock('../src/api/user');
  const {userStore} = jest.requireMock('../src/store/userStore');
  const onLoginSuccess = jest.fn();
  let screen: ReactTestRenderer.ReactTestRenderer;

  await ReactTestRenderer.act(async () => {
    screen = ReactTestRenderer.create(<RegisterScreen goTo={jest.fn()} onLoginSuccess={onLoginSuccess} />);
  });

  const inputs = screen!.root.findAllByType(TextInput);
  await ReactTestRenderer.act(async () => {
    inputs[0].props.onChangeText('13800138000');
    inputs[1].props.onChangeText('123456');
    inputs[2].props.onChangeText('secure-pass-123');
  });

  const buttons = screen!.root.findAllByType(Pressable);
  await ReactTestRenderer.act(async () => {
    buttons.find(button => button.props.accessibilityLabel === '获取验证码')!.props.onPress();
  });
  expect(sendRegistrationCode).toHaveBeenCalledWith('13800138000');

  await ReactTestRenderer.act(async () => {
    buttons.find(button => button.props.accessibilityRole === 'button' && button.props.children?.props?.children === '注册')?.props.onPress();
    await Promise.resolve();
  });

  expect(register).toHaveBeenCalledWith({phone: '13800138000', code: '123456', password: 'secure-pass-123'});
  expect(userStore.login).toHaveBeenCalled();
  expect(onLoginSuccess).toHaveBeenCalled();
});
