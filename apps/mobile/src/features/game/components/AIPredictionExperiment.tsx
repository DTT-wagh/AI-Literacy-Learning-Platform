import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';

import {colors, radius, spacing} from '../../../shared/theme/tokens';
import type {GamePredictionExperiment} from '../types/game';

export type AIPredictionStage = 'data' | 'pattern' | 'choice' | 'analysis';

type AIPredictionExperimentProps = {
  experiment: GamePredictionExperiment;
  stage: AIPredictionStage;
  selectedOptionId: string | null;
  onSelectOption: (optionId: string) => void;
};

export function AIPredictionExperiment({
  experiment,
  stage,
  selectedOptionId,
  onSelectOption,
}: AIPredictionExperimentProps): React.JSX.Element {
  const selectedOption = experiment.options.find(option => option.id === selectedOptionId);
  const totalCount = experiment.records.reduce((sum, record) => sum + record.count, 0);
  const orderedRecords = [...experiment.records].sort((left, right) => right.count - left.count);
  const relatedRecords = orderedRecords.slice(0, 2);
  const relatedCount = relatedRecords.reduce((sum, record) => sum + record.count, 0);
  const calculatedScore = totalCount > 0 ? Math.round((relatedCount / totalCount) * 100) : 0;
  const activeProcessIndex = {data: 0, pattern: 2, choice: 3, analysis: 4}[stage];
  const process = [
    {label: '数据输入', detail: `${totalCount} 条学习记录`},
    {label: '发现规律', detail: '比较哪些特征共同突出'},
    {label: '数学计算', detail: `${relatedCount} ÷ ${totalCount} ≈ ${calculatedScore}%`},
    {label: '概率预测', detail: stage === 'analysis' ? '比较候选的可能性' : '先由学生完成预测'},
    {label: '输出判断', detail: experiment.prediction.result.label},
  ];

  const dataPanel = (
    <View style={styles.dataPanel}>
      <Text style={styles.panelTitle}>{experiment.feature.title}</Text>
      <Text style={styles.panelDescription}>{experiment.feature.description}</Text>
      <View style={styles.records}>
        {experiment.records.map(record => (
          <View key={record.id} style={styles.recordRow}>
            <Text style={styles.recordLabel}>{record.label}</Text>
            <View style={styles.track}>
              <View style={[styles.fill, {width: `${barWidth(record.count, experiment.feature.maxCount)}%`}]} />
            </View>
            <Text style={styles.recordCount}>{record.count} {experiment.feature.unit}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  const calculationPanel = (
    <View style={styles.calculationPanel}>
      <Text style={styles.calculationTitle}>AI怎样把规律变成数字</Text>
      <CalculationRow label="相关特征" value={`${relatedRecords.map(record => record.count).join(' + ')} = ${relatedCount}`} />
      <CalculationRow label="全部记录" value={`${orderedRecords.map(record => record.count).join(' + ')} = ${totalCount}`} />
      <CalculationRow label="特征占比" value={`${relatedCount} ÷ ${totalCount} ≈ ${calculatedScore}%`} strong />
      <Text style={styles.explanation}>{experiment.prediction.relation.explanation}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.processPanel}>
        <Text style={styles.processTitle}>AI处理路径</Text>
        <View style={styles.processList}>
          {process.map((item, index) => {
            const active = index === activeProcessIndex;
            const available = index <= activeProcessIndex;
            return (
              <View key={item.label} style={styles.processRow}>
                <View style={[styles.processIndex, available && styles.processIndexAvailable, active && styles.processIndexActive]}>
                  <Text style={[styles.processIndexText, available && styles.processIndexTextAvailable, active && styles.processIndexTextActive]}>{index + 1}</Text>
                </View>
                <View style={styles.processCopy}>
                  <Text style={[styles.processLabel, active && styles.processLabelActive]}>{item.label}</Text>
                  <Text style={styles.processDetail}>{available ? item.detail : '等待前一步完成'}</Text>
                </View>
              </View>
            );
          })}
        </View>
      </View>

      {stage === 'data' ? (
        <>
          {dataPanel}
          <View style={styles.guidancePanel}>
            <Text style={styles.guidanceTitle}>先分清“数据”和“答案”</Text>
            <Text style={styles.guidanceText}>这些次数只是输入。AI还要比较特征并进行数学计算，才能形成预测。</Text>
          </View>
        </>
      ) : null}

      {stage === 'pattern' ? (
        <View style={styles.analysis}>
          <View style={styles.relationPanel}>
            <Text style={styles.relationLabel}>{experiment.prediction.relation.label}</Text>
            <Text style={styles.relationHint}>AI不是在理解兴趣，而是在比较数字特征之间的关系。</Text>
          </View>
          {calculationPanel}
        </View>
      ) : null}

      {stage === 'choice' ? (
        <View style={styles.choiceStage}>
          {dataPanel}
          <Text style={styles.choicePrompt}>根据数据和刚才的计算，选出概率最高的候选：</Text>
        <View style={styles.options}>
          {experiment.options.map(option => {
            const selected = option.id === selectedOptionId;
            return (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{selected}}
                key={option.id}
                onPress={() => onSelectOption(option.id)}
                style={[styles.option, selected && styles.optionSelected]}
                testID={`prediction-option-${option.id}`}>
                <Text style={[styles.optionText, selected && styles.optionTextSelected]}>{option.label}</Text>
              </Pressable>
            );
          })}
        </View>
        </View>
      ) : null}

      {stage === 'analysis' ? (
        <View style={styles.analysis}>
          {selectedOption ? (
            <View style={styles.selectionPanel}>
              <Text style={styles.selectionTitle}>你的预测</Text>
              <Text style={styles.selectionText}>{selectedOption.label}</Text>
            </View>
          ) : null}
          {calculationPanel}
          <View style={styles.resultPanel}>
            <Text style={styles.resultTitle}>{experiment.prediction.result.title}</Text>
            <Text style={styles.resultLabel}>{experiment.prediction.result.label}</Text>
            <Text style={styles.explanation}>{experiment.prediction.result.explanation}</Text>
          </View>
          <View style={styles.takeawayPanel}>
            <Text style={styles.takeawayTitle}>{experiment.prediction.takeaway.title}</Text>
            <Text style={styles.takeawayText}>{experiment.prediction.takeaway.text}</Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}

function CalculationRow({label, value, strong = false}: {label: string; value: string; strong?: boolean}): React.JSX.Element {
  return (
    <View style={styles.calculationRow}>
      <Text style={styles.calculationLabel}>{label}</Text>
      <Text style={[styles.calculationValue, strong && styles.calculationValueStrong]}>{value}</Text>
    </View>
  );
}

function barWidth(count: number, maxCount: number): number {
  if (maxCount <= 0) return 0;
  return Math.min(100, Math.max(0, (count / maxCount) * 100));
}

const styles = StyleSheet.create({
  container: {gap: spacing.md},
  processPanel: {gap: spacing.sm},
  processTitle: {color: colors.text, fontSize: 16, lineHeight: 23, fontWeight: '800'},
  processList: {gap: spacing.xs},
  processRow: {minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: spacing.sm},
  processIndex: {width: 28, height: 28, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border, borderRadius: 14, backgroundColor: colors.surface},
  processIndexAvailable: {borderColor: '#91C9CE', backgroundColor: '#E9F7F8'},
  processIndexActive: {borderColor: colors.brand, backgroundColor: colors.brand},
  processIndexText: {color: colors.mutedText, fontSize: 13, lineHeight: 18, fontWeight: '800'},
  processIndexTextAvailable: {color: colors.brand},
  processIndexTextActive: {color: colors.surface},
  processCopy: {flex: 1, minWidth: 0},
  processLabel: {color: colors.mutedText, fontSize: 14, lineHeight: 20, fontWeight: '700'},
  processLabelActive: {color: colors.brand},
  processDetail: {color: colors.mutedText, fontSize: 12, lineHeight: 18},
  dataPanel: {gap: spacing.sm, padding: spacing.md, borderWidth: 1, borderColor: '#B9DDE1', borderRadius: radius.md, backgroundColor: '#F5FBFC'},
  panelTitle: {color: colors.text, fontSize: 17, lineHeight: 24, fontWeight: '800'},
  panelDescription: {color: colors.mutedText, fontSize: 14, lineHeight: 21},
  records: {gap: spacing.sm},
  recordRow: {minHeight: 30, flexDirection: 'row', alignItems: 'center', gap: spacing.sm},
  recordLabel: {width: 52, color: colors.text, fontSize: 13, lineHeight: 20, fontWeight: '700'},
  track: {flex: 1, height: 12, overflow: 'hidden', borderRadius: radius.sm, backgroundColor: '#DDECEF'},
  fill: {height: '100%', borderRadius: radius.sm, backgroundColor: colors.brand},
  recordCount: {width: 42, color: colors.mutedText, fontSize: 12, lineHeight: 18, textAlign: 'right'},
  guidancePanel: {gap: spacing.xs, padding: spacing.md, borderLeftWidth: 4, borderLeftColor: colors.brand, backgroundColor: '#EEF8F9'},
  guidanceTitle: {color: colors.text, fontSize: 15, lineHeight: 22, fontWeight: '800'},
  guidanceText: {color: colors.mutedText, fontSize: 14, lineHeight: 21},
  choiceStage: {gap: spacing.md},
  choicePrompt: {color: colors.text, fontSize: 15, lineHeight: 22, fontWeight: '700'},
  options: {gap: spacing.sm},
  option: {minHeight: 48, justifyContent: 'center', paddingHorizontal: spacing.md, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, backgroundColor: colors.surface},
  optionSelected: {borderColor: colors.brand, backgroundColor: '#E5F7F8'},
  optionText: {color: colors.text, fontSize: 15, lineHeight: 22, fontWeight: '600'},
  optionTextSelected: {color: colors.brand},
  analysis: {gap: spacing.sm},
  selectionPanel: {gap: spacing.xs, padding: spacing.md, borderRadius: radius.md, backgroundColor: '#F3F7F9'},
  selectionTitle: {color: colors.mutedText, fontSize: 12, lineHeight: 18, fontWeight: '700'},
  selectionText: {color: colors.text, fontSize: 15, lineHeight: 22, fontWeight: '700'},
  relationPanel: {gap: spacing.xs, padding: spacing.md, borderWidth: 1, borderColor: '#F0D28A', borderRadius: radius.md, backgroundColor: '#FFF8E8'},
  relationLabel: {color: '#8A5B00', fontSize: 16, lineHeight: 23, fontWeight: '800'},
  relationHint: {color: colors.mutedText, fontSize: 14, lineHeight: 21},
  calculationPanel: {gap: spacing.sm, padding: spacing.md, borderWidth: 1, borderColor: '#B9DDE1', borderRadius: radius.md, backgroundColor: '#F5FBFC'},
  calculationTitle: {color: colors.text, fontSize: 16, lineHeight: 23, fontWeight: '800'},
  calculationRow: {flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, paddingBottom: spacing.xs, borderBottomWidth: 1, borderBottomColor: '#DDECEF'},
  calculationLabel: {width: 72, color: colors.mutedText, fontSize: 13, lineHeight: 20},
  calculationValue: {flex: 1, minWidth: 0, color: colors.text, fontSize: 14, lineHeight: 21, fontWeight: '700'},
  calculationValueStrong: {color: colors.brand, fontSize: 18, lineHeight: 25, fontWeight: '800'},
  resultPanel: {gap: spacing.xs, padding: spacing.md, borderWidth: 1, borderColor: '#9ACCC4', borderRadius: radius.md, backgroundColor: '#F0FAF6'},
  resultTitle: {color: colors.success, fontSize: 13, lineHeight: 20, fontWeight: '800'},
  resultLabel: {color: colors.text, fontSize: 20, lineHeight: 28, fontWeight: '800'},
  explanation: {color: colors.mutedText, fontSize: 14, lineHeight: 21},
  takeawayPanel: {gap: spacing.xs, padding: spacing.md, borderRadius: radius.md, backgroundColor: '#EEF8F9'},
  takeawayTitle: {color: colors.brand, fontSize: 15, lineHeight: 22, fontWeight: '800'},
  takeawayText: {color: colors.text, fontSize: 15, lineHeight: 23},
});
