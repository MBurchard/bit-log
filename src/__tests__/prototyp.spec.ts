import * as process from 'node:process';

/**
 * Get all properties of an object and don't care about enumerable or prototyp.
 *
 * @internal
 * @param {object} obj
 * @return {[string, unknown][]}
 */
export function getAllProperties(obj: object): [string, unknown][] {
  const properties: [string, unknown][] = [];
  const prototypChain: string[] = [];
  let currentObj = obj;

  while (currentObj !== Object.prototype && currentObj !== null) {
    Object.getOwnPropertyNames(currentObj).forEach((key) => {
      if (prototypChain.length > 0) {
        // @ts-expect-error I want it this way!
        properties.push([`${prototypChain.join('.')}.${key}`, currentObj[key]]);
      } else {
        // @ts-expect-error I want it this way!
        properties.push([key, currentObj[key]]);
      }
    });
    currentObj = Object.getPrototypeOf(currentObj);
    prototypChain.push('prototyp');
  }
  return properties;
}

class Parent {
  message: string;

  constructor(message: string) {
    this.message = message;
  }
}

class Child extends Parent {
  code: number;

  constructor(message: string, code: number) {
    super(message);
    this.code = code;
  }
}

describe('test prototyp inheritance', () => {
  it('child should have 2 properties', () => {
    const child = new Child('my message', 200);
    expect(child.message).toBe('my message');
    expect(child.code).toBe(200);

    for (const [key, elem] of getAllProperties(child)) {
      process.stdout.write(`${key}: ${elem}\n`);
    }
  });

  it('error should not have 2 message properties', () => {
    const err = new Error('This is a standard error object');
    for (const [key, elem] of getAllProperties(err)) {
      process.stdout.write(`${key}: ${elem}\n`);
    }
  });
});
