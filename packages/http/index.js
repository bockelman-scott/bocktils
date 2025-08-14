const core = require( "@toolbocks/core" );
const datesModule = require( "@toolbocks/dates" );

const jsonUtils = require( "@toolbocks/json" );

const { moduleUtils, constants } = core;

const { DateUtils } = datesModule;

const { asJson, parseJson } = jsonUtils;

const FetchUtils = require( "./src/FetchUtils.cjs" );
const HttpCacheUtils = require( "./src/HttpCache.cjs" );
const HttpConstants = require( "./src/HttpConstants.cjs" );
const HttpHeadersUtils = require( "./src/HttpHeaders.cjs" );
const HttpRequestUtils = require( "./src/HttpRequest.cjs" );
const HttpResponseUtils = require( "./src/HttpResponse.cjs" );
const HttpStorageUtils = require( "./src/HttpStorage.cjs" );
const ResponseDataModule = require( "./src/ResponseData.js" );
const HttpClientUtils = require( "./src/HttpClient.js" );

/** define a variable for typeof undefined **/
const { _ud = "undefined" } = constants;

/**
 * This function returns the host environment scope (Browser window, Node.js global, or Worker self)
 */
const $scope = constants?.$scope || function()
{
    return (_ud === typeof self ? ((_ud === typeof global) ? {} : (global || {})) : (self || {}));
};

/**
 * This is the Immediately Invoked Function Expression (IIFE) that builds and returns the module
 */
(function exposeModule()
{
    // defines a key we can use to store this module in global scope
    const INTERNAL_NAME = "__BOCK__HTTP_UTILS__";

    // if we've already executed this code, return the module
    if ( $scope() && (null != $scope()[INTERNAL_NAME]) )
    {
        return $scope()[INTERNAL_NAME];
    }

    const { ModuleEvent, ToolBocksModule } = moduleUtils;

    if ( _ud === typeof CustomEvent )
    {
        CustomEvent = ModuleEvent;
    }

    const modName = "HttpUtils";

    const toolBocksModule = new ToolBocksModule( modName, INTERNAL_NAME );

    const
        {
            HttpCache,
            HttpCacheStorage,
            HttpCacheStorageManager,
            DEFAULT_CACHE_NAME,
            DEFAULT_CACHE_PREFIX,
            DEFAULT_VERSION,
            DEFAULT_REMOVE_OBSOLETE_CACHES,
            DEFAULT_CACHE_STORAGE_OPTIONS
        } = HttpCacheUtils;

    const
        {
            STATUS_CODES,
            STATUS_TEXT,
            STATUS_TEXT_ARRAY,
            STATUS_ELIGIBLE_FOR_RETRY,
            DEFAULT_RETRY_DELAY,
            VERBS,
            MODES,
            PRIORITY,
            CONTENT_TYPES,
            TYPES,
            HTTP_HEADERS,
            HttpVerb,
            HttpHeaderDefinition,
            HttpHeader,
            HttpStatus,
            HttpContentType,
            isVerb,
            isHeader,
            isContentType,
            resolveHttpMethod,
            calculatePriority
        } = HttpConstants;

    const
        {
            FORBIDDEN_REQUEST_HEADER_NAMES,
            FORBIDDEN_RESPONSE_HEADER_NAMES,
            FORBIDDEN_REQUEST_HEADERS,
            FORBIDDEN_RESPONSE_HEADERS,
            DEFAULT_EXPIRATION_HEADER,
            HttpHeaders,
            HttpRequestHeaders,
            HttpResponseHeaders,
            getHeaderValue
        } = HttpHeadersUtils;

    const
        {
            URL_COMPONENTS,
            VALID_URL_COMPONENTS,
            MIME_TYPES_BY_EXTENSION,
            REQUEST_CACHE_OPTIONS,
            VALID_REQUEST_CACHE_OPTIONS,
            REDIRECT_OPTIONS,
            VALID_REDIRECT_OPTIONS,
            REQUEST_CREDENTIALS_OPTIONS,
            VALID_REQUEST_CREDENTIALS_OPTIONS,
            REQUEST_BODY_TYPES,
            isUrl,
            isAbsoluteUrl,
            isRelativeUrl,
            toAbsoluteURL,
            escapeUrl,
            parseQueryString,
            urlDecode,
            urlEncode,
            formDecode,
            formEncode,
            isFormData,
            isURLSearchParams,
            isReadableStream,
            cloneRequest,

            HttpUrl,
            SearchParams,
            HttpRequestOptions,
            HttpRequest
        } = HttpRequestUtils;

    const
        {
            HttpResponse,
            cloneResponse,
            cloneHeaders
        } = HttpResponseUtils;

    const
        {
            HttpStorage,
            HttpLocalStorage,
            HttpSessionStorage,
            HttpStorageEvent,
            sessionStorage,
            localStorage
        } = HttpStorageUtils;

    const
        {
            ResponseData,
            populateResponseData,
            populateErrorResponse
        } = ResponseDataModule;

    const
        {
            HttpAgentConfig,
            httpAgent,
            httpsAgent,
            fixAgents,

            resolveUrl,
            resolveBody,

            isHttpClient,
            prepareRequestConfig,
            extractFileNameFromHeader,

            ConfigFactory,
            RequestInitModel,
            AxiosConfigModel,

            HttpClient,
            HttpFetchClient,
            RateLimitedHttpClient,

            RequestInterval,
            RequestWindow,
            RateLimits,

            RequestGroupMapper,
            createRateLimitedHttpClient,

            Throttler,
            SimpleRequestThrottler

        } = HttpClientUtils;

    let mod =
        {
            dependencies:
                {
                    core,
                    datesModule,
                    jsonUtils,
                    moduleUtils,
                    DateUtils,
                    FetchUtils,
                    HttpCacheUtils,
                    HttpConstants,
                    HttpHeadersUtils,
                    HttpRequestUtils,
                    HttpResponseUtils,
                    HttpStorageUtils,
                    ResponseDataModule,
                    HttpClientUtils
                },
            classes:
                {
                    HttpCache,
                    HttpCacheStorage,
                    HttpCacheStorageManager,
                    HttpVerb,
                    HttpHeaderDefinition,
                    HttpHeader,
                    HttpStatus,
                    HttpContentType,
                    HttpRequestHeaders,
                    HttpResponseHeaders,
                    HttpUrl,
                    SearchParams,
                    HttpRequestOptions,
                    HttpRequest,
                    HttpResponse,
                    HttpStorage,
                    HttpLocalStorage,
                    HttpSessionStorage,
                    HttpStorageEvent,
                    ResponseData,
                    HttpAgentConfig,
                    ConfigFactory,
                    RequestInitModel,
                    AxiosConfigModel,
                    HttpClient,
                    HttpFetchClient,
                    RateLimitedHttpClient,
                    RequestInterval,
                    RequestWindow,
                    RateLimits,
                    RequestGroupMapper,
                    Throttler,
                    SimpleRequestThrottler
                },
            FetchUtils,
            HttpCacheUtils,
            HttpConstants,
            HttpHeadersUtils,
            HttpRequestUtils,
            HttpResponseUtils,
            HttpStorageUtils,
            ResponseDataModule,
            HttpClientUtils,
            HttpCache,
            HttpCacheStorage,
            HttpCacheStorageManager,
            DEFAULT_CACHE_NAME,
            DEFAULT_CACHE_PREFIX,
            DEFAULT_VERSION,
            DEFAULT_REMOVE_OBSOLETE_CACHES,
            DEFAULT_CACHE_STORAGE_OPTIONS,
            STATUS_CODES,
            STATUS_TEXT,
            STATUS_TEXT_ARRAY,
            STATUS_ELIGIBLE_FOR_RETRY,
            DEFAULT_RETRY_DELAY,
            VERBS,
            MODES,
            PRIORITY,
            CONTENT_TYPES,
            TYPES,
            HTTP_HEADERS,
            HttpVerb,
            HttpHeaderDefinition,
            HttpHeader,
            HttpStatus,
            HttpContentType,
            isVerb,
            isHeader,
            isContentType,
            resolveHttpMethod,
            calculatePriority,
            FORBIDDEN_REQUEST_HEADER_NAMES,
            FORBIDDEN_RESPONSE_HEADER_NAMES,
            FORBIDDEN_REQUEST_HEADERS,
            FORBIDDEN_RESPONSE_HEADERS,
            DEFAULT_EXPIRATION_HEADER,
            HttpHeaders,
            HttpRequestHeaders,
            HttpResponseHeaders,
            getHeaderValue,
            URL_COMPONENTS,
            VALID_URL_COMPONENTS,
            MIME_TYPES_BY_EXTENSION,
            REQUEST_CACHE_OPTIONS,
            VALID_REQUEST_CACHE_OPTIONS,
            REDIRECT_OPTIONS,
            VALID_REDIRECT_OPTIONS,
            REQUEST_CREDENTIALS_OPTIONS,
            VALID_REQUEST_CREDENTIALS_OPTIONS,
            REQUEST_BODY_TYPES,
            isUrl,
            isAbsoluteUrl,
            isRelativeUrl,
            toAbsoluteURL,
            escapeUrl,
            parseQueryString,
            urlDecode,
            urlEncode,
            formDecode,
            formEncode,
            isFormData,
            isURLSearchParams,
            isReadableStream,
            cloneRequest,
            HttpUrl,
            SearchParams,
            HttpRequestOptions,
            HttpRequest,
            HttpResponse,
            cloneResponse,
            cloneHeaders,
            HttpStorage,
            HttpLocalStorage,
            HttpSessionStorage,
            HttpStorageEvent,
            sessionStorage,
            localStorage,
            ResponseData,
            populateResponseData,
            populateErrorResponse,
            HttpAgentConfig,
            httpAgent,
            httpsAgent,
            fixAgents,
            resolveUrl,
            resolveBody,
            isHttpClient,
            prepareRequestConfig,
            extractFileNameFromHeader,
            ConfigFactory,
            RequestInitModel,
            AxiosConfigModel,
            HttpClient,
            HttpFetchClient,
            RateLimitedHttpClient,
            RequestInterval,
            RequestWindow,
            RateLimits,
            RequestGroupMapper,
            createRateLimitedHttpClient,
            Throttler,
            SimpleRequestThrottler,
            asJson,
            parseJson
        };

    mod = toolBocksModule.extend( mod );

    return mod.expose( mod, INTERNAL_NAME, (_ud !== typeof module ? module : mod) ) || mod;

}());
