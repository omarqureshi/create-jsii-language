#!/usr/bin/env node
/**
 * create-jsii-language: scaffold a new external jsii language target.
 *
 *   npx create-jsii-language crystal
 *
 * Generates jsii-target-<language>/ from the template directory, substituting
 * {{lang}} (lowercase) and {{Lang}} (capitalized) in file contents. No
 * dependencies; plain Node.
 */
const fs = require('node:fs');
const path = require('node:path');

function fail(msg) {
  console.error(`error: ${msg}`);
  console.error('usage: create-jsii-language <language-name> [--dir <output-dir>]');
  process.exit(1);
}

const args = process.argv.slice(2);
const positional = args.filter((a) => !a.startsWith('--'));
const lang = positional[0];
if (!lang) {
  fail('missing language name');
}
if (!/^[a-z][a-z0-9-]*$/.test(lang)) {
  fail(`language name must match [a-z][a-z0-9-]* (got: ${lang})`);
}

const dirFlag = args.indexOf('--dir');
const outDir = path.resolve(dirFlag >= 0 ? args[dirFlag + 1] : `jsii-target-${lang}`);

// A lone .git directory doesn't count as non-empty: regenerating into a
// fresh clone (to commit scaffold updates on top of existing history) is a
// supported flow.
if (fs.existsSync(outDir) && fs.readdirSync(outDir).some((f) => f !== '.git')) {
  fail(`output directory is not empty: ${outDir}`);
}

// Capitalize, treating hyphens as word separators: my-lang -> MyLang
const Lang = lang
  .split('-')
  .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
  .join('');

// SCREAMING_SNAKE form for environment variable names: my-lang -> MY_LANG
const LANG = lang.toUpperCase().replace(/-/g, '_');

const templateRoot = path.join(__dirname, '..', 'template');

function render(text) {
  return text
    .replace(/\{\{lang\}\}/g, lang)
    .replace(/\{\{Lang\}\}/g, Lang)
    .replace(/\{\{LANG\}\}/g, LANG);
}

let count = 0;
function copy(srcDir, dstDir) {
  fs.mkdirSync(dstDir, { recursive: true });
  for (const entry of fs.readdirSync(srcDir, { withFileTypes: true })) {
    const src = path.join(srcDir, entry.name);
    const dst = path.join(dstDir, render(entry.name));
    if (entry.isDirectory()) {
      copy(src, dst);
    } else {
      fs.writeFileSync(dst, render(fs.readFileSync(src, 'utf-8')));
      if (entry.name.endsWith('.sh')) {
        fs.chmodSync(dst, 0o755);
      }
      count++;
    }
  }
}

copy(templateRoot, outDir);

console.log(`
  jsii-target-${lang}: ${count} files scaffolded in ${outDir}

  The shape is complete; the language semantics are yours. Suggested order:

    1. Read docs/decisions.md and record your language's answers.
    2. scripts/link-toolchain.sh — wire up a jsii toolchain to develop against.
    3. npm run build — the skeleton compiles as-is.
    4. Point stock pacmak at it:
         npx jsii-pacmak --plugin ${path.basename(outDir)} -t ${lang} -o dist -- <some-jsii-package>
       The skeleton emits a manifest of every type it visited — proof the
       pipeline runs before you write a line of ${Lang}.
    5. Fill in the on*() methods in src/target.ts until the manifest becomes code.
    6. Build the guest runtime (runtime/README.md) against the compliance suite.
    7. Add rosetta translations: src/rosetta/visitor.ts + corpus expectations.

  A complete worked reference for every step:
  https://github.com/omarqureshi/jsii-target-ruby
`);
