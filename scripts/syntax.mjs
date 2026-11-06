import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';

export async function checkSyntax() {
  const run = promisify(execFile);
  await Promise.all(['build.mjs', 'check.mjs', 'syntax.mjs', '../src/copy.mjs', '../public/site.js'].map(file => run(process.execPath, ['--check', fileURLToPath(new URL(file, import.meta.url))])));
}
