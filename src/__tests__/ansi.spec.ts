/* eslint-disable no-console */
import {Ansi} from '../ansi.js'; // Stellen Sie sicher, dass der Dateipfad korrekt ist

describe('Ansi Colors', () => {
  it('Print all colors', () => {
    console.log(Ansi.black('Black'), ', ', Ansi.darkGray('Dark Gray'), ', ', Ansi.gray('Gray'), ', ', Ansi.white('White'));
    console.log(Ansi.red('Red'), ', ', Ansi.darkRed('Dark Red'));
    console.log(Ansi.green('Green'), ', ', Ansi.darkGreen('Dark Green'));
    console.log(Ansi.yellow('Yellow'), ', ', Ansi.darkYellow('Dark Yellow'));
    console.log(Ansi.blue('Blue'), ', ', Ansi.darkBlue('Dark Blue'));
    console.log(Ansi.magenta('Magenta'), ', ', Ansi.darkMagenta('Dark Magenta'));
    console.log(Ansi.cyan('Cyan'), ', ', Ansi.darkCyan('Dark Cyan'));
  });

  it('should combine color and bold with one endblock only', () => {
    expect(Ansi.bold(Ansi.red('test'))).toBe('\x1B[1m\x1B[91mtest\x1B[m');
  });
});
