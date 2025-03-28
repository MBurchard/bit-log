import type {MockInstance} from 'vitest';
import type {LoggingConfig, LogLevel} from '../definitions.js';
import type {Logger} from '../logger.js';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {AbstractBaseAppender} from '../appender/AbstractBaseAppender.js';
import {ConsoleAppender} from '../appender/ConsoleAppender.js';
import {configureLogging, useLog} from '../index.js';

describe('test usage', () => {
  let spyConsole: MockInstance<{(...data: any[]): void; (message?: any, ...optionalParams: any[]): void}>;

  beforeEach(() => {
    spyConsole = vi.spyOn(console, 'log').mockImplementation(() => {});
    useLog('bit.log', 'INFO');
    configureLogging({
      appender: {
        CONSOLE: {
          Class: ConsoleAppender,
        },
      },
      root: {
        appender: ['CONSOLE'],
        level: 'INFO',
      },
    });
    spyConsole.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('test default configuration', () => {
    // get the root logger
    const log = useLog();

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
      const logger = useLog();
      expect(logger).toEqual({
        level: 'INFO',
        name: '',
        parent: undefined,
        appender: {
          CONSOLE: expect.any(ConsoleAppender),
        },
      });
    });

    it('logger creation works recursive', () => {
      const logger = useLog('foo.bar');
      expect(logger).toEqual({
        appender: {},
        level: 'INFO',
        name: 'foo.bar',
        parent: {
          appender: {},
          level: 'INFO',
          name: 'foo',
          parent: {
            appender: expect.anything(),
            level: 'INFO',
            name: '',
            parent: undefined,
          },
        },
      });
    });
  });

  describe('test logging configuration', () => {
    it('setup appender, CONSOLE is replaced in ROOT logger', async () => {
      useLog('bit.log', 'DEBUG');
      const config: LoggingConfig = {
        appender: {
          CONSOLE: {
            Class: ConsoleAppender,
            level: 'DEBUG',
          },
        },
      };
      configureLogging(config);

      await new Promise(r => setTimeout(r, 10));

      expect(spyConsole).toHaveBeenCalledTimes(4);
      expect(spyConsole).toHaveBeenCalledWith(expect.anything(), 'Replace appender', 'CONSOLE', 'in logger', 'ROOT');
      const root = useLog() as Logger;
      const appender = root.appender.CONSOLE;
      expect(appender).toBeDefined();
      expect(appender.level).toBe('DEBUG');
    });

    it('appender may throw errors on initialization', () => {
      try {
        configureLogging({
          appender: {
            SOMETEST: {
              Class: ErrorThrowingAppender,
              someKey: 100,
              otherKey: 'Hallo Welt',
            },
          },
        });
      } catch (e) {
        expect(e).toBeInstanceOf(Error);
        expect(e.message).toBe(
          'illegal appender config { Class: [class ErrorThrowingAppender extends ' +
          'AbstractBaseAppender], someKey: 100, otherKey: \'Hallo Welt\' }, error: Error: Something was wrong',
        );
      }
    });

    it('should throw an exception on wrong appender config', () => {
      try {
        configureLogging({
          appender: {
            // @ts-expect-error for test
            SOMETEST: {
              someKey: 100,
              otherKey: 'Hallo Welt',
            },
          },
        });
      } catch (e) {
        expect(e).toBeInstanceOf(Error);
        expect(e.message).toBe('illegal appender config { someKey: 100, otherKey: \'Hallo Welt\' }');
      }
    });

    it('should throw an error on wrong log level configuration', () => {
      try {
        configureLogging({
          root: {
            // @ts-expect-error for test
            level: 'test',
          },
        });
      } catch (e) {
        expect(e).toBeInstanceOf(Error);
        expect(e.message).toBe('not a valid LogLevel: \'test\'');
      }
    });

    it('should log a warning on missing appender config used in ROOT logger', () => {
      configureLogging({
        root: {
          appender: ['FILE'],
          level: 'INFO',
        },
      });
      expect(spyConsole).toHaveBeenCalledTimes(1);
      expect(spyConsole).toHaveBeenCalledWith(
        expect.anything(),
        'Appender named \'FILE\' is not configured. Can\'t be used in logger \'ROOT\'',
      );
    });

    it('should handle additional appender properties properly', () => {
      useLog('bit.log', 'DEBUG');
      configureLogging({
        appender: {
          NOOP: {
            Class: NoOpAppender,
            customString: 'Hallo Welt',
            customNumber: 42,
            customBoolean: true,
          },
        },
        root: {
          level: 'INFO',
          appender: ['CONSOLE', 'NOOP'],
        },
      });
      expect(spyConsole).toHaveBeenCalledWith(expect.anything(), 'registering appender \'NOOP\' to logger \'ROOT\'');
      const root = useLog() as Logger;
      const appender = root.appender.NOOP as NoOpAppender;
      expect(appender).toBeDefined();
      expect(appender.customString).toBe('Hallo Welt');
      expect(appender.customNumber).toBe(42);
      expect(appender.customBoolean).toBe(true);
    });

    it('should remove appender', () => {
      useLog('bit.log', 'DEBUG');
      configureLogging({
        root: {
          level: 'INFO',
        },
      });
      expect(spyConsole).toHaveBeenCalledWith(
        expect.anything(),
        'appender \'CONSOLE\' was removed from logger \'ROOT\'',
      );
    });

    it('should prepare a new logger with the given log level', () => {
      configureLogging({
        logger: {
          'foo.bar': {
            level: 'DEBUG',
          },
        },
      });
      const foo = useLog('foo');
      const bar = useLog('foo.bar');
      // because the root logger has level INFO at the moment when foo logger has been created
      expect(foo.level).toBe('INFO');
      expect(bar.level).toBe('DEBUG');
    });

    it('should use overwritten formatPrefix method', async () => {
      useLog('bit.log', 'DEBUG');
      const config: LoggingConfig = {
        appender: {
          CONSOLE: {
            Class: ConsoleAppender,
            level: 'DEBUG',
            formatPrefix: (_ts: Date, _level: LogLevel, _name: string, _colored: boolean = false): string => {
              return 'works as designed';
            },
          },
        },
      };
      configureLogging(config);

      await new Promise(r => setTimeout(r, 10));

      const root = useLog() as Logger;
      root.info('Hello World');
      expect(spyConsole).toHaveBeenCalledWith('works as designed', 'Hello World');
      const appender = root.appender.CONSOLE;
      expect(appender).toBeDefined();
      expect(appender.level).toBe('DEBUG');
    });
  });
});

class ErrorThrowingAppender extends AbstractBaseAppender {
  constructor() {
    super();
    throw new Error('Something was wrong');
  }

  handle(): Promise<void> {
    return Promise.resolve(undefined);
  }
}

class NoOpAppender extends AbstractBaseAppender {
  customString?: string;
  customNumber?: number;
  customBoolean?: boolean;

  handle(): Promise<void> {
    return Promise.resolve(undefined);
  }
}
