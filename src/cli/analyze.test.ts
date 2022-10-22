import { jest } from '@jest/globals';
import type { MockInstance, SpyInstance } from 'jest-mock';
import type {
  ParsedCommandLine,
  Program,
  SourceFile,
  TsConfigSourceFile,
} from 'typescript';
import ts from 'typescript';
import { analyzeComponent, getTypescriptConfig } from './analyze';

beforeEach(() => {
  jest.clearAllMocks();
});

describe('build', () => {
  describe('getTypescriptConfig', () => {
    it('should call typescript findConfigFile with the current working directory', () => {
      jest.spyOn(process, 'cwd').mockReturnValueOnce('/some/path/to/project');
      const config = { compilerOptions: { allowJs: true } };
      const readFileMock = jest
        .fn<(fileName: string) => TsConfigSourceFile>()
        .mockReturnValue(config as unknown as TsConfigSourceFile);
      const findConfigFileSpy = jest
        .spyOn(ts, 'findConfigFile')
        .mockImplementation((file, cb) => {
          const configFile = file + '/tsconfig.json';
          return cb(configFile) ? configFile : undefined;
        });
      const readJsonConfigFile = jest
        .spyOn(ts, 'readJsonConfigFile')
        .mockImplementation((fileName) => {
          return readFileMock(fileName);
        });
      const parseJsonSourceFileConfigFileContent = jest
        .spyOn(ts, 'parseJsonSourceFileConfigFileContent')
        .mockReturnValue({
          options: config.compilerOptions,
        } as unknown as ParsedCommandLine);

      const actual = getTypescriptConfig();

      expect(findConfigFileSpy).toHaveBeenCalledTimes(1);
      expect(findConfigFileSpy).toHaveBeenCalledWith(
        '/some/path/to/project',
        expect.any(Function)
      );
      expect(readJsonConfigFile).toHaveBeenCalledTimes(1);
      expect(readJsonConfigFile).toHaveBeenCalledWith(
        '/some/path/to/project/tsconfig.test.json',
        expect.any(Function)
      );
      expect(parseJsonSourceFileConfigFileContent).toHaveBeenCalledTimes(1);
      expect(parseJsonSourceFileConfigFileContent).toHaveBeenCalledWith(
        config,
        ts.sys,
        '/some/path/to/project'
      );
      expect(actual).toStrictEqual(config.compilerOptions);
    });

    it('should return undefined if tsconfig cannot be found typescript', () => {
      jest
        .spyOn(process, 'cwd')
        .mockReturnValueOnce('/some/other/path/to/project');
      const findConfigFileSpy = jest
        .spyOn(ts, 'findConfigFile')
        .mockReturnValue(undefined);
      const readJsonConfigFile = jest.spyOn(ts, 'readJsonConfigFile');
      const parseJsonSourceFileConfigFileContent = jest.spyOn(
        ts,
        'parseJsonSourceFileConfigFileContent'
      );

      const actual = getTypescriptConfig();

      expect(findConfigFileSpy).toHaveBeenCalledTimes(1);
      expect(findConfigFileSpy).toHaveBeenCalledWith(
        '/some/other/path/to/project',
        expect.any(Function)
      );
      expect(readJsonConfigFile).toHaveBeenCalledTimes(0);
      expect(parseJsonSourceFileConfigFileContent).toHaveBeenCalledTimes(0);
      expect(actual).toBeUndefined();
    });
  });

  describe('analyzeComponents', () => {
    const projectRootPath = '/some/path/to/project';
    type getSourceFileSignatue = (fileName: string) => SourceFile | undefined;
    let getSourceFileMock: MockInstance<getSourceFileSignatue>;
    type createProgramSpySignature = (
      ...args: Parameters<typeof ts.createProgram>
    ) => Program;
    let createProgramSpy: SpyInstance<createProgramSpySignature>;
    beforeAll(() => {
      const _createProgram = ts.createProgram;
      getSourceFileMock = jest
        .fn<getSourceFileSignatue>()
        .mockImplementation((file: string) => {
          return ts.createSourceFile(file, ``, ts.ScriptTarget.Latest, true);
        });
      createProgramSpy = jest
        .spyOn(ts, 'createProgram')
        .mockImplementation((file, options) => {
          return {
            ..._createProgram(file, { ...options, rootDir: projectRootPath }),
            getSourceFile: getSourceFileMock as unknown as (
              fileName: string
            ) => SourceFile | undefined,
          };
        });
    });

    it('should call getProgram with given file and getSourceFile on the program', () => {
      const actual = analyzeComponent(projectRootPath + '/test.ts', undefined);

      expect(createProgramSpy).toHaveBeenCalledTimes(1);
      expect(createProgramSpy).toHaveBeenCalledWith(
        [projectRootPath + '/test.ts'],
        {
          noEmit: true,
        }
      );
      expect(getSourceFileMock).toHaveBeenCalledTimes(1);
      expect(getSourceFileMock).toHaveBeenCalledWith(
        projectRootPath + '/test.ts'
      );
      expect(actual).toStrictEqual([]);
    });
  });
});
