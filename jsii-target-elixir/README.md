# jsii-target-elixir

The Elixir language target for [jsii](https://github.com/aws/jsii), as an
**external jsii-pacmak plugin** — scaffolded by
[`create-jsii-language`](https://github.com/omarqureshi/create-jsii-language),
following the shape of the
[Ruby reference implementation](https://github.com/omarqureshi/jsii-target-ruby).

```sh
npx jsii-pacmak --plugin jsii-target-elixir -t elixir -o dist -- <jsii-package>
```

Generating a whole installed dependency closure (e.g. `npm install aws-cdk-lib`, then
everything it needs) is one invocation — add `--recurse`:

```sh
npx jsii-pacmak --plugin jsii-target-elixir -t elixir --recurse -o dist node_modules/aws-cdk-lib
```

## Status: freshly scaffolded

The *shape* is complete and everything compiles and runs; the Elixir
semantics are yours to fill in. What works on day one:

- `npm run build` compiles; stock pacmak loads the plugin and walks any
  assembly through it, emitting a JSON manifest of every type and member it
  visited — pipeline proof before any real codegen exists.
- `npm test` runs the version-mapping and naming-overlay unit tests, plus
  jsii-rosetta's shared translations corpus against the (empty) visitor:
  every snippet reports as a visible skip. That list is the translation
  progress bar.
- The **target-config overlay** (`JSII_ELIXIR_TARGET_CONFIG`,
  `src/target-config.ts`) is how naming reaches generation: published
  assemblies carry no `targets.elixir` config. This repository ships only a
  synthetic profile for its own tests (`test/fixtures/profile.json`) — a real
  library's naming belongs in that library's own repository, along with its
  packaging and publishing. See `docs/distribution-repositories.md`.


## The roadmap is the test suites

| Milestone | Driven by |
| --- | --- |
| Codegen: manifest entries become Elixir source | the `on*()` hooks in `src/target.ts`; syntax-check the output with your language's parser |
| Naming & version decisions | `docs/decisions.md` + `test/version-utils.test.ts` |
| Guest runtime | `runtime/README.md`; then drive it with the jsii conformance kit until the full suite passes |
| Example translation | `src/rosetta/visitor.ts` + corpus expectations in `test/translations/` |
| Packaging | `ElixirTarget.build()` — invoke your ecosystem's package build |
| Publish | a community feed + CI (see the Ruby reference's publish pipeline) |

## Development

Until the pacmak plugin API is released to npm, link against local toolchain
checkouts:

```sh
./scripts/link-toolchain.sh ~/src/jsii ~/src/jsii-rosetta
npm run build && npm test
```
