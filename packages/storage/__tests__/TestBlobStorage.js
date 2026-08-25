const { createWriteStream } = require( "node:fs" );
const { pipeline } = require( "node:stream/promises" );

const core = require( "@toolbocks/core" );
const fileUtils = require( "@toolbocks/files" );

const storageModule = require( "@toolbocks/storage" );

const { moduleUtils, constants, typeUtils } = core;

const { asyncAttempt } = moduleUtils;

const { isNull, getClass, getClassName } = typeUtils;

const { exists, readFile } = fileUtils;

const { BLOB_STORE_CLIENT_FACTORY, BLOB_STORE_CLIENT_KEYS, LocalDiskStorageClient } = storageModule;

describe( "BlobStorage", () =>
{
    test( "LocalDiskStorageClient - construction", () =>
    {
        // clients are obtained from a factory, not explicitly constructed
        let blobStorageClient = BLOB_STORE_CLIENT_FACTORY.getClient( BLOB_STORE_CLIENT_KEYS.FILE_SYSTEM );

        expect( typeof blobStorageClient ).toEqual( "object" );
        expect( getClass( blobStorageClient ) ).toBe( LocalDiskStorageClient );

        // explicit construction IS possible, though
        blobStorageClient = new LocalDiskStorageClient();

        expect( typeof blobStorageClient ).toEqual( "object" );
        expect( getClass( blobStorageClient ) ).toBe( LocalDiskStorageClient );

        console.log( blobStorageClient.getRoot() );

        blobStorageClient = new LocalDiskStorageClient( { "root_folder": "C:\\Temp" } );

        expect( typeof blobStorageClient ).toEqual( "object" );
        expect( getClass( blobStorageClient ) ).toBe( LocalDiskStorageClient );

        expect( blobStorageClient.getRoot() ).toEqual( "C:/Temp" );
    } );

    test( "LocalDiskStorageClient - save a file", async() =>
    {
        let blobStorageClient = BLOB_STORE_CLIENT_FACTORY.getClient( BLOB_STORE_CLIENT_KEYS.FILE_SYSTEM, { "root_folder": "C:\\Temp" } );

        const data = await readFile( "C:\\Temp\\TestSource\\SignedRetainer.pdf" );

        let key = "retainers/signed_retainer.pdf";

        await blobStorageClient.upload( key, data, {} );

        const success = await exists( "C:\\Temp\\retainers\\signed_retainer.pdf" );

        expect( success ).toBe( true );

        const keyExists = await blobStorageClient.exists( key );

        expect( keyExists ).toBe( true );


        const metadata = await blobStorageClient.getMetadata( key );

        expect( typeof metadata ).toEqual( "object" );

        expect( metadata.contentType ).toEqual( "application/octet-stream" );
        expect( metadata.size ).toEqual( 218431 );

    }, 60_000 );

    test( "LocalDiskStorageClient - read a file", async() =>
    {
        let blobStorageClient = BLOB_STORE_CLIENT_FACTORY.getClient( BLOB_STORE_CLIENT_KEYS.FILE_SYSTEM, { "root_folder": "C:\\Temp" } );

        let key = "retainers/signed_retainer.pdf";

        const stream = await blobStorageClient.download( key );

        const writeStream = createWriteStream( "C:\\Temp\\" + key, {} );

        await pipeline( stream, writeStream );

        const success = await exists( "C:\\Temp\\retainers\\signed_retainer.pdf" );

        expect( success ).toBe( true );

    }, 60_000 );

    test( "LocalDiskStorageClient - read metadata", async() =>
    {
        let blobStorageClient = BLOB_STORE_CLIENT_FACTORY.getClient( BLOB_STORE_CLIENT_KEYS.FILE_SYSTEM, { "root_folder": "C:\\Temp" } );

        let key = "retainers/signed_retainer.pdf";

        const metadata = await blobStorageClient.getMetadata( key );

        expect( typeof metadata ).toEqual( "object" );

        expect( metadata.contentType ).toEqual( "application/octet-stream" );
        // expect( metadata.size ).toEqual( 218431 );

    }, 60_000 );

    test( "LocalDiskStorageClient - delete a file", async() =>
    {
        let blobStorageClient = BLOB_STORE_CLIENT_FACTORY.getClient( BLOB_STORE_CLIENT_KEYS.FILE_SYSTEM, { "root_folder": "C:\\Temp" } );

        let key = "retainers/signed_retainer.pdf";

        const deleted = await blobStorageClient.delete( key );

        expect( deleted ).toBe( true );

        const existing = await asyncAttempt( async() => await exists( "C:\\Temp\\retainers\\signed_retainer.pdf" ) );

        expect( existing ).toBe( false );

        const keyExists = await blobStorageClient.exists( key );

        expect( keyExists ).toBe( false );

    }, 60_000 );

    test( "LocalDiskStorageClient - delete several files", async() =>
    {
        let blobStorageClient = BLOB_STORE_CLIENT_FACTORY.getClient( BLOB_STORE_CLIENT_KEYS.FILE_SYSTEM, { "root_folder": "C:\\Temp" } );

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

            const success = await exists( "C:/Temp/" + key );

            expect( success ).toBe( true );
        }

        // now try to delete them
        const { deleted, failed } = await blobStorageClient.deleteMany( ...keys );

        expect( deleted.length === keys.length ).toBe( true );
        expect( failed.length ).toEqual( 0 );

    }, 60_000 );

    test( "LocalDiskStorageClient - list files", async() =>
    {
        let blobStorageClient = BLOB_STORE_CLIENT_FACTORY.getClient( BLOB_STORE_CLIENT_KEYS.FILE_SYSTEM, { "root_folder": "C:\\Temp" } );

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

            const success = await exists( "C:/Temp/" + key );

            expect( success ).toBe( true );
        }

        const results = await blobStorageClient.list( "signatures" );

        expect( typeof results ).toEqual( "object" );

        expect( results.items.length ).toEqual( 2 );

    }, 60_000 );


    test( "LocalDiskStorageClient - copy file", async() =>
    {
        let blobStorageClient = BLOB_STORE_CLIENT_FACTORY.getClient( BLOB_STORE_CLIENT_KEYS.FILE_SYSTEM, { "root_folder": "C:\\Temp" } );

        let srcKey = "retainers/SignedRetainer.pdf";
        let destKey = "retainers/signed_retainer.pdf";

        // defaults to overwrite=true
        let copied = await blobStorageClient.copy( srcKey, destKey );

        expect( copied ).toBe( true );
        expect( await blobStorageClient.exists( destKey ) ).toBe( true );

        copied = await blobStorageClient.copy( srcKey, destKey, false );

        expect( copied ).toBe( false );
        expect( await blobStorageClient.exists( destKey ) ).toBe( true );

        copied = await blobStorageClient.copy( srcKey, destKey, true );

        expect( copied ).toBe( true );
        expect( await blobStorageClient.exists( destKey ) ).toBe( true );
    } );


    test( "LocalDiskStorageClient - move file", async() =>
    {
        let blobStorageClient = BLOB_STORE_CLIENT_FACTORY.getClient( BLOB_STORE_CLIENT_KEYS.FILE_SYSTEM, { "root_folder": "C:\\Temp" } );

        let srcKey = "retainers/signed_retainer.pdf";
        let destKey = "signed_retainer.pdf";

        // defaults to overwrite=false
        let moved = await blobStorageClient.move( srcKey, destKey );

        expect( moved ).toBe( false );
        expect( await blobStorageClient.exists( destKey ) ).toBe( true );

        // overwrite
        moved = await blobStorageClient.move( srcKey, destKey, true );

        expect( moved ).toBe( true );
        expect( await blobStorageClient.exists( destKey ) ).toBe( true );

    } );


} );