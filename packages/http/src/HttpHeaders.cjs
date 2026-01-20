/**
 * @fileOverview
 *
 * This module defines facades for the Web API Headers object
 * intended to encapsulate and hide the differences
 * between how Node.js, Deno, browsers,
 * and other execution environments model HTTP Headers.<br>
 * <br>
 *
 * @module HttpHeaderUtils
 *
 * @author Scott Bockelman
 * @license MIT
 */

/**
 * This statement imports the core modules:
 * Constants, TypeUtils, StringUtils, and ArrayUtils
 */
const core = require( "@toolbocks/core" );

const jsonUtils = require( "@toolbocks/json" );

// import the HTTP constants
const httpConstants = require( "./HttpConstants.cjs" );
const console = require( "node:console" );

// get the specific core modules we need
const { moduleUtils, constants, typeUtils, stringUtils, arrayUtils } = core;

// get the 2 constants we will use immediately inside the IIFE closure
const { _ud = "undefined", $scope } = constants;

// noinspection FunctionTooLongJS
(function exposeModule()
{
    /**
     * This value is used to cache this module in the global scope.
     * The name is chosen to reduce the odds of collisions with anything else
     * that might already be in global scope.
     *
     * This scope-pollution is an acceptable trade-off
     * to avoid re-executing the closure every time it is imported by another module or script.
     *
     * Even though some frameworks, such as Node.js, have a cache of required modules,
     * these cache this entire script rather than its effects.
     *
     * @type {string}
     */
    const INTERNAL_NAME = "__BOCK__HTTP_HEADER_UTILS__";

    // check for the existence of this module in global scope
    // and return it if found, to avoid re-executing the rest of the code in this closure
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
     * as properties of this module, if desired
     * <br>
     * @dict
     * @type {Object}
     * @alias module:HttpHeaderUtils#dependencies
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

    // get the classes and functions we use from moduleUtils,
    // including the ToolBocksModule class which is instantiated and returned from this closure
    const
        {
            ToolBocksModule,
            ObjectEntry,
            IllegalStateError,
            attempt,
            attemptSilent,
            objectEntries,
            lock,
            no_op,
            $ln
        } = moduleUtils;

    // imports constants for the empty string, allowing for more readable use of these string literals
    const { _mt_str = "", _mt = _mt_str } = constants;

    // import a number of functions to detect the type of a variable
    // or to convert from one type to another
    const
        {
            isNull,
            isIterable,
            isArray,
            isKeyValueArray,
            isMap,
            isFunction,
            isNonNullObject,
            isPopulatedObject,
            isString,
            implementsInterface,
            toObjectLiteral
        } = typeUtils;

    // imports useful functions for safer string manipulation
    const { asString, asInt, isBlank, isJson, lcase } = stringUtils;

    const { asArray } = arrayUtils;

    const { asJson, asObject, parseJson } = jsonUtils;

    // imports useful constants and functions related to HTTP request and response headers
    const { HttpHeader, isHeader } = httpConstants;

    /**
     * This is the name of this module, which can be displayed in logs or messages written to the console
     * @type {string}
     */
    const modName = "HttpHeaderUtils";

    /**
     * Creates an instance of the ToolBocksModule class
     * which will be extended with the functions and classes defined
     * and then exported/returned.
     *
     * @type {ToolBocksModule}
     *
     * @param {string} modName - The public-facing name of the module used in messages and log entries
     * @param {string} INTERNAL_NAME - The internal identifier used to cache the module in the global scope.
     */
    const toolBocksModule = new ToolBocksModule( modName, INTERNAL_NAME );

    /**
     * This is a custom header observed in some frameworks, such as Oracle's OJet.
     * It is assumed to indicate the same thing normally communicated in the Expires header.
     * @type {string|number|Date} A number, numeric string, or Date
     *                            indicating the time after which the request or response
     *                            should be considered "stale"
     */
    const CUSTOM_EXPIRATION_HEADER = "x-expiration-timestamp";

    /**
     * This is a list of the header names that cannot be set or modified programmatically in a request.
     * @see https://developer.mozilla.org/en-US/docs/Glossary/Forbidden_request_header
     * @type {string[]}
     */
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


    /**
     * This is a list of the header names that cannot be set or modified programmatically in a response.
     * @see https://developer.mozilla.org/en-US/docs/Glossary/Forbidden_response_header_name
     * @type {string[]}
     */
    const FORBIDDEN_RESPONSE_HEADER_NAMES = ["Set-Cookie", "Set-Cookie2"];

    /**
     * This is a frozen list of the forbidden request headers, extended to include lowercase equivalents
     */
    const FORBIDDEN_REQUEST_HEADERS = lock( [...FORBIDDEN_REQUEST_HEADER_NAMES, ...(FORBIDDEN_REQUEST_HEADER_NAMES.map( e => e.toLowerCase() ))] );

    /**
     * This is a frozen list of the forbidden response headers, extended to include lowercase equivalents
     */
    const FORBIDDEN_RESPONSE_HEADERS = lock( [...FORBIDDEN_RESPONSE_HEADER_NAMES, ...(FORBIDDEN_RESPONSE_HEADER_NAMES.map( e => e.toLowerCase() ))] );

    const MAX_HEADER_KEY_LENGTH = 256;
    const MAX_HEADER_VALUE_LENGTH = 4_096;
    const MAX_HEADERS_LENGTH = 8_192;

    /**
     * Determines if the provided object is a valid Web API Headers object
     * or is compatible with that specification.
     *
     * @param {Object} pObject The object to check for Web API Headers compatibility.
     * @return {boolean} Returns true if the object is a valid Web API Headers object, or is compatible with that specification, otherwise false.
     */
    function isWebApiHeadersObject( pObject )
    {
        if ( _ud !== typeof Headers && pObject instanceof Headers )
        {
            return true;
        }

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

    function resolveHeaderName( pKey )
    {
        let key = ((isString( pKey ) && $ln( asString( pKey, true ) <= MAX_HEADER_KEY_LENGTH )) ? asString( pKey, true ) : (isPopulatedObject( pKey ) ? asString( pKey?.name || pKey?.key, true ) : (isArray( pKey ) && $ln( pKey ) > 0 ? pKey[0] : _mt)));

        key = (isString( key ) && $ln( asString( key, true ) <= MAX_HEADER_KEY_LENGTH )) ? asString( pKey, true ) : _mt;

        return asString( key, true ).slice( 0, MAX_HEADER_KEY_LENGTH ).trim();
    }

    function resolveHeaderValue( pValue, pKey )
    {
        let key = resolveHeaderName( pKey || pValue );

        let value = isString( pValue ) ? (asString( pValue || key, true ) || key) : (isPopulatedObject( pKey ) ? (pKey.value || (isPopulatedObject( pValue ) ? pValue.value : isArray( pKey ) && $ln( pKey ) > 1 ? pKey[1] : isArray( pValue ) ? asArray( pValue ).map( e => resolveHeaderValue( e ) ).join( ", " ) : _mt)) : _mt) || key;

        return asString( value, true ).slice( 0, MAX_HEADER_VALUE_LENGTH ).trim();
    }

    /**
     * Processes a 2d array of header name/value pairs
     * and returns a map of valid headers with their corresponding values.
     *
     * @param {Object} pOptions   The array or object
     *                            containing an array of header key-value pairs.
     *                            Each pair should be an array where the first element is the header key,
     *                            and the second (optional) element is the header value.
     *
     * @return {Map|string} A Map containing the processed headers with keys and their corresponding values,
     *                      or the modified options object if no headers were processed.
     */
    function processHeadersArray( pOptions = [] )
    {
        // converts the specified argument into either an object or array
        let input = isArray( pOptions ) ? asArray( pOptions || [] ) : asObject( pOptions || {} );

        // creates the map to return
        let map = new Map();

        // we expect the input to be an array of arrays where the second dimension arrays are name/value pairs to be set as headers
        if ( isKeyValueArray( input ) )
        {
            // filters out any invalid entries in the input
            input = asArray( input ).filter( isArray ).filter( e => asArray( e ).length > 0 ).filter( e => isHeader( asString( e[0], true ) ) );

            // build the map, appending to any existing entries created in a prior iteration
            for( const pair of input )
            {
                // get the key (as a trimmed string)
                const key = asString( pair[0], true );

                // find any existing value already added to the map
                const existing = asString( map.get( key ) || map.get( lcase( key ) ) || _mt_str ) || _mt_str;

                // get the value for the header; use the key itself if there is no value
                let value = $ln( pair ) > 1 ? attempt( () => asString( pair[1] ) ) : key;

                // add the key/value to the map, appending the value to any existing value
                map.set( key, ((existing && !isBlank( existing ) ? (existing + ", ") : _mt_str) + value) || value );
            }
        }

        return map;
    }

    /**
     * Processes an object whose property keys are expected to be valid headers
     * with values to set for the corresponding header.
     * Returns a map of valid headers with their corresponding values.
     *
     * @param {Object} pObject   The object (as dictionary) defining header key-value pairs.
     *                            Each property can be a scalar value or an array of values
     *                            to concatenate as the header value.
     *
     * @return {Map|string} A Map containing the processed headers with keys and their corresponding values
     */
    function processHeaderObject( pObject )
    {
        let input = isMap( pObject ) ?
                    new Map( pObject ) :
                    (isArray( pObject ) ? processHeadersArray( asArray( pObject || [] ) ) : asObject( pObject || [] ));

        let map = new Map();

        const entries = attempt( () => objectEntries( input ).filter( ( entry ) => isHeader( resolveHeaderName( ObjectEntry.getKey( entry ) || entry[0] ) ) ) );

        if ( entries && isIterable( entries ) )
        {
            for( const entry of entries )
            {
                if ( !isNull( entry ) )
                {
                    const key = resolveHeaderName( ObjectEntry.getKey( entry ) || entry[0] );
                    const value = resolveHeaderValue( ObjectEntry.getValue( entry ) || entry[1] || key );

                    const existing = resolveHeaderValue( map.get( key ) || map.get( lcase( key ) ) || _mt_str );

                    attempt( () => map.set( key, (((existing && !isBlank( existing ) && !existing.includes( value )) ? (existing + ", ") : _mt_str) + value) || value ) );
                }
            }
        }

        return map;
    }

    function processWebApiHeaders( pOptions )
    {
        let options = asObject( pOptions );

        if ( isFunction( options.entries ) )
        {
            let entries = attemptSilent( () => options.entries() );

            if ( entries )
            {
                let map = new Map();

                for( let entry of entries )
                {
                    let key = attemptSilent( () => asString( entry[0], true ) );

                    if ( !(isBlank( key ) || key.startsWith( "#" )) )
                    {
                        let value = attemptSilent( () => entry[1] ) || key;

                        if ( !isNull( value ) )
                        {
                            attempt( () => map.set( key, value ) );
                        }
                    }
                }

                return map;
            }
            else
            {
                return new Map( Object.entries( options ) );
            }
        }

        if ( isPopulatedObject( options ) && !isArray( options ) )
        {
            return attempt( () => processHeaderObject( options ) );
        }
        else if ( isArray( options ) )
        {
            return attempt( () => processHeadersArray( asArray( options ) ) );
        }

        return new Map();
    }

    /**
     * Processes the given header options and converts them into a Map.
     *
     * @param {Array.<Array<string,string>>|Object|Map|Headers} pOptions  The header options to process.
     *                                                                    Can be a Web API Headers object,
     *                                                                    Map, array, string, or object.
     *
     * @return {Map} A Map representation of the processed header options.
     *               Returns an empty Map if the input is null or cannot be processed.
     */
    function processHeaderOptions( pOptions )
    {
        if ( isNull( pOptions ) )
        {
            return new Map();
        }

        if ( isWebApiHeadersObject( pOptions ) )
        {
            return attemptSilent( () => processWebApiHeaders( pOptions ) );
        }

        if ( isMap( pOptions ) )
        {
            return new Map( pOptions );
        }

        if ( isArray( pOptions ) )
        {
            return attempt( () => processHeadersArray( pOptions ) );
        }

        if ( isString( pOptions ) )
        {
            if ( isJson( pOptions ) )
            {
                const obj = attempt( () => asObject( parseJson( pOptions ) ) );
                if ( isNonNullObject( obj ) )
                {
                    return attempt( () => processHeaderObject( obj ) );
                }
            }
            else
            {
                return attempt( () => processHeadersArray( asString( pOptions, true ).split( /(\r?\n)+/ ).map( e => asString( e, true ).split( /:/ ) ) ) );
            }
        }

        if ( isNonNullObject( pOptions ) )
        {
            return attempt( () => processHeaderObject( asObject( pOptions || {} ) ) );
        }

        return new Map();
    }

    const HttpHeadersBaseClass = _ud !== typeof Headers ? Headers : Map;

    /**
     * The HttpRequestHeaders class is facade and/or substitute for the Headers class found in the Fetch API,
     * providing compatibility with environments or frameworks that do not support or expect instances of the Headers class.
     *
     * This class extends the native Map class,
     * providing specialized functionality
     * for managing HTTP request headers.
     *
     * It supports case-insensitive header key management
     * and includes utility methods
     * tailored for HTTP header manipulation.
     *
     * Features include:
     * - Case-insensitive access to headers.
     * - Concatenation of values for repeated headers (e.g., `Set-Cookie`).
     * - Serialization of headers into string or object literal formats.
     */
    class HttpHeaders extends HttpHeadersBaseClass
    {
        #map = new Map();

        constructor( pOptions )
        {
            super();

            let options = isNull( pOptions ) ? {} : (isArray( pOptions ) ? asArray( pOptions || [] ) : asObject( pOptions || {} ));

            let entries = attempt( () => objectEntries( processHeaderOptions( options ) ) ) || (isFunction( options?.entries ) ? attempt( () => [...(options.entries())] ) : options);

            if ( !isNull( entries ) && isIterable( entries ) )
            {
                attempt( () => entries.forEach( entry =>
                                                {
                                                    if ( entry )
                                                    {
                                                        attempt( () => this.append( ObjectEntry.getKey( entry ), ObjectEntry.getValue( entry ) ) );
                                                    }
                                                } ) );
            }

            if ( this.headersLength > MAX_HEADERS_LENGTH )
            {
                ToolBocksModule.resolveLogger( toolBocksModule?.logger, console );
            }
        }

        #resolveKey( pKey )
        {
            return resolveHeaderName( pKey );
        }

        #resolveValue( pValue, pKey )
        {
            return attempt( () => resolveHeaderValue( pValue, pKey ) );
        }

        get headersLength()
        {
            let len = 0;

            let entries = [...this.#map.entries()];

            for( let entry of entries )
            {
                if ( entry )
                {
                    let value = ObjectEntry.getValue( entry );

                    if ( value && value instanceof HttpHeader )
                    {
                        let s = attempt( () => value.toString() ) || asString( value );
                        len += $ln( s );
                    }
                    else if ( isString( value ) )
                    {
                        len += $ln( value );
                    }
                    else
                    {
                        value = resolveHeaderValue( value, ObjectEntry.getKey( entry ) );
                        len += $ln( asString( value ) );
                    }
                }
            }

            return asInt( len );
        }

        append( pKey, pValue )
        {
            const me = this;

            let key = this.#resolveKey( pKey || pValue );

            if ( !isBlank( key ) && isHeader( key ) )
            {
                let value = this.#resolveValue( pValue, pKey );

                if ( !isBlank( value ) && $ln( asString( value ) ) <= MAX_HEADER_VALUE_LENGTH )
                {
                    let existing = this.get( key ) || this.get( lcase( key ) ) || this.#map.get( key ) || this.#map.get( lcase( key ) );

                    existing = this.#resolveValue( existing, pKey );

                    if ( !existing.includes( value ) )
                    {
                        const val = ((!isBlank( existing ) ? (asString( existing, true ) + ", ") : _mt) + value);

                        let httpHeader = new HttpHeader( key, val );

                        attempt( () => me.set( key, httpHeader ) );
                        attempt( () => me.#map.set( key, httpHeader ) );
                    }
                }
            }
        }

        [Symbol.iterator]()
        {
            return [...(this.#map.entries() || super[Symbol.iterator]())];
        }

        entries()
        {
            return [...(this.#map.entries() || super.entries())];
        }

        keys()
        {
            return [...(this.#map.keys() || super.keys())];
        }

        values()
        {
            return [...(this.#map.values() || super.values())];
        }

        delete( pKey )
        {
            const me = this;

            const key = this.#resolveKey( pKey ) || asString( pKey, true );

            if ( isBlank( key ) )
            {
                return false;
            }

            attempt( () => me.#map.delete( key ) );
            attempt( () => me.#map.delete( lcase( key ) ) );

            attempt( () => super.delete( key ) );
            attempt( () => super.delete( lcase( key ) ) );

            return true;
        }

        get( pKey )
        {
            const me = this;

            const key = this.#resolveKey( pKey ) || asString( pKey, true );

            if ( isBlank( key ) )
            {
                return null;
            }

            let value = attempt( () => super.get( key ) ) ||
                        attempt( () => super.get( lcase( key ) ) ) ||
                        attempt( () => me.#map.get( key ) ) ||
                        attempt( () => me.#map.get( lcase( key ) ) );

            value = value || me[key];

            return this.#resolveValue( value, pKey );
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
            const me = this;

            const key = this.#resolveKey( pKey ) || asString( pKey, true );

            if ( isBlank( key ) )
            {
                return false;
            }

            return attempt( () => super.has( key ) ) ||
                   attempt( () => super.has( lcase( key ) ) ) ||
                   attempt( () => me.#map.has( key ) ) ||
                   attempt( () => me.#map.has( lcase( key ) ) );
        }

        set( pKey, pValue )
        {
            const me = this;

            let key = this.#resolveKey( pKey );

            if ( !isBlank( key ) && isHeader( key ) )
            {
                let value = this.#resolveValue( pValue, pKey );

                if ( !isBlank( value ) && $ln( asString( value ) ) <= MAX_HEADER_VALUE_LENGTH )
                {
                    let httpHeader = new HttpHeader( key, value );

                    attempt( () => super.set( key, httpHeader ) );

                    attempt( () => me.#map.set( key, httpHeader ) );
                }
            }
        }

        toLiteral()
        {
            const me = this;

            let literal = {};

            let map = this.#map || me.#map || me;

            let collections = [me || this, map].filter( isNonNullObject );

            for( let collection of collections )
            {
                let entries = attempt( () => objectEntries( collection ) );

                if ( entries )
                {
                    attempt( () => entries.forEach( entry =>
                                                    {
                                                        let key = this.#resolveKey( ObjectEntry.getKey( entry ) );
                                                        if ( !isBlank( key ) )
                                                        {
                                                            let value = this.#resolveValue( ObjectEntry.getValue( entry ), ObjectEntry.getKey( entry ) );
                                                            if ( !(isNull( value ) || isBlank( asString( value, true ) )) )
                                                            {
                                                                literal[key] = literal[key] || asString( value, true ).replace( /(\r\n)+$/, _mt );
                                                            }
                                                        }
                                                    } ) );
                }
            }

            attempt( () => literal[_mt] );

            return lock( literal );
        }

        clone()
        {
            return new HttpHeaders( this.toLiteral() );
        }

        merge( ...pHeaders )
        {
            let copy = this.clone();

            let headers = asArray( pHeaders ).filter( e => !isNull( e ) && (isKeyValueArray( e ) || isPopulatedObject( e ) || e instanceof this.constructor) );

            for( let obj of headers )
            {
                if ( isKeyValueArray( obj ) )
                {
                    for( let kv of asArray( obj ) )
                    {
                        let key = kv[0];
                        let value = kv[1] || kv[0];

                        attempt( () => copy.set( key, value ) );
                    }
                }
                else if ( isPopulatedObject( obj ) || obj instanceof this.constructor )
                {
                    let entries = attempt( () => ((obj instanceof this.constructor || isFunction( obj.entries )) ? [...(obj.entries())] : objectEntries( obj )) || [] );

                    entries = ($ln( entries ) <= 0) ? objectEntries( obj ) || [] : entries;

                    entries.forEach( entry =>
                                     {
                                         let key = ObjectEntry.getKey( entry );
                                         let value = ObjectEntry.getValue( entry );

                                         attempt( () => copy.set( key, value ) );
                                     } );

                }
            }

            return copy;
        }

        toString()
        {
            let s = _mt_str;

            const literal = this.toLiteral();

            const entries = objectEntries( literal ) || [...(asArray( isFunction( this.entries ) ? this.entries() : this.#map.entries() ))];

            for( const entry of entries )
            {
                const key = this.#resolveKey( ObjectEntry.getKey( entry ) );
                const value = this.#resolveValue( ObjectEntry.getValue( entry ) );

                s += (asString( key, true ) + ": " + (isArray( value ) ? asArray( value ).map( e => this.#resolveValue( e ) ).join( ", " ) : asString( value )) + "\r\n");
            }

            return asString( s );
        }

        toJSON()
        {
            return asJson( this.toLiteral() );
        }

        [Symbol.toPrimitive]()
        {
            return this.toString();
        }

        asWebApiHeaders()
        {
            if ( _ud !== typeof Headers )
            {
                return new Headers( this.toLiteral() );
            }

            throw new IllegalStateError( `This execution environment does not define the Headers class/interface.` );
        }
    }

    function getHeaderValue( pHeaders, pKey )
    {
        let key = resolveHeaderName( pKey ) || asString( pKey, true ) || _mt;

        if ( isBlank( key ) )
        {
            return _mt;
        }

        let headers = pHeaders?.headers || pHeaders;

        if ( isNonNullObject( headers ) )
        {
            let value = isFunction( headers.get ) ? headers.get( lcase( key ) ) || headers.get( key ) : headers[lcase( key )] || headers[key];

            value = resolveHeaderValue( value );

            if ( isNull( value ) || (isString( value ) && isBlank( value )) || (isArray( value ) && $ln( value ) <= 0) )
            {
                headers = isFunction( headers.toLiteral ) ? headers.toLiteral() : toObjectLiteral( headers, { keyTransformer: lcase } );

                value = headers[lcase( key )] || headers[key];
            }

            return ( !isNull( value ) && isArray( value )) ? asArray( value ).map( e => resolveHeaderValue( e ) ).join( ", " ) : asString( value );
        }

        return isString( pHeaders ) ? asString( pHeaders, true ) : _mt;
    }

    HttpHeaders.getHeaderValue = getHeaderValue.bind( HttpHeaders );
    HttpHeaders.prototype.getValue = function( pKey )
    {
        return getHeaderValue( this, pKey );
    };

    class HttpRequestHeaders extends HttpHeaders
    {
        constructor( pOptions )
        {
            super( isArray( pOptions ) ? asArray( pOptions || [] ) : asObject( pOptions || {} ) );
        }

        clone()
        {
            return new HttpRequestHeaders( this.toLiteral() );
        }
    }

    HttpRequestHeaders.getHeaderValue = getHeaderValue.bind( HttpRequestHeaders );

    class HttpResponseHeaders extends HttpHeaders
    {
        constructor( pOptions )
        {
            super( isArray( pOptions ) ? asArray( pOptions || [] ) : asObject( pOptions || {} ) );
        }

        clone()
        {
            return new HttpResponseHeaders( this.toLiteral() );
        }
    }

    HttpResponseHeaders.getHeaderValue = getHeaderValue.bind( HttpResponseHeaders );

    if ( _ud === typeof Headers )
    {
        Headers = HttpHeaders;
    }

    let mod =
        {
            dependencies,
            classes:
                {
                    HttpHeaders,
                    HttpRequestHeaders,
                    HttpResponseHeaders
                },
            FORBIDDEN_REQUEST_HEADER_NAMES,
            FORBIDDEN_RESPONSE_HEADER_NAMES,
            FORBIDDEN_REQUEST_HEADERS,
            FORBIDDEN_RESPONSE_HEADERS,
            DEFAULT_EXPIRATION_HEADER: CUSTOM_EXPIRATION_HEADER,
            HttpHeaders,
            HttpRequestHeaders,
            HttpResponseHeaders,
            resolveHeaderName,
            resolveHeaderValue,
            getHeaderValue
        };

    mod = toolBocksModule.extend( mod );

    return mod.expose( mod, INTERNAL_NAME, (_ud !== typeof module ? module : mod) ) || mod;

}());
