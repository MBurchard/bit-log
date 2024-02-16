import type {IAppender} from '../definitions';
import {isAppenderConfig, isPresent, LogLevel, toLogLevel} from '../definitions';

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
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      toLogLevel('foobar');
    } catch (e) {
      expect(e).toBeInstanceOf(Error);
      expect(e.message).toBe('not a valid LogLevel: \'foobar\'');
    }
    try {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      toLogLevel(12);
    } catch (e) {
      expect(e).toBeInstanceOf(Error);
      expect(e.message).toBe('not a valid LogLevel: \'12\'');
    }
  });
});
