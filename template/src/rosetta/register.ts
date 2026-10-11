import { {{Lang}}Visitor } from './visitor';

/**
 * The jsii-rosetta plugin API version this plugin is written against
 * (`PLUGIN_API_VERSION` in jsii-rosetta/lib/plugin-api).
 */
export const ROSETTA_PLUGIN_API_VERSION = '0.1.0';

/**
 * Registers the {{Lang}} visitor with jsii-rosetta's external-language
 * registry.
 *
 * Guarded: against a jsii-rosetta without the plugin API, registration is
 * skipped loudly and example translation is unavailable — the pacmak target
 * then emits examples as TypeScript verbatim.
 */
export function registerRosettaLanguage(): void {
  let rosetta: any;
  try {
    /* eslint-disable-next-line @typescript-eslint/no-require-imports */
    rosetta = require('jsii-rosetta/lib/plugin-api');
  } catch {
    // Loud, because the failure is otherwise invisible: every example
    // silently stays TypeScript. Usually jsii-pacmak resolved a different
    // jsii-rosetta copy than this plugin (see scripts/link-toolchain.sh).
    console.error(
      '[jsii-target-{{lang}}] the resolved jsii-rosetta has no language-plugin API; ' +
        'example translation is DISABLED (examples will stay TypeScript).',
    );
    return;
  }
  // Registering again with the same visitor version is a no-op in rosetta,
  // so loading this module twice is harmless.
  rosetta.registerTargetLanguage(
    '{{lang}}',
    {
      version: {{Lang}}Visitor.VERSION,
      createVisitor: () => new {{Lang}}Visitor(),
    },
    { pluginApiVersion: ROSETTA_PLUGIN_API_VERSION },
  );
}
