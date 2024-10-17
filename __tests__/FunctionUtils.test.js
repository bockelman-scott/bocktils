const funcUtils = require( "../src/FunctionUtils.cjs" );

const constants = funcUtils?.dependencies?.constants || require( "../src/Constants.cjs" );
const typeUtils = funcUtils?.dependencies?.typeUtils || require( "../src/TypeUtils.cjs" );
const stringUtils = funcUtils?.dependencies?.stringUtils || require( "../src/StringUtils.cjs" );
const arrayUtils = funcUtils?.dependencies?.arrayUtils || require( "../src/ArrayUtils.cjs" );
const objectUtils = funcUtils?.dependencies?.objectUtils || require( "../src/ObjectUtils.cjs" );

class A
{
    #id;

    constructor( id )
    {
        this.#id = id;
    }

    get id()
    {
        return this.#id;
    }

    print()
    {
        console.log( this.id );
    }

    async divideBy( pDivisor )
    {
        return this.id / pDivisor;
    }
}

class B extends A
{
    #name;

    constructor( id, name )
    {
        super( id );

        this.#name = name;
    }

    get name()
    {
        return this.#name;
    }

    say()
    {
        console.log( this.name, "is", this.id );
    }

    multiplyBy( pMultiplier )
    {
        return this.id * pMultiplier;
    }
}

const add = function( a, b, c )
{
    return a + b + c;
};

const divide = function( a, b )
{
    if ( 0 !== b )
    {
        return a / b;
    }

    throw new Error( "Divide by Zero" );
};

const asyncDivide = async function( a, b )
{
    return divide( a, b );
};

const throwAnError = function()
{
    console.log( "throwAnError" );

    throw new Error( "Yikes" );
};

const asyncThrowAnError = async function()
{
    console.log( "asyncThrowAnError" );

    throw new Error( "Impending Doom" );
};

const doSomething = async function( pThing, pTimes, pCollector = [] )
{
    pCollector.push( `Starting ${pThing}` );

    let count = 0;

    let times = pTimes || 20_000_000_000;

    let msgs = [];

    for( let i = 0; i < times; i++ )
    {
        if ( count < 2 || ((count % 12_456_789) === 0) )
        {
            msgs.push( pThing + " count " + count );
        }

        count += 2;
    }

    pCollector.push( `Did ${pThing}` );

    return count;
};


test( "FunctionUtils implements 'partial'",
      () =>
      {
          expect( funcUtils.isImplemented( funcUtils, "partial", { includeStatic: true } ) ).toBe( true );
      } );


test( "FunctionUtil does not implement 'mytselplic'",
      () =>
      {
          expect( funcUtils.isImplemented( funcUtils, "mytselplic", { includeStatic: true } ) ).toBe( false );
      } );

test( "Class B implements 'print'",
      () =>
      {
          expect( funcUtils.isImplemented( B, "print" ) ).toBe( true );
      } );

test( "partial allows us to specialize a function",
      () =>
      {
          const sentenceMaker = function( pSubject, pVerb, pObject )
          {
              return pSubject + " " + pVerb + " " + pObject;
          };

          expect( sentenceMaker( "Dog", "bites", "man" ) ).toEqual( "Dog bites man" );

          const curried = funcUtils.partial( sentenceMaker, "Man" );
          const another = funcUtils.partial( sentenceMaker, "Boy" );

          expect( curried( "bites", "dog" ) ).toEqual( "Man bites dog" );
          expect( another( "bites", "lip" ) ).toEqual( "Boy bites lip" );
      } );


test( "fireAndForget just executes without blocking",
      () =>
      {
          const messages = [];

          messages.push( "Beginning fireAndForget test" );

          funcUtils.fireAndForget( doSomething, "it", 100_000_000, messages );

          messages.push( "fired it off" );

          funcUtils.fireAndForget( throwAnError );

          messages.push( "ignored an error" );

          funcUtils.fireAndForget( doSomething, "that", 20, messages );

          messages.push( "fired that off" );

          funcUtils.fireAndForget( asyncThrowAnError );

          messages.push( "ignored another error" );

          expect( messages ).toEqual( ["Beginning fireAndForget test",
                                       "fired it off",
                                       "ignored an error",
                                       "fired that off",
                                       "ignored another error"] );
      } );


test( "attempt let's us execute a function and ignore errors",
      () =>
      {
          const { returnValue, exceptions } = funcUtils.attempt( throwAnError );
          expect( exceptions.length ).toEqual( 1 );
      } );

test( "attempt let's us execute a function",
      () =>
      {
          const { returnValue, exceptions } = funcUtils.attempt( add, 10, 20, 30 );
          expect( exceptions.length ).toEqual( 0 );
          expect( returnValue ).toEqual( 60 );
      } );

test( "attempt let's us check for exceptions when we execute a function",
      () =>
      {
          const { returnValue, exceptions } = funcUtils.attempt( divide, 10, 0 );
          expect( exceptions.length ).toEqual( 1 );
          expect( returnValue ).toEqual( null );

          let result = funcUtils.attempt( divide, 10, 2 );
          expect( result.returnValue ).toEqual( 5 );
      } );

test( "attemptAsync let's us check for exceptions when we execute a function",
      async() =>
      {
          const { returnValue, exceptions } = await funcUtils.attemptAsync( asyncDivide, 10, 0 );
          expect( exceptions.length ).toEqual( 1 );
          expect( returnValue ).toEqual( null );

          let result = await funcUtils.attemptAsync( asyncDivide, 10, 2 );
          expect( result.returnValue ).toEqual( 5 );
      } );

test( "attemptAsync can execute a synchronous function",
      async() =>
      {
          const { returnValue, exceptions } = await funcUtils.attemptAsync( divide, 10, 0 );
          expect( exceptions.length ).toEqual( 1 );
          expect( returnValue ).toEqual( null );

          let result = await funcUtils.attemptAsync( divide, 10, 2 );
          expect( result.returnValue ).toEqual( 5 );
      } );

test( "attemptMethod let's us execute a method by name",
      () =>
      {
          const a = new A( 10 );
          const b = new B( 11 );

          let result = funcUtils.attemptMethod( b, "multiplyBy", 2 );

          expect( result.returnValue ).toEqual( 22 );

          result = funcUtils.attemptMethod( b, b.multiplyBy, 3 );

          expect( result.returnValue ).toEqual( 33 );
      } );

test( "attemptMethod let's us execute a method by name",
      async() =>
      {
          const a = new A( 10 );
          const b = new B( 11 );

          let result = await funcUtils.attemptAsyncMethod( a, "divideBy", 2 );

          expect( result.returnValue ).toEqual( 5 );

          result = await funcUtils.attemptAsyncMethod( a, a.divideBy, 5 );

          expect( result.returnValue ).toEqual( 2 );
      } );

test( "asAttempt wraps a function in attempt semantics",
      () =>
      {
          const attemptDivide = funcUtils.asAttempt( divide );

          expect( attemptDivide( 10, 5 )?.returnValue ).toEqual( 2 );
          expect( attemptDivide( 10, 0 )?.returnValue ).toEqual( null );
          expect( attemptDivide( 10, 0 )?.exceptions?.length ).toEqual( 1 );

          expect( divide( 10, 5 ) ).toEqual( 2 );

          const errorFunc = function()
          {
              return divide( 10, 0 );
          };

          expect( errorFunc ).toThrow( "Divide by Zero" );
      } );

test( "asAttempt wraps an asynchronous function in attempt semantics",
      async() =>
      {
          const attemptDivide = funcUtils.asAttempt( asyncDivide );

          expect( (await attemptDivide( 10, 5 ))?.returnValue ).toEqual( 2 );
          expect( (await attemptDivide( 10, 0 ))?.returnValue ).toEqual( null );
          expect( (await attemptDivide( 10, 0 ))?.exceptions?.length ).toEqual( 1 );

          expect( await asyncDivide( 10, 5 ) ).toEqual( 2 );
      } );

