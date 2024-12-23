import type {Database} from 'better-sqlite3';
import type {ILogEvent, LogLevel} from '../definitions.js';
import os from 'node:os';
import path from 'node:path';
import DatabaseConstructor from 'better-sqlite3';
import {isPresent} from '../definitions.js';
import {formatISO8601} from '../utils.js';
import {AbstractBaseAppender} from './AbstractBaseAppender.js';
import {calcFullFilePath} from './FileAppender.js';

export class SQLiteAppender extends AbstractBaseAppender {
  baseName: string = 'logging';
  extension: string = 'db';
  filePath: string = path.join(os.tmpdir(), 'bit.log');
  private db: Database | undefined;

  constructor(level?: LogLevel) {
    super();
    if (isPresent(level)) {
      this.level = level;
    }
  }

  private async initDB(): Promise<Database | null> {
    if (isPresent(this.db)) {
      return this.db;
    }
    const fullFilePath =
      await calcFullFilePath(this.filePath, this.baseName, this.extension, '');
    if (isPresent(fullFilePath)) {
      try {
        this.db = new DatabaseConstructor(fullFilePath);
        // @formatter:off
        this.db.exec(
          `CREATE TABLE IF NOT EXISTS Logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp DATETIME,
            level TEXT,
            loggerName TEXT,
            payload TEXT
          )`,
        );
        // @formatter:on
        return this.db;
      } catch (err) {
        console.error('Error during SQLiteAppender.initDB', err);
      }
    }
    return null;
  }

  async handle(event: ILogEvent): Promise<void> {
    if (!this.willHandle(event)) {
      return;
    }
    const db = await this.initDB();
    if (!isPresent(db)) {
      return;
    }
    try {
      // @formatter:off
      const insert = db.prepare(
        `INSERT INTO Logs (timestamp, level, loggerName, payload)
        VALUES (?, ?, ?, ?)`,
      );
      const output: string[] = [];
      if (typeof event.payload === 'function') {
        output.push(event.payload());
      } else {
        output.push(...event.payload.map((elem) => {
          return this.formatAny(elem, false, false);
        }));
      }
      // @formatter:on
      insert.run(
        formatISO8601(event.timestamp),
        this.formatLogLevel(event.level),
        event.loggerName,
        output.join(' '),
      );
    } catch (err) {
      console.error('Error during SQLiteAppender.handle', err);
    }
  }
}
