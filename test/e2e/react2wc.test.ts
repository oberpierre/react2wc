import { exec } from 'child_process';

const promisify = (
  fn: (
    arg: string,
    cb: (err: unknown, stdout: string, stderrr: string) => unknown
  ) => void
) => {
  return (arg: string): Promise<[string, string]> => {
    return new Promise((resolve, reject) => {
      fn(arg, (err: unknown, ...rest: [string, string]) =>
        err ? reject(err) : resolve(rest)
      );
    });
  };
};

describe('react2wc', () => {
  it('should return semver when using version', async () => {
    const actual = await promisify(exec)('node dist/bin/index.js -V').then(
      ([stdout]) => {
        return stdout.trim();
      }
    );

    expect(actual).toMatch(/^[0-9]+\.[0-9]+\.[0-9]+$/);
  });
});
