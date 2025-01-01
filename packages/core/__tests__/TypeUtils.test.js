/** import the utilities to test **/
const typeUtils = require( "../src/TypeUtils.cjs" );

const { VALID_TYPES, JS_TYPES, TYPE_DEFAULTS } = typeUtils;

const anAsyncFunction = async function()
{
    // await console.log( "When I get around to it..." );
};

class A
{
    constructor()
    {

    }

    doSomething()
    {
        // console.log( "I did it!" );
    }

    makeFunction()
    {
        return function()
        {
            // console.log( "A function that returns a function?!  What will they think of next?!!" );
        };
    }

    static doNothing()
    {
        // console.log( "\"I didn't do it.  No one saw me do it.  You can't prove anything\" -- Bart Simpson" );
    }

    async lazyLog()
    {
        await anAsyncFunction();
    }
}

class B extends A
{
    constructor()
    {
        super();
    }
}

class C extends B
{
    constructor()
    {
        super();
    }
}

describe( "TYPE Constants", () =>
{
    test( "VALID_TYPES includes 7 values: string, number, bigint, object, function, symbol, and boolean",
          () =>
          {
              let actual = VALID_TYPES.includes( "string" ) &&
                           VALID_TYPES.includes( "number" ) &&
                           VALID_TYPES.includes( "bigint" ) &&
                           VALID_TYPES.includes( "object" ) &&
                           VALID_TYPES.includes( "function" ) &&
                           VALID_TYPES.includes( "symbol" ) &&
                           VALID_TYPES.includes( "boolean" ) &&
                           VALID_TYPES.length === 7;

              expect( actual ).toBe( true );
          } );

    test( "JS_TYPES includes 8 values, all of the valid types plus 'undefined'",
          () =>
          {
              let actual = JS_TYPES.includes( "string" ) &&
                           JS_TYPES.includes( "number" ) &&
                           JS_TYPES.includes( "bigint" ) &&
                           JS_TYPES.includes( "object" ) &&
                           JS_TYPES.includes( "function" ) &&
                           JS_TYPES.includes( "symbol" ) &&
                           JS_TYPES.includes( "boolean" ) &&
                           JS_TYPES.includes( "undefined" ) &&
                           JS_TYPES.length === 8;

              expect( actual ).toBe( true );

              expect( JS_TYPES ).toEqual( ["undefined"].concat( VALID_TYPES ) );
          } );

    test( "TYPE_DEFAULTS are the expected values a language like Java would assign",
          () =>
          {
              expect( TYPE_DEFAULTS["string"] ).toEqual( "" );
              expect( TYPE_DEFAULTS["bigint"] ).toEqual( 0n );
              expect( TYPE_DEFAULTS["number"] ).toEqual( 0 );
              expect( TYPE_DEFAULTS["boolean"] ).toEqual( false );
              expect( TYPE_DEFAULTS["function"] ).toBe( null );
              expect( TYPE_DEFAULTS["object"] ).toBe( null );
              expect( TYPE_DEFAULTS["symbol"] ).toBe( null );
              expect( TYPE_DEFAULTS["undefined"] ).toBe( undefined );
          } );
} );

describe( "isUndefined", () =>
{
    test( "isUndefined() === true",
          () =>
          {
              expect( typeUtils.isUndefined() ).toBe( true );
          } );

    test( "isUndefined(undefined) === true",
          () =>
          {
              expect( typeUtils.isUndefined( undefined ) ).toBe( true );
          } );

    test( "isUndefined(x) === true",
          () =>
          {
              function testUndefined()
              {
                  return typeUtils.isUndefined( x );
              }

              expect( testUndefined ).toThrow( ReferenceError );
          } );

    test( "isUndefined(object.property) === true",
          () =>
          {
              const obj =
                  {
                      "a": 1,
                      "b": 2
                  };

              expect( typeUtils.isUndefined( obj.c ) ).toBe( true );
          } );

    test( "isUndefined(null object.property) === false",
          () =>
          {
              const obj =
                  {
                      "a": 1,
                      "b": 2,
                      "c": null
                  };

              expect( typeUtils.isUndefined( obj.c ) ).toBe( false );
          } );

    test( "isUndefined(uninitialized variable) === true",
          () =>
          {
              let xyz;
              expect( typeUtils.isUndefined( xyz ) ).toBe( true );
          } );

    // isDefined is just an inversion of isUndefined, so only one trivial test is provided
    test( "isDefined() === false",
          () =>
          {
              expect( typeUtils.isDefined() ).toBe( false );
          } );
} );

describe( "isNull", () =>
{
    test( "isNull(undefined,true) === false",
          () =>
          {
              expect( typeUtils.isNull( undefined, true ) ).toBe( false );
          } );

    test( "isNull() === true",
          () =>
          {
              expect( typeUtils.isNull() ).toBe( true );
          } );

    test( "isNull(null,true) === true",
          () =>
          {
              expect( typeUtils.isNull( null, true ) ).toBe( true );
          } );

    test( "isNull('',true) === false",
          () =>
          {
              expect( typeUtils.isNull( "", true ) ).toBe( false );
          } );

    test( "isNull('') === true",
          () =>
          {
              expect( typeUtils.isNull( "" ) ).toBe( true );
          } );

// isNotNull is just a negation of isNull, so no tests are provided
} );

describe( "isPrimitiveWrapper", () =>
{
    test( "isPrimitiveWrapper string",
          () =>
          {
              expect( typeUtils.isPrimitiveWrapper( "abc" ) ).toBe( false );
          } );

    test( "isPrimitiveWrapper String",
          () =>
          {
              expect( typeUtils.isPrimitiveWrapper( new String( "abc" ) ) ).toBe( true );
          } );

    test( "isPrimitiveWrapper number",
          () =>
          {
              expect( typeUtils.isPrimitiveWrapper( 123 ) ).toBe( false );
          } );

    test( "isPrimitiveWrapper Number",
          () =>
          {
              expect( typeUtils.isPrimitiveWrapper( new Number( 123 ) ) ).toBe( true );
          } );

    test( "isPrimitiveWrapper bigint",
          () =>
          {
              expect( typeUtils.isPrimitiveWrapper( 10n ) ).toBe( false );
          } );

    test( "isPrimitiveWrapper BigInt is still false, because BigInt is not a constructor",
          () =>
          {
              expect( typeUtils.isPrimitiveWrapper( BigInt( 123 ) ) ).toBe( false );
          } );

    test( "isPrimitiveWrapper boolean",
          () =>
          {
              expect( typeUtils.isPrimitiveWrapper( true ) ).toBe( false );
          } );

    test( "isPrimitiveWrapper Boolean",
          () =>
          {
              expect( typeUtils.isPrimitiveWrapper( new Boolean( false ) ) ).toBe( true );
          } );

    test( "isPrimitiveWrapper function",
          () =>
          {
              expect( typeUtils.isPrimitiveWrapper( anAsyncFunction ) ).toBe( false );
          } );

    test( "isPrimitiveWrapper Function",
          () =>
          {
              expect( typeUtils.isPrimitiveWrapper( new Function( "a", "b", "return a + b" ) ) ).toBe( false );
          } );
} );

describe( "isGeneratorFunction", () =>
{
    test( "isGeneratorFunction function*",
          () =>
          {
              function* generator()
              {
                  let x = 0;
                  if ( ++x < 10 )
                  {
                      yield x;
                  }
              }

              expect( typeUtils.isGeneratorFunction( generator ) ).toBe( true );
          } );

    test( "isGeneratorFunction with regular function",
          () =>
          {
              const f = function() {};
              expect( typeUtils.isGeneratorFunction( f ) ).toBe( false );
          } );

} );

describe( "isObject", () =>
{
    test( "isObject(null) === true",
          () =>
          {
              let obj = null;
              expect( typeUtils.isObject( obj ) ).toBe( true );
          } );

    test( "isObject(null,{rejectNull:true) === false",
          () =>
          {
              let obj = null;
              expect( typeUtils.isObject( obj, { rejectNull: true } ) ).toBe( false );
          } );

    test( "isObject({}) === true",
          () =>
          {
              let obj = {};
              expect( typeUtils.isObject( obj ) ).toBe( true );
          } );

    test( "isObject([]) === true",
          () =>
          {
              let obj = [];
              expect( typeUtils.isObject( obj ) ).toBe( true );
          } );

    test( "isObject([], {rejectArrays:true}) === false",
          () =>
          {
              let obj = [];
              expect( typeUtils.isObject( obj, { rejectArrays: true } ) ).toBe( false );
          } );

    test( "isObject(new C()) === true",
          () =>
          {
              let obj = new C();
              expect( typeUtils.isObject( obj ) ).toBe( true );
          } );

    test( "isObject('abc') === false",
          () =>
          {
              let obj = "abc";
              expect( typeUtils.isObject( obj ) ).toBe( false );
          } );

    test( "isObject(new String('abc')) === false",
          () =>
          {
              let obj = new String( "abc" );
              expect( typeUtils.isObject( obj ) ).toBe( false );
          } );

    test( "isObject(new String('abc'), {rejectPrimitiveWrappers:true}) === false",
          () =>
          {
              let obj = new String( "abc" );
              expect( typeUtils.isObject( obj, { rejectPrimitiveWrappers: true } ) ).toBe( false );
          } );

    test( "isObject(new String('abc'), {rejectPrimitiveWrappers:false}) === true",
          () =>
          {
              let obj = new String( "abc" );
              expect( typeUtils.isObject( obj, { rejectPrimitiveWrappers: false } ) ).toBe( true );
          } );
} );

describe( "isCustomObject", () =>
{
    test( "isCustomObject(new C()) === true",
          () =>
          {
              let obj = new C();
              expect( typeUtils.isCustomObject( obj ) ).toBe( true );
          } );

    test( "isCustomObject({}) === false",
          () =>
          {
              let obj = {};
              expect( typeUtils.isCustomObject( obj ) ).toBe( false );
          } );
} );

describe( "isNonNullObject", () =>
{
    test( "isNonNullObject() === false",
          () =>
          {
              expect( typeUtils.isNonNullObject() ).toBe( false );
          } );

    test( "isNonNullObject({}) === true",
          () =>
          {
              expect( typeUtils.isNonNullObject( {} ) ).toBe( true );
          } );

    test( "isNonNullObject({},true,{ allowEmptyObjects: true }) === true",
          () =>
          {
              expect( typeUtils.isNonNullObject( {}, true, { allowEmptyObjects: true } ) ).toBe( true );
          } );

    test( "isNonNullObject({},true,{ allowEmptyObjects: false }) === false",
          () =>
          {
              expect( typeUtils.isNonNullObject( {}, true, { allowEmptyObjects: false } ) ).toBe( false );
          } );

    test( "isNonNullObject({'a':null},true,{ allowEmptyObjects: false }) === false",
          () =>
          {
              expect( typeUtils.isNonNullObject( { "a": null }, true, { allowEmptyObjects: false } ) ).toBe( false );
          } );

    test( "isNonNullObject({'a':1},true,{ allowEmptyObjects: false }) === true",
          () =>
          {
              expect( typeUtils.isNonNullObject( { "a": 1 }, true, { allowEmptyObjects: false } ) ).toBe( true );
          } );
} );

describe( "isFunction", () =>
{
    test( "isFunction(C) === true",
          () =>
          {
              let obj = C;
              expect( typeUtils.isFunction( obj ) ).toBe( true );
          } );

    test( "isFunction(new C().doSomething) === true",
          () =>
          {
              let obj = new C().doSomething;
              expect( typeUtils.isFunction( obj ) ).toBe( true );
          } );

    test( "isFunction(new C().doSomething()) === false",
          () =>
          {
              let obj = new C().doSomething();
              expect( typeUtils.isFunction( obj ) ).toBe( false );
          } );

    test( "isFunction(C.doSomething) === false",
          () =>
          {
              let obj = C.doSomething;
              expect( typeUtils.isFunction( obj ) ).toBe( false );
          } );

    test( "isFunction(C.doNothing) === true",
          () =>
          {
              let obj = C.doNothing;
              expect( typeUtils.isFunction( obj ) ).toBe( true );
          } );

    test( "isFunction(C.doNothing()) === false",
          () =>
          {
              let obj = C.doNothing();
              expect( typeUtils.isFunction( obj ) ).toBe( false );
          } );

    test( "isFunction('abc') === false",
          () =>
          {
              let obj = "abc";
              expect( typeUtils.isFunction( obj ) ).toBe( false );
          } );

    test( "isFunction(new C().makeFunction) === true",
          () =>
          {
              let obj = new C().makeFunction;
              expect( typeUtils.isFunction( obj ) ).toBe( true );
          } );

    test( "isFunction(new C().makeFunction()) === true",
          () =>
          {
              let obj = new C().makeFunction();
              expect( typeUtils.isFunction( obj ) ).toBe( true );
          } );

    test( "isFunction(new C().makeFunction()()) === false",
          () =>
          {
              let obj = new C().makeFunction()();
              expect( typeUtils.isFunction( obj ) ).toBe( false );
          } );

    test( "isFunction(Array) === true",
          () =>
          {
              expect( typeUtils.isFunction( Array ) ).toBe( true );
          } );

    test( "isFunction('an object with call and apply methods') === false, when strict (default)",
          () =>
          {
              let fakeFunction =
                  {
                      call: function() {},
                      apply: function() {}
                  };

              expect( typeUtils.isFunction( fakeFunction ) ).toBe( false );
          } );

    test( "isFunction('an object with call and apply methods') === true, when not strict",
          () =>
          {
              let fakeFunction =
                  {
                      call: function() {},
                      apply: function() {}
                  };

              expect( typeUtils.isFunction( fakeFunction, false ) ).toBe( true );
          } );
} );

describe( "isAsyncFunction", () =>
{
    test( "isAsyncFunction(anAsyncFunction) === true",
          () =>
          {
              expect( typeUtils.isAsyncFunction( anAsyncFunction ) ).toBe( true );
          } );

    test( "isAsyncFunction(anAsyncFunction()) === false",
          () =>
          {
              expect( typeUtils.isAsyncFunction( anAsyncFunction() ) ).toBe( false );
          } );

    test( "isAsyncFunction(C) === false",
          () =>
          {
              expect( typeUtils.isAsyncFunction( C ) ).toBe( false );
          } );

    test( "isAsyncFunction(new C().lazyLog) === true",
          () =>
          {
              expect( typeUtils.isAsyncFunction( new C().lazyLog ) ).toBe( true );
          } );

    test( "isAsyncFunction(new C().lazyLog()) === false",
          () =>
          {
              expect( typeUtils.isAsyncFunction( new C().lazyLog() ) ).toBe( false );
          } );
} );

describe( "isClass", () =>
{
    test( "isClass(C) === true",
          () =>
          {
              let obj = C;
              expect( typeUtils.isClass( obj ) ).toBe( true );
          } );

    test( "isClass(Object) === false, when strict (default)",
          () =>
          {
              expect( typeUtils.isClass( Object ) ).toBe( false );
          } );

    test( "isClass(Object) === true, when not strict",
          () =>
          {
              expect( typeUtils.isClass( Object, false ) ).toBe( true );
          } );
} );

describe( "isString", () =>
{
    test( "isString('abc') === true",
          () =>
          {
              expect( typeUtils.isString( "abc" ) ).toBe( true );
          } );

    test( "isString(new String('abc')) === true",
          () =>
          {
              expect( typeUtils.isString( new String( "abc" ) ) ).toBe( true );
          } );

    test( "isString(0) === false",
          () =>
          {
              expect( typeUtils.isString( 0 ) ).toBe( false );
          } );

    test( "isString(['abc']) === false",
          () =>
          {
              expect( typeUtils.isString( ["abc"] ) ).toBe( false );
          } );

    test( "isString() === false",
          () =>
          {
              expect( typeUtils.isString() ).toBe( false );
          } );

    test( "isString(null) === false",
          () =>
          {
              expect( typeUtils.isString( null ) ).toBe( false );
          } );

    test( "isString(undefined) === false",
          () =>
          {
              expect( typeUtils.isString( undefined ) ).toBe( false );
          } );
} );

describe( "Numeric functions", () =>
{
    function generateRandomNumber( pMin, pMax )
    {
        const min = parseInt( pMin ) || 0;
        const max = parseInt( pMax ) || 1;

        return (Math.random() * (max - min + 1)) + min;
    }

    function generateRandomInteger( pMin, pMax )
    {
        return Math.floor( generateRandomNumber( pMin, pMax ) );
    }

    function generateStringValues( pHowMany, pMinLength, pMaxLength )
    {
        const howMany = Math.min( 100, Math.max( 1, parseInt( pHowMany ) || 25 ) );

        const min = Math.max( 0, Math.min( 4096, parseInt( pMinLength ) || 0 ) );
        const max = Math.min( 4096, Math.max( 0, parseInt( pMaxLength ) || 0 ) );

        const strings = [];
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!@#$%^&*()_-+={}[];:'\"><?/\\|~`";

        for( let i = howMany; i--; )
        {
            const len = generateRandomInteger( min, max );

            let str = "";

            for( let j = len; j--; )
            {
                str += chars[j];
            }

            strings.push( str );
        }

        return strings;
    }

    function generateHexValues( pHowMany, pMin, pMax, pIncludeFractionalValues = true )
    {
        const howMany = Math.min( 100, Math.max( 1, parseInt( pHowMany ) || 25 ) );

        const min = Math.max( -10_000, Math.min( 0, parseFloat( pMin ) || -1000 ) );
        const max = Math.min( +10_000, Math.max( 0, parseFloat( pMax ) || +1000 ) );

        const hexadecimals = [];

        for( let i = howMany; i--; )
        {
            let value = Math.random() * (max - min + 1) + min;

            if ( false === pIncludeFractionalValues )
            {
                value = Math.floor( value );
            }

            let hexString = value.toString( 16 );

            if ( !(/^0x/.test( hexString ) || /^-0x/.test( hexString )) )
            {
                hexString = (hexString.startsWith( "-" ) ? "-0x" : "0x") + hexString.replace( /^-/, "" );
            }

            hexadecimals.push( hexString );
        }

        return hexadecimals;
    }

    function generateOctalValues( pHowMany, pMin, pMax, pIncludeFractionalValues = true )
    {
        const howMany = Math.min( 100, Math.max( 1, parseInt( pHowMany ) || 25 ) );

        const min = Math.max( -10_000, Math.min( 0, parseFloat( pMin ) || -1000 ) );
        const max = Math.min( +10_000, Math.max( 0, parseFloat( pMax ) || +1000 ) );

        const octalValues = [];

        for( let i = howMany; i--; )
        {
            let value = Math.random() * (max - min + 1) + min; // Math.random() * 1000;

            if ( false === pIncludeFractionalValues )
            {
                value = Math.floor( value );
            }

            let octString = value.toString( 8 );

            if ( !(/^0o/.test( octString ) || /^-0o/.test( octString )) )
            {
                octString = (octString.startsWith( "-" ) ? "-0o" : "0o") + octString.replace( /^-/, "" );
            }

            octalValues.push( octString );
        }

        return octalValues;
    }

    const hexadecimals = generateHexValues( 25, -1000, 1000 );
    const octals = generateOctalValues( 25, -1000, 1000 );

    test( "isNumber(0) === true",
          () =>
          {
              expect( typeUtils.isNumber( 0 ) ).toBe( true );
          } );

    test( "isNumber(20000000000000000000000000000000000000000000000000000000000000000000000n) === true",
          () =>
          {
              expect( typeUtils.isNumber( 20000000000000000000000000000000000000000000000000000000000000000000000n ) ).toBe( true );
          } );

    test( "isNumber('123') === false",
          () =>
          {
              expect( typeUtils.isNumber( "123" ) ).toBe( false );
          } );

    test( "isNumber(new Number('123')) === true",
          () =>
          {
              expect( typeUtils.isNumber( new Number( "123" ) ) ).toBe( true );
          } );

    test( "isNumber(MIN_VALUE) === true",
          () =>
          {
              expect( typeUtils.isNumber( Number.MIN_VALUE ) ).toBe( true );
          } );

    test( "isNumber(MAX_VALUE) === true",
          () =>
          {
              expect( typeUtils.isNumber( Number.MAX_VALUE ) ).toBe( true );
          } );

    test( "isNumeric('123') === true",
          () =>
          {
              expect( typeUtils.isNumeric( "123" ) ).toBe( true );
          } );

    test( "isNumeric('0123') === true",
          () =>
          {
              expect( typeUtils.isNumeric( "0123" ) ).toBe( true );
          } );

    test( "isNumeric('000123') === true",
          () =>
          {
              expect( typeUtils.isNumeric( "000123" ) ).toBe( true );
          } );

    test( "isNumeric('0z0123') === false",
          () =>
          {
              expect( typeUtils.isNumeric( "0z0123" ) ).toBe( false );
          } );

    test( "isNumeric(hexadecimals) === true",
          () =>
          {
              const hexes = [].concat( hexadecimals );
              const valid = hexadecimals.filter( e => typeUtils.isNumeric( e ) );
              expect( valid.length ).toBe( hexes.length );
          } );

    test( "isNumeric(octals) === true",
          () =>
          {
              const octs = [].concat( octals );
              const valid = octals.filter( e => typeUtils.isNumeric( e ) );
              expect( valid.length ).toBe( octs.length );
          } );

    test( "isNumeric(strings) === false",
          () =>
          {
              const strings = generateStringValues( 25, 3, 64 );
              const valid = strings.filter( e => typeUtils.isNumeric( e ) );
              expect( valid.length ).toEqual( 0 );
          } );

    test( "isOctal(strings) === true",
          () =>
          {
              const strings = octals.map( e => String( "" + e + "" ) );
              const valid = strings.filter( e => typeUtils.isOctal( e ) );
              expect( valid.length ).toEqual( octals.length );
          } );

    test( "isOctal(values) === true",
          () =>
          {
              const valid = octals.filter( e => typeUtils.isOctal( e ) );
              expect( valid.length ).toEqual( octals.length );
          } );

    test( "isOctal(hex values) === false",
          () =>
          {
              const valid = hexadecimals.filter( e => typeUtils.isOctal( e ) );
              expect( valid.length ).toEqual( 0 );
          } );

    test( "isOctal(decimal values) === false",
          () =>
          {
              let valid = [10, 34, 0.77, 77, 88.77].filter( e => typeUtils.isOctal( e ) );
              expect( valid.length ).toEqual( 0 );

              valid = ["0o17", 10, 17, 34, 0.77, 77, 88.77, "xx", "0xx", "0xA", 0xF].filter( e => typeUtils.isOctal( e ) );
              expect( valid.length ).toEqual( 1 );
          } );

    test( "isHex(strings) === false",
          () =>
          {
              const strings = hexadecimals.map( e => String( "" + e + "" ) );
              const valid = strings.filter( e => typeUtils.isHex( e ) );
              expect( valid.length ).toEqual( hexadecimals.length );
          } );

    test( "isHex(values) === false",
          () =>
          {
              const valid = hexadecimals.filter( e => typeUtils.isHex( e ) );
              expect( valid.length ).toEqual( hexadecimals.length );
          } );

    test( "isHex(decimal values) === false",
          () =>
          {
              // note that 0xF is interpreted as decimal value, 15, while the string "0xA" is fed directly to the method
              let valid = ["017", 10, 17, 34, 0.77, 77, 88.77, "xx", "0xx", "0xA", 0xF].filter( e => typeUtils.isHex( e ) );
              expect( valid.length ).toEqual( 1 );

              valid = ["017", 10, 17, 34, 0.77, 77, 88.77, "xx", "0xx", "0xA", 0xF].map( e => ("" + (e) + "").trim() ).filter( e => typeUtils.isHex( e ) );
              expect( valid.length ).toEqual( 1 );
          } );

    test( "isDecimal(decimal values)",
          () =>
          {
              // note that 0xF is interpreted as decimal value, 15, while the string "0xA" is fed directly to the method
              const samples = ["017", "00.17", 0, 10, 100, 17, 34, 0.77, 77, 88.77, "xx", "0xx", "0xA", 0xF];

              let valid = samples.filter( e => typeUtils.isDecimal( e ) );
              expect( valid.length ).toEqual( 11 );

              valid = samples.map( e => ("" + (e) + "").trim() ).filter( e => typeUtils.isDecimal( e ) );
              expect( valid.length ).toEqual( 11 );
          } );

    test( "isInteger(0) === true",
          () =>
          {
              expect( typeUtils.isInteger( 0 ) ).toBe( true );
          } );


    test( "isFloat(0) === true",
          () =>
          {
              expect( typeUtils.isFloat( 0 ) ).toBe( true );
          } );
} );

describe( "toNumericBase",
          () =>
          {
              test( "toDecimal('0xFF') === 255",
                    () =>
                    {
                        expect( typeUtils.toDecimal( "0xff" ) ).toEqual( 255 );
                        expect( typeUtils.toDecimal( 0xff ) ).toEqual( 255 );
                    } );

              test( "toDecimal('-0xFF') === -255",
                    () =>
                    {
                        expect( typeUtils.toDecimal( "-0xff" ) ).toEqual( -255 );
                        expect( typeUtils.toDecimal( -0xff ) ).toEqual( -255 );
                    } );

              test( "toDecimal('111') === 111",
                    () =>
                    {
                        expect( typeUtils.toDecimal( "111" ) ).toEqual( 111 );
                        expect( typeUtils.toDecimal( 111 ) ).toEqual( 111 );
                    } );

              test( "toDecimal('-111') === -111",
                    () =>
                    {
                        expect( typeUtils.toDecimal( "-111" ) ).toEqual( -111 );
                        expect( typeUtils.toDecimal( -111 ) ).toEqual( -111 );
                    } );

              test( "toDecimal('0o10') === 8",
                    () =>
                    {
                        expect( typeUtils.toDecimal( "0o10" ) ).toEqual( 8 );
                        expect( typeUtils.toDecimal( 0o10 ) ).toEqual( 8 );
                    } );

              test( "toDecimal('-0o10') === -8",
                    () =>
                    {
                        expect( typeUtils.toDecimal( "-0o10" ) ).toEqual( -8 );
                        expect( typeUtils.toDecimal( -0o10 ) ).toEqual( -8 );
                    } );

              test( "toDecimal('0b100') === 4",
                    () =>
                    {
                        expect( typeUtils.toDecimal( "0b100" ) ).toEqual( 4 );
                        expect( typeUtils.toDecimal( 0b100 ) ).toEqual( 4 );
                    } );

              test( "toDecimal('-0b100') === -4",
                    () =>
                    {
                        expect( typeUtils.toDecimal( "-0b100" ) ).toEqual( -4 );
                        expect( typeUtils.toDecimal( -0b100 ) ).toEqual( -4 );
                    } );


              test( "toDecimal('0b10001') === 17",
                    () =>
                    {
                        expect( typeUtils.toDecimal( "0b10001" ) ).toEqual( 17 );
                        expect( typeUtils.toDecimal( 0b10001 ) ).toEqual( 17 );
                    } );

              test( "toDecimal('-0b10001') === -17",
                    () =>
                    {
                        expect( typeUtils.toDecimal( "-0b10001" ) ).toEqual( -17 );
                        expect( typeUtils.toDecimal( -0b10001 ) ).toEqual( -17 );
                    } );


              test( "toOctal('0xFF') === 0o377",
                    () =>
                    {
                        expect( typeUtils.toOctal( "0xff" ) ).toEqual( "0o377" );
                        expect( typeUtils.toOctal( 0xff ) ).toEqual( "0o377" );
                    } );

              test( "toOctal('-0xFF') === -0o377",
                    () =>
                    {
                        expect( typeUtils.toOctal( "-0xff" ) ).toEqual( "-0o377" );
                        expect( typeUtils.toOctal( -0xff ) ).toEqual( "-0o377" );
                    } );

              test( "toHex(255) === 0xff",
                    () =>
                    {
                        expect( typeUtils.toHex( 255 ) ).toEqual( "0xff" );
                        expect( typeUtils.toHex( "255" ) ).toEqual( "0xff" );
                    } );

              test( "toHex(-255) === -0xff",
                    () =>
                    {
                        expect( typeUtils.toHex( -255 ) ).toEqual( "-0xff" );
                        expect( typeUtils.toHex( "-255" ) ).toEqual( "-0xff" );
                    } );

              test( "toBinary(255) === 0b11111111",
                    () =>
                    {
                        expect( typeUtils.toBinary( 255 ) ).toEqual( "0b11111111" );
                        expect( typeUtils.toBinary( "255" ) ).toEqual( "0b11111111" );
                    } );

              test( "toBinary(-255) === -0b11111111",
                    () =>
                    {
                        expect( typeUtils.toBinary( -255 ) ).toEqual( "-0b11111111" );
                        expect( typeUtils.toBinary( "-255" ) ).toEqual( "-0b11111111" );
                    } );

          } );

describe( "isZero", () =>
{
    test( "isZero(1) === false",
          () =>
          {
              expect( typeUtils.isZero( 1 ) ).toBe( false );
          } );

    test( "isZero(1/0) === false",
          () =>
          {
              expect( typeUtils.isZero( 1 / 0 ) ).toBe( false );
          } );

    test( "isZero(POSITIVE_INFINITY) === false",
          () =>
          {
              expect( typeUtils.isZero( Number.POSITIVE_INFINITY ) ).toBe( false );
          } );

    test( "isZero(NEGATIVE_INFINITY) === false",
          () =>
          {
              expect( typeUtils.isZero( Number.NEGATIVE_INFINITY ) ).toBe( false );
          } );

    test( "isZero('abc') === false",
          () =>
          {
              expect( typeUtils.isZero( "abc" ) ).toBe( false );
          } );

    test( "isZero(0) === true",
          () =>
          {
              expect( typeUtils.isZero( 0 ) ).toBe( true );
          } );

    test( "isZero('0') === false",
          () =>
          {
              expect( typeUtils.isZero( "0" ) ).toBe( false );
          } );

    test( "isZero('0',false) === true",
          () =>
          {
              expect( typeUtils.isZero( "0", false ) ).toBe( true );
          } );
} );

describe( "isInteger", () =>
{
    const a = 1;
    const b = 1.0;
    const c = 1.1;

    test( "isInteger( 1 ) is true",
          () =>
          {
              expect( typeUtils.isInteger( a ) ).toBe( true );
          } );

    test( "isInteger( 1.0 ) is true",
          () =>
          {
              expect( typeUtils.isInteger( b ) ).toBe( true );
          } );

    test( "isInteger( 1.1 ) is false",
          () =>
          {
              expect( typeUtils.isInteger( c ) ).toBe( false );
          } );

    test( "isInteger( '1' ) is false",
          () =>
          {
              expect( typeUtils.isInteger( "1" ) ).toBe( false );
          } );

    test( "isInteger( '1', false ) is true (when not strict)",
          () =>
          {
              expect( typeUtils.isInteger( "1", false ) ).toBe( true );
          } );

    test( "isInteger( '1.1', false ) is still false (even when not strict)",
          () =>
          {
              expect( typeUtils.isInteger( "1.1", false ) ).toBe( false );
          } );
} );

describe( "isFloat", () =>
{
    const a = 1;
    const b = 1.0;
    const c = 1.1;

    test( "isFloat( 0 ) is true",
          () =>
          {
              expect( typeUtils.isFloat( 0 ) ).toBe( true );
          } );

    test( "isFloat( 1 ) is false",
          () =>
          {
              expect( typeUtils.isFloat( a ) ).toBe( false );
          } );

    test( "isFloat( 1.0 ) is false",
          () =>
          {
              expect( typeUtils.isFloat( b ) ).toBe( false );
          } );

    test( "isFloat( 1.1 ) is true",
          () =>
          {
              expect( typeUtils.isFloat( c ) ).toBe( true );
          } );

    test( "isFloat( '1.1' ) is false",
          () =>
          {
              expect( typeUtils.isFloat( "1.1" ) ).toBe( false );
          } );

    test( "isFloat( '1.1', false ) is true (when not strict)",
          () =>
          {
              expect( typeUtils.isFloat( "1.1", false ) ).toBe( true );
          } );

    test( "isFloat( '1.0', false ) is still false (even when not strict)",
          () =>
          {
              expect( typeUtils.isFloat( "1.0", false ) ).toBe( false );
          } );
} );

describe( "isBoolean", () =>
{
    test( "isBoolean(false) === true",
          () =>
          {
              expect( typeUtils.isBoolean( false ) ).toBe( true );
          } );

    test( "isBoolean(true) === true",
          () =>
          {
              expect( typeUtils.isBoolean( true ) ).toBe( true );
          } );
    test( "isBoolean(new Boolean(false)) === true",
          () =>
          {
              expect( typeUtils.isBoolean( new Boolean( false ) ) ).toBe( true );
          } );

    test( "isBoolean( 1 === 1 ) === true",
          () =>
          {
              expect( typeUtils.isBoolean( 1 === 1 ) ).toBe( true );
          } );

    test( "isBoolean('abc') === false",
          () =>
          {
              expect( typeUtils.isBoolean( "abc" ) ).toBe( false );
          } );

    test( "isBoolean('true') === false",
          () =>
          {
              expect( typeUtils.isBoolean( "true" ) ).toBe( false );
          } );
} );

describe( "isArray", () =>
{
    test( "isArray([]) === true",
          () =>
          {
              expect( typeUtils.isArray( [] ) ).toBe( true );
          } );

    test( "isArray('abc'.split(_mt_chr)) === true",
          () =>
          {
              expect( typeUtils.isArray( "abc".split( "" ) ) ).toBe( true );
          } );

    test( "isArray({}) === false",
          () =>
          {
              expect( typeUtils.isArray( {} ) ).toBe( false );
          } );

    test( "isArray(...pArgs) === true",
          () =>
          {
              function tested( ...pArgs )
              {
                  expect( typeUtils.isArray( pArgs ) ).toBe( true );
              }

              tested( 1 );
          } );
} );

describe( "isTypedArray", () =>
{
    test( "isTypedArray([]) === false",
          () =>
          {
              expect( typeUtils.isTypedArray( [] ) ).toBe( false );
          } );

    test( "isTypedArray({'0':0, '1':2, length:2}) === false",
          () =>
          {
              expect( typeUtils.isTypedArray( { "0": 0, "1": 2, length: 2 } ) ).toBe( false );
          } );

    test( "isTypedArray(UInt8Array) === true",
          () =>
          {
              expect( typeUtils.isTypedArray( new Uint8Array( 2 ) ) ).toBe( true );
          } );

    test( "isTypedArray(UInt8Array) === true",
          () =>
          {
              expect( typeUtils.isTypedArray( new Int32Array( 2 ) ) ).toBe( true );
          } );
} );

describe( "isLikeArray",
          () =>
          {
              test( "isLikeArray() === true",
                    () =>
                    {
                        let obj = { 0: 0, 1: 1, length: 2 };
                        expect( typeUtils.isLikeArray( obj ) ).toBe( true );
                    } );

              test( "isLikeArray() === false if the object must be iterable",
                    () =>
                    {
                        let obj = { 0: 0, 1: 1, length: 2 };
                        expect( typeUtils.isLikeArray( obj, true ) ).toBe( false );
                    } );

              test( "isFunction(Array.prototype[Symbol.iterator]) === true",
                    () =>
                    {
                        expect( typeUtils.isFunction( Array.prototype[Symbol.iterator] ) ).toBe( true );
                    } );
          } );

describe( "isIterable",
          () =>
          {
              test( "isIterable( array ) === true ",
                    () =>
                    {
                        let obj = [1, 2, 3];
                        expect( typeUtils.isIterable( obj ) ).toBe( true );
                    } );

              test( "isIterable( string ) === true ",
                    () =>
                    {
                        let obj = "abc";
                        expect( typeUtils.isIterable( obj ) ).toBe( true );
                    } );

              test( "isIterable( object ) === false",
                    () =>
                    {
                        let obj = { a: 1, b: 2 };
                        expect( typeUtils.isIterable( obj ) ).toBe( false );
                    } );

              test( "isIterable( Iterator ) === true",
                    () =>
                    {
                        let obj = { 0: 0, 1: 1, length: 2 };
                        obj = typeUtils.toIterable( obj );
                        expect( typeUtils.isIterable( obj ) ).toBe( true );
                    } );

          } );

describe( "isSpreadable",
          () =>
          {
              test( "isSpreadable( array ) === true ",
                    () =>
                    {
                        let obj = [1, 2, 3];

                        expect( typeUtils.isSpreadable( obj ) ).toBe( true );

                        let arr = [...obj];

                        expect( arr ).toEqual( obj );
                    } );

              test( "isSpreadable( string ) === true ",
                    () =>
                    {
                        let obj = "abc";

                        expect( typeUtils.isSpreadable( obj ) ).toBe( true );

                        let arr = [...obj];

                        expect( arr ).toEqual( ["a", "b", "c"] );
                    } );

              test( "isSpreadable( object ) === false ",
                    () =>
                    {
                        let obj = { a: 1, b: 2, c: 3 };

                        expect( typeUtils.isSpreadable( obj ) ).toBe( false );

                        let obj2 = { ...obj };

                        expect( obj2 ).toEqual( obj );

                        // this would fail...
                        // let arr = [...obj];
                    } );

              test( "isSpreadable( object, false ) === true",
                    () =>
                    {
                        let obj = { a: 1, b: 2, c: 3 };

                        expect( typeUtils.isSpreadable( obj, true ) ).toBe( false );

                        let obj2 = { ...obj };

                        expect( obj2 ).toEqual( obj );

                        // this would still fail
                        // let arr = [...obj];
                    } );
          } );

describe( "isSymbol", () =>
{
    test( "isSymbol(Symbol('a')) === true",
          () =>
          {
              expect( typeUtils.isSymbol( Symbol( "a" ) ) ).toBe( true );
          } );

    test( "isSymbol(Symbol.iterator) === true",
          () =>
          {
              expect( typeUtils.isSymbol( Symbol.iterator ) ).toBe( true );
          } );
} );

describe( "isType", () =>
{
    test( "isType('abc','string') === true",
          () =>
          {
              expect( typeUtils.isType( "abc", "string" ) ).toBe( true );
          } );

    test( "isType('123','number') === false",
          () =>
          {
              expect( typeUtils.isType( "123", "number" ) ).toBe( false );
          } );

    test( "isType('abc','xyz') === true",
          () =>
          {
              expect( typeUtils.isType( "abc", "xyz" ) ).toBe( true );
          } );

    test( "isType('123',123) === false",
          () =>
          {
              expect( typeUtils.isType( "123", 123 ) ).toBe( false );
          } );

    test( "isType(123,789) === true",
          () =>
          {
              expect( typeUtils.isType( 123, 789 ) ).toBe( true );
          } );

    test( "isType([],Array]) === true",
          () =>
          {
              expect( typeUtils.isType( [], Array ) ).toBe( true );
          } );

    test( "isType({},Object) === true",
          () =>
          {
              expect( typeUtils.isType( {}, Object ) ).toBe( true );
          } );
} );

describe( "areSameType", () =>
{
    test( "areSameType( strings )",
          () =>
          {
              let strings = ["a", "abc", "123", "foo"];
              expect( typeUtils.areSameType( ...strings ) ).toBe( true );
          } );

    test( "areSameType( numbers )",
          () =>
          {
              let numbers = [0, 1, 2, 10n, BigInt( 12 )];
              expect( typeUtils.areSameType( ...numbers ) ).toBe( true );
          } );

    test( "areSameType( booleans )",
          () =>
          {
              let booleans = [false, true, 1 === 1, 0 < 2];
              expect( typeUtils.areSameType( ...booleans ) ).toBe( true );
          } );

    test( "areSameType( Dates )",
          () =>
          {
              let dates = [new Date(), new Date( 2024, 1, 1 )];
              expect( typeUtils.areSameType( ...dates ) ).toBe( true );
          } );

    test( "areSameType( objects )",
          () =>
          {
              let objects = [{}, { a: 1 }, Object.create( null )];
              expect( typeUtils.areSameType( ...objects ) ).toBe( true );
          } );

    test( "areSameType( mixed )",
          () =>
          {
              let strings = ["a", "abc", 123, "foo"];
              expect( typeUtils.areSameType( ...strings ) ).toBe( false );
          } );

    test( "areSameType( more mixed )",
          () =>
          {
              let numbers = [123, new Date()];
              expect( typeUtils.areSameType( ...numbers ) ).toBe( false );
          } );
} );

describe( "isMap", () =>
{
    test( "isMap( new Map() ) ) === true",
          () =>
          {
              expect( typeUtils.isMap( new Map() ) ).toBe( true );
          } );

    test( "isMap( {'a':1,'b':2 } ) ) === false",
          () =>
          {
              expect( typeUtils.isMap( { "a": 1, "b": 2 } ) ).toBe( false );
          } );

    test( "isMap( {'a':1,'b':2 }, false ) ) === true",
          () =>
          {
              expect( typeUtils.isMap( { "a": 1, "b": 2 }, false ) ).toBe( true );
          } );

// in non-strict mode, we still expect map keys to be strings
    test( "isMap( { [objKey]: 1 }, false ) ) === false",
          () =>
          {
              const objKey = {};
              expect( typeUtils.isMap( { [objKey]: 1 }, false ) ).toBe( false );
          } );

// any key other than an Object becomes a string when it defines a property of an Object
    test( "isMap( {{ [boolKey]: 1}, false ) ) === true",
          () =>
          {
              const boolKey = true;
              expect( typeUtils.isMap( { [boolKey]: 1 }, false ) ).toBe( true );
          } );

} );

describe( "isSet", () =>
{
// Maps are not Sets
    test( "isSet( new Map() ) ) === false",
          () =>
          {
              expect( typeUtils.isSet( new Map() ) ).toBe( false );
          } );

    test( "isSet( new Map(), false ) ) === false",
          () =>
          {
              expect( typeUtils.isSet( new Map(), false ) ).toBe( false );
          } );

    test( "isSet( {'a':1,'b':2 } ) ) === false",
          () =>
          {
              expect( typeUtils.isSet( { "a": 1, "b": 2 } ) ).toBe( false );
          } );

    test( "isSet( new Set() ) === true",
          () =>
          {
              expect( typeUtils.isSet( new Set() ) ).toBe( true );
          } );

// in strict mode, only instances of Set are considered a Set
    test( "isSet([1,2,3]) === false",
          () =>
          {
              expect( typeUtils.isSet( [1, 2, 3] ) ).toBe( false );
          } );

// in lax mode, any Array-like object whose values are unique is a Set
    test( "isSet([1,2,3], false) === true",
          () =>
          {
              expect( typeUtils.isSet( [1, 2, 3], false ) ).toBe( true );
          } );

// elements have to be unique, though
    test( "isSet([1,2,3,2], false) === false",
          () =>
          {
              expect( typeUtils.isSet( [1, 2, 3, 2], false ) ).toBe( false );
          } );

// even a String can be a 'set of characters' if the characters are unique
    test( "isSet('abc', false) === true",
          () =>
          {
              expect( typeUtils.isSet( "abc", false ) ).toBe( true );
          } );

// a string is a set of characters if and only if the characters are unique
    test( "isSet('abcb', false) === false",
          () =>
          {
              expect( typeUtils.isSet( "abcb", false ) ).toBe( false );
          } );
} );

describe( "isDate", () =>
{
    test( "isDate('abc') === false",
          () =>
          {
              expect( typeUtils.isDate( "abc" ) ).toBe( false );
          } );

    test( "isDate(new Date()) === true",
          () =>
          {
              expect( typeUtils.isDate( new Date() ) ).toBe( true );
          } );

    test( "isDate(now, false) === true",
          () =>
          {
              let date = Date.now();
              expect( typeUtils.isDate( date, false ) ).toBe( true );
          } );

// Date.now() returns a number; in strict mode, a number is NOT a date
    test( "isDate(now) === false",
          () =>
          {
              let date = Date.now();
              expect( typeUtils.isDate( date ) ).toBe( false );
          } );

// strings that can be parsed as a date are Dates in lax mode
    test( "isDate('09/12/2024', false) === true",
          () =>
          {
              let dateString = "09/12/2024";
              expect( typeUtils.isDate( dateString, false ) ).toBe( true );
          } );

// but not in strict mode
    test( "isDate('09/12/2024') === false",
          () =>
          {
              let dateString = "09/12/2024";
              expect( typeUtils.isDate( dateString ) ).toBe( false );
          } );
} );

describe( "isRegExp", () =>
{
// default is strict mode and returns true only if the argument is an instanceof RegExp
    test( "isRegExp( rx ) === true",
          () =>
          {
              let rx = /^a/g;
              expect( typeUtils.isRegExp( rx ) ).toBe( true );
          } );

// in strict mode, strings that may be RegExp patterns are stoll not considered to a RegExp
    test( "isRegExp( '/^a/g' ) === false",
          () =>
          {
              let rx = "/^a/g";
              expect( typeUtils.isRegExp( rx ) ).toBe( false );
          } );

// in lax mode, a properly formed regular expression pattern is considered a RegExp
    test( "isRegExp( '/^a/g', false ) === true",
          () =>
          {
              let rx = "/^a/g";
              expect( typeUtils.isRegExp( rx, false ) ).toBe( true );
          } );

// but not strings that cannot be interpreted as a valid RegExp
    test( "isRegExp( '/^a((/g', false ) === false",
          () =>
          {
              let rx = "/^a((/g";
              expect( typeUtils.isRegExp( rx, false ) ).toBe( false );
          } );
} );

describe( "isClass", () =>
{
    test( "isClass(A) === true",
          () =>
          {
              let obj = A;
              expect( typeUtils.isClass( obj ) ).toBe( true );
          } );

    test( "isClass(new A()) === false",
          () =>
          {
              let obj = new A();
              expect( typeUtils.isClass( obj ) ).toBe( false );
          } );

// in strict mode, built-in 'classes' are NOT classes
    test( "isClass(Array) === false",
          () =>
          {
              expect( typeUtils.isClass( Array ) ).toBe( false );
          } );

// in lax mode, built-in 'classes' ARE classes
    test( "isClass(Array, false) === true",
          () =>
          {
              expect( typeUtils.isClass( Array, false ) ).toBe( true );
          } );
} );

describe( "instanceOfAny", () =>
{
    test( "instanceOfAny returns true if the object is an instance of one of the classes specified",
          () =>
          {
              const a = new A();
              expect( typeUtils.instanceOfAny( a, A ) ).toBe( true );
          } );

    test( "instanceOfAny returns false if the object is an instance of the base class of the classes specified",
          () =>
          {
              const a = new A();
              expect( typeUtils.instanceOfAny( a, B, C ) ).toBe( false );
          } );

    test( "instanceOfAny returns true if the object is an instance of a subclass of one of the classes specified",
          () =>
          {
              const c = new C();
              expect( typeUtils.instanceOfAny( c, A, B ) ).toBe( true );
          } );

    test( "instanceOfAny returns true if the object is an instance of a built-in class",
          () =>
          {
              const obj = {};
              expect( typeUtils.instanceOfAny( obj, Object, Function ) ).toBe( true );
          } );
} );

describe( "isUserDefinedClass", () =>
{
    test( "isUserDefinedClass returns false if the object is a built-in class",
          () =>
          {
              expect( typeUtils.isUserDefinedClass( Array ) ).toBe( false );
          } );

    test( "isUserDefinedClass returns true if the object a user-defined class",
          () =>
          {
              expect( typeUtils.isUserDefinedClass( B ) ).toBe( true );
          } );
} );

describe( "isListedClass", () =>
{
    test( "isListedClass returns true if the object is one of the classes specified",
          () =>
          {
              expect( typeUtils.isListedClass( C, C ) ).toBe( true );
          } );

    test( "isListedClass returns true if the object is one of the classes specified or a subclass of one of the classes",
          () =>
          {
              expect( typeUtils.isListedClass( C, A ) ).toBe( true );
          } );

    test( "isListedClass returns false if the object is not one of the classes specified",
          () =>
          {
              expect( typeUtils.isListedClass( Object, C, B, A ) ).toBe( false );
          } );
} );

describe( "isInstanceOfUserDefinedClass", () =>
{
    test( "isInstanceOfUserDefinedClass returns true if the object is an instance of one of the classes specified",
          () =>
          {
              const a = new A();
              expect( typeUtils.isInstanceOfUserDefinedClass( a, A ) ).toBe( true );
          } );

    test( "isInstanceOfUserDefinedClass returns true if the object is an instance of a subclass of one of the classes specified",
          () =>
          {
              const c = new C();
              expect( typeUtils.isInstanceOfUserDefinedClass( c, A ) ).toBe( true );
          } );

    test( "isInstanceOfUserDefinedClass returns false if the object is not an instance of a subclass of one of the classes specified",
          () =>
          {
              const a = new A();
              expect( typeUtils.isInstanceOfUserDefinedClass( a, B ) ).toBe( false );
          } );

    test( "isInstanceOfUserDefinedClass returns true if the object is an instance of a user defined class",
          () =>
          {
              const a = new A();
              expect( typeUtils.isInstanceOfUserDefinedClass( a ) ).toBe( true );
          } );
} );

describe( "isInstanceOfListedClass", () =>
{
    test( "isInstanceOfListedClass returns true if the object is an instance of one of the classes specified",
          () =>
          {
              expect( typeUtils.isInstanceOfListedClass( new C(), C ) ).toBe( true );
          } );

    test( "isInstanceOfListedClass returns true if the object is an instance of one of the classes specified or a subclass of one of the classes",
          () =>
          {
              expect( typeUtils.isInstanceOfListedClass( new C(), A ) ).toBe( true );
          } );

    test( "isInstanceOfListedClass returns false if the object is not one of the classes specified",
          () =>
          {
              expect( typeUtils.isInstanceOfListedClass( {}, C, B, A ) ).toBe( false );
          } );
} );

describe( "defaultFor", () =>
{
    test( "defaultFor( \"string\" ) === '' ",
          () =>
          {
              expect( typeUtils.defaultFor( "string" ) ).toEqual( "" );
          } );

    test( "defaultFor( \"number\" ) === 0 ",
          () =>
          {
              expect( typeUtils.defaultFor( "number" ) ).toEqual( 0 );
          } );

    test( "defaultFor( \"bigint\" ) === 0n ",
          () =>
          {
              expect( typeUtils.defaultFor( "bigint" ) ).toEqual( 0n );
          } );

    test( "defaultFor( \"boolean\" ) === false ",
          () =>
          {
              expect( typeUtils.defaultFor( "boolean" ) ).toEqual( false );
          } );

    test( "defaultFor( \"function\" ) === null ",
          () =>
          {
              expect( typeUtils.defaultFor( "function" ) ).toEqual( null );
          } );

    test( "defaultFor( \"object\" ) === null ",
          () =>
          {
              expect( typeUtils.defaultFor( "object" ) ).toEqual( null );
          } );

    test( "defaultFor( \"symbol\" ) === null ",
          () =>
          {
              expect( typeUtils.defaultFor( "symbol" ) ).toEqual( null );
          } );

    test( "defaultFor( \"undefined\" ) === null ",
          () =>
          {
              expect( typeUtils.defaultFor( "undefined" ) ).toEqual( undefined );
          } );
} );

describe( "getClass", () =>
{
    test( "getClass( new A() )",
          () =>
          {
              let a = new A();
              expect( typeUtils.getClass( a ) ).toBe( A );
          } );

    test( "getClass( A )",
          () =>
          {
              let a = A;
              expect( typeUtils.getClass( a ) ).toBe( A );
          } );

    test( "getClass( new C() )",
          () =>
          {
              let c = new C();
              expect( typeUtils.getClass( c ) ).toBe( C );
          } );

    test( "getClass( {} )",
          () =>
          {
              let a = {};
              expect( typeUtils.getClass( a ) ).toBe( Object );
          } );

    test( "getClass( new Date() )",
          () =>
          {
              let a = new Date();
              expect( typeUtils.getClass( a ) ).toBe( Date );
          } );

    test( "getClass( /abc+/g )",
          () =>
          {
              let a = /abc+/g;
              expect( typeUtils.getClass( a ) ).toBe( RegExp );
          } );

    test( "getClass( new String('a') )",
          () =>
          {
              let a = new String( "a" );
              expect( typeUtils.getClass( a ) ).toBe( String );
          } );

    test( "getClass( 'a' )",
          () =>
          {
              let a = "a";
              expect( typeUtils.getClass( a ) ).toBe( null );
          } );

} );

describe( "getClassName", () =>
{
    test( "getClassName( new A() )",
          () =>
          {
              let a = new A();
              expect( typeUtils.getClassName( a ) ).toBe( "A" );
          } );

    test( "getClassName( A )",
          () =>
          {
              let a = A;
              expect( typeUtils.getClassName( a ) ).toBe( "A" );
          } );

    test( "getClassName( new C() )",
          () =>
          {
              let c = new C();
              expect( typeUtils.getClassName( c ) ).toBe( "C" );
          } );

    test( "getClassName( {} )",
          () =>
          {
              let a = {};
              expect( typeUtils.getClassName( a ) ).toBe( "Object" );
          } );

    test( "getClassName( new Date() )",
          () =>
          {
              let a = new Date();
              expect( typeUtils.getClassName( a ) ).toBe( "Date" );
          } );

    test( "getClassName( /abc+/g )",
          () =>
          {
              let a = /abc+/g;
              expect( typeUtils.getClassName( a ) ).toBe( "RegExp" );
          } );

    test( "getClassName( new String('a') )",
          () =>
          {
              let a = new String( "a" );
              expect( typeUtils.getClassName( a ) ).toBe( "String" );
          } );

    test( "getClassName( 'a' )",
          () =>
          {
              let a = "a";
              expect( typeUtils.getClassName( a ) ).toEqual( "" );
          } );
} );

describe( "toIterable", () =>
{
    const toIterable = typeUtils.toIterable;

    test( "toIterable( array )",
          () =>
          {
              let arr = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

              let iterator = toIterable( arr );

              let i = 0;

              for( let value of iterator )
              {
                  expect( value ).toEqual( arr[i++] );
              }

              expect( iterator.next() ).toEqual( { done: true } );

              expect( iterator.previous() ).toEqual( { done: false, value: 10 } );

              iterator.reset();

              i = 0;

              for( let value of iterator )
              {
                  expect( value ).toEqual( arr[i++] );
              }

              iterator = iterator.reverseIterator();

              i = 10;

              for( let value of iterator )
              {
                  expect( value ).toEqual( arr[i--] );
              }
          } );

    test( "toIterable( string )",
          () =>
          {
              let arr = "0123456789";

              let iterator = toIterable( arr );

              let i = 0;

              for( let value of iterator )
              {
                  expect( value ).toEqual( arr[i++] );
              }

              expect( iterator.next() ).toEqual( { done: true } );

              expect( iterator.previous() ).toEqual( { done: false, value: "9" } );

              iterator.reset();

              i = 0;

              for( let value of iterator )
              {
                  expect( value ).toEqual( arr[i++] );
              }

              iterator = iterator.reverseIterator();

              i = 9;

              for( let value of iterator )
              {
                  expect( value ).toEqual( arr[i--] );
              }
          } );

    test( "toIterable( object )",
          () =>
          {
              let object = { a: 1, b: 2, c: { d: 4 } };

              let iterator = toIterable( object );

              let letters = ["a", "b", "c"];

              let i = 0;

              for( let value of iterator )
              {
                  expect( value[0] ).toEqual( letters[i++] );

                  for( let val of value[1] )
                  {
                      if ( typeUtils.isIterable( val ) )
                      {
                          expect( val[0] ).toEqual( "d" );
                          expect( val[1].next() ).toEqual( { done: false, value: 4 } );
                      }
                      else
                      {
                          expect( object[value[0]] ).toEqual( val );
                      }
                  }
              }

              expect( iterator.next() ).toEqual( { done: true } );
          } );

} );

describe( "firstMatchingType", () =>
{
    const firstMatchingType = typeUtils.firstMatchingType;

    test( "firstMatchingType( string, ['a',2,false,'b'] )",
          () =>
          {
              expect( firstMatchingType( "string", ["a", 2, false, "b"] ) ).toEqual( "a" );
          } );

    test( "firstMatchingType( number, ['a',2,false,'b'] )",
          () =>
          {
              expect( firstMatchingType( "number", ["a", 2, false, "b"] ) ).toEqual( 2 );
          } );

    test( "firstMatchingType( boolean, ['a',2,false,'b'] )",
          () =>
          {
              expect( firstMatchingType( "boolean", ["a", 2, false, "b"] ) ).toEqual( false );
          } );

    test( "firstMatchingType( object, ['a',2,false,'b'] )",
          () =>
          {
              expect( firstMatchingType( "object", ["a", 2, false, "b"] ) ).toEqual( null );
          } );

    test( "firstMatchingType( A, [new A(), new B(), new C()] )",
          () =>
          {
              const a = new A();
              const b = new B();
              const c = new C();
              expect( firstMatchingType( A, [a, b, c] ) ).toEqual( a );
          } );

    test( "firstMatchingType( A, [new C(), new B(), new A()] )",
          () =>
          {
              const a = new A();
              const b = new B();
              const c = new C();
              expect( firstMatchingType( A, [c, b, a] ) ).toEqual( c );
          } );

    test( "firstMatchingType( B, [new A(), new B(), new C()] )",
          () =>
          {
              const a = new A();
              const b = new B();
              const c = new C();
              expect( firstMatchingType( B, [a, b, c] ) ).toEqual( b );
          } );
} );
