import React from 'react';
import {Pressable, StyleSheet, Text, TextInput, View} from 'react-native';

import {colors, radius, spacing} from '../../../shared/theme/tokens';

type AuthFieldProps = {
  label: string;
  onChangeText?: (value: string) => void;
  placeholder: string;
  secureTextEntry?: boolean;
  value?: string;
};

export function AuthField({
  label,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  value,
}: AuthFieldProps): React.JSX.Element {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        autoCapitalize="none"
        autoCorrect={false}
        placeholder={placeholder}
        placeholderTextColor={colors.mutedText}
        secureTextEntry={secureTextEntry}
        value={value}
        onChangeText={onChangeText}
        style={styles.input}
      />
    </View>
  );
}

type VerificationCodeFieldProps = {
  disabled?: boolean;
  isSending?: boolean;
  onChangeText?: (value: string) => void;
  onSendCode?: () => void;
  value?: string;
};

export function VerificationCodeField({
  disabled = false,
  isSending = false,
  onChangeText,
  onSendCode,
  value,
}: VerificationCodeFieldProps): React.JSX.Element {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>验证码</Text>
      <View style={styles.codeRow}>
        <TextInput
          accessibilityLabel="验证码"
          keyboardType="number-pad"
          maxLength={6}
          onChangeText={onChangeText}
          placeholder="请输入验证码"
          placeholderTextColor={colors.mutedText}
          style={[styles.input, styles.codeInput]}
          value={value}
        />
        <Pressable
          accessibilityLabel="获取验证码"
          accessibilityRole="button"
          accessibilityState={{disabled}}
          disabled={disabled || isSending}
          onPress={onSendCode}
          style={[styles.codeButton, (disabled || isSending) && styles.codeButtonDisabled]}>
          <Text style={styles.codeButtonText}>{isSending ? '发送中…' : '获取验证码'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: spacing.xs,
  },
  label: {
    color: colors.text,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
  },
  input: {
    minHeight: 48,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    color: colors.text,
    fontSize: 16,
    lineHeight: 24,
    backgroundColor: colors.surface,
  },
  codeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  codeInput: {
    flex: 1,
  },
  codeButton: {
    minWidth: 112,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
    borderWidth: 1,
    borderColor: colors.brand,
    borderRadius: radius.sm,
  },
  codeButtonDisabled: {
    opacity: 0.55,
  },
  codeButtonText: {
    color: colors.brand,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
  },
});
