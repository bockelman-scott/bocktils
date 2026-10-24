// noinspection JSUnresolvedReference

const toolbocks = require( "@toolbocks/core" );

const { SecretsManager } = require( "@toolbocks/secrets" );

const { moduleUtils, constants, typeUtils } = toolbocks;

const { $ln } = moduleUtils;

const { getClassName } = typeUtils;

const depInjection = require( "@toolbocks/dep-injection" );

const { DEP_CONSTS, DependencyDescriptorOptions, DependencyDescriptor } = depInjection;

// require( "" );

describe( "DependencyDescriptor", () =>
{
    test( "Descriptor based on a constant uses default options", () =>
    {
        let descriptor = new DependencyDescriptor( DEP_CONSTS.SECRETS_MANAGER );

        expect( descriptor.id ).toEqual( "secrets.secretsManager" );
        expect( descriptor.name ).toEqual( "secretsManager" );

        expect( descriptor.requiresNewInstance ).toBe( false );
        expect( descriptor.version ).toEqual( "0.0.0" );
        expect( descriptor.baseClass ).toBe( null );
        expect( descriptor.defaultInstance ).toBe( null );

        expect( typeof descriptor.args ).toBe( "object" );
        expect( getClassName( descriptor.args ) ).toEqual( "Array" );
        expect( $ln( descriptor.args ) ).toEqual( 0 );

        expect( typeof descriptor.options ).toBe( "object" );
        expect( $ln( descriptor.options ) ).toBe( 0 );

        expect( descriptor.cacheKey ).toEqual( "secrets.secretsManager|secretsManager|version:0.0.0" );
        expect( descriptor.hash ).toEqual( "11d3c1e8b069015cc9caf27fff392fee72537621aa37cd979a67b9c140702ebc" );


    } );

    test( "Descriptor can specify options and/or arguments to refine expected component", () =>
    {
        let descriptor = new DependencyDescriptor( DEP_CONSTS.SECRETS_MANAGER,
                                                   {
                                                       requiresNewInstance: true,
                                                       version: "1.0.1",
                                                       baseClass: SecretsManager,
                                                       args: ["LD"],
                                                       prefix: "LD"
                                                   } );

        expect( descriptor.id ).toEqual( "secrets.secretsManager" );
        expect( descriptor.name ).toEqual( "secretsManager" );

        expect( descriptor.requiresNewInstance ).toBe( true );
        expect( descriptor.version ).toEqual( "1.0.1" );
        expect( descriptor.isLaterThanOrEqualToVersion( "1.0.0" ) ).toBe( true );
        expect( descriptor.isLaterThanOrEqualToVersion( "1.0.2" ) ).toBe( false );

        expect( descriptor.baseClass ).toBe( SecretsManager );
        expect( descriptor.defaultInstance ).toBe( null );

        expect( typeof descriptor.args ).toBe( "object" );
        expect( getClassName( descriptor.args ) ).toEqual( "Array" );
        expect( $ln( descriptor.args ) ).toEqual( 1 );
        expect( descriptor.args[0] ).toEqual( "LD" );


        expect( typeof descriptor.options ).toBe( "object" );
        expect( getClassName( descriptor.options ) ).toEqual( "DependencyDescriptorOptions" );
        expect( descriptor.options instanceof DependencyDescriptorOptions ).toBe( true );

        expect( descriptor.cacheKey ).toEqual( "secrets.secretsManager|secretsManager||version:1.0.1|baseClass:SecretsManager|LD" );
        expect( descriptor.hash ).toEqual( "f32fc37f02b4fbc5adf272d783f764a2d0eb0eae8a8bb6c3427e8fbfc97de47c" );

    } );

    // TODO: add tests for DependencyDescriptor.from
} );
