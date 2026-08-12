# Distribution repository starter

Copy this directory into a new repository — `aws-cdk-{{lang}}`, `cdk8s-{{lang}}` —
to publish one library's {{Lang}} packages.

It is deliberately small. There is no generator and no runtime here: those live
in the language target, which this depends on. What lives here is the naming
for one library, a test that the naming is right, and the pipeline that
publishes it.

See `../distribution-repositories.md` for why the split exists and what the
publishing rules are.

```
config/profile.json            what this library is called in {{Lang}}
test/profile.test.js           that those names are right, and nothing is unnamed
.github/workflows/build.yml    generate the packages, and publish them
```

## Getting started

1. `config/profile.json` — replace every `TODO`. Each value becomes a published
   package or module name, so they are permanent public API.
2. `test/profile.test.js` — assert the decisions a derivation would get wrong.
   Run it against a real installed release so the drift check has something to
   check.
3. `.github/workflows/build.yml` — it checks out the language target and the
   library, generates, and (opt-in) publishes.

## The rules that are not obvious

Both were learned by getting them wrong:

- **Write only under a prefix you own, and version it.** Never `--delete`
  against a destination other libraries also publish into: it removes whatever
  is absent from *your* source, which is all of them.
- **Do not rebuild anything derived from the whole feed.** A package index
  describes every library, not yours. Rebuilding it from your own view is a
  read-modify-write race that loses another publisher's package silently.
  Publish your artifacts, then tell the repository that owns the shared state.
