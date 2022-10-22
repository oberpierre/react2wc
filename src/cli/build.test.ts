import { jest } from '@jest/globals';
import type { PathOrFileDescriptor, WriteFileOptions } from 'fs';

type WriteFileSpy = (
  path: PathOrFileDescriptor,
  data: Buffer,
  opts: WriteFileOptions,
  callback: (err: Error | null) => void
) => void;
const _writeFileMock = jest.fn<WriteFileSpy>((_file, _data, _opts, callback) =>
  callback(null)
);

jest.unstable_mockModule('./analyze', () => {
  return import('./__mocks__/analyze');
});
jest.unstable_mockModule('fs', () => ({
  __esModule: true,
  ...(jest.requireActual('fs') as typeof fs),
  writeFile: jest.fn(_writeFileMock),
}));
const fs = await import('fs');
const Analyzer = await import('./analyze');

beforeEach(() => {
  jest.clearAllMocks();
  jest.restoreAllMocks();
});

describe('build', () => {
  it('should call readFile with resolved path of component and writeFile with target path', async () => {
    jest.spyOn(console, 'log').mockReturnValue();
    jest.spyOn(process, 'cwd').mockReturnValue('/usr/project/react2wc');

    const { default: build } = await import('./build');

    await build([
      '/some/absolute/path/foo.tsx',
      './relative/path/bar.ts',
      'also/relative/path/foo.js',
      'foobar.jsx',
    ]);

    expect(Analyzer.analyzeComponent).toHaveBeenCalledTimes(4);
    expect(fs.writeFile).toHaveBeenCalledTimes(4);
    [
      '/some/absolute/path/foo.tsx',
      '/usr/project/react2wc/relative/path/bar.ts',
      '/usr/project/react2wc/also/relative/path/foo.js',
      '/usr/project/react2wc/foobar.jsx',
    ].forEach((inputPath) =>
      expect(Analyzer.analyzeComponent).toHaveBeenCalledWith(
        inputPath,
        undefined
      )
    );
    [
      '/some/absolute/path/foo.react2wc.ts',
      '/usr/project/react2wc/relative/path/bar.react2wc.ts',
      '/usr/project/react2wc/also/relative/path/foo.react2wc.ts',
      '/usr/project/react2wc/foobar.react2wc.ts',
    ].forEach((inputPath) =>
      expect(fs.writeFile).toHaveBeenCalledWith(
        inputPath,
        expect.any(String),
        { encoding: 'utf-8', signal: expect.any(AbortSignal) },
        expect.any(Function)
      )
    );
  });

  it('should warn when there is an error analyzing a file and keep going', async () => {
    jest.spyOn(console, 'log').mockReturnValue();
    jest.spyOn(Analyzer, 'analyzeComponent').mockReturnValueOnce([]);
    const consoleWarn: string[] = [];
    jest
      .spyOn(console, 'warn')
      .mockImplementation((message, ...args) =>
        consoleWarn.push([message, ...args].map((arg) => String(arg)).join(' '))
      );
    const { default: build } = await import('./build');

    await build(['/absolute/path/read/foo.tsx', '/absolute/path/read/bar.tsx']);

    expect(consoleWarn.join('\n')).toMatchInlineSnapshot(
      `"Couldn't detect component type for /absolute/path/read/foo.tsx."`
    );
    expect(Analyzer.analyzeComponent).toHaveBeenCalledTimes(2);
    expect(fs.writeFile).toHaveBeenCalledTimes(1);
  });

  it('should abort early when there is an error creating a file', async () => {
    (
      jest.spyOn(
        fs,
        'writeFile'
      ) as unknown as jest.MockedFunction<WriteFileSpy>
    ).mockImplementation(
      (_path, _data, _opts, callback: (err: Error) => void) => {
        callback({ name: 'EPERM', message: 'operation not permitted' });
      }
    );
    const consoleError: string[] = [];
    jest
      .spyOn(console, 'error')
      .mockImplementation((message, ...args) =>
        consoleError.push(
          [message, ...args].map((arg) => String(arg)).join(' ')
        )
      );
    const { default: build } = await import('./build');

    await build([
      '/absolue/path/write/foo.tsx',
      '/absolute/path/write/bar.tsx',
    ]);

    expect(consoleError.join()).toMatchInlineSnapshot(
      '"EPERM: operation not permitted"'
    );
    expect(Analyzer.analyzeComponent).toHaveBeenCalledTimes(2);
    expect(fs.writeFile).toHaveBeenCalledTimes(2);
  });

  describe('getWebcomponentFile', () => {
    it('should return filename with .react2wc.ts extension instead of its original one', async () => {
      const { getWebcomponentFile } = await import('./build');
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
