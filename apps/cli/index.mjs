#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';

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
const templateVersion = await readTemplateVersion();

function findProjectDir(args) {
  const flagsWithValues = new Set(['--import-alias']);
  let skipNext = false;

  for (const arg of args) {
    if (skipNext) {
      skipNext = false;
      continue;
    }

    if (flagsWithValues.has(arg)) {
      skipNext = true;
      continue;
    }

    if (arg.startsWith('--import-alias=')) {
      continue;
    }

    if (!arg.startsWith('-')) {
      return resolve(process.cwd(), arg);
    }
  }

  return process.cwd();
}

async function readTemplateVersion() {
  const packageJson = new URL('./package.json', import.meta.url);
  const raw = await readFile(packageJson, 'utf8');
  const pkg = JSON.parse(raw);
  return pkg.shopTemplateVersion;
}

function runCommand(command, args, options = {}) {
  return new Promise((resolveRun) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
      ...options,
    });

    child.on('error', () => {
      resolveRun(1);
    });

    child.on('close', (code) => {
      resolveRun(code ?? 1);
    });
  });
}

async function writeBootstrapMetadata(projectDir) {
  const metadataDir = join(projectDir, '.vercel-shop');
  const metadataPath = join(metadataDir, 'bootstrap.json');

  await mkdir(metadataDir, { recursive: true });
  await writeFile(
    metadataPath,
    `${JSON.stringify({ templateVersion }, null, 2)}\n`,
    'utf8',
  );
}

async function installProjectPlugins(projectDir) {
  const installs = [
    ['vercel/shop', '--scope', 'project', '--yes'],
    ['vercel/vercel-plugin', '--scope', 'project', '--yes'],
    ['Shopify/shopify-ai-toolkit', '--scope', 'project', '--yes'],
  ];

  const failures = [];

  for (const args of installs) {
    const code = await runCommand('npx', ['plugins', 'add', ...args], {
      cwd: projectDir,
    });

    if (code !== 0) {
      failures.push(args[0]);
    }
  }

  return failures;
}

function printRetryCommands(projectDir) {
  console.warn('\nVercel Shop scaffolded successfully, but one or more plugin installs failed.');
  console.warn(`Retry from ${projectDir}:`);
  console.warn('  npx plugins add vercel/shop --scope project --yes');
  console.warn('  npx plugins add vercel/vercel-plugin --scope project --yes');
  console.warn('  npx plugins add Shopify/shopify-ai-toolkit --scope project --yes');
}

const scaffoldCode = await runCommand(runner.command, [
  ...runner.args,
  'create-next-app@latest',
  '--example',
  'https://github.com/vercel/shop',
  '--example-path',
  'apps/template',
  ...(packageManagerFlag ? [packageManagerFlag] : []),
  ...cliArgs,
]);

if (scaffoldCode !== 0) {
  process.exit(scaffoldCode);
}

const projectDir = findProjectDir(cliArgs);

try {
  await writeBootstrapMetadata(projectDir);
} catch (error) {
  console.warn('\nScaffold completed, but bootstrap metadata could not be written.');
  console.warn(error instanceof Error ? error.message : String(error));
  printRetryCommands(projectDir);
  process.exit(0);
}

const failedPlugins = await installProjectPlugins(projectDir);

if (failedPlugins.length > 0) {
  printRetryCommands(projectDir);
}
