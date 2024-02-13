import {isPresent} from '../definitions';

describe('test definitions', () => {
  it('isPresent', () => {
    expect(isPresent(undefined)).toBe(false);
    expect(isPresent(null)).toBe(false);
    expect(isPresent('')).toBe(true);
    expect(isPresent(0)).toBe(true);
  });
});
