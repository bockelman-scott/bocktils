// noinspection JSUnresolvedReference

const toolbocks = require( "@toolbocks/core" );

const { SimpleLogger } = require( "@toolbocks/logging" );

const { moduleUtils, constants, typeUtils } = toolbocks;

const { $ln } = moduleUtils;

const { getClassName } = typeUtils;

const depInjection = require( "@toolbocks/dep-injection" );

const {
    DEP_CONSTS,
    DEP_CONSTS_BY_ID,
    DependencyConstant,
    PublishedComponent,
    Dependency,
    Dependencies,
    DependencyRegistry
} = depInjection;

const TEST_DEPENDENCY_CONSTANT = new DependencyConstant( "logging.logger", "logger", "A logger thing" );

describe( "DependencyRegistry", () =>
{
    test( "Can Construct and initialize a DependencyRegistry", async() =>
    {
        let registry = new DependencyRegistry( new SimpleLogger( console ) );

        expect( registry ).not.toBe( null );

        expect( typeof registry ).toEqual( "object" );

        expect( getClassName( registry ) ).toEqual( "DependencyRegistry" );

        expect( registry.initialized ).toBe( false );

        registry = await registry.init();

        expect( registry ).not.toBe( null );

        expect( typeof registry ).toEqual( "object" );

        expect( getClassName( registry ) ).toEqual( "DependencyRegistry" );

        expect( registry.initialized ).toBe( true );
    } );

    test( "Can register dependencies", async() =>
    {
        let registry = new DependencyRegistry( new SimpleLogger( console ) );

        let publishedComponent = new PublishedComponent( TEST_DEPENDENCY_CONSTANT, "@toolbocks/logging", "SimpleLogger" );

        registry.register( publishedComponent );

        expect( $ln( registry.availableComponents ) ).toEqual( 1 );

        expect( registry.availableComponents.includes( DEP_CONSTS_BY_ID.get( "logging.logger" ) ) ).toBe( true );
    } );

    test( "Can get a registered dependency", async() =>
    {
        let registry = new DependencyRegistry( new SimpleLogger( console ) );

        let publishedComponent = new PublishedComponent( TEST_DEPENDENCY_CONSTANT, "@toolbocks/logging", "SimpleLogger" );

        registry.register( publishedComponent );

        expect( $ln( registry.availableComponents ) ).toEqual( 1 );

        expect( registry.availableComponents.includes( DEP_CONSTS_BY_ID.get( "logging.logger" ) ) ).toBe( true );

        let logger = await registry.getComponent( DEP_CONSTS.LOGGER );

        expect( typeof logger ).toBe( "object" );

        expect( getClassName( logger ) ).toEqual( "Dependency" );

        expect( typeof logger.info ).toEqual( "function" );

        logger.log( "This is logged from a dependency retrieved from the registry" );

        // now get the cached logger

        let cachedLogger = await registry.getComponent( DEP_CONSTS.LOGGER );

        expect( getClassName( cachedLogger ) ).toEqual( "Dependency" );

        expect( typeof cachedLogger.info ).toEqual( "function" );

        expect( cachedLogger.instanceId ).toEqual( logger.instanceId );

        cachedLogger.log( "This is logged from a cached dependency retrieved from the registry" );

    } );


} );