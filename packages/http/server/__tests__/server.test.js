const fs = require( "fs" );

const path = require( "path" );

const { getDefaultRegistry } = require( "@toolbocks/registry" );

const { ServerFactory } = require( "../src/ServerFactory.js" );

describe( "ServerFactory Lifecycle", () =>
{
    let server;

    const PORT = 3030;

    const BASE_URL = `http://localhost:${PORT}/api/v1`;

    beforeAll( async() =>
               {
                   // 1. Read the test manifest
                   const manifestPath = path.join( __dirname, "servers.test.json" );
                   const manifestJson = JSON.parse( fs.readFileSync( manifestPath, "utf8" ) );

                   const registry = await getDefaultRegistry();

                   // 2. Instantiate Factory and Create Server
                   const factory = new ServerFactory( registry );

                   // Pass the first server configuration from the array
                   server = await factory.createServer( manifestJson.servers[0], registry );
               } );

    afterAll( async() =>
              {
                  // Ensure the port is always released, even if the test fails
                  if ( server && server.started )
                  {
                      await server.stop();
                  }
              } );

    it( "should successfully create, start, route, and stop", async() =>
    {
        // Assert creation
        expect( server ).toBeDefined();
        expect( server.started ).toBeFalsy();

        // 1. Start the server
        await server.start();
        expect( server.started ).toBeTruthy();
        // 2. Make an actual network request to the dynamically mounted route
        const response = await fetch( `${BASE_URL}/hello` );
        const data = await response.json();

        // 3. Assert network resolution and handler execution
        expect( response.status ).toBe( 200 );
        expect( data.message ).toBe( "Hello World" );
        expect( data.url ).toBe( "/api/v1/hello" );

        // 4. Stop the server
        await server.stop();
        expect( server.started ).toBeFalsy();

        // 5. Verify network socket is closed
        await expect( fetch( `${BASE_URL}/hello` ) ).rejects.toThrow();
    } );
} );