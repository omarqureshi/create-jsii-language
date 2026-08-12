import * as assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { afterEach, describe, test } from 'node:test';

import { applyTargetOverlay, TARGET_CONFIG_ENV } from '../src/target-config';

function withOverlay(overlay: unknown): void {
  const file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'elixir-target-config-')), 'overlay.json');
  fs.writeFileSync(file, JSON.stringify(overlay));
  process.env[TARGET_CONFIG_ENV] = file;
}

function fakeAssembly(): any {
  return {
    name: 'aws-cdk-lib',
    targets: { js: { npm: 'aws-cdk-lib' } },
    submodules: {
      'aws-cdk-lib.aws_s3': { targets: { python: { module: 'aws_cdk.aws_s3' } } },
    },
    dependencyClosure: {
      constructs: { targets: { js: { npm: 'constructs' } } },
    },
  };
}

describe('applyTargetOverlay', () => {
  afterEach(() => {
    delete process.env[TARGET_CONFIG_ENV];
  });

  test('no env var: assembly untouched', () => {
    const assembly = fakeAssembly();
    const before = JSON.stringify(assembly);
    applyTargetOverlay(assembly);
    assert.equal(JSON.stringify(assembly), before);
  });

  test('merges root config, keeping other languages', () => {
    withOverlay({ 'aws-cdk-lib': { module: 'RootModule' } });
    const assembly = fakeAssembly();
    applyTargetOverlay(assembly);
    assert.deepEqual(assembly.targets['elixir'], { module: 'RootModule' });
    assert.deepEqual(assembly.targets.js, { npm: 'aws-cdk-lib' });
  });

  test('overlay wins over in-assembly config; unmentioned keys survive', () => {
    withOverlay({ 'aws-cdk-lib': { module: 'RootModule' } });
    const assembly = fakeAssembly();
    assembly.targets['elixir'] = { module: 'WrongName', extra: 'kept' };
    applyTargetOverlay(assembly);
    assert.equal(assembly.targets['elixir'].module, 'RootModule');
    assert.equal(assembly.targets['elixir'].extra, 'kept');
  });

  test('merges into the dependency closure', () => {
    withOverlay({ constructs: { module: 'Constructs' } });
    const assembly = fakeAssembly();
    applyTargetOverlay(assembly);
    assert.deepEqual(assembly.dependencyClosure.constructs.targets['elixir'], { module: 'Constructs' });
  });

  test('merges submodule entries; tolerates unknown submodules', () => {
    withOverlay({
      'aws-cdk-lib': {
        module: 'RootModule',
        submodules: {
          'aws-cdk-lib.aws_s3': { module: 'RootModule::S3' },
          'aws-cdk-lib.not_a_module': { module: 'RootModule::Ghost' },
        },
      },
    });
    const assembly = fakeAssembly();
    applyTargetOverlay(assembly);
    assert.equal(assembly.submodules['aws-cdk-lib.aws_s3'].targets['elixir'].module, 'RootModule::S3');
    assert.equal(assembly.submodules['aws-cdk-lib.not_a_module'], undefined);
  });

  test('ignores _comment keys at both levels', () => {
    withOverlay({
      _comment: 'top-level note',
      'aws-cdk-lib': { _decisions: { why: 'because' }, module: 'RootModule' },
    });
    const assembly = fakeAssembly();
    applyTargetOverlay(assembly);
    assert.deepEqual(assembly.targets['elixir'], { module: 'RootModule' });
  });

  test('is idempotent', () => {
    withOverlay({ 'aws-cdk-lib': { module: 'RootModule' } });
    const assembly = fakeAssembly();
    applyTargetOverlay(assembly);
    const once = JSON.stringify(assembly);
    applyTargetOverlay(assembly);
    assert.equal(JSON.stringify(assembly), once);
  });
});
