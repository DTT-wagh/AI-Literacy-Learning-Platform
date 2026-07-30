import {createActor} from 'xstate';

import {gameTasks} from '../src/features/game/config/gameConfig';
import {gameMachine} from '../src/features/game/machine/gameMachine';
import {GameEventSyncService, type GameSyncApi, type SyncNetwork} from '../src/features/game/services/GameEventSyncService';
import {EventQueue} from '../src/features/game/storage/EventQueue';
import {GameProgressStorage, type StoredGameProgress} from '../src/features/game/storage/GameProgressStorage';
import {MemoryGameStorage} from '../src/features/game/storage/GameStorage';
import {OfflineTaskManager} from '../src/features/game/storage/OfflineTaskManager';
import {LanguageProgressStorage} from '../src/features/game/storage/LanguageProgressStorage';
import {migrateLegacyLanguageProgress} from '../src/features/game/storage/languageProgressMigration';

const userId = 42;

function completedProgress(): StoredGameProgress {
  return {
    taskId: 'math.prediction.v1',
    currentStep: 3,
    answers: {
      current: 'missing-context',
      student: 'praise',
      aiCorrectionReason: 'missing-context',
      final: 'blame',
    },
    selectedEvidence: ['tone'],
    completed: true,
    updatedAt: '2026-07-29T10:00:00.000Z',
  };
}

test('keeps a completed task and its event offline, then removes the event after sync', async () => {
  const storage = new MemoryGameStorage();
  const progressStorage = new GameProgressStorage(storage);
  const queue = new EventQueue(storage);
  let online = false;
  const uploaded: string[] = [];
  const network: SyncNetwork = {
    isOnline: async () => online,
    subscribe: () => () => {},
  };
  const api: GameSyncApi = {
    createSession: async () => 101,
    uploadEvents: async (_sessionId, events) => {
      uploaded.push(...events.map(event => event.eventId));
    },
  };
  const syncService = new GameEventSyncService(queue, storage, network, api);

  progressStorage.save(userId, completedProgress());
  const completion = queue.createEvent(userId, {
    taskId: 'math.prediction.v1',
    stepId: 'step8',
    eventType: 'TASK_COMPLETED',
    outcomeCode: 'COMPLETED',
  });
  queue.enqueue(userId, completion);

  await expect(syncService.sync(userId)).resolves.toEqual({synced: 0, remaining: 1});
  expect(progressStorage.load(userId, completion.taskId)?.completed).toBe(true);
  expect(queue.getAll(userId)).toHaveLength(1);

  online = true;
  await expect(syncService.sync(userId)).resolves.toEqual({synced: 1, remaining: 0});
  expect(uploaded).toEqual([completion.eventId]);
  expect(queue.getAll(userId)).toHaveLength(0);
});

test('keeps failed uploads and does not enqueue the same event ID twice', async () => {
  const storage = new MemoryGameStorage();
  const queue = new EventQueue(storage);
  const event = queue.createEvent(userId, {
    taskId: 'math.prediction.v1',
    stepId: 'step3',
    eventType: 'EVIDENCE_SELECTED',
    outcomeCode: 'TONE_SELECTED',
  });
  queue.enqueue(userId, event);
  queue.enqueue(userId, event);

  const service = new GameEventSyncService(
    queue,
    storage,
    {isOnline: async () => true, subscribe: () => () => {}},
    {createSession: async () => 102, uploadEvents: async () => { throw new Error('offline again'); }},
  );

  expect(queue.getAll(userId)).toHaveLength(1);
  await expect(service.sync(userId)).resolves.toEqual({synced: 0, remaining: 1});
  expect(queue.getAll(userId)).toEqual([event]);
});

test('reuses an unfinished remote session and rotates it only after task completion', async () => {
  const storage = new MemoryGameStorage();
  const queue = new EventQueue(storage);
  let createdSessions = 0;
  const uploadedSessions: number[] = [];
  const service = new GameEventSyncService(
    queue,
    storage,
    {isOnline: async () => true, subscribe: () => () => {}},
    {
      createSession: async () => 200 + ++createdSessions,
      uploadEvents: async (sessionId) => { uploadedSessions.push(sessionId); },
    },
  );

  queue.enqueue(userId, queue.createEvent(userId, {
    taskId: 'language.context.v1', stepId: 'step1', eventType: 'STEP_COMPLETED', outcomeCode: 'CONTINUED',
  }));
  await service.sync(userId);
  queue.enqueue(userId, queue.createEvent(userId, {
    taskId: 'language.context.v1', stepId: 'step8', eventType: 'TASK_COMPLETED', outcomeCode: 'COMPLETED',
  }));
  await service.sync(userId);
  queue.enqueue(userId, queue.createEvent(userId, {
    taskId: 'language.context.v1', stepId: 'step1', eventType: 'STEP_COMPLETED', outcomeCode: 'CONTINUED',
  }));
  await service.sync(userId);

  expect(createdSessions).toBe(2);
  expect(uploadedSessions).toEqual([201, 201, 202]);
});

test('restores persisted answers and completion through the XState machine', () => {
  const task = gameTasks.find(item => item.id === 'math.prediction.v1');
  expect(task).toBeDefined();
  const actor = createActor(gameMachine).start();

  actor.send({type: 'RESTORE', task: task!, progress: completedProgress()});

  expect(actor.getSnapshot().value).toBe('completed');
  expect(actor.getSnapshot().context.currentStepIndex).toBe(3);
  expect(actor.getSnapshot().context.studentAnswer).toBe('praise');
  expect(actor.getSnapshot().context.selectedEvidenceIds).toEqual(['tone']);
  expect(actor.getSnapshot().context.aiCorrectionReason).toBe('missing-context');
  actor.stop();
});

test('migrates old language subtasks once without overwriting a new V2 game progress record', () => {
  const storage = new MemoryGameStorage();
  const legacy = new GameProgressStorage(storage);
  const target = new LanguageProgressStorage(storage);
  const oldTasks = [
    'language.labels.v1', 'language.labels.samples.v1',
    'language.context.v1', 'language.context.clues.v1', 'language.context.tone.v1', 'language.context.uncertainty.v1',
    'language.story.intent.v1', 'language.story.revision.v1', 'language.story.candidates.v1',
    'language.factcheck.v1', 'language.factcheck.sources.v1', 'language.factcheck.publish.v1',
  ];

  oldTasks.forEach(taskId => legacy.save(userId, {
    taskId,
    currentStep: 3,
    answers: {current: null, student: null, aiCorrectionReason: null, final: null},
    selectedEvidence: [],
    completed: true,
    updatedAt: '2026-07-29T10:00:00.000Z',
  }));

  const created = migrateLegacyLanguageProgress(userId, legacy, target);
  expect(created).toHaveLength(3);
  expect(created.every(item => item.completed)).toBe(true);
  expect(created.find(item => item.gameId === 'language-label-training')?.completed).toBe(true);
  expect(created.find(item => item.gameId === 'language-story-director')).toBeUndefined();
  expect(target.load(userId, 'language-label-training')?.completed).toBe(true);

  expect(migrateLegacyLanguageProgress(userId, legacy, target)).toEqual([]);
});

test('uses bundled or cached tasks without calling the downloader while offline', async () => {
  const storage = new MemoryGameStorage();
  const downloader = jest.fn(async () => gameTasks[0]);
  const manager = new OfflineTaskManager(storage, async () => false, downloader);

  const tasks = await manager.refreshTasks();

  expect(tasks).toHaveLength(gameTasks.length);
  expect(tasks.map(task => task.id)).toEqual(gameTasks.map(task => task.id));
  expect(downloader).not.toHaveBeenCalled();
});
