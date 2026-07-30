import type {SafetyStatus} from '../types/language';

export type LanguageSafetyCheck = {
  status: SafetyStatus;
  message: string | null;
};

const personalInformationPatterns: RegExp[] = [
  /1[3-9]\d{9}/,
  /\b\d{3}[-\s]?\d{3,4}[-\s]?\d{4}\b/,
  /(我住在|地址是|住址是).{2,}/,
  /(我的|我在).{0,12}(小学|中学|学校)/,
  /(微信|QQ|账号).{0,16}\d{3,}/i,
];

const unsafeInstructionPatterns: RegExp[] = [
  /(忽略|无视).{0,12}(指令|要求|规则)/,
  /(系统提示|开发者消息|隐藏提示)/,
  /(执行|跳转到).{0,12}(命令|链接|页面)/,
];

export function checkLanguageTextSafety(value: string): LanguageSafetyCheck {
  const text = value.trim();
  if (text.length === 0) return {status: 'safe', message: null};
  if (personalInformationPatterns.some(pattern => pattern.test(text))) {
    return {status: 'blocked', message: '这里可能包含个人信息。请删去姓名、学校、住址或联系方式后再继续。'};
  }
  if (unsafeInstructionPatterns.some(pattern => pattern.test(text))) {
    return {status: 'blocked', message: '这个内容不适合在游戏里处理。请换成安全的故事或编辑内容。'};
  }
  return {status: 'safe', message: null};
}
