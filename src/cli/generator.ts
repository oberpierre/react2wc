import 'abort-controller/polyfill.js';
import { readFile, writeFile, WriteFileOptions } from 'fs';
import type { TemplateDelegate } from 'handlebars';
import Handlebars from 'handlebars';
import { basename, dirname, extname, relative, resolve } from 'path';
import { fileURLToPath } from 'url';
import type { ComponentAnalysis } from './analyze.js';

export const createFile: (
  outFile: string,
  data: string | Buffer,
  options?: WriteFileOptions
) => Promise<void> = (outFile, data, opts = {}) => {
  return new Promise<void>((resolve, reject) =>
    writeFile(outFile, data, opts, (err) => (err ? reject(err) : resolve()))
  );
};

export const getWebcomponentFile: (file: string) => string = (file) => {
  const extension = extname(file);
  return file.substring(0, file.length - extension.length) + '.react2wc.ts';
};

export const getReactComponentTemplate: () => Promise<TemplateDelegate> =
  () => {
    const templatePath = resolve(
      dirname(fileURLToPath(import.meta.url)),
      '../templates/react2wc.handlebars'
    );
    return new Promise((resolve, reject) => {
      readFile(templatePath, { encoding: 'utf-8' }, (err, data) =>
        err ? reject(err) : resolve(data)
      );
    }).then((data) => Handlebars.compile(data));
  };

export const createComponent: (
  component: ComponentAnalysis,
  options?: WriteFileOptions
) => Promise<void> = async (component, options) => {
  const newFileName = getWebcomponentFile(component.file);
  const template = await getReactComponentTemplate();
  const relativePath = relative(dirname(newFileName), dirname(component.file));
  const templateData = {
    compTypeName: `${component.name}Component`,
    dynamicImport: `{ ${
      component.exportName === 'default'
        ? `default: ${component.name}`
        : component.name
    } }`,
    importDeclaration:
      component.exportName === 'default'
        ? component.name
        : `{ ${component.name} }`,
    importName: component.name,
    importPath: (relativePath || './') + basename(component.file),
  };
  return createFile(newFileName, template(templateData), options);
};
