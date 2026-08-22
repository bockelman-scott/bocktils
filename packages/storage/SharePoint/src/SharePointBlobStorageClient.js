(function exportModule()
{
    const { Readable } = require( "stream" );

    const core = require( "@toolbocks/core" );

    const datesModule = require( "@toolbocks/dates" );

    // noinspection JSUnusedLocalSymbols
    const bufferUtils = require( "@toolbocks/buffer" );

    const jsonUtils = require( "@toolbocks/json" );

    const storageBase = require( "@toolbocks/storage" );

    const { moduleUtils, constants, typeUtils, stringUtils, arrayUtils } = core;

    const
        {
            IllegalArgumentError,
            ModuleEvent,
            attempt,
            asyncAttempt,
            readProperty,
            lock,
            populateOptions
        } = moduleUtils;

    const { _ud, _mt = "", _fun, $scope } = constants;

    const
        {
            isNull,
            isNonNullObject,
            isString,
            isArray,
            isTypedArray,
            isClass,
            getClass,
            getClassName,
            clamp
        } = typeUtils;

    const { asString, asInt, toBool, isBlank, isJsonObject, toUnixPath, _lct } = stringUtils;

    const { asArray } = arrayUtils;

    const { asDate } = datesModule;

    const { asObject } = jsonUtils;

    const { BLOB_STORE_OPERATIONS, BLOB_STORE_CLIENT_KEYS, BLOB_STORE_CLIENT_FACTORY, BlobStorageClient } = storageBase;

    const { Client } = require( "@microsoft/microsoft-graph-client" );

    // noinspection JSClosureCompilerSyntax
    /**
     * SharePoint implementation of BlobStorageClient.
     *
     * @class
     * @extends BlobStorageClient
     */
    class SharePointBlobStorageClient extends BlobStorageClient
    {
        #siteId;
        #driveId;
        #graphQlClient;

        /**
         * @param {Object} pConfiguration
         * @param {string} pConfiguration.siteId - Target SharePoint Site ID
         * @param {string} pConfiguration.driveId - Target Document Library Drive ID
         * @param {Client} pConfiguration.graphClient - Pre-authenticated Graph SDK client instance
         */
        constructor( pConfiguration = {} )
        {
            super( asObject( pConfiguration ?? {} ) );

            const config = asObject( pConfiguration ?? {} );

            const site = readProperty( config, "site_id", "site" );
            const library = readProperty( config, "drive_id", "drive", "library_id", "library" );

            let graphClient = readProperty( config, "graph_ql_client", "graph_client", "client" );
            if ( isNull( graphClient ) )
            {
                graphClient = new Client();
            }

            if ( isNull( site ) || isBlank( site ) || isNull( library ) || isBlank( library ) || isNull( graphClient ) )
            {
                throw new Error( "SharePointBlobStorageClient requires a valid siteId, driveId, and graphClient." );
            }

            this.#siteId = site;
            this.#driveId = library;
            this.#graphQlClient = graphClient;
        }

        get siteId()
        {
            return this.#siteId;
        }

        get driveId()
        {
            return this.#driveId;
        }

        get library()
        {
            return this.driveId;
        }

        get graphQlClient()
        {
            return this.#graphQlClient;
        }

        get client()
        {
            return this.graphQlClient;
        }

        /**
         * Sanitizes and encodes key paths while keeping path separators intact.
         * @private
         */
        _normalizePath( pKey )
        {
            const key = asString( pKey, true ).replace( /^\/+/, _mt );
            return encodeURIComponent( key ).replace( /%2F/g, "/" );
        }

        /**
         * Extracts parent path and filename from a normalized key.
         * @private
         */
        _parseKey( key )
        {
            const parts = toUnixPath( key ).split( "/" );
            const filename = parts.pop();
            const parentPath = parts.join( "/" );
            return { parentPath, filename };
        }

        /**
         * Internal helper to upload large buffers/streams via HTTP chunking.
         * Microsoft Graph uploadSession requires byte ranges to be aligned to
         * multiples of 320 KiB (327,680 bytes), except for the final chunk.
         *
         * @private
         * @param {string} uploadUrl - The URL provided by createUploadSession
         * @param {Buffer|Readable} content - File payload stream or buffer
         * @returns {Promise<void>}
         */
        async _uploadChunks( uploadUrl, content )
        {
            const CHUNK_SIZE = 320 * 1024 * 10; // 3.2 MiB chunks (320 KiB * 10)

            // Convert Buffer to Readable Stream if necessary
            const stream = Buffer.isBuffer( content ) ? Readable.from( content ) : content;

            let buffer = Buffer.alloc( 0 );
            let startByte = 0;

            for await ( const chunk of stream )
            {
                buffer = Buffer.concat( [buffer, chunk] );

                while ( buffer.length >= CHUNK_SIZE )
                {
                    const chunkToUpload = buffer.subarray( 0, CHUNK_SIZE );
                    buffer = buffer.subarray( CHUNK_SIZE );

                    const endByte = startByte + chunkToUpload.length - 1;

                    // Total byte length is unknown for streams, so we omit total length from Range
                    await this._sendChunk( uploadUrl, chunkToUpload, startByte, endByte );
                    startByte = endByte + 1;
                }
            }

            // Flush any remaining trailing bytes in the buffer
            if ( buffer.length > 0 )
            {
                const endByte = asInt( startByte + buffer.length - 1 );
                const totalBytes = asInt( startByte + buffer.length );

                await this._sendChunk( uploadUrl, buffer, startByte, endByte, totalBytes );
            }
        }

        /**
         * Sends an individual byte-range chunk to the uploadSession endpoint.
         * @private
         */
        async _sendChunk( pUploadUrl, pChunkBuffer, pStart, pEnd, pTotal = "*" )
        {
            const url = asString( pUploadUrl, true );

            const chunkBuffer = !isNull( pChunkBuffer ) ? pChunkBuffer : new Buffer();

            const start = asInt( pStart );
            const end = asInt( pEnd );
            const total = asInt( pTotal, 1 );


            const response = await fetch( url,
                                          {
                                              method: "PUT",
                                              headers:
                                                  {
                                                      "Content-Length": asString( chunkBuffer.length ),
                                                      "Content-Range": `bytes ${start}-${end}/${clamp( total, 1, end )}`
                                                  },
                                              body: chunkBuffer
                                          } );

            if ( !response.ok )
            {
                const errorText = await response.text();
                throw new Error( `Graph Chunk Upload Failed [${response.status}]: ${errorText}` );
            }
        }

        getSitePath()
        {
            return `/sites/${this.siteId}`;
        }

        getLibraryPath()
        {
            return `${this.getSitePath()}/drives/${this.driveId}`;
        }

        getRoot()
        {
            return `${this.getLibraryPath()}/root:`;
        }

        getPath( pKey )
        {
            const key = asString( pKey, true );

            const path = this._normalizePath( key );

            return `${this.getRoot()}/${path}:/`;
        }

        async getItemId( pKey )
        {
            const key = asString( pKey, true );

            try
            {
                const path = this._normalizePath( key );

                const endpoint = `${this.getPath( path )}`;

                return await this.graphQlClient.api( endpoint ).select( "id" ).get();
            }
            catch( error )
            {
                if ( 404 === error.statusCode )
                {
                    return {};
                }

                this.dispatchEvent( new ModuleEvent( "error", { detail: key }, key, pKey ) );
            }

            return {};
        }

        /**
         * Checks if a file exists in the Document Library.
         * @param {string} pKey
         * @returns {Promise<boolean>}
         */
        async exists( pKey )
        {
            const key = asString( pKey, true );

            try
            {
                const path = this._normalizePath( key );

                const endpoint = `${this.getPath( path )}`;

                const response = await this.graphQlClient.api( endpoint ).select( "id" ).get();

                return !isNull( response );
            }
            catch( error )
            {
                if ( 404 === error.statusCode )
                {
                    return false;
                }
                this.dispatchEvent( new ModuleEvent( "error", { detail: key }, key, pKey ) );
            }
            return false;
        }

        /**
         * Uploads content (Buffer or Readable Stream) to SharePoint.
         * Handles small buffers directly and delegates large payloads/streams to chunked sessions.
         *
         * @param pKey
         * @param pContent
         * @param {Object} [metadata] - Optional key/value column metadata
         * @returns {Promise<void>}
         */
        async upload( pKey, pContent, metadata = null )
        {
            const key = asString( pKey, true );

            const path = this.getPath( key );

            const endpoint = `${path}content`;

            const client = this.graphQlClient;

            const FOUR_MB = 4 * 1024 * 1024;

            const content = Buffer.isBuffer( pContent ) ? pContent : isTypedArray( pContent ) ? Buffer.from( pContent ) : pContent;

            if ( Buffer.isBuffer( content ) && content.length < FOUR_MB )
            {
                await client.api( endpoint ).put( content );
            }
            else
            {
                const sessionEndpoint = `${path}createUploadSession`;
                const session = await client.api( sessionEndpoint ).post( {} );
                await this._uploadChunks( session.uploadUrl, content );
            }

            if ( isNonNullObject( metadata ) )
            {
                await this.updateMetadata( key, metadata );
            }

            const itemId = await this.getItemId( key );

            const obj =
                {
                    itemId,
                    key,
                    fullPath: `${path}`,
                    siteId: this.siteId,
                    driveId: this.driveId,
                    client: this.graphQlClient,
                    metadata: asObject( metadata ?? {} )
                };

            return lock( obj );
        }

        // noinspection JSCheckFunctionSignatures
        /**
         * Downloads a file stream from SharePoint.
         *
         * @param {string} pKey - file path relative to the Document Library
         *
         * @param {object} [pOptions={}]
         *
         * @returns {Promise<ReadStream>}
         */
        async download( pKey, pOptions = {} )
        {
            const key = asString( pKey, true );

            const path = this.getPath( key );

            const client = this.graphQlClient;

            const endpoint = `${path}content`;

            return await client.api( endpoint ).getStream();
        }

        /**
         * Deletes a DriveItem from SharePoint by key.
         *
         * @param {string} pKey - file path relative to the Document Library
         *
         * @returns {Promise<boolean>}
         */
        async delete( pKey )
        {
            const key = asString( pKey, true );

            const endpoint = this.getPath( key );

            await this.graphQlClient.api( endpoint ).delete();

            const fileExists = await this.exists( key );

            return !fileExists;
        }

        /**
         * Fetches the item properties and underlying SharePoint List Item field values.
         *
         * @param {string} pKey
         * @returns {Promise<Object>}
         */
        async getMetadata( pKey )
        {
            const key = asString( pKey, true );

            const path = this.getPath( key );

            const endpoint = `${path}listItem/fields`;

            const fields = await this.graphQlClient.api( endpoint ).get();

            const metadata = {};

            // Remove internal OData/Graph keys from output
            for( const [k, v] of Object.entries( fields ) )
            {
                if ( !k.startsWith( "@odata." ) && !k.startsWith( "odata." ) )
                {
                    if ( !isNull( v ) )
                    {
                        metadata[k] = v;
                    }
                }
            }

            return lock( metadata );
        }

        /**
         * Updates custom column metadata on the underlying SharePoint List Item.
         *
         * @param pKey
         * @param pMetadata
         *
         * @returns {Promise<Object>}
         */
        async updateMetadata( pKey, pMetadata )
        {
            const key = asString( pKey, true );

            const existing = await this.getMetadata( key );

            if ( isBlank( key ) || isNull( pMetadata ) )
            {
                return lock( existing );
            }

            let metadata = { ...(asObject( existing ?? {} )), ...(asObject( pMetadata ?? {} )) };

            const path = this.getPath( key );

            const endpoint = `${path}listItem/fields`;

            await this.graphQlClient.api( endpoint ).patch( metadata );

            const updated = await this.getMetadata( key );

            return lock( updated ?? existing );
        }

        /**
         * Generates a web access URL or direct download URL for a key.
         *
         * @param {string} pKey
         * @param {"web" | "download"} [pType="web"]
         * @returns {Promise<string>}
         */
        async getUrl( pKey, pType = "web" )
        {
            const key = asString( pKey, true );

            const type = asString( pType, true );

            const endpoint = this.getPath( key );

            const client = this.graphQlClient;

            if ( "download" === _lct( type ) )
            {
                const item = await client.api( endpoint ).select( "@microsoft.graph.downloadUrl" ).get();
                return item["@microsoft.graph.downloadUrl"];
            }

            const item = await client.api( endpoint ).select( "webUrl" ).get();
            return item.webUrl;
        }

        /**
         * Generates a sharing or download URL with configurable security options.
         *
         * @param {string} key - Relative file/folder path
         * @param {Object} [options]
         * @param {"download" | "view" | "edit" | "embed"} [options.type="view"] - Type of link/access level
         * @param {"anonymous" | "organization" | "users"} [options.scope="organization"] - Access target scope
         * @param {string[]} [options.recipients] - Array of email addresses (required if scope is "users")
         * @param {Date|string} [options.expirationDateTime] - ISO string or Date object for link expiration
         * @param {string} [options.password] - Optional password to protect the link (requires scope="anonymous")
         * @returns {Promise<string>}
         */
        async getSecureUrl( key, options = {} )
        {
            const
                {
                    type = "view",
                    scope = "organization",
                    recipients = [],
                    expirationDateTime = null,
                    password = null
                } = options;

            const path = this._normalizePath( key );
            const endpoint = `/sites/${this.siteId}/drives/${this.driveId}/root:/${path}`;

            // Direct binary download link (bypasses sharing link creation)
            if ( type === "download" )
            {
                const item = await this.graphClient.api( endpoint ).select( "@microsoft.graph.downloadUrl" ).get();
                return item["@microsoft.graph.downloadUrl"];
            }

            // Build payload for Graph createLink endpoint
            const payload =
                {
                    type, // 'view', 'edit', or 'embed'
                    scope // 'anonymous', 'organization', or 'users'
                };

            if ( expirationDateTime )
            {
                payload.expirationDateTime = expirationDateTime instanceof Date
                                             ? expirationDateTime.toISOString()
                                             : new Date( expirationDateTime ).toISOString();
            }

            if ( password )
            {
                if ( scope !== "anonymous" )
                {
                    throw new Error( "Passwords can only be applied to sharing links with scope 'anonymous'." );
                }
                payload.password = password;
            }

            if ( scope === "users" )
            {
                if ( !Array.isArray( recipients ) || recipients.length === 0 )
                {
                    throw new Error( "Recipients list (array of emails) is required when scope is set to 'users'." );
                }
                payload.recipients = recipients.map( ( email ) => ({ email }) );
            }

            const createLinkEndpoint = `${endpoint}:/createLink`;
            const permission = await this.graphQlClient.api( createLinkEndpoint ).post( payload );

            return permission.link.webUrl;
        }

        /**
         * Lists files under a directory prefix.
         *
         * @param pPrefix
         * @param pOptions
         *
         * @returns {Promise<Array<{key: string, size: number, lastModified: Date}>>}
         */
        async list( pPrefix = _mt, pOptions = { includeFiles: true, includeFolders: true } )
        {
            const cleanPrefix = asString( pPrefix, true ).replace( /^\/+|\/+$/g, _mt );

            const options = asObject( pOptions ?? { includeFiles: true, includeFolders: true } );

            const includeFiles = toBool( readProperty( options, "include_files" ) );
            const includeFolders = toBool( readProperty( options, "include_folders" ) );

            if ( !(includeFolders || includeFiles) )
            {
                throw new IllegalArgumentError( `The list method requires at least one option to include either files and/or folders`, { detail: options }, options );
            }

            const endpoint = cleanPrefix
                             ? `/sites/${this.siteId}/drives/${this.driveId}/root:/${this._normalizePath( cleanPrefix )}:/children`
                             : `/sites/${this.siteId}/drives/${this.driveId}/root/children`;

            const response = await this.graphQlClient.api( endpoint ).get();

            let arr = asArray( response.value ?? [] );

            const filter = ( item ) =>
            {
                const isFolder = toBool( item.folder );
                const isFile = toBool( item.file );

                return ((isFile && includeFiles) || (isFolder && includeFolders));
            };

            arr = arr.filter( filter );

            if ( $ln( arr ) > 0 )
            {
                const mapper = ( item ) =>
                {
                    const _isFolder = toBool( item.folder );
                    const _isFile = toBool( item.file );

                    const obj =
                        {
                            itemId: item.id,
                            key: cleanPrefix ? `${cleanPrefix}/${item.name}` : item.name,
                            size: item.size || 0,
                            lastModified: asDate( item.lastModifiedDateTime ),
                            isFolder: function() {return _isFolder;},
                            isFile: function() {return _isFile;}
                        };

                    return lock( obj );
                };

                arr = arr.map( mapper );
            }

            return [...(asArray( arr ?? [] ))];
        }

        /**
         * Polls Graph monitor location URL until an async job (like copy) completes.
         * @private
         */
        async _pollCopyOperation( pMonitorUrl, pInterval = 1_000 )
        {
            const monitorUrl = asString( pMonitorUrl, true );

            const interval = clamp( asInt( pInterval, 1_000 ), 128, 5_000 );

            while ( true )
            {
                const response = await this.graphQlClient.api( monitorUrl ).get();

                if ( "completed" === response.status )
                {
                    break;
                }

                if ( "failed" === response.status )
                {
                    this.dispatchEvent( new ModuleEvent( "error", { detail: monitorUrl }, monitorUrl ) );
                    throw new __Error( `SharePoint Copy Operation failed: ${response.error || "Unknown error"}` );
                }

                // noinspection TypeScriptUMDGlobal,JSValidateTypes
                await new Promise( ( resolve ) => setTimeout( resolve, interval ) );
            }
        }

        /**
         * Copies a file to a new key.
         * Graph API executes copy asynchronously; this method polls until completion.
         *
         * @param {string} pSourceKey
         * @param {string} pDestinationKey
         * @param pOverwrite
         *
         * @returns {Promise<boolean>}
         */
        async copy( pSourceKey, pDestinationKey, pOverwrite = true )
        {
            const sourceKey = asString( pSourceKey, true );
            const sourcePath = this.getPath( sourceKey );
            const sourceEndpoint = `${sourcePath}`.replace( /\/$/, _mt );

            const destinationKey = asString( pDestinationKey, true );
            const { parentPath, filename } = this._parseKey( destinationKey );

            // Get source item ID
            const sourceItem = await this.graphQlClient.api( sourceEndpoint ).select( "id" ).get();

            const payload =
                {
                    name: filename,
                    parentReference:
                        {
                            driveId: this.driveId,
                            path: parentPath ? `/drives/${this.driveId}/root:/${this._normalizePath( parentPath )}` : `/drives/${this.driveId}/root`
                        }
                };

            // Graph copy returns a 202 Accepted with a Location header for tracking execution
            const copyEndpoint = `/sites/${this.siteId}/drives/${this.driveId}/items/${sourceItem.id}/copy`;

            // noinspection JSCheckFunctionSignatures
            const response = await this.graphQlClient.api( copyEndpoint ).responseType( "raw" ).post( payload );

            const monitorUrl = response.headers.get( "location" );
            if ( monitorUrl )
            {
                await this._pollCopyOperation( monitorUrl );
            }
        }

        /**
         * Moves/renames a file. This action is synchronous in Graph API.
         *
         * @param {string} pSourceKey
         * @param {string} pDestinationKey
         * @param pOverwrite
         *
         * @returns {Promise<boolean>}
         */
        async move( pSourceKey, pDestinationKey, pOverwrite = true )
        {
            const sourceKey = asString( pSourceKey, true );
            const sourcePath = this.getPath( sourceKey );
            const sourceEndpoint = `${sourcePath}`.replace( /\/$/, _mt );

            const destinationKey = asString( pDestinationKey, true );
            const { parentPath, filename } = this._parseKey( destinationKey );

            const payload =
                {
                    name: filename,
                    parentReference:
                        {
                            path: parentPath ? `/drives/${this.driveId}/root:/${this._normalizePath( parentPath )}` : `/drives/${this.driveId}/root`
                        }
                };

            await this.graphQlClient.api( sourceEndpoint ).patch( payload );
        }

    }

    BLOB_STORE_CLIENT_FACTORY.registerClass( BLOB_STORE_CLIENT_KEYS.SHAREPOINT, SharePointBlobStorageClient );

    const mod =
        {
            BLOB_STORE_OPERATIONS,
            BLOB_STORE_CLIENT_KEYS,
            BLOB_STORE_CLIENT_FACTORY,
            classes:
                {
                    BlobStorageClient,
                    SharePointBlobStorageClient
                },
            BlobStorageClient,
            SharePointBlobStorageClient
        };

    if ( _ud !== typeof module )
    {
        module.exports = lock( mod );
    }

    return lock( mod );

}());
