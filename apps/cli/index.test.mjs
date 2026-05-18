import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import {
  createExecutionPlan,
  DEFAULT_PROJECT_NAME,
  main,
  readTemplateVersion,
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

test('main skips scaffolding and only installs plugins with --no-template', async () => {
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
    assert.equal(calls.length, 3);
    assert.ok(calls.every(({ command }) => command === 'npx'));
    assert.ok(calls.every(({ args }) => args[0] === 'plugins' && args[1] === 'add'));
    assert.ok(calls.every(({ options }) => options.cwd === projectDir));
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

    const pluginCalls = calls.filter(({ args }) => args[0] === 'plugins');
    assert.equal(pluginCalls.length, 3);
    assert.ok(pluginCalls.every(({ options }) => options.cwd === projectDir));
  } finally {
    await rm(tempRoot, { force: true, recursive: true });
  }
});

test('main uses the default name when stdin is not a TTY and no name is given', async () => {
  const tempRoot = await mkdtemp(join(tmpdir(), 'create-vercel-shop-'));
  const scaffoldDirs = [];
  let promptCalls = 0;

  try {
    await main({
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

    assert.equal(promptCalls, 0);
    assert.deepEqual(scaffoldDirs, [join(tempRoot, DEFAULT_PROJECT_NAME)]);
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

    const pluginCalls = calls.filter(({ args }) => args[0] === 'plugins');
    assert.equal(pluginCalls.length, 3);
    assert.ok(pluginCalls.every(({ options }) => options.cwd === projectDir));

    const bootstrapMetadata = JSON.parse(
      await readFile(join(projectDir, '.vercel-shop', 'bootstrap.json'), 'utf8'),
    );
    assert.equal(bootstrapMetadata.templateVersion, await readTemplateVersion());
    assert.ok(Number.isFinite(Date.parse(bootstrapMetadata.scaffoldedAt)));
  } finally {
    await rm(tempRoot, { force: true, recursive: true });
  }
});
