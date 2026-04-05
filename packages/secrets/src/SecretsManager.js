// noinspection JSUnresolvedReference

const dotenvx = require( "@dotenvx/dotenvx" );

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
            ModuleEvent,
            ObjectEntry,
            __Error,
            objectEntries,
            objectValues,
            ILogger,
            NotImplementedError,
            readProperty,
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
            isNonNullObject,
            isArray,
            isDate,
            isMap,
            isClass,
            getClass,
            firstMatchingType,
            toObjectLiteral,
            delegateTo
        } = typeUtils;

    const { asString, isBlank, ucase, isFilePath, isJson } = stringUtils;

    const { asArray } = arrayUtils;

    const { exists } = fileUtils;

    const { asObject } = jsonUtils;

    class SecretsManagerError extends __Error
    {
        constructor( pMsgOrErr, pOptions = {}, ...pArgs )
        {
            super( pMsgOrErr, (pOptions ?? {}), ...pArgs );
        }
    }

    class KeyNotFoundError extends SecretsManagerError
    {
        constructor( pKey, pOptions = {}, ...pArgs )
        {
            super( `No Secret Defined for key, ${pKey}`, (pOptions ?? {}), ...pArgs );
        }
    }

    const SECRETS_STRATEGY =
        lock( {
                  LOCAL: "LOCAL",
                  AWS: "AWS",
                  AZURE: "AZURE",
                  GOOGLE: "GOOGLE",
                  ORACLE: "ORACLE",
                  DIGITAL_OCEAN: "DO",
                  OTHER: "other"
              } );

    const STRATEGY_OPTIONS = lock( objectValues( SECRETS_STRATEGY ) );

    const SECRETS_STRATEGY_ENV_VARIABLES =
        lock( {
                  AWS: lock( ["AWS_REGION", "AWS-REGION", "AWS_EXECUTION_ENV", "AWS-EXECUTION-ENV"] ),
                  DIGITAL_OCEAN: lock( ["DO_REGION", "DO-REGION", "DO_EXECUTION_ENV", "DO-EXECUTION-ENV"] ),
                  AZURE: lock( ["AZURE_REGION", "AZURE-REGION", "AZURE_EXECUTION_ENV", "AZURE-EXECUTION-ENV"] ),
                  GOOGLE: lock( ["GOOGLE_REGION", "GOOGLE-REGION", "GOOGLE_EXECUTION_ENV", "GOOGLE-EXECUTION-ENV"] ),
                  ORACLE: lock( ["ORACLE_REGION", "ORACLE-REGION", "ORACLE_EXECUTION_ENV", "ORACLE-EXECUTION-ENV"] )
              } );

    const ENV_VARIABLE_ENTRIES = lock( objectEntries( SECRETS_STRATEGY_ENV_VARIABLES ) );

    const calculateStrategy = ( pOptions ) =>
    {
        const options = asObject( pOptions ?? {} );

        // Allow an explicit override (for unit tests, for example)
        if ( options?.strategy && STRATEGY_OPTIONS.includes( options.strategy ) )
        {
            return options.strategy;
        }

        const proc = (_ud !== typeof process ? process : $scope());
        const ENV = proc?.env ?? $scope();

        // Check for an explicit strategy; this must be set in the container configuration
        if ( ENV.SECRETS_STRATEGY && STRATEGY_OPTIONS.includes( asString( ENV.SECRETS_STRATEGY, true ) ) )
        {
            return ENV.SECRETS_STRATEGY;
        }

        let strategy = null;

        for( let entry of ENV_VARIABLE_ENTRIES )
        {
            const arr = asArray( ObjectEntry.getValue( entry ) ).map( asString );

            for( let elem of arr )
            {
                if ( !isNull( ENV[elem] ) )
                {
                    strategy = asString( ObjectEntry.getKey( entry ), true );
                    if ( STRATEGY_OPTIONS.includes( strategy ) )
                    {
                        break;
                    }
                }
            }

            if ( !isNull( strategy ) && STRATEGY_OPTIONS.includes( strategy ) )
            {
                break;
            }
        }

        if ( !isNull( strategy ) && STRATEGY_OPTIONS.includes( strategy ) )
        {
            return strategy;
        }

        // Check for an explicit environment flag; this must be set in the container configuration
        const environmentKeys = ["EXECUTION_ENVIRONMENT", "EXECUTION-ENVIRONMENT"];

        for( let key of environmentKeys )
        {
            let environment = ENV[key];
            if ( !isNull( environment ) && STRATEGY_OPTIONS.includes( asString( environment, true ) ) )
            {
                strategy = asString( environment, true );
                break;
            }
        }

        if ( !isNull( strategy ) && STRATEGY_OPTIONS.includes( strategy ) )
        {
            return strategy;
        }

        // Default to LOCAL
        return SECRETS_STRATEGY.LOCAL;
    };

    const SECRET_VERSION =
        lock( {
                  CURRENT: "CURRENT",
                  PREVIOUS: "PREVIOUS"
              } );

    let KEYS =
        {
            /**
             * Possible values include "local", "AWS", "AZURE", "DO", "OCI", or "GOOGLE", for example
             */
            EXECUTION_ENVIRONMENT: "EXECUTION-ENVIRONMENT",

            /**
             * Possible values include "DEV", "TEST", "STAGING", and "PRODUCTION"
             */
            EXECUTION_MODE: "EXECUTION-MODE",

            /**
             * Only applicable for HA deployments.
             * Possible values are hosting-provider-specific
             */
            EXECUTION_REGION: "EXECUTION-REGION",

            /**
             * For secrets managers that require an explicit vault name, such as Azure Key Vault,
             * this value needs to be manually added to the process.env object.
             */
            KEY_VAULT_NAME: "KV-NAME",

            /**
             * For secrets managers that require an explicit store name, such as Azure Key Vault,
             * this value needs to be manually added to the process.env object.
             */
            KEY_STORE_NAME: "KEY-STORE-NAME",

            /**
             * This key can be used to store a value that indicates the key vault or secret store can be reached.
             */
            TEST_SECRET: "TEST-SECRET",

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

        let key = asString( pKey, true ).replace( new RegExp( ("^" + prefix), "i" ), _mt ).trim().replace( /^[_-]+/, _mt ).trim().replace( /[_-]+$/, _mt ).trim();

        let keyPart = (ucase( asString( key, true ) )).replace( new RegExp( ("^" + prefix), "i" ), _mt ).trim().replace( /^[_-]+/, _mt ).trim().replace( /[_-]+$/, _mt ).trim();

        return (ucase( isBlank( prefix ) ? keyPart : (prefix + _hyphen + keyPart) )).replace( /^[_-]+/, _mt ).trim().replace( /[_-]+$/, _mt ).trim();
    };

    const DEFAULT_OPTIONS =
        lock( {
                  source: "./.env",
                  allowCache: true,
                  excludeFromCache: [],
                  restrictKeys: false
              } );

    /**
     * The module that will be returned to expose the classes and functionality of the SecretsManager.
     */
    const toolBocksModule = new ToolBocksModule( "SecretsManager", INTERNAL_NAME );

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
        #strategy;

        #source;

        #prefix = _mt;

        #options = {};
        #args = [];

        #cache;
        #allowCache = true;
        #excludeFromCache = [];

        #restrictKeys = false;

        #logger;

        #initDate;

        #zTarget = new EventTarget();

        // noinspection GrazieInspection
        /**
         * Constructs an instance of this class.
         * <br>
         * <br>
         * This base class should rarely be constructed except as by a subclass constructor call to super().
         * <br>
         *
         * @param {Object} pOptions - an object providing subclass-specific values
         *                            for the construction of the instance
         *
         * @param {...*} pArgs - zero or more additional arguments that may be relevant to a subclass
         *
         * @constructor
         */
        constructor( pOptions = {}, ...pArgs )
        {
            this.#options = { ...(DEFAULT_OPTIONS), ...(toObjectLiteral( asObject( pOptions ?? {} ) )) };

            this.#strategy = calculateStrategy( this.#options );

            this.#args = asArray( pArgs ?? this.#options?.args ?? this.#args ?? [] );

            this.#logger = ToolBocksModule.resolveLogger( this.#options?.logger, firstMatchingType( ILogger, ...(asArray( this.#args ?? [] )) ), ToolBocksModule.getGlobalLogger(), console );

            this.#source = this.#options?.source || (SECRETS_STRATEGY.LOCAL === this.#strategy ? "./.env" : _mt);

            this.#prefix = asString( this.#options?.prefix || _mt, true ) || ($ln( this.#args ) > 0 ? this.#args[0] : _mt);

            this.#prefix = asString( this.#prefix || _mt, true ).replace( /^[_-]+/, _mt ).trim().replace( /[_-]+$/, _mt ).trim();

            this.#allowCache = (false !== this.#options?.allowCache);

            if ( isArray( this.#options?.excludeFromCache ) )
            {
                this.#excludeFromCache = [...(asArray( this.#options.excludeFromCache || [] ) || [])].filter( e => !isBlank( e ) );
            }

            this.#restrictKeys = !!(this.#options?.restrictKeys);

            if ( this.#allowCache )
            {
                this.#cache = new Map();
            }

            this.#options = lock( this.#options ?? {} );

            delegateTo( this, this.#zTarget );
        }

        /**
         * Returns a new copy of the configuration object passed to the constructor
         * @returns {Object} a new copy of the configuration object passed to the constructor
         */
        get options()
        {
            return lock( { ...(DEFAULT_OPTIONS), ...(this.#options ?? {}) } );
        }

        get logger()
        {
            return ToolBocksModule.resolveLogger( this.#logger, this.#options?.logger, ToolBocksModule.getGlobalLogger(), console );
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
            return [...(asArray( this.#excludeFromCache ?? [] ))];
        }

        /**
         * Returns the location of the keys (such as the path to a .env file or the url of an Azure KeyVault
         * @returns {string}
         */
        get source()
        {
            return this.#source || this.#options?.source || DEFAULT_OPTIONS.source;
        }

        /**
         * Returns the prefix to use when looking for values.
         * <br>
         * <br>
         * @returns {string} the prefix to use when looking for values.
         */
        get prefix()
        {
            return asString( this.#prefix, true ).replace( /^[_-]+/, _mt ).trim().replace( /[_-]+$/, _mt ).trim();
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
            return createKey( this.prefix, ucase( (asString( pKey, true ).replace( new RegExp( `^${this.prefix}[_-]`, "i" ), _mt )) ) );
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

                const arr = asArray( this.excludeFromCache ?? [] );

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
            return this.createKey( asString( pKey, true ) ).replaceAll( /_/g, _hyphen ).replace( /^-+/, _mt ).replace( /-+$/, _mt );
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
            return isNonNullObject( pSecret ) ? readProperty( pSecret, "value", "Value", "data", "Data", "SecretString", "SecretBinary" ) || asString( pSecret ) : asString( pSecret ) || _mt;
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
                    this.#cache.set( this.resolveKey( pKey ), pSecret );
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
            throw new NotImplementedError( `This method must be implemented in each secure-store-specific subclass`, { key: pKey }, pKey );
        }

        /**
         * Returns a Promise that resolves to the secret value stored under the specified key or null, if the value is not found
         * @param pKey
         * @param pVersion
         * @param pIgnoreCache
         * @returns {Promise<void>} a Promise that resolves to the secret value stored under the specified key or null, if the value is not found
         */
        async get( pKey, pVersion = SECRET_VERSION.CURRENT, pIgnoreCache = false )
        {
            let key = this.resolveKey( pKey );

            if ( this.#restrictKeys && !(SecretsManager.isValidKey( pKey ) || SecretsManager.isValidKey( key )) )
            {
                return null;
            }

            let ignoreCache = !!pIgnoreCache;

            // try the cache first
            let secret = (ignoreCache ? null : this.getCachedSecret( key ));

            // if found in the cache... return the value
            if ( !isNull( secret ) )
            {
                return this.resolveSecretValue( secret );
            }

            // call the subclass method to get the value from the key store
            secret = await this.getSecret( key ) ||
                     await this.getSecret( ucase( asString( key, true ) ) ) ||
                     await this.getSecret( this.resolveKey( key ) );

            secret = this.resolveSecretValue( secret );

            if ( !isNull( secret ) && ( !isString( secret ) || !isBlank( secret )) )
            {
                // if the value returned can be cached, cache it for the next call to this method
                if ( this.canCache( pKey ) )
                {
                    this.cacheSecret( pKey, secret );
                }
            }
            else
            {
                attempt( () => this.dispatchEvent( new ModuleEvent( "error",
                                                                    {
                                                                        key: pKey,
                                                                        secret,
                                                                        message: "Cannot find value for key, " + pKey
                                                                    }, {} ) ) );
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
            let secret = this.#cache.get( key ) || this.#cache.get( ucase( asString( key, true ) ) ) || this.#cache.get( pKey );

            // if it is found, we simply return it
            if ( !isNull( secret ) && ( !isString( secret ) || !isBlank( secret )) )
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
                secret = await asyncAttempt( async() => await THIZ.getSecret( THIZ.resolveKey( uK ) ) ) ||
                         await asyncAttempt( async() => await THIZ.getSecret( uK ) ) ||
                         await asyncAttempt( async() => await THIZ.getSecret( k ) ) ||
                         await asyncAttempt( async() => await THIZ.getSecret( pKey ) );

                // if it is found, try to cache it for next time
                if ( !isNull( secret ) && ( !isString( secret ) || !isBlank( secret )) )
                {
                    if ( !isNull( secret ) && THIZ.canCache( k ) )
                    {
                        THIZ.cacheSecret( k, secret );
                    }

                    return THIZ.resolveSecretValue( secret );
                }
            }( key ));

            // return whatever value is currently stored in the secret variable
            return this.resolveSecretValue( secret );
        }

        clearCache()
        {
            if ( isMap( this.#cache ) )
            {
                this.#cache.clear();
            }
        }

        get initialized()
        {
            return !isNull( this.#initDate ) && isDate( this.#initDate );
        }

        async init( ...pArgs )
        {
            if ( !this.initialized )
            {
                this.#initDate = lock( new Date() );
            }

            return this;
        }

        async dispose( ...pArgs )
        {
            this.clearCache();
            this.#initDate = null;

            return this;
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
                kvObj = attempt( () => asObject( pJson ) );
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

    SecretsManager.getDefaultInstance = function( pPrefix, pOptions )
    {
        let opts = (asObject( pOptions ?? { prefix: asString( pPrefix, true ) } ));

        let options =
            {
                ...(asObject( opts ?? {} )),
                ...({ prefix: asString( pPrefix, true ) || opts?.prefix })
            };

        return new SecretsManager( options, ...(asArray( [(asString( pPrefix, true ) || _mt)] )) );
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
        constructor( pOptions = DEFAULT_OPTIONS, ...pArgs )
        {
            super( pOptions, ...pArgs );

            let path = this.source || pOptions?.source || pOptions?.path || "./.env";

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
            const proc = (_ud !== typeof process ? process : $scope());
            const ENV = proc?.env ?? $scope();

            let key = this.resolveKey( pKey );

            let secret = ENV[key] || ENV[ucase( key )] || ENV[asString( pKey, true )] || ENV[ucase( asString( pKey, true ) )];

            return this.resolveSecretValue( secret );
        }

        async get( pKey, pVersion = SECRET_VERSION.CURRENT, pIgnoreCache = false )
        {
            let key = this.resolveKey( pKey );

            if ( this.restrictKeys && !(SecretsManager.isValidKey( pKey ) || SecretsManager.isValidKey( key )) )
            {
                return null;
            }

            let ignoreCache = !!pIgnoreCache;

            let secret = (ignoreCache ? null : this.getCachedSecret( key )) ||
                         await this.getSecret( key ) ||
                         await this.getSecret( pKey );

            if ( !isNull( secret ) && this.canCache( key ) )
            {
                this.cacheSecret( key, secret );
            }

            return this.resolveSecretValue( secret );
        }

        getCachedSecret( pKey )
        {
            let key = this.resolveKey( pKey );

            if ( this.restrictKeys && !(SecretsManager.isValidKey( pKey ) || SecretsManager.isValidKey( key )) )
            {
                return null;
            }

            const proc = (_ud !== typeof process ? process : $scope());
            const ENV = proc?.env ?? $scope();

            let secret = super.getCachedSecret( key ) || ENV[key] || ENV[ucase( key )];

            if ( !isNull( secret ) && this.canCache( key ) )
            {
                this.cacheSecret( key, secret );
            }

            return this.resolveSecretValue( secret );
        }

        async init( ...pArgs )
        {
            let args = asArray( pArgs );

            let path = asString( args.find( e => asString( e, true ).endsWith( ".env" ) ) || this.source || _mt ) || _mt;

            if ( !isBlank( path ) && isFilePath( path ) && exists( path ) )
            {
                attempt( () => dotenvx.config( { path: path, overload: true } ) );
            }

            return super.init( ...pArgs );
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

    SecretsManager.getLocalInstance = function( pPrefix, pSource, pOptions )
    {
        let opts = { ...(DEFAULT_OPTIONS), ...(asObject( pOptions ?? DEFAULT_OPTIONS ?? {} )) };

        let options =
            {
                ...(asObject( opts ?? {} )),
                ...({ prefix: asString( pPrefix, true ) || opts?.prefix }),
                ...(asObject( { source: pSource ?? opts?.source ?? "./.env" } ))
            };

        return new LocalSecretsManager( options, ...(asArray( [(asString( pPrefix, true ) || _mt), pSource] )) );
    };

    const SECRETS_MANAGER_CLASSES =
        {
            LOCAL: LocalSecretsManager
        };

    const registerSecretsManagerClass = function( pStrategy, pClass )
    {
        let strategy = asString( pStrategy, true );

        let clazz = isClass( pClass ) ? pClass : isNonNullObject( pClass ) ? getClass( pClass ) : SecretsManager;

        if ( STRATEGY_OPTIONS.includes( pStrategy ) )
        {
            SECRETS_MANAGER_CLASSES[strategy] = clazz;
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
        #strategy;

        #keyPath = "./.env";

        #prefix = _mt;

        #options = {};

        constructor( pOptions = {}, ...pArgs )
        {
            const options = asObject( pOptions ?? {} );

            const args = asArray( pArgs ?? options?.args ?? [] );

            this.#strategy = calculateStrategy( options );

            this.#prefix = ucase( asString( options?.prefix || ($ln( args ) > 0 ? args[0] : _mt), true ) );

            this.#keyPath = options?.keyPath || options?.mount || options.path || (SECRETS_STRATEGY.LOCAL === this.#strategy ? "./.env" : _mt);

            this.#options = lock( options ?? {} );
        }

        get options()
        {
            return lock( { ...(asObject( this.#options ?? {} )) } );
        }

        get strategy()
        {
            return this.#strategy || calculateStrategy( this.options );
        }

        get prefix()
        {
            let s = asString( (this.#prefix || this.options.prefix), true );
            s = s.replaceAll( /_+/, _hyphen );
            s = s.replace( /^[_-]+/, _mt ).trim().replace( /[_-]+$/, _mt ).trim();
            return asString( s, true );
        }

        get keyPath()
        {
            return this.#keyPath || this.options.keyPath || (SECRETS_STRATEGY.LOCAL === this.strategy ? "./.env" : _mt) || _mt;
        }

        create( pOptions = {}, ...pArgs )
        {
            const options = lock( { ...(asObject( this.options || {} )), ...(asObject( pOptions ?? {} )) } );

            const strategy = calculateStrategy( options );

            let clazz = SECRETS_MANAGER_CLASSES[strategy] ?? SecretsManager;

            if ( isClass( clazz ) )
            {
                return new clazz( options, ...pArgs );
            }

            if ( isNonNullObject( clazz ) )
            {
                clazz = getClass( clazz ) ?? SecretsManager;
                return new clazz( options, ...pArgs );
            }

            return new SecretsManager( options, ...pArgs );
        }

        static getInstance( pOptions, ...pArgs )
        {
            return new SecretsManagerFactory( pOptions, ...pArgs );
        }
    }

    SecretsManagerFactory.makeSecretsManager = function( pOptions, ...pArgs )
    {
        let factory = SecretsManagerFactory.getInstance( pOptions, ...pArgs );

        return factory.create( pOptions, ...pArgs );
    };

    SecretsManager.prototype.keys = function()
    {
        return lock( Object.values( SecretsManager.getKeys() ) );
    };

    /**
     * The actual functionality to be exposed via the toolBocksModule.
     *
     */
    let mod =
        {
            SECRETS_STRATEGY,
            STRATEGY_OPTIONS,
            SECRETS_STRATEGY_ENV_VARIABLES,
            SECRET_VERSION,
            dependencies:
                {
                    dotenvx,
                    core,
                    moduleUtils,
                    constants,
                    typeUtils,
                    stringUtils,
                    arrayUtils
                },
            classes:
                {
                    SecretsManagerError,
                    KeyNotFoundError,
                    SecretsManager,
                    LocalSecretsManager,
                    SecretsManagerFactory
                },
            SecretsManagerError,
            KeyNotFoundError,
            SecretsManager,
            LocalSecretsManager,
            SecretsManagerFactory,
            getSecretsManager: function( pOptions, ...pArgs )
            {
                return SecretsManagerFactory.makeSecretsManager( pOptions, ...pArgs );
            },
            getLocalSecretsManager: function( pOptions, ...pArgs )
            {
                return new LocalSecretsManager( pOptions, ...pArgs );
            },
            registerSecretsManagerClass,
            defineKeys: SecretsManager.defineKeys,
            addKey: SecretsManager.addKey,
            isValidKey: SecretsManager.isValidKey,
            getKeys: SecretsManager.getKeys,
            SECRETS_KEYS: lock( SecretsManager.getKeys() )
        };

    $scope()["SecretsManager"] = SecretsManager;
    $scope()["LocalSecretsManager"] = LocalSecretsManager;

    // extends the base module
    mod = toolBocksModule.extend( mod );

    // exports the module
    return mod.expose( mod, INTERNAL_NAME, (_ud !== typeof module ? module : mod) ) || mod;

}());
