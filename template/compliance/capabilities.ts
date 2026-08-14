/**
 * What the jsii compliance suite is actually asking you to build.
 *
 * The suite reports 123 tests by name. A name like
 * `objectIdDoesNotGetReallocatedWhenTheConstructorPassesThisOut` tells you a
 * test failed; it does not tell you what to go and implement, and jsii's own
 * suite definition leaves most of the descriptions empty. So this file records,
 * for every test, what it proves and which runtime mechanism it belongs to.
 *
 * The grouping is the useful part. A new binding does not fail one test at a
 * time — one missing mechanism takes every test that depends on it down at
 * once, and twenty red lines describing a single problem read as twenty
 * problems. Capabilities carry prerequisites, so `plan.ts` can order them and
 * name the one worth working on now.
 *
 * Derived by reading the reference implementations in the jsii repository
 * (`packages/@jsii/java-runtime-test/.../ComplianceTest.java`, with
 * `packages/@jsii/python-runtime/tests/test_compliance.py` filling gaps)
 * against the canonical names in `tools/jsii-compliance/suite.ts`. When the
 * suite gains a test, your report will carry a name this file does not know
 * about — `plan.ts` says so rather than ignoring it.
 */

export interface Capability {
  /** Referenced by `TestEntry#capability`. */
  readonly name: string;
  /** What you have to be able to do, for someone who has not built one before. */
  readonly summary: string;
  /** Capabilities that have to work before this one can be attempted. */
  readonly requires?: readonly string[];
}

export interface TestEntry {
  readonly capability: string;
  /** What this test proves, in one line. */
  readonly description: string;
}

export const CAPABILITIES: readonly Capability[] = [
  {
    name: 'kernel',
    summary:
      'Start the jsii kernel process, load an assembly, and create objects, call methods and ' +
      'read and write properties across the boundary. Nothing else runs until this does.',
  },
  {
    name: 'values',
    summary:
      'Marshal the value types both ways: strings, numbers, booleans, dates, enums, JSON and ' +
      '`any`. Two catch people out — enums cross as a member reference rather than their ' +
      'underlying value, and an unset value has to stay distinguishable from a null one.',
    requires: ['kernel'],
  },
  {
    name: 'collections',
    summary:
      'Marshal arrays and maps, of values and of object references alike. A collection returned ' +
      'from the kernel is a copy, so writing to it would silently do nothing: the suite expects ' +
      'the attempt to fail loudly, which usually means returning something the language itself ' +
      'refuses to modify.',
    requires: ['values'],
  },
  {
    name: 'structs',
    summary:
      'Data types that cross by value rather than by reference: optional fields, equality and ' +
      'hashing, inheritance that dedupes properties, and a builder or equivalent. A struct built ' +
      'natively and one returned by the kernel have to be indistinguishable, in both directions.',
    requires: ['values'],
  },
  {
    name: 'references',
    summary:
      'Give every kernel object a stable identity. The same remote object handed back twice has ' +
      'to arrive as the same guest object — including while its constructor is still running, ' +
      'for instances of classes the assembly does not export, and for guest objects that have ' +
      'been passed in and come back out.',
    requires: ['kernel'],
  },
  {
    name: 'interfaces',
    summary:
      'Represent a kernel-side interface as something the guest can hold, pass, and implement ' +
      'from scratch. Includes values that satisfy several interfaces at once and interfaces ' +
      'implemented indirectly through a base class — this is where single-inheritance languages ' +
      'need a proxy rather than a subclass.',
    requires: ['references'],
  },
  {
    name: 'unions',
    summary:
      'Members whose type is one of several. The wire carries no discriminator, so the concrete ' +
      'type has to be recovered from the value itself, and a union of structs has to deserialize ' +
      'to the right struct.',
    requires: ['structs', 'references'],
  },
  {
    name: 'errors',
    summary:
      'Carry failures across the boundary. A kernel exception has to surface as a native one ' +
      'with its message intact, and the object it was raised on has to remain usable afterwards.',
    requires: ['kernel'],
  },
  {
    name: 'overrides-sync',
    summary:
      'Let the kernel call back into a subclass written in the guest language. This inverts the ' +
      'protocol — the guest is now answering requests rather than making them — and it is the ' +
      'single largest step in building a binding. Includes knowing what NOT to override: a ' +
      'private member of the parent must not be captured by a same-named guest member.',
    requires: ['interfaces', 'errors'],
  },
  {
    name: 'overrides-async',
    summary:
      'Serve those callbacks during an asynchronous kernel invocation, where the guest has to ' +
      'answer pending callbacks before the original call can complete. In languages without ' +
      'native async this is a loop, not concurrency.',
    requires: ['overrides-sync'],
  },
  {
    name: 'naming',
    summary:
      'Translate jsii names into the target language without collisions: reserved words in ' +
      'method, property and struct-field position, and anything that would shadow the runtime.',
    requires: ['kernel'],
  },
];

export const TESTS: Readonly<Record<string, TestEntry>> = {
  // ---- kernel -------------------------------------------------------------
  callMethods: {
    capability: 'kernel',
    description: 'Methods can be invoked on a kernel object and mutate its state',
  },
  getSetPrimitiveProperties: {
    capability: 'kernel',
    description: 'Primitive properties can be read from constructed objects',
  },
  getAndSetNonPrimitiveProperties: {
    capability: 'kernel',
    description: 'A property holding another kernel object can be read and written',
  },
  createObjectAndCtorOverloads: {
    capability: 'kernel',
    description: 'A class can be constructed with and without its optional argument',
  },
  fluentApi: {
    capability: 'kernel',
    description: 'A struct built fluently can be passed to a constructor',
  },
  testFluentApiWithDerivedClasses: {
    capability: 'kernel',
    description: 'Properties inherited from a base class are settable on a derived one',
  },
  statics: {
    capability: 'kernel',
    description: 'Static methods and mutable static properties can be called, read and written',
  },
  consts: {
    capability: 'kernel',
    description: 'Static constants can be read, including ones holding an object reference or a map',
  },
  variadicMethodCanBeInvoked: {
    capability: 'kernel',
    description: 'A variadic method receives its trailing arguments as a list',
  },
  classWithPrivateConstructorAndAutomaticProperties: {
    capability: 'kernel',
    description: 'A class with no public constructor can be obtained from a static factory',
  },
  nodeStandardLibrary: {
    capability: 'kernel',
    description: 'Kernel code using the Node standard library works through the binding',
  },
  testJsiiAgent: {
    capability: 'kernel',
    description: 'The binding identifies itself and its version in the JSII_AGENT variable',
  },
  strippedDeprecatedMemberCanBeReceived: {
    capability: 'kernel',
    description: 'A value whose deprecated members were stripped can still be received',
  },

  // ---- values -------------------------------------------------------------
  primitiveTypes: {
    capability: 'values',
    description: 'Booleans, strings, numbers, dates and JSON round-trip through typed properties',
  },
  dynamicTypes: {
    capability: 'values',
    description: 'The same values round-trip through an `any` property, keeping their type',
  },
  dates: {
    capability: 'values',
    description: 'Dates round-trip through both a typed property and an `any` one',
  },
  iso8601DoesNotDeserializeToDate: {
    capability: 'values',
    description: 'A string that merely looks like a date stays a string',
  },
  getAndSetEnumValues: {
    capability: 'values',
    description: 'An enum-typed property can be read and written using the generated enum',
  },
  canLoadEnumValues: {
    capability: 'values',
    description: 'Enum members returned by the kernel resolve to guest enum values',
  },
  useEnumFromScopedModule: {
    capability: 'values',
    description: 'An enum declared in a dependency assembly can be read and written',
  },
  undefinedAndNull: {
    capability: 'values',
    description: 'An unset optional property reads as absent and can be set back to absent',
  },
  nullShouldBeTreatedAsUndefined: {
    capability: 'values',
    description: 'Null passed as an argument, inside a struct or inside an array is treated as unset',
  },

  // ---- collections --------------------------------------------------------
  collectionTypes: {
    capability: 'collections',
    description: 'Array and map properties can be written and read back',
  },
  arrays: {
    capability: 'collections',
    description: 'An array of object references round-trips, and its elements stay live kernel objects',
  },
  maps: {
    capability: 'collections',
    description: 'A map of arrays of object references can be read from the kernel',
  },
  arrayReturnedByMethodCanBeRead: {
    capability: 'collections',
    description: 'An array created in the kernel can be queried for its elements',
  },
  arrayReturnedByMethodCannotBeModified: {
    capability: 'collections',
    description: 'Writing to an array returned by a method fails rather than being silently lost',
  },
  mapReturnedByMethodCanBeRead: {
    capability: 'collections',
    description: 'A map created in the kernel can be queried for its entries',
  },
  mapReturnedByMethodCannotBeModified: {
    capability: 'collections',
    description: 'Writing to a map returned by a method fails rather than being silently lost',
  },
  listInClassCanBeReadCorrectly: {
    capability: 'collections',
    description: 'An array passed into a constructor can be read back from the property',
  },
  mapInClassCanBeReadCorrectly: {
    capability: 'collections',
    description: 'A map passed into a constructor can be read back from the property',
  },
  mapInClassCannotBeModified: {
    capability: 'collections',
    description: 'Writing to a map read from a property fails rather than being silently lost',
  },
  staticListInClassCanBeReadCorrectly: {
    capability: 'collections',
    description: 'A static array property can be read',
  },
  staticListInClassCannotBeModified: {
    capability: 'collections',
    description: 'Writing to a static array property fails rather than being silently lost',
  },
  staticMapInClassCanBeReadCorrectly: {
    capability: 'collections',
    description: 'A static map property can be read',
  },
  staticMapInClassCannotBeModified: {
    capability: 'collections',
    description: 'Writing to a static map property fails rather than being silently lost',
  },
  testNullIsAValidOptionalList: {
    capability: 'collections',
    description: 'An optional array that is unset reads as absent, not as an empty array',
  },
  testNullIsAValidOptionalMap: {
    capability: 'collections',
    description: 'An optional map that is unset reads as absent, not as an empty map',
  },
  collectionOfInterfaces_ListOfStructs: {
    capability: 'collections',
    description: 'An array of structs deserializes to structs, not to plain maps',
  },
  collectionOfInterfaces_MapOfStructs: {
    capability: 'collections',
    description: 'A map of structs deserializes to structs, not to plain maps',
  },
  collectionOfInterfaces_ListOfInterfaces: {
    capability: 'collections',
    description: 'An array of interface values deserializes to usable proxies',
  },
  collectionOfInterfaces_MapOfInterfaces: {
    capability: 'collections',
    description: 'A map of interface values deserializes to usable proxies',
  },

  // ---- structs ------------------------------------------------------------
  structs_serializeToJsii: {
    capability: 'structs',
    description: 'A struct, including an inherited one, serializes with every field the kernel expects',
  },
  structsAreUndecoratedOntheWayToKernel: {
    capability: 'structs',
    description: 'A struct crosses as a plain object, carrying no binding-specific decoration',
  },
  structs_returnedLiteralEqualsNativeBuilt: {
    capability: 'structs',
    description: 'A struct returned by the kernel is indistinguishable from one built natively',
  },
  structs_stepBuilders: {
    capability: 'structs',
    description: 'A struct can be assembled field by field, keeping object identity for reference fields',
  },
  structs_containsNullChecks: {
    capability: 'structs',
    description: 'Building a struct without a required field fails at construction',
  },
  structs_nonOptionalequals: {
    capability: 'structs',
    description: 'Two structs with equal required fields are equal',
  },
  structs_nonOptionalhashCode: {
    capability: 'structs',
    description: 'Two structs with equal required fields hash alike, and differing ones do not',
  },
  structs_optionalEquals: {
    capability: 'structs',
    description: 'Struct equality accounts for optional fields, including when unset',
  },
  structs_optionalHashCode: {
    capability: 'structs',
    description: 'Struct hashing accounts for optional fields, including when unset',
  },
  structs_multiplePropertiesEquals: {
    capability: 'structs',
    description: 'Equality holds across a struct with many inherited fields',
  },
  structs_multiplePropertiesHashCode: {
    capability: 'structs',
    description: 'Hashing holds across a struct with many inherited fields',
  },
  structs_withDiamondInheritance_correctlyDedupeProperties: {
    capability: 'structs',
    description: 'A field inherited by two paths appears once, not twice',
  },
  testStructsCanBeDowncastedToParentType: {
    capability: 'structs',
    description: 'A struct can be passed where one of its parent types is expected',
  },
  useNestedStruct: {
    capability: 'structs',
    description: 'A struct declared inside a namespace can be built and passed',
  },
  eraseUnsetDataValues: {
    capability: 'structs',
    description: 'Unset struct fields are absent from the object the kernel sees, not present-and-null',
  },
  liftedKwargWithSameNameAsPositionalArg: {
    capability: 'structs',
    description: 'A struct argument lifted into keyword parameters still resolves when a field shares a positional name',
  },
  equalsIsResistantToPropertyShadowingResultVariable: {
    capability: 'structs',
    description: 'Struct equality still works when a field is named like the generated code\'s own variables',
  },
  hashCodeIsResistantToPropertyShadowingResultVariable: {
    capability: 'structs',
    description: 'Struct hashing still works when a field is named like the generated code\'s own variables',
  },

  // ---- references ---------------------------------------------------------
  subclassing: {
    capability: 'references',
    description: 'A guest subclass of a kernel class can be passed back in and used',
  },
  creationOfNativeObjectsFromJavaScriptObjects: {
    capability: 'references',
    description: 'A guest object stored in an `any` property comes back as the same instance',
  },
  testNativeObjectsWithInterfaces: {
    capability: 'references',
    description: 'A guest object implementing an interface keeps its identity and state across calls',
  },
  objectIdDoesNotGetReallocatedWhenTheConstructorPassesThisOut: {
    capability: 'references',
    description: 'An object passed out of its own constructor keeps one identity, not two',
  },
  classesCanSelfReferenceDuringClassInitialization: {
    capability: 'references',
    description: 'A class can reference another class while it is still initializing',
  },
  objRefsAreLabelledUsingWithTheMostCorrectType: {
    capability: 'references',
    description: 'A returned reference arrives as the most derived type the kernel knows',
  },
  receiveInstanceOfPrivateClass: {
    capability: 'references',
    description: 'An instance of a class the assembly does not export is still usable through its interface',
  },
  returnAbstract: {
    capability: 'references',
    description: 'An abstract class returned by the kernel exposes its abstract and concrete members',
  },
  unmarshallIntoAbstractType: {
    capability: 'references',
    description: 'A value typed as an abstract class deserializes to a usable object',
  },
  returnSubclassThatImplementsInterface976: {
    capability: 'references',
    description: 'A returned subclass that implements an interface is usable as that interface',
  },
  testJSObjectLiteralToNative: {
    capability: 'references',
    description: 'An object literal returned by the kernel becomes a usable guest object',
  },
  classCanBeUsedWhenNotExpressedlyLoaded: {
    capability: 'references',
    description: 'A type reached only indirectly is resolvable without being loaded explicitly',
  },
  downcasting: {
    capability: 'references',
    description: 'A reference can be narrowed to the concrete type the kernel returned',
  },

  // ---- interfaces ---------------------------------------------------------
  testInterfaces: {
    capability: 'interfaces',
    description: 'Kernel classes are usable through each interface they implement',
  },
  testInterfaceParameter: {
    capability: 'interfaces',
    description: 'An interface value obtained from the kernel can be passed back as a parameter',
  },
  testLiteralInterface: {
    capability: 'interfaces',
    description: 'An object literal typed as an interface is usable through that interface',
  },
  canUseInterfaceSetters: {
    capability: 'interfaces',
    description: 'A read-write interface property generates a setter that reaches the kernel',
  },
  interfaceBuilder: {
    capability: 'interfaces',
    description: 'An interface implemented entirely in the guest can be passed to the kernel',
  },
  pureInterfacesCanBeUsedTransparently: {
    capability: 'interfaces',
    description: 'A guest implementation of a behaviour-only interface is accepted where that interface is expected',
  },
  pureInterfacesCanBeUsedTransparently_WhenTransitivelyImplementing: {
    capability: 'interfaces',
    description: 'The same holds when the interface is implemented by a base class rather than directly',
  },
  interfacesCanBeUsedTransparently_WhenAddedToJsiiType: {
    capability: 'interfaces',
    description: 'The same holds when a guest subclass of a kernel class adds the interface',
  },
  canLeverageIndirectInterfacePolymorphism: {
    capability: 'interfaces',
    description: 'A value returned as an interface and as a class exposes the members of both',
  },
  callbackParameterIsInterface: {
    capability: 'interfaces',
    description: 'An interface passed into a guest callback arrives as a usable proxy',
  },

  // ---- unions -------------------------------------------------------------
  unionTypes: {
    capability: 'unions',
    description: 'A union-typed property accepts each member type and returns it as itself',
  },
  unionProperties: {
    capability: 'unions',
    description: 'A union of object types returns the concrete class, not a base one',
  },
  unionPropertiesWithBuilder: {
    capability: 'unions',
    description: 'A struct with union fields can be built with a value of each member type',
  },
  correctlyDeserializesStructUnions: {
    capability: 'unions',
    description: 'A union of structs deserializes to the struct that matches, not the first one',
  },
  canObtainReferenceWithOverloadedSetter: {
    capability: 'unions',
    description: 'A class with a union-typed settable property can be returned from the kernel',
  },
  canObtainStructReferenceWithOverloadedSetter: {
    capability: 'unions',
    description: 'A struct with a union-typed settable field can be returned from the kernel',
  },

  // ---- errors -------------------------------------------------------------
  exceptions: {
    capability: 'errors',
    description: 'A kernel failure raises a native exception, and the object stays usable afterwards',
  },
  exceptionMessage: {
    capability: 'errors',
    description: 'The message from a kernel failure reaches the guest intact',
  },

  // ---- overrides-sync -----------------------------------------------------
  syncOverrides: {
    capability: 'overrides-sync',
    description: 'The kernel calls a guest override from a method and a property, and sees guest property writes',
  },
  syncOverrides_callsSuper: {
    capability: 'overrides-sync',
    description: 'A guest override can call the implementation it overrides',
  },
  propertyOverrides_get_set: {
    capability: 'overrides-sync',
    description: 'A guest override of a property getter and setter is what the kernel uses',
  },
  propertyOverrides_get_calls_super: {
    capability: 'overrides-sync',
    description: 'An overriding getter can call the one it overrides',
  },
  propertyOverrides_set_calls_super: {
    capability: 'overrides-sync',
    description: 'An overriding setter can call the one it overrides',
  },
  propertyOverrides_get_throws: {
    capability: 'overrides-sync',
    description: 'An exception from an overriding getter reaches the caller with its message',
  },
  propertyOverrides_set_throws: {
    capability: 'overrides-sync',
    description: 'An exception from an overriding setter reaches the caller with its message',
  },
  propertyOverrides_interfaces: {
    capability: 'overrides-sync',
    description: 'Properties of an interface implemented in the guest are served to the kernel',
  },
  canOverrideProtectedMethod: {
    capability: 'overrides-sync',
    description: 'A protected method can be overridden in the guest',
  },
  canOverrideProtectedGetter: {
    capability: 'overrides-sync',
    description: 'A protected property getter can be overridden in the guest',
  },
  canOverrideProtectedSetter: {
    capability: 'overrides-sync',
    description: 'A protected property setter can be overridden, including calling super',
  },
  abstractMembersAreCorrectlyHandled: {
    capability: 'overrides-sync',
    description: 'Abstract members implemented in the guest are called by the kernel',
  },
  callbacksCorrectlyDeserializeArguments: {
    capability: 'overrides-sync',
    description: 'Arguments the kernel passes into a guest callback arrive with their types',
  },
  doNotOverridePrivates_method_private: {
    capability: 'overrides-sync',
    description: 'A private guest method does not override a private parent method',
  },
  doNotOverridePrivates_method_public: {
    capability: 'overrides-sync',
    description: 'A public guest method does not override a private parent method',
  },
  doNotOverridePrivates_property_getter_private: {
    capability: 'overrides-sync',
    description: 'A private guest getter does not override a private parent property',
  },
  doNotOverridePrivates_property_getter_public: {
    capability: 'overrides-sync',
    description: 'A public guest getter does not override a private parent property',
  },
  doNotOverridePrivates_property_by_name_private: {
    capability: 'overrides-sync',
    description: 'A private guest member named like a private parent property does not override it',
  },
  doNotOverridePrivates_property_by_name_public: {
    capability: 'overrides-sync',
    description: 'A public guest member named like a private parent property does not override it',
  },
  fail_syncOverrides_callsDoubleAsync_method: {
    capability: 'overrides-sync',
    description: 'A synchronous callback that re-enters the kernel asynchronously fails rather than deadlocking',
  },
  fail_syncOverrides_callsDoubleAsync_propertyGetter: {
    capability: 'overrides-sync',
    description: 'The same, from a property getter',
  },
  fail_syncOverrides_callsDoubleAsync_propertySetter: {
    capability: 'overrides-sync',
    description: 'The same, from a property setter',
  },

  // ---- overrides-async ----------------------------------------------------
  asyncOverrides_callAsyncMethod: {
    capability: 'overrides-async',
    description: 'An async kernel method can be invoked and returns its value',
  },
  asyncOverrides_overrideAsyncMethod: {
    capability: 'overrides-async',
    description: 'A guest subclass can override an async method, and the kernel calls the override',
  },
  asyncOverrides_overrideAsyncMethodByParentClass: {
    capability: 'overrides-async',
    description: 'An override declared on a parent of the instantiated class is still the one called',
  },
  asyncOverrides_overrideCallsSuper: {
    capability: 'overrides-async',
    description: 'An async override can call the implementation it overrides',
  },
  asyncOverrides_twoOverrides: {
    capability: 'overrides-async',
    description: 'Two overridden async methods on one class are dispatched independently',
  },
  asyncOverrides_overrideThrows: {
    capability: 'overrides-async',
    description: 'An exception raised inside an async override reaches the caller with its message',
  },
  voidReturningAsync: {
    capability: 'overrides-async',
    description: 'An async method that resolves to nothing returns absent rather than hanging',
  },

  // ---- naming -------------------------------------------------------------
  reservedKeywordsAreSlugifiedInMethodNames: {
    capability: 'naming',
    description: 'Methods named after reserved words are renamed and remain callable',
  },
  reservedKeywordsAreSlugifiedInClassProperties: {
    capability: 'naming',
    description: 'Class properties named after reserved words are renamed and remain usable',
  },
  reservedKeywordsAreSlugifiedInStructProperties: {
    capability: 'naming',
    description: 'Struct fields named after reserved words are renamed and still serialize correctly',
  },
};
