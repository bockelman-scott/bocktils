/**
 * @fileOverview
 * This module defines a facade for the Web API Headers object<br>
 * intended to encapsulate and hide the differences
 * between the way Node.js, Deno, browsers, and other execution environments model HTTP Headers.<br>
 * <br>
 *
 * @module HttpHeaders
 *
 * @author Scott Bockelman
 * @license MIT
 */

/**
 * This statement imports the core modules:
 * Constants, TypeUtils, StringUtils, and ArrayUtils
 */
const core = require( "@toolbocks/core" );

const objectUtils = require( "../../common/src/ObjectUtils.js" );

// import the HTTP constants
const httpConstants = require( "./HttpConstants.cjs" );

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
    const INTERNAL_NAME = "__BOCK__HTTP_HEADERS__";

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
            httpConstants
        };

    const { ToolBocksModule, attempt, ObjectEntry, objectEntries, lock } = moduleUtils;

    const { _mt_str } = constants;

    const
        {
            isNull,
            isObject,
            isArray,
            isMap,
            isFunction,
            isNonNullObject,
            isString
        } = typeUtils;

    const { asString, isBlank } = stringUtils;

    const { asObject } = objectUtils;

    const { isHeader } = httpConstants;

    const modName = "HttpHeaders";

    const toolBocksModule = new ToolBocksModule( modName, INTERNAL_NAME );

    const DEFAULT_EXPIRATION_HEADER = "x-expiration-timestamp";

    const FORBIDDEN_REQUEST_HEADER_NAMES =
        [
            "Accept-Charset",
            "Accept-Encoding",
            "Access-Control-Request-Headers",
            "Access-Control-Request-Method",
            "Connection",
            "Content-Length",
            "Cookie",
            "Cookie2",
            "Date",
            "DNT",
            "Expect",
            "Host",
            "Keep-Alive",
            "Origin",
            "Referer",
            "Set-Cookie",
            "TE",
            "Trailer",
            "Transfer-Encoding",
            "Upgrade",
            "Via",
            "Sec-",
            "Proxy-",
            "X-HTTP-Method",
            "X-HTTP-Method-Override",
            "X-Method-Override"
        ];

    const FORBIDDEN_RESPONSE_HEADER_NAMES = ["Set-Cookie", "Set-Cookie2"];

    const FORBIDDEN_REQUEST_HEADERS = lock( [...FORBIDDEN_REQUEST_HEADER_NAMES, ...(FORBIDDEN_REQUEST_HEADER_NAMES.map( e => e.toLowerCase() ))] );
    const FORBIDDEN_RESPONSE_HEADERS = lock( [...FORBIDDEN_RESPONSE_HEADER_NAMES, ...(FORBIDDEN_RESPONSE_HEADER_NAMES.map( e => e.toLowerCase() ))] );

    function isWebApiHeadersObject( pObject )
    {
        return (isNonNullObject( pObject ) &&
                isFunction( pObject?.append ) &&
                isFunction( pObject?.delete ) &&
                isFunction( pObject?.entries ) &&
                isFunction( pObject?.forEach ) &&
                isFunction( pObject?.get ) &&
                isFunction( pObject?.getSetCookie ) &&
                isFunction( pObject?.has ) &&
                isFunction( pObject?.keys ) &&
                isFunction( pObject?.set ) &&
                isFunction( pObject?.values ));
    }

    function processHeadersArray( pOptions )
    {
        let options = {};

        let input = asObject( pOptions );

        for( const pair of input )
        {
            if ( isArray( pair ) && (pair.length > 0) )
            {
                const key = asString( pair[0], true );

                if ( isHeader( key ) )
                {
                    if ( pair.length >= 2 )
                    {
                        options[key] = pair[1];
                    }
                    else if ( pair.length === 1 )
                    {
                        options[key] = key;
                    }
                }
            }
        }
        return options;
    }

    function processRequestHeaderOptions( pOptions )
    {
        /**
         * An object containing any HTTP headers that you want to pre-populate your Headers object with.
         * This can be a simple object literal with String values,
         * an array of name-value pairs, where each pair is a 2-element array of strings,
         * or an existing Headers object.
         *
         * In the last case, the new Headers object copies its data from the existing Headers object.
         */
        if ( isNull( pOptions ) )
        {
            return {};
        }

        if ( isWebApiHeadersObject( pOptions ) || isMap( pOptions ) )
        {
            return processHeadersArray( [...(pOptions.entries() || [])] );
        }

        if ( isArray( pOptions ) )
        {
            return processHeadersArray( pOptions );
        }

        if ( isString( pOptions ) )
        {
            return processHeadersArray( pOptions.split( /\r?\n/ ) );
        }

        if ( isObject( pOptions ) )
        {
            let options = {};

            const entries = objectEntries( pOptions ).filter( ( entry ) => isHeader( ObjectEntry.getKey( entry ) ) );

            for( const entry of entries )
            {
                options[ObjectEntry.getKey( entry )] = ObjectEntry.getValue( entry ) || _mt_str;
            }

            return options;
        }

        return {};
    }

    class HttpRequestHeaders extends Map
    {
        constructor( pOptions )
        {
            super( Object.entries( processRequestHeaderOptions( pOptions ) ) );
        }

        append( pKey, pValue )
        {
            if ( this.has( pKey ) )
            {
                const value = this.get( pKey );

                const me = this;

                attempt( () => me.set( pKey, asString( value, true ) + ", " + asString( pValue ) ) );
            }
        }

        delete( pKey )
        {
            return attempt( () => super.delete( pKey ) );
        }

        get( pKey )
        {
            return attempt( () => super.get( pKey ) );
        }

        getSetCookie()
        {
            const cookies = this.get( "Set-Cookie" );

            if ( !isBlank( cookies ) )
            {
                return cookies.split( /:,/ ).map( ( cookie ) => asString( cookie, true ) );
            }

            return [];
        }

        has( pKey )
        {
            return attempt( () => super.has( pKey ) );
        }

        set( pKey, pValue )
        {
            attempt( () => super.set( pKey, pValue ) );
        }

        toLiteral()
        {
            let literal = {};
            objectEntries( this ).forEach( ( [key, value] ) => literal[key] = value );
            return lock( literal );
        }

        toString()
        {
            let s = _mt_str;

            const entries = objectEntries( this );

            for( const entry of entries )
            {
                const key = asString( ObjectEntry.getKey( entry ), true );
                const value = asString( ObjectEntry.getValue( entry ) );

                s += (key + ":" + value + "\n");
            }

            return s;
        }

        [Symbol.toPrimitive]()
        {
            return this.toLiteral();
        }
    }

    class HttpResponseHeaders extends HttpRequestHeaders
    {
        constructor( pOptions )
        {
            super( pOptions );
        }
    }

    if ( _ud === typeof Headers )
    {
        Headers = HttpRequestHeaders;
    }

    let mod =
        {
            dependencies,
            classes:
                {
                    HttpRequestHeaders,
                    HttpResponseHeaders
                },
            FORBIDDEN_REQUEST_HEADER_NAMES,
            FORBIDDEN_RESPONSE_HEADER_NAMES,
            FORBIDDEN_REQUEST_HEADERS,
            FORBIDDEN_RESPONSE_HEADERS,
            DEFAULT_EXPIRATION_HEADER,
            HttpRequestHeaders,
            HttpResponseHeaders,
            processRequestHeaderOptions
        };

    mod = toolBocksModule.extend( mod );

    return mod.expose( mod, INTERNAL_NAME, (_ud !== typeof module ? module : mod) ) || mod;

}());
