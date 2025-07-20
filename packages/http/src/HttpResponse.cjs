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
        asyncAttempt
    } = moduleUtils;

    const { _mt_str, _str, _num, _big, S_ERR_PREFIX } = constants;

    const
        {
            isNull,
            isNonNullObject,
            isString,
            isArray,
            isMap,
            isFunction,
            isAsyncFunction,
            isScalar,
            isObjectLiteral
        } = typeUtils;

    const { asString, asInt, isBlank, lcase, ucase, isJson } = stringUtils;

    const { asJson, parseJson } = jsonUtils;

    const { isHeader, STATUS_CODES, STATUS_TEXT, HttpStatus } = httpConstants;

    const { HttpResponseHeaders } = httpHeaders;

    const { HttpRequest, cloneRequest } = httpRequest;

    const modName = "HttpResponse";

    const toolBocksModule = new ToolBocksModule( modName, INTERNAL_NAME );

    const cloneResponse = function( pResponse )
    {
        let res = pResponse;

        if ( isNull( res ) )
        {
            return null;
        }

        // unwrap the response from any container
        while ( res.response )
        {
            res = res.response;
        }

        if ( isNonNullObject( res ) )
        {
            if ( isFunction( res?.clone ) )
            {
                return new HttpResponse( attempt( () => res.clone() ) || res );
            }
            else
            {
                const obj = {};

                const entries = attempt( () => objectEntries( res ) );

                if ( entries && isFunction( entries.forEach ) )
                {
                    entries.forEach( entry =>
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
                                                     obj[key] = attempt( () => value.clone() );
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
                                     } );
                }

                return new HttpResponse( obj );
            }
        }
    };

    const cloneHeaders = function( pHeaders )
    {
        let headers = pHeaders || {};

        // unwrap the headers from any container
        while ( headers.headers )
        {
            headers = headers.headers;
        }

        if ( isNull( headers ) )
        {
            return new HttpResponseHeaders();
        }

        if ( headers instanceof HttpResponseHeaders )
        {
            return headers;
        }

        if ( isString( headers ) && isJson( headers ) )
        {
            headers = attempt( () => parseJson( headers ) );
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
        #bodyUsed;

        #data;

        #status;
        #ok;

        #type;

        #options;

        #resolvedBody;

        #text;
        #json;
        #formData;
        #bytes;
        #blob;
        #arrayBuffer;

        constructor( pResponse, pOptions = DEFAULT_RESPONSE_OPTIONS )
        {
            super();

            const me = this;

            const options = populateOptions( pOptions, DEFAULT_RESPONSE_OPTIONS );

            const res = attempt( () => me.resolveResponse( pResponse, options ) );

            const req = new HttpRequest( res?.request || options?.request );

            this.#headers = attempt( () => cloneHeaders( res?.headers || options?.headers || req?.headers ) );

            this.#response = (res instanceof this.constructor) ? res : attempt( () => cloneResponse( res ) );

            this.#status = this.resolveStatus( this.#response, options );

            this.#ok = this.#ok || this.#status.isOk();

            this.#url = asString( res?.url || req?.url || options?.url, true );

            this.#request = isNonNullObject( req ) ? attempt( () => cloneRequest( req ) ) : options.request || new HttpRequest();

            this.#data = pResponse?.response?.data || pResponse?.data || this.#response?.data;

            this.#options = populateOptions( {
                                                 response: cloneResponse( this.#response ),
                                                 request: req,
                                                 headers: cloneHeaders( this.#headers )
                                             },
                                             options );
        }

        _resolveBody( pResponse, pOptions )
        {
            const options = populateOptions( (pOptions || pResponse?.options),
                                             DEFAULT_RESPONSE_OPTIONS );

            let res = pResponse?.response || pResponse || options?.response || options;

            // unwrap the response for any containers
            while ( res.response )
            {
                res = res.response;
            }

            let body = res?.data || res?.body || options?.body || options?.data || pResponse?.body || pResponse?.data;

            if ( isNull( body ) )
            {
                body = options?.body || options?.data || {};
            }

            if ( isFunction( body ) )
            {
                if ( isAsyncFunction( body ) )
                {
                    // cannot handle async in synchronous context
                    // we'll check for Promise
                    body = asyncAttempt( async() => await body.call( res ) );
                }
                else
                {
                    body = attempt( () => body.call( res, body ) );
                }
            }

            return body || {};
        }

        resolveResponse( pResponse, pOptions )
        {
            const options = populateOptions( pOptions, DEFAULT_RESPONSE_OPTIONS );

            let response = pResponse?.response || pResponse || options?.response;

            while ( response.response )
            {
                response = response.response;
            }

            if ( isNonNullObject( response ) )
            {
                if ( response instanceof this.constructor )
                {
                    return response;
                }
                response = cloneResponse( response );
            }
            else
            {
                const body = this._resolveBody( response || options, options );

                if ( _ud !== typeof Response )
                {
                    response = new Response( body || options?.body || response?.data || options?.data || {}, options );
                }
                else if ( !isNull( body ) )
                {
                    response =
                        {
                            body: body || options?.body || options?.data,
                            status: options?.status || (!isNull( body ) ? STATUS_CODES.OK : STATUS_CODES.NOT_FOUND),
                            statusText: options?.statusText,
                            type: options?.type,
                            ...(pResponse || {})
                        };
                }
            }

            return response;
        }

        get options()
        {
            return populateOptions( this.#options || {}, DEFAULT_RESPONSE_OPTIONS );
        }

        clone()
        {
            return new HttpResponse( cloneResponse( this.#response ), this.options );
        }

        resolveStatus( pResponse, pOptions )
        {
            const options = populateOptions( pOptions || pResponse?.options,
                                             DEFAULT_RESPONSE_OPTIONS );

            const res = pResponse?.response || pResponse || options?.response || options;

            if ( isNull( res ) )
            {
                this.#ok = options?.ok || false;
                this.#status = new HttpStatus( options?.status || STATUS_CODES.NOT_FOUND,
                                               STATUS_TEXT[asString( options?.status || STATUS_CODES.NOT_FOUND )] );
            }
            else if ( isNonNullObject( pResponse || options?.response ) )
            {
                const code = res?.statusCode || res?.status || options?.status || STATUS_CODES.NOT_FOUND;

                const msg = res?.statusMessage || res?.statusText || options?.statusText || STATUS_TEXT[asString( code )] || _mt_str;

                this.#status = new HttpStatus( code, msg );

                this.#ok = this.#status.isOk();
            }
            else
            {
                switch ( typeof res )
                {
                    case _str:
                        this.#status = HttpStatus[ucase( res )] || new HttpStatus( res, res );
                        break;

                    case _num:
                    case _big:
                        this.#status = new HttpStatus( res, STATUS_TEXT[res] );
                        break;

                    default:
                        this.#status = new HttpStatus( options?.status || STATUS_CODES.NOT_FOUND, STATUS_TEXT[asString( options?.status || STATUS_CODES.NOT_FOUND )] );
                        break;
                }

                this.#ok = this.#status.isOk();
            }

            return this.#status || new HttpStatus();
        }

        async body()
        {
            if ( !isNull( this.#resolvedBody ) )
            {
                return this.#resolvedBody;
            }

            const res = cloneResponse( this.#response );

            if ( isFunction( res.body ) && !res.bodyUsed )
            {
                this.#resolvedBody = await asyncAttempt( async() => await res.body() );
            }

            return this.#resolvedBody;
        }

        get bodyUsed()
        {
            return this.#bodyUsed || this.#response?.bodyUsed || false;
        }

        async arrayBuffer()
        {
            if ( isNonNullObject( this.#arrayBuffer ) )
            {
                return this.#arrayBuffer;
            }

            const res = cloneResponse( this.#response );

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

            const res = cloneResponse( this.#response );

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

            const res = cloneResponse( this.#response );

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

            const res = cloneResponse( this.#response );

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

            const res = cloneResponse( this.#response );

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

            const res = cloneResponse( this.#response );

            if ( isNonNullObject( res ) && isFunction( res?.text ) )
            {
                this.#text = await asyncAttempt( async() => await res.text() );

                return this.#text;
            }
        }

        get headers()
        {
            return this.#headers;
        }

        get ok()
        {
            return this.#ok;
        }

        get request()
        {
            return cloneRequest( this.#request );
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
            return this.#url || this.#response?.url || this.#request?.url || this.options?.url || _mt_str;
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

        return new HttpResponse( { body: asJson( data ), status: 200, statusText: "OK" },
                                 {
                                     response: {
                                         type: "json",
                                         status: 200,
                                         statusText: "OK",
                                         body: asJson( data )
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
