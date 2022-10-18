import type { CompilerOptions, Signature } from 'typescript';
import ts from 'typescript';
import type { ComponentAnalysis } from '../analyze.js';

export const getTypescriptConfig: () => CompilerOptions | undefined = jest
  .fn()
  .mockReturnValue(undefined);

export const analyzeComponent: (
  file: string,
  tsConfig?: CompilerOptions
) => ComponentAnalysis[] = jest.fn((file) => {
  const name = file.substring(file.lastIndexOf('/') + 1, file.lastIndexOf('.'));
  return [
    {
      file,
      name,
      exportName: 'default',
      signature: ts.factory.createCallSignature(
        undefined,
        [],
        undefined
      ) as unknown as Signature,
    },
  ];
});
