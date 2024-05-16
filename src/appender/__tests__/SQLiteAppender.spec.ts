import {appendFile, mkdir, stat} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import DatabaseConstructor, {SqliteError} from 'better-sqlite3';
import type {ILogEvent} from '../../definitions.js';
import {LogLevel} from '../../definitions.js';
import {exists} from '../FileAppender.js';
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

  it('should reuse the database created during first handle call', async () => {
    const event = getDefaultEvent();
    expect(appender.willHandle(event)).toBe(true);
    await appender.handle(event);
    await appender.handle(getDefaultEvent());
    const expectedFile = path.join(logDir, 'logging.db');
    const stats = await stat(expectedFile);
    expect(stats.isFile()).toBe(true);
  });

  it('should handle corrupt database', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const existingFile = path.join(logDir, 'logging.db');
    await appendFile(existingFile, 'It\'s already there\n');
    // await chmod(existingFile, 0o444);
    await appender.handle(getDefaultEvent());
    expect(consoleErrorSpy)
      .toHaveBeenCalledWith('Error during SQLiteAppender.initDB', new SqliteError('file is not a database', ''));
  });

  it('should not handle if the log level does not match', async () => {
    appender.level = LogLevel.INFO;
    const event = getDefaultEvent();
    event.level = LogLevel.DEBUG;
    await appender.handle(event);
    const expectedFile = path.join(logDir, 'logging.db');
    expect(await exists(expectedFile)).toBe(false);
  });

  it('should build the log info correctly when using a function', async () => {
    const event = getDefaultEvent();
    event.payload = () => {
      return 'Hallo functional Welt';
    };
    await appender.handle(event);
    const expectedFile = path.join(logDir, 'logging.db');
    const db = new DatabaseConstructor(expectedFile);
    const result = db.prepare('SELECT COUNT(*) AS count FROM Logs').get();
    expect(result).toHaveProperty('count');
    // @ts-expect-error there is a result with a count property.
    expect(result.count).toEqual(1);

    const logEntry = db.prepare('SELECT * FROM Logs').get();
    // @ts-expect-error there is a result with a count property.
    expect(logEntry.id).toEqual(1);
    // @ts-expect-error there is a result with a count property.
    expect(logEntry.timestamp).toMatch(/^2024-05-0[789]T\d{2}:\d{2}:45.678[+-]\d{2}:\d{2}$/);
    // @ts-expect-error there is a result with a count property.
    expect(logEntry.level).toEqual('INFO');
    // @ts-expect-error there is a result with a count property.
    expect(logEntry.loggerName).toEqual('foo.bar');
    // @ts-expect-error there is a result with a count property.
    expect(logEntry.payload).toEqual('Hallo functional Welt');
    db.close();
  });
});
