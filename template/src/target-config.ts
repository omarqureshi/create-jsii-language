import * as fs from 'fs';

import * as spec from '@jsii/spec';

/**
 * Out-of-band {{Lang}} naming configuration ("target-config overlay").
 *
 * Construct libraries will generally not carry `jsii.targets.{{lang}}` in
 * their repositories (external-language config never lands in an AWS repo),
 * so the assemblies published to npm have no {{Lang}} naming data. This
 * module lets the naming arrive at generation time instead: point the
 * environment variable at a JSON file keyed by assembly name, and its
 * entries are merged over whatever each assembly declares — into the root
 * assembly, its submodules, and its dependency closure (which is where
 * dependency package/module names are resolved from during generation).
 *
 * Overlay entries win over in-assembly config: the overlay is an explicit
 * per-generation instruction. Keys starting with `_` are comments.
 */
export const TARGET_CONFIG_ENV = 'JSII_{{LANG}}_TARGET_CONFIG';

export interface {{Lang}}TargetEntry {
  readonly [key: string]: unknown;
  readonly module?: string;
  readonly submodules?: Record<string, { readonly module?: string }>;
}

export type {{Lang}}TargetOverlay = Record<string, {{Lang}}TargetEntry>;

export function loadTargetOverlay(): {{Lang}}TargetOverlay | undefined {
  const file = process.env[TARGET_CONFIG_ENV];
  if (!file) {
    return undefined;
  }
  const parsed = JSON.parse(fs.readFileSync(file, 'utf-8'));
  const overlay: {{Lang}}TargetOverlay = {};
  for (const [key, value] of Object.entries(parsed)) {
    if (!key.startsWith('_')) {
      overlay[key] = value as {{Lang}}TargetEntry;
    }
  }
  return overlay;
}

/**
 * Merges the overlay (if configured) into an assembly spec, in place.
 * Idempotent — the generator and the target both apply it, whichever runs
 * first wins and the second application is a no-op re-merge of equal data.
 */
export function applyTargetOverlay(assembly: spec.Assembly): void {
  const overlay = loadTargetOverlay();
  if (overlay === undefined) {
    return;
  }

  applyEntry(assembly, overlay[assembly.name]);

  for (const [depName, depInfo] of Object.entries(assembly.dependencyClosure ?? {})) {
    applyEntry(depInfo, overlay[depName]);
  }
}

interface TargetsCarrier {
  targets?: spec.AssemblyTargets;
  submodules?: Record<string, { targets?: spec.AssemblyTargets }>;
}

function applyEntry(carrier: TargetsCarrier, entry: {{Lang}}TargetEntry | undefined): void {
  if (entry === undefined) {
    return;
  }
  const { submodules, ...rootConfig } = entry;

  const mutable = carrier as { targets?: Record<string, unknown>; submodules?: TargetsCarrier['submodules'] };
  mutable.targets = {
    ...mutable.targets,
    '{{lang}}': { ...(mutable.targets?.['{{lang}}'] as object | undefined), ...stripComments(rootConfig) },
  };

  for (const [fqn, subConfig] of Object.entries(submodules ?? {})) {
    const sub = mutable.submodules?.[fqn] as { targets?: Record<string, unknown> } | undefined;
    if (sub === undefined) {
      continue; // overlay names a submodule this assembly version doesn't have
    }
    sub.targets = {
      ...sub.targets,
      '{{lang}}': { ...(sub.targets?.['{{lang}}'] as object | undefined), ...stripComments(subConfig) },
    };
  }
}

function stripComments<T extends object>(obj: T): Partial<T> {
  return Object.fromEntries(Object.entries(obj).filter(([k]) => !k.startsWith('_'))) as Partial<T>;
}
