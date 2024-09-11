// no need to require jest here... run this test from the console using 'npx jest'
// let jester = require( "jest" );
// jester.run( __filename );

/** import the utilities to test **/
const typeUtils = require( "../utils/TypeUtils.js" );

let VALID_TYPES = typeUtils.VALID_TYPES;
let JS_TYPES = typeUtils.JS_TYPES;

const anAsyncFunction = async function()
{
    await console.log( "When I get around to it..." );
};

class A
{
    constructor()
    {

    }

    doSomething()
    {
        console.log( "I did it!" );
    }

    makeFunction()
    {
        return function()
        {
            console.log( "A function that returns a function?!  What will they think of next?!!" );
        };
    }

    static doNothing()
    {
        console.log( "\"I didn't do it.  No one saw me do it.  You can't prove anything\" -- Bart Simpson" );
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

test( "isNumeric('123') === true",
      () =>
      {
          expect( typeUtils.isNumeric( "123" ) ).toBe( true );
      } );
