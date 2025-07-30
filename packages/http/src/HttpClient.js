// noinspection GrazieInspection

/**
 * @overview
 *
 * This file defines classes for handling HTTP Requests,
 * especially those to API endpoints that impose Rate Limits.
 *
 * Its dependencies are limited to those exposed by other @toolbocks modules
 * or that are built in to node.js.
 *
 * The design goals are as follows:
 *
 * Clients of this module do not necessarily need to be aware of the rate-limiting details.
 * Clients can pass one or more instances of the RateLimits class if desired, but this should be optional,
 * and instead rely on the 'x-rate-limit' (and related) response headers
 * to interactively configure and vary behavior for each HTTP request.
 *
 * The base class, HttpClient defines the interface for the clients/consumers.
 *
 * The base class defaults to using a default delegate.
 * Subclasses can provide their own implementations of methods or fallback on the super class/default delegate.
 *
 * The default implementations will use fetch (or node:fetch), but subclasses using Axios are also expected.
 * It should also be plausible to use other HTTP client libraries, including XmlHttpRequest.
 *
 *
 *
 *
 *
 */

const fs = require( "fs" );

const { finished } = require( "stream/promises" );

const path = require( "node:path" );

/**
 * Import the http package for its Agent class.
 */
const http = require( "http" );

/**
 * Import the https package for its Agent class.
 */
const https = require( "https" );

/**
 * Imports the @toolbocks/core modules for the utility functions required
 */
const core = require( "@toolbocks/core" );

/**
 * Imports the @toolbocks/date module for the utility functions required to manipulate Dates
 */
const datesModule = require( "@toolbocks/dates" );

/**
 * Imports the file utilities used to resolve paths and manipulate files and filenames
 */
const fileUtils = require( "@toolbocks/files" );

/**
 * Imports the @toolbocks/json module for the utility functions necessary to more safely parse or render JSON.
 */
const jsonUtils = require( "@toolbocks/json" );

/**
 * Imports the EntityUtils module for the base classes available.
 */
const entityUtils = require( "../../common/src/EntityUtils.cjs" );

/**
 * Imports the HttpConstants that define common aspects of the HTTP protocol
 */
const httpConstants = require( "./HttpConstants.cjs" );

/**
 * Imports the HttpHeaders module for the Headers facade and associated utility functions required
 */
const httpHeaders = require( "./HttpHeaders.cjs" );

/**
 * Imports the HttpRequest module for the request facade and associated utility functions required
 */
const httpRequestModule = require( "./HttpRequest.cjs" );

/**
 * Imports the HttpResponse module for the response facade and associated utility functions required
 */
const httpResponseModule = require( "./HttpResponse.cjs" );

/**
 * Imports the HttpResponseData module, providing a smart wrapper for responses returned from HTTP Requests
 */
const responseDataModule = require( "./ResponseData.js" );

/**
 * Imports the core constants
 */
const { constants } = core;

// Provides shorthand for the "undefined" Type
const { _ud = "undefined" } = constants;

/**
 * Returns the global object / host for the current execution context, such as window or global.
 */
const $scope = constants?.$scope || function()
{
    return (_ud === typeof self ? ((_ud === typeof global) ? ((_ud === typeof globalThis ? {} : globalThis)) : (global || {})) : (self || {}));
};

// noinspection FunctionTooLongJS
/**
 * This is the IIFE that defines the classes, variables, and functions that are exported as a module.
 * Note that the exported module extends ToolBocksModule (from @toolbocks/core moduleUtils)
 */
// noinspection FunctionTooLongJS
(function exposeModule()
{
    const INTERNAL_NAME = "__BOCK_HTTP_CLIENT__";

    // if this module has already been defined and exported, return that instance
    if ( $scope() && (null != $scope()[INTERNAL_NAME]) )
    {
        return $scope()[INTERNAL_NAME];
    }

    const konsole = console;

    // import the specific modules from @toolbocks/core that are necessary for this module
    const { moduleUtils, constants, typeUtils, stringUtils, arrayUtils } = core;

    // import the classes, variables, and function defined in moduleUtils that are used in this module
    const
        {
            ModuleEvent,
            ToolBocksModule,
            ObjectEntry,
            IterationCap,
            resolveOptions,
            populateOptions,
            attempt,
            attemptSilent,
            asyncAttempt,
            asyncAttemptSilent,
            resolveError,
            getLastError,
            lock,
            isWritable,
            localCopy,
            immutableCopy,
            objectKeys,
            objectValues,
            objectEntries,
            mergeObjects,
            sleep,
            no_op,
            $ln,

        } = moduleUtils;

    // if the current environment does not define CustomEvent, define it as our ModuleEvent class
    if ( _ud === typeof CustomEvent )
    {
        CustomEvent = ModuleEvent;
    }

    // import the useful constants from the core constants
    const
        {
            _mt_str = "",
            _mt = _mt_str,
            _spc = " ",
            _semicolon = ";",
            _underscore = "_",
            _usc = _underscore,
            _str,
            _num,
            _big,
            _bool,
            _fun,
            _obj,
            MILLIS_PER
        } = constants;

    // import the useful functions from the core module, TypeUtils
    const
        {
            isNull,
            isObject,
            isNonNullObject,
            isNonNullValue,
            isNullOrNaN,
            isPopulatedObject,
            isFunction,
            isError,
            isArray = moduleUtils?.TYPES_CHECKS?.isArray,
            isString,
            isNumber,
            isNumeric,
            isDate,
            isRegExp,
            isPromise,
            isThenable,
            isMap,
            instanceOfAny,
            firstMatchingType,
            toObjectLiteral,
            asMap,
            clamp
        } = typeUtils;

    // import the useful functions from the core module, StringUtils
    const { asString, asInt, toBool, isBlank, isJson, cleanUrl, lcase, ucase, toUnixPath } = stringUtils;

    // import the useful functions from the core module, ArrayUtils
    const { asArray, concatMaps, unique, TypedArray, BoundedQueue } = arrayUtils;

    // import the DateUtils module from the datesModule
    const { DateUtils } = datesModule;

    // import the functions from DateUtils we use in this module
    const { asDate } = DateUtils;

    // import the functions from the JSON Utilities that we use in this module
    const { parseJson, asJson } = jsonUtils;

    // import the base classes required for the classes defined in this module, as well as related functions
    const
        {
            BockEntity,
            BockIdentified,
            BockNamed,
            BockDescribed,
            populateProperties,
            overwriteProperties,
            asObject,
            same
        } = entityUtils;

    // import the functions, variables, and classes defined in the HttpConstants module that are used in this module
    const {
        CONTENT_TYPES,
        VERBS,
        PRIORITY,
        resolveHttpMethod,
        calculatePriority,
        HttpContentType,
        HttpVerb,
        HttpStatus,
        HttpHeader,
        STATUS_CODES,
        STATUS_TEXT,
        STATUS_TEXT_ARRAY,
        STATUS_ELIGIBLE_FOR_RETRY,
        DEFAULT_RETRY_DELAY,
        isVerb,
        isHeader
    } = httpConstants;

    const { ResponseData } = responseDataModule;

    // define module-level constants
    const MIN_TIMEOUT_MILLISECONDS = 10_000; // 10 seconds
    const MAX_TIMEOUT_MILLISECONDS = 60_000; // 60 seconds, or 1 minute
    const DEFAULT_TIMEOUT_MILLISECONDS = 30_000; // 30 seconds

    const MIN_CONTENT_LENGTH = 64_000; // 64 KBs
    const DEFAULT_CONTENT_LENGTH = 2_000_000; // 2 MBs
    const MAX_CONTENT_LENGTH = 200_000_000; // 200 MBs

    const MIN_REDIRECTS = 3;
    const MAX_REDIRECTS = 10;
    const DEFAULT_REDIRECTS = 5;

    const { HttpHeaders, HttpRequestHeaders, HttpResponseHeaders } = httpHeaders;

    // import the HttpRequest (facade) class we use to provide a uniform interface for HTTP Requests
    const { HttpRequest, cloneRequest } = httpRequestModule;

    // import the HttpResponse (facade) class we use to provide a uniform interface for HTTP Responses
    const { HttpResponse, cloneResponse } = httpResponseModule;

    const modName = "HttpClientUtils";

    let toolBocksModule = new ToolBocksModule( modName, INTERNAL_NAME );

    /**
     * This class is used to define the configuration of an Http (or Https) Agent.
     * Notably, this class exposes properties for whether to use keepAlive, and if so, the duration (in milliseconds).
     * While these options are defined by creating instances of this class,
     * they must be passed as POJOs (plain old JavaScript objects), for which purpose the toObjectLiteral method is provided.
     * @class
     */
    class HttpAgentConfig
    {
        #keepAlive = true;
        #keepAliveMsecs = 10_000;
        #maxFreeSockets = 256;
        #maxTotalSockets = Infinity;
        #rejectUnauthorized = false;

        /**
         * Constructs an instance of the HttpAgentConfig class,
         * used to define the options passed to the constructor or either http.Agent or https.Agent.
         *
         * @param {boolean} [pKeepAlive=true]               A boolean indicating whether connections
         *                                                  should be kept alive for some period of time to be reused
         *
         * @param {number} [pKeepAliveMilliseconds=10000]   A number defining the length of time,
         *                                                  in milliseconds, that connections should be kept alive,
         *                                                  if keepAlive is true
         *
         * @param {number} [pMaxFreeSockets=256]
         * @param {number} [pMaxTotalSockets=Infinity]
         * @param {boolean} [pRejectUnauthorized=false]
         */
        constructor( pKeepAlive = true,
                     pKeepAliveMilliseconds = 10_000,
                     pMaxFreeSockets = 256,
                     pMaxTotalSockets = Infinity,
                     pRejectUnauthorized = false )
        {
            this.#keepAlive = !!pKeepAlive;
            this.#keepAliveMsecs = isNullOrNaN( pKeepAliveMilliseconds ) ? 1_000 : Math.max( 1_000, Math.min( asInt( pKeepAliveMilliseconds ), 300_000 ) );
            this.#maxFreeSockets = isNullOrNaN( pMaxFreeSockets ) ? Infinity : (Math.max( Math.min( asInt( pMaxFreeSockets, 256 ) ) ));
            this.#maxTotalSockets = isNullOrNaN( pMaxTotalSockets ) ? Infinity : (asInt( pMaxTotalSockets ) > 0 && asInt( pMaxTotalSockets ) > asInt( pMaxFreeSockets ) ? asInt( pMaxTotalSockets ) : Infinity);
            this.#rejectUnauthorized = !!pRejectUnauthorized;
        }

        get keepAlive()
        {
            return !!this.#keepAlive;
        }

        get keepAliveMsecs()
        {
            if ( isNullOrNaN( this.#keepAliveMsecs ) )
            {
                return 1_000;
            }

            return Math.max( 1_000, Math.min( asInt( this.#keepAliveMsecs ), 300_000 ) );
        }

        get maxFreeSockets()
        {
            if ( isNullOrNaN( this.#maxFreeSockets ) )
            {
                return Infinity;
            }

            return Math.max( Math.min( asInt( this.#maxFreeSockets, 256 ) ) );
        }

        get maxTotalSockets()
        {
            if ( isNullOrNaN( this.#maxTotalSockets ) )
            {
                return Infinity;
            }
            const maxTotal = asInt( this.#maxTotalSockets );
            return asInt( maxTotal ) > 0 && asInt( maxTotal ) > asInt( this.maxFreeSockets ) ? asInt( maxTotal ) : Infinity;
        }

        get rejectUnauthorized()
        {
            return !!this.#rejectUnauthorized;
        }

        /**
         * Returns an object literal whose properties are those of this instance.
         * @returns {Object} an object literal whose properties are those of this instance.
         */
        toObjectLiteral()
        {
            return toObjectLiteral( this );
        }

        /**
         * Returns a JSON representation of this instance
         * @returns {String} a JSON representation of this instance
         */
        toString()
        {
            return asJson( this );
        }
    }

    // creates an instance of the HttpAgentConfig class
    // to define configuration properties
    // for the http and http agents using the class defaults
    const httpAgentConfig = new HttpAgentConfig();

    // create a global instance of http.Agent (and then convert it to an object literal)
    const httpAgent = new http.Agent( httpAgentConfig.toObjectLiteral() );

    // create a global instance of https.Agent (and then convert it to an object literal)
    const httpsAgent = new https.Agent( httpAgentConfig.toObjectLiteral() );

    /**
     * This function is used to ensure that no configuration
     * has inadvertently replaced the http and/or https Agents with object literals.
     *
     * @param {Object} pConfig  the configuration to examine (and repair, if necessary)
     *
     * @returns {Object}        the same configuration object specified,
     *                          but with the http and http agent properties corrected, if necessary,
     *                          to hold actual instances of http.Agent or https.Agent.
     */
    function fixAgents( pConfig )
    {
        if ( isNull( pConfig ) || !isObject( pConfig ) )
        {
            return { httpAgent, httpsAgent };
        }

        if ( (isNull( pConfig.httpAgent ) || !(pConfig.httpAgent instanceof http.Agent)) )
        {
            // reset the property to be an instance of http.Agent
            // we expect the variable, httpAgent, to hold an instance of http.Agent,
            // but if it is null or undefined, a new instance is created
            pConfig.httpAgent = httpAgent || new http.Agent( httpAgentConfig.toObjectLiteral() );
        }

        if ( (isNull( pConfig.httpsAgent ) || !(pConfig.httpsAgent instanceof https.Agent)) )
        {
            // reset the property to be an instance of https.Agent
            // we expect the variable, httpsAgent, to hold an instance of https.Agent,
            // but if it is null or undefined, a new instance is created
            pConfig.httpsAgent = httpsAgent || new https.Agent( httpAgentConfig.toObjectLiteral() );
        }

        return pConfig;
    }

    HttpAgentConfig.getDefault = function()
    {
        return httpAgentConfig;
    };

    // noinspection JSUnresolvedReference
    /**
     * This class can be used to define the configuration expected
     * for an instance of HttpClient (or one of its subclasses).
     * <br><br>
     * Not all properties are relevant to all instances of HttpClient.
     * The specific properties that are used are dependent upon the underlying library (Fetch API, Axios, or XmlHttpRequest, for example).
     * <br><br>
     * This class is intended to provide values
     * expected by either the Axios library, the Fetch API, or XmlHttpRequest.
     * <br><br>
     * As with HttpAgentConfig, this class implements a toObjectLiteral method
     * to be used when passing the configuration to a class constructor or request method.
     *
     * @class
     */
    class HttpClientConfig
    {
        #allowAbsoluteUrls = true;
        #timeout = DEFAULT_TIMEOUT_MILLISECONDS;
        #maxContentLength = DEFAULT_CONTENT_LENGTH;
        #maxBodyLength = DEFAULT_CONTENT_LENGTH;
        #maxRedirects = DEFAULT_REDIRECTS;
        #decompress = true;

        #method;
        #contentType;
        #headers = {};
        #accept;

        #baseUrl;

        #data = null;
        #url = _mt;

        #options = {};

        #httpAgent = httpAgent;
        #httpsAgent = httpsAgent;

        /**
         * Constructs an instance of HttpClientConfig,
         * used to define properties used by the underlying framework
         * when making HTTP or HTTPS requests.
         *
         * @param {http.Agent} pHttpAgent
         * @param {https.Agent} pHttpsAgent
         * @param {boolean} [pAllowAbsoluteUrls=true]
         * @param {number} [pTimeout=30_000]
         * @param {number} [pMaxContentLength=200_000_000]
         * @param {number} [pMaxBodyLength=200_000_000]
         * @param {number} [pMaxRedirects=5]
         * @param {boolean} [pDecompress=true]
         * @param pMethod
         * @param pHeaders
         * @param pContentType
         * @param pAccept
         * @param pOptions
         */
        // noinspection OverlyComplexFunctionJS
        constructor( pHttpAgent = httpAgent,
                     pHttpsAgent = httpAgent,
                     pAllowAbsoluteUrls = true,
                     pTimeout = DEFAULT_TIMEOUT_MILLISECONDS,
                     pMaxContentLength = DEFAULT_CONTENT_LENGTH,
                     pMaxBodyLength = DEFAULT_CONTENT_LENGTH,
                     pMaxRedirects = DEFAULT_REDIRECTS,
                     pDecompress = true,
                     pMethod,
                     pHeaders = {},
                     pContentType,
                     pAccept,
                     pOptions = {} )
        {
            const me = this;

            this.#httpAgent = isNonNullObject( pHttpAgent ) && pHttpAgent instanceof http.Agent ? pHttpAgent : httpAgent || new http.Agent( new HttpAgentConfig().toObjectLiteral() );
            this.#httpsAgent = isNonNullObject( pHttpsAgent ) && pHttpsAgent instanceof https.Agent ? pHttpsAgent : httpsAgent || new https.Agent( new HttpAgentConfig().toObjectLiteral() );

            this.#allowAbsoluteUrls = !!pAllowAbsoluteUrls;
            this.#timeout = clamp( asInt( pTimeout ), MIN_TIMEOUT_MILLISECONDS, MAX_TIMEOUT_MILLISECONDS );
            this.#maxContentLength = clamp( asInt( pMaxContentLength ), MIN_CONTENT_LENGTH, MAX_CONTENT_LENGTH );
            this.#maxBodyLength = clamp( asInt( pMaxBodyLength ), MIN_CONTENT_LENGTH, MAX_CONTENT_LENGTH );
            this.#maxRedirects = clamp( asInt( pMaxRedirects ), MIN_REDIRECTS, MAX_REDIRECTS );

            this.#decompress = !!pDecompress;

            this.#method = asString( pMethod, true );
            this.#contentType = asString( pContentType, true );
            this.#headers = isNonNullObject( pHeaders ) ? attempt( () => me.parseHeaders( toObjectLiteral( pHeaders ) ) ) : isString( pHeaders ) ? attempt( () => me.parseHeaders( pHeaders ) ) : {};
            this.#accept = asString( pAccept, true );

            this.#data = null;

            this.#options = resolveOptions( pOptions, {} );

            attempt( () => me.processOptions( me.#options ) );
        }

        get allowAbsoluteUrls()
        {
            return !!this.#allowAbsoluteUrls;
        }

        get timeout()
        {
            return clamp( this.#timeout, MIN_TIMEOUT_MILLISECONDS, MAX_TIMEOUT_MILLISECONDS );
        }

        get maxContentLength()
        {
            return clamp( asInt( this.#maxContentLength ), MIN_CONTENT_LENGTH, MAX_CONTENT_LENGTH );
        }

        get maxBodyLength()
        {
            return clamp( asInt( this.#maxBodyLength ), MIN_CONTENT_LENGTH, MAX_CONTENT_LENGTH );
        }

        get maxRedirects()
        {
            return clamp( asInt( this.#maxRedirects ), MIN_REDIRECTS, MAX_REDIRECTS );
        }

        get decompress()
        {
            return !!this.#decompress;
        }

        get httpAgent()
        {
            return isNonNullObject( this.#httpAgent ) && (this.#httpAgent instanceof http.Agent) ? this.#httpAgent : httpAgent || new http.Agent( new HttpAgentConfig().toObjectLiteral() );
        }

        get httpsAgent()
        {
            return isNonNullObject( this.#httpsAgent ) && (this.#httpsAgent instanceof http.Agent) ? this.#httpsAgent : httpsAgent || new https.Agent( new HttpAgentConfig().toObjectLiteral() );
        }

        validateStatus( pStatus )
        {
            let status = asInt( pStatus );
            return status >= 200 && status < 500;
        }

        static ValidateStatus( pStatus )
        {
            let status = asInt( pStatus );
            return status >= 200 && status < 500;
        }

        get baseUrl()
        {
            return cleanUrl( asString( this.#baseUrl, true ) );
        }

        set baseUrl( pUrl )
        {
            this.#baseUrl = cleanUrl( asString( pUrl, true ) );
        }

        get method()
        {
            let verb = asString( this.#method, true );
            return isVerb( verb ) ? verb : _mt;
        }

        set method( pVerb )
        {
            if ( isVerb( pVerb ) )
            {
                this.#method = asString( pVerb, true );
            }
        }

        get contentType()
        {
            return asString( this.#contentType, true );
        }

        set contentType( pContentType )
        {
            this.#contentType = asString( pContentType, true );
        }

        get headers()
        {
            return isNonNullObject( this.#headers ) ? Object.assign( {}, this.#headers ) : {};
        }

        set headers( pHeaders )
        {
            const me = this;
            this.#headers = (isNonNullObject( pHeaders ) ?
                             attempt( () => me.#processHeaders( toObjectLiteral( pHeaders ) ) ) :
                             (isString( pHeaders ) ? attempt( () => me.parseHeaders( pHeaders ) ) : {}));
        }

        get accept()
        {
            return asString( this.#accept, true );
        }

        set accept( pAccept )
        {
            this.#accept = asString( pAccept, true );
        }

        get options()
        {
            return isNonNullObject( this.#options ) ? Object.assign( {}, this.#options ) : {};
        }

        set options( pOptions )
        {
            const me = this;
            this.#options = populateOptions( pOptions, {} );
            attempt( () => me.processOptions( me.#options ) );
        }

        get data()
        {
            return this.#data;
        }

        get url()
        {
            return asString( this.#url, true );
        }

        parseHeaders( pHeaders )
        {
            const me = this;

            this.#headers = isNonNullObject( this.#headers ) ? toObjectLiteral( this.#headers ) : {};

            if ( isString( pHeaders ) && !isBlank( pHeaders ) )
            {
                if ( isJson( pHeaders ) )
                {
                    const obj = attempt( () => parseJson( pHeaders ) );
                    if ( isNonNullObject( obj ) )
                    {
                        attempt( () => me.parseHeaders( obj ) );
                    }
                }
                else
                {
                    const arr = asArray( asString( pHeaders, true ).split( /(\r?\n)/ ) );
                    for( let elem of arr )
                    {
                        const parts = elem.split( /:/ );
                        if ( $ln( parts ) > 1 )
                        {
                            const key = parts[0];
                            const value = parts[1];

                            if ( !isBlank( key ) && isHeader( key ) && !isBlank( value ) )
                            {
                                this.#headers[key] = value || this.#headers[key];
                            }
                        }
                    }
                }
            }
        }

        processOptions( pOptions )
        {
            const me = this;

            if ( isNonNullObject( pOptions ) )
            {
                const entries = objectEntries( pOptions );

                if ( $ln( entries ) )
                {
                    entries.forEach( entry =>
                                     {
                                         const key = ObjectEntry.getKey( entry );
                                         const value = ObjectEntry.getValue( entry );

                                         if ( isString( key ) && !isBlank( key ) && isWritable( me, key ) )
                                         {
                                             if ( isNull( value ) )
                                             {
                                                 attemptSilent( () => delete me[key] );
                                             }
                                             else if ( "headers" === lcase( asString( key, true ) ) )
                                             {
                                                 attempt( () => me.#processHeaders( value ) );
                                             }
                                             else
                                             {
                                                 attemptSilent( () => me[key] = value || me[key] );
                                             }
                                         }
                                     } );
                }
            }
        }

        merge( pConfig, pUrl, pParams )
        {
            const me = this;

            let config = Object.assign( {}, toObjectLiteral( (me || this) ) );
            config.headers = Object.assign( {}, toObjectLiteral( ((me || this).headers) || {} ) ) || {};

            if ( !isNull( this.data ) )
            {
                attempt( () => me.copyDataTo( config ) );
            }

            if ( isNonNullObject( pConfig ) )
            {
                const entries = (objectEntries( pConfig ) || []);

                entries.forEach( entry =>
                                 {
                                     const key = ObjectEntry.getKey( entry );
                                     const value = ObjectEntry.getValue( entry );

                                     if ( isString( key ) && !isBlank( key ) && isWritable( config, key ) )
                                     {
                                         if ( isNull( value ) )
                                         {
                                             attemptSilent( () => delete config[key] );
                                         }
                                         else if ( "headers" === lcase( asString( key, true ) ) )
                                         {
                                             this.#processHeaders( value, config, key );
                                         }
                                         else if ( isWritable( config, key ) )
                                         {
                                             attemptSilent( () => config[key] = value || config[key] );
                                         }
                                     }
                                 } );
            }

            attempt( () => config.url = cleanUrl( asString( pUrl, true ) || config.url ) );

            if ( pParams )
            {
                config = Object.assign( { "params": pParams }, config );
            }

            config.validateStatus = HttpClientConfig.ValidateStatus;

            return config;
        }

        #processHeaders( pHeaders, pConfig, pKey )
        {
            if ( isNonNullObject( pHeaders ) )
            {
                const headerEntries = objectEntries( pHeaders );

                if ( $ln( headerEntries ) )
                {
                    headerEntries.forEach( headerEntry =>
                                           {
                                               const headerKey = ObjectEntry.getKey( headerEntry );
                                               const headerValue = ObjectEntry.getValue( headerEntry );

                                               if ( isString( headerKey ) && !isBlank( headerKey ) && isHeader( asString( headerKey, true ) ) )
                                               {
                                                   if ( isNull( headerValue ) )
                                                   {
                                                       attemptSilent( () => delete pConfig.headers[headerKey] );
                                                       attemptSilent( () => delete pConfig.headers[lcase( headerKey )] );
                                                   }
                                                   else
                                                   {
                                                       attempt( () => pConfig.headers[pKey] = pHeaders || pConfig.headers[pKey] );
                                                   }
                                               }
                                           } );
                }
            }
        }

        copyDataTo( pConfig )
        {
            if ( isNonNullObject( pConfig ) && this.data )
            {
                switch ( typeof this.data )
                {
                    case _ud:
                        attempt( () => delete pConfig["data"] );
                        break;

                    case _str:
                        pConfig.data = asString( _mt + this.data );
                        break;

                    case _num:
                    case _big:
                    case _bool:
                        pConfig.data = asString( this.data );
                        break;

                    case _obj:
                        if ( isArray( this.data ) )
                        {
                            pConfig.data = [...(asArray( this.data ))];
                        }
                        else
                        {
                            pConfig.data = Object.assign( {}, this.data );
                        }
                        break;

                    default:
                        attempt( () => delete pConfig["data"] );
                        break;
                }
            }
        }


        /**
         * Returns an object that has translated the property names of this configuration
         * into those expected by the target configuration or consumer of the configuration
         *
         * Example:
         *
         * If the specified map, or object, looks like:
         *
         * {
         *     "api_key":"apiKey",
         *     "x-org-id":"orgId",
         *     "x-user-id":"userId"
         * }
         *
         * and this instance has the following values:
         *
         * {
         *     apiKey: "yaddah-yaddah",
         *     orgId:"4321",
         *     userId:"9999"
         * }
         *
         * The result is an object that looks like this:
         *
         * {
         *     "api_key":"yaddah-yaddah",
         *     "x-org-id":"4321",
         *     "x-user-id":"9999"
         * }
         *
         * @param {Map|Object} pMap A Map or Object describing how to map the values of this instance
         *                          to a new Object with different property names
         *
         * @param pHeadersMap       A Map or Object describing how to map the values of the headers of this instance
         *                          to a new Object with different property names
         *
         * @returns {Object} An object with the desired property names and values based on this instance
         */
        mapToTargetConfig( pMap, pHeadersMap = pMap )
        {
            const me = this;

            const obj = {};

            const entries = objectEntries( pMap );

            entries.forEach( entry =>
                             {
                                 let key = asString( ObjectEntry.getKey( entry ) );
                                 let value = asString( ObjectEntry.getValue( entry ) );

                                 obj[key] = me[value];
                             } );

            const mappedValues = Object.values( pMap );

            const myEntries = objectEntries( toObjectLiteral( me ) );

            myEntries.forEach( entry =>
                               {
                                   let key = asString( ObjectEntry.getKey( entry ) );
                                   if ( !mappedValues.includes( key ) )
                                   {
                                       let value = ObjectEntry.getValue( entry );
                                       if ( !(isNull( value ) || (isString( value ) && isBlank( value )) || (isNumeric( value ) && asInt( value ) === 0)) )
                                       {
                                           obj[key] = value;
                                       }
                                   }
                                   else if( "headers" === key )
                                   {

                                   }
                               } );

            return fixAgents( obj );
        }

        toLiteral()
        {
            return fixAgents( toObjectLiteral( this ) );
        }

        /**
         * Returns an object literal whose properties are those of this instance.
         * @returns {Object} an object literal whose properties are those of this instance.
         */
        toObjectLiteral()
        {
            return this.toLiteral();
        }

        /**
         * Returns a JSON representation of this instance
         * @returns {String} a JSON representation of this instance
         */
        toString()
        {
            return asJson( this );
        }
    }

    HttpClientConfig.fromJson = function( pJson )
    {
        let obj = {};

        if ( isPopulatedObject( pJson ) )
        {
            obj = Object.assign( obj, pJson );
        }
        else if ( isString( pJson ) && isJson( pJson ) )
        {
            obj = attempt( () => parseJson( pJson ) ) || {};
        }

        // pMethod, pHeaders = {}, pContentType, pAccept, pOptions = {}
        const config = new HttpClientConfig( (obj.httpAgent || httpAgent),
                                             (obj.httpsAgent || httpsAgent),
                                             !!obj.allowAbsoluteUrls,
                                             asInt( obj.timeout || DEFAULT_TIMEOUT_MILLISECONDS ),
                                             asInt( obj.maxContentLength || DEFAULT_CONTENT_LENGTH ),
                                             asInt( obj.maxBodyLength || DEFAULT_CONTENT_LENGTH ),
                                             asInt( obj.maxRedirects || MAX_REDIRECTS ),
                                             (obj.method || _mt),
                                             Object.assign( {}, obj.headers || {} ),
                                             asString( obj.contentType || obj.ContentType || obj.content_type || _mt, true ),
                                             asString( obj.accept || obj.Accept || _mt, true ),
                                             Object.assign( {}, (obj.options || {}) ) );


        const entries = objectEntries( obj );

        if ( $ln( entries ) )
        {
            entries.forEach( entry =>
                             {
                                 const key = ObjectEntry.getKey( entry );
                                 const value = ObjectEntry.getValue( entry );

                                 if ( isString( key ) && !isBlank( key ) && isWritable( config, key ) )
                                 {
                                     attemptSilent( () => config[key] = value || config[key] );
                                 }
                             } );
        }

        return config;
    };

    /**
     * Defines the default HttpClient configuration object
     * @type {HttpClientConfig}
     */
    const DEFAULT_CONFIG = new HttpClientConfig( httpAgent, httpsAgent );

    /**
     * Returns an object literal holding the properties defined in the default HttpClientConfig
     * @returns {Object} an object literal holding the properties defined in the default HttpClientConfig
     */
    HttpClientConfig.getDefaultConfig = function()
    {
        let cfg = toObjectLiteral( DEFAULT_CONFIG );
        return fixAgents( cfg );
    };

    const DEFAULT_CONFIG_LITERAL = HttpClientConfig.getDefaultConfig();

    /**
     * This class is used to represent the values normally required to make an OAUTH/2 request to authenticate.
     *
     * @param {String} pClientId The Client ID to use in conjunction with an OAUTH/OAUTH2 to authenticate and/or get an access token
     * @param {String} pClientSecret The Client Secret to use in conjunction with an OAUTH/OAUTH2 to authenticate and/or get an access token
     *
     * @class
     */
    class OauthSecrets
    {
        #clientId;
        #clientSecret;

        constructor( pClientId, pClientSecret )
        {
            this.#clientId = asString( pClientId, true );
            this.#clientSecret = asString( pClientSecret, true );
        }

        get clientId()
        {
            return this.#clientId;
        }

        get clientSecret()
        {
            return this.#clientSecret;
        }

        toObjectLiteral()
        {
            return toObjectLiteral( this );
        }

        toString()
        {
            return asJson( this );
        }
    }

    /**
     * This class is used to represent values that some APIs require
     * to distinguish between tenants and to grant user-specific permissions.
     */
    class TenantSecrets
    {
        #orgId;
        #userId;

        constructor( pOrgId, pUserId )
        {
            this.#orgId = asString( pOrgId, true );
            this.#userId = asString( pUserId, true );
        }

        get orgId()
        {
            return this.#orgId;
        }

        get userId()
        {
            return this.#userId;
        }

        toObjectLiteral()
        {
            return toObjectLiteral( this );
        }

        toString()
        {
            return asJson( this );
        }
    }

    /**
     * This class represents the properties required for the simplest APIs.
     *
     * @param {String} pApiKey The API Key to use to authenticate to the external API and/or authorize the requests
     * @param {String|Object} pAccessToken The Access Token to use to authenticate to the external API and/or authorize the requests
     */
    class ApiProperties
    {
        #apiKey;
        #accessToken;

        constructor( pApiKey, pAccessToken = pApiKey )
        {
            this.#apiKey = asString( pApiKey, true );
            this.#accessToken = pAccessToken || this.#apiKey;
        }

        get apiKey()
        {
            return asString( this.#apiKey, true );
        }

        get accessToken()
        {
            return isNonNullObject( this.#accessToken ) ? this.#accessToken : (isString( this.#accessToken ) && !isBlank( this.#accessToken ) ? this.#accessToken : this.apiKey);
        }

        toObjectLiteral()
        {
            return toObjectLiteral( this );
        }

        toString()
        {
            return asJson( this );
        }
    }

    /**
     * This class represents the superset of properties required for known APIs.
     *
     * @param {ApiProperties|Object} pApiProperties     An instance of ApiProperties or an object
     *                                                  defining the basic values required
     *                                                  (that is, apiKey and accessToken)
     *
     * @param {String} pPersonalAccessToken             The _Personal_ Access Token
     *                                                  to use to get or refresh an access token
     *
     * @param {OauthSecrets|Object} pOathSecrets        An instance of OauthSecrets
     *                                                  or an object defining clientId and clientSecret
     *
     * @param {String|URL} pTokenUrl                    The URL (or url string/path) to the endpoint
     *                                                  to get or refresh an access token
     *
     * @param {TenantSecrets|Object} pTenantSecrets     An instance of TenantSecrets or an object
     *                                                  defining the orgId and userId values
     *                                                  required to make API requests.
     *
     * @class
     */
    class ApiExtendedProperties extends ApiProperties
    {
        #basicProperties;
        #personalAccessToken = _mt;
        #oauthSecrets = {};
        #tokenUrl = _mt;
        #tenantSecrets = {};

        constructor( pApiProperties, pPersonalAccessToken = _mt, pOauthSecrets = {}, pTokenUrl = _mt, pTenantSecrets = {} )
        {
            super( pApiProperties?.apiKey, pApiProperties?.accessToken );

            this.#basicProperties = asObject( pApiProperties );

            this.#personalAccessToken = asString( pPersonalAccessToken, true ) || _mt;

            this.#oauthSecrets = asObject( pOauthSecrets ) || {};

            this.#tokenUrl = (_ud !== typeof URL && pTokenUrl instanceof URL) ? cleanUrl( asString( pTokenUrl.href, true ) ) : cleanUrl( asString( pTokenUrl || _mt, true ) );

            this.#tenantSecrets = asObject( pTenantSecrets );
        }

        get apiKey()
        {
            let key = _mt;
            if ( isNonNullObject( this.#basicProperties ) )
            {
                key = this.#basicProperties?.apiKey || super.apiKey;
            }
            key = asString( key, true ) || super.apiKey;
            return asString( key, true );
        }

        get accessToken()
        {
            let token;
            if ( isNonNullObject( this.#basicProperties ) )
            {
                token = this.#basicProperties?.accessToken || super.accessToken;
            }
            return token || super.accessToken;
        }

        get personalAccessToken()
        {
            return asString( this.#personalAccessToken, true );
        }

        get clientId()
        {
            const secrets = this.#oauthSecrets;
            return isNonNullObject( secrets ) ? (asString( secrets.clientId || secrets.id, true ) || _mt) : _mt;
        }

        get clientSecret()
        {
            const secrets = this.#oauthSecrets;
            return isNonNullObject( secrets ) ? (asString( secrets.clientSecret || secrets.secret, true ) || _mt) : _mt;
        }

        get tenantSecrets()
        {
            return asObject( this.#tenantSecrets );
        }

        get orgId()
        {
            return asString( this.tenantSecrets?.orgId || _mt, true ) || _mt;
        }

        get userId()
        {
            return asString( this.tenantSecrets?.userId || _mt, true ) || _mt;
        }

        toObjectLiteral()
        {
            return toObjectLiteral( this );
        }

        toString()
        {
            return asJson( this );
        }
    }

    /**
     * This class can be used to define the configuration
     * expected for an instance of HttpClient (or one of its subclasses)
     * that will be used to communicate with a specific external API.
     * <br><br>
     *
     * Not all properties are relevant to all instances of HttpClient or every possible API.<br>
     * This class is intended to provide values expected by most APIs,
     * including those that require frequent refreshing of an access token.
     * @class
     * @extends HttpClientConfig
     */
    class HttpClientApiConfig extends HttpClientConfig
    {
        /**
         * Holds the API KEY, a value commonly passed in the headers of a request to an API endpoint
         */
        #apiKey;

        /**
         * Holds an access token, which may be either a String or an Object, such as a JWT
         */
        #accessToken;

        /**
         * Holds a personal access token, used by many newer APIs to get an access token
         */
        #personalAccessToken;

        /**
         * Holds the OAUTH/OAUTH2 Client ID, often used in conjunction with other keys,
         * such as the personal access token to get an access token or to authenticate.
         */
        #clientId;

        /**
         * Holds the OAUTH/OAUTH2 Client Secret, often used in conjunction with other keys,
         * such as the personal access token to get an access token or to authenticate.
         */
        #clientSecret;

        /**
         * Holds a value some APIs require on each request to help identify the tenant of a multitenant environment
         */
        #orgId;

        /**
         * Holds a value some APIs require on each request to help identify the specific user making an API request
         */
        #userId;

        /**
         * Holds the url to the endpoint that returns an access token for the API for which this configuration is used
         */
        #accessTokenUrl;

        /**
         * Constructs an instance of an API-specific configuration
         * to be used with an instance of HttpClient
         * to interact with a specific API
         *
         * @param {HttpClientConfig|Object} pHttpClientConfig
         * @param {ApiProperties|Object} pApiProperties
         * @param {OauthSecrets|Object} pOauthSecrets
         * @param {String} pPersonalAccessToken
         * @param {String|URL} pAccessTokenUrl
         * @param {TenantSecrets} pTenantSecrets
         */
        // noinspection OverlyComplexFunctionJS
        constructor( pHttpClientConfig,
                     pApiProperties,
                     pOauthSecrets,
                     pPersonalAccessToken,
                     pAccessTokenUrl,
                     pTenantSecrets )
        {
            super( pHttpClientConfig?.httpAgent || httpAgent,
                   pHttpClientConfig.httpsAgent || httpsAgent,
                   toBool( pHttpClientConfig?.allowAbsoluteUrls ),
                   clamp( asInt( pHttpClientConfig?.timeout ), MIN_TIMEOUT_MILLISECONDS, MAX_TIMEOUT_MILLISECONDS ),
                   clamp( asInt( pHttpClientConfig?.maxContentLength ), MIN_CONTENT_LENGTH, MAX_CONTENT_LENGTH ),
                   clamp( asInt( pHttpClientConfig?.maxBodyLength ), MIN_CONTENT_LENGTH, MAX_CONTENT_LENGTH ),
                   clamp( asInt( pHttpClientConfig?.maxRedirects ), MIN_REDIRECTS, MAX_REDIRECTS ),
                   toBool( pHttpClientConfig?.decompress ),
                   resolveHttpMethod( pHttpClientConfig?.method || VERBS.GET ),
                   { ...(pHttpClientConfig?.headers || {}) },
                   asString( pHttpClientConfig?.contentType, true ),
                   asString( pHttpClientConfig?.accept, true ),
                   { ...pHttpClientConfig?.options || {} } );

            this.#apiKey = asString( pApiProperties?.apiKey || pHttpClientConfig?.apiKey || asString( pApiProperties, true ), true );
            this.#accessToken = asString( pApiProperties?.accessToken || pHttpClientConfig?.accessToken, true ) || this.#apiKey;
            this.#personalAccessToken = asString( pPersonalAccessToken, true ) || asString( pHttpClientConfig?.personalAccessToken, true ) || this.#apiKey;
            this.#clientId = pOauthSecrets?.clientId || pOauthSecrets?.id || pHttpClientConfig?.clientId || _mt;
            this.#clientSecret = pOauthSecrets?.clientSecret || pOauthSecrets?.secret || pHttpClientConfig?.clientSecret || _mt;
            this.#accessTokenUrl = cleanUrl( asString( pAccessTokenUrl, true ) );
            this.#orgId = pTenantSecrets?.orgId || pHttpClientConfig?.orgId || _mt;
            this.#userId = pTenantSecrets?.userId || pHttpClientConfig?.userId || _mt;
        }

        get apiKey()
        {
            return asString( this.#apiKey, true );
        }

        get accessToken()
        {
            return this.#accessToken;
        }

        get personalAccessToken()
        {
            return asString( this.#personalAccessToken, true );
        }

        get clientId()
        {
            return asString( this.#clientId, true );
        }

        get clientSecret()
        {
            return asString( this.#clientSecret, true );
        }

        get orgId()
        {
            return asString( this.#orgId, true );
        }

        get userId()
        {
            return asString( this.#userId, true );
        }

        get accessTokenUrl()
        {
            return cleanUrl( asString( this.#accessTokenUrl, true ) );
        }

        get tokenUrl()
        {
            return cleanUrl( asString( this.#accessTokenUrl, true ) );
        }

        /**
         * Returns an object literal whose properties are those of this instance.
         * @returns {Object} an object literal whose properties are those of this instance.
         */
        toObjectLiteral()
        {
            let literal = toObjectLiteral( this );
            return fixAgents( literal );
        }

        toString()
        {
            return asJson( this );
        }

        /**
         * Returns an object that has translated the property names of this configuration
         * into those expected by the target configuration or consumer of the configuration
         *
         * Example:
         *
         * If the specified map, or object, looks like:
         *
         * {
         *     "api_key":"apiKey",
         *     "x-org-id":"orgId",
         *     "x-user-id":"userId"
         * }
         *
         * and this instance has the following values:
         *
         * {
         *     apiKey: "yaddah-yaddah",
         *     orgId:"4321",
         *     userId:"9999"
         * }
         *
         * The result is an object that looks like this:
         *
         * {
         *     "api_key":"yaddah-yaddah",
         *     "x-org-id":"4321",
         *     "x-user-id":"9999"
         * }
         *
         * @param {Map|Object} pMap A Map or Object describing how to map the values of this instance
         *                          to a new Object with different property names
         *
         * @returns {Object} An object with the desired property names and values based on this instance
         */
        mapToTargetConfig( pMap )
        {
            const me = this;

            const obj = {};

            const entries = objectEntries( pMap );

            entries.forEach( entry =>
                             {
                                 let key = asString( ObjectEntry.getKey( entry ) );
                                 let value = asString( ObjectEntry.getValue( entry ) );

                                 obj[key] = me[value];
                             } );

            const mappedValues = Object.values( pMap );

            const myEntries = objectEntries( toObjectLiteral( me ) );

            myEntries.forEach( entry =>
                               {
                                   let key = asString( ObjectEntry.getKey( entry ) );
                                   if ( !mappedValues.includes( key ) )
                                   {
                                       let value = ObjectEntry.getValue( entry );
                                       if ( !(isNull( value ) || (isString( value ) && isBlank( value )) || (isNumeric( value ) && asInt( value ) === 0)) )
                                       {
                                           obj[key] = value;
                                       }
                                   }
                               } );

            return fixAgents( obj );
        }
    }

    /**
     * Returns an object literal holding the properties defined in the default HttpClientApiConfig
     *
     * @param pApiProperties
     * @param pOauthSecrets
     * @param pPersonalAccessToken
     * @param pAccessTokenUrl
     * @param pTenantSecrets
     *
     * @returns {Object} an object literal holding the properties defined in the default HttpClientApiConfig
     */
    HttpClientApiConfig.getDefaultConfig = function( pApiProperties,
                                                     pOauthSecrets,
                                                     pPersonalAccessToken,
                                                     pAccessTokenUrl,
                                                     pTenantSecrets )
    {
        let cfg = new HttpClientApiConfig( HttpClientConfig.getDefaultConfig(),
                                           pApiProperties,
                                           pOauthSecrets,
                                           pPersonalAccessToken,
                                           pAccessTokenUrl,
                                           pTenantSecrets );
        return fixAgents( cfg );
    };

    const DEFAULT_API_CONFIG = HttpClientApiConfig.getDefaultConfig();

    const DEFAULT_DOWNLOAD_CONFIG = {
        method: VERBS.GET,
        responseType: "stream",
        Accept: "application/octet-stream",
        headers: { Accept: "application/octet-stream" }
    };

    /**
     * Combines the specified configuration with the default configuration
     * @param {Object} pConfig  the configuration to combine with the default configuration.
     *                          <br><br>
     *                          When the specified configuration has a value for a property defined in the default configuration,
     *                          the value in the specified configuration is returned in the resulting configuration object.
     *
     * @param pBody
     * @returns {Object}        An object combining the specified configuration
     *                          with the default configuration
     */
    function resolveConfig( pConfig, pBody = pConfig?.body )
    {
        let cfg = { ...DEFAULT_CONFIG_LITERAL, ...(toObjectLiteral( pConfig || {} )) };

        if ( !isNull( pBody ) )
        {
            cfg.data = cfg.body = (pBody || cfg.body || cfg.data);
        }

        return fixAgents( cfg );
    }

    /**
     * Combines the specified configuration
     * with the default API configuration
     *
     * @param {Object} pApiConfig       The configuration to combine with the default configuration.
     *                                  When the specified configuration has a value for a property defined in the default configuration,
     *                                  the value in the specified configuration is returned in the resulting configuration object.
     *
     * @param pBody
     * @returns {Object} An object combining the specified configuration with the default configuration
     */
    function resolveApiConfig( pApiConfig, pBody = pApiConfig?.body )
    {
        let cfg = resolveConfig( pApiConfig, pBody );

        cfg = { ...(toObjectLiteral( HttpClientApiConfig.getDefaultConfig() )), ...cfg };

        return fixAgents( cfg );
    }

    function mergeConfig( pConfig, pDefaultConfig = DEFAULT_API_CONFIG )
    {
        const cfg = resolveApiConfig( pConfig, (pConfig?.body || pConfig?.data) );

        const defaultApiConfig = pDefaultConfig || DEFAULT_API_CONFIG;

        const mergedConfig = { ...DEFAULT_CONFIG_LITERAL, ...(defaultApiConfig || {}), ...(cfg || {}) };

        if ( pConfig?.signal )
        {
            mergedConfig.signal = pConfig?.signal;
        }
        else if ( pConfig?.abortController )
        {
            mergedConfig.signal = pConfig?.abortController?.signal;
        }

        // Apply shared agents unless pConfig specifically overrides them
        mergedConfig.httpAgent = pConfig?.httpAgent || httpAgent;
        mergedConfig.httpsAgent = pConfig?.httpsAgent || httpsAgent;

        return fixAgents( mergedConfig );
    }

    function isHttpClient( pDelegate )
    {
        if ( isNonNullObject( pDelegate ) )
        {
            return isFunction( pDelegate.sendRequest ) ||
                   (isFunction( pDelegate.sendGetRequest ) &&
                    isFunction( pDelegate.sendPostRequest ) &&
                    isFunction( pDelegate.sendPutRequest ) &&
                    isFunction( pDelegate.sendPatchRequest ) &&
                    isFunction( pDelegate.sendDeleteRequest ));

        }
    }

    function resolveUrl( pUrl, pConfig )
    {
        if ( isNonNullObject( pUrl ) )
        {
            if ( pUrl instanceof URL )
            {
                return cleanUrl( pUrl.href );
            }
            else
            {
                return cleanUrl( asString( pUrl?.url || pUrl?.href || pUrl, true ) || asString( pUrl, true ) );
            }
        }

        if ( isString( pUrl ) )
        {
            return cleanUrl( asString( pUrl, true ) ) || pConfig?.url;
        }

        return cleanUrl( pConfig?.url || _mt );
    }

    /**
     * Returns the body data that was fetched or should be sent in a request.
     * This function expects the body to be a property of the configuration object specified.
     * The property is expected to be named either 'body' or 'data'.
     * For subclasses using a delegate with other expectations, override the corresponding method of HttpClient.
     *
     * @param pBody
     * @param {Object|HttpClientConfig|RequestInit} pConfig An object with either a body or data property.
     *
     * @returns {String|ArrayBuffer|Blob|DataView|File|FormData|TypedArray|URLSearchParams|ReadableStream|null}
     * The body to be sent to the server or the body received from the server (which may be an unfulfilled Promise)
     *
     * // override resolveBody for Axios, which will do this for us
     */
    async function resolveBody( pBody, pConfig )
    {
        let body = isNonNullObject( pBody ) || (isString( pBody ) && !isBlank( pBody )) ? pBody : (pConfig?.data || pConfig?.body);

        if ( isString( body ) && !isBlank( body ) )
        {
            return body;
        }

        if ( instanceOfAny( body, ArrayBuffer, Blob, DataView, File, FormData, TypedArray, URLSearchParams, ReadableStream ) )
        {
            return body;
        }

        if ( isNumber( body ) )
        {
            return asString( body, true );
        }

        if ( isPromise( body ) || isThenable( body ) )
        {
            body = await asyncAttempt( async() => await body );
            return resolveBody( { body }, pConfig );
        }

        // override resolveBody for Axios, which will do this for us
        if ( isNonNullObject( body ) )
        {
            return asJson( body );
        }

        return body;
    }

    function extractFileNameFromHeader( pResponse, pDefaultName, pReplaceCharacters = false )
    {
        let fileName = asString( pDefaultName );

        if ( isNonNullObject( pResponse ) )
        {
            // this function accepts either a response or headers object
            const headers = pResponse.headers || pResponse;

            const contentDisposition = asString( HttpHeaders.getHeaderValue( headers, "Content-Disposition" ), true );

            if ( !(isNull( contentDisposition ) || isBlank( contentDisposition )) )
            {
                const match = contentDisposition.match( /filename\*?=(?:['"](?:[^'"]*['"])*)?([^;]+)/i );

                if ( match && match[1] )
                {
                    fileName = asString( decodeURIComponent( match[1].trim().replace( /^['"]|['"]$/g, "" ) ), true );
                }

                if ( !isBlank( fileName ) )
                {
                    let name = asString( fileName, true );

                    if ( !!pReplaceCharacters )
                    {
                        name = asString( name, true ).replaceAll( /\s+/g, _underscore ).replaceAll( /"'`/g, _mt_str ).replaceAll( /[*?]/g, _mt_str );
                    }

                    return name || fileName;
                }
            }
        }

        return asString( pDefaultName, true );
    }

    class QueuedRequest
    {
        #id;
        #priority = 0;

        #queuedTime;

        #request;
        #config;

        #url;
        #method;

        #aborted = false;

        #resolve;
        #reject;

        constructor( pRequest, pConfig, pResolve, pReject )
        {
            this.#queuedTime = Date.now();

            this.#config = resolveConfig( pConfig );

            this.#request = new HttpRequest( isString( pRequest ) ? (_ud !== typeof Request) ? new Request( pRequest, this.#config ) : new HttpRequest( pRequest, this.#config ) : pRequest );

            this.#url = cleanUrl( asString( this.#request?.url || asString( this.#config?.url, true ) || asString( pRequest || this.#request, true ), true ) );

            this.#method = resolveHttpMethod( pRequest?.method || this.#config?.method );

            this.#id = asInt( this.#request?.id || this.#config?.id || QueuedRequest.nextId() );

            this.#priority = asInt( this.#request?.priority ) || asInt( this.#config?.priority ) || calculatePriority( this?.#request || this );

            this.#resolve = isFunction( pResolve ) ? pResolve : no_op;
            this.#reject = isFunction( pReject ) ? pReject : no_op;

            this.abortController = this.#request.abortController || this.#config?.abortController || new AbortController();

            this.abort = function( pWhy )
            {
                attempt( () => this.abortController.abort( pWhy ) );
                this.#aborted = true;
            };

            this.#aborted = !!(this.#request.aborted || false);
        }

        get id()
        {
            return asInt( this.#id );
        }

        get priority()
        {
            return isString( this.#priority ) ? (isNumeric( this.#priority ) ? asInt( this.#priority ) : calculatePriority( this.#priority )) : asInt( this.#priority );
        }

        get queuedTime()
        {
            return asInt( this.#queuedTime );
        }

        get config()
        {
            return populateOptions( this.#config, toObjectLiteral( HttpClientApiConfig.getDefaultConfig() ) );
        }

        get request()
        {
            return this.#request || new HttpRequest( this.url, this.config );
        }

        get url()
        {
            return cleanUrl( this.#url || this.request?.url || this.config?.url );
        }

        get method()
        {
            return resolveHttpMethod( this.#method || this.request.method || this.config.method );
        }

        get resolve()
        {
            return isFunction( this.#resolve ) ? this.#resolve : null;
        }

        get reject()
        {
            return isFunction( this.#reject ) ? this.#reject : null;
        }
    }

    QueuedRequest.NEXT_ID = 10_000;
    QueuedRequest.nextId = function()
    {
        let id = ++QueuedRequest.NEXT_ID;
        if ( id > 999_999_999 )
        {
            id = QueuedRequest.NEXT_ID = 10_000;
        }
        return id;
    };

    const MAX_REQUEST_RETRIES = 10;
    const DEFAULT_REQUEST_RETRIES = 5;

    const DEFAULT_DELEGATE_OPTIONS =
        {
            maxRetries: DEFAULT_REQUEST_RETRIES
        };

    async function prepareRequestConfig( pMethod, pConfig, pUrl, pBody )
    {
        const body = await resolveBody( (pBody || pConfig?.body || pConfig?.data), pConfig );

        const cfg = resolveApiConfig( pConfig, body );

        const url = (_ud !== typeof Request && pUrl instanceof Request) ? (pUrl?.url || pUrl) : resolveUrl( pUrl, cfg );

        if ( body )
        {
            cfg.body = cfg.data = (body || await resolveBody( body, cfg ));
        }

        cfg.method = resolveHttpMethod( pMethod || cfg.method ) || cfg.method;

        return { cfg, url, body, method: cfg.method };
    }

    /**
     * This class provides default implementations of HTTP request methods.
     * The HttpClient class and subclasses can use or replace this delegate
     * or override individual methods.
     *
     * Candidates for replacement of this delegate include *wrappers*
     * around Axios, XmlHttpRequest, or the Fetch API
     */
    class HttpFetchClient
    {
        #options = DEFAULT_DELEGATE_OPTIONS;
        #config = DEFAULT_CONFIG;

        /**
         * Constructs an instance of the default implementation of an HttpClient delegate
         * @param {HttpClientConfig|HttpClientApiConfig|Object} pConfig
         * @param {Object} pOptions
         */
        constructor( pConfig = HttpClientConfig.getDefaultConfig(), pOptions = DEFAULT_DELEGATE_OPTIONS )
        {
            this.#config = populateOptions( toObjectLiteral( pConfig || HttpClientConfig.getDefaultConfig() ),
                                            DEFAULT_CONFIG_LITERAL );

            this.#options = populateOptions( pOptions || {}, DEFAULT_DELEGATE_OPTIONS, DEFAULT_CONFIG_LITERAL );
        }

        get config()
        {
            return fixAgents( { ...(DEFAULT_CONFIG_LITERAL || {}), ...(this.#config || {}) } );
        }

        mergeConfig( pConfig )
        {
            let cfg = fixAgents( { ...DEFAULT_CONFIG_LITERAL, ...({ ...(this.config || {}) }) } );

            let mergedConfig = { ...cfg, ...(pConfig || {}) };

            mergedConfig.httpAgent = pConfig?.httpAgent || cfg?.httpAgent || httpAgent;
            mergedConfig.httpsAgent = pConfig?.httpsAgent || cfg?.httpsAgent || httpsAgent;

            return fixAgents( mergedConfig );
        }

        resolveUrl( pUrl, pConfig )
        {
            return resolveUrl( pUrl, pConfig );
        }

        resolveConfig( pConfig, pRequest )
        {
            let cfg = fixAgents( this.mergeConfig( pConfig || this.config ) );

            if ( _ud !== typeof Request && pRequest instanceof Request )
            {
                let req = new Request( pRequest.clone() );
                cfg = populateOptions( cfg, req );
                cfg.headers = populateOptions( cfg.headers, req.headers );
            }
            else if ( isNonNullObject( pRequest ) )
            {
                cfg = { ...cfg, ...(this.mergeConfig( pRequest )) };
            }

            return fixAgents( cfg );
        }

        async resolveBody( pBody, pConfig )
        {
            return resolveBody( pBody, pConfig );
        }

        get options()
        {
            return { ...DEFAULT_DELEGATE_OPTIONS, ...(this.#options || {}) };
        }

        get maxRetries()
        {
            return clamp( this.options?.maxRetries, 0, MAX_REQUEST_RETRIES );
        }

        // noinspection FunctionTooLongJS
        async doFetch( pUrl, pConfig, pRedirects = 0, pRetries = 0, pResolve, pReject )
        {
            const cfg = this.resolveConfig( pConfig, pUrl );

            const method = resolveHttpMethod( cfg.method || VERBS.GET );
            cfg.method = method || VERBS.GET;

            const url = this.resolveUrl( pUrl, cfg );
            cfg.url = url;

            let retries = asInt( pRetries, 0 ) || 0;

            if ( retries >= asInt( this.maxRetries ) )
            {
                const error = new Error( "Maximum number of retries exceeded" );
                return new ResponseData( error, cfg, cfg );
            }

            const body = this.resolveBody( (cfg.data || cfg.body), pConfig );
            cfg.body = cfg.data = body || cfg.data || cfg.body;

            const response = await asyncAttempt( async() => await fetch( url, cfg ) );

            let responseData = new ResponseData( response, cfg, cfg );

            if ( isNonNullObject( responseData ) )
            {
                let status = responseData.status;

                if ( ResponseData.isOk( responseData ) || (status >= 200 && status < 300) )
                {
                    return responseData;
                }
                else if ( STATUS_ELIGIBLE_FOR_RETRY.includes( status ) )
                {
                    let delay = Math.max( responseData.retryAfterMilliseconds, DEFAULT_RETRY_DELAY[status] );

                    await asyncAttempt( async() => await sleep( delay ) );

                    const me = this;

                    return await asyncAttempt( async() => await me.doFetch( url, cfg, pRedirects, ++retries, pResolve, pReject ) );
                }
                else if ( status >= 300 && status < 400 )
                {
                    const me = this;

                    let redirects = asInt( pRedirects );

                    if ( redirects <= asInt( cfg.maxRedirects ) )
                    {
                        let headers = responseData.headers;

                        let location = responseData.redirectUrl || (isFunction( headers?.get ) ? cleanUrl( asString( headers.get( "location" ) || headers.get( "Location" ), true ) || headers.location || headers.Location ) : cleanUrl( asString( headers.location || headers.Location, true ) ));

                        if ( location && cleanUrl( asString( url, true ) ) !== location )
                        {
                            return await me.doFetch( location, cfg, ++redirects, pRetries, pResolve, pReject );
                        }
                    }
                    else
                    {
                        throw new Error( "Exceeded Maximum Number of Redirects (" + asInt( cfg.maxRedirects ) + ")" );
                    }
                }
                else if ( responseData.isError() || !isNull( getLastError() ) )
                {
                    throw responseData?.error || getLastError() || new Error( "Failed to fetch data from " + url + ", Server returned: " + (responseData?.status || "no response") );
                }
                else
                {
                    throw new Error( "Failed to fetch data from " + url + ", Server returned: " + (responseData?.status || "no response") );
                }
            }
            throw new Error( "Failed to fetch data from " + url + ", Server returned: " + (responseData?.status || "no response") );
        }

        async sendRequest( pMethod, pUrl, pConfig, pBody, pRedirects, pRetries, pResolve, pReject )
        {
            const me = this;

            const {
                cfg,
                url,
                body
            } = await prepareRequestConfig( resolveHttpMethod( pMethod ), pConfig, pUrl, await resolveBody( pBody, pConfig ) );

            return await me.doFetch( url, cfg );
        }

        async sendGetRequest( pUrl, pConfig, pRedirects, pRetries, pResolve, pReject )
        {
            const me = this;

            const { cfg, url } = await prepareRequestConfig( VERBS.GET, pConfig, pUrl );

            return await asyncAttempt( async() => await me.sendRequest( VERBS.GET, url, cfg, null, pRedirects, pRetries, pResolve, pReject ) );
        }

        async getRequestedData( pUrl, pConfig, pRedirects = 0, pRetries = 0, pResolve, pReject )
        {
            const me = this;

            const { cfg, url } = await prepareRequestConfig( VERBS.GET, pConfig, pUrl, null );

            const responseData = new ResponseData( await asyncAttempt( async() => await me.sendGetRequest( url, cfg ) ) );

            if ( isNonNullObject( responseData ) )
            {
                let status = responseData.status;

                if ( ResponseData.isOk( status ) || (status >= 200 && status < 300) )
                {
                    return responseData.data || responseData.body;
                }
                else if ( status >= 300 && status < 400 )
                {
                    let redirects = asInt( pRedirects );

                    if ( redirects <= asInt( cfg.maxRedirects ) )
                    {
                        let headers = responseData.headers || responseData;

                        let location = HttpHeaders.getHeaderValue( headers, "Location" );

                        if ( location && cleanUrl( url ) !== cleanUrl( location ) )
                        {
                            return await me.getRequestedData( location, cfg, ++redirects );
                        }
                    }
                    else
                    {
                        throw new Error( "Exceeded Maximum Number of Redirects (" + asInt( cfg.maxRedirects ) + ")" );
                    }
                }
                else if ( responseData.isExceedsRateLimit() )
                {
                    let retries = asInt( pRedirects );

                    let delay = asInt( Math.max( 100, responseData.retryAfterMilliseconds, DEFAULT_RETRY_DELAY[status] ) );

                    await asyncAttempt( async() => await sleep( delay ) );

                    return await asyncAttempt( async() => await me.getRequestedData( url, cfg, ++retries ) );
                }
            }
            throw new Error( "Failed to fetch data from " + url + ", Server returned: " + (responseData?.status || "no response") );
        }

        async sendPostRequest( pUrl, pConfig, pBody, pRedirects, pRetries, pResolve, pReject )
        {
            const me = this;

            const { cfg, url } = await prepareRequestConfig( VERBS.POST, pConfig, pUrl, pBody );

            return asyncAttempt( async() => await me.sendRequest( VERBS.POST, url, cfg, pBody, pRedirects, pRetries, pResolve, pReject ) );
        }

        async upload( pUrl, pConfig, pBody )
        {
            return this.sendPostRequest( pUrl, pConfig, pBody );
        }

        async sendDeleteRequest( pUrl, pConfig, pBody, pRedirects, pRetries, pResolve, pReject )
        {
            const me = this;

            const {
                cfg,
                url
            } = await prepareRequestConfig( VERBS.DELETE, pConfig, pUrl, await resolveBody( pBody, pConfig ) );

            return asyncAttempt( async() => await me.sendRequest( VERBS.DELETE, url, cfg, pBody, pRedirects, pRetries, pResolve, pReject ) );
        }

        async sendPutRequest( pUrl, pConfig, pBody, pRedirects, pRetries, pResolve, pReject )
        {
            const me = this;

            const { cfg, url } = await prepareRequestConfig( VERBS.PUT, pConfig, pUrl, pBody );

            return asyncAttempt( async() => await me.sendRequest( VERBS.PUT, url, cfg, pBody, pRedirects, pRetries, pResolve, pReject ) );
        }

        async sendPatchRequest( pUrl, pConfig, pBody, pRedirects, pRetries, pResolve, pReject )
        {
            const me = this;

            const { cfg, url } = await prepareRequestConfig( VERBS.PATCH, pConfig, pUrl, pBody );

            return asyncAttempt( async() => await me.sendRequest( VERBS.PATCH, url, cfg, pBody, pRedirects, pRetries, pResolve, pReject ) );
        }

        async sendHeadRequest( pUrl, pConfig, pRedirects, pRetries, pResolve, pReject )
        {
            const me = this;

            const { cfg, url } = await prepareRequestConfig( VERBS.HEAD, pConfig, pUrl, null );

            return asyncAttempt( async() => await me.sendRequest( VERBS.HEAD, url, cfg ) );
        }

        async sendOptionsRequest( pUrl, pConfig, pRedirects, pRetries, pResolve, pReject )
        {
            const me = this;

            const { cfg, url } = await prepareRequestConfig( VERBS.OPTIONS, pConfig, pUrl, null );

            return asyncAttempt( async() => await me.sendRequest( VERBS.OPTIONS, url, cfg ) );
        }

        async sendTraceRequest( pUrl, pConfig, pRedirects, pRetries, pResolve, pReject )
        {
            const me = this;

            const { cfg, url } = await prepareRequestConfig( VERBS.TRACE, pConfig, pUrl, null );

            return asyncAttempt( async() => await me.sendRequest( VERBS.TRACE, url, cfg ) );
        }
    }

    const DEFAULT_HTTP_CLIENT_OPTIONS =
        {
            /* TBD */
        };

    class HttpClient
    {
        #config;

        #options;

        #delegates = new Map();

        #defaultDelegate = new HttpFetchClient();

        constructor( pConfig, pOptions, pDelegates = new Map(), pDefaultDelegate )
        {
            this.#config = { ...DEFAULT_CONFIG, ...(pConfig || {}) };

            this.#options = { ...DEFAULT_HTTP_CLIENT_OPTIONS, ...(pOptions || {}) };

            this.#defaultDelegate = isHttpClient( pDefaultDelegate ) ? pDefaultDelegate : isHttpClient( pDelegates ) ? pDelegates : new HttpFetchClient( resolveConfig( this.config ), this.options );

            this.#populateDelegates( pDelegates, this.#defaultDelegate );
        }

        get defaultDelegate()
        {
            return this.#defaultDelegate || new HttpFetchClient( resolveConfig( this.config ), this.options );
        }

        set defaultDelegate( pDelegate )
        {
            this.#defaultDelegate = isHttpClient( pDelegate ) ? pDelegate : this.getDelegate( VERBS.GET, { ["content-type"]: "*" } );
        }

        /**
         * Returns the Map<Type,Delegate> of delegates by Type for the specified Http Verb.
         *
         * @param {string|HttpVerb} pVerb       The verb, such as GET, POST, PUT, PATCH, or DELETE,
         *                                      for which to get the corresponding map of delegates by Content Type
         *
         * @returns {Map<String,HttpClient>}    The map of delegates by Content-Type
         */
        #getMapByTypeForVerb( pVerb )
        {
            const verb = isString( pVerb ) ? asString( pVerb, true ) : isNonNullObject( pVerb ) && isFunction( pVerb.toString ) ? asString( pVerb.toString(), true ) : pVerb;

            let map = this.#delegates.get( ucase( verb ) ) || this.#delegates.get( lcase( verb ) ) || this.#delegates.get( verb );

            if ( isNull( map ) || !isMap( map ) )
            {
                map = new Map();
                this.#delegates.set( ucase( verb ), map );
                this.#delegates.set( lcase( verb ), map );
            }

            return map;
        }

        #updateMapByType( pTypes, pMapByType, pNewMap, pDefaultDelegate )
        {
            const defaultDelegate = isHttpClient( pDefaultDelegate ) ? pDefaultDelegate : this.#defaultDelegate || new HttpFetchClient( resolveConfig( this.config ), this.options );

            let mapByType = isMap( pMapByType ) ? pMapByType : asMap( pMapByType );

            let source = isMap( pNewMap ) || isNonNullObject( pNewMap ) ? asMap( pNewMap ) : new Map( mapByType );

            unique( [...(asArray( pTypes || [] )), "*"] ).forEach( type =>
                                                                   {
                                                                       const delegate = source.get( type ) ||
                                                                                        source.get( ucase( type ) ) ||
                                                                                        source.get( lcase( type ) ) ||
                                                                                        mapByType.get( type ) ||
                                                                                        mapByType.get( ucase( type ) ) ||
                                                                                        mapByType.get( lcase( type ) ) ||
                                                                                        defaultDelegate;

                                                                       mapByType.set( type, delegate );
                                                                       mapByType.set( lcase( type ), delegate );
                                                                       mapByType.set( ucase( type ), delegate );
                                                                   } );

        }

        #populateMapByType( pTypes, pMapByType, pDelegate )
        {
            if ( isMap( pDelegate ) || ( !isHttpClient( pDelegate ) && isNonNullObject( pDelegate )) )
            {
                return this.#updateMapByType( pTypes, pMapByType, asMap( pDelegate ) );
            }

            let mapByType = isMap( pMapByType ) ? pMapByType : asMap( pMapByType );

            let delegate = isHttpClient( pDelegate ) ? pDelegate : isMap( pDelegate ) ? (this.#defaultDelegate || null) : new HttpFetchClient();

            unique( [...(asArray( pTypes || [] )), "*"] ).forEach( type =>
                                                                   {
                                                                       mapByType.set( type, delegate || mapByType.get( type ) );
                                                                       mapByType.set( lcase( type ), delegate || mapByType.get( lcase( type ) ) );
                                                                       mapByType.set( ucase( type ), delegate || mapByType.get( ucase( type ) ) );
                                                                   } );
        }

        #populateDelegates( pDelegates, pDefaultDelegate )
        {
            const KEYS = asArray( objectKeys( VERBS ) );
            const TYPES = asArray( objectValues( CONTENT_TYPES ) );

            if ( isMap( pDelegates ) || isNonNullObject( pDelegates ) )
            {
                if ( isHttpClient( pDelegates ) )
                {
                    asArray( [...KEYS, "*"] ).forEach( verb =>
                                                       {
                                                           let map = this.#getMapByTypeForVerb( verb );
                                                           this.#populateMapByType( TYPES, map, pDelegates );
                                                       } );
                }
                else
                {
                    const entries = asArray( objectEntries( asMap( pDelegates ) ) || [] );

                    entries.forEach( entry =>
                                     {
                                         const key = ObjectEntry.getKey( entry );
                                         const value = ObjectEntry.getValue( entry );

                                         if ( (isString( key ) || key instanceof HttpVerb) && (isVerb( asString( key, true ) ) || "*" === key) )
                                         {
                                             let mapByType = this.#getMapByTypeForVerb( key );

                                             if ( isHttpClient( value ) )
                                             {
                                                 this.#populateMapByType( TYPES, mapByType, pDelegates );
                                             }
                                             else if ( isMap( value ) )
                                             {
                                                 this.#updateMapByType( TYPES, mapByType, value, pDefaultDelegate );
                                             }
                                         }
                                     } );
                }
            }
        }

        get config()
        {
            return { ...DEFAULT_CONFIG_LITERAL, ...(this.#config || {}) };
        }

        get options()
        {
            return { ...DEFAULT_HTTP_CLIENT_OPTIONS, ...(this.#options || {}) };
        }

        getDelegate( pMethod, pConfig, pContentType )
        {
            const method = resolveHttpMethod( pMethod?.name || pMethod );

            const type = HttpContentType.getContentType( pContentType || pConfig ) || "*";

            const byContentType = this.#delegates.get( method ) ||
                                  this.#delegates.get( ucase( method ) ) ||
                                  this.#delegates.get( lcase( method ) ) ||
                                  new Map();

            const delegate = byContentType.get( type ) ||
                             byContentType.get( lcase( type ) ) ||
                             byContentType.get( ucase( type ) );

            return isHttpClient( delegate ) ? delegate : isHttpClient( this.#defaultDelegate ) ? this.#defaultDelegate : new HttpFetchClient( resolveConfig( this.config, pBody ), this.options );
        }

        async sendRequest( pMethod, pUrl, pConfig, pBody, pRedirects, pRetries, pResolve, pReject )
        {
            const config = resolveConfig( this.config, pBody );

            const method = resolveHttpMethod( pMethod || config.method );

            const delegate = this.getDelegate( method, config ) || new HttpFetchClient( config, this.options );

            const uri = resolveUrl( pUrl, config );

            if ( isFunction( delegate.sendRequest ) )
            {
                return await asyncAttempt( async() => await delegate.sendRequest( method, uri, config, pBody, pRedirects, pRetries, pResolve, pReject ) );
            }

            const { cfg, url } = await prepareRequestConfig( method, config, uri, pBody );

            return fetch( url, cfg );
        }

        async #handleRedirect( pResponseData, pConfig, pRedirects )
        {
            const me = this;

            let config = pConfig || pResponseData?.config;

            let headers = { ...(config?.headers), ...(pResponseData.headers) };

            let redirects = asInt( pRedirects );

            if ( redirects <= asInt( config.maxRedirects ) )
            {
                let location = pResponseData.redirectUrl || HttpHeaders.getHeaderValue( headers || pResponseData?.headers, "Location" );

                if ( location && cleanUrl( config.url ) !== cleanUrl( location ) )
                {
                    return await asyncAttempt( async() => await me.getRequestedData( location, config, ++redirects ) );
                }
            }
            else
            {
                throw new Error( "Exceeded Maximum Number of Redirects (" + asInt( config.maxRedirects ) + ")" );
            }
        }

        async sendGetRequest( pUrl, pConfig, pRedirects = 0, pRetries = 0, pResolve, pReject )
        {
            const config = resolveConfig( { ...(this.config || {}), ...(pConfig || {}) } );

            const delegate = this.getDelegate( VERBS.GET, config ) || new HttpFetchClient( config, this.options );

            const uri = resolveUrl( pUrl, config );

            const { cfg, url } = await prepareRequestConfig( VERBS.GET, config, uri );

            if ( isFunction( delegate.sendGetRequest ) )
            {
                return await asyncAttempt( async() => await delegate.sendGetRequest( uri, cfg, pRedirects, pRetries, pResolve, pReject ) );
            }

            if ( isFunction( delegate.sendRequest ) )
            {
                return await asyncAttempt( async() => await delegate.sendRequest( VERBS.GET, uri, cfg, null, pRedirects, pRetries, pResolve, pReject ) );
            }

            return fetch( url, cfg );
        }

        async getRequestedData( pUrl, pConfig, pRedirects = 0, pRetries = 0, pResolve, pReject )
        {
            const me = this;

            const config = resolveConfig( { ...(this.config || {}), ...(pConfig || {}) } );

            const delegate = this.getDelegate( VERBS.GET, config ) || new HttpFetchClient( config, this.options );

            const uri = resolveUrl( pUrl, config );

            const { cfg, url } = await prepareRequestConfig( VERBS.GET, config, uri, null );

            if ( isFunction( delegate.getRequestedData ) )
            {
                return await asyncAttempt( async() => await delegate.getRequestedData( url, cfg, pRedirects, pRetries, pResolve, pReject ) );
            }

            if ( isFunction( delegate.sendGetRequest ) )
            {
                let responseData = await asyncAttempt( async() => await delegate.sendGetRequest( url, cfg, pRedirects, pRetries, pResolve, pReject ) );

                responseData = responseData instanceof ResponseData ? responseData : new ResponseData( responseData );

                if ( isNonNullObject( responseData ) )
                {
                    let status = responseData.status;

                    if ( ResponseData.isOk( status ) || (status >= 200 && status < 300) )
                    {
                        return responseData.data || responseData.body;
                    }
                    else if ( status >= 300 && status < 400 )
                    {
                        return this.#handleRedirect( responseData, cfg, asInt( pRedirects ) );
                    }
                    else if ( responseData.isExceedsRateLimit() )
                    {
                        let retries = asInt( pRedirects );

                        if ( retries > cfg.maxRedirects )
                        {
                            throw new Error( "Failed to fetch data from " + url + ", Server returned: " + (responseData?.status || "no response") + ", " + asString( responseData.headers ) );
                        }

                        let delay = Math.max( responseData.retryAfterMilliseconds, DEFAULT_RETRY_DELAY[status], 100 );

                        delay *= (retries + 1);

                        await asyncAttempt( async() => await sleep( delay ) );

                        return await asyncAttempt( async() => await me.getRequestedData( url, cfg, ++retries ) );
                    }
                }
                throw new Error( "Failed to fetch data from " + url + ", Server returned: " + (responseData?.status || "no response") );
            }
        }

        async sendPostRequest( pUrl, pConfig, pBody, pRedirects, pRetries, pResolve, pReject )
        {
            const config = resolveConfig( { ...(this.config || {}), ...(pConfig || {}) } );

            const delegate = this.getDelegate( VERBS.POST, config ) || new HttpFetchClient( config, this.options );

            const uri = resolveUrl( pUrl, config );

            const
                {
                    cfg,
                    url,
                    body
                } = await prepareRequestConfig( VERBS.POST, config, uri, await resolveBody( pBody, config ) );

            if ( isFunction( delegate.sendPostRequest ) )
            {
                return await asyncAttempt( async() => await delegate.sendPostRequest( url, cfg, (body || pBody), pRedirects, pRetries, pResolve, pReject ) );
            }

            if ( isFunction( delegate.sendRequest ) )
            {
                return await asyncAttempt( async() => await delegate.sendRequest( VERBS.POST, url, cfg, (body || pBody), pRedirects, pRetries, pResolve, pReject ) );
            }

            return fetch( url, cfg );
        }

        async sendPutRequest( pUrl, pConfig, pBody, pRedirects, pRetries, pResolve, pReject )
        {
            const config = resolveConfig( { ...(this.config || {}), ...(pConfig || {}) } );

            const delegate = this.getDelegate( VERBS.PUT, config ) || new HttpFetchClient( config, this.options );

            const uri = resolveUrl( pUrl, config );

            const
                {
                    cfg,
                    url,
                    body
                } = await prepareRequestConfig( VERBS.PUT, config, uri, await resolveBody( pBody, config ) );

            if ( isFunction( delegate.sendPutRequest ) )
            {
                return await asyncAttempt( async() => await delegate.sendPutRequest( url, cfg, (body || pBody), pRedirects, pRetries, pResolve, pReject ) );
            }

            if ( isFunction( delegate.sendRequest ) )
            {
                return await asyncAttempt( async() => await delegate.sendRequest( VERBS.PUT, url, cfg, (body || pBody), pRedirects, pRetries, pResolve, pReject ) );
            }

            return fetch( url, cfg );
        }

        async sendPatchRequest( pUrl, pConfig, pBody, pRedirects, pRetries, pResolve, pReject )
        {
            const config = resolveConfig( { ...(this.config || {}), ...(pConfig || {}) } );

            const delegate = this.getDelegate( VERBS.PATCH, config ) || new HttpFetchClient( config, this.options );

            const uri = resolveUrl( pUrl, config );

            const
                {
                    cfg,
                    url,
                    body
                } = await prepareRequestConfig( VERBS.PATCH, config, uri, await resolveBody( pBody, config ) );

            if ( isFunction( delegate.sendPatchRequest ) )
            {
                return await asyncAttempt( async() => await delegate.sendPatchRequest( url, cfg, (body || pBody), pRedirects, pRetries, pResolve, pReject ) );
            }

            if ( isFunction( delegate.sendRequest ) )
            {
                return await asyncAttempt( async() => await delegate.sendRequest( VERBS.PATCH, url, cfg, (body || pBody), pRedirects, pRetries, pResolve, pReject ) );
            }

            return fetch( url, cfg );
        }

        async sendDeleteRequest( pUrl, pConfig, pBody, pRedirects, pRetries, pResolve, pReject )
        {
            const config = resolveConfig( { ...(this.config || {}), ...(pConfig || {}) } );

            const delegate = this.getDelegate( VERBS.DELETE, config ) || new HttpFetchClient( config, this.options );

            const uri = resolveUrl( pUrl, config );

            const {
                cfg,
                url,
                body
            } = await prepareRequestConfig( VERBS.DELETE, config, uri, await resolveBody( pBody, config ) );

            if ( isFunction( delegate.sendDeleteRequest ) )
            {
                return await asyncAttempt( async() => await delegate.sendDeleteRequest( url, cfg, body, pRedirects, pRetries, pResolve, pReject ) );
            }

            if ( isFunction( delegate.sendRequest ) )
            {
                return await asyncAttempt( async() => await delegate.sendRequest( VERBS.DELETE, url, cfg, body, pRedirects, pRetries, pResolve, pReject ) );
            }

            return fetch( url, cfg );
        }

        async sendHeadRequest( pUrl, pConfig, pRedirects, pRetries, pResolve, pReject )
        {
            const config = resolveConfig( { ...(this.config || {}), ...(pConfig || {}) } );

            const delegate = this.getDelegate( VERBS.HEAD, config ) || new HttpFetchClient( config, this.options );

            const uri = resolveUrl( pUrl, config );

            const { cfg, url } = await prepareRequestConfig( VERBS.HEAD, config, uri );

            if ( isFunction( delegate.sendHeadRequest ) )
            {
                return await asyncAttempt( async() => await delegate.sendHeadRequest( url, cfg ) );
            }

            if ( isFunction( delegate.sendRequest ) )
            {
                return await asyncAttempt( async() => await delegate.sendRequest( VERBS.HEAD, url, cfg ) );
            }

            return fetch( url, cfg );
        }

        async sendOptionsRequest( pUrl, pConfig, pRedirects, pRetries, pResolve, pReject )
        {
            const config = resolveConfig( { ...(this.config || {}), ...(pConfig || {}) } );

            const delegate = this.getDelegate( VERBS.OPTIONS, config ) || new HttpFetchClient( config, this.options );

            const uri = resolveUrl( pUrl, config );

            const { cfg, url } = await prepareRequestConfig( VERBS.OPTIONS, config, uri );

            if ( isFunction( delegate.sendOptionsRequest ) )
            {
                return await asyncAttempt( async() => await delegate.sendOptionsRequest( url, cfg ) );
            }

            if ( isFunction( delegate.sendRequest ) )
            {
                return await asyncAttempt( async() => await delegate.sendRequest( VERBS.OPTIONS, url, cfg ) );
            }

            return fetch( url, cfg );
        }

        async sendTraceRequest( pUrl, pConfig, pRedirects, pRetries, pResolve, pReject )
        {
            const config = resolveConfig( { ...(this.config || {}), ...(pConfig || {}) } );

            const delegate = this.getDelegate( VERBS.TRACE, config ) || new HttpFetchClient( config, this.options );

            const uri = resolveUrl( pUrl, config );

            const { cfg, url } = await prepareRequestConfig( VERBS.TRACE, config, uri );

            if ( isFunction( delegate.sendTraceRequest ) )
            {
                return await asyncAttempt( async() => await delegate.sendTraceRequest( url, cfg ) );
            }

            if ( isFunction( delegate.sendRequest ) )
            {
                return await asyncAttempt( async() => await delegate.sendRequest( VERBS.TRACE, url, cfg ) );
            }

            return fetch( url, cfg );
        }

        async upload( pUrl, pConfig, pBody )
        {
            const config = resolveConfig( { ...(this.config || {}), ...(pConfig || {}) } );

            const delegate = this.getDelegate( VERBS.GET, config ) || new HttpFetchClient( config, this.options );

            const uri = resolveUrl( pUrl, config );

            const
                {
                    cfg,
                    url,
                    body
                } = await prepareRequestConfig( config.method || VERBS.POST, config, uri, await resolveBody( pBody, config ) );

            if ( isFunction( delegate?.upload ) )
            {
                return delegate.upload( url, cfg, (body || pBody) );
            }

            return this.sendPostRequest( url, cfg, (body || pBody) );
        }

        async download( pUrl, pConfig, pOutputPath = ".", pFileName = _mt )
        {
            let outputPath = toUnixPath( asString( pOutputPath, true ) ) || ".";

            const config = resolveConfig( { ...(this.config || {}), ...(pConfig || {}) } );

            const uri = resolveUrl( pUrl, config );

            const delegate = this.getDelegate( (config.method || VERBS.GET), config ) || new HttpFetchClient( config, this.options );

            if ( isFunction( delegate?.download ) )
            {
                return asyncAttempt( async() => await delegate.download( uri, config, outputPath, pFileName ) );
            }

            try
            {
                let cfg = { ...DEFAULT_API_CONFIG, ...DEFAULT_DOWNLOAD_CONFIG, ...(config || {}) };

                const response = await this.sendRequest( cfg.method || VERBS.GET, uri, cfg, await resolveBody( cfg.body || cfg.data, cfg ) );

                if ( ResponseData.isOk( response ) )
                {
                    // get the fileName from the Content-Disposition header or use provided filename
                    let defaultName = toUnixPath( asString( pFileName, true ) ) || _mt;

                    let fileName = asString( pFileName, true ) || extractFileNameFromHeader( response, defaultName );

                    // append the fileName to the path
                    const filePath = path.join( asString( outputPath, true ).replace( fileName, _mt ), fileName );

                    // create a writable stream
                    const fileStream = fs.createWriteStream( filePath );

                    // pipe the response data stream to the file stream
                    response.data.pipe( fileStream );

                    // wait for the stream to complete
                    await asyncAttempt( async() => await finished( fileStream ) );

                    console.log( `Wrote: ${filePath}` );

                    return filePath;
                }
            }
            catch( ex )
            {
                toolBocksModule.reportError( ex, ex.message, "error", this, ex.response?.status, ex.response );

                console.error( ` *****ERROR*****\nFailed to download file: ${ex.message}`, ex );

                if ( ex.response )
                {
                    console.error( ` *****ERROR*****\nResponse status: ${ex.response.status}` );
                }

                throw ex;
            }

            return _mt;
        }
    }

    /**
     * Represents a length of time for which rate limits might apply
     */
    class RequestInterval extends BockNamed
    {
        #milliseconds;

        constructor( pId, pName, pDurationInMilliseconds )
        {
            super( pId, pName );
            this.#milliseconds = asInt( pDurationInMilliseconds );
        }

        get milliseconds()
        {
            return this.#milliseconds;
        }

        calculateNextReset( pOpened )
        {
            let date = asDate( pOpened ).getTime();
            return new Date( date + this.milliseconds );
        }
    }

    RequestInterval.BURST = new RequestInterval( 0, "Burst", 100 );
    RequestInterval.PER_SECOND = new RequestInterval( 1, "Per Second", MILLIS_PER.SECOND );
    RequestInterval.PER_MINUTE = new RequestInterval( 60, "Per Minute", MILLIS_PER.MINUTE );
    RequestInterval.PER_HOUR = new RequestInterval( 3600, "Per Hour", MILLIS_PER.HOUR );
    RequestInterval.PER_DAY = new RequestInterval( 86400, "Per Day", MILLIS_PER.DAY );

    RequestInterval.fromString = function( pString )
    {
        if ( isString( pString ) )
        {
            let s = lcase( asString( pString, true ) ).replaceAll( /\s/g, _usc );

            switch ( s )
            {
                case "w=1":
                case "per_second":
                    return RequestInterval.PER_SECOND;

                case "w=60":
                case "per_minute":
                    return RequestInterval.PER_MINUTE;

                case "w=3600":
                case "per_hour":
                    return RequestInterval.PER_HOUR;

                case "w=86400":
                case "per_day":
                    return RequestInterval.PER_DAY;

                default:
                    return RequestInterval.BURST;
            }
        }
        return null;
    };

    RequestInterval.fromNumber = function( pString )
    {
        if ( isNumeric( pString ) )
        {
            switch ( asInt( pString ) )
            {
                case 0:
                    return RequestInterval.BURST;

                case 1:
                    return RequestInterval.PER_SECOND;

                case 60:
                    return RequestInterval.PER_MINUTE;

                case 3600:
                    return RequestInterval.PER_HOUR;

                case 86400:
                    return RequestInterval.PER_DAY;
            }
        }
        return RequestInterval.fromString( pString );
    };

    RequestInterval.resolve = function( pString )
    {
        if ( isNonNullObject( pString ) )
        {
            if ( pString instanceof RequestInterval )
            {
                return pString;
            }
            else
            {
                let source = asObject( pString );
                return new RequestInterval( source.id, source.name, source.milliseconds );
            }
        }

        if ( isNumeric( pString ) )
        {
            return RequestInterval.fromNumber( pString );
        }

        return RequestInterval.fromString( pString );
    };

    RequestInterval.LIST = lock(
        [
            RequestInterval.BURST,
            RequestInterval.PER_SECOND,
            RequestInterval.PER_MINUTE,
            RequestInterval.PER_HOUR,
            RequestInterval.PER_DAY
        ] );

    const DEFAULT_HTTP_CLIENT_RATE_LIMITED_OPTIONS =
        {
            ...DEFAULT_HTTP_CLIENT_OPTIONS,
            MAX_DELAY_BEFORE_QUEUE: 1_500
        };

    /**
     * Represents a duration of time within a specific number of requests are allowed.
     * Used to track the number of requests made,
     * number of requests remaining,
     * and the time of the next reset of requests per this duration.
     * Provides methods for calculating a delay to wait prior to making another request,
     * whether to wait and send a request or instead to queue the request and continue.
     */
    class RequestWindow
    {
        /**
         * The date/time this window began
         */
        #opened;

        /**
         * The RequestInterval defining the duration of this window
         */
        #interval;

        /**
         * The date/time this window will reset
         */
        #nextReset;

        /**
         * The number of requests made within the time interval represented
         */
        #numMade = 0;

        /**
         * The number of requests allowed during this window
         */
        #numAllowed = 0;

        /**
         * Holds options to override or control the behavior of an instance of this object
         */
        #options;

        /**
         * Defines the maximum number of milliseconds to pause before sending a request
         * versus queueing the request and continuing to serve other requests
         */
        #maxDelayBeforeQueueing = asInt( DEFAULT_HTTP_CLIENT_RATE_LIMITED_OPTIONS.MAX_DELAY_BEFORE_QUEUE );

        /**
         * Constructs an instance of the RequestWindow class, specific to a certain rate-limit duration, or "window"
         *
         * @param {RequestInterval|string|number} pInterval The duration of time each occurrence of this window persists
         * @param {number} pNumAllowed The number of requests allowed within the duration of time represented by each instance of this window
         * @param {object} pOptions An object to specify or override any additional properties to associate with this window
         */
        constructor( pInterval, pNumAllowed, pOptions )
        {
            this.#opened = new Date();

            this.#interval = RequestInterval.resolve( pInterval );

            this.#numAllowed = asInt( pNumAllowed );

            this.#nextReset = this.#interval.calculateNextReset( this.#opened );

            this.#options = { ...DEFAULT_HTTP_CLIENT_RATE_LIMITED_OPTIONS, ...(pOptions || {}) };

            this.#maxDelayBeforeQueueing = Math.min( Math.max( 10, asInt( this.#options?.MAX_DELAY_BEFORE_QUEUE ) ), 5_000 );

            const me = this;

            setTimeout( me.timerFunction, this.#interval?.milliseconds );
        }

        /**
         * Returns the datetime this window was created or last reset
         * @returns {Date}
         */
        get opened()
        {
            return lock( asDate( this.#opened ) );
        }

        /**
         * Returns the RequestInterval the defines the length of time each occurrence of this window persists
         * @returns {*}
         */
        get interval()
        {
            return lock( this.#interval );
        }

        /**
         * Returns the datetime this occurrence will (or can) be reset
         * @returns {Date}
         */
        get nextReset()
        {
            return asDate( this.#nextReset );
        }

        /**
         * Returns the number of requests made so far during this occurrence of the rate-limit window
         * @returns {number} the number of requests made so far during this occurrence of the rate-limit window
         */
        get numMade()
        {
            return asInt( this.#numMade, 0 );
        }

        /**
         * Returns the number of requests that can be made during any occurrence of the duarion of time represented by this window
         * @returns {number} the number of requests that can be made during any occurrence of the duarion of time represented by this window
         */
        get numAllowed()
        {
            return asInt( this.#numAllowed, 0 );
        }

        set numAllowed( pAllowed )
        {
            this.#numAllowed = Math.max( 1, asInt( pAllowed ) );
        }

        /**
         * Returns the options with which this instance as created
         * @returns {objects}
         */
        get options()
        {
            return { ...DEFAULT_HTTP_CLIENT_RATE_LIMITED_OPTIONS, ...(this.#options || {}) };
        }

        /**
         * Returns the maximum number of milliseconds to pause and then send a request before instead queuing the request.
         * @returns {number}
         */
        get maxDelayBeforeQueueing()
        {
            return asInt( this.#maxDelayBeforeQueueing ) || DEFAULT_HTTP_CLIENT_RATE_LIMITED_OPTIONS.MAX_DELAY_BEFORE_QUEUE;
        }

        /**
         * Returns true if the time this window should be reset has passed
         * @returns {boolean}
         */
        hasExpired()
        {
            const nextResetTime = this.nextReset;
            return nextResetTime.getTime() < Date.now();
        }

        /**
         * Returns a function to execute at the expiration of this duration.
         * This function is used as a fallback to the regular update of this window upon each request.
         * This is useful if requests may come in sporadic bursts.
         * @returns {(function(): Promise<void>)|*}
         */
        get timerFunction()
        {
            const me = this;
            return async function()
            {
                if ( me.hasExpired() )
                {
                    me.reset();
                }
            };
        }

        /**
         * Clears the number of requests made, updates the 'opened' datatime, and reschedules a function to perform the next reset
         */
        reset()
        {
            this.#opened = new Date();
            this.#nextReset = this.#interval.calculateNextReset( this.#opened );

            this.#numMade = 0;

            const me = this;
            setTimeout( me.timerFunction, this.#interval?.milliseconds );
        }

        /**
         * Records that a request subject to the limits defined by this window has been sent,
         * updating the number of requests made and therefore how the number remaining will be calculated.
         * Checks whether this window has expired and resets the instance first if necessary
         */
        increment()
        {
            if ( this.hasExpired() )
            {
                this.reset();
            }

            this.#numMade += 1;
        }

        /**
         * Returns the number of requests subject to the limits defined by this window
         * that have been made since this occurrence of the window was created or reset.
         * @returns {number} the number of requests subject to the limits defined by this window that have been made
         */
        get requestsMade()
        {
            if ( this.hasExpired() )
            {
                this.reset();
            }

            return asInt( this.#numMade );
        }

        /**
         * Returns the number of requests the API allows per the duration of time represented by this window
         * @returns {number} the number of requests the API allows per the duration of time represented by this window
         */
        get requestsAllowed()
        {
            return asInt( this.#numAllowed );
        }

        /**
         * Returns the number of requests that can be made to the API within the duration of time represented by this window
         * @returns {number} the number of requests that can be made to the API within the duration of time represented by this window
         */
        get requestsRemaining()
        {
            if ( this.hasExpired() )
            {
                this.reset();
            }

            return Math.max( 0, asInt( this.numAllowed ) - asInt( this.requestsMade ) );
        }

        /**
         * Returns the number of milliseconds to wait before sending a request to avoid exceeding the rate limit.
         * @returns {number} the number of milliseconds to wait before sending a request to avoid exceeding the rate limit
         */
        calculateDelay()
        {
            if ( this.requestsRemaining > 0 )
            {
                return 10; // 10 milliseconds
            }
            else
            {
                const nextReset = asDate( this.#nextReset || this.#interval.calculateNextReset( asDate( this.#opened ) ) ).getTime();
                return Math.max( 10, nextReset - (Date.now()) );
            }
        }

        /**
         * Returns true if the amount of time necessary to wait
         * before sending the request is less than the maximum delay allowed
         * before the request has to be queued for a later submission
         * @returns {boolean} true if we can send the request, false if we should queue it for a later submission
         */
        canSend()
        {
            return this.requestsRemaining > 0 || this.calculateDelay() <= asInt( this.maxDelayBeforeQueueing );
        }
    }

    /**
     * Represents the rate limits for a specific endpoint or group of endpoints.
     * These may be predefined if they are defined in API documentation or generated from HttpResponse headers.
     *
     */
    class RateLimits
    {
        /**
         * The rate-limit-group to which these limits apply.
         * This may be a single endpoint or a group of endpoints governed by the same rules.
         */
        #group;

        /**
         * The number of concurrent requests allowed.
         * Sometimes referred to as a "burst" limit,
         * this is the maximum number of requests that can be made 'simultaneously'
         * or within a very short period of time
         * that is less than the duration of the shortest defined rate-limit window
         */
        #burstLimit;

        /**
         * The number of requests allowed per second
         */
        #perSecond;

        /**
         * The number of requests allowed per minute
         */
        #perMinute;

        /**
         * The number of requests allowed per hour
         */
        #perHour;

        /**
         * The number of requests allowed per day
         */
        #perDay;

        /**
         * A map of the number of allowed requests per timespan by RequestInterval.
         * @type {Map<RequestInterval, number>}
         */
        #allowedPerInterval = new Map();

        /**
         * This is a map of RequestWindow objects by time-interval (i.e., "burst", "second", "minute", "hour", "day")
         * The RequestWindow objects are used to track and control when requests are actually sent
         */
        #windows = new Map();

        // noinspection OverlyComplexFunctionJS
        constructor( pGroup,
                     pBurstLimit = 10,
                     pPerSecond = 10,
                     pPerMinute = 250,
                     pPerHour = 15_000,
                     pPerDay = 360_000 )
        {
            this.#group = asString( pGroup, true );
            this.#burstLimit = asInt( pBurstLimit );
            this.#perSecond = asInt( pPerSecond );
            this.#perMinute = asInt( pPerMinute );
            this.#perHour = asInt( pPerHour );
            this.#perDay = asInt( pPerDay );

            this.#allowedPerInterval.set( RequestInterval.BURST, this.#burstLimit );
            this.#allowedPerInterval.set( RequestInterval.PER_SECOND, this.#perSecond );
            this.#allowedPerInterval.set( RequestInterval.PER_MINUTE, this.#perMinute );
            this.#allowedPerInterval.set( RequestInterval.PER_HOUR, this.#perHour );
            this.#allowedPerInterval.set( RequestInterval.PER_DAY, this.#perDay );
        }

        get group()
        {
            return asString( this.#group, true );
        }

        get burstLimit()
        {
            return Math.max( 1, asInt( this.#burstLimit ) );
        }

        get perSecond()
        {
            return Math.max( 1, asInt( this.#perSecond ) );
        }

        get perMinute()
        {
            return Math.max( 1, asInt( this.#perMinute ) );
        }

        get perHour()
        {
            return Math.max( 1, asInt( this.#perHour ) );
        }

        get perDay()
        {
            return Math.max( 1, asInt( this.#perDay ) );
        }

        get windows()
        {
            return new Map( this.#windows );
        }

        get allowedPerInterval()
        {
            return new Map( this.#allowedPerInterval || new Map() );
        }

        /**
         * Returns (or opens) a RequestWindow for this RateLimit group for the specified time interval
         * @param {RequestInterval|string|number} pInterval The time interval governed by the RequestWindow to be returned
         * @param {object} pOptions An object specifying or overriding properties associated with the Window to return
         * @returns {RequestWindow|any} The RequestWindow for this RateLimit group for the specified time interval
         */
        getRequestWindow( pInterval, pOptions = DEFAULT_HTTP_CLIENT_RATE_LIMITED_OPTIONS )
        {
            // resolve to the appropriate Map key type from the specified argument (which could be a string, number, or RequestInterval)
            const interval = RequestInterval.resolve( pInterval );

            // get ths currently active/open window
            let window = this.#windows.get( interval );

            if ( isNonNullObject( window ) )
            {
                if ( window.hasExpired() )
                {
                    window.reset();
                }
                return window;
            }

            const numAllowed = this.#allowedPerInterval.get( interval );

            window = new RequestWindow( interval, numAllowed, (pOptions || DEFAULT_HTTP_CLIENT_RATE_LIMITED_OPTIONS) );

            this.#windows.set( interval, window );

            return window;
        }

        getAllRequestWindows()
        {
            let map = new Map();

            for( let interval of RequestInterval.LIST )
            {
                map.set( interval, this.getRequestWindow( interval ) );
            }

            for( let key of Object.keys( this.#windows ) )
            {
                if ( !(map.has( key )) )
                {
                    map.set( key, this.#windows.get( key ) );
                }
            }

            return map.values();
        }

        increment()
        {
            let windows = this.getAllRequestWindows();

            if ( isNonNullObject( windows ) )
            {
                windows.forEach( window => window.increment() );
            }
        }

        calculateDelay()
        {
            let delay = 10;

            const windows = this.getAllRequestWindows();

            windows.forEach( window =>
                             {
                                 const windowDelay = asInt( window.calculateDelay() );
                                 delay = Math.max( delay, windowDelay );
                             } );

            return Math.min( Math.max( 10, delay ), 29_999 );
        }

        parseStandardsBasedRateLimits( pHeaderText )
        {
            const text = asString( pHeaderText );
            if ( !isBlank( text ) )
            {

            }

            return "TBD";
        }

        parseXBasedRateLimits( pHeaderText )
        {
            const quotas = new Map();

            const text = asString( pHeaderText );

            if ( !isBlank( text ) )
            {
                const rxBurst = /^(\d+)\s/; // used to get the burst limit which may or may not exist
                const rxOthers = /(\d+);w=(\d+)/g; // uses g flag to progress through the string

                let remainingText = text;

                let matches = rxBurst.exec( text );

                if ( matches )
                {
                    quotas.set( RequestInterval.BURST, asInt( matches[1] ) );
                    remainingText = asString( text.substring( matches[0].length ), true );
                }
                else
                {
                    // assume some limit
                    quotas.set( RequestInterval.BURST, 10 );
                }

                while ( !isNull( (matches = rxOthers.exec( remainingText )) ) )
                {
                    quotas.set( RequestInterval.resolve( asInt( matches[1] ) ), asInt( matches[2] ) );
                }
            }

            return quotas;
        }

        updateFromResponse( pHeaders, pResponse )
        {
            const me = this;

            const headers = isNonNullObject( pHeaders ) ? new HttpResponseHeaders( pHeaders ) : isNonNullObject( pResponse ) ? new HttpResponseHeaders( pResponse.headers ) : new Map();

            if ( isNonNullObject( headers ) )
            {
                const group = headers["X-RateLimit-Group"] || headers.get( "X-RateLimit-Group" );
                if ( lcase( asString( group, true ) ) === lcase( this.group ) )
                {
                    const limits = headers["X-RateLimit-Limit"] || headers.get( "X-RateLimit-Limit" );
                    if ( limits )
                    {
                        const parsed = this.parseXBasedRateLimits( limits );

                        if ( parsed && isMap( parsed ) )
                        {
                            const entries = objectEntries( parsed );
                            entries.forEach( entry =>
                                             {
                                                 const key = ObjectEntry.getKey( entry );
                                                 const value = ObjectEntry.getValue( entry );
                                                 const window = me.getRequestWindow( key );
                                                 window.numAllowed = asInt( value );
                                             } );
                        }
                    }
                }
            }
        }
    }

    RateLimits.parseLimitsHeader = function( pLimits )
    {
        let burst = 10;
        let perSecond = 10;
        let perMinute = 250;
        let perHour = 15_000;
        let perDay = 360_000;

        let limits = asString( pLimits, true ).replace( /^x-ratelimit-limit:\s*/i, _mt );

        if ( !isBlank( limits ) )
        {
            let parts = limits.split( _spc );

            if ( $ln( parts ) > 1 && isNumeric( parts[0] ) )
            {
                burst = asInt( parts.shift() );
            }

            for( let i = 0, n = $ln( parts ); i < n; i++ )
            {
                let part = parts[i];

                const vk = part.split( ";" );

                const v = asInt( vk[0] );
                const k = asString( $ln( vk ) > 1 ? vk[1] : "burst", true );

                const interval = RequestInterval.resolve( k );
                switch ( interval.milliseconds )
                {
                    case 0:
                    case 10:
                        burst = asInt( v );
                        break;

                    case MILLIS_PER.SECOND:
                        perSecond = asInt( v );
                        break;

                    case MILLIS_PER.MINUTE:
                        perMinute = asInt( v );
                        break;

                    case MILLIS_PER.HOUR:
                        perHour = asInt( v );
                        break;

                    case MILLIS_PER.DAY:
                        perDay = asInt( v );
                        break;
                }
            }
        }

        return { burst, perSecond, perMinute, perHour, perDay };
    };

    RateLimits.fromHeaders = function( pHeaders, pResponse )
    {
        const headers = isNonNullObject( pHeaders ) ? new HttpResponseHeaders( pHeaders ) : isNonNullObject( pResponse ) ? new HttpResponseHeaders( pResponse.headers ) : new Map();

        if ( isNonNullObject( headers ) )
        {
            let group = asString( headers["x-ratelimit-group"] || headers["X-RateLimit-Group"] || headers.get( "x-ratelimit-group" ) || headers.get( "X-RateLimit-Group" ), true );

            let limits = asString( headers["x-ratelimit-limit"] || headers["X-RateLimit-Limit"] || headers.get( "x-ratelimit-limit" ) || headers.get( "X-RateLimit-Limit" ), true );

            let
                {
                    burst = 10,
                    perSecond = 10,
                    perMinute = 250,
                    perHour = 15_000,
                    perDay = 360_000
                } = RateLimits.parseLimitsHeader( limits );

            return new RateLimits( group, burst, perSecond, perMinute, perHour, perDay );
        }

        return null;
    };

    class RequestQueue
    {
        #highPriorityQueue = new BoundedQueue( 25 );
        #normalPriorityQueue = new BoundedQueue( 25 );
        #lowPriorityQueue = new BoundedQueue( 25 );

        #processing = false;

        constructor()
        {
            //
        }

        getQueue( pPriority )
        {
            let priority = calculatePriority( pPriority );

            switch ( priority )
            {
                case PRIORITY.LOW:
                    return this.#lowPriorityQueue;

                case PRIORITY.HIGH:
                    return this.#highPriorityQueue;

                case PRIORITY.AUTO:
                    return this.#normalPriorityQueue;

                default:
                    return asInt( pPriority ) > 0 ? this.#highPriorityQueue : asInt( pPriority ) < 0 ? this.#lowPriorityQueue : this.#normalPriorityQueue;
            }
        }

        get queues()
        {
            return [this.#highPriorityQueue, this.#normalPriorityQueue, this.#lowPriorityQueue];
        }

        add( pQueuedRequest, pPriority )
        {
            if ( isNonNullObject( pQueuedRequest ) )
            {
                let priority = pPriority || pQueuedRequest.priority || calculatePriority( pQueuedRequest );
                priority = calculatePriority( priority ) || PRIORITY.AUTO;

                const queue = this.getQueue( priority );
                queue.enQueue( pQueuedRequest );
            }
        }

        remove( pQueuedRequest )
        {
            if ( isNonNullObject( pQueuedRequest ) )
            {
                let priority = pQueuedRequest.priority || calculatePriority( pQueuedRequest );
                priority = calculatePriority( priority ) || PRIORITY.AUTO;

                const queue = this.getQueue( priority );
                if ( queue )
                {
                    if ( queue.includes( pQueuedRequest ) )
                    {
                        return queue.remove( pQueuedRequest );
                    }
                }

                for( let q of this.queues )
                {
                    if ( q.includes( pQueuedRequest ) )
                    {
                        return q.remove( pQueuedRequest );
                    }
                }
            }
            else if ( isNonNullValue( pQueuedRequest ) )
            {
                for( let q of this.queues )
                {
                    if ( q.includes( pQueuedRequest ) )
                    {
                        let request = q.findById( pQueuedRequest );
                        if ( request )
                        {
                            return q.remove( pQueuedRequest );
                        }
                    }
                }
            }
            return null;
        }

        abort( pQueuedRequest )
        {
            // first remove it from the queue
            let request = this.remove( pQueuedRequest ) || pQueuedRequest;

            // try to abort it if possible
            if ( request && isFunction( request.abort ) )
            {
                attempt( () => request.abort() );
            }
        }

        async processQueue( pQueue, pHttpClient )
        {
            if ( isNull( pQueue ) || await pQueue.isEmpty() )
            {
                return 0;
            }

            let numProcessed = 0;

            const iterationCap = new IterationCap( 3 );

            while ( (await pQueue.canTake()) && !iterationCap.reached )
            {
                let queuedRequest = await pQueue.take();

                if ( queuedRequest && !queuedRequest.aborted )
                {
                    pHttpClient.sendRequest( resolveHttpMethod( queuedRequest.method ),
                                             cleanUrl( queuedRequest.url ),
                                             queuedRequest.config,
                                             queuedRequest.body,
                                             queuedRequest.resolve,
                                             queuedRequest.reject );
                    numProcessed += 1;
                }

                await sleep( 100 + (Math.random() * 10) );
            }

            iterationCap.reset();

            return numProcessed;
        }

        async process( pHttpClient )
        {
            if ( this.#processing || !isHttpClient( pHttpClient ) )
            {
                return;
            }

            this.#processing = true;

            let numProcessed = 0;

            let queues = [this.#highPriorityQueue, this.#normalPriorityQueue, this.#lowPriorityQueue];

            const me = this;

            for( let queue of queues )
            {
                numProcessed += await asyncAttempt( async() => await me.processQueue( queue, pHttpClient ) );
            }

            this.#processing = false;

            setTimeout( async function() { await me.process( pHttpClient ); }, 1_000 );

            return numProcessed;
        }
    }

    /**
     * Instances of this class define how to map a request or URL to a rate limit group name.
     *
     */
    class RequestGroupMapper
    {
        //simple map of url path part to group name
        #map = new Map();

        // a map of Regular Expression to group name
        #expressionMap = new Map();

        // the path part expected to directly precede the group-defining path part of a URL
        #apiPath = "api";

        constructor( pMap, pExpressionMap, pApiPath = "api" )
        {
            this.#map = asMap( pMap || new Map() );
            this.#expressionMap = asMap( pExpressionMap || pMap || new Map() );
            this.#apiPath = asString( pApiPath, true );
        }

        get map()
        {
            return lock( this.#map || new Map() );
        }

        get expressionMap()
        {
            return lock( this.#expressionMap || new Map() );
        }

        get apiPath()
        {
            return asString( this.#apiPath, true );
        }

        calculateGroupName( pRequestOrUrl )
        {
            if ( isNonNullObject( pRequestOrUrl ) )
            {
                let url = resolveUrl( pRequestOrUrl ).replace( /#\w*$/, _mt ).replace( /\?\w*$/, _mt );

                const parts = url.split( /\\\//i ).map( e => asString( e, true ) ).filter( e => !isBlank( e ) && "/" !== e );

                let path = this.extractPath( parts );

                let groupName = this.findGroupName( path );

                if ( isBlank( groupName ) )
                {
                    const entries = objectEntries( this.expressionMap );
                    for( let entry of entries )
                    {
                        const key = ObjectEntry.getKey( entry );

                        if ( isRegExp( key ) )
                        {
                            if ( key.test( path ) )
                            {
                                groupName = ObjectEntry.getValue( entry );
                                break;
                            }
                            else
                            {
                                for( let p of parts )
                                {
                                    if ( key.test( p ) )
                                    {
                                        groupName = ObjectEntry.getValue( entry );
                                        break;
                                    }
                                }
                            }
                        }

                        if ( !isBlank( groupName ) )
                        {
                            break;
                        }
                    }
                }

                return asString( groupName, true ) || asString( path, true ) || asString( url, true );
            }

            return _underscore;
        }

        findGroupName( pPath )
        {
            let groupName = _mt;

            if ( !isBlank( pPath ) )
            {
                groupName = this.map.get( pPath ) || this.map.get( lcase( pPath ) );
                groupName = !isBlank( groupName ) ? groupName : _mt;
            }

            return groupName;
        }

        extractPath( pParts )
        {
            let path = _mt;

            let parts = asArray( pParts ).map( asString ).filter( e => !isBlank( e ) && "/" !== e );
            let partsLowerCase = parts.map( lcase );

            let priorIndex = -1;

            if ( !isBlank( this.apiPath ) )
            {
                priorIndex = $ln( parts ) > 0 ? asInt( parts.lastIndexOf( this.apiPath ) ) : -1;
                priorIndex = priorIndex >= 0 ? priorIndex : $ln( partsLowerCase ) > 0 ? asInt( partsLowerCase.lastIndexOf( this.apiPath ) ) : -1;
            }

            if ( priorIndex >= 0 && priorIndex < ($ln( parts ) - 1) )
            {
                path = parts[priorIndex + 1];
            }

            return path;
        }
    }

    RequestGroupMapper.DEFAULT = new RequestGroupMapper( new Map(), new Map(), _mt );

    /**
     * Instances of this class decorate instances of HttpClient
     * and can be used anywhere an instance of HttpClient is expected
     */
    class RateLimitedHttpClient extends HttpClient
    {
        /**
         * Holds a Map of RateLimits objects by group/bucket
         */
        #rateLimitsMap = new Map();

        /**
         * Calculates the Rate Group from the request or URL
         */
        #requestGroupMapper;

        /**
         * The maximum number of milliseconds that this instance will wait
         * before sending a request versus queuing the request
         * @type {number}
         */
        #maxDelayBeforeQueueing = 2_500;

        /**
         * An object that handles queued requests
         * @type {RequestQueue}
         */
        #queuedRequests = new RequestQueue();

        /**
         * Constructs an instance of this class and wraps/decorates the specified HttpClient.
         * If constructed without a valid HttpClient, defaults to using an instance of HttpFetchClient
         * @param pConfig The default configuration for requests this client will send
         * @param pOptions An object specifying any values specific to this instance or its wrapped client
         * @param pDelegate An instance of HttpClient to decorate with rate-limit-aware behavior
         * @param pRateLimits One or more instances of RateLimits to define the limits for requests as per their 'group' or policy
         */
        constructor( pConfig, pOptions, pDelegate, ...pRateLimits )
        {
            super( pDelegate, pConfig, pOptions );

            this.#requestGroupMapper = this.options?.requestGroupMapper || RequestGroupMapper.DEFAULT;

            this.#maxDelayBeforeQueueing = clamp( asInt( this.options?.maxDelayBeforeQueueing, 2_500 ), 100, 10_000 );

            let arr = asArray( pRateLimits );
            arr.forEach( rateLimits =>
                         {
                             const key = asString( rateLimits.group, true );
                             this.#rateLimitsMap.set( key, rateLimits );
                         } );
        }

        get rateLimitsMap()
        {
            return lock( new Map( this.#rateLimitsMap || new Map() ) );
        }

        get requestGroupMapper()
        {
            return this.#requestGroupMapper || RequestGroupMapper.DEFAULT;
        }

        addRequestGroupMappings( pRequestGroupMapper )
        {
            let newMapper = (pRequestGroupMapper instanceof RequestGroupMapper) ? pRequestGroupMapper : null;

            if ( isNonNullObject( newMapper ) )
            {
                let oldMapper = this.requestGroupMapper || RequestGroupMapper.DEFAULT;

                let apiPath = newMapper.apiPath || oldMapper.apiPath;

                const newMap = concatMaps( oldMapper.map, newMapper.map );
                const newExpMap = concatMaps( oldMapper.expressionMap, newMapper.expressionMap );

                this.#requestGroupMapper = new RequestGroupMapper( newMap, newExpMap, apiPath );
            }
        }

        get maxDelayBeforeQueueing()
        {
            return Math.max( 100, Math.min( 10_000, asInt( this.#maxDelayBeforeQueueing, 2_500 ) ) );
        }

        get requestQueue()
        {
            return this.#queuedRequests || new RequestQueue();
        }

        getRateLimitsGroup( pRequestUrl, pGroupMapper, pConfig, pOptions )
        {
            let group = _mt;

            let mapper = pGroupMapper || pConfig?.requestGroupMapper || pOptions?.requestGroupMapper || this.requestGroupMapper;

            if ( isNonNullObject( mapper ) )
            {
                group = mapper.calculateGroupName( pRequestUrl );
            }

            group = isBlank( group ) ? asString( pRequestUrl?.url || pRequestUrl?.href || pRequestUrl, true ) : group;

            group = group.replace( /[#?][\w_,.\/\\{}()-]+$/, _mt );
            group = group.replace( /[#?][\w_,.\/\\{}()-]+$/, _mt );

            let apiPath = pConfig?.apiPath || pOptions.apiPath || _mt;

            if ( apiPath )
            {
                group = group.replace( new RegExp( "[\\w_,.\\/\\\\{}()-]+" + apiPath, "gi" ), _mt );
            }

            return asString( group, true );
        }

        getRateLimits( pGroup )
        {
            const group = asString( pGroup, true );

            let limits = this.#rateLimitsMap.get( group ) || this.#rateLimitsMap.get( lcase( group ) );

            if ( isNull( limits ) )
            {
                limits = new RateLimits( group );
                this.#rateLimitsMap.set( group, limits );
            }

            return limits;
        }

        addRateLimits( ...pRateLimits )
        {
            let arr = [...(asArray( pRateLimits || [] ) || [])];
            arr.forEach( rateLimits =>
                         {
                             const key = asString( rateLimits.group, true );
                             if ( isNull( this.#rateLimitsMap.get( key ) ) )
                             {
                                 this.#rateLimitsMap.set( key, rateLimits );
                             }
                         } );
        }

        calculateDelay( pGroup )
        {
            const rateLimits = this.getRateLimits( pGroup );
            return rateLimits.calculateDelay();
        }

        async sendRequest( pMethod, pUrl, pConfig, pBody, pRedirects, pRetries, pResolve, pReject )
        {
            const me = this;

            const delegate = this.delegate;

            const queue = this.requestQueue;

            const method = resolveHttpMethod( pMethod );

            // noinspection JSValidateTypes,TypeScriptUMDGlobal
            return new Promise( ( resolve, reject ) =>
                                {
                                    const group = me.getRateLimitsGroup( pUrl, me.requestGroupMapper, me.config, me.options );

                                    const delay = me.calculateDelay( group );

                                    if ( delay > asInt( me.maxDelayBeforeQueueing ) )
                                    {
                                        return me.queueRequest( method, pUrl, pConfig, pBody, (pResolve || resolve), (pReject || reject) );
                                    }
                                    else
                                    {
                                        const rateLimits = me.getRateLimits( group );

                                        const finallyFunction = async function()
                                        {
                                            queue.process( me );
                                        };

                                        const sendFunction = async() =>
                                        {
                                            const delegated = async function()
                                            {
                                                return asyncAttempt( async() => delegate.sendRequest( pUrl,
                                                                                                      pConfig,
                                                                                                      pBody,
                                                                                                      pRedirects,
                                                                                                      pRetries,
                                                                                                      pResolve || resolve,
                                                                                                      pReject || reject ) );
                                            };

                                            attempt( () => rateLimits.increment() );

                                            return asyncAttempt( delegated ).then( ( response ) =>
                                                                                   {
                                                                                       attempt( () => rateLimits.updateFromResponse( response?.headers, response ) );

                                                                                       // Ensure the promise chain is resolved
                                                                                       attempt( () => (pResolve || resolve)( response ) );

                                                                                       return response; // pass to the next handler

                                                                                   } ).catch( (pReject || reject || console.error) ).finally( finallyFunction );
                                        };

                                        sleep( delay ).then( sendFunction ).catch( (pReject || reject || console.error) ).finally( finallyFunction );

                                        // setTimeout for processing anything left in the queue
                                        setTimeout( finallyFunction, (delay * 2) );
                                    }
                                } );
        }

        async queueRequest( pMethod, pUrl, pConfig, pBody, pResolve, pReject )
        {
            const cfg = this.resolveConfig( pConfig, pUrl );

            const method = resolveHttpMethod( cfg.method || VERBS.GET );
            cfg.method = method || VERBS.GET;

            const url = this.resolveUrl( pUrl, cfg );
            cfg.url = url;

            const request = HttpRequest.resolve( pUrl || url, cfg );

            request.method = method;
            request.url = cleanUrl( request.url, true ) || url;
            request.priority = calculatePriority( request, cfg );

            cfg.priority = cfg.priority || request.priority;

            let resolve = isFunction( pResolve ) ? pResolve : no_op;
            let reject = isFunction( pReject ) ? pReject : no_op;

            cfg.abortController = cfg.abortController || request.abortContoller || new AbortController();
            request.abortContoller = request.abortContoller || cfg.abortController || new AbortController();

            this.#queuedRequests.add( new QueuedRequest( request, cfg, resolve, reject ) );
        }

        async sendGetRequest( pUrl, pConfig, pRedirects, pRetries, pResolve, pReject )
        {
            const { cfg, url } = await prepareRequestConfig( VERBS.GET, pConfig, pUrl );

            return this.sendRequest( VERBS.GET, url, cfg, null, pRedirects, pRetries, pResolve, pReject );
        }

        async getRequestedData( pUrl, pConfig, pRedirects, pRetries, pResolve, pReject )
        {
            const me = this;

            const { cfg, url } = await prepareRequestConfig( VERBS.GET, pConfig, pUrl, null );

            const responseData = await asyncAttempt( async() => await me.sendGetRequest( url, cfg, pRedirects, pRetries, pResolve, pReject ) );

            if ( ResponseData.isOk( responseData ) )
            {
                return await asyncAttempt( async() => await responseData.data || (isFunction( responseData.body ) ? await responseData.body() : responseData.body) );
            }
            else if ( ResponseData.is( "Error" ) || (isNonNullObject( responseData ) && responseData.isError()) )
            {
                const err = responseData?.error || getLastError();
                throw resolveError( err, err?.message || responseData?.statusText );
            }
            else if ( isNonNullObject( responseData ) )
            {
                let redirects = asInt( pRedirects );
                if ( redirects < Math.max( cfg.maxRedirects, 3 ) && responseData.isExceedsRateLimit() )
                {
                    // the sendRequest method should already be handling the rate limits, so
                    // this is just a sort of fallback to make a last ditch attempt to get the data
                    await sleep( (500 * (redirects + 1)) + (Math.random() * 100) );
                    return await asyncAttempt( async() => me.getRequestedData( url, cfg, ++redirects, pRetries, pResolve, pReject ) );
                }
            }

            // noinspection JSValidateTypes,TypeScriptUMDGlobal
            return new Promise( ( resolve, reject ) =>
                                {
                                    const group = me.getRateLimitsGroup( pUrl, me.requestGroupMapper, me.config, me.options );

                                    const delay = me.calculateDelay( group );

                                    if ( delay > asInt( me.maxDelayBeforeQueueing ) )
                                    {
                                        return me.queueRequest( VERBS.GET, url, cfg, null, (pResolve || resolve), (pReject || reject) );
                                    }
                                    else
                                    {
                                        const queue = me.requestQueue;

                                        const finallyFunction = async function()
                                        {
                                            queue.process( me );
                                        };

                                        const sendFunction = async() =>
                                        {
                                            const delegated = async function()
                                            {
                                                return asyncAttempt( async() => me.getRequestedData( url,
                                                                                                     cfg,
                                                                                                     0,
                                                                                                     0,
                                                                                                     pResolve || resolve,
                                                                                                     pReject || reject ) );
                                            };

                                            return asyncAttempt( delegated ).then( pResolve || resolve ).catch( pReject || reject ).finally( finallyFunction );
                                        };

                                        sleep( delay ).then( sendFunction ).catch( reject ).finally( finallyFunction );

                                        // setTimeout for processing anything left in the queue
                                        setTimeout( finallyFunction, (delay * 2) );
                                    }
                                } );
        }

        async sendPostRequest( pUrl, pConfig, pBody, pRedirects, pRetries, pResolve, pReject )
        {
            const
                {
                    cfg,
                    url,
                    body
                } = await prepareRequestConfig( VERBS.POST, pConfig, pUrl, await resolveBody( pBody, pConfig ) );

            return this.sendRequest( VERBS.POST, url, cfg, body, pRedirects, pRetries, pResolve, pReject );
        }

        async upload( pUrl, pConfig, pBody )
        {
            return this.sendPostRequest( pUrl, pConfig, pBody );
        }

        async sendPutRequest( pUrl, pConfig, pBody, pRedirects, pRetries, pResolve, pReject )
        {
            const {
                cfg,
                url,
                body
            } = await prepareRequestConfig( VERBS.PUT, pConfig, pUrl, await resolveBody( pBody, pConfig ) );

            return this.sendRequest( VERBS.PUT, url, cfg, body, pRedirects, pRetries, pResolve, pReject );
        }

        async sendPatchRequest( pUrl, pConfig, pBody, pRedirects, pRetries, pResolve, pReject )
        {
            const
                {
                    cfg,
                    url,
                    body
                } = await prepareRequestConfig( VERBS.PATCH, pConfig, pUrl, await resolveBody( pBody, pConfig ) );

            return this.sendRequest( VERBS.PATCH, url, cfg, body, pRedirects, pRetries, pResolve, pReject );
        }

        async sendDeleteRequest( pUrl, pConfig, pBody, pRedirects, pRetries, pResolve, pReject )
        {
            const
                {
                    cfg,
                    url,
                    body
                } = await prepareRequestConfig( VERBS.DELETE, pConfig, pUrl, await resolveBody( pBody, pConfig ) );

            return this.sendRequest( VERBS.DELETE, url, cfg, body, pRedirects, pRetries, pResolve, pReject );
        }

        async sendHeadRequest( pUrl, pConfig, pRedirects, pRetries, pResolve, pReject )
        {
            const { cfg, url } = await prepareRequestConfig( VERBS.HEAD, pConfig, pUrl );

            return this.sendRequest( VERBS.HEAD, url, cfg );
        }

        async sendOptionsRequest( pUrl, pConfig, pRedirects, pRetries, pResolve, pReject )
        {
            const { cfg, url } = await prepareRequestConfig( VERBS.OPTIONS, pConfig, pUrl );

            return this.sendRequest( VERBS.OPTIONS, url, cfg );
        }

        async sendTraceRequest( pUrl, pConfig, pRedirects, pRetries, pResolve, pReject )
        {
            const { cfg, url } = await prepareRequestConfig( VERBS.TRACE, pConfig, pUrl );

            return this.sendRequest( VERBS.TRACE, url, cfg );
        }
    }

    function createRateLimitedHttpClient( pHttpClient, pConfig, pOptions, ...pRateLimits )
    {
        let client = pHttpClient || new HttpFetchClient( pConfig, pOptions );

        let options = { ...(toObjectLiteral( HttpClientApiConfig.getDefaultConfig() )), ...(pOptions || {}) };

        let cfg = resolveApiConfig( pConfig );

        if ( isHttpClient( client ) )
        {
            return new RateLimitedHttpClient( cfg, options, client, ...pRateLimits );
        }

        return new RateLimitedHttpClient( cfg, options, new HttpFetchClient( cfg, options ), ...pRateLimits );
    }


    /**
     * A class to throttle request frequency for LeadDocket REST API calls,
     * ensuring adherence to defined rate limits
     * and providing utilities to calculate delays and manage reset times.
     *
     * The throttler enforces the specified maximum number of requests allowed per time period.
     * The time period and request max are configurable, with clamping for reasonable values.
     *
     * Key Features:
     * - Rate limiting based on configurable maximum requests and reset periods.
     * - Methods to calculate delays needed to stay within limits.
     * - Tracks request history including the last request timestamp.
     * - Determines reset intervals and time until the next reset.
     */
    class SimpleRequestThrottler
    {
        // Endpoints to which this applies
        // Defaults to all endpoints
        #endpoints = [/\w+/g];

        // per minute
        #rateLimitPeriod = 60_000;

        // 250 requests per minute
        #maxRequestsUntilReset = 250;

        // the timestamp that THIS minute began
        #lastResetTime = Date.now();

        // the time at which the NEXT minute will start
        #nextResetTime = Date.now() + 60_000;

        // when was the last request made
        #lastRequestExecuted = Date.now();

        // how many have we made sp far during THIS minute?
        #requestsSince = 0;

        // the logger used to write messages to the console or another destination
        #logger = konsole;

        #debugLevel = 0;

        /**
         * Creates an instance of the request throttler.
         *
         * @param {number} [pMaxRequests=250]           Maximum number of requests allowed within the rate limit period.
         * @param {number} [pPerMilliseconds=60000]     Duration of the rate limit period in milliseconds.
         * @param {Object} [pLogger=console]            Logger instance used for logging, defaults to the console.
         *
         * @param {...string} [pEndPoints=[/\w+/g]]     One or more patterns (as RegExp)
         *                                              the url must match for these rate limits to apply
         *
         * @return {SimpleRequestThrottler}             A new instance of the request throttler
         *
         * @constructor
         */
        constructor( pMaxRequests = 250, pPerMilliseconds = 60_000, pLogger = konsole, ...pEndPoints )
        {
            this.#rateLimitPeriod = Math.max( 1, asInt( pPerMilliseconds ) || 60_000 );

            this.#maxRequestsUntilReset = Math.max( (asInt( pMaxRequests ) || 250), (asInt( this.#rateLimitPeriod ) / 250) );

            this.#lastResetTime = Date.now();

            this.#nextResetTime = (this.#lastResetTime + this.#rateLimitPeriod);

            this.#logger = ToolBocksModule.isLogger( pLogger ) ? pLogger : console;

            if ( pEndPoints )
            {
                const endpoints = asArray( pEndPoints ).filter( isRegExp );
                this.#endpoints = [...(asArray( endpoints ).map( localCopy ))];
            }
        }

        get debug()
        {
            return asInt( this.#debugLevel ) > 0;
        }

        set debugLevel( pLevel )
        {
            // this one goes to 11
            this.#debugLevel = clamp( asInt( pLevel ), 0, 11 );
        }

        get debugLevel()
        {
            return clamp( asInt( this.#debugLevel ), 0, 11 );
        }

        get logger()
        {
            this.#logger = ToolBocksModule.isLogger( this.#logger ) ? this.#logger : konsole;
        }

        set logger( pLogger )
        {
            this.#logger = ToolBocksModule.isLogger( pLogger ) ? pLogger : this.logger || konsole;
        }

        get endpoints()
        {
            return [...(asArray( this.#endpoints ).map( immutableCopy ))];
        }

        addEndpoint( pRegExp )
        {
            if ( isRegExp( pRegExp ) )
            {
                this.#endpoints.push( pRegExp );
                this.#endpoints = unique( this.#endpoints );
            }
        }

        removeEndpoint( pRegExp )
        {
            // TODO;
        }

        /**
         * Returns the configured rate limit period for requests in milliseconds.
         *
         * The value is clamped between 1,000 milliseconds (1 second) and
         * 86,400,000 milliseconds (1 day) to ensure valid input.
         *
         * @return {number} The rate limit period in milliseconds.
         */
        get rateLimitPeriod()
        {
            // we only support requests-per-second, per-minute, per-hour, or per-day,
            // so we clamp the value between 1,000 milliseconds (1 second) and 86,400,000 milliseconds (1 day)
            return clamp( asInt( this.#rateLimitPeriod ), 1_000, 86_400_000 );
        }

        /**
         * Returns the maximum number of requests that can be made until the reset period,
         * clamped between a minimum value of 10 and a calculated upper limit based on the rate limit period.
         *
         * The method assumes:
         * - At least 10 requests can be made per second for shorter rate periods (1 second).
         * - For rate periods of 1 minute or greater, the maximum number of requests allowed per minute
         *   is capped at 250, and scales accordingly with the length of the rate period.
         *
         * @return {number} The clamped maximum number of requests allowed until the reset period.
         */
        get maxRequestsUntilReset()
        {
            // This is kind of cryptic, so let's break this down.
            // We assume that we can make at least 10 requests per-N,
            // because the shortest rate period we support is 1 second,
            // and we expect to be able to make 10 requests per second.
            //
            // However, if the rate period is 1 minute or more,
            // we assume we can make no more than 250 requests per minute.
            // Therefore, we divide the rate limit by the number of milliseconds in one minute
            // and multiply that by 250 to get the upper limit.
            // example:  if rate limit is 3,600,000 (one hour),
            // 250 * (3,600,000 / 60,000) = 15,000 requests per hour, which adheres to the expectations

            return clamp( asInt( this.#maxRequestsUntilReset ), 10, (250 * (asInt( this.#rateLimitPeriod ) / 60_000)) );
        }

        /**
         * Returns the timestamp of the last executed request as an integer.
         *
         * The timestamp is derived from converting the stored date of the last request
         * into milliseconds since the Unix epoch.
         *
         * @return {number} The timestamp of the last executed request in milliseconds.
         */
        get lastRequestExecuted()
        {
            const lastExecution = asInt( new Date( this.#lastRequestExecuted ).getTime() );

            if ( this.debugLevel > 5 )
            {
                const me = this;
                attempt( () => (me || this).#logger.log( "Last Request executed:", new Date( lastExecution ).toLocaleString() ) );
            }

            return lastExecution;
        }

        /**
         * Sets the value of the last request was executed.
         *
         * @param {number|string|Date} pTimestamp -  The value to set for the last request executed.
         *                                           Can be a timestamp (number), a date string, or a Date object.
         *                                           If not provided, the current date and time will be used.
         */
        set lastRequestExecuted( pTimestamp )
        {
            this.#lastRequestExecuted = asInt( new Date( pTimestamp || Date.now() ).getTime() );
        }

        /**
         * Returns the last reset time of the instance.
         * The returned value is adjusted to ensure it is not later than the current time.
         *
         * @return {number} The last reset time as a timestamp in milliseconds,
         *                  clamped to no later than the current system time.
         */
        get lastResetTime()
        {
            // it cannot have been later than now, so we take the minimum of the value and now
            const lastReset = Math.min( asInt( this.#lastResetTime ), Date.now() );

            if ( this.debugLevel > 5 )
            {
                const me = this;
                attempt( () => (me || this).#logger.log( "Last Reset:", new Date( lastReset ).toLocaleString() ) );
            }

            return lastReset;
        }

        /**
         * Returns the number of requests made since the last time this instance was reset.
         *
         * Ensures the value returned is not less than zero
         * by taking the maximum of zero and the recorded value.
         *
         * @return {number} The count of requests, guaranteed to be zero or a positive integer.
         */
        get requestsSince()
        {
            // it cannot have been less than 0, so we take the maximum of 0 and the recorded value
            const numRequests = Math.max( 0, asInt( this.#requestsSince ) );

            if ( this.debugLevel > 5 )
            {
                const me = this;
                attempt( () => (me || this).#logger.log( "Number of Request since last reset:", numRequests ) );
            }

            return numRequests;
        }

        /**
         * Returns the next reset time for this instance.
         *
         * @return {number} The next reset time as an integer.
         *                  If not previously set, the value is calculated dynamically.
         *
         *  @see SimpleRequestThrottler#calculateNextResetTime
         */
        get nextResetTime()
        {
            const nextReset = asInt( this.#nextResetTime ) || this.calculateNextResetTime();

            if ( this.debugLevel > 5 )
            {
                const me = this;
                attempt( () => (me || this).#logger.log( "Next Reset expected:", new Date( nextReset ).toLocaleString() ) );
            }

            return nextReset;
        }

        /**
         * Calculates the next reset time for the instance.
         * This is done by adding the rate limit period to the last reset time for the instance.
         * Both the last reset time and rate limit period are expected to be in milliseconds.
         *
         * @return {number} The next reset time in milliseconds since epoch.
         */
        calculateNextResetTime()
        {
            // we reset every x milliseconds, where x is the rateLimitPeriod,
            // so we add that many milliseconds to the last time this instance was reset
            const nextReset = asInt( this.lastResetTime ) + asInt( this.rateLimitPeriod );

            if ( this.debugLevel > 5 )
            {
                const me = this;
                attempt( () => (me || this).#logger.log( "Next Reset will occur at:", new Date( nextReset ).toLocaleString() ) );
            }

            return nextReset;
        }

        /**
         * Calculates the number of milliseconds remaining until the next reset time.
         * If the next reset time has already passed, the method returns 0.
         *
         * @return {number} The number of milliseconds until the next reset, or 0 if the reset time is in the past.
         */
        get millisecondsUntilReset()
        {
            // if the next reset time has already passed, we return 0,
            // because we cannot wait for less than 0 milliseconds unless we have a time machine
            const millisUntilReset = Math.max( 0, this.nextResetTime - Date.now() );

            if ( this.#debugLevel > 3 )
            {
                const me = this;
                attempt( () => (me || this).#logger.log( "Milliseconds until next reset:", millisUntilReset ) );
            }

            return millisUntilReset;
        }

        /**
         * Calculates and returns the delay (in milliseconds)
         * needed to ensure compliance with the request rate limits.
         *
         * The method determines the delay based on the time elapsed since the last request,
         * the maximum number of requests allowed within the given period,
         * and the time remaining until the reset of the rate limit.
         *
         * The value returned ensures that the requests do not exceed defined thresholds
         * while minimizing unnecessary delays.
         *
         * @return {number} The calculated delay in milliseconds to maintain compliance with rate limits.
         */
        calculateDelay()
        {
            // We set a default delay to avoid exceeding 10 requests per second
            // because the API limits requests to <= 10 per second as well as <= 250 per minute.
            //
            // Rather than blindly assume we have to wait for 100 milliseconds,
            // we check the time the last request was made.
            //
            // If the last request was made >= 100 milliseconds ago, we can make the next request "right away".
            // However, for safety, we wait for 10 milliseconds in that case.

            // The last request had to have occurred in the past, so now - that time cannot be less than 0
            const elapsedTimeSinceLastRequest = Math.max( 0, asInt( Date.now() ) - asInt( this.lastRequestExecuted ) );

            // if the last request was more than 100 milliseconds ago,
            // we wait 10 milliseconds per request we have made instead (up to 100 milliseconds)
            // this helps prevents exceeding the 'burst' limit
            let delay = elapsedTimeSinceLastRequest >= 100 ? Math.min( 100, (10 * this.requestsSince) ) : 100;

            // If we have not yet reached the request-per-N limit
            // or the time since the last request was already more than N milliseconds ago,
            // we return the default delay
            if ( (this.requestsSince < this.maxRequestsUntilReset) || (elapsedTimeSinceLastRequest > this.#rateLimitPeriod) )
            {
                return delay;
            }
            else
            {
                delay = Math.max( delay, this.millisecondsUntilReset );

                if ( this.debugLevel > 2 )
                {
                    const me = this;
                    attempt( () => (me || this).#logger.log( "Calculated Delay before next Request:", delay, "milliseconds" ) );
                }
            }

            return clamp( asInt( delay ), 10, this.rateLimitPeriod );
        }

        /**
         * Increments the count of requests made by updating internal state.
         * Resets the count if the time elapsed since the last reset exceeds the rate limit period.
         * Updates the timestamp of the last executed request.
         *
         * @return {void} Does not return a value.
         */
        increment()
        {
            if ( (asInt( Date.now() ) - asInt( this.lastResetTime )) > asInt( this.rateLimitPeriod ) )
            {
                this.reset();
            }

            this.lastRequestExecuted = Date.now();
            this.#requestsSince += 1;
        }

        /**
         * Resets the internal state of the object by updating the last reset time, next reset time,
         * last executed request time, and request count.
         *
         * @return {void} Does not return a value.
         */
        reset()
        {
            this.#lastResetTime = Date.now();
            this.#nextResetTime = this.calculateNextResetTime();
            this.lastRequestExecuted = this.#lastResetTime;
            this.#requestsSince = 0;

            if ( this.debugLevel > 9 )
            {
                const state =
                    {
                        lastReset: this.#lastResetTime,
                        nextReset: this.#nextResetTime,
                    };

                const me = this;
                attempt( () => (me || this).#logger.log( "Throttler State:", state ) );
            }
        }
    }


    let mod =
        {
            dependencies:
                {
                    http,
                    https,
                    core,
                    moduleUtils,
                    sleep,
                    constants,
                    typeUtils,
                    stringUtils,
                    arrayUtils,
                    datesModule,
                    DateUtils,
                    jsonUtils,
                    entityUtils,
                    BockNamed,
                    httpConstants,
                    HttpStatus,
                    httpHeaders,
                    httpRequestModule,
                    HttpRequest,
                    httpResponseModule,
                    HttpResponse,
                    responseDataModule,
                    ResponseData
                },
            classes:
                {
                    ModuleEvent,
                    ToolBocksModule,
                    ObjectEntry,
                    BoundedQueue,
                    BockNamed,
                    HttpStatus,
                    HttpRequestHeaders,
                    HttpResponseHeaders,
                    HttpRequest,
                    HttpResponse,
                    ResponseData,
                    HttpAgentConfig,
                    HttpClientConfig,
                    OauthSecrets,
                    TenantSecrets,
                    ApiProperties,
                    ApiExtendedProperties,
                    HttpClientApiConfig,
                    QueuedRequest,
                    RequestQueue,
                    RequestInterval,
                    RequestWindow,
                    RateLimits,
                    RequestGroupMapper,
                    HttpClient,
                    HttpFetchClient,
                    RateLimitedHttpClient,
                    SimpleRequestThrottler
                },
            HttpAgentConfig,
            httpAgent,
            httpsAgent,
            fixAgents,

            HttpClientConfig,
            OauthSecrets,
            TenantSecrets,
            ApiProperties,
            ApiExtendedProperties,

            HttpClientApiConfig,
            resolveConfig,
            resolveApiConfig,

            mergeConfig,

            resolveUrl,
            resolveBody,

            isHttpClient,
            prepareRequestConfig,

            extractFileNameFromHeader,

            HttpClient,
            HttpFetchClient,
            RateLimitedHttpClient,

            RequestInterval,
            RequestWindow,
            RateLimits,

            RequestGroupMapper,
            createRateLimitedHttpClient,

            SimpleRequestThrottler
        };

    mod = toolBocksModule.extend( mod );

    return mod.expose( mod, INTERNAL_NAME, (_ud !== typeof module ? module : mod) ) || mod;

}());
