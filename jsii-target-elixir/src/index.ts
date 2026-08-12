import { registerRosettaLanguage } from './rosetta/register';
import { ElixirTarget } from './target';

export { ElixirTarget, ElixirGenerator } from './target';
export { toElixirReleaseVersion, toElixirVersionRange } from './version-utils';

// Loading the plugin registers 'elixir' with jsii-rosetta's language
// registry (when the installed jsii-rosetta has one), so example translation
// works through the same rosetta instance the toolchain uses.
registerRosettaLanguage();

/**
 * jsii-pacmak target-plugin declaration:
 * `jsii-pacmak --plugin jsii-target-elixir -t elixir`.
 */
export default {
  targetName: 'elixir',
  pluginApiVersion: '0.1.0',
  targetConstructor: ElixirTarget,
};
