const dotenvx = require( "@dotenvx/dotenvx" );

const { SecretClient } = require( "@azure/keyvault-secrets" );
const { ChainedTokenCredential, DefaultAzureCredential } = require( "@azure/identity" );

const core = require( "@toolbocks/core" );
const fileUtils = require( "@toolbocks/files" );
const jsonUtils = require( "@toolbocks/json" );

const { constants } = core;

const { _ud = "undefined", $scope } = constants;

(function exposeModule()
{
    const INTERNAL_NAME = "__BOCK__SECRETS_UTILS__";

    if ( $scope() && (null != $scope()[INTERNAL_NAME]) )
    {
        return $scope()[INTERNAL_NAME];
    }

    const { moduleUtils, constants, typeUtils, stringUtils, arrayUtils } = core;

    const
        {
            ToolBocksModule,
            ExecutionEnvironment,
            ExecutionMode,
            populateOptions,
            populateProperties,
            attempt,
            asyncAttempt,
            lock,
            $ln
        } = moduleUtils;

    const { _mt_str, _mt = _mt_str, _hyphen, _underscore } = constants;

    const
        {
            isNull,
            isString,
            isNumeric,
            isNonNullObject,
            isNonNullValue,
            isArray,
            isClass,
            getClassName,
            isFunction
        } = typeUtils;

    const { asString, isBlank, ucase, lcase, asInt, isFilePath, isJson } = stringUtils;

    const { asArray, unique } = arrayUtils;

    const { exists, resolvePath, readFile } = fileUtils;

    const { parseJson } = jsonUtils;

    let KEYS =
        {
            EXECUTION_MODE: "EXECUTION-MODE",
            TEST_SECRET: "TEST-SECRET",
            KEY_VAULT_NAME: "KV-NAME",
            KEY_STORE_NAME: "KEY-STORE-NAME",

            SERVER_APPLICATION: "SERVER-APPLICATION",

            SUPPORTED_DATABASE_TYPES: "SUPPORTED_DATABASE-TYPES",
            DATABASE_TYPE: "DATABASE-TYPE",
            DATABASE_NAME: "DATABASE-NAME",

            USE_SSL: "USE-SSL",
            KEY_PATH: "KEY-PATH",
            CERT_PATH: "CERT-PATH",

            ROOT_PATH: "ROOT-PATH",

            CONNECTION_STRING: "CONNECTION-STRING",
            PROTOCOL: "PROTOCOL",
            HOST: "HOST",
            PORT: "PORT",
            AUTH_DATABASE: "AUTH-DATABASE",
            DEFAULT_DATABASE: "DEFAULT-DATABASE",
            DEFAULT_COLLECTION_NAME: "DEFAULT_COLLECTION-NAME",

            LOGIN_NAME: "LOGIN-NAME",
            LOGIN_PWD: "LOGIN-PWD",

            CORS_ALLOWED_ORIGIN: "CORS_ALLOWED-ORIGIN",
            RATE_LIMIT_MS: "RATE_LIMIT-MS",
            RATE_LIMIT_MS_MAX: "RATE_LIMIT_MS-MAX",

            INSTANCE: "INSTANCE",
            INSTANCE_URL: "INSTANCE-URL",
            TOKEN_URL: "TOKEN-URL",
            REDIRECT_URI: "REDIRECT-URI",

            PERSONAL_ACCESS_TOKEN: "PERSONAL-ACCESS-TOKEN",
            API_KEY: "API-KEY",
            ACCESS_TOKEN: "ACCESS-TOKEN",
            API_VERSION: "API-VERSION",

            AUTH_URL: "AUTH-URL",

            CLIENT_ID: "CLIENT-ID",
            CLIENT_SECRET: "CLIENT-SECRET",

            ORG_ID: "ORG-ID",
            USER_ID: "USER-ID",

            SCOPES: "SCOPES",

            ADMIN_LOGIN_NAME: "ADMIN_LOGIN-NAME",
            ADMIN_LOGIN_PWD: "ADMIN_LOGIN-PWD"
        };

    const createKey = ( pSystemPrefix, pKey ) =>
    {
        let prefix = ucase( asString( pSystemPrefix, true ) );

        let keyPart = (ucase( asString( pKey, true ) )).replace( new RegExp( ("^" + prefix), "i" ), _mt ).replace( /^[_-]+/, _mt ).trim();

        return ucase( isBlank( prefix ) ? keyPart : (prefix + _hyphen + keyPart) );
    };

    const DEFAULT_OPTIONS =
        {
            source: "./.env",
            allowCache: true,
            excludeFromCache: []
        };

    /**
     * The module that will be returned to expose the classes and functionality of the SecretsManager.
     */
    const toolBocksModule = new ToolBocksModule( "SecretsManager", INTERNAL_NAME );

    const calculateSecretsSource = function( pExecutionMode )
    {
        let executionMode = pExecutionMode || ExecutionMode.calculate();

        let secretsManagerMode = SecretsManagerMode.from( executionMode );

        return secretsManagerMode?.useAzure ? process?.env?.["KV-NAME"] : "./.env";
    };

    // noinspection JSUnusedLocalSymbols
    /**
     * This is the superclass for objects that can retrieve external values by key from a secure store.
     * <br>
     * <br>
     * Objects of this class may be used to read from process.env, Azure KeyVault, etc.
     * @class
     */
    class SecretsManager
    {
        #mode;
        #source = calculateSecretsSource();
        #system = _mt;

        #options = {};

        #cache = new Map();
        #allowCache = true;
        #excludeFromCache = [];

        #invalidKeys = [];

        // noinspection GrazieInspection
        /**
         * Constructs an instance of this class.
         * <br>
         * <br>
         * This base class should rarely be constructed except as by a subclass constructor call to super().
         * <br>
         * @param pSource - the key/value store to use (such as a path to the .env file or the NAME of the key vault)
         * @param pSystem - the system or module whose key/value pairs this instance stores, such as FA, LD, FV, RLS, etc
         * @param pOptions - an object providing subclass-specific values for the construction of the instance
         *
         * @constructor
         */
        constructor( pSource = calculateSecretsSource(), pSystem, pOptions = {} )
        {
            this.#mode = SecretsManagerMode.fromExecutionMode( toolBocksModule.executionMode );

            this.#source = pSource;
            this.#system = pSystem;

            const options = populateOptions( pOptions || {}, DEFAULT_OPTIONS ) || {};

            this.#options = lock( options );

            this.#allowCache = (false !== options.allowCache);

            if ( isArray( options.excludeFromCache ) )
            {
                this.#excludeFromCache = [...(asArray( options.excludeFromCache || [] ) || [])].filter( e => !isBlank( e ) );
            }
        }

        /**
         * Returns a new copy of the configuration object passed to the constructor
         * @returns {Object} a new copy of the configuration object passed to the constructor
         */
        get options()
        {
            return lock( populateOptions( {}, this.#options ) );
        }

        /**
         * Returns true if this instance allows secrets to be cached once retrieved.
         * <br>
         * <br>
         * Individual keys can also be excluded from the cache if this instance allows caching.
         * <br>
         * @returns {boolean}
         */
        get allowCache()
        {
            return !!this.#allowCache;
        }

        /**
         * Returns an array of keys whose values should never be cached by this instance.
         * @returns {Array[String]} an array of keys whose values should never be cached by this instance.
         */
        get excludeFromCache()
        {
            return [...(asArray( this.#excludeFromCache || [] ))];
        }

        /**
         * Returns the location of the keys (such as the path to a .env file or the url of an Azure KeyVault
         * @returns {string}
         */
        get source()
        {
            return this.#source || calculateSecretsSource() || DEFAULT_OPTIONS.source;
        }

        /**
         * Returns the prefix to use when looking for values.
         * <br>
         * <br>
         * @returns {string} the prefix to use when looking for values.
         */
        get system()
        {
            return asString( this.#system, true );
        }

        /**
         * Returns a string to be used for retrieving values specific to the system for which this instance exists.
         * <br>
         * <br>
         * @param pKey - the generic key for which the store might hold a value
         * @returns {string}
         */
        createKey( pKey )
        {
            return createKey( this.system, ucase( asString( pKey, true ) ) );
        }

        get invalidKeys()
        {
            return lock( unique( [...(asArray( this.#invalidKeys || [] ) || [])] ) );
        }

        isInvalidKey( pKey )
        {
            let key = asString( pKey, true ).replaceAll( /_/g, _hyphen );
            return this.invalidKeys.includes( key ) || !(SecretsManager.isValidKey( key ));
        }

        /**
         * Returns true if this instance can cache the specified data.
         * <br>
         * <br>
         * @param {String} pKey the key t a secret that can either be cached or not
         * @returns {boolean} true if the secret associated with the specified key is allowed to be cached
         */
        canCache( pKey )
        {
            if ( this.allowCache && !isBlank( pKey ) )
            {
                const k = asString( pKey, true );
                const uK = ucase( asString( k, true ) );

                const arr = this.excludeFromCache;

                return !(arr.includes( k ) || arr.includes( uK ) || arr.includes( this.createKey( k ) ));
            }

            return false;
        }

        /**
         * Potentially stores the specified value under the specified key in this instance's internal cache.
         * <br>
         * If this instance does not allow caching or the specified key is marked as excluded from the cache, the value will not be cached.
         * <br>
         * <br>
         * This allows synchronous retrieval that would otherwise require another iteration of the event loop.
         * <br>
         * @param pKey
         * @param pSecret
         */
        cacheSecret( pKey, pSecret )
        {
            if ( !isNull( pSecret ) )
            {
                if ( this.allowCache && this.canCache( pKey ) )
                {
                    this.#cache.set( this.createKey( pKey ), pSecret );
                    this.#cache.set( pKey, pSecret );
                    this.#cache.set( ucase( asString( pKey, true ) ), pSecret );
                }
            }
        }

        /**
         * This method MUST be implemented by subclasses of SecretsManager.
         * <br>
         * <br>
         * This method is responsible for retrieving the values from the key store.
         * @param pKey
         * @returns {Promise<void>} a Promise that resolves to the secret value stored under the specified key or null, if the value is not found
         */
        async getSecret( pKey )
        {
            // implemented in subclass
            return undefined;
        }

        /**
         * Returns a Promise that resolves to the secret value stored under the specified key or null, if the value is not found
         * @param pKey
         * @returns {Promise<void>} a Promise that resolves to the secret value stored under the specified key or null, if the value is not found
         */
        async get( pKey )
        {
            let key = asString( pKey, true ).replaceAll( /_/g, _hyphen );

            if ( this.invalidKeys.includes( key ) || !(SecretsManager.isValidKey( key ) || SecretsManager.isValidKey( pKey )) )
            {
                return null;
            }

            // try the cache first
            let secret = this.getCachedSecret( key );

            // if found in the cache... return the value
            if ( !isNull( secret ) )
            {
                return isNonNullObject( secret ) ? (secret?.value || secret?.Value || secret) : secret;
            }

            // call the subclass method to get the value from the key store
            secret = await this.getSecret( key ) ||
                     await this.getSecret( ucase( asString( key, true ) ) ) ||
                     await this.getSecret( this.createKey( key ) );

            secret = isNonNullObject( secret ) ? (secret?.value || secret?.Value || secret) : secret;

            if ( !isNull( secret ) )
            {
                // if the value returned can be cached, cache it for the next call to this method
                if ( this.canCache( pKey ) )
                {
                    this.cacheSecret( pKey, secret );
                }
            }
            else
            {
                this.#invalidKeys.push( key );
            }

            // return the value (or null if no value was found in either the cache or the key store)
            return isNonNullObject( secret ) ? (secret?.value || secret?.Value || secret) : secret;
        }

        /**
         * Synchronously returns the value cached for the specified key,
         * if the value has been previously read from the key store and could be cached.
         * <br>
         * <br>
         * This method provides a synchronous mechanism for using values that have already been retrieved.
         * @param pKey
         * @returns {any}
         */
        getCachedSecret( pKey )
        {
            let key = asString( pKey, true ).replaceAll( /_/g, _hyphen );

            if ( this.invalidKeys.includes( key ) || !(SecretsManager.isValidKey( key ) || SecretsManager.isValidKey( pKey )) )
            {
                return null;
            }

            // try to get the value from the cache
            let secret = this.#cache.get( this.createKey( key ) ) || this.#cache.get( key ) || this.#cache.get( ucase( asString( key, true ) ) );

            // if it is found, we simply return it
            if ( !isNull( secret ) )
            {
                return isNonNullObject( secret ) ? (secret?.value || secret) : secret;
            }

            // if the value was not found, kick off an asynchronous function
            // that will populate for the NEXT CALL to this method for that key
            // create an alias for this instance to use within the async closure
            const me = this;

            // invoke the async function as an IIFE,
            // but know that we won't get the results for this method to return.
            // this is for the *next* call for this value
            (async function( pVariableName )
            {
                // alias the instance to use within this closure
                const THIZ = me || this;

                const k = asString( pVariableName || pKey, true ) || asString( pKey, true );
                const uK = ucase( asString( k, true ) );

                // use the normal asynchronous method to retrieve the value
                secret = await asyncAttempt( async() => await THIZ.getSecret( THIZ.createKey( uK ) ) ) ||
                         await asyncAttempt( async() => await THIZ.getSecret( uK ) ) ||
                         await asyncAttempt( async() => await THIZ.getSecret( k ) );

                // if it is found, try to cache it for next time
                if ( !isNull( secret ) )
                {
                    secret = isNonNullObject( secret ) ? (secret?.value || secret) : secret;

                    if ( THIZ.canCache( k ) )
                    {
                        THIZ.cacheSecret( k, secret );
                    }

                    return isNonNullObject( secret ) ? (secret?.value || secret) : secret;
                }
                else
                {
                    attempt( () => THIZ.#invalidKeys.push( k ) );
                }
            }( key ));

            // return whatever value is currently stored in the secret variable
            return isNonNullObject( secret ) ? (secret?.value || secret) : secret;
        }

        // convenience method for a typical key
        async getDbConnectionString()
        {
            // should be overridden in subclasses
            const me = this;
            return await asyncAttempt( async() => (me || this).get( KEYS.CONNECTION_STRING ) );
        }

        // convenience method for a typical key
        async getCorsAllowedOrigin()
        {
            // should be overridden in subclasses
            const me = this;
            return await asyncAttempt( async() => (me || this).get( KEYS.CORS_ALLOWED_ORIGIN ) );
        }

        // convenience method for a typical key
        async getRateLimitWindowMs()
        {
            // should be overridden in subclasses
            const me = this;
            return await asyncAttempt( async() => (me || this).get( KEYS.RATE_LIMIT_MS ) );
        }

        // convenience method for a typical key
        async getRateLimitMax()
        {
            // should be overridden in subclasses
            const me = this;
            return await asyncAttempt( async() => (me || this).get( KEYS.RATE_LIMIT_MS_MAX ) );
        }

        // convenience method for a typical key
        async getInstanceUrl()
        {
            // should be overridden in subclasses
            const me = this;
            return await asyncAttempt( async() => (me || this).get( KEYS.INSTANCE_URL ) );
        }

        // convenience method for a typical key
        async getTokenUrl()
        {
            // should be overridden in subclasses
            const me = this;
            return await asyncAttempt( async() => (me || this).get( KEYS.TOKEN_URL ) );
        }

        // convenience method for a typical key
        async getTokenRedirectUrl()
        {
            // should be overridden in subclasses
            const me = this;
            return await asyncAttempt( async() => (me || this).get( KEYS.REDIRECT_URI ) );
        }

        // convenience method for a typical key
        async getApiKey()
        {
            // should be overridden in subclasses
            const me = this;
            return await asyncAttempt( async() => (me || this).get( KEYS.API_KEY ) );
        }

        // convenience method for a typical key
        async getAccessToken()
        {
            // should be overridden in subclasses
            const me = this;
            return await asyncAttempt( async() => (me || this).get( KEYS.ACCESS_TOKEN ) );
        }

        // convenience method for a typical key
        async getApiVersion( pSystem, pDefault = "v1" )
        {
            // should be overridden in subclasses
            const me = this;
            return await asyncAttempt( async() => (me || this).get( KEYS.API_VERSION ) ) || asString( pDefault, true );
        }

        // convenience method for a typical key
        async getClientId()
        {
            // should be overridden in subclasses
            const me = this;
            return await asyncAttempt( async() => (me || this).get( KEYS.CLIENT_ID ) );
        }

        // convenience method for a typical key
        async getClientSecret()
        {
            // should be overridden in subclasses
            const me = this;
            return await asyncAttempt( async() => (me || this).get( KEYS.CLIENT_SECRET ) );
        }

        // convenience method for a typical key
        async getAdminLoginName()
        {
            // should be overridden in subclasses
            const me = this;
            return await asyncAttempt( async() => (me || this).get( KEYS.ADMIN_LOGIN_NAME ) ) || await asyncAttempt( async() => (me || this).get( KEYS.LOGIN_NAME ) );
        }

        // convenience method for a typical key
        async getAdminPwd()
        {
            // should be overridden in subclasses
            const me = this;
            return await asyncAttempt( async() => (me || this).get( KEYS.ADMIN_LOGIN_PWD ) ) || await asyncAttempt( async() => (me || this).get( KEYS.LOGIN_PWD ) );
        }

        // convenience method for a typical key
        async getLoginName()
        {
            // should be overridden in subclasses
            const me = this;
            return await asyncAttempt( async() => (me || this).get( KEYS.LOGIN_NAME ) ) || await asyncAttempt( async() => (me || this).get( KEYS.ADMIN_LOGIN_NAME ) );
        }

        // convenience method for a typical key
        async getPwd()
        {
            // should be overridden in subclasses
            const me = this;
            return await asyncAttempt( async() => (me || this).get( KEYS.LOGIN_PWD ) ) || await asyncAttempt( async() => (me || this).get( KEYS.ADMIN_LOGIN_PWD ) );
        }

        // convenience method for a typical key
        async getAuthUrl()
        {
            // should be overridden in subclasses
            const me = this;
            return await asyncAttempt( async() => (me || this).get( KEYS.AUTH_URL ) );
        }
    }

    SecretsManager.defineKeys = function( pJson )
    {
        let kvObj = {};

        if ( isNonNullObject( pJson ) )
        {
            kvObj = Object.assign( {}, pJson );
        }
        else if ( isString( pJson ) )
        {
            if ( isJson( pJson ) )
            {
                kvObj = attempt( () => parseJson( pJson ) );
            }
            else
            {
                let lines = asString( pJson, true ).split( /(\r?\n)/ ).filter( e => !isBlank( e ) );
                lines = lines.map( e => asString( e, true ) ).filter( e => !isBlank( e ) );
                if ( $ln( lines ) > 0 )
                {
                    lines.forEach( line =>
                                   {
                                       if ( line && !isBlank( line ) )
                                       {
                                           let kv = line.split( /=:/ ).map( e => asString( e, true ) );
                                           let k = asString( $ln( kv ) > 0 ? kv[0] : _mt, true ).replace( /_-/g, _underscore );
                                           let v = asString( $ln( kv ) > 0 ? kv[1] : _mt, true ).replace( /_-/g, _hyphen );

                                           if ( !isBlank( k ) )
                                           {
                                               kvObj[k] = v;
                                           }
                                       }
                                   } );
                }
            }
        }

        if ( isNonNullObject( kvObj ) )
        {
            let keys = Object.assign( {}, KEYS );
            KEYS = Object.assign( keys, kvObj );
        }

        return Object.assign( {}, KEYS );
    };

    SecretsManager.addKey = function( pKey )
    {
        let keyName = asString( pKey, true ).replace( /_-/g, _underscore );
        let key = asString( (pKey || keyName), true ).replace( /_-/g, _hyphen );
        if ( !(isBlank( keyName ) || isBlank( key )) )
        {
            let obj = { [keyName]: key };
            return SecretsManager.defineKeys( obj );
        }
        return Object.assign( {}, KEYS );
    };

    SecretsManager.getKeys = function()
    {
        return SecretsManager.defineKeys( {} );
    };

    SecretsManager.isValidKey = function( pKey )
    {
        let keys = SecretsManager.getKeys();
        return Object.keys( keys ).includes( pKey ) || Object.values( keys ).includes( pKey );
    };

    /**
     * This subclass of SecretsManager uses dotenvx
     * to read value from a .env file
     * and add them to the process.env object in Node.js
     *
     * @class
     * @extends #SecretsManager
     */
    class LocalSecretsManager extends SecretsManager
    {
        constructor( pSource = "./.env", pSystem, pOptions = DEFAULT_OPTIONS )
        {
            super( pSource || calculateSecretsSource(), pSystem, pOptions || {} );

            const me = this;

            let path = pSource || (me || this).source;

            if ( isFilePath( path ) && exists( path ) )
            {
                attempt( () => dotenvx.config( { path: path, overload: true } ) );
            }
            else
            {
                path = "./.env";
                if ( isFilePath( path ) && exists( path ) )
                {
                    attempt( () => dotenvx.config( { path: path, overload: true } ) );
                }
            }
        }

        async getSecret( pKey )
        {
            let key = asString( pKey, true ).replaceAll( /_/g, _hyphen );
            let secret = process.env[this.createKey( key )] || process.env[asString( key, true )];
            secret = isNonNullObject( secret ) ? (secret?.value || secret.Value || secret) : secret;

            return !isNull( secret ) ? secret : super.getSecret( key );
        }

        async get( pKey )
        {
            let key = asString( pKey, true ).replaceAll( /_/g, _hyphen );

            if ( this.invalidKeys.includes( key ) || !(SecretsManager.isValidKey( key ) || SecretsManager.isValidKey( pKey )) )
            {
                return null;
            }

            let secret = this.getCachedSecret( this.createKey( key ) ) ||
                         this.getCachedSecret( key ) ||
                         await this.getSecret( key );

            secret = isNonNullObject( secret ) ? (secret?.value || secret.Value || secret) : secret;

            if ( !isNull( secret ) && this.canCache( key ) )
            {
                this.cacheSecret( key, secret );
            }

            return isNonNullObject( secret ) ? (secret?.value || secret) : secret;
        }

        getCachedSecret( pKey )
        {
            let key = asString( pKey, true ).replaceAll( /_/g, _hyphen );

            if ( this.invalidKeys.includes( key ) || !(SecretsManager.isValidKey( key ) || SecretsManager.isValidKey( pKey )) )
            {
                return null;
            }

            let secret = super.getCachedSecret( this.createKey( key ) ) ||
                         super.getCachedSecret( key ) ||
                         process.env[this.createKey( key )] ||
                         process.env[key] ||
                         process.env[ucase( asString( key, true ) )];

            return isNonNullObject( secret ) ? (secret?.value || secret) : secret;
        }

        async getDbConnectionString()
        {
            let secret = this.getCachedSecret( KEYS.CONNECTION_STRING ) ||
                         await this.getSecret( KEYS.CONNECTION_STRING );

            return isNonNullObject( secret ) ? (secret?.value || secret) : secret;
        }

        async getCorsAllowedOrigin()
        {
            let secret = this.getCachedSecret( KEYS.CORS_ALLOWED_ORIGIN ) ||
                         await this.getSecret( KEYS.CORS_ALLOWED_ORIGIN );

            return isNonNullObject( secret ) ? (secret?.value || secret) : secret;
        }

        async getRateLimitWindowMs()
        {
            let secret = this.getCachedSecret( KEYS.RATE_LIMIT_MS ) ||
                         await this.getSecret( KEYS.RATE_LIMIT_MS );

            return isNonNullObject( secret ) ? (secret?.value || secret) : secret;
        }

        async getRateLimitMax()
        {
            let secret = this.getCachedSecret( KEYS.RATE_LIMIT_MS_MAX ) ||
                         await this.getSecret( KEYS.RATE_LIMIT_MS_MAX );

            return isNonNullObject( secret ) ? (secret?.value || secret) : secret;
        }

        async getInstanceUrl( pSystem )
        {
            let system = asString( pSystem || this.system, true );

            let secret = this.getCachedSecret( KEYS.INSTANCE_URL ) ||
                         await this.getSecret( createKey( system, KEYS.INSTANCE_URL ) );

            let url = isNonNullObject( secret ) ? (secret?.value || secret) : secret;

            return asString( isBlank( url ) ? await this.getSecret( KEYS.INSTANCE_URL ) : url, true );
        }

        async getTokenUrl( pSystem )
        {
            let system = asString( pSystem || this.system, true );

            let secret = this.getCachedSecret( KEYS.TOKEN_URL ) ||
                         await this.getSecret( createKey( system, KEYS.TOKEN_URL ) );

            let url = isNonNullObject( secret ) ? (secret?.value || secret) : secret;

            return asString( isBlank( url ) ? await this.getSecret( KEYS.TOKEN_URL ) : url, true );
        }

        async getTokenRedirectUrl( pSystem )
        {
            let system = asString( pSystem || this.system, true );

            let secret = this.getCachedSecret( KEYS.REDIRECT_URI ) ||
                         await this.getSecret( createKey( system, KEYS.REDIRECT_URI ) );

            let url = isNonNullObject( secret ) ? (secret?.value || secret) : secret;

            return asString( isBlank( url ) ? await this.getSecret( KEYS.REDIRECT_URI ) : url, true );
        }

        async getApiKey( pSystem )
        {
            let system = asString( pSystem || this.system, true );

            let secret = this.getCachedSecret( KEYS.API_KEY ) ||
                         await this.getSecret( createKey( system, KEYS.API_KEY ) );

            let apiKey = isNonNullObject( secret ) ? (secret?.value || secret) : secret;

            return asString( isBlank( apiKey ) ? await this.getSecret( KEYS.API_KEY ) : apiKey, true );
        }

        async getAccessToken( pSystem )
        {
            let system = asString( pSystem || this.system, true );

            let secret = this.getCachedSecret( KEYS.ACCESS_TOKEN ) ||
                         await this.getSecret( createKey( system, KEYS.ACCESS_TOKEN ) );

            let token = isNonNullObject( secret ) ? (secret?.value || secret) : secret;

            return asString( isBlank( token ) ? await this.getSecret( KEYS.ACCESS_TOKEN ) : token, true );
        }

        /**
         *
         * @param {string} pSystem
         * @param {string }pDefault
         * @returns {Promise<*|void>}
         */
        async getApiVersion( pSystem, pDefault = "v1" )
        {
            let system = asString( pSystem || this.system, true );

            let secret = this.getCachedSecret( KEYS.API_VERSION ) ||
                         await this.getSecret( createKey( system, KEYS.API_VERSION ) );

            let version = isNonNullObject( secret ) ? (secret?.value || secret) : secret;

            version = asString( isBlank( version ) ? await this.getSecret( KEYS.API_VERSION ) : version, true );

            return version || asString( pDefault, true ) || await super.getApiVersion( system, pDefault );
        }

        async getClientId( pSystem )
        {
            let system = asString( pSystem || this.system, true );

            let clientId = this.getCachedSecret( KEYS.CLIENT_ID ) ||
                           await this.getSecret( createKey( system, KEYS.CLIENT_ID ) );

            return asString( isBlank( clientId ) ? await this.getSecret( KEYS.CLIENT_ID ) : clientId, true );
        }

        async getClientSecret( pSystem )
        {
            let system = asString( pSystem || this.system, true );

            let secret = this.getCachedSecret( KEYS.CLIENT_SECRET ) ||
                         await this.getSecret( createKey( system, KEYS.CLIENT_SECRET ) );

            return asString( isBlank( secret ) ? await this.getSecret( KEYS.CLIENT_SECRET ) : secret, true );
        }

        async getAdminLoginName( pSystem )
        {
            let system = asString( pSystem || this.system, true );

            let login = this.getCachedSecret( KEYS.ADMIN_LOGIN_NAME ) ||
                        await this.getSecret( createKey( system, KEYS.ADMIN_LOGIN_NAME ) );

            return asString( isBlank( login ) ? await this.getSecret( KEYS.ADMIN_LOGIN_NAME ) : login, true );
        }

        async getAdminPwd( pSystem )
        {
            let system = asString( pSystem || this.system, true );

            let pw = this.getCachedSecret( KEYS.ADMIN_LOGIN_PWD ) ||
                     await this.getSecret( createKey( system, KEYS.ADMIN_LOGIN_PWD ) );

            return asString( isBlank( pw ) ? await this.getSecret( KEYS.ADMIN_LOGIN_PWD ) : pw, true );
        }

        async getAuthUrl( pSystem )
        {
            let system = asString( pSystem || this.system, true );

            let url = this.getCachedSecret( KEYS.AUTH_URL ) ||
                      await this.getSecret( createKey( system, KEYS.AUTH_URL ) );

            return asString( isBlank( url ) ? await this.getSecret( KEYS.AUTH_URL ) : url, true );
        }
    }

    /**
     * This subclass of SecretsManager uses the Azure Key Vault to store and retrieve values.
     * <br>
     * <br>
     * @class
     * @extends #SecretsManager
     */
    class AzureSecretsManager extends SecretsManager
    {
        #keyVaultName;
        #keyVaultUrl;
        #credential;
        #client;

        constructor( pSource = calculateSecretsSource(), pSystem, pOptions = {} )
        {
            super( pSource, pSystem, pOptions );

            this.#keyVaultName = ucase( asString( pSource || calculateSecretsSource(), true ) );
            this.#keyVaultUrl = this.options.keyVaultUrl || `https://${lcase( this.source )}.vault.azure.net`;
        }

        get keyVaultName()
        {
            return this.#keyVaultName || calculateSecretsSource() || super.getCachedSecret( "KV-NAME" );
        }

        get keyVaultUrl()
        {
            this.#keyVaultUrl = this.#keyVaultUrl || `https://${lcase( this.keyVaultName )}.vault.azure.net`;
            return this.#keyVaultUrl;
        }

        set keyVaultUrl( pUrl )
        {
            this.#keyVaultUrl = pUrl || `https://${lcase( this.keyVaultName )}.vault.azure.net`;
        }

        get credential()
        {
            this.#credential = this.#credential || new DefaultAzureCredential();
            return this.#credential;
        }

        set credential( pValue )
        {
            let isCredential = pValue instanceof ChainedTokenCredential || pValue instanceof DefaultAzureCredential;
            this.#credential = isCredential ? pValue : (this.#credential || new DefaultAzureCredential());
        }

        get client()
        {
            this.#client = this.#client || new SecretClient( this.keyVaultUrl, this.credential );
            return this.#client;
        }

        set client( pClient )
        {
            this.#client = (pClient instanceof SecretClient) ? pClient : (this.#client || new SecretClient( this.keyVaultUrl, this.credential ));
        }

        async getSecret( pKey )
        {
            const me = this;

            let key = asString( pKey, true ).replaceAll( /_/g, _hyphen );

            if ( this.invalidKeys.includes( key ) || !(SecretsManager.isValidKey( key ) || SecretsManager.isValidKey( pKey )) )
            {
                return null;
            }

            let client = (me || this).client || new SecretClient( this.keyVaultUrl, this.credential );

            let secret = await asyncAttempt( async() => client.getSecret( createKey( (me || this).system, key ) ) );

            secret = isNonNullObject( secret ) ? (secret?.value || secret) : secret;

            if ( isNull( secret ) || isBlank( secret ) )
            {
                secret = await asyncAttempt( async() => client.getSecret( key ) );
            }

            secret = isNonNullObject( secret ) ? (secret?.value || secret) : secret;

            secret = (isString( secret ) && !isBlank( secret )) ? secret : ((isNonNullObject( secret ) ? secret.value : await super.getSecret( key )) || super.getSecret( key ));

            if ( !isNull( secret ) && this.allowCache && this.canCache( key ) )
            {
                this.cacheSecret( createKey( this.system, key ), secret );
                this.cacheSecret( key, secret );
                this.cacheSecret( ucase( asString( key, true ) ), secret );
            }

            return isNonNullObject( secret ) ? (secret?.value || secret) : secret;
        }

        async get( pKey )
        {
            let key = asString( pKey, true ).replaceAll( /_/g, _hyphen );

            if ( this.invalidKeys.includes( key ) || !(SecretsManager.isValidKey( key ) || SecretsManager.isValidKey( pKey )) )
            {
                return null;
            }

            let secret = this.getCachedSecret( key );

            secret = isNonNullObject( secret ) ? (secret?.value || secret?.Value || secret) : secret;

            if ( !isNull( secret ) && !isBlank( secret ) )
            {
                return secret;
            }

            secret = await asyncAttempt( async() => await this.getSecret( key ) );

            secret = isNonNullObject( secret ) ? (secret?.value || secret?.Value || secret) : secret;

            if ( secret && this.canCache( key ) )
            {
                this.cacheSecret( key, secret );
            }

            return isNonNullObject( secret ) ? (secret?.value || secret?.Value || secret) : secret;
        }
    }

    const DEFAULT_PROVIDER_OPTIONS =
        {
            secretsManagerClass: LocalSecretsManager,
            keyStoreName: ".env"
        };

    const DEFAULT_AZURE_OPTIONS =
        {
            secretsManagerClass: AzureSecretsManager,
            keyStoreName: _mt
        };

    class SecretsProvider
    {
        #id;
        #name;

        #options;
        #secretsManagerClass;
        #keyStoreName;

        constructor( pId, pName, pOptions )
        {
            const options = populateOptions( pOptions, DEFAULT_PROVIDER_OPTIONS );

            this.#id = asInt( pId, options.id ) || options.id || Date.now();

            this.#name = asString( pName || options.name, true ) || getClassName( this );

            this.#secretsManagerClass = isClass( options.secretsManagerClass ) ? options.secretsManagerClass : isNonNullObject( options.secretsManagerClass ) ? Object.constructor( options.secretsManagerClass ) || (() => options.secretsManagerClass) : LocalSecretsManager;

            this.#keyStoreName = asString( options.keyStoreName || options.keyVaultName, true );

            this.#options = options;
        }

        get id()
        {
            return asInt( this.#id );
        }

        get name()
        {
            return asString( this.#name, true );
        }

        get options()
        {
            return populateOptions( this.#options || {}, DEFAULT_PROVIDER_OPTIONS );
        }

        get secretsManagerClass()
        {
            if ( isClass( this.#secretsManagerClass ) || isFunction( this.#secretsManagerClass ) )
            {
                return this.#secretsManagerClass;
            }

            if ( isNonNullObject( this.#secretsManagerClass ) )
            {
                return this.#secretsManagerClass.constructor || (() => this.#secretsManagerClass);
            }

            return LocalSecretsManager;
        }

        getSecretsManager( pSource, pSystem, pOptions )
        {
            const options = populateOptions( { ...(this.options || {}) }, pOptions, DEFAULT_PROVIDER_OPTIONS );

            const source = pSource || options.source || options.keyStoreName || options.keyVaultName || this.keyStoreName;

            const system = pSystem || options.system || options.prefix;

            const klass = this.secretsManagerClass;

            if ( isClass( klass ) )
            {
                return new klass( source, system, options );
            }
            else if ( isFunction( klass ) )
            {
                return klass.call( this, source, system, options );
            }
            else if ( isNonNullObject( klass ) && klass instanceof SecretsManager )
            {
                return klass;
            }
            return new LocalSecretsManager( source, system, options );
        }

        get keyStoreName()
        {
            return this.#keyStoreName;
        }

        get keyVaultName()
        {
            return this.#keyStoreName;
        }

        [Symbol.toPrimitive]( pHint )
        {
            return ucase( asString( this.name, true ) );
        }
    }

    /**
     * Class representing a mode for Secrets Manager, inheriting from ExecutionMode.
     * This class defines specific configurations for interacting with a secrets manager
     * in various execution modes.
     *
     * @class
     */
    class SecretsManagerMode extends ExecutionMode
    {
        static #modeMap = new Map();

        #id;
        #name;

        #secretsProvider;

        #useAzure;

        constructor( pId, pName, pSecretsProvider )
        {
            super( pName );

            this.#id = asInt( pId );
            this.#name = asString( pName, true );
            this.#secretsProvider = pSecretsProvider;

            this.#useAzure = "AZURE" === ucase( asString( pSecretsProvider?.name, true ) || asString( pSecretsProvider, true ) );

            SecretsManagerMode.#modeMap.set( ucase( pName ), this );
        }

        get id()
        {
            return asInt( this.#id );
        }

        get name()
        {
            return this.#name;
        }

        get secretsProvider()
        {
            return this.#secretsProvider;
        }

        getSecretsManager( pSource = calculateSecretsSource(), pSystem, pOptions = {} )
        {
            if ( isNonNullObject( this.secretsProvider ) )
            {
                return this.secretsProvider.getSecretsManager( pSource, pSystem, pOptions );
            }

            if ( this.useAzure )
            {
                return new AzureSecretsManager( pSource, pSystem, pOptions );
            }

            return new LocalSecretsManager( pSource, pSystem, pOptions );
        }

        get useAzure()
        {
            return this.#useAzure;
        }

        static getModeByName( pName )
        {
            SecretsManagerMode.#modeMap.get( ucase( pName ) );
        }

        static fromExecutionMode( pExecutionMode )
        {
            const executionMode = isNonNullObject( pExecutionMode ) && pExecutionMode instanceof ExecutionMode ? pExecutionMode : ExecutionMode.from( pExecutionMode );

            switch ( executionMode )
            {
                case ExecutionMode.MODES.PROD:
                case ExecutionMode.MODES.PRODUCTION:
                    return SecretsManagerMode.PRODUCTION;
                case ExecutionMode.MODES.DEV:
                case ExecutionMode.MODES.DEVELOPMENT:
                    return SecretsManagerMode.DEVELOPMENT;
                case ExecutionMode.MODES.DEBUG:
                    return SecretsManagerMode.DEBUG;
                case ExecutionMode.MODES.TEST:
                    return SecretsManagerMode.TEST;
                case ExecutionMode.MODES.TRACE:
                    return SecretsManagerMode.QA;
                default:
                    return SecretsManagerMode.DEVELOPMENT;
            }
        }
    }

    const environmentSecretsProvider = new SecretsProvider( 1, "ENV", DEFAULT_PROVIDER_OPTIONS );
    const azureSecretsProvider = new SecretsProvider( 2, "AZURE", DEFAULT_AZURE_OPTIONS );

    SecretsManagerMode.PRODUCTION = new SecretsManagerMode( 1, "PRODUCTION", azureSecretsProvider );
    SecretsManagerMode.DEVELOPMENT = new SecretsManagerMode( 2, "DEVELOPMENT", environmentSecretsProvider );
    SecretsManagerMode.UAT = new SecretsManagerMode( 4, "UAT", azureSecretsProvider );
    SecretsManagerMode.ORT = new SecretsManagerMode( 4, "ORT", azureSecretsProvider );
    SecretsManagerMode.DEBUG = new SecretsManagerMode( 3, "DEBUG", environmentSecretsProvider );
    SecretsManagerMode.QA = new SecretsManagerMode( 4, "QA", environmentSecretsProvider );
    SecretsManagerMode.TEST = new SecretsManagerMode( 4, "TEST", environmentSecretsProvider );

    SecretsManagerMode.from = function( pObj )
    {
        if ( pObj instanceof SecretsManagerMode )
        {
            return lock( pObj );
        }

        if ( pObj instanceof ExecutionMode )
        {
            return lock( SecretsManagerMode.fromExecutionMode( pObj ) );
        }

        if ( pObj instanceof ExecutionEnvironment )
        {
            return lock( SecretsManagerMode.fromExecutionMode( pObj?.mode ) );
        }

        if ( isNonNullObject( pObj ) )
        {
            let mode = new SecretsManagerMode( pObj.id, pObj.name, pObj.secretsProvider || pObj.provider );

            return populateProperties( mode, pObj );
        }

        return SecretsManagerMode.DEVELOPMENT;
    };

    SecretsManagerMode.resolveMode = function( pMode )
    {
        if ( isString( pMode ) )
        {
            return SecretsManagerMode.getModeByName( pMode ) || SecretsManagerMode[ucase( asString( pMode, true ) )] || SecretsManagerMode.DEVELOPMENT;
        }

        if ( isNumeric( pMode ) )
        {
            return SecretsManagerMode.fromExecutionMode( ExecutionMode.from( pMode ) ) || SecretsManagerMode.DEVELOPMENT;
        }

        if ( isNonNullObject( pMode ) )
        {
            return SecretsManagerMode.from( pMode );
        }
    };

    /**
     * A factory class for creating and managing instances of SecretsManager.
     * The factory handles configuration and instantiates the appropriate SecretsManager
     * based on the execution mode and options provided.
     *
     * @class
     */
    class SecretsManagerFactory
    {
        #mode = SecretsManagerMode.from( ExecutionMode.calculate() ) || SecretsManagerMode.DEVELOPMENT;

        #keyPath = calculateSecretsSource() || "./.env";

        #system = _mt;

        #options = {};

        constructor( pMode, pKeyPath, pSystem, pOptions = {} )
        {
            this.#mode = SecretsManagerMode.resolveMode( pMode || toolBocksModule.executionMode );

            this.#system = ucase( asString( pSystem, true ) );

            this.#keyPath = pKeyPath || calculateSecretsSource() || "./.env";

            this.#options = populateOptions( pOptions || {}, {} );
        }

        get mode()
        {
            return this.#mode || ExecutionMode.calculate();
        }

        get system()
        {
            return this.#system;
        }

        get keyPath()
        {
            return this.#keyPath || calculateSecretsSource( this.mode );
        }

        get options()
        {
            return lock( Object.assign( {}, this.#options || {} ) );
        }

        getSecretsManager( pOptions = {} )
        {
            let options = populateOptions( (pOptions || {}), (this.options || {}) );

            let secretsManagerMode = options.mode || this.mode || SecretsManagerMode.from( ExecutionMode.calculate() ) || SecretsManagerMode.DEVELOPMENT;

            if ( secretsManagerMode.useAzure )
            {
                return new AzureSecretsManager( this.keyPath, this.system, options );
            }

            return secretsManagerMode.getSecretsManager( this.keyPath, this.system, options );
        }

        static getInstance( pMode, pSource, pSystem, pOptions )
        {
            return new SecretsManagerFactory( pMode, pSource, pSystem, pOptions );
        }
    }

    SecretsManagerFactory.makeSecretsManager = function( pMode, pSource = calculateSecretsSource(), pSystem, pOptions )
    {
        let factory = SecretsManagerFactory.getInstance( pMode, pSource || calculateSecretsSource(), pSystem, pOptions );

        return factory.getSecretsManager( pOptions );
    };

    async function migrateSecrets( pKeyVaultName = `BHLKV01`, pKeyVaultUrl = `https://${pKeyVaultName}.vault.azure.net` )
    {
        let numSecretsMigrated = 0;

        const KEY_VAULT_NAME = asString( pKeyVaultName || "BHLKV01", true );
        const KEY_VAULT_URL = pKeyVaultUrl || `https://${KEY_VAULT_NAME}.vault.azure.net`;

        try
        {
            // DefaultAzureCredential will use the currently logged-in Azure CLI credentials
            const credential = new DefaultAzureCredential();
            const secretClient = new SecretClient( KEY_VAULT_URL, credential );

            console.log( `Successfully connected to Key Vault: ${KEY_VAULT_NAME}` );

            const envFilePath = resolvePath( __dirname, "../.env" );

            console.log( `Starting migration of variables to Azure Key Vault, ${KEY_VAULT_URL}, from ${envFilePath}` );

            const envFileContent = await asyncAttempt( async() => await readFile( envFilePath, "utf8" ) );

            const lines = envFileContent.split( "\n" );

            for( const line of lines )
            {
                const trimmedLine = line.trim();

                // Skip comments and empty lines
                if ( trimmedLine && !trimmedLine.startsWith( "#" ) )
                {
                    const [key, value] = trimmedLine.split( "=", 2 );

                    if ( key && value )
                    {
                        // Best practice: Azure Key Vault secret names can only contain alphanumeric characters and dashes.
                        const secretName = key.replace( /_/g, "-" );

                        console.log( `Setting secret: '${secretName}'...` );

                        // The setSecret method will create a new version if the secret already exists.
                        const secret = await secretClient.setSecret( secretName, value );

                        if ( isNonNullObject( secret ) || isNonNullValue( secret ) )
                        {
                            numSecretsMigrated += 1;

                            console.log( `  -> Successfully set secret for '${secretName}'.` );
                        }
                        else
                        {
                            console.log( ` !! -> Could not set secret for '${secretName}' !!` );
                        }
                    }
                }
            }

            console.log( "\nMigration complete. ", `${numSecretsMigrated} variables have been copied to the vault.` );
        }
        catch( error )
        {
            console.error( "\nAn error occurred during the migration process:", error );
            if ( error.statusCode === 403 )
            {
                console.error( "This looks like a permission issue. Please ensure your account has the 'Key Vault Secrets Officer' role on the Key Vault's Access Policies." );
            }
        }

        return numSecretsMigrated;
    }

    /**
     * The actual functionality to be exposed via the toolBocksModule.
     *
     */
    let mod =
        {
            dependencies:
                {
                    dotenvx,
                    core,
                    moduleUtils,
                    constants,
                    typeUtils,
                    stringUtils,
                    arrayUtils,
                    SecretClient,
                    ChainedTokenCredential,
                    DefaultAzureCredential
                },
            classes:
                {
                    SecretsProvider,
                    SecretsManagerMode,
                    SecretsManager,
                    LocalSecretsManager,
                    AzureSecretsManager,
                    SecretsManagerFactory,
                    SecretClient,
                    ChainedTokenCredential,
                    DefaultAzureCredential
                },
            SecretsProvider,
            SecretsManagerMode,
            SecretsManager,
            LocalSecretsManager,
            AzureSecretsManager,
            SecretsManagerFactory,
            calculateSecretsSource,
            getSecretsManager: function( pMode, pSource, pSystem, pOptions )
            {
                return SecretsManagerFactory.makeSecretsManager( pMode, pSource, pSystem, pOptions );
            },
            getLocalSecretsManager: function( pSource, pSystem, pOptions )
            {
                return new LocalSecretsManager( pSource, pSystem, pOptions );
            },
            getAzureSecretsManager: function( pSource, pSystem, pOptions )
            {
                return new AzureSecretsManager( pSource, pSystem, pOptions );
            },
            defineKeys: SecretsManager.defineKeys,
            addKey: SecretsManager.addKey,
            isValidKey: SecretsManager.isValidKey,
            getKeys: SecretsManager.getKeys,
            SECRETS_KEYS: lock( SecretsManager.getKeys() ),
            migrateSecrets
        };

    // extends the base module
    mod = toolBocksModule.extend( mod );

    // exports the module
    return mod.expose( mod, INTERNAL_NAME, (_ud !== typeof module ? module : mod) ) || mod;

}());
