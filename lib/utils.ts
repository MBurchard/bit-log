import type {LogLevelType} from './definitions.js';
import {Ansi} from './ansi.js';
import {isPresent, LogLevel, LogLevelName} from './definitions.js';

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
  if (inner === 0 && (value === undefined || value === null || typeof value === 'bigint' ||
    typeof value === 'boolean' || typeof value === 'number' || typeof value === 'string')) {
    return `${value}`;
  }
  if (value === undefined) {
    return colored ? Ansi.darkGray(value) : `${value}`;
  }
  if (value === null) {
    return colored ? Ansi.bold(value) : `${value}`;
  }
  if (typeof value === 'symbol') {
    return colored ?
      `${Ansi.magenta('Symbol(')}${value.description}${Ansi.magenta(')')}` :
      `Symbol(${value.description})`;
  }
  if (typeof value === 'bigint') {
    return colored ? Ansi.cyan(`${value}`) : `${value}`;
  }
  if (typeof value === 'number') {
    return colored ? Ansi.darkCyan(value) : `${value}`;
  }
  if (typeof value === 'boolean') {
    return colored ? Ansi.darkYellow(`${value}`) : `${value}`;
  }
  if (typeof value === 'string') {
    return colored ? Ansi.darkGreen(`'${value}'`) : `'${value}'`;
  }
  if (Array.isArray(value)) {
    return formatArrayLike(value, pretty, colored, inner, ct);
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
  // this code seems to be unreachable with current JavaScript (maybe with future datatypes), it can't be covered
  /* v8 ignore next 3 */
  }
  return `${typeof value}`;
}

function formatArrayLike(
  arrayLike: Array<unknown> | Set<unknown>,
  pretty: boolean = false,
  colored: boolean = false,
  inner: number = 0,
  ct: CircularTracker,
): string {
  ct.add(arrayLike);
  const results: string[] = [];
  for (const elem of arrayLike) {
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
  if (ct.isCircular(arrayLike)) {
    ref = `<ref${ct.indexOf(arrayLike)}>`;
  }
  if (pretty) {
    const indent = ' '.repeat((inner + 1) * 2);
    return `${ref ? Ansi.blue(ref) : ''}[\n${indent}${results.join(`,\n${indent}`)}\n${' '.repeat((inner) * 2)}]`;
  }
  if (arrayLike instanceof Set) {
    return `${ref}Set(${arrayLike.size}) { ${results.join(', ')} }`;
  }
  return `${ref}[ ${results.join(', ')} ]`;
}

function formatObject(
  obj: object,
  pretty: boolean = false,
  colored: boolean = false,
  inner: number = 0,
  ct: CircularTracker,
): string {
  if (obj instanceof Set) {
    return formatArrayLike(obj, pretty, colored, inner, ct);
  }
  ct.add(obj);
  const results: string[] = [];
  for (const [key, elem] of getAllEntries(obj)) {
    if (typeof elem === 'object' && elem !== null && ct.has(elem)) {
      ct.setAsCircular(elem);
      const ref = ct.indexOf(elem);
      results.push(`${key}: ${colored ?
        `[${Ansi.cyan('Circular')} ${Ansi.blue(`ref${ref}`)}]` :
        `[Circular ref${ref}]`
      }`);
    } else {
      if (obj instanceof Map) {
        results.push(`\'${key}\' => ${formatAny(elem, pretty, colored, inner + 1, ct)}`);
      } else {
        results.push(`${key}: ${formatAny(elem, pretty, colored, inner + 1, ct)}`);
      }
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
  if (obj instanceof Map) {
    return `${ref}Map(${obj.size}) { ${results.join(', ')} }`;
  }
  return `${ref}{ ${results.join(', ')} }`;
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
export function formatLogLevel(level: LogLevelType, colored: boolean = false): string {
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
  return LogLevelName[level];
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
export function formatPrefix(ts: Date, level: LogLevelType, name: string, colored: boolean = false): string {
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
export function getAllEntries(obj: object): [string, unknown][] | MapIterator<[string, unknown]> {
  if (obj instanceof Map) {
    return obj.entries();
  }
  const properties: [string, unknown][] = [];
  let currentObj = obj;

  while (currentObj !== Object.prototype && currentObj !== null) {
    Object.getOwnPropertyNames(currentObj).forEach((key) => {
      let value;
      try {
        const descriptor = Object.getOwnPropertyDescriptor(currentObj, key);
        if (descriptor) {
          if ('value' in descriptor) {
            value = descriptor.value;
          } else {
            value = descriptor.get ? descriptor.get.call(currentObj) : 'Property Descriptor has no get method!!!';
          }
        } else {
          value = 'Property inaccessible';
        }
      } catch {
        value = 'Property inaccessible';
      }
      properties.push([key, value]);
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
    // eslint-disable-next-line unused-imports/no-unused-vars
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
