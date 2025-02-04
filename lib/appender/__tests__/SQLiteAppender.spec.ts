import type {CustomTestContext} from './FileAppender.spec.js';
import {appendFile, mkdir, stat} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import DatabaseConstructor, {SqliteError} from 'better-sqlite3';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {LogLevel} from '../../definitions.js';
import {exists} from '../FileAppender.js';
import {SQLiteAppender} from '../SQLiteAppender.js';
import {emptyDirectory, genLogDirName, getDefaultEvent} from './FileAppender.spec.js';

interface LogEntry {
  id: number;
  timestamp: string;
  level: string;
  loggerName: string;
  payload: string;
}

describe('test SQLiteAppender', () => {
  // noinspection DuplicatedCode
  let appender: SQLiteAppender;

  beforeEach(async (ctx: CustomTestContext) => {
    ctx.logDir = path.join(os.tmpdir(), 'bit.log', genLogDirName(ctx.task.name));
    await mkdir(ctx.logDir, {recursive: true});
    appender = new SQLiteAppender();
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
    expect(appender).not.toBeNull();
    expect(appender.level).toBeUndefined();
    expect(appender.baseName).toBe('logging');
    expect(appender.extension).toBe('db');
    expect(appender.filePath).toBe(ctx.logDir);
  });

  it('constructor with log level', () => {
    appender = new SQLiteAppender(LogLevel.INFO);
    expect(appender.level).toBe(LogLevel.INFO);
  });

  it('should create a logfile and add the logging', async (ctx: CustomTestContext) => {
    const event = getDefaultEvent();
    expect(appender.willHandle(event)).toBe(true);
    await appender.handle(event);
    const expectedFile = path.join(ctx.logDir, 'logging.db');
    const stats = await stat(expectedFile);
    expect(stats.isFile()).toBe(true);
  });

  it('should reuse the database created during first handle call', async (ctx: CustomTestContext) => {
    const event = getDefaultEvent();
    expect(appender.willHandle(event)).toBe(true);
    await appender.handle(event);
    await appender.handle(getDefaultEvent());
    const expectedFile = path.join(ctx.logDir, 'logging.db');
    const stats = await stat(expectedFile);
    expect(stats.isFile()).toBe(true);
  });

  it('should handle corrupt database', async (ctx: CustomTestContext) => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const existingFile = path.join(ctx.logDir, 'logging.db');
    await appendFile(existingFile, 'It\'s already there\n');
    // await chmod(existingFile, 0o444);
    await appender.handle(getDefaultEvent());
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Error during SQLiteAppender.initDB',
      new SqliteError('file is not a database', 'SQLITE_NOTADB'),
    );
  });

  it('should not handle if the log level does not match', async (ctx: CustomTestContext) => {
    appender.level = LogLevel.INFO;
    const event = getDefaultEvent();
    event.level = LogLevel.DEBUG;
    await appender.handle(event);
    const expectedFile = path.join(ctx.logDir, 'logging.db');
    expect(await exists(expectedFile)).toBe(false);
  });

  it('should build the log info correctly when using a function', async (ctx: CustomTestContext) => {
    const event = getDefaultEvent();
    event.payload = () => {
      return 'Hallo functional Welt';
    };
    await appender.handle(event);
    const expectedFile = path.join(ctx.logDir, 'logging.db');
    const db = new DatabaseConstructor(expectedFile);
    // noinspection SqlResolve
    const result = db.prepare('SELECT COUNT(*) AS count FROM Logs').get();
    expect(result).toHaveProperty('count');
    // @ts-expect-error there is a result with a count property.
    expect(result.count).toEqual(1);

    // noinspection SqlResolve
    const logEntry = db.prepare('SELECT * FROM Logs').get() as LogEntry;
    expect(logEntry.id).toEqual(1);
    expect(logEntry.timestamp).toMatch(/^2024-04-01T\d{2}:\d{2}:45.678[+-]\d{2}:\d{2}$/);
    expect(logEntry.level).toEqual('INFO');
    expect(logEntry.loggerName).toEqual('foo.bar');
    expect(logEntry.payload).toEqual('Hallo functional Welt');
    db.close();
  });

  it('should be robust against wrong timestamps', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const event = getDefaultEvent();
    // @ts-expect-error I want to force an error.
    event.timestamp = 'This is bad';
    await appender.handle(event);
    expect(consoleErrorSpy)
      .toHaveBeenCalledWith('Error during SQLiteAppender.handle', new TypeError('date.getFullYear is not a function'));
  });
});
