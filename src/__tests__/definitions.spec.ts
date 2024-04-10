import type {IAppender} from '../definitions.js';
import {LogLevel, isAppenderConfig, isPresent, toLogLevel} from '../definitions.js';

describe('test definitions', () => {
  it('isAppenderConfig', () => {
    class Test implements IAppender {
      async handle(): Promise<void> {
      }

      willHandle(): boolean {
        return false;
      }
    }

    expect(isAppenderConfig({class: Test})).toBe(true);
  });

  it('isPresent', () => {
    expect(isPresent(undefined)).toBe(false);
    expect(isPresent(null)).toBe(false);
    expect(isPresent('')).toBe(true);
    expect(isPresent(0)).toBe(true);
  });

  it('toLogLevel', () => {
    expect(toLogLevel(undefined)).toBeUndefined();
    expect(toLogLevel('ERROR')).toBe(LogLevel.ERROR);
    expect(toLogLevel(LogLevel.DEBUG)).toBe(LogLevel.DEBUG);
    expect(toLogLevel(30)).toBe(LogLevel.WARN);
    try {
      // @ts-expect-error for test
      toLogLevel('foobar');
    } catch (e) {
      expect(e).toBeInstanceOf(Error);
      expect(e.message).toBe('not a valid LogLevel: \'foobar\'');
    }
    try {
      // @ts-expect-error for test
      toLogLevel(12);
    } catch (e) {
      expect(e).toBeInstanceOf(Error);
      expect(e.message).toBe('not a valid LogLevel: \'12\'');
    }
  });
});
