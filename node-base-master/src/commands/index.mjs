import films from './films.mjs'
import { Command } from '../command.mjs';

/**
 * Object made for routing purposes
 */
const commands = {
  films,
}

export const route = (path) => {
  const startIndex = path.startsWith('/') ? 1 : 0
  const arrayPath = path.split('/').slice(startIndex);
  let command = commands;
  for (const step of arrayPath) {
    command = command[step];
  }
  if (!(command instanceof Command)) throw new Error('wrong path');
  return command;
}
