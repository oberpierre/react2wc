# react2wc

[![Build Status](https://github.com/oberpierre/react2wc/actions/workflows/build.yml/badge.svg)](https://github.com/oberpierre/react2wc/actions?query=workflow%3A%22build%22)

A CLI tool to quickly transform react component to native web components.

- [react2wc](#react2wc)
  - [Installation](#installation)
  - [Quick Start](#quick-start)
  - [Help](#help)
  - [Support](#support)

## Installation

```sh
npm i --save-dev react2wc
```

or

```sh
yarn add -D react2wc
```

## Quick Start

Write your react components as usual and transform them using react2wc:

```sh
react2wc build src/lib/hello-world/hello-world.tsx
```

react2wc will transform your react component to a web component and save it in the same directory with the filename hello-world.react2wc.ts.

## Help

Use the react2wc help command for more information:

```sh
react2wc [subcommand] -h
```

or

```sh
react2wc help [subcommand]
```

```console
$ react2wc -h
Usage: react2wc [options] [command]

CLI to convert react component to native web components

Options:
  -V, --version    output the version number
  -h, --help       display help for command

Commands:
  build <file...>  Creates web components for given react components
  help [command]   display help for command
```

### Additional documentation

## Support

The current version of react2wc is fully supported on Long Term Support versions of Node.js, and requires at least v14.17.0.

For issues and feature requests use the project [Issues](https://github.com/oberpierre/react2wc/issues) page on GitHub.
