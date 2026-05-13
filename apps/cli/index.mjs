#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { realpathSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { get } from 'node:https';
import { join, resolve } from 'node:path';
import { createInterface } from 'node:readline/promises';
import { pathToFileURL } from 'node:url';

export const NO_TEMPLATE_FLAG = '--no-template';
export const DEFAULT_PROJECT_NAME = 'my-shop';
export const TEMPLATE_TARBALL_URL =
  'https://codeload.github.com/vercel/shop/tar.gz/refs/heads/main';
export const TEMPLATE_TARBALL_PREFIX = 'shop-main/apps/template';

const PACKAGE_MANAGER_FLAGS = {
  '--use-bun': 'bun',
  '--use-npm': 'npm',
  '--use-pnpm': 'pnpm',
  '--use-yarn': 'yarn',
};
const INTERNAL_FLAGS = new Set([NO_TEMPLATE_FLAG, ...Object.keys(PACKAGE_MANAGER_FLAGS)]);

const pluginInstalls = [
  ['vercel/shop', '--scope', 'project', '--yes'],
  ['vercel/vercel-plugin', '--scope', 'project', '--yes'],
  ['Shopify/shopify-ai-toolkit', '--scope', 'project', '--yes'],
];

export function explicitPackageManager(args) {
  for (const arg of args) {
    if (PACKAGE_MANAGER_FLAGS[arg]) return PACKAGE_MANAGER_FLAGS[arg];
  }
  return null;
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

export function findPositionalName(args) {
  for (const arg of args) {
    if (!arg.startsWith('-')) return arg;
  }
  return null;
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

export function createExecutionPlan({
  cliArgs,
  cwd = process.cwd(),
  execPath = process.env.npm_execpath ?? '',
  userAgent = process.env.npm_config_user_agent ?? '',
} = {}) {
  const noTemplate = cliArgs.includes(NO_TEMPLATE_FLAG);
  const packageManager =
    explicitPackageManager(cliArgs) ??
    detectPackageManager({ userAgent, execPath }) ??
    'npm';
  const positionalName = findPositionalName(
    cliArgs.filter((arg) => !INTERNAL_FLAGS.has(arg)),
  );

  return { cwd, noTemplate, packageManager, positionalName };
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

function fetchResponse(url, depth = 0) {
  if (depth > 5) {
    return Promise.reject(new Error('Too many redirects fetching template tarball'));
  }
  return new Promise((resolveReq, rejectReq) => {
    const req = get(url, (res) => {
      const { statusCode = 0, headers } = res;
      if (statusCode >= 300 && statusCode < 400 && headers.location) {
        res.resume();
        fetchResponse(headers.location, depth + 1).then(resolveReq, rejectReq);
        return;
      }
      if (statusCode !== 200) {
        res.resume();
        rejectReq(new Error(`Template download failed with status ${statusCode}`));
        return;
      }
      resolveReq(res);
    });
    req.on('error', rejectReq);
  });
}

export async function fetchTemplate(
  projectDir,
  { url = TEMPLATE_TARBALL_URL, prefix = TEMPLATE_TARBALL_PREFIX } = {},
) {
  const stripComponents = prefix.split('/').length;
  const tar = spawn(
    'tar',
    ['-xz', `--strip-components=${stripComponents}`, '-C', projectDir, prefix],
    { stdio: ['pipe', 'inherit', 'inherit'] },
  );

  const tarClosed = new Promise((resolveTar, rejectTar) => {
    tar.on('error', rejectTar);
    tar.on('close', (code) => {
      if (code === 0) resolveTar();
      else rejectTar(new Error(`tar exited with code ${code}`));
    });
  });

  const response = await fetchResponse(url);
  response.pipe(tar.stdin);
  await tarClosed;
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

export function installDependencies(projectDir, packageManager, run = runCommand) {
  return run(packageManager, ['install'], { cwd: projectDir });
}

export function initGit(projectDir, run = runCommand) {
  return run('git', ['init', '--quiet'], { cwd: projectDir });
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
  scaffold = fetchTemplate,
  userAgent = process.env.npm_config_user_agent ?? '',
} = {}) {
  const plan = createExecutionPlan({ cliArgs, cwd, execPath, userAgent });

  let projectName = plan.positionalName;
  if (!plan.noTemplate && projectName === null) {
    projectName = isTTY ? await prompt() : DEFAULT_PROJECT_NAME;
  }

  const projectDir = projectName ? resolve(plan.cwd, projectName) : plan.cwd;

  await ensureProjectDir(projectDir);

  if (!plan.noTemplate) {
    try {
      await scaffold(projectDir);
    } catch (error) {
      console.error('\nFailed to download the Vercel Shop template.');
      console.error(error instanceof Error ? error.message : String(error));
      return 1;
    }

    try {
      const templateVersion = await readTemplateVersion(importMetaUrl);
      await writeBootstrapMetadata(projectDir, templateVersion);
    } catch (error) {
      console.warn('\nScaffold completed, but bootstrap metadata could not be written.');
      console.warn(error instanceof Error ? error.message : String(error));
    }

    const installCode = await installDependencies(projectDir, plan.packageManager, run);
    if (installCode !== 0) {
      console.warn(
        `\n${plan.packageManager} install failed. Re-run it from ${projectDir} once resolved.`,
      );
    }

    await initGit(projectDir, run);
  }

  const failedPlugins = await installProjectPlugins(projectDir, run);

  if (failedPlugins.length > 0) {
    printRetryCommands(projectDir, { scaffolded: !plan.noTemplate });
  }

  return 0;
}

// process.argv[1] is the bin symlink (e.g. node_modules/.bin/create-vercel-shop),
// while import.meta.url is the resolved file path — so we realpath argv[1] before comparing.
if (process.argv[1] && import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href) {
  const exitCode = await main();
  process.exit(exitCode);
}
