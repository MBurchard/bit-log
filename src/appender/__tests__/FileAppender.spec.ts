import fs from 'node:fs';
import {access, appendFile, chmod, constants, mkdir, readdir, rm, stat} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {type ILogEvent, LogLevel} from '../../definitions.js';
import {FileAppender, canBeAccessed, exists} from '../FileAppender.js';

async function emptyDirectory(dirPath: string): Promise<boolean> {
  try {
    await access(dirPath, constants.F_OK | constants.R_OK | constants.W_OK);
  } catch (err) {
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

function getDefaultEvent(): ILogEvent {
  return {
    level: LogLevel.INFO,
    loggerName: 'foo.bar',
    payload: ['Hallo', 'Welt'],
    timestamp: new Date('2024-05-08T12:30:45.678'),
  };
}

describe('test FileAppender', () => {
  const logDir = path.join(os.tmpdir(), 'bit.log');
  let appender: FileAppender;

  beforeEach(async () => {
    // create the logDir for test
    await mkdir(logDir, {recursive: true});
    // create the existing logDir for test
    await emptyDirectory(logDir);
    appender = new FileAppender();
  });

  afterEach(() => {
    jest.restoreAllMocks(); // Wiederherstellen aller Mocks nach jedem Test
  });

  it('check default properties', () => {
    expect(appender).not.toBeNull();
    expect(appender.level).toBeUndefined();
    expect(appender.baseName).toBe('');
    expect(appender.extension).toBe('log');
    expect(appender.filePath).toBe(path.join(os.tmpdir(), 'bit.log'));
  });

  it('constructor with log level', () => {
    appender = new FileAppender(LogLevel.INFO);
    expect(appender.level).toBe(LogLevel.INFO);
  });

  it('should create a logfile and add the logging', async () => {
    const event = getDefaultEvent();
    expect(appender.willHandle(event)).toBe(true);
    await appender.handle(event);
    const expectedFile = path.join(logDir, '2024-05-08.log');
    const stats = await stat(expectedFile);
    expect(stats.isFile()).toBe(true);
    expect(stats.size).toBe(71);
  });

  it('should work with an existing log file', async () => {
    const existingFile = path.join(logDir, '2024-05-08.log');
    await appendFile(existingFile, 'It\'s already there\n');
    await appender.handle(getDefaultEvent());
    const stats = await stat(existingFile);
    expect(stats.isFile()).toBe(true);
    expect(stats.size).toBe(90);
  });

  it('should check if it can write to the file', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const existingFile = path.join(logDir, '2024-05-08.log');
    await appendFile(existingFile, 'It\'s already there\n');
    await chmod(existingFile, 0o444);
    await appender.handle(getDefaultEvent());
    const stats = await stat(existingFile);
    expect(stats.isFile()).toBe(true);
    expect(stats.size).toBe(19);
    expect(consoleErrorSpy)
      .toHaveBeenCalledWith(`FileAppender is not configured properly: path '${existingFile}' can not be accessed.`);
  });

  it('should check if the full log file path is a directory', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const existingDirectory = path.join(logDir, '2024-05-08.log');
    await mkdir(existingDirectory, {recursive: true});
    await appender.handle(getDefaultEvent());
    expect(consoleErrorSpy)
      .toHaveBeenCalledWith(`FileAppender is not configured properly: path '${existingDirectory}' is a directory.`);
  });

  it('should check if filePath is properly configured', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    // @ts-expect-error we force bad usage
    appender.filePath = null;
    await appender.handle(getDefaultEvent());
    expect(consoleErrorSpy).toHaveBeenCalledWith('FileAppender is not configured properly: filePath not given');
  });

  it('should check if filePath is available', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    appender.filePath = '/foo/bar/bi/ba/butzel/mann';
    await appender.handle(getDefaultEvent());
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      // eslint-disable-next-line style/max-len
      'FileAppender is not configured properly: filePath \'/foo/bar/bi/ba/butzel/mann\' does not exists or is not accessible.',
      'For security reasons, the file path is not created automatically.',
    );
  });

  it('should check if baseName is properly configured', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    // @ts-expect-error we force bad usage
    appender.baseName = null;
    await appender.handle(getDefaultEvent());
    expect(consoleErrorSpy)
      .toHaveBeenCalledWith('FileAppender is not configured properly: baseName must not be null or undefined');
  });

  it('should check if either baseName or timeStamp is not empty', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    appender.getTimestamp = (_date: Date) => {
      return '';
    };
    await appender.handle(getDefaultEvent());
    expect(consoleErrorSpy)
      .toHaveBeenCalledWith('FileAppender is not configured properly: either baseName or timeStamp must not be empty');
  });

  it('should check if extension is not empty', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    appender.extension = '';
    await appender.handle(getDefaultEvent());
    expect(consoleErrorSpy)
      .toHaveBeenCalledWith('FileAppender is not configured properly: extension must not be empty');
  });

  it('should combine baseName and timeStamp correctly', async () => {
    appender.baseName = 'test';
    await appender.handle(getDefaultEvent());
    const expectedFile = path.join(logDir, 'test-2024-05-08.log');
    const stats = await stat(expectedFile);
    expect(stats.isFile()).toBe(true);
    expect(stats.size).toBe(71);
  });

  it('test global error handling in calcFullFilePath', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(path, 'join').mockImplementation(() => {
      throw new Error('Test error in path.join');
    });
    await appender.handle(getDefaultEvent());
    expect(consoleErrorSpy)
      .toHaveBeenCalledWith(
        `Error in calcFullFilePath('${logDir}', '', 'log', '2024-05-08'):`,
        new Error('Test error in path.join'),
      );
    const files = await readdir(logDir);
    expect(files.length).toBe(0);
  });

  it('test error handling in canBeAccessed', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(fs.promises, 'access').mockImplementation(async () => {
      // eslint-disable-next-line no-throw-literal
      throw {code: 'EACCESS', message: 'Test error in access'};
    });
    await canBeAccessed(path.join(logDir));
    expect(consoleErrorSpy)
      .toHaveBeenCalledWith(
        `Error accessing path '${logDir}'`,
        {code: 'EACCESS', message: 'Test error in access'},
      );
  });

  it('test exists', async () => {
    expect(await exists(path.join(logDir))).toBe(true);
  });

  it('test error handling in exists', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(fs.promises, 'access').mockImplementation(async () => {
      // eslint-disable-next-line no-throw-literal
      throw {code: 'EEXISTS', message: 'Test error in exists'};
    });
    await exists(path.join(logDir));
    expect(consoleErrorSpy)
      .toHaveBeenCalledWith(
        `Error accessing path '${logDir}'`,
        {code: 'EEXISTS', message: 'Test error in exists'},
      );
  });

  it('should not handle the log event if level does not fit', async () => {
    appender = new FileAppender(LogLevel.INFO);
    const event = getDefaultEvent();
    event.level = LogLevel.DEBUG;
    await appender.handle(event);
    const expectedFile = path.join(logDir, '2024-05-08.log');
    expect(await exists(expectedFile)).toBe(false);
  });

  it('should build the log info correctly when using a function', async () => {
    const event = getDefaultEvent();
    event.payload = () => {
      return 'Hallo functional Welt';
    };
    await appender.handle(event);
    const expectedFile = path.join(logDir, '2024-05-08.log');
    const stats = await stat(expectedFile);
    expect(stats.isFile()).toBe(true);
    expect(stats.size).toBe(82);
  });

  it('test error handling in handle', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    appender.formatPrefix = (_ts, _lvl, _name, _colored) => {
      throw new Error('This is a test error');
    };
    await appender.handle(getDefaultEvent());
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
