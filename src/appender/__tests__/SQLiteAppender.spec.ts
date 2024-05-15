import {mkdir, stat} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import type {ILogEvent} from '../../definitions.js';
import {LogLevel} from '../../definitions.js';
import {SQLiteAppender} from '../SQLiteAppender.js';
import {emptyDirectory} from './FileAppender.spec.js';

function getDefaultEvent(): ILogEvent {
  return {
    level: LogLevel.INFO,
    loggerName: 'foo.bar',
    payload: ['Hallo', 'Welt'],
    timestamp: new Date('2024-05-08T12:30:45.678'),
  };
}

describe('test SQLiteAppender', () => {
  const logDir = path.join(os.tmpdir(), 'bit.log.sqlite');
  let appender: SQLiteAppender;

  beforeEach(async () => {
    // create the logDir for test
    await mkdir(logDir, {recursive: true});
    // create the existing logDir for test
    await emptyDirectory(logDir);
    appender = new SQLiteAppender();
    appender.filePath = logDir;
  });

  afterEach(() => {
    jest.restoreAllMocks(); // Wiederherstellen aller Mocks nach jedem Test
  });

  it('check default properties', () => {
    expect(appender).not.toBeNull();
    expect(appender.level).toBeUndefined();
    expect(appender.baseName).toBe('logging');
    expect(appender.extension).toBe('db');
    expect(appender.filePath).toBe(logDir);
  });

  it('constructor with log level', () => {
    appender = new SQLiteAppender(LogLevel.INFO);
    expect(appender.level).toBe(LogLevel.INFO);
  });

  it('should create a logfile and add the logging', async () => {
    const event = getDefaultEvent();
    expect(appender.willHandle(event)).toBe(true);
    await appender.handle(event);
    const expectedFile = path.join(logDir, 'logging.db');
    const stats = await stat(expectedFile);
    expect(stats.isFile()).toBe(true);
  });
});
