// noinspection JSUnresolvedReference

const toolbocks = require( "@toolbocks/core" );

const { SecretsManager } = require( "@toolbocks/secrets" );

const { moduleUtils, constants, typeUtils } = toolbocks;

const { $ln } = moduleUtils;

const { isClass, getClass, getClassName } = typeUtils;

const depInjection = require( "@toolbocks/dep-injection" );

const { DEP_CONSTS, DEP_CONSTS_BY_ID, DependencyConstant, Dependency, PublishedComponent } = depInjection;


const TEST_DEPENDENCY_CONSTANT = new DependencyConstant( "logging.logger", "logger", "A logger thing" );

describe( "PublishedComponent", () =>
{
    test( "PublishedComponent constructed without arguments is not valid", () =>
    {
        let publishedComponent = new PublishedComponent();

        expect( publishedComponent.isValid() ).toBe( false );

    } );

    test( "PublishedComponent can be constructed with valid arguments", () =>
    {
        let info = new PublishedComponent( TEST_DEPENDENCY_CONSTANT, "@toolbocks/logging", "SimpleLogger" );

        expect( info.isValid() ).toBe( true );

        expect( info.id ).toEqual( "logging.logger" );
        expect( info.name ).toEqual( "logger" );
        expect( info.description ).toEqual( "A logger thing" );

        expect( info.path ).toEqual( "@toolbocks/logging" );

        expect( info.componentName ).toEqual( "SimpleLogger" );
    } );

    test( "Can load a component based a PublishedComponent", () =>
    {
        let info = new PublishedComponent( TEST_DEPENDENCY_CONSTANT, "@toolbocks/logging", "SimpleLogger" );

        let mod = require( info.path );

        let component = mod[info.componentName];

        expect( "function" === typeof component ).toBe( true );

        expect( getClassName( component ) ).toEqual( "SimpleLogger" );

        let instance = new component();

        let dependency = Dependency.from( instance, info.name, info.id );

        expect( dependency.id ).toEqual( info.id );
        expect( dependency.name ).toEqual( info.name );

        expect( getClassName( dependency.component ) === getClassName( instance ) || getClassName( dependency.component ) === "ComponentAdapter" ).toBe( true );
        expect( dependency.componentClass ).toEqual( component );

        expect( typeof dependency.log ).toEqual( "function" );

        dependency.info( `This message is logged by the dependency` );
    } );

    test( "Can initialize a dependency obtained via PublishedComponent", async() =>
    {
        let info = new PublishedComponent( TEST_DEPENDENCY_CONSTANT, "@toolbocks/logging", "SimpleLogger" );

        let mod = require( info.path );

        let component = mod[info.componentName];

        let instance = new component();

        let dependency = Dependency.from( instance, info.name, info.id );

        dependency = await dependency.init();

        expect( dependency.initialized ).toBe( true );

        expect( dependency.id ).toEqual( info.id );
        expect( dependency.name ).toEqual( info.name );

        expect( getClassName( dependency.component ) === getClassName( instance ) || getClassName( dependency.component ) === "ComponentAdapter" ).toBe( true );
        expect( dependency.componentClass ).toEqual( component );

        expect( typeof dependency.log ).toEqual( "function" );

        dependency.info( `This message is logged by the dependency` );
    } );


    test( "PublishedComponent has a testable method named load", async() =>
    {
        let info = new PublishedComponent( TEST_DEPENDENCY_CONSTANT, "@toolbocks/logging", "SimpleLogger" );

        let instance = await info.load();

        let dependency = Dependency.from( instance, info.name, info.id );

        dependency = await dependency.init();

        expect( dependency.initialized ).toBe( true );

        expect( dependency.id ).toEqual( info.id );
        expect( dependency.name ).toEqual( info.name );

        expect( getClassName( dependency.component ) === getClassName( instance ) || getClassName( dependency.component ) === "ComponentAdapter" ).toBe( true );
        expect( dependency.componentClass ).toEqual( getClass( instance ) );

        expect( typeof dependency.log ).toEqual( "function" );

        dependency.info( `This message is logged by the dependency` );
    } );

} );
