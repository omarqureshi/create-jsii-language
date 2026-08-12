import * as assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { toElixirReleaseVersion, toElixirVersionRange } from '../src/version-utils';

// The scaffolded implementations are identity functions; these tests pin that
// starting point. As you implement real mapping, replace them with a table of
// npm-semver -> elixir-ecosystem expectations (the Ruby reference's
// version-utils tests are a worked example, including error cases for
// unmappable prerelease labels).

describe('toElixirReleaseVersion', () => {
  test('plain releases pass through', () => {
    assert.equal(toElixirReleaseVersion('1.2.3'), '1.2.3');
  });

  // TODO(elixir): prerelease labels — what does 1.2.3-alpha.4 become?
});

describe('toElixirVersionRange', () => {
  test('exact versions pass through', () => {
    assert.equal(toElixirVersionRange('1.2.3'), '1.2.3');
  });

  // TODO(elixir): caret/tilde ranges — what do ^1.2.3 and ~1.2.3 become?
});
