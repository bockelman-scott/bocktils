// no need to require jest here... run this test from the console using 'npx jest'
// let jester = require( "jest" );
// jester.run( __filename );
const eventUtils = require( "../src/EventUtils.cjs" );

const constants = eventUtils.dependencies.constants || require( "../src/Constants.cjs" );
const typeUtils = eventUtils.dependencies.typeUtils || require( "../src/TypeUtils.cjs" );
const stringUtils = eventUtils.dependencies.stringUtils || require( "../src/StringUtils.cjs" );

Object.assign( this, constants );
Object.assign( this, typeUtils );
Object.assign( this, stringUtils );
Object.assign( this, eventUtils );

const obj =
    {
        onSomething: function( pEvt )
        {
            if ( pEvt?.type === "something" )
            {
                console.log( pEvt.type, "happened" );
            }
        }
    };

const func = function( pEvt )
{
    if ( pEvt?.type === "something" )
    {
        console.log( pEvt.type, "happened" );
    }
};

describe( "resolveEventName", () =>
{
    test( "resolveEventName( 'onError' ) === 'Error'",
          () =>
          {
              const eventName = eventUtils.resolveEventName( "onError" );

              expect( eventName ).toEqual( "Error" );
          } );

    test( "resolveEventName( 'error' ) === 'error'",
          () =>
          {
              const eventName = eventUtils.resolveEventName( "error" );

              expect( eventName ).toEqual( "error" );
          } );

    test( "resolveEventName( 'onError', true ) === 'error'",
          () =>
          {
              const eventName = eventUtils.resolveEventName( "onError", true );

              expect( eventName ).toEqual( "error" );
          } );

    test( "resolveEventName( '' ) === 'error'",
          () =>
          {
              const eventName = eventUtils.resolveEventName( "" );

              expect( eventName ).toEqual( "error" );
          } );

    test( "resolveEventName() === 'error'",
          () =>
          {
              const eventName = eventUtils.resolveEventName();

              expect( eventName ).toEqual( "error" );
          } );
} );

describe( "resolveHandler", () =>
{
    test( "resolveHandler( object with method )",
          () =>
          {
              const handler = eventUtils.resolveHandler( obj, "something" );

              expect( handler ).toEqual( obj );
          } );

    test( "resolveHandler( function )",
          () =>
          {
              const handler = eventUtils.resolveHandler( func, "something" );

              expect( handler ).toEqual( func );
          } );
} );

describe( "canHandler", () =>
{
    test( "canHandle( object with method )",
          () =>
          {
              expect( eventUtils.canHandle( obj, "something" ) ).toBe( true );
          } );

    test( "canHandle( function )",
          () =>
          {
              expect( eventUtils.canHandle( func, "something" ) ).toBe( true );
          } );

    test( "canHandle( object without appropriate method )",
          () =>
          {
              expect( eventUtils.canHandle( obj, "somethingElse" ) ).toBe( false );
          } );

    // testing for a function is pointless, as any function taking at least one argument will be considered a valid handler
} );

describe( "buildHandler", () =>
{
    test( "buildHandler( object with method )",
          () =>
          {
              const handler = eventUtils.buildHandler( obj, "something" );

              expect( typeof handler ).toEqual( "function" );
              expect( handler?.length ).toEqual( 2 );
          } );

    test( "buildHandler( function )",
          () =>
          {
              const handler = eventUtils.buildHandler( func, "something" );

              expect( typeof handler ).toEqual( "function" );
              expect( handler?.length ).toEqual( 2 );
          } );

    test( "buildHandler( not-a-handler )",
          () =>
          {
              const nonHandler = {};

              const handler = eventUtils.buildHandler( nonHandler, "something" );

              expect( typeof handler ).toEqual( "function" );
              expect( handler?.length ).toEqual( 2 );
              expect( stringUtils.asString( handler, false,
                                            {
                                                omitFunctions: false,
                                                returnFunctionSource: true
                                            } ).includes( "No handler found for" ) ).toBe( true );
          } );
} );

describe( "generateHandlerOptions", () =>
{
    test( "generateHandlerOptions (no overrides)",
          () =>
          {
              const options = eventUtils.generateHandlerOptions();

              expect( options ).toEqual( {
                                             capture: false,
                                             bubbles: true,
                                             passive: false,
                                             once: false,
                                             signal: null
                                         } );
          } );

    test( "generateHandlerOptions (with capture)",
          () =>
          {
              const options = eventUtils.generateHandlerOptions( true );

              expect( options ).toEqual( {
                                             capture: true,
                                             bubbles: true,
                                             passive: false,
                                             once: false,
                                             signal: null
                                         } );
          } );

    test( "generateHandlerOptions (for one-time handler)",
          () =>
          {
              const options = eventUtils.generateHandlerOptions( false, true );

              expect( options ).toEqual( {
                                             capture: false,
                                             bubbles: true,
                                             passive: false,
                                             once: true,
                                             signal: null
                                         } );
          } );

    test( "generateHandlerOptions (with abort signal)",
          () =>
          {
              const abortController = eventUtils.generateAbortController();
              const abortSignal = abortController.signal;

              const options = eventUtils.generateHandlerOptions( false, false, false, abortSignal );

              expect( options.signal ).toBe( abortSignal );
          } );

    test( "generateCancelableHandlerOptions",
          () =>
          {
              const options = eventUtils.generateCancelableHandlerOptions();

              expect( options.signal instanceof AbortSignal ).toBe( true );
          } );

} );

describe( "generateAbortController", () =>
{
    test( "generateAbortController without an onAbort function",
          () =>
          {
              const { controller, signal } = eventUtils.generateAbortController();

              expect( controller instanceof AbortController ).toBe( true );
              expect( signal instanceof AbortSignal ).toBe( true );
          } );

    test( "generateAbortController with proof of removed handler",
          () =>
          {
              let calledCount = 0;

              const { controller, signal } = eventUtils.generateAbortController();

              expect( controller instanceof AbortController ).toBe( true );
              expect( signal instanceof AbortSignal ).toBe( true );

              const dispatcher = new eventUtils.Dispatcher();

              const abortingFunction = function( pEvt, pData )
              {
                  calledCount++;

                  // console.log( "Aborting handler called with data:", pData || pEvt?.details );

                  controller.abort();
              };

              dispatcher.addEventListener( "something", abortingFunction, { signal: signal } );

              dispatcher.dispatch( "something", 123 );

              expect( calledCount ).toEqual( 1 );

              expect( signal.aborted ).toBe( true );

              dispatcher.dispatch( "something", 456 );

              expect( calledCount ).toEqual( 1 );

          } );
} );

describe( "generateCancelableHandlerOptions", () =>
{
    test( "generateCancelableHandlerOptions without an onAbort function",
          () =>
          {
              const options = eventUtils.generateCancelableHandlerOptions();

              const obj =
                  {
                      a: 1,
                      b: 2,
                      handleSomething: function( pEvt, pData )
                      {
                          this.a = this.a + 1;
                          this.b++;

                          let data = pData || pEvt.detail;

                          if ( data?.__abortController instanceof AbortController )
                          {
                              this.abortEvent( pEvt, pData );
                          }
                      }
                  };

              const dispatcher = new eventUtils.Dispatcher( options, obj );

              obj.addEventListener( "something", obj.handleSomething, options );

              dispatcher.dispatch( "something", 123 );

              expect( obj.a ).toEqual( 2 );
              expect( obj.b ).toEqual( 3 );

              dispatcher.dispatch( "something", 123 );

              expect( obj.a ).toEqual( 2 );
              expect( obj.b ).toEqual( 3 );
          } );
} );

describe( "generateCancelableHandlerOptions", () =>
{
    test( "generateCancelableHandlerOptions without an onAbort function",
          () =>
          {
          } );
} );
