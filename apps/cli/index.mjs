#!/usr/bin/env node
import { existsSync, readdirSync, statSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { join, resolve } from 'node:path';

const userAgent = process.env.npm_config_user_agent ?? '';
const execPath = process.env.npm_execpath ?? '';
const cliArgs = process.argv.slice(2);
const startedAtMs = Date.now();
const startedInDirectory = process.cwd();
const startingDirectorySnapshot = snapshotDirectories(startedInDirectory);
const startedInExistingProject = isScaffoldedProject(startedInDirectory);
const requestedProjectPath = getRequestedProjectPath(cliArgs);

const REQUIRED_PLUGINS = ['vercel/vercel-plugin', 'shopify/shopify-ai-toolkit'];
const FLAGS_WITH_VALUES = new Set([
  '--api',
  '--example',
  '--example-path',
  '--import-alias',
  '-e',
]);

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

function getRequestedProjectPath(args) {
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === '--') {
      return args[index + 1] ?? null;
    }

    if (FLAGS_WITH_VALUES.has(arg)) {
      index += 1;
      continue;
    }

    if (arg.startsWith('-')) {
      continue;
    }

    return arg;
  }

  return null;
}

function snapshotDirectories(directory) {
  const snapshot = new Map();

  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (!entry.isDirectory()) {
      continue;
    }

    const fullPath = join(directory, entry.name);
    snapshot.set(fullPath, safeMtimeMs(fullPath));
  }

  return snapshot;
}

function safeMtimeMs(path) {
  try {
    return statSync(path).mtimeMs;
  } catch {
    return 0;
  }
}

function isScaffoldedProject(directory) {
  return (
    existsSync(join(directory, 'package.json')) &&
    (existsSync(join(directory, 'app')) || existsSync(join(directory, 'src', 'app')))
  );
}

function resolveCreatedProjectDirectory() {
  if (requestedProjectPath) {
    const resolvedProjectPath = resolve(startedInDirectory, requestedProjectPath);

    if (isScaffoldedProject(resolvedProjectPath)) {
      return resolvedProjectPath;
    }
  }

  if (!startedInExistingProject && isScaffoldedProject(startedInDirectory)) {
    return startedInDirectory;
  }

  const candidateDirectories = [];

  for (const entry of readdirSync(startedInDirectory, { withFileTypes: true })) {
    if (!entry.isDirectory()) {
      continue;
    }

    const fullPath = join(startedInDirectory, entry.name);
    const existedBefore = startingDirectorySnapshot.has(fullPath);
    const updatedDuringScaffold = safeMtimeMs(fullPath) >= startedAtMs;

    if (!existedBefore || updatedDuringScaffold) {
      if (isScaffoldedProject(fullPath)) {
        candidateDirectories.push({ path: fullPath, mtimeMs: safeMtimeMs(fullPath) });
      }
    }
  }

  candidateDirectories.sort((left, right) => right.mtimeMs - left.mtimeMs);

  return candidateDirectories[0]?.path ?? null;
}

function printManualPluginInstructions() {
  console.warn('Run these commands from your project root to add the recommended plugins:');

  for (const plugin of REQUIRED_PLUGINS) {
    console.warn(`  npx plugins add ${plugin}`);
  }
}

function runCommand(command, args, options = {}) {
  return new Promise((resolvePromise) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
      ...options,
    });

    child.on('error', (error) => {
      resolvePromise({ code: 1, error });
    });

    child.on('close', (code) => {
      resolvePromise({ code: code ?? 1 });
    });
  });
}

async function installRequiredPlugins(projectDirectory) {
  console.log('\nAdding recommended agent plugins...');

  for (const plugin of REQUIRED_PLUGINS) {
    const result = await runCommand('npx', ['plugins', 'add', plugin], {
      cwd: projectDirectory,
    });

    if (result.error?.code === 'ENOENT') {
      console.warn('\nCould not find `npx`, so plugin installation was skipped.');
      printManualPluginInstructions();
      return;
    }

    if (result.code !== 0) {
      console.warn(`\nSkipping ${plugin}. The project was created successfully.`);
      console.warn(
        `If this plugin is not already installed, re-run: npx plugins add ${plugin}`,
      );
    }
  }
}

const runner = getRunner(detectedPackageManager);

async function main() {
  const createNextAppResult = await runCommand(runner.command, [
    ...runner.args,
    'create-next-app@latest',
    '--example',
    'https://github.com/vercel/shop',
    '--example-path',
    'apps/template',
    ...(packageManagerFlag ? [packageManagerFlag] : []),
    ...cliArgs,
  ]);

  if (createNextAppResult.code !== 0) {
    process.exit(createNextAppResult.code);
  }

  const projectDirectory = resolveCreatedProjectDirectory();

  if (!projectDirectory) {
    console.warn('\nThe project was created, but the app directory could not be detected.');
    printManualPluginInstructions();
    process.exit(0);
  }

  await installRequiredPlugins(projectDirectory);
  process.exit(0);
}

void main();
