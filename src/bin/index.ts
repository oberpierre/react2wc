#! /usr/bin/env node
import { Command } from 'commander';
import { build } from '../cli/index.js';

const program = new Command();

program
  .name('react2wc')
  .description('CLI to convert react component to native web components')
  .version('0.1.0');

program
  .command('build')
  .description('Creates web components for given react components')
  .argument(
    '<file...>',
    'Paths to react components to transform. Relative paths'
  )
  .action((files) => {
    build(files);
  });

program.parse();
