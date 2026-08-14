#!/usr/bin/env node
/**
 * What to implement next.
 *
 *   node build/compliance/next.js compliance/compliance-report.json
 *
 * Reads the report your compliance run wrote and prints the capability worth
 * working on now, what it means, and which tests are still outstanding.
 */

import * as fs from 'node:fs';

import { plan } from './plan';
import { TESTS } from './capabilities';

function main(): void {
  const reportPath = process.argv[2];
  if (reportPath == null) {
    console.error('usage: next.js <compliance-report.json>');
    process.exit(2);
  }

  const { all, next, unknown } = plan(JSON.parse(fs.readFileSync(reportPath, 'utf8')));
  const passing = all.reduce((n, p) => n + p.passing.length, 0);
  console.log(`${passing}/${Object.keys(TESTS).length} compliance tests passing\n`);

  for (const p of all) {
    const total = p.passing.length + p.outstanding.length;
    const mark = p.outstanding.length === 0 ? 'done' : p === next ? 'next' : '    ';
    console.log(`  ${mark}  ${p.capability.name.padEnd(16)} ${p.passing.length}/${total}`);
  }

  if (unknown.length > 0) {
    // Either the suite has gained tests since this catalogue was written, or
    // the binding is reporting names the suite does not define. Both are worth
    // knowing; neither is worth failing over.
    console.log(`\nNot in the catalogue: ${unknown.join(', ')}`);
  }

  if (next == null) {
    console.log('\nEverything in the catalogue passes.');
    return;
  }

  console.log(`\n── ${next.capability.name} ──\n`);
  console.log(next.capability.summary);

  if (next.blockedBy.length > 0) {
    console.log(
      `\nBlocked on ${next.blockedBy.join(' and ')}: finish that first, or these will ` +
        'fail for its reasons rather than their own.',
    );
  }

  console.log('\nOutstanding:');
  for (const name of next.outstanding) {
    console.log(`  ${name}`);
    console.log(`    ${TESTS[name].description}`);
  }

  const later = all
    .filter((p) => p !== next && p.outstanding.length > 0)
    .map((p) => p.capability.name);
  if (later.length > 0) console.log(`\nAfter that: ${later.join(', ')}`);
}

main();
