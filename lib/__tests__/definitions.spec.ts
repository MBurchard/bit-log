import type {IAppender} from '../definitions.js';
import {describe, expect, it} from 'vitest';
import {isAppenderConfig, isPresent, toLogLevel, toLogLevelString} from '../definitions.js';

describe('test definitions', () => {
  it('isAppenderConfig', () => {
    class Test implements IAppender {
      async handle(): Promise<void> {
      }

      willHandle(): boolean {
        return false;
      }
    }

    expect(isAppenderConfig({Class: Test})).toBe(true);
  });

  it('isPresent', () => {
    expect(isPresent(undefined)).toBe(false);
    expect(isPresent(null)).toBe(false);
    expect(isPresent('')).toBe(true);
    expect(isPresent(0)).toBe(true);
  });

  it('should convert values correctly to LogLevel', () => {
    expect(toLogLevel(undefined)).toBeUndefined();
    expect(toLogLevel(null)).toBeUndefined();
    expect(toLogLevel('ERROR')).toBe(40);
    expect(toLogLevel(30)).toBe(30);
    // @ts-expect-error for test
    expect(toLogLevel('foobar')).toBeUndefined();
    expect(toLogLevel(12)).toBe(12);
  });

  it('should show LogLevel as string', () => {
    expect(toLogLevelString('ERROR')).toBe('ERROR');
    expect(toLogLevelString(10)).toBe('DEBUG');
    expect(toLogLevelString(-1)).toBe('TRACE');
    expect(toLogLevelString(9)).toBe('TRACE');
    expect(toLogLevelString(999)).toBe('FATAL');
  });
});
