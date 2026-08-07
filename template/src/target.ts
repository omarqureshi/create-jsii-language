import * as spec from '@jsii/spec';
import { Generator } from 'jsii-pacmak/lib/generator';
import { Target, TargetOptions } from 'jsii-pacmak/lib/target';

/**
 * TODO({{lang}}): the file extension your language uses for source files.
 */
export const SOURCE_FILE_EXTENSION = '.{{lang}}';

export class {{Lang}}Target extends Target {
  protected readonly generator: {{Lang}}Generator;

  public constructor(options: TargetOptions) {
    super(options);
    this.generator = new {{Lang}}Generator(options.rosetta, options);
  }

  /**
   * Turns the generated sources into a distributable package.
   *
   * TODO({{lang}}): invoke your ecosystem's package build here (the Ruby
   * reference shells out to `gem build`). Until then, the generated sources
   * are copied to the output directory as-is.
   */
  public async build(sourceDir: string, outDir: string): Promise<void> {
    await this.copyFiles(sourceDir, outDir);
  }
}

/**
 * The code generator: pacmak walks the assembly and calls the on*() hooks in
 * declaration order; this class turns them into {{Lang}} source text via
 * `this.code` (a CodeMaker: openFile/line/indent/unindent/closeFile).
 *
 * As scaffolded, it emits a JSON manifest of every type it visits instead of
 * real code — so `jsii-pacmak --plugin` runs end-to-end on day one, and your
 * job is to replace manifest entries with {{Lang}} source, hook by hook.
 * Record each naming/ergonomics decision in docs/decisions.md as you go.
 */
export class {{Lang}}Generator extends Generator {
  private readonly manifest: {
    classes: string[];
    interfaces: string[];
    enums: string[];
    members: string[];
  } = { classes: [], interfaces: [], enums: [], members: [] };

  public constructor(
    // The rosetta tablet reader pacmak hands every target; store and use it
    // for example translation once your rosetta visitor exists.
    _rosetta: TargetOptions['rosetta'],
    options: TargetOptions,
  ) {
    super({ runtimeTypeChecking: options.runtimeTypeChecking });
  }

  protected override getAssemblyOutputDir(mod: spec.Assembly): string {
    // Where the .jsii.tgz assembly tarball lands relative to the package
    // root. TODO({{lang}}): match your package layout (Ruby embeds it under
    // lib/<gem-name>/data/).
    return `lib/${mod.name}`;
  }

  protected override onBeginAssembly(assm: spec.Assembly, _fingerprint: boolean): void {
    this.code.openFile(this.manifestFileName(assm));
  }

  protected override onEndAssembly(assm: spec.Assembly, _fingerprint: boolean): void {
    // TODO({{lang}}): when you start emitting real code, this manifest is
    // scaffolding you can delete — or keep as a generation report.
    for (const line of JSON.stringify(this.manifest, null, 2).split('\n')) {
      this.code.line(line);
    }
    this.code.closeFile(this.manifestFileName(assm));
  }

  // ─── Classes ────────────────────────────────────────────────────────────

  protected override onBeginClass(cls: spec.ClassType, _abstract: boolean | undefined): void {
    // TODO({{lang}}): open the class declaration: name mapping
    // (docs/decisions.md#type-names), base class, constructor from
    // cls.initializer.
    this.manifest.classes.push(cls.fqn);
  }

  protected override onEndClass(_cls: spec.ClassType): void {
    // TODO({{lang}}): close the class declaration.
  }

  protected onMethod(cls: spec.ClassType, method: spec.Method): void {
    // TODO({{lang}}): instance method: member naming
    // (docs/decisions.md#member-names), parameters, kernel invoke.
    this.manifest.members.push(`${cls.fqn}#${method.name}`);
  }

  protected onMethodOverload(cls: spec.ClassType, overload: spec.Method, _originalMethod: spec.Method): void {
    // TODO({{lang}}): languages with default/keyword arguments usually need
    // no overloads — the Ruby reference ignores these.
    this.manifest.members.push(`${cls.fqn}#${overload.name} (overload)`);
  }

  protected onStaticMethod(cls: spec.ClassType, method: spec.Method): void {
    // TODO({{lang}}): static method.
    this.manifest.members.push(`${cls.fqn}.${method.name} (static)`);
  }

  protected onStaticMethodOverload(cls: spec.ClassType, overload: spec.Method, _originalMethod: spec.Method): void {
    this.manifest.members.push(`${cls.fqn}.${overload.name} (static overload)`);
  }

  protected onProperty(cls: spec.ClassType, prop: spec.Property): void {
    // TODO({{lang}}): getter (and setter unless prop.immutable) backed by
    // kernel get/set.
    this.manifest.members.push(`${cls.fqn}#${prop.name} (property)`);
  }

  protected onStaticProperty(cls: spec.ClassType, prop: spec.Property): void {
    // TODO({{lang}}): static property / constant.
    this.manifest.members.push(`${cls.fqn}.${prop.name} (static property)`);
  }

  protected onUnionProperty(cls: spec.ClassType, prop: spec.Property, _union: spec.UnionTypeReference): void {
    // TODO({{lang}}): union-typed property — dynamically-typed languages
    // treat this like onProperty (docs/decisions.md#union-types).
    this.onProperty(cls, prop);
  }

  // ─── Interfaces ─────────────────────────────────────────────────────────

  protected onBeginInterface(ifc: spec.InterfaceType): void {
    // TODO({{lang}}): behavioral interfaces (ifc.datatype falsy) become your
    // language's contract construct; struct interfaces (ifc.datatype true)
    // become value objects (docs/decisions.md#structs).
    this.manifest.interfaces.push(ifc.fqn);
  }

  protected onEndInterface(_ifc: spec.InterfaceType): void {
    // TODO({{lang}}): close the interface declaration.
  }

  protected onInterfaceMethod(ifc: spec.InterfaceType, method: spec.Method): void {
    this.manifest.members.push(`${ifc.fqn}#${method.name} (interface method)`);
  }

  protected onInterfaceMethodOverload(ifc: spec.InterfaceType, overload: spec.Method, _originalMethod: spec.Method): void {
    this.manifest.members.push(`${ifc.fqn}#${overload.name} (interface overload)`);
  }

  protected onInterfaceProperty(ifc: spec.InterfaceType, prop: spec.Property): void {
    this.manifest.members.push(`${ifc.fqn}#${prop.name} (interface property)`);
  }

  // ─── Enums ──────────────────────────────────────────────────────────────

  protected override onBeginEnum(enm: spec.EnumType): void {
    // TODO({{lang}}): docs/decisions.md#enums.
    this.manifest.enums.push(enm.fqn);
  }

  private manifestFileName(assm: spec.Assembly): string {
    return `${assm.name}.manifest.json`;
  }
}
