import type {IAppender, ILogEvent} from '../definitions';
import {LogLevel} from '../definitions';

export abstract class AbstractBaseAppender implements IAppender {
  level: LogLevel = LogLevel.OFF;

  abstract handle(event: ILogEvent): Promise<void>;

  willHandle(event: ILogEvent): boolean {
    return event.level >= this.level;
  }
}

