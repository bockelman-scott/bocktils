const core = require( "@toolbocks/core" );

/**
 * Establish separate constants for each of the common utilities imported
 * @see ../src/CoreUtils.cjs
 */
const { moduleUtils } = core;

const
    {
        Xor,
        Nand,
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
        getMessagesLocaleString,
        isFulfilled,
        isRejected,
        roundToNearestMultiple,
        calculatePercentComplete,
        calculateElapsedTime,
        calculateEstimatedTimeRemaining,
        formatElapsedTime,
        serialize,
        classes: moduleUtilsClasses,
    } = moduleUtils;

let {
    isStr,
    isFunc,
    isObj,
    isArray,
    isDate,
    isRegExp,
    isNum,
    isBig,
    isBool,
    isSymbol,
    isNull,
    isUndefined,
    isPrimitive,
    isThenable,
    isPromise,
    isError,
    isAsyncFunction,
    isMap,
    isSet,
    isObjectLiteral,
    isClass,
    isClassInstance,
    isGlobalType,
    isLogger,
    isVisitor,
} = TYPES_CHECKS;

class TestClass
{
    #args;

    constructor( ...pArgs )
    {
        this.#args = [...pArgs];
    }

    get args()
    {
        return [...this.#args];
    }

    get map()
    {
        return new Map();
    }
}

async function foo()
{
    return "abc";
}

const thenable =
    {
        then: function( resolve, reject )
        {
            resolve( "abc" );
        }
    };

const map = new Map();
map.set( "a", 1 );
map.set( "b", 2 );
map.set( "c", 3 );

const aSet = new Set( map.values() );

class TestLogger
{
    #loggedMessages = [];

    constructor()
    {
    }

    log( ...pMessage )
    {
        const method = "log";
        this.#loggedMessages.push( "[" + method.toUpperCase() + "]: " + (pMessage.join( " " )) );
    }

    error( ...pMessage )
    {
        const method = "error";
        this.#loggedMessages.push( "[" + method.toUpperCase() + "]: " + (pMessage.join( " " )) );
    }

    warn( ...pMessage )
    {
        const method = "warn";
        this.#loggedMessages.push( "[" + method.toUpperCase() + "]: " + (pMessage.join( " " )) );
    }

    info( ...pMessage )
    {
        const method = "info";
        this.#loggedMessages.push( "[" + method.toUpperCase() + "]: " + (pMessage.join( " " )) );
    }

    debug( ...pMessage )
    {
        const method = "debug";
        this.#loggedMessages.push( "[" + method.toUpperCase() + "]: " + (pMessage.join( " " )) );
    }

    trace( ...pMessage )
    {
        const method = "trace";
        this.#loggedMessages.push( "[" + method.toUpperCase() + "]: " + (pMessage.join( " " )) );
    }

    get messages()
    {
        return this.#loggedMessages;
    }

    filteredMessages( pFilter )
    {
        return this.#loggedMessages.filter( pFilter );
    }
}

ToolBocksModule.setGlobalLogger( new TestLogger() );

describe( "Sanity-check", () =>
{
    test( "Exported classes, variables, and functions are defined", () =>
    {
        expect( moduleUtils ).toBeDefined();

        expect( Xor ).toBeDefined();
        expect( typeof Xor ).toBe( "function" );

        expect( Nand ).toBeDefined();
        expect( typeof Nand ).toBe( "function" );

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

        expect( getMessagesLocaleString ).toBeDefined();
        expect( typeof getMessagesLocaleString ).toBe( "function" );

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

describe( "Extended Boolean Operators", () =>
{
    test( "Xor (exclusive OR) returns true if and only if exactly one value is true", () =>
    {
        expect( Xor( true, false ) ).toBe( true );
        expect( Xor( false, true ) ).toBe( true );
        expect( Xor( true, true ) ).toBe( false );
        expect( Xor( false, false ) ).toBe( false );

        expect( Xor( 1, 0 ) ).toBe( true );
        expect( Xor( 0, 1 ) ).toBe( true );
        expect( Xor( 1, 1 ) ).toBe( false );
        expect( Xor( 0, 0 ) ).toBe( false );

        function foo()
        {
            return 1 < 0;
        }

        function bar()
        {
            return 1 > 0;
        }

        expect( Xor( foo(), bar() ) ).toBe( true );

    } );

    test( "Nand (NOT AND) returns true if !( a && b && c && ... n )", () =>
    {
        expect( Nand( true, false ) ).toBe( !(true && false) );
        expect( Nand( false, true ) ).toBe( !(true && false) );
        expect( Nand( true, true ) ).toBe( !(true && true) );
        expect( Nand( false, false ) ).toBe( !(false && false) );

        expect( Nand( 1, 0 ) ).toBe( true );
        expect( Nand( 0, 1 ) ).toBe( true );
        expect( Nand( 1, 1 ) ).toBe( false );
        expect( Nand( 0, 0 ) ).toBe( true );

        function foo()
        {
            return 1 < 0;
        }

        function bar()
        {
            return 1 > 0;
        }

        function baz( b )
        {
            return b;
        }

        expect( Nand( foo(), bar() ) ).toBe( true );
        expect( Nand( foo(), bar(), baz( true ) ) ).toBe( true );
        expect( Nand( foo(), bar(), baz( false ) ) ).toBe( true );
        expect( Nand( bar(), baz( true ), baz( true ) ) ).toBe( false );

    } );
} );

// NOTE: these are basic checks; use TypeUtils for more useful type checks
describe( "TYPES_CHECK functionality", () =>
{
    test( "isNum", () =>
    {
        expect( isNum( "abc" ) ).toBe( false );
        expect( isNum( 321 ) ).toBe( true );
        expect( isNum( 321n ) ).toBe( true );
        expect( isNum( 1 / 0 ) ).toBe( false );
        expect( isNum( Infinity ) ).toBe( false );
        expect( isNum( 2 ** 1024 ) ).toBe( false );
        expect( isNum( 2 ** 128 ) ).toBe( true );
        expect( isNum( ["a", "b", "c"] ) ).toBe( false );
        expect( isNum( ["a", "b", "c"].length ) ).toBe( true );
        expect( isNum( { a: 1 } ) ).toBe( false );
        expect( isNum( null ) ).toBe( false );
        expect( isNum( undefined ) ).toBe( false );
        expect( isNum( true ) ).toBe( false );
        expect( isNum( false ) ).toBe( false );
        expect( isNum( Symbol( "abc" ) ) ).toBe( false );
        expect( isNum( new Date() ) ).toBe( false );
        expect( isNum( new Date().getTime() ) ).toBe( true );
        expect( isNum( +(new Date()) ) ).toBe( true ); // coerced
    } );

    test( "isBig", () =>
    {
        expect( isBig( "abc" ) ).toBe( false );
        expect( isBig( 321 ) ).toBe( false );
        expect( isBig( 321n ) ).toBe( true );
        expect( isBig( ["a", "b", "c"] ) ).toBe( false );
        expect( isBig( ["a", "b", "c"].length ) ).toBe( false );
        expect( isBig( { a: 1 } ) ).toBe( false );
        expect( isBig( null ) ).toBe( false );
        expect( isBig( undefined ) ).toBe( false );
        expect( isBig( true ) ).toBe( false );
        expect( isBig( false ) ).toBe( false );
        expect( isBig( Symbol( "abc" ) ) ).toBe( false );
        expect( isBig( new Date() ) ).toBe( false );
        expect( isBig( new Date().getTime() ) ).toBe( false );
        expect( isBig( +(new Date()) ) ).toBe( false ); // coerced
        expect( isBig( 2 ** 128 ) ).toBe( false );
    } );

    test( "isStr", () =>
    {
        expect( isStr( "abc" ) ).toBe( true );
        expect( isStr( 321 ) ).toBe( false );
        expect( isStr( ["a", "b", "c"] ) ).toBe( false );
        expect( isStr( { a: 1 } ) ).toBe( false );
        expect( isStr( null ) ).toBe( false );
        expect( isStr( undefined ) ).toBe( false );
        expect( isStr( true ) ).toBe( false );
        expect( isStr( false ) ).toBe( false );
        expect( isStr( Symbol( "abc" ) ) ).toBe( false );
        expect( isStr( String( 321 ) ) ).toBe( true );
    } );

    test( "isFunc", () =>
    {
        expect( isFunc( "abc" ) ).toBe( false );
        expect( isFunc( 321 ) ).toBe( false );
        expect( isFunc( ["a", "b", "c"] ) ).toBe( false );
        expect( isFunc( { a: 1 } ) ).toBe( false );
        expect( isFunc( null ) ).toBe( false );
        expect( isFunc( undefined ) ).toBe( false );
        expect( isFunc( true ) ).toBe( false );
        expect( isFunc( false ) ).toBe( false );
        expect( isFunc( Symbol( "abc" ) ) ).toBe( false );
        expect( isFunc( [].push ) ).toBe( true );
        expect( isFunc( () => true ) ).toBe( true );
        expect( isFunc( function() {} ) ).toBe( true );
        expect( isFunc( TestClass ) ).toBe( true );
        expect( isFunc( TestClass?.constructor ) ).toBe( true );
        expect( isFunc( new TestClass() ) ).toBe( false );
        expect( isFunc( new TestClass().args ) ).toBe( false );
        expect( isFunc( Object ) ).toBe( true );
    } );

    test( "isObj", () =>
    {
        expect( isObj( "abc" ) ).toBe( false );
        expect( isObj( 321 ) ).toBe( false );
        expect( isObj( ["a", "b", "c"] ) ).toBe( true );
        expect( isObj( { a: 1 } ) ).toBe( true );
        expect( isObj( null ) ).toBe( true );
        expect( isObj( undefined ) ).toBe( false );
        expect( isObj( true ) ).toBe( false );
        expect( isObj( false ) ).toBe( false );
        expect( isObj( Symbol( "abc" ) ) ).toBe( false );
        expect( isObj( [].push ) ).toBe( false );
        expect( isObj( () => true ) ).toBe( false );
        expect( isObj( function() {} ) ).toBe( false );
        expect( isObj( TestClass ) ).toBe( false );
        expect( isObj( TestClass?.constructor ) ).toBe( false );
        expect( isObj( new TestClass() ) ).toBe( true );
        expect( isObj( new TestClass().args ) ).toBe( true );
        expect( isObj( Object ) ).toBe( false );
    } );

    test( "isArray", () =>
    {
        expect( isArray( "abc" ) ).toBe( false );
        expect( isArray( 321 ) ).toBe( false );
        expect( isArray( ["a", "b", "c"] ) ).toBe( true );
        expect( isArray( [] ) ).toBe( true );
        expect( isArray( Object.entries( {} ) ) ).toBe( true );

        expect( isArray( new Map().keys() ) ).toBe( false ); // it's an iterator;
        expect( isArray( new Set().values() ) ).toBe( false ); // it's an iterator

        expect( isArray( [...(new Map().keys())] ) ).toBe( true );
        expect( isArray( [...(new Set( ["a", "b", "c"] ))] ) ).toBe( true );

        expect( isArray( { a: 1 } ) ).toBe( false );
        expect( isArray( null ) ).toBe( false );
        expect( isArray( undefined ) ).toBe( false );
        expect( isArray( true ) ).toBe( false );
        expect( isArray( false ) ).toBe( false );
        expect( isArray( Symbol( "abc" ) ) ).toBe( false );
        expect( isArray( [].push ) ).toBe( false );
        expect( isArray( () => true ) ).toBe( false );
        expect( isArray( function() {} ) ).toBe( false );
        expect( isArray( TestClass ) ).toBe( false );
        expect( isArray( TestClass?.constructor ) ).toBe( false );
        expect( isArray( new TestClass() ) ).toBe( false );
        expect( isArray( new TestClass().args ) ).toBe( true );
        expect( isArray( Object ) ).toBe( false );

    } );

    test( "isDate", () =>
    {
        expect( isDate( "abc" ) ).toBe( false );
        expect( isDate( 321 ) ).toBe( false );
        expect( isDate( ["a", "b", "c"] ) ).toBe( false );
        expect( isDate( { a: 1 } ) ).toBe( false );
        expect( isDate( null ) ).toBe( false );
        expect( isDate( undefined ) ).toBe( false );
        expect( isDate( true ) ).toBe( false );
        expect( isDate( false ) ).toBe( false );
        expect( isDate( Symbol( "abc" ) ) ).toBe( false );
        expect( isDate( new Date() ) ).toBe( true );

        const error = resolveError( new Error( "TEST" ) );
        const when = error.occurred;

        expect( isDate( when ) ).toBe( true );

    } );

    test( "isRegExp", () =>
    {
        expect( isRegExp( "abc" ) ).toBe( false );
        expect( isRegExp( 321 ) ).toBe( false );
        expect( isRegExp( ["a", "b", "c"] ) ).toBe( false );
        expect( isRegExp( { a: 1 } ) ).toBe( false );
        expect( isRegExp( null ) ).toBe( false );
        expect( isRegExp( undefined ) ).toBe( false );
        expect( isRegExp( true ) ).toBe( false );
        expect( isRegExp( false ) ).toBe( false );
        expect( isRegExp( Symbol( "abc" ) ) ).toBe( false );
        expect( isRegExp( /\.?/g ) ).toBe( true );
        expect( isRegExp( new RegExp( "\.?", "g" ) ) ).toBe( true );
    } );

    test( "isBool", () =>
    {
        expect( isBool( "abc" ) ).toBe( false );
        expect( isBool( 321 ) ).toBe( false );
        expect( isBool( ["a", "b", "c"] ) ).toBe( false );
        expect( isBool( { a: 1 } ) ).toBe( false );
        expect( isBool( null ) ).toBe( false );
        expect( isBool( undefined ) ).toBe( false );
        expect( isBool( true ) ).toBe( true );
        expect( isBool( false ) ).toBe( true );
        expect( isBool( Symbol( "abc" ) ) ).toBe( false );
        expect( isBool( String( 321 ) ) ).toBe( false );
        expect( isBool( 3 > 2 ) ).toBe( true );
        expect( isBool( new Boolean( true ) ) ).toBe( false );
    } );

    test( "isSymbol", () =>
    {
        expect( isSymbol( "abc" ) ).toBe( false );
        expect( isSymbol( 321 ) ).toBe( false );
        expect( isSymbol( ["a", "b", "c"] ) ).toBe( false );
        expect( isSymbol( { a: 1 } ) ).toBe( false );
        expect( isSymbol( null ) ).toBe( false );
        expect( isSymbol( undefined ) ).toBe( false );
        expect( isSymbol( true ) ).toBe( false );
        expect( isSymbol( false ) ).toBe( false );
        expect( isSymbol( Symbol( "abc" ) ) ).toBe( true );
        expect( isSymbol( String( 321 ) ) ).toBe( false );
        expect( isSymbol( Symbol.for( "abc" ) ) ).toBe( true );
        expect( isSymbol( Symbol.asyncIterator ) ).toBe( true );
    } );

    test( "isNull", () =>
    {
        expect( isNull( "abc" ) ).toBe( false );
        expect( isNull( 321 ) ).toBe( false );
        expect( isNull( ["a", "b", "c"] ) ).toBe( false );
        expect( isNull( { a: 1 } ) ).toBe( false );
        expect( isNull( null ) ).toBe( true );
        expect( isNull( undefined ) ).toBe( true );
        expect( isNull( true ) ).toBe( false );
        expect( isNull( false ) ).toBe( false );
        expect( isNull( Symbol( "abc" ) ) ).toBe( false );
        expect( isNull( String( 321 ) ) ).toBe( false );
        expect( isNull( [].shift() ) ).toBe( true );
    } );

    test( "isUndefined", () =>
    {
        let xyz;

        expect( isUndefined( "abc" ) ).toBe( false );
        expect( isUndefined( 321 ) ).toBe( false );
        expect( isUndefined( ["a", "b", "c"][3] ) ).toBe( true );
        expect( isUndefined( { a: 1 }["b"] ) ).toBe( true );
        expect( isUndefined( null ) ).toBe( false );
        expect( isUndefined( undefined ) ).toBe( true );
        expect( isUndefined( true ) ).toBe( false );
        expect( isUndefined( false ) ).toBe( false );
        expect( isUndefined( Symbol( "abc" ) ) ).toBe( false );
        expect( isUndefined( String( 321 ) ) ).toBe( false );
        expect( isUndefined( [].shift() ) ).toBe( true );
        expect( isUndefined( xyz ) ).toBe( true );
    } );

    test( "isPrimitive", () =>
    {
        expect( isPrimitive( "abc" ) ).toBe( true );
        expect( isPrimitive( 321 ) ).toBe( true );
        expect( isPrimitive( ["a", "b", "c"] ) ).toBe( false );
        expect( isPrimitive( { a: 1 } ) ).toBe( false );
        expect( isPrimitive( null ) ).toBe( false );
        expect( isPrimitive( undefined ) ).toBe( false );
        expect( isPrimitive( true ) ).toBe( true );
        expect( isPrimitive( false ) ).toBe( true );
        expect( isPrimitive( Symbol( "abc" ) ) ).toBe( true );
        expect( isPrimitive( String( 321 ) ) ).toBe( true );
        expect( isPrimitive( 3 > 2 ) ).toBe( true );
        expect( isPrimitive( new Boolean( true ) ) ).toBe( false );
        expect( isPrimitive( TestClass ) ).toBe( false );
        expect( isPrimitive( new TestClass() ) ).toBe( false );
        expect( isPrimitive( function() {} ) ).toBe( false );
        expect( isPrimitive( [].push ) ).toBe( false );
    } );

    test( "isThenable", () =>
    {
        expect( isThenable( "abc" ) ).toBe( false );
        expect( isThenable( 321 ) ).toBe( false );
        expect( isThenable( ["a", "b", "c"] ) ).toBe( false );
        expect( isThenable( { a: 1 } ) ).toBe( false );
        expect( isThenable( null ) ).toBe( false );
        expect( isThenable( undefined ) ).toBe( false );
        expect( isThenable( true ) ).toBe( false );
        expect( isThenable( false ) ).toBe( false );
        expect( isThenable( Symbol( "abc" ) ) ).toBe( false );
        expect( isThenable( String( 321 ) ) ).toBe( false );
        expect( isThenable( foo() ) ).toBe( true );
        expect( isThenable( thenable ) ).toBe( true );
    } );

    test( "isPromise", () =>
    {
        expect( isPromise( "abc" ) ).toBe( false );
        expect( isPromise( 321 ) ).toBe( false );
        expect( isPromise( ["a", "b", "c"] ) ).toBe( false );
        expect( isPromise( { a: 1 } ) ).toBe( false );
        expect( isPromise( null ) ).toBe( false );
        expect( isPromise( undefined ) ).toBe( false );
        expect( isPromise( true ) ).toBe( false );
        expect( isPromise( false ) ).toBe( false );
        expect( isPromise( Symbol( "abc" ) ) ).toBe( false );
        expect( isPromise( String( 321 ) ) ).toBe( false );

        expect( isPromise( foo() ) ).toBe( true );
        expect( isPromise( thenable ) ).toBe( false );
    } );

    test( "isError", () =>
    {
        expect( isError( "abc" ) ).toBe( false );
        expect( isError( 321 ) ).toBe( false );
        expect( isError( ["a", "b", "c"] ) ).toBe( false );
        expect( isError( { a: 1 } ) ).toBe( false );
        expect( isError( null ) ).toBe( false );
        expect( isError( undefined ) ).toBe( false );
        expect( isError( true ) ).toBe( false );
        expect( isError( false ) ).toBe( false );
        expect( isError( Symbol( "abc" ) ) ).toBe( false );
        expect( isError( String( 321 ) ) ).toBe( false );

        expect( isError( new Error( "TEST" ) ) ).toBe( true );
        expect( isError( resolveError( new Error( "TEST" ) ) ) ).toBe( true );

        try
        {
            xyz += 1 / 0;
        }
        catch( ex )
        {
            expect( isError( ex ) ).toBe( true );
        }
    } );

    test( "isAsyncFunction", () =>
    {
        expect( isAsyncFunction( "abc" ) ).toBe( false );
        expect( isAsyncFunction( 321 ) ).toBe( false );
        expect( isAsyncFunction( ["a", "b", "c"] ) ).toBe( false );
        expect( isAsyncFunction( { a: 1 } ) ).toBe( false );
        expect( isAsyncFunction( null ) ).toBe( false );
        expect( isAsyncFunction( undefined ) ).toBe( false );
        expect( isAsyncFunction( true ) ).toBe( false );
        expect( isAsyncFunction( false ) ).toBe( false );
        expect( isAsyncFunction( Symbol( "abc" ) ) ).toBe( false );
        expect( isAsyncFunction( String( 321 ) ) ).toBe( false );

        expect( isAsyncFunction( () => true ) ).toBe( false );
        expect( isAsyncFunction( async() => true ) ).toBe( true );
        expect( isAsyncFunction( async function() {} ) ).toBe( true );

        expect( isAsyncFunction( foo ) ).toBe( true );
        expect( isAsyncFunction( function() {} ) ).toBe( false );

    } );

    test( "isMap", () =>
    {
        expect( isMap( "abc" ) ).toBe( false );
        expect( isMap( 321 ) ).toBe( false );
        expect( isMap( ["a", "b", "c"] ) ).toBe( false );
        expect( isMap( { a: 1 } ) ).toBe( false );
        expect( isMap( null ) ).toBe( false );
        expect( isMap( undefined ) ).toBe( false );
        expect( isMap( true ) ).toBe( false );
        expect( isMap( false ) ).toBe( false );
        expect( isMap( Symbol( "abc" ) ) ).toBe( false );
        expect( isMap( String( 321 ) ) ).toBe( false );

        expect( isMap( new Map() ) ).toBe( true );
        expect( isMap( Map ) ).toBe( false );

        expect( isMap( new TestClass().map ) ).toBe( true );
        expect( isMap( map ) ).toBe( true );

        expect( isMap( new Set() ) ).toBe( false );
        expect( isMap( Set ) ).toBe( false );
    } );

    test( "isSet", () =>
    {
        expect( isSet( "abc" ) ).toBe( false );
        expect( isSet( 321 ) ).toBe( false );
        expect( isSet( ["a", "b", "c"] ) ).toBe( false );
        expect( isSet( { a: 1 } ) ).toBe( false );
        expect( isSet( null ) ).toBe( false );
        expect( isSet( undefined ) ).toBe( false );
        expect( isSet( true ) ).toBe( false );
        expect( isSet( false ) ).toBe( false );
        expect( isSet( Symbol( "abc" ) ) ).toBe( false );
        expect( isSet( String( 321 ) ) ).toBe( false );

        expect( isSet( new Map() ) ).toBe( false );
        expect( isSet( Map ) ).toBe( false );

        expect( isSet( new TestClass().map ) ).toBe( false );
        expect( isSet( map ) ).toBe( false );

        expect( isSet( new Set() ) ).toBe( true );
        expect( isSet( Set ) ).toBe( false );

        expect( isSet( aSet ) ).toBe( true );
    } );

    test( "isClass", () =>
    {
        expect( isClass( "abc" ) ).toBe( false );
        expect( isClass( 321 ) ).toBe( false );
        expect( isClass( ["a", "b", "c"] ) ).toBe( false );
        expect( isClass( { a: 1 } ) ).toBe( false );
        expect( isClass( null ) ).toBe( false );
        expect( isClass( undefined ) ).toBe( false );
        expect( isClass( true ) ).toBe( false );
        expect( isClass( false ) ).toBe( false );
        expect( isClass( Symbol( "abc" ) ) ).toBe( false );
        expect( isClass( String( 321 ) ) ).toBe( false );

        expect( isClass( TestClass ) ).toBe( true );
        expect( isClass( new TestClass() ) ).toBe( false );

        expect( isClass( function() {} ) ).toBe( false );
        expect( isClass( async function() {} ) ).toBe( false );
        expect( isClass( foo ) ).toBe( false );

        expect( isClass( ToolBocksModule ) ).toBe( true );
        expect( isClass( new ToolBocksModule() ) ).toBe( false );

        expect( isClass( ModuleEvent ) ).toBe( true );
        expect( isClass( IterationCap ) ).toBe( true );
        expect( isClass( StatefulListener ) ).toBe( true );
        expect( isClass( ExecutionMode ) ).toBe( true );
        expect( isClass( ExecutionEnvironment ) ).toBe( true );
        expect( isClass( Visitor ) ).toBe( true );

    } );

    test( "isClassInstance", () =>
    {
        expect( isClassInstance( "abc" ) ).toBe( false );
        expect( isClassInstance( 321 ) ).toBe( false );
        expect( isClassInstance( ["a", "b", "c"] ) ).toBe( false );
        expect( isClassInstance( { a: 1 } ) ).toBe( false );
        expect( isClassInstance( null ) ).toBe( false );
        expect( isClassInstance( undefined ) ).toBe( false );
        expect( isClassInstance( true ) ).toBe( false );
        expect( isClassInstance( false ) ).toBe( false );
        expect( isClassInstance( Symbol( "abc" ) ) ).toBe( false );
        expect( isClassInstance( String( 321 ) ) ).toBe( false );


        expect( isClassInstance( TestClass ) ).toBe( false );
        expect( isClassInstance( new TestClass() ) ).toBe( true );

        expect( isClassInstance( function() {} ) ).toBe( false );
        expect( isClassInstance( async function() {} ) ).toBe( false );
        expect( isClassInstance( foo ) ).toBe( false );

        expect( isClassInstance( moduleUtils ) ).toBe( true );

        expect( isClassInstance( ToolBocksModule ) ).toBe( false );
        expect( isClassInstance( new ToolBocksModule() ) ).toBe( true );

        expect( isClassInstance( ModuleEvent ) ).toBe( false );
        expect( isClassInstance( IterationCap ) ).toBe( false );
        expect( isClassInstance( StatefulListener ) ).toBe( false );
        expect( isClassInstance( ExecutionMode ) ).toBe( false );
        expect( isClassInstance( ExecutionEnvironment ) ).toBe( false );
        expect( isClassInstance( Visitor ) ).toBe( false );

        expect( isClassInstance( new ModuleEvent() ) ).toBe( true );
        expect( isClassInstance( new IterationCap() ) ).toBe( true );
        expect( isClassInstance( new StatefulListener() ) ).toBe( true );
        expect( isClassInstance( getExecutionEnvironment() ) ).toBe( true );
        expect( isClassInstance( resolveVisitor() ) ).toBe( true );

    } );

    test( "isGlobalType", () =>
    {
        expect( isGlobalType( "abc" ) ).toBe( false );
        expect( isGlobalType( 321 ) ).toBe( false );
        expect( isGlobalType( ["a", "b", "c"] ) ).toBe( true ); // it's an Array
        expect( isGlobalType( { a: 1 } ) ).toBe( false );
        expect( isGlobalType( null ) ).toBe( false );
        expect( isGlobalType( undefined ) ).toBe( false );
        expect( isGlobalType( true ) ).toBe( false );
        expect( isGlobalType( false ) ).toBe( false );
        expect( isGlobalType( Symbol( "abc" ) ) ).toBe( false ); // it's a symbol primitive
        expect( isGlobalType( String( 321 ) ) ).toBe( false );

        expect( isGlobalType( new ObjectEntry( "a", 1, {} ) ) ).toBe( true ); // extends Array
        expect( isGlobalType( new IterationCap( 32 ) ) ).toBe( false );

        expect( isGlobalType( TestClass ) ).toBe( false );
        expect( isGlobalType( new TestClass() ) ).toBe( false );
        expect( isGlobalType( function() {} ) ).toBe( false );
        expect( isGlobalType( async function() {} ) ).toBe( false );
        expect( isGlobalType( foo ) ).toBe( false );

        expect( isGlobalType( new Error( "TEST" ) ) ).toBe( true );
        expect( isGlobalType( new Map() ) ).toBe( true );
        expect( isGlobalType( new Set() ) ).toBe( true );
        expect( isGlobalType( foo() ) ).toBe( true );

        expect( isGlobalType( new Boolean( false ) ) ).toBe( true );
        expect( isGlobalType( new String( "abc" ) ) ).toBe( true );
        expect( isGlobalType( new Number( 93 ) ) ).toBe( true );

    } );

    test( "isLogger", () =>
    {
        expect( isLogger( "abc" ) ).toBe( false );
        expect( isLogger( 321 ) ).toBe( false );
        expect( isLogger( ["a", "b", "c"] ) ).toBe( false );
        expect( isLogger( { a: 1 } ) ).toBe( false );
        expect( isLogger( null ) ).toBe( false );
        expect( isLogger( undefined ) ).toBe( false );
        expect( isLogger( true ) ).toBe( false );
        expect( isLogger( false ) ).toBe( false );
        expect( isLogger( Symbol( "abc" ) ) ).toBe( false );
        expect( isLogger( String( 321 ) ) ).toBe( false );

        expect( isLogger( console ) ).toBe( true );
    } );

    test( "isVisitor", () =>
    {
        expect( isVisitor( "abc" ) ).toBe( false );
        expect( isVisitor( 321 ) ).toBe( false );
        expect( isVisitor( ["a", "b", "c"] ) ).toBe( false );
        expect( isVisitor( { a: 1 } ) ).toBe( false );
        expect( isVisitor( null ) ).toBe( false );
        expect( isVisitor( undefined ) ).toBe( false );
        expect( isVisitor( true ) ).toBe( false );
        expect( isVisitor( false ) ).toBe( false );
        expect( isVisitor( Symbol( "abc" ) ) ).toBe( false );
        expect( isVisitor( String( 321 ) ) ).toBe( false );

        const visitor = new Visitor( function( pVisited ) {} );

        expect( isVisitor( visitor ) ).toBe( true );
        expect( isVisitor( resolveVisitor( visitor ) ) ).toBe( true );
        expect( isVisitor( resolveVisitor( function( pVisited ) {} ) ) ).toBe( true );
        expect( isVisitor( resolveVisitor() ) ).toBe( true );

    } );

} );

describe( "mergeOptions", () =>
{
    test( "mergeOptions", () =>
    {
        const options = { a: 1, b: 2, c: 3 };
        const options2 = { a: 10, b: 20, d: 40, e: 55 };
        const options3 = { a: 100, b: 200, d: 400 };

        let merged = mergeOptions( options, options2, options3 );

        expect( merged ).toEqual( { a: 1, b: 2, d: 400, e: 55, c: 3 } );

        merged = mergeOptions( options2, options, options3 );

        expect( merged ).toEqual( { a: 10, b: 20, c: 3, d: 40, e: 55 } );

        merged = mergeOptions( options3, options2, options );

        expect( merged ).toEqual( { a: 100, b: 200, d: 400, e: 55, c: 3 } );

    } );
} );

// ARGUMENTS
// ENV

describe( "ExecutionEnvironment", () =>
{
    test( "ExecutionEnvironment reflects correct runtime", () =>
    {
        const executionEnvironment = getExecutionEnvironment();
        console.log( executionEnvironment.toString() );
    } );
} );

describe( "Global Logging", () =>
{
    test( "getGlobalLogger and log some messages", () =>
    {
        const logger = ToolBocksModule.getGlobalLogger();

        expect( logger instanceof TestLogger ).toBe( true );

        logger.log( "A log message", "with data" );
        logger.info( "An info message", "with data" );
        logger.warn( "A warning message", "with data" );
        logger.error( "An error message", "with data" );
        logger.debug( "A debug message", "with data" );
        logger.trace( "A trace message", "with data" );

        expect( logger.filteredMessages( ( e ) => e.includes( "LOG" ) ).length ).toBe( 1 );
        expect( logger.filteredMessages( ( e ) => e.includes( "INFO" ) ).length ).toBe( 1 );
        expect( logger.filteredMessages( ( e ) => e.includes( "WARN" ) ).length ).toBe( 1 );
        expect( logger.filteredMessages( ( e ) => e.includes( "ERROR" ) ).length ).toBe( 1 );
        expect( logger.filteredMessages( ( e ) => e.includes( "DEBUG" ) ).length ).toBe( 1 );
        expect( logger.filteredMessages( ( e ) => e.includes( "TRACE" ) ).length ).toBe( 1 );

        expect( logger.filteredMessages( ( e ) => e.includes( "with data" ) ).length ).toBe( 6 );

    } );

    test( "disable globalLogging", () =>
    {
        let logger = ToolBocksModule.getGlobalLogger();

        expect( logger instanceof TestLogger ).toBe( true );

        moduleUtils.reportError( new Error( "TEST" ) );

        ToolBocksModule.disableGlobalLogger();

        logger = ToolBocksModule.getGlobalLogger();

        expect( logger instanceof TestLogger ).toBe( false );

        moduleUtils.reportError( new Error( "TEST_2" ) );

        ToolBocksModule.enableGlobalLogger();

        logger = ToolBocksModule.getGlobalLogger();

        expect( logger instanceof TestLogger ).toBe( true );

        expect( logger.filteredMessages( ( e ) => e.includes( "TEST" ) ).length ).toBe( 1 );

        expect( logger.filteredMessages( ( e ) => e.includes( "TEST_2" ) ).length ).toBe( 0 );

    } );


} );

describe( "export/require/import modules", () =>
{
    test( "exportModule returns a ToolBocksModule", () =>
    {
        let mod =
            {
                someFunction: function()
                {
                    return 1;
                }
            };

        mod = exportModule( mod );

        expect( mod instanceof ToolBocksModule ).toBe( true );
        expect( mod.someFunction() ).toBe( 1 );

        // called without arguments returns a clone of the base class
        mod = exportModule();
        expect( mod instanceof ToolBocksModule ).toBe( true );
        expect( mod.moduleName ).toEqual( "ToolBocksModule" );
    } );

    test( "requireModule asynchronously loads a module", async() =>
    {
        let mod = await requireModule( "../../base64/src/Base64Utils.cjs" );

        expect( mod instanceof ToolBocksModule ).toBe( true );
        expect( typeof mod.isValidBase64 ).toBe( "function" );

        // requireModule wraps the imported module in a ToolBocksModule
        mod = await requireModule( "node:fs" );
        expect( mod instanceof ToolBocksModule ).toBe( true );
        expect( typeof mod.existsSync ).toBe( "function" );
        expect( typeof mod.getMessagesLocaleString ).toBe( "function" );
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
        expect( result ).toBe( no_op );
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
        class ResolvableClass
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

        ResolvableClass.prototype.anotherMethod = () => "another";

        const testClass = new ResolvableClass();

        expect( typeof resolveMethod( "testMethod", testClass ) ).toBe( "function" );
        expect( resolveMethod( "testMethod", testClass ) ).toBe( testClass.testMethod );

        expect( typeof resolveMethod( "anotherMethod", testClass, ) ).toBe( "function" );
        expect( resolveMethod( "anotherMethod", testClass, ) ).toBe( testClass.anotherMethod );

        expect( typeof resolveMethod( testClass.testMethod ) ).toBe( "function" );

        expect( typeof resolveMethod( testClass.anotherMethod ) ).toBe( "function" );

        expect( typeof resolveMethod( testClass.testMethod, testClass ) ).toBe( "function" );

        expect( typeof resolveMethod( testClass.anotherMethod, testClass ) ).toBe( "function" );

        expect( resolveMethod( testClass.testMethod, testClass ).call( new ResolvableClass( "Hello" ) ) ).toEqual( "Hello" );
        expect( resolveMethod( testClass.anotherMethod, testClass ).call( new ResolvableClass( "World" ) ) ).toEqual( "another" );

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


describe( "getMessagesLocaleString", () =>
{
    test( "getMessagesLocaleString returns the current Locale", () =>
    {
        expect( getMessagesLocaleString() ).toEqual( "en-US" );
    } );
} );

describe( "Attempt/AsyncAttempt", () =>
{
    class Named
    {
        #name;

        constructor( pName )
        {
            this.#name = pName;
        }

        get name()
        {
            return this.#name;
        }

        toUpper()
        {
            return this.name.toUpperCase();
        }

        async toLower()
        {
            return this.name.toLowerCase();
        }

        append( ...pArgs )
        {
            let args = [...(pArgs || [])];

            args.forEach( arg => this.#name += " " + String( arg ) );

            return this.name;
        }

        async replace( ...pArgs )
        {
            let args = [...(pArgs || [])];

            let parts = this.name.split( " " );

            let n = Math.min( args.length, parts.length );

            for( let i = 0; i < n; i++ )
            {
                parts[i] = args[i];
            }

            this.#name = parts.join( " " );

            return this.name;
        }
    }

    function doSomething( ...pArgs )
    {
        let args = [...(pArgs || [])];

        args.forEach( e => console.log( e ) );

        return args.map( e => String( e ).toUpperCase() );
    }

    async function doItLater( ...pArgs )
    {
        let args = [...(pArgs || [])];

        args.forEach( e => console.log( e ) );

        return args.map( e => String( e ).toUpperCase() );
    }

    test( "attempt is an alternative to try/catch", () =>
    {
        let mapped = attempt( () => doSomething( "a", "b", "c", 23 ) );

        mapped.forEach( e => console.log( e ) );

        let scott = new Named( "sCott" );

        let fullName = attempt( () => scott.append( "Andrew", "Bockelman" ) );

        console.log( fullName );

        let func = scott.toUpper.bind( scott );

        console.log( attempt( func ) );

        func = scott.append.bind( scott, "can", "bind", "functions" );

        console.log( attempt( func ) );

    } );

    test( "asyncAttempt is an alternative to Promise.catch", async() =>
    {
        let mapped = await asyncAttempt( async() => await doItLater( "a", "b", "c", 23 ) );
        mapped.forEach( e => console.log( e ) );

        let scott = new Named( "sCott" );

        let func = scott.replace.bind( scott, "Dylan" );

        let name = await asyncAttempt( func );

        console.log( name );

        attempt( () => scott.append( "Christopher", "Bockelman" ) );

        console.log( scott.name );

        await asyncAttempt( func, "Scott", "Matthew" );

        console.log( scott.name );
    } );

    test( "attemptMethod is an alternative to try/catch", () =>
    {
        let scott = new Named( "sCott" );
        let debby = new Named( "Debby" );

        let SCOTT = attemptMethod( scott, scott.toUpper );

        console.log( SCOTT );

        attemptMethod( debby, debby.append, "Novak", "Cernich" );

        console.log( debby.name );

        attemptMethod( debby, debby.append, "Alberta", "Crane" );

        console.log( debby.name );

        attemptMethod( scott, debby.append, "Bockelman" );

        console.log( scott.name );

        attemptMethod( debby, debby.append, "Esquire" );

        console.log( debby.name );
        console.log( scott.name );

    } );

    test( "asyncAttemptMethod is an alternative to Promise.catch", async() =>
    {
        let scott = new Named( "sCott" );
        let debby = new Named( "Debby" );

        await asyncAttemptMethod( scott, scott.replace, "Scott" );
        expect( scott.name ).toEqual( "Scott" );

        await asyncAttemptMethod( scott, async() => await scott.replace( "Dylan" ) );
        expect( scott.name ).toEqual( "Dylan" );

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

        class NonLiteralClass
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

        expect( isObjectLiteral( new NonLiteralClass( "test" ) ) ).toBe( false );
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
              class SecureClass
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

              const testClass = new SecureClass();

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
              expect( entries[4]?.value ).toEqual( "SecureClass" );

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

describe( "roundToNearestMultiple", () =>
{
    test( "Round to nearest integer",
          () =>
          {
              const nearestInteger = roundToNearestMultiple( 123.456, 1 );

              expect( nearestInteger ).toEqual( 123 );
          } );

    test( "Round to nearest 0.5",
          () =>
          {
              const nearestInteger = roundToNearestMultiple( 123.456, 0.5 );

              expect( nearestInteger ).toEqual( 123.5 );
          } );

    test( "Round to nearest multiple of 5",
          () =>
          {
              const nearestInteger = roundToNearestMultiple( 123.456, 5 );

              expect( nearestInteger ).toEqual( 125 );
          } );

    test( "Round to nearest multiple of 4",
          () =>
          {
              const nearestInteger = roundToNearestMultiple( 123.456, 4 );

              expect( nearestInteger ).toEqual( 124 );
          } );

    test( "Round to nearest multiple of 8",
          () =>
          {
              const nearestInteger = roundToNearestMultiple( 123.456, 8 );

              expect( nearestInteger ).toEqual( 120 );
          } );

    test( "Round to nearest multiple of 16",
          () =>
          {
              const nearestInteger = roundToNearestMultiple( 123.456, 16 );

              expect( nearestInteger ).toEqual( 128 );
          } );

    test( "Round to nearest multiple of 32",
          () =>
          {
              const nearestInteger = roundToNearestMultiple( 123.456, 32 );

              expect( nearestInteger ).toEqual( 128 );
          } );
} );

describe( "calculatePercentComplete", () =>
{
    test( "When 5 of 10 are done, returns 50",
          () =>
          {
              const percentComplete = calculatePercentComplete( 5, 10 );
              expect( percentComplete ).toEqual( 50 );
          } );

    test( "When 0.123 of 4.567 are done, returns 2.5",
          () =>
          {
              const percentComplete = calculatePercentComplete( 0.123, 4.567 );
              expect( percentComplete ).toEqual( 2.5 );
          } );

    test( "When 0.5 of 1.0 are done, returns 50",
          () =>
          {
              const percentComplete = calculatePercentComplete( 0.5, 1.0 );
              expect( percentComplete ).toEqual( 50 );
          } );

    test( "When 0.5 of 2 are done, returns 25",
          () =>
          {
              const percentComplete = calculatePercentComplete( 0.5, 2.0 );
              expect( percentComplete ).toEqual( 25 );
          } );
} );

describe( "calculateElapsedTime", () =>
{
    test( "Returns 0 milliseconds when since === until",
          () =>
          {
              const date = new Date();
              const elapsedTime = calculateElapsedTime( date, date );
              expect( elapsedTime ).toEqual( 0 );
          } );

    test( "Returns 0 milliseconds when arguments are invalid",
          () =>
          {
              const elapsedTime = calculateElapsedTime( "abc", "123" );
              expect( elapsedTime ).toEqual( 0 );
          } );

    test( "Returns 1000 milliseconds after one second has passed",
          () =>
          {
              const date = new Date();
              const oneSecondLater = new Date( date.getTime() + 1_000 );
              const elapsedTime = calculateElapsedTime( date, oneSecondLater );
              expect( elapsedTime ).toEqual( 1_000 );
          } );


} );


describe( "calculateEstimatedTimeRemaining", () =>
{
    test( "Returns 2300 milliseconds if it took 2300 milliseconds to complete 50%",
          () =>
          {
              const timeRemaining = calculateEstimatedTimeRemaining( 5, 10, 2300 );
              expect( timeRemaining ).toEqual( 2300 );
          } );

    test( "Returns 10_000 milliseconds if it took 2500 milliseconds to complete 20%",
          () =>
          {
              const timeRemaining = calculateEstimatedTimeRemaining( 5, 25, 2500 );
              expect( timeRemaining ).toEqual( 10_000 );
          } );

} );

// formatElapsedTime
describe( "formatElapsedTime", () =>
{
    test( "Returns '01:00' if exactly one hour has elapsed",
          () =>
          {
              let elapsedMilliseconds = (60 * 60 * 1_000);
              const formatted = formatElapsedTime( elapsedMilliseconds );
              expect( formatted ).toEqual( "01:00.00" );
          } );

    test( "Returns '01:23.50' if one hour and 23 minutes and 50 seconds have elapsed",
          () =>
          {
              let elapsedMilliseconds = ((60 * 60 * 1_000) + (60 * 23 * 1_000) + (50 * 1_000));
              const formatted = formatElapsedTime( elapsedMilliseconds );
              expect( formatted ).toEqual( "01:23.50" );
          } );

} );

describe( "serialize", () =>
{
    test( "can serialize a cyclically dependent object",
          () =>
          {
              let a = { "name": "A" };
              let b = { "name": "B" };
              let c = { people: new Set( [a, b] ) };

              let map = new Map();
              map.set( "a", a );
              map.set( "b", b );
              map.set( "c", c );

              let d = { "ref_1": a, "ref_2": b, map };

              map.set( "d", d );

              let obj = { a: a, b: b, c: c, d: d };

              map.set( "obj", obj );

              obj.obj = obj;

              let json = serialize( obj, 2 );

              // console.log( json );

              let json2 = serialize( json );

              // console.log( json );

              expect( json2 ).toEqual( json );
          } );
} );