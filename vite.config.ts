import {extname, relative} from 'node:path';
import {fileURLToPath} from 'node:url';
import {glob} from 'glob';
import {defineConfig} from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
  plugins: [
    dts(),
  ],
  build: {
    lib: {
      entry: 'lib/index.ts',
      formats: ['es'],
    },

    rollupOptions: {
      external: [/^node:.*/, 'better-sqlite3'],
      input: Object.fromEntries(
        glob.sync('lib/**/*.{ts,tsx}', {
          ignore: ['lib/**/*.d.ts', 'lib/**/*.spec.ts'],
        }).map(file => [
          relative('lib', file.slice(0, file.length - extname(file).length)),
          fileURLToPath(new URL(file, import.meta.url)),
        ]),
      ),
      output: {
        entryFileNames: '[name].js',
      },
    },
  },
});
