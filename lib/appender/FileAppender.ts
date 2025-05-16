import type {ILogEvent, LogLevel} from '../definitions.js';
import {access, appendFile, constants, stat} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {isPresent} from '../definitions.js';
import {AbstractBaseAppender} from './AbstractBaseAppender.js';

/**
 * Calc the full log file path from the given parameters.
 *
 * @internal
 * @param {string} filePath
 * @param {string} baseName
 * @param {string} extension
 * @param {string} timeStamp
 * @return {Promise<string | null>}
 */
export async function calcFullFilePath(
  filePath: string,
  baseName: string,
  extension: string,
  timeStamp: string,
): Promise<string | null> {
  try {
    if (!isPresent(filePath) || filePath === '') {
      console.error('FileAppender is not configured properly: filePath not given');
      return null;
    }
    if (!await canBeAccessed(filePath)) {
      console.error(
        `FileAppender is not configured properly: filePath '${filePath}' does not exists or is not accessible.`,
        'For security reasons, the file path is not created automatically.',
      );
      return null;
    }
    if (!isPresent(baseName)) {
      console.error('FileAppender is not configured properly: baseName must not be null or undefined');
      return null;
    }
    if (!baseName && !timeStamp) {
      console.error('FileAppender is not configured properly: either baseName or timeStamp must not be empty');
      return null;
    }
    if (!extension) {
      console.error('FileAppender is not configured properly: extension must not be empty');
      return null;
    }
    let fileName: string;
    if (baseName && timeStamp) {
      fileName = `${baseName}-${timeStamp}`;
    } else {
      fileName = baseName || timeStamp;
    }
    const fullFilePath = path.join(filePath, `${fileName}.${extension}`);
    if (await exists(fullFilePath)) {
      if (!await canBeAccessed(fullFilePath)) {
        console.error(`FileAppender is not configured properly: path '${fullFilePath}' can not be accessed.`);
        return null;
      }
      const stats = await stat(fullFilePath);
      if (stats.isDirectory()) {
        console.error(`FileAppender is not configured properly: path '${fullFilePath}' is a directory.`);
        return null;
      }
    }
    return fullFilePath;
  } catch (err) {
    console.error(`Error in calcFullFilePath('${filePath}', '${baseName}', '${extension}', '${timeStamp}'):`, err);
  }
  return null;
}

/**
 * Check if a path can be accessed, is readable and writable.
 *
 * @internal
 * @param {string} path
 * @return {Promise<boolean>}
 */
export async function canBeAccessed(path: string): Promise<boolean> {
  try {
    await access(path, constants.F_OK | constants.R_OK | constants.W_OK);
    return true;
  } catch (err) {
    if (err.code !== 'ENOENT') {
      console.error(`Error accessing path '${path}'`, err);
    }
  }
  return false;
}

/**
 * Check if a path exists.
 *
 * @internal
 * @param {string} path
 * @return {Promise<boolean>}
 */
export async function exists(path: string): Promise<boolean> {
  try {
    await access(path, constants.F_OK);
    return true;
  } catch (err) {
    if (err.code !== 'ENOENT') {
      console.error(`Error accessing path '${path}'`, err);
    }
  }
  return false;
}

export class FileAppender extends AbstractBaseAppender {
  baseName: string = '';
  colored: boolean = false;
  extension: string = 'log';
  filePath: string = path.join(os.tmpdir(), 'bit.log');
  pretty: boolean = false;
  private logQueue = Promise.resolve();

  constructor(level?: LogLevel) {
    super();
    if (isPresent(level)) {
      this.level = level;
    }
  }

  /**
   * Calculate the timestamp for the file name as YYYY-DD-MM from the current system datetime.
   *
   * @return {string}
   */
  getTimestamp(date: Date): string {
    return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate()
      .toString()
      .padStart(2, '0')}`;
  }

  async handle(event: ILogEvent): Promise<void> {
    if (!this.willHandle(event)) {
      return;
    }
    const currentWrite = this.logQueue.then(() => this.writeToFile(event));

    this.logQueue = currentWrite.catch((err) => {
      console.error('Error writing LogEvent to file:', err);
    });

    return currentWrite;
  }

  async writeToFile(event: ILogEvent): Promise<void> {
    const fullFilePath =
      await calcFullFilePath(this.filePath, this.baseName, this.extension, this.getTimestamp(event.timestamp));
    if (!isPresent(fullFilePath)) {
      return;
    }
    try {
      const output = [this.formatPrefix(event, this.colored)];
      if (typeof event.payload === 'function') {
        output.push(event.payload());
      } else {
        output.push(...event.payload.map((elem) => {
          return this.formatAny(elem, this.pretty, this.colored);
        }));
      }
      await appendFile(fullFilePath, `${output.join(' ')}\n`);
    } catch (err) {
      console.error('Error during FileAppender.handle', err);
    }
  }
}
