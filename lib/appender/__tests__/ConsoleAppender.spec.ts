import type {ILogEvent} from '../../definitions.js';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {Ansi} from '../../ansi.js';
import {LogLevel} from '../../definitions.js';
import {ConsoleAppender} from '../ConsoleAppender.js';

describe('test ConsoleAppender', () => {
  let appender: ConsoleAppender;

  beforeEach(() => {
    appender = new ConsoleAppender();
  });

  afterEach(() => {
    vi.restoreAllMocks(); // Wiederherstellen aller Mocks nach jedem Test
  });

  it('check default properties', () => {
    expect(appender).not.toBeNull();
    expect(appender.useSpecificMethods).toBe(false);
    expect(appender.level).toBeUndefined();
  });

  it('constructor with log level', () => {
    appender = new ConsoleAppender(LogLevel.INFO);
    expect(appender.level).toBe(LogLevel.INFO);
  });

  it('logs with specific console methods', async () => {
    // given
    const now = new Date();
    appender.useSpecificMethods = true;
    const debug = vi.spyOn(console, 'debug').mockImplementation(() => {
    });
    const error = vi.spyOn(console, 'error').mockImplementation(() => {
    });
    const info = vi.spyOn(console, 'info').mockImplementation(() => {
    });
    const log = vi.spyOn(console, 'log').mockImplementation(() => {
    });
    const trace = vi.spyOn(console, 'trace').mockImplementation(() => {
    });
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {
    });

    // when
    // noinspection DuplicatedCode
    await appender.handle({level: LogLevel.TRACE, timestamp: now, loggerName: 'foo.bar', payload: ['test trace']});
    await appender.handle({level: LogLevel.DEBUG, timestamp: now, loggerName: 'foo.bar', payload: ['test debug']});
    await appender.handle({level: LogLevel.INFO, timestamp: now, loggerName: 'foo.bar', payload: ['test info']});
    await appender.handle({level: LogLevel.WARN, timestamp: now, loggerName: 'foo.bar', payload: ['test warn']});
    await appender.handle({level: LogLevel.ERROR, timestamp: now, loggerName: 'foo.bar', payload: ['test error']});
    await appender.handle({level: LogLevel.FATAL, timestamp: now, loggerName: 'foo.bar', payload: ['test fatal']});

    // then
    expect(trace).toHaveBeenCalledTimes(1);
    expect(trace).toHaveBeenCalledWith(expect.anything(), 'test trace');
    expect(debug).toHaveBeenCalledTimes(1);
    expect(debug).toHaveBeenCalledWith(expect.anything(), 'test debug');
    expect(info).toHaveBeenCalledTimes(1);
    expect(info).toHaveBeenCalledWith(expect.anything(), 'test info');
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledWith(expect.anything(), 'test warn');
    expect(error).toHaveBeenCalledTimes(2);
    expect(error).toHaveBeenCalledWith(expect.anything(), 'test error');
    expect(error).toHaveBeenCalledWith(expect.anything(), 'test fatal');
    expect(log).toHaveBeenCalledTimes(0);
  });

  it('logs with console.log method', async () => {
    // given
    const now = new Date();
    // noinspection DuplicatedCode
    const log = vi.spyOn(console, 'log').mockImplementation(() => {
    });

    // when
    await appender.handle({level: LogLevel.TRACE, timestamp: now, loggerName: 'foo.bar', payload: ['test trace']});
    await appender.handle({level: LogLevel.DEBUG, timestamp: now, loggerName: 'foo.bar', payload: ['test debug']});
    await appender.handle({level: LogLevel.INFO, timestamp: now, loggerName: 'foo.bar', payload: ['test info']});
    await appender.handle({level: LogLevel.WARN, timestamp: now, loggerName: 'foo.bar', payload: ['test warn']});
    await appender.handle({level: LogLevel.ERROR, timestamp: now, loggerName: 'foo.bar', payload: ['test error']});
    await appender.handle({level: LogLevel.FATAL, timestamp: now, loggerName: 'foo.bar', payload: ['test fatal']});

    // then
    expect(log).toHaveBeenCalledTimes(6);
    expect(log).toHaveBeenCalledWith(expect.anything(), 'test trace');
    expect(log).toHaveBeenCalledWith(expect.anything(), 'test debug');
    expect(log).toHaveBeenCalledWith(expect.anything(), 'test info');
    expect(log).toHaveBeenCalledWith(expect.anything(), 'test warn');
    expect(log).toHaveBeenCalledWith(expect.anything(), 'test error');
    expect(log).toHaveBeenCalledWith(expect.anything(), 'test fatal');
  });

  it('do not log if loglevel does not match', async () => {
    // given
    const now = new Date();
    appender.level = LogLevel.INFO;
    // noinspection DuplicatedCode
    const log = vi.spyOn(console, 'log').mockImplementation(() => {
    });

    // when
    await appender.handle({
      level: LogLevel.DEBUG,
      timestamp: now,
      loggerName: 'foo.bar',
      payload: () => {
        return 'test function debug';
      },
    });
    await appender.handle({
      level: LogLevel.INFO,
      timestamp: now,
      loggerName: 'foo.bar',
      payload: () => {
        return 'test function info';
      },
    });

    // then
    expect(log).toHaveBeenCalledTimes(1);
    expect(log).toHaveBeenCalledWith(expect.anything(), 'test function info');
  });

  it('willHandle returns false', () => {
    // given
    appender.level = LogLevel.INFO;
    const event: ILogEvent = {
      level: LogLevel.DEBUG,
      timestamp: new Date(),
      loggerName: 'foo.bar',
      payload: ['test debug'],
    };

    // when

    // then
    expect(appender.willHandle(event)).toBe(false);
  });

  it('willHandle returns true', () => {
    // given
    appender.level = LogLevel.INFO;
    const event: ILogEvent = {
      level: LogLevel.INFO,
      timestamp: new Date(),
      loggerName: 'foo.bar',
      payload: ['test debug'],
    };

    // when

    // then
    expect(appender.willHandle(event)).toBe(true);
  });

  it('should have colored output', async () => {
    const log = vi.spyOn(console, 'log');
    appender.colored = true;
    await appender.handle({
      level: LogLevel.INFO,
      timestamp: new Date(),
      loggerName: 'foo.bar',
      payload: ['Text', 42, false, {prop: 'Test'}],
    });
    expect(log).toHaveBeenCalledTimes(1);
    expect(log)
      .toHaveBeenCalledWith(expect.anything(), 'Text', '42', 'false', `{ prop: ${Ansi.darkGreen('\'Test\'')} }`);
  });
});

describe('test ConsoleAppender overwrite formatting', () => {
  let appender: ConsoleAppender;

  beforeEach(() => {
    appender = new ConsoleAppender();
  });

  afterEach(() => {
    vi.restoreAllMocks(); // Wiederherstellen aller Mocks nach jedem Test
  });

  it('should use default ISO 8601 date format', async () => {
    const log = vi.spyOn(console, 'log');
    const event: ILogEvent = {
      level: LogLevel.INFO,
      timestamp: new Date('2024-05-08T12:30:45.678'),
      loggerName: 'foo.bar',
      payload: ['test info'],
    };
    await appender.handle(event);
    expect(log).toHaveBeenCalledTimes(1);
    expect(log).toHaveBeenCalledWith(
      expect.stringMatching(/^2024-05-08T12:30:45\.678([+-]\d{2}:\d{2})? {2}INFO \[foo\.bar\s*]:$/),
      'test info',
    );
  });

  it('should log with a custom date format', async () => {
    const log = vi.spyOn(console, 'log');
    appender.formatTimestamp = (date: Date): string => {
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      return `${day}.${month}.${date.getFullYear()}`;
    };
    const event: ILogEvent = {
      level: LogLevel.INFO,
      timestamp: new Date('2024-05-08T12:30:45.678'),
      loggerName: 'foo.bar',
      payload: ['test info'],
    };
    await appender.handle(event);
    expect(log).toHaveBeenCalledTimes(1);
    expect(log).toHaveBeenCalledWith('08.05.2024  INFO [foo.bar             ]:', 'test info');
  });
});
