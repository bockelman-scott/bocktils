/**
 * @fileOverview
 * This module defines a facade for the Web API Response object<br>
 * intended to encapsulate and hide the differences
 * between the way Node.js, Deno, browsers,
 * and other execution environments model an HTTP Response.<br>
 * <br>
 *
 * @module HttpResponse
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

// we need our JSON utilities
const jsonUtils = require( "@toolbocks/json" );

// import the HTTP constants
const httpConstants = require( "./HttpConstants.cjs" );

// import the other dependencies
const httpHeaders = require( "./HttpHeaders.cjs" );

const httpRequest = require( "./HttpRequest.cjs" );

/**
 * Establish separate constants for each of the common utilities imported
 * @see ../src/CommonUtils.cjs
 */
const { moduleUtils, constants, typeUtils, stringUtils, arrayUtils } = core;

const {
    _ud = "undefined", $scope = constants?.$scope || function()
    {
        return (_ud === typeof self ? ((_ud === typeof global) ? {} : (global || {})) : (self || {}));
    }
} = constants;

// noinspection FunctionTooLongJS
(function exposeModule()
{
    const INTERNAL_NAME = "__BOCK__HTTP_RESPONSE__";

    if ( $scope() && (null != $scope()[INTERNAL_NAME]) )
    {
        return $scope()[INTERNAL_NAME];
    }

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
            httpRequest
        };

    const {
        ToolBocksModule,
        ObjectEntry,
        objectEntries,
        populateOptions,
        localCopy,
        attempt,
        asyncAttempt,
        $ln
    } = moduleUtils;

    const { _mt_str = "", _mt = _mt_str, S_ERR_PREFIX, _slash = "/" } = constants;

    const
        {
            isNull,
            isNonNullObject,
            isString,
            isFunction,
            isScalar,
            isObjectLiteral,
            asObject
        } = typeUtils;

    const { asString, asInt, isBlank, cleanUrl, isJson } = stringUtils;

    const { asJson, parseJson } = jsonUtils;

    const { toReadableStream, toThrottledReadableStream } = bufferUtils;

    const { STATUS_CODES, HttpStatus } = httpConstants;

    const { HttpHeaders, HttpResponseHeaders } = httpHeaders;

    const { HttpUrl, HttpRequest, cloneRequest } = httpRequest;

    const modName = "HttpResponse";

    const toolBocksModule = new ToolBocksModule( modName, INTERNAL_NAME );

    function cloneObjectAsResponse( pObject, pOptions )
    {
        let obj = {};

        let options = asObject( pOptions || pObject ) || {};

        const entries = attempt( () => objectEntries( pObject || options ) );

        const data = pObject?.data || options.data;
        const headers = pObject.headers || options.headers;
        const status = pObject?.status || options.status;

        if ( entries && isFunction( entries.forEach ) )
        {
            const processEntry = entry =>
            {
                const key = ObjectEntry.getKey( entry );
                const value = ObjectEntry.getValue( entry );

                if ( isString( key ) && !isBlank( key ) && value )
                {
                    if ( isScalar( value ) )
                    {
                        obj[key] = value;
                    }
                    else if ( isFunction( value ) )
                    {
                        obj[key] = value.bind( obj );
                    }
                    else
                    {
                        if ( isFunction( value?.clone ) )
                        {
                            obj[key] = attempt( () => value.clone() ) || value;
                        }
                        else if ( "headers" === key )
                        {
                            obj[key] = new HttpResponseHeaders( cloneHeaders( value ) );
                        }
                        else if ( isObjectLiteral( value ) )
                        {
                            obj[key] = attempt( () => localCopy( value ) );
                        }
                    }
                }
            };

            entries.forEach( entry => attempt( () => processEntry( entry ) ) );
        }
        else
        {
            obj = { ...pOptions };
        }

        if ( _ud !== Response )
        {
            const body = data || obj.data || obj.body || obj;

            let response = new Response( body, options );

            response.status = status || obj.status || response.status;
            response.data = data || obj.data || response.data;
            response.headers = new HttpResponseHeaders( headers || obj.headers || response.headers );

            return response;
        }

        return obj || options;
    }

    const cloneResponse = function( pResponse, pOptions )
    {
        if ( isNull( pResponse ) && isNull( pOptions ) )
        {
            return null;
        }

        let options = populateOptions( pOptions, DEFAULT_RESPONSE_OPTIONS );

        let res = asObject( pResponse || options?.response || options || {} ) || {};

        let data = res.data || options.data;

        let headers = cloneHeaders( res.headers || options.headers );

        // unwrap the response from any container
        while ( isNonNullObject( res ) && isNonNullObject( res.response ) )
        {
            res = res.response;
            data = data || res.data || options.data;
        }

        if ( isNonNullObject( res ) )
        {
            if ( isFunction( res?.clone ) )
            {
                res = attempt( () => res.clone() ) || res;
            }
            else
            {
                res = attempt( () => cloneObjectAsResponse( res, options ) );
            }
        }

        res.headers = new HttpResponseHeaders( headers );

        res.data = data || res.data;

        return res || { ...(options || {}) };
    };

    const cloneHeaders = function( pHeaders )
    {
        let headers = asObject( pHeaders || {} ) || {};

        // unwrap the headers from any container
        while ( isNonNullObject( headers ) && isNonNullObject( headers.headers ) )
        {
            headers = headers.headers;
        }

        if ( isNull( headers ) )
        {
            return new HttpResponseHeaders();
        }

        if ( headers instanceof HttpHeaders )
        {
            return new HttpResponseHeaders( headers );
        }

        if ( isString( headers ) )
        {
            if ( isJson( headers ) )
            {
                headers = attempt( () => parseJson( headers ) );
            }
            else
            {
                const arr = asString( headers ).split( /[\r\n]/ );
                if ( $ln( arr ) )
                {
                    return new HttpResponseHeaders( arr );
                }
            }
        }

        if ( isNonNullObject( headers ) )
        {
            if ( isFunction( headers?.clone ) )
            {
                headers = attempt( () => headers.clone() ) || headers;
            }
            else
            {
                headers = attempt( () => localCopy( headers ) ) || headers;
            }
        }

        return new HttpResponseHeaders( headers );
    };

    const DEFAULT_RESPONSE_OPTIONS =
        {};

    class HttpResponse extends EventTarget
    {
        #response;

        #request;

        #url;

        #headers;

        #data;

        #status;
        #ok;

        #type;

        #options;

        #text;
        #json;
        #formData;
        #bytes;
        #blob;
        #arrayBuffer;

        constructor( pResponse, pOptions = DEFAULT_RESPONSE_OPTIONS, pUrl )
        {
            super();

            const me = this;

            const options = populateOptions( pOptions || pResponse, pResponse, DEFAULT_RESPONSE_OPTIONS );

            options.url = options.url || pUrl;

            const res = attempt( () => HttpResponse.resolveResponse( pResponse || options, options ) ) || pResponse || options;

            this.#headers = attempt( () => (res.headers || pResponse?.headers || options.headers || new HttpResponseHeaders( options )) );

            this.#response = attempt( () => (res || pResponse || options.response || options) );

            this.#status = HttpStatus.fromCode( res.status || pResponse?.status || options.status ) || attempt( () => HttpStatus.fromResponse( res || options.response || options, options ) );

            this.#ok = this.#ok || this.#status?.isOk() || res?.ok || pResponse?.ok;

            this.#url = cleanUrl( asString( res?.url || options?.url || pUrl, true ) ) || _slash;

            this.#request = res.request || options.request || new HttpRequest( HttpUrl.resolveUrl( this.#url || options.url || pUrl ), options );

            this.#data = res.data || pResponse?.data || options.data;

            this.#options = attempt( () => populateOptions( options, me ) ) || options;
        }

        /**
         * Unwraps the response object from any containers it may be wrapped in.
         * This response will be converted into a Fetch API Response object.
         *
         * @param {Object|HttpResponse|Response} pResponse a response or an object with a response property
         * @param {Object} pOptions  other values that should be considered or added to the response
         *
         * @returns {Response|Object}
         */
        static resolveResponse( pResponse, pOptions )
        {
            const options = asObject( pOptions || DEFAULT_RESPONSE_OPTIONS );

            let response = HttpResponse.unwrapResponse( pResponse, options );

            if ( _ud !== Response )
            {
                response = response instanceof Response ? response : new Response( response.data || options.data || _mt, options );
            }

            if ( response instanceof this.constructor )
            {
                return response.response || response;
            }

            return response;
        }

        static unwrapResponse( pResponse, pOptions )
        {
            let response = asObject( pResponse?.response || pResponse || pOptions?.response || pOptions || {} ) || {};

            while ( isNonNullObject( response ) && isNonNullObject( response.response ) )
            {
                response = response.response;
            }

            return response;
        }

        get options()
        {
            return populateOptions( this.#options || {}, DEFAULT_RESPONSE_OPTIONS );
        }

        get response()
        {
            return HttpResponse.resolveResponse( this.#response, this.options );
        }

        clone()
        {
            return new HttpResponse( cloneResponse( this.response ), this.options );
        }

        get data()
        {
            return this.#data || this.options.data;
        }

        get body()
        {
            const res = cloneResponse( this.response );
            return res.bodyUsed ? toReadableStream( this.data || _mt ) : res.body || toReadableStream( this.data || _mt );
        }

        get bodyUsed()
        {
            return !!this.response?.bodyUsed;
        }

        get stream()
        {
            return toThrottledReadableStream( this.data || this.body, 2_048, 0 );
        }

        getThrottledStream( pChuckSize, pDelayMs )
        {
            return toThrottledReadableStream( this.data || this.body, pChuckSize, pDelayMs );
        }

        async arrayBuffer()
        {
            if ( isNonNullObject( this.#arrayBuffer ) )
            {
                return this.#arrayBuffer;
            }

            const res = cloneResponse( this.response );

            if ( isNonNullObject( res ) && isFunction( res?.arrayBuffer ) )
            {
                this.#arrayBuffer = await asyncAttempt( async() => await res.arrayBuffer() );

                return this.#arrayBuffer;
            }
        }

        async blob()
        {
            if ( isNonNullObject( this.#blob ) )
            {
                return this.#blob;
            }

            const res = cloneResponse( this.response );

            if ( isNonNullObject( res ) && isFunction( res?.blob ) )
            {
                this.#blob = await asyncAttempt( async() => await res.blob() );

                return this.#blob;
            }
        }

        async bytes()
        {
            if ( isNonNullObject( this.#bytes ) )
            {
                return this.#bytes;
            }

            const res = cloneResponse( this.response );

            if ( isNonNullObject( res ) && isFunction( res?.bytes ) )
            {
                this.#bytes = await asyncAttempt( async() => await res.bytes() );

                return this.#bytes;
            }
        }

        async formData()
        {
            if ( isNonNullObject( this.#formData ) )
            {
                return this.#formData;
            }

            const res = cloneResponse( this.response );

            if ( isNonNullObject( res ) && isFunction( res?.formData ) )
            {
                this.#formData = await asyncAttempt( async() => await res.formData() );

                return this.#formData;
            }
        }

        async json()
        {
            if ( isNonNullObject( this.#json ) )
            {
                return this.#json;
            }

            const res = cloneResponse( this.response );

            if ( isNonNullObject( res ) && isFunction( res?.json ) )
            {
                this.#json = await asyncAttempt( async() => await res.json() );

                return this.#json;
            }
        }

        async text()
        {
            if ( isNonNullObject( this.#text ) )
            {
                return this.#text;
            }

            const res = cloneResponse( this.response );

            if ( isNonNullObject( res ) && isFunction( res?.text ) )
            {
                this.#text = await asyncAttempt( async() => await res.text() );

                return this.#text;
            }
        }

        get headers()
        {
            return new HttpResponseHeaders( this.#headers || this.response.headers || this.options.headers );
        }

        get ok()
        {
            return this.#ok || (asInt( this.status, 0 ) >= 200 && asInt( this.status, 0 ) < 300);
        }

        get request()
        {
            if ( isNonNullObject( this.#request || this.options.request ) )
            {
                return cloneRequest( this.#request || this.options.request );
            }
            return this.options;
        }

        get redirected()
        {
            return this.#response?.redirected || false;
        }

        get status()
        {
            return this.#status?.code || this.#status;
        }

        get statusText()
        {
            return this.#status?.name || this.#response?.statusText || _mt_str;
        }

        get type()
        {
            return this.#type || this.#response?.type || _mt_str;
        }

        get url()
        {
            return this.#url || this.response?.url || this.request?.url || this.options?.url || _mt_str;
        }
    }

    HttpResponse.error = function()
    {
        if ( _ud !== typeof Response && isFunction( Response?.error ) )
        {
            return new HttpResponse( Response.error() );
        }
        return new HttpResponse( { type: "error", status: 500, statusText: S_ERR_PREFIX + " fetching resource" } );
    };

    HttpResponse.redirect = function( pUrl, pStatus = STATUS_CODES.FOUND )
    {
        if ( _ud !== typeof Response && isFunction( Response?.redirect ) )
        {
            return new HttpResponse( attempt( () => Response.redirect( pUrl, asInt( pStatus ) ) ) );
        }
        return new HttpResponse( { url: pUrl, status: pStatus } );
    };

    // noinspection JSUnresolvedReference
    HttpResponse.json = function( pData, pOptions )
    {
        let data = isNonNullObject( pData ) ? pData : isString( pData ) ? attempt( () => parseJson( pData ) ) : {};

        if ( _ud !== typeof Response && isFunction( Response?.json ) )
        {
            return new HttpResponse( Response.json( data, pOptions ),
                                     {
                                         response: {
                                             type: "json",
                                             status: 200,
                                             statusText: "OK",
                                             body: asJson( data )
                                         }
                                     } );
        }

        return new HttpResponse( { body: asJson( data ), status: 200, statusText: "OK", data },
                                 {
                                     response: {
                                         type: "json",
                                         status: 200,
                                         statusText: "OK",
                                         body: asJson( data ),
                                         data
                                     }
                                 } );
    };

    let mod =
        {
            dependencies,
            classes:
                {
                    HttpStatus,
                    HttpResponseHeaders,
                    HttpResponse
                },
            HttpStatus,
            HttpResponseHeaders,
            HttpResponse,
            cloneResponse,
            cloneHeaders,

        };

    mod = toolBocksModule.extend( mod );

    return mod.expose( mod, INTERNAL_NAME, (_ud !== typeof module ? module : mod) ) || mod;

}());
