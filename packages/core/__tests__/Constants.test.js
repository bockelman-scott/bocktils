// no need to require jest here... run this test from the console using 'npx jest'
// let jester = require( "jest" );
// jester.run( __filename );

/** import the Constants.cjs we are testing */
const constants = require( "../src/Constants.cjs" );

const { classes } = constants;

const { ExecutionEnvironment } = classes;

describe( "Affirmatives", () =>
{
    function TestAffirmatives( pVal )
    {
        return constants?._affirmatives.includes( pVal );
    }

    test( "affirmatives include 'enabled'", () =>
    {
        expect( TestAffirmatives( "enabled" ) ).toBe( true );
    } );

    test( "affirmatives include 't'", () =>
    {
        expect( TestAffirmatives( "t" ) ).toBe( true );
    } );

    test( "affirmatives do not include 'foo'", () =>
    {
        expect( TestAffirmatives( "foo" ) ).toBe( false );
    } );
} );

describe( "populateOptions", () =>
{
    const defaults =
        {
            a: 1,
            b: 2,
            c: 3,
            d: true
        };

    const options =
        {
            a: 10,
            d: false,
            e: 23
        };

    test( "populateOptions overwrites defaults", () =>
    {
        expect( constants.populateOptions( options, defaults ) ).toEqual(
            {
                a: 10,
                b: 2,
                c: 3,
                d: false,
                e: 23
            } );
    } );

    test( "populateOptions always returns an object", () =>
    {
        expect( constants.populateOptions( null ) ).toEqual( {} );
    } );

    test( "populateOptions can handle null", () =>
    {
        expect( constants.populateOptions( null, defaults ) ).toEqual( defaults );
    } );

    test( "populateOptions can handle unexpected arguments", () =>
    {
        expect( constants.populateOptions( [1, 2, 3], [4, 5, 6] ) ).toEqual( { "0": 1, "1": 2, "2": 3 } );
    } );

    test( "populateOptions can handle unexpected defaults", () =>
    {
        expect( constants.populateOptions( [4, 5, 6], { "0": 1, "1": 2, "2": 3 } ) ).toEqual( {
                                                                                                  "0": 4,
                                                                                                  "1": 5,
                                                                                                  "2": 6
                                                                                              } );
    } );

} );

describe( "localCopy", () =>
{
    let arr = ["a", "b", "c", "d"];
    let obj = { a: 1, b: 2, letters: arr };

    function f( pObject, ...pArgs )
    {
        let localArray = constants.localCopy( pArgs );
        localArray.push( "f", "g", "h" );

        let doubledArray = [...pArgs];
        doubledArray.push( "w", "x", "y" );

        let shadowedArray = pArgs;
        shadowedArray.push( "z" );

        let localObject = constants.localCopy( pObject );
        localObject.a = 11;
        localObject.c = 42;

        let shadowedObject = pObject;
        shadowedObject.a = -1;
        shadowedObject.b = -2;
        shadowedObject.d = -4;

        let objectDouble = { ...pObject };
        objectDouble.a = 100;
        objectDouble.b = 200;
        objectDouble.d = 300;

        return { localArray, shadowedArray, doubledArray, localObject, shadowedObject, objectDouble };
    }

    function g( pObject )
    {
        const localObject = constants.localCopy( pObject );

        const spreadObject = { ...pObject };

        localObject.letters.push( "q", "r", "s" );

        spreadObject.letters.push( "t", "u", "v" );

        return { localObject, spreadObject };
    }

    test( "localCopy makes a new value that is not a reference to the source", () =>
    {
        // restore test data
        arr = ["a", "b", "c", "d"];
        obj = { a: 1, b: 2, letters: arr };
        //

        const alias = arr;

        const copy = constants.localCopy( arr );

        expect( copy ).toEqual( arr );

        expect( copy === arr ).toBe( false );
        expect( alias === arr ).toBe( true );

        let { localArray, shadowedArray, doubledArray, localObject, shadowedObject, objectDouble }
            = f( obj, ...arr );

        expect( arr ).toEqual( ["a", "b", "c", "d"] );

        expect( localArray ).toEqual( ["a", "b", "c", "d", "f", "g", "h"] );
        expect( localArray === arr ).toBe( false );

        expect( shadowedArray ).toEqual( ["a", "b", "c", "d", "z"] );

        expect( doubledArray ).toEqual( ["a", "b", "c", "d", "w", "x", "y"] );
        expect( doubledArray === arr ).toBe( false );


        expect( localObject ).toEqual( { a: 11, b: 2, c: 42, letters: arr } );
        expect( localObject === obj ).toBe( false );

        expect( shadowedObject ).toEqual( { a: -1, b: -2, d: -4, letters: arr } );
        expect( shadowedObject === obj ).toBe( true );

        expect( objectDouble ).toEqual( { a: 100, b: 200, d: 300, letters: arr } );
        expect( objectDouble === obj ).toBe( false );

        expect( objectDouble.letters ).toEqual( arr );

        // restore test data
        arr = ["a", "b", "c", "d"];
        obj = { a: 1, b: 2, letters: arr };
        //
    } );

    test( "localCopy is safer than the spread operator", () =>
    {
        // restore test data
        arr = ["a", "b", "c", "d"];
        obj = { a: 1, b: 2, letters: arr };
        //

        const { localObject, spreadObject } = g( obj );

        expect( localObject === obj ).toBe( false );
        expect( spreadObject === obj ).toBe( false );

        expect( localObject ).toEqual( { a: 1, b: 2, letters: ["a", "b", "c", "d", "q", "r", "s"] } );

        expect( spreadObject ).toEqual( { a: 1, b: 2, letters: ["a", "b", "c", "d", "t", "u", "v"] } );

        expect( spreadObject ).toEqual( { a: 1, b: 2, letters: arr } );
        expect( arr ).toEqual( ["a", "b", "c", "d", "t", "u", "v"] );

        // restore test data
        arr = ["a", "b", "c", "d"];
        obj = { a: 1, b: 2, letters: arr };
        //
    } );

} );

describe( "immutableCopy", () =>
{
    let arr = ["a", "b", "c", "d"];
    let obj = { a: 1, b: 2, letters: arr };

    function f( pObject, ...pArgs )
    {
        let localArray = constants.immutableCopy( pArgs );
        try
        {
            localArray.push( "f", "g", "h" );
        }
        catch( ex )
        {
            // localArray should be immutable, so we expect this
        }

        let doubledArray = [...pArgs];
        doubledArray.push( "w", "x", "y" );

        let shadowedArray = pArgs;
        shadowedArray.push( "z" );

        let localObject = constants.immutableCopy( pObject );

        try
        {
            localObject.a = 11;
            localObject.c = 42;
        }
        catch( ex )
        {
            // localObject should be immutable, so we expect this
        }

        try
        {
            localObject.letters.push( "ZZ" );
        }
        catch( ex )
        {
            // localObject should be immutable, so we expect this
        }

        let shadowedObject = pObject;
        shadowedObject.a = -1;
        shadowedObject.b = -2;
        shadowedObject.d = -4;

        let objectDouble = { ...pObject };
        objectDouble.a = 100;
        objectDouble.b = 200;
        objectDouble.d = 300;

        return { localArray, shadowedArray, doubledArray, localObject, shadowedObject, objectDouble };
    }

    test( "immutableCopy makes a new read-only value that is not a reference to the source", () =>
    {
        // restore test data
        arr = ["a", "b", "c", "d"];
        obj = { a: 1, b: 2, letters: arr };
        //

        const alias = arr;

        const copy = constants.immutableCopy( arr );

        expect( copy ).toEqual( arr );
        expect( Object.isFrozen( copy ) ).toBe( true );

        expect( copy === arr ).toBe( false );
        expect( alias === arr ).toBe( true );

        let { localArray, shadowedArray, doubledArray, localObject, shadowedObject, objectDouble }
            = f( obj, ...arr );

        expect( arr ).toEqual( ["a", "b", "c", "d"] );

        expect( localArray ).toEqual( ["a", "b", "c", "d"] );
        expect( localArray === arr ).toBe( false );
        expect( Object.isFrozen( localArray ) ).toBe( true );

        expect( shadowedArray ).toEqual( ["a", "b", "c", "d", "z"] );
        expect( doubledArray ).toEqual( ["a", "b", "c", "d", "w", "x", "y"] );
        expect( doubledArray === arr ).toBe( false );

        expect( localObject ).toEqual( { a: 1, b: 2, letters: arr } );
        expect( localObject === obj ).toBe( false );
        expect( Object.isFrozen( localObject ) ).toBe( true );
        expect( Object.isFrozen( localObject.letters ) ).toBe( true );

        expect( shadowedObject ).toEqual( { a: -1, b: -2, d: -4, letters: arr } );
        expect( shadowedObject === obj ).toBe( true );

        expect( objectDouble ).toEqual( { a: 100, b: 200, d: 300, letters: arr } );
        expect( objectDouble === obj ).toBe( false );

        expect( objectDouble.letters ).toEqual( arr );

        // restore test data
        arr = ["a", "b", "c", "d"];
        obj = { a: 1, b: 2, letters: arr };
        //
    } );

} );

describe( "ignore", () =>
{
    function f()
    {
        throw new Error( "" );
    }

    test( "ignore just consumes an error without further action", () =>
    {
        try
        {
            f();
        }
        catch( ex )
        {
            constants.ignore( ex );
        }

        expect( true ).toBe( true );
    } );

} );

describe( "isReadOnly", () =>
{
    const isReadOnly = constants.isReadOnly;

    test( "isReadOnly returns true for frozen or sealed objects", () =>
    {
        let obj = { a: 1, b: 2, letters: ["A", "B", "C"] };

        let frozen = Object.freeze( { ...obj } );

        let sealed = Object.seal( { ...obj } );

        expect( isReadOnly( obj ) ).toEqual( false );

        expect( isReadOnly( frozen ) ).toEqual( true );

        expect( isReadOnly( sealed ) ).toEqual( true );
    } );

    test( "isReadOnly returns true for any of the built-in immutable types or null", () =>
    {
        let obj = null;

        let num = 5;
        let bool = false;
        let symbol = Symbol.for( "TEST" );
        let f = function() {};
        let s = "some string";

        expect( isReadOnly( obj ) ).toEqual( true );
        expect( isReadOnly( num ) ).toEqual( true );
        expect( isReadOnly( bool ) ).toEqual( true );
        expect( isReadOnly( symbol ) ).toEqual( true );
        expect( isReadOnly( f ) ).toEqual( true );
        expect( isReadOnly( s ) ).toEqual( true );
    } );
} );

describe( "deepFreeze", () =>
{
    let arr = ["a", "b", "c", "d"];
    let obj = { a: 1, b: 2, letters: arr };

    function f( pObject, ...pArgs )
    {
        let localArray = constants.deepFreeze( pArgs );
        try
        {
            localArray.push( "f", "g", "h" );
        }
        catch( ex )
        {
            // localArray should be immutable, so we expect this
        }

        let doubledArray = [...pArgs];
        doubledArray.push( "w", "x", "y" );

        let shadowedArray = pArgs;
        shadowedArray.push( "z" );

        let localObject = constants.deepFreeze( pObject );

        try
        {
            localObject.a = 11;
            localObject.c = 42;
        }
        catch( ex )
        {
            // localObject should be immutable, so we expect this
        }

        try
        {
            localObject.letters.push( "ZZ" );
        }
        catch( ex )
        {
            // localObject should be immutable, so we expect this
        }

        let shadowedObject = pObject;
        shadowedObject.a = -1;
        shadowedObject.b = -2;
        shadowedObject.d = -4;

        let objectDouble = { ...pObject };
        objectDouble.a = 100;
        objectDouble.b = 200;
        objectDouble.d = 300;

        return { localArray, shadowedArray, doubledArray, localObject, shadowedObject, objectDouble };
    }

    test( "deepFreeze makes a new read-only value that is not a reference to the source", () =>
    {
        // restore test data
        arr = ["a", "b", "c", "d"];
        obj = { a: 1, b: 2, letters: arr };
        //

        const alias = arr;

        const copy = constants.deepFreeze( arr );

        expect( copy ).toEqual( arr );
        expect( Object.isFrozen( copy ) ).toBe( true );

        expect( copy === arr ).toBe( false );
        expect( alias === arr ).toBe( true );

        let { localArray, shadowedArray, doubledArray, localObject, shadowedObject, objectDouble }
            = f( obj, ...arr );

        expect( arr ).toEqual( ["a", "b", "c", "d"] );

        expect( localArray ).toEqual( ["a", "b", "c", "d"] );
        expect( localArray === arr ).toBe( false );
        expect( Object.isFrozen( localArray ) ).toBe( true );

        expect( shadowedArray ).toEqual( ["a", "b", "c", "d", "z"] );
        expect( doubledArray ).toEqual( ["a", "b", "c", "d", "w", "x", "y"] );
        expect( doubledArray === arr ).toBe( false );

        expect( localObject ).toEqual( { a: 1, b: 2, letters: arr } );
        expect( localObject === obj ).toBe( false );
        expect( Object.isFrozen( localObject ) ).toBe( true );
        expect( Object.isFrozen( localObject.letters ) ).toBe( true );

        expect( shadowedObject ).toEqual( { a: -1, b: -2, d: -4, letters: arr } );
        expect( shadowedObject === obj ).toBe( true );

        expect( objectDouble ).toEqual( { a: 100, b: 200, d: 300, letters: arr } );
        expect( objectDouble === obj ).toBe( false );

        expect( objectDouble.letters ).toEqual( arr );

        // restore test data
        arr = ["a", "b", "c", "d"];
        obj = { a: 1, b: 2, letters: arr };
        //
    } );

} );

describe( "calculateNumberFormattingSymbols", () =>
{
    test( "Returns comma for grouping, dot for decimal, and $ for currency for en-US", () =>
    {
        const calculateNumberFormattingSymbols = constants.calculateNumberFormattingSymbols;

        const symbols = calculateNumberFormattingSymbols( "en-US" );

        expect( symbols.grouping_separator ).toEqual( constants._comma );
        expect( symbols.decimal_point ).toEqual( constants._dot );
        expect( symbols.currency_symbol ).toEqual( "$" );
    } );

    test( "Returns dot for grouping, comma for decimal, and € for currency for de, UER", () =>
    {
        const calculateNumberFormattingSymbols = constants.calculateNumberFormattingSymbols;

        const symbols = calculateNumberFormattingSymbols( "de", "EUR" );

        expect( symbols.grouping_separator ).toEqual( constants._dot );
        expect( symbols.decimal_point ).toEqual( constants._comma );
        expect( symbols.currency_symbol ).toEqual( "€" );
    } );
} );

describe( "IterationCap", () =>
{
    test( "exits a loop when reached", () =>
    {
        let count = 0;

        let IterationCap = constants.IterationCap;

        const iterationCap = new IterationCap( 5 );

        while ( !iterationCap.reached )
        {
            count += 1;
        }

        expect( count ).toEqual( 5 );
    } );
} );

describe( "ComparatorFactory", () =>
{
    let ComparatorFactory = constants.ComparatorFactory;

    test( "ComparatorFactory returns a comparator as per its options", () =>
    {
        let factory = new ComparatorFactory( constants._num );

        let arr = [3, 6, 2, 4, 1, 0, 9];

        arr = arr.sort( factory.comparator() );

        expect( arr ).toEqual( [0, 1, 2, 3, 4, 6, 9] );

        arr = arr.sort( factory.reverseComparator() );

        expect( arr ).toEqual( [9, 6, 4, 3, 2, 1, 0] );

        arr = [...arr].concat( null );

        arr = arr.sort( factory.nullsFirstComparator() );

        expect( arr ).toEqual( [null, 0, 1, 2, 3, 4, 6, 9] );

        arr = arr.sort( factory.nullsLastComparator() );

        expect( arr ).toEqual( [0, 1, 2, 3, 4, 6, 9, null] );

        arr = ["A", "B", "C", "a", "b", "c"];

        arr = arr.sort( factory.comparator() );

        expect( arr ).toEqual( ["A", "B", "C", "a", "b", "c"] );

        arr = arr.sort( factory.caseInsensitiveComparator() );

        expect( arr ).toEqual( ["A", "a", "B", "b", "C", "c"] );
    } );

    test( "ComparatorFactory handles special cases", () =>
    {
        let factory = new ComparatorFactory();

        function foo() {}

        const regExp = /\//g;

        const dateA = new Date( 2024, 10, 26, 19, 44, 0, 0 );
        const dateB = new Date( 2024, 10, 26, 19, 42, 0, 0 );

        const TEST = Symbol.for( "TEST" );
        const TEST2 = Symbol.for( "TEST2" );

        let arr =
            [
                "A",
                1,
                ["A", "B"],
                { a: 2, b: 3 },
                { a: 1, b: 2 },
                ["a", "b"],
                null,
                false,
                true,
                TEST,
                TEST2,
                foo,
                10n,
                regExp,
                dateA,
                dateB
            ];

        arr = arr.sort( factory.comparator() );

        expect( arr ).toEqual( [
                                   null,
                                   false,
                                   "A",
                                   1,
                                   TEST,
                                   TEST2,
                                   {
                                       "a": 1,
                                       "b": 2
                                   },
                                   {
                                       "a": 2,
                                       "b": 3
                                   },
                                   [
                                       "A",
                                       "B"
                                   ],
                                   [
                                       "a",
                                       "b"
                                   ],
                                   true,
                                   foo,
                                   10n,
                                   regExp,
                                   dateB,
                                   dateA
                               ] );

        arr = arr.sort( factory.reverseComparator() );

        expect( arr ).toEqual( [
                                   null,
                                   [
                                       "a",
                                       "b",
                                   ],
                                   [
                                       "A",
                                       "B",
                                   ],
                                   {
                                       "a": 1,
                                       "b": 2,
                                   },
                                   {
                                       "a": 2,
                                       "b": 3,
                                   },
                                   true,
                                   false,
                                   TEST2,
                                   TEST,
                                   "A",
                                   1,
                                   foo,
                                   10n,
                                   regExp,
                                   dateA,
                                   dateB
                               ] );


        /*
         arr = arr.sort( factory.reverseComparator() );

         expect( arr ).toEqual( [9, 6, 4, 3, 2, 1, 0] );

         arr = [...arr].concat( null );

         arr = arr.sort( factory.nullsFirstComparator() );

         expect( arr ).toEqual( [null, 0, 1, 2, 3, 4, 6, 9] );

         arr = arr.sort( factory.nullsLastComparator() );

         expect( arr ).toEqual( [0, 1, 2, 3, 4, 6, 9, null] );

         arr = ["A", "B", "C", "a", "b", "c"];

         arr = arr.sort( factory.comparator() );

         expect( arr ).toEqual( ["A", "B", "C", "a", "b", "c"] );

         arr = arr.sort( factory.caseInsensitiveComparator() );

         expect( arr ).toEqual( ["A", "a", "B", "b", "C", "c"] );
         */
    } );

    test( "ComparatorFactory sorts RegExp as strings", () =>
    {
        let factory = new ComparatorFactory( RegExp );

        const regExp = /\//g;
        const regExp2 = /\s*/g;
        const regExp3 = /[\r\n]/g;
        const regExp4 = /.+/g;
        const regExp5 = /\d+/g;
        const regExp6 = /\w+/g;

        let arr = [regExp, regExp2, regExp3, regExp4, regExp5, regExp6];

        let arr2 = arr.map( e => e.toString() );

        expect( arr.sort( factory.comparator() ) ).toEqual( [regExp4, regExp3, regExp, regExp5, regExp2, regExp6] );

        factory = new ComparatorFactory( "string" );

        expect( arr2.sort( factory.comparator() ) ).toEqual( arr.map( e => e.toString() ) );
    } );

    test( "ComparatorFactory can be configured to coerce values to a specific type", () =>
    {
        let factory = new ComparatorFactory( "number" );

        const input = Object.freeze( ["10", "1", "20", "21", "3", "30", "31", "4", "40", 400, 12, 11, 9, "8", "81"] );

        let arr = [...input];

        // without coercion, the values are sorted in alphabetical order
        expect( arr.sort( factory.comparator() ) ).toEqual( ["10",
                                                             "1",
                                                             "20",
                                                             "21",
                                                             "3",
                                                             "30",
                                                             "31",
                                                             "4",
                                                             "40",
                                                             9,
                                                             11,
                                                             12,
                                                             400,
                                                             "8",
                                                             "81"] );

        // set coerce to true to force elements to be compared as numbers
        factory.coerce = true;

        arr = [...input];

        // with coercion, the values are ordered numerically
        expect( arr.sort( factory.comparator() ) ).toEqual( ["1",
                                                             "3",
                                                             "4",
                                                             "8",
                                                             9,
                                                             "10",
                                                             11,
                                                             12,
                                                             "20",
                                                             "21",
                                                             "30",
                                                             "31",
                                                             "40",
                                                             "81",
                                                             400] );

    } );
} );

describe( "Errors", () =>
{
    const IllegalArgumentError = constants.classes.IllegalArgumentError;

    const loggedMessages = [];

    const mockLogger =
        {
            warn: function( ...pArgs )
            {
                loggedMessages.push( ...pArgs );
            }
        };

    function add( pA, pB )
    {
        if ( "number" !== typeof pA || "number" !== typeof pB )
        {
            throw new IllegalArgumentError( "Both arguments to add must be numbers", { "a": pA, "b": pB } );
        }

        return pA + pB;
    }

    function catcher( pA, pB )
    {
        let value = 0;

        try
        {
            value = add( pA, pB );
        }
        catch( ex )
        {
            if ( ex instanceof IllegalArgumentError )
            {
                ex.logTo( mockLogger, "warn" );
            }

            // console.log( ex.message, ex );
        }

        return value;
    }

    function stackTracer( pA, pB )
    {
        let value = 0;

        let stackTrace = null;

        let methodName = "";
        let fileName = "";
        let lineNumber = 0;
        let columnNumber = 0;

        try
        {
            value = add( pA, pB );
        }
        catch( ex )
        {
            stackTrace = ex.stackTrace;

            methodName = ex.methodName;
            fileName = ex.fileName;
            lineNumber = ex.lineNumber;
            columnNumber = ex.columnNumber;

            return { stackTrace, methodName, fileName, lineNumber, columnNumber };
        }

        return value;
    }

    test( "Throwing an IllegalArgumentError", () =>
    {
        expect( () =>
                {
                    return add( "A", "B" );
                } ).toThrow( IllegalArgumentError );

        expect( add( 1, 2 ) ).toEqual( 3 );

        expect( catcher( 1, 2 ) ).toEqual( 3 );

        expect( catcher( "A", "B" ) ).toEqual( 0 );

        expect( loggedMessages ).toEqual( [
                                              "IllegalArgumentError: Both arguments to add must be numbers",
                                              { "a": "A", "b": "B", }
                                          ] );


    } );

    test( "Getting a stack trace", () =>
    {
        const trace = stackTracer( "A", "B" );

        expect( typeof trace.stackTrace ).toBe( "object" );

    } );

} );

describe( "ModulePrototype - Events", () =>
{
    const loggedMessages = [];

    const mock = function( ...pArgs )
    {
        loggedMessages.push( ...pArgs );
    };

    const mockLogger =
        {
            log: mock,
            info: mock,
            error: mock,
            debug: mock,
            warn: mock
        };

    test( "Consumers can react to events emitted from modules", () =>
    {
        const mod = constants;

        expect( Object.isFrozen( mod ) ).toBe( true );

        const ModEvent = CustomEvent || constants.ModuleEvent;

        mod.addEventListener( "TEST", function( pEvt )
        {
            expect( pEvt.detail ).toEqual( { a: 1, b: 2 } );
        } );

        mod.dispatchEvent( new ModEvent( "TEST", { a: 1, b: 2 } ) );
    } );

    test( "Consumers can assign a logger to any module", () =>
    {
        const mod = constants;

        mod.logger = mockLogger;

        expect( mod.logger ).toEqual( mockLogger );

        loggedMessages.length = 0;

        mod.__testLogger( "some", "logged", "data", { foo: "bar" } );

        expect( loggedMessages.length ).toEqual( 4 );
        expect( loggedMessages ).toEqual( ["some", "logged", "data", { foo: "bar" }] );
    } );

} );

describe( "ExecutionEnvironment", () =>
{
    const { getExecutionEnvironment } = constants;

    test( "ExecutionEnvironment provides information about the context in which the code is running ", () =>
    {
        const executionEnvironment = new ExecutionEnvironment();

        expect( executionEnvironment.isNode() ).toBe( true );

        expect( executionEnvironment.isWindows() ).toBe( true );

        const userAgentInfo = executionEnvironment.parseUserAgent( "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36");

        console.log( userAgentInfo );

    } );

} );
