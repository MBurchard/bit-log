export class Ansi {
  private static readonly END_FORMAT_CODE = '\x1B[m';

  static formatCode(code: number): string {
    return `\x1B[${code}m`;
  }

  static formatEnd(text: string): string {
    if (text.endsWith(Ansi.END_FORMAT_CODE)) {
      return text;
    }
    return `${text}${Ansi.END_FORMAT_CODE}`;
  }

  static black(str: string): string {
    return this.formatEnd(`${this.formatCode(30)}${str}`);
  }

  static darkGray(str: string): string {
    return this.formatEnd(`${this.formatCode(90)}${str}`);
  }

  static gray(str: string): string {
    return this.formatEnd(`${this.formatCode(37)}${str}`);
  }

  static white(str: string): string {
    return this.formatEnd(`${this.formatCode(97)}${str}`);
  }

  static red(str: string): string {
    return this.formatEnd(`${this.formatCode(91)}${str}`);
  }

  static darkRed(str: string): string {
    return this.formatEnd(`${this.formatCode(31)}${str}`);
  }

  static green(str: string): string {
    return this.formatEnd(`${this.formatCode(92)}${str}`);
  }

  static darkGreen(str: string): string {
    return this.formatEnd(`${this.formatCode(32)}${str}`);
  }

  static yellow(str: string): string {
    return this.formatEnd(`${this.formatCode(93)}${str}`);
  }

  static darkYellow(str: string): string {
    return this.formatEnd(`${this.formatCode(33)}${str}`);
  }

  static blue(str: string): string {
    return this.formatEnd(`${this.formatCode(94)}${str}`);
  }

  static darkBlue(str: string): string {
    return this.formatEnd(`${this.formatCode(34)}${str}`);
  }

  static magenta(str: string): string {
    return this.formatEnd(`${this.formatCode(95)}${str}`);
  }

  static darkMagenta(str: string): string {
    return this.formatEnd(`${this.formatCode(35)}${str}`);
  }

  static cyan(str: string): string {
    return this.formatEnd(`${this.formatCode(96)}${str}`);
  }

  static darkCyan(str: string): string {
    return this.formatEnd(`${this.formatCode(36)}${str}`);
  }

  static bold(str: string): string {
    return this.formatEnd(`${this.formatCode(1)}${str}`);
  }
}
