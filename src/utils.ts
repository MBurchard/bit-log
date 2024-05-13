import {Ansi} from './ansi.js';
import {LogLevel, isPresent} from './definitions.js';

/**
 * @internal
 */
export class CircularTracker {
  private readonly cache: Set<object> = new Set();
  private readonly circular: Set<object> = new Set();

  /**
   * Add an object to the cache for tracking
   *
   * @param obj
   */
  add(obj: object) {
    if (this.cache.has(obj)) {
      throw new Error('object must not be added twice');
    }
    this.cache.add(obj);
  }

  /**
   * check if an object is already being tracked
   *
   * @param obj
   */
  has(obj: object): boolean {
    return this.cache.has(obj);
  }

  /**
   * get the index of that object in the cache
   *
   * @param obj
   */
  indexOf(obj: object): number {
    return [...this.cache].indexOf(obj) + 1;
  }

  /**
   * check if an object is marked as being used circularly
   *
   * @param obj
   */
  isCircular(obj: object): boolean {
    return this.circular.has(obj);
  }

  /**
   * mark an object as being used circularly
   *
   * @param obj
   */
  setAsCircular(obj: object) {
    if (!this.circular.has(obj)) {
      this.circular.add(obj);
    }
  }
}

/**
 * Format any value.
 * Entrypoint for the formatting functions.
 *
 * @param value
 * @param {boolean} pretty
 * @param {boolean} colored
 * @param {number} inner
 * @param {CircularTracker} ct
 * @return {string}
 */
export function formatAny(
  value: unknown,
  pretty: boolean = false,
  colored: boolean = false,
  inner: number = 0,
  ct: CircularTracker = new CircularTracker(),
): string {
  // noinspection SuspiciousTypeOfGuard
  if (!isPresent(value) || typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    // Should we colorize string, number and boolean, even if they are not in an object or array, but stand alone?
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
    return formatArray(value, pretty, colored, inner, ct);
  }
  if (typeof value === 'object') {
    return formatObject(value, pretty, colored, inner, ct);
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
      return `[${Ansi.blue('Function')} ${lines[0].substring(0, 100)}${
        lines.length > 1 || lines[0].length > 100 ? '...' : ''}]`;
    }
    return `[Function ${lines[0].substring(0, 100)}${lines.length > 1 || lines[0].length > 100 ? '...' : ''}]`;
  }
  return `${typeof value}`;
}

function formatArray(
  array: Array<unknown>,
  pretty: boolean = false,
  colored: boolean = false,
  inner: number = 0,
  ct: CircularTracker,
): string {
  ct.add(array);
  const results: string[] = [];
  for (const elem of array) {
    if (isPresent(elem) && ct.has(elem)) {
      ct.setAsCircular(elem);
      const ref = ct.indexOf(elem);
      results.push(colored ?
        `[${Ansi.cyan('Circular')} ${Ansi.blue(`ref${ref}`)}]` :
        `[Circular ref${ref}]`,
      );
    } else {
      results.push(formatAny(elem, pretty, colored, inner + 1, ct));
    }
  }
  let ref = '';
  if (ct.isCircular(array)) {
    ref = `<ref${ct.indexOf(array)}>`;
  }
  if (pretty) {
    const indent = ' '.repeat((inner + 1) * 2);
    return `${ref ? Ansi.blue(ref) : ''}[\n${indent}${results.join(`,\n${indent}`)}\n${' '.repeat((inner) * 2)}]`;
  }
  return `${ref}[${results.join(', ')}]`;
}

function formatObject(
  obj: object,
  pretty: boolean = false,
  colored: boolean = false,
  inner: number = 0,
  ct: CircularTracker,
): string {
  ct.add(obj);
  const results: string[] = [];
  for (const [key, elem] of getAllPropertiesAndMethods(obj)) {
    if (typeof elem === 'object' && elem !== null && ct.has(elem)) {
      ct.setAsCircular(elem);
      const ref = ct.indexOf(elem);
      results.push(`${key}: ${colored ?
        `[${Ansi.cyan('Circular')} ${Ansi.blue(`ref${ref}`)}]` :
        `[Circular ref${ref}]`
      }`);
    } else {
      results.push(`${key}: ${formatAny(elem, pretty, colored, inner + 1, ct)}`);
    }
  }
  let ref = '';
  if (ct.isCircular(obj)) {
    ref = `<ref${ct.indexOf(obj)}>`;
  }
  if (pretty) {
    const indent = ' '.repeat((inner + 1) * 2);
    return `${ref ? Ansi.blue(ref) : ''}{\n${indent}${results.join(`,\n${indent}`)}\n${' '.repeat((inner) * 2)}}`;
  }
  return `${ref}{${results.join(', ')}}`;
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
 * @param colored
 */
export function formatLogLevel(level: LogLevel, colored: boolean = false): string {
  if (colored) {
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
  return LogLevel[level];
}

/**
 * Format the prefix of each log entry.
 * As usual, the timestamp, the log level and the category are used.
 *
 * @internal
 * @param {Date} ts
 * @param {LogLevel} level
 * @param {string} name
 * @param {boolean} colored
 * @return {string}
 */
export function formatPrefix(ts: Date, level: LogLevel, name: string, colored: boolean = false): string {
  let formattedLevel;
  if (colored) {
    formattedLevel = formatLogLevel(level, colored).padStart(13, ' ');
  } else {
    formattedLevel = formatLogLevel(level).padStart(5, ' ');
  }
  return `${formatISO8601(ts)} ${formattedLevel} [${truncateOrExtend(name, 20)}]:`;
}

/**
 * Get all properties and methods of an object.
 * <b>Attention:</b> don't be surprised, there are objects that have properties twice in the inheritance hierarchy,
 * like the Error object's message property.
 * Why does someone shadow a property? Perhaps there is a reason.
 *
 * @internal
 * @param {object} obj
 * @return {[string, unknown][]}
 */
export function getAllPropertiesAndMethods(obj: object): [string, unknown][] {
  const properties: [string, unknown][] = [];
  let currentObj = obj;

  while (currentObj !== Object.prototype && currentObj !== null) {
    Object.getOwnPropertyNames(currentObj).forEach((key) => {
      // @ts-expect-error I want to access it this way!
      properties.push([key, currentObj[key]]);
    });
    currentObj = Object.getPrototypeOf(currentObj);
  }
  return properties;
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
  try {
    const str = `${clazz}`;
    return str.startsWith('class ');
  } catch (e) {
    return false;
  }
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
