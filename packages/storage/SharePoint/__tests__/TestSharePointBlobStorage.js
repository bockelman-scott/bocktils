const { createWriteStream } = require( "node:fs" );
const { pipeline } = require( "node:stream/promises" );

const core = require( "@toolbocks/core" );

const fileUtils = require( "@toolbocks/files" );

const storageModule = require( "@toolbocks/storage" );

const sharePointBlobStorageModule = require( "../src/SharePointBlobStorageClient.js" );

const { moduleUtils, constants, typeUtils } = core;

const { asyncAttempt } = moduleUtils;

const { isNull, getClass, getClassName } = typeUtils;

const { exists, readFile } = fileUtils;

const { BLOB_STORE_CLIENT_FACTORY, BLOB_STORE_CLIENT_KEYS } = storageModule;

// Load SharePoint credentials [DO NOT SAVE THESE]
// const SP_CLIENT_ID = ""
// const SP_CLIENT_SECRET = ""
// const SP_TENANT_ID = ""
// const SP_SHAREPOINT_URL = ""



describe( "SharePointBlobStorage", () =>
{
    // the options required
    const config =
        {

        };

    test( "SharePointBlobStorageClient - construction", () =>
    {

        // clients are obtained from a factory, not explicitly constructed
        let blobStorageClient = BLOB_STORE_CLIENT_FACTORY.getClient( BLOB_STORE_CLIENT_KEYS.SHAREPOINT, config );

        expect( typeof blobStorageClient ).toEqual( "object" );
        expect( getClass( blobStorageClient ) ).toBe( SharePointBlobStorageClient );

        // explicit construction IS possible, though
        blobStorageClient = new SharePointBlobStorageClient();

        expect( typeof blobStorageClient ).toEqual( "object" );
        expect( getClass( blobStorageClient ) ).toBe( SharePointBlobStorageClient );

        console.log( blobStorageClient.getRoot() );

    } );

    test( "SharePointBlobStorageClient - save a file", async() =>
    {
        let blobStorageClient = BLOB_STORE_CLIENT_FACTORY.getClient( BLOB_STORE_CLIENT_KEYS.SHAREPOINT, config );

        const data = await readFile( "C:\\Temp\\TestSource\\SignedRetainer.pdf" );

        let key = "retainers/signed_retainer.pdf";

        await blobStorageClient.upload( key, data, {} );

        const success = await blobStorageClient.exists( key );

        expect( success ).toBe( true );


        const metadata = await blobStorageClient.getMetadata( key );

        expect( typeof metadata ).toEqual( "object" );

        expect( metadata.contentType ).toEqual( "application/octet-stream" );
        expect( metadata.size ).toEqual( 218431 );

    }, 60_000 );

    test( "SharePointBlobStorageClient - read a file", async() =>
    {
        let blobStorageClient = BLOB_STORE_CLIENT_FACTORY.getClient( BLOB_STORE_CLIENT_KEYS.SHAREPOINT, config );

        let key = "retainers/signed_retainer.pdf";

        const stream = await blobStorageClient.download( key );

        const writeStream = createWriteStream( "C:\\Temp\\" + key, {} );

        await pipeline( stream, writeStream );

        const success = await exists( "C:\\Temp\\retainers\\signed_retainer.pdf" );

        expect( success ).toBe( true );

    }, 60_000 );

    test( "SharePointBlobStorageClient - read metadata", async() =>
    {
        let blobStorageClient = BLOB_STORE_CLIENT_FACTORY.getClient( BLOB_STORE_CLIENT_KEYS.SHAREPOINT, config );

        let key = "retainers/signed_retainer.pdf";

        const metadata = await blobStorageClient.getMetadata( key );

        expect( typeof metadata ).toEqual( "object" );

        expect( metadata.contentType ).toEqual( "application/octet-stream" );
        // expect( metadata.size ).toEqual( 218431 );

    }, 60_000 );

    test( "SharePointBlobStorageClient - delete a file", async() =>
    {
        let blobStorageClient = BLOB_STORE_CLIENT_FACTORY.getClient( BLOB_STORE_CLIENT_KEYS.SHAREPOINT, config );

        let key = "retainers/signed_retainer.pdf";

        const deleted = await blobStorageClient.delete( key );

        expect( deleted ).toBe( true );

        const keyExists = await blobStorageClient.exists( key );

        expect( keyExists ).toBe( false );

    }, 60_000 );

    test( "SharePointBlobStorageClient - delete several files", async() =>
    {
        let blobStorageClient = BLOB_STORE_CLIENT_FACTORY.getClient( BLOB_STORE_CLIENT_KEYS.SHAREPOINT, config );


        let keys =
            [
                "signatures/Valerie_Segotta_13658108_458948_signature.png",
                "signatures/Justin_Velasco_13658108_458950_signature.png",
                "retainers/SignedRetainer.pdf",
                "some_file.txt"
            ];

        // first upload some files
        for( let key of keys )
        {
            const parts = key.split( "/" );

            let fileName = "C:\\Temp\\TestSource\\" + String( parts[1] || parts[0] ).trim();

            const data = await readFile( fileName );

            await blobStorageClient.upload( key, data, {} );

            const success = await blobStorageClient.exists( key );

            expect( success ).toBe( true );
        }

        // now try to delete them
        const { deleted, failed } = await blobStorageClient.deleteMany( ...keys );

        expect( deleted.length === keys.length ).toBe( true );
        expect( failed.length ).toEqual( 0 );

    }, 60_000 );

    test( "SharePointBlobStorageClient - list files", async() =>
    {
        let blobStorageClient = BLOB_STORE_CLIENT_FACTORY.getClient( BLOB_STORE_CLIENT_KEYS.SHAREPOINT, config );

        let keys =
            [
                "signatures/Valerie_Segotta_13658108_458948_signature.png",
                "signatures/Justin_Velasco_13658108_458950_signature.png",
                "retainers/SignedRetainer.pdf",
                "some_file.txt"
            ];

        // first upload some files
        for( let key of keys )
        {
            const parts = key.split( "/" );

            let fileName = "C:\\Temp\\TestSource\\" + String( parts[1] || parts[0] ).trim();

            const data = await readFile( fileName );

            await blobStorageClient.upload( key, data, {} );
        }

        const results = await blobStorageClient.list( "signatures" );

        expect( typeof results ).toEqual( "object" );

        expect( results.items.length ).toEqual( 2 );

    }, 60_000 );


    test( "SharePointBlobStorageClient - copy file", async() =>
    {
        let blobStorageClient = BLOB_STORE_CLIENT_FACTORY.getClient( BLOB_STORE_CLIENT_KEYS.SHAREPOINT, config );

        let srcKey = "retainers/SignedRetainer.pdf";
        let destKey = "retainers/signed_retainer.pdf";

        // defaults to overwrite=false
        let copied = await blobStorageClient.copy( srcKey, destKey );

        expect( copied ).toBe( false );
        expect( await blobStorageClient.exists( destKey ) ).toBe( false );

        copied = await blobStorageClient.copy( srcKey, destKey, true );

        expect( copied ).toBe( true );
        expect( await blobStorageClient.exists( destKey ) ).toBe( true );
    } );


    test( "SharePointBlobStorageClient - move file", async() =>
    {
        let blobStorageClient = BLOB_STORE_CLIENT_FACTORY.getClient( BLOB_STORE_CLIENT_KEYS.SHAREPOINT, config );

        let srcKey = "retainers/signed_retainer.pdf";
        let destKey = "signed_retainer.pdf";

        let moved = await blobStorageClient.move( srcKey, destKey, true );

        expect( moved ).toBe( true );
        expect( await blobStorageClient.exists( destKey ) ).toBe( true );

        // defaults to overwrite=false
        await blobStorageClient.move( srcKey, destKey );

        expect( moved ).toBe( false );
        expect( await blobStorageClient.exists( destKey ) ).toBe( true );
    } );


} );
