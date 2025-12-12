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

const fs = require( "fs" );

const { finished } = require( "stream/promises" );

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
 * Import the module for file system operations
 */
let fileUtils = require( "@toolbocks/files" );

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
        lock,
        attempt,
        attemptSilent,
        asyncAttempt,
        isWritable,
        $ln,
        konsole = console
    } = moduleUtils;

    const { _mt_str = "", _mt = _mt_str, _slash = "/" } = constants;

    const {
        isNull,
        isNonNullObject,
        isNonNullValue,
        isPopulatedObject,
        isError,
        isFunction,
        isString,
        isNumeric,
        isNullOrNaN,
        isDate,
        isDateString,
        isScalar,
        isPromise,
        asObject,
        toObjectLiteral,
        clamp = moduleUtils.clamp
    } = typeUtils;

    const { asString, asInt, isBlank, cleanUrl, isJson, isFilePath, toUnixPath } = stringUtils;

    const { parseJson, asJson } = jsonUtils;

    const { Streamer, toReadableStream, toThrottledReadableStream, readStream } = bufferUtils;

    const { resolvePath, createTempFile } = fileUtils;

    // import the functions, variables, and classes defined in the HttpConstants module that are used in this module
    const
        {
            VERBS,
            resolveHttpMethod,
            HttpStatus,
            STATUS_CODES,
            STATUS_TEXT,
            DEFAULT_RETRY_DELAY
        } = httpConstants;

    const { HttpHeaders, HttpRequestHeaders, HttpResponseHeaders } = httpHeaders;

    const { HttpRequest } = httpRequestModule;

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

    const OK_STATUSES = lock( [STATUS_CODES.OK, STATUS_CODES.NO_CONTENT, STATUS_CODES.ACCEPTED, STATUS_CODES.CREATED] );

    const REDIRECT_STATUSES =
        lock( [
                  STATUS_CODES.MOVED,
                  STATUS_CODES.MOVED_PERMANENTLY,
                  STATUS_CODES.FOUND,
                  STATUS_CODES.SEE_OTHER,
                  STATUS_CODES.TEMPORARY_REDIRECT,
                  STATUS_CODES.PERMANENT_REDIRECT
              ] );

    const CLIENT_ERROR_STATUSES =
        lock( [
                  STATUS_CODES.ERROR,
                  STATUS_CODES.NOT_ACCEPTABLE,
                  STATUS_CODES.LENGTH_REQUIRED,
                  STATUS_CODES.PRECONDITION_FAILED,
                  STATUS_CODES.REQUEST_ENTITY_TOO_LARGE,
                  STATUS_CODES.REQUEST_URI_TOO_LONG,
                  STATUS_CODES.UNSUPPORTED_MEDIA_TYPE,
                  STATUS_CODES.REQUESTED_RANGE_NOT_SATISFIABLE,
                  STATUS_CODES.EXPECTATION_FAILED,
                  STATUS_CODES.MISDIRECTED_REQUEST,
                  STATUS_CODES.UNPROCESSABLE_ENTITY,
                  STATUS_CODES.REQUEST_HEADER_FIELDS_TOO_LARGE
              ] );

    const RATE_LIMIT_EXCEEDED_STATUSES =
        lock( [
                  STATUS_CODES.TOO_MANY_REQUESTS,
                  STATUS_CODES.TOO_EARLY
              ] );

    const SKIP =
        lock( [
                  "response",
                  "frameworkResponse",
                  "options",
                  "status",
                  "statusText",
                  "httpStatus",
                  "data",
                  "headers",
                  "frameworkHeaders",
                  "config",
                  "url",
                  "request",
                  "error",
                  "ok",
                  "isError",
                  "isRedirect",
                  "isUseCached",
                  "isClientError",
                  "isExceedsRateLimit",
                  "exceededRateLimit",
                  "redirectUrl",
                  "retryAfterMilliseconds",
                  "body",
                  "bodyUsed",
                  "stream",
                  "getThrottledStream",
                  "json",
                  "text",
                  "clone",
                  "_setPropertiesFromInstance"
              ] );

    async function streamToFile( pResponseData, pFilePath )
    {
        let logger = this.logger || konsole;

        let responseData = ResponseData.from( pResponseData );

        let filePath = toUnixPath( asString( pFilePath, true ) );

        filePath = isFilePath( filePath ) ? resolvePath( filePath ) : createTempFile();

        // create a writable stream
        const fileStream = fs.createWriteStream( filePath );

        let closed = false;

        try
        {
            let response = responseData.response;

            let data = (responseData.data || response?.data || responseData.body || response?.body || response);

            if ( isNonNullObject( data ) && isPromise( data ) )
            {
                data = await asyncAttempt( async() => await data );
            }

            if ( isNonNullObject( data ) && isFunction( data.pipe ) )
            {
                attempt( () => (data || responseData.data || response?.data || response?.body || response).pipe( fileStream ) );

                // wait for the stream to complete
                await finished( fileStream );

                if ( !isNull( fileStream ) )
                {
                    attemptSilent( () => fileStream.close() );
                    closed = true;
                }

                logger.log( `Wrote: ${filePath}` );

                return filePath;
            }
            else
            {
                attempt( () => fileStream.close() );
            }
        }
        catch( ex )
        {
            attemptSilent( () => fileStream.close() );

            toolBocksModule.reportError( ex, ex.message, "error", streamToFile, ex.response?.status, ex.response );

            logger.error( ` *****ERROR*****\nFailed to download file: ${ex.message}`, ex );
        }
        finally
        {
            attemptSilent( () => fileStream.close() );
        }

        return _mt;
    }

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
            }

            if ( isError( pResponse ) || isError( pConfig ) )
            {
                this.#error = resolveError( isError( pResponse ) ? pResponse : pConfig, pConfig, { message: pResponse?.message || pConfig?.message || asString( pConfig || pResponse, true ) } );
                this.#data = isError( pConfig ) ? (pConfig?.message || pConfig) : isError( pResponse ) ? (pResponse?.message || pResponse) : (this.#error?.message || this.#error);
            }
            else
            {
                if ( !constructed )
                {
                    const opts = { ...DEFAULT_RESPONSE_OPTIONS, ...(pResponse || (pConfig || pResponse || {})), ...(pConfig || pResponse || {}), ...(pOptions || {}) };

                    const config = { ...(pResponse?.config || {}), ...(asObject( pConfig || pResponse || opts ) || {}) };

                    const options = { ...(asObject( opts ) || config || {}) };

                    const source = (_ud !== typeof Response && pResponse instanceof Response) ? pResponse : attempt( () => HttpResponse.resolveResponse( (pResponse || options), options ) );

                    // Some frameworks return the response as a property of an error returned in place of a response.
                    // See https://axios-http.com/docs/handling_errors, for example
                    this.#frameworkResponse = pResponse?.response || pResponse || source?.response || source;

                    this.#data = this.#frameworkResponse?.data || source?.data || this.#frameworkResponse?.body || options.data || source?.body || options.body;

                    this.#frameworkHeaders = this.#frameworkResponse?.headers || source?.headers || options.headers;

                    this.#status = this.#frameworkResponse?.status || source?.status || options.status;

                    this.#error = isError( pResponse ) ? pResponse : isError( pConfig ) ? pConfig : isError( pOptions ) ? pOptions : null;

                    this.#error = isError( this.#error ) ? resolveError( this.#error ) : null;

                    // Stores the configuration returned with the response
                    // or the configuration used to make the request for which this is the response
                    this.#config = config || options;

                    this.#options = populateOptions( options,
                                                     {
                                                         response: this.#frameworkResponse || pResponse?.response || pResponse,
                                                         source: source || pResponse?.response || pResponse,
                                                         config,
                                                         error: this.#error,
                                                         status: this.#status,
                                                         data: this.#data || config?.data || options.data,
                                                         headers: this.#frameworkHeaders || source?.headers || options.headers
                                                     } );

                    this.#options.data = ((config.responseType === "application/json" || isJson( this.#options.data )) ? asObject( this.#options.data ) : this.#options.data) || this.#options.data;

                    if ( isNonNullObject( source ) )
                    {
                        this.#response = attempt( () => new HttpResponse( (source || pResponse || config || options),
                                                                          (options || config || source),
                                                                          (config.url || options.url) ) ) || source || options.response || options || config;
                    }
                    else
                    {
                        this.#response = this.#frameworkResponse || pResponse;
                    }

                    // construct an instance of HttpStatus as a helper for evaluating the status
                    this.#httpStatus = attempt( () => HttpStatus.fromCode( this.status ) ) ||
                                       attempt( () => HttpStatus.fromResponse( this.#response ) ) ||
                                       attempt( () => HttpStatus.fromCode( this.statusText ) ) ||
                                       attempt( () => new HttpStatus( asInt( this.status ), asString( this.statusText || this.options.statusText || "UNKNOWN", true ) ) );

                    // Stores the headers returned with the response or the request headers that were passed
                    this.#headers = new HttpResponseHeaders( source?.headers || this.frameworkHeaders || config.headers || options.headers );

                    // Stores the url path from which the response actually came (in the case of redirects) or the url/path of the request
                    this.#url = cleanUrl( asString( asString( this.#response?.url || this.#frameworkResponse?.url || config?.url || source?.url, true ) || asString( config.url || options.url, true ) || _slash, true ) );
                }
            }
        }

        get options()
        {
            return {
                ...(this.#options || {}),
                ...(asObject( this.#config || {} ) || {}),
                ...(asObject( this.#frameworkResponse ) || {}), ...(this.#response || {})
            };
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
            return asInt( this.#status || this.frameworkResponse?.status || this.#response?.status || this.options.status );
        }

        get statusText()
        {
            return asString( this.frameworkResponse?.statusText || STATUS_TEXT[asInt( this.status )] || this.options.statusText, true );
        }

        get data()
        {
            let content = this.#data || this.frameworkResponse?.data || this.response?.data || this.options.data || this.frameworkResponse?.body || this.response?.body;

            if ( isNull( content ) || (isString( content ) && isBlank( content )) )
            {
                content = this.response ? this.response.body : content;
            }

            if ( "application/json" === this.#options.responseType || isJson( content ) )
            {
                content = attempt( () => asObject( content ) );

                let populatedObjectOptions =
                    {
                        minimumLength: 1,
                        acceptArrays: true,
                        countDeadBranches: false
                    };

                if ( !isPopulatedObject( content, populatedObjectOptions ) )
                {
                    content = this.#data || this.frameworkResponse?.data || this.response?.data || this.options.data;
                    if ( isNull( content ) || (isString( content ) && isBlank( content )) )
                    {
                        content = this.response ? (this.response.data || this.frameworkResponse?.data || this.response.body || this.frameworkResponse?.body) : (this.frameworkResponse ? this.frameworkResponse?.data || this.frameworkResponse?.body : content);
                    }
                }
            }

            return content;
        }

        get headers()
        {
            return new HttpResponseHeaders( this.#headers || this.frameworkHeaders || this.#frameworkResponse?.headers || this.config?.headers || this.options.headers );
        }

        get headersLiteral()
        {
            let headers = asObject( this.headers );
            return isFunction( headers.toLiteral ) ? headers.toLiteral() : attempt( () => toObjectLiteral( headers ) );
        }

        get frameworkHeaders()
        {
            return this.#frameworkHeaders || this.#frameworkResponse?.headers || this.#response?.headers || this.config?.headers || this.options.headers;
        }

        get config()
        {
            return asObject( this.#config || this.options ) || {};
        }

        get request()
        {
            this.#request = this.#request || attempt( () => new HttpRequest( this.#response?.request || this?.frameworkResponse?.request || this.config.request || this.options.request || this.config, this.options ) );
            return this.#request || this.config.request || this.options.request || this.config || this.options;
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
            return isNonNullObject( this.httpStatus ) ? this.httpStatus.isValid() : (OK_STATUSES.includes( asInt( this.status ) ));
        }

        isError()
        {
            return ( !isNull( this.error ) && isError( this.error )) || (this.httpStatus?.isError());
        }

        isRedirect()
        {
            if ( isNonNullObject( this.httpStatus ) ?
                 this.httpStatus.isRedirect() :
                 REDIRECT_STATUSES.includes( asInt( this.status ) ) )
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
            return CLIENT_ERROR_STATUSES.includes( asInt( this.status ) );
        }

        isExceedsRateLimit()
        {
            return RATE_LIMIT_EXCEEDED_STATUSES.includes( asInt( this.status ) );
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

            let retryAfter = attempt( () => responseHeaders.get( "Retry-After" ) ) || attempt( () => responseHeaders.get( "retry-after" ) );

            retryAfter = retryAfter || attempt( () => responseHeaders.get( "X-Retry-After" ) ) || attempt( () => responseHeaders.get( "x-retry-after" ) );

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

        // noinspection JSUnusedGlobalSymbols
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
                return isPromise( this.data ) ? await asyncAttempt( async() => await Promise.resolve( this.data ) ) : this.data;
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

            if ( isPromise( this.data ) )
            {
                let data = await asyncAttempt( async() => await Promise.resolve( this.data ) );
                txt = !isNull( this.data ) && isScalar( this.data ) ? asString( this.data || _mt ) : _mt;
            }

            txt = isBlank( txt ) && isNonNullObject( this.data ) ? asJson( this.data ) : _mt;

            if ( !isBlank( txt ) )
            {
                return asString( txt );
            }

            const res = cloneResponse( this.response );
            return await asyncAttempt( async() => await res.text() );
        }

        async streamToFile( pFilePath )
        {
            const me = this;
            const filePath = asString( pFilePath, true );
            return await asyncAttempt( async() => await streamToFile( me, filePath ) );
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
                const options = asObject( { ...DEFAULT_RESPONSE_OPTIONS, ...(pResponseData.options), ...(pResponseData.config), ...(pConfig || {}), ...(pOptions || {}) } ) || {};

                const config = asObject( { ...(pResponseData.config || options), ...(pConfig || options) } );

                const source = attempt( () => HttpResponse.resolveResponse( pResponseData.response, config || options ) );

                this.#frameworkResponse = pResponseData?.frameworkResponse || pResponseData.response || source.response || source;

                this.#data = pResponseData.data || this.#frameworkResponse?.data || options.data;

                this.#frameworkHeaders = pResponseData.frameworkHeaders || this.#frameworkResponse?.headers || options.headers || source.headers;

                this.#status = pResponseData.status || this.#frameworkResponse?.status || source.status || options.status;

                this.#error = pResponseData.error || isError( pResponseData ) ? pResponseData : isError( pConfig ) ? pConfig : isError( pOptions ) ? pOptions : null;

                this.#error = isError( this.#error ) ? resolveError( this.#error ) : null;

                this.#options = { ...(pResponseData.options || {}), ...(options || {}) };

                this.#response = cloneResponse( pResponseData.response );

                this.#httpStatus = new HttpStatus( pResponseData.status, pResponseData.statusText );

                this.#config = config || options;

                this.#headers = new HttpResponseHeaders( pResponseData.headers || this.#frameworkHeaders || options.headers );

                this.#url = pResponseData.url || cleanUrl( asString( asString( this.#response?.url || this.#frameworkResponse?.url, true ) || asString( options.url || config.url, true ) || _slash, true ) );

                attempt( () => me.#request = pResponseData.request || options.request || config.request );

                let entries = attempt( () => Object.entries( pResponseData ) );

                if ( $ln( entries ) )
                {
                    entries = entries.filter( entry => !SKIP.includes( ObjectEntry.getKey( entry ) ) );

                    entries.forEach( entry =>
                                     {
                                         const key = ObjectEntry.getKey( entry );
                                         const value = ObjectEntry.getValue( entry );

                                         if ( !SKIP.includes( key ) && !isFunction( value ) )
                                         {
                                             if ( isString( key ) && !isBlank( key ) && !isNull( value ) )
                                             {
                                                 if ( isNull( me[key] ) || isWritable( me, key ) )
                                                 {
                                                     attempt( () => me[key] = (me[key] || value) );
                                                 }
                                             }
                                         }
                                     } );
                }

                return isNonNullObject( me.#response );
            }

            return false;
        }

        async resolveData()
        {
            this.#data = isPromise( this.#data ) ? await asyncAttempt( async() => await Promise.resolve( this.#data ) ) : this.#data;
            return await this.#data;
        }
    }

    ResponseData.getRetryAfter = function( pResponse, pHeaders )
    {
        if ( pResponse instanceof ResponseData )
        {
            return asInt( clamp( Math.max( asInt( pResponse.retryAfterMilliseconds ), 256 ), 10, 30_000 ) );
        }
        else
        {
            let millis = 1_000;

            let headers = pHeaders || pResponse?.headers || pResponse;

            let responseHeaders = new HttpResponseHeaders( headers );

            let retryAfter = attempt( () => responseHeaders.get( "Retry-After" ) ) || attempt( () => responseHeaders.get( "retry-after" ) );

            retryAfter = retryAfter || attempt( () => responseHeaders.get( "X-Retry-After" ) ) || attempt( () => responseHeaders.get( "x-retry-after" ) );

            retryAfter = retryAfter || attempt( () => headers["Retry-After"] ) || attempt( () => headers["retry-after"] );

            retryAfter = retryAfter || attempt( () => headers["X-Retry-After"] ) || attempt( () => headers["x-retry-after"] );

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
    };

    ResponseData.isResponseData = function( pResponseData )
    {
        return isNonNullObject( pResponseData ) && pResponseData instanceof ResponseData;
    };

    ResponseData.isRedirected = function( pResponseData )
    {
        if ( ResponseData.isResponseData( pResponseData ) )
        {
            return pResponseData.isRedirect();
        }

        return REDIRECT_STATUSES.includes( asInt( pResponseData?.status ) );
    };

    ResponseData.from = function( pObject, pConfig, pOptions )
    {
        if ( ResponseData.isResponseData( pObject ) )
        {
            return pObject;
        }

        let obj = { ...(asObject( pObject || {} )) };

        const response = obj?.response || pConfig?.response || pOptions?.response || obj;

        const config = pConfig || obj?.config || response?.config;

        const options = asObject( pOptions || config || response );

        return new ResponseData( response, config, options );
    };

    ResponseData.asyncFrom = async function( pObject, pConfig, pOptions )
    {
        if ( ResponseData.isResponseData( pObject ) )
        {
            if ( isPromise( pObject.data ) )
            {
                await asyncAttempt( async() => await pObject.resolveData() );
            }

            return pObject;
        }

        let obj = { ...(asObject( pObject || pConfig || pOptions || {} )) };

        const response = obj?.response || pConfig?.response || pOptions?.response || obj;

        const config = pConfig || obj?.config || response?.config;

        const options = asObject( pOptions || config || response );

        let responseData = new ResponseData( response, config, options );

        await asyncAttempt( async() => await responseData.resolveData() );

        return responseData;
    };

    ResponseData.exceedsRateLimit = function( pResponseData )
    {
        return (ResponseData.isResponseData( pResponseData ) && pResponseData.isExceedsRateLimit()) || RATE_LIMIT_EXCEEDED_STATUSES.includes( pResponseData?.status );
    };

    ResponseData.isOk = function( pResponseData )
    {
        return isNonNullObject( pResponseData ) && (pResponseData.ok || ([200, 201, 204].includes( asInt( pResponseData.status ) )));
    };

    ResponseData.is = function( pResponseData, pWhat )
    {
        return ResponseData.isResponseData( pResponseData ) && attempt( () => pResponseData[("is" + pWhat)]() );
    };

    ResponseData.createErrorResponse = function( pError, pMsg )
    {
        let message = isString( pMsg ) ? (asString( pMsg || pError?.message, true )) : ((isError( pError ) ? asString( pError.message || asString( (isError( pMsg ) ? pMsg?.message || pMsg : pMsg), true ), true ) : asString( (isError( pMsg ) ? pMsg?.message || pMsg : pMsg), true ))) || "An error occurred ";
        let error = resolveError( isError( pError ) ? resolveError( pError ) : isError( pMsg ) ? resolveError( pMsg, pError ) : new Error( message ) );
        return new ResponseData( error, message, { error, message } );
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
            resolveHttpMethod,
            streamToFile
        };

    mod = toolBocksModule.extend( mod );

    return mod.expose( mod, INTERNAL_NAME, (_ud !== typeof module ? module : mod) ) || mod;

}());
