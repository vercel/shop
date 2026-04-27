#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { realpathSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { createInterface } from 'node:readline/promises';
import { pathToFileURL } from 'node:url';

export const NO_TEMPLATE_FLAG = '--no-template';
export const DEFAULT_PROJECT_NAME = 'my-shop';

const PACKAGE_MANAGER_FLAGS = ['--use-pnpm', '--use-npm', '--use-yarn', '--use-bun'];
const flagsWithValues = new Set(['--import-alias']);
const pluginInstalls = [
  ['vercel/shop', '--scope', 'project', '--yes'],
  ['vercel/vercel-plugin', '--scope', 'project', '--yes'],
  ['Shopify/shopify-ai-toolkit', '--scope', 'project', '--yes'],
];

export function hasExplicitPackageManagerFlag(args) {
  return args.some((arg) => PACKAGE_MANAGER_FLAGS.includes(arg));
}

export function detectPackageManager({ userAgent = '', execPath = '' } = {}) {
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

export function getPackageManagerFlag(packageManager) {
  return packageManager === 'pnpm'
    ? '--use-pnpm'
    : packageManager === 'bun'
      ? '--use-bun'
      : packageManager === 'yarn'
        ? '--use-yarn'
        : packageManager === 'npm'
          ? '--use-npm'
          : null;
}

export function stripInternalArgs(args) {
  return args.filter((arg) => arg !== NO_TEMPLATE_FLAG);
}

export function getRunner(packageManager) {
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

export function findPositionalProjectName(args) {
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
      return arg;
    }
  }

  return null;
}

export function findProjectDir(args, cwd = process.cwd()) {
  const name = findPositionalProjectName(args);
  return name ? resolve(cwd, name) : cwd;
}

export async function promptProjectName({
  defaultName = DEFAULT_PROJECT_NAME,
  input = process.stdin,
  output = process.stdout,
} = {}) {
  const rl = createInterface({ input, output });
  try {
    const answer = await rl.question(`What is your project named? (${defaultName}) `);
    return answer.trim() || defaultName;
  } finally {
    rl.close();
  }
}

export function getScaffoldArgs({ cliArgs, packageManagerFlag, runnerArgs = [] }) {
  return [
    ...runnerArgs,
    'create-next-app@latest',
    '--example',
    'https://github.com/vercel/shop',
    '--example-path',
    'apps/template',
    ...(packageManagerFlag ? [packageManagerFlag] : []),
    ...cliArgs,
  ];
}

export function createExecutionPlan({
  cliArgs,
  cwd = process.cwd(),
  execPath = process.env.npm_execpath ?? '',
  userAgent = process.env.npm_config_user_agent ?? '',
} = {}) {
  const forwardedArgs = stripInternalArgs(cliArgs);
  const explicitPackageManager = hasExplicitPackageManagerFlag(cliArgs);
  const detectedPackageManager = explicitPackageManager
    ? null
    : detectPackageManager({ userAgent, execPath });
  const packageManagerFlag = getPackageManagerFlag(detectedPackageManager);
  const runner = getRunner(detectedPackageManager);
  const noTemplate = cliArgs.includes(NO_TEMPLATE_FLAG);
  const projectDir = findProjectDir(forwardedArgs, cwd);

  return {
    detectedPackageManager,
    forwardedArgs,
    noTemplate,
    packageManagerFlag,
    projectDir,
    runner,
    scaffoldArgs: noTemplate
      ? null
      : getScaffoldArgs({
          cliArgs: forwardedArgs,
          packageManagerFlag,
          runnerArgs: runner.args,
        }),
  };
}

export async function readTemplateVersion(importMetaUrl = import.meta.url) {
  const packageJson = new URL('./package.json', importMetaUrl);
  const raw = await readFile(packageJson, 'utf8');
  const pkg = JSON.parse(raw);
  return pkg.shopTemplateVersion;
}

export function runCommand(command, args, options = {}) {
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

export async function ensureProjectDir(projectDir) {
  await mkdir(projectDir, { recursive: true });
}

export async function writeBootstrapMetadata(
  projectDir,
  templateVersion,
  scaffoldedAt = new Date().toISOString(),
) {
  const metadataDir = join(projectDir, '.vercel-shop');
  const metadataPath = join(metadataDir, 'bootstrap.json');

  await mkdir(metadataDir, { recursive: true });
  await writeFile(
    metadataPath,
    `${JSON.stringify({ scaffoldedAt, templateVersion }, null, 2)}\n`,
    'utf8',
  );
}

export async function installProjectPlugins(projectDir, run = runCommand) {
  const failures = [];

  for (const args of pluginInstalls) {
    const code = await run('npx', ['plugins', 'add', ...args], {
      cwd: projectDir,
    });

    if (code !== 0) {
      failures.push(args[0]);
    }
  }

  return failures;
}

export function printRetryCommands(projectDir, { scaffolded = true } = {}) {
  if (scaffolded) {
    console.warn('\nVercel Shop scaffolded successfully, but one or more plugin installs failed.');
  } else {
    console.warn('\nProject plugin installation failed.');
  }

  console.warn(`Retry from ${projectDir}:`);
  console.warn('  npx plugins add vercel/shop --scope project --yes');
  console.warn('  npx plugins add vercel/vercel-plugin --scope project --yes');
  console.warn('  npx plugins add Shopify/shopify-ai-toolkit --scope project --yes');
}

export async function main({
  cliArgs = process.argv.slice(2),
  cwd = process.cwd(),
  execPath = process.env.npm_execpath ?? '',
  importMetaUrl = import.meta.url,
  isTTY = Boolean(process.stdin.isTTY),
  prompt = promptProjectName,
  run = runCommand,
  userAgent = process.env.npm_config_user_agent ?? '',
} = {}) {
  // Pre-prompt for the project name when none is given. Without this,
  // create-next-app would prompt interactively but in its own subprocess —
  // we'd never learn the chosen name and would run plugin installs against
  // the parent directory.
  let effectiveCliArgs = cliArgs;
  const noTemplate = cliArgs.includes(NO_TEMPLATE_FLAG);
  if (
    !noTemplate &&
    isTTY &&
    findPositionalProjectName(stripInternalArgs(cliArgs)) === null
  ) {
    const name = await prompt();
    effectiveCliArgs = [name, ...cliArgs];
  }

  const plan = createExecutionPlan({
    cliArgs: effectiveCliArgs,
    cwd,
    execPath,
    userAgent,
  });

  if (!plan.noTemplate) {
    const scaffoldCode = await run(plan.runner.command, plan.scaffoldArgs);

    if (scaffoldCode !== 0) {
      return scaffoldCode;
    }

    try {
      const templateVersion = await readTemplateVersion(importMetaUrl);
      await writeBootstrapMetadata(plan.projectDir, templateVersion);
    } catch (error) {
      console.warn('\nScaffold completed, but bootstrap metadata could not be written.');
      console.warn(error instanceof Error ? error.message : String(error));
      printRetryCommands(plan.projectDir);
      return 0;
    }
  } else {
    await ensureProjectDir(plan.projectDir);
  }

  const failedPlugins = await installProjectPlugins(plan.projectDir, run);

  if (failedPlugins.length > 0) {
    printRetryCommands(plan.projectDir, { scaffolded: !plan.noTemplate });
  }

  return 0;
}

// process.argv[1] is the bin symlink (e.g. node_modules/.bin/create-vercel-shop),
// while import.meta.url is the resolved file path — so we realpath argv[1] before comparing.
if (process.argv[1] && import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href) {
  const exitCode = await main();
  process.exit(exitCode);
}
