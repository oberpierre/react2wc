import { exec } from 'child_process';

describe('react2wc-testing-react18', () => {
  describe('build', () => {
    it('should yield {component}.react2wc.ts file for build component', (done) => {
      exec(
        'node dist/bin/index.js build test/e2e/react18/src/lib/hello-world/hello-world.ts',
        (err, stdout, stderr) => {
          if (err) throw err;
          expect(stdout).toMatchInlineSnapshot(
            `
            "hello-world.react2wc.ts created
            Processing finished
            "
          `
          );
          expect(stderr).toMatchInlineSnapshot(`""`);
          done();
        }
      );
    });
  });
});
