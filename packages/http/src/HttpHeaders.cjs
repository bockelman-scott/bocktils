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

const objectUtils = require( "../../common/src/ObjectUtils.cjs" );

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

    const { ToolBocksModule, ObjectEntry, populateOptions, attempt, objectEntries, lock, $ln } = moduleUtils;

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

    const { asString, isBlank, lcase } = stringUtils;

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

    /**
     * An object containing any HTTP headers that you want to pre-populate your Headers object with.
     * This can be a simple object literal with String values,
     * an array of name-value pairs, where each pair is a 2-element array of strings,
     * or an existing Headers object.
     *
     * In the last case, the new Headers object copies its data from the existing Headers object.
     */


    /**
     * Determines if the provided object is a valid Web API Headers object.
     *
     * @param {Object} pObject The object to check for Web API Headers compatibility.
     * @return {boolean} Returns true if the object is a valid Web API Headers object, otherwise false.
     */
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
        let options = populateOptions( pOptions, {} );

        let input = asObject( pOptions );

        let map = new Map();

        for( const pair of input )
        {
            if ( isArray( pair ) && (pair.length > 0) )
            {
                const key = asString( pair[0], true );

                if ( isHeader( key ) )
                {
                    let value = _mt_str;

                    const existing = map.get( key ) || _mt_str;

                    if ( pair.length >= 2 )
                    {
                        value = options[key] = pair[1];
                    }
                    else if ( pair.length === 1 )
                    {
                        value = options[key] = key;
                    }

                    if ( existing )
                    {
                        map.set( key, value + (existing ? ", " + existing : _mt_str) );
                    }
                }
            }
        }

        return map || options;
    }

    function processHeaderObject( pOptions )
    {
        let options = isMap( pOptions ) ? new Map( pOptions ) : populateOptions( pOptions, {} );

        let map = new Map();

        const entries = objectEntries( pOptions ).filter( ( entry ) => isHeader( ObjectEntry.getKey( entry ) ) );

        for( const entry of entries )
        {
            const key = ObjectEntry.getKey( entry );
            const value = ObjectEntry.getValue( entry ) || _mt_str;

            options[key] = value;

            const existing = map.get( key ) || _mt_str;

            if ( existing )
            {
                map.set( key, value + (existing ? ", " + existing : _mt_str) );
            }
        }

        return map || options;
    }

    function processHeaderOptions( pOptions )
    {
        if ( isNull( pOptions ) )
        {
            return new Map();
        }

        if ( isWebApiHeadersObject( pOptions ) || isMap( pOptions ) )
        {
            let entries = isFunction( pOptions.entries ) ? pOptions.entries() : Object.entries( pOptions );
            let arr = [...(entries || objectEntries( pOptions ) || [])];
            if ( $ln( arr ) <= 0 )
            {
                if ( isNonNullObject( pOptions ) )
                {
                    return processHeaderObject( pOptions );
                }
            }
            return processHeadersArray( arr );
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
            return processHeaderObject( pOptions );
        }

        return new Map();
    }

    class HttpRequestHeaders extends Map
    {
        constructor( pOptions )
        {
            super( Object.entries( processHeaderOptions( pOptions ) ) );
        }

        append( pKey, pValue )
        {
            if ( this.has( pKey ) || this.has( lcase( pKey ) ) )
            {
                const value = this.get( pKey );

                const me = this;

                attempt( () => me.set( pKey, asString( value, true ) + ", " + asString( pValue ) ) );
            }
        }

        delete( pKey )
        {
            return attempt( () => super.delete( pKey ) ) || attempt( () => super.delete( lcase( pKey ) ) );
        }

        get( pKey )
        {
            return attempt( () => super.get( pKey ) ) || attempt( () => super.get( lcase( pKey ) ) );
        }

        getSetCookie()
        {
            const cookies = this.get( "Set-Cookie" ) || this.get( "set-cookie" );

            if ( !isBlank( cookies ) )
            {
                return cookies.split( /:,/ ).map( ( cookie ) => asString( cookie, true ) );
            }

            return [];
        }

        has( pKey )
        {
            return attempt( () => super.has( pKey ) ) || attempt( () => super.has( lcase( pKey ) ) );
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
            processRequestHeaderOptions: processHeaderOptions
        };

    mod = toolBocksModule.extend( mod );

    return mod.expose( mod, INTERNAL_NAME, (_ud !== typeof module ? module : mod) ) || mod;

}());
