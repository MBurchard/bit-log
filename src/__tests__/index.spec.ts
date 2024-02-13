import {ConsoleAppender} from '../appender/ConsoleAppender';
import type {LoggingConfig} from '../definitions';
import {LogLevel} from '../definitions';
import {configureLogging, useLogger} from '../index';
import {Logger} from '../logger';

describe('test default configuration', () => {
  // get the root logger
  const log = useLogger('');
  let spyConsole: jest.SpyInstance;

  beforeEach(() => {
    spyConsole = jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks(); // Wiederherstellen aller Mocks nach jedem Test
  });

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

// describe('test logging configuration', () => {
//   const config: LoggingConfig = {
//     appender: {
//       'CONSOLE': {
//         class: ConsoleAppender,
//         level: LogLevel.DEBUG,
//       },
//     },
//   };
//
//   it('default root logger', () => {
//     const log = useLogger('');
//     expect(log).toBeDefined();
//     expect(log).toBeInstanceOf(Logger);
//     expect(log.level).toBe(LogLevel.INFO);
//     expect((log as Logger).appender).toStrictEqual({'CONSOLE': new ConsoleAppender(LogLevel.TRACE)});
//   });
//
//   it('setup appender', () => {
//     // change log level off ROOT logger to debug, to see logging setup messages
//     const root = useLogger('');
//     root.level = LogLevel.DEBUG;
//     configureLogging(config);
//   });
// });
