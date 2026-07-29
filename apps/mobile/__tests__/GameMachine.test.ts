import {createActor} from 'xstate';

import modulesConfig from '../src/features/game/config/modules.json';
import {gameTasks} from '../src/features/game/config/gameConfig';
import {calculateLearningScore} from '../src/features/game/evaluation';
import {gameMachine} from '../src/features/game/machine/gameMachine';
import type {GameModule, GameTask} from '../src/features/game/types/game';

const modules = modulesConfig as GameModule[];
const tasks = gameTasks as GameTask[];

test('provides at least one JSON task for every game module', () => {
  expect(modules).toHaveLength(4);

  modules.forEach(module => {
    expect(tasks.some(task => task.module === module.id)).toBe(true);
  });
});

test('provides the reviewed language island path and capstone', () => {
  const languageTasks = tasks.filter(task => task.module === 'language');

  expect(languageTasks.map(task => task.levelId)).toEqual(expect.arrayContaining(['L1', 'L2', 'L3', 'L4', 'CAPSTONE']));
  expect(languageTasks).toHaveLength(9);
  expect(languageTasks.find(task => task.id === 'language.context.v1')?.steps.map(step => step.type)).toContain('uncertainty');
  expect(languageTasks.find(task => task.id === 'language.factcheck.v1')?.steps.find(step => step.type === 'sourceEvidence')?.sourceCards).toHaveLength(3);
});

test('configures the language context game as the reviewed nine-step flow', () => {
  const task = tasks.find(item => item.id === 'language.context.v1');

  expect(task?.title).toBe('语境侦探：你可真行');
  expect(task?.steps).toHaveLength(9);
  expect(task?.steps.map(step => step.type)).toEqual([
    'intro',
    'initialChoice',
    'evidence',
    'aiResult',
    'counterexample',
    'aiCorrection',
    'uncertainty',
    'review',
    'reward',
  ]);
  expect(task?.steps[3].aiResult).toMatchObject({result: '更像称赞', confidence: 'medium'});
  expect(task?.steps[3].aiInput).toBe('你可真行');
  expect(task?.steps[5].aiResult).toMatchObject({result: '更像称赞', confidence: 'low'});
});

test('awards learning points for evidence and AI-result checking actions', () => {
  expect(calculateLearningScore({studentAnswer: 'praise', selectedEvidenceIds: [], aiCorrectionReason: null, finalAnswer: 'blame'})).toBe(0);
  expect(calculateLearningScore({studentAnswer: 'praise', selectedEvidenceIds: ['tone'], aiCorrectionReason: null, finalAnswer: 'blame'})).toBe(10);
  expect(calculateLearningScore({studentAnswer: 'praise', selectedEvidenceIds: ['tone'], aiCorrectionReason: 'missing-context', finalAnswer: 'blame'})).toBe(20);
});

test('moves through a configured task with the game state machine', async () => {
  const task = tasks[0];
  const actor = createActor(gameMachine).start();

  expect(actor.getSnapshot().value).toBe('idle');
  actor.send({type: 'START', task});
  expect(actor.getSnapshot().value).toBe('loading');

  await new Promise(resolve => setTimeout(resolve, 250));
  expect(actor.getSnapshot().value).toBe('playing');
  expect(actor.getSnapshot().context.currentStepIndex).toBe(0);

  actor.send({type: 'NEXT'});
  actor.send({type: 'ANSWER', answer: 'praise'});
  expect(actor.getSnapshot().context.studentAnswer).toBe('praise');

  actor.send({type: 'NEXT'});
  actor.send({type: 'TOGGLE_EVIDENCE', evidenceId: 'tone'});
  expect(actor.getSnapshot().context.selectedEvidenceIds).toEqual(['tone']);

  actor.send({type: 'NEXT'});
  actor.send({type: 'NEXT'});
  actor.send({type: 'ANSWER', answer: 'blame'});
  expect(actor.getSnapshot().context.finalAnswer).toBe('blame');

  actor.send({type: 'NEXT'});
  actor.send({type: 'ANSWER', answer: 'missing-context'});
  expect(actor.getSnapshot().context.aiCorrectionReason).toBe('missing-context');

  expect(calculateLearningScore(actor.getSnapshot().context)).toBe(20);

  actor.send({type: 'NEXT'});
  actor.send({type: 'ANSWER', answer: 'uncertain'});
  expect(actor.getSnapshot().context.answer).toBe('uncertain');

  actor.send({type: 'NEXT'});
  actor.send({type: 'NEXT'});
  actor.send({type: 'NEXT'});
  expect(actor.getSnapshot().value).toBe('completed');

  actor.send({type: 'RESET'});
  expect(actor.getSnapshot().value).toBe('idle');
  expect(actor.getSnapshot().context.task).toBeNull();

  actor.stop();
});
