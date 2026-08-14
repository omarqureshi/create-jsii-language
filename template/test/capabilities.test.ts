import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { CAPABILITIES, TESTS } from '../compliance/capabilities';
import { plan } from '../compliance/plan';

/**
 * The compliance catalogue, and the order it puts a binding's work in.
 *
 * The catalogue is data, so the tests that matter are the ones that catch it
 * being wrong in a way reading it would not: a test pointing at a capability
 * nobody defined, a prerequisite cycle, or a plan that tells you to start in
 * the middle.
 */
describe('the capability catalogue', () => {
  it('assigns every test to a capability that exists', () => {
    const defined = new Set(CAPABILITIES.map((c) => c.name));
    const dangling = Object.entries(TESTS)
      .filter(([, t]) => !defined.has(t.capability))
      .map(([name, t]) => `${name} -> ${t.capability}`);
    assert.deepEqual(dangling, []);
  });

  it('only requires capabilities that exist', () => {
    const defined = new Set(CAPABILITIES.map((c) => c.name));
    const dangling = CAPABILITIES.flatMap((c) =>
      (c.requires ?? [])
        .filter((r) => !defined.has(r))
        .map((r) => `${c.name} -> ${r}`),
    );
    assert.deepEqual(dangling, []);
  });

  it('describes every test', () => {
    // A name is not a hint. An entry with no description is worse than no
    // entry, because it looks like the catalogue covers it.
    const undescribed = Object.entries(TESTS)
      .filter(([, t]) => t.description.trim() === '')
      .map(([name]) => name);
    assert.deepEqual(undescribed, []);
  });

  it('gives every capability something to do', () => {
    const used = new Set(Object.values(TESTS).map((t) => t.capability));
    const idle = CAPABILITIES.map((c) => c.name).filter((n) => !used.has(n));
    assert.deepEqual(idle, []);
  });
});

describe('the plan', () => {
  const passingEverything = () =>
    Object.fromEntries(
      Object.keys(TESTS).map((name) => [name, { status: 'success' as const }]),
    );

  it('starts at the capability with no prerequisites', () => {
    const { next } = plan({});
    assert.ok(next, 'an empty report has work outstanding');
    assert.deepEqual(next.capability.requires ?? [], []);
  });

  it('walks prerequisites before dependants', () => {
    const order = plan({}).all.map((p) => p.capability.name);
    for (const capability of CAPABILITIES) {
      for (const required of capability.requires ?? []) {
        assert.ok(
          order.indexOf(required) < order.indexOf(capability.name),
          `${required} must be planned before ${capability.name}`,
        );
      }
    }
  });

  it('has nothing left when everything passes', () => {
    assert.equal(plan(passingEverything()).next, undefined);
  });

  it('moves on once a capability is complete', () => {
    const first = plan({}).next!.capability.name;
    const report = Object.fromEntries(
      Object.entries(TESTS)
        .filter(([, t]) => t.capability === first)
        .map(([name]) => [name, { status: 'success' as const }]),
    );
    assert.notEqual(plan(report).next!.capability.name, first);
  });

  it('counts a failure and a missing entry the same way', () => {
    const failing = plan({
      ...passingEverything(),
      [Object.keys(TESTS)[0]]: { status: 'failure' as const },
    });
    const missing = { ...passingEverything() };
    delete missing[Object.keys(TESTS)[0]];
    assert.equal(failing.next?.capability.name, plan(missing).next?.capability.name);
  });

  it('reports which prerequisites are holding a capability up', () => {
    // Nothing implemented: everything downstream of the first capability is
    // blocked, and saying so is the difference between a list of failures and
    // an order of work.
    const dependant = CAPABILITIES.find((c) => (c.requires ?? []).length > 0)!;
    const { all } = plan({});
    const progress = all.find((p) => p.capability.name === dependant.name)!;
    assert.ok(progress.blockedBy.length > 0);
  });

  it('is case-insensitive about test names, as the report matrix is', () => {
    const [name] = Object.keys(TESTS);
    const shouty = { [name.toUpperCase()]: { status: 'success' as const } };
    const passing = plan(shouty).all.flatMap((p) => p.passing);
    assert.ok(passing.includes(name));
  });
});
