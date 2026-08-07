import * as assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { after, before, describe, test } from 'node:test';

import { {{Lang}}Visitor } from '../src/rosetta/visitor';

// Runs jsii-rosetta's shipped translations corpus (the same snippets its
// in-repo Python/Java/C#/Go tests iterate) against this plugin's visitor.
// The snippets stay upstream — this repo contributes only .{{lang}}
// expectation files under test/translations/, mirroring the corpus' relative
// layout.
//
// Freshly scaffolded, every snippet is a visible skip: that list is your
// translation progress bar. Write an expectation when the visitor renders a
// snippet correctly, and it converts to a passing test that locks the
// behavior in.
//
// Requires a jsii-rosetta that ships the corpus (lib/testing). If yours
// predates it, this suite reports a single skipped test.
const EXPECTATIONS = path.resolve(__dirname, '..', '..', 'test', 'translations');
const EXPECTATION_EXT = '.{{lang}}'; // TODO({{lang}}): your source extension

let corpusModule: any;
try {
  /* eslint-disable-next-line @typescript-eslint/no-require-imports */
  corpusModule = require('jsii-rosetta/lib/testing/translations-corpus');
} catch {
  corpusModule = undefined;
}

if (corpusModule === undefined) {
  test('translations corpus', { skip: 'installed jsii-rosetta does not ship the translations corpus' }, () => {});
} else {
  const { TranslationsCorpus, normalizeExpectedSource, normalizeRenderedSource } = corpusModule;

  describe('translations corpus', () => {
    let corpus: any;

    before(async () => {
      corpus = await TranslationsCorpus.create();
    });

    after(async () => {
      await corpus.dispose();
    });

    for (const name of TranslationsCorpus.snippetNames()) {
      const expectationFile = path.join(EXPECTATIONS, `${name}${EXPECTATION_EXT}`);
      const options = fs.existsSync(expectationFile)
        ? {}
        : { skip: `no ${EXPECTATION_EXT} expectation yet` as const };

      test(`translates ${name}.ts`, options, () => {
        const snippet = corpus.snippet(name)!;
        const expected = normalizeExpectedSource(fs.readFileSync(expectationFile, 'utf-8'));
        const actual = normalizeRenderedSource(corpus.render(snippet, new {{Lang}}Visitor()));
        assert.equal(actual, expected);
      });
    }
  });
}
