import type {ImageSourcePropType} from 'react-native';

export type AIWorldFeature = {
  id: string;
  label: string;
  isVisibleClue: boolean;
};

export type AIWorldSignal = {
  label: string;
  strength: number;
};

export type AIWorldScenario = {
  id: string;
  label: string;
  category: string;
  image: ImageSourcePropType;
  features: AIWorldFeature[];
  signals: AIWorldSignal[];
  pixelPalette: string[];
  confidence: number;
  blurredConfidence: number;
  blurExplanation: string;
};

export const aiWorldScenarios: AIWorldScenario[] = [
  {
    id: 'cat',
    label: '猫',
    category: '动物',
    image: require('../../../../assets/ai-world/cat.png'),
    features: [
      {id: 'ears', label: '尖尖的耳朵', isVisibleClue: true},
      {id: 'whiskers', label: '脸旁的胡须', isVisibleClue: true},
      {id: 'face', label: '圆圆的脸部轮廓', isVisibleClue: true},
      {id: 'wheels', label: '车轮和车窗', isVisibleClue: false},
    ],
    signals: [
      {label: '耳朵轮廓', strength: 92},
      {label: '胡须细线', strength: 88},
      {label: '脸部形状', strength: 84},
    ],
    pixelPalette: ['#FFB92E', '#F47C20', '#171B1D', '#FFF2D4', '#EAA276'],
    confidence: 95,
    blurredConfidence: 57,
    blurExplanation: '模糊后，耳朵边缘和胡须细线更难被分开。',
  },
  {
    id: 'dog',
    label: '狗',
    category: '动物',
    image: require('../../../../assets/ai-world/dog.png'),
    features: [
      {id: 'ears', label: '下垂的耳朵', isVisibleClue: true},
      {id: 'legs', label: '四条腿', isVisibleClue: true},
      {id: 'tail', label: '向上翘的尾巴', isVisibleClue: true},
      {id: 'lens', label: '圆形镜头', isVisibleClue: false},
    ],
    signals: [
      {label: '身体轮廓', strength: 91},
      {label: '耳朵形状', strength: 86},
      {label: '腿部位置', strength: 82},
    ],
    pixelPalette: ['#E7A57D', '#F2C6A8', '#5B3C34', '#202426', '#FFF4E9'],
    confidence: 94,
    blurredConfidence: 60,
    blurExplanation: '模糊后，腿、耳朵和尾巴的边界会连在一起。',
  },
  {
    id: 'car',
    label: '汽车',
    category: '交通工具',
    image: require('../../../../assets/ai-world/car.png'),
    features: [
      {id: 'wheels', label: '两个可见车轮', isVisibleClue: true},
      {id: 'windows', label: '前后车窗', isVisibleClue: true},
      {id: 'body', label: '长长的车身', isVisibleClue: true},
      {id: 'leaf', label: '绿色叶片', isVisibleClue: false},
    ],
    signals: [
      {label: '车轮圆形', strength: 96},
      {label: '车窗区域', strength: 89},
      {label: '车身边缘', strength: 85},
    ],
    pixelPalette: ['#E73422', '#FF5B35', '#85C6DF', '#3C4144', '#F0F4F5'],
    confidence: 97,
    blurredConfidence: 64,
    blurExplanation: '模糊后，车轮圆边和车窗分界变得不清楚。',
  },
  {
    id: 'apple',
    label: '苹果',
    category: '水果',
    image: require('../../../../assets/ai-world/apple.png'),
    features: [
      {id: 'round', label: '接近圆形的果实', isVisibleClue: true},
      {id: 'leaf', label: '顶部有叶片', isVisibleClue: true},
      {id: 'stem', label: '短短的果梗', isVisibleClue: true},
      {id: 'pedals', label: '脚踏板和链条', isVisibleClue: false},
    ],
    signals: [
      {label: '果实轮廓', strength: 93},
      {label: '红色区域', strength: 87},
      {label: '叶片位置', strength: 81},
    ],
    pixelPalette: ['#FC4C21', '#E52E1E', '#3D7D2B', '#59362A', '#FFBFA4'],
    confidence: 94,
    blurredConfidence: 62,
    blurExplanation: '模糊后，叶片、果梗和果实边缘会失去细节。',
  },
  {
    id: 'camera',
    label: '相机',
    category: '电子设备',
    image: require('../../../../assets/ai-world/camera.png'),
    features: [
      {id: 'lens', label: '正面有圆形镜头', isVisibleClue: true},
      {id: 'body', label: '方形机身', isVisibleClue: true},
      {id: 'button', label: '顶部有按钮', isVisibleClue: true},
      {id: 'tail', label: '向上翘的尾巴', isVisibleClue: false},
    ],
    signals: [
      {label: '镜头圆环', strength: 95},
      {label: '机身矩形', strength: 90},
      {label: '明暗分区', strength: 83},
    ],
    pixelPalette: ['#77858C', '#B9D7DF', '#1F2629', '#176276', '#E8EEF0'],
    confidence: 96,
    blurredConfidence: 59,
    blurExplanation: '模糊后，镜头圆环和机身边角更难被准确定位。',
  },
  {
    id: 'bicycle',
    label: '自行车',
    category: '交通工具',
    image: require('../../../../assets/ai-world/bicycle.png'),
    features: [
      {id: 'wheels', label: '前后两个车轮', isVisibleClue: true},
      {id: 'handlebar', label: '上方有车把', isVisibleClue: true},
      {id: 'frame', label: '中间有三角车架', isVisibleClue: true},
      {id: 'whiskers', label: '脸旁有胡须', isVisibleClue: false},
    ],
    signals: [
      {label: '双圆轮廓', strength: 97},
      {label: '车架线条', strength: 86},
      {label: '车把位置', strength: 80},
    ],
    pixelPalette: ['#79B8BD', '#B8D6D4', '#343D40', '#E7ECEC', '#6B777A'],
    confidence: 95,
    blurredConfidence: 55,
    blurExplanation: '模糊后，细车架、辐条和车把线条容易消失。',
  },
];

export function pickNextAIWorldScenario(
  previousId: string | null,
  random: () => number = Math.random,
): AIWorldScenario {
  const candidates =
    previousId && aiWorldScenarios.length > 1
      ? aiWorldScenarios.filter(item => item.id !== previousId)
      : aiWorldScenarios;
  const value = Math.max(0, Math.min(0.999999, random()));
  return candidates[Math.floor(value * candidates.length)];
}
