import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';

import {colors, radius, spacing} from '../../../shared/theme/tokens';

export function AIGameScreen({onBack}: {onBack: () => void}): React.JSX.Element {
  return <View style={styles.content}>
    <Pressable accessibilityRole="button" onPress={onBack} style={styles.backButton}><Text style={styles.backText}>返回探索</Text></Pressable>
    <View style={styles.card}>
      <Text style={styles.title}>AI图片识别挑战</Text>
      <Text style={styles.description}>选择一张图片，看看AI能不能猜出它是什么。小游戏内容正在准备中，先来了解挑战规则吧。</Text>
      <View accessibilityLabel="图片上传占位区域" style={styles.placeholder}><Text style={styles.placeholderText}>图片识别体验区</Text></View>
      <Pressable accessibilityRole="button" style={styles.button}><Text style={styles.buttonText}>开始挑战</Text></Pressable>
    </View>
  </View>;
}

const styles = StyleSheet.create({
  content: {flex: 1, gap: spacing.md, paddingVertical: spacing.md},
  backButton: {alignSelf: 'flex-start', minHeight: 40, justifyContent: 'center', paddingHorizontal: spacing.sm},
  backText: {color: colors.brand, fontSize: 15, lineHeight: 22, fontWeight: '700'},
  card: {gap: spacing.md, padding: spacing.lg, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, backgroundColor: colors.surface},
  title: {color: colors.text, fontSize: 24, lineHeight: 32, fontWeight: '700'},
  description: {color: colors.mutedText, fontSize: 15, lineHeight: 22},
  placeholder: {minHeight: 200, alignItems: 'center', justifyContent: 'center', borderRadius: radius.md, backgroundColor: '#E5F7F8'},
  placeholderText: {color: colors.brand, fontSize: 16, lineHeight: 24, fontWeight: '700'},
  button: {minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: radius.sm, backgroundColor: colors.brand},
  buttonText: {color: colors.surface, fontSize: 16, lineHeight: 24, fontWeight: '700'},
});
