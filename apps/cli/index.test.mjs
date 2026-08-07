import assert from 'node:assert/strict';
import { lstat, mkdir, mkdtemp, readFile, realpath, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import {
  COMMANDS_TARBALL_PREFIX,
  createExecutionPlan,
  inlineAgentAssets,
  main,
  readTemplateVersion,
  SKILLS_TARBALL_PREFIX,
} from './index.mjs';

test('createExecutionPlan parses --no-template and an explicit package manager', () => {
  const plan = createExecutionPlan({
    cliArgs: ['--no-template', '--use-pnpm'],
    cwd: '/tmp/workspace',
    userAgent: 'npm/10.0.0',
  });

  assert.equal(plan.noTemplate, true);
  assert.equal(plan.packageManager, 'pnpm');
  assert.equal(plan.positionalName, null);
});

test('createExecutionPlan finds the positional project name and ignores internal flags', () => {
  const plan = createExecutionPlan({
    cliArgs: ['--use-bun', 'my-store', '--no-template'],
    cwd: '/tmp/workspace',
  });

  assert.equal(plan.positionalName, 'my-store');
  assert.equal(plan.noTemplate, true);
  assert.equal(plan.packageManager, 'bun');
});

test('createExecutionPlan falls back to npm when nothing is detected', () => {
  const plan = createExecutionPlan({
    cliArgs: [],
    cwd: '/tmp/workspace',
    execPath: '',
    userAgent: '',
  });

  assert.equal(plan.packageManager, 'npm');
  assert.equal(plan.positionalName, null);
});

test('main only inlines agent assets with --no-template and runs no subprocesses', async () => {
  const tempRoot = await mkdtemp(join(tmpdir(), 'create-vercel-shop-'));
  const projectDir = join(tempRoot, 'existing-project');
  const calls = [];
  const scaffoldCalls = [];

  try {
    const exitCode = await main({
      cliArgs: ['--no-template', projectDir],
      cwd: tempRoot,
      run: async (command, args, options = {}) => {
        calls.push({ args, command, options });
        return 0;
      },
      scaffold: async (dir, options) => {
        scaffoldCalls.push({ dir, options });
      },
    });

    assert.equal(exitCode, 0);
    assert.deepEqual(scaffoldCalls, [
      { dir: projectDir, options: { includeTemplate: false } },
    ]);
    assert.equal(calls.length, 0);
  } finally {
    await rm(tempRoot, { force: true, recursive: true });
  }
});

test('main returns 1 when the --no-template asset download fails', async () => {
  const tempRoot = await mkdtemp(join(tmpdir(), 'create-vercel-shop-'));
  const projectDir = join(tempRoot, 'existing-project');
  const calls = [];

  try {
    const exitCode = await main({
      cliArgs: ['--no-template', projectDir],
      cwd: tempRoot,
      run: async (command, args, options = {}) => {
        calls.push({ args, command, options });
        return 0;
      },
      scaffold: async () => {
        throw new Error('download failed');
      },
    });

    assert.equal(exitCode, 1);
    assert.equal(calls.length, 0);
  } finally {
    await rm(tempRoot, { force: true, recursive: true });
  }
});

test('main prompts for a project name when none is given and stdin is a TTY', async () => {
  const tempRoot = await mkdtemp(join(tmpdir(), 'create-vercel-shop-'));
  const promptedName = 'prompted-shop';
  const projectDir = join(tempRoot, promptedName);
  const calls = [];
  const scaffoldDirs = [];
  let promptCalls = 0;

  try {
    const exitCode = await main({
      cliArgs: [],
      cwd: tempRoot,
      isTTY: true,
      prompt: async () => {
        promptCalls += 1;
        return promptedName;
      },
      run: async (command, args, options = {}) => {
        calls.push({ args, command, options });
        return 0;
      },
      scaffold: async (dir) => {
        scaffoldDirs.push(dir);
      },
    });

    assert.equal(exitCode, 0);
    assert.equal(promptCalls, 1);
    assert.deepEqual(scaffoldDirs, [projectDir]);
    assert.deepEqual(
      calls.map(({ command }) => command),
      ['npm', 'git'],
    );
    assert.ok(calls.every(({ options }) => options.cwd === projectDir));
  } finally {
    await rm(tempRoot, { force: true, recursive: true });
  }
});

test('main requires an explicit target when stdin is not a TTY', async () => {
  const tempRoot = await mkdtemp(join(tmpdir(), 'create-vercel-shop-'));
  const scaffoldDirs = [];
  let promptCalls = 0;

  try {
    const exitCode = await main({
      cliArgs: [],
      cwd: tempRoot,
      isTTY: false,
      prompt: async () => {
        promptCalls += 1;
        return 'should-not-be-used';
      },
      run: async () => 0,
      scaffold: async (dir) => {
        scaffoldDirs.push(dir);
      },
    });

    assert.equal(exitCode, 1);
    assert.equal(promptCalls, 0);
    assert.deepEqual(scaffoldDirs, []);
  } finally {
    await rm(tempRoot, { force: true, recursive: true });
  }
});

test('main scaffolds, installs deps, inits git, and writes bootstrap metadata', async () => {
  const tempRoot = await mkdtemp(join(tmpdir(), 'create-vercel-shop-'));
  const projectName = 'my-store';
  const projectDir = join(tempRoot, projectName);
  const calls = [];
  const scaffoldDirs = [];

  try {
    const exitCode = await main({
      cliArgs: [projectName, '--use-pnpm'],
      cwd: tempRoot,
      run: async (command, args, options = {}) => {
        calls.push({ args, command, options });
        return 0;
      },
      scaffold: async (dir) => {
        scaffoldDirs.push(dir);
      },
    });

    assert.equal(exitCode, 0);
    assert.deepEqual(scaffoldDirs, [projectDir]);

    const installCall = calls.find(({ command }) => command === 'pnpm');
    assert.ok(installCall, 'expected pnpm install');
    assert.deepEqual(installCall.args, ['install']);
    assert.equal(installCall.options.cwd, projectDir);

    const gitCall = calls.find(({ command }) => command === 'git');
    assert.ok(gitCall, 'expected git init');
    assert.deepEqual(gitCall.args, ['init', '--quiet']);
    assert.equal(gitCall.options.cwd, projectDir);

    assert.equal(
      calls.filter(({ command }) => command === 'npx').length,
      0,
      'expected no npx subprocesses',
    );

    const bootstrapMetadata = JSON.parse(
      await readFile(join(projectDir, '.vercel-shop', 'bootstrap.json'), 'utf8'),
    );
    assert.equal(bootstrapMetadata.templateVersion, await readTemplateVersion());
    assert.ok(Number.isFinite(Date.parse(bootstrapMetadata.scaffoldedAt)));
  } finally {
    await rm(tempRoot, { force: true, recursive: true });
  }
});

test('inlineAgentAssets copies skills to .agents/skills, links .claude/skills, and copies commands', async () => {
  const tempRoot = await mkdtemp(join(tmpdir(), 'create-vercel-shop-'));
  const stagingDir = join(tempRoot, 'staging');
  const projectDir = join(tempRoot, 'project');

  try {
    const skillsSrc = join(stagingDir, SKILLS_TARBALL_PREFIX);
    const commandsSrc = join(stagingDir, COMMANDS_TARBALL_PREFIX);
    await mkdir(join(skillsSrc, 'enable-analytics'), { recursive: true });
    await writeFile(
      join(skillsSrc, 'enable-analytics', 'SKILL.md'),
      '# enable-analytics\n',
      'utf8',
    );
    await mkdir(join(skillsSrc, 'build-shop', 'references'), { recursive: true });
    await writeFile(join(skillsSrc, 'build-shop', 'SKILL.md'), '# build-shop\n', 'utf8');
    await writeFile(join(skillsSrc, 'build-shop', 'references', 'a.md'), 'ref\n', 'utf8');
    await mkdir(commandsSrc, { recursive: true });
    await writeFile(join(commandsSrc, 'vercel-shop-bootstrap.md'), '# bootstrap\n', 'utf8');
    await mkdir(projectDir, { recursive: true });

    const skillNames = await inlineAgentAssets(projectDir, stagingDir);

    assert.deepEqual(skillNames, ['build-shop', 'enable-analytics']);

    assert.equal(
      await readFile(join(projectDir, '.agents', 'skills', 'build-shop', 'SKILL.md'), 'utf8'),
      '# build-shop\n',
    );
    assert.equal(
      await readFile(
        join(projectDir, '.agents', 'skills', 'build-shop', 'references', 'a.md'),
        'utf8',
      ),
      'ref\n',
    );

    // .claude/skills entries resolve to the same content (symlink or copy fallback).
    const claudeSkill = join(projectDir, '.claude', 'skills', 'enable-analytics');
    assert.equal(await readFile(join(claudeSkill, 'SKILL.md'), 'utf8'), '# enable-analytics\n');
    const stats = await lstat(claudeSkill);
    if (stats.isSymbolicLink()) {
      assert.equal(
        await realpath(claudeSkill),
        await realpath(join(projectDir, '.agents', 'skills', 'enable-analytics')),
      );
    }

    assert.equal(
      await readFile(join(projectDir, '.claude', 'commands', 'vercel-shop-bootstrap.md'), 'utf8'),
      '# bootstrap\n',
    );
  } finally {
    await rm(tempRoot, { force: true, recursive: true });
  }
});
