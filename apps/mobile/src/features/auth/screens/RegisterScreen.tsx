import React, {useState} from 'react';
import {StyleSheet, Text, View} from 'react-native';

import {register, sendRegistrationCode, UserApiError} from '../../../api/user';
import {userStore} from '../../../store/userStore';
import {colors, spacing} from '../../../shared/theme/tokens';
import {AuthField, VerificationCodeField} from '../components/AuthFields';
import {AuthLayout, AuthLink, AuthPrimaryButton} from '../components/AuthLayout';
import type {AuthNavigation} from '../types';

type RegisterScreenProps = AuthNavigation & {
  onLoginSuccess: () => void;
};

export function RegisterScreen({goTo, onLoginSuccess}: RegisterScreenProps): React.JSX.Element {
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSendCode = async (): Promise<void> => {
    if (!phone.trim()) {
      setErrorMessage('请输入手机号。');
      return;
    }

    setErrorMessage(null);
    setIsSendingCode(true);
    try {
      await sendRegistrationCode(phone.trim());
    } catch (error) {
      setErrorMessage(error instanceof UserApiError ? error.message : '验证码发送失败，请稍后重试。');
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleRegister = async (): Promise<void> => {
    if (!phone.trim() || !code.trim() || !password) {
      setErrorMessage('请填写手机号、验证码和密码。');
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      const loginData = await register({phone: phone.trim(), code: code.trim(), password});
      await userStore.login(loginData);
      onLoginSuccess();
    } catch (error) {
      setErrorMessage(error instanceof UserApiError ? error.message : '注册失败，请稍后重试。');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout
      description="使用手机号创建学习账号。"
      onBack={() => goTo('login')}
      title="创建账号">
      <AuthField label="手机号" onChangeText={setPhone} placeholder="请输入手机号" value={phone} />
      <VerificationCodeField
        disabled={!phone.trim()}
        isSending={isSendingCode}
        onChangeText={setCode}
        onSendCode={() => void handleSendCode()}
        value={code}
      />
      <AuthField label="设置密码" onChangeText={setPassword} placeholder="请设置 8 位以上密码" secureTextEntry value={password} />
      <Text style={styles.notice}>注册即表示你同意在监护人知情下使用本应用。</Text>
      {errorMessage ? <Text accessibilityRole="alert" style={styles.errorText}>{errorMessage}</Text> : null}
      <AuthPrimaryButton disabled={isSubmitting} label={isSubmitting ? '注册中…' : '注册'} onPress={() => void handleRegister()} />
      <View style={styles.divider} />
      <AuthLink label="已有账号？去登录" onPress={() => goTo('login')} />
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  notice: {
    color: colors.mutedText,
    fontSize: 14,
    lineHeight: 20,
  },
  errorText: {
    color: colors.coral,
    fontSize: 14,
    lineHeight: 20,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
});
