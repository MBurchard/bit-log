# bit-log: Yet another logging library for Typescript (and Javascript)

![lang: Typescript](https://img.shields.io/badge/crafted_with-Typescript-blue?logo=typescript)
![GitHub License](https://img.shields.io/github/license/mburchard/bit-log)
![CI: GitHub](https://github.com/MBurchard/bit-log/actions/workflows/ci.yml/badge.svg)
[![Codecov](https://img.shields.io/codecov/c/gh/mburchard/bit-log?logo=codecov)](https://app.codecov.io/gh/MBurchard/bit-log)
[![NPM Version](https://img.shields.io/npm/v/%40mburchard%2Fbit-log?logo=npm)](https://www.npmjs.com/package/@mburchard/bit-log)

## Usage

```javascript
const log = useLog('foo.bar');
log.debug('Here we are, a debug log');
log.info('Here we are, an info log');
try {
  // ...
} catch (e) {
  log.error('error in method ...', e);
}
```

### Configuration

The configuration can be carried out at any time while the code is running; multiple calls and therefore changes are
also possible.

Logging is configured as follows by default:

```javascript
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
```
#### Additional Loggers

You can configure any number of additional hierarchical loggers.
```javascript
configureLogging({
  logger: {
    'foo.bar': {
      level: 'DEBUG',
    },
  },
});
```
After this configuration you have 3 loggers, all of which can be used as required.
```javascript
const log = useLog(); // get the root logger
const fooLogger = useLog('foo');
const barLogger = useLog('foo.bar');
```
All three loggers are using the existing ConsoleAppender, which is registered on the root logger.

However, you do not have to preconfigure the loggers. You can get new hierarchical loggers at any time, which then take
over the configuration from existing parents. If nothing else is available, then at the end from the root logger.

You can also change the level when accessing a logger. However, it is not recommended to do this, as this distributes
the configuration across the entire code base. Log levels should be configured centrally, in other words by calling
`configureLogging`.

It is of course also possible to completely overwrite the default configuration, i.e. to customise the root logger and
register a different appender than the `ConsoleAppender`.

#### Additional Appender

Just like the loggers, you can also configure additional appender. These must then be registered on a logger.
You can also register them on several loggers.
If you use one of the logging methods of a logger, a LogEvent is created. This is bubbled up the hierarchy until an
appender takes care of it. If this has happened, it is not passed up further.

You could add a hypothetical SQLiteAppender to the root logger this way:
```javascript
configureLogging({
  appender: {
    CONSOLE: {
      Class: ConsoleAppender,
    },
    SQLITE: {
      Class: SQLiteAppender,
      level: 'WARN',
    },
  },
  root: {
    appender: ['CONSOLE', 'SQLITE'],
    level: 'INFO',
  },
});
```

#### Overwrite Formatting

Bit-Log is designed to be easy to use and extremely flexible. It is therefore possible to influence the formatting of
the output for each appender.

```javascript
configureLogging({
  appender: {
    CONSOLE: {
      Class: ConsoleAppender,
      formatLogLevel: (level: LogLevel, colored: boolean) => {
        return 'what ever you want';
      },
      formatPrefix: (ts: Date, level: LogLevel, name: string, colored: boolean) => {
        return 'what ever you want';
      },
      formatTimestamp: (date: Date) => {
        return 'what ever you want';
      }
    },
  },
  root: {
    appender: ['CONSOLE'],
    level: 'INFO',
  },
});
```

In the source code you can see how the formatting interlocks. The method names are almost self-explanatory except
perhaps the method `formatPrefix`.

```typescript
function formatPrefix(ts: Date, level: LogLevel, name: string, colored: boolean = false): string {
  let formattedLevel;
  if (colored) {
    formattedLevel = this.formatLogLevel(level, colored).padStart(13, ' ');
  } else {
    formattedLevel = this.formatLogLevel(level).padStart(5, ' ');
  }
  return `${this.formatTimestamp(ts)} ${formattedLevel} [${truncateOrExtend(name, 20)}]:`;
}
```

### `ConsoleAppender`

As the name states, this appender writes to the console.  
It has three properties.

`colored: boolean`  
Specifies whether logs should be formatted with colors. By default, this property is set to `false`.

`pretty: boolean`  
Specifies whether objects to be output should be formatted nicely, i.e. with indents and breaks.
By default, this property is set to `false`.

`useSpecificMethods: boolean`  
The JavaScript console has specific methods that match the log levels, such as `console.info` or `console.error`.
You can use these or `console.log`.  
The specific methods may not appear in the browser console, such as `console.debug`.  
By default, this property is set to `false`.

### `FileAppender`

This appender of course writes to a file and cannot be used in the browser environment.

This implementation is *rolling*, as the name of the output file is calculated from the timestamp for each log event.
This means that the appender switches to a new file after midnight.  
If you do not want this, you can simply overwrite the `getTimestamp` method as described above. You can also implement
an hourly rolling output in the same way.

The FileAppender has the following properties.

`baseName: string`  
Specifies a base name for the output file. By default, this property is set to an empty string.

The baseName can be empty as long as the `getTimestamp` method does not return an empty string.  
You can therefore combine both, or use both individually.

```text
combined: MyLog-2024-05-13.log
baseName only: MyLog.log
timestamp only: 2024-05-13.log
```

`colored: boolean`  
Specifies whether logs should be formatted with colors. By default, this property is set to `false`.

`extension: string`  
Specifies the file extension. By default, this property is set to `log`.

`filePath: string`  
Specifies the file path. By default, this property is set to the OS default temp folder plus `bit.log`.

**Attention:** For security reasons, the FileAppender does not create directories.

`pretty: boolean`  
Specifies whether objects to be output should be formatted nicely, i.e. with indents and breaks.
By default, this property is set to `false`.

## Todo

  - [x] Improve log output
  - [x] Documentation
  - [x] FileAppender
