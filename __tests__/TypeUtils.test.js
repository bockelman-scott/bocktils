// no need to require jest here... run this test from the console using 'npx jest'
// let jester = require( "jest" );
// jester.run( __filename );

/** import the utilities to test **/
const typeUtils = require( "../src/TypeUtils.cjs" );

let VALID_TYPES = typeUtils.VALID_TYPES;
let JS_TYPES = typeUtils.JS_TYPES;

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

test( "VALID_TYPES.includes('string') && VALID_TYPES.includes('number') && VALID_TYPES.includes('bigint') && VALID_TYPES.includes('object') && VALID_TYPES.includes('function') && VALID_TYPES.includes('symbol') && VALID_TYPES.includes('boolean') && VALID_TYPES.length === 7",
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


test( "JS_TYPES.includes('string') && JS_TYPES.includes('number') && JS_TYPES.includes('bigint') && JS_TYPES.includes('object') && JS_TYPES.includes('function') && JS_TYPES.includes('symbol') && JS_TYPES.includes('boolean') && JS_TYPES.includes('undefined') && JS_TYPES.length === 8",
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
      } );

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

test( "isClass(C) === true",
      () =>
      {
          let obj = C;
          expect( typeUtils.isClass( obj ) ).toBe( true );
      } );


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

        if ( !(/^0/.test( octString ) || /^-0/.test( octString )) )
        {
            octString = (octString.startsWith( "-" ) ? "-0" : "0") + octString.replace( /^-/, "" );
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

          valid = ["017", 10, 17, 34, 0.77, 77, 88.77, "xx", "0xx", "0xA", 0xF].filter( e => typeUtils.isOctal( e ) );
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
          expect( valid.length ).toEqual( 9 );

          valid = samples.map( e => ("" + (e) + "").trim() ).filter( e => typeUtils.isDecimal( e ) );
          expect( valid.length ).toEqual( 9 );
      } );


describe( "isInteger",
          () =>
          {
              test( "isInteger(0) === true",
                    () =>
                    {
                        expect( typeUtils.isInteger( 0 ) ).toBe( true );
                    } );
          } );


describe( "isFloat",
          () =>
          {
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
                        expect( typeUtils.toDecimal( 0xff ) ).toEqual( 255 );
                    } );

              test( "toDecimal('-0xFF') === -255",
                    () =>
                    {
                        expect( typeUtils.toDecimal( -0xff ) ).toEqual( -255 );
                    } );

              test( "toDecimal('111') === 111",
                    () =>
                    {
                        expect( typeUtils.toDecimal( 111 ) ).toEqual( 111 );
                    } );

              test( "toDecimal('-111') === -111",
                    () =>
                    {
                        expect( typeUtils.toDecimal( -111 ) ).toEqual( -111 );
                    } );

              test( "toDecimal('010') === 8",
                    () =>
                    {
                        expect( typeUtils.toDecimal( 0o10 ) ).toEqual( 8 );
                    } );

              test( "toDecimal('-010') === -8",
                    () =>
                    {
                        expect( typeUtils.toDecimal( -0o10 ) ).toEqual( -8 );
                    } );

              test( "toOctal('0xFF') === 0o377",
                    () =>
                    {
                        expect( typeUtils.toOctal( 0xff ) ).toEqual( "0o377" );
                    } );

              test( "toOctal('-0xFF') === -0o377",
                    () =>
                    {
                        expect( typeUtils.toOctal( -0xff ) ).toEqual( "-0o377" );
                    } );

              test( "toHex(255) === 0xff",
                    () =>
                    {
                        expect( typeUtils.toHex( 255 ) ).toEqual( "0xff" );
                    } );

              test( "toHex(-255) === -0xff",
                    () =>
                    {
                        expect( typeUtils.toHex( -255 ) ).toEqual( "-0xff" );
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

// isDefined is just an inversion of isUndefined, so only one trivial test is provided
test( "isDefined() === false",
      () =>
      {
          expect( typeUtils.isDefined() ).toBe( false );
      } );

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

test( "isNonNullObject({},true,{ allow_empty_object: true }) === true",
      () =>
      {
          expect( typeUtils.isNonNullObject( {}, true, { allow_empty_object: true } ) ).toBe( true );
      } );

test( "isNonNullObject({},true,{ allow_empty_object: false }) === false",
      () =>
      {
          expect( typeUtils.isNonNullObject( {}, true, { allow_empty_object: false } ) ).toBe( false );
      } );

test( "isNonNullObject({'a':null},true,{ allow_empty_object: false }) === false",
      () =>
      {
          expect( typeUtils.isNonNullObject( { "a": null }, true, { allow_empty_object: false } ) ).toBe( false );
      } );

test( "isNonNullObject({'a':1},true,{ allow_empty_object: false }) === true",
      () =>
      {
          expect( typeUtils.isNonNullObject( { "a": 1 }, true, { allow_empty_object: false } ) ).toBe( true );
      } );

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

test( "isFunction(Array.prototype[Symbol.iterator]) === true",
      () =>
      {
          expect( typeUtils.isFunction( Array.prototype[Symbol.iterator] ) ).toBe( true );
      } );

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

test( "isType(123,789) === false",
      () =>
      {
          expect( typeUtils.isType( 123, 789 ) ).toBe( true );
      } );

////
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

///\\\///
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

/////
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

