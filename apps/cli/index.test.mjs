import assert from 'node:assert/strict';
import { lstat, mkdir, mkdtemp, readFile, realpath, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import {
  COMMANDS_TARBALL_PREFIX,
  createExecutionPlan,
  FORCE_FLAG,
  inlineAgentAssets,
  main,
  readTargetEntries,
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

test('createExecutionPlan parses --force without treating it as the project name', () => {
  const plan = createExecutionPlan({
    cliArgs: [FORCE_FLAG, 'my-store'],
    cwd: '/tmp/workspace',
  });

  assert.equal(plan.force, true);
  assert.equal(plan.positionalName, 'my-store');
});

test('createExecutionPlan defaults force to false', () => {
  const plan = createExecutionPlan({ cliArgs: ['my-store'], cwd: '/tmp/workspace' });

  assert.equal(plan.force, false);
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

test('readTargetEntries reports an absent directory as empty', async () => {
  const tempRoot = await mkdtemp(join(tmpdir(), 'create-vercel-shop-'));

  try {
    assert.deepEqual(await readTargetEntries(join(tempRoot, 'nope')), []);
    assert.deepEqual(await readTargetEntries(tempRoot), []);

    await writeFile(join(tempRoot, 'file.txt'), 'hi\n', 'utf8');
    assert.deepEqual(await readTargetEntries(tempRoot), ['file.txt']);

    await assert.rejects(() => readTargetEntries(join(tempRoot, 'file.txt')));
  } finally {
    await rm(tempRoot, { force: true, recursive: true });
  }
});

test('main refuses to scaffold into a non-empty directory when not a TTY', async () => {
  const tempRoot = await mkdtemp(join(tmpdir(), 'create-vercel-shop-'));
  const projectDir = join(tempRoot, 'existing-project');
  const existingFile = join(projectDir, 'package.json');
  const calls = [];
  const scaffoldDirs = [];

  try {
    await mkdir(projectDir, { recursive: true });
    await writeFile(existingFile, '{ "name": "mine" }\n', 'utf8');

    const exitCode = await main({
      cliArgs: ['existing-project'],
      confirmOverwrite: async () => {
        throw new Error('should not prompt without a TTY');
      },
      cwd: tempRoot,
      isTTY: false,
      run: async (command, args, options = {}) => {
        calls.push({ args, command, options });
        return 0;
      },
      scaffold: async (dir) => {
        scaffoldDirs.push(dir);
      },
    });

    assert.equal(exitCode, 1);
    assert.deepEqual(scaffoldDirs, [], 'expected no scaffold into a non-empty directory');
    assert.deepEqual(calls, [], 'expected no install or git subprocesses');
    assert.equal(await readFile(existingFile, 'utf8'), '{ "name": "mine" }\n');
  } finally {
    await rm(tempRoot, { force: true, recursive: true });
  }
});

test('main treats a directory holding only dotfiles as non-empty', async () => {
  const tempRoot = await mkdtemp(join(tmpdir(), 'create-vercel-shop-'));
  const projectDir = join(tempRoot, 'existing-project');
  const scaffoldDirs = [];

  try {
    await mkdir(join(projectDir, '.git'), { recursive: true });

    const exitCode = await main({
      cliArgs: ['existing-project'],
      cwd: tempRoot,
      isTTY: false,
      run: async () => 0,
      scaffold: async (dir) => {
        scaffoldDirs.push(dir);
      },
    });

    assert.equal(exitCode, 1);
    assert.deepEqual(scaffoldDirs, []);
  } finally {
    await rm(tempRoot, { force: true, recursive: true });
  }
});

test('main scaffolds into an existing but empty directory without confirmation', async () => {
  const tempRoot = await mkdtemp(join(tmpdir(), 'create-vercel-shop-'));
  const projectDir = join(tempRoot, 'existing-project');
  const scaffoldDirs = [];

  try {
    await mkdir(projectDir, { recursive: true });

    const exitCode = await main({
      cliArgs: ['existing-project'],
      confirmOverwrite: async () => {
        throw new Error('should not prompt for an empty directory');
      },
      cwd: tempRoot,
      isTTY: true,
      run: async () => 0,
      scaffold: async (dir) => {
        scaffoldDirs.push(dir);
      },
    });

    assert.equal(exitCode, 0);
    assert.deepEqual(scaffoldDirs, [projectDir]);
  } finally {
    await rm(tempRoot, { force: true, recursive: true });
  }
});

test('main aborts a non-empty scaffold when the TTY confirmation is declined', async () => {
  const tempRoot = await mkdtemp(join(tmpdir(), 'create-vercel-shop-'));
  const projectDir = join(tempRoot, 'existing-project');
  const confirmCalls = [];
  const scaffoldDirs = [];
  const calls = [];

  try {
    await mkdir(projectDir, { recursive: true });
    await writeFile(join(projectDir, 'package.json'), '{}\n', 'utf8');

    const exitCode = await main({
      cliArgs: ['existing-project'],
      confirmOverwrite: async (options) => {
        confirmCalls.push(options);
        return false;
      },
      cwd: tempRoot,
      isTTY: true,
      run: async (command, args, options = {}) => {
        calls.push({ args, command, options });
        return 0;
      },
      scaffold: async (dir) => {
        scaffoldDirs.push(dir);
      },
    });

    assert.equal(exitCode, 1);
    assert.equal(confirmCalls.length, 1);
    assert.equal(confirmCalls[0].projectDir, projectDir);
    assert.deepEqual(confirmCalls[0].entries, ['package.json']);
    assert.deepEqual(scaffoldDirs, []);
    assert.deepEqual(calls, []);
  } finally {
    await rm(tempRoot, { force: true, recursive: true });
  }
});

test('main scaffolds a non-empty directory when the TTY confirmation is accepted', async () => {
  const tempRoot = await mkdtemp(join(tmpdir(), 'create-vercel-shop-'));
  const projectDir = join(tempRoot, 'existing-project');
  const scaffoldDirs = [];
  let confirmCalls = 0;

  try {
    await mkdir(projectDir, { recursive: true });
    await writeFile(join(projectDir, 'package.json'), '{}\n', 'utf8');

    const exitCode = await main({
      cliArgs: ['existing-project'],
      confirmOverwrite: async () => {
        confirmCalls += 1;
        return true;
      },
      cwd: tempRoot,
      isTTY: true,
      run: async () => 0,
      scaffold: async (dir) => {
        scaffoldDirs.push(dir);
      },
    });

    assert.equal(exitCode, 0);
    assert.equal(confirmCalls, 1);
    assert.deepEqual(scaffoldDirs, [projectDir]);
  } finally {
    await rm(tempRoot, { force: true, recursive: true });
  }
});

test('main scaffolds a non-empty directory with --force and never prompts', async () => {
  const tempRoot = await mkdtemp(join(tmpdir(), 'create-vercel-shop-'));
  const projectDir = join(tempRoot, 'existing-project');
  const scaffoldDirs = [];

  try {
    await mkdir(projectDir, { recursive: true });
    await writeFile(join(projectDir, 'package.json'), '{}\n', 'utf8');

    const exitCode = await main({
      cliArgs: ['existing-project', FORCE_FLAG],
      confirmOverwrite: async () => {
        throw new Error('should not prompt with --force');
      },
      cwd: tempRoot,
      isTTY: true,
      run: async () => 0,
      scaffold: async (dir) => {
        scaffoldDirs.push(dir);
      },
    });

    assert.equal(exitCode, 0);
    assert.deepEqual(scaffoldDirs, [projectDir]);
  } finally {
    await rm(tempRoot, { force: true, recursive: true });
  }
});

test('main allows --no-template against a non-empty existing project', async () => {
  const tempRoot = await mkdtemp(join(tmpdir(), 'create-vercel-shop-'));
  const projectDir = join(tempRoot, 'existing-project');
  const scaffoldCalls = [];

  try {
    await mkdir(projectDir, { recursive: true });
    await writeFile(join(projectDir, 'package.json'), '{}\n', 'utf8');

    const exitCode = await main({
      cliArgs: ['--no-template', 'existing-project'],
      confirmOverwrite: async () => {
        throw new Error('should not prompt for --no-template');
      },
      cwd: tempRoot,
      isTTY: false,
      run: async () => 0,
      scaffold: async (dir, options) => {
        scaffoldCalls.push({ dir, options });
      },
    });

    assert.equal(exitCode, 0);
    assert.deepEqual(scaffoldCalls, [
      { dir: projectDir, options: { includeTemplate: false } },
    ]);
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
