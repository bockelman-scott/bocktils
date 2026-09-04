// noinspection JSUnresolvedReference

const dotenvx = require( "@dotenvx/dotenvx" );

const core = require( "@toolbocks/core" );
const fileUtils = require( "@toolbocks/files" );
const jsonUtils = require( "@toolbocks/json" );
const logUtils = require( "@toolbocks/logging" );

const { constants } = core;

const { _ud = "undefined", $scope } = constants;

(function exposeModule()
{
    const INTERNAL_NAME = "__BOCK__SECRETS_UTILS__";

    if ( $scope() && (null != $scope()[INTERNAL_NAME]) )
    {
        return $scope()[INTERNAL_NAME];
    }

    const dotEnvxOptions = { overload: true, quiet: true, logLevel: "error" };

    const { moduleUtils, constants, typeUtils, stringUtils, arrayUtils } = core;

    const
        {
            ToolBocksModule,
            ModuleEvent,
            ObjectEntry,
            __Error,
            objectEntries,
            objectValues,
            objectKeys,
            ILogger,
            NotImplementedError,
            readProperty,
            attempt,
            attemptSilent,
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
            getClassName,
            firstMatchingType,
            toObjectLiteral,
            delegateTo
        } = typeUtils;

    const { asString, toBool, isBlank, ucase, isFilePath, isJson } = stringUtils;

    const { asArray, unique, replaceElements } = arrayUtils;

    const { exists } = fileUtils;

    const { asObject } = jsonUtils;

    const { SimpleLogger, SourcedSimpleLogger } = logUtils;

    const PROCESS = (_ud !== typeof process ? process : $scope());
    const ENVIRONMENT = PROCESS?.env ?? $scope();

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

        const proc = PROCESS ?? (_ud !== typeof process ? process : $scope());
        const ENV = ENVIRONMENT ?? proc?.env ?? proc?.ENV ?? $scope();

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

            SUPPORTED_DATABASE_TYPES: "SUPPORTED-DATABASE-TYPES",
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
            DEFAULT_COLLECTION_NAME: "DEFAULT-COLLECTION-NAME",

            LOGIN_NAME: "LOGIN-NAME",
            LOGIN_PWD: "LOGIN-PWD",

            CORS_ALLOWED_ORIGIN: "CORS-ALLOWED-ORIGIN",
            RATE_LIMIT_MS: "RATE-LIMIT-MS",
            RATE_LIMIT_MS_MAX: "RATE-LIMIT-MS-MAX",

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

            ADMIN_LOGIN_NAME: "ADMIN-LOGIN-NAME",
            ADMIN_LOGIN_PWD: "ADMIN-LOGIN-PWD"
        };

    const DEFAULT_KEYS = lock( { ...KEYS } );

    const DEFAULT_OPTIONS =
        lock( {
                  source: "./.env",
                  allowCache: true,
                  excludeFromCache: [],
                  restrictKeys: false,
                  separator: _hyphen
              } );

    const createKey = ( pPrefix, pKey, pSeparator = DEFAULT_OPTIONS.separator ) =>
    {
        const prefix = asString( pPrefix, true );

        const separator = asString( pSeparator, true ) || DEFAULT_OPTIONS.separator;

        const rxPrefix = new RegExp( ("^" + (prefix || "#")), "i" );

        const rxStartSep = new RegExp( "^" + (separator || "~") + "+" );

        const rxEndSep = new RegExp( (separator || "~") + "+" + "$" );

        const rxDuplicated = new RegExp( `${(separator||"~")}{2,}`, "g" );

        const key = asString( pKey, true ).replace( rxPrefix, _mt ).replace( rxStartSep, _mt ).trim();

        const keyPart = asString( key, true ).replace( rxPrefix, _mt ).replace( rxStartSep, _mt ).trim();

        let resolved = ((isBlank( prefix ) ? keyPart : (prefix + separator + keyPart))).trim();

        if ( !isBlank( separator ) )
        {
            resolved = asString( resolved, true ).replaceAll( /[_.-]+/g, separator );
            resolved = asString( resolved, true ).replaceAll( rxDuplicated, separator );
            resolved = asString( resolved, true ).replace( rxStartSep, _mt );
            resolved = asString( resolved, true ).replace( rxEndSep, _mt );
        }

        return asString( resolved, true );
    };

    /**
     * Returns true if the specified string starts with a hash sign (#) or 2 slashes (//)
     * @param {string} pStr the string to evaluate (usually a line of text read from a file)
     * @returns {boolean} true if the specified string starts with a hash sign (#) or 2 slashes (//)
     */
    const isComment = ( pStr ) => isString( pStr ) && (asString( pStr, true ).startsWith( "#" ) || asString( pStr, true ).startsWith( "//" ));

    /**
     * Returns true if the specified string appears to be a "secrets prefix",
     * a short string to distinguish between secrets of the same name, for example "API_KEY"
     *
     * @param {string} pStr the string to evaluate
     *
     * @returns {boolean} true if the specified string appears to be a "secrets prefix"
     */
    const isPrefix = ( pStr ) => isString( pStr ) && !isBlank( pStr ) && /[A-Z]{1,4}[_.-]?/.test( pStr ) && !(/[;:/\\]/i).test( pStr );

    /**
     * Returns true if the specified value is not null or an empty string
     *
     * @param {Object|string|*} pSecret the value to evaluate
     *
     * @returns {boolean} true if the specified value is not null or an empty string
     */
    const isValidSecret = ( pSecret ) => !(isNull( pSecret ) || (isString( pSecret ) && isBlank( pSecret )));

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
        /**
         * The constant value indicating the Secrets Store this instance expects to use.
         * Examples include" "AWS", "AZURE", and "LOCAL"
         */
        #strategy;

        /**
         * The origin of the secrets.
         * For LOCAL startageies, this is the filePath to the .env file, for example
         */
        #source;

        /**
         * The prefix to prepend to secret keys for retrieval.
         *
         * @type {string}
         */
        #prefix = _mt;

        /**
         * The character (or string) to use to separate the prefix from the key
         * or that is expected to seperate parts of a key.
         *
         * For example, a key might be stored as "SP-API-KEY" in one store, but "SP_API_KEY" in another.
         *
         * @type {string}
         */
        #separator = DEFAULT_OPTIONS.separator;

        /**
         * An object used to provide additional configuration values
         * to an instance of SecretsManager or one of its subclasses.
         * Properties vary by subclass.
         *
         * @type {Object}
         */
        #options = {};

        /**
         * An array of any additional arguments passed to the constructor.
         *
         * @type {Array.<*>}
         */
        #args = [];

        /**
         * An internal cache of values already retrieved and resolved.
         * Caching behavior can be disabled for a specific instance
         * or for specific keys.
         *
         * @type {Map<string, any>}
         */
        #cache = new Map();

        /**
         * Specifies whether to cache secrets retrieved from the external secrets store.
         * If set to false, no secrets are cached and must be retrieved from the secrets store on every request.
         *
         * @type {boolean}
         */
        #allowCache = true;

        /**
         * An array of keys for secrets that should not be cached.
         * This provides finer-grained control that the 'allowCache' property.
         *
         * @type {Array.<string>}
         */
        #excludeFromCache = [];

        /**
         * Specifies whether this instance supports retrieval of keys not defined prior to the construction of the instance.
         * When true, only keys that have been predefined will return values.
         * When false, any key that exists in the cache or the secrets sore can be retrieved
         *
         * @type {boolean}
         */
        #restrictKeys = false;

        /**
         * An array of keys for which no secret can be found in the secrets store.
         * This is used to prevent repeated attempts to get a secret that does not exist.
         *
         * @type {Array.<string>}
         */
        #missing = [];

        /**
         * The Logger to use to report errors or write other important messages to a log
         */
        #logger;

        /**
         * The date/time this instance was initialized.
         * Used to indicate the instance is ready for use.
         * Can also be used to refresh the cache, if necessay
         *
         * @type {Date|null}
         */
        #initDate;

        /**
         * The object used to dispatch or receive events,
         * allowing instances of SecretsManager to behave as EventTargets
         * @type {EventTarget | __EventTarget}
         */
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
            this.#options = { ...(DEFAULT_OPTIONS), ...(asObject( pOptions ?? {} )) };

            this.#strategy = calculateStrategy( this.#options );

            this.#args = asArray( pArgs ?? this.#options?.args ?? this.#args ?? [] );

            this.#logger = ToolBocksModule.resolveLogger( this.#options?.logger, firstMatchingType( ILogger, ...(asArray( this.#args ?? [] )) ), ToolBocksModule.getGlobalLogger(), console );
            this.#logger = (this.#logger instanceof SourcedSimpleLogger) ? this.#logger : SourcedSimpleLogger.adapt( this.#logger ?? new SimpleLogger( console ), this );

            this.#prefix = asString( this.#options?.prefix || this.#options?.secretsPrefix || _mt, true ) || ($ln( this.#args ) > 0 ? this.#args.find( isPrefix ) : _mt);

            this.#prefix = asString( this.#prefix || _mt, true );

            this.#separator = asString( this.#options?.separator, true );

            this.#source = this.#options?.source ||
                           ($ln( this.#args ) > 0 ?
                            this.#args.find( e => !isNull( e ) && isString( pStr ) && !isBlank( pStr ) && pStr !== this.#prefix ) :
                            (SECRETS_STRATEGY.LOCAL === this.#strategy ? "./.env" : _mt)) ||
                           (SECRETS_STRATEGY.LOCAL === this.#strategy ? "./.env" : _mt);

            this.#allowCache = (false !== this.#options?.allowCache);

            if ( isArray( this.#options?.excludeFromCache ) )
            {
                this.#excludeFromCache = [...(asArray( this.#options.excludeFromCache || [] ) || [])].filter( e => !isBlank( e ) );
            }

            this.#restrictKeys = toBool( this.#options?.restrictKeys );

            this.#missing = asArray( this.#missing ?? [] );

            if ( !(toBool( this.#allowCache )) )
            {
                this.#cache = {};
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
            return ToolBocksModule.resolveLogger( this.#logger,
                                                  this.#options?.logger,
                                                  ToolBocksModule.getGlobalLogger(),
                                                  new SourcedSimpleLogger( console, this ) );
        }

        get missing()
        {
            return [...(asArray( this.#missing ?? [] ))];
        }

        isMissing( pKey )
        {
            if ( isBlank( pKey ) )
            {
                return true;
            }

            const absent = asArray( this.missing ?? [] );

            return absent.includes( pKey ) || absent.includes( this.resolveKey( pKey ) );
        }

        recordMissingKeys( ...pKeys )
        {
            this.#missing.push( ...(asArray( pKeys ).map( e => asString( e, true ) ).filter( e => !isBlank( e ) )) );
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
            return toBool( this.#allowCache );
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
            return asString( (this.#prefix || this.#options?.secretsPrefix), true ).trim();
        }

        get separator()
        {
            return asString( this.#separator, true ) || DEFAULT_OPTIONS?.separator;
        }

        get restrictKeys()
        {
            return toBool( this.#restrictKeys );
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
            return createKey( this.prefix, pKey, this.separator );
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

                return isMap( this.#cache ) && !(arr.includes( k ) || arr.includes( uK ));
            }

            return false;
        }

        isValidSecret( pSecret )
        {
            return isValidSecret( pSecret ) || !(isNull( pSecret ) || (isString( pSecret ) && isBlank( pSecret )));
        }

        /**
         * Override for subclasses to reflect different key formatting.
         *
         * @param {String} pKey a key under which a secret is stored
         *
         * @returns {String} a string that adheres to the formatting conventions or restrictions
         *                   of the key store
         */
        resolveKey( pKey )
        {
            return this.createKey( asString( pKey, true ) );
        }

        /**
         * Returns the value of the retrieved secret.
         * May be overridden to match the return values of the specific key store
         *
         * @param {*} pSecret  the value returned from the key store
         *
         * @returns {*}  the value of the secret if that value is a property of the returned value or the returned value otherwise
         */
        resolveSecretValue( pSecret, pKey )
        {
            const data = isNonNullObject( pSecret ) || isJson( pSecret ) ? asObject( pSecret ) : asString( pSecret );

            const value = isNonNullObject( data ) ?
                          readProperty( data,
                                        "value",
                                        "Value",
                                        "SecretString",
                                        "SecretBinary",
                                        "data",
                                        "Data",
                                        "secret",
                                        (asString( pKey, true ) || "~"),
                                        this.resolveKey( (asString( pKey, true ) || "~") ) ) || asString( data ) :
                          asString( data ) || _mt;

            return value ?? asString( pSecret );
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
            if ( isValidSecret( pSecret ) )
            {
                if ( this.allowCache && isMap( this.#cache ) && this.canCache( pKey ) )
                {
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
        async getSecret( pKey, pVersion = SECRET_VERSION.CURRENT )
        {
            const msg = `This method must be implemented in each secure-store-specific subclass`;
            throw new NotImplementedError( msg,
                                           {
                                               key: pKey,
                                               className: getClassName( this )
                                           }, pKey, getClassName( this ) );
        }

        /*
         * IMPORTANT!!!  THE METHOD SIGNATURE FOR get MUST NOT PROVIDE A DEFAULT FOR pVersion
         * This is because of how JavaScript determines the 'length' of a function.
         * We do not want this 'get' to appear to have length === 1,
         * because readProperty will try to call it.
         * TRUST ME!
         */

        /**
         * Returns a Promise that resolves to the secret value stored under the specified key or null, if the value is not found
         * @param pKey
         * @param pVersion
         * @param pIgnoreCache
         * @returns {Promise<void>} a Promise that resolves to the secret value stored under the specified key or null, if the value is not found
         */
        async get( pKey, pVersion, pIgnoreCache = false )
        {
            if ( isBlank( pKey ) )
            {
                return null;
            }

            let key = this.resolveKey( pKey );

            if ( this.#restrictKeys && !(SecretsManager.isValidKey( pKey ) || SecretsManager.isValidKey( key )) )
            {
                return null;
            }

            const ignoreCache = toBool( pIgnoreCache );

            // try the cache first
            let secret = (ignoreCache ? null : this.getCachedSecret( key ));

            // if found in the cache... return the value
            if ( !isNull( secret ) )
            {
                secret = this.resolveSecretValue( secret );
                if ( isValidSecret( secret ) )
                {
                    return secret;
                }
            }

            if ( this.isMissing( key ) )
            {
                return null;
            }

            // call the subclass method to get the value from the key store

            const version = pVersion || SECRET_VERSION.CURRENT;
            try
            {
                secret = await this.getSecret( key, version ) ||
                         await this.getSecret( ucase( asString( key, true ) ), version ) ||
                         await this.getSecret( asString( pKey, true ), version );

                secret = this.resolveSecretValue( secret );
            }
            catch( ex )
            {
                attemptSilent( () => this.logger.error( ex.message, ex ) );
                attemptSilent( () => toolBocksModule.reportError( ex, ex.message, "error", getClassName( this ), "getSecret", key, pVersion, pIgnoreCache ) );
            }

            if ( isValidSecret( secret ) )
            {
                // if the value returned can be cached, cache it for the next call to this method
                secret = this.resolveSecretValue( secret );
                this.cacheSecret( key, secret );
            }
            else
            {
                attempt( () => this.dispatchEvent( new ModuleEvent( "error",
                                                                    {
                                                                        key: key,
                                                                        version: version || pVersion,
                                                                        message: "Cannot find value for key, " + key
                                                                    }, {} ) ) );
                attemptSilent( () => this.#missing.push( key ) );
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
            if ( isBlank( pKey ) )
            {
                return null;
            }

            let key = this.resolveKey( pKey );

            if ( this.#restrictKeys && !(SecretsManager.isValidKey( pKey ) || SecretsManager.isValidKey( key )) )
            {
                return null;
            }

            // try to get the value from the cache
            let secret = isMap( this.#cache ) ? (this.#cache.get( key ) ||
                                                 this.#cache.get( ucase( asString( key, true ) ) ) ||
                                                 this.#cache.get( asString( pKey ) )) : (ENVIRONMENT[key] ?? null);

            secret = secret || ENVIRONMENT[key];

            // if it is found, we simply return it
            if ( isValidSecret( secret ) )
            {
                return this.resolveSecretValue( secret );
            }

            if ( this.isMissing( key ) )
            {
                return null;
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
                try
                {
                    secret = await asyncAttempt( async() => await THIZ.getSecret( k ) ) ||
                             await asyncAttempt( async() => await THIZ.getSecret( uK ) );

                    secret = THIZ.resolveSecretValue( secret );
                }
                catch( ex )
                {
                    attemptSilent( () => this.logger.error( ex.message, ex ) );
                    attemptSilent( () => toolBocksModule.reportError( ex, ex.message, "error", getClassName( this ), "getSecret", key, pVersion, pIgnoreCache ) );
                }

                // if it is found, try to cache it for next time
                if ( isValidSecret( secret ) )
                {
                    THIZ.cacheSecret( k, secret );
                    return THIZ.resolveSecretValue( secret );
                }
                else
                {
                    attempt( () => THIZ.#missing.push( k ) );
                }
            }.bind( me ?? this )( key )).catch( ((me ?? this).logger ?? console).error );

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

        /**
         * Removes an entry from the internal cache
         * @param {string} pKey
         */
        delete( pKey, pPrefix )
        {
            const prefix = asString( pPrefix, true ) || this.prefix;
            const key = createKey( prefix, pKey, this.separator );
            return isMap( this.#cache ) ? this.#cache.delete( key ) && this.#cache.delete( ucase( key ) ) : true;
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

        async refresh()
        {
            await this.dispose();
            return this.init();
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
                lines = lines.map( e => asString( e, true ) ).filter( e => !isBlank( e ) && !isComment( e ) );
                if ( $ln( lines ) > 0 )
                {
                    lines.forEach( line =>
                                   {
                                       if ( line && !isBlank( line ) && !isComment( line ) )
                                       {
                                           let kv = line.split( /=:/ ).map( e => asString( e, true ) );
                                           let k = asString( $ln( kv ) > 0 ? kv[0] : _mt, true );
                                           let v = asString( $ln( kv ) > 1 ? kv[1] || kv[0] : kv[0] || _mt, true );

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
        let keyName = asString( pKey, true );
        let key = asString( (pKey || keyName), true );
        if ( !(isBlank( keyName ) || isBlank( key )) )
        {
            let obj = { [keyName]: key };
            return SecretsManager.defineKeys( obj );
        }
        return Object.assign( {}, KEYS );
    };

    SecretsManager.getKeys = function()
    {
        return { ...(SecretsManager.defineKeys( {} ) ?? { ...DEFAULT_KEYS, ...KEYS }) };
    };

    SecretsManager.isValidKey = function( pKey )
    {
        let keys = SecretsManager.getKeys();
        return Object.keys( keys ).includes( pKey ) || Object.values( keys ).includes( pKey );
    };

    SecretsManager.isValidSecret = isValidSecret;
    SecretsManager.isPrefix = isPrefix;
    SecretsManager.isComment = isComment;

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
        #existingEnvironmentVariables = [];

        constructor( pOptions = DEFAULT_OPTIONS, ...pArgs )
        {
            super( pOptions, ...pArgs );

            let path = this.source || pOptions?.source || pOptions?.path || asArray( pArgs ?? [] ).find( isFilePath ) || "./.env";

            if ( isFilePath( path ) && exists( path ) )
            {
                attempt( () => dotenvx.config( { path: path, ...dotEnvxOptions } ) );
            }
            else
            {
                path = "./.env";
                if ( isFilePath( path ) && exists( path ) )
                {
                    attempt( () => dotenvx.config( { path: path, ...dotEnvxOptions } ) );
                }
            }

            attempt( () => this.#populateExistingEnvirnmentVariables() );
        }

        #populateExistingEnvirnmentVariables()
        {
            const proc = PROCESS ?? (_ud !== typeof process ? process : $scope());
            const ENV = ENVIRONMENT ?? proc?.env ?? $scope();
            const variables = attempt( () => objectKeys( ENV ) );
            if ( !isNull( variables ) && isArray( variables ) )
            {
                this.#existingEnvironmentVariables.push( ...(asArray( variables )) );
                this.#existingEnvironmentVariables = unique( this.#existingEnvironmentVariables );
            }
            return variables ?? [];
        }

        get existingEnvironmentVariables()
        {
            return [...(asArray( this.#existingEnvironmentVariables ?? [] ))];
        }

        isMissing( pKey )
        {
            return super.isMissing( pKey ) && !this.existingEnvironmentVariables.includes( pKey );
        }

        async getSecret( pKey, pVersion = SECRET_VERSION.CURRENT )
        {
            if ( isBlank( pKey ) )
            {
                return null;
            }

            const proc = PROCESS ?? (_ud !== typeof process ? process : $scope());
            const ENV = ENVIRONMENT ?? proc?.env ?? $scope();

            let key = this.resolveKey( pKey );

            if ( this.isMissing( key ) )
            {
                return null;
            }

            let secret = ENV[key] || ENV[ucase( key )] || ENV[asString( pKey, true )] || ENV[ucase( asString( pKey, true ) )];

            if ( isValidSecret( secret ) )
            {
                secret = this.resolveSecretValue( secret );

                this.cacheSecret( key, secret );

                return this.resolveSecretValue( secret );
            }

            this.recordMissingKeys( key );

            return this.resolveSecretValue( secret );
        }


        /*
         * IMPORTANT!!!  THE METHOD SIGNATURE FOR get MUST NOT PROVIDE A DEFAULT FOR pVersion
         * This is because of how JavaScript determines the 'length' of a function.
         * We do not want this 'get' to appear to have length === 1,
         * because readProperty will try to call it.
         * TRUST ME!
         */

        async get( pKey, pVersion, pIgnoreCache = false )
        {
            if ( isBlank( pKey ) )
            {
                return null;
            }

            let key = this.resolveKey( pKey );

            if ( this.restrictKeys && !(SecretsManager.isValidKey( pKey ) || SecretsManager.isValidKey( key )) )
            {
                return null;
            }

            const proc = PROCESS ?? (_ud !== typeof process ? process : $scope());
            const ENV = ENVIRONMENT ?? proc?.env ?? $scope();

            let ignoreCache = toBool( pIgnoreCache );

            let secret = (ignoreCache ? null : this.getCachedSecret( key )) || ENV[key] || ENV[pKey];

            if ( !isValidSecret( secret ) && this.isMissing( key ) )
            {
                return null;
            }

            secret = secret || await this.getSecret( key ) || await super.get( pKey, pVersion, ignoreCache );

            if ( isValidSecret( secret ) )
            {
                secret = this.resolveSecretValue( secret );
                this.cacheSecret( key, secret );
            }

            return this.resolveSecretValue( secret );
        }

        getCachedSecret( pKey )
        {
            if ( isBlank( pKey ) )
            {
                return null;
            }

            let key = this.resolveKey( pKey );

            if ( this.restrictKeys && !(SecretsManager.isValidKey( pKey ) || SecretsManager.isValidKey( key )) )
            {
                return null;
            }

            const proc = PROCESS ?? (_ud !== typeof process ? process : $scope());
            const ENV = ENVIRONMENT ?? proc?.env ?? $scope();

            let secret = super.getCachedSecret( key ) || ENV[key] || ENV[ucase( key )];
            secret = secret || ENV[pKey] || ENV[ucase( pKey )];

            if ( isValidSecret( secret ) )
            {
                secret = this.resolveSecretValue( secret );
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
                attempt( () => dotenvx.config( { path: path, ...dotEnvxOptions } ) );
                attempt( () => this.#populateExistingEnvirnmentVariables() );
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
        async getApiVersion( pPrefix, pDefault = _mt )
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

    /**
     * Adds a class to the SECRETS_MANAGER_CLASSES object.
     * Modules defining subclasses must call this function
     * to make the class available to the SecretsManagerFactory.
     * @param pStrategy - one of the values defined in SECRETS_STRATEGY that will be used to find the specified class
     * @param pClass - a subclass of SecretsManager to be used when the strategy matches the specified value
     */
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

        #separator = DEFAULT_OPTIONS.separator;

        #options = {};

        constructor( pOptions = {}, ...pArgs )
        {
            const options = asObject( pOptions ?? {} );

            let args = asArray( options?.args ?? asArray( pArgs ?? [] ) ?? [] );
            args = replaceElements( args, asArray( pArgs ?? args ?? [] ) );

            this.#strategy = calculateStrategy( options );

            this.#prefix = (asString( (options?.prefix || options?.secretsPrefix) || ($ln( args ) > 0 ? args.find( isPrefix ) : _mt), true ));

            this.#separator = asString( asString( options.separator, true ) || this.#separator || DEFAULT_OPTIONS.separator, true );

            this.#keyPath = options?.keyPath || options?.mount || options.path || (SECRETS_STRATEGY.LOCAL === this.#strategy ? "./.env" : _mt);

            this.#options = lock( {
                                      ...(asObject( options ?? {} )),
                                      ...({
                                          strategy: this.#strategy,
                                          prefix: this.#prefix || options.prefix || options.secretsPrefix || _mt,
                                          separator: this.#separator || options.separator || DEFAULT_OPTIONS.separator,
                                          keyPath: this.#keyPath || options.keyPath || options.mount || options.path || _mt,
                                          args: [...asArray( args ?? [] )]
                                      })
                                  } );
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
            let s = asString( (this.#prefix || this.options.prefix || this.options.secretsPrefix), true );
            return asString( s, true );
        }

        get keyPath()
        {
            return this.#keyPath || this.options.keyPath || (SECRETS_STRATEGY.LOCAL === this.strategy ? "./.env" : _mt) || _mt;
        }

        create( pOptions = {}, ...pArgs )
        {
            const options = { ...(asObject( this.options || {} )), ...(asObject( pOptions ?? {} )) };

            options.strategy = asString( options.strategy || this.strategy, true );
            options.strategy = STRATEGY_OPTIONS.includes( options.strategy ) ? options.strategy : this.strategy;
            options.strategy = STRATEGY_OPTIONS.includes( options.strategy ) ? options.strategy : null;

            const strategy = calculateStrategy( options );

            let clazz = SECRETS_MANAGER_CLASSES[strategy] ?? SecretsManager;

            let args = asArray( options?.args ?? asArray( pArgs ?? [] ) ?? [] );
            args = replaceElements( args, asArray( pArgs ?? args ?? [] ) );

            let prefix = (options.prefix || options.secretsPrefix) || this.prefix;

            options.prefix = prefix || this.prefix;
            options.secretsPrefix = options.prefix || prefix || this.prefix;

            if ( isClass( clazz ) )
            {
                return new clazz( options, ...args );
            }

            if ( isNonNullObject( clazz ) )
            {
                clazz = getClass( clazz ) ?? SecretsManager;
                return new clazz( options, ...args );
            }

            return new SecretsManager( options, ...args );
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
            DEFAULT_OPTIONS,
            DEFAULT_KEYS,
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
