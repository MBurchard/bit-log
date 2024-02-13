import type {IAppender, ILogEvent} from '../definitions';
import {LogLevel} from '../definitions';

export abstract class AbstractBaseAppender implements IAppender {
  /**
   * log everything
   */
  level: LogLevel = LogLevel.TRACE;

  abstract handle(event: ILogEvent): Promise<void>;

  willHandle(event: ILogEvent): boolean {
    return event.level >= this.level;
  }
}

