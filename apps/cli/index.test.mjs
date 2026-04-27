import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import test from 'node:test';

import { createExecutionPlan, main, readTemplateVersion } from './index.mjs';

test('createExecutionPlan removes internal flags and targets cwd by default for --no-template', () => {
  const cwd = '/tmp/workspace';
  const plan = createExecutionPlan({
    cliArgs: ['--no-template', '--use-pnpm'],
    cwd,
    userAgent: 'pnpm/10.0.0',
  });

  assert.equal(plan.noTemplate, true);
  assert.deepEqual(plan.forwardedArgs, ['--use-pnpm']);
  assert.equal(plan.projectDir, cwd);
  assert.equal(plan.scaffoldArgs, null);
});

test('createExecutionPlan finds the project directory after option values', () => {
  const cwd = '/tmp/workspace';
  const plan = createExecutionPlan({
    cliArgs: ['--import-alias', '@/*', 'my-store', '--no-template'],
    cwd,
  });

  assert.equal(plan.projectDir, join(cwd, 'my-store'));
  assert.deepEqual(plan.forwardedArgs, ['--import-alias', '@/*', 'my-store']);
});

test('main skips scaffolding and only installs plugins with --no-template', async () => {
  const tempRoot = await mkdtemp(join(tmpdir(), 'create-vercel-shop-'));
  const projectDir = join(tempRoot, 'existing-project');
  const calls = [];

  try {
    const exitCode = await main({
      cliArgs: ['--no-template', projectDir],
      cwd: tempRoot,
      run: async (command, args, options = {}) => {
        calls.push({ command, args, options });
        return 0;
      },
    });

    assert.equal(exitCode, 0);
    assert.equal(calls.length, 3);
    assert.ok(calls.every(({ command }) => command === 'npx'));
    assert.ok(
      calls.every(({ args }) => args[0] === 'plugins' && args[1] === 'add'),
    );
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
        calls.push({ command, args, options });
        return 0;
      },
    });

    assert.equal(exitCode, 0);
    assert.equal(promptCalls, 1);
    assert.ok(calls[0].args.includes('create-next-app@latest'));
    assert.ok(calls[0].args.includes(promptedName));

    const pluginCalls = calls.filter(({ args }) => args[0] === 'plugins');
    assert.equal(pluginCalls.length, 3);
    assert.ok(pluginCalls.every(({ options }) => options.cwd === projectDir));
  } finally {
    await rm(tempRoot, { force: true, recursive: true });
  }
});

test('main does not prompt when stdin is not a TTY', async () => {
  const tempRoot = await mkdtemp(join(tmpdir(), 'create-vercel-shop-'));
  const calls = [];
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
      run: async (command, args, options = {}) => {
        calls.push({ command, args, options });
        return 0;
      },
    });

    assert.equal(promptCalls, 0);
  } finally {
    await rm(tempRoot, { force: true, recursive: true });
  }
});

test('main scaffolds the template and writes bootstrap metadata by default', async () => {
  const tempRoot = await mkdtemp(join(tmpdir(), 'create-vercel-shop-'));
  const projectName = 'my-store';
  const projectDir = join(tempRoot, projectName);
  const calls = [];

  try {
    const exitCode = await main({
      cliArgs: [projectName],
      cwd: tempRoot,
      run: async (command, args, options = {}) => {
        calls.push({ command, args, options });
        return 0;
      },
    });

    assert.equal(exitCode, 0);
    assert.equal(calls.length, 4);
    assert.equal(calls[0].command, 'npx');
    assert.ok(calls[0].args.includes('create-next-app@latest'));
    assert.ok(calls[0].args.includes(projectName));

    const bootstrapMetadata = JSON.parse(
      await readFile(join(projectDir, '.vercel-shop', 'bootstrap.json'), 'utf8'),
    );

    assert.equal(bootstrapMetadata.templateVersion, await readTemplateVersion());
    assert.equal(typeof bootstrapMetadata.scaffoldedAt, 'string');
    assert.ok(Number.isFinite(Date.parse(bootstrapMetadata.scaffoldedAt)));
  } finally {
    await rm(tempRoot, { force: true, recursive: true });
  }
});
