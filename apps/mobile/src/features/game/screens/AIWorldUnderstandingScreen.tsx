import React from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import {colors, radius, spacing} from '../../../shared/theme/tokens';
import {GameButton} from '../components/GameButton';
import {
  pickNextAIWorldScenario,
  type AIWorldScenario,
} from '../config/aiWorldScenarios';

type AIWorldUnderstandingScreenProps = {
  onBack: () => void;
};

type LearningPhase = 'human' | 'ai' | 'experiment' | 'summary';
type ImageSlot = 'A' | 'B';

type LearningRound = {
  scenario: AIWorldScenario;
  clearSlot: ImageSlot;
};

const phaseLabels = ['人类观察', 'AI转换', '清晰度实验', '学习结论'];
const aiPipeline = ['图片', '像素数据', '数字特征', '模型计算', '预测'];
let previousScenarioId: string | null = null;
let previousClearSlot: ImageSlot | null = null;

function createLearningRound(): LearningRound {
  const scenario = pickNextAIWorldScenario(previousScenarioId);
  previousScenarioId = scenario.id;
  const randomSlot: ImageSlot = Math.random() < 0.5 ? 'A' : 'B';
  const clearSlot =
    previousClearSlot && randomSlot === previousClearSlot
      ? randomSlot === 'A'
        ? 'B'
        : 'A'
      : randomSlot;
  previousClearSlot = clearSlot;
  return {scenario, clearSlot};
}

export function AIWorldUnderstandingScreen({
  onBack,
}: AIWorldUnderstandingScreenProps): React.JSX.Element {
  const {width, fontScale} = useWindowDimensions();
  const stackChoices = width < 430 || fontScale >= 1.5;
  const [round, setRound] = React.useState(createLearningRound);
  const [phase, setPhase] = React.useState<LearningPhase>('human');
  const [selectedFeatures, setSelectedFeatures] = React.useState<string[]>([]);
  const [aiRevealCount, setAIRevealCount] = React.useState(0);
  const [selectedImageSlot, setSelectedImageSlot] =
    React.useState<ImageSlot | null>(null);

  const phaseIndex = ['human', 'ai', 'experiment', 'summary'].indexOf(phase);
  const visibleClueCount = round.scenario.features.filter(
    item => item.isVisibleClue && selectedFeatures.includes(item.id),
  ).length;
  const hasDistractor = round.scenario.features.some(
    item => !item.isVisibleClue && selectedFeatures.includes(item.id),
  );
  const selectedCorrectImage = selectedImageSlot === round.clearSlot;

  const toggleFeature = (id: string): void => {
    setSelectedFeatures(current =>
      current.includes(id)
        ? current.filter(item => item !== id)
        : [...current, id],
    );
  };

  const advanceAI = (): void => {
    if (aiRevealCount < 4) {
      setAIRevealCount(current => current + 1);
      return;
    }
    setPhase('experiment');
  };

  const startAnotherRound = (): void => {
    setRound(createLearningRound());
    setPhase('human');
    setSelectedFeatures([]);
    setAIRevealCount(0);
    setSelectedImageSlot(null);
  };

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}>
      <Pressable
        accessibilityLabel="返回探索"
        accessibilityRole="button"
        onPress={onBack}
        style={styles.backButton}>
        <Text style={styles.backText}>‹ 返回探索</Text>
      </Pressable>

      <View style={styles.header}>
        <Text style={styles.eyebrow}>互动一 · 语文 + 科学 + 数学</Text>
        <Text style={styles.title}>AI如何理解世界？</Text>
        <Text style={styles.subtitle}>
          人会理解事物的意义，AI会把信息转成数据，再根据学到的规律进行预测。
        </Text>
      </View>

      <View
        accessibilityLabel={`学习进度，第${phaseIndex + 1}步，共4步`}
        style={styles.progressTrack}>
        {phaseLabels.map((label, index) => (
          <View key={label} style={styles.progressItem}>
            <View
              style={[
                styles.progressDot,
                index <= phaseIndex && styles.progressDotActive,
              ]}>
              <Text
                style={[
                  styles.progressNumber,
                  index <= phaseIndex && styles.progressNumberActive,
                ]}>
                {index + 1}
              </Text>
            </View>
            <Text
              numberOfLines={2}
              style={[
                styles.progressLabel,
                index === phaseIndex && styles.progressLabelActive,
              ]}>
              {label}
            </Text>
          </View>
        ))}
      </View>

      {phase === 'human' ? (
        <HumanUnderstandingPhase
          hasDistractor={hasDistractor}
          onContinue={() => setPhase('ai')}
          onToggleFeature={toggleFeature}
          scenario={round.scenario}
          selectedFeatures={selectedFeatures}
          visibleClueCount={visibleClueCount}
        />
      ) : null}

      {phase === 'ai' ? (
        <AIUnderstandingPhase
          onAdvance={advanceAI}
          revealCount={aiRevealCount}
          scenario={round.scenario}
          stackVisuals={stackChoices}
        />
      ) : null}

      {phase === 'experiment' ? (
        <ClarityExperimentPhase
          clearSlot={round.clearSlot}
          onContinue={() => setPhase('summary')}
          onSelect={setSelectedImageSlot}
          scenario={round.scenario}
          selectedCorrectImage={selectedCorrectImage}
          selectedSlot={selectedImageSlot}
          stackChoices={stackChoices}
        />
      ) : null}

      {phase === 'summary' ? (
        <LearningSummary
          onBack={onBack}
          onRestart={startAnotherRound}
          scenario={round.scenario}
        />
      ) : null}
    </ScrollView>
  );
}

function HumanUnderstandingPhase({
  scenario,
  selectedFeatures,
  visibleClueCount,
  hasDistractor,
  onToggleFeature,
  onContinue,
}: {
  scenario: AIWorldScenario;
  selectedFeatures: string[];
  visibleClueCount: number;
  hasDistractor: boolean;
  onToggleFeature: (id: string) => void;
  onContinue: () => void;
}): React.JSX.Element {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeading}>
        <Text style={styles.sectionStep}>第一阶段 · 人类理解</Text>
        <Text style={styles.sectionTitle}>
          你为什么知道这是{scenario.label}？
        </Text>
        <Text style={styles.instruction}>
          选择至少两个你从图片中观察到的线索。
        </Text>
      </View>

      <View style={styles.heroVisual}>
        <Image
          accessibilityLabel={`${scenario.label}的清晰插图`}
          resizeMode="contain"
          source={scenario.image}
          style={styles.heroImage}
        />
        <View style={styles.heroCaption}>
          <Text
            accessibilityLabel={`当前图片：${scenario.label}`}
            testID="scenario-name"
            style={styles.heroName}>
            {scenario.label}
          </Text>
          <Text style={styles.heroCategory}>{scenario.category}</Text>
        </View>
      </View>

      <View accessibilityRole="list" style={styles.featureList}>
        {scenario.features.map((feature, index) => {
          const selected = selectedFeatures.includes(feature.id);
          return (
            <Pressable
              accessibilityLabel={feature.label}
              accessibilityRole="checkbox"
              accessibilityState={{checked: selected}}
              key={feature.id}
              onPress={() => onToggleFeature(feature.id)}
              style={({pressed}) => [
                styles.featureOption,
                selected && styles.featureOptionSelected,
                selected && !feature.isVisibleClue && styles.featureOptionWrong,
                pressed && styles.pressed,
              ]}
              testID={`feature-option-${index}`}>
              <View
                style={[
                  styles.checkbox,
                  selected && styles.checkboxSelected,
                  selected && !feature.isVisibleClue && styles.checkboxWrong,
                ]}>
                <Text style={styles.checkboxMark}>{selected ? '✓' : ''}</Text>
              </View>
              <Text style={styles.featureLabel}>{feature.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <Text
        accessibilityLiveRegion="polite"
        style={[
          styles.feedbackLine,
          hasDistractor && styles.feedbackLineWrong,
        ]}>
        {hasDistractor
          ? '有一条线索不在图片里，再观察一次。'
          : visibleClueCount >= 2
          ? `你找到了${visibleClueCount}条有效特征，人会把这些线索和已有经验联系起来。`
          : '继续观察形状、部件和位置。'}
      </Text>

      <GameButton
        disabled={visibleClueCount < 2}
        label={`看看AI眼中的${scenario.label}`}
        onPress={onContinue}
        testID="human-next"
      />
    </View>
  );
}

function AIUnderstandingPhase({
  scenario,
  revealCount,
  stackVisuals,
  onAdvance,
}: {
  scenario: AIWorldScenario;
  revealCount: number;
  stackVisuals: boolean;
  onAdvance: () => void;
}): React.JSX.Element {
  const buttonLabels = [
    '把图片转成像素',
    '提取数字特征',
    '让模型寻找规律',
    '查看预测结果',
    '进入清晰度实验',
  ];

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeading}>
        <Text style={styles.sectionStep}>第二阶段 · AI理解</Text>
        <Text style={styles.sectionTitle}>
          AI先看到数据，不是“{scenario.label}”这个词
        </Text>
        <Text style={styles.instruction}>
          逐步转换图片，观察每一步发生了什么。
        </Text>
      </View>

      <View
        style={[
          styles.transformVisuals,
          stackVisuals && styles.transformVisualsStacked,
        ]}>
        <View style={styles.transformPanel}>
          <Text style={styles.visualLabel}>
            {revealCount === 0 ? '输入图片' : '原始信息'}
          </Text>
          <Image
            accessibilityLabel={`${scenario.label}的输入图片`}
            resizeMode="contain"
            source={scenario.image}
            style={styles.transformImage}
          />
        </View>
        {revealCount >= 1 ? (
          <View style={styles.transformPanel}>
            <Text style={styles.visualLabel}>像素数据示意</Text>
            <PixelGrid colors={scenario.pixelPalette} label={scenario.label} />
          </View>
        ) : null}
      </View>

      <View style={styles.pipeline}>
        {aiPipeline.slice(0, revealCount + 1).map((label, index) => (
          <View key={label} style={styles.pipelineRow}>
            <View style={styles.pipelineNumber}>
              <Text style={styles.pipelineNumberText}>{index + 1}</Text>
            </View>
            <View style={styles.pipelineCopy}>
              <Text style={styles.pipelineLabel}>{label}</Text>
              <Text style={styles.pipelineDescription}>
                {getPipelineDescription(index, scenario)}
              </Text>
            </View>
          </View>
        ))}
      </View>

      {revealCount >= 2 ? (
        <View style={styles.signalBand}>
          <Text style={styles.signalTitle}>提取到的数字特征（教学示意）</Text>
          {scenario.signals.map(signal => (
            <View key={signal.label} style={styles.signalRow}>
              <Text style={styles.signalLabel}>{signal.label}</Text>
              <View style={styles.signalTrack}>
                <View
                  style={[styles.signalFill, {width: `${signal.strength}%`}]}
                />
              </View>
              <Text style={styles.signalValue}>{signal.strength}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {revealCount >= 4 ? (
        <View accessibilityLiveRegion="polite" style={styles.predictionBand}>
          <Text style={styles.predictionCaption}>本地教学模拟结果</Text>
          <Text style={styles.predictionValue}>
            {scenario.label} · {scenario.confidence}%
          </Text>
          <Text style={styles.predictionNotice}>
            概率表示模型的预测把握，不代表它真正理解了{scenario.label}。
          </Text>
        </View>
      ) : null}

      <GameButton
        label={buttonLabels[revealCount]}
        onPress={onAdvance}
        testID="ai-next"
      />
    </View>
  );
}

function PixelGrid({
  colors: palette,
  label,
}: {
  colors: string[];
  label: string;
}): React.JSX.Element {
  return (
    <View
      accessibilityLabel={`${label}被转换成彩色像素方格的示意图`}
      importantForAccessibility="yes"
      style={styles.pixelGrid}>
      {Array.from({length: 64}, (_, index) => (
        <View
          key={index}
          style={[
            styles.pixelCell,
            {
              backgroundColor:
                palette[(index * 3 + Math.floor(index / 8)) % palette.length],
            },
          ]}
        />
      ))}
    </View>
  );
}

function ClarityExperimentPhase({
  scenario,
  clearSlot,
  selectedSlot,
  selectedCorrectImage,
  stackChoices,
  onSelect,
  onContinue,
}: {
  scenario: AIWorldScenario;
  clearSlot: ImageSlot;
  selectedSlot: ImageSlot | null;
  selectedCorrectImage: boolean;
  stackChoices: boolean;
  onSelect: (slot: ImageSlot) => void;
  onContinue: () => void;
}): React.JSX.Element {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeading}>
        <Text style={styles.sectionStep}>第三阶段 · 互动实验</Text>
        <Text style={styles.sectionTitle}>哪一张图片更容易被AI识别？</Text>
        <Text style={styles.instruction}>
          清晰图的位置每次都会变化，请根据图片本身判断。
        </Text>
      </View>

      <View
        style={[
          styles.imageChoices,
          stackChoices && styles.imageChoicesStacked,
        ]}>
        {(['A', 'B'] as ImageSlot[]).map(slot => {
          const isClear = slot === clearSlot;
          const selected = selectedSlot === slot;
          return (
            <Pressable
              accessibilityLabel={`图片${slot}，${isClear ? '清晰' : '模糊'}的${
                scenario.label
              }`}
              accessibilityRole="button"
              accessibilityState={{selected}}
              key={slot}
              onPress={() => onSelect(slot)}
              style={({pressed}) => [
                styles.imageChoice,
                selected && styles.imageChoiceSelected,
                pressed && styles.pressed,
              ]}
              testID={`image-choice-${isClear ? 'clear' : 'blurred'}`}>
              <View style={styles.choiceLabelRow}>
                <Text style={styles.choiceLabel}>图片 {slot}</Text>
                {selected ? (
                  <Text style={styles.selectedMark}>已选择</Text>
                ) : null}
              </View>
              <Image
                blurRadius={isClear ? 0 : 10}
                resizeMode="contain"
                source={scenario.image}
                style={styles.choiceImage}
              />
            </Pressable>
          );
        })}
      </View>

      {selectedSlot ? (
        <View
          accessibilityLiveRegion="polite"
          style={[
            styles.experimentFeedback,
            selectedCorrectImage
              ? styles.experimentFeedbackCorrect
              : styles.experimentFeedbackTryAgain,
          ]}>
          <Text style={styles.experimentFeedbackTitle}>
            {selectedCorrectImage ? '判断正确' : '再比较一下细节'}
          </Text>
          <Text style={styles.experimentFeedbackText}>
            清晰图片包含更多可区分的边缘、形状和位置特征。
            {scenario.blurExplanation}
          </Text>
          <View style={styles.confidenceComparison}>
            <Text style={styles.confidenceText}>
              清晰图：模拟 {scenario.confidence}%
            </Text>
            <Text style={styles.confidenceText}>
              模糊图：模拟 {scenario.blurredConfidence}%
            </Text>
          </View>
        </View>
      ) : null}

      <GameButton
        disabled={!selectedSlot}
        label="查看学习结论"
        onPress={onContinue}
        testID="experiment-next"
      />
    </View>
  );
}

function LearningSummary({
  scenario,
  onRestart,
  onBack,
}: {
  scenario: AIWorldScenario;
  onRestart: () => void;
  onBack: () => void;
}): React.JSX.Element {
  const flow = [
    {label: '信息', detail: `${scenario.label}图片`},
    {label: '数据', detail: '像素和数字特征'},
    {label: '规律', detail: '模型学到的关联'},
    {label: '预测', detail: `${scenario.label} · ${scenario.confidence}%`},
  ];

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeading}>
        <Text style={styles.sectionStep}>第四阶段 · 学习结论</Text>
        <Text style={styles.sectionTitle}>AI认识世界的方法</Text>
      </View>

      <View style={styles.summaryFlow}>
        {flow.map((item, index) => (
          <React.Fragment key={item.label}>
            <View style={styles.summaryStep}>
              <Text style={styles.summaryLabel}>{item.label}</Text>
              <Text style={styles.summaryDetail}>{item.detail}</Text>
            </View>
            {index < flow.length - 1 ? (
              <Text aria-hidden style={styles.summaryArrow}>
                ↓
              </Text>
            ) : null}
          </React.Fragment>
        ))}
      </View>

      <View style={styles.takeawayBand}>
        <Text style={styles.takeawayTitle}>最重要的发现</Text>
        <Text style={styles.takeawayText}>
          AI不是像人一样“看懂、听懂、想懂”，而是把信息转成数据，通过规律进行预测。图片越清晰，通常越容易保留有效特征；但高概率也不等于一定正确。
        </Text>
      </View>

      <View style={styles.subjectConnections}>
        <Text style={styles.connection}>
          <Text style={styles.connectionStrong}>语文：</Text>
          用准确的词说出判断理由
        </Text>
        <Text style={styles.connection}>
          <Text style={styles.connectionStrong}>科学：</Text>
          观察清晰度怎样改变有效特征
        </Text>
        <Text style={styles.connection}>
          <Text style={styles.connectionStrong}>数学：</Text>
          用概率表示预测的不确定性
        </Text>
      </View>

      <GameButton label="换一张图片再实验" onPress={onRestart} />
      <GameButton label="完成并返回探索" onPress={onBack} variant="secondary" />
    </View>
  );
}

function getPipelineDescription(
  index: number,
  scenario: AIWorldScenario,
): string {
  const descriptions = [
    `接收一张${scenario.label}图片`,
    '记录每个小格子的颜色数值',
    '比较边缘、形状、颜色和位置',
    '把这些数字与学过的样本规律比较',
    `给出“${scenario.label}”和一个概率`,
  ];
  return descriptions[index];
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
    paddingVertical: spacing.md,
    paddingBottom: spacing.xl,
  },
  pressed: {opacity: 0.78},
  backButton: {
    alignSelf: 'flex-start',
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  backText: {
    color: colors.brand,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '700',
  },
  header: {gap: spacing.xs},
  eyebrow: {color: '#B64D47', fontSize: 13, lineHeight: 20, fontWeight: '800'},
  title: {color: colors.text, fontSize: 28, lineHeight: 36, fontWeight: '800'},
  subtitle: {color: colors.mutedText, fontSize: 15, lineHeight: 23},
  progressTrack: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
  progressItem: {flex: 1, minWidth: 0, alignItems: 'center', gap: spacing.xs},
  progressDot: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  progressDotActive: {borderColor: '#D95F59', backgroundColor: '#D95F59'},
  progressNumber: {
    color: colors.mutedText,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '800',
  },
  progressNumberActive: {color: colors.surface},
  progressLabel: {
    color: colors.mutedText,
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'center',
  },
  progressLabelActive: {color: colors.text, fontWeight: '700'},
  section: {gap: spacing.md},
  sectionHeading: {gap: spacing.xs},
  sectionStep: {
    color: '#B64D47',
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '800',
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 22,
    lineHeight: 30,
    fontWeight: '800',
  },
  instruction: {color: colors.mutedText, fontSize: 14, lineHeight: 21},
  heroVisual: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#FFF9F5',
  },
  heroImage: {width: '52%', maxWidth: 240, minWidth: 156, aspectRatio: 1},
  heroCaption: {alignItems: 'center', gap: 2},
  heroName: {
    color: colors.text,
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '800',
  },
  heroCategory: {color: colors.mutedText, fontSize: 13, lineHeight: 20},
  featureList: {gap: spacing.sm},
  featureOption: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
  },
  featureOptionSelected: {
    borderColor: colors.brand,
    backgroundColor: '#EDF8F8',
  },
  featureOptionWrong: {borderColor: '#CC6B58', backgroundColor: '#FFF1EC'},
  checkbox: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#9AA9B1',
    borderRadius: 4,
    backgroundColor: colors.surface,
  },
  checkboxSelected: {borderColor: colors.brand, backgroundColor: colors.brand},
  checkboxWrong: {borderColor: '#B64D47', backgroundColor: '#B64D47'},
  checkboxMark: {
    color: colors.surface,
    fontSize: 15,
    lineHeight: 19,
    fontWeight: '800',
  },
  featureLabel: {
    flex: 1,
    minWidth: 0,
    color: colors.text,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '600',
  },
  feedbackLine: {
    color: colors.success,
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '700',
  },
  feedbackLineWrong: {color: '#A44235'},
  transformVisuals: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: spacing.md,
  },
  transformVisualsStacked: {flexDirection: 'column'},
  transformPanel: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
  },
  visualLabel: {
    alignSelf: 'flex-start',
    color: colors.mutedText,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '700',
  },
  transformImage: {width: '100%', maxWidth: 220, aspectRatio: 1},
  pixelGrid: {
    width: '100%',
    maxWidth: 220,
    aspectRatio: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    overflow: 'hidden',
    borderRadius: 4,
  },
  pixelCell: {width: '12.5%', height: '12.5%'},
  pipeline: {gap: spacing.sm, paddingVertical: spacing.sm},
  pipelineRow: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  pipelineNumber: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: '#D95F59',
  },
  pipelineNumberText: {
    color: colors.surface,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '800',
  },
  pipelineCopy: {flex: 1, minWidth: 0},
  pipelineLabel: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '800',
  },
  pipelineDescription: {color: colors.mutedText, fontSize: 13, lineHeight: 20},
  signalBand: {
    gap: spacing.sm,
    padding: spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.brand,
    backgroundColor: '#F1F8F8',
  },
  signalTitle: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '800',
  },
  signalRow: {flexDirection: 'row', alignItems: 'center', gap: spacing.sm},
  signalLabel: {
    width: 76,
    color: colors.mutedText,
    fontSize: 12,
    lineHeight: 18,
  },
  signalTrack: {
    flex: 1,
    minWidth: 40,
    height: 8,
    overflow: 'hidden',
    borderRadius: 4,
    backgroundColor: '#D6E6E7',
  },
  signalFill: {height: '100%', borderRadius: 4, backgroundColor: colors.brand},
  signalValue: {
    width: 24,
    color: colors.text,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '700',
    textAlign: 'right',
  },
  predictionBand: {
    gap: spacing.xs,
    padding: spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.success,
    backgroundColor: '#EEF8F2',
  },
  predictionCaption: {
    color: colors.success,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '800',
  },
  predictionValue: {
    color: colors.text,
    fontSize: 23,
    lineHeight: 31,
    fontWeight: '800',
  },
  predictionNotice: {color: colors.mutedText, fontSize: 13, lineHeight: 20},
  imageChoices: {flexDirection: 'row', alignItems: 'stretch', gap: spacing.md},
  imageChoicesStacked: {flexDirection: 'column'},
  imageChoice: {
    flex: 1,
    minWidth: 0,
    gap: spacing.sm,
    padding: spacing.md,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
  },
  imageChoiceSelected: {borderColor: colors.brand, backgroundColor: '#F2FAFA'},
  choiceLabelRow: {
    minHeight: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  choiceLabel: {
    color: colors.text,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '800',
  },
  selectedMark: {
    color: colors.brand,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '700',
  },
  choiceImage: {width: '100%', minHeight: 132, aspectRatio: 1},
  experimentFeedback: {
    gap: spacing.sm,
    padding: spacing.md,
    borderLeftWidth: 4,
  },
  experimentFeedbackCorrect: {
    borderLeftColor: colors.success,
    backgroundColor: '#EEF8F2',
  },
  experimentFeedbackTryAgain: {
    borderLeftColor: '#D28A26',
    backgroundColor: '#FFF7E8',
  },
  experimentFeedbackTitle: {
    color: colors.text,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '800',
  },
  experimentFeedbackText: {
    color: colors.mutedText,
    fontSize: 14,
    lineHeight: 22,
  },
  confidenceComparison: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  confidenceText: {
    color: colors.text,
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '700',
  },
  summaryFlow: {alignItems: 'stretch', gap: spacing.xs},
  summaryStep: {
    gap: 2,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: '#D95F59',
    backgroundColor: '#FFF6F3',
  },
  summaryLabel: {
    color: '#B64D47',
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '800',
  },
  summaryDetail: {color: colors.text, fontSize: 14, lineHeight: 21},
  summaryArrow: {
    color: colors.mutedText,
    fontSize: 22,
    lineHeight: 26,
    fontWeight: '800',
    textAlign: 'center',
  },
  takeawayBand: {
    gap: spacing.sm,
    padding: spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.sun,
    backgroundColor: '#FFF8E8',
  },
  takeawayTitle: {
    color: colors.text,
    fontSize: 17,
    lineHeight: 24,
    fontWeight: '800',
  },
  takeawayText: {color: colors.text, fontSize: 14, lineHeight: 22},
  subjectConnections: {gap: spacing.sm, paddingVertical: spacing.sm},
  connection: {color: colors.mutedText, fontSize: 14, lineHeight: 22},
  connectionStrong: {color: colors.text, fontWeight: '800'},
});
