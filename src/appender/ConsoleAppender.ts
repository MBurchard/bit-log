/* eslint-disable no-console */
import type {ILogEvent} from '../definitions.js';
import {LogLevel, isPresent} from '../definitions.js';
import {formatAny, formatPrefix} from '../utils.js';
import {AbstractBaseAppender} from './AbstractBaseAppender.js';

export class ConsoleAppender extends AbstractBaseAppender {
  colored: boolean = false;
  pretty: boolean = false;

  constructor(level?: LogLevel) {
    super();
    if (isPresent(level)) {
      this.level = level;
    }
  }

  private _useSpecificMethods: boolean = false;

  get useSpecificMethods(): boolean {
    return this._useSpecificMethods;
  }

  set useSpecificMethods(value: boolean) {
    if (value) {
      console.info(
        'Depending on the user\'s browser settings, specific console log methods may prevent',
        'certain messages from appearing in the console.',
      );
    }
    this._useSpecificMethods = value;
  }

  async handle(event: ILogEvent): Promise<void> {
    if (!this.willHandle(event)) {
      return;
    }
    let loggingMethod = console.log;
    if (this._useSpecificMethods) {
      switch (event.level) {
        case LogLevel.DEBUG:
          loggingMethod = console.debug;
          break;
        case LogLevel.ERROR:
          loggingMethod = console.error;
          break;
        case LogLevel.FATAL:
          loggingMethod = console.error;
          break;
        case LogLevel.INFO:
          loggingMethod = console.info;
          break;
        case LogLevel.TRACE:
          loggingMethod = console.trace;
          break;
        case LogLevel.WARN:
          loggingMethod = console.warn;
          break;
      }
    }
    const prefix = formatPrefix(event.level, event.loggerName, this.colored);
    if (typeof event.payload === 'function') {
      loggingMethod(prefix, event.payload());
    } else {
      loggingMethod(prefix, ...event.payload.map((elem) => {
        return formatAny(elem, this.pretty, this.colored);
      }));
    }
  }
}
