import {describe, expect, it, vi} from 'vitest';
import {Ansi} from '../ansi.js';
import {LogLevel} from '../definitions.js';
import {
  CircularTracker,
  formatAny,
  formatISO8601,
  formatLogLevel,
  formatPrefix,
  getAllPropertiesAndMethods,
  getClassHierarchy,
  truncateMiddle,
  truncateOrExtend,
} from '../utils.js';

describe('test utils', () => {
  // noinspection DuplicatedCode
  it('formatLogLevel TRACE', () => {
    expect(formatLogLevel(LogLevel.TRACE, true)).toBe('\x1B[90mTRACE\x1B[m');
  });

  it('formatLogLevel DEBUG', () => {
    expect(formatLogLevel(LogLevel.DEBUG, true)).toBe('\x1B[37mDEBUG\x1B[m');
  });

  it('formatLogLevel INFO', () => {
    expect(formatLogLevel(LogLevel.INFO, true)).toBe('\x1B[92mINFO\x1B[m');
  });

  // noinspection DuplicatedCode
  it('formatLogLevel WARN', () => {
    expect(formatLogLevel(LogLevel.WARN, true)).toBe('\x1B[93mWARN\x1B[m');
  });

  it('formatLogLevel ERROR', () => {
    expect(formatLogLevel(LogLevel.ERROR, true)).toBe('\x1B[91mERROR\x1B[m');
  });

  it('formatLogLevel FATAL', () => {
    expect(formatLogLevel(LogLevel.FATAL, true)).toBe('\x1B[95mFATAL\x1B[m');
  });

  it('formatLogLevel OFF', () => {
    expect(formatLogLevel(LogLevel.OFF, true)).toBe('');
  });

  it('formatLogLevel TRACE without color', () => {
    expect(formatLogLevel(LogLevel.TRACE)).toBe('TRACE');
  });

  it('formatLogLevel DEBUG without color', () => {
    expect(formatLogLevel(LogLevel.DEBUG)).toBe('DEBUG');
  });

  it('formatLogLevel INFO without color', () => {
    expect(formatLogLevel(LogLevel.INFO)).toBe('INFO');
  });

  // noinspection DuplicatedCode
  it('formatLogLevel WARN without color', () => {
    expect(formatLogLevel(LogLevel.WARN)).toBe('WARN');
  });

  it('formatLogLevel ERROR without color', () => {
    expect(formatLogLevel(LogLevel.ERROR)).toBe('ERROR');
  });

  it('formatLogLevel FATAL without color', () => {
    expect(formatLogLevel(LogLevel.FATAL)).toBe('FATAL');
  });

  it('formatISO8601', () => {
    const date = new Date();
    expect(formatISO8601(date)).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}[+-]\d{2}:\d{2}$/);
  });

  it('formats ISO8601 correctly with a positive timezone offset', () => {
    const mockDate = new Date('2024-12-23T12:34:56.789Z');
    vi.spyOn(Date.prototype, 'getTimezoneOffset').mockReturnValue(-120);

    const result = formatISO8601(mockDate);
    expect(result).toBe('2024-12-23T13:34:56.789+02:00');
  });

  it('formats ISO8601 correctly with a negative timezone offset', () => {
    const mockDate = new Date('2024-12-23T12:34:56.789Z');
    vi.spyOn(Date.prototype, 'getTimezoneOffset').mockReturnValue(+300);

    const result = formatISO8601(mockDate);
    expect(result).toBe('2024-12-23T13:34:56.789-05:00');
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
    expect(formatPrefix(date, LogLevel.DEBUG, 'foo.bar', true))
      .toMatch(/^2024-05-08T\d{2}:30:45.678[+-]\d{2}:\d{2}\s.+?\s\[.{20}]:$/);
  });

  it('formatPrefix with 4 chars log level', () => {
    const date = new Date('2024-05-08T12:30:45.678');
    expect(formatPrefix(date, LogLevel.INFO, 'foo.bar', true))
      .toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}[+-]\d{2}:\d{2}\s{2}.+?\s\[.{20}]:$/);
  });

  it('formatPrefix with 5 chars log level without color', () => {
    const date = new Date('2024-05-08T12:30:45.678');
    expect(formatPrefix(date, LogLevel.DEBUG, 'foo.bar'))
      .toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}[+-]\d{2}:\d{2}\sDEBUG\s\[.{20}]:$/);
  });

  it('formatPrefix with 4 chars log level without color', () => {
    const date = new Date('2024-05-08T12:30:45.678');
    expect(formatPrefix(date, LogLevel.INFO, 'foo.bar'))
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
      expect(formatAny([null, undefined, 'Test', false, 200])).toBe('[null, undefined, "Test", false, 200]');
    });

    // it('should format an array with a string containing "', () => {
    //   expect(formatAny(['Hallo "Welt"'])).toBe('["Hallo \\"Welt\\""]');
    // });

    it('should format an array colored', () => {
      expect(formatAny([null, undefined, 'Test', false, 200], false, true))
        .toBe(`[${Ansi.bold('null')}, ${Ansi.bold('undefined')}, ${Ansi.green('"Test"')}, ${Ansi
          .darkYellow('false')}, ${Ansi.darkCyan('200')}]`);
    });

    it('should format an array pretty', () => {
      expect(formatAny([null, undefined, 'Test', false, 200], true))
        .toBe('[\n  null,\n  undefined,\n  "Test",\n  false,\n  200\n]');
    });

    it('should format an object', () => {
      const result = formatAny({key: 'value', num: 12.333, bool: false, bad: null, worse: undefined});
      expect(result)
        .toBe('{key: "value", num: 12.333, bool: false, bad: null, worse: undefined}');
    });

    it('should format an object colored', () => {
      const result = formatAny({key: 'value', num: 12.333, bool: false, bad: null}, false, true);
      expect(result)
        .toBe(`{key: ${Ansi.green('"value"')}, num: ${Ansi.darkCyan('12.333')}, bool: ${Ansi
          .darkYellow('false')}, bad: ${Ansi.bold('null')}}`);
    });

    it('should format an object with an internal object', () => {
      const result = formatAny({child: {prop: true}});
      expect(result).toBe('{child: {prop: true}}');
    });

    it('should format an object with an internal Array', () => {
      const result = formatAny({child: [1, 2, 3]});
      expect(result).toBe('{child: [1, 2, 3]}');
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
      expect(result).toBe(`{\n  class: ${Ansi.darkMagenta('[class ClassA]')},\n  obj: {\n    array: [\n      {\n` +
        `        prop: ${Ansi.darkYellow('false')}\n      },\n      ${Ansi.darkCyan('123')},\n` +
        `      ${Ansi.green('"Text"')}\n    ]\n  },\n  func: [${Ansi.blue('Function')} () => {...],\n` +
        `  func2: [${Ansi.blue('Function')} function doSth() {...],\n` +
        `  func3: [${Ansi.blue('Function')} func3() {...]\n}`);
    });

    it('should format a Symbol', () => {
      expect(formatAny(Symbol('test'))).toBe('symbol');
    });

    it('should handle circular references in objects', () => {
      const child = {otherProp: {parent: {}}};
      const parent = {prop: {child}};
      child.otherProp.parent = parent;
      expect(formatAny(parent)).toBe('<ref1>{prop: {child: {otherProp: {parent: [Circular ref1]}}}}');
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
      expect(formatAny(array)).toBe('<ref1>[1, "Test", true, [Circular ref1]]');
    });

    it('should handle circular references in arrays colored', () => {
      const array: unknown[] = [1, 'Test', true];
      array.push(array);
      expect(formatAny(array, true, true)).toBe(`${Ansi.blue('<ref1>')}[\n  ${Ansi.darkCyan(1)},\n  ` +
        `${Ansi.green('"Test"')},\n  ${Ansi.darkYellow('true')},\n  [${Ansi.cyan('Circular')} ` +
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
    const allProperties = getAllPropertiesAndMethods(child);
    expect(allProperties.length).toBe(6);
    expect(allProperties).toContainEqual(['message', 'Test Message']);
    expect(allProperties).toContainEqual(['code', 4711]);
    expect(allProperties).toEqual(expect.arrayContaining([['toString', expect.any(Function)]]));
    expect(allProperties).toEqual(expect.arrayContaining([['showMessage', expect.any(Function)]]));
    expect(allProperties).toEqual(expect.arrayContaining([['constructor', expect.any(Function)]]));
    expect(allProperties).toEqual(expect.arrayContaining([['constructor', expect.any(Function)]]));
  });

  it('should show all properties and functions for an Error object', () => {
    const error = new Error('This is a test error');
    const allProperties = getAllPropertiesAndMethods(error);
    // allProperties.forEach(([key, elem]) => {
    //   process.stdout.write(`${key}: ${elem}\n`);
    // });
    expect(allProperties).toContainEqual(['message', 'This is a test error']);
    expect(allProperties).toContainEqual(['name', 'Error']);
    expect(allProperties).toContainEqual(['stack', expect.any(String)]);
    expect(allProperties).toEqual(expect.arrayContaining([['toString', expect.any(Function)]]));
    expect(allProperties).toEqual(expect.arrayContaining([['constructor', expect.any(Function)]]));
    // Oops, completely unexpected shadowed 'message' property that retains a useless empty value
    expect(allProperties).toContainEqual(['message', '']);
  });
});
