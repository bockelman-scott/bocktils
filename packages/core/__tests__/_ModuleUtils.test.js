const core = require( "@toolbocks/core" );

/**
 * Establish separate constants for each of the common utilities imported
 * @see ../src/CoreUtils.cjs
 */
const { constants } = core;

const { moduleUtils } = constants;

const
    {
        ModuleEvent,
        ToolBocksModule,
        TYPES_CHECKS,
        getExecutionEnvironment,
        getGlobalLogger,
        setGlobalLogger,
        exportModule,
        requireModule,
        importModule,
        calculateErrorSourceName,
        no_op,
        op_true,
        op_false,
        op_identity,
        functionToString,
        objectToString,
        errorToString,
        isPromise,
        isThenable,
        canBind,
        resolveMethod,
        attempt,
        attemptMethod,
        asyncAttempt,
        asyncAttemptMethod,
        bindMethod,
        fireAndForget,
        asPhrase,
        isReadOnly,
        bracketsToDots,
        toNodePathArray,
        isObjectLiteral,
        detectCycles,
        executeCallback,
        propertyDescriptors,
        ObjectEntry = moduleUtils?.classes?.ObjectEntry,
        objectEntries,
        objectValues,
        objectKeys,
        objectMethods,
        getProperty,
        setProperty,
        populateOptions,
        mergeOptions,
        merge = mergeOptions,
        lock,
        deepFreeze,
        localCopy,
        immutableCopy,
        sleep,
        StackTrace,
        __Error,
        IllegalArgumentError,
        resolveError,
        resolveEvent,
        resolveObject,
        resolveLogLevel,
        resolveType,
        IterationCap,
        StatefulListener,
        ExecutionMode,
        ExecutionEnvironment,
        Visitor,
        resolveVisitor,
        CURRENT_MODE,
        ARGUMENTS,
        getMessagesLocale,
        isFulfilled,
        isRejected,
        classes: moduleUtilsClasses,
    } = moduleUtils;

describe( "Sanity-check", () =>
{
    test( "Exported classes, variables, and functions are defined", () =>
    {
        expect( moduleUtils ).toBeDefined();

        expect( ModuleEvent ).toBeDefined();
        expect( typeof ModuleEvent ).toBe( "function" );

        expect( ToolBocksModule ).toBeDefined();
        expect( typeof ToolBocksModule ).toBe( "function" );

        expect( TYPES_CHECKS ).toBeDefined();
        expect( typeof TYPES_CHECKS ).toBe( "object" );

        expect( getExecutionEnvironment ).toBeDefined();
        expect( typeof getExecutionEnvironment ).toBe( "function" );

        expect( getGlobalLogger ).toBeDefined();
        expect( typeof getGlobalLogger ).toBe( "function" );

        expect( setGlobalLogger ).toBeDefined();
        expect( typeof setGlobalLogger ).toBe( "function" );

        expect( exportModule ).toBeDefined();
        expect( typeof exportModule ).toBe( "function" );

        expect( requireModule ).toBeDefined();
        expect( typeof requireModule ).toBe( "function" );

        expect( importModule ).toBeDefined();
        expect( typeof importModule ).toBe( "function" );

        expect( calculateErrorSourceName ).toBeDefined();
        expect( typeof calculateErrorSourceName ).toBe( "function" );

        expect( no_op ).toBeDefined();
        expect( typeof no_op ).toBe( "function" );

        expect( op_true ).toBeDefined();
        expect( typeof op_true ).toBe( "function" );

        expect( op_false ).toBeDefined();
        expect( typeof op_false ).toBe( "function" );

        expect( op_identity ).toBeDefined();
        expect( typeof op_identity ).toBe( "function" );

        expect( TYPES_CHECKS?.isPromise ).toBeDefined();
        expect( typeof TYPES_CHECKS?.isPromise ).toBe( "function" );

        expect( TYPES_CHECKS?.isThenable ).toBeDefined();
        expect( typeof TYPES_CHECKS?.isThenable ).toBe( "function" );

        expect( canBind ).toBeDefined();
        expect( typeof canBind ).toBe( "function" );

        expect( resolveMethod ).toBeDefined();
        expect( typeof resolveMethod ).toBe( "function" );

        expect( attempt ).toBeDefined();
        expect( typeof attempt ).toBe( "function" );

        expect( attemptMethod ).toBeDefined();
        expect( typeof attemptMethod ).toBe( "function" );

        expect( asyncAttempt ).toBeDefined();
        expect( typeof asyncAttempt ).toBe( "function" );

        expect( asyncAttemptMethod ).toBeDefined();
        expect( typeof asyncAttemptMethod ).toBe( "function" );

        expect( bindMethod ).toBeDefined();
        expect( typeof bindMethod ).toBe( "function" );

        expect( fireAndForget ).toBeDefined();
        expect( typeof fireAndForget ).toBe( "function" );

        expect( asPhrase ).toBeDefined();
        expect( typeof asPhrase ).toBe( "function" );

        expect( isReadOnly ).toBeDefined();
        expect( typeof isReadOnly ).toBe( "function" );

        expect( bracketsToDots ).toBeDefined();
        expect( typeof bracketsToDots ).toBe( "function" );

        expect( toNodePathArray ).toBeDefined();
        expect( typeof toNodePathArray ).toBe( "function" );

        expect( isObjectLiteral ).toBeDefined();
        expect( typeof isObjectLiteral ).toBe( "function" );

        expect( detectCycles ).toBeDefined();
        expect( typeof detectCycles ).toBe( "function" );

        expect( executeCallback ).toBeDefined();
        expect( typeof executeCallback ).toBe( "function" );

        expect( ObjectEntry ).toBeDefined();
        expect( typeof ObjectEntry ).toBe( "function" );

        expect( objectEntries ).toBeDefined();
        expect( typeof objectEntries ).toBe( "function" );

        expect( objectValues ).toBeDefined();
        expect( typeof objectValues ).toBe( "function" );

        expect( objectKeys ).toBeDefined();
        expect( typeof objectKeys ).toBe( "function" );

        expect( getProperty ).toBeDefined();
        expect( typeof getProperty ).toBe( "function" );

        expect( setProperty ).toBeDefined();
        expect( typeof setProperty ).toBe( "function" );

        expect( populateOptions ).toBeDefined();
        expect( typeof populateOptions ).toBe( "function" );

        expect( mergeOptions ).toBeDefined();
        expect( typeof mergeOptions ).toBe( "function" );

        expect( merge ).toBeDefined();
        expect( typeof merge ).toBe( "function" );

        expect( lock ).toBeDefined();
        expect( typeof lock ).toBe( "function" );

        expect( deepFreeze ).toBeDefined();
        expect( typeof deepFreeze ).toBe( "function" );

        expect( localCopy ).toBeDefined();
        expect( typeof localCopy ).toBe( "function" );

        expect( immutableCopy ).toBeDefined();
        expect( typeof immutableCopy ).toBe( "function" );

        expect( sleep ).toBeDefined();
        expect( typeof sleep ).toBe( "function" );

        expect( StackTrace ).toBeDefined();
        expect( typeof StackTrace ).toBe( "function" );

        expect( __Error ).toBeDefined();
        expect( typeof __Error ).toBe( "function" );

        expect( IllegalArgumentError ).toBeDefined();
        expect( typeof IllegalArgumentError ).toBe( "function" );

        expect( resolveError ).toBeDefined();
        expect( typeof resolveError ).toBe( "function" );

        expect( resolveEvent ).toBeDefined();
        expect( typeof resolveEvent ).toBe( "function" );

        expect( resolveObject ).toBeDefined();
        expect( typeof resolveObject ).toBe( "function" );

        expect( resolveLogLevel ).toBeDefined();
        expect( typeof resolveLogLevel ).toBe( "function" );

        expect( resolveType ).toBeDefined();
        expect( typeof resolveType ).toBe( "function" );

        expect( IterationCap ).toBeDefined();
        expect( typeof IterationCap ).toBe( "function" );

        expect( StatefulListener ).toBeDefined();
        expect( typeof StatefulListener ).toBe( "function" );

        expect( ExecutionMode ).toBeDefined();
        expect( typeof ExecutionMode ).toBe( "function" );

        expect( ExecutionEnvironment ).toBeDefined();
        expect( typeof ExecutionEnvironment ).toBe( "function" );

        expect( Visitor ).toBeDefined();
        expect( typeof Visitor ).toBe( "function" );

        expect( resolveVisitor ).toBeDefined();
        expect( typeof resolveVisitor ).toBe( "function" );

        expect( CURRENT_MODE ).toBeDefined();
        expect( typeof CURRENT_MODE ).toBe( "object" );

        expect( ARGUMENTS ).toBeDefined();
        expect( typeof ARGUMENTS ).toBe( "object" );

        expect( getMessagesLocale ).toBeDefined();
        expect( typeof getMessagesLocale ).toBe( "function" );

        expect( isFulfilled ).toBeDefined();
        expect( typeof isFulfilled ).toBe( "function" );

        expect( isRejected ).toBeDefined();
        expect( typeof isRejected ).toBe( "function" );

        expect( moduleUtilsClasses ).toBeDefined();
        expect( typeof moduleUtilsClasses ).toBe( "object" );

        expect( moduleUtilsClasses?.PromiseResult ).toBeDefined();
        expect( typeof moduleUtilsClasses?.PromiseResult ).toBe( "function" );

        console.log( "Sanity-check passed." );
    } );
} );

// NOTE: these are basic checks; use TypeUtils for more useful type checks
describe( "TYPES_CHECK functionality", () =>
{
    test( "", () =>
    {
        //TODO
    } );
} );

describe( "ExecutionEnvironment", () =>
{
    test( "", () =>
    {
        //TODO

        // ARGUMENTS
        // ENV

    } );
} );

describe( "Global Logging", () =>
{
    test( "", () =>
    {
        //TODO
    } );
} );

describe( "export/require/import modules", () =>
{
    test( "", () =>
    {
        //TODO
    } );
} );

describe( "Error Handling", () =>
{
    test( "calculateErrorSourceName returns the expected string", () =>
    {
        let errorSourceName = calculateErrorSourceName( "SomeModule", "SomeFunction" );

        expect( errorSourceName ).toBe( "SomeModule::SomeFunction" );
    } );


    //TODO
} );

describe( "Trivial Functions", () =>
{
    test( "no_op does nothing (and likes it!)", () =>
    {
        let result = no_op( 42 );
        expect( result ).toBe( undefined );
    } );

    test( "op_true returns true", () =>
    {
        let result = op_true();
        expect( result ).toBe( true );
    } );

    test( "op_false returns false", () =>
    {
        let result = op_false();
        expect( result ).toBe( false );
    } );

    test( "op_identity returns its argument(s)", () =>
    {
        let result = op_identity( 42 );
        expect( result ).toEqual( 42 );

        result = op_identity( 42, "hello" );
        expect( result ).toEqual( [42, "hello"] );
    } );
} );

describe( "Method Aliases", () =>
{
    test( "functionToString is the same as Function.prototype.toString", () =>
    {
        expect( functionToString.call( op_true ) ).toEqual( Function.prototype.toString.call( op_true ) );
    } );

    test( "objectToString is the same as Object.prototype.toString", () =>
    {
        expect( objectToString.call( [] ) ).toEqual( Object.prototype.toString.call( [] ) );
        expect( objectToString.call( [] ) ).toEqual( "[object Array]" );
    } );

    test( "errorToString is the same as Error.prototype.toString", () =>
    {
        expect( errorToString.call( new Error( "message" ) ) ).toEqual( Error.prototype.toString.call( new Error( "message" ) ) );
    } );
} );


describe( "Resolvers", () =>
{
    test( "resolveError returns an instanceof __Error", () =>
    {
        expect( resolveError( "test" ) ).toBeInstanceOf( __Error );
        expect( resolveError( new Error( "msg" ) ) ).toBeInstanceOf( __Error );

        let x;

        try
        {
            x.property = 1 / 0;
        }
        catch( ex )
        {
            expect( resolveError( ex ) ).toBeInstanceOf( __Error );
        }

        expect( resolveError( 23 ) ).not.toBeInstanceOf( __Error );
    } );

    test( "resolveMethod returns the object's member function", () =>
    {
        class TestClass
        {
            #something = "test";

            constructor( pArg )
            {
                this.#something = pArg;
            }

            testMethod()
            {
                return this.#something;
            }
        }

        TestClass.prototype.anotherMethod = () => "another";

        const testClass = new TestClass();

        expect( typeof resolveMethod( "testMethod", testClass ) ).toBe( "function" );
        expect( resolveMethod( "testMethod", testClass ) ).toBe( testClass.testMethod );

        expect( typeof resolveMethod( "anotherMethod", testClass, ) ).toBe( "function" );
        expect( resolveMethod( "anotherMethod", testClass, ) ).toBe( testClass.anotherMethod );

        expect( typeof resolveMethod( testClass.testMethod ) ).toBe( "function" );

        expect( typeof resolveMethod( testClass.anotherMethod ) ).toBe( "function" );

        expect( typeof resolveMethod( testClass.testMethod, testClass ) ).toBe( "function" );

        expect( typeof resolveMethod( testClass.anotherMethod, testClass ) ).toBe( "function" );

        expect( resolveMethod( testClass.testMethod, testClass ).call( new TestClass( "Hello" ) ) ).toEqual( "Hello" );
        expect( resolveMethod( testClass.anotherMethod, testClass ).call( new TestClass( "World" ) ) ).toEqual( "another" );

    } );

    test( "resolveEvent returns an instanceof ModuleEvent (populated with details and a usable timestamp", () =>
    {
        expect( resolveEvent( "test" ) ).toBeInstanceOf( ModuleEvent );
        expect( resolveEvent( new ModuleEvent( "test" ) ) ).toBeInstanceOf( ModuleEvent );

        expect( resolveEvent( new Event( "error" ), { a: 1, b: 2 }, {} ) ).toBeInstanceOf( ModuleEvent );

        const evt = resolveEvent( new Event( "error" ), { a: 1, b: 2 }, {} );

        expect( evt.type ).toEqual( "error" );
        expect( evt.detail ).toEqual( { a: 1, b: 2 } );
    } );

    test( "resolveObject returns its argument IFF it is an object (that is not null), otherwise an empty object", () =>
    {
        let x;

        expect( resolveObject( 42 ) ).toEqual( {} );
        expect( resolveObject( null ) ).toEqual( {} );
        expect( resolveObject( undefined ) ).toEqual( {} );
        expect( resolveObject( x ) ).toEqual( {} );

        expect( resolveObject( "hello" ) ).toEqual( {} );
        expect( resolveObject( [1, 2, 3] ) ).toEqual( {} );

        expect( resolveObject( [1, 2, 3], true ) ).toEqual( [1, 2, 3] );
        expect( resolveObject( { a: 1, b: 2 } ) ).toEqual( { a: 1, b: 2 } );
    } );

    // resolveLogLevel
    test( "resolveLogLevel returns a valid string from: none, log, error, warn, debug, info, trace", () =>
    {
        const none = resolveLogLevel( "none" );
        const log = resolveLogLevel( "log" );
        const error = resolveLogLevel( "error" );
        const warn = resolveLogLevel( "warn" );
        const info = resolveLogLevel( "info" );
        const debug = resolveLogLevel( "debug" );
        const trace = resolveLogLevel( "trace" );

        expect( none ).toEqual( "none" );
        expect( log ).toEqual( "log" );
        expect( error ).toEqual( "error" );
        expect( warn ).toEqual( "warn" );
        expect( info ).toEqual( "info" );
        expect( debug ).toEqual( "debug" );
        expect( trace ).toEqual( "trace" );

        expect( resolveLogLevel( 0 ) ).toEqual( "none" );
        expect( resolveLogLevel( 1 ) ).toEqual( "log" );
        expect( resolveLogLevel( 2 ) ).toEqual( "error" );
        expect( resolveLogLevel( 3 ) ).toEqual( "warn" );
        expect( resolveLogLevel( 4 ) ).toEqual( "info" );
        expect( resolveLogLevel( 5 ) ).toEqual( "debug" );
        expect( resolveLogLevel( 6 ) ).toEqual( "trace" );

        expect( resolveLogLevel( "uh oh" ) ).toEqual( "error" );
    } );

    test( "resolveType returns the valid JavaScript type or class of the specified value", () =>
    {
        expect( resolveType( "abc" ) ).toEqual( "string" );
        expect( resolveType( "abc", "string" ) ).toEqual( "string" );
        expect( resolveType( "abc", "number" ) ).toEqual( "string" );

        expect( resolveType( new Date() ) ).toEqual( "object" );
        expect( resolveType( new Date(), Date ) ).toEqual( Date );
    } );

// resolveVisitor
    test( "resolveVisitor returns an object that implements the visit method", () =>
    {
        // TODO
    } );
} );

describe( "IterationCap", () =>
{
    test( "can prevent an infinite loop", () =>
    {
        const iterationCap = new IterationCap( 100 );

        const condition = () => true;

        let loops = 0;

        while ( condition() && !iterationCap.reached )
        {
            loops += 1;
        }

        expect( loops ).toEqual( 100 );

    } );
} );

describe( "StatefulListener", () =>
{
    test( "can be used to track state changes", () =>
    {
        const listener = new StatefulListener();

        //TODO

    } );
} );

describe( "ExecutionMode", () =>
{
    test( "determines whether to enable trace-level verbosity", () =>
    {
        const modes = Object.keys( ExecutionMode.MODES );

        expect( modes.length ).toBeGreaterThan( 5 );

        expect( ExecutionMode.DEBUG?.traceEnabled ).toBe( true );

        expect( CURRENT_MODE?.traceEnabled ).toBe( false );
    } );
} );

describe( "Visitor", () =>
{
    test( "Visitor supports the Visitor Pattern", () =>
    {
        //TODO
    } );
} );

describe( "Reserved", () =>
{
    test( "Write a test here", () =>
    {
        //TODO
    } );
} );


describe( "getMessagesLocale", () =>
{
    test( "getMessagesLocale returns the current Locale", () =>
    {
        expect( getMessagesLocale() ).toEqual( "en-US" );
    } );
} );

describe( "Attempt/AsyncAttempt", () =>
{
    test( "attempt is an alternative to try/catch", () =>
    {
        // TODO
    } );

    test( "asyncAttempt is an alternative to Promise.catch", () =>
    {
        // TODO
    } );

    test( "attemptMethod is an alternative to try/catch", () =>
    {
        // TODO
    } );

    test( "asyncAttemptMethod is an alternative to Promise.catch", () =>
    {
        // TODO
    } );

    test( "fireAndForget runs an async function from any context without blocking", () =>
    {
        // TODO
    } );
} );


describe( "asPhrase", () =>
{
    test( "asPhrase is used to build phrases", () =>
    {
        //TODO
    } );
} );


describe( "isReadOnly", () =>
{
    test( "determines if an object or variable can be modified", () =>
    {
        //TODO
    } );
} );


describe( "bracketsToDots", () =>
{
    test( "converts a sequence of array access notation to object dot notation", () =>
    {
        let pathString = "a[0][1][2]";
        expect( bracketsToDots( pathString ) ).toEqual( "a.0.1.2" );
        expect( bracketsToDots( pathString, { useOptionalSyntax: true } ) ).toEqual( "a?.0?.1?.2" );

        pathString = "a[0]['key'][2]";
        expect( bracketsToDots( pathString ) ).toEqual( "a.0['key'].2" );
        expect( bracketsToDots( pathString, { useOptionalSyntax: true } ) ).toEqual( "a?.0['key']?.2" );
        expect( bracketsToDots( pathString, { numericIndexOnly: false } ) ).toEqual( "a.0.key.2" );

    } );
} );

describe( "toNodePathArray", () =>
{
    test( "calculates the path fron a node in an obj graph to another", () =>
    {
        let pathString = "a[0][1][2]";
        expect( toNodePathArray( pathString ) ).toEqual( ["a", "0", "1", "2"] );
        expect( toNodePathArray( pathString ) ).toEqual( ["a", "0", "1", "2"] );

        pathString = "a[0]['key'][2]";
        expect( toNodePathArray( pathString ) ).toEqual( ["a", "0", "key", "2"] );

        expect( toNodePathArray( "a", "0", "key", "2" ) ).toEqual( ["a", "0", "key", "2"] );

    } );
} );

describe( "isObjectLiteral", () =>
{
    test( "returns true if it's not a class instance", () =>
    {
        expect( isObjectLiteral( {} ) ).toBe( true );
        expect( isObjectLiteral( new Date() ) ).toBe( false );
        expect( isObjectLiteral( new Map() ) ).toBe( false );
        expect( isObjectLiteral( new Set() ) ).toBe( false );

        const obj = { a: 1, b: "2" };

        expect( isObjectLiteral( obj ) ).toBe( true );

        class TestClass
        {
            #attribute;

            constructor( pAttribute )
            {
                this.#attribute = pAttribute;
            }

            get attribute()
            {
                return this.#attribute;
            }
        }

        expect( isObjectLiteral( new TestClass( "test" ) ) ).toBe( false );
    } );
} );


describe( "detectCycles prevents infinite recursion", () =>
{
    test( "detectCycles relies on populating an array and passing it into any recursive calls",
          () =>
          {
              let results;

              let arr = ["1", "2", "3", "1", "2", "3", "1", "2", "3"];
              let arr2 = ["1", "2", "3", "1", "2", "4", "1", "2", "5"];
              let arr3 = ["1", "2", "3", "4", "5", "1", "2", "3", "4", "5", "1", "2", "3", "4", "5", "6"];

              results = detectCycles( arr, 3, 3 );

              expect( results ).toBe( true );

              results = !detectCycles( arr2, 3, 3 );

              expect( results ).toBe( true );

              results = detectCycles( arr3, 3, 3 );

              expect( results ).toBe( true );

              results = !detectCycles( arr3, 6, 3 );

              expect( results ).toBe( true );
          } );
} );

describe( "executeCallback", () =>
{
    test( "safely call a user-provided function", () =>
    {
        const callback = function()
        {
            throw new Error( "uh oh" );
        };

        expect( executeCallback( callback ) ).toBe( undefined );
    } );
} );

describe( "objectEntries - ObjectEntry", () =>
{
    test( "objectEntries returns an array of ObjectEntry values",
          () =>
          {
              let baz = "baz";

              let a = { a: 1, b: 2, c: 3, d: 4 };
              let b = { a: "a", b: "b", c: "c", d: "d" };
              let c = { foo: "bar", baz: "baz", o: a };

              let entries = objectEntries( a, b, c );

              expect( entries?.length ).toEqual( 11 );

              for( let entry of entries )
              {
                  expect( entry instanceof ObjectEntry ).toBe( true );

                  const expected = [1, 2, 3, 4].includes( entry.value ) ? a : (["a", "b", "c", "d"].includes( entry.value ) ? b : (["foo", "baz", "o"].includes( entry.key ) || ["foo", "bar", "baz", a].includes( entry.value )) ? c : c);

                  expect( entry.parent ).toBe( expected );
              }
          } );

    test( "objectEntries returns the entries of all objects specified",
          () =>
          {
              let baz = "baz";

              let a = { a: 1, b: 2, c: 3, d: 4 };
              let b = { a: "a", b: "b", c: "c", d: "d" };
              let c = { foo: "bar", baz: "baz", o: a };

              let entries = objectEntries( a, b, c, baz );

              expect( entries?.length ).toEqual( 11 );

              expect( entries[0]?.key ).toEqual( "a" );
              expect( entries[0]?.value ).toEqual( 1 );

              expect( entries[1]?.key ).toEqual( "b" );
              expect( entries[1]?.value ).toEqual( 2 );

              expect( entries[2]?.key ).toEqual( "c" );
              expect( entries[2]?.value ).toEqual( 3 );

              expect( entries[3]?.key ).toEqual( "d" );
              expect( entries[3]?.value ).toEqual( 4 );

              expect( entries[4]?.key ).toEqual( "a" );
              expect( entries[4]?.value ).toEqual( "a" );

              expect( entries[5]?.key ).toEqual( "b" );
              expect( entries[5]?.value ).toEqual( "b" );

              expect( entries[6]?.key ).toEqual( "c" );
              expect( entries[6]?.value ).toEqual( "c" );

              expect( entries[7]?.key ).toEqual( "d" );
              expect( entries[7]?.value ).toEqual( "d" );

              expect( entries[8]?.key ).toEqual( "foo" );
              expect( entries[8]?.value ).toEqual( "bar" );

              expect( entries[9]?.key ).toEqual( "baz" );
              expect( entries[9]?.value ).toEqual( "baz" );

              expect( entries[10]?.key ).toEqual( "o" );
              expect( entries[10]?.value ).toEqual( a );

          } );

    test( "objectEntries returns private properties if there is an accessor",
          () =>
          {
              class TestClass
              {
                  #hidden = "private";
                  #obscured = "obscured";
                  #secret = "secret";
                  #topSecret = "topSecret";

                  revealed = "public";

                  constructor()
                  {
                  }

                  get hidden()
                  {
                      return this.#hidden;
                  }

                  get obscured()
                  {
                      return this.#obscured;
                  }

                  get secret()
                  {
                      return this.#secret;
                  }
              }

              const testClass = new TestClass();

              const entries = objectEntries( testClass );

              expect( entries?.length ).toEqual( 5 );

              expect( entries[0]?.key ).toEqual( "revealed" );
              expect( entries[0]?.value ).toEqual( "public" );

              expect( entries[1]?.key ).toEqual( "hidden" );
              expect( entries[1]?.value ).toEqual( "private" );

              expect( entries[2]?.key ).toEqual( "obscured" );
              expect( entries[2]?.value ).toEqual( "obscured" );

              expect( entries[3]?.key ).toEqual( "secret" );
              expect( entries[3]?.value ).toEqual( "secret" );

              expect( entries[4]?.key ).not.toEqual( "topSecret" );
              expect( entries[4]?.value ).not.toEqual( "topSecret" );

              expect( entries[4]?.key ).toEqual( "class" );
              expect( entries[4]?.value ).toEqual( "TestClass" );

              expect( entries.map( e => e.key ).includes( "topSecret" ) ).toBe( false );
              expect( entries.map( e => e.key ).includes( "obscured" ) ).toBe( true );
          } );

    test( "objectEntries works with Maps, Sets, and arrays",
          () =>
          {
              const map = new Map();
              map.set( "a", 1 );
              map.set( "b", 2 );

              const set = new Set();
              set.add( 17 );
              set.add( 23 );

              const arr = [1, 2, 3, 4, 5];

              const entries = objectEntries( map, set, arr );

              expect( entries?.length ).toEqual( 9 );
          } );

    test( "objectEntries works with built-on object types",
          () =>
          {
              const date = new Date();

              let entries = objectEntries( date );

              expect( entries?.length ).toEqual( 13 );

              const rx = new RegExp( "[A-Z]+", "g" );

              entries = objectEntries( rx );

              expect( entries?.length ).toEqual( 10 );

              entries = objectEntries( new Error( "The test passed" ) );

              expect( entries?.length ).toBeGreaterThanOrEqual( 4 );

              entries = objectEntries( new IllegalArgumentError( "This is not a number" ) );

              expect( entries?.length ).toBeGreaterThanOrEqual( 4 );
          } );
} );


describe( "objectMethods", () =>
{
    test( "objectMethods returns an array of strings that are the names of the methods of the specified object",
          () =>
          {
              let methods = objectMethods( new Date() );

              console.log( methods );
          } );
} );


describe( "propertyDescriptors", () =>
{
    test( "propertyDescriptors returns an object that maps property names to their descriptors",
          () =>
          {
              let descriptors = propertyDescriptors( new Date() );

              console.log( descriptors );
          } );
} );

/*

 describe( "executeCallback", () =>
 {
 test( "safely call a user-provided function", () =>
 {
 const callback = function()
 {
 throw new Error( "uh oh" );
 };

 expect( executeCallback( callback ) ).toBe( undefined );
 } );
 } );

 */
