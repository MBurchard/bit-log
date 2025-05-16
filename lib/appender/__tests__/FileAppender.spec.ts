import type {TestContext} from 'vitest';
import type {ILogEvent, Nullable} from '../../definitions.js';
import crypto from 'node:crypto';
import {access, appendFile, chmod, constants, mkdir, readdir, readFile, rm, stat} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {exists, FileAppender} from '../FileAppender.js';

export interface CustomTestContext extends TestContext {
  logDir: string;
}

export function genLogDirName(testName: Nullable<string>): string {
  if (!testName) {
    return `${process.hrtime.bigint()}`;
  }
  return `${process.hrtime.bigint()}${crypto.createHash('md5').update(testName).digest('hex')}`;
}

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
    level: 'INFO',
    loggerName: 'foo.bar',
    payload: ['Hallo', 'Welt'],
    timestamp: new Date(`${date}T12:30:45.678`),
  };
}

describe('test FileAppender', async () => {
  let appender: FileAppender;

  beforeEach(async (ctx: CustomTestContext) => {
    ctx.logDir = path.join(os.tmpdir(), 'bit.log', genLogDirName(ctx.task.name));
    await mkdir(ctx.logDir, {recursive: true});
    appender = new FileAppender();
    appender.filePath = ctx.logDir;
  });

  afterEach(async (ctx: CustomTestContext) => {
    vi.restoreAllMocks();
    vi.resetAllMocks();
    vi.resetModules();
    if (ctx.logDir) {
      await emptyDirectory(ctx.logDir);
    }
  });

  it('check default properties', (ctx: CustomTestContext) => {
    console.warn('Log Directory:', ctx.logDir);
    expect(appender).not.toBeNull();
    expect(appender.level).toBeUndefined();
    expect(appender.baseName).toBe('');
    expect(appender.extension).toBe('log');
    expect(appender.filePath).toBe(ctx.logDir);
  });

  it('constructor with log level', () => {
    appender = new FileAppender('INFO');
    expect(appender.level).toBe('INFO');
  });

  it('should create a logfile and add the logging', async (ctx: CustomTestContext) => {
    const date = '2024-05-01';
    const event = getDefaultEvent(date);
    expect(appender.willHandle(event)).toBe(true);
    await appender.handle(event);
    const expectedFile = path.join(ctx.logDir, `${date}.log`);
    const stats = await stat(expectedFile);
    expect(stats.isFile()).toBe(true);
    expect(stats.size).toBe(71);
  });

  it('should work with an existing log file', async (ctx: CustomTestContext) => {
    const date = '2024-05-02';
    const existingFile = path.join(ctx.logDir, `${date}.log`);
    await appendFile(existingFile, 'It\'s already there\n');
    await appender.handle(getDefaultEvent(date));
    const stats = await stat(existingFile);
    expect(stats.isFile()).toBe(true);
    expect(stats.size).toBe(90);
  });

  it('should check if it can write to the file', async (ctx: CustomTestContext) => {
    const date = '2024-05-03';
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const existingFile = path.join(ctx.logDir, `${date}.log`);

    await appendFile(existingFile, 'It\'s already there\n');
    await chmod(existingFile, 0o444);

    await appender.handle(getDefaultEvent(date));
    const stats = await stat(existingFile);
    expect(stats.isFile()).toBe(true);

    const isRoot = process.geteuid ? (process.geteuid() === 0) : false;

    if (!isRoot) {
      expect(stats.size).toBe(19);
      expect(consoleErrorSpy)
        .toHaveBeenCalledWith(`FileAppender is not configured properly: path '${existingFile}' can not be accessed.`);
    } else {
      console.warn('Test is running as root, skipping test for write access');
    }
  });

  it('should check if the full log file path is a directory', async (ctx: CustomTestContext) => {
    const date = '2024-05-04';
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const existingDirectory = path.join(ctx.logDir, `${date}.log`);
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

  it('should combine baseName and timeStamp correctly', async (ctx: CustomTestContext) => {
    const date = '2024-05-10';
    appender.baseName = 'test';
    await appender.handle(getDefaultEvent(date));
    const expectedFile = path.join(ctx.logDir, `test-${date}.log`);
    const stats = await stat(expectedFile);
    expect(stats.isFile()).toBe(true);
    expect(stats.size).toBe(71);
  });

  it('test global error handling in calcFullFilePath', async (ctx: CustomTestContext) => {
    const date = '2024-05-11';
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(path, 'join').mockImplementation(() => {
      throw new Error('Test error in path.join');
    });
    await appender.handle(getDefaultEvent(date));
    expect(consoleErrorSpy)
      .toHaveBeenCalledWith(
        `Error in calcFullFilePath('${ctx.logDir}', '', 'log', '${date}'):`,
        new Error('Test error in path.join'),
      );
    const files = await readdir(ctx.logDir);
    expect(files.length).toBe(0);
  });

  it('test exists', async (ctx: CustomTestContext) => {
    expect(await exists(path.join(ctx.logDir))).toBe(true);
  });

  it('should not handle the log event if level does not fit', async (ctx: CustomTestContext) => {
    const date = '2024-05-12';
    appender = new FileAppender('INFO');
    const event = getDefaultEvent(date);
    event.level = 'DEBUG';
    await appender.handle(event);
    const expectedFile = path.join(ctx.logDir, `${date}.log`);
    expect(await exists(expectedFile)).toBe(false);
  });

  it('should build the log info correctly when using a function', async (ctx: CustomTestContext) => {
    const date = '2024-05-13';
    const event = getDefaultEvent(date);
    event.payload = () => {
      return 'Hallo functional Welt';
    };
    await appender.handle(event);
    const expectedFile = path.join(ctx.logDir, `${date}.log`);
    const stats = await stat(expectedFile);
    expect(stats.isFile()).toBe(true);
    expect(stats.size).toBe(82);
  });

  it('test error handling in handle', async () => {
    const date = '2024-05-14';
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    appender.formatPrefix = (_event, _colored) => {
      throw new Error('This is a test error');
    };
    await appender.handle(getDefaultEvent(date));
    expect(consoleErrorSpy)
      .toHaveBeenCalledWith('Error during FileAppender.handle', new Error('This is a test error'));
  });

  it('test multiple handles with different date and coloring', async (ctx: CustomTestContext) => {
    appender.pretty = true;
    appender.colored = true;
    await appender.handle({
      level: 'INFO',
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
        level: 'ERROR',
        loggerName: 'foo.bar',
        payload: ['Error somewhere in your code:', err],
        timestamp: new Date('2024-05-09T17:59:59.444'),
      });
    }
    await appender.handle({
      level: 'INFO',
      loggerName: 'foo.bar',
      payload: ['Hallo', 'Welt'],
      timestamp: new Date('2024-05-08T12:30:45.678'),
    });
    const expectedFile = path.join(ctx.logDir, '2024-05-08.log');
    const stats = await stat(expectedFile);
    expect(stats.isFile()).toBe(true);
    expect(stats.size).toBe(79);
  });

  it('should handle multiple log events under load and preserve order', async (ctx: CustomTestContext) => {
    const date = '2024-06-01';
    const numEvents = 10000;
    const events: ILogEvent[] = [];

    for (let i = 0; i < numEvents; i++) {
      events.push({
        level: 'INFO',
        loggerName: 'load.test',
        payload: [`Event ${i}`],
        timestamp: new Date(`${date}T12:30:45.678`),
      });
    }

    await Promise.all(events.map(event => appender.handle(event)));

    const logFile = path.join(ctx.logDir, `${date}.log`);
    const content = await readFile(logFile, 'utf-8');
    const lines = content.split('\n').filter(line => line.trim() !== '');

    expect(lines.length).toBe(numEvents);

    for (let i = 0; i < numEvents; i++) {
      expect(lines[i]).toContain(`Event ${i}`);
    }
  }, 10000);

  it('should call console.error when writeToFile rejects (logQueue catch block)', async () => {
    const simulatedError = new Error('Simulated failure');
    appender.writeToFile = vi.fn(() => Promise.reject(simulatedError));
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const dummyEvent = getDefaultEvent('2024-06-15');

    await expect(appender.handle(dummyEvent)).rejects.toThrow(simulatedError);
    expect(consoleSpy).toHaveBeenCalledWith('Error writing LogEvent to file:', simulatedError);
  });
});
