import {access, appendFile, chmod, constants, mkdir, readdir, rm, stat} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {type ILogEvent, LogLevel} from '../../definitions.js';
import {exists, FileAppender} from '../FileAppender.js';

export async function emptyDirectory(dirPath: string): Promise<boolean> {
  try {
    await access(dirPath, constants.F_OK | constants.R_OK | constants.W_OK);
  } catch {
    return false;
  }
  try {
    const files = await readdir(dirPath);
    await Promise.all(
      files.map(async (file) => {
        const childPath = path.join(dirPath, file);
        await rm(childPath, {recursive: true});
      }),
    );
    return true;
  } catch (err) {
    console.error('Error in emptyDirectory', err);
  }
  return false;
}

export function getDefaultEvent(date: string = '2024-04-01'): ILogEvent {
  return {
    level: LogLevel.INFO,
    loggerName: 'foo.bar',
    payload: ['Hallo', 'Welt'],
    timestamp: new Date(`${date}T12:30:45.678`),
  };
}

describe('test FileAppender', async () => {
  const logDir = path.join(os.tmpdir(), 'bit.log');
  let appender: FileAppender;

  beforeEach(async () => {
    await mkdir(logDir, {recursive: true});
    appender = new FileAppender();
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    vi.resetAllMocks();
    vi.resetModules();
    await emptyDirectory(logDir);
  });

  it('check default properties', () => {
    expect(appender).not.toBeNull();
    expect(appender.level).toBeUndefined();
    expect(appender.baseName).toBe('');
    expect(appender.extension).toBe('log');
    expect(appender.filePath).toBe(logDir);
  });

  it('constructor with log level', () => {
    appender = new FileAppender(LogLevel.INFO);
    expect(appender.level).toBe(LogLevel.INFO);
  });

  it('should create a logfile and add the logging', async () => {
    const date = '2024-05-01';
    const event = getDefaultEvent(date);
    expect(appender.willHandle(event)).toBe(true);
    await appender.handle(event);
    const expectedFile = path.join(logDir, `${date}.log`);
    const stats = await stat(expectedFile);
    expect(stats.isFile()).toBe(true);
    expect(stats.size).toBe(71);
  });

  it('should work with an existing log file', async () => {
    const date = '2024-05-02';
    const existingFile = path.join(logDir, `${date}.log`);
    await appendFile(existingFile, 'It\'s already there\n');
    await appender.handle(getDefaultEvent(date));
    const stats = await stat(existingFile);
    expect(stats.isFile()).toBe(true);
    expect(stats.size).toBe(90);
  });

  it('should check if it can write to the file', async () => {
    const date = '2024-05-03';
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const existingFile = path.join(logDir, `${date}.log`);
    await appendFile(existingFile, 'It\'s already there\n');
    await chmod(existingFile, 0o444);
    await appender.handle(getDefaultEvent(date));
    const stats = await stat(existingFile);
    expect(stats.isFile()).toBe(true);
    expect(stats.size).toBe(19);
    expect(consoleErrorSpy)
      .toHaveBeenCalledWith(`FileAppender is not configured properly: path '${existingFile}' can not be accessed.`);
  });

  it('should check if the full log file path is a directory', async () => {
    const date = '2024-05-04';
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const existingDirectory = path.join(logDir, `${date}.log`);
    await mkdir(existingDirectory, {recursive: true});
    await appender.handle(getDefaultEvent(date));
    expect(consoleErrorSpy)
      .toHaveBeenCalledWith(`FileAppender is not configured properly: path '${existingDirectory}' is a directory.`);
  });

  it('should check if filePath is properly configured', async () => {
    const date = '2024-05-05';
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    // @ts-expect-error we force bad usage
    appender.filePath = null;
    await appender.handle(getDefaultEvent(date));
    expect(consoleErrorSpy).toHaveBeenCalledWith('FileAppender is not configured properly: filePath not given');
  });

  it('should check if filePath is available', async () => {
    const date = '2024-05-06';
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    appender.filePath = '/foo/bar/bi/ba/butzel/mann';
    await appender.handle(getDefaultEvent(date));
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      // eslint-disable-next-line style/max-len
      'FileAppender is not configured properly: filePath \'/foo/bar/bi/ba/butzel/mann\' does not exists or is not accessible.',
      'For security reasons, the file path is not created automatically.',
    );
  });

  it('should check if baseName is properly configured', async () => {
    const date = '2024-05-07';
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    // @ts-expect-error we force bad usage
    appender.baseName = null;
    await appender.handle(getDefaultEvent(date));
    expect(consoleErrorSpy)
      .toHaveBeenCalledWith('FileAppender is not configured properly: baseName must not be null or undefined');
  });

  it('should check if either baseName or timeStamp is not empty', async () => {
    const date = '2024-05-08';
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    appender.getTimestamp = (_date: Date) => {
      return '';
    };
    await appender.handle(getDefaultEvent(date));
    expect(consoleErrorSpy)
      .toHaveBeenCalledWith('FileAppender is not configured properly: either baseName or timeStamp must not be empty');
  });

  it('should check if extension is not empty', async () => {
    const date = '2024-05-09';
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    appender.extension = '';
    await appender.handle(getDefaultEvent(date));
    expect(consoleErrorSpy)
      .toHaveBeenCalledWith('FileAppender is not configured properly: extension must not be empty');
  });

  it('should combine baseName and timeStamp correctly', async () => {
    const date = '2024-05-10';
    appender.baseName = 'test';
    await appender.handle(getDefaultEvent(date));
    const expectedFile = path.join(logDir, `test-${date}.log`);
    const stats = await stat(expectedFile);
    expect(stats.isFile()).toBe(true);
    expect(stats.size).toBe(71);
  });

  it('test global error handling in calcFullFilePath', async () => {
    const date = '2024-05-11';
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(path, 'join').mockImplementation(() => {
      throw new Error('Test error in path.join');
    });
    await appender.handle(getDefaultEvent(date));
    expect(consoleErrorSpy)
      .toHaveBeenCalledWith(
        `Error in calcFullFilePath('${logDir}', '', 'log', '${date}'):`,
        new Error('Test error in path.join'),
      );
    const files = await readdir(logDir);
    expect(files.length).toBe(0);
  });

  it('test exists', async () => {
    expect(await exists(path.join(logDir))).toBe(true);
  });

  it('should not handle the log event if level does not fit', async () => {
    const date = '2024-05-12';
    appender = new FileAppender(LogLevel.INFO);
    const event = getDefaultEvent(date);
    event.level = LogLevel.DEBUG;
    await appender.handle(event);
    const expectedFile = path.join(logDir, `${date}.log`);
    expect(await exists(expectedFile)).toBe(false);
  });

  it('should build the log info correctly when using a function', async () => {
    const date = '2024-05-13';
    const event = getDefaultEvent(date);
    event.payload = () => {
      return 'Hallo functional Welt';
    };
    await appender.handle(event);
    const expectedFile = path.join(logDir, `${date}.log`);
    const stats = await stat(expectedFile);
    expect(stats.isFile()).toBe(true);
    expect(stats.size).toBe(82);
  });

  it('test error handling in handle', async () => {
    const date = '2024-05-14';
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    appender.formatPrefix = (_ts, _lvl, _name, _colored) => {
      throw new Error('This is a test error');
    };
    await appender.handle(getDefaultEvent(date));
    expect(consoleErrorSpy)
      .toHaveBeenCalledWith('Error during FileAppender.handle', new Error('This is a test error'));
  });

  it('test multiple handles with different date and coloring', async () => {
    appender.pretty = true;
    appender.colored = true;
    await appender.handle({
      level: LogLevel.INFO,
      loggerName: 'foo.bar',
      payload: ['Hallo Welt:', 100, false, {
        k1: true,
        k2: 'text',
        k3: 123456789,
      }],
      timestamp: new Date('2024-05-09T17:59:59.333'),
    });
    try {
      // noinspection ExceptionCaughtLocallyJS
      throw new Error('This is a test error');
    } catch (err) {
      await appender.handle({
        level: LogLevel.ERROR,
        loggerName: 'foo.bar',
        payload: ['Error somewhere in your code:', err],
        timestamp: new Date('2024-05-09T17:59:59.444'),
      });
    }
    await appender.handle({
      level: LogLevel.INFO,
      loggerName: 'foo.bar',
      payload: ['Hallo', 'Welt'],
      timestamp: new Date('2024-05-08T12:30:45.678'),
    });
    const expectedFile = path.join(logDir, '2024-05-08.log');
    const stats = await stat(expectedFile);
    expect(stats.isFile()).toBe(true);
    expect(stats.size).toBe(79);
  });
});
