const jsonUtils = require( "@toolbocks/json" );

const configModule = require( "../src/ServerConfiguration.js" );

const
    {
        HandlerConfiguration,
        HandlerFactoryConfiguration,
        FilterConfiguration,
        FilterFactoryConfiguration,
        SslConfiguration,
        RouteConfiguration,
        RouteFactoryConfiguration,
        ServerConfiguration,
        parseServerConfiguration
    } = configModule;

const { asJson } = jsonUtils;

const sample = require( "../src/servers.json" );
const json = JSON.stringify( sample );

describe( "ServerConfiguration", () =>
{
    test( "deserialize from JSON", () =>
    {
        const configuration = parseServerConfiguration( json );

        expect( typeof configuration ).toEqual( "object" );

        expect( configuration instanceof ServerConfiguration ).toBe( true );
    } );

    test( "round-trip from and to JSON", () =>
    {
        const configuration = parseServerConfiguration( json );
        const s = configuration.toJSON();

        const config2 = parseServerConfiguration( s );
        const s2 = config2.toJSON();

        expect( s2 ).toEqual( s );

        const config3 = parseServerConfiguration( s2 );

        expect( typeof configuration ).toEqual( "object" );

        expect( config3 instanceof ServerConfiguration ).toBe( true );

        expect( config3.equals( configuration ) ).toBe( true );
    } );

} );