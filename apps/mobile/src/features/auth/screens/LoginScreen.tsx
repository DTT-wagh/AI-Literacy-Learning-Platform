import React, {useState} from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';

import {login, UserApiError} from '../../../api/user';
import {userStore} from '../../../store/userStore';
import {colors, radius, spacing} from '../../../shared/theme/tokens';
import {AuthField, VerificationCodeField} from '../components/AuthFields';
import {AuthLayout, AuthLink, AuthPrimaryButton} from '../components/AuthLayout';
import type {AuthNavigation} from '../types';

type LoginMethod = 'password' | 'verificationCode';

type LoginScreenProps = AuthNavigation & {
  onLoginSuccess: () => void;
};

export function LoginScreen({goTo, onLoginSuccess}: LoginScreenProps): React.JSX.Element {
  const [method, setMethod] = useState<LoginMethod>('password');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async (): Promise<void> => {
    if (!phone.trim() || !password) {
      setErrorMessage('请输入手机号和密码。');
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const loginData = await login({phone: phone.trim(), password});
      await userStore.login(loginData);
      onLoginSuccess();
    } catch (error) {
      setErrorMessage(error instanceof UserApiError ? error.message : '登录失败，请稍后重试。');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout description="登录后可以同步学习进度和收藏内容。" title="欢迎回来">
      <View accessibilityRole="tablist" style={styles.methodSwitch}>
        <LoginMethodButton active={method === 'password'} label="密码登录" onPress={() => setMethod('password')} />
        <LoginMethodButton
          active={method === 'verificationCode'}
          label="验证码登录"
          onPress={() => setMethod('verificationCode')}
        />
      </View>

      <AuthField label="手机号或邮箱" onChangeText={setPhone} placeholder="请输入手机号或邮箱" value={phone} />
      {method === 'password' ? (
        <AuthField label="密码" onChangeText={setPassword} placeholder="请输入密码" secureTextEntry value={password} />
      ) : (
        <VerificationCodeField />
      )}

      {errorMessage ? <Text accessibilityRole="alert" style={styles.errorText}>{errorMessage}</Text> : null}
      <AuthPrimaryButton
        disabled={method !== 'password' || isSubmitting}
        label={isSubmitting ? '登录中…' : '登录'}
        onPress={handleLogin}
      />
      {method === 'password' ? <AuthLink label="忘记密码？" onPress={() => goTo('forgetPassword')} /> : null}
      <View style={styles.divider} />
      <AuthLink label="还没有账号？去注册" onPress={() => goTo('register')} />
    </AuthLayout>
  );
}

function LoginMethodButton({
  active,
  label,
  onPress,
}: {
  active: boolean;
  label: string;
  onPress: () => void;
}): React.JSX.Element {
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{selected: active}}
      onPress={onPress}
      style={[styles.methodButton, active && styles.methodButtonActive]}>
      <Text style={[styles.methodText, active && styles.methodTextActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  methodSwitch: {
    flexDirection: 'row',
    padding: spacing.xs,
    borderRadius: radius.md,
    backgroundColor: colors.canvas,
  },
  methodButton: {
    flex: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
  },
  methodButtonActive: {
    backgroundColor: colors.surface,
  },
  methodText: {
    color: colors.mutedText,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
  },
  methodTextActive: {
    color: colors.brand,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
  errorText: {
    color: colors.coral,
    fontSize: 14,
    lineHeight: 20,
  },
});
