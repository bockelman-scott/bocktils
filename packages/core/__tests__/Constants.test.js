// no need to require jest here... run this test from the console using 'npx jest'
// let jester = require( "jest" );
// jester.run( __filename );

const moduleUtils = require( "../src/_ToolBocksModule.cjs" );

/** import the Constants.cjs we are testing */
const constants = require( "../src/Constants.cjs" );

const { _affirmatives } = constants;

const {
    ExecutionEnvironment,
    getExecutionEnvironment,
    IllegalArgumentError,
    IterationCap,
    resolveOptions,
    populateOptions,
    isReadOnly,
    localCopy,
    immutableCopy,
    deepFreeze,
    resolveEvent,
    sleep
} = moduleUtils;

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
        const merged = populateOptions( options, defaults );

        expect( merged ).toEqual(
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
        expect( populateOptions( null ) ).toEqual( {} );
    } );

    test( "populateOptions can handle null", () =>
    {
        expect( populateOptions( null, defaults ) ).toEqual( defaults );
    } );

    test( "populateOptions can handle unexpected arguments", () =>
    {
        expect( populateOptions( [1, 2, 3], [4, 5, 6] ) ).toEqual( { "0": 1, "1": 2, "2": 3 } );
    } );

    test( "populateOptions can handle unexpected defaults", () =>
    {
        expect( populateOptions( [4, 5, 6], { "0": 1, "1": 2, "2": 3 } ) ).toEqual( {
                                                                                        "0": 4,
                                                                                        "1": 5,
                                                                                        "2": 6
                                                                                    } );
    } );

    test( "populateOptions can handle a series of deeply nested objects", () =>
    {
        const date = new Date();

        const defaultsA =
            {
                a: { a: { a: { a: "1" } } },
                b: { b: { b: { b: { b: 2 } } } },
                c: 3,
                d: { d: { d: { d: [0, 1, 2] } } },
                e: { e: { e: { e: { e: { e: { e: { e: date } } } } } } },
                f: "friendly",
                g: "ghost"
            };

        const defaultsB =
            {
                a: { a: { a: "1" } },
                b: { b: { b: { b: { b: 7 } } } },
                c: 30,
                d: { d: { d: { d: [3, 4, 5, 6] } } },
                e: { e: { e: { e: { e: { e: { e: { e: date } } } } } } },
                f: "scary",
                g: "monster"
            };

        const options =
            {
                name: "Scott",
                age: 37,
                b: { b: { b: { b: { b: 75, bb: 57 } } } },
                c: { c: 33 },
                d: { d: { d: { d: [7, 8, 9, 0] } } },
                e: { ...defaultsA },
                f: "performance",
                g: "nightmare"
            };

        let startTime = Date.now();

        const opts = populateOptions( options, defaultsA, defaultsB );

        let endTime = Date.now();

        console.log( JSON.stringify( opts ) );

        console.log( "\n\n\n", "Time required:", (endTime - startTime), "milliseconds\n\n" );

    } );

} );


describe( "resolveOptions", () =>
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

    test( "resolveOptions overwrites defaults", () =>
    {
        expect( resolveOptions( options, defaults ) ).toEqual(
            {
                a: 10,
                b: 2,
                c: 3,
                d: false,
                e: 23
            } );
    } );

    test( "resolveOptions always returns an object", () =>
    {
        expect( resolveOptions( null ) ).toEqual( {} );
    } );

    test( "resolveOptions can handle null", () =>
    {
        expect( resolveOptions( null, defaults ) ).toEqual( defaults );
    } );

    test( "resolveOptions can handle unexpected arguments", () =>
    {
        expect( resolveOptions( [1, 2, 3], [4, 5, 6] ) ).toEqual( { "0": 1, "1": 2, "2": 3 } );
    } );

    test( "resolveOptions can handle unexpected defaults", () =>
    {
        expect( resolveOptions( [4, 5, 6], { "0": 1, "1": 2, "2": 3 } ) ).toEqual( {
                                                                                       "0": 4,
                                                                                       "1": 5,
                                                                                       "2": 6
                                                                                   } );
    } );

    test( "resolveOptions can handle a series of deeply nested objects", () =>
    {
        const date = new Date();

        const defaultsA =
            {
                a: { a: { a: { a: "1" } } },
                b: { b: { b: { b: { b: 2 } } } },
                c: 3,
                d: { d: { d: { d: [0, 1, 2] } } },
                e: { e: { e: { e: { e: { e: { e: { e: date } } } } } } },
                f: "friendly",
                g: "ghost"
            };

        const defaultsB =
            {
                a: { a: { a: "1" } },
                b: { b: { b: { b: { b: 7 } } } },
                c: 30,
                d: { d: { d: { d: [3, 4, 5, 6] } } },
                e: { e: { e: { e: { e: { e: { e: { e: date } } } } } } },
                f: "scary",
                g: "monster"
            };

        const options =
            {
                name: "Scott",
                age: 37,
                b: { b: { b: { b: { b: 75, bb: 57 } } } },
                c: { c: 33 },
                d: { d: { d: { d: [7, 8, 9, 0] } } },
                e: { ...defaultsA },
                f: "performance",
                g: "nightmare"
            };

        let startTime = Date.now();

        const opts = resolveOptions( options, defaultsA, defaultsB );

        let endTime = Date.now();

        console.log( JSON.stringify( opts ) );

        console.log( "\n\n\n", "Time required:", (endTime - startTime), "milliseconds\n\n" );

    } );

} );


describe( "localCopy", () =>
{
    let arr = ["a", "b", "c", "d"];
    let obj = { a: 1, b: 2, letters: arr };

    function f( pObject, ...pArgs )
    {
        let localArray = localCopy( pArgs );
        localArray.push( "f", "g", "h" );

        let doubledArray = [...pArgs];
        doubledArray.push( "w", "x", "y" );

        let shadowedArray = pArgs;
        shadowedArray.push( "z" );

        let localObject = localCopy( pObject );
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
        const localObject = localCopy( pObject );

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

        const copy = localCopy( arr );

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
        let localArray = immutableCopy( pArgs );
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

        let localObject = immutableCopy( pObject );

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

        const copy = immutableCopy( arr );

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
        let localArray = deepFreeze( pArgs );
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

        let localObject = deepFreeze( pObject );

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

        const copy = deepFreeze( arr );

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

        const iterationCap = new IterationCap( 5 );

        while ( !iterationCap.reached )
        {
            count += 1;
        }

        expect( count ).toEqual( 5 );
    } );
} );

describe( "Errors", () =>
{
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

        expect( loggedMessages.slice( 0, 2 ) ).toEqual( [
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


/*
 describe( "ToolBocksModule - Events", () =>
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

 test( "Consumers can react to events emitted from modules", async () =>
 {
 const mod = constants;

 expect( Object.isFrozen( mod ) ).toBe( true );

 const ModEvent = CustomEvent || constants.ModuleEvent;

 mod.addEventListener( "TEST", function( pEvt )
 {
 expect( resolveEvent( pEvt ).detail ).toEqual( { a: 1, b: 2 } );
 } );

 mod.dispatchEvent( resolveEvent( new ModEvent( "TEST", { a: 1, b: 2 } ) ) );

 await sleep( 1000 );

 await sleep( 1000 );
 } );

 } );
 */

describe( "ExecutionEnvironment", () =>
{
    test( "ExecutionEnvironment provides information about the context in which the code is running ", () =>
    {
        let executionEnvironment = new ExecutionEnvironment();

        expect( executionEnvironment.isNode() ).toBe( true );

        expect( executionEnvironment.isWindows() ).toBe( true );

        const userAgentInfo = executionEnvironment.parseUserAgent( "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36" );

        expect( userAgentInfo.browser.name ).toEqual( "Chrome" );
        expect( userAgentInfo.browser.version ).toEqual( "131.0.0.0" );
        expect( userAgentInfo.engine.name ).toEqual( "AppleWebKit" );
        expect( userAgentInfo.engine.version ).toEqual( "537.36" );
        expect( userAgentInfo.os.name ).toEqual( "Windows NT" );
        expect( userAgentInfo.os.version ).toEqual( "10.0" );
        expect( userAgentInfo.cpu.architectures[0] ).toEqual( "Win64" );
        expect( userAgentInfo.cpu.architectures[1] ).toEqual( "x64" );

        executionEnvironment = getExecutionEnvironment();

        expect( executionEnvironment.isNode() ).toBe( true );

        expect( executionEnvironment.isWindows() ).toBe( true );

    } );

} );
