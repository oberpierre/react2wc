import { jest } from '@jest/globals';
import type { PathOrFileDescriptor, WriteFileOptions } from 'fs';
import type { Signature } from 'typescript';

type WriteFileSpy = (
  path: PathOrFileDescriptor,
  data: Buffer,
  opts: WriteFileOptions,
  callback: (err: Error | null) => void
) => void;
const _writeFileMock = jest.fn<WriteFileSpy>((_file, _data, _opts, callback) =>
  callback(null)
);

jest.unstable_mockModule('fs', () => ({
  __esModule: true,
  ...(jest.requireActual('fs') as typeof fs),
  writeFile: jest.fn(_writeFileMock),
}));
const fs = await import('fs');

describe('generator', () => {
  describe('createComponent', () => {
    it('should create file with .react2wc.ts ending', async () => {
      const options: WriteFileOptions = { encoding: 'utf-8' };
      const { createComponent } = await import('./generator');

      await createComponent(
        {
          exportName: 'Foobar',
          file: '/some/path/foobar.ts',
          name: 'Foobar',
          signature: null as unknown as Signature,
        },
        options
      );

      expect(fs.writeFile).toHaveBeenCalledTimes(1);
      expect(fs.writeFile).toHaveBeenCalledWith(
        '/some/path/foobar.react2wc.ts',
        expect.any(String),
        options,
        expect.any(Function)
      );
      expect(
        (
          fs.writeFile as unknown as jest.MockedFunction<WriteFileSpy>
        ).mock.calls
          .at(0)
          ?.at(1)
      ).toMatchInlineSnapshot(`
        "import type { ComponentProps } from 'react';
        import { BaseElement } from 'react2wc';
        import { Foobar } from './foobar.ts';

        type FoobarComponent = typeof Foobar;

        export class HelloWorldWc extends BaseElement<FoobarComponent> {
          async getComponent(): Promise<FoobarComponent> {
            const { Foobar } = await import('./foobar.ts');
            return Foobar;
          }
          getProperties(): ComponentProps<FoobarComponent> {
            return {};
          }
        }
        "
      `);
    });
  });

  describe('getWebcomponentFile', () => {
    it('should return filename with .react2wc.ts extension instead of its original one', async () => {
      const { getWebcomponentFile } = await import('./generator');
      expect(getWebcomponentFile('')).toBe('.react2wc.ts');
      expect(getWebcomponentFile('hello-world.tsx')).toBe(
        'hello-world.react2wc.ts'
      );
      expect(getWebcomponentFile('foobar.jsx')).toBe('foobar.react2wc.ts');
      expect(getWebcomponentFile('foo.ts')).toBe('foo.react2wc.ts');
      expect(getWebcomponentFile('bar.js')).toBe('bar.react2wc.ts');
    });
  });
});
