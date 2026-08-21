const core = require( "@toolbocks/core" );
const fileUtils = require( "@toolbocks/files");

const storageModule = require( "@toolbocks/storage" );

const { moduleUtils, constants, typeUtils } = core;

const { isNull, getClass, getClassName } = typeUtils;

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

        expect( blobStorageClient.getRoot() ).toEqual( "C:\\Temp" );
    } );

    test( "LocalDiskStorageClient - save a file", () =>
    {
        let blobStorageClient = BLOB_STORE_CLIENT_FACTORY.getClient( BLOB_STORE_CLIENT_KEYS.FILE_SYSTEM );

        blobStorageClient.upload();

    } );

} );