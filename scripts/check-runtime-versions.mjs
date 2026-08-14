import { execFileSync } from 'node:child_process';

const expectedNode = 'v24.18.1';
const expectedNpm = '11.16.0';
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const actualNpm = execFileSync(npmCommand, ['--version'], { encoding: 'utf8' }).trim();

if (process.version !== expectedNode || actualNpm !== expectedNpm) {
  console.error(`Unsupported runtime. Required Node.js ${expectedNode} and npm ${expectedNpm}; found Node.js ${process.version} and npm ${actualNpm}.`);
  process.exit(1);
}

console.log(`Runtime verified: Node.js ${process.version}, npm ${actualNpm}`);
