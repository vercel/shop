#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { realpathSync } from 'node:fs';
import {
  cp,
  mkdir,
  mkdtemp,
  readdir,
  readFile,
  rm,
  symlink,
  writeFile,
} from 'node:fs/promises';
import { get } from 'node:https';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { createInterface } from 'node:readline/promises';
import { pathToFileURL } from 'node:url';

export const NO_TEMPLATE_FLAG = '--no-template';
export const FORCE_FLAG = '--force';
export const DEFAULT_PROJECT_NAME = 'my-shop';
export const TEMPLATE_TARBALL_URL =
  'https://codeload.github.com/vercel/shop/tar.gz/refs/heads/main';
export const TEMPLATE_TARBALL_PREFIX = 'shop-main/apps/template';
export const SKILLS_TARBALL_PREFIX = 'shop-main/packages/plugin/skills';
export const COMMANDS_TARBALL_PREFIX = 'shop-main/packages/plugin/commands';

const PACKAGE_MANAGER_FLAGS = {
  '--use-bun': 'bun',
  '--use-npm': 'npm',
  '--use-pnpm': 'pnpm',
  '--use-yarn': 'yarn',
};
const INTERNAL_FLAGS = new Set([
  FORCE_FLAG,
  NO_TEMPLATE_FLAG,
  ...Object.keys(PACKAGE_MANAGER_FLAGS),
]);

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

export async function promptOverwrite({
  entries = [],
  input = process.stdin,
  output = process.stdout,
  projectDir,
} = {}) {
  const rl = createInterface({ input, output });
  try {
    const answer = await rl.question(
      `${projectDir} already contains ${describeEntries(entries)}. Scaffolding may overwrite existing files. Continue? (y/N) `,
    );
    return /^y(es)?$/i.test(answer.trim());
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
  const force = cliArgs.includes(FORCE_FLAG);
  const noTemplate = cliArgs.includes(NO_TEMPLATE_FLAG);
  const packageManager =
    explicitPackageManager(cliArgs) ??
    detectPackageManager({ userAgent, execPath }) ??
    'npm';
  const positionalName = findPositionalName(
    cliArgs.filter((arg) => !INTERNAL_FLAGS.has(arg)),
  );

  return { cwd, force, noTemplate, packageManager, positionalName };
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

export async function inlineAgentAssets(projectDir, stagingDir) {
  const skillsSrc = join(stagingDir, SKILLS_TARBALL_PREFIX);
  const commandsSrc = join(stagingDir, COMMANDS_TARBALL_PREFIX);

  const agentSkillsDir = join(projectDir, '.agents', 'skills');
  const claudeSkillsDir = join(projectDir, '.claude', 'skills');
  const claudeCommandsDir = join(projectDir, '.claude', 'commands');

  await mkdir(agentSkillsDir, { recursive: true });
  await mkdir(claudeSkillsDir, { recursive: true });
  await mkdir(claudeCommandsDir, { recursive: true });

  const skillNames = (await readdir(skillsSrc, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

  for (const name of skillNames) {
    const canonical = join(agentSkillsDir, name);
    await rm(canonical, { force: true, recursive: true });
    await cp(join(skillsSrc, name), canonical, { recursive: true });

    // Claude Code discovers project skills in .claude/skills. Link to the
    // canonical .agents/skills copy (same layout `npx skills add` produces);
    // fall back to a copy where symlinks are unavailable (e.g. Windows
    // without Developer Mode).
    const link = join(claudeSkillsDir, name);
    await rm(link, { force: true, recursive: true });
    try {
      await symlink(join('..', '..', '.agents', 'skills', name), link, 'junction');
    } catch {
      await cp(join(skillsSrc, name), link, { recursive: true });
    }
  }

  await cp(commandsSrc, claudeCommandsDir, { recursive: true });

  return skillNames;
}

export async function fetchTemplate(
  projectDir,
  {
    includeTemplate = true,
    prefix = TEMPLATE_TARBALL_PREFIX,
    url = TEMPLATE_TARBALL_URL,
  } = {},
) {
  const stagingDir = await mkdtemp(join(tmpdir(), 'create-vercel-shop-'));

  try {
    const extractPaths = [SKILLS_TARBALL_PREFIX, COMMANDS_TARBALL_PREFIX];
    if (includeTemplate) extractPaths.unshift(prefix);

    const tar = spawn('tar', ['-xz', '-C', stagingDir, ...extractPaths], {
      stdio: ['pipe', 'inherit', 'inherit'],
    });

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

    if (includeTemplate) {
      await cp(join(stagingDir, prefix), projectDir, { recursive: true });
    }

    await inlineAgentAssets(projectDir, stagingDir);
  } finally {
    await rm(stagingDir, { force: true, recursive: true });
  }
}

// Missing target is the happy path — it becomes an empty directory below.
// Anything else (a file at that path, EACCES, …) is surfaced to the caller so
// the CLI stops instead of copying the template on top of it.
export async function readTargetEntries(projectDir) {
  try {
    return await readdir(projectDir);
  } catch (error) {
    if (error?.code === 'ENOENT') return [];
    throw error;
  }
}

function describeEntries(entries) {
  const shown = [...entries].sort().slice(0, 5);
  const remaining = entries.length - shown.length;
  const listed = shown.join(', ');
  return remaining > 0 ? `${listed}, and ${remaining} more` : listed;
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

export function printAgentSetupSummary() {
  console.log(
    '\nAgent skills installed to .agents/skills (Claude Code links in .claude/skills, commands in .claude/commands).',
  );
  console.log('\nRecommended companion plugins (optional, run from the project root):');
  console.log('  npx plugins add vercel/vercel-plugin --scope project --yes');
  console.log('  npx plugins add Shopify/shopify-ai-toolkit --scope project --yes');
}

export async function main({
  cliArgs = process.argv.slice(2),
  confirmOverwrite = promptOverwrite,
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
    if (!isTTY) {
      console.error(
        'A target directory is required in non-interactive environments. Run: npx create-vercel-shop@latest <target-directory>',
      );
      return 1;
    }
    projectName = await prompt();
  }

  const projectDir = projectName ? resolve(plan.cwd, projectName) : plan.cwd;

  // A full scaffold copies the template over whatever is already there, so it
  // has to run against an empty (or newly created) directory. `--no-template`
  // is exempt: it only adds agent assets, and existing projects are its whole
  // point.
  if (!plan.noTemplate) {
    let entries;
    try {
      entries = await readTargetEntries(projectDir);
    } catch (error) {
      console.error(`\nCannot scaffold into ${projectDir}.`);
      console.error(error instanceof Error ? error.message : String(error));
      return 1;
    }

    if (entries.length > 0) {
      if (plan.force) {
        console.warn(
          `\nScaffolding into non-empty ${projectDir} because ${FORCE_FLAG} was passed. Existing files may be overwritten.`,
        );
      } else if (!isTTY) {
        console.error(`\n${projectDir} is not empty (${describeEntries(entries)}).`);
        console.error(
          `Scaffolding would overwrite files that are already there. Pick an empty target directory, or pass ${FORCE_FLAG} to scaffold into this one anyway.`,
        );
        return 1;
      } else {
        const proceed = await confirmOverwrite({ entries, projectDir });
        if (!proceed) {
          console.error('\nAborted. No files were written.');
          return 1;
        }
      }
    }
  }

  await ensureProjectDir(projectDir);

  if (plan.noTemplate) {
    try {
      await scaffold(projectDir, { includeTemplate: false });
    } catch (error) {
      console.error('\nFailed to download the Vercel Shop agent skills.');
      console.error(error instanceof Error ? error.message : String(error));
      return 1;
    }

    printAgentSetupSummary();
    return 0;
  }

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

  printAgentSetupSummary();
  return 0;
}

// process.argv[1] is the bin symlink (e.g. node_modules/.bin/create-vercel-shop),
// while import.meta.url is the resolved file path — so we realpath argv[1] before comparing.
if (process.argv[1] && import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href) {
  const exitCode = await main();
  process.exit(exitCode);
}
