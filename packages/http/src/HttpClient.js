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
            MILLIS_PER
        } = constants;

    // import the useful functions from the core module, TypeUtils
    const
        {
            isNull,
            isNonNullObject,
            isNonNullValue,
            isFunction,
            isError,
            isString,
            isNumber,
            isNumeric,
            isDate,
            isJson,
            isRegExp,
            isPromise,
            isThenable,
            isMap,
            instanceOfAny,
            firstMatchingType,
            toObjectLiteral,
            clamp
        } = typeUtils;

    // import the useful functions from the core module, StringUtils
    const { asString, asInt, toBool, isBlank, cleanUrl, lcase, ucase, toUnixPath } = stringUtils;

    // import the useful functions from the core module, ArrayUtils
    const { asArray, TypedArray, BoundedQueue } = arrayUtils;

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
        STATUS_TEXT_ARRAY,
        STATUS_ELIGIBLE_FOR_RETRY,
        DEFAULT_RETRY_DELAY
    } = httpConstants;

    const {
        ResponseData,
        populateResponseData,
        populateErrorResponse
    } = responseDataModule;

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

    const { HttpRequestHeaders, HttpResponseHeaders } = httpHeaders;

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
            this.#keepAliveMsecs = Math.max( 1_000, Math.min( asInt( pKeepAliveMilliseconds ), 300_000 ) );
            this.#maxFreeSockets = Math.max( Math.min( asInt( pMaxFreeSockets, 256 ) ) );
            this.#maxTotalSockets = asInt( pMaxTotalSockets ) > 0 && asInt( pMaxTotalSockets ) > asInt( pMaxFreeSockets ) ? asInt( pMaxTotalSockets ) : Infinity;
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
        #maxContentLength = MAX_CONTENT_LENGTH;
        #maxBodyLength = MAX_CONTENT_LENGTH;
        #maxRedirects = DEFAULT_REDIRECTS;
        #decompress = true;

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
         */
        // noinspection OverlyComplexFunctionJS
        constructor( pHttpAgent = httpAgent,
                     pHttpsAgent = httpAgent,
                     pAllowAbsoluteUrls = true,
                     pTimeout = DEFAULT_TIMEOUT_MILLISECONDS,
                     pMaxContentLength = MAX_CONTENT_LENGTH,
                     pMaxBodyLength = DEFAULT_TIMEOUT_MILLISECONDS,
                     pMaxRedirects = DEFAULT_REDIRECTS,
                     pDecompress = true )
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

        /**
         * Returns an object literal whose properties are those of this instance.
         * @returns {Object} an object literal whose properties are those of this instance.
         */
        toObjectLiteral()
        {
            let literal = toObjectLiteral( this );
            return fixAgents( literal );
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
        constructor( pHttpClientConfig, pApiProperties, pOauthSecrets, pPersonalAccessToken, pAccessTokenUrl, pTenantSecrets )
        {
            super( pHttpClientConfig?.httpAgent || httpAgent,
                   pHttpClientConfig.httpsAgent || httpsAgent,
                   toBool( pHttpClientConfig?.allowAbsoluteUrls ),
                   clamp( asInt( pHttpClientConfig?.timeout ), MIN_TIMEOUT_MILLISECONDS, MAX_TIMEOUT_MILLISECONDS ),
                   clamp( asInt( pHttpClientConfig?.maxContentLength ), MIN_CONTENT_LENGTH, MAX_CONTENT_LENGTH ),
                   clamp( asInt( pHttpClientConfig?.maxBodyLength ), MIN_CONTENT_LENGTH, MAX_CONTENT_LENGTH ),
                   clamp( asInt( pHttpClientConfig?.maxRedirects ), MIN_REDIRECTS, MAX_REDIRECTS ),
                   toBool( pHttpClientConfig?.decompress ) );

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
        let cfg = new HttpClientApiConfig( HttpClientConfig.getDefaultConfig(), pApiProperties, pOauthSecrets, pPersonalAccessToken, pAccessTokenUrl, pTenantSecrets );
        return fixAgents( cfg );
    };

    const DEFAULT_API_CONFIG = HttpClientApiConfig.getDefaultConfig();

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
        let cfg = populateOptions( toObjectLiteral( pConfig || {} ), (DEFAULT_CONFIG.toObjectLiteral()) );

        if ( !isNull( pBody ) )
        {
            cfg.data = cfg.body = (pBody || cfg.body || cfg.data);
        }

        return fixAgents( toObjectLiteral( cfg ) );
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

        cfg = populateOptions( cfg, HttpClientApiConfig.getDefaultConfig() );

        return fixAgents( toObjectLiteral( cfg ) );
    }

    function mergeConfig( pConfig, pDefaultConfig = DEFAULT_API_CONFIG )
    {
        const cfg = resolveApiConfig( pConfig, (pConfig?.body || pConfig?.data) );

        const defaultApiConfig = pDefaultConfig || DEFAULT_API_CONFIG;

        const mergedConfig = mergeObjects( cfg, defaultApiConfig, DEFAULT_CONFIG );

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

        return fixAgents( mergedConfig ) || mergedConfig;
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
        let body = isNonNullObject( pBody ) || (isString( pBody ) && !isBlank( pBody )) ? pBody : (pConfig?.body || pConfig?.data);

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

        // override resolveBody for Axios, which will do this for us
        if ( isNonNullObject( body ) )
        {
            return asJson( body );
        }

        if ( isPromise( body ) || isThenable( body ) )
        {
            body = await asyncAttempt( async() => await body );
            return resolveBody( { body }, pConfig );
        }

        return null;
    }

    function extractFileNameFromHeader( pResponse, pDefaultName, pReplaceCharacters = false )
    {
        let fileName = asString( pDefaultName );

        if ( isNonNullObject( pResponse ) )
        {
            // this function accepts either a response or headers object
            const headers = new HttpResponseHeaders( pResponse.headers || pResponse );

            const contentDisposition =
                asString( headers.get( "content-disposition" ) || headers["content-disposition"] ||
                          headers.get( "Content-Disposition" ) || headers["Content-Disposition"] ||
                          attempt( () => pResponse["content-disposition"] || pResponse.get( "content-disposition" ) ) ||
                          attempt( () => pResponse["Content-Disposition"] || pResponse.get( "Content-Disposition" ) )
                    , true );

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

    const MAX_REQUEST_RETRIES = 10;
    const DEFAULT_REQUEST_RETRIES = 5;

    const DEFAULT_DELEGATE_OPTIONS =
        {
            maxRetries: DEFAULT_REQUEST_RETRIES
        };

    function prepareRequestConfig( pMethod, pConfig, pUrl, pBody )
    {
        const body = resolveBody( (pBody || pConfig?.body || pConfig?.data), pConfig );

        const cfg = resolveApiConfig( pConfig, body );

        const url = (_ud !== typeof Request && pUrl instanceof Request) ? pUrl : resolveUrl( pUrl, cfg );

        if ( body )
        {
            cfg.body = cfg.data = (body || resolveBody( body, cfg ));
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
        constructor( pConfig = new HttpClientConfig(), pOptions = DEFAULT_DELEGATE_OPTIONS )
        {
            this.#config = populateOptions( pConfig, toObjectLiteral( DEFAULT_CONFIG ) );

            this.#options = populateOptions( pOptions || {}, DEFAULT_DELEGATE_OPTIONS );
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

        resolveUrl( pUrl, pConfig )
        {
            return resolveUrl( pUrl, pConfig );
        }

        resolveConfig( pConfig, pRequest )
        {
            let cfg = fixAgents( this.mergeConfig( pConfig, this.config ) );

            if ( _ud !== typeof Request && pRequest instanceof Request )
            {
                let req = new Request( pRequest.clone() );
                cfg = populateOptions( cfg, req );
                cfg.headers = populateOptions( cfg.headers, req.headers );
            }
            else if ( isNonNullObject( pRequest ) )
            {
                cfg = this.mergeConfig( pRequest, cfg );
            }

            return fixAgents( cfg );
        }

        async resolveBody( pBody, pConfig )
        {
            return resolveBody( pBody, pConfig );
        }

        get options()
        {
            return populateOptions( this.#options, DEFAULT_DELEGATE_OPTIONS );
        }

        get maxRetries()
        {
            return clamp( this.options?.maxRetries, 0, MAX_REQUEST_RETRIES );
        }

        // noinspection FunctionTooLongJS
        async doFetch( pUrl, pConfig, pRedirects = 0, pRetries = 0 )
        {
            const cfg = this.resolveConfig( pConfig, pUrl );

            const method = resolveHttpMethod( cfg.method || "GET" );
            cfg.method = method || "GET";

            const url = this.resolveUrl( pUrl, cfg );
            cfg.url = url;

            let retries = asInt( pRetries, 0 ) || 0;

            if ( retries >= asInt( this.maxRetries ) )
            {
                const error = new Error( "Maximum number of retries exceeded" );
                return ResponseData.fromError( error, cfg, url );
            }

            const body = this.resolveBody( (cfg.body || cfg.data), pConfig );
            cfg.body = cfg.data = body || cfg.data || cfg.body;

            const response = await asyncAttempt( async() => await fetch( url, cfg ) );

            let responseData = ResponseData.fromResponse( response, cfg, url );

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

                    return await asyncAttempt( async() => await me.doFetch( url, cfg, pRedirects, ++retries ) );
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
                            return await me.doFetch( location, cfg, ++redirects );
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

        async sendRequest( pMethod, pUrl, pConfig )
        {
            const me = this;

            const { cfg, url } = prepareRequestConfig( resolveHttpMethod( pMethod ), pConfig, pUrl );

            return await me.doFetch( url, cfg );
        }

        async sendGetRequest( pUrl, pConfig )
        {
            const me = this;

            const { cfg, url } = prepareRequestConfig( "GET", pConfig, pUrl );

            return await asyncAttempt( async() => await me.sendRequest( "GET", url, cfg ) );
        }

        async getRequestedData( pUrl, pConfig, pRedirects = 0 )
        {
            const me = this;

            const { cfg, url } = prepareRequestConfig( "GET", pConfig, pUrl, null );

            const responseData = ResponseData.fromResponse( await asyncAttempt( async() => await me.sendGetRequest( url, cfg ) ) );

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
                        let headers = responseData.headers;

                        let location = isFunction( headers?.get ) ? headers.get( "location" ) || headers.get( "Location" ) || headers?.location || headers?.Location : headers?.location || headers?.Location;

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

        async sendPostRequest( pUrl, pConfig, pBody )
        {
            const me = this;

            const { cfg, url } = prepareRequestConfig( "POST", pConfig, pUrl, pBody );

            return asyncAttempt( async() => await me.sendRequest( "POST", url, cfg ) );
        }

        async upload( pUrl, pConfig, pBody )
        {
            return this.sendPostRequest( pUrl, pConfig, pBody );
        }

        async sendDeleteRequest( pUrl, pConfig, pBody )
        {
            const me = this;

            const { cfg, url } = prepareRequestConfig( "DELETE", pConfig, pUrl, resolveBody( pBody, pConfig ) );

            return asyncAttempt( async() => await me.sendRequest( "DELETE", url, cfg ) );
        }

        async sendPutRequest( pUrl, pConfig, pBody )
        {
            const me = this;

            const { cfg, url } = prepareRequestConfig( "PUT", pConfig, pUrl, pBody );

            return asyncAttempt( async() => await me.sendRequest( "PUT", url, cfg ) );
        }

        async sendPatchRequest( pUrl, pConfig, pBody )
        {
            const me = this;

            const { cfg, url } = prepareRequestConfig( "PATCH", pConfig, pUrl, pBody );

            return asyncAttempt( async() => await me.sendRequest( "PATCH", url, cfg ) );
        }

        async sendHeadRequest( pUrl, pConfig )
        {
            const me = this;

            const { cfg, url } = prepareRequestConfig( "HEAD", pConfig, pUrl, null );

            return asyncAttempt( async() => await me.sendRequest( "HEAD", url, cfg ) );
        }

        async sendOptionsRequest( pUrl, pConfig )
        {
            const me = this;

            const { cfg, url } = prepareRequestConfig( "OPTIONS", pConfig, pUrl, null );

            return asyncAttempt( async() => await me.sendRequest( "OPTIONS", url, cfg ) );
        }

        async sendTraceRequest( pUrl, pConfig )
        {
            const me = this;

            const { cfg, url } = prepareRequestConfig( "TRACE", pConfig, pUrl, null );

            return asyncAttempt( async() => await me.sendRequest( "TRACE", url, cfg ) );
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

            this.#delegate = isHttpClient( pDelegate ) ? pDelegate : new HttpFetchClient( this.#config, this.#options );
        }

        get config()
        {
            return populateOptions( {}, this.#config || {}, toObjectLiteral( DEFAULT_CONFIG ) );
        }

        get options()
        {
            return populateOptions( {}, this.#options || DEFAULT_HTTP_CLIENT_OPTIONS );
        }

        get delegate()
        {
            const fetcher = this.#delegate || new HttpFetchClient( resolveConfig( this.config ), this.options );
            return isHttpClient( fetcher ) ? fetcher : new HttpFetchClient( this.config, this.options );
        }

        async sendRequest( pMethod, pUrl, pConfig, pBody )
        {
            const delegate = this.delegate || new HttpFetchClient( this.config, this.options );

            if ( isFunction( delegate.sendRequest ) )
            {
                return await asyncAttempt( async() => await delegate.sendRequest( pMethod, pUrl, pConfig, pBody ) );
            }

            const { cfg, url } = prepareRequestConfig( resolveHttpMethod( pMethod ), pConfig, pUrl );

            return fetch( url, cfg );
        }

        async sendGetRequest( pUrl, pConfig )
        {
            const delegate = this.delegate || new HttpFetchClient( this.config, this.options );

            const { cfg, url } = prepareRequestConfig( "GET", pConfig, pUrl );

            if ( isFunction( delegate.sendGetRequest ) )
            {
                return await asyncAttempt( async() => await delegate.sendGetRequest( resolveUrl( url, cfg ), cfg ) );
            }

            if ( isFunction( delegate.sendRequest ) )
            {
                return await asyncAttempt( async() => await delegate.sendRequest( "GET", url, cfg ) );
            }

            return fetch( url, cfg );
        }

        async getRequestedData( pUrl, pConfig, pRedirects = 0 )
        {
            const me = this;

            const delegate = this.delegate || new HttpFetchClient( this.config, this.options );

            const { cfg, url } = prepareRequestConfig( "GET", pConfig, pUrl, null );

            if ( isFunction( delegate.getRequestedData ) )
            {
                return await asyncAttempt( async() => await delegate.getRequestedData( resolveUrl( url, cfg ), cfg ) );
            }

            if ( isFunction( delegate.sendGetRequest ) )
            {
                let responseData = await asyncAttempt( async() => await delegate.sendGetRequest( url, cfg ) );

                responseData = ResponseData.from( responseData );

                if ( isNonNullObject( responseData ) )
                {
                    let status = responseData.status;

                    let headers = responseData.headers;

                    if ( ResponseData.isOk( status ) || (status >= 200 && status < 300) )
                    {
                        return responseData.data || responseData.body;
                    }
                    else if ( status >= 300 && status < 400 )
                    {
                        let redirects = asInt( pRedirects );

                        if ( redirects <= asInt( cfg.maxRedirects ) )
                        {
                            let location = responseData.redirectUrl || (headers["location"] || (isFunction( headers.get ) ? headers.get( "location" ) || headers.get( "Location" ) : _mt_str));

                            if ( location && cleanUrl( url ) !== cleanUrl( location ) )
                            {
                                return await asyncAttempt( async() => await me.getRequestedData( location, cfg, ++redirects ) );
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

        async sendPostRequest( pUrl, pConfig, pBody )
        {
            const delegate = this.delegate || new HttpFetchClient( this.config, this.options );

            const { cfg, url } = prepareRequestConfig( "POST", pConfig, pUrl, resolveBody( pBody, pConfig ) );

            if ( isFunction( delegate.sendPostRequest ) )
            {
                return await asyncAttempt( async() => await delegate.sendPostRequest( resolveUrl( url, cfg ), cfg ) );
            }

            if ( isFunction( delegate.sendRequest ) )
            {
                return await asyncAttempt( async() => await delegate.sendRequest( "POST", url, cfg ) );
            }

            return fetch( url, cfg );
        }

        async upload( pUrl, pConfig, pBody )
        {
            return this.sendPostRequest( pUrl, pConfig, pBody );
        }

        async download( pUrl, pConfig, pOutputPath = "./", pFileName = _mt )
        {
            let outputPath = toUnixPath( asString( pOutputPath, true ) ) || "./";

            try
            {
                const url = cleanUrl( resolveUrl( pUrl, pConfig || DEFAULT_API_CONFIG ) );

                let config =
                    mergeConfig( pConfig || DEFAULT_API_CONFIG,
                                 mergeConfig( {
                                                  method: "GET",
                                                  url: url,
                                                  responseType: "stream",
                                                  Accept: "application/octet-stream",
                                                  headers:
                                                      {
                                                          Accept: "application/octet-stream"
                                                      }
                                              }, pConfig || DEFAULT_API_CONFIG ) );

                const response = this.sendRequest( config?.method || "GET",
                                                   url,
                                                   config,
                                                   resolveBody( config.body || config.data, config ) );

                if ( ResponseData.isOk( response ) )
                {
                    // get the fileName from the Content-Disposition header or use provided filename
                    let defaultName = !isBlank( asString( pFileName, true ) ) ?
                                      toUnixPath( asString( pFileName, true ) ) :
                                      _mt;

                    let fileName = asString( pFileName, true ) ||
                                   extractFileNameFromHeader( response, defaultName );

                    // append the fileName to the path
                    const filePath = path.join( asString( outputPath, true ).replace( fileName, _mt ), fileName );

                    // create a writable stream
                    const fileStream = fs.createWriteStream( filePath );

                    // pipe the response data stream to the file stream
                    response.data.pipe( fileStream );

                    // wait for the stream to complete
                    await finished( fileStream );

                    console.log( `Wrote: ${filePath}` );

                    return filePath;
                }
            }
            catch( ex )
            {
                toolBocksModule.reportError( ex, ex.message, "error", axiosDownload, ex.response?.status, ex.response );

                console.error( ` *****ERROR*****\nFailed to download file: ${ex.message}`, ex );

                if ( ex.response )
                {
                    console.error( ` *****ERROR*****\nResponse status: ${ex.response.status}` );
                }

                throw ex;
            }

            return _mt;
        }

        async sendPutRequest( pUrl, pConfig, pBody )
        {
            const delegate = this.delegate || new HttpFetchClient( this.config, this.options );

            const { cfg, url } = prepareRequestConfig( "PUT", pConfig, pUrl, resolveBody( pBody, pConfig ) );

            if ( isFunction( delegate.sendPutRequest ) )
            {
                return await asyncAttempt( async() => await delegate.sendPutRequest( resolveUrl( url, cfg ), cfg ) );
            }

            if ( isFunction( delegate.sendRequest ) )
            {
                return await asyncAttempt( async() => await delegate.sendRequest( "PUT", url, cfg ) );
            }

            return fetch( url, cfg );
        }

        async sendPatchRequest( pUrl, pConfig, pBody )
        {
            const delegate = this.delegate || new HttpFetchClient( this.config, this.options );

            const { cfg, url } = prepareRequestConfig( "PATCH", pConfig, pUrl, resolveBody( pBody, pConfig ) );

            if ( isFunction( delegate.sendPatchRequest ) )
            {
                return await asyncAttempt( async() => await delegate.sendPatchRequest( resolveUrl( url, cfg ), cfg ) );
            }

            if ( isFunction( delegate.sendRequest ) )
            {
                return await asyncAttempt( async() => await delegate.sendRequest( "PATCH", url, cfg ) );
            }

            return fetch( url, cfg );
        }

        async sendDeleteRequest( pUrl, pConfig, pBody )
        {
            const delegate = this.delegate || new HttpFetchClient( this.config, this.options );

            const { cfg, url } = prepareRequestConfig( "DELETE", pConfig, pUrl, resolveBody( pBody, pConfig ) );

            if ( isFunction( delegate.sendDeleteRequest ) )
            {
                return await asyncAttempt( async() => await delegate.sendDeleteRequest( resolveUrl( url, cfg ), cfg, resolveBody( pBody, pConfig ) ) );
            }

            if ( isFunction( delegate.sendRequest ) )
            {
                return await asyncAttempt( async() => await delegate.sendRequest( "DELETE", url, cfg ) );
            }

            return fetch( url, cfg );
        }

        async sendHeadRequest( pUrl, pConfig )
        {
            const delegate = this.delegate || new HttpFetchClient( this.config, this.options );

            const { cfg, url } = prepareRequestConfig( "HEAD", pConfig, pUrl );

            if ( isFunction( delegate.sendHeadRequest ) )
            {
                return await asyncAttempt( async() => await delegate.sendHeadRequest( resolveUrl( url, cfg ), cfg ) );
            }

            if ( isFunction( delegate.sendRequest ) )
            {
                return await asyncAttempt( async() => await delegate.sendRequest( "HEAD", url, cfg ) );
            }

            return fetch( url, cfg );
        }

        async sendOptionsRequest( pUrl, pConfig )
        {
            const delegate = this.delegate || new HttpFetchClient( this.config, this.options );

            const { cfg, url } = prepareRequestConfig( "OPTIONS", pConfig, pUrl );

            if ( isFunction( delegate.sendOptionsRequest ) )
            {
                return await asyncAttempt( async() => await delegate.sendOptionsRequest( resolveUrl( url, cfg ), cfg ) );
            }

            if ( isFunction( delegate.sendRequest ) )
            {
                return await asyncAttempt( async() => await delegate.sendRequest( "OPTIONS", url, cfg ) );
            }

            return fetch( url, cfg );
        }

        async sendTraceRequest( pUrl, pConfig )
        {
            const delegate = this.delegate || new HttpFetchClient( this.config, this.options );

            const { cfg, url } = prepareRequestConfig( "POST", pConfig, pUrl );

            if ( isFunction( delegate.sendTraceRequest ) )
            {
                return await asyncAttempt( async() => await delegate.sendTraceRequest( resolveUrl( url, cfg ), cfg ) );
            }

            if ( isFunction( delegate.sendRequest ) )
            {
                return await asyncAttempt( async() => await delegate.sendRequest( "TRACE", url, cfg ) );
            }

            return fetch( url, cfg );
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

            this.#options = populateOptions( pOptions || {}, DEFAULT_HTTP_CLIENT_RATE_LIMITED_OPTIONS );
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
            return populateOptions( {}, this.#options || DEFAULT_HTTP_CLIENT_RATE_LIMITED_OPTIONS );
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

    RateLimits.fromHeaders = function( pHeaders )
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

        async sendRequest( pMethod, pUrl, pConfig, pResolve, pReject )
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
                                        return me.queueRequest( method, pUrl, pConfig, (pResolve || resolve), (pReject || reject) );
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

        async queueRequest( pMethod, pUrl, pConfig, pResolve, pReject )
        {
            const cfg = this.resolveConfig( pConfig, pUrl );

            const method = resolveHttpMethod( cfg.method || "GET" );
            cfg.method = method || "GET";

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

        async sendGetRequest( pUrl, pConfig )
        {
            const { cfg, url } = prepareRequestConfig( "GET", pConfig, pUrl );

            return this.sendRequest( "GET", url, cfg );
        }

        async getRequestedData( pUrl, pConfig, pRedirects, pResolve, pReject )
        {
            const me = this;

            const { cfg, url } = prepareRequestConfig( "GET", pConfig, pUrl, null );

            const responseData = await asyncAttempt( async() => await me.sendRequest( url, cfg ) );

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
                let retries = asInt( pRedirects );
                if ( retries < Math.max( cfg.maxRedirects, 3 ) && responseData.isExceedsRateLimit() )
                {
                    // the sendRequest method should already be handling the rate limits, so
                    // this is just a sort of fallback to make a last ditch attempt to get the data
                    await sleep( (500 * (retries + 1)) + (Math.random() * 100) );
                    return await asyncAttempt( async() => me.getRequestedData( url, cfg, ++retries, pResolve, pReject ) );
                }
            }

            let redirects = asInt( pRedirects );

            // noinspection JSValidateTypes,TypeScriptUMDGlobal
            return new Promise( ( resolve, reject ) =>
                                {
                                    const group = me.getRateLimitsGroup( pUrl, me.requestGroupMapper, me.config, me.options );

                                    const delay = me.calculateDelay( group );

                                    if ( delay > asInt( me.maxDelayBeforeQueueing ) )
                                    {
                                        return me.queueRequest( "GET", url, cfg, (pResolve || resolve), (pReject || reject) );
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
                                                                                                     ++redirects,
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

        async sendPostRequest( pUrl, pConfig, pBody )
        {
            const { cfg, url } = prepareRequestConfig( "POST", pConfig, pUrl, resolveBody( pBody, pConfig ) );

            return this.sendRequest( "POST", url, cfg );
        }

        async upload( pUrl, pConfig, pBody )
        {
            return this.sendPostRequest( pUrl, pConfig, pBody );
        }

        async sendPutRequest( pUrl, pConfig, pBody )
        {
            const { cfg, url } = prepareRequestConfig( "PUT", pConfig, pUrl, resolveBody( pBody, pConfig ) );

            return this.sendRequest( "PUT", url, cfg );
        }

        async sendPatchRequest( pUrl, pConfig, pBody )
        {
            const { cfg, url } = prepareRequestConfig( "PATCH", pConfig, pUrl, resolveBody( pBody, pConfig ) );

            return this.sendRequest( "PATCH", url, cfg );
        }

        async sendDeleteRequest( pUrl, pConfig, pBody )
        {
            const { cfg, url } = prepareRequestConfig( "DELETE", pConfig, pUrl, resolveBody( pBody, pConfig ) );

            return this.sendRequest( "DELETE", url, cfg );
        }

        async sendHeadRequest( pUrl, pConfig )
        {
            const { cfg, url } = prepareRequestConfig( "HEAD", pConfig, pUrl );

            return this.sendRequest( "HEAD", url, cfg );
        }

        async sendOptionsRequest( pUrl, pConfig )
        {
            const { cfg, url } = prepareRequestConfig( "OPTIONS", pConfig, pUrl );

            return this.sendRequest( "OPTIONS", url, cfg );
        }

        async sendTraceRequest( pUrl, pConfig )
        {
            const { cfg, url } = prepareRequestConfig( "TRACE", pConfig, pUrl );

            return this.sendRequest( "TRACE", url, cfg );
        }
    }

    function createRateLimitedHttpClient( pHttpClient, pConfig, pOptions, ...pRateLimits )
    {
        let client = pHttpClient || new HttpFetchClient( pConfig, pOptions );

        let options = populateOptions( pOptions, HttpClientApiConfig.getDefaultConfig() );

        let cfg = resolveApiConfig( pConfig );

        if ( isHttpClient( client ) )
        {
            return new RateLimitedHttpClient( cfg, options, client, ...pRateLimits );
        }

        return new RateLimitedHttpClient( cfg, options, new HttpFetchClient( cfg, options ), ...pRateLimits );
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
                    RateLimitedHttpClient
                },
            HttpAgentConfig,
            httpAgent,
            httpsAgent,
            fixAgents,
            mergeConfig,

            HttpClientConfig,
            OauthSecrets,
            TenantSecrets,
            ApiProperties,
            ApiExtendedProperties,

            HttpClientApiConfig,
            resolveConfig,
            resolveApiConfig,

            resolveUrl,
            resolveBody,

            isHttpClient,
            prepareRequestConfig,

            HttpClient,
            HttpFetchClient,
            RateLimitedHttpClient,

            RequestInterval,
            RequestWindow,
            RateLimits,

            RequestGroupMapper,
            createRateLimitedHttpClient
        };

    mod = toolBocksModule.extend( mod );

    return mod.expose( mod, INTERNAL_NAME, (_ud !== typeof module ? module : mod) ) || mod;

}());
