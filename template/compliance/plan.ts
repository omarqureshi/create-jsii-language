/**
 * Turn a compliance report into an order of work.
 *
 * The report says which of the 123 tests pass. It does not say what to do
 * about the rest, and the raw list is actively misleading early on: a binding
 * with no callback protocol fails every override test at once, which reads as
 * twenty problems and is one.
 *
 * So the tests are grouped by capability (see capabilities.ts), the
 * capabilities are walked in prerequisite order, and the first incomplete one
 * is the answer. Everything downstream of it is noise until it works.
 */

import { CAPABILITIES, TESTS, Capability } from './capabilities';

export type Status = 'success' | 'failure' | 'n/a';
export type Report = Record<string, { status: Status } | undefined>;

export interface Progress {
  readonly capability: Capability;
  /** Test names passing today. */
  readonly passing: string[];
  /** Failing, absent from the report, or declared inapplicable. */
  readonly outstanding: string[];
  /** Prerequisite capabilities that are themselves incomplete. */
  readonly blockedBy: string[];
}

export interface Plan {
  /** Every capability, in prerequisite order. */
  readonly all: Progress[];
  /** The one worth working on now, or undefined when nothing is outstanding. */
  readonly next?: Progress;
  /** Report entries this catalogue has never heard of. */
  readonly unknown: string[];
}

/**
 * Capabilities in an order that respects `requires`.
 *
 * Declaration order is deliberately not trusted. The whole value of this file
 * is being right about prerequisites, and a hand-maintained order drifts
 * silently the first time someone inserts a capability in the wrong place.
 */
export function inDependencyOrder(
  capabilities: readonly Capability[] = CAPABILITIES,
): Capability[] {
  const byName = new Map(capabilities.map((c) => [c.name, c]));
  const ordered: Capability[] = [];
  const state = new Map<string, 'visiting' | 'done'>();

  const visit = (name: string, path: readonly string[]): void => {
    if (state.get(name) === 'done') return;
    if (state.get(name) === 'visiting') {
      throw new Error(`capability cycle: ${[...path, name].join(' -> ')}`);
    }
    const capability = byName.get(name);
    if (capability == null) {
      throw new Error(
        `capability '${name}' is required by '${path[path.length - 1]}' but never defined`,
      );
    }
    state.set(name, 'visiting');
    for (const required of capability.requires ?? []) visit(required, [...path, name]);
    state.set(name, 'done');
    ordered.push(capability);
  };

  for (const capability of capabilities) visit(capability.name, []);
  return ordered;
}

export function plan(report: Report): Plan {
  // The published compliance matrix compares names case-insensitively, because
  // each language spells them in its own convention. Do the same, or a binding
  // that reports `syncoverrides` looks like it implements nothing.
  const byUpper = new Map(
    Object.entries(report).map(([name, result]) => [name.toUpperCase(), result]),
  );

  // 'n/a' counts as outstanding rather than passing. A binding declaring a test
  // inapplicable is making a claim someone may want to check, and folding it
  // into the pass count is how that claim stops being visible.
  const passes = (name: string) => byUpper.get(name.toUpperCase())?.status === 'success';

  const outstandingBy = new Map<string, boolean>();
  const all = inDependencyOrder().map((capability) => {
    const tests = Object.keys(TESTS).filter((n) => TESTS[n].capability === capability.name);
    const outstanding = tests.filter((n) => !passes(n));
    outstandingBy.set(capability.name, outstanding.length > 0);
    return {
      capability,
      passing: tests.filter(passes),
      outstanding,
      blockedBy: (capability.requires ?? []).filter((r) => outstandingBy.get(r)),
    };
  });

  const known = new Set(Object.keys(TESTS).map((n) => n.toUpperCase()));
  return {
    all,
    next: all.find((p) => p.outstanding.length > 0),
    unknown: Object.keys(report).filter((n) => !known.has(n.toUpperCase())),
  };
}
