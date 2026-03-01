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
            isArray,
            isMap,
            isClass,
            getClass,
            getClassName,
            isFunction
        } = typeUtils;

    const { asString, isBlank, ucase, asInt, isFilePath, isJson } = stringUtils;

    const { asArray } = arrayUtils;

    const { exists } = fileUtils;

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

    const createKey = ( pPrefix, pKey ) =>
    {
        let prefix = ucase( asString( pPrefix, true ) );

        let keyPart = (ucase( asString( pKey, true ) )).replace( new RegExp( ("^" + prefix), "i" ), _mt ).replace( /^[_-]+/, _mt ).trim();

        return ucase( isBlank( prefix ) ? keyPart : (prefix + _hyphen + keyPart) );
    };

    const DEFAULT_OPTIONS =
        {
            source: "./.env",
            allowCache: true,
            excludeFromCache: [],
            restrictKeys: false
        };

    /**
     * The module that will be returned to expose the classes and functionality of the SecretsManager.
     */
    const toolBocksModule = new ToolBocksModule( "SecretsManager", INTERNAL_NAME );

    const calculateSecretsSource = function( pExecutionMode )
    {
        let executionMode = pExecutionMode || ExecutionMode.calculate();

        let secretsManagerMode = SecretsManagerMode.from( executionMode );

        return "./.env";
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
        #source;
        #prefix = _mt;

        #options = {};

        #cache;
        #allowCache = true;
        #excludeFromCache = [];

        #restrictKeys = false;

        // noinspection GrazieInspection
        /**
         * Constructs an instance of this class.
         * <br>
         * <br>
         * This base class should rarely be constructed except as by a subclass constructor call to super().
         * <br>
         * @param pSource - the key/value store to use (such as a path to the .env file or the NAME of the key vault)
         * @param pPrefix - the system or module whose key/value pairs this instance stores, such as FA, LD, FV, RLS, etc
         * @param pOptions - an object providing subclass-specific values for the construction of the instance
         *
         * @constructor
         */
        constructor( pSource, pPrefix, pOptions = {} )
        {
            this.#mode = SecretsManagerMode.fromExecutionMode( toolBocksModule.executionMode );

            this.#source = pSource || calculateSecretsSource( this.mode );
            this.#prefix = pPrefix;

            const options = { ...(DEFAULT_OPTIONS), ...(pOptions ?? {}) };

            this.#options = lock( options );

            this.#allowCache = (false !== options.allowCache);

            if ( isArray( options.excludeFromCache ) )
            {
                this.#excludeFromCache = [...(asArray( options.excludeFromCache || [] ) || [])].filter( e => !isBlank( e ) );
            }

            this.#restrictKeys = !!options.restrictKeys;

            if ( this.#allowCache )
            {
                this.cache = new Map();
            }
        }

        get mode()
        {
            return lock( this.#mode );
        }

        /**
         * Returns a new copy of the configuration object passed to the constructor
         * @returns {Object} a new copy of the configuration object passed to the constructor
         */
        get options()
        {
            return lock( { ...(DEFAULT_OPTIONS), ...(this.#options ?? {}) } );
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
            return this.#source || calculateSecretsSource( this.mode ) || this.#options?.source || DEFAULT_OPTIONS.source;
        }

        /**
         * Returns the prefix to use when looking for values.
         * <br>
         * <br>
         * @returns {string} the prefix to use when looking for values.
         */
        get prefix()
        {
            return asString( this.#prefix, true );
        }

        get restrictKeys()
        {
            return !!this.#restrictKeys;
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
            return createKey( this.prefix, ucase( asString( pKey, true ) ) );
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

                return !(arr.includes( k ) || arr.includes( uK ) || arr.includes( this.createKey( k ) )) && isMap( this.#cache );
            }

            return false;
        }

        /**
         * Replaces underscores with hyphens.
         * Override for subclasses that require different key formatting.
         *
         * @param {String} pKey a key under which a secret is stored
         * @returns {String} a string that adheres to the formatting conventions or restrictions of the key store
         */
        resolveKey( pKey )
        {
            return asString( pKey, true ).replaceAll( /_/g, _hyphen );
        }

        /**
         * Returns the value of the retrieved secret.
         * May be overridden to match the return values of the specific key store
         *
         * @param {*} pSecret  the value returned from the key store
         *
         * @returns {*}  the value of the secret if that value is a property of the returned value or the returned value otherwise
         */
        resolveSecretValue( pSecret )
        {
            return isNonNullObject( pSecret ) ? (pSecret?.value || pSecret?.Value || pSecret) : pSecret;
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
                if ( this.allowCache && this.canCache( pKey ) && isMap( this.#cache ) )
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
            let key = this.resolveKey( pKey );

            if ( this.#restrictKeys && !(SecretsManager.isValidKey( key ) || SecretsManager.isValidKey( pKey )) )
            {
                return null;
            }

            // try the cache first
            let secret = this.getCachedSecret( key );

            // if found in the cache... return the value
            if ( !isNull( secret ) )
            {
                return this.resolveSecretValue( secret );
            }

            // call the subclass method to get the value from the key store
            secret = await this.getSecret( key ) ||
                     await this.getSecret( ucase( asString( key, true ) ) ) ||
                     await this.getSecret( this.createKey( key ) );

            secret = this.resolveSecretValue( secret );

            if ( !isNull( secret ) )
            {
                // if the value returned can be cached, cache it for the next call to this method
                if ( this.canCache( pKey ) )
                {
                    this.cacheSecret( pKey, secret );
                }
            }

            // return the value (or null if no value was found in either the cache or the key store)
            return this.resolveSecretValue( secret );
        }

        /**
         * Synchronously returns the value cached for the specified key
         * if the value has been previously read from the key store and could be cached.
         * <br>
         * <br>
         * This method provides a synchronous mechanism for using values that have already been retrieved.
         * @param pKey
         * @returns {any}
         */
        getCachedSecret( pKey )
        {
            let key = this.resolveKey( pKey );

            if ( this.#restrictKeys && !(SecretsManager.isValidKey( key ) || SecretsManager.isValidKey( pKey )) )
            {
                return null;
            }

            // try to get the value from the cache
            let secret = this.#cache.get( this.createKey( key ) ) || this.#cache.get( key ) || this.#cache.get( ucase( asString( key, true ) ) );

            // if it is found, we simply return it
            if ( !isNull( secret ) )
            {
                return this.resolveSecretValue( secret );
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

                    return THIZ.resolveSecretValue( secret );
                }
            }( key ));

            // return whatever value is currently stored in the secret variable
            return isNonNullObject( secret ) ? (secret?.value || secret?.Value || secret) : secret;
        }

        // convenience method for a typical key
        async getDbConnectionString()
        {
            // should be overridden in subclasses
            return await asyncAttempt( async() => this.get( KEYS.CONNECTION_STRING ) );
        }

        // convenience method for a typical key
        async getCorsAllowedOrigin()
        {
            // should be overridden in subclasses
            return await asyncAttempt( async() => this.get( KEYS.CORS_ALLOWED_ORIGIN ) );
        }

        // convenience method for a typical key
        async getRateLimitWindowMs()
        {
            // should be overridden in subclasses
            return await asyncAttempt( async() => this.get( KEYS.RATE_LIMIT_MS ) );
        }

        // convenience method for a typical key
        async getRateLimitMax()
        {
            // should be overridden in subclasses
            return await asyncAttempt( async() => this.get( KEYS.RATE_LIMIT_MS_MAX ) );
        }

        // convenience method for a typical key
        async getInstanceUrl()
        {
            // should be overridden in subclasses
            return await asyncAttempt( async() => this.get( KEYS.INSTANCE_URL ) );
        }

        // convenience method for a typical key
        async getTokenUrl()
        {
            // should be overridden in subclasses
            return await asyncAttempt( async() => this.get( KEYS.TOKEN_URL ) );
        }

        // convenience method for a typical key
        async getTokenRedirectUrl()
        {
            // should be overridden in subclasses
            return await asyncAttempt( async() => this.get( KEYS.REDIRECT_URI ) );
        }

        // convenience method for a typical key
        async getApiKey()
        {
            // should be overridden in subclasses
            return await asyncAttempt( async() => this.get( KEYS.API_KEY ) );
        }

        // convenience method for a typical key
        async getAccessToken()
        {
            // should be overridden in subclasses
            return await asyncAttempt( async() => this.get( KEYS.ACCESS_TOKEN ) );
        }

        // convenience method for a typical key
        async getApiVersion( pPrefix, pDefault = "v1" )
        {
            // should be overridden in subclasses
            return await asyncAttempt( async() => this.get( KEYS.API_VERSION ) ) || asString( pDefault, true );
        }

        // convenience method for a typical key
        async getClientId()
        {
            // should be overridden in subclasses
            return await asyncAttempt( async() => this.get( KEYS.CLIENT_ID ) );
        }

        // convenience method for a typical key
        async getClientSecret()
        {
            // should be overridden in subclasses
            return await asyncAttempt( async() => this.get( KEYS.CLIENT_SECRET ) );
        }

        // convenience method for a typical key
        async getAdminLoginName()
        {
            // should be overridden in subclasses
            return await asyncAttempt( async() => this.get( KEYS.ADMIN_LOGIN_NAME ) ) || await asyncAttempt( async() => this.get( KEYS.LOGIN_NAME ) );
        }

        // convenience method for a typical key
        async getAdminPwd()
        {
            // should be overridden in subclasses
            return await asyncAttempt( async() => this.get( KEYS.ADMIN_LOGIN_PWD ) ) || await asyncAttempt( async() => this.get( KEYS.LOGIN_PWD ) );
        }

        // convenience method for a typical key
        async getLoginName()
        {
            // should be overridden in subclasses
            return await asyncAttempt( async() => this.get( KEYS.LOGIN_NAME ) ) || await asyncAttempt( async() => this.get( KEYS.ADMIN_LOGIN_NAME ) );
        }

        // convenience method for a typical key
        async getPwd()
        {
            // should be overridden in subclasses
            return await asyncAttempt( async() => this.get( KEYS.LOGIN_PWD ) ) || await asyncAttempt( async() => this.get( KEYS.ADMIN_LOGIN_PWD ) );
        }

        // convenience method for a typical key
        async getAuthUrl()
        {
            // should be overridden in subclasses
            return await asyncAttempt( async() => this.get( KEYS.AUTH_URL ) );
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
        constructor( pSource = "./.env", pPrefix, pOptions = DEFAULT_OPTIONS )
        {
            super( pSource || calculateSecretsSource(), pPrefix, pOptions || {} );

            let path = pSource || this.source;

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
            let key = this.resolveKey( pKey );

            let secret = process.env[this.createKey( key )] || process.env[asString( key, true )];

            secret = this.resolveSecretValue( secret );

            return !isNull( secret ) ? secret : super.getSecret( key );
        }

        async get( pKey )
        {
            let key = this.resolveKey( pKey );

            if ( this.restrictKeys && !(SecretsManager.isValidKey( key ) || SecretsManager.isValidKey( pKey )) )
            {
                return null;
            }

            let secret = this.getCachedSecret( this.createKey( key ) ) ||
                         this.getCachedSecret( key ) ||
                         await this.getSecret( key );

            secret = this.resolveSecretValue( secret );

            if ( !isNull( secret ) && this.canCache( key ) )
            {
                this.cacheSecret( key, secret );
            }

            return this.resolveSecretValue( secret );
        }

        getCachedSecret( pKey )
        {
            let key = this.resolveKey( pKey );

            if ( this.restrictKeys && !(SecretsManager.isValidKey( key ) || SecretsManager.isValidKey( pKey )) )
            {
                return null;
            }

            let secret = super.getCachedSecret( this.createKey( key ) ) ||
                         super.getCachedSecret( key ) ||
                         process.env[this.createKey( key )] ||
                         process.env[key] ||
                         process.env[ucase( asString( key, true ) )];

            return this.resolveSecretValue( secret );
        }

        async getDbConnectionString()
        {
            let secret = this.getCachedSecret( KEYS.CONNECTION_STRING ) ||
                         await this.getSecret( KEYS.CONNECTION_STRING );

            return this.resolveSecretValue( secret );
        }

        async getCorsAllowedOrigin()
        {
            let secret = this.getCachedSecret( KEYS.CORS_ALLOWED_ORIGIN ) ||
                         await this.getSecret( KEYS.CORS_ALLOWED_ORIGIN );

            return this.resolveSecretValue( secret );
        }

        async getRateLimitWindowMs()
        {
            let secret = this.getCachedSecret( KEYS.RATE_LIMIT_MS ) ||
                         await this.getSecret( KEYS.RATE_LIMIT_MS );

            return this.resolveSecretValue( secret );
        }

        async getRateLimitMax()
        {
            let secret = this.getCachedSecret( KEYS.RATE_LIMIT_MS_MAX ) ||
                         await this.getSecret( KEYS.RATE_LIMIT_MS_MAX );

            return this.resolveSecretValue( secret );
        }

        async getInstanceUrl( pPrefix )
        {
            let prefix = asString( pPrefix || this.prefix, true );

            let secret = this.getCachedSecret( KEYS.INSTANCE_URL ) ||
                         await this.getSecret( createKey( prefix, KEYS.INSTANCE_URL ) );

            let url = this.resolveSecretValue( secret );

            return asString( isBlank( url ) ? await this.getSecret( KEYS.INSTANCE_URL ) : url, true );
        }

        async getTokenUrl( pPrefix )
        {
            let prefix = asString( pPrefix || this.prefix, true );

            let secret = this.getCachedSecret( KEYS.TOKEN_URL ) ||
                         await this.getSecret( createKey( prefix, KEYS.TOKEN_URL ) );

            let url = this.resolveSecretValue( secret );

            return asString( isBlank( url ) ? await this.getSecret( KEYS.TOKEN_URL ) : url, true );
        }

        async getTokenRedirectUrl( pPrefix )
        {
            let prefix = asString( pPrefix || this.prefix, true );

            let secret = this.getCachedSecret( KEYS.REDIRECT_URI ) ||
                         await this.getSecret( createKey( prefix, KEYS.REDIRECT_URI ) );

            let url = this.resolveSecretValue( secret );

            return asString( isBlank( url ) ? await this.getSecret( KEYS.REDIRECT_URI ) : url, true );
        }

        async getApiKey( pPrefix )
        {
            let prefix = asString( pPrefix || this.prefix, true );

            let secret = this.getCachedSecret( KEYS.API_KEY ) ||
                         await this.getSecret( createKey( prefix, KEYS.API_KEY ) );

            let apiKey = this.resolveSecretValue( secret );

            return asString( isBlank( apiKey ) ? await this.getSecret( KEYS.API_KEY ) : apiKey, true );
        }

        async getAccessToken( pPrefix )
        {
            let prefix = asString( pPrefix || this.prefix, true );

            let secret = this.getCachedSecret( KEYS.ACCESS_TOKEN ) ||
                         await this.getSecret( createKey( prefix, KEYS.ACCESS_TOKEN ) );

            let token = this.resolveSecretValue( secret );

            return asString( isBlank( token ) ? await this.getSecret( KEYS.ACCESS_TOKEN ) : token, true );
        }

        /**
         *
         * @param {string} pPrefix
         * @param {string }pDefault
         * @returns {Promise<*|void>}
         */
        async getApiVersion( pPrefix, pDefault = "v1" )
        {
            let prefix = asString( pPrefix || this.prefix, true );

            let secret = this.getCachedSecret( KEYS.API_VERSION ) ||
                         await this.getSecret( createKey( prefix, KEYS.API_VERSION ) );

            let version = this.resolveSecretValue( secret );

            version = asString( isBlank( version ) ? await this.getSecret( KEYS.API_VERSION ) : version, true );

            return version || asString( pDefault, true ) || await super.getApiVersion( prefix, pDefault );
        }

        async getClientId( pPrefix )
        {
            let prefix = asString( pPrefix || this.prefix, true );

            let secret = this.getCachedSecret( KEYS.CLIENT_ID ) ||
                         await this.getSecret( createKey( prefix, KEYS.CLIENT_ID ) );

            secret = this.resolveSecretValue( secret );

            return asString( isBlank( secret ) ? await this.getSecret( KEYS.CLIENT_ID ) : secret, true );
        }

        async getClientSecret( pPrefix )
        {
            let prefix = asString( pPrefix || this.prefix, true );

            let secret = this.getCachedSecret( KEYS.CLIENT_SECRET ) ||
                         await this.getSecret( createKey( prefix, KEYS.CLIENT_SECRET ) );

            secret = this.resolveSecretValue( secret );

            return asString( isBlank( secret ) ? await this.getSecret( KEYS.CLIENT_SECRET ) : secret, true );
        }

        async getAdminLoginName( pPrefix )
        {
            let prefix = asString( pPrefix || this.prefix, true );

            let secret = this.getCachedSecret( KEYS.ADMIN_LOGIN_NAME ) ||
                         await this.getSecret( createKey( prefix, KEYS.ADMIN_LOGIN_NAME ) );

            secret = this.resolveSecretValue( secret );

            return asString( isBlank( secret ) ? await this.getSecret( KEYS.ADMIN_LOGIN_NAME ) : secret, true );
        }

        async getAdminPwd( pPrefix )
        {
            let prefix = asString( pPrefix || this.prefix, true );

            let pw = this.getCachedSecret( KEYS.ADMIN_LOGIN_PWD ) ||
                     await this.getSecret( createKey( prefix, KEYS.ADMIN_LOGIN_PWD ) );

            pw = this.resolveSecretValue( pw );

            return asString( isBlank( pw ) ? await this.getSecret( KEYS.ADMIN_LOGIN_PWD ) : pw, true );
        }

        async getAuthUrl( pPrefix )
        {
            let prefix = asString( pPrefix || this.prefix, true );

            let url = this.getCachedSecret( KEYS.AUTH_URL ) ||
                      await this.getSecret( createKey( prefix, KEYS.AUTH_URL ) );

            url = this.resolveSecretValue( url );

            return asString( isBlank( url ) ? await this.getSecret( KEYS.AUTH_URL ) : url, true );
        }
    }

    const DEFAULT_PROVIDER_OPTIONS =
        {
            secretsManagerClass: LocalSecretsManager,
            keyStoreName: ".env"
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
            const options = lock( { ...(DEFAULT_PROVIDER_OPTIONS), ...(pOptions ?? {}) } );

            this.#id = asInt( pId, options.id ) || options.id || Date.now();

            this.#name = asString( pName || options.name, true ) || getClassName( this );

            this.#secretsManagerClass = isClass( options.secretsManagerClass ) ? options.secretsManagerClass : isNonNullObject( options.secretsManagerClass ) ? getClass( options.secretsManagerClass ) || (() => options.secretsManagerClass) : LocalSecretsManager;

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
            return lock( { ...(DEFAULT_PROVIDER_OPTIONS), ...(this.#options ?? {}) } );
        }

        get secretsManagerClass()
        {
            if ( isClass( this.#secretsManagerClass ) )
            {
                return this.#secretsManagerClass;
            }

            if ( isNonNullObject( this.#secretsManagerClass ) )
            {
                return getClass( this.#secretsManagerClass ) || (() => this.#secretsManagerClass);
            }

            if ( isFunction( this.#secretsManagerClass ) )
            {
                return this.#secretsManagerClass;
            }

            return LocalSecretsManager;
        }

        getSecretsManager( pSource, pPrefix, pOptions )
        {
            const options = lock( { ...(DEFAULT_PROVIDER_OPTIONS), ...(this.options || {}), ...(pOptions ?? {}) } );

            const source = pSource || options.source || options.keyStoreName || options.keyVaultName || this.keyStoreName;

            const prefix = pPrefix || options.prefix || options.prefix;

            const klass = this.secretsManagerClass;

            if ( isClass( klass ) )
            {
                return new klass( source, prefix, options );
            }
            else if ( isFunction( klass ) )
            {
                return klass.call( this, source, prefix, options );
            }
            else if ( isNonNullObject( klass ) && klass instanceof SecretsManager )
            {
                return klass;
            }
            return new LocalSecretsManager( source, prefix, options );
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

        constructor( pId, pName, pSecretsProvider )
        {
            super( pName );

            this.#id = asInt( pId );
            this.#name = asString( pName, true );
            this.#secretsProvider = pSecretsProvider;

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

        getSecretsManager( pSource = calculateSecretsSource(), pPrefix, pOptions = {} )
        {
            if ( isNonNullObject( this.secretsProvider ) )
            {
                return this.secretsProvider.getSecretsManager( pSource, pPrefix, pOptions );
            }

            return new LocalSecretsManager( pSource, pPrefix, pOptions );
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
                    return new SecretsManagerMode( 1, "Production" );
                case ExecutionMode.MODES.DEV:
                case ExecutionMode.MODES.DEBUG:
                case ExecutionMode.MODES.DEVELOPMENT:
                case ExecutionMode.MODES.TEST:
                default:
                    return new SecretsManagerMode( 2, "Development", LocalSecretsManager );
            }
        }
    }

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
            let mode = new SecretsManagerMode( pObj.id, pObj.name, pObj.secretsProvider ?? pObj.provider ?? pObj );

            return populateProperties( mode, pObj );
        }

        return new SecretsManagerMode( pObj?.id || pObj, pObj?.name || pObj, pObj?.secretsProvider ?? pObj?.provider ?? pObj );
    };

    SecretsManagerMode.resolveMode = function( pMode )
    {
        let mode = null;

        if ( isString( pMode ) )
        {
            mode = SecretsManagerMode.getModeByName( pMode ) || SecretsManagerMode[ucase( asString( pMode, true ) )];
        }

        if ( isNull( mode ) )
        {
            if ( isNumeric( pMode ) )
            {
                mode = SecretsManagerMode.fromExecutionMode( ExecutionMode.from( pMode ) );
            }

            if ( isNull( mode ) )
            {
                if ( isNonNullObject( pMode ) )
                {
                    mode = SecretsManagerMode.from( pMode );
                }
            }
        }

        return mode;
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
        #mode = SecretsManagerMode.from( ExecutionMode.calculate() );

        #keyPath = "./.env";

        #prefix = _mt;

        #options = {};

        constructor( pMode, pKeyPath, pPrefix, pOptions = {} )
        {
            this.#mode = SecretsManagerMode.resolveMode( pMode || toolBocksModule.executionMode );

            this.#prefix = ucase( asString( pPrefix, true ) );

            this.#keyPath = pKeyPath || calculateSecretsSource( this.#mode ) || "./.env";

            this.#options = populateOptions( pOptions || {}, {} );
        }

        get mode()
        {
            return this.#mode || ExecutionMode.calculate();
        }

        get prefix()
        {
            return this.#prefix;
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
            let options = lock( { ...(this.options || {}), ...(pOptions ?? {}) } );

            let secretsManagerMode = options.mode || this.mode || SecretsManagerMode.from( ExecutionMode.calculate() );

            return secretsManagerMode.getSecretsManager( this.keyPath, this.prefix, options );
        }

        static getInstance( pMode, pSource, pPrefix, pOptions )
        {
            return new SecretsManagerFactory( pMode, pSource, pPrefix, pOptions );
        }
    }

    SecretsManagerFactory.makeSecretsManager = function( pMode, pSource = calculateSecretsSource(), pPrefix, pOptions )
    {
        let factory = SecretsManagerFactory.getInstance( pMode, pSource || calculateSecretsSource(), pPrefix, pOptions );

        return factory.getSecretsManager( pOptions );
    };

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
                    SecretsManagerFactory,
                    SecretClient,
                    ChainedTokenCredential,
                    DefaultAzureCredential
                },
            SecretsProvider,
            SecretsManagerMode,
            SecretsManager,
            LocalSecretsManager,
            SecretsManagerFactory,
            calculateSecretsSource,
            getSecretsManager: function( pMode, pSource, pPrefix, pOptions )
            {
                return SecretsManagerFactory.makeSecretsManager( pMode, pSource, pPrefix, pOptions );
            },
            getLocalSecretsManager: function( pSource, pPrefix, pOptions )
            {
                return new LocalSecretsManager( pSource, pPrefix, pOptions );
            },
            defineKeys: SecretsManager.defineKeys,
            addKey: SecretsManager.addKey,
            isValidKey: SecretsManager.isValidKey,
            getKeys: SecretsManager.getKeys,
            SECRETS_KEYS: lock( SecretsManager.getKeys() )
        };

    // extends the base module
    mod = toolBocksModule.extend( mod );

    // exports the module
    return mod.expose( mod, INTERNAL_NAME, (_ud !== typeof module ? module : mod) ) || mod;

}());
