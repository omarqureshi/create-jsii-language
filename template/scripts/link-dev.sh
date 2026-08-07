#!/usr/bin/env bash
# Development linking, for as long as the pacmak plugin API is unreleased:
# symlinks this package's dependencies into a local checkout of the jsii
# monorepo (built on a branch that includes the plugin API, e.g.
# jsii-language-plugins) and a jsii-rosetta checkout with the language
# registry + published corpus.
#
#   ./scripts/link-dev.sh <path-to-jsii-monorepo> [<path-to-jsii-rosetta>]
#
# Once the plugin API ships in released jsii-pacmak/jsii-rosetta, delete this
# script and `npm install` normally.
set -euo pipefail

jsii_repo="${1:?usage: link-dev.sh <path-to-jsii-monorepo> [<path-to-jsii-rosetta>]}"
rosetta_repo="${2:-}"

cd "$(dirname "$0")/.."
mkdir -p node_modules/@jsii node_modules/@types

link() {
  ln -sfn "$2" "node_modules/$1"
  echo "  $1 -> $2"
}

link jsii-pacmak   "${jsii_repo}/packages/jsii-pacmak"
link jsii-reflect  "${jsii_repo}/packages/jsii-reflect"
link codemaker     "${jsii_repo}/packages/codemaker"
link @jsii/spec    "${jsii_repo}/packages/@jsii/spec"
link fs-extra      "${jsii_repo}/node_modules/fs-extra"
link semver        "${jsii_repo}/node_modules/semver"
link @types/node   "${jsii_repo}/node_modules/@types/node"
link typescript    "${jsii_repo}/node_modules/typescript"

if [[ -n "${rosetta_repo}" ]]; then
  link jsii-rosetta "${rosetta_repo}"
fi

echo "linked. build with: npm run build"
