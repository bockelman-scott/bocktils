const logUtils = require( "@toolbocks/logging" );

const requestFactoryUtils = require( "../server/src/handler/RequestHandlerFactory.cjs" );

const { SimpleLogger } = logUtils;

const
    {
        Dependency,
        Dependencies,
        RequestHandler,
        RequestHandlerFactory,
        PathHandlerFactory,
        RouteHandlersFactory
    } = requestFactoryUtils;


describe( "Can construct a Dependency", () =>
{
    test( "Construct a Logger Dependency",
          () =>
          {
              const logger = new SimpleLogger( console );
              const dependency = new Dependency( 1, "Logger", logger );

              expect( dependency.id ).toEqual( 1 );
              expect( dependency.name ).toEqual( "Logger" );
              expect( dependency.component instanceof SimpleLogger ).toBe( true );
          } );

    test( "Construct a Dependencies collection object",
          () =>
          {
              const logger = new SimpleLogger( console );
              const loggerDependency = new Dependency( 1, "Logger", logger );
              const anotherDependency = new Dependency( 2, "AnotherLogger", logger );

              const dependencies = new Dependencies( loggerDependency, anotherDependency );

              expect( dependencies ).not.toBe( null );
              expect( dependencies.getDependency( 1 ) instanceof Dependency ).toBe( true );
              expect( dependencies.getDependency( "Logger" ) instanceof Dependency ).toBe( true );
              expect( dependencies.getDependency( 2 ) instanceof Dependency ).toBe( true );
              expect( dependencies.getDependency( "AnotherLogger" ) instanceof Dependency ).toBe( true );

              expect( dependencies.getDependency( 2 ).component ).toEqual( logger );
              expect( dependencies.getDependency( "AnotherLogger" ).component ).toEqual( logger );

              let aLogger = dependencies.getDependency( "AnotherLogger" ).component;
              aLogger.log( "Test" );
          } );
} );

describe( "RequestHandler and RequestHandlerFactory", () =>
{
    class SomeHandler extends RequestHandler
    {
        constructor( pDependencies, pOptions )
        {
            super( pDependencies, pOptions );
        }

        async handleRequest( pRequest, pResponse, pNext )
        {
            const logger = this.dependencies.getComponent( "Logger" );

            logger.log( "From the Handler" );

            return 7;
        }
    }

    test( "Construct a RequestHandler",
          async() =>
          {
              const logger = new SimpleLogger( console );
              const loggerDependency = new Dependency( 1, "Logger", logger );
              const anotherDependency = new Dependency( 2, "AnotherLogger", logger );

              const dependencies = new Dependencies( loggerDependency, anotherDependency );

              const requestHandler = new SomeHandler( dependencies, {} );

              const result = await requestHandler.handleRequest( {}, {} );

              expect( result ).toEqual( 7 );
          } );

    test( "Construct a RequestHandlerFactory",
          async() =>
          {
              const logger = new SimpleLogger( console );
              const loggerDependency = new Dependency( 1, "Logger", logger );
              const anotherDependency = new Dependency( 2, "AnotherLogger", logger );

              const dependencies = new Dependencies( loggerDependency, anotherDependency );

              const factory = new RequestHandlerFactory( SomeHandler, dependencies, {} );

              let result = await factory.handleRequest( {}, {} );

              expect( result ).toEqual( 7 );

              expect( factory.handler ).not.toBe( null );

              result = await factory.handler.handleRequest( {}, {} );

              expect( result ).toEqual( 7 );


              const anotherFactory = new RequestHandlerFactory( new SomeHandler( dependencies ) );

              result = await anotherFactory.handleRequest( {}, {} );

              expect( result ).toEqual( 7 );

              expect( anotherFactory.handler ).not.toBe( null );

              result = await anotherFactory.handler.handleRequest( {}, {} );

              expect( result ).toEqual( 7 );

          } );
} );

describe( "PathHandlerFactory and RouteHandlerFactory", () =>
{
    class SomeHandler extends RequestHandler
    {
        constructor( pDependencies, pOptions )
        {
            super( pDependencies, pOptions );
        }

        async handleRequest( pRequest, pResponse, pNext )
        {
            const logger = this.dependencies.getComponent( "Logger" );

            logger.log( "From some Handler" );

            return 7;
        }
    }

    class AnotherHandler extends RequestHandler
    {
        constructor( pDependencies, pOptions )
        {
            super( pDependencies, pOptions );
        }

        async handleRequest( pRequest, pResponse, pNext )
        {
            const logger = this.dependencies.getComponent( "Logger" );

            logger.log( "From another Handler" );

            return 17;
        }
    }

    class YetAnotherHandler extends RequestHandler
    {
        constructor( pDependencies, pOptions )
        {
            super( pDependencies, pOptions );
        }

        async handleRequest( pRequest, pResponse, pNext )
        {
            const logger = this.dependencies.getComponent( "Logger" );

            logger.log( "From yet another Handler" );

            return 23;
        }
    }

    test( "Construct a PathFactory",
          async() =>
          {
              const logger = new SimpleLogger( console );

              const loggerDependency = new Dependency( 1, "Logger", logger );
              const anotherDependency = new Dependency( 2, "AnotherLogger", logger );

              const dependencies = new Dependencies( loggerDependency, anotherDependency );

              const someHandler = new SomeHandler( dependencies, {} );
              const anotherHandler = new AnotherHandler( dependencies, {} );
              const yetAnotherHandler = new YetAnotherHandler( dependencies, {} );

              const somePathHandlerFactory = new PathHandlerFactory( "/some", someHandler );
              const anotherPathHandlerFactory = new PathHandlerFactory( "/another", anotherHandler );
              const yetAnotherPathHandlerFactory = new PathHandlerFactory( "/yet", yetAnotherHandler );

              expect( somePathHandlerFactory.path ).toEqual( "/some" );
              expect( anotherPathHandlerFactory.path ).toEqual( "/another" );
              expect( yetAnotherPathHandlerFactory.path ).toEqual( "/yet" );

              let result = await somePathHandlerFactory.handleRequest( {}, {} );
              expect( result ).toEqual( 7 );

              result = await anotherPathHandlerFactory.handleRequest( {}, {} );
              expect( result ).toEqual( 17 );

              result = await yetAnotherPathHandlerFactory.handleRequest( {}, {} );
              expect( result ).toEqual( 23 );

          } );

    test( "Construct a RouteHandlersFactory",
          async() =>
          {
              const logger = new SimpleLogger( console );

              const loggerDependency = new Dependency( 1, "Logger", logger );
              const anotherDependency = new Dependency( 2, "AnotherLogger", logger );

              const dependencies = new Dependencies( loggerDependency, anotherDependency );

              const someHandler = new SomeHandler( dependencies, {} );
              const anotherHandler = new AnotherHandler( dependencies, {} );
              const yetAnotherHandler = new YetAnotherHandler( dependencies, {} );

              const somePathHandlerFactory = new PathHandlerFactory( "/some", someHandler );
              const anotherPathHandlerFactory = new PathHandlerFactory( "/another", anotherHandler );
              const yetAnotherPathHandlerFactory = new PathHandlerFactory( "/yet", yetAnotherHandler );

              const routeHandlersFactory = new RouteHandlersFactory( somePathHandlerFactory, anotherPathHandlerFactory, yetAnotherPathHandlerFactory );

              const handlerFunction = routeHandlersFactory.getHandlerFunction( "/another" );

              const result = await handlerFunction( {}, {});

              expect( result ).toEqual( 17 );

          } );
} );
