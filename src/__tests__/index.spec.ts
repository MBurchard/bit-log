import {AbstractBaseAppender} from '../appender/AbstractBaseAppender';
import {ConsoleAppender} from '../appender/ConsoleAppender';
import type {LoggingConfig} from '../definitions';
import {LogLevel} from '../definitions';
import {configureLogging, useLogger} from '../index';

describe('test usage', () => {
  let spyConsole: jest.SpyInstance;

  beforeEach(() => {
    jest.resetModules();
    spyConsole = jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('test default configuration', () => {
    // get the root logger
    const log = useLogger('');

    it('log.trace', () => {
      log.trace('trace log');
      expect(spyConsole).toHaveBeenCalledTimes(0);
    });

    it('log.debug', () => {
      log.debug('debug log');
      expect(spyConsole).toHaveBeenCalledTimes(0);
    });

    it('log.info', () => {
      log.info('info log');
      expect(spyConsole).toHaveBeenCalledTimes(1);
    });
  });

  describe('useLogger', () => {
    it('default root logger', () => {
      const logger = useLogger('');
      expect(logger).toEqual({
          level: LogLevel.INFO,
          name: '',
          parent: undefined,
          appender: {
            'CONSOLE': expect.any(ConsoleAppender),
          },
        }
      );
    });

    it('logger creation works recursive', () => {
      const logger = useLogger('foo.bar');
      expect(logger).toEqual({
        appender: {},
        level: LogLevel.INFO,
        name: 'foo.bar',
        parent: {
          appender: {},
          level: LogLevel.INFO,
          name: 'foo',
          parent: {
            appender: expect.anything(),
            level: LogLevel.INFO,
            name: '',
            parent: undefined,
          },
        },
      });
    });
  });

  describe('test logging configuration', () => {
    const config: LoggingConfig = {
      appender: {
        'CONSOLE': {
          class: ConsoleAppender,
          level: LogLevel.DEBUG,
        },
      },
      root: {
        level: LogLevel.DEBUG,
      },
      logger: {},
    };

    it('setup appender', () => {
      configureLogging(config);
    });

    it('appender may throw errors on initialization', () => {
      try {
        configureLogging({
          appender: {
            'SOMETEST': {
              class: ErrorThrowingAppender,
              someKey: 100,
              otherKey: 'Hallo Welt',
            },
          },
        });
      } catch (e) {
        expect(e).toBeInstanceOf(Error);
        expect(e.message).toBe('illegal appender config {class: [class ErrorThrowingAppender extends ' +
          'AbstractBaseAppender], someKey: 100, otherKey: "Hallo Welt"}, error: Error: Something was wrong');
      }
    });
  });
});

class ErrorThrowingAppender extends AbstractBaseAppender {

  constructor() {
    super();
    throw Error('Something was wrong');
  }

  handle(): Promise<void> {
    return Promise.resolve(undefined);
  }
}
