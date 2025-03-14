/**
 * @fileOverview
 * This module defines a facade for the Web API Headers object<br>
 * intended to encapsulate and hide the differences
 * between the way Node.js, Deno, browsers, and other execution environments model HTTP Headers.<br>
 * <br>
 *
 * @module HttpRequest
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

    const { ToolBocksModule, populateOptions, localCopy, attempt } = moduleUtils;

    const { _str, _num, _big, _mt_str, S_ERR_PREFIX } = constants;

    const
        {
            isNull,
            isObject,
            isArray,
            isMap,
            isFunction,
            isString,
            isNonNullObject,
        } = typeUtils;


    const { asString, isBlank, lcase, ucase } = stringUtils;

    const { asJson, parseJson } = jsonUtils;

    const { isHeader, STATUS_CODES, STATUS_TEXT, HttpStatus } = httpConstants;

    const { HttpResponseHeaders } = httpHeaders;

    const { cloneRequest } = httpRequest;

    const modName = "HttpResponse";

    const toolBocksModule = new ToolBocksModule( modName, INTERNAL_NAME );

    const cloneResponse = function( pResponse )
    {
        return isNull( pResponse ) ? null : isFunction( pResponse?.clone ) ? pResponse.clone() : localCopy( pResponse );
    };

    const cloneHeaders = function( pHeaders )
    {
        return new HttpResponseHeaders( isNull( pHeaders ) ? new HttpResponseHeaders() : isFunction( pHeaders?.clone ) ? pHeaders.clone() : localCopy( pHeaders ) );
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

        constructor( pResponse, pOptions = DEFAULT_RESPONSE_OPTIONS )
        {
            super();

            const options = populateOptions( pOptions, DEFAULT_RESPONSE_OPTIONS );

            const res = pResponse || options?.response;
            const req = res?.request || options?.request;

            this.#response = cloneResponse( this.resolveResponse( res, options ) );

            this.#status = this.resolveStatus( this.#response, options );

            this.#ok = this.#status.isOK();

            this.#request = isNonNullObject( req ) ? cloneRequest( req ) : null;

            this.#url = asString( res?.url || req?.url || options?.url, true );

            this.#headers = cloneHeaders( res?.headers || options?.headers || req?.headers );

            this.#options = populateOptions( {
                                                 response: cloneResponse( this.#response ),
                                                 request: req,
                                                 headers: cloneHeaders( this.#headers )
                                             },
                                             options );
        }

        resolveResponse( pResponse, pOptions )
        {
            const options = populateOptions( pOptions, DEFAULT_RESPONSE_OPTIONS );

            const res = pResponse || options?.response;

            if ( isNonNullObject( res ) )
            {
                this.#response = cloneResponse( res );
            }
            else if ( _ud !== typeof Response )
            {
                this.#response = new Response( options?.body || _mt_str, options );
            }
            else if ( !isNull( options?.body ) )
            {
                this.#response =
                    {
                        body: options?.body,
                        status: options?.status || (!isNull( options?.body ) ? STATUS_CODES.OK : STATUS_CODES.NOT_FOUND),
                        statusText: options?.statusText,
                        type: options?.type
                    };
            }

            return this.#response;
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
            const options = populateOptions( pOptions, DEFAULT_RESPONSE_OPTIONS );

            const res = pResponse || options?.response || options;

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

                this.#ok = this.#status.isOK();
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

                this.#ok = this.#status.isOK();
            }

            return this.#status || new HttpStatus();
        }

        async body()
        {
            const res = cloneResponse( this.#response );

            if ( isFunction( res.body ) && !res.bodyUsed )
            {
                return res.body();
            }

            ////
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
                this.#arrayBuffer = await res.arrayBuffer();

                return this.#arrayBuffer;
            }

            ///
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
                this.#blob = await res.blob();

                return this.#blob;
            }

            ///
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
                this.#bytes = await res.bytes();

                return this.#bytes;
            }

            ///
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
                this.#formData = await res.formData();

                return this.#formData;
            }

            ///

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
                this.#json = await res.json();

                return this.#json;
            }

            ///
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
                this.#text = await res.text();

                return this.#text;
            }

            ////

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
            return this.#status?.code;
        }

        get statusText()
        {
            return this.#status?.name || _str;
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
            return new HttpResponse( attempt( () => Response.redirect( pUrl, pStatus ) ) );
        }
        return new HttpResponse( { url: pUrl, status: pStatus } );
    };

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
                {},
        };

    mod = toolBocksModule.extend( mod );

    return mod.expose( mod, INTERNAL_NAME, (_ud !== typeof module ? module : mod) ) || mod;

}());
