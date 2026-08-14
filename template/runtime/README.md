# The {{Lang}} guest runtime

The generated bindings are thin: every class is a proxy that delegates to the
**jsii kernel** — a Node.js sidecar process (`@jsii/runtime`) that hosts the
original JavaScript implementation. The guest runtime is the {{Lang}} library
that manages that process and speaks its protocol. It needs **no plugin API**:
the kernel wire protocol (line-delimited JSON over stdio) is the entire
boundary.

This is the hard part of a language target, and no scaffold can generate it —
what this document generates is the *shape*, proven identical across every
existing guest runtime (Python, Java, .NET, Go, Ruby):

| Module | Responsibility | Ruby reference |
| --- | --- | --- |
| `kernel` | spawn/handshake/shutdown of the `@jsii/runtime` sidecar; request/response framing; one mutex around the wire (the kernel is single-threaded) | `lib/jsii/kernel.rb` |
| `kernel/api` | the wire verbs: `load`, `create`, `invoke`, `sinvoke`, `get`, `set`, `sget`, `sset`, `del`, `callbacks`, `complete`, `naming`, `stats` | `lib/jsii/kernel/api.rb` |
| `serializer` | value conversion both directions: primitives, dates, JSON, enums (`$jsii.enum`), object refs (`$jsii.byref`), structs (`$jsii.struct`/`$jsii.map`) | `lib/jsii/serializer.rb` |
| `object registry` | maps kernel object refs <-> native instances so identity round-trips | `lib/jsii/object/registry.rb` |
| `callbacks` | the other direction: the kernel calls *your* code (overrides, async completion); dispatch into user subclasses, marshal results/errors back | `lib/jsii/kernel/callbacks.rb`, `lib/jsii/object/overrides.rb` |
| `errors` | kernel faults -> idiomatic {{Lang}} exceptions, preserving JS error kind | `lib/jsii/errors.rb` |

## The development loop

1. Spawn + handshake: run `@jsii/runtime`, read the `hello` banner, send
   `load` for an assembly tarball. (Resolution order the Ruby runtime uses:
   `JSII_RUNTIME` env var, then `require.resolve('@jsii/runtime')` via node.)
2. `create` + `invoke` a class from `jsii-calc` by hand.
3. Then stop hand-testing and **drive the rest from the compliance suite**:
   the jsii conformance kit is the canonical definition of "a working
   runtime". Wire it up and work the failures to zero — that is empirically
   how the Ruby runtime was built. Every existing runtime passes the same
   suite; the claim you earn at the end is the same one they make.

   Do not work the raw failure list in order. All 123 fail on day one, and
   they are not 123 problems: one missing mechanism takes every test that
   depends on it down with it, so the list overstates how much is wrong and
   says nothing about where to start. Point the planner at the report your
   run wrote instead:

   ```console
   $ npm run compliance:next -- compliance/compliance-report.json
   0/123 compliance tests passing

     next  kernel           0/13
           values           0/9
           ...

   ── kernel ──
   Start the jsii kernel process, load an assembly, and create objects, call
   methods and read and write properties across the boundary. Nothing else
   runs until this does.

   Outstanding:
     callMethods
       Methods can be invoked on a kernel object and mutate its state
     ...
   ```

   It groups the suite into eleven capabilities, orders them by what depends
   on what, and names the one worth working on now — with a line on each
   outstanding test saying what it proves, which the suite's own definition
   mostly leaves blank. The catalogue is `compliance/capabilities.ts`; when a
   test's meaning is not obvious from its description, the reference
   implementations in the jsii repository are the source of truth.

The complete, passing reference implementation lives in the Ruby plugin
repository (`runtime/` and `compliance/`):
https://github.com/omarqureshi/jsii-target-ruby
