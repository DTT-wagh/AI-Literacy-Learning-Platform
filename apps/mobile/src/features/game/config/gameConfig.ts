import tasksConfig from './tasks.json';
import type {GameTask} from '../types/game';

// V1 language subtasks stay on disk only for local progress migration.
// The live Language Island is driven by language.games.v2.json.
export const gameTasks = tasksConfig as GameTask[];
