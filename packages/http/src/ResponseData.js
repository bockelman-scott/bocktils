/**
 * @fileOverview
 * This module defines a wrapper for HttpResponse or Response objects<br>
 * <br>
 *
 * @module ResponseData
 *
 * @author Scott Bockelman
 * @license MIT
 */

/**
 * This statement imports the core modules:
 * Constants, TypeUtils, StringUtils, and ArrayUtils
 */
const core = require( "@toolbocks/core" );

// provides utilities and classes for handling buffered or streamed data
const bufferUtils = require( "@toolbocks/buffer" );

/**
 * Import the module for date manipulation
 */
const datesModule = require( "@toolbocks/dates" );

/**
 * This statement imports JSON Utilities
 * that can handle circular references and internal references
 */
const jsonUtils = require( "@toolbocks/json" );

/**
 * Establish separate constants for each of the common utilities imported
 * @see ../src/CommonUtils.cjs
 */
const { moduleUtils, constants, typeUtils, stringUtils, arrayUtils } = core;

// import the DateUtils module from the datesModule
const { DateUtils } = datesModule;

// import the functions from DateUtils we use in this module
const { asDate } = DateUtils;

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
const url = require( "node:url" );

const {
    _ud = "undefined", $scope = constants?.$scope || function()
    {
        return (_ud === typeof self ? ((_ud === typeof global) ? {} : (global || {})) : (self || {}));
    }
} = constants;

// noinspection FunctionTooLongJS
(function exposeModule()
{
    const INTERNAL_NAME = "__BOCK__HTTP_RESPONSE_DATA__";

    if ( $scope() && (null != $scope()[INTERNAL_NAME]) )
    {
        return $scope()[INTERNAL_NAME];
    }

    const {
        ModuleEvent,
        ToolBocksModule,
        ObjectEntry,
        objectEntries,
        populateOptions,
        resolveError,
        getLastError,
        lock,
        localCopy,
        attempt,
        asyncAttempt,
        isWritable,
        $ln
    } = moduleUtils;

    const { _mt_str = "", _mt = _mt_str, _slash = "/" } = constants;

    const {
        isNull,
        isNonNullObject,
        isNonNullValue,
        isError,
        isFunction,
        isAsyncFunction,
        isString,
        isJson,
        isNumeric,
        isNullOrNaN,
        isDate,
        isDateString,
        isReadOnly,
        isPromise,
        isScalar,
        firstMatchingType,
        asObject,
        clamp = moduleUtils.clamp
    } = typeUtils;

    const { asString, asInt, toBool, isBlank, cleanUrl, lcase, ucase, capitalize } = stringUtils;

    const { parseJson, asJson } = jsonUtils;

    const { toReadableStream, toThrottledReadableStream } = bufferUtils;

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

    const { HttpHeaders, HttpRequestHeaders, HttpResponseHeaders } = httpHeaders;

    const { HttpRequest, cloneRequest } = httpRequestModule;

    const { HttpResponse, cloneResponse } = httpResponseModule;

    /**
     * This is a dictionary of this module's dependencies.
     * <br>
     * It is exported as a property of this module,
     * allowing us to just import this module<br>
     * and then import or use the other utilities<br>
     * as properties of this module.
     * <br>
     * @dict
     * @type {Object}
     * @alias module:ArrayUtils#dependencies
     */
    const dependencies =
        {
            moduleUtils,
            constants,
            typeUtils,
            stringUtils,
            arrayUtils,
            jsonUtils,
            bufferUtils,
            httpConstants,
            httpHeaders,
            httpRequestModule,
            httpResponseModule
        };

    const modName = "ResponseDataUtils";

    const toolBocksModule = new ToolBocksModule( modName, INTERNAL_NAME );

    const DEFAULT_RESPONSE_OPTIONS =
        {
            //
        };

    /**
     * This class provides both a wrapper for the information returned by an HTTP request
     * and static methods to check the validity of a response.
     */
    class ResponseData
    {
        /**
         * Holds the underlying response object
         */
        #response;

        /**
         * Holds the object returned by the framework as the response
         */
        #frameworkResponse;

        /**
         * Holds the resolved options
         */
        #options = DEFAULT_RESPONSE_OPTIONS;

        /**
         * Holds the numeric code return as the HTTP Status
         * @type {number}
         */
        #status;

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
        #data;

        /**
         * Holds the Response Headers returned
         * or if no headers were returned, the Request Header used to make the request.
         * @type {Headers|HttpResponseHeaders|Map<String,String>|Object}
         */
        #headers;

        /**
         * Holds the headers as returned by the framework used
         */
        #frameworkHeaders;

        /**
         * Holds the RequestInit object (if using fetch)
         * or the config object (if using Axios, for example)
         * used to make the request
         * @type {Object|RequestInit}
         */
        #config;

        /**
         * Holds the url of the response (may differ from the url of the request if redirects were followed)
         */
        #url;

        /**
         * Holds either the request property of the returned response or the original request.
         * @type {String|URL|HttpRequest|Request}
         */
        #request;

        /**
         * Holds any error the framework has returned
         * or an error generated by this class when the request was unsuccessful.
         * @type {Error|Object}
         */
        #error;

        /**
         * Constructs a new instance of the class with the given response, error, configuration, and URL.
         *
         * @param {object} pResponse      The primary response object,
         *                                which may include details such as status, headers, and data.
         *
         * @param pConfig
         * @param pOptions
         *
         * @return {ResponseData}          An instance of ResponseData
         */
        constructor( pResponse, pConfig, pOptions )
        {
            const me = this;

            let constructed = false;

            if ( pResponse instanceof this.constructor )
            {
                constructed = attempt( () => me._setPropertiesFromInstance( pResponse, pConfig, pOptions ) );
                this.originalResponseData = pResponse || me;
            }

            if ( !constructed )
            {
                const options = asObject( populateOptions( pOptions || {}, pConfig || pResponse || {}, DEFAULT_RESPONSE_OPTIONS ) ) || {};

                const config = asObject( pConfig || pResponse || options ) || {};

                const source = attempt( () => HttpResponse.resolveResponse( pResponse, config || options ) );

                // Some frameworks return the response as a property of an error returned in place of a response.
                // See https://axios-http.com/docs/handling_errors, for example
                this.#frameworkResponse = pResponse?.response || pResponse || source.response || source;

                this.#data = this.#frameworkResponse?.data || options.data;

                this.#frameworkHeaders = this.#frameworkResponse?.headers || options.headers || source.headers;

                this.#status = this.#frameworkResponse?.status || source.status || options.status;

                this.#error = isError( pResponse ) ? pResponse : isError( pConfig ) ? pConfig : isError( pOptions ) ? pOptions : null;

                this.#error = isError( this.#error ) ? resolveError( this.#error ) : null;

                this.#options = populateOptions( options,
                                                 {
                                                     response: this.#frameworkResponse || pResponse?.response || pResponse,
                                                     source: source || pResponse?.response || pResponse,
                                                     config,
                                                     error: this.#error,
                                                     status: this.#status,
                                                     data: this.#data || options.data || config?.data,
                                                     headers: this.#frameworkHeaders || source?.headers || options.headers
                                                 } );

                if ( isNonNullObject( source ) )
                {
                    let res = attempt( () => HttpResponse.resolveResponse( source.response || source || pResponse || config || options, config || options ) );

                    res = attempt( () => HttpResponse.unwrapResponse( res ) );

                    this.#response = attempt( () => new HttpResponse( (res || source || pResponse || config || options),
                                                                      (options || config || source || res),
                                                                      (config.url || res.url || options.url) ) ) || source || options.response || options || config;

                    // construct an instance of HttpStatus as a helper for evaluating the status
                    this.#httpStatus = attempt( () => HttpStatus.fromCode( this.status ) ) ||
                                       attempt( () => HttpStatus.fromResponse( this.response ) ) ||
                                       attempt( () => HttpStatus.fromCode( this.statusText ) ) ||
                                       attempt( () => new HttpStatus( asInt( this.status ), asString( this.statusText || this.options.statusText || "UNKNOWN", true ) ) );

                    // Stores the configuration returned with the response
                    // or the configuration used to make the request for which this is the response
                    this.#config = config || options;

                    // Stores the headers returned with the response or the request headers that were passed
                    this.#headers = new HttpResponseHeaders( source.headers || this.#frameworkHeaders || options.headers );

                    // Stores the url path from which the response actually came (in the case of redirects) or the url/path of the request
                    this.#url = cleanUrl( asString( asString( this.#response?.url || this.#frameworkResponse?.url, true ) || asString( options.url || config.url, true ) || _slash, true ) );

                    // Stores the request object associated with this response or synthesizes one
                    attempt( () => me.setRequest( res, config, options ) );
                }
            }
        }

        setRequest( pResponse, pConfig, pOptions )
        {
            let config = pConfig || this.config;

            let options = populateOptions( pOptions || Object.assign( {}, this.options ) || {}, this.options || {}, config );

            let res = attempt( () => HttpResponse.resolveResponse( pResponse, options ) );

            try
            {
                const req = attempt( () => res?.request ||
                                           pResponse?.request ||
                                           options?.request ||
                                           config?.request ||
                    {
                        url: this.#url || _slash,
                        config: config || options,
                        abortController: (config.abortController || options.abortController || new AbortController())
                    } );

                if ( isNonNullObject( req ) )
                {
                    const cloned = attempt( () => cloneRequest( req ) );
                    if ( isNonNullObject( cloned ) )
                    {
                        this.#request = attempt( () => new HttpRequest( cloned, options ) );
                    }
                }
            }
            catch( ex )
            {
                // ignored
            }
        }

        get options()
        {
            return populateOptions( this.#options, (asObject( this.#config ) || {}), (asObject( this.#frameworkResponse ) || {}), this.#response || {} );
        }

        get response()
        {
            const me = this;
            return attempt( () => cloneResponse( HttpResponse.resolveResponse( me.#response || me.#frameworkResponse, me.options ) ) );
        }

        get frameworkResponse()
        {
            return asObject( this.#frameworkResponse || this.options.response || this.#response ) || Object.assign( {}, this.#options || {} );
        }

        get status()
        {
            return asInt( this.#status || this.frameworkResponse?.status || this.response?.status || this.options.status );
        }

        get statusText()
        {
            return STATUS_TEXT[asInt( this.status )] || this.options.statusText;
        }

        get data()
        {
            return this.#data || this.frameworkResponse?.data || this.options.data || this.response?.data;
        }

        get headers()
        {
            return new HttpResponseHeaders( this.#headers || this.frameworkHeaders || this.options.headers );
        }

        get frameworkHeaders()
        {
            return this.#frameworkHeaders || this.#response?.headers || this.options.headers;
        }

        get config()
        {
            return asObject( this.#config || this.options ) || {};
        }

        get request()
        {
            return this.#request || this.options.request || this.config.request || this.config || this.options;
        }

        get error()
        {
            return this.#error;
        }

        get httpStatus()
        {
            return this.#httpStatus || HttpStatus.fromCode( this.status );
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
                // noinspection JSUnresolvedReference
                let loc = isFunction( this?.headers?.get ) ?
                          this?.headers.get( "location" ) || this?.headers.get( "Location" ) :
                          this?.headers?.location || this.headers?.Location;
                // noinspection JSUnresolvedReference
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

        get exceededRateLimit()
        {
            return this.isExceedsRateLimit();
        }

        get redirectUrl()
        {
            if ( this.isRedirect() )
            {
                // noinspection JSUnresolvedReference
                return isFunction( this.headers?.get ) ?
                       this.headers.get( "location" ) || this.headers.get( "Location" ) || this.headers.location || this.headers.Location :
                       this.headers.location || this.headers.Location;
            }
            return _mt;
        }

        get retryAfterMilliseconds()
        {
            let millis = Math.max( 100, asInt( DEFAULT_RETRY_DELAY[this.status] ) );

            millis = !isNullOrNaN( millis ) ? millis : 100;

            const responseHeaders = new HttpResponseHeaders( this.headers || this.response?.headers );

            let retryAfter = attempt( responseHeaders.get( "Retry-After" ) || responseHeaders.get( "retry-after" ) );

            retryAfter = retryAfter || attempt( responseHeaders.get( "X-Retry-After" ) || responseHeaders.get( "x-retry-after" ) );

            if ( isNumeric( retryAfter ) && !isDate( retryAfter ) )
            {
                millis = clamp( asInt( Math.max( (retryAfter * 1_000), millis ) ), 100, 30_000 );
            }
            else if ( isDateString( retryAfter ) || isDate( retryAfter ) )
            {
                let nextDateTime = asDate( retryAfter );
                if ( isDate( nextDateTime ) )
                {
                    millis = clamp( Math.max( millis, asInt( nextDateTime.getTime() - Date.now() ) ), 100, 30_000 );
                }
                else
                {
                    millis = clamp( 2 * millis, 100, 30_000 );
                }
            }
            else
            {
                millis = 256;
            }

            millis += (Math.random() * 128); // add some 'jitter'

            return millis;
        }

        get body()
        {
            if ( isNonNullObject( this.data ) || isNonNullValue( this.data ) )
            {
                return toReadableStream( this.data );
            }

            const res = cloneResponse( this.response );

            return res.body;
        }

        get bodyUsed()
        {
            return !!this.response?.bodyUsed;
        }

        get stream()
        {
            return isNull( this.data ) ? this.body : toThrottledReadableStream( this.data || this.body, 2_048, 0 );
        }

        getThrottledStream( pChuckSize, pDelayMs )
        {
            return isNull( this.data ) ? this.body : toThrottledReadableStream( this.data || this.body, pChuckSize, pDelayMs );
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
            let txt = !isNull( this.data ) && isScalar( this.data ) ? asString( this.data || _mt ) : _mt;

            txt = isBlank( txt ) && isNonNullObject( this.data ) ? asJson( this.data ) : _mt;

            if ( !isBlank( txt ) )
            {
                return asString( txt );
            }

            const res = cloneResponse( this.response );
            return await asyncAttempt( async() => await res.text() );
        }

        clone()
        {
            return new ResponseData( this.frameworkResponse || this.options.response || this.response,
                                     this.config,
                                     this.options );
        }

        _setPropertiesFromInstance( pResponseData, pConfig, pOptions )
        {
            const me = this;

            if ( isNonNullObject( pResponseData ) && pResponseData instanceof this.constructor )
            {
                const options = asObject( populateOptions( pOptions || {}, pConfig || {}, pResponseData.config, pResponseData.options, DEFAULT_RESPONSE_OPTIONS ) ) || {};

                const config = populateOptions( asObject( pConfig || options ) || {}, pResponseData.config || options );

                const source = attempt( () => HttpResponse.resolveResponse( pResponseData.response, config || options ) );

                this.#frameworkResponse = pResponseData?.frameworkResponse || pResponseData.response || source.response || source;

                this.#data = pResponseData.data || this.#frameworkResponse?.data || options.data;

                this.#frameworkHeaders = pResponseData.frameworkHeaders || this.#frameworkResponse?.headers || options.headers || source.headers;

                this.#status = pResponseData.status || this.#frameworkResponse?.status || source.status || options.status;

                this.#error = pResponseData.error || isError( pResponseData ) ? pResponseData : isError( pConfig ) ? pConfig : isError( pOptions ) ? pOptions : null;

                this.#error = isError( this.#error ) ? resolveError( this.#error ) : null;

                this.#options = populateOptions( options, pResponseData.options );

                this.#response = cloneResponse( pResponseData.response );

                this.#httpStatus = new HttpStatus( pResponseData.status, pResponseData.statusText );

                this.#config = config || options;

                this.#headers = new HttpResponseHeaders( pResponseData.headers || this.#frameworkHeaders || options.headers );

                this.#url = pResponseData.url || cleanUrl( asString( asString( this.#response?.url || this.#frameworkResponse?.url, true ) || asString( options.url || config.url, true ) || _slash, true ) );

                attempt( () => me.#request = pResponseData.request || options.request || config.request );

                const entries = attempt( () => objectEntries( pResponseData ) );

                if ( $ln( entries ) )
                {
                    entries.forEach( entry =>
                                     {
                                         const key = ObjectEntry.getKey( entry );
                                         const value = ObjectEntry.getValue( entry );

                                         if ( isString( key ) && !isBlank( key ) && !isNull( value ) )
                                         {
                                             if ( isNull( me[key] ) || isWritable( me, key ) )
                                             {
                                                 attempt( () => me[key] = (me[key] || value) );
                                             }
                                         }
                                     } );
                }

                return isNonNullObject( me.#response );
            }

            return false;
        }
    }

    ResponseData.isResponseData = function( pResponseData )
    {
        return isNonNullObject( pResponseData ) && pResponseData instanceof ResponseData;
    };

    ResponseData.exceedsRateLimit = function( pResponseData )
    {
        return ResponseData.isResponseData( pResponseData ) && pResponseData.isExceedsRateLimit();
    };

    ResponseData.isOk = function( pResponseData )
    {
        return isNonNullObject( pResponseData ) && (pResponseData.ok || ([200, 201, 204].includes( asInt( pResponseData.status ) )));
    };

    ResponseData.is = function( pResponseData, pWhat )
    {
        return ResponseData.isResponseData( pResponseData ) && attempt( () => pResponseData[("is" + pWhat)]() );
    };

    let mod =
        {
            dependencies,
            classes:
                {
                    ModuleEvent,
                    ToolBocksModule,
                    ObjectEntry,
                    HttpStatus,
                    HttpHeaders,
                    HttpRequestHeaders,
                    HttpResponseHeaders,
                    HttpRequest,
                    HttpResponse,
                    ResponseData
                },
            ResponseData,
            HttpStatus,
            STATUS_CODES,
            VERBS,
            resolveHttpMethod
        };

    mod = toolBocksModule.extend( mod );

    return mod.expose( mod, INTERNAL_NAME, (_ud !== typeof module ? module : mod) ) || mod;

}());
