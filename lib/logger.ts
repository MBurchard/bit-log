/**
 * src/logger.ts
 *
 * @file A hierarchic Logger implementation
 * @author Martin Burchard
 */
import type {IAppender, ILogEvent, ILogger, LogLevelType} from './definitions.js';
import {isPresent, LogLevel} from './definitions.js';

/**
 * A hierarchic Logger implementation
 *
 * @internal
 */
export class Logger implements ILogger {
  private readonly parent?: ILogger;
  readonly appender: Record<string, IAppender> = {};
  level: LogLevelType;
  readonly name: string;

  /**
   * This Constructor is not intended to be used externally.
   *
   * @internal
   * @param {string} name the logger name, '' is the root logger
   * @param {Logger} parent All except the root logger have a parent
   * @param {LogLevelType} level defaults to LogLevel.ERROR
   */
  constructor(name: string, parent?: ILogger, level?: LogLevelType) {
    this.name = name;
    this.parent = parent;
    this.level = level ?? parent?.level ?? LogLevel.ERROR;
  }

  private logEvent(level: LogLevelType, ...args: unknown[]) {
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
    this.emit(event);
  }

  /**
   * Checks if the given LogLevel is processed by this or a parent logger.
   *
   * @private
   * @param {LogLevelType} level
   * @return {boolean} true if this LogLevel should be logged
   */
  shouldLog(level: LogLevelType): boolean {
    return level >= this.level;
  }

  /**
   * Add an appender.
   * Appender is only added, if the given name is not already registered at this logger instance or if overwrite is set
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
   * Remove the appender, that has been registered before with that given name.
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
   * Log something with LogLevel.DEBUG.
   * This method has the same signature as the well-known console.log.
   * Typical loggers or appender will probably, like console.log, combine the given parameters into a string.
   * Of course, this depends on the implementation of the registered appender.
   * If the first parameter is a function, it is executed by the logger as soon as it's certain that the log will not
   * be ignored.
   *
   * @param args
   */
  debug(...args: unknown[]) {
    this.logEvent(LogLevel.DEBUG, ...args);
  }

  /**
   * @see {@link debug}
   * @param args
   */
  error(...args: unknown[]) {
    this.logEvent(LogLevel.ERROR, ...args);
  }

  /**
   * @see {@link debug}
   * @param args
   */
  fatal(...args: unknown[]) {
    this.logEvent(LogLevel.FATAL, ...args);
  }

  /**
   * @see {@link debug}
   * @param args
   */
  info(...args: unknown[]) {
    this.logEvent(LogLevel.INFO, ...args);
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
    this.logEvent(LogLevel.TRACE, ...args);
  }

  /**
   * @see {@link debug}
   * @param args
   */
  warn(...args: unknown[]) {
    this.logEvent(LogLevel.WARN, ...args);
  }
}
