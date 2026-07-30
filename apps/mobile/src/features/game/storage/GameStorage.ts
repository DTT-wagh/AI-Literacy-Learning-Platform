import {createMMKV} from 'react-native-mmkv';

export type GameKeyValueStorage = {
  getString: (key: string) => string | undefined;
  getNumber: (key: string) => number | undefined;
  set: (key: string, value: string | number | boolean) => void;
  remove: (key: string) => boolean;
};

export class MemoryGameStorage implements GameKeyValueStorage {
  private readonly values = new Map<string, string | number | boolean>();

  getString(key: string): string | undefined {
    const value = this.values.get(key);
    return typeof value === 'string' ? value : undefined;
  }

  getNumber(key: string): number | undefined {
    const value = this.values.get(key);
    return typeof value === 'number' ? value : undefined;
  }

  set(key: string, value: string | number | boolean): void {
    this.values.set(key, value);
  }

  remove(key: string): boolean {
    return this.values.delete(key);
  }
}

function createDefaultStorage(): GameKeyValueStorage {
  try {
    return createMMKV({id: 'witjoy.game.offline'});
  } catch {
    return new MemoryGameStorage();
  }
}

export const gameStorage = createDefaultStorage();
