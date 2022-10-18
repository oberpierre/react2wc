import 'abort-controller/polyfill.js';
import { writeFile, WriteFileOptions } from 'fs';
import { basename, extname, resolve } from 'path';
import {
  analyzeComponent,
  ComponentAnalysis,
  getTypescriptConfig,
} from './analyze.js';

export const getWebcomponentFile: (file: string) => string = (file) => {
  const extension = extname(file);
  return file.substring(0, file.length - extension.length) + '.react2wc.ts';
};

export const createFile: (
  outFile: string,
  data: string | Buffer,
  options?: WriteFileOptions
) => Promise<void> = (outFile, data, opts = {}) => {
  return new Promise<void>((resolve, reject) =>
    writeFile(outFile, data, opts, (err) => (err ? reject(err) : resolve()))
  );
};

const build = async (files: string[]): Promise<void> => {
  const tsConfig = getTypescriptConfig();
  await Promise.all(
    files
      .map((file) => resolve(process.cwd(), file))
      .map(
        (file) =>
          [analyzeComponent(file, tsConfig), file] as [
            ComponentAnalysis[],
            string
          ]
      )
      .map(async ([candidates, file]) => {
        const abort = new AbortController();
        const targetComponent =
          candidates.find(
            (candidate) =>
              candidates.length === 1 || candidate.exportName === 'default'
          ) ?? candidates[0];
        if (!targetComponent) {
          console.warn(`Couldn't detect component type for ${file}.`);
          return;
        }

        const newFileName = getWebcomponentFile(targetComponent.file);
        await createFile(newFileName, ``, {
          encoding: 'utf-8',
          signal: abort.signal,
        });
        return console.log(basename(newFileName), 'created');
      })
  )
    .then(() => console.log('Processing finished'))
    .catch(({ name, message }: NodeJS.ErrnoException) =>
      console.error(`${name}: ${message}`)
    );
};

export default build;
