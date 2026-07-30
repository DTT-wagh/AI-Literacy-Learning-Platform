import languageGamesConfig from './language.games.v2.json';
import type {LanguageGame, LanguageGameId} from '../types/language';

export const languageGames = languageGamesConfig as LanguageGame[];

export const languageGameIds: LanguageGameId[] = [
  'language-label-training',
  'language-context-reasoning',
  'language-truth-editor',
];

export function getLanguageGame(gameId: LanguageGameId): LanguageGame {
  const game = languageGames.find(item => item.id === gameId);
  if (!game) throw new Error('Unknown language game: ' + gameId);
  return game;
}

export function isLanguageGameConfig(value: unknown): value is LanguageGame[] {
  return Array.isArray(value)
    && value.length === 3
    && value.every(game => {
      const candidate = game as Partial<LanguageGame>;
      return typeof candidate.id === 'string'
        && candidate.version === 2
        && typeof candidate.title === 'string'
        && candidate.offline === true
        && Array.isArray(candidate.legacyTaskIds)
        && Array.isArray(candidate.stages)
        && candidate.stages.length >= 7
        && candidate.content !== undefined;
    });
}
