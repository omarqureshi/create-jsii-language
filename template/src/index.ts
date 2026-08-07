import { registerRosettaLanguage } from './rosetta/register';
import { {{Lang}}Target } from './target';

export { {{Lang}}Target, {{Lang}}Generator } from './target';
export { to{{Lang}}ReleaseVersion, to{{Lang}}VersionRange } from './version-utils';

// Loading the plugin registers '{{lang}}' with jsii-rosetta's language
// registry (when the installed jsii-rosetta has one), so example translation
// works through the same rosetta instance the toolchain uses.
registerRosettaLanguage();

/**
 * jsii-pacmak target-plugin declaration:
 * `jsii-pacmak --plugin jsii-target-{{lang}} -t {{lang}}`.
 */
export default {
  targetName: '{{lang}}',
  pluginApiVersion: '0.1.0',
  targetConstructor: {{Lang}}Target,
};
