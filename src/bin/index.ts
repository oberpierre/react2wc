#! /usr/bin/env node
import { program } from 'commander';

program
  .name('react2wc')
  .description('CLI to convert react component to native web components')
  .version('0.1.0');

program.parse();
