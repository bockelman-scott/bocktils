/**
 * @fileOverview
 * This module defines a wrapper for HttpResponse or Response objects<br>
 * <br>
 *
 * The intent is to provide a uniform interface regardless of the environment or frameworks used.
 * For example, the Fetch API of browsers returns a Web API Response,
 * the archaic XMLHttpRequest returns its own idea of the response,
 * direct usage of the Node.js http package returns a sublcas of or a wrapper over IncomingMessage,
 * and Axios returns it own idea of a response.
 *
 * @module ResponseData
 *
 * @author Scott Bockelman
 * @license MIT
 */

const fs = require( "fs" );

const { pipeline, finished } = require( "stream/promises" );

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

const { _ud = "undefined", $scope } = constants;

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

const httpConfigUtils = require( "./HttpConfigUtils.js" );

// noinspection FunctionTooLongJS
(function exposeModule()
{
    const INTERNAL_NAME = "__BOCK__HTTP_RESPONSE_DATA__";

    if ( $scope() && (null != $scope()[INTERNAL_NAME]) )
    {
        return $scope()[INTERNAL_NAME];
    }

    const
        {
            ModuleEvent,
            ToolBocksModule,
            IterationCap,
            ObjectEntry,
            resolveError,
            readProperty,
            lock,
            attempt,
            attemptSilent,
            asyncAttempt,
            isWritable,
            $ln,
            konsole = console
        } = moduleUtils;

    const { _mt_str = "", _mt = _mt_str, _slash = "/", _hash, _underscore } = constants;

    const
        {
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
            FAST_OBJECT_LITERAL_OPTIONS,
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

    const { HttpConfig, toHttpConfigLiteral } = httpConfigUtils;

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

    function _resolveFilePath( pFilePath )
    {
        const filePath = toUnixPath( asString( pFilePath, true ) );
        return isFilePath( filePath ) ? resolvePath( filePath ) : createTempFile();
    }

    async function pipeToFile( pResponseData, pFilePath )
    {
        const logger = ToolBocksModule.resolveLogger( toolBocksModule.logger, konsole );

        const responseData = ResponseData.from( pResponseData );

        const filePath = _resolveFilePath( pFilePath );

        try
        {
            const response = responseData.response?.response || responseData.response;

            let data = (responseData.data || response?.data || responseData.body || response?.body || response);

            if ( isNonNullObject( data ) && isPromise( data ) )
            {
                data = await data || await responseData.body || await response?.body || response;
            }

            const isPipeable = (( obj ) => isNonNullObject( obj ) && isFunction( obj.pipe ));

            let source = [data, responseData.data, responseData.body, response?.data, response?.body].find( isPipeable );

            if ( isNull( source ) || !(isFunction( source?.pipe )) )
            {
                source = new Streamer().asChunkedStream( responseData.data || response?.data || responseData.body || response?.body || response );
            }

            // create a writable stream
            const fileStream = fs.createWriteStream( filePath );

            // Using pipeline to automatically handle 'error', 'end', and potential 'socket hang up'
            // This is in contrast to using .pipe() and the finished() callback
            await pipeline( source, fileStream );

            logger.log( `Wrote: ${filePath}` );

            return filePath;
        }
        catch( ex )
        {
            // pipeline automatically closes fileStream if 'source' fails
            toolBocksModule.reportError( ex, ex.message, "error", pipeToFile );

            logger.error( ` *****ERROR*****\nFailed to download ${filePath} due to: ${ex.message}`, ex );
        }

        return _mt;
    }

    async function streamToFile( pResponseData, pFilePath )
    {
        const logger = ToolBocksModule.resolveLogger( toolBocksModule.logger, konsole );

        const responseData = ResponseData.from( pResponseData );

        const filePath = _resolveFilePath( pFilePath );

        // create a writable stream
        const fileStream = fs.createWriteStream( filePath );

        let closed = false;

        try
        {
            let response = responseData.response?.response || responseData.response;

            let data = (responseData.data || response?.data || responseData.body || response?.body || response);

            if ( isNonNullObject( data ) && isPromise( data ) )
            {
                data = await asyncAttempt( async() => await data ) || responseData.body || response?.body || response;
            }

            const iterationCap = new IterationCap( 5 );

            while ( (isNull( data ) || !isFunction( data?.pipe )) && !iterationCap.reached )
            {
                switch ( iterationCap.iterations )
                {
                    case 0:
                        data = await (data || responseData.data) || await responseData.data;
                        break;

                    case 1:
                        data = await (responseData.data || responseData.response?.response?.data || responseData.response?.data || response?.data);
                        break;

                    case 2:
                        data = await (responseData.body || responseData.response?.response?.body || responseData.response?.body || response?.body);
                        break;

                    case 3:
                        data = await (response?.response?.body || response?.body);
                        break;

                    default:
                        data = new Streamer().asChunkedStream( await (responseData.data || response?.data || responseData.body || response?.body || response) );
                        break;
                }
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

            logger.error( ` *****ERROR*****\nFailed to download file, ${filePath}, due to: ${ex.message}`, ex );
        }
        finally
        {
            attemptSilent( () => fileStream.close() );
        }

        return _mt;
    }

    /**
     * If the Response Status is 429, it may include a retry-after header.
     *
     * This function helps calculate the number of milliseconds to wait before retrying the failed request.
     *
     * @param pRetryAfter The value returned by the server, in seconds.
     * @param pDefaultDelay The default number of millseconds to wait if the retry-after value is absent or invalid
     *
     * @returns {number} The number of milliseconds to wait before retrying a failed request.
     */
    const calculateRetryDelay = function( pRetryAfter, pDefaultDelay = 128 )
    {
        let millis = asInt( pDefaultDelay, 128 );

        let retryAfter = pRetryAfter ?? millis;

        if ( isNumeric( retryAfter ) && !isDate( retryAfter ) )
        {
            millis = clamp( asInt( Math.max( (retryAfter * 1_000), millis ) ), 128, 10_000 );
        }
        else if ( isDateString( retryAfter ) || isDate( retryAfter ) )
        {
            let nextDateTime = asDate( retryAfter );
            if ( isDate( nextDateTime ) )
            {
                millis = clamp( Math.max( millis, asInt( nextDateTime.getTime() - Date.now() ) ), 128, 10_000 );
            }
            else
            {
                millis = clamp( 2 * millis, 128, 10_000 );
            }
        }
        else
        {
            millis = 256;
        }

        millis += (Math.random() * 256); // add some 'jitter'

        return millis;
    };

    /**
     * This class provides both a wrapper for the information returned in response to an HTTP request
     * and static methods to check the validity of a response.
     */
    class ResponseData
    {
        /**
         * Holds the underlying response object,
         * unwrapped from any framework response (such as the axios response)
         */
        #response;

        /**
         * Holds the object returned by the framework as the response.
         * This may be the same as #response if no framework is being used.
         * Examples include the response returned from browser's Fetch API.
         * (Sort of, of course, the 'real' response is just a stream of bits over TCP, but...)
         */
        #frameworkResponse;

        /**
         * Holds the numeric code returned as the HTTP Status.
         * For example, in most case, this will be 200
         * @type {number}
         */
        #status;

        /**
         * Instance of an HttpStatus object to use as a helper for evaluating the status.
         * The HttpStatus class contains intelligence based on the latest RFC Specs for HTTP Status codes.
         * @type {HttpStatus}
         */
        #httpStatus = new HttpStatus( 0, "UNKNOWN" );

        /**
         * Holds the body of the response.
         * This can be a string, json-encoded data, an object, or a stream.
         * This intentionally mimics Axios model to avoid using the 'body' property,
         * which hs special 'semantics' in the case of the Web API Response,
         * such as being a Promise, and being a read-once ReadableStream.
         *
         * If this instance is being created from Web API response,
         * data will initially be a Promise.
         *
         * If the framework has already resolve the body, this will hold the useful data.
         *
         * @type {String|Object|ReadableStream}
         */
        #data;

        /**
         * Holds the Response Headers returned
         * or if no headers were returned,
         * the Request Header used to make the request.
         *
         * This will be wrapped in an instance of HttpHeaders to provide a uniform interface.
         *
         * @type {Headers|HttpResponseHeaders|Map<String,String>|Object}
         */
        #headers;

        /**
         * Holds the headers as returned by the framework used.
         * These headers are the 'native' headers as returned, not wrapped in HttpHeaders.
         * Proceed with some caution, depending on their source.
         */
        #frameworkHeaders;

        /**
         * Holds the RequestInit object (if using fetch)
         * or the config object (if using Axios, for example)
         * used to make the request.
         *
         * This will be wrapped in an instance of HttpConfig to provide a uniform interface
         * and preserve the http.Agents that may have been indicated.
         *
         * @type {Object|RequestInit|HttpConfig}
         */
        #config;

        /**
         * Holds the url of the response
         * (which may differ from the url of the request if redirects were followed)
         *
         * @type {string|URL}
         */
        #url;

        /**
         * Holds either the request property of the returned response or the original Request.
         * This will be wrapped in an HttpRequest to provide a uniform insterface
         *
         * @type {String|URL|HttpRequest|Request}
         */
        #request;

        /**
         * Holds any error the framework has returned
         * or an error generated by this class when the request was unsuccessful.
         *
         * Will be null when the request and construction of the response are succesful.
         *
         * @type {Error|null}
         */
        #error;

        #responseType;

        /**
         * Constructs a new instance of the class with the given response, error, configuration, and URL.
         *
         * @param {object} pResponse      The primary response object,
         *                                which may include details such as status, headers, and data.
         *
         * @param pConfig
         *
         * @return {ResponseData}          An instance of ResponseData
         */
        constructor( pResponse, pConfig )
        {
            const me = this;

            // we avoid double-wrapping, triple wrapping, etc
            // by checking the type of the first argument
            let constructed = false;

            if ( pResponse instanceof this.constructor )
            {
                constructed = attempt( () => me.#setPropertiesFromInstance( pResponse, pConfig ) );
            }

            if ( isError( pResponse ) || isError( pConfig ) || isError( pResponse?.error ) || isError( pResponse?.response ) )
            {
                this.#error = resolveError( [pResponse, pConfig, pResponse?.error, pResponse?.response].find( isError ) );
                this.#data = isError( this.#error ) ? (this.#error?.message || pResponse) : pResponse?.data || pResponse?.body;
            }
            else
            {
                if ( !constructed )
                {
                    const source = (_ud !== typeof Response && pResponse instanceof Response) ? pResponse : HttpResponse.resolveResponse( pResponse ) || asObject( pResponse || {} );

                    // Some frameworks return the response as a property of an error returned in place of a response.
                    // See https://axios-http.com/docs/handling_errors, for example
                    this.#frameworkResponse = isError( pResponse ) ? pResponse?.response || pResponse || source : pResponse;

                    this.#data = this.#frameworkResponse?.data || pResponse?.data || this.#frameworkResponse?.body || source?.body || pResponse?.body;

                    this.#frameworkHeaders = this.#frameworkResponse?.headers || pResponse?.headers || source?.headers;

                    // Stores the headers returned with the response or the request headers that were passed
                    this.#headers = new HttpResponseHeaders( this.frameworkHeaders || pConfig?.headers || source?.headers ) || this.frameworkHeaders;

                    this.#status = this.#frameworkResponse?.status || pResponse?.status;

                    this.#error = [pResponse, pConfig].find( isError ) || null;

                    this.#error = isError( this.#error ) ? resolveError( this.#error ) : null;

                    // Stores the url path from which the response actually came (in the case of redirects) or the url/path of the request
                    this.#url = cleanUrl( asString( asString( this.#frameworkResponse?.url || this.#response?.url || pConfig?.url || source?.url, true ) ||
                                                    asString( pConfig?.url, true ) || _slash, true ) );

                    // Stores the configuration returned with the response
                    // or the configuration used to make the request for which this is the response
                    this.#config = new HttpConfig( toHttpConfigLiteral( pConfig ), this.#headers, this.#url );

                    this.#responseType = this.#config?.responseType || HttpConfig.calculateResponseType( readProperty( this.#headers, "accept" ) );

                    // this.#response = this.#frameworkResponse;
                    if ( isNonNullObject( source ) )
                    {
                        this.#response = attempt( () => new HttpResponse( (source || pResponse || this.#config),
                                                                          (this.#config),
                                                                          (this.#url || this.#config.url) ) ) || source || pConfig;
                    }
                    else
                    {
                        this.#response = this.#frameworkResponse || pResponse;
                    }

                    // construct an instance of HttpStatus as a helper for evaluating the status
                    this.#httpStatus = attempt( () => HttpStatus.fromCode( this.status ) ) ||
                                       attempt( () => HttpStatus.fromResponse( this.frameworkResponse || this.#response ) ) ||
                                       attempt( () => HttpStatus.fromCode( this.statusText ) ) ||
                                       attempt( () => new HttpStatus( asInt( this.status ), asString( this.statusText || "UNKNOWN", true ) ) );


                }
            }
        }

        get response()
        {
            return attempt( () => cloneResponse( HttpResponse.resolveResponse( this.#response || this.#frameworkResponse ) ) );
        }

        get frameworkResponse()
        {
            return asObject( this.#frameworkResponse || this.#response );
        }

        get status()
        {
            return asInt( this.#status || this.frameworkResponse?.status || this.#response?.status );
        }

        get httpStatus()
        {
            return this.#httpStatus || HttpStatus.fromCode( this.status );
        }

        get statusText()
        {
            return asString( this.frameworkResponse?.statusText || STATUS_TEXT[asInt( this.status )], true );
        }

        get url()
        {
            return this.#url;
        }

        get responseType()
        {
            return this.#responseType || HttpConfig.calculateResponseType( readProperty( this.headers, "accept" ) );
        }

        get headers()
        {
            return attempt( () => new HttpResponseHeaders( this.#headers || this.frameworkHeaders || this.#frameworkResponse?.headers || this.config?.headers ) ) || this.frameworkHeaders;
        }

        get headersLiteral()
        {
            let headers = asObject( this.headers );
            return isFunction( headers?.toLiteral ) ? headers.toLiteral() : toObjectLiteral( headers || {} );
        }

        get frameworkHeaders()
        {
            return this.#frameworkHeaders || this.#frameworkResponse?.headers || this.#response?.headers || this.config?.headers;
        }

        get config()
        {
            return asObject( this.#config ) || {};
        }

        get data()
        {
            let content = this.#data || this.frameworkResponse?.data || this.response?.data || this.response?.body || this.frameworkResponse?.body;

            if ( isNull( content ) || (isString( content ) && isBlank( content )) )
            {
                content = this.response ? this.response.body : content;
            }

            if ( "json" === this.responseType ||
                 ["application/json"].includes( readProperty( this.headers, "content-type" ) )
                 || isJson( content ) )
            {
                content = attempt( () => asObject( content ) || parseJson( content ) );

                let populatedObjectOptions =
                    {
                        minimumLength: 1,
                        acceptArrays: true,
                        countDeadBranches: false
                    };

                if ( !isPopulatedObject( content, populatedObjectOptions ) )
                {
                    content = this.#data || this.frameworkResponse?.data || this.response?.data || this.response?.body;
                    if ( isNull( content ) || (isString( content ) && isBlank( content )) )
                    {
                        content = this.response ? (this.response.data || this.frameworkResponse?.data || this.response.body || this.frameworkResponse?.body) : (this.frameworkResponse ? this.frameworkResponse?.data || this.frameworkResponse?.body : content);
                    }
                }
            }

            return content;
        }

        get request()
        {
            this.#request = new HttpRequest( this.#request || new HttpRequest( this.#response?.request || this?.frameworkResponse?.request || this.config.request || this.config ) );
            return toObjectLiteral( this.#request || this.config.request || this.config, { maxDepth: 2 } );
        }

        get error()
        {
            return isError( this.#error ) ? this.#error : isError( this.#frameworkResponse ) ? this.#frameworkResponse : null;
        }

        get ok()
        {
            return isNonNullObject( this.httpStatus ) ? this.httpStatus.isValid() : (OK_STATUSES.includes( asInt( this.status ) ));
        }

        isError()
        {
            return ( !isNull( this.error ) && isError( this.error )) || (this.httpStatus?.isError()) || isError( this.frameworkResponse );
        }

        isRedirect()
        {
            if ( isNonNullObject( this.httpStatus ) ? this.httpStatus.isRedirect() : REDIRECT_STATUSES.includes( asInt( this.status ) ) )
            {
                // noinspection JSUnresolvedReference
                let loc = readProperty( this.headers, "location" );

                // noinspection JSUnresolvedReference
                return !isBlank( loc );
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
                return readProperty( this.headers, "location" );
            }
            return _mt;
        }

        get retryAfterMilliseconds()
        {
            let millis = Math.max( 100, asInt( DEFAULT_RETRY_DELAY[this.status] ) );

            millis = !isNullOrNaN( millis ) ? millis : 100;

            const responseHeaders = new HttpResponseHeaders( this.headers || this.response?.headers );

            let retryAfter = attempt( () => readProperty( responseHeaders, "Retry-After" ) );

            retryAfter = retryAfter || attempt( () => readProperty(responseHeaders, "X-Retry-After" ) );

            return calculateRetryDelay( retryAfter, millis );
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
                return isPromise( this.data ) ? await asyncAttempt( async() => await this.data ) : this.data;
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
                let data = await asyncAttempt( async() => await this.data );
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

        async pipeToFile( pFilePath )
        {
            const filePath = asString( pFilePath, true );
            return await asyncAttempt( async() => await pipeToFile( this, filePath ) );
        }

        clone()
        {
            return new ResponseData( cloneResponse( this.frameworkResponse || this.response ), this.config );
        }

        #setPropertiesFromInstance( pResponseData, pConfig )
        {
            const me = this;

            if ( isNonNullObject( pResponseData ) && pResponseData instanceof this.constructor )
            {
                const source = attempt( () => HttpResponse.resolveResponse( pResponseData.response ) ) || {};

                this.#frameworkResponse = pResponseData?.frameworkResponse || pResponseData.response || source;

                this.#data = pResponseData?.data || this.#frameworkResponse?.data || source?.body;

                this.#frameworkHeaders = pResponseData?.frameworkHeaders || this.#frameworkResponse?.headers || source?.headers;

                this.#status = pResponseData?.status || this.#frameworkResponse?.status || source?.status;

                this.#error = pResponseData?.error || isError( pResponseData ) ? pResponseData : isError( this.#frameworkResponse ) ? this.#frameworkResponse : null;

                this.#error = isError( this.#error ) ? resolveError( this.#error ) : null;

                this.#response = attempt( () => cloneResponse( pResponseData?.response || this.frameworkResponse ) );

                this.#httpStatus = new HttpStatus( pResponseData?.status || this.#status, pResponseData?.statusText || this.#frameworkResponse?.statusText );

                // Stores the headers returned with the response or the request headers that were passed
                this.#headers = attempt( () => new HttpResponseHeaders( pResponseData?.headers || pResponseData?.frameworkHeaders || pConfig?.headers ) ) ||
                                attempt( () => new HttpResponseHeaders( pResponseData?.frameworkHeaders || {} ) ) || pResponseData?.frameworkHeaders;

                this.#url = pResponseData.url || cleanUrl( asString( asString( this.#response?.url || this.#frameworkResponse?.url, true ) || asString( pConfig.url, true ) || _slash, true ) );

                this.#config = new HttpConfig( pResponseData?.config || pResponseData?.httpConfig, this.#headers, this.#url );

                attempt( () => me.#request = toObjectLiteral( pResponseData.request || pConfig.request, { maxDepth: 2 } ) );

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
                                                 if ( isNull( me[key] ) && isWritable( me, key ) )
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
            this.#data = isPromise( this.#data ) ? await asyncAttempt( async() => await this.#data ) : this.#data;
            return this.#data;
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

            let responseHeaders = attempt( () => new HttpResponseHeaders( headers ) ) || headers;

            let retryAfter = attempt( () => readProperty(responseHeaders, "Retry-After" ) );

            retryAfter = retryAfter || attempt( () => readProperty(responseHeaders, "X-Retry-After" ) );

            retryAfter = retryAfter || attempt( () => headers["Retry-After"] ) || attempt( () => headers["retry-after"] );

            retryAfter = retryAfter || attempt( () => headers["X-Retry-After"] ) || attempt( () => headers["x-retry-after"] );

            return calculateRetryDelay( retryAfter, millis );
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

        let obj = asObject( pObject || pConfig || pOptions || {} ) || {};

        const response = obj?.response || pConfig?.response || pOptions?.response || obj;

        const config = pConfig || obj?.config || response?.config;

        if ( isError( obj ) )
        {
            return new ResponseData( obj || response, config );
        }

        return new ResponseData( response, config );
    };

    ResponseData.asyncFrom = async function( pObject, pConfig )
    {
        let obj = (asObject( pObject || pConfig || {} ) || {});

        if ( isPromise( obj ) )
        {
            obj = await asyncAttempt( async() => await obj );
        }

        if ( ResponseData.isResponseData( obj ) )
        {
            if ( isPromise( obj.data ) )
            {
                await asyncAttempt( async() => await obj.resolveData() );
            }

            return ResponseData.from( obj, pConfig );
        }

        const response = obj?.response || pConfig?.response || obj;

        const config = pConfig || obj?.config || response?.config;

        let responseData = new ResponseData( response, config );

        await asyncAttempt( async() => await responseData.resolveData() );

        return responseData;
    };

    ResponseData.exceedsRateLimit = function( pResponseData )
    {
        return (ResponseData.isResponseData( pResponseData ) && pResponseData.isExceedsRateLimit()) || RATE_LIMIT_EXCEEDED_STATUSES.includes( pResponseData?.status );
    };

    ResponseData.isOk = function( pResponseData )
    {
        if ( ResponseData.isResponseData( pResponseData ) )
        {
            return pResponseData.ok || (pResponseData.httpStatus.isOk());
        }
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
        return new ResponseData( error, message );
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
            streamToFile,
            pipeToFile
        };

    mod = toolBocksModule.extend( mod );

    return mod.expose( mod, INTERNAL_NAME, (_ud !== typeof module ? module : mod) ) || mod;

}());
