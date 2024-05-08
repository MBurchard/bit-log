import {Ansi} from '../../ansi.js';
import type {ILogEvent} from '../../definitions.js';
import {LogLevel} from '../../definitions.js';
import {ConsoleAppender} from '../ConsoleAppender.js';

describe('test ConsoleAppender', () => {
  let appender: ConsoleAppender;

  beforeEach(() => {
    appender = new ConsoleAppender();
  });

  afterEach(() => {
    jest.restoreAllMocks(); // Wiederherstellen aller Mocks nach jedem Test
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
    const debug = jest.spyOn(console, 'debug').mockImplementation(() => {
    });
    const error = jest.spyOn(console, 'error').mockImplementation(() => {
    });
    const info = jest.spyOn(console, 'info').mockImplementation(() => {
    });
    const log = jest.spyOn(console, 'log').mockImplementation(() => {
    });
    const trace = jest.spyOn(console, 'trace').mockImplementation(() => {
    });
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {
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
    const log = jest.spyOn(console, 'log').mockImplementation(() => {
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
    const log = jest.spyOn(console, 'log').mockImplementation(() => {
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
    const log = jest.spyOn(console, 'log');
    appender.colored = true;
    await appender.handle({
      level: LogLevel.INFO,
      timestamp: new Date(),
      loggerName: 'foo.bar',
      payload: ['Text', 42, false, {prop: 'Test'}],
    });
    expect(log).toHaveBeenCalledTimes(1);
    expect(log).toHaveBeenCalledWith(expect.anything(), 'Text', '42', 'false', `{prop: ${Ansi.green('"Test"')}}`);
  });
});
