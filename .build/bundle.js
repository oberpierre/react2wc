import { exec } from 'child_process';
import { copyFile, mkdir, readdir, rm, stat } from 'fs/promises';
import { dirname, relative, resolve } from 'path';
import config from '../tsconfig.json' assert { type: 'json' };

const currentDir = process.cwd();
const outDir = config?.compilerOptions?.outDir ?? 'dist';
const rootDir = config?.compilerOptions?.rootDir ?? 'src';

console.log(`Cleaning destination folder ${outDir}...`);
await rm(outDir, { recursive: true, force: true });

console.log('Building project');
await mkdir(outDir);

const execPromise = new Promise((resolve, reject) => {
  exec('yarn build', (err, stdout, stderr) =>
    err ? reject(err) : resolve(stdout, stderr)
  );
}).then((stdout, stderr) => {
  stdout && console.log(stdout);
  stderr && console.error(stderr);
});

const copyFiles = async (
  dir,
  predicate,
  recursive = false,
  initialDirectory
) => {
  const initalDir = initialDirectory ?? dir;
  const files = await readdir(dir);
  const resolvedFiles = [];
  for (const file of files) {
    const path = relative(currentDir, resolve(dir, file));
    resolvedFiles.push(
      stat(path).then((stats) => {
        if (stats.isDirectory() && recursive) {
          resolvedFiles.push(copyFiles(path, predicate, recursive, initalDir));
        } else if (predicate(file)) {
          const destPath = relative(
            currentDir,
            resolve(outDir, relative(initalDir, path))
          );
          const destDir = dirname(destPath);
          console.log(`Copying ${path} to ${destPath}`);
          return mkdir(destDir, { recursive: true }).then(() =>
            copyFile(path, destPath)
          );
        }
        return;
      })
    );
  }
  return await Promise.all(resolvedFiles);
};

// Copy package.json and documentation
const copyDocumentation = copyFiles(
  currentDir,
  (file) =>
    file === 'package.json' || file.endsWith('.md') || file === 'LICENSE'
);

// Copy templates
// const copyNonTsSourceFiles = mkdir(resolve(outDir, 'templates'), {
//   recursive: true,
// }).then(() =>
//   copyFile(
//     resolve(currentDir, 'src/templates/react2wc.handlebars'),
//     resolve(outDir, 'templates/react2wc.handlebars')
//   )
// );
const copyNonTsSourceFiles = copyFiles(
  rootDir,
  (file) => file.endsWith('.hbs') || file.endsWith('.handlebars'),
  true
);

await Promise.all([execPromise, copyDocumentation, copyNonTsSourceFiles]);
