import React, {useState} from 'react';
import {ActivityIndicator, Image, NativeModules, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, TurboModuleRegistry, View} from 'react-native';

import type {UpdateProfileParams, UserInfo} from '../../../api/user';
import {colors, radius, spacing} from '../../../shared/theme/tokens';
import {getLocalAvatarUri, getProfileAvatar, profileAvatars} from '../profileAvatars';

type ProfileEditScreenProps = {
  onBack: () => void;
  onSave: (params: UpdateProfileParams) => Promise<void>;
  userInfo: UserInfo;
};

type ExpoGlobal = typeof globalThis & {
  expo?: {
    modules?: Record<string, unknown>;
  };
};

function isImagePickerNativeModuleAvailable(): boolean {
  if (Platform.OS === 'web') {
    return true;
  }

  const expoModules = (globalThis as ExpoGlobal).expo?.modules;
  if (expoModules?.ExponentImagePicker) {
    return true;
  }

  const legacyModules = NativeModules?.NativeUnimoduleProxy?.modulesConstants;
  if (legacyModules?.ExponentImagePicker) {
    return true;
  }

  try {
    // Newer React Native runtimes may expose Expo modules through TurboModule.
    // Optional chaining keeps the check safe in Jest and older builds.
    return Boolean(TurboModuleRegistry?.get?.('ExponentImagePicker'));
  } catch {
    return false;
  }
}

export function ProfileEditScreen({onBack, onSave, userInfo}: ProfileEditScreenProps): React.JSX.Element {
  const [username, setUsername] = useState(userInfo.username);
  const [avatar, setAvatar] = useState(getProfileAvatar(userInfo.avatar).id);
  const [photoUri, setPhotoUri] = useState<string | null>(getLocalAvatarUri(userInfo.avatar));
  const [isSaving, setIsSaving] = useState(false);
  const [isPicking, setIsPicking] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const selectedAvatar = getProfileAvatar(avatar);

  const pickPhoto = async (source: 'library' | 'camera'): Promise<void> => {
    if (isSaving || isPicking) {
      return;
    }

    setErrorMessage(null);
    setIsPicking(true);
    try {
      // Older development builds do not contain this native module. Check it
      // before loading expo-image-picker so Metro does not open a red error screen.
      if (!isImagePickerNativeModuleAvailable()) {
        setErrorMessage('当前应用版本暂不支持相册和相机头像，请更新应用后重试。');
        return;
      }

      // Keep this require inside the action so the picker code is only loaded
      // after the native module is known to be available.
      const importedImagePicker = require('expo-image-picker') as typeof import('expo-image-picker') & {
        default?: typeof import('expo-image-picker');
      };
      // Babel/Jest may wrap a CommonJS mock in `default`; Expo's native module
      // exposes the picker methods directly. Support both module shapes.
      const ImagePicker = importedImagePicker.default && typeof importedImagePicker.default.getMediaLibraryPermissionsAsync === 'function'
        ? importedImagePicker.default
        : importedImagePicker;
      const permission = source === 'library'
        ? await ImagePicker.getMediaLibraryPermissionsAsync()
        : await ImagePicker.getCameraPermissionsAsync();
      const resolvedPermission = permission.granted
        ? permission
        : source === 'library'
          ? await ImagePicker.requestMediaLibraryPermissionsAsync()
          : await ImagePicker.requestCameraPermissionsAsync();

      if (!resolvedPermission.granted) {
        const target = source === 'library' ? '相册' : '相机';
        setErrorMessage(resolvedPermission.canAskAgain
          ? `未获得${target}权限，仍可使用内置头像。`
          : `${target}权限已关闭，请在系统设置中允许访问；仍可使用内置头像。`);
        return;
      }

      const result = source === 'library'
        ? await ImagePicker.launchImageLibraryAsync({
          allowsEditing: true,
          aspect: [1, 1],
          mediaTypes: ['images'],
          quality: 0.8,
        })
        : await ImagePicker.launchCameraAsync({
          allowsEditing: true,
          aspect: [1, 1],
          mediaTypes: ['images'],
          quality: 0.8,
        });

      if (result.canceled) {
        return;
      }

      const nextPhotoUri = result.assets?.[0]?.uri;
      if (!nextPhotoUri) {
        setErrorMessage('没有获取到照片，请重试或使用内置头像。');
        return;
      }

      setPhotoUri(nextPhotoUri);
    } catch {
      setErrorMessage(source === 'library'
        ? '打开相册失败，请稍后重试或使用内置头像。'
        : '打开相机失败，请稍后重试或使用内置头像。');
    } finally {
      setIsPicking(false);
    }
  };

  const save = async (): Promise<void> => {
    const nextUsername = username.trim();
    if (!nextUsername) {
      setErrorMessage('请输入昵称。');
      return;
    }
    if (nextUsername.length > 50) {
      setErrorMessage('昵称不能超过50个字符。');
      return;
    }

    setErrorMessage(null);
    setIsSaving(true);
    try {
      const params: UpdateProfileParams = {username: nextUsername, avatar};
      if (photoUri) {
        params.localAvatarUri = photoUri;
      }
      await onSave(params);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '资料保存失败，请稍后重试。');
    } finally {
      setIsSaving(false);
    }
  };

  return <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
    <Pressable accessibilityRole="button" disabled={isSaving} onPress={onBack} style={styles.backButton}><Text style={styles.backText}>返回</Text></Pressable>
    <Text style={styles.title}>编辑个人资料</Text>
    <Text style={styles.subtitle}>选择一个头像，再设置你喜欢的昵称。</Text>

    <View style={styles.previewCard}>
      <View accessibilityLabel={`头像预览：${photoUri ? '自定义照片' : selectedAvatar.label}`} style={[styles.previewAvatar, {backgroundColor: selectedAvatar.backgroundColor}]}>
        {photoUri ? <Image source={{uri: photoUri}} style={styles.previewImage} /> : <Text style={[styles.previewMark, {color: selectedAvatar.foregroundColor}]}>{selectedAvatar.mark}</Text>}
      </View>
      <Text style={styles.previewName}>{username.trim() || '你的昵称'}</Text>
    </View>

    <Text style={styles.sectionTitle}>选择头像</Text>
    <View accessibilityRole="radiogroup" style={styles.avatarGrid}>
      {profileAvatars.map(option => <Pressable
        accessibilityLabel={`选择${option.label}头像`}
        accessibilityRole="radio"
        accessibilityState={{selected: avatar === option.id}}
        disabled={isSaving || isPicking}
        key={option.id}
        onPress={() => {
          setAvatar(option.id);
          setPhotoUri(null);
        }}
        style={[styles.avatarOption, avatar === option.id && styles.avatarOptionSelected]}>
        <View style={[styles.optionAvatar, {backgroundColor: option.backgroundColor}]}><Text style={[styles.optionMark, {color: option.foregroundColor}]}>{option.mark}</Text></View>
        <Text style={styles.optionLabel}>{option.label}</Text>
      </Pressable>)}
    </View>
    <Text style={styles.sectionTitle}>自定义头像</Text>
    <Text style={styles.hint}>选择照片或拍摄头像时，系统会请求相册或相机权限。照片只保存在本机，暂未上传到云端；系统清理临时文件后可能需要重新选择。</Text>
    <View style={styles.photoActions}>
      <Pressable accessibilityLabel="从相册选择头像" accessibilityRole="button" disabled={isSaving || isPicking} onPress={() => pickPhoto('library')} style={styles.photoButton}>
        <Text style={styles.photoButtonText}>从相册选择</Text>
      </Pressable>
      <Pressable accessibilityLabel="拍摄头像" accessibilityRole="button" disabled={isSaving || isPicking} onPress={() => pickPhoto('camera')} style={styles.photoButton}>
        <Text style={styles.photoButtonText}>拍摄头像</Text>
      </Pressable>
    </View>

    <Text style={styles.sectionTitle}>昵称</Text>
    <TextInput
      accessibilityLabel="昵称"
      editable={!isSaving && !isPicking}
      maxLength={50}
      onChangeText={setUsername}
      placeholder="请输入昵称"
      placeholderTextColor={colors.mutedText}
      style={styles.input}
      value={username}
    />
    <Text style={styles.counter}>{username.length}/50</Text>

    {errorMessage ? <Text accessibilityRole="alert" style={styles.errorText}>{errorMessage}</Text> : null}
    <Pressable accessibilityLabel="保存资料" accessibilityRole="button" disabled={isSaving || isPicking} onPress={save} style={[styles.saveButton, (isSaving || isPicking) && styles.disabledButton]}>
      {isSaving ? <ActivityIndicator color={colors.surface} /> : <Text style={styles.saveText}>保存资料</Text>}
    </Pressable>
  </ScrollView>;
}

const styles = StyleSheet.create({
  content: {gap: spacing.md, paddingVertical: spacing.md, paddingBottom: spacing.xl},
  backButton: {alignSelf: 'flex-start', minHeight: 40, justifyContent: 'center', paddingHorizontal: spacing.sm},
  backText: {color: colors.brand, fontSize: 15, lineHeight: 22, fontWeight: '700'},
  title: {color: colors.text, fontSize: 26, lineHeight: 34, fontWeight: '700'},
  subtitle: {color: colors.mutedText, fontSize: 14, lineHeight: 20},
  previewCard: {alignItems: 'center', gap: spacing.sm, padding: spacing.lg, borderRadius: radius.lg, backgroundColor: colors.brand},
  previewAvatar: {width: 88, height: 88, alignItems: 'center', justifyContent: 'center', borderRadius: 44},
  previewImage: {width: '100%', height: '100%', borderRadius: 44},
  previewMark: {fontSize: 36, fontWeight: '800'},
  previewName: {maxWidth: '100%', color: colors.surface, fontSize: 21, lineHeight: 29, fontWeight: '700'},
  sectionTitle: {color: colors.text, fontSize: 18, lineHeight: 26, fontWeight: '700', marginTop: spacing.sm},
  avatarGrid: {flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm},
  avatarOption: {width: '31%', minHeight: 88, alignItems: 'center', justifyContent: 'center', gap: spacing.xs, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, backgroundColor: colors.surface},
  avatarOptionSelected: {borderWidth: 2, borderColor: colors.brand, backgroundColor: '#E5F7F8'},
  optionAvatar: {width: 42, height: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 21},
  optionMark: {fontSize: 18, fontWeight: '800'},
  optionLabel: {color: colors.mutedText, fontSize: 12, lineHeight: 18},
  hint: {color: colors.mutedText, fontSize: 13, lineHeight: 20},
  photoActions: {flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm},
  photoButton: {flexGrow: 1, flexBasis: 150, minHeight: 46, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.brand, borderRadius: radius.sm, backgroundColor: colors.surface},
  photoButtonText: {color: colors.brand, fontSize: 15, lineHeight: 22, fontWeight: '700'},
  input: {minHeight: 48, paddingHorizontal: spacing.md, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, backgroundColor: colors.surface, color: colors.text, fontSize: 16},
  counter: {alignSelf: 'flex-end', color: colors.mutedText, fontSize: 12, lineHeight: 18},
  errorText: {color: colors.coral, fontSize: 14, lineHeight: 20},
  saveButton: {minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: radius.sm, backgroundColor: colors.brand},
  disabledButton: {opacity: 0.65},
  saveText: {color: colors.surface, fontSize: 16, lineHeight: 24, fontWeight: '700'},
});
