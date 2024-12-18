const core = require( "@toolbocks/core" );

const { constants, typeUtils, stringUtils } = core;

const eventUtils = require( "../src/EventUtils.cjs" );

const {
    Dispatcher,
    resolveEvent,
    resolveEventName,
    resolveEventData,
    resolveHandler,
    resolveOptions,
    hasHandlerMethod,
    canHandle,
    buildHandler,
    generateHandlerOptions,
    generateAbortController,
    generateCancelableHandlerOptions,
    replaceEventHandler,
    killEvent
} = eventUtils;

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
              const eventName = resolveEventName( "onError" );

              expect( eventName ).toEqual( "Error" );
          } );

    test( "resolveEventName( 'error' ) === 'error'",
          () =>
          {
              const eventName = resolveEventName( "error" );

              expect( eventName ).toEqual( "error" );
          } );

    test( "resolveEventName( 'onError', true ) === 'error'",
          () =>
          {
              const eventName = resolveEventName( "onError", true );

              expect( eventName ).toEqual( "error" );
          } );

    test( "resolveEventName( '' ) === 'error'",
          () =>
          {
              const eventName = resolveEventName( "" );

              expect( eventName ).toEqual( "error" );
          } );

    test( "resolveEventName() === 'error'",
          () =>
          {
              const eventName = resolveEventName();

              expect( eventName ).toEqual( "error" );
          } );
} );

describe( "resolveHandler", () =>
{
    test( "resolveHandler( object with method )",
          () =>
          {
              const handler = resolveHandler( obj, "something" );

              expect( handler ).toEqual( obj );
          } );

    test( "resolveHandler( function )",
          () =>
          {
              const handler = resolveHandler( func, "something" );

              expect( handler ).toEqual( func );
          } );
} );

describe( "canHandler", () =>
{
    test( "canHandle( object with method )",
          () =>
          {
              expect( canHandle( obj, "something" ) ).toBe( true );
          } );

    test( "canHandle( function )",
          () =>
          {
              expect( canHandle( func, "something" ) ).toBe( true );
          } );

    test( "canHandle( object without appropriate method )",
          () =>
          {
              expect( canHandle( obj, "somethingElse" ) ).toBe( false );
          } );

    // testing for a function is pointless, as any function taking at least one argument will be considered a valid handler
} );

describe( "buildHandler", () =>
{
    test( "buildHandler( object with method )",
          () =>
          {
              const handler = buildHandler( obj, "something" );

              expect( typeof handler ).toEqual( "function" );
              expect( handler?.length ).toEqual( 2 );
          } );

    test( "buildHandler( function )",
          () =>
          {
              const handler = buildHandler( func, "something" );

              expect( typeof handler ).toEqual( "function" );
              expect( handler?.length ).toEqual( 2 );
          } );

    test( "buildHandler( not-a-handler )",
          () =>
          {
              const nonHandler = {};

              const handler = buildHandler( nonHandler, "something" );

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
              const options = generateHandlerOptions();

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
              const options = generateHandlerOptions( true );

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
              const options = generateHandlerOptions( false, true );

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
              const abortController = generateAbortController();
              const abortSignal = abortController.signal;

              const options = generateHandlerOptions( false, false, false, abortSignal );

              expect( options.signal ).toBe( abortSignal );
          } );

    test( "generateCancelableHandlerOptions",
          () =>
          {
              const options = generateCancelableHandlerOptions();

              expect( options.signal instanceof AbortSignal ).toBe( true );
          } );

} );

describe( "generateAbortController", () =>
{
    test( "generateAbortController without an onAbort function",
          () =>
          {
              const { controller, signal } = generateAbortController();

              expect( controller instanceof AbortController ).toBe( true );
              expect( signal instanceof AbortSignal ).toBe( true );
          } );

    test( "generateAbortController with proof of removed handler",
          () =>
          {
              let calledCount = 0;

              const { controller, signal } = generateAbortController();

              expect( controller instanceof AbortController ).toBe( true );
              expect( signal instanceof AbortSignal ).toBe( true );

              const dispatcher = new Dispatcher();

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
              const options = generateCancelableHandlerOptions();

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

              const dispatcher = new Dispatcher( options, obj );

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
