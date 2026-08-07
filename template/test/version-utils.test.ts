import * as assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { to{{Lang}}ReleaseVersion, to{{Lang}}VersionRange } from '../src/version-utils';

// The scaffolded implementations are identity functions; these tests pin that
// starting point. As you implement real mapping, replace them with a table of
// npm-semver -> {{lang}}-ecosystem expectations (the Ruby reference's
// version-utils tests are a worked example, including error cases for
// unmappable prerelease labels).

describe('to{{Lang}}ReleaseVersion', () => {
  test('plain releases pass through', () => {
    assert.equal(to{{Lang}}ReleaseVersion('1.2.3'), '1.2.3');
  });

  // TODO({{lang}}): prerelease labels — what does 1.2.3-alpha.4 become?
});

describe('to{{Lang}}VersionRange', () => {
  test('exact versions pass through', () => {
    assert.equal(to{{Lang}}VersionRange('1.2.3'), '1.2.3');
  });

  // TODO({{lang}}): caret/tilde ranges — what do ^1.2.3 and ~1.2.3 become?
});
