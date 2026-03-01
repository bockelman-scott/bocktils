/**
 * This module provides a common interface
 * for connecting to and interacting with
 * a database or database server.
 *
 */

const core = require( "@toolbocks/core" );

const secretsModule = require( "@toolbocks/secrets" );

const { constants } = core;

const { _ud = "undefined" } = constants;

const $scope = constants?.$scope || function()
{
    return (_ud === typeof self ? ((_ud === typeof global) ? ((_ud === typeof globalThis ? {} : globalThis)) : (global || {})) : (self || {}));
};

(function exposeModule()
{
    const INTERNAL_NAME = "__BOCK__DATABASE_FACTORY__";

    if ( $scope() && (null != $scope()[INTERNAL_NAME]) )
    {
        return $scope()[INTERNAL_NAME];
    }

    const moduleName = "DatabaseUtils";

    const { moduleUtils, constants, typeUtils, stringUtils, arrayUtils } = core;

    const {
        ToolBocksModule,
        IllegalArgumentError,
        populateOptions,
        no_op,
        attempt,
        asyncAttempt,
        attemptMethod,
        objectEntries,
        lock,
        isLogger,
        ExecutionMode
    } = moduleUtils;

    const konsole = console;

    const { _mt_str, _mt = _mt_str, _hyphen } = constants;

    const {
        isNull,
        isNonNullObject,
        isString,
        isNumeric,
        isFunction,
        isClass,
        getClass,
        getClassName,
        isMap,
        isArray,
        isObject
    } = typeUtils;

    const { asString, isBlank, asInt, lcase, ucase } = stringUtils;

    const { asArray } = arrayUtils;

    const {
        SecretsManagerMode,
        SecretsManager,
        SecretsManagerFactory,
        SECRETS_KEYS,
        getSecretsManager
    } = secretsModule;

    const toolBocksModule = new ToolBocksModule( moduleName, INTERNAL_NAME );

    const mode = toolBocksModule.executionMode || ExecutionMode[process.env.MODE || process.argv[2] || "PROD"] || ExecutionMode.MODES.PROD;

    const DEFAULT_DB_FACTORY_OPTIONS =
        {
            mode,
        };

    const DEFAULT_DATABASE_OPTIONS =
        {
            mode,
        };

    /**
     * Represents a DatabaseServer with support for customizable connection parameters,
     * authentication management, and secure connection string generation.
     * <br><br>
     *
     * This class is meant to be extended by subclasses
     * to implement `connect()` and `disconnect()` and other server-specific functionality.
     * <br>
     */
    class DatabaseServer
    {
        #options = { ...DEFAULT_DATABASE_OPTIONS };

        #dbType; // "mongoose", "SqlServer", "etc"

        #adminUserName;

        #secretsManager;
        #connectionStringKey = "CONNECTION_STRING";

        #serverProtocol;
        #serverHost;
        #serverPort;
        #defaultDatabase;
        #authSource;
        #connectionOptions;

        #serverInstance = null;

        #connected = false;

        #connectionsMap = new Map();

        constructor( pDbType, pAdminUserName, pSecretsManager, pConnectionStringKey, pOptions )
        {
            const options = populateOptions( pOptions || {}, DEFAULT_DATABASE_OPTIONS || {} );

            this.#options = Object.assign( {}, options );

            this.#dbType = asString( pDbType, true ) || asString( options.dbType, true );

            this.#secretsManager = (pSecretsManager instanceof SecretsManager ? pSecretsManager : options["SecretsManager"]) ||
                                   options["SecretsManager"] ||
                                   getSecretsManager( options.mode || toolBocksModule.executionMode || "DEVELOPMENT",
                                                      "./.env",
                                                      ucase( this.dbType ),
                                                      options );

            this.#secretsManager = (this.#secretsManager instanceof SecretsManager ? this.#secretsManager : new SecretsManagerFactory( options.mode, options.keyPath, options.prefix, options ).getSecretsManager( options ));

            this.#serverProtocol = options.connectionOptions?.protocol || options.protocol || this.#secretsManager.getCachedSecret( SECRETS_KEYS.PROTOCOL );

            this.#serverHost = options.connectionOptions?.host || options.host || options.connectionOptions?.hostName || options.hostName || this.#secretsManager.getCachedSecret( SECRETS_KEYS.HOST );

            this.#serverPort = options.connectionOptions?.post || options.port || this.#secretsManager.getCachedSecret( SECRETS_KEYS.PORT );

            this.#defaultDatabase = options.connectionOptions?.defaultDatabase || options.defaultDatabase || options.connectionOptions?.authDatabase || options.authDatabase || options.connectionOptions?.authDb || options.authDb || options.connectionOptions?.database || options.database || this.#secretsManager.getCachedSecret( SECRETS_KEYS.DEFAULT_DATABASE ) || this.#secretsManager.getCachedSecret( SECRETS_KEYS.AUTH_DATABASE );

            this.#authSource = options.connectionOptions?.authSource || options.authSource || this.#secretsManager.getCachedSecret( SECRETS_KEYS.AUTH_DATABASE );

            this.#connectionStringKey = pConnectionStringKey || "CONNECTION_STRING";
        }

        get dbType()
        {
            return asString( this.#dbType, true );
        }

        get serverInstance()
        {
            return this.#serverInstance;
        }

        /**
         * Sets the connection options used when initializing or connecting to a database or database server
         *
         * @param {Object} pOptions - The options used to initialize or connect to the database or database server.
         *                            If not provided, this defaults to the existing connection options
         *                            or predefined default options.
         */
        set connectionOptions( pOptions )
        {
            this.#connectionOptions = populateOptions( pOptions || {}, this.#options.connectionOptions || { ...DEFAULT_DATABASE_OPTIONS.connectionOptions } );
        }

        /**
         * Retrieves the initialization/connection options to use when connecting to a specific database or database server.
         * If custom connection options are not defined,
         * it returns the default connection options.
         *
         * @return {Object} The connection options for the database.
         */
        get connectionOptions()
        {
            return populateOptions( {}, this.#connectionOptions || { ...DEFAULT_DATABASE_OPTIONS.connectionOptions } );
        }

        /**
         * Returns the server protocol to be used when connecting to or communicating with a database or database server.
         *
         * Combines the protocol from internal server configuration, connection options, or default database options.
         * Ensures the protocol string is properly formatted and ends with "://".
         *
         * @return {string} The server protocol with "://" appended to ensure the proper format.
         */
        get serverProtocol()
        {
            let protocol = asString( this.#serverProtocol || this.connectionOptions.protocol || DEFAULT_DATABASE_OPTIONS.protocol, true );

            return ((asString( protocol, true ).replace( /:\/\/$/, _mt )) + ("://"));
        }

        /**
         * Sets the server protocol to the compatible protocol string
         * for connecting to or communicating with
         * a particular database or database server.
         *
         * @param {string} pProtocol - The protocol to use for the database or database server.
         * The value will be evaluated as a string and formatted to end with `://`.
         */
        set serverProtocol( pProtocol )
        {
            this.#serverProtocol = (asString( pProtocol, true ).replace( /:\/\/$/, _mt ) + ("://"));
        }

        get serverHost()
        {
            return this.#serverHost || this.connectionOptions.host || this.connectionOptions.hostName || DEFAULT_DATABASE_OPTIONS.host || DEFAULT_DATABASE_OPTIONS.hostName;
        }

        set serverHost( pHost )
        {
            this.#serverHost = asString( pHost, true ) || this.connectionOptions.host || this.connectionOptions.hostName || DEFAULT_DATABASE_OPTIONS.host || DEFAULT_DATABASE_OPTIONS.hostName;
        }

        get serverPort()
        {
            return asInt( asInt( this.#serverPort ) || asInt( this.connectionOptions.port ) );
        }

        set serverPort( pPort )
        {
            this.#serverPort = asInt( pPort ) || asInt( this.connectionOptions.port ) || asInt( this.options.port );
        }

        get defaultDatabase()
        {
            return asString( this.#defaultDatabase, true ) || this.connectionOptions.defaultDatabase || this.options.defaultDatabase;
        }

        set defaultDatabase( pAuthDb )
        {
            this.#defaultDatabase = asString( pAuthDb, true ) || this.connectionOptions.defaultDatabase || DEFAULT_DATABASE_OPTIONS.defaultDatabase;
        }

        get authSource()
        {
            return asString( this.#authSource, true ) || this.options.authSource;
        }

        set authSource( pAuthSource )
        {
            this.#authSource = asString( pAuthSource, true );
        }

        get options()
        {
            return Object.assign( {}, this.#options || DEFAULT_DATABASE_OPTIONS );
        }

        get adminUserName()
        {
            return this.#adminUserName || this.connectionOptions?.adminUserName || this.options.adminUserName;
        }

        get secretsManager()
        {
            return this.#secretsManager || SecretsManagerFactory.makeSecretsManager( SecretsManagerMode.resolveMode( toolBocksModule.executionMode ), _mt, this.system || "DB", this.options );
        }

        get connected()
        {
            return this.#connected && !isNull( this.#serverInstance ) && (this.#connectionsMap.size > 0 || [...(asArray( this.#serverInstance?.connections || [] ) || [])].length > 0);
        }

        set connected( pConnected )
        {
            this.#connected = !!pConnected;
        }

        addConnection( pConnection )
        {
            if ( !isNull( pConnection ) )
            {
                let key = pConnection?.name || pConnection?.id || pConnection?.url;

                this.#connectionsMap = this.#connectionsMap || new Map();
                if ( key )
                {
                    this.#connectionsMap.set( key, pConnection );
                    this.#connectionsMap.set( ucase( asString( key, true ) ), pConnection );
                }

                return this.#connectionsMap.get( key ) || this.#connectionsMap.get( ucase( asString( key, true ) ) );
            }

            return pConnection;
        }

        async buildConnectionString()
        {
            let connectionString = await this.#secretsManager.get( this.#connectionStringKey || SECRETS_KEYS.CONNECTION_STRING );
            connectionString = asString( connectionString, true ) || await this.#secretsManager.get( SECRETS_KEYS.CONNECTION_STRING );

            if ( isBlank( connectionString ) )
            {
                let userName = asString( this.#adminUserName, true ) || await this.#secretsManager.get( SECRETS_KEYS.ADMIN_LOGIN_NAME );
                let password = await this.#secretsManager.get( SECRETS_KEYS.ADMIN_LOGIN_PWD );
                let host = asString( this.serverHost, true ) || asString( this.connectionOptions.host, true ) || asString( DEFAULT_DATABASE_OPTIONS.host, true );
                let port = asString( this.serverPort, true ) || asString( this.connectionOptions.port, true ) || asString( DEFAULT_DATABASE_OPTIONS.port, true );

                let omitUserName = (isBlank( userName ) || isBlank( password ));

                connectionString = this.serverProtocol;
                connectionString += omitUserName ? _mt : (userName + ":" + password + "@" + host);
                connectionString += (!isBlank( port ) && asInt( port ) > 0 ? ":" + port : _mt);
                connectionString += isBlank( this.defaultDatabase ) ? _mt : "/" + asString( this.defaultDatabase, true );
                connectionString += isBlank( this.authSource ) ? _mt : "?" + asString( this.authSource, true );
            }

            if ( isNonNullObject( this.connectionOptions ) )
            {
                connectionString += (!connectionString.includes( "?" ) ? "?" : "&");

                const excluded = ["connectionString", "host", "hostName", "userName", "password", "port", "authSource", "authDatabase"];

                objectEntries( this.connectionOptions ).forEach( entry =>
                                                                 {
                                                                     const key = entry.key;
                                                                     const value = entry.value;

                                                                     if ( !(excluded.includes( key ) || excluded.map( lcase ).includes( lcase( key ) )) )
                                                                     {
                                                                         connectionString += key + "=" + value + "&";
                                                                     }
                                                                 } );
            }
            return connectionString.replace( /&$/, _mt );
        }

        updateConnectionState()
        {
            const me = this;

            if ( !isNull( this.#serverInstance ) )
            {
                const connections = [...(asArray( this.#serverInstance?.connections || [] ) || [])];
                connections.forEach( connection => (me || this).addConnection( connection ) );
                this.connected = connections.length > 0;
            }
        }

        get connections()
        {
            let conns = [...(asArray( this.#serverInstance?.connections || [] ) || [])].filter( e => !isNull( e ) );
            if ( conns.length > 0 )
            {
                return conns;
            }
            return [...(asArray( objectEntries( this.#connectionsMap ) ).map( e => e.value || e ))];
        }

        findConnection( pName )
        {
            let conn = null;

            if ( isMap( this.#connectionsMap ) )
            {
                conn = this.#connectionsMap.get( pName ) || this.#connectionsMap.get( asString( pName, true ) ) || this.#connectionsMap.get( ucase( asString( pName, true ) ) );
            }

            if ( isNull( conn ) )
            {
                let arr = asArray( this.connections );
                for( let c of arr )
                {
                    if ( c && (c.name === pName || ucase( asString( c.name, true ) ) === ucase( asString( pName, true ) )) )
                    {
                        conn = c;
                        break;
                    }
                }
            }

            return conn || this.#serverInstance?.connection;
        }

        // This method is meant to be implemented by subclasses.
        async doConnect()
        {

        }

        async connect()
        {
            // This method is meant to be implemented by subclasses.
            this.#serverInstance = await this.doConnect();

            // Subclasses should call this superclass method AFTER its own logic
            this.updateConnectionState();

            return this.#serverInstance;
        }

        async doDisconnect()
        {

        }

        async disconnect()
        {
            // This method is intended to be implemented by subclasses.
            await this.doDisconnect();

            // Subclasses should call this superclass method AFTER its own logic.
            this.updateConnectionState();
        }

        getDatabase( pName, pOptions )
        {
            return new Database( this.dbType, asString( pName, true ), this, populateOptions( pOptions || {}, this.options ) );
        }
    }

    /**
     * Represents a database connection and provides methods for database operations.
     * <br><br>
     * This class extends the `DatabaseServer` class and manages the connection to a specific database instance.
     * <br>
     */
    class Database extends DatabaseServer
    {
        #name = _mt;
        #type = _mt;

        #server;
        #connection;

        #schemaDefinitions = new Map();
        #models = new Map();

        constructor( pType, pName, pDatabaseServer, pOptions )
        {
            super( pType, pDatabaseServer?.adminUserName || _mt, pDatabaseServer?.secretsManager );

            const options = populateOptions( pOptions, pDatabaseServer?.options || DEFAULT_DATABASE_OPTIONS );

            this.#type = asString( pType, true ) || this.dbType;

            this.#server = ((pDatabaseServer instanceof DatabaseServer) ? pDatabaseServer : new DatabaseServer( this.#type, this.adminUserName, this.secretsManager, SECRETS_KEYS.CONNECTION_STRING, this.options ));

            this.#name = asString( pName, true ) || pDatabaseServer.defaultDatabase || options.name;

            let connections = [...(asArray( this.#server?.connections || this.connections || [] ) || [])];

            connections.forEach( connection =>
                                 {
                                     if ( !isNull( connection ) && (connection.name === this.name || ucase( connection.name ) === ucase( this.name )) )
                                     {
                                         this.#connection = connection;
                                     }
                                 } );

            this.#connection = this.#connection || (1 === connections.length ? connections[0] : this.#connection);
        }

        get type()
        {
            return asString( this.#type, true ) || asString( this.#name, true );
        }

        get server()
        {
            this.#server = (this.#server instanceof DatabaseServer) ? this.#server : new DatabaseServer( this.type, this.adminUserName, this.secretsManager, SECRETS_KEYS.CONNECTION_STRING, this.options );
            return this.#server;
        }

        get connection()
        {
            return this.#connection || this.server?.connection;
        }

        get id()
        {
            return this.connection?.id || this.connection?.name || this.connection?.url;
        }

        get name()
        {
            return asString( this.#name, true ) || asString( this.#type, true );
        }

        get schemaDefinitions()
        {
            return this.#schemaDefinitions;
        }

        get models()
        {
            return this.#models;
        }

        async ensureConnected()
        {
            const me = this;

            let needsConnection = false;

            if ( isNull( this.#server ) && isNull( this.#connection ) )
            {
                needsConnection = true;
            }
            else
            {
                let connections = [...(asArray( this.#server?.connections || this.connections || [] ) || [])].map( e => e.name );
                if ( !(connections.includes( this.name ) || connections.map( ucase ).includes( ucase( this.name ) )) )
                {
                    needsConnection = true;
                }
                else
                {
                    this.#connection = this.#connection || (connections.find( e => e.name === (me || this.name) || ucase( e.name ) === ucase( (me || this).name ) ));
                }
            }

            if ( needsConnection )
            {
                let factory = new DatabaseFactory( SecretsManagerMode.resolveMode( this.mode || toolBocksModule.executionMode ), this.secretsManager, this.dbType, {}, this.options );

                this.#server = this.#server || await asyncAttempt( () => factory.getDatabaseServer( this.dbType, this.adminUserName, this.secretsManager, "CONNECTION_STRING", this.options ) );

                await this.#server.connect();

                this.updateConnectionState();

                return this.#connection || this.#server?.connection;
            }

            return this.#connection;
        }

        async addSchemaDefinition( pName, pData )
        {
            // overridden by subclasses
            if ( !isNull( pData ) )
            {
                this.#schemaDefinitions.set( pName, pData );
                this.#schemaDefinitions.set( ucase( asString( pName, true ) ), pData );
            }
        }

        async addSchemaModel( pName, pModel )
        {
            // overridden by subclasses
            if ( !isNull( pModel ) )
            {
                this.#models.set( pName, pModel );
                this.#models.set( ucase( asString( pName, true ) ), pModel );
            }
        }

        async defineSchema( pSchemaData, pModelData )
        {
            let data = [];

            if ( isMap( pSchemaData ) || isNonNullObject( pSchemaData ) )
            {
                data = objectEntries( pSchemaData );
            }
            else if ( isArray( pSchemaData ) )
            {
                data = [...(asArray( pSchemaData ))];
            }

            data = data.filter( e => !isNull( e ) );

            const me = this;

            data.forEach( entry =>
                          {
                              let key = entry.key || entry.name || entry.path;
                              let value = entry.value || entry;
                              attempt( () => me.addSchemaDefinition( key, value ) );
                          } );

            if ( isNonNullObject( pModelData ) || isArray( pModelData ) || isFunction( pModelData ) )
            {
                data = [];
                data = isArray( pModelData ) ? [...(asArray( pModelData || [] ) || [])] : isObject( pModelData ) ? [...(objectEntries( pModelData ))] : [];
                data = data && data.length > 0 ? data : isFunction( pModelData ) ? attempt( () => pModelData.call( me ) ) : [];

                data = data.filter( e => !isNull( e ) );

                if ( data )
                {
                    data.forEach( entry =>
                                  {
                                      let key = entry.key || entry.name || entry.path || getClassName( entry );
                                      let value = entry.value || entry;
                                      attempt( () => me.addSchemaModel( key, value ) );
                                  } );
                }
            }
        }

        async executeDdl( pDdl )
        {
            // implemented by subclasses
        }

        async getSchemas()
        {
            return [...(this.#schemaDefinitions || [])].map( e => isFunction( e.clone ) ? e.clone() : lock( e ) );
        }

        async getSchemaDefinition( pName )
        {
            if ( this.#schemaDefinitions?.size > 0 )
            {
                const nm = asString( pName, true );
                return lock( this.#schemaDefinitions.get( nm ) || this.#schemaDefinitions.get( ucase( nm ) ) );
            }
            return null;
        }

        async getModels()
        {
            return [...(this.#models || [])].map( e => isFunction( e.clone ) ? e.clone() : lock( e ) );
        }

        async getSchemaModel( pName )
        {
            if ( this.#models?.size > 0 )
            {
                const nm = asString( pName, true );
                return lock( this.#models.get( nm ) || this.#models.get( ucase( nm ) ) );
            }

            return this.getSchemaDefinition( pName );
        }

        async find( pQuery, pOptions )
        {

        }

        async findFirst( pQuery, pOptions )
        {

        }

        async findSubset( pQuery, pStart, pStop, pOptions )
        {

        }

        async insert( pCollection, { columns: [], values: [] }, pOptions )
        {
            const me = this;

            await asyncAttempt( () => (me || this).ensureConnected() );

            // subclass-specific code should call this superclass method BEFORE performing the operation
        }

        async insertBatch( pCollection, [{ columns: [], values: [] }], pOptions )
        {
            const me = this;

            await asyncAttempt( () => (me || this).ensureConnected() );

            // subclass-specific code should call this superclass method BEFORE performing the operation

        }

        async update( pCollection, { columns: [], values: [] }, pPredicate, pOptions )
        {
            const me = this;

            await asyncAttempt( () => (me || this).ensureConnected() );

            // subclass-specific code should call this superclass method BEFORE performing the operation

        }

        async updateBatch( pCollection, [{ columns: [], values: [] }], pPredicate, pOptions )
        {
            const me = this;

            await asyncAttempt( () => (me || this).ensureConnected() );

            // subclass-specific code should call this superclass method BEFORE performing the operation

        }

        async upsert( pCollection, { columns: [], values: [] }, pOptions )
        {
            const me = this;

            await asyncAttempt( () => (me || this).ensureConnected() );

            // subclass-specific code should call this superclass method BEFORE performing the operation

        }

        async delete( pCollection, pPredicate, pOptions )
        {
            const me = this;

            await asyncAttempt( () => (me || this).ensureConnected() );

            // subclass-specific code should call this superclass method BEFORE performing the operation

        }

        async truncate( pCollection, pOptions )
        {
            const me = this;

            await asyncAttempt( () => (me || this).ensureConnected() );

            // subclass-specific code should call this superclass method BEFORE performing the operation

        }

        async connect()
        {
            return asyncAttempt( async() => await this.server.connect() || await super.connect() );
        }

        async disconnect()
        {
            return asyncAttempt( async() => await this.server.disconnect || await super.disconnect() );
        }
    }

    class DatabaseFactory
    {
        #mode = "production";

        #secretsManager;
        #secretsPrefix = "DB";

        #options = {};

        #choices = new Map();

        constructor( pMode, pSecretsManager, pPrefix = "DB", pChoices, pOptions )
        {
            const options = populateOptions( pOptions || {}, DEFAULT_DB_FACTORY_OPTIONS || {} );

            if ( isNonNullObject( pChoices ) )
            {
                objectEntries( pChoices ).forEach( entry =>
                                                   {
                                                       this.#choices.set( entry.key, entry.value );
                                                   } );
            }

            this.#mode = SecretsManagerMode.resolveMode( pMode || options.mode || toolBocksModule.executionMode );

            this.#secretsPrefix = asString( pPrefix, true );

            let system = (([...(asArray( this.#choices?.keys() || [] ))]).map( e => asString( e, true ) ).filter( e => !isBlank( e ) ).concat( this.secretsPrefix || "DB" ).flat())[0];

            this.#secretsPrefix = isBlank( this.#secretsPrefix ) ? system : this.#secretsPrefix;

            this.#secretsManager = pSecretsManager || options.secretsManager || getSecretsManager( this.#mode, "./.env", (system || this.secretsPrefix || "DB"), options );

            this.#options = populateOptions( options, DEFAULT_DB_FACTORY_OPTIONS );
        }

        get options()
        {
            return lock( Object.assign( {}, this.#options ) );
        }

        get secretsPrefix()
        {
            return asString( this.#secretsPrefix, true );
        }

        set secretsPrefix( pValue )
        {
            this.#secretsPrefix = pValue;
        }

        get mode()
        {
            return SecretsManagerMode.resolveMode( this.#mode || toolBocksModule.executionMode );
        }

        get secretsManager()
        {
            return lock( this.#secretsManager || getSecretsManager( this.mode, "./.env", "DB", this.options ) );
        }

        get adminUserName()
        {
            if ( this.secretsManager )
            {
                return this.secretsManager.getCachedSecret( SECRETS_KEYS.ADMIN_LOGIN_NAME ) || this.secretsManager.getCachedSecret( SECRETS_KEYS.LOGIN_NAME );
            }
            return _mt;
        }

        addChoice( pKey, pDatabaseServer, pOptions )
        {
            let dbServer = (pDatabaseServer instanceof DatabaseServer ? pDatabaseServer : null) || new DatabaseServer( pDatabaseServer?.dbType, pDatabaseServer?.adminUserName, pDatabaseServer?.secretsManager, SECRETS_KEYS.CONNECTION_STRING, pOptions );
            this.#choices.set( pKey, dbServer );
        }

        getDatabaseServer( pKey, pAdminUserName, pSecretsManager, pConnectionStringKey, pOptions )
        {
            let server = this.#choices.get( pKey ) || this.#choices.get( ucase( asString( pKey, true ) ) );

            if ( !isNonNullObject( server ) )
            {
                server = new DatabaseServer( pKey, pAdminUserName || this.adminUserName, pSecretsManager, pConnectionStringKey, pOptions );
            }

            server = (server instanceof DatabaseServer) ? server : new DatabaseServer( pKey, server.adminUserName || pAdminUserName, server.secretsManager || pSecretsManager, pConnectionStringKey, populateOptions( pOptions, server.options ) );

            this.#choices.set( pKey, server );
            this.#choices.set( ucase( asString( pKey, true ) ), server );

            return server;
        }

        async getDatabase( pType, pDatabaseServer, pName, pOptions )
        {
            const dbServer = isNonNullObject( pDatabaseServer ) && pDatabaseServer instanceof DatabaseServer ?
                             pDatabaseServer || this.getDatabaseServer( pType, this.adminUserName, this.secretsManager, SECRETS_KEYS.CONNECTION_STRING, pOptions ) :
                             this.getDatabaseServer( pType, this.adminUserName, this.secretsManager, SECRETS_KEYS.CONNECTION_STRING, pOptions );

            return !isNull( dbServer ) ? dbServer.getDatabase() || new Database( pType, pName, dbServer, pOptions ) : new Database( pType, pName, dbServer, pOptions );
        }
    }

    let mod =
        {
            dependencies:
                {
                    core,
                    moduleUtils,
                    typeUtils,
                    stringUtils,
                    arrayUtils
                },
            DatabaseServer,
            Database,
            DatabaseFactory
        };

    mod = toolBocksModule.extend( mod );

    return mod.expose( mod, INTERNAL_NAME, (_ud !== typeof module ? module : mod) ) || mod;

}());
