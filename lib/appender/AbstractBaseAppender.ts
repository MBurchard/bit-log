import type {IAppender, ILogEvent, LogLevel} from '../definitions.js';
import {isPresent} from '../definitions.js';
import {formatAny, formatISO8601, formatLogLevel, truncateOrExtend} from '../utils.js';

export abstract class AbstractBaseAppender implements IAppender {
  level?: LogLevel;

  formatAny = formatAny;

  formatLogLevel = formatLogLevel;

  formatPrefix(ts: Date, level: LogLevel, name: string, colored: boolean = false): string {
    let formattedLevel;
    if (colored) {
      formattedLevel = this.formatLogLevel(level, colored).padStart(13, ' ');
    } else {
      formattedLevel = this.formatLogLevel(level).padStart(5, ' ');
    }
    return `${this.formatTimestamp(ts)} ${formattedLevel} [${truncateOrExtend(name, 20)}]:`;
  }

  formatTimestamp = formatISO8601;

  abstract handle(event: ILogEvent): Promise<void>;

  willHandle(event: ILogEvent): boolean {
    return !isPresent(this.level) || event.level >= this.level;
  }
}
