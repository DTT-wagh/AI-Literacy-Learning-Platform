import React from 'react';
import {StyleSheet, View} from 'react-native';

import {colors} from '../../../shared/theme/tokens';
import {AuthField, VerificationCodeField} from '../components/AuthFields';
import {AuthLayout, AuthLink, AuthPrimaryButton} from '../components/AuthLayout';
import type {AuthNavigation} from '../types';

export function ForgetPasswordScreen({goTo}: AuthNavigation): React.JSX.Element {
  return (
    <AuthLayout
      description="验证身份后，可以为账号设置新密码。"
      onBack={() => goTo('login')}
      title="忘记密码">
      <AuthField label="手机号或邮箱" placeholder="请输入手机号或邮箱" />
      <VerificationCodeField />
      <AuthField label="新密码" placeholder="请设置 8 位以上密码" secureTextEntry />
      <AuthField label="确认新密码" placeholder="请再次输入新密码" secureTextEntry />
      <AuthPrimaryButton label="重置密码（暂未接入）" />
      <View style={styles.divider} />
      <AuthLink label="想起密码了？去登录" onPress={() => goTo('login')} />
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
});
