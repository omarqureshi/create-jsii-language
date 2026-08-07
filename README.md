# create-jsii-language

Scaffold a community [jsii](https://github.com/aws/jsii) language target:

```sh
npx create-jsii-language crystal
```

generates `jsii-target-crystal/` — the complete *shape* of an external
language target, extracted from the
[Ruby reference implementation](https://github.com/omarqureshi/jsii-target-ruby):

- a **pacmak plugin package** that stock `jsii-pacmak --plugin` loads on day
  one: a `Generator` skeleton with every hook stubbed (emitting a visit
  manifest until you write real codegen), version-mapping hooks, and the
  plugin declaration;
- a **rosetta visitor** skeleton wired to jsii-rosetta's shared translations
  corpus — every untranslated snippet reports as a visible skip, so
  translation progress is a test list, not a guess;
- a **guest-runtime guide** (`runtime/README.md`): the module layout proven
  identical across every existing guest runtime, the kernel wire verbs, and
  the conformance-driven development loop;
- a **decision checklist** (`docs/decisions.md`): every naming/ergonomics
  question a language target must answer, each with the worked Ruby answer
  linked;
- CI and dev-linking scripts for the pre-release plugin API.

Honest scoping: the scaffold cannot generate the hard part — a serializer and
callback machinery that are *correct* in your language. What it generates is
the proven structure, the protocol contract expressed as a conformance
roadmap, and a working reference to crib from. The difference between a
multi-month research project and a tractable engineering task with a progress
bar.

Part of the [jsii language-plugin RFC](https://github.com/omarqureshi/aws-cdk-rfcs/blob/jsii-plugin-system/text/0000-jsii-language-plugins.md)
(community deliverable — not an AWS commitment). Requires a jsii toolchain
with the plugin API (currently: the RFC's development branches; see the
generated `scripts/link-dev.sh`).

## Options

```sh
npx create-jsii-language <language-name> [--dir <output-dir>]
```

`language-name` must match `[a-z][a-z0-9-]*`; it becomes the pacmak target
name (`-t <language-name>`), the package name suffix, and (capitalized) the
TypeScript type prefix.
