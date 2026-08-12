import { DefaultVisitor } from 'jsii-rosetta/lib/languages/default';
import { TargetLanguage } from 'jsii-rosetta/lib/languages/target-language';

/**
 * Per-node rendering context threaded through the visitor. Add fields as your
 * renderer needs them (the Ruby visitor tracks things like "inside a struct
 * argument" and "receiver of a property access").
 */
interface ElixirLanguageContext {
  readonly [key: string]: unknown;
}

/**
 * Translates TypeScript example snippets to Elixir for documentation.
 *
 * DefaultVisitor renders every construct it does not recognize as its raw
 * TypeScript text, so an empty visitor is *valid* — translation quality then
 * grows method by method. The highest-value overrides, in the order the Ruby
 * reference implemented them:
 *
 *   1. importStatement       — imports -> your ecosystem's require/use/import
 *   2. propertyAccessExpression — member naming conventions
 *   3. callExpression + argument handling — including struct-literal args
 *   4. objectLiteralExpression — struct vs map rendering
 *   5. variableDeclaration / block / ifStatement — statement shapes
 *   6. classDeclaration / methods — for README-style examples
 *
 * Validate against the shared corpus as you go: `npm test` runs jsii-rosetta's
 * shipped translations corpus against this visitor, and every snippet you have
 * not written an expectation for shows up as a visible skip — a progress bar
 * (see test/rosetta-corpus.test.ts).
 */
export class ElixirVisitor extends DefaultVisitor<ElixirLanguageContext> {
  /**
   * Translation version: bump when rendering changes to invalidate cached
   * translations in tablets.
   */
  public static readonly VERSION = '1';

  // Registered dynamically (see register.ts); the value is this plugin's
  // language name, outside the built-in TargetLanguage enum.
  public readonly language = 'elixir' as TargetLanguage;

  public readonly defaultContext: ElixirLanguageContext = {};

  public readonly indentChar: ' ' | '\t' = ' ';

  public mergeContext(old: ElixirLanguageContext, update: Partial<ElixirLanguageContext>): ElixirLanguageContext {
    return { ...old, ...update };
  }
}
