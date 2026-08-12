import * as path from 'path';
import * as zlib from 'zlib';

import * as fs from 'fs-extra';

import { {{Lang}}Visitor } from './rosetta/visitor';
import { loadTargetOverlay, TARGET_CONFIG_ENV } from './target-config';

/**
 * A harness for testing a naming profile.
 *
 * A profile — what a library is called in {{Lang}} — is data this target knows
 * nothing about, and every question about whether it is *right* is a question
 * about that library: is `aws_s3` really `S3`, has a release added a submodule
 * nobody has named? Those belong wherever the profile is published, not here.
 * See docs/distribution-repositories.md.
 *
 * What this target owes a profile owner is a way to ask, without them
 * reimplementing generation. That is this.
 *
 * The shape mirrors what jsii-rosetta publishes one level up: it ships its
 * translations corpus behind `lib/testing` so an external language can check
 * itself with the same machinery its own languages are checked with.
 */
export interface ProfileHarness {
  /** The {{Lang}} module path a jsii fqn is generated as under this profile. */
  modulePathFor(fqn: string): string;

  /**
   * Translate a TypeScript snippet exactly as the documentation pipeline
   * would, so an expectation here is an expectation about published output.
   */
  render(source: string): string;

  /**
   * Submodules the assemblies declare that the profile does not name.
   *
   * This is the drift question, and the reason to run this in CI. Every
   * library release can add submodules, and each unnamed one renders as a
   * derived guess that becomes permanent public API the moment it ships.
   * Non-empty means somebody has a naming decision to make — the failure is
   * the feature.
   */
  unnamedSubmodules(): string[];

  /** Restore the environment this harness changed. */
  dispose(): void;
}

export interface ProfileHarnessOptions {
  /** Path to the profile JSON (the file `{{LANG}}_TARGET_CONFIG` names). */
  readonly profile: string;

  /**
   * Package directories whose assemblies the profile describes.
   *
   * Optional: naming questions need no assembly. Drift questions do, since
   * they are about what a particular release declares.
   */
  readonly assemblies?: readonly string[];
}

export function profileHarness(options: ProfileHarnessOptions): ProfileHarness {
  if (!fs.existsSync(options.profile)) {
    throw new Error(`no profile at ${options.profile}`);
  }

  const previous = process.env[TARGET_CONFIG_ENV];
  process.env[TARGET_CONFIG_ENV] = options.profile;

  return {
    modulePathFor(fqn) {
      // TODO: return what your generator would name this fqn, honouring the
      // profile. Implement it by calling the same function generation uses —
      // if that means extracting one, do that rather than duplicating the
      // logic here. A harness that computes names its own way will agree with
      // the generator right up until it matters.
      const overlay = loadTargetOverlay() ?? {};
      const [assembly] = fqn.split('.');
      return overlay[assembly]?.module ?? assembly;
    },

    render(source) {
      // Required lazily so this harness is usable in a process that only wants
      // the naming questions.
      /* eslint-disable-next-line @typescript-eslint/no-require-imports */
      const { translateTypeScript } = require('jsii-rosetta/lib/translate');
      return translateTypeScript(
        { contents: source, fileName: 'profile.ts' },
        new {{Lang}}Visitor(),
      ).translation;
    },

    unnamedSubmodules() {
      const overlay = loadTargetOverlay() ?? {};
      const unnamed: string[] = [];
      for (const dir of options.assemblies ?? []) {
        const assembly = readAssembly(dir);
        const named = overlay[assembly.name]?.submodules ?? {};
        for (const fqn of Object.keys(assembly.submodules ?? {})) {
          // Nested submodules inherit their parent's explicit name, so only
          // the top level is a decision anyone has to make.
          const isNested = fqn.split('.').length > 2;
          if (!isNested && !(fqn in named)) unnamed.push(fqn);
        }
      }
      return unnamed.sort();
    },

    dispose() {
      if (previous === undefined) delete process.env[TARGET_CONFIG_ENV];
      else process.env[TARGET_CONFIG_ENV] = previous;
    },
  };
}

/**
 * Read an assembly for its structure alone.
 *
 * Deliberately not `spec.loadAssemblyFromPath`: that validates, and rejects
 * large real-world assemblies for using schema features a given toolchain does
 * not declare support for. Nothing here depends on the assembly being fully
 * understood.
 *
 * A package may ship a redirect stub at `.jsii` pointing at a compressed
 * `.jsii.gz`; reading the stub yields a parseable assembly with no types at
 * all, which looks like success and answers "nothing is unnamed" forever.
 */
function readAssembly(dir: string): { name: string; submodules?: Record<string, unknown> } {
  const parse = (file: string, compressed: boolean) => {
    const raw = fs.readFileSync(file);
    return JSON.parse((compressed ? zlib.gunzipSync(raw) : raw).toString('utf-8'));
  };
  const parsed = parse(path.join(dir, '.jsii'), false);
  return parsed?.schema === 'jsii/file-redirect'
    ? parse(path.join(dir, parsed.filename), parsed.compression === 'gzip')
    : parsed;
}
