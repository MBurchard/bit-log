import type {IAppender, ILogEvent, LogLevel} from '../definitions.js';
import {isPresent} from '../definitions.js';
import {formatAny, formatISO8601, formatLogLevel, truncateOrExtend, truncateOrExtendLeft} from '../utils.js';

export abstract class AbstractBaseAppender implements IAppender {
  level?: LogLevel;

  formatAny = formatAny;

  formatLogLevel = formatLogLevel;

  formatPrefix(event: ILogEvent, colored: boolean = false): string {
    const levelStr = this.formatLogLevel(event.level, colored);
    const paddedLevel = colored ? levelStr.padStart(13, ' ') : levelStr.padStart(5, ' ');
    const name = truncateOrExtend(event.loggerName, 20);
    const timestamp = this.formatTimestamp(event.timestamp);

    let callSite = '';
    if (event.callSite) {
      const line = String(event.callSite.line).padStart(4, ' ');
      const column = String(event.callSite.column).padStart(2, ' ');
      const path = truncateOrExtendLeft(event.callSite.file, 50);
      callSite = ` (${path}:${line}:${column})`;
    }

    return `${timestamp} ${paddedLevel} [${name}]${callSite}:`;
  }

  formatTimestamp = formatISO8601;

  abstract handle(event: ILogEvent): Promise<void>;

  willHandle(event: ILogEvent): boolean {
    return !isPresent(this.level) || event.level >= this.level;
  }
}
