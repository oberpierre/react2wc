import build, { getWebcomponentFile } from './build';
import fs from 'fs';

type ReadFileSpy = (
  path: fs.PathOrFileDescriptor,
  opts: Record<string, string>,
  callback: (err: Error) => void
) => void;
type WriteFileSpy = (
  path: fs.PathOrFileDescriptor,
  data: Buffer,
  opts: fs.WriteFileOptions,
  callback: (err: Error) => void
) => void;
const _readFileMock = jest.fn((_file, _opts, callback) =>
  callback(null, 'Mocked file content')
);
const _writeFileMock = jest.fn((_file, _data, _opts, callback) =>
  callback(null)
);

beforeEach(() => {
  jest.clearAllMocks();
  (
    jest.spyOn(fs, 'readFile') as unknown as jest.MockedFunction<ReadFileSpy>
  ).mockImplementation(_readFileMock);
  (
    jest.spyOn(fs, 'writeFile') as unknown as jest.MockedFunction<WriteFileSpy>
  ).mockImplementation(_writeFileMock);
});

describe('build', () => {
  it('should call readFile with resolved path of component and writeFile with target path', async () => {
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(process, 'cwd').mockReturnValue('/usr/project/react2wc');
    await build([
      '/some/absolute/path/foo.tsx',
      './relative/path/bar.ts',
      'also/relative/path/foo.js',
      'foobar.jsx',
    ]);

    expect(fs.readFile).toHaveBeenCalledTimes(4);
    expect(fs.writeFile).toHaveBeenCalledTimes(4);
    [
      '/some/absolute/path/foo.tsx',
      '/usr/project/react2wc/relative/path/bar.ts',
      '/usr/project/react2wc/also/relative/path/foo.js',
      '/usr/project/react2wc/foobar.jsx',
    ].forEach((inputPath) =>
      expect(fs.readFile).toHaveBeenCalledWith(
        inputPath,
        { signal: expect.any(AbortSignal) },
        expect.any(Function)
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

  it('should abort early when there is an error reading a file', async () => {
    // need to be cased because there are multiple readFile overloads
    const test = (
      jest.spyOn(fs, 'readFile') as unknown as jest.MockedFunction<ReadFileSpy>
    ).mockImplementation((_path, _opts, callback: (err: Error) => void) => {
      callback({ name: 'ENOENT', message: 'no such file or directory' });
    });
    const stringBuilder: string[] = [];
    jest
      .spyOn(console, 'error')
      .mockImplementation((message, ...args) =>
        stringBuilder.push(
          [message, ...args].map((arg) => String(arg)).join(' ')
        )
      );
    await build(['/absolute/path/read/foo.tsx', '/absolute/path/read/bar.tsx']);

    expect(stringBuilder.join()).toMatchInlineSnapshot(
      '"ENOENT: no such file or directory"'
    );
    expect(fs.readFile).toHaveBeenCalledTimes(2);
    expect(fs.writeFile).toHaveBeenCalledTimes(0);
    test.mockRestore();
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
    const stringBuilder: string[] = [];
    jest
      .spyOn(console, 'error')
      .mockImplementation((message, ...args) =>
        stringBuilder.push(
          [message, ...args].map((arg) => String(arg)).join(' ')
        )
      );
    await build([
      '/absolue/path/write/foo.tsx',
      '/absolute/path/write/bar.tsx',
    ]);

    expect(stringBuilder.join()).toMatchInlineSnapshot(
      '"EPERM: operation not permitted"'
    );
    expect(fs.readFile).toHaveBeenCalledTimes(2);
    expect(fs.writeFile).toHaveBeenCalledTimes(2);
  });

  describe('getWebcomponentFile', () => {
    it('should return filename with .react2wc.ts extension instead of its original one', () => {
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
