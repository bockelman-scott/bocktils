(function exposePackage()
{
    const { BlobStorageClient } = require( "@toolbocks/storage" );

    const { S3BlobStorageClient } = require( "./src/S3BlobStorageClient.js" );

    const mod =
        {
            classes:
                {
                    BlobStorageClient,
                    S3BlobStorageClient
                },
            BlobStorageClient,
            S3BlobStorageClient
        };

    if ( "undefined" !== typeof module )
    {
        module.exports = Object.freeze( mod );
    }

    return Object.freeze( mod );
}());
