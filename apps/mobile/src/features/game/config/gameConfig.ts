import languageContextTaskConfig from './language.context.v1.json';
import languageTasksConfig from './language.tasks.json';
import tasksConfig from './tasks.json';
import type {GameTask} from '../types/game';

export const gameTasks = [
  languageContextTaskConfig as GameTask,
  ...(languageTasksConfig as GameTask[]),
  ...(tasksConfig as GameTask[]),
];
