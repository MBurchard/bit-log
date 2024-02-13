import {LogLevel} from '../definitions';
import {formatISO8601, formatLogLevel, formatPrefix, truncateMiddle, truncateOrExtend} from '../utils';

describe('test utils', () => {
  it('formatLogLevel TRACE', () => {
    expect(formatLogLevel(LogLevel.TRACE)).toBe('\x1B[90mTRACE\x1B[m');
  });

  it('formatLogLevel DEBUG', () => {
    expect(formatLogLevel(LogLevel.DEBUG)).toBe('\x1B[37mDEBUG\x1B[m');
  });

  it('formatLogLevel INFO', () => {
    expect(formatLogLevel(LogLevel.INFO)).toBe('\x1B[92mINFO\x1B[m');
  });

  it('formatLogLevel WARN', () => {
    expect(formatLogLevel(LogLevel.WARN)).toBe('\x1B[93mWARN\x1B[m');
  });

  it('formatLogLevel ERROR', () => {
    expect(formatLogLevel(LogLevel.FATAL)).toBe('\x1B[95mFATAL\x1B[m');
  });

  it('formatLogLevel FATAL', () => {
    expect(formatLogLevel(LogLevel.FATAL)).toBe('\x1B[95mFATAL\x1B[m');
  });

  it('formatLogLevel OFF', () => {
    expect(formatLogLevel(LogLevel.OFF)).toBe('');
  });

  it('formatISO8601', () => {
    const date = new Date();
    expect(formatISO8601(date)).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}[+-]\d{2}:\d{2}$/);
  });

  it('truncateMiddle if string is shorter then the given limit', () => {
    expect(truncateMiddle('to short', 10)).toBe('to short');
  });

  it('truncateMiddle if string has exactly the same length as the given limit', () => {
    expect(truncateMiddle('exactly 10', 10)).toBe('exactly 10');
  });

  it('truncateMiddle if string is longer then the given limit', () => {
    expect(truncateMiddle('longer then', 10)).toBe('long...hen');
  });

  it('truncateOrExtend if string is shorter then the given limit', () => {
    expect(truncateOrExtend('to short', 10)).toBe('to short  ');
  });

  it('formatPrefix with 5 chars log level', () => {
    expect(formatPrefix(LogLevel.DEBUG, 'foo.bar'))
      .toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}[+-]\d{2}:\d{2}\s.+?\s\[.{20}]:$/);
  });

  it('formatPrefix with 4 chars log level', () => {
    expect(formatPrefix(LogLevel.INFO, 'foo.bar'))
      .toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}[+-]\d{2}:\d{2}\s{2}.+?\s\[.{20}]:$/);
  });
});
