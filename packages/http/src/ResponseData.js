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
        resolveError,
        getLastError,
        lock,
        localCopy,
        attempt,
        asyncAttempt,
        isWritable
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
        asObject
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

    const { HttpResponseHeaders } = httpHeaders;

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

    const modName = "ResponseData";

    const toolBocksModule = new ToolBocksModule( modName, INTERNAL_NAME );

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
         * @type {Headers|HttpResponseHeaders|Map<String,String>|Object}
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
            const source = ResponseData.resolveSource( pResponse?.response || pError?.response || pResponse || pError || pConfig || { url: pUrl, ...(pConfig || {}) } );

            const config = asObject( pConfig || pResponse || pError || source ) || {};

            if ( !isReadOnly( config ) && isWritable( config, "url" ) )
            {
                config.url = cleanUrl( config.url || source?.url || asString( pUrl, true ) );
            }

            if ( isNonNullObject( source ) )
            {
                let data = source.data || pResponse?.data || config.data;

                let headers = source.headers || pResponse?.headers || config.headers;

                let status = source.status || pResponse?.status || config.status;

                // Some frameworks return the response as a property of an error returned in place of a response.
                // See https://axios-http.com/docs/handling_errors, for example
                let res = source.response || pError?.response || source || pResponse || pError || config;

                while ( isNonNullObject( res ) && isNonNullObject( res.response ) )
                {
                    res = res.response;
                }

                if ( isWritable( res, "data" ) )
                {
                    attempt( () => res.data = data || res.data || source.data || config.data );
                }

                if ( isWritable( res, "headers" ) )
                {
                    attempt( () => res.headers = headers || res.headers || source.headers || config.headers );
                }

                if ( isWritable( res, "status" ) )
                {
                    attempt( () => res.status = status || res.status || source.status || config.status );
                }

                this.response = attempt( () => new HttpResponse( (res || source || config),
                                                                 (config || source || res),
                                                                 (config.url || res.url || pUrl) ) ) || source || config;

                // assign the numeric value of the response status to this instance
                this.status = asInt( status || this.response?.status || res.status || source.status || config.status );

                // assign the string value of the response status to this instance
                this.statusText = asString( this.response?.statusText || res?.statusText || source.statusText || ResponseData.generateStatusText( asInt( this.status ) ), true );

                // construct an instance of HttpStatus as a helper for evaluating the status
                this.#httpStatus = attempt( () => HttpStatus.fromCode( this.status ) ) ||
                                   attempt( () => HttpStatus.fromResponse( this.response ) ) ||
                                   attempt( () => HttpStatus.fromCode( this.statusText ) ) ||
                                   new HttpStatus( asInt( this.status ), asString( this.statusText || "UNKNOWN", true ) );

                // Assigns the data property of the response to this instance if there is one,
                // such as would be the case when using the Axios framework, for example.
                this.data = (data || this.response?.data || res?.data || source?.data || config?.data);

                // Stores the configuration returned with the response
                // or the configuration used to make the request for which this is the response
                this.config = this.response?.config || config || source.config;

                // Stores the headers returned with the response or the request headers that were passed
                this.headers = new HttpResponseHeaders( headers || this.response?.headers || res?.headers || source?.headers || source?.config?.headers || config?.headers || config );

                // Stores the url path from which the response actually came (in the case of redirects) or the url/path of the request
                this.url = asString( asString( this.response?.url, true ) || asString( config.url, true ) || asString( pUrl, true ), true ) || _slash;

                // Stores the request object associated with this response or synthesizes one
                try
                {
                    const req = attempt( () => this.response?.request ||
                                               source.request ||
                                               res.request ||
                                               config.request ||
                                               config ||
                        {
                            url: this.url || asString( pUrl, true ) || _slash,
                            config: this.config || config || {},
                            abortController: new AbortController()
                        } );

                    if ( isNonNullObject( req ) )
                    {
                        const cloned = attempt( () => cloneRequest( req ) );
                        if ( isNonNullObject( cloned ) )
                        {
                            this.request = attempt( () => new HttpRequest( cloned ) );
                        }
                    }
                }
                catch( ex )
                {
                    // ignored
                }

                // Stores the url path from which the response actually came (in the case of redirects) or the url/path of the request
                this.url = asString( this.response?.url || this.request?.url || asString( pUrl, true ), true ) || _slash;
            }

            // Stores an error object if the request was unsuccessful
            this.error = isNonNullObject( source.response || pResponse.response ) ? resolveError( pResponse || source ) || resolveError( pError ) : resolveError( pError || pConfig?.error );
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
                       this.headers?.get( "location" ) || this.headers?.get( "Location" ) || this.headers?.location || this.headers?.Location :
                       this.headers?.location || this.headers?.Location;
            }
            return _mt;
        }

        get retryAfterMilliseconds()
        {
            let millis = Math.max( 100, asInt( DEFAULT_RETRY_DELAY[this.status] ) );

            millis = !isNullOrNaN( millis ) ? millis : 100;

            const responseHeaders = new HttpResponseHeaders( this.headers || this.response?.headers );

            let retryAfter = (responseHeaders.get( "Retry-After" ) || responseHeaders.get( "retry-after" ));

            retryAfter = retryAfter || (responseHeaders.get( "X-Retry-After" ) || responseHeaders.get( "x-retry-after" ));

            if ( isNumeric( retryAfter ) )
            {
                millis = asInt( Math.max( (retryAfter * 1_000), millis ) );
            }
            else if ( isDateString( retryAfter ) || isDate( retryAfter ) )
            {
                let nextDateTime = asDate( retryAfter );
                if ( isDate( nextDateTime ) )
                {
                    millis = Math.max( millis, asInt( nextDateTime.getTime() - Date.now() ) );
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
            return this.response?.bodyUsed || false;
        }

        get stream()
        {
            return isNull( this.data ) ? this.body : toThrottledReadableStream( this.data, 2_048, 0 );
        }

        getThrottledStream( pChuckSize, pDelayMs )
        {
            return isNull( this.data ) ? this.body : toThrottledReadableStream( this.data, pChuckSize, pDelayMs );
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
            return new ResponseData( cloneResponse( this.response ),
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
            const response = attempt( () => cloneResponse( pError?.response || pError || pConfig ) ) || {};

            let err = isError( pError ) ? pError : (isError( response?.error ) ? response?.error : isError( response ) ? response : isError( pConfig?.error ) ? pConfig.error : isError( pConfig ) ? pConfig : null);

            err = isNull( err ) ? null : resolveError( err );

            if ( !isError( err ) )
            {
                return new ResponseData( (response || pError || pConfig),
                                         null,
                                         (pConfig || pError || response),
                                         response?.url || pError?.url || pConfig?.url || pUrl );
            }

            return new ResponseData( cloneResponse( response || pError || pConfig ),
                                     resolveError( err || pError ),
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

                const response = attempt( () => cloneResponse( source.response || source || pObject || pConfig ) ) || source.response || source;

                const err = (isError( response?.error ) ? response?.error : isError( source ) ? source : isError( pObject ) ? pObject : isError( pConfig ) ? pConfig : null);

                const config = asObject( pConfig || source?.config || response.config ) || {};

                const url = pUrl || source.request?.url || response.url || response.request?.url || config.url;

                const data = pObject?.data || source.data || response.data;

                const headers = new HttpResponseHeaders( pObject?.headers || source.headers || response.headers );

                const status = pObject?.status || response.status || config.status;

                attempt( () => response.data = data || response.data );
                attempt( () => response.headers = headers || response.headers );
                attempt( () => response.status = status || response.status );

                let responseData = new ResponseData( response,
                                                     isError( err ) ? err : null,
                                                     config,
                                                     url );

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
            return isNonNullObject( pObject ) ? pObject : (isString( pObject ) && isJson( pObject )) ? attempt( () => parseJson( pObject ) ) : pObject || {};
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

    ResponseData.exceedsRateLimit = function( pResponseData )
    {
        return ResponseData.isResponseData( pResponseData ) && pResponseData.isExceedsRateLimit();
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
                 (Object.hasOwn( pValue, "data" ) || Object.hasOwn( pValue, "body" )) )
            {
                let value = asObject( pValue || pConfig ) || {};

                let config = asObject( pConfig || pValue ) || {};

                let data = value.data || config.data;

                let headers = value.headers || config.headers;

                let response = cloneResponse( value );

                response.data = data || response.data;
                response.headers = new HttpResponseHeaders( headers || response.headers );

                return new ResponseData( response,
                                         null,
                                         (value.config || config || {}),
                                         (value.url || value.request?.url || value.config?.url || pUrl || _mt) );
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
        let response = asObject( pResponse?.response || pResponse || pConfig ) || {};

        let config = asObject( pConfig || response.config || response ) || {};

        let data = response.data || pResponse?.data || config.data;

        let headers = response.headers || pResponse?.headers || config.headers;

        let status = response.status || pResponse?.status || config.status;

        let url = response?.url || pResponse?.url || config?.url || asString( pUrl );

        response = attempt( () => cloneResponse( response || pResponse, config ) ) || response;

        headers = new HttpResponseHeaders( headers || response.headers || config.headers );

        attempt( () => response.status = status || response.status || config.status );
        attempt( () => response.data = data || response.data || config.data );
        attempt( () => response.headers = headers || response.headers );

        let res =
            {
                status: asInt( status || response.status || config.status || STATUS_CODES.CLIENT_ERROR ),
                statusText: response.statusText || pResponse?.statusText || config.statusText || STATUS_TEXT_ARRAY[asInt( status || response.status || config.status )] || STATUS_TEXT[asString( status || response.status || pResponse?.status || STATUS_CODES.CLIENT_ERROR, true )],
                data: data || response.data || config.data,
                headers: headers || response?.headers || pResponse.headers || response?.config?.headers || config?.headers || config,
                config: response?.config || config,
                url: url || response.url || pResponse?.url || config.url || pUrl,
                request: response?.request || config.request || attempt( () => new Request( response?.url || config?.url || asString( pUrl ), config ) ),
                response: attempt( () => new HttpResponse( response, config, (response?.url || config?.url || asString( pUrl )) ) )
            };

        return new ResponseData( res, null, config, url );
    }

    function populateErrorResponse( pError, pConfig, pUrl )
    {
        let error = resolveError( pError, pConfig );

        let config = asObject( pConfig || error ) || {};

        let response = pError?.response || error?.response || error || config;

        while ( isNonNullObject( response ) && isNonNullObject( response.response ) )
        {
            response = response.response;
        }

        let obj =
            {
                status: error?.status || response?.status || config.status || STATUS_CODES.CLIENT_ERROR,
                statusText: error?.message || response?.statusText || STATUS_TEXT_ARRAY[asInt( response?.status || STATUS_CODES.CLIENT_ERROR )] || STATUS_TEXT[ucase( asString( response?.status || STATUS_CODES.CLIENT_ERROR, true ) )],
                data: response?.data || pError?.data || error?.details || response?.body || {},
                headers: response?.headers || error?.headers || config.headers,
                config: response?.config || config || {},
                url: response?.url || config?.url || asString( pUrl ),
                error,
                response
            };

        return ResponseData.fromError( obj, config, obj.url || pUrl );
    }

    let mod =
        {
            dependencies,
            classes:
                {
                    ResponseData
                },
            ResponseData,
            populateResponseData,
            populateErrorResponse,
            HttpStatus,
            STATUS_CODES,
            VERBS,
            resolveHttpMethod
        };

    mod = toolBocksModule.extend( mod );

    return mod.expose( mod, INTERNAL_NAME, (_ud !== typeof module ? module : mod) ) || mod;

}());
