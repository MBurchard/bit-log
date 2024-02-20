import {Ansi} from './ansi.js';
import {isPresent, LogLevel} from './definitions.js';

export function formatAny(value: unknown, pretty: boolean = false, colored: boolean = false,
                          inner: number = 0): string {
  // noinspection SuspiciousTypeOfGuard
  if (!isPresent(value) || typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    if (inner === 0) {
      return `${value}`;
    }
    const result = typeof value === 'string' ? `"${value}"` : `${value}`;
    if (colored) {
      if (typeof value === 'string') {
        return Ansi.green(result);
      }
      if (typeof value === 'number') {
        return Ansi.darkCyan(result);
      }
      if (typeof value === 'boolean') {
        return Ansi.darkYellow(result);
      }
      return Ansi.bold(result);
    }
    return result;
  }
  if (Array.isArray(value)) {
    return formatArray(value, pretty, colored, inner);
  }
  if (typeof value === 'object') {
    return formatObject(value, pretty, colored, inner);
  }
  if (isClass(value)) {
    const result = getClassHierarchy(value);
    if (colored) {
      return Ansi.darkMagenta(result);
    }
    return result;
  }
  if (typeof value === 'function') {
    const src = value.toString();
    const lines = src.split('\n');
    if (colored) {
      return `[${Ansi.blue('Function')} ${lines[0].substring(0, 100)}${lines.length > 1 || lines[0].length > 100 ? '...' : ''}]`;
    }
    return `[Function ${lines[0].substring(0, 100)}${lines.length > 1 || lines[0].length > 100 ? '...' : ''}]`;
  }
  return '';
}

function formatArray(array: Array<unknown>, pretty: boolean = false, colored: boolean = false,
                     inner: number = 0): string {
  const results: string[] = [];
  for (const elem of array) {
    results.push(formatAny(elem, pretty, colored, inner + 1));
  }
  if (pretty) {
    const indent = ' '.repeat((inner + 1) * 2);
    return `[\n${indent}${results.join(`,\n${indent}`)}\n${' '.repeat((inner) * 2)}]`;
  }
  return `[${results.join(', ')}]`;
}

function formatObject(obj: object, pretty: boolean = false, colored: boolean = false,
                      inner: number = 0): string {
  const results: string[] = [];
  for (const [key, elem] of Object.entries(obj)) {
    results.push(`${key}: ${formatAny(elem, pretty, colored, inner + 1)}`);
  }
  if (pretty) {
    const indent = ' '.repeat((inner + 1) * 2);
    return `{\n${indent}${results.join(`,\n${indent}`)}\n${' '.repeat((inner) * 2)}}`;
  }
  return `{${results.join(', ')}}`;
}

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
      return Ansi.gray('DEBUG');
    case LogLevel.ERROR:
      return Ansi.red('ERROR');
    case LogLevel.FATAL:
      return Ansi.magenta('FATAL');
    case LogLevel.INFO:
      return Ansi.green('INFO');
    case LogLevel.TRACE:
      return Ansi.darkGray('TRACE');
    case LogLevel.WARN:
      return Ansi.yellow('WARN');
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
export function getClassHierarchy(clazz: NonNullable<unknown>): string {
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
export function isClass(clazz: NonNullable<unknown>): boolean {
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
