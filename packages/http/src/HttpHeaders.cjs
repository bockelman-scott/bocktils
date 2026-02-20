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
            setProperty,
            readProperty,
            readScalarProperty,
            lock,
            $ln
        } = moduleUtils;

    // imports constants for the empty string, allowing for more readable use of these string literals
    const { _mt_str = "", _mt = _mt_str, _str, _comma, _underscore } = constants;

    // import a number of functions to detect the type of a variable
    // or to convert from one type to another
    const
        {
            Finder,
            isNull,
            isIterable,
            isArray,
            isKeyValueArray,
            isMap,
            isFunction,
            isObject,
            isNonNullObject,
            isPopulatedObject,
            isString,
            toObjectLiteral
        } = typeUtils;

    // imports useful functions for safer string manipulation
    const { asString, isBlank, isJson, lcase, ucase, toLegalFileName } = stringUtils;

    const { asArray } = arrayUtils;

    const { asJson, asObject, parseJson } = jsonUtils;

    // imports useful constants and functions related to HTTP request and response headers
    const { HttpHeaderDefinition, HttpHeader, isHeader } = httpConstants;

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

    function resolveHeaderName( pKey, pStrict = false )
    {
        let key = "x-unknown";

        if ( isNull( pKey ) )
        {
            return key;
        }

        if ( isString( pKey ) && !isBlank( pKey ) && ( !pStrict || isHeader( pKey.trim() )) )
        {
            key = asString( pKey, true ) || key;
        }
        else if ( pKey instanceof HttpHeader || pKey instanceof HttpHeaderDefinition )
        {
            key = asString( pKey.name || asString( pKey, true ), true );
        }
        else if ( isPopulatedObject( pKey ) && !isBlank( asString( pKey.name || pKey.key ) ) )
        {
            return resolveHeaderName( asString( pKey.name || pKey.key, true ), pStrict );
        }
        else
        {
            const stringFinder = new Finder( ( e ) => isString( e ) && !isBlank( e ) && ( !pStrict || isHeader( e )) );

            if ( isArray( pKey ) )
            {
                key = stringFinder.findFirst( ...pKey ) || _mt;
            }
            else if ( isFunction( pKey.entries ) )
            {
                let entries = pKey.entries();
                for( let entry of entries )
                {
                    const k = asString( ObjectEntry.getKey( entry ), true );
                    const v = ObjectEntry.getValue( entry );

                    if ( (["name", "key"].includes( k )) && !isBlank( v ) && ( !pStrict || isHeader( v )) )
                    {
                        key = asString( v, true );
                        break;
                    }
                    else if ( isHeader( k ) )
                    {
                        key = k;
                        break;
                    }
                }
            }

            if ( isBlank( key ) && isFunction( pKey.values ) )
            {
                let values = pKey.values();
                key = stringFinder.findFirst( [...(values)] );
            }
        }

        key = asString( key, true ).slice( 0, MAX_HEADER_KEY_LENGTH ).trim();

        return !(key.startsWith( "X-" )) ? lcase( key ) : key;
    }

    function resolveHeaderValue( pValue, pKey )
    {
        let key = resolveHeaderName( pKey || pValue ) || resolveHeaderName( pValue );

        let value = pValue;

        if ( pValue instanceof HttpHeader || (isPopulatedObject( pValue ) && !isBlank( pValue.value )) )
        {
            key = pValue.name || key;
            value = pValue.value || (pKey instanceof HttpHeader ? pKey.value || pKey.name : key);
        }
        else if ( isString( pValue ) && !isBlank( pValue ) )
        {
            value = asString( pValue || key, true ) || value;
        }
        else if ( !isNull( pKey ) && (pKey instanceof HttpHeader || (isPopulatedObject( pKey ) && !isBlank( pKey.value ))) )
        {
            value = pKey.value || value;
        }
        else
        {
            const stringFinder = new Finder( ( e ) => isString( e ) && !isBlank( e ) );

            if ( isArray( pValue ) )
            {
                value = (pValue.every( e => isString( e ) ) ? pValue.filter( e => !isBlank( e ) ).join( ", " ) : _mt) ||
                        stringFinder.findNth( 1, ...pValue ) ||
                        stringFinder.findFirst( ...pValue ) || value;
            }
            else if ( isFunction( pValue?.entries ) )
            {
                let entries = pValue.entries();
                for( let entry of entries )
                {
                    const k = ObjectEntry.getKey( entry );
                    const v = ObjectEntry.getValue( entry );

                    if ( k === key && !isBlank( v ) )
                    {
                        value = asString( v, true );
                        break;
                    }
                }
            }

            if ( isBlank( value ) && isFunction( pValue?.values ) )
            {
                let arr = pValue.values();
                value = stringFinder.findFirst( [...(arr)] );
            }
        }

        return asString( value, true ).slice( 0, MAX_HEADER_VALUE_LENGTH ).trim();
    }

    const isForbiddenRequestHeader = function( pKey )
    {
        return FORBIDDEN_REQUEST_HEADERS.includes( resolveHeaderName( pKey ) );
    };

    const isForbiddenResponseHeader = function( pKey )
    {
        return FORBIDDEN_RESPONSE_HEADERS.includes( resolveHeaderName( pKey ) );
    };

    /**
     * A default function for merging header entries in a headers object.
     * This function ensures that header names are normalized and values are merged correctly to avoid duplicates.
     *
     * The function checks if `pHeaders` is a non-null object. If so, it:
     * - Resolves the normalized name of the header (`pName`) using a helper function.
     * - Resolves the intended header value (`pValue`) based on the header name.
     * - Retrieves the existing value for the header, if available.
     * - Combines the existing and new values, deduplicates them, trims whitespace, and rejoins them as a single string.
     * - Updates the headers object accordingly, either by:
     *   - Setting the combined value for the normalized header name.
     *   - Removing the header entirely if the combined value is blank.
     *
     * The function supports headers objects that implement `get`, `set`, or `delete` methods, or ones that use direct property access.
     *
     * @param {Object} pHeaders - The headers object where the merge operation will be applied.
     * @param {string} pName - The name of the header being modified, which will be normalized.
     * @param {string} pValue - The value to merge with the existing header value, which will be normalized and deduplicated.
     */
    const DEFAULT_HEADER_MERGE_FUNCTION = ( pHeaders, pName, pValue ) =>
    {
        if ( isNonNullObject( pHeaders ) )
        {
            const name = resolveHeaderName( pName );

            let value = resolveHeaderValue( pValue, pName );

            let accessor = isFunction( pHeaders.get ) ? () => pHeaders.get( name ) ?? pHeaders.get( lcase( name ) ) ?? pHeaders[name] ?? pHeaders[lcase( name )] : () => pHeaders[name] || pHeaders[lcase( name )];

            let existing = accessor() || _mt;

            let arr = asString( existing, true ).split( _comma );

            arr = [...(new Set( ([...arr, value].map( e => e.trim() )) ))].filter( e => !isBlank( e ) );

            value = arr.join( `${_comma} ` );

            let mutator = isFunction( pHeaders.set ) ? () => pHeaders.set( name, value ) : () => pHeaders[lcase( name )] = value;

            if ( isBlank( value ) )
            {
                mutator = isFunction( pHeaders.delete ) ?
                          () =>
                          {
                              pHeaders.delete( name );
                              pHeaders.delete( lcase( name ) );
                          } :
                          () =>
                          {
                              delete pHeaders[lcase( name )];
                              delete pHeaders[name];
                          };
            }

            attempt( mutator );
        }
    };

    class HttpHeaderMergeRule
    {
        #name;

        #mergeFunction;

        constructor( pName, pMergeFunction )
        {
            this.#name = pName;
            this.#mergeFunction = (isFunction( pMergeFunction ) && (3 === pMergeFunction.length)) ? pMergeFunction : DEFAULT_HEADER_MERGE_FUNCTION;
        }

        get name()
        {
            return this.#name;
        }

        get mergeFunction()
        {
            return this.#mergeFunction;
        }

        isValid()
        {
            return (isFunction( this.mergeFunction ) && (3 === this.mergeFunction.length));
        }

        execute( pHeaders, pKey, pValue )
        {
            if ( this.isValid() )
            {
                return this.mergeFunction( pHeaders, pKey, pValue );
            }
            return false;
        }
    }

    /**
     * Represents a predefined rule for merging HTTP headers
     * that preserves the existing header value
     * if it already exists in the provided headers object.
     *
     * If the header is not present, it resolves
     * and sets the provided value as the header's value.
     *
     * The rule operates by attempting to retrieve an existing header value
     * using a case-insensitive header name resolution.
     *
     * If a value is found, it remains unchanged.
     *
     * If no value exists, the rule attempts to resolve and set the provided value for the header.
     *
     * Characteristics:
     * - Case-insensitive resolution is applied to header names.
     * - Ensures immutability of existing header values for the specified name.
     * - Safely applies mutations by handling possible exceptions during value retrieval or assignment.
     */
    const HEADER_MERGE_RULE_PRESERVE = new HttpHeaderMergeRule( "PRESERVE", ( pHeaders, pName, pValue ) =>
    {
        if ( isNonNullObject( pHeaders ) )
        {
            const name = resolveHeaderName( pName );

            const accessor = isFunction( pHeaders.get ) ? () => pHeaders.get( name ) || pHeaders.get( lcase( name ) ) : () => pHeaders[name] || pHeaders[lcase( name )];

            const value = asString( accessor() ) || asString( resolveHeaderValue( pValue, pName ) );

            if ( value )
            {
                const mutator = isFunction( pHeaders.set ) ? () => pHeaders.set( name, value ) : () => pHeaders[name] = value;
                attempt( mutator );
            }
        }
    } );

    /**
     * A constant representing the rule for merging HTTP headers
     * by replacing the existing header value with the provided value.
     *
     * This rule ensures that the specified header
     * is either added or updated with the new value, replacing any previous value.
     *
     * If the provided value is null or empty, the header will be removed.
     *
     * Rule Details:
     * - Header existence is checked in the provided collection.
     * - If the header already exists, its value is replaced.
     * - If the new header value is blank (null or empty), the header is removed.
     *
     * This rule is used in scenarios where headers need to be overridden without merging or appending.
     */
    const HEADER_MERGE_RULE_REPLACE = new HttpHeaderMergeRule( "REPLACE", ( pHeaders, pName, pValue ) =>
    {
        if ( isNonNullObject( pHeaders ) )
        {
            const name = asString( resolveHeaderName( pName ), true );

            let value = asString( resolveHeaderValue( pValue, pName ) );

            const accessor = isFunction( pHeaders.get ) ? () => pHeaders.get( name ) || pHeaders.get( lcase( name ) ) : () => pHeaders[name] || pHeaders[lcase( name )];

            value = value || accessor();

            let mutator = isFunction( pHeaders.set ) ? () => pHeaders.set( name, value ) : () => pHeaders[lcase( name )] = value;

            if ( isBlank( value ) )
            {
                mutator = isFunction( pHeaders.delete ) ?
                          () =>
                          {
                              pHeaders.delete( lcase( name ) );
                              pHeaders.delete( name );
                          } :
                          () =>
                          {
                              delete pHeaders[lcase( name )];
                              delete pHeaders[name];
                          };
            }

            attempt( mutator );
        }
    } );

    /**
     * Represents a predefined HTTP header merge rule that combines multiple header values.
     * This rule is identified by the name "COMBINE" and uses a default merging function to process header values.
     * It is primarily used in scenarios where header values need to be consolidated while retaining all unique entries.
     */
    const HEADER_MERGE_RULE_COMBINE = new HttpHeaderMergeRule( "COMBINE", DEFAULT_HEADER_MERGE_FUNCTION );

    // noinspection JSUnusedLocalSymbols
    const HEADER_MERGE_RULE_REMOVE = new HttpHeaderMergeRule( "REMOVE", ( pHeaders, pName, pValue ) =>
    {
        if ( isNonNullObject( pHeaders ) )
        {
            const name = resolveHeaderName( pName );

            const mutator = isFunction( pHeaders.delete ) ?
                            () =>
                            {
                                pHeaders.delete( lcase( name ) );
                                pHeaders.delete( name );
                            } :
                            () =>
                            {
                                delete pHeaders[lcase( name )];
                                delete pHeaders[name];
                            };

            attempt( mutator );
        }
    } );

    HttpHeaderMergeRule["PRESERVE"] = HEADER_MERGE_RULE_PRESERVE;
    HttpHeaderMergeRule["REPLACE"] = HEADER_MERGE_RULE_REPLACE;
    HttpHeaderMergeRule["COMBINE"] = HEADER_MERGE_RULE_COMBINE;
    HttpHeaderMergeRule["REMOVE"] = HEADER_MERGE_RULE_REMOVE;
    HttpHeaderMergeRule["DELETE"] = HEADER_MERGE_RULE_REMOVE;

    HttpHeaderMergeRule.resolveHttpHeaderMergeRule = function( pMergeRule, pName = _mt )
    {
        if ( isNonNullObject( pMergeRule ) )
        {
            if ( pMergeRule instanceof HttpHeaderMergeRule )
            {
                return lock( pMergeRule );
            }

            if ( !isBlank( asString( pMergeRule?.name, true ) ) )
            {
                if ( isFunction( pMergeRule?.mergeFunction ) && (3 === pMergeRule?.mergeFunction?.length) )
                {
                    return new HttpHeaderMergeRule( asString( (pMergeRule.name || pName || "Ad Hoc Rule"), true ),
                                                    ( pHeaders, pName, pValue ) => pMergeRule.mergeFunction( pHeaders, pName, pValue ) );
                }
            }
        }

        if ( isString( pMergeRule ) )
        {
            let mergeRule = HttpHeaderMergeRule[ucase( asString( pMergeRule, true ) )];
            if ( isNonNullObject( mergeRule ) || mergeRule instanceof HttpHeaderMergeRule )
            {
                return mergeRule;
            }
        }

        return HEADER_MERGE_RULE_COMBINE;
    };

    class HttpHeaderRule
    {
        #headerName;
        #mergeRule = HEADER_MERGE_RULE_COMBINE;

        constructor( pHeaderName, pMergeRule )
        {
            this.#headerName = resolveHeaderName( pHeaderName );
            this.#mergeRule = HttpHeaderMergeRule.resolveHttpHeaderMergeRule( pMergeRule, pHeaderName );
        }

        get headerName()
        {
            return resolveHeaderName( this.#headerName );
        }

        get mergeRule()
        {
            return HttpHeaderMergeRule.resolveHttpHeaderMergeRule( this.#mergeRule );
        }

        isValid()
        {
            return !isBlank( this.headerName ) && this.mergeRule instanceof HttpHeaderMergeRule && this.mergeRule.isValid();
        }

        apply( pHeaders, pValue )
        {
            if ( this.isValid() )
            {
                return this.mergeRule.execute( pHeaders, this.headerName, pValue );
            }
            return false;
        }
    }

    HttpHeaderRule.from = function( pData, pStrict = false )
    {
        if ( isNonNullObject( pData ) || isArray( pData ) )
        {
            if ( pData instanceof HttpHeaderRule )
            {
                return pData;
            }

            let data = isArray( pData ) ? pData : objectEntries( pData );

            let name = ObjectEntry.getKey( data );
            let value = ObjectEntry.getValue( data );

            if ( isString( name ) && !isBlank( name ) && ( !pStrict || isHeader( resolveHeaderName( name ) )) )
            {
                let mergeRule = isNonNullObject( value ) ? HttpHeaderMergeRule.resolveHttpHeaderMergeRule( value ) : (isString( value ) ? HttpHeaderMergeRule[ucase( value )] : null);

                if ( !isNull( mergeRule ) && mergeRule instanceof HttpHeaderMergeRule )
                {
                    return new HttpHeaderRule( name, mergeRule );
                }

                if ( isFunction( value ) && 3 === value.length )
                {
                    return new HttpHeaderRule( name, new HttpHeaderMergeRule( 99_999, name, value ) );
                }
            }
        }
        else if ( isString( pData ) )
        {
            if ( isJson( pData ) )
            {
                return HttpHeaderRule.from( attempt( () => parseJson( pData ) ) );
            }

            const headerName = resolveHeaderName( pData, true );

            if ( isHeader( headerName ) )
            {
                return new HttpHeaderRule( headerName, HEADER_MERGE_RULE_COMBINE );
            }
        }
        return null;
    };

    const defineHttpHeaderRules = function( pRules )
    {
        let rules = {};

        if ( isNull( pRules ) || !(isObject( pRules ) || isArray( pRules )) )
        {
            return rules;
        }

        if ( isNonNullObject( pRules ) )
        {
            if ( objectEntries( pRules ).every( e => isString( ObjectEntry.getKey( e ) ) && ObjectEntry.getValue( e ) instanceof HttpHeaderRule ) )
            {
                return lock( pRules );
            }
        }

        const entries = isArray( pRules ) && asArray( pRules ).every( e => isNonNullObject( e ) || isArray( e ) ) ? asArray( pRules ) : objectEntries( pRules );

        for( let entry of entries )
        {
            let httpHeaderRule = HttpHeaderRule.from( entry );
            if ( isNonNullObject( httpHeaderRule ) && httpHeaderRule.isValid() )
            {
                rules[httpHeaderRule.headerName] = httpHeaderRule;
            }
        }

        return lock( rules );
    };

    /**
     * Processes a 2d array of header name/value pairs
     * and returns a map of valid headers with their corresponding values.
     *
     * @param {Object} pOptions   The array or object
     *                            containing an array of header key-value pairs.
     *                            Each pair should be an array where the first element is the header key,
     *                            and the second (optional) element is the header value.
     *
     * @param pStrict
     * @return {Map|string} A Map containing the processed headers with keys and their corresponding values,
     *                      or the modified options object if no headers were processed.
     */
    function processHeadersArray( pOptions = [], pStrict = false )
    {
        // converts the specified argument into either an object or array
        let input = isArray( pOptions ) ? asArray( pOptions || [] ) : asObject( pOptions || {} );

        // creates the map to return
        let map = new Map();

        // handle an edge case in which the argument is a single key/value pair
        if ( isArray( pOptions ) && (2 === $ln( asArray( pOptions ) )) && !(asArray( pOptions ).some( isArray )) )
        {
            const arr = asArray( pOptions );

            let name = resolveHeaderName( arr[0], !!pStrict );
            let value = resolveHeaderValue( arr[1], name );

            if ( isString( name ) && !isBlank( name ) && !isNull( value ) )
            {
                const headerKey = !(name.startsWith( "X-" )) ? lcase( name ) : name;
                map.set( headerKey, value );
            }

            return map;
        }

        // we expect the input to be an array of arrays where the second dimension arrays are name/value pairs to be set as headers
        if ( isKeyValueArray( input ) )
        {
            // filters out any invalid entries in the input
            input = asArray( input ).filter( isArray ).filter( e => asArray( e ).length > 0 );

            if ( !!pStrict )
            {
                input = input.filter( e => isHeader( asString( e[0], true ) ) );
            }

            // build the map, appending to any existing entries created in a prior iteration
            for( const pair of input )
            {
                // get the key (as a trimmed string)
                const key = asString( pair[0], true );

                // find any existing value already added to the map
                const existing = asString( map.get( key ) || map.get( lcase( key ) ) || _mt_str ) || _mt_str;

                // get the value for the header; use the key itself if there is no value
                let value = $ln( pair ) > 1 ? attempt( () => asString( pair[1] ) ) : key;

                const headerKey = !(key.startsWith( "X-" )) ? lcase( key ) : key;

                // add the key/value to the map, appending the value to any existing value
                map.set( headerKey, ((existing && !isBlank( existing ) ? (existing + ", ") : _mt_str) + value) || value );
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
     * @param pStrict
     * @return {Map|string} A Map containing the processed headers with keys and their corresponding values
     */
    function processHeaderObject( pObject, pStrict = false )
    {
        let input = isNonNullObject( pObject ) ? pObject : {};

        if ( isMap( pObject ) )
        {
            input = pObject;
        }
        else if ( isArray( pObject ) )
        {
            input = processHeadersArray( asArray( pObject || [] ), pStrict );
        }
        else
        {
            input = asObject( pObject || {} );
        }

        let map = new Map();

        let entries = attempt( () => (isFunction( input?.entries ) ? [...(asArray( [...(input.entries())] ))] : objectEntries( input )) );

        if ( !!pStrict )
        {
            entries = entries.filter( ( entry ) => entry instanceof HttpHeader || isHeader( resolveHeaderName( ObjectEntry.getKey( entry ) || entry[0], pStrict ) ) );
        }

        if ( entries && isIterable( entries ) )
        {
            for( const entry of entries )
            {
                if ( !isNull( entry ) )
                {
                    const key = resolveHeaderName( ObjectEntry.getKey( entry ) || entry[0], pStrict );

                    if ( isBlank( key ) || ( !!pStrict && !isHeader( key )) )
                    {
                        continue;
                    }

                    const value = resolveHeaderValue( ObjectEntry.getValue( entry ) || entry[1] || key ) || key;

                    const existing = resolveHeaderValue( map.get( key ) || map.get( lcase( key ) ) || _mt_str );

                    attempt( () => map.set( key, (((existing && !isBlank( existing ) && !existing.includes( value )) ? (existing + ", ") : _mt_str) + value) || value ) );
                }
            }
        }

        return map;
    }

    function processWebApiHeaders( pOptions, pStrict = false )
    {
        let map = new Map();

        let options = isArray( pOptions ) ? [...(asArray( pOptions ))] : asObject( pOptions || {} );

        let entries =
            [
                ...(((attempt( () => (isFunction( options?.entries ) ? options.entries() : objectEntries( options )) || [] ))) || [])
            ] || [];

        if ( entries && $ln( entries ) > 0 )
        {
            for( let entry of entries )
            {
                if ( isNull( entry ) || !(isArray( entry ) || entry instanceof ObjectEntry) )
                {
                    continue;
                }

                let key = asString( ObjectEntry.getKey( entry ), true );

                if ( !(isBlank( key ) || key.startsWith( "#" ) || ( !!pStrict && !isHeader( key, pStrict ))) )
                {
                    let value = ObjectEntry.getValue( entry ) || key;

                    if ( !isNull( value ) )
                    {
                        map.set( key, value );
                    }
                }
            }
        }
        else
        {
            map = new Map( Object.entries( options ) );
        }

        if ( $ln( map ) )
        {
            return map;
        }

        if ( isPopulatedObject( options ) && !isArray( options ) )
        {
            return attempt( () => processHeaderObject( options, pStrict ) );
        }
        else if ( isArray( options ) )
        {
            return attempt( () => processHeadersArray( asArray( options ), pStrict ) );
        }

        return map;
    }

    function isRFC7230( pString )
    {
        if ( isString( pString ) )
        {
            let lines = [...(asString( pString ).split( /(\r?\n)/ ))].filter( line => /\w+:\s*\w+/.test( line ) );
            return $ln( lines ) > 0;
        }
        return false;
    }

    function isCompatibleHeadersObject( pObject )
    {
        // can be a Map, Headers, HttpHeaders, an object literal, a 2-dimensional array
        // or a JSON string, or a string matching the format of a raw http response

        if ( isNull( pObject ) )
        {
            return false;
        }

        if ( !(isObject( pObject ) || isArray( pObject ) || isMap( pObject ) || (isString( pObject ) && (isJson( pObject ) || isRFC7230( pObject )))) )
        {
            return false;
        }

        if ( pObject instanceof HttpHeaders )
        {
            return pObject.size > 0;
        }

        if ( isArray( pObject ) )
        {
            let arr = [...(asArray( pObject ))];
            return $ln( arr ) > 0 && arr.every( e => isArray( e ) || e instanceof ObjectEntry );
        }

        if ( isMap( pObject ) )
        {
            return $ln( pObject ) > 0;
        }

        return isString( pObject ) || $ln( Object.keys( pObject ) ) > 0;
    }

    /**
     * Processes the given header options and converts them into a Map.
     *
     * @param {Array.<Array<string,string>>|Object|Map|Headers} pOptions  The header options to process.
     *                                                                    Can be a Web API Headers object,
     *                                                                    Map, array, string, or object.
     *
     * @param pStrict
     * @return {Map} A Map representation of the processed header options.
     *               Returns an empty Map if the input is null or cannot be processed.
     */
    function processHeaderOptions( pOptions, pStrict = false )
    {
        if ( isNull( pOptions ) || !isCompatibleHeadersObject( pOptions ) )
        {
            return new Map();
        }

        if ( isWebApiHeadersObject( pOptions ) )
        {
            return attempt( () => processWebApiHeaders( pOptions, pStrict ) );
        }

        if ( isMap( pOptions ) )
        {
            return new Map( pOptions );
        }

        if ( isArray( pOptions ) )
        {
            return attempt( () => processHeadersArray( pOptions, pStrict ) );
        }

        if ( isString( pOptions ) )
        {
            if ( isJson( pOptions ) )
            {
                const obj = attempt( () => asObject( parseJson( pOptions ) ) );
                if ( isNonNullObject( obj ) )
                {
                    return attempt( () => processHeaderObject( obj, pStrict ) );
                }
            }
            else
            {
                return attempt( () => processHeadersArray( asString( pOptions, true ).split( /(\r?\n)+/ ).map( e => asString( e, true ).split( /:/ ) ) ), pStrict );
            }
        }

        if ( isNonNullObject( pOptions ) )
        {
            return attempt( () => processHeaderObject( asObject( pOptions || {} ) ), pStrict );
        }

        return new Map();
    }

    function resolveHeaderOptions( pOptions )
    {
        let options = isNull( pOptions ) || !isCompatibleHeadersObject( pOptions ) ? {} : (isArray( pOptions ) ? asArray( pOptions || [] ) : asObject( pOptions || {} ));

        let entries = (isFunction( options?.entries ) ? [...(options.entries() || [])] : objectEntries( options ));

        if ( entries && $ln( entries ) > 0 )
        {
            entries = [...(entries || [])].filter( e => !isNull( e ) && (isNonNullObject( e ) || isArray( e )) );
        }

        let object = {};

        entries.forEach( entry =>
                         {
                             const key = asString( ObjectEntry.getKey( entry ), true );
                             const value = asString( ObjectEntry.getValue( entry ), true );

                             if ( !(isBlank( key ) || isBlank( value )) )
                             {
                                 object[key] = value;
                             }
                         } );

        return lock( toObjectLiteral( object ) );
    }

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
    class HttpHeaders
    {
        #defaultOptions;

        #options;

        #strict = false;

        #map = new Map();

        constructor( pOptions, pDefaultOptions = {}, pStrict = false )
        {
            this.#strict = !!pStrict;

            let defaultOptions = resolveHeaderOptions( pDefaultOptions ?? pOptions ?? {} );
            let options = resolveHeaderOptions( pOptions );

            this.#options = toObjectLiteral( options || {} );
            this.#defaultOptions = toObjectLiteral( defaultOptions || {} );

            this.#populateHeaders( defaultOptions, options );
        }

        #populateHeaders( ...pOptions )
        {
            const logger = ToolBocksModule.resolveLogger( toolBocksModule?.logger, console );

            const options = [...(asArray( pOptions ) || [])].filter( isCompatibleHeadersObject );

            function validateHeader( pKey, pValue )
            {
                const key = asString( pKey, true );
                const value = asString( pValue );

                if ( $ln( key ) > MAX_HEADER_KEY_LENGTH || $ln( value ) > MAX_HEADER_VALUE_LENGTH )
                {
                    attemptSilent( () => logger.warn( `The maximum lengths of HTTP Header values are (key=${MAX_HEADER_KEY_LENGTH} and value=${MAX_HEADER_VALUE_LENGTH}). "${key}" is ${$ln( key )} and ${$ln( value )} characters respectively.` ) );
                }
            }

            if ( $ln( options ) )
            {
                for( let obj of options )
                {
                    let entries = (isFunction( obj?.entries ) ? [...(obj.entries() || [])] : objectEntries( obj ));

                    if ( entries && $ln( entries ) > 0 )
                    {
                        entries = [...(entries || [])].filter( e => !isNull( e ) && (isNonNullObject( e ) || isArray( e )) );
                    }

                    if ( !isNull( entries ) && ($ln( entries ) > 0) )
                    {
                        for( let entry of entries )
                        {
                            const key = resolveHeaderName( asString( ObjectEntry.getKey( entry ), true ), this.#strict );

                            if ( !(isBlank( key ) || $ln( key ) > MAX_HEADER_KEY_LENGTH) )
                            {
                                const value = resolveHeaderValue( asString( ObjectEntry.getValue( entry ) ), key );

                                if ( !isBlank( value ) )
                                {
                                    this.set( key, value );
                                }
                                validateHeader( key, value );
                            }
                        }
                    }
                }
            }
        }

        #resolveKey( pKey )
        {
            return resolveHeaderName( pKey, this.#strict );
        }

        #resolveValue( pValue, pKey )
        {
            return attempt( () => resolveHeaderValue( pValue, pKey ) );
        }

        append( pKey, pValue )
        {
            let key = this.#resolveKey( pKey || pValue );

            if ( !isBlank( key ) && ( !this.#strict || isHeader( key )) )
            {
                let value = this.#resolveValue( pValue, pKey );

                if ( !isBlank( value ) && $ln( asString( value ) ) <= MAX_HEADER_VALUE_LENGTH )
                {
                    let existing = this.#map.get( key ) || this.#map.get( lcase( key ) );

                    existing = this.#resolveValue( existing, pKey );

                    if ( !existing.includes( value ) )
                    {
                        const val = ((!isBlank( existing ) ? (asString( existing, true ) + ", ") : _mt) + value);

                        let httpHeader = new HttpHeader( key, val );

                        if ( !(isForbiddenRequestHeader( key )) )
                        {
                            this.#map.set( key, httpHeader );
                        }
                    }
                }
            }
        }

        entries()
        {
            return [...(this.#map.entries())].map( ( e ) => [this.#resolveKey( e[0] || ObjectEntry.getKey( e ) ), this.#resolveValue( (e[1] || ObjectEntry.getValue( e )), this.#resolveKey( e[0] || ObjectEntry.getKey( e ) ) ), this] );
        }

        [Symbol.iterator]()
        {
            return this.entries();
        }

        keys()
        {
            return [...(this.#map.keys())];
        }

        values()
        {
            return [...(this.#map.values())].map( e => this.#resolveValue( e ) );
        }

        delete( pKey )
        {
            const key = this.#resolveKey( pKey ) || asString( pKey, true );

            if ( isBlank( key ) )
            {
                return false;
            }

            attempt( () => this.#map.delete( key ) );
            attempt( () => this.#map.delete( lcase( key ) ) );

            return true;
        }

        get( pKey )
        {
            const key = this.#resolveKey( pKey ) || asString( pKey, true );

            if ( isBlank( key ) )
            {
                return null;
            }

            if ( ["set-cookie"].includes( lcase( key ) ) )
            {
                return this.getSetCookie();
            }

            let value = readProperty( this.#map, key );

            value = value || this[key] || this[lcase( key )];

            return this.#resolveValue( value, key );
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
            const key = this.#resolveKey( pKey ) || asString( pKey, true );

            if ( isBlank( key ) )
            {
                return false;
            }

            return this.#map.has( key ) || this.#map.has( lcase( key ) );
        }

        set( pKey, pValue )
        {
            let key = this.#resolveKey( pKey );

            if ( !isBlank( key ) && ( !this.#strict || isHeader( key )) )
            {
                key = !(key.startsWith( "X-" )) ? lcase( key ) : key;

                let value = this.#resolveValue( pValue, pKey );

                if ( !isBlank( value ) && $ln( asString( value ) ) <= MAX_HEADER_VALUE_LENGTH )
                {
                    let httpHeader = new HttpHeader( key, value );

                    if ( !(isForbiddenRequestHeader( key )) )
                    {
                        this.#map.set( key, httpHeader );
                    }
                }
            }
        }

        equals( pOther )
        {
            if ( isNull( pOther ) || !isCompatibleHeadersObject( pOther ) )
            {
                return false;
            }

            let other = (pOther instanceof this.constructor) ? pOther : new HttpHeaders( pOther );

            if ( other.size !== this.size )
            {
                return false;
            }

            let is = true;

            let entries = this.entries();

            for( let entry of entries )
            {
                const key = asString( ObjectEntry.getKey( entry ), true );
                const value = asString( ObjectEntry.getValue( entry ), true );

                if ( readScalarProperty( other, _str, key ) !== value )
                {
                    is = false;
                    break;
                }
            }

            return is;
        }

        toLiteral()
        {
            const literal = {};

            let entries = this.#map.entries();

            for( let entry of entries )
            {
                let key = this.#resolveKey( ObjectEntry.getKey( entry ) );
                if ( !isBlank( key ) )
                {
                    let value = this.#resolveValue( ObjectEntry.getValue( entry ), key );
                    if ( !(isNull( value ) || isBlank( asString( value, true ) )) )
                    {
                        key = !key.startsWith( "X-" ) ? lcase( key ) : key;
                        literal[key] = (asString( literal[key] || literal[lcase( key )], true ) || asString( value, true )).replace( /(\r\n)+$/, _mt ).trim();
                    }
                }
            }

            attempt( () => delete literal[_mt] );

            return literal;
        }

        toMap()
        {
            return new Map( this.#map.entries() );
        }

        clone()
        {
            return new HttpHeaders( this.toLiteral(), this.#defaultOptions || {} );
        }

        merge( ...pHeaders )
        {
            const merger = HttpHeadersMerger.getDefault();
            return merger.mergeHeaders( this.clone(), ...pHeaders );
        }

        get size()
        {
            return Math.max( 0, $ln( this.#map ) );
        }

        toString()
        {
            let s = _mt_str;

            const entries = this.#map.entries();

            for( let entry of entries )
            {
                let httpHeader = HttpHeader.from( ObjectEntry.getValue( entry ), ObjectEntry.getKey( entry ) );
                httpHeader = httpHeader || new HttpHeader( entry[0], entry[1] );

                s += httpHeader.toString();
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

    HttpHeaders.fromLiteral = function( pObject )
    {
        if ( isNonNullObject( pObject ) )
        {
            return new HttpHeaders( pObject );
        }
        return new HttpHeaders( {} );
    };

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
            let value = readProperty( headers, key );

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

    const DEFAULT_HEADER_MERGE_RULES =
        lock( defineHttpHeaderRules(
            {
                "api_key": new HttpHeaderRule( "api_key", HEADER_MERGE_RULE_PRESERVE ),

                "responseType": new HttpHeaderRule( "responseType", HEADER_MERGE_RULE_REPLACE ),
                "accept": new HttpHeaderRule( "accept", HEADER_MERGE_RULE_COMBINE ),

                "allowAbsoluteUrls": new HttpHeaderRule( "allowAbsoluteUrls", HEADER_MERGE_RULE_PRESERVE ),
                "timeout": new HttpHeaderRule( "timeout", HEADER_MERGE_RULE_REPLACE ),
                "maxContentLength": new HttpHeaderRule( "maxContentLength", HEADER_MERGE_RULE_REPLACE ),
                "maxBodyLength": new HttpHeaderRule( "maxBodyLength", HEADER_MERGE_RULE_REPLACE ),
                "maxRedirects": new HttpHeaderRule( "maxRedirects", HEADER_MERGE_RULE_REPLACE ),
                "decompress": new HttpHeaderRule( "decompress", HEADER_MERGE_RULE_REPLACE ),

                "content-type": new HttpHeaderRule( "content-type", HEADER_MERGE_RULE_REPLACE ),
                "content-length": new HttpHeaderRule( "content-length", HEADER_MERGE_RULE_REPLACE ),

                "www-authenticate": new HttpHeaderRule( "www-authenticate", HEADER_MERGE_RULE_REPLACE ),
                "authorization": new HttpHeaderRule( "authorization", HEADER_MERGE_RULE_REPLACE ),
                "proxy-authenticate": new HttpHeaderRule( "proxy-authenticate", HEADER_MERGE_RULE_REPLACE ),
                "proxy-authorization": new HttpHeaderRule( "proxy-authorization", HEADER_MERGE_RULE_REPLACE ),

                "connection": new HttpHeaderRule( "connection", HEADER_MERGE_RULE_REMOVE ),
                "keep-alive": new HttpHeaderRule( "keep-alive", HEADER_MERGE_RULE_REMOVE ),
                "proxy-connection": new HttpHeaderRule( "proxy-connection", HEADER_MERGE_RULE_REMOVE ),
                "TE": new HttpHeaderRule( "TE", HEADER_MERGE_RULE_REMOVE ),
                "trailer": new HttpHeaderRule( "trailer", HEADER_MERGE_RULE_REMOVE ),
                "transfer-encoding": new HttpHeaderRule( "transfer-encoding", HEADER_MERGE_RULE_REMOVE ),
                "upgrade": new HttpHeaderRule( "upgrade", HEADER_MERGE_RULE_REMOVE ),

                "cache-control": new HttpHeaderRule( "cache-control", HEADER_MERGE_RULE_REPLACE )

                // add more as necessary
            } ) );

    class HttpHeadersMerger
    {
        #rules = DEFAULT_HEADER_MERGE_RULES;

        #defaultHeaders = new HttpHeaders( {} );

        constructor( pRules, pDefaultHeaders )
        {
            this.#rules = lock( isNonNullObject( pRules ) ? defineHttpHeaderRules( pRules ) : DEFAULT_HEADER_MERGE_RULES );
            this.#defaultHeaders = new HttpHeaders( pDefaultHeaders || {} );
        }

        get rules()
        {
            return lock( isNonNullObject( this.#rules ) ? this.#rules : DEFAULT_HEADER_MERGE_RULES );
        }

        getRule( pHeaderName )
        {
            return readProperty( this.rules, pHeaderName );
        }

        mergeHeaders( pHeaders, ...pOthers )
        {
            let objects = [pHeaders, ...(asArray( pOthers || [] ))].filter( isCompatibleHeadersObject );

            objects = objects.map( e => processHeaderObject( e ) ).map( e => new HttpHeaders( e, pHeaders ) );

            if ( 1 === $ln( objects ) )
            {
                return objects[0];
            }

            if ( $ln( objects ) > 0 )
            {
                let firstHeaders = objects.shift();

                let headers = toObjectLiteral( new HttpHeaders( firstHeaders ) );

                while ( $ln( objects ) > 0 )
                {
                    const httpHeaders = objects.shift();

                    if ( firstHeaders.equals( httpHeaders ) )
                    {
                        continue;
                    }

                    let obj = toObjectLiteral( httpHeaders );

                    let entries = objectEntries( obj );

                    if ( entries && $ln( entries ) )
                    {
                        for( let entry of entries )
                        {
                            const name = asString( ObjectEntry.getKey( entry ), true );

                            if ( isBlank( name ) )
                            {
                                continue;
                            }

                            const value = asString( ObjectEntry.getValue( entry ) );

                            if ( isFunction( value ) )
                            {
                                continue;
                            }

                            const rule = this.getRule( name ) || this.getRule( lcase( name ) );

                            if ( rule && rule.isValid() )
                            {
                                attempt( () => rule.apply( headers, value ) );
                            }
                            else
                            {
                                let existing = readScalarProperty( headers, _str, name );

                                if ( !["api_key", "Authorization"].includes( name ) || isNull( existing ) || isBlank( existing ) )
                                {
                                    setProperty( headers, name, asString( value || existing ) );
                                }
                            }
                        }
                    }
                }
                return headers;
            }
            return new HttpHeaders( this.#defaultHeaders );
        }
    }

    const DEFAULT_HEADERS_MERGER = lock( new HttpHeadersMerger( DEFAULT_HEADER_MERGE_RULES ) );

    HttpHeadersMerger.getDefault = function()
    {
        return DEFAULT_HEADERS_MERGER;
    };

    HttpHeaders.mergeHeaders = function( pHeaders, ...pOthers )
    {
        let objects = [pHeaders, ...(asArray( pOthers || [] ))].filter( isCompatibleHeadersObject );

        if ( $ln( objects ) > 0 )
        {
            let headers = new HttpHeaders( objects.shift() );

            if ( $ln( objects ) > 0 )
            {
                headers = DEFAULT_HEADERS_MERGER.mergeHeaders( headers, ...objects );
            }

            return headers;
        }

        return new HttpHeaders( {} );
    };


    class HttpRequestHeaders extends HttpHeaders
    {
        constructor( pOptions, pDefaultOptions )
        {
            super( pOptions, pDefaultOptions );
        }

        clone()
        {
            return new HttpRequestHeaders( this.toLiteral() );
        }
    }

    HttpRequestHeaders.getHeaderValue = getHeaderValue.bind( HttpRequestHeaders );

    class HttpResponseHeaders extends HttpHeaders
    {
        constructor( pOptions, pDefaultOptions )
        {
            super( pOptions, pDefaultOptions );
        }

        extractFileName( pDefaultName )
        {
            let fileName = asString( pDefaultName );

            const contentDisposition = asString( readProperty( this, "Content-Disposition" ), true );

            if ( !(isNull( contentDisposition ) || isBlank( contentDisposition )) )
            {
                const matches = (/filename\*?=(?:['"](?:[^'"]*['"])*)?([^;]+)/i).exec( contentDisposition );

                if ( matches && matches[1] )
                {
                    fileName = asString( decodeURIComponent( matches[1].trim().replace( /^['"]|['"]$/g, "" ) ), true );
                }

                if ( !isBlank( fileName ) )
                {
                    return toLegalFileName( fileName );
                }
            }

            return toLegalFileName( asString( pDefaultName, true ) );
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
            getHeaderValue,
            HttpHeaderMergeRule,
            HttpHeaderRule,
            HttpHeadersMerger,
            defineHttpHeaderRules,
            isForbiddenRequestHeader,
            isForbiddenResponseHeader,
        };

    mod = toolBocksModule.extend( mod );

    return mod.expose( mod, INTERNAL_NAME, (_ud !== typeof module ? module : mod) ) || mod;

}());
