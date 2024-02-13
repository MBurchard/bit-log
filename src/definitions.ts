/**
 * src/definitions.ts
 *
 * @file Definitions for bit-log
 * @author Martin Burchard
 */

type Just<T> = Exclude<T, undefined | null>

export function isPresent<T>(value: T): value is Just<T> {
  return value !== undefined && value !== null;
}

export enum LogLevel {
  'TRACE' = 0,
  'DEBUG' = 10,
  'INFO' = 20,
  'WARN' = 30,
  'ERROR' = 40,
  'FATAL' = 50,
  'OFF' = 1000,
}

export interface ILogger {

  /**
   * the logLevel set for this Logger
   */
  level?: LogLevel;

  /**
   * the name or namespace for this logger
   * Hierarchical loggers are supported by the notation `for.bar.*`
   */
  readonly name: string

  /**
   * The configured appender are finally responsible for the output creation.
   *
   * @param args
   */
  debug(...args: unknown[]): void

  /**
   * Should be used if the output message is to be constructed in a certain way.
   *
   * @param {() => string} msg
   */
  debug(msg: () => string): void

  /**
   * The configured appender are finally responsible for the output creation.
   *
   * @param args
   */
  error(...args: unknown[]): void

  /**
   * Should be used if the output message is to be constructed in a certain way.
   *
   * @param {() => string} msg
   */
  error(msg: () => string): void

  /**
   * The configured appender are finally responsible for the output creation.
   *
   * @param args
   */
  fatal(...args: unknown[]): void

  /**
   * Should be used if the output message is to be constructed in a certain way.
   *
   * @param {() => string} msg
   */
  fatal(msg: () => string): void

  /**
   * The configured appender are finally responsible for the output creation.
   *
   * @param args
   */
  info(...args: unknown[]): void

  /**
   * Should be used if the output message is to be constructed in a certain way.
   *
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
   * The configured appender are finally responsible for the output creation.
   *
   * @param args
   */
  trace(...args: unknown[]): void

  /**
   * Should be used if the output message is to be constructed in a certain way.
   *
   * @param {() => string} msg
   */
  trace(msg: () => string): void

  /**
   * The configured appender are finally responsible for the output creation.
   *
   * @param args
   */
  warn(...args: unknown[]): void

  /**
   * Should be used if the output message is to be constructed in a certain way.
   *
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

export interface IAppender {
  level: LogLevel;
  close?(): void
  handle(event: ILogEvent): Promise<void>
  willHandle(event: ILogEvent): boolean
}

export interface AppenderConfig {
  class: new () => IAppender;
  level?: LogLevel
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: Just<any>
}

export interface LoggerConfig {
  level: LogLevel
  appender?: string[]
}

export interface LoggingConfig {
  root?: LoggerConfig
  logger?: Record<string, LoggerConfig>
  appender?: Record<string, AppenderConfig>
}
