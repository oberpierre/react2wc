import { jest } from '@jest/globals';

jest.unstable_mockModule('./analyze', () => {
  return import('./__mocks__/analyze');
});
jest.unstable_mockModule('./generator', () => {
  return import('./__mocks__/generator');
});

const Analyzer = await import('./analyze');
const Generator = await import('./generator');

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
    expect(Generator.createComponent).toHaveBeenCalledTimes(4);
    [
      '/some/absolute/path/foo.tsx',
      '/usr/project/react2wc/relative/path/bar.ts',
      '/usr/project/react2wc/also/relative/path/foo.js',
      '/usr/project/react2wc/foobar.jsx',
    ].forEach((inputPath) => {
      expect(Analyzer.analyzeComponent).toHaveBeenCalledWith(
        inputPath,
        undefined
      );
      expect(Generator.createComponent).toHaveBeenCalledWith(
        expect.objectContaining({ file: inputPath }),
        { encoding: 'utf-8', signal: expect.any(AbortSignal) }
      );
    });
  });

  it('should warn when there is an error analyzing a file and keep going', async () => {
    const Build = await import('./build');
    jest.spyOn(console, 'log').mockReturnValue();
    jest.spyOn(Analyzer, 'analyzeComponent').mockReturnValueOnce([]);
    const consoleWarn: string[] = [];
    jest
      .spyOn(console, 'warn')
      .mockImplementation((message, ...args) =>
        consoleWarn.push([message, ...args].map((arg) => String(arg)).join(' '))
      );

    await Build.default([
      '/absolute/path/read/foo.tsx',
      '/absolute/path/read/bar.tsx',
    ]);

    expect(consoleWarn.join('\n')).toMatchInlineSnapshot(
      `"Couldn't detect component type for /absolute/path/read/foo.tsx."`
    );
    expect(Analyzer.analyzeComponent).toHaveBeenCalledTimes(2);
    expect(Generator.createComponent).toHaveBeenCalledTimes(1);
  });

  it('should abort early when there is an error creating a file', async () => {
    const Build = await import('./build');
    jest.spyOn(Generator, 'createComponent').mockImplementation(() => {
      throw new Error('EPERM: operation not permitted');
    });
    const consoleError: string[] = [];
    jest
      .spyOn(console, 'error')
      .mockImplementation((message, ...args) =>
        consoleError.push(
          [message, ...args].map((arg) => String(arg)).join(' ')
        )
      );
    await Build.default([
      '/absolue/path/write/foo.tsx',
      '/absolute/path/write/bar.tsx',
    ]);

    expect(consoleError.join()).toMatchInlineSnapshot(
      `"Error: EPERM: operation not permitted"`
    );
    expect(Analyzer.analyzeComponent).toHaveBeenCalledTimes(2);
    expect(Generator.createComponent).toHaveBeenCalledTimes(2);
  });
});
