import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import {colors, radius, spacing} from '../../../shared/theme/tokens';

type AuthLayoutProps = {
  title: string;
  description: string;
  children: React.ReactNode;
  onBack?: () => void;
};

export function AuthLayout({
  title,
  description,
  children,
  onBack,
}: AuthLayoutProps): React.JSX.Element {
  const {width} = useWindowDimensions();
  const wide = width >= 680;

  return (
    <ScrollView
      contentContainerStyle={[styles.scrollContent, wide && styles.scrollContentWide]}
      keyboardShouldPersistTaps="handled"
      style={styles.scrollView}>
      <View style={styles.card}>
        {onBack ? (
          <Pressable
            accessibilityLabel="返回登录"
            hitSlop={8}
            onPress={onBack}
            style={styles.backButton}>
            <Text style={styles.backText}>返回</Text>
          </Pressable>
        ) : null}
        <Text style={styles.brand}>智趣AI学堂</Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
        {children}
      </View>
    </ScrollView>
  );
}

export function AuthPrimaryButton({
  disabled = false,
  label,
  onPress,
}: {
  disabled?: boolean;
  label: string;
  onPress?: () => void;
}): React.JSX.Element {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{disabled}}
      disabled={disabled}
      onPress={onPress}
      style={[styles.primaryButton, disabled && styles.primaryButtonDisabled]}>
      <Text style={styles.primaryButtonText}>{label}</Text>
    </Pressable>
  );
}

export function AuthLink({label, onPress}: {label: string; onPress: () => void}): React.JSX.Element {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.linkButton}>
      <Text style={styles.linkText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: spacing.lg,
  },
  scrollContentWide: {
    alignItems: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
  },
  backButton: {
    alignSelf: 'flex-start',
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
    marginLeft: -spacing.sm,
  },
  backText: {
    color: colors.brand,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '700',
  },
  brand: {
    color: colors.brand,
    fontSize: 18,
    lineHeight: 26,
    fontWeight: '700',
  },
  title: {
    color: colors.text,
    fontSize: 28,
    lineHeight: 38,
    fontWeight: '700',
  },
  description: {
    color: colors.mutedText,
    fontSize: 16,
    lineHeight: 24,
  },
  primaryButton: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
    backgroundColor: colors.brand,
  },
  primaryButtonDisabled: {
    opacity: 0.55,
  },
  primaryButtonText: {
    color: colors.surface,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '700',
  },
  linkButton: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  linkText: {
    color: colors.brand,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
});
