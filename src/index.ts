/**
 * src/index.ts
 *
 * @file bit-Log
 * @author Martin Burchard
 */

import {ConsoleAppender} from './appender/ConsoleAppender';
import type {AppenderConfig, IAppender, ILogger, LoggingConfig} from './definitions';
import {isAppenderConfig, isPresent, LogLevel, toLogLevel} from './definitions';
import {Logger} from './logger';
import {getClassHierarchy} from './utils';

const LoggerRegistry: Record<string, Logger> = {};
const AppenderRegistry: Record<string, IAppender> = {};

const log = useLogger('bit.log', LogLevel.INFO);
configureLogging({
  appender: {
    'CONSOLE': {
      class: ConsoleAppender,
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
          log.info(`registering appender '${appenderName}' to logger '${loggerName}'`);
          logger.addAppender(appenderName, AppenderRegistry[appenderName], true);
        }
      } else {
        log.warn(`Appender named '${appenderName}' is not configured. Can't be used in logger '${loggerName}'`);
      }
    }
    for (const appenderName in logger.appender) {
      if (!appender.includes(appenderName)) {
        delete logger.appender[appenderName];
        log.info(`appender '${appenderName}' was removed from logger '${loggerName}'`);
      }
    }
  } else {
    for (const appenderName in logger.appender) {
      delete logger.appender[appenderName];
      log.info(`appender '${appenderName}' was removed from logger '${loggerName}'`);
    }
  }
}

/**
 * Helper function to display the appender config more or less correctly in the unlikely case of an error
 *
 * @param config
 */
function asString(config: AppenderConfig): string {
  let result = '{';
  let first = true;
  for (const [key, value] of Object.entries(config)) {
    result += `${!first ? ', ' : ''}${key}: ${key === 'class' ? getClassHierarchy(value) : JSON.stringify(value)}`;
    first = false;
  }
  return `${result}}`;
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
          const instance = new appenderConfig.class();
          if (isPresent(appenderConfig.level)) {
            instance.level = toLogLevel(appenderConfig.level);
          }
          for (const [key, value] of Object.entries(appenderConfig)) {
            if (key !== 'class' && key !== 'level') {
              instance[key as keyof IAppender] = value;
            }
          }
          if (appenderName in AppenderRegistry) {
            log.debug('found existing appender:', appenderName, 'search and replace it');
            for (const [loggerName, logger] of Object.entries(LoggerRegistry)) {
              if (appenderName in logger.appender) {
                log.info('Replace appender', appenderName, 'in logger', loggerName || 'ROOT');
                logger.addAppender(appenderName, instance, true);
              }
            }
          }
          AppenderRegistry[appenderName] = instance;
        } catch (e) {
          throw Error(`illegal appender config ${asString(appenderConfig)}, error: ${e}`);
        }
      } else {
        throw Error(`illegal appender config ${asString(appenderConfig)}`);
      }
    }
  }
  if (isPresent(config.root)) {
    log.debug('configure ROOT logger');
    const root = useLogger('') as Logger;
    if (isPresent(config.root.level)) {
      const level = toLogLevel(config.root.level);
      if (root.level !== level) {
        log.info('changing ROOT logger level from', root.level, 'to', level);
        root.level = level;
      }
    }
    configureAppender(root, config.root.appender);
  }
  if (isPresent(config.logger)) {
    log.debug('configure additional loggers');
    for (const [loggerName, loggerConfig] of Object.entries(config.logger)) {
      const logger = useLogger(loggerName, toLogLevel(loggerConfig.level)) as Logger;
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
export function useLogger(name: string, level?: LogLevel): ILogger {
  if (!(name in LoggerRegistry)) {
    if (name === '') {
      LoggerRegistry[name] = new Logger(name);
    } else {
      const parentName = name.includes('.') ? name.substring(0, name.lastIndexOf('.')) : '';
      const parent = useLogger(parentName);
      LoggerRegistry[name] = new Logger(name, parent as Logger);
    }
  }
  const logger = LoggerRegistry[name];
  if (isPresent(level)) {
    logger.level = toLogLevel(level);
  }
  return logger;
}
