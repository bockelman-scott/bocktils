(function exposePackage()
{
    const INTERNAL_NAME = "__BOCK__STORAGE_UTILS__";

    const core = require( "@toolbocks/core" );

    const { moduleUtils, constants } = core;

    const { _ud, $scope } = constants;

    const blobStoreClient = require( "./src/BlobStoreClient.js" );

    if ( $scope() && (null != $scope()[INTERNAL_NAME]) )
    {
        return $scope()[INTERNAL_NAME];
    }

    const
        {
            BLOB_STORE_OPERATIONS,
            BLOB_STORE_CLIENT_KEYS,
            BLOB_STORE_CLIENT_FACTORY,
            EVENTS = ["clear", "delete", "registerClass", "unregisterClass", "registerSingleton", "unregisterSingleton", "upload", "copy"],
            BlobStorageClient,
            LocalDiskStorageClient,
            BlobStoreClientFactory
        } = blobStoreClient;

    const mod =
        {
            blobStoreClient,
            BLOB_STORE_OPERATIONS,
            BLOB_STORE_CLIENT_KEYS,
            BLOB_STORE_CLIENT_FACTORY,
            EVENTS,
            BlobStorageClient,
            LocalDiskStorageClient,
            BlobStoreClientFactory
        };

    if ( _ud !== typeof module )
    {
        module.exports = Object.freeze( mod );
    }

    return Object.freeze( mod );

}());
