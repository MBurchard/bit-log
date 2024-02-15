/**
 * src/index.ts
 *
 * @file Bit-Log
 * @author Martin Burchard
 */

import {ConsoleAppender} from './appender/ConsoleAppender';
import type {IAppender, ILogger, LoggingConfig} from './definitions';
import {isPresent, LogLevel} from './definitions';
import {Logger} from './logger';

const ROOT = new Logger('', undefined, LogLevel.INFO);
const LoggerRegistry: Record<string, ILogger> = {};
const AppenderRegistry: Record<string, IAppender> = {};
const CONSOLE = 'CONSOLE';
AppenderRegistry[CONSOLE] = new ConsoleAppender();
ROOT.addAppender(CONSOLE, AppenderRegistry[CONSOLE]);

/**
 * used to configure the logging. Should be used as early ass possible.
 * See also: @see {@link LoggingConfig}
 *
 * @param {LoggingConfig} config
 */
export function configureLogging(config: LoggingConfig): void {
  ROOT.debug('configure logging');
  if (isPresent(config.appender)) {
    ROOT.debug('configure appender');
    for (const [appenderName, appenderConfig] of Object.entries(config.appender)) {
      if (appenderConfig.class && typeof appenderConfig.class === 'function' && appenderConfig.class.prototype instanceof Object) {
        try {
          const instance = new appenderConfig.class();
          for (const [key, value] of Object.entries(appenderConfig)) {
            if (key !== 'class') {
              instance[key as keyof IAppender] = value;
            }
          }
          if (appenderName in AppenderRegistry) {
            ROOT.debug(`found existing appender: ${appenderName}, search and replace it`);
            if (appenderName in ROOT.appender) {
              ROOT.debug('Replace appender', appenderName, 'in ROOT logger');
              ROOT.addAppender(appenderName, instance, true);
            }
            for (const [loggerName, logger] of Object.entries(LoggerRegistry)) {
              if (!(logger instanceof Logger)) {
                continue;
              }
              if (appenderName in logger.appender) {
                ROOT.debug('Replace appender ', appenderName, 'in logger', loggerName);
                logger.addAppender(appenderName, instance, true);
              }
            }
          }
          AppenderRegistry[appenderName] = instance;
        } catch (e) {
          throw Error(`illegal appender config ${JSON.stringify(appenderConfig)}, error: ${e}`);
        }
      } else {
        throw Error(`illegal appender config ${JSON.stringify(appenderConfig)}`);
      }
    }
  }
  if (isPresent(config.root)) {
    ROOT.debug('configure ROOT logger');

  }
  if (isPresent(config.logger)) {
    ROOT.debug('configure additional loggers');
  }
}

export function useLogger(name: string): ILogger {
  if (name === '') {
    return ROOT;
  }
  if (!(name in LoggerRegistry)) {
    const parentName = name.includes('.') ? name.substring(0, name.lastIndexOf('.')) : '';
    const parent = useLogger(parentName);
    const logger = new Logger(name, parent as Logger);
    LoggerRegistry[name] = logger;
    return logger;
  }
  return LoggerRegistry[name];
}
