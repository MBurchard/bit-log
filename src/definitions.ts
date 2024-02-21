/**
 * src/definitions.ts
 *
 * @file Definitions for bit-log
 * @author Martin Burchard
 */

/**
 * Checks if the value is 'something' but neither null nor undefined.
 *
 * @param value
 */
export function isPresent<T>(value: T): value is NonNullable<T> {
  return value !== undefined && value !== null;
}

/**
 * Log level type strings.
 */
export type LogLevelString = 'DEBUG' | 'ERROR' | 'FATAL' | 'INFO' | 'OFF' | 'TRACE' | 'WARN';

/**
 * Log level definition.
 */
export enum LogLevel {
  'TRACE' = 0,
  'DEBUG' = 10,
  'INFO' = 20,
  'WARN' = 30,
  'ERROR' = 40,
  'FATAL' = 50,
  'OFF' = 1000
}

/**
 * Get LogLevel for the given log level string.
 *
 * @internal
 * @param {LogLevelString | LogLevel} value
 * @throws {Error} an error if the given string is not a valid LogLevel
 */
export function toLogLevel(value: undefined): undefined;
export function toLogLevel(value: LogLevelString | LogLevel): LogLevel;
export function toLogLevel(value: LogLevelString | LogLevel | undefined): LogLevel | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (typeof value === 'string' && value in LogLevel) {
    return LogLevel[value];
  }
  if (typeof value === 'number') {
    const values = Object.values(LogLevel);
    if (values.includes(value)) {
      return value;
    }
  }
  throw new Error(`not a valid LogLevel: '${value}'`);
}

/**
 * A logger interface.
 */
export interface ILogger {

  /**
   * the logLevel set for this Logger
   */
  level?: LogLevel;

  /**
   * the name or namespace for this logger<br>
   */
  readonly name: string

  /**
   * Used to log a debug message.<br>
   * The signature is well known from console.log,<br>
   * The registered appender are finally responsible for handling these args.
   *
   * @param args
   */
  debug(...args: unknown[]): void

  /**
   * Used to log a debug message.<br>
   * Can be used if the output message has to be a concatenated String and the `...args` approach does not fit.
   *
   * @param {() => string} msg
   */
  debug(msg: () => string): void

  /**
   * Used to log an error message.<br>
   *
   * @see {@link debug}
   * @param args
   */
  error(...args: unknown[]): void

  /**
   * Used to log an error message.<br>
   *
   * @see {@link debug}
   * @param {() => string} msg
   */
  error(msg: () => string): void

  /**
   * Used to log a fatal error message.<br>
   *
   * @see {@link debug}
   * @param args
   */
  fatal(...args: unknown[]): void

  /**
   * Used to log a fatal error message.<br>
   *
   * @see {@link debug}
   * @param {() => string} msg
   */
  fatal(msg: () => string): void

  /**
   * Used to log an info message.<br>
   *
   * @see {@link debug}
   * @param args
   */
  info(...args: unknown[]): void

  /**
   * Used to log an info message.<br>
   *
   * @see {@link debug}
   * @param {() => string} msg
   */
  info(msg: () => string): void

  /**
   * true if the log level is greater or equal to the LogLevel of the logger
   *
   * @param {LogLevel} level
   * @return {boolean}
   */
  shouldLog(level: LogLevel): boolean

  /**
   * Used to log a trace message.<br>
   *
   * @see {@link debug}
   * @param args
   */
  trace(...args: unknown[]): void

  /**
   * Used to log a trace message.<br>
   *
   * @see {@link debug}
   * @param {() => string} msg
   */
  trace(msg: () => string): void

  /**
   * Used to log a warn message.<br>
   *
   * @see {@link debug}
   * @param args
   */
  warn(...args: unknown[]): void

  /**
   * Used to log a warn message.<br>
   *
   * @see {@link debug}
   * @param {() => string} msg
   */
  warn(msg: () => string): void
}

export interface ILogEvent {

  /**
   * LogLevel of the triggering logger
   */
  level: LogLevel
  /**
   * Name(space) of the triggering logger
   */
  loggerName: string
  /**
   * What to log
   */
  payload: unknown[] | (() => string)
  /**
   * Timestamp at the moment of creation
   */
  timestamp: Date
}

/**
 * The appender interface
 */
export interface IAppender {

  /**
   * The level that the appender will handle
   */
  level?: LogLevel;

  /**
   * Some appender may need a close method at the end
   */
  close?(): void

  /**
   * This method does what ever is needed for that specific appender.
   *
   * @async
   * @param {ILogEvent} event
   */
  handle(event: ILogEvent): Promise<void>

  /**
   * Method to check whether the appender is likely to process the LogEvent.<br>
   * Likely because the handle method is asynchronous, and as you know, anything can happen.
   *
   * @param event
   */
  willHandle(event: ILogEvent): boolean
}

/**
 * Appender configuration
 */
export interface AppenderConfig {
  class: new () => IAppender;
  level?: LogLevel | LogLevelString
  [key: string]: undefined | NonNullable<unknown>
}

/**
 * Helper function to check whether it is potentially an AppenderConfig.
 *
 * @internal
 * @param sth
 */
export function isAppenderConfig<T extends AppenderConfig>(sth: NonNullable<T>): sth is NonNullable<T> {
  return isPresent(sth.class) && typeof sth.class === 'function' && sth.class.prototype instanceof Object;
}

/**
 * Logger configuration
 */
export interface LoggerConfig {
  level: LogLevel | LogLevelString
  appender?: string[]
}

/**
 * Logging configuration
 *
 * @example
 * const config: LoggingConfig = {
 *   appender: {
 *     'CONSOLE': {
 *       class: ConsoleAppender,
 *     },
 *     'FILE': {
 *       class: FutureFileAppender,
 *       level: 'INFO',
 *       filename: 'app.log',
 *       useAnsi: false,
 *     },
 *     'CUSTOM': {
 *       class: CustomAppender,
 *       url: '...',
 *     },
 *   },
 *   root: {
 *     level: 'INFO',
 *     appender: ['CONSOLE', 'FILE'],
 *   },
 *   logger: {
 *     'foo': {
 *       level: 'ERROR',
 *     },
 *     'foo.bar': {
 *       level: LogLevel.DEBUG,
 *       appender: ['CUSTOM'],
 *     },
 *   },
 * };
 */
export interface LoggingConfig {
  root?: LoggerConfig
  logger?: Record<string, LoggerConfig>
  appender?: Record<string, AppenderConfig>
}
