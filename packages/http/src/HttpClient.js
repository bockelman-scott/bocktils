/**
 * @overview
 *
 * This file defines classes for handling HTTP Requests,
 * especially those to API endpoints that impose Rate Limits.
 *
 * Its dependencies are limited to those exposed by other @toolbocks modules or that are built in to node.js.
 *
 *
 */

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
 * Imports the HttpRequest mode for the request facade and associated utility functions required
 */
const httpRequestModule = require( "./HttpRequest.cjs" );

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

/**
 * This is the IIFE that defines the classes, variables, and functions that are exported as a module.
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

    // import the specific modules from @toolbocks/core that are necessary for this module
    const { moduleUtils, constants, typeUtils, stringUtils, arrayUtils } = core;

    // import the classes, variables, and function defined in moduleUtils that are used in this module
    const
        {
            ModuleEvent,
            ToolBocksModule,
            ObjectEntry,
            IterationCap,
            populateOptions,
            attempt,
            asyncAttempt,
            resolveError,
            getLastError,
            lock,
            localCopy,
            objectEntries,
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
            MILLIS_PER
        } = constants;

    // import the useful functions from the core module, TypeUtils
    const
        {
            isNull,
            isNonNullObject,
            isFunction,
            isError,
            isString,
            isNumber,
            isNumeric,
            isDate,
            isJson,
            isRegExp,
            toObjectLiteral,
            clamp
        } = typeUtils;

    // import the useful functions from the core module, StringUtils
    const { asString, asInt, isBlank, cleanUrl, lcase, ucase } = stringUtils;

    // import the useful functions from the core module, ArrayUtils
    const { asArray, BoundedQueue } = arrayUtils;

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
        VERBS,
        PRIORITY,
        resolveHttpMethod,
        calculatePriority,
        HttpStatus,
        STATUS_CODES,
        STATUS_TEXT,
        STATUS_TEXT_ARRAY
    } = httpConstants;

    // define module-level constants
    const MIN_TIMEOUT_MILLISECONDS = 10_000; // 10 seconds
    const MAX_TIMEOUT_MILLISECONDS = 60_000; // 60 seconds, or 1 minute
    const DEFAULT_TIMEOUT_MILLISECONDS = 30_000; // 30 seconds

    const MIN_CONTENT_LENGTH = 64_000; // 64 KBs
    const DEFAULT_CONTENT_LENGTH = 256_000; // 256 KBs
    const MAX_CONTENT_LENGTH = 200_000_000; // 200 MBs

    const MIN_REDIRECTS = 3;
    const MAX_REDIRECTS = 10;
    const DEFAULT_REDIRECTS = 5;

    // import the HttpRequest (facade) class we use to provide a uniform interface for HTTP Requests
    const { HttpRequest } = httpRequestModule;

    /**
     * This class is used to define the configuration of an Http (or Https) Agent.
     * Notably, this class exposes properties for whether to use keepAlive, and if so, for how long.
     */
    class HttpAgentConfig
    {
        #keepAlive = true;
        #keepAliveMsecs = 10_000;
        #maxFreeSockets = 256;
        #maxTotalSockets = Infinity;
        #rejectUnauthorized = false;

        constructor( pKeepAlive = true,
                     pKeepAliveMilliseconds = 10_000,
                     pMaxFreeSockets = 256,
                     pMaxTotalDockets = Infinity,
                     pRejectUnauthorized = false )
        {
            this.#keepAlive = !!pKeepAlive;
            this.#keepAliveMsecs = Math.max( 1_000, Math.min( asInt( pKeepAliveMilliseconds ), 300_000 ) );
            this.#maxFreeSockets = Math.max( Math.min( asInt( pMaxFreeSockets, 256 ) ) );
            this.#maxTotalSockets = asInt( pMaxTotalDockets ) > 0 && asInt( pMaxTotalDockets ) > asInt( pMaxFreeSockets ) ? asInt( pMaxTotalDockets ) : Infinity;
            this.#rejectUnauthorized = !!pRejectUnauthorized;
        }

        get keepAlive()
        {
            return !!this.#keepAlive;
        }

        get keepAliveMsecs()
        {
            return Math.max( 1_000, Math.min( asInt( this.#keepAliveMsecs ), 300_000 ) );
        }

        get maxFreeSockets()
        {
            return Math.max( Math.min( asInt( this.#maxFreeSockets, 256 ) ) );
        }

        get maxTotalSockets()
        {
            const maxTotal = asInt( this.#maxTotalSockets );
            return asInt( maxTotal ) > 0 && asInt( maxTotal ) > asInt( this.maxFreeSockets ) ? asInt( maxTotal ) : Infinity;
        }

        get rejectUnauthorized()
        {
            return !!this.#rejectUnauthorized;
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

    // creates an instance of configuration properties for the http and http agents using the class defaults
    const httpAgentConfig = new HttpAgentConfig();

    // create a global instance of http.Agent
    const httpAgent = new http.Agent( httpAgentConfig.toObjectLiteral() );

    // create a global instance of https.Agent
    const httpsAgent = new https.Agent( httpAgentConfig.toObjectLiteral() );

    /**
     * This function is used to ensure that no configuration has inadvertantly replaced the http and/or https agents with object literals.
     * @param {Object} pConfig the configuration to examine and potentially repair, if necessary
     * @returns {Object} the same configuration object specified,
     * but with the http and http agent properties corrected, if necessary,
     * to hold actual instances of http.Agent or https.Agent.
     */
    function fixAgents( pConfig )
    {
        if ( (isNull( pConfig.httpAgent ) || !(pConfig.httpAgent instanceof http.Agent)) )
        {
            pConfig.httpAgent = httpAgent || new http.Agent( httpAgentConfig.toObjectLiteral() );
        }

        if ( (isNull( pConfig.httpsAgent ) || !(pConfig.httpsAgent instanceof https.Agent)) )
        {
            pConfig.httpsAgent = httpsAgent || new https.Agent( httpAgentConfig.toObjectLiteral() );
        }

        return pConfig;
    }

    /**
     * This class can be used to define the configuration expected for an instance of HttpClient (or one of its subclasses).
     * Not all properties are relevant to all instances of HttpClient.
     * This class is intended to provide values expected by either the Axios library or the Fetch API.
     */
    class HttpClientConfig
    {
        #allowAbsoluteUrls = true;
        #timeout = DEFAULT_TIMEOUT_MILLISECONDS;
        #maxContentLength = MAX_CONTENT_LENGTH;
        #maxBodyLength = MAX_CONTENT_LENGTH;
        #maxRedirects = DEFAULT_REDIRECTS;
        #decompress = true;

        #httpAgent = httpAgent;
        #httpsAgent = httpsAgent;

        // noinspection OverlyComplexFunctionJS
        constructor( pHttpAgent,
                     pHttpsAgent,
                     pAllowAbsoluteUrls,
                     pTimeout,
                     pMaxContentLength,
                     pMaxBodyLength,
                     pMaxRedirects,
                     pDecompress )
        {
            this.#httpAgent = isNonNullObject( pHttpAgent ) && pHttpAgent instanceof http.Agent ? pHttpAgent : httpAgent || new http.Agent( new HttpAgentConfig().toObjectLiteral() );
            this.#httpsAgent = isNonNullObject( pHttpsAgent ) && pHttpsAgent instanceof https.Agent ? pHttpsAgent : httpsAgent || new https.Agent( new HttpAgentConfig().toObjectLiteral() );

            this.#allowAbsoluteUrls = !!pAllowAbsoluteUrls;
            this.#timeout = clamp( asInt( pTimeout ), MIN_TIMEOUT_MILLISECONDS, MAX_TIMEOUT_MILLISECONDS );
            this.#maxContentLength = clamp( asInt( pMaxContentLength ), MIN_CONTENT_LENGTH, MAX_CONTENT_LENGTH );
            this.#maxBodyLength = clamp( asInt( pMaxBodyLength ), MIN_CONTENT_LENGTH, MAX_CONTENT_LENGTH );
            this.#maxRedirects = clamp( asInt( pMaxRedirects ), MIN_REDIRECTS, MAX_REDIRECTS );

            this.#decompress = !!pDecompress;
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

    /**
     * This class can be used to define the configuration expected for an instance of HttpClient (or one of its subclasses)
     * that will be used to communicate with a specific external API.
     * Not all properties are relevant to all instances of HttpClient or every possible API.
     * This class is intended to provide values expected by most APIs, including those that require frequent refresh of an access token.
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
         * @param {http.Agent} pHttpAgent The http.Agent to use, defining the keepAlive characteristics for the HTTP connection(s)
         * @param {https.Agent} pHttpsAgent  The https.Agent to use, defining the keepAlive characteristics for the SSL/HTTPS connection(s)
         * @param {boolean} pAllowAbsoluteUrls Whether to allow absolute URLS or only relative URLs
         * @param {number} pTimeout The time, in milliseconds, to wait for a response before assuming the request has been aborted or has failed
         * @param {number} pMaxContentLength The maximum size, in bytes, any request can be for the associated HttpClient
         * @param {number} pMaxBodyLength The maximum size, in bytes, the body of any request can be for the associated HttpClient
         * @param {number} pMaxRedirects The maximum number of redirects the HttpClient will follow to return a response
         * @param {number} pDecompress Whether to unzip or otherwise inflate compressed content/responses
         * @param {String} pApiKey The API Key to use to authenticate to the external API and/or authorize the requests
         * @param {String|Object} pAccessToken The Access Token to use to authenticate to the external API and/or authorize the requests
         * @param {String} pPersonalAccessToken The Personal Access Token to use to get an access token
         * @param {String} pClientId The Client ID to use in conjunction with an OAUTH/OAUTH2 to authenticate and/or get an access token
         * @param {String} pClientSecret The Client Secret to use in conjunction with an OAUTH/OAUTH2 to authenticate and/or get an access token
         * @param {String|URL} pAccessTokenUrl The URL (or url string/path) to the endpoint to get an access token
         * @param {String} pOrgId The organization ID, if required, to pass to API endpoints for APIs/endpoint that expect one
         * @param {String} pUserId The user ID, if required, to pass to API endpoints for APIs/endpoint that expect one
         */
        // noinspection OverlyComplexFunctionJS
        constructor( pHttpAgent, pHttpsAgent, pAllowAbsoluteUrls, pTimeout, pMaxContentLength, pMaxBodyLength, pMaxRedirects, pDecompress, pApiKey, pAccessToken, pPersonalAccessToken, pClientId, pClientSecret, pAccessTokenUrl, pOrgId, pUserId )
        {
            super( pHttpAgent, pHttpsAgent, pAllowAbsoluteUrls, pTimeout, pMaxContentLength, pMaxBodyLength, pMaxRedirects, pDecompress );

            this.#apiKey = pApiKey;
            this.#accessToken = pAccessToken;
            this.#personalAccessToken = pPersonalAccessToken;
            this.#clientId = pClientId;
            this.#clientSecret = pClientSecret;
            this.#accessTokenUrl = pAccessTokenUrl;
            this.#orgId = pOrgId;
            this.#userId = pUserId;
        }

        // noinspection OverlyComplexFunctionJS
        /**
         * Creates a new instance from an existing instance of HttpClientConfig
         *
         * @param {HttpClientConfig} pHttpClientConfig An existing instance of HttpClientConfig from which to build an instance of HttpClientApiConfig
         * @param {String} pApiKey The API KEY necessary to authenticate/authorize requests to the target API
         * @param {String|Object} pAccessToken The Access Token (string or JWT) required to authenticate/authorize requests to the target API
         * @param {String} pPersonalAccessToken The Personal Access Token required to get an Access Token
         * @param {String} pClientId The client ID to use when getting an Access Token
         * @param {String} pClientSecret The client Secret to use when getting an Access Token
         * @param {String|URL} pAccessTokenUrl The URL to use to get or refresh the Access Token
         * @param {String} pOrgId The organization ID value required with each request
         * @param {String} pUserId The user ID value required with each request
         */
        static fromHttpClientConfig( pHttpClientConfig,
                                     pApiKey,
                                     pAccessToken,
                                     pPersonalAccessToken,
                                     pClientId,
                                     pClientSecret,
                                     pAccessTokenUrl,
                                     pOrgId,
                                     pUserId )
        {
            let cfg = new HttpClientApiConfig( pHttpClientConfig.httpAgent,
                                               pHttpClientConfig.httpsAgent,
                                               pHttpClientConfig.allowAbsoluteUrls,
                                               pHttpClientConfig.timeout,
                                               pHttpClientConfig.maxContentLength,
                                               pHttpClientConfig.maxBodyLength,
                                               pHttpClientConfig.maxRedirects,
                                               pHttpClientConfig.decompress,
                                               pApiKey,
                                               pAccessToken,
                                               pPersonalAccessToken,
                                               pClientId,
                                               pClientSecret,
                                               pAccessTokenUrl,
                                               pOrgId,
                                               pUserId
            );

            return fixAgents( cfg );
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

        toObjectLiteral()
        {
            return toObjectLiteral( this );
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
         * If the specified object looks like:
         *
         * {
         *     "api_key:"apiKey",
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
     * @returns {Object} an object literal holding the properties defined in the default HttpClientApiConfig
     * @param pApiKey
     * @param pAccessToken
     * @param pPersonalAccessToken
     * @param pClientId
     * @param pClientSecret
     * @param pTokenUrl
     * @param pOrgId
     * @param pUserId
     * @returns {Object}
     */
    HttpClientApiConfig.getDefaultConfig = function( pApiKey, pAccessToken, pPersonalAccessToken, pClientId, pClientSecret, pTokenUrl, pOrgId, pUserId )
    {
        let cfg = HttpClientApiConfig.fromHttpClientConfig( DEFAULT_CONFIG, pApiKey, pAccessToken, pPersonalAccessToken, pClientId, pClientSecret, pTokenUrl, pOrgId, pUserId );
        return fixAgents( cfg );
    };

    /**
     * Combines the specified configuration with the default configuration
     * @param {Object} pConfig the configuration to combine with the default configuration.
     *                         When the specified configuration has a value for a property defined in the defauly=t configuration,
     *                         the value in the specified configuration is returned in the resulting configuration object.
     * @returns {Object} An object combining the specified configuration with the default configuration
     */
    function resolveConfig( pConfig )
    {
        let cfg = populateOptions( toObjectLiteral( pConfig || {} ), toObjectLiteral( DEFAULT_CONFIG ) );
        return fixAgents( toObjectLiteral( cfg ) );
    }

    /**
     * Combines the specified configuration with the default configuration and the values (optionally) provided
     * @param {Object} pConfig the configuration to combine with the default configuration.
     *                         When the specified configuration has a value for a property defined in the defauly=t configuration,
     *                         the value in the specified configuration is returned in the resulting configuration object.
     *
     *
     *
     * @param pApiKey
     * @param pAccessToken
     * @param pPersonalAccessToken
     * @param pClientId
     * @param pClientSecret
     * @param pTokenUrl
     * @param pOrgId
     * @param pUserId
     *
     * @returns {Object} An object combining the specified configuration with the default configuration
     */
    function resolveApiConfig( pConfig, pApiKey, pAccessToken, pPersonalAccessToken, pClientId, pClientSecret, pTokenUrl, pOrgId, pUserId )
    {
        let cfg = resolveConfig( pConfig );

        let apiCfg = HttpClientApiConfig.fromHttpClientConfig( cfg,
                                                               pApiKey || cfg?.apiKey || pAccessToken || cfg?.accessToken,
                                                               pAccessToken || cfg.accessToken,
                                                               pPersonalAccessToken || cfg.personalAccessToken,
                                                               pClientId || cfg?.clientId || cfg?.client?.id,
                                                               pClientSecret || cfg?.clientSecret || cfg.client?.secret,
                                                               pTokenUrl || cfg.tokenUrl,
                                                               pOrgId || cfg?.orgId || cfg?.org?.id,
                                                               pUserId || cfg?.userId || cfg?.user?.id );

        return fixAgents( toObjectLiteral( apiCfg ) );
    }

    function cloneResponse( pResponse )
    {
        if ( isNonNullObject( pResponse ) )
        {
            if ( isFunction( pResponse.clone ) )
            {
                return pResponse.clone();
            }
            return localCopy( pResponse );
        }
        else if ( isString( pResponse ) )
        {
            if ( isJson( pResponse ) )
            {
                return attempt( () => parseJson( pResponse ) );
            }
        }
        return pResponse;
    }

    /**
     * This class provides both a wrapper for the information returned by an HTTP request
     * and static methods to check the validity of a response.
     */
    class ResponseData
    {
        /**
         * Holds the numeric code return as the HTTP Status
         * @type {number}
         */
        status;

        /**
         * Holds the textual/string value returned as the status of the response
         * @type {String}
         */
        statusText;

        /**
         * Instance of an HttpStatus object to use as a helper
         * @type {HttpStatus}
         */
        #httpStatus = new HttpStatus( 0, "UNKNOWN" );

        /**
         * Holds the body of the response.
         * This can be a string, json-encoded data, an object, or a stream.
         * @type {String|Object|ReadableStream}
         */
        data;

        /**
         * Holds the Response Headers returned
         * or if no headers were returned, the Request Header used to make the request.
         * @type {Headers|HttpHeaders|Map<String,String>|Object}
         */
        headers;

        /**
         * Holds the RequestInit object (if using fetch)
         * or the config object (if using Axios, for example)
         * used to make the request
         * @type {Object|RequestInit}
         */
        config;

        /**
         * Holds either the request property of the returned response or the original request.
         * @type {String|URL|HttpRequest|Request}
         */
        request;

        /**
         * Holds any error the framework has returned
         * or an error generated by this class when the request was unsuccessful.
         * @type {Error|Object}
         */
        error;

        /**
         * Constructs a new instance of the class with the given response, error, configuration, and URL.
         *
         * @param {object} pResponse      The primary response object,
         *                                which may include details such as status, headers, and data.
         *
         * @param {object} pError          An error object,
         *                                 which may contain additional information
         *                                 about a failure.
         *
         * @param {object} pConfig         A configuration object,
         *                                 which provides additional details
         *                                 such as request headers.
         *
         * @param {string} pUrl            The target URL for the request.
         *
         * @return {ResponseData}          An instance of ResponseData
         */
        constructor( pResponse, pError, pConfig, pUrl )
        {
            const source = ResponseData.resolveSource( pResponse );

            if ( isNonNullObject( source ) )
            {
                // Some frameworks return the response as a property of an error returned in place of a response.
                // See https://axios-http.com/docs/handling_errors, for example
                this.response = source.response || pError?.response || source || pResponse || pError;

                // assign the numeric value of the response status to this instance
                this.status = asInt( this.response?.status || source.status || pResponse?.status );

                // assign the string value of the response status to this instance
                this.statusText = asString( this.response?.statusText || source.statusText || pResponse?.statusText || ResponseData.generateStatusText( asInt( this.status ) ), true );

                // construct an instance of HttpStatus as a helper for evaluating the status
                this.#httpStatus = HttpStatus.fromResponse( this.response ) || new HttpStatus( this.status, this.statusText );

                // Assigns the data property of the response to this instance if there is one,
                // such as would be the case when using the Axios framework, for example.
                // Note that we do not try to assign the 'body' property of a response to this property, because that is often an async call and/or causes bodyUsed to be true
                this.data = this.response?.data || source.data || pResponse?.data || pResponse; // could be pending ReadableStream

                // Stores the configuration returned with the response
                // or the configuration used to make the request for which this is the response
                this.config = this.response?.config || source.config || pResponse?.config || pConfig;

                // Stores the headers returned with the response or the request headers that were passed
                this.headers = this.response?.headers || source.headers || pResponse.headers || source?.config?.headers || pResponse.config?.headers || this.config?.headers || pConfig?.headers || pConfig;

                // Stores the request object associated with this response or synthesizes one
                this.request = this.response?.request || source.request || pResponse.request ||
                    {
                        url: asString( pUrl, true ),
                        config: pConfig || {}
                    };

                // Stores the url path from which the response actually came (in the case of redirects) or the url/path of the request
                this.url = asString( this.response?.url || asString( pUrl, true ) || this.request?.url, true ) || _mt;
            }

            // Stores an error object if the request was unsuccessful
            this.error = isNonNullObject( source.response || pResponse.response ) ? resolveError( pResponse || source ) || resolveError( pError ) : resolveError( pError );
        }

        get httpStatus()
        {
            return this.#httpStatus || HttpStatus.fromResponse( this.response );
        }

        get ok()
        {
            return isNonNullObject( this.httpStatus ) ?
                   this.httpStatus.isValid() :
                   ([STATUS_CODES.OK, STATUS_CODES.NO_CONTENT, STATUS_CODES.ACCEPTED, STATUS_CODES.CREATED].includes( asInt( this.status ) ));
        }

        isError()
        {
            return ( !isNull( this.error ) && isError( this.error )) || (this.httpStatus?.isError());
        }

        isRedirect()
        {
            if ( isNonNullObject( this.httpStatus ) ?
                 this.httpStatus.isRedirect() :
                 [
                     STATUS_CODES.MOVED,
                     STATUS_CODES.MOVED_PERMANENTLY,
                     STATUS_CODES.FOUND,
                     STATUS_CODES.SEE_OTHER,
                     STATUS_CODES.TEMPORARY_REDIRECT,
                     STATUS_CODES.PERMANENT_REDIRECT
                 ].includes( asInt( this.status ) ) )
            {
                let loc = isFunction( this?.headers?.get ) ?
                          this?.headers.get( "location" ) || this?.headers.get( "Location" ) :
                          this?.headers?.location || this.headers?.Location;
                return !isBlank( loc || this?.headers?.location || this.headers?.Location );
            }
            return false;
        }

        isUseCached()
        {
            return (isNonNullObject( this?.httpStatus ) ? this?.httpStatus.isUseCached() : [STATUS_CODES.NOT_MODIFIED].includes( asInt( this.status ) )) || [STATUS_CODES.NOT_MODIFIED].includes( asInt( this.status ) );
        }

        isClientError()
        {
            if ( isNonNullObject( this.httpStatus ) )
            {
                return this.httpStatus.isClientError();
            }
            return [STATUS_CODES.ERROR, STATUS_CODES.NOT_ACCEPTABLE, STATUS_CODES.LENGTH_REQUIRED, STATUS_CODES.PRECONDITION_FAILED, STATUS_CODES.REQUEST_ENTITY_TOO_LARGE, STATUS_CODES.REQUEST_URI_TOO_LONG, STATUS_CODES.UNSUPPORTED_MEDIA_TYPE, STATUS_CODES.REQUESTED_RANGE_NOT_SATISFIABLE, STATUS_CODES.EXPECTATION_FAILED, STATUS_CODES.MISDIRECTED_REQUEST, STATUS_CODES.UNPROCESSABLE_ENTITY, STATUS_CODES.REQUEST_HEADER_FIELDS_TOO_LARGE].includes( asInt( this.status ) );
        }

        isExceedsRateLimit()
        {
            return [STATUS_CODES.TOO_MANY_REQUESTS, STATUS_CODES.TOO_EARLY].includes( asInt( this.status ) );
        }

        get redirectUrl()
        {
            if ( this.isRedirect() )
            {
                return isFunction( this.headers?.get ) ?
                       this.headers?.get( "location" ) || this.headers?.get( "Location" ) || this.headers?.location || this.headers?.Location :
                       this.headers?.location || this.headers?.Location;
            }
            return _mt;
        }

        async body()
        {
            if ( isNonNullObject( this.data ) )
            {
                return this.data;
            }
            const res = cloneResponse( this.response );
            return await asyncAttempt( async() => await res.body );
        }

        async json()
        {
            const me = this;

            if ( isNonNullObject( this.data ) )
            {
                return this.data;
            }
            else if ( isString( this.data ) )
            {
                let obj = attempt( () => parseJson( me.data ) );
                if ( isNonNullObject( obj ) )
                {
                    return obj;
                }
            }
            const res = cloneResponse( this.response );
            return await asyncAttempt( async() => await res.json() );
        }

        async text()
        {
            let txt = asString( this.data || _mt );
            if ( !isBlank( txt ) )
            {
                return txt;
            }
            const res = cloneResponse( this.response );
            return await asyncAttempt( async() => await res.text() );
        }

        clone()
        {
            return new ResponseData( Object.assign( {}, cloneResponse( this.response ) ),
                                     this.error || null,
                                     this.config,
                                     this.url );
        }

        static fromResponse( pResponse, pConfig, pUrl )
        {
            return new ResponseData( cloneResponse( pResponse?.response || pResponse ),
                                     (isNonNullObject( pResponse.response ) ? resolveError( pResponse ) : null),
                                     pConfig,
                                     pUrl );
        }

        static fromError( pError, pConfig, pUrl )
        {
            return new ResponseData( cloneResponse( pError?.response || pError ),
                                     pError,
                                     pConfig,
                                     pUrl );
        }

        static fromObject( pObject, pConfig, pUrl )
        {
            let source = ResponseData.resolveSource( pObject );

            if ( isNonNullObject( source ) )
            {
                // Some frameworks return an error in place of a response.
                // In those cases, some of them return the response as a property of the error.
                // See https://axios-http.com/docs/handling_errors, for example

                let response = cloneResponse( source.response || source || pObject );

                let responseData = new ResponseData( response,
                                                     (response?.error || source || pObject),
                                                     (pConfig || response.config),
                                                     (pUrl || response.request?.url) );

                let entries = attempt( () => [...(objectEntries( source || pObject ) || [])] );

                attempt( () => entries.forEach( ( entry ) =>
                                                {
                                                    attempt( () => responseData[entry.key] = (responseData[entry.key] || entry.value) );
                                                } ) );

                return responseData;
            }

            return ResponseData.fromError( new Error( "No Response was Received" ), pConfig, pUrl );
        }

        static resolveSource( pObject )
        {
            return isNonNullObject( pObject ) ? pObject : (isString( pObject ) && isJson( pObject )) ? attempt( () => parseJson( pObject ) ) : {};
        }

        static generateStatusText( pStatus )
        {
            const status = asInt( pStatus );

            return STATUS_TEXT_ARRAY[status] || STATUS_TEXT[ucase( asString( pStatus, true ) )];
        }
    }

    ResponseData.isResponseData = function( pResponseData )
    {
        return isNonNullObject( pResponseData ) && pResponseData instanceof ResponseData;
    };

    ResponseData.from = function( pValue, pConfig, pUrl )
    {
        if ( ResponseData.isResponseData( pValue ) )
        {
            return pValue;
        }

        if ( isError( pValue ) )
        {
            return ResponseData.fromError( pValue, pConfig, pUrl );
        }

        if ( isNonNullObject( pValue ) )
        {
            if ( Object.hasOwn( pValue, "status" ) &&
                 Object.hasOwn( pValue, "headers" ) &&
                 Object.hasOwn( pValue, "data" ) )
            {
                return new ResponseData( pValue,
                                         null,
                                         (pValue.config || pConfig || {}),
                                         (pValue.request?.url || pValue.config?.url || pUrl || _mt) );
            }
        }

        return null;
    };

    ResponseData.isOk = function( pResponseData )
    {
        return isNonNullObject( pResponseData ) && (pResponseData.ok || ([200, 201, 204].includes( asInt( pResponseData.status ) )));
    };

    ResponseData.is = function( pResponseData, pWhat )
    {
        return ResponseData.isResponseData( pResponseData ) && attempt( () => pResponseData[("is" + pWhat)]() );
    };

    function populateResponseData( pResponse, pConfig, pUrl )
    {
        let res =
            {
                status: pResponse?.status || STATUS_CODES.CLIENT_ERROR,
                statusText: pResponse?.statusText || STATUS_TEXT_ARRAY[asInt( pResponse?.status || STATUS_CODES.CLIENT_ERROR )] || STATUS_TEXT[asString( pResponse?.status || STATUS_CODES.CLIENT_ERROR, true )],
                data: pResponse?.data || pResponse?.body || {},
                headers: pResponse?.headers || pResponse?.config?.headers || pConfig?.headers || pConfig,
                config: pResponse?.config || pConfig,
                request: pResponse?.request || attempt( () => new Request( pUrl, pConfig ) )
            };

        return ResponseData.fromObject( res, pConfig, pUrl );
    }

    function populateErrorResponse( pError, pConfig, pUrl )
    {
        let error = resolveError( pError, pConfig );

        let errorResponse = pError?.response || error;

        let obj =
            {
                status: error?.status || errorResponse?.status || STATUS_CODES.CLIENT_ERROR,
                statusText: error?.message || errorResponse?.statusText || STATUS_TEXT_ARRAY[asInt( errorResponse?.status || STATUS_CODES.CLIENT_ERROR )] || STATUS_TEXT[ucase( asString( errorResponse?.status || STATUS_CODES.CLIENT_ERROR, true ) )],
                data: errorResponse?.data || pError?.data || error?.details || errorResponse?.body || {},
                headers: errorResponse?.headers || error?.headers || pConfig.headers,
                config: errorResponse?.config || pConfig || {},
                error,
                errorResponse
            };

        return ResponseData.fromError( obj, pConfig, pUrl );
    }

    function isHttpClient( pDelegate )
    {
        if ( isNonNullObject( pDelegate ) )
        {
            return isFunction( pDelegate.sendGetRequest ) &&
                   isFunction( pDelegate.sendPostRequest ) &&
                   isFunction( pDelegate.sendPutRequest ) &&
                   isFunction( pDelegate.sendPatchRequest ) &&
                   isFunction( pDelegate.sendDeleteRequest );

        }
    }

    function resolveUrl( pUrl )
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
            return cleanUrl( asString( pUrl, true ) );
        }

        return _mt;
    }

    function resolveBody( pBody, pConfig )
    {
        return pBody || pConfig?.body || pConfig?.data;
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

        #resolve;
        #reject;

        constructor( pRequest, pConfig, pResolve, pReject )
        {
            this.#queuedTime = Date.now();

            this.#config = resolveConfig( pConfig );

            this.#request = isString( pRequest ) ? (_ud !== typeof Request) ? new Request( pRequest, this.#config ) : new HttpRequest( pRequest, this.#config ) : pRequest;

            this.#url = cleanUrl( asString( this.#request?.url || asString( this.#config?.url, true ) || asString( pRequest || this.#request, true ), true ) );

            this.#method = resolveHttpMethod( pRequest?.method || this.#config?.method );

            this.#id = asInt( this.#request?.id || this.#config?.id || QueuedRequest.nextId() );

            this.#priority = asInt( this.#request?.priority ) || asInt( this.#config?.priority ) || calculatePriority( this?.#request || this );

            this.#resolve = isFunction( pResolve ) ? pResolve : no_op;
            this.#reject = isFunction( pReject ) ? pReject : no_op;
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
            return populateOptions( this.#config, toObjectLiteral( new HttpClientConfig() ) );
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

    class DefaultDelegate
    {
        #options;
        #config;

        #queuedRequests = new BoundedQueue( 25 );

        #timer;
        #interval = 100;

        constructor( pConfig = new HttpClientConfig(), pOptions = {} )
        {
            this.#config = populateOptions( pConfig, toObjectLiteral( DEFAULT_CONFIG ) );

            this.#options = populateOptions( pOptions || {}, {} );

            this.#interval = asInt( this.config?.interval || this.#options?.interval, 100 );
        }

        get config()
        {
            return fixAgents( toObjectLiteral( populateOptions( {}, this.#config || {}, toObjectLiteral( DEFAULT_CONFIG ) ) ) );
        }

        mergeConfig( pConfig )
        {
            let cfg = fixAgents( populateOptions( populateOptions( {}, this.config ), toObjectLiteral( DEFAULT_CONFIG ) ) );

            let mergedConfig = populateOptions( pConfig || {}, cfg );

            mergedConfig.httpAgent = pConfig?.httpAgent || cfg?.httpAgent || httpAgent;
            mergedConfig.httpsAgent = pConfig?.httpsAgent || cfg?.httpsAgent || httpsAgent;

            return fixAgents( mergedConfig );
        }

        resolveUrl( pUrl )
        {
            return resolveUrl( pUrl );
        }

        resolveConfig( pConfig, pRequest )
        {
            let cfg = fixAgents( this.mergeConfig( pConfig, this.config ) );

            if ( _ud !== typeof Request && pRequest instanceof Request )
            {
                // TODO: merge request properties explicitly
                let req = new Request( pRequest.clone() );
            }
            else if ( isNonNullObject( pRequest ) )
            {
                cfg = this.mergeConfig( pRequest, cfg );
            }

            return fixAgents( cfg );
        }

        resolveBody( pBody, pConfig )
        {
            return resolveBody( pBody, pConfig );
        }

        async doFetch( pMethod, pUrl, pConfig, pBody, pRedirects = 0 )
        {
            const method = resolveMethod( pMethod );

            const url = this.resolveUrl( pUrl );

            const cfg = this.resolveConfig( pConfig, pUrl );
            cfg.method = pMethod || "GET";

            const body = this.resolveBody( pBody, pConfig );
            cfg.body = cfg.data = body;

            const response = await asyncAttempt( async() => await fetch( url, cfg ) );

            let responseData = ResponseData.fromResponse( response, cfg, url );

            if ( isNonNullObject( responseData ) )
            {
                let status = responseData.status;

                if ( status >= 200 && status < 300 )
                {
                    return responseData;
                }
                else if ( status >= 300 && status < 400 )
                {
                    const me = this;

                    let redirects = asInt( pRedirects );

                    if ( redirects <= asInt( cfg.maxRedirects ) )
                    {
                        let headers = responseData.headers;

                        let location = isFunction( headers?.get ) ? cleanUrl( asString( headers.get( "location" ) || headers.get( "Location" ), true ) || headers.location || headers.Location ) : cleanUrl( asString( headers.location || headers.Location, true ) );

                        if ( location && cleanUrl( asString( url, true ) ) !== location )
                        {
                            return await me.doFetch( method, location, cfg, body, ++redirects );
                        }
                    }
                    else
                    {
                        throw new Error( "Exceeded Maximum Number of Redirects (" + asInt( cfg.maxRedirects ) + ")" );
                    }
                }
                else if ( responseData.isError() || !isNull( attempt.lastError ) )
                {
                    throw responseData?.error || attempt.lastError || new Error( "Failed to fetch data from " + url + ", Server returned: " + (responseData?.status || "no response") );
                }
                else
                {
                    throw new Error( "Failed to fetch data from " + url + ", Server returned: " + (responseData?.status || "no response") );
                }
            }
            throw new Error( "Failed to fetch data from " + url + ", Server returned: " + (responseData?.status || "no response") );
        }

        async sendRequest( pMethod, pUrl, pConfig, pBody )
        {
            return await this.doFetch( pMethod, pUrl, pConfig, pBody );
        }

        async queueRequest( pMethod, pUrl, pConfig, pBody, pResolve, pReject )
        {
            const url = this.resolveUrl( pUrl );

            const cfg = this.resolveConfig( pConfig, pUrl );
            cfg.method = pMethod || "GET";

            const body = this.resolveBody( pBody, pConfig );
            cfg.body = cfg.data = body;

            this.#queuedRequests.push( new QueuedRequest( url, cfg, pResolve, pReject ) );

            if ( isNull( this.#timer ) )
            {
                const me = this;

                const func = async function()
                {
                    return asyncAttempt( async() => await me.processQueue() );
                };

                this.#timer = setInterval( func, Math.max( 100, asInt( me.#interval ) ) );
            }
        }

        async sendGetRequest( pUrl, pConfig )
        {
            const me = this;
            return await asyncAttempt( async() => await me.doFetch( "GET", pUrl, pConfig, null ) );
        }

        async getRequestedData( pUrl, pConfig, pRedirects = 0 )
        {
            const me = this;

            const url = this.resolveUrl( pUrl );

            const cfg = this.resolveConfig( pConfig );

            const responseData = ResponseData.fromResponse( await asyncAttempt( async() => await me.sendGetRequest( url, pConfig ) ) );

            if ( isNonNullObject( responseData ) )
            {
                let status = responseData.status;

                if ( status >= 200 && status < 300 )
                {
                    return responseData.data;
                }
                else if ( status >= 300 && status < 400 )
                {
                    let redirects = asInt( pRedirects );

                    if ( redirects <= asInt( cfg.maxRedirects ) )
                    {
                        let headers = responseData.headers;

                        let location = headers.location;

                        if ( location && url !== location )
                        {
                            return await me.getRequestedData( location, cfg, ++redirects );
                        }
                    }
                    else
                    {
                        throw new Error( "Exceeded Maximum Number of Redirects (" + asInt( cfg.maxRedirects ) + ")" );
                    }
                }
                else if ( responseData.isError() || !isNull( attempt.lastError ) )
                {
                    throw responseData?.error || attempt.lastError || new Error( "Failed to fetch data from " + url + ", Server returned: " + (responseData?.status || "no response") );
                }
                else
                {
                    throw new Error( "Failed to fetch data from " + url + ", Server returned: " + (responseData?.status || "no response") );
                }
            }
            throw new Error( "Failed to fetch data from " + url + ", Server returned: " + (responseData?.status || "no response") );
        }

        async queueGetRequest( pUrl, pConfig, pResolve, pReject )
        {
            return await this.queueRequest( "GET", pUrl, pConfig, null, pResolve, pReject );
        }

        async sendPostRequest( pUrl, pConfig, pBody )
        {
            const me = this;
            return asyncAttempt( async() => await me.doFetch( "POST", pUrl, pConfig, (pBody || pConfig?.body || pConfig?.data) ) );
        }

        async queuePostRequest( pUrl, pConfig, pBody, pResolve, pReject )
        {
            return await this.queueRequest( "POST", pUrl, pConfig, pBody, pResolve, pReject );
        }

        async sendDeleteRequest( pUrl, pConfig )
        {
            const me = this;
            return asyncAttempt( async() => await me.doFetch( "DELETE", pUrl, pConfig, null ) );
        }

        async queueDeleteRequest( pUrl, pConfig, pResolve, pReject )
        {
            return await this.queueRequest( "DELETE", pUrl, pConfig, null, pResolve, pReject );
        }

        async sendPutRequest( pUrl, pConfig, pBody )
        {
            const me = this;
            return asyncAttempt( async() => await me.doFetch( "PUT", pUrl, pConfig, pBody ) );
        }

        async queuePutRequest( pUrl, pConfig, pBody, pResolve, pReject )
        {
            return await this.queueRequest( "PUT", pUrl, pConfig, pBody, pResolve, pReject );
        }

        async sendPatchRequest( pUrl, pConfig, pBody )
        {
            const me = this;
            return asyncAttempt( async() => await me.doFetch( "PATCH", pUrl, pConfig, pBody ) );
        }

        async queuePatchRequest( pUrl, pConfig, pBody, pResolve, pReject )
        {
            return await this.queueRequest( "PATCH", pUrl, pConfig, pBody, pResolve, pReject );
        }

        async sendHeadRequest( pUrl, pConfig )
        {
            const me = this;
            return asyncAttempt( async() => await me.doFetch( "HEAD", pUrl, pConfig, null ) );
        }

        async sendOptionsRequest( pUrl, pConfig )
        {
            const me = this;
            return asyncAttempt( async() => await me.doFetch( "OPTIONS", pUrl, pConfig, null ) );
        }

        async sendTraceRequest( pUrl, pConfig )
        {
            const me = this;
            return asyncAttempt( async() => await me.doFetch( "TRACE", pUrl, pConfig, null ) );
        }

        async processQueue()
        {
            const canTake = await asyncAttempt( async() => await this.#queuedRequests.canTake() );

            if ( canTake )
            {
                const queuedRequest = this.#queuedRequests.take();

                if ( queuedRequest )
                {
                    let url = queuedRequest.request?.url || resolveUrl( queuedRequest.request );
                    let method = queuedRequest.method || queuedRequest.config?.method || "GET";
                    let config = queuedRequest.config || queuedRequest.request?.config || {};

                    let resolve = queuedRequest.resolve;
                    let reject = queuedRequest.reject;

                    let response = asyncAttempt( async() => await this.doFetch( method, url, config, this.resolveBody( config?.body || queuedRequest.request?.body ) ) );

                    let responseData = new ResponseData( response, getLastError(), config, url );

                    if ( ResponseData.isOk( responseData ) )
                    {
                        if ( isFunction( resolve ) )
                        {
                            return resolve( responseData );
                        }
                    }
                    else if ( ResponseData.is( "Error", responseData ) )
                    {
                        if ( isFunction( reject ) )
                        {
                            return reject( responseData.error || responseData );
                        }
                    }
                }
            }
            else
            {
                clearTimeout( this.#timer );
            }
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

        #delegate;

        constructor( pConfig, pOptions, pDelegate )
        {
            this.#config = populateOptions( pConfig, DEFAULT_CONFIG );

            this.#options = populateOptions( pOptions || {}, DEFAULT_HTTP_CLIENT_OPTIONS );

            this.#delegate = isHttpClient( pDelegate ) ? pDelegate : new DefaultDelegate( this.#config, this.#options );
        }

        get config()
        {
            return populateOptions( {}, this.#config || {}, toObjectLiteral( DEFAULT_CONFIG ) );
        }

        get options()
        {
            return populateOptions( {}, this.#options || {} );
        }

        get delegate()
        {
            return this.#delegate || new DefaultDelegate( resolveConfig( this.config ), );
        }

        async sendRequest( pMethod, pUrl, pConfig, pBody )
        {
            let delegate = this.#delegate || new DefaultDelegate( this.config );

            if ( isFunction( delegate.sendRequest ) )
            {
                return await asyncAttempt( async() => await delegate.sendRequest( pMethod, pUrl, pConfig, pBody ) );
            }

            return null;
        }

        /**
         * The default behavior just sends the request.
         * A delegate or decorated HttpClient might actually queue requests.
         *
         * @param pMethod
         * @param pUrl
         * @param pConfig
         * @param pBody
         * @param pResolve
         * @param pReject
         * @returns {Promise<*>}
         */
        async queueRequest( pMethod, pUrl, pConfig, pBody, pResolve, pReject )
        {
            const delegate = this.delegate;

            if ( isFunction( this.delegate?.queueRequest ) )
            {
                return await asyncAttempt( async() => await delegate.queueRequest( pMethod, pUrl, pConfig, pBody, pResolve, pReject ) );
            }

            let response = await this.sendRequest( pUrl, pConfig, pBody, pResolve, pReject );
            let responseData = new ResponseData( response, getLastError(), this.config, pUrl );

            let callback = ResponseData.isOk( responseData ) ? isFunction( pResolve ) ? pResolve : no_op : isFunction( pReject ) ? pReject : no_op;

            attempt( () => callback( responseData ) );
        }

        async sendGetRequest( pUrl, pConfig )
        {
            return await this.#delegate.sendGetRequest( pUrl, pConfig );
        }

        async queueGetRequest( pUrl, pConfig, pResolve, pReject )
        {
            const delegate = isHttpClient( this.#delegate ) ? this.#delegate : new DefaultDelegate( this.config, this.options );

            if ( isFunction( delegate?.queueGetRequest ) )
            {
                return await delegate.queueGetRequest( pUrl, pConfig, pResolve, pReject );
            }
            else if ( isFunction( delegate?.queueRequest ) )
            {
                return await delegate.queueRequest( "GET", pUrl, pConfig, null, pResolve, pReject );
            }
            const me = this;
            await asyncAttempt( async() => await me.queueRequest( "GET", pUrl, pConfig, null, pResolve, pReject ) );
        }

        async sendPostRequest( pUrl, pConfig, pBody )
        {
            const delegate = isHttpClient( this.#delegate ) ? this.#delegate : new DefaultDelegate( this.config, this.options );
            return await delegate.sendPostRequest( pUrl, pConfig, pBody );
        }

        async queuePostRequest( pUrl, pConfig, pBody, pResolve, pReject )
        {
            const delegate = isHttpClient( this.#delegate ) ? this.#delegate : new DefaultDelegate( this.config, this.options );

            if ( isFunction( delegate?.queuePostRequest ) )
            {
                return await delegate.queuePostRequest( pUrl, pConfig, pBody, pResolve, pReject );
            }
            else if ( isFunction( delegate?.queueRequest ) )
            {
                return await delegate.queueRequest( "POST", pUrl, pConfig, null, pResolve, pReject );
            }

            const me = this;
            await asyncAttempt( async() => await me.queueRequest( "POST", pUrl, pConfig, pBody, pResolve, pReject ) );
        }

        async sendPutRequest( pUrl, pConfig, pBody )
        {
            return await this.#delegate.sendPutRequest( pUrl, pConfig, pBody );
        }

        async queuePutRequest( pUrl, pConfig, pBody, pResolve, pReject )
        {
            const delegate = isHttpClient( this.#delegate ) ? this.#delegate : new DefaultDelegate( this.config, this.options );

            if ( isFunction( delegate.queuePutRequest ) )
            {
                return await delegate.queuePutRequest( pUrl, pConfig, pBody, pResolve, pReject );
            }
            else if ( isFunction( delegate?.queueRequest ) )
            {
                return await delegate.queueRequest( "PUT", pUrl, pConfig, null, pResolve, pReject );
            }

            const me = this;
            await asyncAttempt( async() => await me.queueRequest( "PUT", pUrl, pConfig, pBody, pResolve, pReject ) );
        }

        async sendPatchRequest( pUrl, pConfig, pBody )
        {
            return await this.#delegate.sendPatchRequest( pUrl, pConfig, pBody );
        }

        async queuePatchRequest( pUrl, pConfig, pBody, pResolve, pReject )
        {
            const delegate = isHttpClient( this.#delegate ) ? this.#delegate : new DefaultDelegate( this.config, this.options );

            if ( isFunction( delegate.queuePatchRequest ) )
            {
                return await delegate.queuePatchRequest( pUrl, pConfig, pBody, pResolve, pReject );
            }
            else if ( isFunction( delegate?.queueRequest ) )
            {
                return await delegate.queueRequest( "PATCH", pUrl, pConfig, null, pResolve, pReject );
            }

            const me = this;
            await asyncAttempt( async() => await me.queueRequest( "PATCH", pUrl, pConfig, pBody, pResolve, pReject ) );
        }

        async sendDeleteRequest( pUrl, pConfig )
        {
            return await this.#delegate.sendDeleteRequest( pUrl, pConfig );
        }

        async queueDeleteRequest( pUrl, pConfig, pResolve, pReject )
        {
            const delegate = isHttpClient( this.#delegate ) ? this.#delegate : new DefaultDelegate( this.config, this.options );

            if ( isFunction( delegate.queueDeleteRequest ) )
            {
                return await delegate.queueDeleteRequest( pUrl, pConfig, pResolve, pReject );
            }
            else if ( isFunction( delegate?.queueRequest ) )
            {
                return await delegate.queueRequest( "DELETE", pUrl, pConfig, null, pResolve, pReject );
            }

            const me = this;
            await asyncAttempt( async() => await me.queueRequest( "DELETE", pUrl, pConfig, null, pResolve, pReject ) );
        }

        async sendHeadRequest( pUrl, pConfig )
        {
            return await this.#delegate.sendHeadRequest( pUrl, pConfig );
        }

        async sendOptionsRequest( pUrl, pConfig )
        {
            return await this.#delegate.sendOptionsRequest( pUrl, pConfig );
        }

        async sendTraceRequest( pUrl, pConfig )
        {
            return await this.#delegate.sendTraceRequest( pUrl, pConfig );
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

        #options;

        #maxDelayBeforeQueueing = asInt( DEFAULT_HTTP_CLIENT_RATE_LIMITED_OPTIONS.MAX_DELAY_BEFORE_QUEUE );

        constructor( pInterval, pNumAllowed, pOptions )
        {
            this.#opened = new Date();
            this.#interval = RequestInterval.resolve( pInterval );
            this.#numAllowed = asInt( pNumAllowed );
            this.#nextReset = this.#interval.calculateNextReset( this.#opened );

            this.#options = populateOptions( pOptions || {}, DEFAULT_HTTP_CLIENT_RATE_LIMITED_OPTIONS );
            this.#maxDelayBeforeQueueing = Math.min( Math.max( 10, asInt( this.#options?.MAX_DELAY_BEFORE_QUEUE ) ), 5_000 );

            const me = this;
            setTimeout( me.timerFunction, this.#interval?.milliseconds );
        }

        get timerFunction()
        {
            const me = this;
            return async function()
            {
                let date = new Date();
                if ( isDate( me.nextReset ) && me.nextReset.getTime() < date.getTime() )
                {
                    me.reset();
                }
            };
        }

        get opened()
        {
            return lock( asDate( this.#opened ) );
        }

        get interval()
        {
            return lock( this.#interval );
        }

        get nextReset()
        {
            return asDate( this.#nextReset );
        }

        get numMade()
        {
            return asInt( this.#numMade, 0 );
        }

        get numAllowed()
        {
            return asInt( this.#numAllowed, 0 );
        }

        get options()
        {
            return populateOptions( {}, this.#options || DEFAULT_HTTP_CLIENT_RATE_LIMITED_OPTIONS );
        }

        get maxDelayBeforeQueueing()
        {
            return asInt( this.#maxDelayBeforeQueueing ) || DEFAULT_HTTP_CLIENT_RATE_LIMITED_OPTIONS.MAX_DELAY_BEFORE_QUEUE;
        }

        reset()
        {
            this.#opened = new Date();
            this.#nextReset = this.#interval.calculateNextReset( this.#opened );

            this.#numMade = 0;

            const me = this;
            setTimeout( me.timerFunction, this.#interval?.milliseconds );
        }

        increment()
        {
            this.#numMade += 1;
        }

        get requestsMade()
        {
            return asInt( this.#numMade );
        }

        get requestsAllowed()
        {
            return asInt( this.#numAllowed );
        }

        get requestsRemaining()
        {
            return Math.max( 0, asInt( this.#numAllowed ) - asInt( this.#numMade ) );
        }

        calculateDelay()
        {
            if ( this.requestsRemaining > 0 )
            {
                return 10; // 10 milliseconds
            }
            else
            {
                return (asDate( this.#nextReset || this.#interval.calculateNextReset( asDate( this.#opened ) ) ).getTime()) - (new Date().getTime());
            }
        }

        canSend()
        {
            return this.requestsRemaining > 0 || this.calculateDelay() <= asInt( this.maxDelayBeforeQueueing );
        }
    }

    class RateLimits
    {
        /**
         * The rate-limit-group to which these limits apply
         */
        #group;

        /**
         * The number of concurrent requests allowed
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
         * A map of allowed requests per timespan by RequestInterval.
         * @type {Map<RequestInterval, number>}
         */
        #allowedPerInterval = new Map();

        /**
         * This is a map of the RequestWindow objects by time-interval (i.e., "burst", "second", "minute", "hour", "day")
         *
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

        getRequestWindow( pInterval, pOptions = DEFAULT_HTTP_CLIENT_RATE_LIMITED_OPTIONS )
        {
            const interval = RequestInterval.resolve( pInterval );

            let window = this.#windows.get( interval );

            if ( isNonNullObject( window ) )
            {
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
    }

    /*
     x-ratelimit-group: Contacts-GetLastUpdatedSince
     x-ratelimit-limit: 10 10;w=1,250;w=60,15000;w=3600,360000;w=86400
     x-ratelimit-remaining: 10
     x-ratelimit-reset: 1
     */

    /*
     x-ratelimit-group: Contacts-Search
     x-ratelimit-limit: 10 10;w=1,250;w=60,15000;w=3600,360000;w=86400
     x-ratelimit-remaining: 10
     x-ratelimit-reset: 1
     */

    /*
     x-ratelimit-group: Contacts
     x-ratelimit-limit: 10 10;w=1,250;w=60,15000;w=3600,360000;w=86400
     x-ratelimit-remaining: 10
     x-ratelimit-reset: 1
     */

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

    RateLimits.fromHeaders = function( pHeaders )
    {
        let headers = isNonNullObject( pHeaders ) ? pHeaders : {};

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
                    queue.remove( pQueuedRequest );
                }
            }
        }

        /*
         abort( pQueuedRequest )
         {

         }
         */

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

                if ( queuedRequest )
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
            this.#map = pMap || new Map();
            this.#expressionMap = pExpressionMap || new Map();
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
            if ( isNonNullObject( pRequestOrUrl ) && !(isNull( pRequestOrUrl?.rateLimitsGroup ) || isBlank( pRequestOrUrl?.rateLimitsGroup )) )
            {
                return asString( pRequestOrUrl?.rateLimitsGroup, true );
            }

            let url = resolveUrl( pRequestOrUrl ).replace( /#\w*$/, _mt ).replace( /\?\w*$/, _mt );

            const parts = url.split( /\\\//i ).map( e => asString( e, true ) ).filter( e => !isBlank( e ) && "/" !== e );

            let path = this.extractPath( parts );

            let groupName = this.findGroupName( path, groupName, url );

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
         * The maximum number of milliseconds that this instance will wait before sending a request versus queuing the request
         * @type {number}
         */
        #maxDelayBeforeQueueing = 2_500;

        #queuedRequests = new RequestQueue();

        /**
         *
         * @param pConfig
         * @param pOptions
         * @param pDelegate
         * @param pRateLimits
         */
        constructor( pConfig, pOptions, pDelegate, ...pRateLimits )
        {
            super( pDelegate, pConfig, pOptions );

            this.#requestGroupMapper = this.options?.requestGroupMapper || RequestGroupMapper.DEFAULT;

            this.#maxDelayBeforeQueueing = Math.max( 100, Math.min( 10_000, asInt( this.options?.maxDelayBeforeQueueing, 2_500 ) ) );

            let arr = asArray( pRateLimits );
            arr.forEach( rateLimits =>
                         {
                             const key = rateLimits.group;
                             this.#rateLimitsMap.set( key, rateLimits );
                         } );
        }

        get rateLimitsMap()
        {
            return lock( this.#rateLimitsMap );
        }

        get requestGroupMapper()
        {
            return this.#requestGroupMapper || RequestGroupMapper.DEFAULT;
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

            return asString( group, true );
        }

        getRateLimits( pGroup )
        {
            let limits = this.#rateLimitsMap.get( pGroup );

            if ( isNull( limits ) )
            {
                limits = new RateLimits( pGroup );
                this.#rateLimitsMap.set( pGroup, limits );
            }

            return limits;
        }

        calculateDelay( pGroup )
        {
            const rateLimits = this.getRateLimits( pGroup );
            return rateLimits.calculateDelay();
        }

        async sendRequest( pMethod, pUrl, pConfig, pBody, pResolve, pReject )
        {
            const me = this;

            let delegate = this.delegate;

            const queue = this.requestQueue;

            return new Promise( ( resolve, reject ) =>
                                {
                                    const group = me.getRateLimitsGroup( pUrl, me.requestGroupMapper, me.config, me.options );

                                    const delay = me.calculateDelay( group );

                                    if ( delay > asInt( me.maxDelayBeforeQueueing ) )
                                    {
                                        return me.queueRequest( pMethod, pUrl, pConfig, (pResolve || resolve), (pReject || reject) );
                                    }
                                    else
                                    {
                                        const finallyFunction = async function()
                                        {
                                            queue.process( me );
                                        };

                                        const sendFunction = async() =>
                                        {
                                            const delegated = async function()
                                            {
                                                delegate.sendRequest( pMethod,
                                                                      pUrl,
                                                                      pConfig,
                                                                      pBody,
                                                                      pResolve || resolve,
                                                                      pReject || reject );
                                            };

                                            asyncAttempt( delegated ).then( pResolve || resolve ).catch( pReject || reject ).finally( finallyFunction );
                                        };

                                        sleep( delay ).then( sendFunction ).catch( reject ).finally( finallyFunction );

                                        // setTimeout for processing anything left in the queue

                                        setTimeout( finallyFunction, (delay * 2) );
                                    }
                                } );
        }

        // this

        async queueRequest( pMethod, pUrl, pConfig, pBody, pResolve, pReject )
        {
            const config = resolveConfig( pConfig );

            const url = resolveUrl( pUrl || config?.url );

            const method = resolveHttpMethod( pMethod );

            config.method = method;
            config.url = url;

            const request = HttpRequest.resolve( pUrl || url, config );

            request.method = method;
            request.url = cleanUrl( request.url, true ) || url;
            request.priority = calculatePriority( request, config );

            config.priority = config.priority || request.priority;

            let resolve = isFunction( pResolve ) ? pResolve : no_op;
            let reject = isFunction( pReject ) ? pReject : no_op;

            this.#queuedRequests.add( new QueuedRequest( request, config, resolve, reject ) );
        }

        async sendGetRequest( pUrl, pConfig )
        {
            return super.sendGetRequest( pUrl, pConfig );
        }

        async queueGetRequest( pUrl, pConfig, pResolve, pReject )
        {
            return super.queueGetRequest( pUrl, pConfig, pResolve, pReject );
        }

        async sendPostRequest( pUrl, pConfig, pBody )
        {
            return super.sendPostRequest( pUrl, pConfig, pBody );
        }

        async queuePostRequest( pUrl, pConfig, pBody, pResolve, pReject )
        {
            return super.queuePostRequest( pUrl, pConfig, pBody, pResolve, pReject );
        }

        async sendPutRequest( pUrl, pConfig, pBody )
        {
            return super.sendPutRequest( pUrl, pConfig, pBody );
        }

        async queuePutRequest( pUrl, pConfig, pBody, pResolve, pReject )
        {
            return super.queuePutRequest( pUrl, pConfig, pBody, pResolve, pReject );
        }

        async sendPatchRequest( pUrl, pConfig, pBody )
        {
            return super.sendPatchRequest( pUrl, pConfig, pBody );
        }

        async queuePatchRequest( pUrl, pConfig, pBody, pResolve, pReject )
        {
            return super.queuePatchRequest( pUrl, pConfig, pBody, pResolve, pReject );
        }

        async sendDeleteRequest( pUrl, pConfig )
        {
            return super.sendDeleteRequest( pUrl, pConfig );
        }

        async queueDeleteRequest( pUrl, pConfig, pResolve, pReject )
        {
            return super.queueDeleteRequest( pUrl, pConfig, pResolve, pReject );
        }

        async sendHeadRequest( pUrl, pConfig )
        {
            return super.sendHeadRequest( pUrl, pConfig );
        }

        async sendOptionsRequest( pUrl, pConfig )
        {
            return super.sendOptionsRequest( pUrl, pConfig );
        }

        async sendTraceRequest( pUrl, pConfig )
        {
            return super.sendTraceRequest( pUrl, pConfig );
        }
    }


}());
