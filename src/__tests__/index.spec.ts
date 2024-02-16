import {AbstractBaseAppender} from '../appender/AbstractBaseAppender';
import {ConsoleAppender} from '../appender/ConsoleAppender';
import type {LoggingConfig} from '../definitions';
import {LogLevel} from '../definitions';
import {configureLogging, useLogger} from '../index';
import type {Logger} from '../logger';

describe('test usage', () => {
  let spyConsole: jest.SpyInstance;

  beforeEach(() => {
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

    it('setup appender, CONSOLE is replaced in ROOT logger', async () => {
      const config: LoggingConfig = {
        appender: {
          'CONSOLE': {
            class: ConsoleAppender,
            level: LogLevel.DEBUG,
          },
        },
      };
      configureLogging(config);

      await new Promise((r) => setTimeout(r, 10));

      expect(spyConsole).toHaveBeenCalledTimes(1);
      expect(spyConsole).toHaveBeenCalledWith(expect.anything(), 'Replace appender', 'CONSOLE', 'in logger', 'ROOT');
      const root = useLogger('') as Logger;
      const appender = root.appender['CONSOLE'];
      expect(appender).toBeDefined();
      expect(appender.level).toBe(LogLevel.DEBUG);
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

    it('should throw an exception on wrong appender config', () => {
      try {
        configureLogging({
          appender: {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-expect-error
            'SOMETEST': {
              someKey: 100,
              otherKey: 'Hallo Welt',
            },
          },
        });
      } catch (e) {
        expect(e).toBeInstanceOf(Error);
        expect(e.message).toBe('illegal appender config {someKey: 100, otherKey: "Hallo Welt"}');
      }
    });

    it('should throw an error on wrong log level configuration', () => {
      try {
        configureLogging({
          root: {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-expect-error
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
          level: LogLevel.INFO,
        },
      });
      expect(spyConsole).toHaveBeenCalledTimes(1);
      expect(spyConsole).toHaveBeenCalledWith(
        expect.anything(),
        'Appender named',
        'FILE',
        'is not configured. Can\'t be used in ROOT logger!');
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
