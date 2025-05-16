/**
 * src/index.ts
 *
 * @file bit-Log
 * @author Martin Burchard
 */

import type {IAppender, ILogger, LoggingConfig, LogLevel} from './definitions.js';
import {ConsoleAppender} from './appender/ConsoleAppender.js';
import {isAppenderConfig, isPresent} from './definitions.js';
import {Logger} from './logger.js';
import {formatAny} from './utils.js';

const LoggerRegistry: Record<string, Logger> = {};
const AppenderRegistry: Record<string, IAppender> = {};

const log = useLog('bit.log', 'INFO');
configureLogging({
  appender: {
    CONSOLE: {
      Class: ConsoleAppender,
    },
  },
  root: {
    appender: ['CONSOLE'],
    level: 'INFO',
  },
});

function configureAppender(logger: Logger, appender: string[] | undefined) {
  const loggerName = logger.name || 'ROOT';
  if (appender !== undefined) {
    for (const appenderName of appender) {
      if (appenderName in AppenderRegistry) {
        if (!(appenderName in logger.appender)) {
          log.debug(`registering appender '${appenderName}' to logger '${loggerName}'`);
          logger.addAppender(appenderName, AppenderRegistry[appenderName], true);
        }
      } else {
        log.warn(`Appender named '${appenderName}' is not configured. Can't be used in logger '${loggerName}'`);
      }
    }
    for (const appenderName in logger.appender) {
      if (!appender.includes(appenderName)) {
        delete logger.appender[appenderName];
        log.debug(`appender '${appenderName}' was removed from logger '${loggerName}'`);
      }
    }
  } else {
    for (const appenderName in logger.appender) {
      log.debug(`appender '${appenderName}' was removed from logger '${loggerName}'`);
      delete logger.appender[appenderName];
    }
  }
}

/**
 * used to configure the logging. Should be used as early ass possible.
 * See also: @see {@link LoggingConfig}
 *
 * @param {LoggingConfig} config
 */
export function configureLogging(config: LoggingConfig): void {
  log.debug('configure logging');
  if (isPresent(config.appender)) {
    log.debug('configure appender');
    for (const [appenderName, appenderConfig] of Object.entries(config.appender)) {
      if (isAppenderConfig(appenderConfig)) {
        try {
          const instance = new appenderConfig.Class();
          if (isPresent(appenderConfig.level)) {
            instance.level = appenderConfig.level;
          }
          for (const [key, value] of Object.entries(appenderConfig)) {
            if (key !== 'class' && key !== 'level' && isPresent(value)) {
              // @ts-expect-error works as designed, no reason to mark this as error
              instance[key] = value;
            }
          }
          if (appenderName in AppenderRegistry) {
            log.debug('found existing appender:', appenderName, 'search and replace it');
            for (const [loggerName, logger] of Object.entries(LoggerRegistry)) {
              if (appenderName in logger.appender) {
                log.debug('Replace appender', appenderName, 'in logger', loggerName || 'ROOT');
                logger.addAppender(appenderName, instance, true);
              }
            }
          }
          AppenderRegistry[appenderName] = instance;
        } catch (e) {
          throw new Error(`illegal appender config ${formatAny(appenderConfig)}, error: ${e}`);
        }
      } else {
        throw new Error(`illegal appender config ${formatAny(appenderConfig)}`);
      }
    }
  }
  if (isPresent(config.root)) {
    log.debug('configure ROOT logger');
    const root = useLog() as Logger;
    if (isPresent(config.root.level)) {
      const level = config.root.level;
      if (root.level !== level) {
        log.debug('changing ROOT logger level from', root.level, 'to', level);
        root.level = level;
      }
    }
    root.includeCallSite = config.root.includeCallSite ?? false;
    configureAppender(root, config.root.appender);
  }
  if (isPresent(config.logger)) {
    log.debug('configure additional loggers');
    for (const [loggerName, loggerConfig] of Object.entries(config.logger)) {
      const logger = useLog(loggerName, loggerConfig.level) as Logger;
      logger.includeCallSite = loggerConfig.includeCallSite ?? false;
      configureAppender(logger, loggerConfig.appender);
    }
  }
}

/**
 * use a logger.
 *
 * @param {string} name
 * @param {LogLevel} level optional, if not given the level from a parent logger is used
 */
export function useLog(name: string = '', level?: LogLevel): ILogger {
  if (!(name in LoggerRegistry)) {
    if (name === '' || name === 'root') {
      LoggerRegistry[''] = new Logger('');
    } else {
      const parentName = name.includes('.') ? name.substring(0, name.lastIndexOf('.')) : '';
      const parent = useLog(parentName);
      LoggerRegistry[name] = new Logger(name, parent as Logger);
    }
  }
  const logger = LoggerRegistry[name];
  if (isPresent(level)) {
    logger.level = level;
  }
  return logger;
}
