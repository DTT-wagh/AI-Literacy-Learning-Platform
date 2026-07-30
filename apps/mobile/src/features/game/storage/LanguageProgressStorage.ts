import {LANGUAGE_GAME_CONTRACT_VERSION} from '../../../../../../packages/contracts/language-games';
import {gameStorage, type GameKeyValueStorage} from './GameStorage';
import type {LanguageGameId, LanguageGameSnapshot} from '../types/language';

const PREFIX = 'language.game.progress.';
const INDEX_PREFIX = 'language.game.progress.index.';

export class LanguageProgressStorage {
  constructor(private readonly storage: GameKeyValueStorage = gameStorage) {}

  save(userId: number, snapshot: LanguageGameSnapshot): void {
    this.storage.set(this.key(userId, snapshot.gameId), JSON.stringify({
      ...snapshot,
      contractVersion: LANGUAGE_GAME_CONTRACT_VERSION,
    }));
    const ids = new Set(this.readIndex(userId));
    ids.add(snapshot.gameId);
    this.storage.set(this.indexKey(userId), JSON.stringify([...ids]));
  }

  load(userId: number, gameId: LanguageGameId): LanguageGameSnapshot | null {
    const serialized = this.storage.getString(this.key(userId, gameId));
    if (!serialized) return null;
    try {
      const value = JSON.parse(serialized) as Partial<LanguageGameSnapshot> & {contractVersion?: number};
      if (value.contractVersion !== LANGUAGE_GAME_CONTRACT_VERSION || value.gameId !== gameId) return null;
      return isLanguageSnapshot(value) ? value : null;
    } catch {
      this.storage.remove(this.key(userId, gameId));
      return null;
    }
  }

  list(userId: number): LanguageGameSnapshot[] {
    return this.readIndex(userId)
      .map(gameId => this.load(userId, gameId))
      .filter((value): value is LanguageGameSnapshot => value !== null);
  }

  has(userId: number, gameId: LanguageGameId): boolean {
    return this.load(userId, gameId) !== null;
  }

  private readIndex(userId: number): LanguageGameId[] {
    const serialized = this.storage.getString(this.indexKey(userId));
    if (!serialized) return [];
    try {
      const parsed = JSON.parse(serialized) as unknown;
      return Array.isArray(parsed)
        ? parsed.filter(isLanguageGameId)
        : [];
    } catch {
      this.storage.remove(this.indexKey(userId));
      return [];
    }
  }

  private key(userId: number, gameId: LanguageGameId): string {
    return PREFIX + userId + '.' + gameId;
  }

  private indexKey(userId: number): string {
    return INDEX_PREFIX + userId;
  }
}

function isLanguageGameId(value: unknown): value is LanguageGameId {
  return value === 'language-label-training'
    || value === 'language-context-reasoning'
    || value === 'language-story-director'
    || value === 'language-truth-editor';
}

function isLanguageSnapshot(value: Partial<LanguageGameSnapshot>): value is LanguageGameSnapshot {
  return isLanguageGameId(value.gameId)
    && typeof value.stageIndex === 'number'
    && typeof value.stageId === 'string'
    && typeof value.completed === 'boolean'
    && Boolean(value.data)
    && Array.isArray(value.evidence)
    && typeof value.updatedAt === 'string';
}

export const languageProgressStorage = new LanguageProgressStorage();
