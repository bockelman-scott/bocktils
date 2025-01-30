/**
 * @fileOverview
 * This module provides several useful functions for working with arrays and array-like values<br>
 * <br>
 * This module also defines a library of commonly used Filters, Mappers, and Comparators<br>
 * <br>
 * Functions include:<br>
 * <ul>
 * <li>
 *
 * </li>
 * </ul>
 *
 * @see {@link module:ArrayUtils#Filters}
 * @see {@link module:ArrayUtils#Mappers}
 * @see {@link module:ArrayUtils#Comparators}
 *
 * @module ArrayUtils
 *
 * @author Scott Bockelman
 * @license MIT
 */

/* import dependencies */
const constants = require( "./Constants.cjs" );
const typeUtils = require( "./TypeUtils.cjs" );
const stringUtils = require( "./StringUtils.cjs" );

/* define a variable for typeof undefined */
const { _ud = "undefined" } = constants;

/**
 * This function returns the host environment scope (Browser window, Node.js global, or Worker self)
 * @type {function():Object}
 * @return {Object} The host environment scope, a.k.a. globalThis, (i.e., Browser 'window', Node.js 'global', or Worker 'self')
 */
const $scope = constants?.$scope || function()
{
    return (_ud === typeof self ? ((_ud === typeof global) ? ((_ud === typeof globalThis ? {} : globalThis)) : (global || {})) : (self || {}));
};

/**
 * This module is constructed by an Immediately Invoked Function Expression (IIFE).
 * see: <a href="https://developer.mozilla.org/en-US/docs/Glossary/IIFE">MDN: IIFE</a> for more information on this design pattern
 */
(function exposeModule()
{
    // defines a key we can use to store this module in global scope
    const INTERNAL_NAME = "__BOCK__ARRAY_UTILS__";

    // if we've already executed this code, just return the module
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
            constants,
            typeUtils,
            stringUtils
        };

    /*
     * Create local variables for the imported values and functions we use.
     */
    const {
        _mt_str,
        _spc,
        _dot,
        _str,
        _fun,
        _obj,
        _num,
        _big,
        _bool,
        _symbol,
        S_WARN,
        S_TRUE,
        ignore,
        AsyncFunction,
        IllegalArgumentError,
        EMPTY_ARRAY,
        populateOptions,
        localCopy,
        immutableCopy,
        lock,
        classes
    } = constants;

    const { ModuleEvent, ModulePrototype } = classes;

    /*
     * If the environment does not define CustomEvent,<br>
     * We define it as our custom ModuleEvent object,<br>
     * Imported from the 'bootstrap' module.
     */
    if ( _ud === typeof CustomEvent )
    {
        CustomEvent = ModuleEvent;
    }

    /**
     * Represents the name of the module<br>
     * This name is used when error events are emitted to indicate the source of the error.
     * @type {string}
     */
    const modName = "ArrayUtils";

    const {
        VALID_TYPES,
        TYPE_SORT_ORDER,
        isUndefined,
        isNull,
        isNonNullValue,
        isString,
        isEmptyString,
        isPrimitive,
        isRegExp,
        isNumeric,
        isNumber,
        isInteger,
        isObject,
        isSet,
        isMap,
        isArray,
        isTypedArray,
        isIterable,
        isBoolean,
        isFunction,
        isDate,
        isClass,
        areSameType,
        areCompatibleTypes,
        defaultFor,
        castTo,
        toDecimal,
        toHex,
        toOctal,
        toBinary,
        clamp
    } = typeUtils;

    const {
        DEFAULT_AS_STRING_OPTIONS,
        asString,
        isEmpty,
        isBlank,
        asInt,
        asFloat,
        lcase,
        ucase,
        isValidNumber,
        isValidNumeric,
        leftOfLast,
        rightOfLast,
        asUtf8ByteArray,
        cartesian,
    } = stringUtils;

    /** The maximum limit that can be specified for the size of a bounded queue
     * @const
     * @type {number}
     * @alias module:ArrayUtils#MAX_QUEUE_SIZE
     * */
    const MAX_QUEUE_SIZE = 32_768;

    /**
     * This is the object that is returned from this function.
     * <br>
     * This object is the ArrayUtils module<br>
     * <br>
     * The functions defined in this file are added to the module before it is exported and returned.
     * <br>
     * @type {ModulePrototype}
     */
    const modulePrototype = new ModulePrototype( modName, INTERNAL_NAME );

    // poly-fill for isArray; probably obsolete with modern environments
    if ( !isFunction( Array.isArray ) )
    {
        try
        {
            Array.isArray = function( pArg )
            {
                return !(_ud === typeof pArg || null == pArg) && "[object Array]" === {}.toString.call( pArg );
            };
        }
        catch( ex )
        {
            modulePrototype.reportError( ex, "extending the built-in Array class", S_WARN, modName + "::isArray" );
        }
    }

    /**
     * This is an array of the names of the methods exposed by the built-in {@link Array} type.
     * @const
     * @type {Array<string>}
     * @alias module:ArrayUtils#ARRAY_METHODS
     */
    const ARRAY_METHODS = ["length", "GUID", "getUniqueId"].concat( [].concat( Object.getOwnPropertyNames( Array.prototype ).filter( e => "function" === typeof [][e] ) ) );

    const COMPARE_TO = "compareTo";

    /**
     * @typedef {Object} FlattenOptions
     * @property {number} level The numeric argument to pass the {@link Array.flat} method<br>
     * when passing options to a function that can also perform this transformation before returning an array<br>
     */

    /**
     * @typedef {Object} AsArrayOptions
     *
     * @property {boolean|FlattenOptions} [flatten=false] Set to true to convert any elements of the array<br>
     * that are also arrays into individual elements of the returned array<br>
     * @see {@link Array.flat}<br>
     *
     *
     * @property {string|undefined|null} [splitOn=undefined] A character or string to split a string<br>
     * if the argument to the function is a string<br><br>
     * For example, calling asArray("a.b.c") with splitOn:"." yields ["a","b","c"]<br>
     *
     * @property {function|undefined|null} [filter=null] A function that will be used to filter the resulting array<br>
     *
     * @property {boolean} [sanitize=false] Set to true to filter the resulting array<br>
     * so that it does not contain any elements that are null, undefined, or an empty string<br>
     *
     * @property {string|undefined|null} [type=null] A string defining the typeof elements the resulting array should include<br>
     * --or--<br>
     * A class of which each element must be an instance<br>
     * Type conversions are not performed<br>
     * If necessary to convert types, omit this option and use {@link Array.map} over the returned value<br>
     *
     * @property {boolean} [unique=false] Set to true to remove duplicated values before returning the array<br>
     *
     * @property {function(*,*)|undefined|null} [comparator=null] A function to use to determine the order of the elements in the resulting array<br>
     *
     * @property [iterableLimit=32768] The maximum number of elements to take from an iterable if the specified value is iterable, but not an Array or TypedArray
     *
     * @see {@link module:ArrayUtils.asArray}
     */

    /**
     * This object defines the default options for the {@link module:ArrayUtils.asArray} function<br>
     * @const
     * @type AsArrayOptions
     * @alias module:ArrayUtils#DEFAULT_AS_ARRAY_OPTIONS
     * @see {@link module:ArrayUtils.asArray}
     */
    const DEFAULT_AS_ARRAY_OPTIONS =
        {
            flatten: false,
            splitOn: null,
            filter: null,
            sanitize: false,
            type: null,
            unique: false,
            comparator: null,
            iterableLimit: MAX_QUEUE_SIZE,
            removeNaN: false,
            removeInfinity: false,
        };

    /**
     * This is an internal function<br>
     * that performs post-processing on an array<br>
     * before it is returned from the {@link module:ArrayUtils.asArray} function
     *
     * @param {Array<*>} pArr The array to process
     * @param {AsArrayOptions} pOptions The object whose properties define the post-processing behavior and operations
     *
     * @returns {Array<*>} A new array resulting from performing the operations on the specified array
     *
     * @see {@link module:ArrayUtils.asArray}
     *
     * @type {function(Array<*>,AsArrayOptions):Array<*>}
     *
     * @private
     */
    const processAsArrayOptions = function( pArr, pOptions )
    {
        const options = populateOptions( pOptions, DEFAULT_AS_ARRAY_OPTIONS );

        let arr = pArr || [];

        const flatten = !!options?.flatten;

        let flattenLevel = (options?.flatten?.level);

        if ( isNaN( flattenLevel ) || flattenLevel <= 0 )
        {
            flattenLevel = Infinity;
        }

        arr = ((flatten && arr.flat) ? arr.flat( flattenLevel ) : arr) || [];

        arr = (options?.sanitize ? (arr || []).filter( e => !(_ud === typeof e || null == e || (isString( e ) && isEmpty( e ))) ) : (arr || [])) || [];

        arr = (options?.type ? (arr || []).filter( e => (options?.type === typeof e || (isClass( options?.type ) && (e instanceof options?.type))) ) : (arr || [])) || [];

        arr = (options.removeNaN ? (arr || []).filter( e => !isNumber( e ) || !isNaN( e ) ) : (arr || [])) || [];

        arr = (options.removeInfinity ? (arr || []).filter( e => !isNumber( e ) || isFinite( e ) ) : (arr || [])) || [];

        if ( isFunction( options?.filter ) && options?.filter?.length >= 1 && options?.filter?.length <= 3 )
        {
            arr = arr.filter( options?.filter );
        }

        if ( options?.unique )
        {
            arr = [...(new Set( arr ))];
        }

        let comparator = options?.comparator;

        if ( isFunction( comparator ) && comparator?.length === 2 )
        {
            arr = [].concat( (arr || []) );
            arr = arr.sort( comparator );
        }

        return arr || [];
    };

    function fromIterable( pIterable, pOptions = DEFAULT_AS_ARRAY_OPTIONS )
    {
        const options = populateOptions( pOptions, DEFAULT_AS_ARRAY_OPTIONS );

        const limit = Math.min( Math.max( asInt( pIterable?.size || pIterable?.length || 1, 1 ), asInt( options?.iterableLimit, (pIterable?.size || MAX_QUEUE_SIZE) ) ), MAX_QUEUE_SIZE );

        let arr = [];

        let len = 0;

        if ( isIterable( pIterable ) )
        {
            for( let elem of pIterable )
            {
                arr.push( elem );

                if ( ++len >= limit )
                {
                    break;
                }
            }

            return arr;
        }

        return pIterable;
    }

    /**
     * Returns an array based on its input and the {@link AsArrayOptions} specified<br>
     * <br>
     * If its input <i>is</i> an array, that array is returned,<br>
     * modified as per the options specified<br>
     * <br>
     * If its input is a string, depending on the options specified,<br>
     * that string is either split on a value<br>
     * and the resulting array is returned, <i>or</i>...<br>
     * a one element array containing the string is returned<br>
     * <br>
     * If the input is a primitive value, a one element array containing that value is returned<br>
     * <br>
     * If the input is a function, the function is executed with the {@link AsArrayOptions} as its argument,<br>
     * and {@link module:ArrayUtils.asArray} is called again with the result<br>
     * <br>
     * If the input is an object, this function populates and returns a new array with its "first-level" properties<br>
     * <br>
     * @param {*} pValue Any object or value to convert to an array and/or process as per the {@link AsArrayOptions}
     *
     * @param {AsArrayOptions} pOptions An object to define how input values are evaluated<br>
     * and how the resulting array is processed before being returned.
     *
     * @param pRecursionCount
     *                                DO NOT PASS A VALUE FROM CALLING CODE</b>
     *
     * @returns {Array<*>} an Array, based on the input and the options specified
     *
     * @alias module:ArrayUtils.asArray
     */
    const asArray = function( pValue, pOptions = DEFAULT_AS_ARRAY_OPTIONS, pRecursionCount = 0 )
    {
        const options = populateOptions( pOptions, DEFAULT_AS_ARRAY_OPTIONS );

        if ( isArray( pValue ) || isTypedArray( pValue ) )
        {
            return processAsArrayOptions( pValue, options );
        }

        if ( isNull( pValue, true ) || isUndefined( pValue ) )
        {
            return [];
        }

        if ( isString( pValue ) )
        {
            if ( isEmptyString( pValue ) )
            {
                return [];
            }
            return processAsArrayOptions( splitStringValue( pValue, options ), options );
        }

        if ( isPrimitive( pValue ) )
        {
            return [pValue];
        }

        if ( isObject( pValue ) )
        {
            return processAsArrayOptions( processObjectValue( pValue, options, pRecursionCount ), options );
        }

        return [];
    };

    /**
     * Helper function to split a string value based on options.splitOn.
     */
    const splitStringValue = ( pStr, pOptions ) =>
    {
        const sep = pOptions?.splitOn || null;
        const separator = getSplitter( sep );
        return separator ? pStr.split( separator ) : [pStr];
    };

    /**
     * Helper function to determine the proper split separator.
     */
    const getSplitter = ( pSep ) =>
    {
        if ( isString( pSep ) )
        {
            return asString( pSep );
        }
        if ( isRegExp( pSep ) )
        {
            return new RegExp( pSep, pSep?.flags );
        }
        return null;
    };

    /**
     * Helper function to process object values based on their type.
     */
    const processObjectValue = ( pObj, pOptions, pRecursionCount ) =>
    {
        if ( isSet( pObj ) )
        {
            return [...pObj.values()];
        }

        if ( isMap( pObj ) )
        {
            return fromIterable( pObj.entries(), pOptions );
        }

        if ( isIterable( pObj ) )
        {
            return fromIterable( pObj, pOptions );
        }

        if ( isFunction( pObj ) && pRecursionCount < 3 )
        {
            return processFunctionValue( pObj, pOptions, pRecursionCount );
        }

        if ( isTypedArray( pObj ) )
        {
            return [...pObj];
        }

        return Object.values( pObj ) || [];
    };

    /**
     * Helper function to process function values.
     */
    const processFunctionValue = ( pFunc, pOptions, pRecursionCount ) =>
    {
        try
        {
            return isClass( pFunc )
                   ? asArray( new pFunc( pOptions ), pOptions, pRecursionCount + 1 )
                   : asArray( pFunc( pOptions ), pOptions, pRecursionCount + 1 );
        }
        catch( error )
        {
            modulePrototype.reportError( error, `Error executing function: ${pFunc?.name}`, S_WARN, `${modName}::asArray` );
        }
        return [pFunc];
    };

    /**
     * This function converts 'rest' arguments into an array,<br>
     * performing a one-level spread if the only argument passed was a one-element array<br>
     * This behavior is exactly like that of the {@link Array.concat} method<br>
     *
     * @param {...*} pArgs The 'rest' argument(s) passed into a function
     *
     * @returns {Array<*>} An array of the arguments
     *
     * @alias module:ArrayUtils.varargs
     */
    const varargs = function( ...pArgs )
    {
        let arr = [...(asArray( pArgs || [] ) || [])];
        return (arr.length < 2) ? (arr.length > 0 ? (isArray( arr[0] ) ? varargs( ...(arr[0]) ) : arr) : arr.flat()) : arr;
    };

    /**
     * This function converts 'rest' arguments into an <i>immutable</i> array<br>
     * It is identical to {@link #varargs} function<br>
     * except that the returned array is populated with immutable copies of its elements and is itself immutable<br>
     *
     * @param {...*} pArgs The 'rest' argument(s) passed into a function
     *
     * @returns {Array} An immutable array of the arguments
     *
     * @alias module:ArrayUtils.immutableVarArgs
     */
    const immutableVarArgs = function( ...pArgs )
    {
        let args = varargs( ...pArgs );
        return lock( args.map( e => immutableCopy( e ) ) );
    };

    const asArgs = function( ...pArgs )
    {
        return asArray( varargs( ...pArgs ) );
    };

    const flatArgs = function( ...pArgs )
    {
        return asArgs( ...pArgs ).flat();
    };

    const filteredArgs = function( pFilter, ...pArgs )
    {
        return asArgs( ...pArgs ).filter( pFilter || Filters.IDENTITY );
    };

    const flatFilteredArgs = function( pFilter, ...pArgs )
    {
        return flatArgs( ...pArgs ).filter( pFilter || Filters.IDENTITY );
    };

    /**
     * Returns either the number of elements in an array,<br>
     * the number of characters in a string,<br>
     * the number of characters in the string representation of a number,<br>
     * or the number of keys in an object<br>
     *
     * @param {Array<*>|string|number|object} pObject An array, string, number, or object whose "length" should be returned
     *
     * @returns {number} the number of elements in an array,<br>
     * the number of characters in a string,<br>
     * the number of characters in the string representation of a number,<br>
     * or the number of keys in an object
     *
     * @type {function((Array<*>|string|number|object)): number}
     * @alias module:ArrayUtils.calculateLength
     */
    const calculateLength = function( pObject )
    {
        let len;

        switch ( typeof pObject )
        {
            case _ud:
                len = 0;
                break;

            case _str:
                len = pObject?.length;
                break;

            case _num:
            case _big:
                len = (asString( _mt_str + pObject || _mt_str ))?.length;
                break;

            case _bool:
                len = asString( pObject )?.length || 0;
                break;

            case _obj:
                if ( null == pObject )
                {
                    len = 0;
                    break;
                }
                if ( isArray( pObject ) )
                {
                    len = pObject?.length;
                    break;
                }
                len = Object.keys( pObject ).length;
                break;

            default:
                len = pObject?.length || 0;
                break;
        }

        return len;
    };

    /**
     * Reports an error when the number of filters to match exceeds the number of filters specified<br>
     * <br>
     * This function indirectly fires the "error" event<br>
     *
     * @param {number} pNumMatches - The number of filters to match.
     * @param {number} pNumFilters - The number of filters specified.
     * @param {string} pFunctionName - The name of the function where the error occurred.
     *
     * @return {void} This function does not return a value.
     *
     * @private
     */
    function reportIllegalArguments( pNumMatches, pNumFilters, pFunctionName )
    {
        const msg = "The number of filters to match is greater than the number of filters specified";
        const advice = "The returned filter will always return an empty array";

        const error = new IllegalArgumentError( msg );

        modulePrototype.reportError( error, advice, S_WARN, modulePrototype.calculateErrorSourceName( modName, pFunctionName ),
                                     {
                                         "pNumMatches": pNumMatches,
                                         "numFilters": pNumFilters
                                     } );
    }

    let Filters;

    /**
     * This is a collection of functions that can be used as filters
     * <i>and functions that return a filter</i><br>
     * <br>
     * These can be chained or combined using other features of this module<br>
     *
     * @const
     * @namespace
     * @type {Object}
     *
     * @alias module:ArrayUtils#Filters
     */
    Filters =
        {
            /**
             * A filter that returns the same array elements of the source array.<br><br>
             * USAGE: <code>const filtered = array.filter( Filters.IDENTITY );</code><br>
             * @type {function(*):boolean}
             * @alias module:ArrayUtils#Filters#IDENTITY
             * */
            IDENTITY: e => true,

            /**
             * A filter that returns none of the elements of the source array.<br><br>
             * USAGE: <code>const filtered = array.filter( Filters.NONE );</code><br>
             * @type {function(*):boolean}
             * @alias module:ArrayUtils#Filters#NONE
             */
            NONE: e => false,

            /**
             * A filter to return the elements of an array that are filter functions<br>
             * USAGE: <code>const filters = array.filter( Filters.IS_FILTER );</code><br>
             * @type {function(*):boolean}
             * @alias module:ArrayUtils#Filters#IS_FILTER
             */
            IS_FILTER: e => isFunction( e ) && e?.length > 0 && e?.length <= 3,

            /**
             * A filter to return the elements of an array that are mapping functions<br>
             * USAGE: <code>const filters = array.filter( Filters.IS_MAPPER );</code><br>
             * @type {function(*):boolean}
             * @alias module:ArrayUtils#Filters#IS_MAPPER
             */
            IS_MAPPER: e => isFunction( e ) && e?.length > 0 && e?.length <= 3,

            /**
             * A filter to return the elements of an array that are comparator functions<br>
             * USAGE: <code>const comparators = array.filter( Filters.IS_COMPARATOR );</code><br>
             * @type {function(*):boolean}
             * @alias module:ArrayUtils#Filters#IS_COMPARATOR
             */
            IS_COMPARATOR: e => isFunction( e ) && e?.length === 2,

            /**
             * A filter to return the elements of an array that are not undefined<br>
             * USAGE: <code>const filtered = array.filter( Filters.IS_DEFINED );</code><br>
             * @type {function(*):boolean}
             * @alias module:ArrayUtils#Filters#IS_DEFINED
             */
            IS_DEFINED: e => _ud !== typeof e,

            /**
             * A filter to return the elements of an array that are not null or undefined<br>
             * USAGE: <code>const filtered = array.filter( Filters.IS_NOT_NULL );</code><br>
             * @type {function(*):boolean}
             * @alias module:ArrayUtils#Filters#IS_NOT_NULL
             */
            IS_NOT_NULL: e => Filters.IS_DEFINED( e ) && null !== e,

            /**
             * A filter to return the elements of an array that are strings<br>
             * USAGE: <code>const strings = array.filter( Filters.IS_STRING );</code><br>
             * @type {function(*):boolean}
             * @alias module:ArrayUtils#Filters#IS_STRING
             */
            IS_STRING: e => isString( e ),

            /**
             * A filter to return the elements of an array that are empty strings<br>
             * USAGE: <code>const empty = array.filter( Filters.IS_EMPTY_STRING );</code><br>
             * @type {function(*):boolean}
             * @alias module:ArrayUtils#Filters#IS_EMPTY_STRING
             */
            IS_EMPTY_STRING: e => Filters.IS_STRING( e ) && _mt_str === e,

            /**
             * A filter to return the elements of an array that are composed of whitespace characters only<br>
             * USAGE: <code>const blanks = array.filter( Filters.IS_WHITESPACE );</code><br>
             * @type {function(*):boolean}
             * @alias module:ArrayUtils#Filters#IS_WHITESPACE
             */
            IS_WHITESPACE: e => Filters.IS_STRING( e ) && (_mt_str === (e.trim().replace( /\s+/g, _mt_str ))),

            /**
             * A filter to return the elements of an array that are non-empty strings<br>
             * USAGE: <code>const populated = array.filter( Filters.IS_POPULATED_STRING );</code><br>
             * @type {function(*):boolean}
             * @alias module:ArrayUtils#Filters#IS_POPULATED_STRING
             */
            IS_POPULATED_STRING: e => Filters.IS_STRING( e ) && !(Filters.IS_EMPTY_STRING( e )),

            /**
             * A filter to return the elements of an array that are non-blank strings<br>
             * USAGE: <code>const filtered = array.filter( Filters.IS_NON_WHITESPACE );</code><br>
             * @type {function(*):boolean}
             * @alias module:ArrayUtils#Filters#IS_NON_WHITESPACE
             * */
            IS_NON_WHITESPACE: e => Filters.IS_STRING( e ) && !Filters.IS_WHITESPACE( e ),

            /**
             * A filter to return the elements of an array that are numbers<br>
             * USAGE: <code>const numbers = array.filter( Filters.IS_NUMBER );</code><br>
             * @type {function(*):boolean}
             * @alias module:ArrayUtils#Filters#IS_NUMBER
             * */
            IS_NUMBER: e => isNumber( e ),

            /**
             * A filter to return the elements of an array that are valid numeric values<br>
             * USAGE: <code>const filtered = array.filter( Filters.IS_NUMERIC );</code><br>
             * @type {function(*):boolean}
             * @alias module:ArrayUtils#Filters#IS_NUMERIC
             * */
            IS_NUMERIC: e => isValidNumeric( e ),

            /**
             * A filter to return the elements of an array that are integers (whole numbers)<br>
             * USAGE: <code>const integers = array.filter( Filters.IS_INTEGER );</code><br>
             * @type {function(*):boolean}
             * @alias module:ArrayUtils#Filters#IS_INTEGER
             * */
            IS_INTEGER: e => Filters.IS_NUMBER( e ) && (isInteger( e ) || Math.abs( e - Math.round( e ) ) < 0.0000000001),

            /**
             * A filter to return the elements of an array that are objects<br>
             * USAGE: <code>const objects = array.filter( Filters.IS_OBJECT );</code><br>             * @type {function(*):boolean}
             * @alias module:ArrayUtils#Filters#IS_OBJECT
             * */
            IS_OBJECT: e => _obj === typeof e,

            /**
             * A filter to return the elements of an array that are also arrays<br>
             * USAGE: <code>const arrays = array.filter( Filters.IS_ARRAY );</code><br>
             * @type {function(*):boolean}
             * @alias module:ArrayUtils#Filters#IS_ARRAY
             * */
            IS_ARRAY: e => Filters.IS_OBJECT( e ) && isArray( e ),

            /**
             * Aa filter to return the elements of an array that are functions<br>
             * USAGE: <code>const functions = array.filter( Filters.IS_FUNCTION );</code><br>
             * @type {function(*):boolean}
             * @alias module:ArrayUtils#Filters#IS_FUNCTION
             * */
            IS_FUNCTION: e => isFunction( e ),

            /**
             * A filter to return the elements of an array that are asynchronous functions<br>
             * USAGE: <code>const asyncFuncs = array.filter( Filters.IS_ASYNC_FUNCTION );</code><br>
             * @type {function(*):boolean}
             * @alias module:ArrayUtils#Filters#IS_ASYNC_FUNCTION
             * */
            IS_ASYNC_FUNCTION: e => Filters.IS_FUNCTION( e ) && e instanceof AsyncFunction,

            /**
             * A filter to return the elements of an array that are boolean values<br>
             * USAGE: <code>const booleans = array.filter( Filters.IS_BOOLEAN );</code><br>
             * @type {function(*):boolean}
             * @alias module:ArrayUtils#Filters#IS_BOOLEAN
             * */
            IS_BOOLEAN: e => isBoolean( e ),

            /**
             * A filter to return the elements of an array that are regular expressions<br>
             * USAGE: <code>const regular_expressions = array.filter( Filters.IS_REGEXP );</code><br>
             * @type {function(*):boolean}
             * @alias module:ArrayUtils#Filters#IS_REGEXP
             * */
            IS_REGEXP: e => (e instanceof RegExp || /\/[^/]\/[gidsmyu]+$/.test( asString( e, true ) )),

            /**
             * A filter to return the elements of an array that are Dates<br>
             * USAGE: <code>const dates = array.filter( Filters.IS_DATE );</code><br>
             * @type {function(*):boolean}
             * @alias module:ArrayUtils#Filters#IS_DATE
             * */
            IS_DATE: e => isDate( e ),

            /**
             * A filter to return the elements of an array suitable as comparator functions
             * for the {@link Array.sort} method<br><br>
             * USAGE: <code>const comparators = array.filter( Filters.COMPARATORS );</code><br>
             *
             * @type {function(*):boolean}
             *
             * @alias module:ArrayUtils#Filters#COMPARATORS
             *
             * */
            COMPARATORS: (e => Filters.IS_FUNCTION( e ) && Filters.IS_COMPARATOR( e )),

            /**
             * A <b>function</b> to return an array of filter functions from varargs<br>
             * <br>
             * USAGE: <code>const filters = _copyPredicateArguments( filterA, filterB, ... filterN );</code><br>
             * <br>
             *
             * @param {...function} pPredicates One or more filter functions
             * to include in the returned array
             *
             * @return {Array<function(*):boolean>} An array of filter functions
             *
             * @type {function(...*)}
             *
             * @alias module:ArrayUtils#Filters._copyPredicateArguments
             */
            _copyPredicateArguments: function( ...pPredicates )
            {
                return ([].concat( ...asArray( (pPredicates || [Filters.IDENTITY]) ) )).filter( Filters.IS_FILTER );
            },

            /**
             * A <i><b>function</b> that returns a filter</i>
             * that returns the elements of an array that match one or more of the specified types
             *
             * USAGE: <code>const strings = array.filter( Filters.makeTypeFilter( 'string' ) );</code><br>
             *
             * @param {...string} pType One or more types the returned filter will accept
             *
             * @return {function(*):boolean} A filter that returns an array whose elements
             * match one or more of the specified types
             *
             * @alias module:ArrayUtils#Filters.makeTypeFilter
             */
            makeTypeFilter: function( ...pType )
            {
                const types = [].concat( ...(asArray( pType || [] )) ).filter( e => [_ud, _obj, _fun, _str, _num, _big, _bool, _symbol].includes( e ) );

                return function( e )
                {
                    let matches = false;

                    for( const type of types )
                    {
                        if ( type === typeof e )
                        {
                            matches = true;
                            break;
                        }
                    }

                    return matches;
                };
            },

            /**
             * A <i><b>function</b> that returns a filter</i>
             * that returns an array whose elements satisfy <b>ALL</b> specified filters<br>
             * <br>
             * USAGE: <code>const filtered = array.filter( Filters.makeMatchesAllFilter( filterA, filterB, ...filterN ) );</code><br>
             *
             * @param {...function} pPredicates One or more filter functions
             *
             * @return {function(*):boolean} A filter that returns the elements of an array that match all the specified criteria
             *
             * @type {function(...function)}
             *
             * @alias module:ArrayUtils#Filters.makeMatchesAllFilter
             */
            makeMatchesAllFilter: function( ...pPredicates )
            {
                const predicates = Filters._copyPredicateArguments( ...pPredicates );

                return function( e )
                {
                    let matches = true;

                    for( const func of predicates )
                    {
                        try
                        {
                            if ( true !== func( e ) )
                            {
                                matches = false;
                                break;
                            }
                        }
                        catch( ex )
                        {
                            ignore( ex );

                            matches = false;
                            break;
                        }
                    }

                    return matches;
                };
            },

            /**
             * A <i><b>function</b> that returns a filter</i>
             * that returns an array whose elements satisfy <i><b>ANY</b></i> of the specified filters<br>
             * <br>
             * USAGE: <code>const filtered = array.filter( Filters.makeMatchesAnyFilter( filterA, filterB, ...filterN ) );</code><br>
             *
             * @param {...function} pPredicates One or more filter functions
             *
             * @return {function(*):boolean} A filter that returns the elements of an array that match any the specified criteria
             *
             * @type {function(...function)}
             *
             * @alias module:ArrayUtils#Filters.makeMatchesAnyFilter
             * */
            makeMatchesAnyFilter: function( ...pPredicates )
            {
                const predicates = Filters._copyPredicateArguments( ...pPredicates );

                return function( e )
                {
                    let matches = false;

                    for( const func of predicates )
                    {
                        try
                        {
                            if ( true === func( e ) )
                            {
                                matches = true;
                                break;
                            }
                        }
                        catch( ex )
                        {
                            ignore( ex );
                        }
                    }

                    return matches;
                };
            },

            /**
             * A <i><b>function</b> that returns a filter</i>
             * that returns an array whose elements satisfy <i><b><u>NONE</u></b></i> of the specified filters<br>
             * <br>
             * USAGE: <code>const filtered = array.filter( Filters.makeMatchesNoneFilter( filterA, filterB, ...filterN ) );</code><br>
             * @param {...function} pPredicates One or more filter functions
             *
             * @return {function(*):boolean} A filter that returns the elements of an array that match none the specified criteria
             *
             * @type {function(...function)}
             *
             * @alias module:ArrayUtils#Filters.makeMatchesNoneFilter
             * */
            makeMatchesNoneFilter: function( ...pPredicates )
            {
                const predicates = [].concat( ...(pPredicates || []) ).filter( Filters.IS_FILTER );

                if ( predicates.length > 0 )
                {
                    const func = Filters.makeMatchesAnyFilter( ...predicates );

                    return function( e )
                    {
                        return !func( e );
                    };
                }

                return function() { return true; };
            },

            /**
             * A helper function that returns a number
             * @type {function(*):number}
             * @private
             * */
            _numExpected: function( pNum )
            {
                let num = isNumber( pNum ) ? parseInt( Number( pNum ).toFixed( 0 ) ) : isString( pNum ) ? parseInt( pNum ) : 1;

                return isNumber( num ) && !isNaN( num ) && isFinite( num ) ? num : 1;
            },

            /**
             * A <i><b>function</b> that returns a filter</i>
             * that returns an array whose elements satisfy <b>AT LEAST <i>n</i></b> of the specified filters<br>
             * <br>
             * USAGE: <code>const filtered = array.filter( Filters.makeMatchesNPlusFilter( filterA, filterB, ...filterN ) );</code><br>
             *
             * @param {number} pNumMatches The minium number of filters an element must match
             * @param pPredicates <i>n</i> or more filter functions
             *
             * @return {function(*):boolean} A filter that returns an array whose elements satisfy AT LEAST <i>n</i> of the specified filters
             *
             * @type {function(number,...function)}
             *
             * @alias module:ArrayUtils#Filters.makeMatchesNPlusFilter
             */
            makeMatchesNPlusFilter: function( pNumMatches, ...pPredicates )
            {
                const predicates = Filters._copyPredicateArguments( ...pPredicates );

                const numExpected = Filters._numExpected( pNumMatches );

                if ( numExpected > predicates.length )
                {
                    reportIllegalArguments( pNumMatches, predicates.length, "makeMatchesNPlusFilter" );
                }

                return function( e )
                {
                    let numMatches = 0;

                    for( const func of predicates )
                    {
                        try
                        {
                            numMatches += (func( e ) ? 1 : 0);
                        }
                        catch( ex )
                        {
                            ignore( ex );
                        }

                        if ( numMatches >= numExpected )
                        {
                            break;
                        }
                    }

                    return (numMatches >= numExpected);
                };
            },

            /**
             * A <i><b>function</b> that returns a filter</i>
             * that returns an array whose elements satisfy <b>EXACTLY <i>n</i></b> of the specified filters<br>
             * <br>
             * USAGE: <code>const filtered = array.filter( Filters.makeMatchesExactlyNFilter( filterA, filterB, ...filterN ) );</code><br>
             * @param {number} pNumMatches The exact number of filters an element must match
             * @param {...function(*):boolean} pPredicates <i>n</i> or more filter functions
             *
             * @return {function(*):boolean} A filter that returns an array whose elements satisfy EXACTLY <i>n</i> of the specified filters
             *
             * @type {function(number,...function)}
             *
             * @alias module:ArrayUtils#Filters.makeMatchesExactlyNFilter
             */
            makeMatchesExactlyNFilter: function( pNumMatches, ...pPredicates )
            {
                const predicates = [].concat( ...(pPredicates || []) ).filter( Filters.IS_FILTER );

                let numExpected = Filters._numExpected( pNumMatches );

                if ( numExpected > predicates.length )
                {
                    reportIllegalArguments( pNumMatches, predicates.length, "makeMatchesExactlyNFilter" );
                }

                return function( e )
                {
                    let numMatches = 0;

                    for( const func of predicates )
                    {
                        try
                        {
                            numMatches += (func( e ) ? 1 : 0);
                        }
                        catch( ex )
                        {
                            ignore( ex );

                            numMatches = Infinity;
                            break;
                        }
                    }

                    return (numMatches === numExpected);
                };
            },

            /**
             * A <i><b>function</b> that returns a filter</i>
             * that returns an array whose elements satisfy <b>LESS THAN <i>n</i></b> of the specified filters<br>
             * <br>
             * USAGE: <code>const filtered = array.filter( Filters.makeMatchesLessThanNFilter( filterA, filterB, ...filterN ) );</code><br>
             *
             * @param {number} pNumAllowed The maximum number of filters an element can match
             * @param {...function(*):boolean} pPredicates <i>n</i> or more filter functions
             *
             * @return {function(*):boolean} A filter that returns an array whose elements satisfy less than <i>n</i> of the specified filters
             *
             * @type {function(number,...function)}
             *
             * @alias module:ArrayUtils#Filters.makeMatchesLessThanNFilter
             */
            makeMatchesLessThanNFilter: function( pNumAllowed, ...pPredicates )
            {
                const predicates = [].concat( ...(pPredicates || []) ).filter( Filters.IS_FILTER );

                let numAllowed = this._numExpected( pNumAllowed );

                return function( e )
                {
                    let numMatches = 0;

                    for( const func of predicates )
                    {
                        try
                        {
                            numMatches += (func( e ) ? 1 : 0);
                        }
                        catch( ex )
                        {
                            ignore( ex );

                            numMatches = Infinity;
                            break;
                        }

                        if ( numMatches >= numAllowed )
                        {
                            break;
                        }
                    }

                    return (numMatches < numAllowed);
                };
            },

            /**
             * A filter to return the elements of an array
             * that are also arrays with at least one non-null/non-empty element<br>
             * USAGE: <code>const populatedArrays = array.filter( Filters.IS_POPULATED_ARRAY );</code><br>
             *
             * @type {function(*):boolean}
             *
             * @alias module:ArrayUtils#Filters#IS_POPULATED_ARRAY
             * */
            IS_POPULATED_ARRAY: function( e )
            {
                const filter = Filters.makeMatchesAllFilter( Filters.IS_OBJECT, Filters.IS_NOT_NULL, Filters.IS_ARRAY, e => e?.length > 0 );
                return filter( e );
            },

            /**
             * A filter to return the elements of an array
             * that are objects (or arrays) with at least one property<br>
             * USAGE: <code>const populated = array.filter( Filters.IS_POPULATED_OBJECT );</code><br>
             *
             * @type {function(*):boolean}
             *
             * @alias module:ArrayUtils#Filters#IS_POPULATED_OBJECT
             * */
            IS_POPULATED_OBJECT: function( e )
            {
                const filter = Filters.makeMatchesAllFilter( Filters.IS_OBJECT, Filters.IS_NOT_NULL, e => Filters.IS_ARRAY( e ) ? ((e?.length || 0) > 0) : (Object.keys( e )?.length || 0) > 0 );
                return filter( e );
            },

            /**
             * A filter to return the elements of an array that are objects
             * that are not arrays with at least one non-null/non-empty property<br>
             * USAGE: <code>const objects = array.filter( Filters.IS_POPULATED_NON_ARRAY_OBJECT );</code><br>
             *
             * @type {function(*):boolean}
             *
             * @alias module:ArrayUtils#Filters#IS_POPULATED_NON_ARRAY_OBJECT
             *
             * */
            IS_POPULATED_NON_ARRAY_OBJECT: function( e )
            {
                const filter = Filters.makeMatchesAllFilter( Filters.IS_OBJECT( e ), Filters.IS_NOT_NULL, e => ( !Filters.IS_ARRAY( e ) && Object.keys( e ).length > 0) );
                return filter( e );
            },

            /**
             * A filter to return the elements of an array that are valid numbers<br>
             * USAGE: <code>const numbers = array.filter( Filters.IS_VALID_NUMBER );</code><br>
             *
             * @type {function(*):boolean}
             *
             * @alias module:ArrayUtils#Filters#IS_VALID_NUMBER
             *
             * */
            IS_VALID_NUMBER: e => Filters.IS_NUMBER( e ) && !isNaN( e ) && isFinite( e ),

            /**
             * A filter to return the elements of an array
             * that are either non-empty strings,
             * objects with at least one property,
             * arrays with at least one element,
             * valid numbers,
             * or booleans<br>
             * <br>
             * USAGE: <code>const populated = array.filter( Filters.NON_EMPTY );</code><br>
             *
             * @type {function(*):boolean}
             *
             * @alias module:ArrayUtils#Filters#NON_EMPTY
             */
            NON_EMPTY: function( e )
            {
                const filter = Filters.makeMatchesAnyFilter( Filters.IS_POPULATED_STRING,
                                                             Filters.IS_POPULATED_OBJECT,
                                                             Filters.IS_VALID_NUMBER,
                                                             Filters.IS_FUNCTION,
                                                             Filters.IS_BOOLEAN );
                return filter( e );
            },

            /**
             * A filter to return the elements of an array
             * that are either non-empty strings,
             * objects with at least one property,
             * arrays with at least one element,
             * booleans,
             * Dates,
             * RegExp objects,
             * or valid numbers<br>
             * <br>
             * USAGE: <code>const filtered = array.filter( Filters.IS_POPULATED );</code><br>
             * @type {function(*):boolean}
             * @alias module:ArrayUtils#Filters#IS_POPULATED
             */
            IS_POPULATED: function( e )
            {
                const filter =
                    Filters.makeMatchesAnyFilter(
                        Filters.IS_POPULATED_STRING,
                        Filters.IS_VALID_NUMBER,
                        Filters.IS_BOOLEAN,
                        Filters.IS_REGEXP,
                        Filters.IS_DATE,
                        Filters.IS_POPULATED_OBJECT,
                        Filters.IS_POPULATED_ARRAY
                    );

                return filter( e );
            },

            /**
             * A filter to return the elements of an array
             * that are strings with at least one non-whitespace character<br>
             * USAGE: <code>const strings = array.filter( Filters.NON_BLANK );</code><br>
             *
             * @type {function(*):boolean}
             * @alias module:ArrayUtils#Filters#NON_BLANK
             */
            NON_BLANK: e => Filters.IS_POPULATED_STRING( e ) && _mt_str !== e.trim() && !Filters.IS_WHITESPACE( e ),

            /**
             * A <i><b>function</b> that returns a filter</i>
             * that returns an array whose elements are strings that match the specified regular expression<br>
             * <br>
             * USAGE: <code>const filtered = array.filter( Filters.makeMatchesRexExpFilter( filterA, filterB, ...filterN ) );</code><br>
             *
             * @param {RegExp|string} pRx - A regular expression or a string that represents a regular expression pattern
             *
             * @return {function(*):boolean} An array whose elements are strings matching the specified regular expression
             *
             * @alias module:ArrayUtils#Filters.makeMatchesRexExpFilter
             */
            makeMatchesRexExpFilter: function( pRx )
            {
                const rx = new RegExp( pRx || /.*/s );

                return function( e )
                {
                    if ( !isString( e ) )
                    {
                        return false;
                    }

                    const re = new RegExp( rx || /.*/s );

                    return re.test( e );
                };
            },

            /**
             * A <i><b>function</b> that returns a filter</i>
             * that matches elements if none of the predicates/filters specified return true<br>
             * <br>
             * USAGE: <code>const filtered = array.filter( Filters.NOT( filterA, filterB, ...filterN ) );</code><br>
             *
             * @see {@link module:ArrayUtils#Filters.makeMatchesNoneFilter}
             *
             * @param {...function(*):boolean} pPredicates - One or more filter functions
             *
             * @returns {function(*, number, Array<*>)} An array whose elements do not match any of the filters specified
             *
             * @type {function(...function)}
             *
             * @alias module:ArrayUtils#Filters.NOT
             */
            NOT: function( ...pPredicates )
            {
                const filters = asArray( pPredicates ).filter( Filters.IS_FILTER );

                return function( e, i, a )
                {
                    for( let f of filters )
                    {
                        const meets = f( e, i, a );
                        if ( meets )
                        {
                            return false;
                        }
                    }

                    return true;
                };
            },

            /**
             * A <i><b>function</b> that returns a filter</i>
             * that returns an array whose elements are not elements of the specified array<br>
             * <br>
             * USAGE: <code>const filtered = array.filter( Filters.NOT_IN( ...excludedValues ) );</code><br>
             *
             * @param {...*} pArr - An array or one or more values or arrays<br>
             * whose elements should not be included in the array returned when the filter is applied
             *
             * @return {function(*):boolean} A filter to return an array with only elements that are not in the specified array
             *
             * @type {function(...*):function(*)}
             *
             * @alias module:ArrayUtils#Filters.NOT_IN
             */
            NOT_IN: function( ...pArr )
            {
                const arr = varargs( ...pArr );

                return function( e )
                {
                    let retained = arr?.length > 0 ? !(arr.includes( e )) : (_ud !== typeof e && null !== e);

                    if ( retained && isArray( e ) )
                    {
                        let filtered = arr.filter( Filters.IS_ARRAY );
                        for( let elem of filtered )
                        {
                            if ( arraysEqual( elem, e ) )
                            {
                                retained = false;
                                break;
                            }
                        }
                    }
                    else if ( isObject( e ) )
                    {
                        let filtered = arr.filter( Filters.IS_OBJECT );

                        for( let elem of filtered )
                        {
                            if ( arraysEqual( Object.keys( e ), Object.keys( elem ), {
                                trim: true,
                                comparator: Comparators._compare
                            } ) )
                            {
                                if ( arraysEqual( Object.values( e ), Object.values( elem ), {
                                    trim: false,
                                    comparator: Comparators._compare
                                } ) )
                                {
                                    retained = false;
                                    break;
                                }
                            }
                        }
                    }

                    return retained;
                };
            },

            /**
             * A <i><b>function</b> that returns a filter</i>
             * to return the elements of an array
             * that are also elements of the specified array<br>
             * <br>
             * USAGE: <code>const filtered = array.filter( Filters.IN( ...includedValues ) );</code><br>
             *
             * @param {...*} pArr - An array or one or more values or arrays<br>
             * whose elements should be included in the array returned when the filter is applied
             *
             * @return {function(*):boolean} A filter to return an array with only elements that are also in the specified array
             *
             * @type {function(...*):function(*):boolean}
             *
             * @alias module:ArrayUtils#Filters.IN
             */
            IN:
                function( ...pArr )
                {
                    const arr = varargs( ...pArr );

                    return function( e )
                    {
                        let retained = arr?.length > 0 && (arr.includes( e ));

                        if ( !retained && isArray( e ) )
                        {
                            let filtered = arr.filter( Filters.IS_ARRAY );
                            for( let elem of filtered )
                            {
                                if ( arraysEqual( elem, e ) )
                                {
                                    retained = true;
                                    break;
                                }
                            }
                        }
                        else if ( isObject( e ) )
                        {
                            let filtered = arr.filter( Filters.IS_OBJECT );

                            for( let elem of filtered )
                            {
                                if ( arraysEqual( Object.keys( e ), Object.keys( elem ), {
                                    trim: true,
                                    comparator: Comparators._compare
                                } ) )
                                {
                                    if ( arraysEqual( Object.values( e ), Object.values( elem ), {
                                        trim: false,
                                        comparator: Comparators._compare
                                    } ) )
                                    {
                                        retained = true;
                                        break;
                                    }
                                }
                            }
                        }

                        return retained;
                    };
                },

            /**
             * A <i><b>function</b> that returns a filter</i>
             * that returns an array whose elements each start with
             * one or more of the strings in the specified array<br>
             * <br>
             * USAGE: <code>const mikes = names..map( Mappers.TO_LOWERCASE ).filter( Filters.STARTS_WITH( "mike", "michael" ) );</code><br>
             *
             * @param {...string} pArr - One or more strings or arrays of strings<br>
             * with which elements of an array to which the returned filter is applied must start<br>
             *
             * @return {function(*, number, Array<*>):boolean} A filter that, when applied,
             * returns an array including only those elements that are strings starting with one or more of the values specified.
             *
             * @type {function(...string):function(*, number, Array<*>):boolean}
             *
             * @alias module:ArrayUtils#Filters.STARTS_WITH
             */
            STARTS_WITH: function( ...pArr )
            {
                const arr = [].concat( ...(pArr || []) ).flat().map( e => asString( e ) );

                return function( e, i, a )
                {
                    let does = (arr || a)?.length <= 0 && _mt_str === e.trim();

                    for( const elem of (arr || a) )
                    {
                        if ( elem && e && asString( e ).startsWith( elem ) )
                        {
                            does = true;
                            break;
                        }
                    }
                    return does;
                };
            },

            /**
             * A <i><b>function</b> that returns a filter</i>
             * that returns an array whose elements each end with
             * one or more of the strings in the specified array<br>
             * <br>
             * USAGE: <code>const possessives = array.filter( Filters.ENDS_WITH( "'s","s'" ) );</code><br>
             *
             * @param {...string} pArr - One or more strings or arrays of strings<br>
             * with which elements of an array to which the returned filter is applied must end<br>
             *
             * @return {function(*, number, Array<*>)} A filter that, when applied,
             * returns an array including only those elements that are strings ending with one or more of the values specified.
             *
             * @type {function(...string):function(*, number, Array<*>):boolean}
             *
             * @alias module:ArrayUtils#Filters.ENDS_WITH
             */
            ENDS_WITH: function( ...pArr )
            {
                const arr = [].concat( ...(pArr || []) ).flat().map( e => asString( e ) );

                return function( e, i, a )
                {
                    let does = (arr || a)?.length <= 0 && _mt_str === e.trim();

                    for( const elem of (arr || a) )
                    {
                        if ( elem && e && asString( e ).endsWith( elem ) )
                        {
                            does = true;
                            break;
                        }
                    }

                    return does;
                };
            },

            /**
             * A <i><b>function</b> that returns a filter</i>
             * that is composed of the filters specified<br>
             * <br>
             * USAGE: <code> const filtered = array.filter( Filters.chain( filterA, filterB, ...filterN ) );</code><br>
             *
             * @param {...function(*):boolean} pFilters - One or more filter functions
             *
             * @return {function(*, number, Array<*>):boolean} A filter composed of the specified filters
             *
             * @alias module:ArrayUtils#Filters.chain
             */
            chain: function( ...pFilters )
            {
                const filters = ([].concat( ...(pFilters || [Filters.IDENTITY]) )).filter( Filters.IS_FILTER );

                return function( e, i, a )
                {
                    let matches = true;

                    let j = 0, n = filters?.length;

                    while ( matches && j < n )
                    {
                        const check = filters[j++];

                        matches = check( e, i, a );
                    }

                    return matches;
                };
            }
        };

    /**
     * This is a top-level function that returns a filter<br>
     * to return an array whose elements match <b>all</b> the filter functions specified.
     *
     * @see {@link module:ArrayUtils#Filters.makeMatchesAllFilter}
     *
     * @param {...function(*):boolean} pFunction - One or more filter functions to combine
     *
     * @returns {function(*): boolean} A filter that returns an array whose elements match all the specified filters
     *
     * @alias module:ArrayUtils.predicate
     */
    const predicate = function( ...pFunction )
    {
        const functions = [].concat( ...(pFunction || [Filters.IDENTITY]) ).filter( Filters.IS_FILTER );
        return Filters.makeMatchesAllFilter( ...(functions || [Filters.IDENTITY]) );
    };

    /**
     * This is a collection of functions
     * <i>and functions that return a function</i>
     * that can be used to map an array of elements
     * to another array of elements<br>
     * <br>
     * These can be chained or combined using other features of this module<br>
     *
     * @see {@link Array.map}
     *
     * @const
     * @namespace
     * @alias module:ArrayUtils#Mappers
     */
    const Mappers =
        {
            /**
             * A mapper that simply returns an array with the same elements
             * as the array to which it is applied<br><br>
             * USAGE: <code>const newArray = array.map( Mappers.IDENTITY );</code><br>
             * @type {function(*):*}
             * @alias module:ArrayUtils#Mappers#IDENTITY
             * */
            IDENTITY: e => e,

            /**
             * A mapper that returns an array
             * with the elements of the array to which it is applied
             * converted to strings<br><br>
             * USAGE: <code>const strings = array.map( Mappers.TO_STRING );</code><br>
             * @type {function(*):*}
             * @alias module:ArrayUtils#Mappers#TO_STRING
             * */
            TO_STRING: e => isString( e ) ? e : asString( e ),

            /**
             * A <i><b>function</b> that returns a mapper</i>
             * that returns an array with the elements of the array to which it is applied
             * converted into strings according to the options specified<br><br>
             * USAGE: <code>const strings = array.map( Mappers.TO_STRING_WITH_OPTIONS( options ) );</code><br>
             *
             * @param {AsStringOptions} pOptions - The options to pass to the {@link stringUtils.asString} function
             *
             * @returns {function(*):*}
             *
             * @type {function(*):*}
             *
             * @see {@link stringUtils.asString}
             * @see {@link AsStringOptions}
             *
             * @alias module:ArrayUtils#Mappers#TO_STRING_WITH_OPTIONS
             */
            TO_STRING_WITH_OPTIONS: function( pOptions = DEFAULT_AS_STRING_OPTIONS )
            {
                const options = populateOptions( pOptions, DEFAULT_AS_STRING_OPTIONS );
                return e => asString( e, options.trim, options );
            },

            /**
             * A mapper that returns an array
             * with the elements of the array to which it is applied
             * converted to numbers<br>
             * <br>
             * <b>Note:</b> Elements of the returned array may be <i>NaN</i> or <i>Infinity</i>
             * <br><br>
             * USAGE: <code>const numbers = array.map( Mappers.TO_NUMBER );</code><br>
             *
             * @type {function(*):number}
             * @alias module:ArrayUtils#Mappers#TO_NUMBER
             * */
            TO_NUMBER: e => isNumber( e ) ? e : asFloat( e ),

            /**
             * A mapper that returns an array
             * with the elements of the array to which it is applied
             * converted to base-10 numbers (or <i>NaN</i>, if the source element cannot be converted)<br>
             * <br>
             * USAGE: <code>const numbers = array.map( Mappers.TO_DECIMAL );</code><br>
             * @type {function(*):number}
             * @alias module:ArrayUtils#Mappers#TO_DECIMAL
             * */
            TO_DECIMAL: e => isNumeric( e ) ? toDecimal( e ) : asFloat( e ),

            /**
             * A mapper that returns an array
             * with the elements of the array to which it is applied
             * converted to base-16 string literal representations (or 0x0, if the source element is not numeric)
             * <br><br>
             * USAGE: <code>const hex_strings = array.map( Mappers.TO_HEXADECIMAL );</code><br>
             *
             * @type {function(*):string}
             *
             * @alias module:ArrayUtils#Mappers#TO_HEXADECIMAL
             *
             * */
            TO_HEXADECIMAL: e => isNumeric( e ) ? toHex( e ) : "0x0",

            /**
             * A mapper that returns an array
             * with the elements of the array to which it is applied
             * converted to base-8 string literal representations (or 0o0, if the source element is not numeric)<br>
             * <br>
             * USAGE: <code>const octals = array.map( Mappers.TO_OCTAL );</code><br>
             * @type {function(*):string}
             * @alias module:ArrayUtils#Mappers#TO_OCTAL
             * */
            TO_OCTAL: e => isNumeric( e ) ? toOctal( e ) : "0o0",

            /**
             * A mapper that returns an array
             * with the elements of the array to which it is applied
             * converted to base-2 string literal representations (or 0b0, if the source element is not numeric)
             * <br><br>
             * USAGE: <code>const strings = array.map( Mappers.TO_BINARY );</code><br>
             * @type {function(*):string}
             * @alias module:ArrayUtils#Mappers#TO_BINARY
             * */
            TO_BINARY: e => isNumeric( e ) ? toBinary( e ) : "0b0",

            TO_BYTES: function( e )
            {
                switch ( typeof e )
                {
                    case _str:
                        return asUtf8ByteArray( e );

                    case _num:
                    case _big:
                        if ( toDecimal( e ) >= 255 )
                        {
                            return e;
                        }
                        const s = asString( toBinary( e ) ).replace( /^0b/, _mt_str );
                        return [toDecimal( s.slice( 0, 8 ) ), toDecimal( s.slice( 8, 16 ) )];

                    case _bool:
                        return e ? 1 : 0;

                    default:
                        return e;
                }
            },

            /**
             * A mapper that returns an array
             * with the elements of the array to which it is applied
             * converted to valid numbers (or 0, if the source element is not numeric)
             * <br>
             * <br>
             * USAGE: <code>const numbers = array.map( Mappers.TO_VALID_NUMBER );</code><br><br>
             * <b>Note:</b> Elements of the returned array will be 0 if the value could not be converted to a valid number
             * @type {function(*):number}
             * @alias module:ArrayUtils#Mappers#TO_VALID_NUMBER
             * */
            TO_VALID_NUMBER: function( e )
            {
                let n = Mappers.TO_NUMBER( e );

                if ( !isNaN( n ) && isFinite( n ) )
                {
                    return n;
                }

                return 0;
            },

            /**
             * A mapper that returns an array
             * with the elements of the array to which it is applied
             * converted to strings with leading and trailing whitespace removed<br>
             * <br>
             * USAGE: <code>const strings = array.map( Mappers.TRIMMED );</code><br>
             *
             * @type {function(*):string}
             *
             * @alias module:ArrayUtils#Mappers#TRIMMED
             * */
            TRIMMED: e => asString( e, true ).trim(),

            /**
             * A <i><b>function</b> that returns a mapper</i>
             * that returns an array with each of the elements of the array to which it is applied
             * converted to strings appended with the specified string<br>
             * <br>
             * USAGE: <code>const strings = array.map( Mappers.APPEND( "-ish" ) );</code><br>
             *
             * @param {string} pStr - a string to append to each element of the source array in the returned array
             *
             * @return {function(*):string} A mapper that returns an array with each of the elements of the array to which it is applied
             * converted to strings appended with the specified string
             *
             * @alias module:ArrayUtils#Mappers.APPEND
             * */
            APPEND: function( pStr )
            {
                return e => (asString( e ) + (asString( pStr ) || _mt_str));
            },

            /**
             * A <i><b>function</b> that returns a mapper</i>
             * that returns an array with each of the elements of the array to which it is applied
             * converted to strings prefixed with the specified string<br>
             * <br>
             * USAGE: <code>const strings = array.map( Mappers.PREPEND( "VALUE:" );</code><br>
             *
             * @param {string} pStr - a string to prepend to each element of the source array in the returned array
             *
             * @return {function(*):string} A mapper that returns an array with each of the elements of the array to which it is applied
             * converted to strings prefixed with the specified string
             *
             * @alias module:ArrayUtils#Mappers.PREPEND
             * */
            PREPEND: function( pStr )
            {
                return e => ((asString( pStr ) || _mt_str) + asString( e ));
            },

            /**
             * A <i><b>function</b> that returns a mapper</i>
             * that returns an array with each of the elements of the array to which it is applied
             * converted to strings with the search string (or RegExp)
             * replaced with the specified replacement.<br>
             * <br>
             * USAGE: <code>const strings = array.map( Mappers.REPLACE( /[\$]/, "" );</code><br>
             *
             * @param {string|RegExp} pSearchStr - A string or regular expression to replace with the specified replacement
             * @param {string|function} pReplacement - A string to replace the search string or matched regular expression<br><br>
             * Note that the second argument can also be a function, as per https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/replace#specifying_a_function_as_the_replacement
             *
             * @return {function(*):string} A mapper that returns an array with each of the elements of the array to which it is applied
             * converted to strings with the search string (or RegExp) replaced with the specified replacement
             *
             * @alias module:ArrayUtils#Mappers.REPLACE
             * */
            REPLACE: function( pSearchStr, pReplacement )
            {
                return e => asString( e ).replace( pSearchStr, (asString( pReplacement || _mt_str ) || _mt_str) );
            },

            /**
             * A mapper that returns an array
             * with the elements of the array to which it is applied
             * converted to lowercase strings<br>
             * <br>
             * USAGE: <code>const strings = array.map( Mappers.TO_LOWERCASE );</code><br>
             * @type {function(*):string}
             * @alias module:ArrayUtils#Mappers#TO_LOWERCASE
             * */
            TO_LOWERCASE: function( e )
            {
                return lcase( asString( e ) );
            },

            /**
             * A mapper that returns an array
             * with the elements of the array to which it is applied
             * converted to uppercase strings<br>
             * <br>
             * USAGE: <code>const strings = array.map( Mappers.TO_UPPERCASE );</code><br>
             * @type {function(*):string}
             * @alias module:ArrayUtils#Mappers#TO_UPPERCASE
             * */
            TO_UPPERCASE: function( e )
            {
                return ucase( asString( e ) );
            },

            /**
             * A <i><b>function</b> that returns a mapper</i>
             * that applies each of the mapper functions specified
             * in the order specified<br>
             * <br>
             * USAGE: <code>const newArray = array.map( Mappers.chain( mapperA, mapperB, ...mapperC ) );</code><br>
             *
             * @param {...function} pMappers - One or more mapping functions to apply successively
             *
             * @return {function(*, number, Array<*>)} A mapper that applies each of the mapper functions specified
             * in the order specified<br>
             *
             * @type {function(...function):function(*, number, Array<*>)}
             * @alias module:ArrayUtils#Mappers.chain
             * */
            chain: function( ...pMappers )
            {
                const mappers = [].concat( ...(pMappers || [Mappers.IDENTITY]) );

                return function( e, i, a )
                {
                    let value = e;

                    for( const mapper of mappers )
                    {
                        value = mapper( e, i, a );
                    }

                    return value;
                };
            }
        };

    /**
     * @typedef {function(*,*):number} Comparator
     * @desc A function that takes 2 arguments and returns<br>
     * 1 if the first argument is greater than the second argument<br>
     * -1 if the first argument is less than the second argument<br>
     * or<br>
     * 0 if the arguments are equal<br>
     * <br>
     * This is a function that could be passed to the {@link Array.sort} method, for example
     */

    /**
     * Returns an array of valid comparator functions
     *
     * @param {...Comparator} pComparators - The comparators to be resolved and filtered<br>
     * If none are provided, an array containing a default comparator is returned
     *
     * @return {Array<Comparator>} A filtered array of valid comparator functions
     *
     * @type {function(...Comparator):Array<Comparator>}
     *
     * @alias module:ArrayUtils.resolveComparators
     */
    function resolveComparators( ...pComparators )
    {
        return [].concat( varargs( ...(pComparators || [Comparators.NONE]) ) ).filter( Filters.COMPARATORS );
    }

    /**
     * This is a collection of {@link Comparator}s <i>and functions that create comparators</i>
     * (that is, functions that can be used as arguments to the {@link Array.sort} method)
     * @const
     * @namespace
     * @alias module:ArrayUtils#Comparators
     */
    const Comparators =
        {
            /**
             * The basic, generic, comparison of 2 values
             * that can be considered greater than or less than one another
             *
             * @param {*} a - The first value or comparable object
             * @param {*} b - The other value or comparable object
             *
             * @return {number} -1 if the first value should occur before the other value,<br>
             * 1 if the first value should occur after the other object, or...<br>
             * 0 if the values are equal or have no preferred order
             *
             * @private
             */
            _compare: function( a, b )
            {
                return (a < b ? -1 : a > b ? 1 : 0);
            },

            /**
             * A no op function that will leave a collection in the same order<br>
             * <br>
             * USAGE: <code>const sorted = array.sort( Comparators.NONE );</code><br>
             * @type {function(*,*):number}
             * @alias module:ArrayUtils#Comparators#NONE
             * */
            NONE: function( a, b )
            {
                return 0;
            },

            /**
             * A <i><b>function</b> that returns a default comparator</i>
             * that treats null values as the default value for the specified type<br>
             * <br>
             * USAGE: <code>const sorted = array.sort( Comparators.CREATE_DEFAULT( "string" ) );</code><br>
             *
             * @param {string} pType - The type of values to be compared
             *
             * @returns {function(*,*):number} a default comparator
             * that treats null values as the default value for the specified type
             *
             * @alias module:ArrayUtils#Comparators.CREATE_DEFAULT
             */
            CREATE_DEFAULT: function( pType )
            {
                return function( a, b )
                {
                    let type = pType || typeof a;

                    let aa = Filters.IS_NOT_NULL( a ) ? castTo( a, type ) : defaultFor( type );
                    let bb = Filters.IS_NOT_NULL( b ) ? castTo( b, type ) : defaultFor( type );

                    return Comparators._compare( aa, bb );
                };
            },

            /**
             * A comparator function that converts each element to a string before comparison<br>
             * <br>
             * USAGE: <code>const sorted = array.sort( Comparators.BY_STRING_VALUE );</code><br>
             * @type {function(*,*):number}
             * @alias module:ArrayUtils#Comparators#BY_STRING_VALUE
             * */
            BY_STRING_VALUE: function( a, b )
            {
                let sA = asString( a ) || (isFunction( a?.toString ) ? a.toString() : _mt_str);
                let sB = asString( b ) || (isFunction( b?.toString ) ? b.toString() : _mt_str);

                if ( isBlank( sA ) && !isString( a ) )
                {
                    try
                    {
                        sA = JSON.stringify( a );
                    }
                    catch( exJson )
                    {
                        ignore( exJson );
                    }
                }

                if ( isBlank( sB ) && !isString( b ) )
                {
                    try
                    {
                        sB = JSON.stringify( b );
                    }
                    catch( exJson )
                    {
                        ignore( exJson );
                    }
                }

                let comp = Comparators._compare( sA, sB );

                if ( 0 === comp )
                {
                    comp = Comparators.CREATE_DEFAULT( _str )( sA, sB );
                }

                return comp;
            },

            /**
             * A comparator function that orders an array by the type of its elements<br>
             * <br>
             * USAGE: <code>const sorted = array.sort( Comparators.BY_TYPE );</code><br>
             * @type {function(*,*):number}
             * @alias module:ArrayUtils#Comparators#BY_TYPE
             * */
            BY_TYPE: function( a, b )
            {
                const typeA = typeof a;
                const typeB = typeof b;

                const orderA = TYPE_SORT_ORDER[typeA];
                const orderB = TYPE_SORT_ORDER[typeB];

                return Comparators._compare( orderA, orderB );
            },

            /**
             * A comparator function that orders an array by the length of its elements<br>
             * <br>
             * USAGE: <code>const sorted = array.sort( Comparators.BY_LENGTH );</code><br>
             * @type {function(*,*):number}
             * @alias module:ArrayUtils#Comparators#BY_LENGTH
             * */
            BY_LENGTH: function( a, b )
            {
                let lenA = calculateLength( a ) || a?.length;
                let lenB = calculateLength( b ) || b?.length;

                return Comparators._compare( lenA, lenB );
            },

            /**
             * A <i><b>function</b> that returns a comparator</i>
             * that orders one array by the position of elements in another array<br>
             * <br>
             * USAGE:
             * Suppose you will obtain an array of country names<br>
             * and you want the United States to appear first in the list<br>
             * (or some other country based on a locale value)<br>
             * <code>
             *     const indexes = ["United States","Albania","Belgium", ... "Zimbabwe"];
             *     const countries = ["Albania","Belgium", ..., "United States", ... "Zimbabwe"];
             *     const comparator = Comparators.BY_POSITION( indexes );
             *     const sorted = array.sort( comparator );
             * </code><br>
             *
             * @param {Array<*>} pReference - An array of values in the order desired
             * @param {function(*, Array<*>)|null} [pPositionFunction=null] A optional function to calculate the desired position.
             * @param {function(*, Array<*>)|null} [pTransformation=null] An optional function to transform the values prior to finding the desired position
             *
             * @return {function(*,*):number} A comparator that orders an array by the position of elements in another array
             *
             * @alias module:ArrayUtils#Comparators.BY_POSITION
             */
            BY_POSITION: function( pReference, pPositionFunction, pTransformation )
            {
                const ref = [].concat( ...(pReference || []) );

                /**
                 * Transforms a given element using the provided transformation function, if defined.
                 *
                 * @param {*} pElem - The element to be transformed
                 *
                 * @returns {*} The transformed value if the transformation function is successfully applied,
                 * or the original element if the transformation could not be performed
                 *
                 * @alias module:ArrayUtils#Comparators.BY_POSITION~transform
                 */
                const transform = function( pElem )
                {
                    let value = pElem;

                    if ( isFunction( pTransformation ) )
                    {
                        try
                        {
                            value = pTransformation.apply( pElem, [pElem, ref] );
                        }
                        catch( ex )
                        {
                            modulePrototype.reportError( ex, "trying to transform " + pElem, S_WARN, modName + "::Comparators.BY_POSITION" );
                        }
                    }

                    return value;
                };

                /**
                 * Finds the position of a given element (`pElem`) within a reference array (`pReference`).<br>
                 * <br>
                 * If the reference array is not provided or is invalid,<br>
                 * it will use the array defined outside the function definition (`ref`).<br>
                 * <br>
                 * An optional custom position function (`pPositionFunction`) can be specified to determine the position.
                 *
                 * @param {*} pElem - The element whose position is to be found
                 * @param {Array} [pReference] - The array to search within
                 *
                 * @returns {number} - The position (index) of the element in the array, or -1 if not found
                 *
                 * @alias module:ArrayUtils#Comparators.BY_POSITION~findPosition
                 */
                const findPosition = function( pElem, pReference )
                {
                    let arr = ((pReference && isArray( pReference )) ? pReference : ref) || [];

                    let position = arr.indexOf( pElem );

                    if ( isFunction( pPositionFunction ) )
                    {
                        try
                        {
                            position = pPositionFunction.apply( arr, [pElem, arr] );
                        }
                        catch( ex )
                        {
                            modulePrototype.reportError( ex, "trying to find the position of " + pElem + " in array" + arr, S_WARN, modName + "::Comparators.BY_POSITION.findPosition" );
                        }
                    }

                    return position;
                };

                return function( a, b )
                {
                    if ( ref?.length <= 0 )
                    {
                        let cmp = Comparators.BY_STRING_VALUE( a, b );
                        if ( 0 === cmp )
                        {
                            cmp = Comparators.CREATE_DEFAULT( typeof a )( a, b );
                        }

                        return cmp;
                    }

                    let aa = transform( a );
                    let bb = transform( b );

                    let idxA = findPosition( aa, ref );
                    let idxB = findPosition( bb, ref );

                    idxA = idxA < 0 ? ref.length : idxA;
                    idxB = idxB < 0 ? ref.length : idxB;

                    let comp = Comparators._compare( idxA, idxB );

                    if ( 0 === comp )
                    {
                        comp = Comparators.BY_STRING_VALUE( aa, bb );
                    }

                    if ( 0 === comp )
                    {
                        comp = Comparators.BY_STRING_VALUE( a, b );
                    }

                    if ( 0 === comp )
                    {
                        comp = Comparators.CREATE_DEFAULT( typeof aa )( aa, bb );
                    }

                    if ( 0 === comp )
                    {
                        comp = Comparators.CREATE_DEFAULT( typeof a )( a, b );
                    }

                    return comp;
                };
            },

            /**
             * A <i><b>function</b> that returns a comparator</i>
             * that applies the specified comparators in order until one of them returns a non-zero value.<br>
             * <br>
             * USAGE: <code>const sorted = array.sort( Comparators.chain( compA, compB, ...compN ) );</code><br>
             *
             * @param {...Comparator} pComparators - One or more comparators to apply in order until one of them return s a non-zero value
             *
             * @return {Comparator} A comparator that applies the specified comparators in order until one of them returns a non-zero value.
             *
             * @alias module:ArrayUtils#Comparators.chain
             */
            chain: function( ...pComparators )
            {
                const comparators = resolveComparators( ...pComparators );

                return function( a, b )
                {
                    let i = 0, n = comparators?.length;

                    let comp = 0;

                    while ( 0 === comp && i < n )
                    {
                        const comparator = comparators[i++];

                        comp = comparator( a, b );
                    }

                    return comp;
                };
            },

            /**
             * A <i><b>function</b> that returns a comparator</i>
             * that applies the specified comparators in order until one of them returns a non-zero value,
             * and then reverses that comparison to return an array sorted in reverse order<br>
             * <br>
             * USAGE: <code>const sorted = array.sort( Comparators.descending( compA, compB, ...compN ) );</code><br>
             *
             * @param {...function(*,*):number} pComparators - One or more comparators to apply in order until one of them return s a non-zero value
             *
             * @return {function(*,*):number} A comparator that applies the specified comparators in order until one of them returns a non-zero value.
             *
             * @alias module:ArrayUtils#Comparators.descending
             */
            descending: function( ...pComparators )
            {
                const comparators = resolveComparators( ...pComparators );

                return function( a, b )
                {
                    let i = 0, n = comparators?.length;

                    let comp = 0;

                    while ( 0 === comp && i < n )
                    {
                        const comparator = comparators[i++];

                        comp = -(comparator( a, b ));
                    }

                    return comp;
                };
            },

            /**
             * Returns true if the specified value is (probably) a comparator
             * @param {*} pCandidate - any value that might be a {@link Comparator}
             * @return {boolean} true if the specified value is a Comparator,
             * that is, a function that takes 2 arguments.<br>
             * <br>
             * USAGE: <code>const comparator = Comparators.isComparator( someValue );</code><br>
             *
             * @alias module:ArrayUtils#Comparators.isComparator
             * */
            isComparator: function( pCandidate )
            {
                return isFunction( pCandidate ) && 2 === pCandidate?.length;
            }
        };

    /**
     * @readonly
     * @enum {string}
     * This is a map of the methods that can be called on an array
     * to transform its contents (or return a new array with the modified content)
     * @type {{FILTER: string, SORT: string, MAP: string, FLAT: string}}
     * @alias module:ArrayUtils#TRANSFORMATIONS
     */
    const TRANSFORMATIONS =
        {
            /**
             * The {@link Array.filter} method that retains elements matching some criteria
             */
            FILTER: "filter",
            /**
             * The {@link Array.map} method that returns an array with transformed elements
             */
            MAP: "map",
            /**
             * The {@link Array.sort} method that reorders the elements of an array according to a comparator function
             */
            SORT: "sort",
            /**
             * The {@link Array.flat} method that creates a new array
             * with all sub-array elements concatenated into it recursively
             * up to a specified depth.
             */
            FLAT: "flat"
        };

    /**
     * This class encapsulates the sort, map, or filter method of an array into an object,
     * which can further be chained to perform multiple transformations on an array
     * @alias module:ArrayUtils#classes#Transformer
     */
    class Transformer
    {
        #methodName;

        #methodArgument;

        #arguments;

        /**
         * Constructs a Transformer which can map, filter, or sort an array
         *
         * @constructor
         *
         * @param {string} pMethodName the method to call on the collection (must be one of 'filter', 'map', 'sort', or 'flat')
         * @param {function|number} pFunction the function to pass to the method (or the number of levels to pass to the {@link Array.flat} method)
         * @param pArgs {...*} one or more arguments to pass to the function being passed to the method
         */
        constructor( pMethodName, pFunction, ...pArgs )
        {
            // the array method to call
            this.#methodName = pMethodName; // should be one of TRANSFORMATIONS.filter, TRANSFORMATIONS.map, or TRANSFORMATIONS.sort

            // arguments to the function to be passed to the method
            this.#arguments = [].concat( ...(asArray( pArgs || [] ) || []) );

            // should be a function suitable as an argument to the specified method
            this.#methodArgument = isFunction( pFunction ) ? pFunction : (isNumber( pFunction ) ? pFunction : (isFunction( this.#arguments[0] ) ? this.#arguments[0] : null));
        }


        /**
         * Returns the name of the method this transformer will call on an array
         *
         * @return {string} The name of the method this transformer will call on an array
         */
        get methodName()
        {
            let funcName = asString( (isString( this.#methodName ) ? this.#methodName : asString( this.#methodName?.name )) ) || TRANSFORMATIONS.FILTER;
            return lcase( asString( Object.values( TRANSFORMATIONS ).includes( funcName ) ? funcName : TRANSFORMATIONS.FILTER, true ) );
        }

        /**
         * Returns a default function or value to pass to the {@link Array} method indicated by {@link #methodName}<br>
         * This is used if this instance does not have a valid argument for the method to be called
         * @returns {function|number} A default function or value to pass to the Array method indicated by methodName
         */
        get defaultArgument()
        {
            switch ( this.methodName )
            {
                case TRANSFORMATIONS.FILTER:
                    return Filters.IDENTITY;

                case TRANSFORMATIONS.MAP:
                    return Mappers.IDENTITY;

                case TRANSFORMATIONS.SORT:
                    return Comparators.NONE;

                case TRANSFORMATIONS.FLAT:
                    return Number.POSITIVE_INFINITY;
            }

            return ( e, o ) => (_ud === typeof o) ? e : 0;
        }

        /**
         * Returns the function or value to pass to the {@link Array} method indicated by {@link #methodName}<br>
         * @returns {function|number} The function or value to pass to the Array method indicated by methodName
         */
        get methodArgument()
        {
            let func = this.#methodArgument;

            func = isFunction( func ) ? func : (TRANSFORMATIONS.FLAT === this.methodName) ? firstNumericValue( this.#arguments ) : this.defaultArgument;

            if ( this.#arguments.length > 0 )
            {
                let args = [].concat( ...(asArray( this.#arguments )) );

                if ( args[0] === func )
                {
                    args = args.slice( 1 );
                }

                if ( args.length > 0 )
                {
                    switch ( this.methodName )
                    {
                        case TRANSFORMATIONS.FILTER:
                        case TRANSFORMATIONS.MAP:
                            return function( e, i, a )
                            {
                                return func( e, i, a, ...args );
                            };

                        case TRANSFORMATIONS.SORT:
                            return function( a, b )
                            {
                                return func( a, b, ...args );
                            };

                        case TRANSFORMATIONS.FLAT:
                            return isValidNumeric( args[0] ) ? asInt( args[0] ) : func;
                    }
                }
            }

            return func;
        }

        /**
         * Calls the transformation on the specified array
         * and returns a new array as the result of the applied transformation
         *
         * @param {Array<*>} pArr - The array to which to apply the transformation<br>
         * If no valid array is specified, uses an empty array
         *
         * @return {Array<*>} A new array that is the result of performing the transformation
         * */
        transform( pArr )
        {
            let arr = [].concat( ...(pArr || []) );

            if ( isString( this.methodName ) )
            {
                const operation = arr[this.methodName];

                if ( isFunction( operation ) )
                {
                    if ( isFunction( this.methodArgument ) && this.methodArgument?.length >= 1 )
                    {
                        arr = arr[this.methodName]( this.methodArgument );
                    }
                    else if ( TRANSFORMATIONS.FLAT === this.methodName )
                    {
                        if ( isValidNumber( this.methodArgument ) )
                        {
                            arr = arr[this.methodName]( this.methodArgument );
                        }
                        else
                        {
                            arr = arr[this.methodName]();
                        }
                    }
                }
            }

            return arr;
        }
    }

    /**
     * This class encapsulates one or more transformations to perform on an array<br>
     * Allows you to combine filtering, mapping, and sorting in a pipeline-like operation<br>
     * @see {@link Transformer}
     * @alias module:ArrayUtils#classes#TransformerChain
     */
    class TransformerChain
    {
        #transformers = [];

        /**
         * Returns a new instance of a TransformerChain<br>
         *
         * @constructor
         * @param {...(Transformer|TransformerChain)} pTransformers One or more instances of the {@link Transformer} class to apply in sequence
         * @return {TransformerChain} An object that can be used to apply several transformations on an Array
         * @see {@link Array.map}, {@link Array.filter}, {@link Array.sort}, and {@link Array.flat}
         */
        constructor( ...pTransformers )
        {
            this.#transformers = [].concat( ...(pTransformers || []) );
        }

        /**
         * Returns the array of Transformers in this chain
         *
         * @returns {Array<Transformer>} The array of Transformers in this chain
         */
        get transformers()
        {
            return [].concat( ...asArray( this.#transformers || [] ) );
        }

        /**
         * Performs the transformations in sequence on the specified array and returns
         * a new array resulting from the transformations applied
         * @param {Array<*>} pArr - An array to transform
         * @returns {Array<*>} A new array resulting from the one or more transformations specified
         */
        transform( pArr )
        {
            // make a new array, so the source array remains unmodified
            let arr = localCopy( pArr || [] );

            // iterate the transformers in this chain
            for( const transformer of this.transformers )
            {
                // in the case that this chain is a composite chain, perform the transformations specified
                if ( (transformer instanceof Transformer) || (transformer instanceof this.constructor) || isFunction( transformer?.transform ) )
                {
                    try
                    {
                        arr = transformer.transform( arr );
                    }
                    catch( ex )
                    {
                        modulePrototype.reportError( ex, "performing transformation", S_WARN, modName + "::TransformerChain::transform" );
                    }
                }
                else
                {
                    // the method should be the string name of the transforming method (filter, map, or sort)
                    const method = transformer?.methodName || transformer;

                    // the function should be an appropriate function for the specified method
                    const func = transformer?.methodArgument || transformer;

                    if ( this.canExecute( arr, method, func ) )
                    {
                        try
                        {
                            arr = arr[method]( func );
                        }
                        catch( ex )
                        {
                            modulePrototype.reportError( ex, "performing transformation", S_WARN, modName + "::TransformerChain::transform" );
                        }
                    }
                }

                // if the prior transformations have produced an empty array,
                // skip any further transformations
                if ( arr?.length <= 0 )
                {
                    break;
                }
            }

            return arr;
        }

        /**
         * Returns true if the specified transformation can be performed
         * @param {Array<*>} pArr - The array to transform
         * @param {string} pMethodName - The name of the method to call on the array
         * @param {number|function} pMethodArgument A value to pass to the transformation method,
         * such as a filter, mapper, comparator, or the depth for flat
         * @returns {boolean} true if the specified transformation can be performed
         */
        canExecute( pArr, pMethodName, pMethodArgument )
        {
            if ( isNull( pArr ) || !isObject( pArr ) || !isFunction( pArr[pMethodName] ) )
            {
                return false;
            }

            let type = (TRANSFORMATIONS.FLAT === pMethodName) ? _num : _fun;
            let minArgs = TRANSFORMATIONS.SORT === pMethodName ? 2 : TRANSFORMATIONS.FLAT === pMethodName ? 0 : 1;

            return type === typeof pMethodArgument && (pMethodArgument?.length || 0) >= minArgs;
        }
    }

    /**
     * A {@link TransformerChain} that will transform an array into an array whose elements
     * are exclusively non-empty strings
     *
     * @type {TransformerChain}
     */
    TransformerChain.TO_NON_EMPTY_STRINGS =
        new TransformerChain(
            new Transformer( TRANSFORMATIONS.FILTER, Filters.IS_POPULATED ),
            new Transformer( TRANSFORMATIONS.MAP, Mappers.TO_STRING ),
            new Transformer( TRANSFORMATIONS.FILTER, Filters.NON_EMPTY )
        );

    /**
     * A {@link TransformerChain} that will transform an array into an array whose elements
     * are exclusively strings containing at least one non-whitespace character
     *
     * @type {TransformerChain}
     */
    TransformerChain.TO_NON_BLANK_STRINGS =
        new TransformerChain(
            new Transformer( TRANSFORMATIONS.FILTER, Filters.IS_POPULATED ),
            new Transformer( TRANSFORMATIONS.MAP, Mappers.TO_STRING ),
            new Transformer( TRANSFORMATIONS.FILTER, Filters.NON_BLANK )
        );

    /**
     * A {@link TransformerChain} that will transform an array into an array whose elements
     * are exclusively non-empty strings with leading and trailing whitespace removed
     *
     * @type {TransformerChain}
     */
    TransformerChain.TRIMMED_NON_EMPTY_STRINGS =
        new TransformerChain(
            new Transformer( TRANSFORMATIONS.FILTER, Filters.IS_POPULATED ),
            new Transformer( TRANSFORMATIONS.MAP, Mappers.TRIMMED ),
            new Transformer( TRANSFORMATIONS.FILTER, Filters.NON_EMPTY )
        );

    /**
     * A {@link TransformerChain} that will transform an array into an array whose elements
     * are exclusively strings with at least one non-whitespace character and with leading and trailing whitespace removed
     *
     * @type {TransformerChain}
     */
    TransformerChain.TRIMMED_NON_BLANK_STRINGS =
        new TransformerChain(
            new Transformer( TRANSFORMATIONS.FILTER, Filters.IS_POPULATED ),
            new Transformer( TRANSFORMATIONS.MAP, Mappers.TRIMMED ),
            new Transformer( TRANSFORMATIONS.FILTER, Filters.NON_BLANK )
        );


    /**
     * A {@link TransformerChain} that will transform an array into an array whose elements
     * are exclusively non-empty strings, then split those elements on the '.' character
     * and then flatten the resulting array and remove any strings consisting of only whitespace
     * and remove leading and trailing whitespace from each remaining element
     *
     * @type {TransformerChain}
     */
    TransformerChain.SPLIT_ON_DOT =
        new TransformerChain(
            TransformerChain.TRIMMED_NON_BLANK_STRINGS,
            new Transformer( TRANSFORMATIONS.MAP, e => e.split( _dot ) ),
            new Transformer( TRANSFORMATIONS.FLAT, 1 ),
            TransformerChain.TRIMMED_NON_BLANK_STRINGS
        );

    /**
     * This subclass of TransformerChain encapsulates the application of one or more filters<br>
     * 'applyFilters' is a synonym for the transform method
     * @extends TransformerChain
     * @alias module:ArrayUtils#classes#FilterChain
     */
    class FilterChain extends TransformerChain
    {
        /**
         * Returns a new FilterChain to apply the specified filters in sequence
         * @constructor
         * @param {...function} pFilters One or more filter functions to apply in sequence
         * @return A new FilterChain to apply the specified filters in sequence
         */
        constructor( ...pFilters )
        {
            super( ([].concat( varargs( ...(pFilters || [Filters.IDENTITY]) ) ).map( e => new Transformer( TRANSFORMATIONS.FILTER, e ) )) );
        }

        applyFilters( pArr )
        {
            return super.transform( pArr );
        }
    }

    /**
     * A filter chain to return strings that are not undefined, null, or empty
     * @type {FilterChain}
     * */
    FilterChain.NON_EMPTY_STRINGS = new FilterChain( Filters.IS_DEFINED, Filters.IS_NOT_NULL, Filters.makeTypeFilter( _str ), Filters.NON_EMPTY );

    /**
     * A filter chain to return strings that are not undefined, null, or composed entirely of whitespace
     * @type {FilterChain}
     * */
    FilterChain.NON_BLANK_STRINGS = new FilterChain( Filters.IS_DEFINED, Filters.IS_NOT_NULL, Filters.makeTypeFilter( _str ), Filters.NON_BLANK );

    /**
     * This subclass of TransformerChain encapsulates the application of one or more mappers<br>
     * 'applyMappers' is a synonym for the transform method
     * @extends TransformerChain
     * @alias module:ArrayUtils#classes#MapperChain
     */
    class MapperChain extends TransformerChain
    {
        /**
         * Returns a new MapperChain to apply the specified mapping functions in sequence
         * @constructor
         * @param {...function} pMappers One or more mapping functions to apply in sequence
         * @return A new MapperChain to apply the specified mapping functions in sequence
         */
        constructor( ...pMappers )
        {
            super( ([].concat( varargs( ...(pMappers || [Mappers.IDENTITY]) ) )).map( e => new Transformer( TRANSFORMATIONS.MAP, e ) ) );
        }

        applyMappers( pArr )
        {
            return super.transform( pArr );
        }
    }

    /**
     * A mapper/filter combination that returns an array
     * with each element converted to a string and empty strings removed
     * */
    MapperChain.NON_EMPTY_STRINGS = new TransformerChain( new Transformer( TRANSFORMATIONS.MAP, Mappers.TO_STRING ), FilterChain.NON_EMPTY_STRINGS );

    /**
     * This subclass of TransformerChain
     * encapsulates the application of one or more comparators to sort an array
     * @extends TransformerChain
     * @alias module:ArrayUtils#classes#ComparatorChain
     */
    class ComparatorChain extends TransformerChain
    {
        #comparators;

        /**
         * Returns a new ComparatorChain to apply the specified comparators in sequence until one of them returns a non-zero value
         * @constructor
         * @param {...Comparator} pComparators
         * @return A new ComparatorChain to apply the specified comparators in sequence until one of them returns a non-zero value
         */
        constructor( ...pComparators )
        {
            super( [].concat( varargs( ...(pComparators || [Comparators.NONE]) ) ).filter( Filters.COMPARATORS ).map( e => new Transformer( TRANSFORMATIONS.SORT, e ) ) );

            this.#comparators = ([].concat( ...(pComparators || [Comparators.NONE]) )).filter( Filters.COMPARATORS );
        }

        transform( pArr )
        {
            return this.sort( asArray( pArr ) );
        }

        /**
         * Returns the {@link Comparator} that is composed of the functions specified when this instance was constructed
         * @returns {function(*, *): number}
         */
        get comparator()
        {
            const comparators = this.#comparators;

            return function( a, b )
            {
                let comp = 0;

                for( const func of comparators )
                {
                    comp = func( a, b );

                    if ( 0 !== comp )
                    {
                        break;
                    }
                }

                return comp;
            };
        }

        sort( pArr )
        {
            let arr = asArray( pArr );

            const checksum = arr.length;

            arr = arr.sort( this.comparator );

            return checksum === arr?.length ? (arr || pArr) : pArr;
        }
    }

    /**
     * Returns an array with all specified filters applied
     * @param {Array<*>} pArr The array to filter
     * @param {...function} pFilters One or more functions that return true if the element should be included in the resulting array
     * @returns {Array<*>} A new array with the specified filters applied
     * @alias module:ArrayUtils.chainFilters
     */
    const chainFilters = function( pArr, ...pFilters )
    {
        let arr = [].concat( asArray( pArr ) || [] );

        let filters = [].concat( ...(pFilters || [Filters.IDENTITY]) );

        for( const sieve of filters )
        {
            arr = arr.filter( sieve );

            if ( arr?.length <= 0 )
            {
                break;
            }
        }

        return arr;
    };

    /**
     * Returns an array that results from applying each of the specified mapping functions
     * @param {Array<*>} pArr The array to map as per the specified functions
     * @param {...function} pMappers One or more functions that return a new element to be included in the resulting array
     * @returns {Array<*>} A new array as the result of sequentially applying the specified functions
     * @alias module:ArrayUtils.chainMappers
     */
    const chainMappers = function( pArr, ...pMappers )
    {
        let arr = [].concat( asArray( pArr ) || [] );

        let mappers = [].concat( ...(pMappers || [Mappers.IDENTITY]) );

        for( const mapper of mappers )
        {
            arr = arr.map( mapper );
        }

        return arr;
    };

    /**
     * @typedef {Object} PopulatedArrayOptions
     *
     * @property {number} [minimumLength=1] The minimum number of elements an array must have to be considered 'populated',
     * @property {boolean} [acceptArrayLike=false] Set this to true to consider objects that are not instances of Array, but are ArrayLike
     * @property {boolean} [acceptObjects=false] Set this to true to consider objects that are neither instances of Array, nor ArrayLike
     *
     * @see {@link isPopulatedArray}
     */

    /**
     * These are the defaults fot the {@link #isPopulatedArray} function.
     * @see {@link PopulatedArrayOptions}
     * @type {PopulatedArrayOptions}
     * @alias module:ArrayUtils#DEFAULT_POPULATED_ARRAY_OPTIONS
     */
    const DEFAULT_POPULATED_ARRAY_OPTIONS =
        {
            minimumLength: 1,
            acceptArrayLike: false,
            acceptObjects: false
        };

    /**
     * Returns true if the specified object is an array and has at least one element
     * @param {Array<*>} pArr An array or ArrayLike object
     * @param {PopulatedArrayOptions} pOptions An object to define the criteria for determining whether the specified value is a 'populated array'
     * @returns {boolean} true if the specified object is an array and has at least one element
     * @alias module:ArrayUtils.isPopulatedArray
     */
    const isPopulatedArray = function( pArr, pOptions = DEFAULT_POPULATED_ARRAY_OPTIONS )
    {
        const options = populateOptions( pOptions, DEFAULT_POPULATED_ARRAY_OPTIONS );

        const minLength = Math.max( 1, asInt( asString( options?.minimumLength, true ) || 1 ) );

        const arr = !((_ud === typeof pArr) || (null === pArr)) ? (pArr || []) : [];

        if ( !!options?.acceptArrayLike )
        {
            const isIndexedObject = (isArray( pArr )) || Object.hasOwn( arr, "length" );

            return isIndexedObject && (minLength <= (arr?.length || 0));
        }

        if ( !!options?.acceptObjects && isObject( pArr ) )
        {
            return (Object.keys( pArr )?.length || 0) >= minLength;
        }

        return (isArray( pArr )) && pArr.length >= minLength;
    };

    /**
     * Returns the first array specified that has a length > 0
     * or a zero-length array if none of the candidates are arrays with a length > 0
     *
     * @param {...Array<*>} pCandidates One or more values, each expected to be an Array
     *
     * @returns {Array<*>} the first array specified that has a length > 0
     * or a zero-length array if none of the candidates are arrays with a length > 0
     *
     * @alias module:ArrayUtils.firstPopulatedArray
     */
    const firstPopulatedArray = function( ...pCandidates )
    {
        // filter the arguments so the resulting array is either empty or holds at least one array matching the filter,
        // where the filter matches only elements that are arrays with one or more elements
        let candidates = (pCandidates || []).filter( Filters.makeMatchesAllFilter( Filters.IS_ARRAY, Filters.IS_POPULATED_OBJECT ) );

        // if any of the candidates matched the filter, return the first of these, otherwise, return an empty array
        return isPopulatedArray( candidates ) ? candidates[0] : [];
    };

    /**
     * Returns the last array specified that has a length > 0
     * or a zero-length array if none of the candidates are arrays with a length > 0
     *
     * @param {Array<*>} pCandidates One or more values, each expected to be an Array
     *
     * @returns {Array<*>} the last array specified that has a length > 0
     * or a zero-length array if none of the candidates are arrays with a length > 0
     *
     * @alias module:ArrayUtils.lastPopulatedArray
     */
    const lastPopulatedArray = function( ...pCandidates )
    {
        // filter the arguments so the resulting array is either empty or holds at least one array matching the filter,
        // where the filter matches only elements that are arrays with one or more elements
        let candidates = (pCandidates || []).filter( Filters.makeMatchesAllFilter( Filters.IS_ARRAY, Filters.IS_POPULATED_OBJECT ) );

        // if any of the candidates matched the filter, return the first of these, otherwise, return an empty array
        return isPopulatedArray( candidates ) ? candidates[candidates.length - 1] : [];
    };

    /**
     * Returns an array of Filter functions from the specified arguments.
     * Arguments can be functions,
     * regular expressions,
     * strings describing types,
     * or arrays of one or more of these types of values
     * @param {...(function|RegExp|string|Array<function|RegExp|string|Array<function|RegExp|string>>)} pArgs One or more
     * values that are either functions,
     * regular expressions,
     * strings describing types,
     * or arrays of one or more of these types of values
     * @returns {Array<function>} An array of Filter functions
     * @private
     */
    function _createFilters( ...pArgs )
    {
        let args = varargs( ...pArgs );

        let filters = [];

        for( let arg of args )
        {
            if ( Filters.IS_FILTER( arg ) || (isFunction( arg ) && arg?.length > 0) )
            {
                filters.push( arg );
            }
            else if ( Filters.IS_REGEXP( arg ) )
            {
                const rx = arg instanceof RegExp ? new RegExp( arg, asString( arg.flags ) ) : new RegExp( arg, rightOfLast( asString( arg ), "/" ).replaceAll( /[^gidsmyu]/g, _mt_str ) );

                let f = function( e )
                {
                    return rx.test( asString( e ) );
                };

                filters.push( f );
            }
            else if ( [VALID_TYPES].includes( lcase( asString( arg ) ) ) )
            {
                const type = lcase( asString( arg ) );

                let f = function( e )
                {
                    return type === typeof e;
                };

                filters.push( f );
            }
            else if ( isArray( arg ) )
            {
                filters.push( _createFilters( ...arg ) );
            }
        }

        return filters.filter( Filters.IS_FILTER );
    }

    /**
     * Returns a Filter function from the specified arguments<br>
     * that will return true if an element satisfies all the filters created from the arguments<br>
     * <br>
     * Arguments can be functions,
     * regular expressions,
     * strings describing types,
     * or arrays of one or more of these types of values
     *
     * @param {...(function|RegExp|string|Array<function|RegExp|string|Array<function|RegExp|string>>)} pArgs One or more
     * values that are either functions,
     * regular expressions,
     * strings describing types,
     * or arrays of one or more of these types of values
     *
     * @returns {function} a Filter function that will include elements only if they satisfy all the filters created from the arguments
     *
     * @alias module:ArrayUtils.createExclusiveFilter
     */
    const createExclusiveFilter = function( ...pArgs )
    {
        const filters = _createFilters( ...pArgs );

        return Filters.makeMatchesAllFilter( ...filters );
    };

    /**
     * Returns a Filter function from the specified arguments<br>
     * that will return true if an element satisfies any the filters created from the arguments<br>
     * <br>
     * Arguments can be functions,
     * regular expressions,
     * strings describing types,
     * or arrays of one or more of these types of values
     *
     * @param {...(function|RegExp|string|Array<function|RegExp|string|Array<function|RegExp|string>>)} pArgs One or more
     * values that are either functions,
     * regular expressions,
     * strings describing types,
     * or arrays of one or more of these types of values
     *
     * @returns {function} a Filter function that will include elements if they satisfy any of the filters created from the arguments
     *
     * @alias module:ArrayUtils.createInclusiveFilter
     */
    const createInclusiveFilter = function( ...pArgs )
    {
        const filters = _createFilters( ...pArgs );

        return Filters.makeMatchesAnyFilter( ...filters );
    };

    /**
     * Returns the first element in the specified array (or list of values)
     * that satisfies the provided filter<br>
     *
     * @param {function} pMatcher A filter function an element must satisfy to be returned
     * @param {...*} pArr An array or list of values as candidates
     *
     * @returns {*|null} The first element in the specified array (or list of values)
     * that satisfies the provided filter<br>
     *
     * @type {function(function,...*)}
     *
     * @alias module:ArrayUtils.firstMatchedValue
     */
    const firstMatchedValue = function( pMatcher, ...pArr )
    {
        let matcher = createExclusiveFilter( pMatcher );

        let arr = varargs( ...pArr );

        let result = null;

        for( let i = 0, n = arr.length; i < n; i++ )
        {
            if ( matcher( arr[i] ) )
            {
                result = arr[i];
                break;
            }
        }

        return result;
    };

    const lastMatchedValue = function( pMatcher, ...pArr )
    {
        let matcher = createExclusiveFilter( pMatcher );
        let arr = varargs( ...pArr );

        let result = null;

        for( let i = arr.length - 1; i >= 0; i-- )
        {
            if ( matcher( arr[i] ) )
            {
                result = arr[i];
                break;
            }
        }

        return result;
    };

    /**
     * Returns the first element in the specified array (or list of values)
     * that is numeric
     *
     * @param {...*} pArr An array or list of values as candidates for being numeric
     *
     * @returns {*|null} The first element in the specified array (or list of values)
     * that is numeric
     *
     * @type {function(function,...*)}
     *
     * @alias module:ArrayUtils.firstNumericValue
     */
    const firstNumericValue = function( ...pArr )
    {
        return firstMatchedValue( Filters.IS_NUMERIC, ...pArr );
    };

    /**
     * Returns a copy of an array with duplicate elements removed
     * @param {...*} pArr An array or one or more values to treat as an array
     * @returns {Array<*>} A copy of the array with duplicates removed
     *
     * @alias module:ArrayUtils.unique
     */
    const unique = function( ...pArr )
    {
        return [...(new Set( varargs( ...pArr ) ))];
    };

    /**
     * Returns a new array ordered according to either the comparator specified<br>
     * --<br>
     * -- OR --<br>
     * If the second argument is a string,
     * the array elements are assumed to be objects
     * that will ordered by the value of the property of the specified name
     *
     * @param {Array<*>} pArr An array to order according to the supplied {@link Comparator}
     * @param {Comparator} pComparator A function to determine the ordering of the elements of the array
     * @returns {Array<*>} A new array containing the same elements as the specified Array in the order determined by the supplied Comparator
     *
     * @alias module:ArrayUtils.sortArray
     */
    const sortArray = function( pArr, pComparator )
    {
        let arr = [].concat( ...(pArr || []) );

        let opts = { comparator: pComparator || COMPARE_TO };

        if ( isFunction( pComparator ) )
        {
            opts.comparator = pComparator;
        }

        if ( isString( opts?.comparator ) && S_TRUE === opts?.comparator )
        {
            opts.comparator = true;
        }

        if ( isBoolean( opts?.comparator ) )
        {
            opts.comparator = opts.comparator ? COMPARE_TO : "toString";
        }

        const comparator = ((isFunction( opts?.comparator )) ? opts?.comparator : function( pElemA, pElemB, pProperty )
        {
            let property = asString( asString( pProperty ) || asString( opts?.comparator ) || COMPARE_TO );

            if ( property )
            {
                let a = pElemA?.[pProperty] || pElemB?.[pProperty] || pElemA?.compareTo;
                let b = pElemB?.[pProperty] || pElemA?.[pProperty] || pElemB?.compareTo;

                if ( isFunction( a ) )
                {
                    a = a.apply( pElemA || pElemB || $scope(), [pElemB, opts] );
                }
                else
                {
                    a = pElemA;
                }

                if ( isFunction( b ) )
                {
                    b = b.apply( pElemB || pElemA || $scope(), [pElemA, opts] );
                }
                else
                {
                    b = pElemB;
                }

                return a < b ? -1 : (a > b ? 1 : 0);
            }

            return pElemA < pElemB ? -1 : pElemA > pElemB ? 1 : 0;
        });

        let arr2 = [].concat( ...arr );

        try
        {
            arr2 = arr2.sort( comparator );

            if ( arr2 && arr2?.length === arr?.length )
            {
                arr = [].concat( ...arr2 );
            }
        }
        catch( ex )
        {
            modulePrototype.reportError( ex, "sorting an array", S_WARN, modName + "::sortArray" );
        }

        return arr || pArr;
    };

    /**
     * Returns a new array with any elements that are null, undefined, or NaN removed
     *
     * @param {*} pArr - Should be an array, but can be anything, as the value will be coerced to an array before pruning
     * @param {boolean} [pRejectNaN=true] - Determines whether numeric elements that are NaN or not finite are also removed
     * @param {...string} [pRejectedTypes=undefined] One or more types to exclude from the returned array
     *
     * @returns {Array<*>} An array with no null or undefined elements, potentially an empty array
     *
     * @alias module:ArrayUtils.pruneArray
     */
    const pruneArray = function( pArr, pRejectNaN = true, ...pRejectedTypes )
    {
        // force the input argument to be an array
        let arr = asArray( pArr, { "sanitize": true } );

        // this is the array we will return, so we do not modify the input argument
        let pruned = [].concat( arr ).filter( Filters.IS_NOT_NULL );

        const rejectedTypes = varargs( ...pRejectedTypes );

        if ( rejectedTypes && rejectedTypes.length )
        {
            pruned = pruned.filter( e => !rejectedTypes.includes( typeof e ) );
        }

        if ( pRejectNaN && !(rejectedTypes.includes( _num ) && rejectedTypes.includes( _big )) )
        {
            pruned = pruned.filter( e => !(isNumber( e )) || !(isNaN( e ) || !isFinite( e )) );
        }

        // always return an array to avoid null-pointer exceptions
        return pruned || [];
    };

    /**
     * Returns true if the specified array has at least the specified number of elements (default=1)
     * @param {Array<*>} pArr An array
     * @param {number} [pMinimum=1] The minimum number of elements the array must have to be considered to have elements.
     * @returns {boolean} true if the specified array has at least the specified number of elements
     *
     * @alias module:ArrayUtils.hasElements
     */
    const hasElements = function( pArr, pMinimum )
    {
        let minimum = asInt( pMinimum || 1, 1 ) || 1;
        return (isArray( pArr ) && (pArr?.length || 0) >= minimum);
    };

    /**
     * Returns true if the specified value is an array and is empty
     * @param {*} pArr The value to evaluate
     * @returns {boolean} true if the specified value is an array with 0 elements
     *
     * @alias module:ArrayUtils.isEmptyArray
     */
    const isEmptyArray = function( pArr )
    {
        return (isArray( pArr ) && (pArr?.length || 0) <= 0);
    };

    /**
     * Returns the length of the specified array<br>
     * (or string if the second argument is true)<br>
     * <br>
     * If the specified array is null or undefined, returns 0<br>
     *
     * @param {Array<*>|string} pArr An array (or string if the second argument is true) whose length is to be returned
     * @param {boolean} [pAllowStringArg=false] If true, the first argument can be a string whose length will be returned
     *
     * @returns {number} The length of the array (or string, when the second argument is true)
     *
     * @alias module:ArrayUtils.arrLength
     */
    const arrLength = function( pArr, pAllowStringArg = false )
    {
        if ( isArray( pArr ) || (pAllowStringArg && isString( pArr )) )
        {
            return asInt( (pArr?.length || 0), 0 );
        }

        return 0;
    };

    /**
     * Returns true if the length of the specified array
     * (or string, if the third argument is true)
     * is greater than the specified minimum<br>
     *
     * @param {Array<*>|string} pArr
     * @param {number} pMinLength
     * @param {boolean} pAllowStringArg
     * @returns {boolean}
     *
     * @alias module:ArrayUtils.arrLenGt
     */
    const arrLenGt = function( pArr, pMinLength, pAllowStringArg = false )
    {
        const minLength = asInt( pMinLength, 0 ) || 0;

        const len = arrLength( pArr, pAllowStringArg ) || 0;

        return len > minLength;
    };

    /**
     * Returns true if the length of the specified array
     * (or string, if the third argument is true)
     * is greater than or equal to the specified minimum
     *
     * @param pArr
     * @param pMinLength
     * @param pAllowStringArg
     *
     * @returns {boolean}
     *
     * @alias module:ArrayUtils.arrLenGtEq
     */
    const arrLenGtEq = function( pArr, pMinLength, pAllowStringArg = false )
    {
        const minLength = Math.max( 0, Math.max( 0, asInt( pMinLength, 0 ) || 0 ) - 1 );

        return arrLenGt( pArr, minLength, pAllowStringArg );
    };

    /**
     * Returns true if the length of the specified array
     * (or string, if the third argument is true)
     * is less than the specified value
     *
     * @param pArr
     * @param pMaxLength
     * @param pAllowStringArg
     *
     * @returns {boolean}
     *
     * @alias module:ArrayUtils.arrLenLt
     */
    const arrLenLt = function( pArr, pMaxLength, pAllowStringArg = false )
    {
        const maxLength = asInt( pMaxLength, 0 ) || 0;

        const len = arrLength( pArr, pAllowStringArg ) || 0;

        return len < maxLength;
    };

    /**
     * Returns true if the length of the specified array
     * (or string, if the third argument is true)
     * is less than or equal to the specified value
     *
     * @param pArr
     * @param pMaxLength
     * @param pAllowStringArg
     *
     * @returns {boolean}
     *
     * @alias module:ArrayUtils.arrLenLtEq
     */
    const arrLenLtEq = function( pArr, pMaxLength, pAllowStringArg = false )
    {
        const maxLength = Math.max( 0, Math.max( 0, asInt( pMaxLength, 0 ) || 0 ) + 1 );

        return arrLenLt( pArr, maxLength, pAllowStringArg );
    };

    /**
     * Returns a deep clone of the specified array<br>
     * <br>
     * Note that this uses {@link #structuredClone}, so functions are not cloned, but are included as-is
     * @param {...*} pArr an array (or list of values to treat as an array) to deep-clone
     *
     * @returns {Array<*>} A new array populated with copies of the elements of the original array
     *
     * @alias module:ArrayUtils.copyArray
     */
    const copyArray = function( ...pArr )
    {
        let arr = asArray( varargs( pArr || [] ) );

        let functions = [...arr].map( ( e, i ) => (isFunction( e ) ? { [i]: e } : null) ).filter( e => !isNull( e ) );

        let clone = [...arr].filter( e => !isFunction( e ) );

        try
        {
            clone = structuredClone( clone );
        }
        catch( ex )
        {
            // functions cannot be cloned
            clone = [...arr].filter( e => !isFunction( e ) );

            try
            {
                clone = structuredClone( clone ) || clone;
            }
            catch( ex2 )
            {
                // functions cannot be cloned
                clone = clone.filter( e => !isFunction( e ) );
            }
        }

        // restore the functions
        for( let i = 0, n = functions.length; i < n; i++ )
        {
            let obj = functions[i];
            let idx = Object.keys( obj )[0];
            let func = obj[idx];

            clone.splice( asInt( idx ), 0, func );
        }

        return [...clone];
    };

    /**
     * @typedef {Object} EqualityOptions
     *
     * @property {boolean} [trim=true] Whether to ignore whitespace in string elements
     * @property {boolean} [ignoreCase=false] Whether to compare strings without regard to case
     * @property {Comparator|null} [comparator=null] A Comparator to use to sort both arrays prior to comparison
     * @property {boolean} [ignoreNulls=false] Whether to remove elements that are null or undefined prior to comparison
     * @property {boolean} [ignoreNaNs=false] Whether to remove values that are NaN or not Finite prior to comparison
     * @property {boolean} [ignoreDuplicates=false] Whether to compare only unique values
     * @property {boolean} [ignoreOrder=false] Whether to compare without regard to order (warning: this is quite a bit slower than comparing sorted arrays)
     * @property {boolean} [convertNumericStrings=false] Whether to convert strings representing numbers to decimal values prior to comparison
     *
     * @see {@link arraysEqual}
     */

    /**
     * This object defines the default options for determining if two arrays are equal
     *
     * @type {EqualityOptions}
     *
     * @alias module:ArrayUtils#DEFAULT_EQUALITY_OPTIONS
     */
    const DEFAULT_EQUALITY_OPTIONS =
        {
            trim: true,
            ignoreCase: false,
            comparator: null,
            ignoreNulls: false,
            ignoreNaNs: false,
            ignoreDuplicates: false,
            ignoreOrder: false,
            convertNumericStrings: false
        };

    /**
     *
     * @param pArr
     * @param pOptions
     * @private
     */
    const preprocessArray = function( pArr, pOptions = DEFAULT_EQUALITY_OPTIONS )
    {
        const options = populateOptions( pOptions, DEFAULT_EQUALITY_OPTIONS );

        let arr = [...(asArray( pArr ))];

        if ( options.trim )
        {
            arr = arr.map( e => (isString( e ) ? e.trim() : e) );
        }

        if ( options.ignoreCase )
        {
            arr = arr.map( e => (isString( e ) ? ucase( e ) : e) );
        }

        if ( options.ignoreNulls )
        {
            arr = arr.filter( e => !isNull( e ) );
        }

        if ( options.ignoreNaNs )
        {
            arr = arr.filter( e => !isNumber( e ) || !(isNaN( e ) || !isFinite( e )) );
        }

        if ( options.ignoreDuplicates )
        {
            arr = unique( arr );
        }

        if ( options.convertNumericStrings )
        {
            arr = arr.map( e => isNumeric( e ) ? toDecimal( e ) : e );
        }

        const comparator = Filters.IS_COMPARATOR( options.comparator ) ? options.comparator : null;

        if ( Filters.IS_COMPARATOR( comparator ) )
        {
            arr = arr.sort( comparator );
        }

        return [...arr];
    };

    /**
     * Returns true if the two arrays are 'equal' as per the {@link EqualityOptions} specified<br>
     * <br>
     * By default, arrays are considered equal only if they contain the same elements in the same order<br>
     * <br>
     *
     * @param {Array<*>} pArrA The first array
     * @param {Array<*>} pArrB The other array
     *
     * @param {EqualityOptions} pOptions An object defining how to compare the 2 arrays for 'equality'
     *
     * @returns {boolean} true if the 2 arrays contain the same elements in the same order (before or after a potential sort)
     *
     * @alias module:ArrayUtils.arraysEqual
     */
    const arraysEqual = function( pArrA, pArrB, pOptions = DEFAULT_EQUALITY_OPTIONS )
    {
        const options = populateOptions( pOptions, DEFAULT_EQUALITY_OPTIONS );

        let arrA = preprocessArray( [...(asArray( pArrA || [] ))], options );
        let arrB = preprocessArray( [...(asArray( pArrB || [] ))], options );

        if ( arrA.length !== arrB.length )
        {
            return false;
        }

        if ( options.ignoreOrder )
        {
            let arr = arrB.filter( e => arrA.includes( e ) );

            if ( arr.length !== arrB.length )
            {
                return false;
            }

            arr = arrA.filter( e => arrB.includes( e ) );

            return arr.length === arrA.length;
        }
        else
        {
            const strA = arrA.map( e => asString( e ).replace( /\//g, "_slash_" ) ).join( "/" );
            const strB = arrB.map( e => asString( e ).replace( /\//g, "_slash_" ) ).join( "/" );

            return strA === strB && ((arrA?.length || 0) === (arrB?.length || 0));
        }
    };

    /**
     * Returns true if the array includes any of the values specified
     *
     * @param {Array<*>} pArr An array to search
     * @param {...*} pSearchFor One or more values for which to search
     *
     * @returns {boolean} true if the array includes any of the specified values
     *
     * @alias module:ArrayUtils.includesAny
     */
    const includesAny = function( pArr, ...pSearchFor )
    {
        const a = asArray( pArr );
        const b = asArray( pSearchFor );

        let result = false;

        for( let elem of b )
        {
            if ( a.includes( elem ) )
            {
                result = true;
                break;
            }
        }

        return result;
    };

    /**
     * Returns the first (or last) non-array/non-object value found in the specified array
     * @param {Array<*>|Object|string} pArr An array, object, or string from which to extract a scalar value
     * @param {boolean} pFromEnd Specify true to search from the end of the value
     * @param {number} pDepth USED INTERNALLY TO PREVENT INFINITE RECURSION OR STACK OVERFLOW; DO NOT PASS THIS VALUE FROM CONSUMER CODE
     * @returns {*} A scalar value (that is, a number, string, or boolean value) if one can be found within 6 levels of recursion
     *
     * @alias module:ArrayUtils.extractScalar
     */
    const extractScalar = function( pArr, pFromEnd = false, pDepth = 0 )
    {
        let arr = isArray( pArr ) ? asArray( pArr ) : (isObject( pArr ) && !isNull( pArr ) ? Object.values( pArr ) : (isEmptyString( pArr ) || isNonNullValue( pArr ) ? [pArr] : []));

        while ( isArray( arr ) && arr.length > 1 )
        {
            arr = pFromEnd ? arr.slice( -1 ) : arr.slice( 0, 1 );
        }

        let val = arr[0];

        const depth = asInt( pDepth, 0 );

        if ( isObject( val ) && depth < 6 )
        {
            return extractScalar( val, pFromEnd, depth + 1 );
        }

        return val;
    };

    /**
     * @enum
     * This is the set of recognized values for the range function increment option
     * @type {{INCREMENT: number, SEQUENCE_PLUS_LAST_SKIP: number, DERIVE: number, SEQUENCE_LENGTH: number}}
     *
     * @alias module:ArrayUtils#RANGE_INCREMENT_OPTION
     */
    const RANGE_INCREMENT_OPTION =
        {
            /**
             * The next number or character will be the number or character found by adding the length of the 'from' value to the 'from' (or current) value
             */
            SEQUENCE_LENGTH: -1,
            /**
             * The next number or character will be calculated according to the pattern derived from the 'from' (or current) value
             */
            DERIVE: 0,
            /**
             * The next number or character will be calculated by applying the derived or specified increment to the current value
             */
            INCREMENT: 1,
            /**
             * The next number or character will calculated by adding the length of the 'from' value and the value derived from subtracting the penultimate value from the last value in the 'from' sequence
             */
            SEQUENCE_PLUS_LAST_SKIP: 2,
        };

    /**
     * This is a helper function to calculate the power of 10 required to produce the specified value.
     * Yes, this is basically, log10, but... explicitly coded
     * @param {number} pNum The number to calculate the power of 10 required to produce it.
     * @returns {number} the power of 10 required to produce the specified value
     * @private
     */
    const _findExponent = function( pNum )
    {
        const num = isNumeric( pNum ) ? toDecimal( pNum ) : 0;

        const parts = asString( num, true ).split( _dot );

        const integer = parts[0].replace( /^0/, _mt_str ) || "0";

        const dec = asString( parts.length > 1 ? parts[1].replace( /0+$/, _mt_str ) : _mt_str, true );

        return isEmptyString( dec ) ? integer.length - 1 : -(dec.length);
    };

    /**
     * Returns the smallest power of 10 derived from the numbers specified
     * @param {...number} pNums One or numbers from which to find the smallest power of 10
     * @returns {number} The smallest power of 10 derived from the numbers specified
     * @private
     */
    const _findSmallestExponent = function( ...pNums )
    {
        return Math.min( ...(varargs( ...pNums )).map( _findExponent ) );
    };

    /**
     * @typedef {Object} RangeOptions
     *
     * @property {boolean} [inclusive=false] Whether the range includes both the starting value AND the ending value
     * @property {RANGE_INCREMENT_OPTION} [increment_rule=RANGE_INCREMENT_OPTION.INCREMENT] The rule to determine how to generate the next value in the range
     */

    /**
     * This object defines the default options for the range function
     * @type {RangeOptions}
     *
     * @alias module:ArrayUtils#DEFAULT_RANGE_OPTIONS
     */
    const DEFAULT_RANGE_OPTIONS =
        {
            inclusive: false,
            increment_rule: RANGE_INCREMENT_OPTION.INCREMENT,
        };

    /**
     * @typedef {Object} RangeIncrement
     * @property {number} increment The amount to increment the current value to produce the next value
     * @property {number} power The power of 10 being used
     */

    /**
     * Calculates the increment used to map the current value to the next value to return
     * @param {number|string} pValue The number or string from which to calculate the increment used by the range function
     * @param {Object} pOptions An object defining the options for the range function, such as inclusive versus exclusive and how to calculate the increment
     * @returns {RangeIncrement}
     * @private
     */
    const _calculateIncrement = function( pValue, pOptions = DEFAULT_RANGE_OPTIONS )
    {
        const options = populateOptions( pOptions, DEFAULT_RANGE_OPTIONS );

        const rule = options.increment_rule || RANGE_INCREMENT_OPTION.DERIVE;

        const sequenceLength = isArray( pValue ) || (isString( pValue ) && !isNumeric( pValue )) ? unique( pValue.split( _mt_str ) ).length : 1;

        const power = isNumeric( extractScalar( pValue ) ) ? _findSmallestExponent( pValue ) : 0;

        function _calculateLastSkip()
        {
            let last = extractScalar( asArray( pValue ).slice( -1 ), true );
            if ( isString( last ) )
            {
                last = last.charCodeAt( Math.max( 0, last.length - 1 ) );
            }

            let prior = isString( pValue ) ? pValue.charCodeAt( Math.max( pValue.length - 2, 0 ) ) : extractScalar( asArray( pValue ).slice( -2, 1 ) );
            if ( isString( prior ) )
            {
                prior = prior.charCodeAt( 0 );
            }

            return last - prior;
        }

        switch ( rule )
        {
            case RANGE_INCREMENT_OPTION.SEQUENCE_LENGTH:
                return { increment: sequenceLength, power };

            case RANGE_INCREMENT_OPTION.SEQUENCE_PLUS_LAST_SKIP:
                return { increment: sequenceLength + (sequenceLength > 1 ? _calculateLastSkip() : 0) + 1, power };

            case RANGE_INCREMENT_OPTION.INCREMENT:
                return { increment: Math.min( 1, Math.pow( 10, power ) ), power };

            case RANGE_INCREMENT_OPTION.DERIVE:
            default:
                return { increment: Math.pow( 10, power ), power };
        }
    };

    /**
     * This object defines the default options for the range function when it is used to produce a numeric sequence
     * @type {RangeOptions}
     * @alias module:ArrayUtils#DEFAULT_NUMERIC_RANGE_OPTIONS
     */
    const DEFAULT_NUMERIC_RANGE_OPTIONS =
        {
            ...DEFAULT_RANGE_OPTIONS
        };

    /**
     * This object defines the default options for the range function when it is used to produce a character sequence
     * @type {RangeOptions}
     *
     * @alias module:ArrayUtils#DEFAULT_CHARACTER_RANGE_OPTIONS
     */
    const DEFAULT_CHARACTER_RANGE_OPTIONS =
        {
            inclusive: true,
            increment_rule: RANGE_INCREMENT_OPTION.SEQUENCE_LENGTH,
        };

    /**
     * Returns an iterable that produces values from pFrom to pTo (exclusive by default)<br>
     * <br>
     * The iterable is "lazy",
     * so you can generate extremely large collections of values
     * without consuming the memory the entire collection would require.
     * <br>
     *
     * @param {number|string} pFrom The first value the iterable's iterator should return
     * @param {number|string} pTo The value at which to stop returning values
     * @param pOptions {RangeOptions} An object to specify whether the range is inclusive or exclusive of the 'to' value
     *                          and to define how to increment value to produce the next value in the sequence
     * @returns {Iterable<number|string>} An iterable that produces values from pFrom to pTo (exclusive by default)<br>
     * @throws IllegalArgumentError if the from and to arguments are not the same type or compatible types (such as number and string, for example)
     *                              or if the values cannot be coerced to the same type
     *
     * @alias module:ArrayUtils.range
     */
    const range = function( pFrom, pTo, pOptions = DEFAULT_RANGE_OPTIONS )
    {
        let from = pFrom;
        let to = pTo;

        const types = [typeof from, typeof to];

        if ( !(areCompatibleTypes( pFrom, pTo ) || includesAny( types, _num, _big, _str )) )
        {
            throw new IllegalArgumentError( "Both arguments must be the same (or compatible types)" );
        }

        if ( isArray( from ) )
        {
            let arr = asArray( from );
            if ( !arr.every( isNumeric ) )
            {
                throw new IllegalArgumentError( "The first argument must be either a number, string, or an array of numbers" );
            }
            from = arr.map( toDecimal );
            types.push( _num );
        }

        let bounds = [from, to];

        /**
         * Returns 1 for an ascending sequence, -1 for a descending sequence
         * @param {Array<string|number>} pBounds  an array composed of the from and to values
         * @returns {number} 1 for an ascending sequence, -1 for a descending sequence
         * @private
         */
        function _calculateSign( pBounds )
        {
            let from = extractScalar( pBounds[0], true );

            let to = extractScalar( pBounds[1] );

            return from > to ? -1 : 1;
        }

        const numeric = includesAny( types, _num, _big ) && bounds.flat().every( e => isNumeric( e ) );

        const boundsMapper = numeric ? toDecimal : asString;
        bounds = bounds.map( boundsMapper );

        const options = populateOptions( pOptions, (numeric ? DEFAULT_NUMERIC_RANGE_OPTIONS : DEFAULT_CHARACTER_RANGE_OPTIONS) );

        const inclusive = !!options.inclusive;

        const sign = _calculateSign( bounds );

        const { increment: f, power: powerFrom } = _calculateIncrement( from, options );
        const { increment: t, power: powerTo } = _calculateIncrement( to, options );

        const increment = (numeric ? (Math.min( f, t )) : f) * sign;

        from = bounds[0];
        to = bounds[1];

        const limit = extractScalar( to );

        if ( numeric )
        {
            const roundTo = Math.max( -powerFrom, -powerTo );

            const condition = function( pValue )
            {
                let val = extractScalar( pValue, true );

                return sign > 0 ? (inclusive ? (val <= limit) : (val < limit)) : (inclusive ? (val >= limit) : (val > limit));
            };

            /**
             * A naive implementation of rounding to a specific number of decimal places
             * @param {number} pNum A number to be rounded to some precision
             * @returns {number} The rounded value
             */
            const simpleRound = function( pNum )
            {
                if ( roundTo <= 0 )
                {
                    return Math.round( pNum );
                }
                const p = Math.pow( 10, roundTo );
                const r = Math.round( pNum * p );
                return (r / p);
            };

            /**
             * Returns an iterable that will successively produce numbers
             * from the start of the defined range until it has reached the stop value of the range<br>
             * <br>
             * This iterable produces values on-demand (a.k.a. "lazily") to reduce memory consumption
             */
            return {
                * [Symbol.iterator]()
                {
                    let add = v => simpleRound( asFloat( v ) + increment );

                    let value = from;

                    while ( condition( value ) )
                    {
                        yield value;

                        value = isArray( value ) ? asArray( value ).map( add ) : add( value );
                    }
                }
            };
        }
        else
        {
            const endSequenceLength = to.length;

            const lastChar = endSequenceLength > 0 ? to.slice( -1 ) : to;

            const lastCharCode = lastChar.charCodeAt( 0 );

            const predicate = e => sign > 0 ? e.charCodeAt( 0 ) <= lastCharCode : e.charCodeAt( 0 ) >= lastCharCode;

            const condition = function( pValue )
            {
                const val = isArray( pValue ) ? extractScalar( pValue ) : asString( pValue ).slice( 0, 1 );
                return !isEmptyString( val ) && (sign > 0 ? (inclusive ? (val <= lastChar) : (val < lastChar)) : (inclusive ? (val >= lastChar) : (val > lastChar)));
            };

            const calculateCharacter = e => String.fromCharCode( asInt( e.charCodeAt( 0 ) ) + asInt( increment ) );

            function _str( e )
            {
                return e.split( _mt_str ).map( calculateCharacter ).join( _mt_str );
            }

            /**
             * Returns an iterable that will successively produce strings
             * from the start of the defined range until it has reached the stop value of the range<br>
             * <br>
             * This iterable produces values on-demand (a.k.a. "lazily") to reduce memory consumption
             */
            return {
                * [Symbol.iterator]()
                {
                    const len = from.length;

                    let value = from;

                    while ( condition( value ) )
                    {
                        yield value;

                        const arr = asArray( value );

                        if ( (isArray( value ) && arr.some( e => e.includes( lastChar ) )) || asString( value ).includes( lastChar ) )
                        {
                            break;
                        }

                        if ( value.length < len )
                        {
                            isArray( value ) ? arr.push( _str( arr.slice( -1 ) ) ) : value += _str( value.charAt( len - 1 ) );
                        }

                        value = isArray( value ) ? arr.map( e => _str( e ) ) : _str( value );

                        if ( isString( value ) )
                        {
                            value = value.split( _mt_str ).filter( predicate ).join( _mt_str );

                            if ( value.includes( lastChar ) )
                            {
                                value = leftOfLast( value, lastChar ) + (inclusive ? lastChar : _mt_str);
                            }
                        }
                        else if ( isArray( value ) )
                        {
                            if ( arr.some( e => e.includes( lastChar ) ) )
                            {
                                value = arr.map( e => e.includes( lastChar ) ? leftOfLast( e, lastChar ) + (inclusive ? lastChar : _mt_str) : e );
                            }
                            else
                            {
                                value = arr.map( e => e.split( _mt_str ).filter( predicate ).join( _mt_str ) );
                            }
                        }
                    }
                }
            };
        }
    };

    /**
     * Returns true if either of the 2 arrays contains the other
     *
     * @param {Array<*>} pArrA The first array
     * @param {Array<*>} pArrB The other array
     *
     * @param {boolean} [pTrim=true] Whether to trim strings prior to comparison<br><br>
     *                               If true, elements of each array that are of type 'string'
     *                               are compared without regard to leading or trailing whitespace<br>
     *                               <br>
     *                               Otherwise, elements of type 'string' are compared for exact match<br>
     *                               THE DEFAULT IS TRUE. YOU MUST EXPLICITLY PASS false TO DISABLE THE BEHAVIOR
     *
     * @returns {boolean} true if either of the 2 arrays contains the other
     *
     * @alias module:ArrayUtils.areSubsets
     */
    const areSubsets = function( pArrA, pArrB, pTrim = true )
    {
        let strip = (false !== pTrim);

        let arrA = asArray( pArrA || [] );
        let arrB = asArray( pArrB || [] );

        const strA = arrA.map( e => asString( e, strip ).replace( /\//g, "_slash_" ) ).join( "/" );
        const strB = arrB.map( e => asString( e, strip ).replace( /\//g, "_slash_" ) ).join( "/" );

        return arraysEqual( arrA, arrB ) || strA.includes( strB ) || strB.includes( strA );
    };

    /**
     * Returns an array containing all the elements of the 2 arrays specified
     *
     * @param {Array<*>} pArrA the first array
     * @param {Array<*>} pArrB the other array
     * @param {boolean} [pUnique=false] Controls how to treat duplicated elements<br>
     *                                  If true, the returned array contains only the unique elements
     *                                  found in the 2 arrays<br>
     *                                  <br>
     *                                  Otherwise, the returned array contains all elements
     *                                  found in the 2 arrays, including any that are duplicated
     *
     * @returns {Array<*>} An array containing all the elements of the 2 arrays specified
     *
     * @alias module:ArrayUtils.superset
     */
    const superset = function( pArrA, pArrB, pUnique )
    {
        let arrA = asArray( pArrA || [] );
        let arrB = asArray( pArrB || [] );

        const pruned = pruneArray( arrA.concat( arrB ), false );

        return pUnique ? unique( pruned ) : pruned;
    };

    /**
     * Returns an array containing all the unique elements of the 2 arrays specified
     * This is the same as calling {@link #superset} with true as the third argument
     *
     * @param {Array<*>} pArrA the first array
     * @param {Array<*>} pArrB the other array
     *
     * @returns {Array<*>} An array containing all the unique elements of the 2 arrays specified<br>
     * This is the same as calling superset with true as the third argument
     *
     * @alias module:ArrayUtils.union
     */
    const union = function( pArrA, pArrB )
    {
        return superset( pArrA, pArrB, true );
    };

    /* polyfill union functionality */
    if ( isUndefined( Array.prototype.union ) || !isFunction( Array.prototype.union ) )
    {
        try
        {
            Array.prototype.union = function( pArr )
            {
                return union( this, pArr );
            };
        }
        catch( ex )
        {
            modulePrototype.reportError( ex, "extending the Array prototype", S_WARN, modName );
        }
    }

    /* polyfill union functionality */
    if ( isUndefined( Set.prototype.union ) || !isFunction( Set.prototype.union ) )
    {
        try
        {
            Set.prototype.union = function( pArr )
            {
                return new Set( union( [...this], pArr ) );
            };
        }
        catch( ex )
        {
            modulePrototype.reportError( ex, "extending the Set prototype", S_WARN, modName );
        }
    }

    /**
     * Returns an array containing only those elements common to both arrays specified
     *
     * @param {Array<*>} pArrA the first array
     * @param {Array<*>} pArrB the other array
     *
     * @param {boolean} [pUnique=false] Controls how to treat duplicates<br>
     *                                  If true, removes duplicates,
     *                                  returning an array containing only the unique values
     *                                  common to both arrays<br>
     *                                  <br>
     *                                  Otherwise, the returned array may contain duplicates
     *
     * @returns {Array<*>} An array containing only those elements common to both arrays specified
     *
     * @alias module:ArrayUtils.intersection
     */
    const intersection = function( pArrA, pArrB, pUnique = false )
    {
        let arrA = lock( asArray( pArrA || [] ) );
        let arrB = lock( asArray( pArrB || [] ) );

        let arr = arrA.concat( arrB );

        arr = arr.filter( e => arrA.includes( e ) && arrB.includes( e ) );

        return (false !== pUnique) ? unique( arr ) : arr;
    };

    /* polyfill intersection functionality */
    if ( isUndefined( Array.prototype.intersection ) || !isFunction( Array.prototype.intersection ) )
    {
        try
        {
            Array.prototype.intersection = function( pArr, pUnique = true )
            {
                return intersection( this, pArr, (false !== pUnique) );
            };
        }
        catch( ex )
        {
            modulePrototype.reportError( ex, "extending the Array prototype", S_WARN, modName );
        }
    }

    /**
     * Returns an array containing only those elements unique to either of the arrays specified
     * This is the opposite of the intersection
     *
     * @param {Array<*>} pArrA the first array
     * @param {Array<*>} pArrB the other array
     *
     * @param {boolean} [pUnique=false] Specify true to remove duplicates from the returned collection
     *
     * @returns {Array<*>} An array containing only those elements unique to either of the arrays specified
     *
     * @alias module:ArrayUtils.disjunction
     */
    const disjunction = function( pArrA, pArrB, pUnique = false )
    {
        let arrA = lock( asArray( pArrA || [] ) );
        let arrB = lock( asArray( pArrB || [] ) );

        let arr = arrA.concat( arrB );

        arr = arr.filter( e => !(arrA.includes( e ) && arrB.includes( e )) );

        if ( false !== pUnique )
        {
            arr = unique( arr );
        }

        return arr;
    };

    /* polyfill disjunction functionality */
    if ( isUndefined( Array.prototype.disjunction ) || !isFunction( Array.prototype.disjunction ) )
    {
        try
        {
            Array.prototype.disjunction = function( pArr, pUnique = false )
            {
                return disjunction( this, pArr, (false !== pUnique) );
            };
        }
        catch( ex )
        {
            modulePrototype.reportError( ex, "extending the Array prototype", S_WARN, modName );
        }
    }

    /**
     * Push an element onto an array,
     * potentially shifting existing elements off of the array
     * to prevent the length of the array from exceeding the specified limit.
     * <br>
     *
     * @param {Array<*>} pArr An array to modify
     * @param {*} pElem The element to push onto the array
     * @param {number} [pLimit=100] The maximum length to which to allow the array to grow
     *
     * @returns {Array<*>} The <b>same</b> array with the specified element added<br>
     * and a length that is less than or equal to the limit specified
     *
     * @alias module:ArrayUtils.enQueue
     *
     * @see {@link BoundedQueue}
     * @see {@link AsyncBoundedQueue}
     */
    const enQueue = function( pArr, pElem, pLimit = 100 )
    {
        let arr = pArr || [];

        const value = pElem || _mt_str;

        const limit = clamp( asInt( pLimit, ((arr?.length || 2) - 1) ), 1, 10_000 );

        const numElements = arr.push( value );

        if ( numElements >= limit )
        {
            arr.shift();
        }

        return arr;
    };

    /**
     * This class provides a queue (a FIFO data structure) with a limited size<br>
     * <br>
     * When an element is pushed into the queue (enqueued),<br>
     * the limit is enforced by evicting the oldest element<br>
     * <br>
     * Do not use this class if every element MUST be processed,<br>
     * unless you can guarantee the size will not be exceeded<br>
     * <br>
     * Common use cases might include writing messages to a remote log in batches,<br>
     * where writing each message separately would impact performance<br>
     * @class
     *
     * @alias module:ArrayUtils#classes#BoundedQueue
     */
    class BoundedQueue
    {
        #limit;
        #arr;

        /**
         * Constructs a new instance of BoundedQueue with the specified size and initial values<br>
         * <br>
         * A BoundedQueue is a First-In/First-Out data structure with a limited size.
         * <br>
         * When an element is pushed into the queue (enqueued),<br>
         * the limit is enforced by evicting the oldest element.
         * <br>
         *
         * @constructor
         * @param {number} pSize The maximum number of values to hold in the queue
         * @param {Array<*>|BoundedQueue} [pArr] An array of values to immediately place in the queue<br>
         * <br>
         * <b>NOTE: </b>If an initial array of values is provided,<br>
         * the size of the queue will be adjusted to be the maximum of the length of that array or the size specified<br>
         */
        constructor( pSize, pArr = [] )
        {
            this.#arr = [];

            const initialSize = asInt( pArr?.length || pArr?.size || pSize );

            const desiredLimit = Math.min( Math.max( 1, asInt( pSize, initialSize ), initialSize ), MAX_QUEUE_SIZE );

            if ( null != pArr && (pArr instanceof this.constructor) )
            {
                if ( desiredLimit > pArr.limit )
                {
                    pArr.extend( desiredLimit );
                }

                if ( desiredLimit < pArr.limit )
                {
                    pArr.shrink( desiredLimit );
                }

                this.#arr = asArray( pArr.#arr || pArr || [] );
            }
            else
            {
                this.#arr = [].concat( ...(asArray( pArr ) || []) ) || [];

                this.#limit = asInt( desiredLimit );
            }
        }

        get values()
        {
            return [...(asArray( this.#arr ))];
        }

        get limit()
        {
            return asInt( this.#limit, this.size );
        }

        static get [Symbol.species]()
        {
            return this;
        }

        enQueue( pElem )
        {
            let state = { exceededBounds: false, evicted: null, size: this.size, limit: this.limit };

            if ( pElem )
            {
                this.#arr.push( pElem );

                if ( this.#arr.length > this.#limit )
                {
                    let evicted = this.#arr.shift();

                    state.exceededBounds = true;
                    state.evicted = evicted;
                }
            }

            state.size = this.#arr.length;

            return lock( state );
        }

        push( pElem )
        {
            const result = this.enQueue( pElem );

            return result?.size || this.size;
        }

        get size()
        {
            return asArray( this.values ).length;
        }

        isQueued( pElem )
        {
            return this.#arr.includes( pElem );
        }

        includes( pElem )
        {
            return this.isQueued( pElem );
        }

        toArray()
        {
            return [].concat( ...(this.#arr || []) );
        }

        canTake()
        {
            return this.size > 0;
        }

        isEmpty()
        {
            return this.size <= 0;
        }

        take()
        {
            if ( this.size > 0 )
            {
                return this.#arr.shift();
            }
            throw new Error( "The queue is empty" );
        }

        peek()
        {
            if ( this.size > 0 )
            {
                return this.#arr[0];
            }
            return null;
        }

        get state()
        {
            return {
                exceededBounds: (this.size > this.limit),
                evicted: null,
                size: this.#arr.length,
                limit: this.#limit,
                next: this.peek()
            };
        }

        dequeue()
        {
            return this.take();
        }

        pop()
        {
            return this.#arr.pop();
        }

        flush()
        {
            const arr = this.toArray();

            this.#arr.length = 0;

            this.#arr = [];

            return arr;
        }

        clear()
        {
            this.#arr = [];
        }

        shrink( pNewLimit, pEvictNewest )
        {
            const limit = clamp( asInt( pNewLimit, this.#arr?.length ), 1, 65_536 );

            if ( limit > this.#limit )
            {
                this.extend( limit );
            }

            let evicted = [];

            let exceeds = this.size > limit;

            while ( this.size > limit && this.size > 0 )
            {
                evicted.push( pEvictNewest ? this.pop() : this.take() );
            }

            this.#limit = limit;

            return {
                exceededBounds: exceeds,
                evicted: ([].concat( evicted )),
                size: this.size,
                limit: this.limit,
                next: this.peek()
            };
        }

        extend( pNewLimit, ...pElems )
        {
            const limit = clamp( asInt( pNewLimit, this.size ), 1, MAX_QUEUE_SIZE );

            this.#limit = Math.max( limit, this.#limit );

            let newElems = varargs( ...pElems );

            let numNewElems = newElems.length;

            if ( numNewElems > 0 )
            {
                let evicted = [];

                let newState = Object.assign( {}, this.state );

                for( let i = 0, n = numNewElems; i < n; i++ )
                {
                    let result = this.enQueue( newElems[i] );

                    if ( result?.exceededBounds )
                    {
                        evicted.push( result?.evicted );
                    }
                }

                newState.exceededBounds = evicted.length > 0;
                newState.evicted = evicted;
                newState.size = this.size;
                newState.limit = this.limit;
                newState.next = this.peek();

                return newState;
            }

            return this.state;
        }

        * [Symbol.iterator]()
        {
            while ( this.canTake() )
            {
                yield this.take();
            }
        }

        async* [Symbol.asyncIterator]()
        {
            while ( this.canTake() )
            {
                await new Promise( resolve => setTimeout( resolve, 100 ) );
                yield this.take();
            }
        }
    }

    BoundedQueue.create = function( pLimit = 100, ...pArr )
    {
        const limit = clamp( asInt( pLimit, (pArr?.length || pArr?.size) ), 1, MAX_QUEUE_SIZE );

        const arr = isArray( pArr ) ? varargs( pArr ) : ((null != pArr && pArr instanceof BoundedQueue) ? pArr : asArray( pArr ));

        return new BoundedQueue( limit, arr );
    };

    /**
     * This is an asynchronous implementation of {@link BoundedQueue}
     * @extends BoundedQueue
     * @alias module:ArrayUtils#classes#AsyncBoundedQueue
     */
    class AsyncBoundedQueue extends BoundedQueue
    {
        constructor( pSize, pArr )
        {
            super( pSize, pArr );
        }

        static get [Symbol.species]()
        {
            return this;
        }

        async enQueue( pElem )
        {
            return super.enQueue( pElem );
        }

        async push( pElem )
        {
            return super.push( pElem );
        }

        get size()
        {
            return super.size;
        }

        async getSize()
        {
            return this.size;
        }

        get limit()
        {
            return Promise.resolve( super.limit );
        }

        async getLimit()
        {
            return this.limit;
        }

        async isQueued( pElem )
        {
            return Promise.resolve( super.isQueued( pElem ) );
        }

        async includes( pElem )
        {
            return Promise.resolve( super.includes( pElem ) );
        }

        async toArray()
        {
            return Promise.resolve( super.toArray() );
        }

        async canTake()
        {
            return Promise.resolve( super.canTake() );
        }

        async isEmpty()
        {
            return Promise.resolve( super.isEmpty() );
        }

        async take()
        {
            let elem = null;

            try
            {
                elem = super.take();
            }
            catch( ex )
            {
                modulePrototype.reportError( ex, "attempting to take from an exhausted Queue", S_WARN, modName + "::AsyncBoundedQueue::take" );
            }

            return elem || null;
        }

        async peek()
        {
            return super.peek();
        }

        get state()
        {
            return super.state;
        }

        async getState()
        {
            return this.state;
        }

        async dequeue()
        {
            return super.dequeue();
        }

        async pop()
        {
            return super.pop();
        }

        async flush()
        {
            return super.flush();
        }

        async clear()
        {
            super.clear();
        }

        async shrink( pNewLimit, pEvictNewest )
        {
            return super.shrink( pNewLimit, pEvictNewest );
        }

        async extend( pNewLimit, ...pElems )
        {
            return super.extend( pNewLimit, ...pElems );
        }

        * [Symbol.iterator]()
        {
            while ( this.canTake() )
            {
                yield this.take();
            }
        }

        async* [Symbol.asyncIterator]()
        {
            while ( true )
            {
                // noinspection ES6RedundantAwait
                const can = await this.canTake();

                if ( can )
                {
                    yield await this.take();
                }
                else
                {
                    break;
                }
            }
        }
    }

    AsyncBoundedQueue.create = function( pLimit = 100, ...pArr )
    {
        const limit = clamp( asInt( pLimit, (pArr?.length || pArr?.size) ), 1, MAX_QUEUE_SIZE );

        const arr = isArray( pArr ) ? varargs( pArr ) : ((null != pArr && pArr instanceof BoundedQueue) ? pArr : asArray( pArr ));

        return new AsyncBoundedQueue( limit, arr );
    };

    /**
     * Returns true if there is a non-null element at the specified index
     * @param {Array<*>}  pArr The array to check for the element at the specified index
     * @param {number} pIndex The index at which to check for a non-null element
     * @returns {boolean} true if there is a non-null element at the specified index
     *
     * @alias module:ArrayUtils.hasEntry
     */
    const hasEntry = function( pArr, pIndex )
    {
        const arr = asArray( pArr || [] ) || [];
        const index = [_num, _big].includes( typeof pIndex ) ? asInt( pIndex ) : Number.MAX_SAFE_INTEGER;

        return (index >= 0) && (arr.length > index) && (_ud !== typeof arr[index]);
    };

    /**
     * @alias module:ArrayUtils.hasElementAt
     */
    const hasElementAt = hasEntry;

    /**
     * Returns the element at the specified index
     * or the specified default value
     * if no element exists at the specified index
     * or the specified array is null, undefined, or not an array or ArrayLike value
     *
     * @param {Array<*>|Object} pArr The array or ArrayLike object from which to return the value
     * @param {number} pIdx The index at which to find the value to return
     * @param {*} pDefault A value to return if no value exists at the specified index or the specified array if not an array or ArrayLike object
     * @returns {*}
     *
     * @alias module:ArrayUtils.at
     */
    const at = function( pArr, pIdx, pDefault )
    {
        const arr = asArray( pArr ) || [];

        const idx = asInt( pIdx );

        const dflt = (_ud === typeof pDefault || null == pDefault) ? null : isNonNullValue( pDefault ) ? pDefault : null;

        return arr.at( idx ) || dflt;
    };

    const toPercentages = function( pArr, pOptions = DEFAULT_AS_ARRAY_OPTIONS )
    {
        let options = populateOptions( pOptions, DEFAULT_AS_ARRAY_OPTIONS );

        options.removeNaN = true;
        options.removeInfinity = true;
        options.sanitize = true;

        const asDecimal = !!options.asDecimal;

        let arr = asArray( pArr, options ) || [];

        arr = arr.filter( isNumeric ).map( asFloat ).filter( isValidNumber );

        const total = arr.reduce( ( a, b ) => a + b, 0 );

        arr = arr.map( e => (e / total) * (asDecimal ? 1 : 100) );

        return asArray( arr );
    };

    /**
     * Converts the provided arguments into an array of non-empty strings<br>
     * <br>
     * This function takes a variable number of arguments, processes them through
     * a transformation pipeline to filter and convert them, and returns an array
     * containing only non-empty strings<br>
     * <br>
     * Uses the {@link TransformerChain.TO_NON_EMPTY_STRINGS} to perform the transformation
     *
     * @function
     * @param {...*} pArr - The values to be returned as an array of non-empty strings
     *
     * @returns {Array<string>} - An array containing non-empty strings derived from the input arguments
     *
     * @alias module:ArrayUtils.toNonEmptyStrings
     */
    const toNonEmptyStrings = function( ...pArr )
    {
        let arr = varargs( ...pArr );
        return TransformerChain.TO_NON_EMPTY_STRINGS.transform( arr );
    };

    /**
     * Converts the provided input parameters into an array of non-blank strings<br>
     * <br>
     * The function accepts a variable number of arguments, processes them into an array,
     * and applies a transformation to ensure that the resulting array only
     * contains non-blank string values<br>
     * <br>
     * Uses the {@link TransformerChain.TO_NON_BLANK_STRINGS} to perform the transformation
     *
     * @function
     * @param {...*} pArr - The values to be converted into an array of non-blank strings
     *
     * @returns {Array<string>} An array of strings, excluding any blank or invalid string entries
     *
     * @alias module:ArrayUtils.toNonBlankStrings
     */
    const toNonBlankStrings = function( ...pArr )
    {
        let arr = varargs( ...pArr );
        return TransformerChain.TO_NON_BLANK_STRINGS.transform( arr );
    };

    /**
     * Converts the provided input parameters into an array of non-empty strings without leading or trailing whitespace<br>
     * <br>
     * Uses the {@link TransformerChain.TRIMMED_NON_EMPTY_STRINGS} to perform
     * the operation on the input values, treated as an array
     *
     * @function
     * @param {...*} pArr - A variable number of arguments that will be processed as an array
     *
     * @returns {Array<string>} An array of trimmed non-empty strings after transformation
     *
     * @alias module:ArrayUtils.toTrimmedNonEmptyStrings
     */
    const toTrimmedNonEmptyStrings = function( ...pArr )
    {
        let arr = varargs( ...pArr );
        return TransformerChain.TRIMMED_NON_EMPTY_STRINGS.transform( arr );
    };

    /**
     * Converts the provided input parameters into an array of non-blank strings without leading or trailing whitespace<br>
     * <br>
     * Uses the {@link the TransformerChain.TRIMMED_NON_BLANK_STRINGS}
     *
     * @function
     * @param {...*} pArr - A variable number of arguments that will be processed as an array
     *
     * @returns {Array<string>} An array of trimmed non-blank strings
     *
     * @alias module:ArrayUtils.toTrimmedNonBlankStrings
     * */
    const toTrimmedNonBlankStrings = function( ...pArr )
    {
        let arr = varargs( ...pArr );
        return TransformerChain.TRIMMED_NON_BLANK_STRINGS.transform( arr );
    };

    /**
     * Returns an array of the indices <i>of the non-null elements</i> of the specified array<br>
     * <br>
     *
     * @function
     *
     * @param {Array<*>} pArr - The array whose indices should be the elements of the returned array
     *
     * @param {boolean} [pAsStrings=false] - Controls whether the keys should be returned as strings,<br>
     * rather than numbers
     *
     * @returns {Array<number|string>} An array of <i>the indices of the non-null elements</i> of the specified array<br>
     *                                 If the second argument is true, returns the indices as strings
     * @alias module:ArrayUtils.toKeys
     */
    const toKeys = function( pArr, pAsStrings = false )
    {
        let arr = asArray( pArr || [] ) || [];
        arr = arr.map( ( e, i ) => !isNull( e ) ? i : null ).filter( e => null !== e );
        return !!pAsStrings ? arr.map( e => asString( e ) ) : arr;
    };

    const ArrayOperators =
        {
            "+":
                {
                    [_obj]: ( a, b ) => isArray( a ) && isArray( b ) ? a.concat( b ) : Object.assign( {}, a, b ),
                    [_num]: ( a, b ) => a + b,
                    [_big]: ( a, b ) => a + b,
                    [_str]: ( a, b, sep ) => a + sep + b,
                    [_bool]: ( a, b ) => a || b,
                    [_fun]: ( a, b ) => function( ...pArgs )
                    {
                        return a( ...pArgs ) + b( ...pArgs );
                    },
                    [_symbol]: ( a, b ) => [a, b],
                    [_ud]: ( a, b ) => null,
                },
            "-":
                {
                    [_obj]: function( a, b )
                    {
                        if ( isArray( a ) && isArray( b ) )
                        {
                            return a.filter( e => !b.includes( e ) );
                        }

                        let result = {};
                        for( let key in a )
                        {
                            if ( !(key in b) )
                            {
                                result[key] = a[key];
                            }
                        }
                        return result;
                    },
                    [_num]: ( a, b ) => a - b,
                    [_big]: ( a, b ) => a - b,
                    [_str]: ( a, b ) => a.replace( b, "" ),
                    [_bool]: ( a, b ) => a && !b,
                    [_fun]: ( a, b ) => function( ...pArgs )
                    {
                        return a( ...pArgs ) - b( ...pArgs );
                    },
                    [_symbol]: ( a, b ) => a.filter( e => e !== b ),
                },
            "*":
                {
                    [_obj]: ( a, b ) =>
                    {
                        const multiplyElements = ( aa, bb ) => aa.filter( isNumeric ).map( ( e, i ) => isNumeric( bb[i] ) ? asFloat( e ) * asFloat( bb[i] ) : 0 ).filter( e => !isNaN( e ) && isFinite( e ) );
                        return isArray( a ) && isArray( b ) ? multiplyElements( a, b ) : Object.assign( {}, a, b );
                    },
                    [_num]: ( a, b ) => a * b,
                    [_big]: ( a, b ) => a * b,
                    [_str]: ( a, b ) => cartesian( a, b ),
                    [_bool]: ( a, b ) => a && b,
                    [_fun]: ( a, b ) => function( ...pArgs )
                    {
                        return a( ...pArgs ) * b( ...pArgs );
                    }
                },
            "/":
                {
                    [_obj]: ( a, b ) =>
                    {
                        const divideElements = ( aa, bb ) => aa.filter( isNumeric ).map( ( e, i ) => isNumeric( bb[i] ) ? asFloat( e ) / asFloat( bb[i] ) : 0 ).filter( e => !isNaN( e ) && isFinite( e ) );
                        if ( isArray( a ) && isArray( b ) )
                        {
                            return divideElements( a, b );
                        }
                        let result = {};
                        for( let key in a )
                        {
                            if ( !(key in b) )
                            {
                                result[key] = a[key];
                            }
                        }
                        return result;
                    },
                    [_num]: ( a, b ) => a / b,
                    [_big]: ( a, b ) => a / b,
                    [_str]: ( a, b ) => cartesian( a, b ),
                    [_bool]: ( a, b ) => a && b,
                    [_fun]: ( a, b ) => function( ...pArgs )
                    {
                        return a( ...pArgs ) / b( ...pArgs );
                    }
                }
        };

    const ArrayOperatorsByType = new Map();

    Object.entries( ArrayOperators ).forEach( ( [operator, byType] ) =>
                                              {
                                                  Object.entries( byType ).forEach( ( [type, f] ) =>
                                                                                    {
                                                                                        let map = ArrayOperatorsByType.get( type ) || new Map();
                                                                                        ArrayOperatorsByType.set( type, map );

                                                                                        map.set( operator, f );
                                                                                    } );
                                              } );

    /**
     * @typedef {Object} CombinationOptions An object defining what and how to combine consecutive types
     *
     * @property {Array<string>} [types=[string]] An array of types to combine
     *
     * @property {Map<string,string|function>} [operators=ArrayOperatorsByType] A Map by type
     *          defining the operations to perform
     *          when combining elements of that type using that operator<br>
     *          <br>
     *          Acceptable values are one of the strings: <br>
     *          +, -, *, \<br>
     *          or a function that takes two elements of the type<br>
     *
     * @property {string} [operation=+] The operation to perform, which is used as a key into the operations specified.<br>
     *
     * @property {string} [separator] The separator to use if/when concatenating strings
     *
     * @property {boolean} [sortFirst=false] If true, the array of values will be sorted by type first.<br>
     *                                       This will make all elements of a certain type consecutive.
     *
     * @property {boolean} [flatFirst=false] If true, the array of values will be flattened first.<br>
     *
     * @property {number} [flatLevel=1] If flatFirst is true, this value specifies the level to which to flatten the original array<br>
     */

    const DEFAULT_COMBINE_OPTIONS =
        {
            types: [_str],
            operators: ArrayOperatorsByType,
            operation: "+",
            separator: _spc,
            sortFirst: false,
            flatFirst: false,
            flatLevel: 1,
        };

    const combineConsecutive = function( pOptions = DEFAULT_COMBINE_OPTIONS, ...pArr )
    {
        const options = populateOptions( pOptions, DEFAULT_COMBINE_OPTIONS );

        let arr = asArray( varargs( ...pArr ), { sanitize: true } );

        const types = options.types || [_str];

        const sep = asString( options.separator || _mt_str );

        if ( options.flatFirst )
        {
            arr = arr.flat( asInt( options.flatLevel, 1 ) || 1 );
        }

        if ( options.sortFirst )
        {
            arr = arr.sort( Comparators.BY_TYPE );
        }

        const operators = options.operators;

        const operation = options.operation;

        const len = arr.length;

        return arr.reduce( ( acc, current ) =>
                           {
                               if ( acc.length > 0 )
                               {
                                   let a = acc[acc.length - 1];
                                   let b = current;

                                   if ( types.includes( typeof a ) && types.includes( typeof b ) && areSameType( a, b ) )
                                   {
                                       const operations = operators.get( typeof a );
                                       const op = operations.get( operation );

                                       if ( isString( a ) )
                                       {
                                           a = asString( a, true );
                                           if ( !isEmptyString( sep ) )
                                           {
                                               b = asString( b, true );
                                           }
                                       }

                                       acc[acc.length - 1] = op( a, b, (acc.length < (len - 1) ? sep : _mt_str) );
                                   }
                                   else
                                   {
                                       acc.push( current );
                                   }
                               }
                               else
                               {
                                   // just add other elements as-is
                                   acc.push( current );
                               }
                               return acc;
                           }, [] );
    };

    const concatenateConsecutiveStrings = function( pSeparator, ...pArr )
    {
        const arr = varargs( ...pArr );

        const sep = asString( pSeparator ) || _spc;

        return combineConsecutive( { types: [_str], separator: sep }, ...arr );
    };

    let mod =
        {
            dependencies,
            ARRAY_METHODS,
            fromIterable,
            varargs,
            immutableVarArgs,
            asArray,
            asArgs,
            flatArgs,
            filteredArgs,
            flatFilteredArgs,
            unique,
            pruneArray,
            hasElements,
            isEmptyArray,
            isPopulatedArray,
            firstPopulatedArray,
            lastPopulatedArray,
            sortArray,
            copyArray,
            calculateLength,
            arraysEqual,
            includesAny,
            areSubsets,
            superset,
            union,
            intersection,
            disjunction,
            hasEntry,
            hasElementAt,
            at,
            arrLength,
            arrLenGt,
            arrLenGtEq,
            arrLenLt,
            arrLenLtEq,
            TRANSFORMATIONS: lock( TRANSFORMATIONS ),
            Filters: lock( Filters ),
            Mappers: lock( Mappers ),
            Comparators: lock( Comparators ),
            predicate,
            Transformer,
            TransformerChain,
            FilterChain,
            MapperChain,
            ComparatorChain,
            BoundedQueue,
            AsyncBoundedQueue,
            chainFilters,
            chainMappers,
            enQueue,
            MAX_QUEUE_SIZE,
            toPercentages,
            toNonEmptyStrings,
            toNonBlankStrings,
            toTrimmedNonEmptyStrings,
            toTrimmedNonBlankStrings,
            toKeys,
            createExclusiveFilter,
            createInclusiveFilter,
            extractScalar,
            firstMatchedValue,
            firstNumericValue,
            lastMatchedValue,
            DEFAULT_EQUALITY_OPTIONS,
            DEFAULT_POPULATED_ARRAY_OPTIONS,
            RANGE_INCREMENT_OPTION,
            DEFAULT_RANGE_OPTIONS,
            DEFAULT_NUMERIC_RANGE_OPTIONS,
            DEFAULT_CHARACTER_RANGE_OPTIONS,
            range,
            combineConsecutive,
            concatenateConsecutiveStrings,
            /**
             * @namespace
             * The classes this module defines and exposes
             * @const
             * @alias module:ArrayUtils#classes
             */
            classes:
                {
                    Transformer,
                    TransformerChain,
                    FilterChain,
                    MapperChain,
                    ComparatorChain,
                    BoundedQueue,
                    AsyncBoundedQueue
                }
        };

    // makes the properties of mod available as properties and methods of the modulePrototype
    mod = modulePrototype.extend( mod );

    // Exports this module
    return mod.expose( mod, INTERNAL_NAME, (_ud !== typeof module ? module : mod) ) || mod;

}());
