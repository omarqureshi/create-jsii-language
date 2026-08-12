# Distribution repositories

Your language target should not know that AWS exists.

It generates {{Lang}} for *any* jsii assembly and takes whatever naming it is
handed. What a particular library is called — `aws_s3` becoming `S3` rather
than `AwsS3`, `cdk8s` becoming `CDK8s` rather than `Cdk8s` — is a fact about
that library, not about {{Lang}}. Those facts live in a separate repository per
library, along with everything downstream of them.

This is worth setting up early. It is much harder to extract a vendor's naming
from a target that grew around it than to keep it out from the start.

## The split

| | language target (this repo) | distribution repository |
| --- | --- | --- |
| owns | the generator, the runtime, the conformance suite | one library's naming, its packages, its docs |
| knows about | jsii, {{Lang}} | one library, and this target as a dependency |
| example | `jsii-target-{{lang}}` | `aws-cdk-{{lang}}`, `cdk8s-{{lang}}` |
| releases | when the generator changes (rarely) | when the library releases (often, independently) |

The cadence argument alone justifies it: `aws-cdk-lib` ships most days and the
generator changes rarely. Coupling them means a target release per library
release, and a reviewer who wants to read your language target instead reads a
distribution pipeline.

## What a distribution repository contains

```
config/profile.json      what this library is called in {{Lang}}
test/profile.test.js     that those names are right, and that nothing is unnamed
.github/workflows/       build the packages, publish them, build the docs
```

That is all. No generator, no runtime — it depends on the target.

## The profile

A profile is naming data keyed by assembly name, merged over whatever the
assembly declares. Published assemblies carry no `targets.{{lang}}` — external
language config does not land in an upstream repository — so this is how the
naming arrives at generation time.

```json
{
  "aws-cdk-lib": {
    "package": "aws-cdk-lib",
    "module": "AWSCDK",
    "submodulePrefix": "aws_",
    "acronyms": ["S3", "EC2", "IAM", "RDS"],
    "submodules": {
      "aws-cdk-lib.aws_s3": { "module": "AWSCDK::S3" }
    }
  }
}
```

`submodulePrefix` is worth calling out: it is the prefix a library puts on its
submodule names that its conventional import aliases leave off — `aws_iam`
imported as `iam`. It belongs in the profile because it is a fact about the
library. A target that hardcodes one vendor's prefix resolves that vendor's
aliases and silently fails everyone else's.

## Testing a profile

The target exports a harness so a distribution repository can check its own
naming without reimplementing generation:

```js
const { profileHarness } = require('jsii-target-{{lang}}/testing');

const h = profileHarness({ profile: 'config/profile.json', assemblies: [ASSEMBLY] });

h.modulePathFor('aws-cdk-lib.aws_ec2');   // => "AWSCDK::EC2", not "AwsEc2"
h.render("new s3.Bucket(this, 'B');");    // what the documentation will show
h.unnamedSubmodules();                    // [] — or a naming decision to make
```

`unnamedSubmodules` is the one that earns its keep. Every library release can
add submodules, and an unnamed one renders as a derived guess that becomes
permanent public API the moment it ships. Failing the build until someone
records the name is the point: **the failure is the feature.**

When this was first run against a current `aws-cdk-lib`, it found eleven
unnamed services. Three of them were genuine judgement calls that a derivation
would have got wrong.

## Publishing: who may write what

Several distribution repositories publish into one place, so ownership has to
be explicit. Two rules, both learned by getting them wrong:

**Write only under a prefix you exclusively own, and version it.**

```
docs/<Library>/<version>/     yours, immutable once written
packages/                     add only
```

Never `--delete` against a shared destination. It removes whatever is absent
from *your* source, which is every other library. Version prefixes also mean a
rebuild of an old release cannot disturb a newer one, and someone who pinned a
package can read the documentation that matches it.

**Anything derived from everything is owned by one repository.**

A package index describes the whole feed, not your library. Rebuilding it from
your own view is a read-modify-write race: a package another repository added
between your read and your write is silently absent from the index you upload,
while sitting in storage intact — an install failure with no failing build
anywhere. CI concurrency groups do not help, being per-repository.

So publishers add their artifacts and then say what they published; the
repository owning the shared state recomputes it from what is actually there.
Aliases for "the current version" are computed from the versions that exist,
never written by the publisher — otherwise publishing a patch to an older minor
drags the alias backwards.

## Worked examples

- [`aws-cdk-ruby`](https://github.com/omarqureshi/aws-cdk-ruby) — ~340 named
  submodules, the drift check, gem and documentation publishing
- [`cdk8s-ruby`](https://github.com/omarqureshi/cdk8s-ruby) — smaller, and
  carries a conformance check that synthesizes the same chart from {{Lang}} and
  TypeScript and diffs the output
