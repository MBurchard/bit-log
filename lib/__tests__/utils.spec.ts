import timezoneMock from 'timezone-mock';
import {describe, expect, it, vi} from 'vitest';
import {Ansi} from '../ansi.js';
import {
  CircularTracker,
  formatAny,
  formatISO8601,
  formatLogLevel,
  formatPrefix,
  getAllEntries,
  getClassHierarchy,
  isClass,
  truncateMiddle,
  truncateOrExtend,
} from '../utils.js';

describe('test utils', () => {
  // noinspection DuplicatedCode
  it('formatLogLevel TRACE', () => {
    expect(formatLogLevel('TRACE', true)).toBe('\x1B[90mTRACE\x1B[m');
  });

  it('formatLogLevel DEBUG', () => {
    expect(formatLogLevel('DEBUG', true)).toBe('\x1B[37mDEBUG\x1B[m');
  });

  it('formatLogLevel INFO', () => {
    expect(formatLogLevel('INFO', true)).toBe('\x1B[92mINFO\x1B[m');
  });

  // noinspection DuplicatedCode
  it('formatLogLevel WARN', () => {
    expect(formatLogLevel('WARN', true)).toBe('\x1B[93mWARN\x1B[m');
  });

  it('formatLogLevel ERROR', () => {
    expect(formatLogLevel('ERROR', true)).toBe('\x1B[91mERROR\x1B[m');
  });

  it('formatLogLevel FATAL', () => {
    expect(formatLogLevel('FATAL', true)).toBe('\x1B[95mFATAL\x1B[m');
  });

  it('formatLogLevel OFF', () => {
    expect(formatLogLevel('OFF', true)).toBe('OFF');
  });

  // noinspection DuplicatedCode
  it('formatLogLevel TRACE without color', () => {
    expect(formatLogLevel('TRACE')).toBe('TRACE');
  });

  it('formatLogLevel DEBUG without color', () => {
    expect(formatLogLevel('DEBUG')).toBe('DEBUG');
  });

  it('formatLogLevel INFO without color', () => {
    expect(formatLogLevel('INFO')).toBe('INFO');
  });

  // noinspection DuplicatedCode
  it('formatLogLevel WARN without color', () => {
    expect(formatLogLevel('WARN')).toBe('WARN');
  });

  it('formatLogLevel ERROR without color', () => {
    expect(formatLogLevel('ERROR')).toBe('ERROR');
  });

  it('formatLogLevel FATAL without color', () => {
    expect(formatLogLevel('FATAL')).toBe('FATAL');
  });

  it('formatISO8601', () => {
    const date = new Date();
    expect(formatISO8601(date)).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}[+-]\d{2}:\d{2}$/);
  });

  it('formats ISO8601 correctly with a positive timezone offset', () => {
    timezoneMock.register('Etc/GMT-2');
    const date = new Date('2024-07-01T12:34:56.789Z');

    const result = formatISO8601(date);
    expect(result).toBe('2024-07-01T14:34:56.789+02:00');

    timezoneMock.unregister();
  });

  it('formats ISO8601 correctly with a negative timezone offset', () => {
    timezoneMock.register('Etc/GMT+5');
    const date = new Date('2024-12-23T12:34:56.789Z');

    const result = formatISO8601(date);
    expect(result).toBe('2024-12-23T07:34:56.789-05:00');

    timezoneMock.unregister();
  });

  it('truncateMiddle if string is shorter then the given limit', () => {
    expect(truncateMiddle('to short', 10)).toBe('to short');
  });

  it('truncateMiddle if string has exactly the same length as the given limit', () => {
    expect(truncateMiddle('exactly 10', 10)).toBe('exactly 10');
  });

  it('truncateMiddle if string is longer then the given limit', () => {
    expect(truncateMiddle('longer then', 10)).toBe('long...hen');
  });

  it('truncateOrExtend if string is shorter then the given limit', () => {
    expect(truncateOrExtend('to short', 10)).toBe('to short  ');
  });

  it('formatPrefix with 5 chars log level', () => {
    const date = new Date('2024-05-08T12:30:45.678');
    expect(formatPrefix(date, 'DEBUG', 'foo.bar', true))
      .toMatch(/^2024-05-08T\d{2}:30:45.678[+-]\d{2}:\d{2}\s.+?\s\[.{20}]:$/);
  });

  it('formatPrefix with 4 chars log level', () => {
    const date = new Date('2024-05-08T12:30:45.678');
    expect(formatPrefix(date, 'INFO', 'foo.bar', true))
      .toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}[+-]\d{2}:\d{2}\s{2}.+?\s\[.{20}]:$/);
  });

  it('formatPrefix with 5 chars log level without color', () => {
    const date = new Date('2024-05-08T12:30:45.678');
    expect(formatPrefix(date, 'DEBUG', 'foo.bar'))
      .toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}[+-]\d{2}:\d{2}\sDEBUG\s\[.{20}]:$/);
  });

  it('formatPrefix with 4 chars log level without color', () => {
    const date = new Date('2024-05-08T12:30:45.678');
    expect(formatPrefix(date, 'INFO', 'foo.bar'))
      .toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}[+-]\d{2}:\d{2}\s{2}INFO\s\[.{20}]:$/);
  });

  describe('test getClassHierarchy', () => {
    it('classB extends classA', () => {
      class ClassA {
        someValue?: string;
      }

      class ClassB extends ClassA {
        constructor(x: string) {
          super();
          this.someValue = x;
        }
      }

      expect(getClassHierarchy(ClassB)).toBe('[class ClassB extends ClassA]');
    });

    it('should not work with function', () => {
      function test() {}

      expect(getClassHierarchy(test)).toBe('no class');
    });

    it('should not work with arrow function', () => {
      expect(getClassHierarchy(() => {})).toBe('no class');
    });
  });

  describe('test formatAny', () => {
    it('should format undefined', () => {
      expect(formatAny(undefined)).toBe('undefined');
    });

    it('should format null', () => {
      expect(formatAny(null)).toBe('null');
    });

    it('should format a string', () => {
      const str = 'Hallo Welt';
      expect(formatAny(str)).toBe(str);
    });

    it('should format boolean', () => {
      expect(formatAny(false)).toBe('false');
      expect(formatAny(true)).toBe('true');
    });

    it('should format a number', () => {
      expect(formatAny(2)).toBe('2');
      expect(formatAny(7.37)).toBe('7.37');
    });

    it('should format an array', () => {
      const arr = [null, undefined, 'Test', false, 200, 123456789012345678901234567890n];
      expect(formatAny(arr)).toBe('[ null, undefined, \'Test\', false, 200, 123456789012345678901234567890 ]');
    });

    it('should format an array colored', () => {
      const arr = [null, undefined, 'Test', false, 200, 123456789012345678901234567890n];
      expect(formatAny(arr, false, true))
        .toBe(`[ ${Ansi.bold('null')}, ${Ansi.darkGray('undefined')}, ${Ansi.darkGreen('\'Test\'')}, ${Ansi
          .darkYellow('false')}, ${Ansi.darkCyan('200')}, ${Ansi.cyan('123456789012345678901234567890')} ]`);
    });

    it('should format an array pretty', () => {
      expect(formatAny([null, undefined, 'Test', false, 200], true))
        .toBe('[\n  null,\n  undefined,\n  \'Test\',\n  false,\n  200\n]');
    });

    it('should format a Set', () => {
      const set = new Set([null, undefined, 'Test', false, 200, 123456789012345678901234567890n]);
      expect(formatAny(set)).toBe('Set(6) { null, undefined, \'Test\', false, 200, 123456789012345678901234567890 }');
    });

    it('should format a Map', () => {
      const map = new Map([['key1', 'value1'], ['key2', 'value2']]);
      expect(formatAny(map)).toBe('Map(2) { \'key1\' => \'value1\', \'key2\' => \'value2\' }');
    });

    it('should format an object', () => {
      const obj = {key: 'value', num: 12.333, bool: false, bad: null, worse: undefined};
      expect(formatAny(obj)).toBe('{ key: \'value\', num: 12.333, bool: false, bad: null, worse: undefined }');
    });

    it('should format an object colored', () => {
      const obj = {key: 'value', num: 12.333, bool: false, bad: null};
      expect(formatAny(obj, false, true)).toBe(`{ key: ${Ansi.darkGreen('\'value\'')}, num: ${Ansi
        .darkCyan('12.333')}, bool: ${Ansi.darkYellow('false')}, bad: ${Ansi.bold('null')} }`);
    });

    it('should format an object with an internal object', () => {
      const obj = {child: {prop: true}};
      expect(formatAny(obj)).toBe('{ child: { prop: true } }');
    });

    it('should format an object with an internal Array', () => {
      const result = formatAny({child: [1, 2, 3]});
      expect(result).toBe('{ child: [ 1, 2, 3 ] }');
    });

    it('should format an object with an internal object pretty', () => {
      const result = formatAny({child: {prop: true}}, true);
      expect(result).toBe('{\n  child: {\n    prop: true\n  }\n}');
    });

    it('should format a class', () => {
      abstract class ClassA {
      }

      class ClassB extends ClassA {
      }

      expect(formatAny(ClassB)).toBe('[class ClassB extends ClassA]');
    });

    it('should format a function', () => {
      // this mock is necessary because vitest manipulates the source code...
      const originalToString = Function.prototype.toString;
      // eslint-disable-next-line no-extend-native
      Function.prototype.toString = vi.fn(() => '() => {}');
      expect(formatAny(() => {})).toBe('[Function () => {}]');
      // eslint-disable-next-line no-extend-native
      Function.prototype.toString = originalToString;
    });

    it('should format a function colored', () => {
      // this mock is necessary because vitest manipulates the source code...
      const originalToString = Function.prototype.toString;
      // eslint-disable-next-line no-extend-native
      Function.prototype.toString = vi.fn(() => '() => {}');
      expect(formatAny(() => {}, false, true))
        .toBe(`[${Ansi.blue('Function')} () => {}]`);
      // eslint-disable-next-line no-extend-native
      Function.prototype.toString = originalToString;
    });

    it('should format a long function', () => {
      const func = () => {
        return 42;
      };
      expect(formatAny(func)).toBe('[Function () => {...]');
    });

    it('should format a long function colored', () => {
      const func = () => {
        return 42;
      };
      expect(formatAny(func, false, true)).toBe(`[${Ansi.blue('Function')} () => {...]`);
    });

    it('should format something big nicely', () => {
      abstract class ClassA {
      }

      // noinspection JSUnusedGlobalSymbols
      const sth = {
        class: ClassA,
        obj: {
          array: [
            {
              prop: false,
            },
            123,
            'Text',
          ],
        },
        func: () => {
          return false;
        },
        func2: function doSth() {
          return 'Hello World';
        },
        func3() {
          return 42;
        },
      };
      const result = formatAny(sth, true, true);
      expect(result).toBe(`{
  class: ${Ansi.darkMagenta('[class ClassA]')},
  obj: {
    array: [
      {
        prop: ${Ansi.darkYellow('false')}
      },
      ${Ansi.darkCyan('123')},
      ${Ansi.darkGreen('\'Text\'')}
    ]
  },
  func: [${Ansi.blue('Function')} () => {...],
  func2: [${Ansi.blue('Function')} function doSth() {...],
  func3: [${Ansi.blue('Function')} func3() {...]
}`);
    });

    it('should format a Symbol', () => {
      expect(formatAny(Symbol('test'))).toBe('Symbol(test)');
    });

    it('should format a Symbol colored', () => {
      expect(formatAny(Symbol('test'), false, true))
        .toBe(`${Ansi.magenta('Symbol(')}test${Ansi.magenta(')')}`);
    });

    it('should handle circular references in objects', () => {
      const child = {otherProp: {parent: {}}};
      const parent = {prop: {child}};
      child.otherProp.parent = parent;
      expect(formatAny(parent)).toBe('<ref1>{ prop: { child: { otherProp: { parent: [Circular ref1] } } } }');
    });

    it('should handle circular references in objects colored', () => {
      const child = {otherProp: {parent: {}}};
      const parent = {prop: {child}};
      child.otherProp.parent = parent;
      expect(formatAny(parent, true, true)).toBe(`${Ansi.blue('<ref1>')}{\n  prop: {\n    child: {\n      ` +
        `otherProp: {\n        parent: [${Ansi.cyan('Circular')} ${Ansi.blue('ref1')}]\n      }\n    }\n  }\n}`);
    });

    it('should handle circular references in arrays', () => {
      const array: unknown[] = [1, 'Test', true];
      array.push(array);
      expect(formatAny(array)).toBe('<ref1>[ 1, \'Test\', true, [Circular ref1] ]');
    });

    it('should handle circular references in arrays colored', () => {
      const array: unknown[] = [1, 'Test', true];
      array.push(array);
      expect(formatAny(array, true, true)).toBe(`${Ansi.blue('<ref1>')}[\n  ${Ansi.darkCyan(1)},\n  ` +
        `${Ansi.darkGreen('\'Test\'')},\n  ${Ansi.darkYellow('true')},\n  [${Ansi.cyan('Circular')} ` +
        `${Ansi.blue('ref1')}]\n]`);
    });
  });

  describe('test CircularTracker', () => {
    it('should throw an error if the same object is added again', () => {
      const obj = {};
      const ct = new CircularTracker();
      ct.add(obj);
      try {
        ct.add(obj);
      } catch (e) {
        expect(e).toBeInstanceOf(Error);
        expect(e.message).toBe('object must not be added twice');
      }
    });
  });
});

describe('test getAllProperties', () => {
  class Parent {
    message: string;

    constructor(message: string) {
      this.message = message;
    }

    toString(): string {
      return `{'message': '${this.message}'}`;
    }
  }

  class Child extends Parent {
    code: number;

    constructor(message: string, code: number) {
      super(message);
      this.code = code;
    }

    showMessage(): string {
      return this.message;
    }
  }

  it('should show all properties and functions from parent and child', () => {
    const child = new Child('Test Message', 4711);
    const allProperties = getAllEntries(child);
    expect(allProperties).toContainEqual(['message', 'Test Message']);
    expect(allProperties).toContainEqual(['code', 4711]);
    expect(allProperties).toEqual(expect.arrayContaining([['toString', expect.any(Function)]]));
    expect(allProperties).toEqual(expect.arrayContaining([['showMessage', expect.any(Function)]]));
    expect(allProperties).toEqual(expect.arrayContaining([['constructor', expect.any(Function)]]));
    expect(allProperties).toEqual(expect.arrayContaining([['constructor', expect.any(Function)]]));
  });

  it('should show all properties and functions for an Error object', () => {
    const error = new Error('This is a test error');
    const allProperties = getAllEntries(error);
    expect(allProperties).toContainEqual(['message', 'This is a test error']);
    expect(allProperties).toContainEqual(['name', 'Error']);
    expect(allProperties).toContainEqual(['stack', expect.any(String)]);
    expect(allProperties).toEqual(expect.arrayContaining([['toString', expect.any(Function)]]));
    expect(allProperties).toEqual(expect.arrayContaining([['constructor', expect.any(Function)]]));
  });
});

describe('getAllEntries - missing getter', () => {
  it('should return "Property Descriptor has no get method!!!" for a property with only a setter', () => {
    const obj: Record<string, unknown> = {};
    // eslint-disable-next-line accessor-pairs
    Object.defineProperty(obj, 'prop', {
      set() {}, // nur setter, kein getter!
      enumerable: true,
      configurable: true,
    });

    const entries = getAllEntries(obj) as [string, unknown][];
    const entry = entries.find(([key]) => key === 'prop');
    expect(entry).toBeDefined();
    expect(entry![1]).toBe('Property Descriptor has no get method!!!');
  });
});

describe('getAllEntries - descriptor throws error', () => {
  it('should return "Property inaccessible" when getOwnPropertyDescriptor throws an error', () => {
    const target = {prop: 'value'};
    const proxy = new Proxy(target, {
      getOwnPropertyDescriptor(_target, prop) {
        if (prop === 'prop')
          throw new Error('Test error');
        return Reflect.getOwnPropertyDescriptor(target, prop);
      },
    });

    const entries = getAllEntries(proxy) as [string, unknown][];
    const entry = entries.find(([key]) => key === 'prop');
    expect(entry).toBeDefined();
    expect(entry![1]).toBe('Property inaccessible');
  });
});

describe('getAllEntries - undefined descriptor', () => {
  it('should return "Property inaccessible" when getOwnPropertyDescriptor returns undefined', () => {
    const target = {prop: 'value'};
    const proxy = new Proxy(target, {
      getOwnPropertyDescriptor(_target, prop) {
        if (prop === 'prop')
          return undefined;
        return Reflect.getOwnPropertyDescriptor(target, prop);
      },
    });

    const entries = getAllEntries(proxy) as [string, unknown][];
    const entry = entries.find(([key]) => key === 'prop');
    expect(entry).toBeDefined();
    expect(entry![1]).toBe('Property inaccessible');
  });
});

describe('isClass', () => {
  it('should return false if toString throws an error', () => {
    const badObject = {
      toString() {
        throw new Error('Test error');
      },
    };

    expect(isClass(badObject)).toBe(false);
  });
});
