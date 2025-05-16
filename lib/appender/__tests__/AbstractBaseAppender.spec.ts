import {afterEach, describe, expect, it, vi} from 'vitest';
import {configureLogging, useLog} from '../../index.js';
import {ConsoleAppender} from '../ConsoleAppender.js';

describe('test call site info', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should log call site', () => {
    const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    configureLogging({
      appender: {
        CONSOLE: {
          Class: ConsoleAppender,
        },
      },
      root: {
        appender: ['CONSOLE'],
        includeCallSite: true,
        level: 'DEBUG',
      },
    });

    const log = useLog('test.bit.log', 'DEBUG');
    log.debug('This is a debug message');

    expect(consoleLogSpy).toHaveBeenCalledOnce();

    const loggedLine = consoleLogSpy.mock.calls[0][0];
    expect(loggedLine).toMatch(/ \(.+?\.ts:(?: {3}\d| {2}\d{2}| \d{3}|\d{4}):(?: \d|\d\d)\):$/);

    const message = consoleLogSpy.mock.calls[0][1];
    expect(message).toBe('This is a debug message');
  });
});
