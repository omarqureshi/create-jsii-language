#!/usr/bin/env node
// Pins every byte your target generates.
//
//   check-generated-code.js <generated-dir>            compare against the snapshot
//   UPDATE_SNAPSHOT=1 check-generated-code.js <dir>     rewrite the snapshot
//
// Your other tests will each assert something specific: that a name is right,
// that an enum member renders as a constant, that a variadic parameter is
// coerced. None of them notices a refactor quietly changing the other three
// hundred files — and that is the failure that matters most, because generated
// code is public API from the moment it ships.
//
// jsii has exactly this for its in-tree languages
// (jsii-pacmak/test/generated-code). A plugin cannot reuse it: the harness is
// keyed on pacmak's TargetName enum and pacmak publishes only lib/. So the
// scaffold brings its own, which is this file.
//
// Wire it into your test script AFTER the step that generates code from the
// jsii-calc fixtures, so it compares what the current generator just produced:
//
//   "test:conformance": "bash compliance/generate.sh
//                        && node scripts/check-generated-code.js compliance/lib/<language>
//                        && <run the conformance suite>"
'use strict';

const fs = require('fs');
const path = require('path');

const SNAPSHOT = path.resolve(__dirname, '..', 'test', '__snapshots__', 'generated-code.snap');

// ---------------------------------------------------------------------------
// Customise these two for your language.
// ---------------------------------------------------------------------------

/**
 * Which generated files to pin. Include everything a consumer could depend on:
 * sources, type signatures, and package manifests. Leave out build products
 * nobody reads.
 */
const INCLUDE = /\.(rb|rbs|gemspec)$/;

/**
 * Find the fixture assemblies' own version numbers in the generated output.
 *
 * These appear throughout — manifests, dependency pins, sometimes require
 * paths — and move whenever the toolchain checkout updates, which would bury a
 * real generator change under a hundred version lines. Return the exact
 * versions so only those are replaced.
 *
 * Resist normalising anything that merely looks like a version: doing so would
 * also erase declarations like a minimum language runtime, and a change to the
 * runtime your generated packages demand is exactly what this should catch.
 */
function fixtureVersions(entries) {
  const found = new Set();
  for (const { file } of entries) {
    if (!file.endsWith('.gemspec')) continue; // e.g. *.gemspec, package.json, *.csproj
    const m = /^\s*s\.version\s*=\s*'([^']+)'/m.exec(fs.readFileSync(file, 'utf-8'));
    if (m) found.add(m[1]);
  }
  return [...found].sort((a, b) => b.length - a.length); // longest first
}

// ---------------------------------------------------------------------------
// Below here is language-agnostic.
// ---------------------------------------------------------------------------

function collect(dir) {
  const files = [];
  (function walk(current) {
    const entries = fs
      .readdirSync(current, { withFileTypes: true })
      .sort((a, b) => a.name.localeCompare(b.name));
    for (const entry of entries) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (INCLUDE.test(entry.name)) files.push(full);
    }
  })(dir);

  // Sorted by relative path, so the snapshot never depends on directory order.
  return files
    .map((file) => ({ rel: path.relative(dir, file).split(path.sep).join('/'), file }))
    .sort((a, b) => a.rel.localeCompare(b.rel));
}

function normalize(text, versions) {
  let out = text.replace(/\r\n/g, '\n');
  for (const v of versions) out = out.split(v).join('<version>');
  return out;
}

function render(dir) {
  const entries = collect(dir);
  if (entries.length === 0) {
    console.error(`::error::no generated files matching ${INCLUDE} under ${dir}`);
    process.exit(1);
  }
  const versions = fixtureVersions(entries);
  const parts = [
    `# ${entries.length} generated files`,
    '# Rewrite with: UPDATE_SNAPSHOT=1 node scripts/check-generated-code.js <dir>',
    '',
  ];
  for (const { rel, file } of entries) {
    parts.push(`=== ${rel}`, normalize(fs.readFileSync(file, 'utf-8'), versions).replace(/\n+$/, ''), '');
  }
  return parts.join('\n');
}

/** The snapshot split back into per-file sections, for reporting. */
function sections(text) {
  const out = new Map();
  let name = null;
  const buf = [];
  for (const line of text.split('\n')) {
    if (line.startsWith('=== ')) {
      if (name) out.set(name, buf.join('\n'));
      name = line.slice(4);
      buf.length = 0;
    } else if (name) buf.push(line);
  }
  if (name) out.set(name, buf.join('\n'));
  return out;
}

const dir = process.argv[2];
if (!dir || !fs.existsSync(dir)) {
  console.error(`usage: check-generated-code.js <generated-dir>\n  (no directory at ${dir})`);
  process.exit(2);
}

const actual = render(dir);

if (process.env.UPDATE_SNAPSHOT === '1') {
  fs.mkdirSync(path.dirname(SNAPSHOT), { recursive: true });
  fs.writeFileSync(SNAPSHOT, actual);
  console.log(`wrote ${path.relative(process.cwd(), SNAPSHOT)} (${actual.split('\n').length} lines)`);
  process.exit(0);
}

if (!fs.existsSync(SNAPSHOT)) {
  console.error(`::error::no snapshot at ${SNAPSHOT}; create it with UPDATE_SNAPSHOT=1`);
  process.exit(1);
}

const expected = fs.readFileSync(SNAPSHOT, 'utf-8');
if (actual === expected) {
  console.log(`generated code matches the snapshot (${collect(dir).length} files)`);
  process.exit(0);
}

// Name the files and show the first divergence rather than dumping the lot:
// the useful question is "what changed", and a reviewer who wants the whole
// diff has it in git once the snapshot is deliberately rewritten.
const before = sections(expected);
const after = sections(actual);
const changed = [...new Set([...before.keys(), ...after.keys()])]
  .sort()
  .filter((n) => before.get(n) !== after.get(n));

console.error(`::error::generated code differs from the snapshot in ${changed.length} file(s)`);
for (const name of changed.slice(0, 20)) {
  const how = before.has(name) ? (after.has(name) ? 'changed' : 'removed') : 'added';
  console.error(`  ${how.padEnd(8)} ${name}`);
}
if (changed.length > 20) console.error(`  ... and ${changed.length - 20} more`);

const first = changed[0];
if (first && before.has(first) && after.has(first)) {
  const b = before.get(first).split('\n');
  const a = after.get(first).split('\n');
  const at = b.findIndex((line, i) => line !== a[i]);
  console.error(`\nfirst difference, ${first} line ${at + 1}:`);
  console.error(`  -${b[at] ?? '(end of file)'}`);
  console.error(`  +${a[at] ?? '(end of file)'}`);
}
console.error('\nIf these changes are intended, rerun with UPDATE_SNAPSHOT=1 and commit the snapshot.');
process.exit(1);
