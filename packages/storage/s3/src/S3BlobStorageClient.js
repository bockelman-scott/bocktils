// noinspection JSCheckFunctionSignatures
(function exposeModule()
{
    const { Readable } = require( "node:stream" );

    const core = require( "@toolbocks/core" );

    // noinspection JSUnusedLocalSymbols
    const bufferUtils = require( "@toolbocks/buffer" );

    const jsonUtils = require( "@toolbocks/json" );

    const storageBase = require( "@toolbocks/storage" );

    const { moduleUtils, constants, typeUtils, stringUtils, arrayUtils } = core;

    const { ModuleEvent, attempt, asyncAttempt, readProperty, lock, populateOptions } = moduleUtils;

    const { _ud, _mt = "", _fun, $scope } = constants;

    const { isNull, isNonNullObject, isString, isArray, isTypedArray, isClass, getClass, getClassName } = typeUtils;

    const { asString, asInt, toBool, isBlank, isJsonObject } = stringUtils;

    const { asArray } = arrayUtils;

    const { asObject } = jsonUtils;

    const { BLOB_STORE_OPERATIONS, BLOB_STORE_CLIENT_KEYS, BLOB_STORE_CLIENT_FACTORY, BlobStorageClient } = storageBase;

    const
        {
            S3Client,
            PutObjectCommand,
            GetObjectCommand,
            DeleteObjectCommand,
            DeleteObjectsCommand,
            HeadObjectCommand,
            ListObjectsV2Command,
            CopyObjectCommand
        } = require( "@aws-sdk/client-s3" );

    const { getSignedUrl } = require( "@aws-sdk/s3-request-presigner" );

    const { Upload } = require( "@aws-sdk/lib-storage" );

    // noinspection JSClosureCompilerSyntax
    /**
     * AWS S3 implementation of BlobStorageClient.
     *
     * @class
     * @extends BlobStorageClient
     */
    class S3BlobStorageClient extends BlobStorageClient
    {
        #region;
        #bucket;

        #s3Client;

        /**
         * @param {Object} [pOptions={}]
         * @param {string} pOptions.bucket - S3 bucket name
         * @param {string} [pOptions.region="us-east-1"] - AWS region
         * @param {Object} [pOptions.credentials] - AWS credentials object ({ accessKeyId, secretAccessKey, sessionToken })
         * @param {Object} [pOptions.s3Config] - Raw configuration object passed to S3Client
         * @param {S3Client} [pOptions.s3Client] - Optional pre-configured S3Client instance
         */
        constructor( pOptions = {} )
        {
            super( pOptions );

            const options = asObject( pOptions ?? {} );

            this.#region = asString( readProperty( options, "region" ), true ) || "us-east-1";
            this.#bucket = asString( readProperty( options, "bucket", "bucket_name" ), true );

            if ( isBlank( this.bucket ) )
            {
                throw new IllegalArgumentError( "S3 bucket name is required for S3StorageClient initialization.", { detail: pOptions } );
            }

            const clientConfig =
                {
                    region: this.region,
                    ...(asObject( options.s3Config ?? {} ))
                };

            if ( options.credentials )
            {
                clientConfig.credentials = options.credentials;
            }

            this.#s3Client = options.s3Client || new S3Client( clientConfig );
        }

        get region()
        {
            return this.#region;
        }

        get bucket()
        {
            return this.#bucket;
        }

        getRoot()
        {
            return this.#bucket;
        }

        /**
         * Normalizes and strips leading slashes from S3 keys.
         *
         * @private
         * @param {string} pKey
         * @returns {string}
         */
        #resolveKey( pKey )
        {
            const key = asString( pKey, true ).replace( /^\/+/, _mt );

            if ( isBlank( key ) )
            {
                throw new IllegalArgumentError( "Storage key cannot be blank.", { detail: pKey }, pKey );
            }

            return key;
        }

        async upload( pKey, pData, pOptions = {} )
        {
            const key = this.#resolveKey( pKey );

            const options = asObject( pOptions ?? {} );
            const metadata = asObject( options.metadata ?? {} );

            const contentType = readProperty( options, "content_type", "mime_type" ) ||
                                readProperty( metadata, "content_type", "mime_type" ) ||
                                "application/octet-stream";

            let body = pData;

            if ( isString( pData ) )
            {
                body = Buffer.from( pData, asString( options.encoding || "utf-8", true ) || "utf-8" );
            }
            else if ( isTypedArray( pData ) && !Buffer.isBuffer( pData ) )
            {
                // noinspection JSUnresolvedReference
                body = Buffer.from( pData.buffer ?? pData );
            }

            const params =
                {
                    Bucket: this.bucket,
                    Key: key,
                    Body: body,
                    ContentType: contentType,
                    Metadata: metadata
                };

            // Stream payloads use lib-storage Upload for multipart chunking
            if ( pData instanceof Readable || _fun === typeof pData?.[Symbol.asyncIterator] )
            {
                const parallelUpload = new Upload( {
                                                       client: this.#s3Client,
                                                       params
                                                   } );

                await parallelUpload.done();
            }
            else
            {
                // noinspection JSCheckFunctionSignatures
                await this.#s3Client.send( new PutObjectCommand( params ) );
            }

            const head = await this.#s3Client.send( new HeadObjectCommand( { Bucket: this.bucket, Key: key } ) );

            const obj =
                {
                    key,
                    bucket: this.bucket,
                    etag: head.ETag,
                    url: `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`
                };

            attempt( () => this.dispatchEvent( new ModuleEvent( "upload", { detail: obj }, { ...obj } ) ) );

            return lock( obj );
        }

        async download( pKey, pOptions = {} )
        {
            const key = this.#resolveKey( pKey );
            const options = asObject( pOptions ?? {} );

            const commandInput = { Bucket: this.bucket, Key: key };

            const range = asString( readProperty( options, "range" ), true );
            if ( range && !isBlank( range ) )
            {
                commandInput.Range = range.startsWith( "bytes=" ) ? range : `bytes=${range}`;
            }

            const response = await this.#s3Client.send( new GetObjectCommand( commandInput ) );
            return response.Body; // Node.js Readable stream
        }

        async delete( pKey )
        {
            const key = this.#resolveKey( pKey );

            await this.#s3Client.send( new DeleteObjectCommand( { Bucket: this.bucket, Key: key } ) );

            const fileExists = await this.exists( key );

            if ( !fileExists )
            {
                attempt( () => this.dispatchEvent( new ModuleEvent( "delete",
                                                                    { detail: [key, fileExists] },
                                                                    { key, fileExists } ) ) );
            }

            return !fileExists;
        }

        async deleteMany( ...pKeys )
        {
            const rawKeys = asArray( pKeys ?? [] );
            const objects = rawKeys.map( k => ({ Key: this.#resolveKey( k ) }) );

            if ( $ln( objects ) <= 0 )
            {
                return { deleted: [], failed: [] };
            }

            const response = await this.#s3Client.send( new DeleteObjectsCommand( {
                                                                                      Bucket: this.bucket,
                                                                                      Delete: {
                                                                                          Objects: objects,
                                                                                          Quiet: false
                                                                                      }
                                                                                  } ) );

            const deleted = (response.Deleted || []).map( o => o.Key );
            const failed = (response.Errors || []).map( e => ({ key: e.Key, message: e.Message }) );

            attempt( () => this.dispatchEvent( new ModuleEvent( "delete",
                                                                { detail: { deleted, failed } },
                                                                { deleted, failed } ) ) );

            return { deleted, failed };
        }

        async exists( pKey )
        {
            const key = this.#resolveKey( pKey );

            try
            {
                await this.#s3Client.send( new HeadObjectCommand( { Bucket: this.bucket, Key: key } ) );
                return true;
            }
            catch( err )
            {
                if ( err.name === "NotFound" || err.$metadata?.httpStatusCode === 404 )
                {
                    return false;
                }
                throw err;
            }
        }

        async getMetadata( pKey )
        {
            const key = this.#resolveKey( pKey );
            const head = await this.#s3Client.send( new HeadObjectCommand( { Bucket: this.bucket, Key: key } ) );

            const customMetadata = asObject( head.Metadata ?? {} );

            const obj =
                {
                    key,
                    bucket: this.bucket,
                    size: head.ContentLength,
                    lastModified: head.LastModified,
                    contentType: head.ContentType || "application/octet-stream",
                    etag: head.ETag,
                    customMetadata
                };

            return lock( obj );
        }

        /**
         * Updates or replaces metadata for an existing S3 object.
         *
         * @param {string} pKey - S3 key
         * @param {Object} pMetadata - Metadata object
         *
         * @returns {Promise<Object>} Updated metadata object
         */
        async updateMetadata( pKey, pMetadata )
        {
            const key = this.#resolveKey( pKey );

            let existing = await asyncAttempt( async() => await this.getMetadata( key ) );
            existing = asObject( existing ?? {} ) ?? {};

            let metadata = pMetadata ?? existing;

            if ( isNonNullObject( metadata ) || isJsonObject( metadata ) )
            {
                metadata = asObject( metadata ?? existing ?? {} ) ?? existing ?? {};
            }

            const obj = attempt( () => populateOptions( metadata, existing ) ) ?? { ...(asObject( existing )), ...(asObject( metadata )) };

            const contentType = readProperty( obj, "content_type", "mime_type" ) ||
                                readProperty( existing, "content_type", "mime_type" ) ||
                                "application/octet-stream";

            const copySource = encodeURI( `${this.bucket}/${key}` );

            // 3. Issue in-place CopyObjectCommand with MetadataDirective REPLACE
            await this.#s3Client.send( new CopyObjectCommand( {
                                                                  Bucket: this.bucket,
                                                                  Key: key,
                                                                  CopySource: copySource,
                                                                  MetadataDirective: "REPLACE",
                                                                  ContentType: asString( contentType, true ) || "application/octet-stream",
                                                                  Metadata: obj ?? existing
                                                              } ) );

            return await this.getMetadata( key );
        }

        async list( pPrefix = _mt, pOptions = {} )
        {
            const prefix = asString( pPrefix, true ).replace( /^\/+/, _mt );
            const options = asObject( pOptions ?? {} );

            const limit = asInt( options.limit || 1000 );
            const continuationToken = readProperty( options, "cursor", "continuation_token" );

            const commandInput =
                {
                    Bucket: this.bucket,
                    Prefix: prefix,
                    MaxKeys: limit,
                    ContinuationToken: continuationToken
                };

            const response = await this.#s3Client.send( new ListObjectsV2Command( commandInput ) );

            const items = (response.Contents || []).map( item => lock( {
                                                                           key: item.Key,
                                                                           size: item.Size,
                                                                           lastModified: item.LastModified,
                                                                           etag: item.ETag
                                                                       } ) );

            const obj =
                {
                    items,
                    nextCursor: response.NextContinuationToken,
                    isTruncated: !!response.IsTruncated,
                    hasMore: function() { return !!response.IsTruncated; }
                };

            return lock( obj );
        }

        async* listStream( pPrefix = _mt, pOptions = {} )
        {
            const prefix = asString( pPrefix, true ).replace( /^\/+/, _mt );

            let continuationToken;
            let isTruncated = true;

            while ( isTruncated )
            {
                const commandInput =
                    {
                        Bucket: this.bucket,
                        Prefix: prefix,
                        ContinuationToken: continuationToken
                    };

                const response = await asyncAttempt( async() => await this.#s3Client.send( new ListObjectsV2Command( commandInput ) ) );

                if ( !response )
                {
                    break;
                }

                const contents = response.Contents || [];

                for( const item of contents )
                {
                    yield lock( {
                                    key: item.Key,
                                    size: item.Size,
                                    lastModified: item.LastModified,
                                    etag: item.ETag
                                } );
                }

                isTruncated = !!response.IsTruncated;
                continuationToken = response.NextContinuationToken;
            }
        }

        async getPresignedUrl( pKey, pOperation = BLOB_STORE_OPERATIONS.READ, pOptions = {} )
        {
            const key = this.#resolveKey( pKey );
            const options = asObject( pOptions ?? {} );
            const operation = pOperation || readProperty( options, "operation", "op" ) || BLOB_STORE_OPERATIONS.READ;
            const expiresIn = asInt( options.expiresInSeconds || 3600 );

            const CommandClass = operation === BLOB_STORE_OPERATIONS.WRITE ? PutObjectCommand : GetObjectCommand;
            const command = new CommandClass( { Bucket: this.bucket, Key: key } );

            return await getSignedUrl( this.#s3Client, command, { expiresIn } );
        }

        async getUrl( pKey, pOperation = BLOB_STORE_OPERATIONS.READ, pOptions = {} )
        {
            return await this.getPresignedUrl( pKey, pOperation, pOptions );
        }

        async copy( pSourceKey, pDestinationKey, pOverwrite = false )
        {
            const sourceKey = this.#resolveKey( pSourceKey );
            const destinationKey = this.#resolveKey( pDestinationKey );

            if ( sourceKey === destinationKey )
            {
                throw new IllegalArgumentError( "Source and destination keys cannot be identical.", { detail: [sourceKey, destinationKey] }, sourceKey, destinationKey );
            }

            const overwrite = toBool( pOverwrite );

            if ( !overwrite )
            {
                const alreadyExists = await this.exists( destinationKey );
                if ( alreadyExists )
                {
                    return false;
                }
            }

            const copySource = encodeURI( `${this.bucket}/${sourceKey}` );

            await this.#s3Client.send( new CopyObjectCommand( {
                                                                  Bucket: this.bucket,
                                                                  Key: destinationKey,
                                                                  CopySource: copySource
                                                              } ) );

            const copied = await this.exists( destinationKey );

            if ( copied )
            {
                attempt( () => this.dispatchEvent( new ModuleEvent( "copy",
                                                                    { detail: [sourceKey, destinationKey] },
                                                                    { sourceKey, destinationKey } ) ) );
            }

            return copied;
        }

        [Symbol.toStringTag]()
        {
            return `[object ${getClassName( this )}]`;
        }
    }

    BLOB_STORE_CLIENT_FACTORY.registerClass( BLOB_STORE_CLIENT_KEYS.AWS_S3, S3BlobStorageClient );

    const mod =
        {
            classes:
                {
                    S3Client,
                    S3BlobStorageClient
                },
            S3BlobStorageClient
        };

    if ( _ud !== typeof module )
    {
        module.exports = lock( mod );
    }

    return lock( mod );

}());
