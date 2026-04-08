#!/usr/bin/env node
import { spawn } from 'node:child_process';

const userAgent = process.env.npm_config_user_agent ?? '';
const execPath = process.env.npm_execpath ?? '';
const cliArgs = process.argv.slice(2);

const hasExplicitPackageManagerFlag = cliArgs.some((arg) =>
  ['--use-pnpm', '--use-npm', '--use-yarn', '--use-bun'].includes(arg),
);

function detectPackageManager() {
  if (userAgent.startsWith('pnpm/')) return 'pnpm';
  if (userAgent.startsWith('bun/')) return 'bun';
  if (userAgent.startsWith('yarn/')) return 'yarn';
  if (userAgent.startsWith('npm/')) return 'npm';

  if (execPath.includes('pnpm')) return 'pnpm';
  if (execPath.includes('bun')) return 'bun';
  if (execPath.includes('yarn')) return 'yarn';
  if (execPath.includes('npm')) return 'npm';

  return null;
}

const detectedPackageManager = hasExplicitPackageManagerFlag
  ? null
  : detectPackageManager();

const packageManagerFlag =
  detectedPackageManager === 'pnpm'
    ? '--use-pnpm'
    : detectedPackageManager === 'bun'
      ? '--use-bun'
      : detectedPackageManager === 'yarn'
        ? '--use-yarn'
        : detectedPackageManager === 'npm'
          ? '--use-npm'
          : null;

function getRunner(packageManager) {
  if (packageManager === 'pnpm') {
    return { command: 'pnpm', args: ['dlx'] };
  }

  if (packageManager === 'bun') {
    return { command: 'bunx', args: [] };
  }

  if (packageManager === 'yarn') {
    return { command: 'yarn', args: ['dlx'] };
  }

  return { command: 'npx', args: [] };
}

const runner = getRunner(detectedPackageManager);

const child = spawn(
  runner.command,
  [
    ...runner.args,
    'create-next-app@latest',
    '--example',
    'https://github.com/vercel/shop',
    '--example-path',
    'apps/template',
    ...(packageManagerFlag ? [packageManagerFlag] : []),
    ...cliArgs,
  ],
  {
  stdio: 'inherit',
});

child.on('close', (code) => {
  process.exit(code ?? 1);
});
