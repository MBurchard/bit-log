import type {IAppender} from '../definitions';
import {LogLevel} from '../definitions';
import {Logger} from '../logger';

describe('test logger', () => {
  let mockAppender: IAppender;

  beforeEach(() => {
    mockAppender = {
      level: LogLevel.INFO,
      handle: jest.fn().mockResolvedValue(undefined),
      willHandle: jest.fn().mockReturnValue(true),
    };
  });

  afterEach(() => {
    jest.restoreAllMocks(); // Wiederherstellen aller Mocks nach jedem Test
  });

  describe('initialization', () => {
    it('without loglevel', () => {
      const logger = new Logger('');
      expect(logger.name).toBe('');
      expect(logger.level).toBe(LogLevel.ERROR);
    });

    it('with loglevel', () => {
      const logger = new Logger('foo.bar', undefined, LogLevel.INFO);
      expect(logger.name).toBe('foo.bar');
      expect(logger.level).toBe(LogLevel.INFO);
    });

    it('with loglevel from parent', () => {
      const parent = new Logger('', undefined, LogLevel.INFO);
      const child = new Logger('foo', parent);
      expect(child.level).toBe(LogLevel.INFO);
    });
  });

  describe('appender handling', () => {
    let logger: Logger;

    beforeEach(() => {
      logger = new Logger('foo.bar', undefined, LogLevel.INFO);
    });

    it('add new appender', () => {
      // given
      const name = 'MockAppender';

      expect(logger.addAppender(name, mockAppender)).toBe(true);

      expect(logger.appender[name]).toBe(mockAppender);
    });

    it('add already registered appender', () => {
      // given
      const name = 'MockAppender';
      logger.addAppender(name, mockAppender);

      expect(logger.addAppender(name, mockAppender)).toBe(false);
    });

    it('force add appender', () => {
      // given
      const name = 'TestAppender';
      logger.addAppender(name, mockAppender);
      const appender2: IAppender = {
        level: LogLevel.DEBUG,
        handle: async () => {
        },
        willHandle: () => {
          return false;
        },
      };

      // when/then
      expect(logger.addAppender(name, appender2, true)).toBe(true);
      expect(logger.appender[name]).not.toBe(mockAppender);
    });

    it('added appender should be used', () => {
      // given
      logger.addAppender('MockAppender', mockAppender);
      const spyEmit = jest.spyOn(logger, 'emit');

      // when
      logger.info('test info');

      // then
      expect(mockAppender.willHandle).toHaveBeenCalledTimes(1);
      expect(mockAppender.handle).toHaveBeenCalledTimes(1);
      expect(spyEmit).toHaveBeenCalledTimes(1);
      expect(spyEmit).toHaveReturnedWith(true);
    });

    it('removed appender should not be used', () => {
      // given
      logger.addAppender('MockAppender', mockAppender);

      // when
      expect(logger.removeAppender('MockAppender')).toBe(true);
      logger.info('test info');

      // then
      expect(mockAppender.willHandle).toHaveBeenCalledTimes(0);
      expect(mockAppender.handle).toHaveBeenCalledTimes(0);
    });

    it('remove appender that was not registered previously', () => {
      expect(logger.removeAppender('Test')).toBe(false);
    });

    it('appender exception during handle is caught', async () => {
      (mockAppender.handle as jest.Mock).mockResolvedValue(Promise.reject('Reject for some reason'));

      logger.addAppender('MockAppender', mockAppender);
      const consoleErrorSpy =
        jest.spyOn(console, 'error').mockImplementation(() => {
        });

      expect(() => logger.info('test info')).not.toThrow();

      await new Promise((r) => setTimeout(r, 10));

      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith('error in appender.handle of MockAppender', 'Reject for some reason');
    });
  });

  describe('parent handling', () => {
    let root: Logger;

    beforeEach(() => {
      root = new Logger('', undefined, LogLevel.TRACE);
    });

    it('should get the log event', () => {
      const logger = new Logger('foo', root, LogLevel.INFO);
      const spyEmit = jest.spyOn(root, 'emit');

      const now = Date.now();
      logger.info('Test info');


      expect(spyEmit).toHaveBeenCalledTimes(1);
      expect(spyEmit).toHaveBeenCalledWith({
        level: LogLevel.INFO,
        loggerName: 'foo',
        payload: ['Test info'],
        timestamp: expect.any(Date),
      });
      const timestamp = spyEmit.mock.calls[0][0].timestamp;
      expect(timestamp.getTime()).toBeGreaterThanOrEqual(now);
      expect(timestamp.getTime()).toBeLessThanOrEqual(Date.now());
    });
  });

  describe('logging methods', () => {
    let logger: Logger;
    let spyEmit: jest.SpyInstance;

    beforeEach(() => {
      logger = new Logger('TestLogger', undefined, LogLevel.TRACE);
      spyEmit = jest.spyOn(logger, 'emit');
    });

    // noinspection DuplicatedCode
    it('should trace', () => {
      logger.trace('test trace');
      expect(spyEmit).toHaveBeenCalledTimes(1);
      expect(spyEmit).toHaveBeenCalledWith({
        level: LogLevel.TRACE,
        loggerName: 'TestLogger',
        payload: ['test trace'],
        timestamp: expect.any(Date),
      });
    });

    it('should debug', () => {
      logger.debug('test debug');
      expect(spyEmit).toHaveBeenCalledTimes(1);
      expect(spyEmit).toHaveBeenCalledWith({
        level: LogLevel.DEBUG,
        loggerName: 'TestLogger',
        payload: ['test debug'],
        timestamp: expect.any(Date),
      });
    });

    // noinspection DuplicatedCode
    it('should info', () => {
      logger.info('test info');
      expect(spyEmit).toHaveBeenCalledTimes(1);
      expect(spyEmit).toHaveBeenCalledWith({
        level: LogLevel.INFO,
        loggerName: 'TestLogger',
        payload: ['test info'],
        timestamp: expect.any(Date),
      });
    });

    it('should warn', () => {
      logger.warn('test warn');
      expect(spyEmit).toHaveBeenCalledTimes(1);
      expect(spyEmit).toHaveBeenCalledWith({
        level: LogLevel.WARN,
        loggerName: 'TestLogger',
        payload: ['test warn'],
        timestamp: expect.any(Date),
      });
    });

    it('should error', () => {
      logger.error('test error', new Error('CustomError'));
      expect(spyEmit).toHaveBeenCalledTimes(1);
      expect(spyEmit).toHaveBeenCalledWith({
        level: LogLevel.ERROR,
        loggerName: 'TestLogger',
        payload: ['test error', new Error('CustomError')],
        timestamp: expect.any(Date),
      });
    });

    it('should fatal', () => {
      logger.fatal('test fatal');
      expect(spyEmit).toHaveBeenCalledTimes(1);
      expect(spyEmit).toHaveBeenCalledWith({
        level: LogLevel.FATAL,
        loggerName: 'TestLogger',
        payload: ['test fatal'],
        timestamp: expect.any(Date),
      });
    });

    it('should execute log method parameter', () => {
      const mockLog = jest.fn().mockReturnValue('jest mock log function');
      logger.debug(mockLog);
      expect(mockLog).toHaveBeenCalledTimes(1);
    });

    it('should not execute log method parameter, if log level is to low', () => {
      logger.level = LogLevel.ERROR;
      const mockLog = jest.fn().mockReturnValue('jest mock log function');
      logger.debug(mockLog);
      expect(mockLog).toHaveBeenCalledTimes(0);
    });
  });
});
