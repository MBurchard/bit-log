import type {ILogEvent} from '../definitions';
import {isPresent} from '../definitions';
import {LogLevel} from '../definitions';
import {formatPrefix} from '../utils';
import {AbstractBaseAppender} from './AbstractBaseAppender';

export class ConsoleAppender extends AbstractBaseAppender {
  private _useSpecificMethods: boolean = false;

  constructor(level?: LogLevel) {
    super();
    if (isPresent(level)) {
      this.level = level;
    }
  }

  get useSpecificMethods(): boolean {
    return this._useSpecificMethods;
  }

  set useSpecificMethods(value: boolean) {
    if (value) {
      console.info('Depending on the user\'s browser settings, specific console log methods may prevent',
        'certain messages from appearing in the console.');
    }
    this._useSpecificMethods = value;
  }

  async handle(event: ILogEvent): Promise<void> {
    if (event.level < this.level) {
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
        default:
          loggingMethod = console.log;
      }
    }
    const prefix = formatPrefix(event.level, event.loggerName);
    if (typeof event.payload === 'function') {
      loggingMethod(prefix, event.payload());
    } else {
      loggingMethod(prefix, ...event.payload);
    }
  }
}
