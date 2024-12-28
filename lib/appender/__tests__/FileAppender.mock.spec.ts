import {readdir, rm} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';

describe('test FileAppender mocked', () => {
  const logDir = path.join(os.tmpdir(), 'bit.log.mock');

  let appender: any;

  beforeEach(async () => {
    vi.mock('node:fs/promises', async () => {
      const actual = await vi.importActual<typeof import('node:fs/promises')>('node:fs/promises');
      return {
        ...actual,
        access: vi.fn(),
      };
    });
    const {mkdir} = await import('node:fs/promises');
    const {FileAppender} = await import('../FileAppender.js');

    // create the logDir for test
    await mkdir(logDir, {recursive: true});
    // create the existing logDir for test
    try {
      const files = await readdir(logDir);
      await Promise.all(
        files.map(async (file) => {
          const childPath = path.join(logDir, file);
          await rm(childPath, {recursive: true});
        }),
      );
      return true;
    } catch (err) {
      console.error('Error in emptyDirectory', err);
    }
    appender = new FileAppender();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.resetAllMocks();
    vi.resetModules();
  });

  it('test error handling in exists', async () => {
    expect(appender).not.toBeNull();
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const {access} = await import('node:fs/promises');
    const {exists} = await import('../FileAppender.js');

    const accessMock = vi.mocked(access);

    accessMock.mockRejectedValueOnce({
      code: 'EEXISTS',
      message: 'Test error in exists',
    });

    const result = await exists(path.join(logDir));

    expect(accessMock).toHaveBeenCalledTimes(1);
    expect(result).toBe(false);
    expect(consoleErrorSpy)
      .toHaveBeenCalledWith(
        `Error accessing path '${logDir}'`,
        {code: 'EEXISTS', message: 'Test error in exists'},
      );
  });

  it('test error handling in canBeAccessed', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const {access} = await import('node:fs/promises');
    const {canBeAccessed} = await import('../FileAppender.js');
    const accessMock = vi.mocked(access);

    accessMock.mockRejectedValueOnce({
      code: 'EACCESS',
      message: 'Test error in access',
    });
    await canBeAccessed(path.join(logDir));
    expect(consoleErrorSpy)
      .toHaveBeenCalledWith(
        `Error accessing path '${logDir}'`,
        {code: 'EACCESS', message: 'Test error in access'},
      );
  });
});
