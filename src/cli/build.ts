import 'abort-controller/polyfill.js';
import { basename, resolve } from 'path';
import {
  analyzeComponent,
  ComponentAnalysis,
  getTypescriptConfig,
} from './analyze.js';
import { createComponent } from './generator.js';

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

        await createComponent(targetComponent, {
          encoding: 'utf-8',
          signal: abort.signal,
        });
        return console.log('Webcomponent for', basename(file), 'created');
      })
  )
    .then(() => console.log('Processing finished'))
    .catch(({ name, message }: NodeJS.ErrnoException) =>
      console.error(`${name}: ${message}`)
    );
};

export default build;
