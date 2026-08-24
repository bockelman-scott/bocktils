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
            ModuleEvent,
            __Error,
            IllegalArgumentError,
            attempt,
            asyncAttempt,
            hasProperty,
            readProperty,
            lock,
            $ln
        } = moduleUtils;

    const { _ud, _mt } = constants;

    const { isNull, isNonNullObject, isArray, isTypedArray, isFunction, isAsyncFunction, clamp } = typeUtils;

    const { asString, asInt, toBool, isBlank, toUnixPath, _lct } = stringUtils;

    const { asArray } = arrayUtils;

    const { TEN_MINUTES, ONE_HOUR, asDate } = datesModule;

    const { asObject } = jsonUtils;

    const { BLOB_STORE_OPERATIONS, BLOB_STORE_CLIENT_KEYS, BLOB_STORE_CLIENT_FACTORY, BlobStorageClient } = storageBase;

    const { Client } = require( "@microsoft/microsoft-graph-client" );

    const { ClientSecretCredential } = require( "@azure/identity" );

    const MS_KEYS =
        {
            DEFAULT_SCOPE: "https://graph.microsoft.com/.default",
            URL_DOWNLOAD: "@microsoft.graph.downloadUrl",
            CONFLICT_BEHAVIOR: "@microsoft.graph.conflictBehavior",
            CONFLICT_REPLACE: "replace",
            CONFLICT_FAIL: "fail"
        };

    // noinspection JSClosureCompilerSyntax
    /**
     * SharePoint implementation of BlobStorageClient.
     *
     * @class
     * @extends BlobStorageClient
     */
    class SharePointBlobStorageClient extends BlobStorageClient
    {
        #config;
        #clientConfig;

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

            this.#config = lock( config );
            this.#clientConfig = lock( asObject( readProperty( config, "client_config", "client_configuration", "config", "configuration" ) ?? config ) ?? config );

            const site = readProperty( config, "site_id", "site" );
            const library = readProperty( config, "drive_id", "drive", "library_id", "library" );

            let graphClient = readProperty( config, "graph_ql_client", "graph_client", "client", "api_client" );

            if ( !this.#isGraphQlClient( graphClient ) )
            {
                graphClient = this.#createGraphClient( this.#clientConfig ?? this.#config );
            }

            if ( isNull( site ) || isBlank( site ) || isNull( library ) || isBlank( library ) || !this.#isGraphQlClient( graphClient ) )
            {
                throw new IllegalArgumentError( `SharePointBlobStorageClient requires a valid siteId, driveId, and graphClient.`, { detail: config }, config );
            }

            this.#siteId = site;
            this.#driveId = library;
            this.#graphQlClient = graphClient;
        }

        #isGraphQlClient( pObject )
        {
            const graphClient = asObject( pObject ?? {} );
            return (isNonNullObject( graphClient ) && isFunction( graphClient?.api ));
        }

        /**
         * Helper to construct a Client using Azure ClientSecretCredential
         * @private
         */
        #createGraphClient( pConfig )
        {
            const config = asObject( pConfig?.clientConfig ?? pConfig?.config ?? pConfig );

            let qlClient = readProperty( config, "graph_ql_client", "graph_client", "api_client" );

            let authProvider = readProperty( config, "auth_provider", "authenticator", "share_point_authenticator" );

            if ( isNonNullObject( authProvider ) && isAsyncFunction( authProvider.getAccessToken ) )
            {
                qlClient = attempt( () => Client.init( { authProvider } ) );
            }

            if ( this.#isGraphQlClient( qlClient ) )
            {
                return qlClient;
            }

            const tenantId = readProperty( config, "tenant_id", "tenant" );
            const clientId = readProperty( config, "client_id", "client" );
            const clientSecret = readProperty( config, "client_secret", "secret" );
            const tokenRequestOptions = asObject( readProperty( config, "token_request_options", "request_options", "token_options" ) ?? {} ) ?? {};

            if ( isNull( tenantId ) || isNull( clientId ) || isNull( clientSecret ) )
            {
                throw new IllegalArgumentError( `The MS GraphQL Client requires a valid tenantId, clientId, and clientSecret`, { detail: config }, config );
            }

            const options = this.#createAuthOptions( tenantId, clientId, clientSecret, tokenRequestOptions );

            return attempt( () => Client.init( options ) ) ?? qlClient ?? this.#graphQlClient;
        }

        #createAuthOptions( pTenantId, pClientId, pClientSecret, pTokenRequestOptions = {} )
        {
            const tokenRequestOptions = asObject( pTokenRequestOptions ?? {} );

            const tenantId = asString( pTenantId || readProperty( tokenRequestOptions, "tenant_id", "tenant" ), true );
            const clientId = asString( pClientId || readProperty( tokenRequestOptions, "client_id", "client" ), true );
            const clientSecret = asString( pClientSecret || readProperty( tokenRequestOptions, "client_secret", "secret" ), true );

            const scopes =
                [
                    asString( readProperty( tokenRequestOptions, "scopes", "scope" ) ||
                    MS_KEYS.DEFAULT_SCOPE, true ) ||
                    MS_KEYS.DEFAULT_SCOPE
                ];

            // Initialize Azure Identity Credential
            const credentials = new ClientSecretCredential( tenantId, clientId, clientSecret );

            // Provide the authProvider implementation required by Client.init()
            const options =
                {
                    authProvider:
                        {
                            getAccessToken: async() =>
                            {
                                // Scope required for Microsoft Graph API access
                                let tokenScopes = asArray( scopes ?? [MS_KEYS.DEFAULT_SCOPE] );
                                tokenScopes = $ln( tokenScopes ) > 0 ? tokenScopes : [MS_KEYS.DEFAULT_SCOPE];

                                const tokenResponse =
                                    await asyncAttempt( async() => await credentials.getToken( (tokenScopes ?? scopes),
                                                                                               (tokenRequestOptions ?? {}) ) );

                                return asString( isNonNullObject( tokenResponse ) ?
                                                 (readProperty( tokenResponse, "token", "bearer", "bearer_token" ) || tokenResponse.token) :
                                                 asString( tokenResponse || "~~access~denied~~" ) );
                            }
                        }
                };

            return lock( options );
        }

        get siteId()
        {
            return asString( this.#siteId, true );
        }

        get driveId()
        {
            return asString( this.#driveId, true );
        }

        get library()
        {
            return this.driveId;
        }

        get graphQlClient()
        {
            this.#graphQlClient = this.#isGraphQlClient( this.#graphQlClient ) ? this.#graphQlClient : this.#createGraphClient( this.#clientConfig );
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
            const total = pTotal === "*" ? "*" : asInt( pTotal );

            const response = await fetch( url,
                                          {
                                              method: "PUT",
                                              headers:
                                                  {
                                                      "Content-Length": asString( chunkBuffer.length ),
                                                      "Content-Range": `bytes ${start}-${end}/${total}`
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
            return `${this.getLibraryPath()}/root`;
        }

        getPath( pKey )
        {
            const key = asString( pKey, true );

            if ( isBlank( key ) )
            {
                return this.getRoot();
            }

            const path = this._normalizePath( key );

            return `${this.getRoot()}:/${path}`;
        }

        async getItemId( pKey )
        {
            const key = asString( pKey, true );

            const endpoint = `${this.getPath( key )}`;

            try
            {
                return await this.graphQlClient.api( endpoint ).select( "id" ).get();
            }
            catch( error )
            {
                if ( 404 === error.statusCode )
                {
                    return 0;
                }

                this.dispatchEvent( new ModuleEvent( "error", { detail: key }, key, pKey ) );
            }

            return 0;
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
                const endpoint = `${this.getPath( key )}`;

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

            const endpoint = `${path}:/content`;

            const client = this.graphQlClient;

            const FOUR_MB = 4 * 1024 * 1024;

            const content = Buffer.isBuffer( pContent ) ? pContent : isTypedArray( pContent ) ? Buffer.from( pContent ) : pContent;

            if ( Buffer.isBuffer( content ) && content.length < FOUR_MB )
            {
                await client.api( endpoint ).put( content );
            }
            else
            {
                const sessionEndpoint = `${path}:/createUploadSession`;
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

            const endpoint = `${path}:/content`;

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

            const endpoint = `${path}:/listItem/fields`;

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

            if ( isBlank( key ) )
            {
                throw new IllegalArgumentError( `The updateMetadata method requires a valid key/path`, { details: pKey }, pKey, pMetadata );
            }

            const existing = await this.getMetadata( key );

            if ( isNull( pMetadata ) )
            {
                return lock( existing );
            }

            let metadata = { ...(asObject( existing ?? {} )), ...(asObject( pMetadata ?? {} )) };

            const path = this.getPath( key );

            const endpoint = `${path}:/listItem/fields`;

            await this.graphQlClient.api( endpoint ).patch( metadata );

            const updated = await this.getMetadata( key );

            return lock( updated ?? existing );
        }

        /**
         * Generates a web access URL or direct download URL for a key.
         *
         * @param {string} pKey
         * @param pOperation
         * @param pOptions
         * @returns {Promise<string>}
         */
        async getUrl( pKey, pOperation = BLOB_STORE_OPERATIONS.READ, pOptions = {} )
        {
            const options = asObject( pOptions ?? { type: "web" } );

            const key = asString( pKey, true );

            if ( hasProperty( options, "recipients" ) ||
                 hasProperty( options, "expiration_date_time", "expiration_date", "expiration", "expires" ) ||
                 hasProperty( options, "password", "passkey", "pass_key", "pass_phrase" ) )
            {
                return await this.getSecureUrl( key, (pOperation || BLOB_STORE_OPERATIONS.READ), options );
            }

            const type = asString( readProperty( options, "type" ) || pOperation, true );

            const endpoint = this.getPath( key );

            const client = this.graphQlClient;

            if ( ["download", "read"].includes( _lct( type ) ) )
            {
                const item = await client.api( endpoint ).select( MS_KEYS.URL_DOWNLOAD ).get();

                return isNonNullObject( item ) ? item[MS_KEYS.URL_DOWNLOAD] || readProperty( item, MS_KEYS.URL_DOWNLOAD ) : "/";
            }

            const item = await client.api( endpoint ).select( "webUrl" ).get();

            return readProperty( item, "webUrl" ) || item?.webUrl || item;
        }

        /**
         * Generates a sharing or download URL with configurable security options.
         *
         * @param pKey
         * @param pOperation
         * @param pOptions
         *
         * @param {"download" | "view" | "edit" | "embed" | "web"} [pOptions.type="view"] - Type of link/access level
         * @param {"anonymous" | "organization" | "users"} [pOptions.scope="organization"] - Access target scope
         * @param {string[]} [pOptions.recipients] - Array of email addresses (required if scope is "users")
         * @param {Date|string} [pOptions.expirationDateTime] - ISO string or Date object for link expiration
         * @param {string} [pOptions.password] - Optional password to protect the link (requires scope="anonymous")
         *
         * @returns {Promise<string>}
         */
        async getSecureUrl( pKey, pOperation = BLOB_STORE_OPERATIONS.READ, pOptions = {} )
        {
            const options = asObject( pOptions ??
                                          {
                                              type: "view",
                                              scope: "organization",
                                              recipients: [],
                                              expires: null,
                                              password: null
                                          } );

            const key = asString( pKey, true );

            const
                {
                    type = "view",
                    scope = "organization",
                    recipients = [],
                    expirationDateTime = null,
                    password = null
                } = options;

            const client = this.graphQlClient;

            const endpoint = this.getPath( key );

            // Direct binary download link (bypasses sharing link creation)
            if ( type === "download" )
            {
                const item = await client.api( endpoint ).select( MS_KEYS.URL_DOWNLOAD ).get();
                return isNonNullObject( item ) ? item[MS_KEYS.URL_DOWNLOAD] || readProperty( item, MS_KEYS.URL_DOWNLOAD ) : "/";
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
                if ( "anonymous" !== scope )
                {
                    throw new IllegalArgumentError( `Passwords can only be applied to sharing links with scope 'anonymous'.`, { detail: options }, key, pOperation, type, scope );
                }
                payload.password = password;
            }

            if ( "users" === scope )
            {
                if ( !isArray( recipients ) || $ln( recipients ) < 1 )
                {
                    throw new IllegalArgumentError( `A list of recipients (an array of emails) is required when scope is set to 'users'.`, { detail: options }, key, pOperation, type, scope );
                }
                payload.recipients = recipients.map( ( email ) => ({ email }) );
            }

            const createLinkEndpoint = `${endpoint}:/createLink`;
            const permission = await client.api( createLinkEndpoint ).post( payload );

            return readProperty( permission?.link, "webUrl" ) || permission?.link?.webUrl;
        }

        /**
         * Lists files under a directory prefix.
         *
         * @param pPath
         * @param pOptions
         *
         * @returns {Promise<Array<{key: string, size: number, lastModified: Date}>>}
         */
        async list( pPath = _mt, pOptions = { includeFiles: true, includeFolders: true } )
        {
            const path = asString( pPath, true ).replace( /^\/+|\/+$/g, _mt );

            const options = asObject( pOptions ?? { includeFiles: true, includeFolders: true } );

            const includeFiles = toBool( readProperty( options, "include_files", "files" ) );
            const includeFolders = toBool( readProperty( options, "include_folders", "folders", "with_file_types" ) );

            if ( !(includeFolders || includeFiles) )
            {
                throw new IllegalArgumentError( `The list method requires at least one option to include either files and/or folders`, { detail: options }, options );
            }

            const endpoint = path
                             ? `/sites/${this.siteId}/drives/${this.driveId}/root:/${this._normalizePath( path )}:/children`
                             : `/sites/${this.siteId}/drives/${this.driveId}/root/children`;

            const response = await this.graphQlClient.api( endpoint ).get();

            let arr = asArray( response.value ?? response ?? [] );

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
                            key: path ? `${path}/${item.name}` : item.name,
                            size: item.size || 0,
                            lastModified: asDate( item.lastModifiedDateTime ),
                            folder: _isFolder,
                            file: _isFile,
                            isFolder: function() {return _isFolder;},
                            isFile: function() {return _isFile;},
                            item
                        };

                    return lock( obj );
                };

                arr = arr.map( mapper );
            }

            return [...(asArray( arr ?? [] ))];
        }

        /**
         * Polls Graph monitor location URL until an async job (like copy) completes.
         *
         * @param pMonitorUrl the URL to send requests for the status of the operation
         * @param pInterval the number of milliseconds to wait between each request for the status of the operation
         * @param [pMaxDuration=TEN_MINUTES] the maximum amount of time, in milliseconds, to continue polling
         *                                   The largest value accepted for this parameter is ONE_HOUR.
         *
         * @protected
         */
        async _pollAsyncOperation( pMonitorUrl, pInterval = 1_000, pMaxDuration = TEN_MINUTES )
        {
            const monitorUrl = asString( pMonitorUrl, true );

            const interval = clamp( asInt( pInterval, 1_000 ), 128, 5_000 );

            const maxDuration = clamp( asInt( pMaxDuration, TEN_MINUTES, ONE_HOUR ) );

            const now = Date.now();

            let completed = false;

            while ( true )
            {
                const then = Date.now();

                if ( Math.abs( then - now ) > maxDuration )
                {
                    this.dispatchEvent( new ModuleEvent( "timeout",
                                                         {
                                                             detail:
                                                                 {
                                                                     monitorUrl,
                                                                     interval,
                                                                     start: now,
                                                                     end: then
                                                                 }
                                                         }, monitorUrl ) );
                    break;
                }

                const response = await this.graphQlClient.api( monitorUrl ).get();

                if ( "completed" === response.status )
                {
                    completed = true;
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

            return completed;
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
        async copy( pSourceKey, pDestinationKey, pOverwrite = false )
        {
            const sourceKey = asString( pSourceKey, true );
            const sourcePath = this.getPath( sourceKey );
            const sourceEndpoint = `${sourcePath}`.replace( /\/$/, _mt );

            const destinationKey = asString( pDestinationKey, true );
            const { parentPath, filename } = this._parseKey( destinationKey );

            const overwrite = toBool( pOverwrite );

            if ( !overwrite )
            {
                const fileExists = await this.exists( destinationKey );
                if ( fileExists )
                {
                    this.dispatchEvent( new ModuleEvent( "error", { detail: `Content already exists at ${destinationKey}` }, `Content already exists at ${destinationKey}` ) );
                    return false;
                }
            }

            // Get source item ID
            const sourceItem = await this.graphQlClient.api( sourceEndpoint ).select( "id" ).get();

            const payload =
                {
                    name: filename,
                    [MS_KEYS.CONFLICT_BEHAVIOR]: (overwrite ? MS_KEYS.CONFLICT_REPLACE : MS_KEYS.CONFLICT_FAIL),
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

            if ( response?.headers )
            {
                const monitorUrl = response.headers.get( "location" ) || response.headers.get( "Location" ) || readProperty( response.headers, "location", "monitor_url" );
                if ( monitorUrl )
                {
                    return await asyncAttempt( async() => await this._pollAsyncOperation( monitorUrl ) );
                }
            }

            return true;
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
        async move( pSourceKey, pDestinationKey, pOverwrite = false )
        {
            const sourceKey = asString( pSourceKey, true );
            const sourcePath = this.getPath( sourceKey );
            const sourceEndpoint = `${sourcePath}`.replace( /\/$/, _mt );

            const destinationKey = asString( pDestinationKey, true );
            const { parentPath, filename } = this._parseKey( destinationKey );

            const overwrite = toBool( pOverwrite );

            if ( !overwrite )
            {
                const fileExists = await this.exists( destinationKey );
                if ( fileExists )
                {
                    this.dispatchEvent( new ModuleEvent( "error", { detail: `Content already exists at ${destinationKey}` }, `Content already exists at ${destinationKey}` ) );
                    return false;
                }
            }

            const payload =
                {
                    name: filename,
                    [MS_KEYS.CONFLICT_BEHAVIOR]: (overwrite ? MS_KEYS.CONFLICT_REPLACE : MS_KEYS.CONFLICT_FAIL),
                    parentReference:
                        {
                            path: parentPath ? `/drives/${this.driveId}/root:/${this._normalizePath( parentPath )}` : `/drives/${this.driveId}/root`
                        }
                };

            await this.graphQlClient.api( sourceEndpoint ).patch( payload );

            return await this.exists( destinationKey );
        }

    }

    BLOB_STORE_CLIENT_FACTORY.registerClass( BLOB_STORE_CLIENT_KEYS.SHAREPOINT, SharePointBlobStorageClient );

    const mod =
        {
            MS_KEYS,
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
