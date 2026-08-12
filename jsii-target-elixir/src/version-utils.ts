/**
 * Version-scheme mapping: npm/semver on the jsii side, your ecosystem's
 * scheme on the other. Record your decisions in
 * docs/decisions.md#version-scheme.
 *
 * The scaffolded implementations pass semver through unchanged, which is
 * correct only if your ecosystem accepts semver verbatim (many do for
 * release versions but differ on prerelease labels and range operators —
 * see the Ruby reference's full prerelease-label mapping for a worked
 * example of when they don't).
 */

/**
 * Converts an assembly version (npm semver) to your ecosystem's release
 * version format.
 */
export function toElixirReleaseVersion(assemblyVersion: string): string {
  // TODO(elixir): map prerelease labels (alpha/beta/rc/dev/...) to your
  // scheme, and reject what cannot be represented — loudly, at generation
  // time.
  return assemblyVersion;
}

/**
 * Converts an npm semver range to your ecosystem's dependency-constraint
 * syntax (used for the dependencies of generated packages).
 */
export function toElixirVersionRange(semverRange: string): string {
  // TODO(elixir): map ^ / ~ / comparators / OR-sets. Reject unsupported
  // shapes rather than guessing.
  return semverRange;
}
