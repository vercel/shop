#!/usr/bin/env node
import { spawn } from 'node:child_process';

const child = spawn(
  'npx',
  [
    'create-next-app@latest',
    '--example',
    'https://github.com/vercel/shop',
    '--example-path',
    'apps/template',
    ...process.argv.slice(2),
  ],
  {
  stdio: 'inherit',
});

child.on('close', (code) => {
  process.exit(code ?? 1);
});
