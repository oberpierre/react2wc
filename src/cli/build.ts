import 'abort-controller/polyfill.js';
import { readFile, writeFile, WriteFileOptions } from 'fs';
import { basename, extname, resolve } from 'path';

export const getWebcomponentFile: (file: string) => string = (file) => {
  const extension = extname(file);
  return file.substring(0, file.length - extension.length) + '.react2wc.ts';
};

export const getFileContent: (
  file: string,
  options?: { signal?: AbortSignal }
) => Promise<string | Buffer> = (file, opts = {}) => {
  return new Promise<string | Buffer>((resolve, reject) =>
    readFile(file, opts, (err, data) => (err ? reject(err) : resolve(data)))
  );
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
  await Promise.all(
    files
      .map((file) => resolve(process.cwd(), file))
      .map(async (file) => {
        const abort = new AbortController();
        await getFileContent(file, { signal: abort.signal });
        const newFileName = getWebcomponentFile(file);
        return createFile(newFileName, '', {
          encoding: 'utf-8',
          signal: abort.signal,
        }).then(() => console.log(basename(newFileName), 'created'));
      })
  )
    .then(() => console.log('Processing finished'))
    .catch(({ name, message }: NodeJS.ErrnoException) =>
      console.error(`${name}: ${message}`)
    );
};

export default build;
