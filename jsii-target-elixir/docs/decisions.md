# Elixir target: design decisions

Every jsii language target answers the same set of questions. Record your
answers here *as you make them* — this file becomes the specification your
generator, runtime, and documentation all agree on. Each entry quotes the
worked Ruby answer, not to copy, but to see what a complete answer covers;
the full completed document lives at
https://github.com/omarqureshi/jsii-target-ruby/blob/main/docs/decisions.md.

## Type names

How do assembly/module/type names map into Elixir?
(`jsii-calc` -> ?, `@scope/jsii-calc-lib` -> ?, submodules -> ?)

- Casing convention, separator handling (hyphens, scopes), acronym casing
  (does your community write `VPC` or `Vpc`? is acronym data configured
  per-assembly or built-in?).
- Names that need escaping: leading digits, reserved words as type names.
- *Ruby's answer:* PascalCase modules nested with `::`; scoped packages split
  on `/`; per-assembly acronym lists via `targets.ruby.acronyms`; `V_` prefix
  for digit-leading names.

## Member names

How do camelCase members map? (`grantRead` -> ?, `maxRetries` -> ?)

- Reserved words in Elixir that member names may collide with — and the
  escape convention.
- Names your *runtime machinery* reserves (constructor hooks, serialization
  methods) that generated members must never clobber.
- *Ruby's answer:* snake_case; `_` prefix for reserved words and for the
  `initialize`/`new`/`send`/`jsii_*` machinery namespace.

## Structs

jsii struct interfaces (`datatype: true`) are bags of named values. What is
the idiomatic Elixir shape — keyword arguments, a value class, a hash/map,
a builder?

- *Ruby's answer:* keyword arguments / hashes in, typed value objects out.

## Behavioral interfaces

What does "implements IBucket" look like in Elixir, and how does the
runtime recognize a user class as implementing a jsii interface for
callbacks?

- *Ruby's answer:* `include`-able modules; the runtime registers overrides
  for any method the user class defines.

## Enums

- *Ruby's answer:* module constants (`BucketEncryption::KMS_MANAGED`).

## Union types

Statically-typed targets need a strategy (overloads? `Object`?); dynamic
targets usually pass through with runtime type checks.

## Version scheme

How do npm semver versions and ranges map to your ecosystem's scheme?
Which prerelease labels exist on both sides? What is unrepresentable (fail
loudly at generation time)?

- *Ruby's answer:* full label mapping (`alpha`/`beta`/`rc`/`dev`), rejection
  of multiple or unmappable labels, `'>= x', '< y'` range pairs.

Also decide your **dependency-pinning policy**: translate the npm ranges
faithfully, or pin inter-package dependencies to the exact versions generated
together? A feed that publishes the whole closure atomically wants exact pins
(consumers resolve exactly the set that was tested together); the runtime
library's constraint should stay a range so runtime patches don't force a
full regeneration.

- *Ruby's answer:* `JSII_RUBY_PIN_DEPENDENCIES=exact` at build time; runtime
  gem pinned `~> 0.1` in lockstep with the plugin version.

## Callback ergonomics

Async overrides, property overrides, `super` calls from user subclasses —
how do they read in idiomatic Elixir?

## Documentation

How are doc comments rendered (docstring format, doc tool)? How do
translated examples appear?

- *Ruby's answer:* YARD comments; rosetta-translated examples embedded in
  generated sources; RBS signatures alongside for editor support.
