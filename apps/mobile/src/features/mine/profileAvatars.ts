export type ProfileAvatar = {
  id: string;
  label: string;
  backgroundColor: string;
  foregroundColor: string;
  mark: string;
};

export const LOCAL_AVATAR_PREFIX = 'local:';

export const profileAvatars: ProfileAvatar[] = [
  {id: 'preset:sun', label: '阳光', backgroundColor: '#F6BD38', foregroundColor: '#15232B', mark: 'S'},
  {id: 'preset:ocean', label: '海洋', backgroundColor: '#147D8A', foregroundColor: '#FFFFFF', mark: 'O'},
  {id: 'preset:coral', label: '珊瑚', backgroundColor: '#E96C57', foregroundColor: '#FFFFFF', mark: 'C'},
  {id: 'preset:leaf', label: '叶子', backgroundColor: '#238354', foregroundColor: '#FFFFFF', mark: 'L'},
  {id: 'preset:sky', label: '天空', backgroundColor: '#5D9BD3', foregroundColor: '#FFFFFF', mark: 'K'},
  {id: 'preset:violet', label: '星云', backgroundColor: '#7768AE', foregroundColor: '#FFFFFF', mark: 'V'},
];

export function getProfileAvatar(avatar?: string | null): ProfileAvatar {
  return profileAvatars.find(option => option.id === avatar) ?? profileAvatars[0];
}

export function getLocalAvatarUri(avatar?: string | null): string | null {
  if (!avatar?.startsWith(LOCAL_AVATAR_PREFIX)) {
    return null;
  }

  const uri = avatar.slice(LOCAL_AVATAR_PREFIX.length);
  return uri || null;
}

export function toLocalAvatarId(uri: string): string {
  return `${LOCAL_AVATAR_PREFIX}${uri}`;
}
