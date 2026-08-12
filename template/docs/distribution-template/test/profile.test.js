const assert = require('node:assert/strict');
const path = require('node:path');
const { describe, test, before, after } = require('node:test');

const { profileHarness } = require('jsii-target-{{lang}}/testing');

// What this library is called in {{Lang}}. These are questions about the
// library, not about the target — the target takes whatever profile it is
// handed — so they are asked here, through the harness the target publishes.
//
//   AWS_CDK_LIB=node_modules/aws-cdk-lib node --test test/*.test.js
const PROFILE = path.resolve(__dirname, '..', 'config', 'profile.json');
const ASSEMBLY = process.env.AWS_CDK_LIB;

describe('the naming profile', () => {
  let h;
  before(() => {
    h = profileHarness({ profile: PROFILE, assemblies: ASSEMBLY ? [ASSEMBLY] : [] });
  });
  after(() => h?.dispose());

  test('names the root module', () => {
    assert.equal(h.modulePathFor('aws-cdk-lib'), 'TODO-root-module-name');
  });

  test('applies acronym casing a derivation would get wrong', () => {
    // The decisions worth pinning: a generic derivation gives Ec2, Iam, Rds.
    // TODO: assert what your profile says these are.
  });

  test('every submodule of the installed release has a name', () => {
    // The drift check, and the reason to run this in CI. A release can add
    // services; an unnamed one ships as a derived guess and becomes permanent
    // public API. Failing here is the feature.
    if (!ASSEMBLY) return;
    const unnamed = h.unnamedSubmodules();
    assert.deepEqual(unnamed, [], `unnamed submodule(s):\n  ${unnamed.join('\n  ')}`);
  });
});
