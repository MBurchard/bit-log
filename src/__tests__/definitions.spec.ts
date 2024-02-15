import type {IAppender} from '../definitions';
import {isAppenderConfig, isPresent} from '../definitions';

describe('test definitions', () => {
  it('isAppenderConfig', () => {
    class Test implements IAppender {
      async handle(): Promise<void> {
      }

      willHandle(): boolean {
        return false;
      }
    }

    expect(isAppenderConfig({class: Test})).toBe(true);
  });

  it('isPresent', () => {
    expect(isPresent(undefined)).toBe(false);
    expect(isPresent(null)).toBe(false);
    expect(isPresent('')).toBe(true);
    expect(isPresent(0)).toBe(true);
  });
});
