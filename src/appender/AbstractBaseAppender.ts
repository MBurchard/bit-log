import type {IAppender, ILogEvent, LogLevel} from '../definitions.js';
import {isPresent} from '../definitions.js';

export abstract class AbstractBaseAppender implements IAppender {
  level?: LogLevel;

  abstract handle(event: ILogEvent): Promise<void>;

  willHandle(event: ILogEvent): boolean {
    return !isPresent(this.level) || event.level >= this.level;
  }
}
