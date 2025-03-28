import type {MockInstance} from 'vitest';
import type {IAppender, ILogEvent} from '../definitions.js';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {Logger} from '../logger.js';

describe('test logger', () => {
  let mockAppender: IAppender;

  beforeEach(() => {
    mockAppender = {
      level: 'INFO',
      handle: vi.fn().mockResolvedValue(undefined),
      willHandle: vi.fn().mockReturnValue(true),
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('initialization', () => {
    it('without loglevel', () => {
      const logger = new Logger('');
      expect(logger.name).toBe('');
      expect(logger.level).toBe('ERROR');
    });

    it('with loglevel', () => {
      const logger = new Logger('foo.bar', undefined, 'INFO');
      expect(logger.name).toBe('foo.bar');
      expect(logger.level).toBe('INFO');
    });

    it('with loglevel from parent', () => {
      const parent = new Logger('', undefined, 'INFO');
      const child = new Logger('foo', parent);
      expect(child.level).toBe('INFO');
    });
  });

  describe('appender handling', () => {
    let logger: Logger;

    beforeEach(() => {
      logger = new Logger('foo.bar', undefined, 'INFO');
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
        level: 'DEBUG',
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
      const spyEmit = vi.spyOn(logger, 'emit');

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
      (mockAppender.handle as ReturnType<typeof vi.fn>)
        .mockResolvedValue(Promise.reject(new Error('Reject for some reason')));

      logger.addAppender('MockAppender', mockAppender);
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => logger.info('test info')).not.toThrow();

      await new Promise(r => setTimeout(r, 10));

      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
      expect(consoleErrorSpy)
        .toHaveBeenCalledWith('error in appender.handle of MockAppender', new Error('Reject for some reason'));
    });
  });

  describe('parent handling', () => {
    let root: Logger;

    beforeEach(() => {
      root = new Logger('', undefined, 'TRACE');
    });

    it('should get the log event', () => {
      const logger = new Logger('foo', root, 'INFO');
      const spyEmit = vi.spyOn(root, 'emit');

      const now = Date.now();
      logger.info('Test info');

      expect(spyEmit).toHaveBeenCalledTimes(1);
      expect(spyEmit).toHaveBeenCalledWith({
        level: 'INFO',
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
    let spyEmit: MockInstance<(event: ILogEvent) => boolean>;

    beforeEach(() => {
      logger = new Logger('TestLogger', undefined, 'TRACE');
      spyEmit = vi.spyOn(logger, 'emit');
    });

    // noinspection DuplicatedCode
    it('should trace', () => {
      logger.trace('test trace');
      expect(spyEmit).toHaveBeenCalledTimes(1);
      expect(spyEmit).toHaveBeenCalledWith({
        level: 'TRACE',
        loggerName: 'TestLogger',
        payload: ['test trace'],
        timestamp: expect.any(Date),
      });
    });

    it('should debug', () => {
      logger.debug('test debug');
      expect(spyEmit).toHaveBeenCalledTimes(1);
      expect(spyEmit).toHaveBeenCalledWith({
        level: 'DEBUG',
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
        level: 'INFO',
        loggerName: 'TestLogger',
        payload: ['test info'],
        timestamp: expect.any(Date),
      });
    });

    it('should warn', () => {
      logger.warn('test warn');
      expect(spyEmit).toHaveBeenCalledTimes(1);
      expect(spyEmit).toHaveBeenCalledWith({
        level: 'WARN',
        loggerName: 'TestLogger',
        payload: ['test warn'],
        timestamp: expect.any(Date),
      });
    });

    it('should error', () => {
      logger.error('test error', new Error('CustomError'));
      expect(spyEmit).toHaveBeenCalledTimes(1);
      expect(spyEmit).toHaveBeenCalledWith({
        level: 'ERROR',
        loggerName: 'TestLogger',
        payload: ['test error', new Error('CustomError')],
        timestamp: expect.any(Date),
      });
    });

    it('should fatal', () => {
      logger.fatal('test fatal');
      expect(spyEmit).toHaveBeenCalledTimes(1);
      expect(spyEmit).toHaveBeenCalledWith({
        level: 'FATAL',
        loggerName: 'TestLogger',
        payload: ['test fatal'],
        timestamp: expect.any(Date),
      });
    });

    it('should execute log method parameter', () => {
      const mockLog = vi.fn().mockReturnValue('jest mock log function');
      logger.debug(mockLog);
      expect(mockLog).toHaveBeenCalledTimes(1);
    });

    it('should not execute log method parameter, if log level is to low', () => {
      logger.level = 'ERROR';
      const mockLog = vi.fn().mockReturnValue('jest mock log function');
      logger.debug(mockLog);
      expect(mockLog).toHaveBeenCalledTimes(0);
    });
  });
});
