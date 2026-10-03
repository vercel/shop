#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { realpathSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { get } from 'node:https';
import { resolve } from 'node:path';
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
    explicitPackageManager(cliArgs) ?? detectPackageManager({ userAgent, execPath }) ?? 'npm';
  const positionalName = findPositionalName(cliArgs.filter((arg) => !INTERNAL_FLAGS.has(arg)));

  return { cwd, noTemplate, packageManager, positionalName };
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

export function installDependencies(projectDir, packageManager, run = runCommand) {
  return run(packageManager, ['install'], { cwd: projectDir });
}

export function initGit(projectDir, run = runCommand) {
  return run('git', ['init', '--quiet'], { cwd: projectDir });
}

export function installProjectSkills(projectDir, run = runCommand) {
  return run('npx', ['skills', 'add', 'vercel/shop', '--skill', '*', '--yes'], {
    cwd: projectDir,
  });
}

export function printRetryCommand(projectDir, { scaffolded = true } = {}) {
  if (scaffolded) {
    console.warn('\nVercel Shop scaffolded successfully, but skill installation failed.');
  } else {
    console.warn('\nShop skill installation failed.');
  }

  console.warn(`Retry from ${projectDir}:`);
  console.warn("  npx skills add vercel/shop --skill '*' --yes");
}

export async function main({
  cliArgs = process.argv.slice(2),
  cwd = process.cwd(),
  execPath = process.env.npm_execpath ?? '',
  isTTY = Boolean(process.stdin.isTTY),
  prompt = promptProjectName,
  run = runCommand,
  scaffold = fetchTemplate,
  userAgent = process.env.npm_config_user_agent ?? '',
} = {}) {
  const plan = createExecutionPlan({ cliArgs, cwd, execPath, userAgent });

  let projectName = plan.positionalName;
  if (!plan.noTemplate && projectName === null) {
    if (!isTTY) {
      console.error(
        'A target directory is required in non-interactive environments. Run: npx create-vercel-shop@latest <target-directory>',
      );
      return 1;
    }
    projectName = await prompt();
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

    const installCode = await installDependencies(projectDir, plan.packageManager, run);
    if (installCode !== 0) {
      console.warn(
        `\n${plan.packageManager} install failed. Re-run it from ${projectDir} once resolved.`,
      );
    }

    await initGit(projectDir, run);
  }

  const skillInstallCode = await installProjectSkills(projectDir, run);

  if (skillInstallCode !== 0) {
    printRetryCommand(projectDir, { scaffolded: !plan.noTemplate });
  }

  return 0;
}

// process.argv[1] is the bin symlink (e.g. node_modules/.bin/create-vercel-shop),
// while import.meta.url is the resolved file path — so we realpath argv[1] before comparing.
if (process.argv[1] && import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href) {
  const exitCode = await main();
  process.exit(exitCode);
}
