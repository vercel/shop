import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { createExecutionPlan, main } from './index.mjs';

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

test('main skips scaffolding and only installs skills with --no-template', async () => {
  const tempRoot = await mkdtemp(join(tmpdir(), 'create-vercel-shop-'));
  const projectDir = join(tempRoot, 'existing-project');
  const calls = [];
  let scaffoldCalls = 0;

  try {
    const exitCode = await main({
      cliArgs: ['--no-template', projectDir],
      cwd: tempRoot,
      run: async (command, args, options = {}) => {
        calls.push({ args, command, options });
        return 0;
      },
      scaffold: async () => {
        scaffoldCalls += 1;
      },
    });

    assert.equal(exitCode, 0);
    assert.equal(scaffoldCalls, 0);
    assert.deepEqual(calls, [
      {
        args: ['skills', 'add', 'vercel/shop', '--skill', '*', '--yes'],
        command: 'npx',
        options: { cwd: projectDir },
      },
    ]);
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

    const skillCalls = calls.filter(({ args }) => args[0] === 'skills');
    assert.equal(skillCalls.length, 1);
    assert.ok(skillCalls.every(({ options }) => options.cwd === projectDir));
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

test('main scaffolds, installs deps, inits git, and installs skills', async () => {
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

    const skillCalls = calls.filter(({ args }) => args[0] === 'skills');
    assert.equal(skillCalls.length, 1);
    assert.deepEqual(skillCalls[0].args, ['skills', 'add', 'vercel/shop', '--skill', '*', '--yes']);
    assert.equal(skillCalls[0].options.cwd, projectDir);
  } finally {
    await rm(tempRoot, { force: true, recursive: true });
  }
});
