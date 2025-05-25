/**
 * src/logger.ts
 *
 * @file A hierarchic Logger implementation
 * @author Martin Burchard
 */
import type {IAppender, ILogEvent, ILogger, LogLevel} from './definitions.js';
import {isPresent, toLogLevel} from './definitions.js';

/**
 * A hierarchic Logger implementation
 *
 * @internal
 */
export class Logger implements ILogger {
  readonly appender: Record<string, IAppender> = {};
  private _includeCallSite?: boolean;
  private _level?: LogLevel;
  readonly name: string;
  private readonly parent?: ILogger;

  get includeCallSite(): boolean {
    return this._includeCallSite ?? this.parent?.includeCallSite ?? false;
  }

  set includeCallSite(include: boolean) {
    this._includeCallSite = include;
  }

  get level(): LogLevel {
    return this._level ?? this.parent?.level ?? 'ERROR';
  }

  set level(level: LogLevel) {
    this._level = toLogLevel(level);
  }

  /**
   * This Constructor is not intended to be used externally.
   *
   * @internal
   * @param {string} name the logger name, '' is the root logger
   * @param {Logger} parent All except the root logger have a parent
   * @param {LogLevel} level defaults to ERROR
   */
  constructor(name: string, parent?: ILogger, level?: LogLevel) {
    this.name = name;
    this.parent = parent;
    this._level = level;
  }

  private logEvent(level: LogLevel, ...args: unknown[]) {
    if (!this.shouldLog(level)) {
      return;
    }

    let payload;
    if (typeof args[0] === 'function') {
      payload = args[0]();
    } else {
      payload = args;
    }

    const event: ILogEvent = {
      level,
      loggerName: this.name,
      payload,
      timestamp: new Date(),
    };

    if (this.includeCallSite) {
      // eslint-disable-next-line unicorn/error-message
      const stack = new Error().stack?.split('\n');
      const raw = stack?.[3]?.trim();
      const match = raw?.match(/([^\s()]+):(\d+):(\d+)/);
      if (match) {
        event.callSite = {
          file: match[1],
          line: Number(match[2]),
          column: Number(match[3]),
        };
      }
    }

    this.emit(event);
  }

  /**
   * Checks if the given LogLevel is processed by this or a parent logger.
   *
   * @private
   * @param {LogLevel} level
   * @return {boolean} true if this LogLevel should be logged
   */
  shouldLog(level: LogLevel): boolean {
    return toLogLevel(level) >= toLogLevel(this.level);
  }

  /**
   * Add an appender.
   * Appender is only added if the given name is not already registered at this logger instance or if overwrite is set
   * to true
   *
   * @param {string} appenderName name that is used to register the appender
   * @param {IAppender} appender the appender to register
   * @param {boolean} overwrite if a registered appender should be overwritten
   * @return {boolean} true if the given appender has been registered to this logger
   */
  addAppender(appenderName: string, appender: IAppender, overwrite: boolean = false): boolean {
    if (overwrite || !(appenderName in this.appender)) {
      this.appender[appenderName] = appender;
      return true;
    }
    return false;
  }

  /**
   * Remove the appender that has been registered before with that given name.
   *
   * @param {string} appenderName
   * @return {boolean} true if the appender has been removed, false if the given name was not registered
   */
  removeAppender(appenderName: string): boolean {
    if (appenderName in this.appender) {
      delete this.appender[appenderName];
      return true;
    }
    return false;
  }

  /**
   * Log something with LogLevelValue.DEBUG.
   * This method has the same signature as the well-known console.log.
   * Typical loggers or appender will probably, like console.log, combine the given parameters into a string.
   * Of course, this depends on the implementation of the registered appender.
   * If the first parameter is a function, it is executed by the logger as soon as it's certain that the log will not
   * be ignored.
   *
   * @param args
   */
  debug(...args: unknown[]) {
    this.logEvent('DEBUG', ...args);
  }

  /**
   * @see {@link debug}
   * @param args
   */
  error(...args: unknown[]) {
    this.logEvent('ERROR', ...args);
  }

  /**
   * @see {@link debug}
   * @param args
   */
  fatal(...args: unknown[]) {
    this.logEvent('FATAL', ...args);
  }

  /**
   * @see {@link debug}
   * @param args
   */
  info(...args: unknown[]) {
    this.logEvent('INFO', ...args);
  }

  /**
   * This method is used to emit a LogEvent to the registered handlers and the parent logger.
   * The method does not check the log level, this was done beforehand.
   * If this logger has no registered appender or none of the appender want to handle the LogEvent, it is passed "up"
   * to a possibly existing parent logger.
   *
   * @param {ILogEvent} event
   * @return {boolean} true if a registered handler will potentially handle this log event
   */
  emit(event: ILogEvent): boolean {
    let handled = false;
    for (const [appenderName, appender] of Object.entries(this.appender)) {
      if (appender.willHandle(event)) {
        appender.handle(event).catch((reason) => {
          console.error(`error in appender.handle of ${appenderName}`, reason);
        });
        handled = true;
      }
    }
    if (!handled && isPresent(this.parent) && this.parent instanceof Logger) {
      return this.parent.emit(event);
    }
    return handled;
  }

  /**
   * @see {@link debug}
   * @param args
   */
  trace(...args: unknown[]) {
    this.logEvent('TRACE', ...args);
  }

  /**
   * @see {@link debug}
   * @param args
   */
  warn(...args: unknown[]) {
    this.logEvent('WARN', ...args);
  }
}
