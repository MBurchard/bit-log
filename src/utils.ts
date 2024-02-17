import type {Just} from './definitions.js';
import {isPresent, LogLevel} from './definitions.js';

/**
 * Format the given timestamp in the typical ISO-8601 format `YYYY-MM-DDTHH:mm:ss.SSSXXX`.
 *
 * If a more flexibel solution is needed, dayjs can be used.
 * However, I would always use a timestamp that makes it clear in which time zone the system was located.
 *
 * @param date
 * @return formatted string
 */
export function formatISO8601(date: Date): string {
  const YYYY = date.getFullYear();
  const MM = String(date.getMonth() + 1).padStart(2, '0');
  const DD = String(date.getDate()).padStart(2, '0');
  const HH = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  const ss = String(date.getSeconds()).padStart(2, '0');
  const SSS = String(date.getMilliseconds()).padStart(3, '0');

  const timeZoneOffset = date.getTimezoneOffset();
  const offsetSign = timeZoneOffset > 0 ? '-' : '+';
  const offsetHours = String(Math.abs(Math.floor(timeZoneOffset / 60))).padStart(2, '0');
  const offsetMinutes = String(Math.abs(timeZoneOffset) % 60).padStart(2, '0');
  const XXX = `${offsetSign}${offsetHours}:${offsetMinutes}`;

  return `${YYYY}-${MM}-${DD}T${HH}:${mm}:${ss}.${SSS}${XXX}`;
}

/**
 * use ANSI color codes to colorize the string showing the loglevel
 *
 * @internal
 * @param level
 */
export function formatLogLevel(level: LogLevel): string {
  switch (level) {
    case LogLevel.DEBUG:
      return '\x1B[37mDEBUG\x1B[m';
    case LogLevel.ERROR:
      return '\x1B[91mERROR\x1B[m';
    case LogLevel.FATAL:
      return '\x1B[95mFATAL\x1B[m';
    case LogLevel.INFO:
      return '\x1B[92mINFO\x1B[m';
    case LogLevel.TRACE:
      return '\x1B[90mTRACE\x1B[m';
    case LogLevel.WARN:
      return '\x1B[93mWARN\x1B[m';
    default:
      return '';
  }
}

/**
 * Format the prefix of each log entry.
 * As usual, the timestamp, the log level and the category are used.
 *
 * @internal
 * @param level
 * @param name
 */
export function formatPrefix(level: LogLevel, name: string): string {
  // let func = 'undefined';
  // let src = 'undefined';
  // let line = '';
  // try {
  //   const stack = (new Error()).stack;
  //   if (stack) {
  //     // console.error('Stack:', stack);
  //     const stackLine = stack.split('\n')[4];
  //     // console.error('Line:', stackLine);
  //     if (stackLine) {
  //       const match = stackLine.match(/^.*?at +?(.+?) .+?\.\/(src.+?)(?:\?.*?)?:(\d+).*?$/);
  //       if (match) {
  //         func = match[1] ?? 'undefined';
  //         src = match[2] ?? 'undefined';
  //         line = match[3] ?? '';
  //       }
  //     }
  //   }
  // } catch (e) {}
  // return `${getTs()} ${formatLogLevel(level)} [${strPad(category, 20)}|${strPad(func, 20)}|${strPad(src, 30)}|${line.padStart(5, ' ')}]:`;
  const formattedLevel = formatLogLevel(level);
  return `${formatISO8601(new Date())} ${formattedLevel.padStart(13, ' ')} [${truncateOrExtend(name, 20)}]:`;
}

/**
 * Helper function to show a text representation of any class constructor like console.log does.
 *
 * @param clazz
 */
export function getClassHierarchy(clazz: Just<unknown>): string {
  if (!isPresent(clazz) || typeof clazz !== 'function' || !isClass(clazz)) {
    return 'no class';
  }

  const classHierarchy = [];
  let constructor: ObjectConstructor = clazz as ObjectConstructor;

  while (constructor && constructor !== Object) {
    classHierarchy.push(constructor.name);
    constructor = Object.getPrototypeOf(constructor.prototype)?.constructor;
  }

  return `[class ${classHierarchy.join(' extends ')}]`;
}

/**
 * Check if something is a class.<br>
 * Unfortunately, this is probably not the fastest method, but I haven't found a better one that works.
 *
 * @param clazz
 */
export function isClass(clazz: Just<unknown>): boolean {
  const str = `${clazz}`;
  return str.startsWith('class ');
}

/**
 * Truncates a string in the middle if it exceeds the desired length.
 * Optionally, a custom replacement string can be provided for the middle part.
 *
 * @param str The input string to be truncated.
 * @param length The desired maximum length of the resulting string.
 * @param replacement The replacement string for the middle part (default is '...').
 */
export function truncateMiddle(str: string, length: number, replacement: string = '...'): string {
  if (str.length <= length) {
    return str;
  }

  const replacementLength = replacement.length;
  const charsToShow = length - replacementLength;
  const frontChars = Math.ceil(charsToShow / 2);
  const backChars = Math.floor(charsToShow / 2);

  return str.slice(0, frontChars) + replacement + str.slice(str.length - backChars);
}

/**
 * Truncates a string in the middle if it exceeds the desired length; otherwise, extends the resulting string by
 * padding it at the end to achieve the exact desired length.
 *
 * @internal
 * @param str The input string to be truncated or extended.
 * @param length The desired exact length of the resulting string.
 * @returns The truncated or extended string.
 */
export function truncateOrExtend(str: string, length: number): string {
  return truncateMiddle(str, length).padEnd(length, ' ');
}
