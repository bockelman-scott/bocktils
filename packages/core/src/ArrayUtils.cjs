/**
 * @fileOverview
 * This module provides several useful functions for working with arrays and array-like values.
 *
 * The most often used function is probably the <code>asArray<code> function,
 * which will return an array regardless of its arguments,
 * which is useful when you want to call array functionality
 * or just ensure you are working with an array before doing so.
 *
 * This module also defines a library of commonly used Filters (a.k.a. Predicates), Mappers, and Comparators.
 * @see Filters
 * @see Predicates
 * @see Mappers
 * @see Comparators
 *
 * @author Scott Bockelman
 */


/* import dependencies */
const constants = require( "./Constants.cjs" );
const typeUtils = require( "./TypeUtils.cjs" );
const stringUtils = require( "./StringUtils.cjs" );

/* define a variable for typeof undefined */
const { _ud = "undefined" } = constants;

/**
 * This function returns the host environment scope (Browser window, Node.js global, or Worker self)
 */
const $scope = constants?.$scope || function()
{
    return (_ud === typeof self ? ((_ud === typeof global) ? ((_ud === typeof globalThis ? {} : globalThis)) : (global || {})) : (self || {}));
};

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
     * An array of this module's dependencies
     * which are re-exported with this module,
     * so if you want to, you can just import the leaf module
     * and then use the other utilities as properties of that module
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
        _dot,
        _str,
        _fun,
        _obj,
        _num,
        _big,
        _bool,
        _symbol,
        S_WARN,
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

    if ( _ud === typeof CustomEvent )
    {
        CustomEvent = ModuleEvent;
    }

    const modName = "ArrayUtils";

    const modulePrototype = new ModulePrototype( modName, INTERNAL_NAME );

    const {
        VALID_TYPES,
        isUndefined,
        isNull,
        isNonNullValue,
        isString,
        isEmptyString,
        isNumeric,
        isNumber,
        isInteger,
        isObject,
        isArray,
        isTypedArray,
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
        toBinary
    } = typeUtils;

    const {
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
        rightOfLast
    } = stringUtils;

    // poly-fill for isArray; probably obsolete with modern environments
    if ( _fun !== typeof Array.isArray )
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
     * An array of the names of the methods exposed by Array
     * @type {string[]}
     */
    const ARRAY_METHODS = ["length", "GUID", "getUniqueId"].concat( [].concat( Object.getOwnPropertyNames( Array.prototype ).filter( e => "function" === typeof [][e] ) ) );

    /**
     * This object defines the default options for the asArray function.
     * flatten: when truthy, any elements of the array that are also arrays
     * are turned into individual elements of the returned array (@see Array::flat)
     *
     * flatten.level: if flatten is an object with a property named level,
     * the integer value of level is used in the call to Array::flat
     *
     * splitOn: a character or string to split a string if the argument to the function is a string.
     * For example, calling asArray("a.b.c") with splitOn:"." yields ["a","b","c"]
     *
     * filter: a function that can be used to filter the resulting array
     *
     * sanitize: if true, the resulting array will not contain any elements that are null, undefined, or an empty string
     *
     * type: string defining the typeof elements the resulting array should include --or-- a class for which each element must be an instance
     *       type conversions are not performed; if necessary to convert types, omit this option and use Array::map on the returned value
     *
     * unique: when true, the resulting array will contain no duplicated values
     *
     * comparator: a function to use to determine the order of the elements in the resulting array
     */
    const DEFAULT_AS_ARRAY_OPTIONS =
        {
            flatten: false,
            splitOn: undefined,
            filter: null,
            sanitize: false,
            type: null,
            unique: false,
            comparator: null
        };

    /**
     * This is an internal function
     * that performs post-processing on arrays before they are returned from the asArray function;
     *
     * @param pArr {[]}
     * @param pOptions {Object} the object whose properties define the post-processing operations
     * @returns {[]}
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

        arr = (options?.sanitize ? (arr || []).filter( e => !(_ud === typeof e || null == e || isEmpty( e )) ) : (arr || [])) || [];

        arr = (options?.type ? (arr || []).filter( e => (options?.type === typeof e || (isClass( options?.type ) && (e instanceof options?.type))) ) : (arr || [])) || [];

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

    /**
     * Returns an array based on its input.
     * If its input *is* an array, just returns it, unmodified, unaliased
     * If it is a string, then, depending on the options optionally specified, that string is either split on a value and resulting array is returned,or...
     *                          the string is wrapped in an array literal and a one element array containing the string is returned.
     * if the input is a primitive value, a one element array containing that value is returned.
     * if the input is a function, we execute that function with the options as its argument, passing the result back into this function
     * if the input is an object, we create aa new array populated with the "first-level" properties of the object and then returned
     * @param {any} pValue
     * @param {Object} pOptions
     * @param pRecursions {number} USED INTERNALLY TO PREVENT INFINITE RECURSION; DO NOT PASS A VALUE
     * @returns an Array, based on the input
     */
    const asArray = function( pValue, pOptions = DEFAULT_AS_ARRAY_OPTIONS, pRecursions = 0 )
    {
        const options = populateOptions( pOptions, DEFAULT_AS_ARRAY_OPTIONS );

        let arr = (isEmptyString( pValue ) || (isString( pValue ) && /^0+/.test( pValue )) || 0 === pValue || false === pValue ? [pValue] : (isNull( pValue ) ? [] : pValue)) || [];

        const recursions = Math.max( 0, asInt( pRecursions ) || 0 );

        if ( !(isArray( arr ) || isTypedArray( arr )) )
        {
            switch ( typeof arr )
            {
                case _obj:
                    arr = isNull( arr ) ? [] : Object.values( arr );
                    break;

                case _str:
                    const sep = ( !isUndefined( options?.splitOn ) && isString( options?.splitOn )) ? asString( options?.splitOn ) : null;
                    arr = (!isNull( sep ) ? arr.split( sep ) : [arr]) || [arr];
                    break;

                case _num:
                case _big:
                case _bool:
                    arr = [arr];
                    break;

                case _fun:

                    if ( recursions < 3 )
                    {
                        try
                        {
                            if ( isClass( arr ) )
                            {
                                const clazz = arr;

                                arr = asArray( new clazz( options ), options, recursions + 1 ) || [];
                            }
                            else
                            {
                                const func = arr;

                                arr = asArray( func( options ), options, recursions + 1 ) || [];
                            }
                        }
                        catch( ex )
                        {
                            modulePrototype.reportError( ex, "trying to execute " + (arr?.name || arr), S_WARN, modName + "::asArray" );
                        }
                    }
                    else
                    {
                        arr = [arr];
                    }
                    break;

                default:
                    if ( _ud !== (typeof arr[Symbol.iterator]) )
                    {
                        const returnValue = [];

                        for( const value of arr )
                        {
                            if ( value )
                            {
                                if ( options && options.filter )
                                {
                                    if ( options.filter( value ) )
                                    {
                                        returnValue.push( value );
                                    }
                                }
                                else
                                {
                                    returnValue.push( value );
                                }
                            }
                        }

                        arr = (recursions < 5 ? asArray( returnValue, options, recursions + 1 ) : returnValue) || [];
                    }
            } // end switch
        } // end else

        if ( isTypedArray( arr ) )
        {
            arr = [...arr];
        }

        arr = processAsArrayOptions( arr, options );

        return (isArray( arr ) ? (arr || []) : [arr]) || [];
    };

    /**
     * This function converts 'rest' arguments into an array,
     * performing a one-level flat() if the only argument passed was an array.
     * This behavior is exactly like that of the Array concat method.
     *
     * This function makes a copy of the arguments passed.
     *
     * @param pArgs {...any}
     * @returns {*|*[]|FlatArray<*[], 1>[]}
     */
    const varargs = function( ...pArgs )
    {
        let arr = [...(asArray( pArgs || [] ) || [])];
        return (arr.length < 2) ? (arr.length > 0 ? (isArray( arr[0] ) ? varargs( ...(arr[0]) ) : arr) : arr.flat()) : arr;
    };

    /**
     * This function converts 'rest' arguments into an immutable array,
     * performing a one-level flat() if the only argument passed was an array.
     * This behavior is exactly like that of the Array concat method.
     *
     * this function makes an immutable copy of the arguments.
     *
     * @param pArgs {...any}
     * @returns {*|*[]|FlatArray<*[], 1>[]}
     */
    const immutableVarArgs = function( ...pArgs )
    {
        let args = varargs( ...pArgs );
        return args.map( e => immutableCopy( e ) );
    };

    /**
     * Returns either the number of elements in an array,
     * the number of characters in a string (or the number of characters in the string representation of a number),
     * or the number of keys in an object
     * @param pObject {*[]|string|number|object} an array, string, number, or object whose "length" should be returned
     * @returns {number} the number of elements in an array,
     * the number of characters in a string (or the number of characters in the string representation of a number),
     * or the number of keys in an object
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
     * This is a collection of functions that can be used as filters or functions that return a filter.
     * These can be chained or combined using other features of this module
     */
    const Predicates =
        {
            /** A filter that returns the same array elements of the source array */
            IDENTITY: e => true,

            /** a filter to return the elements of an array that are filter functions */
            IS_PREDICATE: e => _fun === typeof e && e?.length > 0 && e?.length <= 3,

            /** a filter to return the elements of an array that are comparator functions */
            IS_COMPARATOR: e => _fun === typeof e && e?.length === 2,

            /** a filter to return the elements of an array that are not undefined */
            IS_DEFINED: e => _ud !== typeof e,

            /** a filter to return the elements of an array that are not null or undefined */
            IS_NOT_NULL: e => Predicates.IS_DEFINED( e ) && null !== e,

            /** a filter to return the elements of an array that are strings */
            IS_STRING: e => _str === typeof e,

            /** a filter to return the elements of an array that are empty strings */
            IS_EMPTY_STRING: e => Predicates.IS_STRING( e ) && _mt_str === e,

            /** a filter to return the elements of an array that are composed of whitespace characters only */
            IS_WHITESPACE: e => Predicates.IS_STRING( e ) && _mt_str === e.trim().replace( /\s+/g, _mt_str ),

            /** a filter to return the elements of an array that are non-empty strings */
            IS_POPULATED_STRING: e => Predicates.IS_STRING( e ) && !(Predicates.IS_EMPTY_STRING( e )),

            /** a filter to return the elements of an array that are non-blank strings */
            IS_NON_WHITESPACE: e => Predicates.IS_STRING( e ) && !Predicates.IS_WHITESPACE( e ),

            /** a filter to return the elements of an array that are numbers */
            IS_NUMBER: e => [_num, _big].includes( (typeof e) ),

            IS_NUMERIC: e => isValidNumeric( e ),

            /** a filter to return the elements of an array that are integers (whole numbers) */
            IS_INTEGER: e => Predicates.IS_NUMBER( e ) && (isInteger( e ) || Math.abs( e - Math.round( e ) ) < 0.0000000001),

            /** a filter to return the elements of an array that are objects */
            IS_OBJECT: e => _obj === typeof e,

            /** a filter to return the elements of an array that are also arrays */
            IS_ARRAY: e => Predicates.IS_OBJECT( e ) && isArray( e ),

            /** a filter to return the elements of an array that are functions */
            IS_FUNCTION: e => _fun === typeof e,

            /** a filter to return the elements of an array that are asynchronous functions */
            IS_ASYNC_FUNCTION: e => Predicates.IS_FUNCTION( e ) && e instanceof AsyncFunction,

            IS_BOOLEAN: e => isBoolean( e ),

            IS_REGEXP: e => (e instanceof RegExp || /\/[^/]\/[gidsmyu]+$/.test( asString( e, true ) )),

            IS_DATE: e => isDate( e ),

            /** a filter to returns the elements suitable as comparator functions for the Array 'sort' method */
            COMPARATORS: (e => Predicates.IS_FUNCTION( e ) && Predicates.IS_COMPARATOR( e )),

            /** a function to return an array of filter functions from varargs */
            _copyPredicateArguments: function( ...pPredicates )
            {
                return ([].concat( ...asArray( (pPredicates || [Predicates.IDENTITY]) ) )).filter( Predicates.IS_PREDICATE );
            },

            /** a function that returns a filter
             * that returns the elements of an array that match one of the specified types
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

            /** a function that returns a filter
             * that returns an array whose elements satisfy ALL specified filters
             */
            makeMatchesAllFilter: function( ...pPredicates )
            {
                const predicates = Predicates._copyPredicateArguments( ...pPredicates );

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

            /** a function that returns a filter
             * that returns an array whose elements satisfy ANY of the specified filters
             */
            makeMatchesAnyFilter: function( ...pPredicates )
            {
                const predicates = Predicates._copyPredicateArguments( ...pPredicates );

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

            /** a function that returns a filter
             * that returns an array whose elements satisfy NONE of the specified filters
             */
            makeMatchesNoneFilter: function( ...pPredicates )
            {
                const predicates = [].concat( ...(pPredicates || []) ).filter( Predicates.IS_PREDICATE );

                if ( predicates.length > 0 )
                {
                    const func = Predicates.makeMatchesAnyFilter( ...predicates );

                    return function( e )
                    {
                        return !func( e );
                    };
                }

                return function() { return true; };
            },

            /** a helper function that returns true if the specified value is a valid number or BigInt */
            _numExpected: function( pNum )
            {
                let num = [_num, _big].includes( typeof pNum ) ? parseInt( Number( pNum ).toFixed( 0 ) ) : _str === typeof pNum ? parseInt( pNum ) : 1;

                return [_num, _big].includes( typeof num ) && !isNaN( num ) && isFinite( num ) ? num : 1;
            },

            /** a function that returns a filter
             * that returns an array whose elements satisfy AT LEAST n of the specified filters
             */
            makeMatchesNPlusFilter: function( pNumMatches, ...pPredicates )
            {
                const predicates = Predicates._copyPredicateArguments( ...pPredicates );

                const numExpected = Predicates._numExpected( pNumMatches );

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

            /** a function that returns a filter
             * that returns an array whose elements satisfy EXACTLY n of the specified filters
             */
            makeMatchesExactlyNFilter: function( pNumMatches, ...pPredicates )
            {
                const predicates = [].concat( ...(pPredicates || []) ).filter( Predicates.IS_PREDICATE );

                let numExpected = Predicates._numExpected( pNumMatches );

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

            /** a function that returns a filter
             * that returns an array whose elements satisfy LESS THAN n of the specified filters
             */
            makeMatchesLessThanNFilter: function( pNumAllowed, ...pPredicates )
            {
                const predicates = [].concat( ...(pPredicates || []) ).filter( Predicates.IS_PREDICATE );

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
                    }

                    return (numMatches < numAllowed);
                };
            },

            /** a filter to return the elements of an array that are also arrays with at least one non-null/non-empty element */
            IS_POPULATED_ARRAY: function( e )
            {
                const filter = Predicates.makeMatchesAllFilter( Predicates.IS_OBJECT, Predicates.IS_NOT_NULL, Predicates.IS_ARRAY, e => e?.length > 0 );
                return filter( e );
            },

            /** a filter to return the elements of an array that are objects (or arrays) with at least one property */
            IS_POPULATED_OBJECT: function( e )
            {
                const filter = Predicates.makeMatchesAllFilter( Predicates.IS_OBJECT, Predicates.IS_NOT_NULL, e => Predicates.IS_ARRAY( e ) ? ((e?.length || 0) > 0) : (Object.keys( e )?.length || 0) > 0 );
                return filter( e );
            },

            /** a filter to return the elements of an array that are objects that are not arrays with at least one non-null/non-empty property */
            IS_POPULATED_NON_ARRAY_OBJECT: function( e )
            {
                const filter = Predicates.makeMatchesAllFilter( Predicates.IS_OBJECT( e ), Predicates.IS_NOT_NULL, e => ( !Predicates.IS_ARRAY( e ) && Object.keys( e ).length > 0) );
                return filter( e );
            },

            /** a filter to return the elements of an array that are valid numbers */
            IS_VALID_NUMBER: e => Predicates.IS_NUMBER( e ) && !isNaN( e ) && isFinite( e ),

            /**
             * a filter to return the elements of an array
             * that are either non-empty strings,
             * objects with at least one property,
             * arrays with at least one element,
             * or valid numbers
             */
            NON_EMPTY: function( e )
            {
                const filter = Predicates.makeMatchesAnyFilter( Predicates.IS_POPULATED_STRING,
                                                                Predicates.IS_POPULATED_OBJECT,
                                                                Predicates.IS_VALID_NUMBER,
                                                                Predicates.IS_FUNCTION,
                                                                Predicates.IS_BOOLEAN );
                return filter( e );
            },

            /**
             * a filter to return the elements of an array
             * that are either non-empty strings,
             * objects with at least one property,
             * arrays with at least one element,
             * booleans,
             * Dates,
             * RegExp objects,
             * or valid numbers
             */
            IS_POPULATED: function( e )
            {
                const filter =
                    Predicates.makeMatchesAnyFilter(
                        Predicates.IS_POPULATED_STRING,
                        Predicates.IS_VALID_NUMBER,
                        Predicates.IS_BOOLEAN,
                        Predicates.IS_REGEXP,
                        Predicates.IS_DATE,
                        Predicates.IS_POPULATED_OBJECT,
                        Predicates.IS_POPULATED_ARRAY
                    );

                return filter( e );
            },

            /**
             * a filter to return the elements of an array
             * that are strings with at least one non-whitespace character
             */
            NON_BLANK: e => Predicates.IS_POPULATED_STRING( e ) && _mt_str !== e.trim() && !Predicates.IS_WHITESPACE( e ),

            /**
             * a function that returns a filter
             * that returns an array whose elements match the specified regular expression
             */
            makeMatchesRexExpFilter: function( pRx )
            {
                const rx = new RegExp( pRx || /.*/s );

                return function( e )
                {
                    if ( !(_str === typeof e) )
                    {
                        return false;
                    }

                    const re = new RegExp( rx || /.*/s );

                    return re.test( e );
                };
            },

            /**
             * Returns a filter that matches if none of the predicates/filters specified return true
             * Similar to makeMatchesNoneFilter
             * @param pPredicates
             * @returns {(function(*, *, *): (boolean))|*}
             */
            NOT: function( ...pPredicates )
            {
                const filters = asArray( pPredicates ).filter( Predicates.IS_PREDICATE );

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
             * Returns a filter to return the elements of an array
             * that are not elements of the specified array
             *
             * @return {function}
             */
            NOT_IN: function( ...pArr )
            {
                const arr = varargs( ...pArr );

                return function( e )
                {
                    let retained = arr?.length > 0 ? !(arr.includes( e )) : (_ud !== typeof e && null !== e);

                    if ( retained && isArray( e ) )
                    {
                        let filtered = arr.filter( Predicates.IS_ARRAY );
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
                        let filtered = arr.filter( Predicates.IS_OBJECT );

                        for( let elem of filtered )
                        {
                            if ( arraysEqual( Object.keys( e ), Object.keys( elem ), true, Comparators._compare ) )
                            {
                                if ( arraysEqual( Object.values( e ), Object.values( elem ), false, Comparators._compare ) )
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
             * Returns a filter to return the elements of an array
             * that are also elements of the specified array
             *
             * @return {function}
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
                            let filtered = arr.filter( Predicates.IS_ARRAY );
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
                            let filtered = arr.filter( Predicates.IS_OBJECT );

                            for( let elem of filtered )
                            {
                                if ( arraysEqual( Object.keys( e ), Object.keys( elem ), true, Comparators._compare ) )
                                {
                                    if ( arraysEqual( Object.values( e ), Object.values( elem ), false, Comparators._compare ) )
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
             * Returns a function that returns a filter
             * that returns an array whose elements each start with
             * one or more of the strings in the specified array
             *
             * @return {function}
             * */
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
             * a function that returns a filter
             * that returns an array whose elements each end with
             * one or more of the strings in the specified array
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
             * a function that returns a filter
             * that is composed of the filters specified
             */
            buildPredicate: function( ...pFunctions )
            {
                const functions = [].concat( ...(pFunctions || [Predicates.IDENTITY]) ).filter( Predicates.IS_PREDICATE );

                return function( pElem, pIndex, pArray )
                {
                    for( const func of functions )
                    {
                        try
                        {
                            if ( true !== func( pElem, pIndex, pArray ) )
                            {
                                return false;
                            }
                        }
                        catch( ex )
                        {
                            ignore( ex );

                            return false;
                        }
                    }

                    return true;
                };
            },

            /**
             * a function that returns a filter
             * that is composed of the filters specified
             */
            chain: function( ...pFilters )
            {
                const filters = ([].concat( ...(pFilters || [Predicates.IDENTITY]) )).filter( Predicates.IS_PREDICATE );

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
     * This is a top-level function that returns a filter
     * that returns an array whose elements
     * match all the filter functions specified.
     *
     * @see Predicates.makeMatchesAllFilter
     *
     * @param pFunction {...function} one or more filter functions to combine
     *
     * @returns {function(*): boolean}
     */
    const predicate = function( ...pFunction )
    {
        const functions = [].concat( ...(pFunction || [Predicates.IDENTITY]) ).filter( Predicates.IS_PREDICATE );
        return Predicates.makeMatchesAllFilter( ...(functions || [Predicates.IDENTITY]) );
    };

    /**
     * This object is used to export the Predicates collection under a more familiar name
     * @type {{_numExpected: (function(*): number|number), IS_NOT_NULL: (function(*): *), makeMatchesNoneFilter: ((function(...[*]): (function(*): *))|*), IS_POPULATED_STRING: (function(*): *), buildPredicate: (function(...[*]): function(*, *, *): (boolean)), makeMatchesNPlusFilter: (function(*, ...[*]): function(*): boolean), IS_DEFINED: (function(*): boolean), IS_POPULATED_OBJECT: (function(*): *), IS_WHITESPACE: (function(*): *), IS_PREDICATE: (function(*): *), makeTypeFilter: (function(...[*]): function(*): boolean), makeMatchesExactlyNFilter: (function(*, ...[*]): function(*): boolean), IS_NON_WHITESPACE: (function(*): *), IS_POPULATED_ARRAY: (function(*): *), NON_EMPTY: (function(*): *), IS_EMPTY_STRING: (function(*): *), IS_ARRAY: (function(*): *), IS_VALID_NUMBER: (function(*): *), ENDS_WITH: (function(...[*]): function(*, *, *): boolean), makeMatchesAllFilter: (function(...[*]): function(*): boolean), IS_STRING: (function(*): boolean), IS_NUMBER: (function(*): boolean), _copyPredicateArguments: (function(...[*]): *[]), chain: (function(...[*]): function(*, *, *): boolean), STARTS_WITH: (function(...[*]): function(*, *, *): boolean), IN: (function(...[*]): function(*): *), IS_ASYNC_FUNCTION: (function(*): *), NOT_IN: (function(...[*]): function(*): *), IS_FUNCTION: (function(*): boolean), IS_COMPARATOR: (function(*): *), makeMatchesAnyFilter: (function(...[*]): function(*): boolean), IDENTITY: (function(*): boolean), makeMatchesRexExpFilter: (function(*): function(*): (boolean|boolean)), IS_INTEGER: (function(*): *), IS_POPULATED_NON_ARRAY_OBJECT: (function(*): *), makeMatchesLessThanNFilter: (function(*, ...[*]): function(*): boolean), IS_OBJECT: (function(*): boolean), NON_BLANK: (function(*): *)}}
     */
    let Filters = Object.assign( {}, Predicates );

    /**
     * This is a collection of functions to map an array of elements to an array of modified elements.
     * @type {{IDENTITY: (function(*): *), TO_NUMBER: (function(*): *|number), chain: (function(...[*]): function(*, *, *): *), TO_LOWERCASE: (function(*): string), TO_UPPERCASE: (function(*): string), TO_VALID_NUMBER: ((function(*): (number|number))|*), TRIMMED: (function(*): string), TO_STRING: (function(*): *|string), REPLACE: (function(*, *): function(*): string), APPEND: (function(*): function(*): *), PREPEND: (function(*): function(*): *)}}
     */
    const Mappers =
        {
            /** This mapper simply returns an array with the same elements as the source array */
            IDENTITY: e => e,

            /** This mapper is used to return an array with its elements converted to strings */
            TO_STRING: e => isString( e ) ? e : asString( e ),

            /**
             * This function returns a mapper to convert elements into strings according to the options specified
             * @param pOptions {Object}
             * @returns {function(*): *}
             *
             * @see stringUtils#asString
             */
            TO_STRING_WITH_OPTIONS: function( pOptions )
            {
                const options = Object.assign( {}, pOptions || {} );
                return e => asString( e, options.trim, options );
            },

            /** This mapper is used to return an array with its elements converted to numbers */
            TO_NUMBER: e => isNumber( e ) ? e : asFloat( e ),

            /** This mapper is used to return an array with its elements converted to base-10 numbers */
            TO_DECIMAL: e => isNumeric( e ) ? toDecimal( e ) : asFloat( e ),

            /** This mapper is used to return an array with its elements converted to base-16 representations */
            TO_HEXADECIMAL: e => isNumeric( e ) ? toHex( e ) : "0x0",

            /** This mapper is used to return an array with its elements converted to base-8 representations */
            TO_OCTAL: e => isNumeric( e ) ? toOctal( e ) : "0o0",

            /** This mapper is used to return an array with its elements converted to base-2 representations */
            TO_BINARY: e => isNumeric( e ) ? toBinary( e ) : "0b0",

            /** This mapper is used to return an array with its elements converted to valid numbers or 0 */
            TO_VALID_NUMBER: function( e )
            {
                let n = Mappers.TO_NUMBER( e );

                if ( !isNaN( n ) && isFinite( n ) )
                {
                    return n;
                }

                return 0;
            },

            /** This mapper is used to return an array with its elements converted to strings with leading and trailing whitespace removed */
            TRIMMED: e => asString( e, true ).trim(),

            /** This function returns a mapper
             * that is used to return an array with each of its elements converted to strings
             * that are then appended with the specified string */
            APPEND: function( pStr )
            {
                return e => asString( e ) + (asString( pStr ) || _mt_str);
            },

            /** This function returns a mapper
             * that is used to return an array with each of its elements converted to strings
             * that are prefixed with the specified string */
            PREPEND: function( pStr )
            {
                return e => (asString( pStr ) || _mt_str) + asString( e );
            },

            /** This function returns a mapper
             * that is used to return an array with each of its elements converted to strings
             * modified by replacing the search string or RegExp with the replacement string */
            REPLACE: function( pSearchStr, pReplacement )
            {
                return e => asString( e ).replace( pSearchStr, (asString( pReplacement || _mt_str ) || _mt_str) );
            },

            /** This mapper is used to return an array with its elements converted to strings and then converted to lowercase */
            TO_LOWERCASE: function( e )
            {
                return lcase( asString( e ) );
            },

            /** This mapper is used to return an array with its elements converted to strings and then converted to UPPERCASE */
            TO_UPPERCASE: function( e )
            {
                return ucase( asString( e ) );
            },

            /**
             * This function returns a mapper function
             * that returns an array with all specified mappers applied
             *
             * @param pMappers {...function}
             * @returns {function(*, *, *): *}
             */
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
     * This is a collection of functions that can be used as arguments to the Array sort method
     * and functions that create comparators
     */
    const Comparators =
        {
            /** This is the basic comparison of 2 values
             * that can be considered greater than or less than one another
             */
            _compare: function( a, b )
            {
                return (a < b ? -1 : a > b ? 1 : 0);
            },

            /** This is a no op function that will leave a collection in the same order */
            NONE: function( a, b )
            {
                return 0;
            },

            /**
             * This function returns a default comparator
             * that treats null values as the default value for the specified type.
             *
             * @param pType
             * @returns {function}
             */
            CREATE_DEFAULT: function( pType )
            {
                return function( a, b )
                {
                    let type = pType || typeof a;

                    let aa = Predicates.IS_NOT_NULL( a ) ? castTo( a, type ) : defaultFor( type );
                    let bb = Predicates.IS_NOT_NULL( b ) ? castTo( b, type ) : defaultFor( type );

                    return Comparators._compare( aa, bb );
                };
            },

            /** This comparison function converts each element to a string before comparison */
            BY_STRING_VALUE: function( a, b )
            {
                let sA = asString( a ) || (_fun === typeof a?.toString ? a.toString() : _mt_str);
                let sB = asString( b ) || (_fun === typeof b?.toString ? b.toString() : _mt_str);

                if ( isBlank( sA ) && _str !== typeof a )
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

                if ( isBlank( sB ) && _str !== typeof b )
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
                    comp = Comparators.CREATE_DEFAULT( "string" )( sA, sB );
                }

                return comp;
            },

            /** This comparator is used to order an array by the length of its elements */
            BY_LENGTH: function( a, b )
            {
                let lenA = calculateLength( a ) || a?.length;
                let lenB = calculateLength( b ) || b?.length;

                return Comparators._compare( lenA, lenB );
            },

            /**
             * This function returns a comparison function
             * that orders one array by the position of elements in another array
             */
            BY_POSITION: function( pReference, pPositionFunction, pTransformation )
            {
                const ref = [].concat( ...(pReference || []) );

                const transform = function( pElem )
                {
                    let value = pElem;

                    if ( _fun === typeof pTransformation )
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

                const findPosition = function( pElem, pReference )
                {
                    let arr = ((pReference && isArray( pReference )) ? pReference : ref) || [];

                    let position = arr.indexOf( pElem );

                    if ( _fun === typeof pPositionFunction )
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
             * This function creates a chain of comparators
             * applied in order until one of them returns a non-zero value
             */
            chain: function( ...pComparators )
            {
                const comparators = [].concat( ...(pComparators || [Comparators.NONE]) ).filter( Filters.COMPARATORS );

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
             * This function creates a chain of comparators
             * applied in order until one of them returns a non-zero value
             * and then reverses that comparison to return an array sorted in reverse order
             */
            descending: function( ...pComparators )
            {
                const comparators = [].concat( ...(pComparators || [Comparators.NONE]) ).filter( Filters.COMPARATORS );

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

            /** This function returns true if the specified value is (probably) a comparator */
            isComparator: function( pCandidate )
            {
                if ( _ud === typeof pCandidate || null == pCandidate )
                {
                    return false;
                }

                return isFunction( pCandidate ) && 2 === pCandidate?.length;
            }
        };

    /**
     * This is a map of the methods that can be called on an array
     * to transform its contents (or return a new array with the modified content)
     * @type {{FILTER: string, SORT: string, MAP: string, FLAT: string}}
     */
    const TRANSFORMATIONS =
        {
            FILTER: "filter",
            MAP: "map",
            SORT: "sort",
            FLAT: "flat"
        };

    /**
     * This class encapsulates the sort, map, or filter method of an array into an object,
     * which can further be chained to perform multiple transformations on an array
     */
    class Transformer
    {
        #methodName;

        #methodArgument;

        #arguments;

        /**
         * Constructs a Transformer which can map, filter, or sort an array
         * @param pMethodName {string} the method to call on the collection
         * @param pFunction {function} the function to pass to the method
         * @param pArgs {...any} one or more arguments to pass to the function being passed to the method
         */
        constructor( pMethodName, pFunction, ...pArgs )
        {
            // the array method to call
            this.#methodName = pMethodName; // should be one of TRANSFORMATIONS.filter, TRANSFORMATIONS.map, or TRANSFORMATIONS.sort

            // arguments to the function to be passed to the method
            this.#arguments = [].concat( ...(asArray( pArgs || [] ) || []) );

            // should be a function suitable as an argument to the specified method
            this.#methodArgument = isFunction( pFunction ) ? pFunction : isFunction( this.#arguments[0] ) ? this.#arguments[0] : null;
        }

        get methodName()
        {
            let funcName = asString( (isString( this.#methodName ) ? this.#methodName : asString( this.#methodName?.name )) ) || TRANSFORMATIONS.FILTER;
            return lcase( asString( Object.values( TRANSFORMATIONS ).includes( funcName ) ? funcName : TRANSFORMATIONS.FILTER, true ) );
        }

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

        get methodArgument()
        {
            let func = this.#methodArgument;

            func = (_fun === typeof func) ? func : (TRANSFORMATIONS.FLAT === this.methodName) ? firstNumericValue( this.#arguments ) : this.defaultArgument;

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

        transform( pArr )
        {
            let arr = [].concat( ...(pArr || []) );

            if ( _str === typeof this.methodName )
            {
                const operation = arr[this.methodName];

                if ( _fun === typeof operation )
                {
                    if ( _fun === typeof this.methodArgument && this.methodArgument?.length >= 1 )
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
     * This class encapsulates one or more transformations to perform on an array.
     * Allows you to combine filtering, mapping, and sorting in a pipeline-like operation
     */
    class TransformerChain
    {
        #transformers = [];

        constructor( ...pTransformers )
        {
            this.#transformers = [].concat( ...(pTransformers || []) );
        }

        get transformers()
        {
            return [].concat( ...asArray( this.#transformers || [] ) );
        }

        /**
         * Performs the specific transformation (filter, map, or sort) on the specified array
         * @param pArr an array to transform
         * @returns {*[]} a new array resulting from the one or more transformations specified
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
         * @param pArr {*[]} the array or array-like object to transform
         * @param pMethodName {string} the name of the method to call on the array
         * @param pMethodArgument {number|function} a value to pass to the transformation method, such a filter, mapper, comparator, or the depth for flat()
         * @returns {boolean}
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

    TransformerChain.TO_NON_EMPTY_STRINGS =
        new TransformerChain(
            new Transformer( TRANSFORMATIONS.FILTER, Filters.IS_POPULATED ),
            new Transformer( TRANSFORMATIONS.MAP, Mappers.TO_STRING ),
            new Transformer( TRANSFORMATIONS.FILTER, Filters.NON_EMPTY )
        );

    TransformerChain.TO_NON_BLANK_STRINGS =
        new TransformerChain(
            new Transformer( TRANSFORMATIONS.FILTER, Filters.IS_POPULATED ),
            new Transformer( TRANSFORMATIONS.MAP, Mappers.TO_STRING ),
            new Transformer( TRANSFORMATIONS.FILTER, Filters.NON_BLANK )
        );

    TransformerChain.TRIMMED_NON_EMPTY_STRINGS =
        new TransformerChain(
            new Transformer( TRANSFORMATIONS.FILTER, Filters.IS_POPULATED ),
            new Transformer( TRANSFORMATIONS.MAP, Mappers.TRIMMED ),
            new Transformer( TRANSFORMATIONS.FILTER, Filters.NON_EMPTY )
        );

    TransformerChain.TRIMMED_NON_BLANK_STRINGS =
        new TransformerChain(
            new Transformer( TRANSFORMATIONS.FILTER, Filters.IS_POPULATED ),
            new Transformer( TRANSFORMATIONS.MAP, Mappers.TRIMMED ),
            new Transformer( TRANSFORMATIONS.FILTER, Filters.NON_BLANK )
        );

    TransformerChain.SPLIT_ON_DOT =
        new TransformerChain(
            TransformerChain.TRIMMED_NON_BLANK_STRINGS,
            new Transformer( TRANSFORMATIONS.MAP, e => e.split( _dot ) ),
            new Transformer( TRANSFORMATIONS.FLAT )
        );

    /**
     * This subclass of TransformerChain encapsulates the application of one or more filters.
     * 'applyFilters' is a synonym for the transform method
     */
    class FilterChain extends TransformerChain
    {
        constructor( ...pFilters )
        {
            super( ([].concat( ...(pFilters || [Filters.IDENTITY]) )).map( e => new Transformer( TRANSFORMATIONS.FILTER, e ) ) );
        }

        applyFilters( pArr )
        {
            return super.transform( pArr );
        }
    }

    /** A filter chain to return strings that are not undefined, null, or empty */
    FilterChain.NON_EMPTY_STRINGS = new FilterChain( Filters.IS_DEFINED, Filters.IS_NOT_NULL, Filters.makeTypeFilter( _str ), Filters.NON_EMPTY );

    /** A filter chain to return strings that are not undefined, null, or composed entirely of whitespace */
    FilterChain.NON_BLANK_STRINGS = new FilterChain( Filters.IS_DEFINED, Filters.IS_NOT_NULL, Filters.makeTypeFilter( _str ), Filters.NON_BLANK );

    /**
     * This subclass of TransformerChain encapsulates the application of one or more mappers.
     * 'applyMappers' is a synonym for the transform method
     */
    class MapperChain extends TransformerChain
    {
        constructor( ...pMappers )
        {
            super( ([].concat( ...(pMappers || [Mappers.IDENTITY]) )).map( e => new Transformer( TRANSFORMATIONS.MAP, e ) ) );
        }

        applyMappers( pArr )
        {
            return super.transform( pArr );
        }
    }

    /** A mapper/filter combination that returns an array with each element converted to a string and empty strings removed */
    MapperChain.NON_EMPTY_STRINGS = new TransformerChain( new Transformer( TRANSFORMATIONS.MAP, Mappers.TO_STRING ), FilterChain.NON_EMPTY_STRINGS );

    /**
     * This subclass of TransformerChain
     * encapsulates the application of one or more comparators to sort an array
     */
    class ComparatorChain extends TransformerChain
    {
        constructor( ...pComparators )
        {
            super( [].concat( (pComparators || [Comparators.NONE]) ).filter( Filters.COMPARATORS ).map( e => new Transformer( TRANSFORMATIONS.SORT, e ) ) );

            this._comparators = ([].concat( ...(pComparators || [Comparators.NONE]) )).filter( Filters.COMPARATORS );
        }

        transform( pArr )
        {
            let arr = [].concat( ...(pArr || []) );

            arr = this.sort( arr );

            return arr;
        }

        get comparator()
        {
            return function( a, b )
            {
                let comp = 0;

                for( const func of this._comparators )
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
            let arr = [].concat( ...(pArr || []) );

            const checksum = arr.length;

            arr = arr.sort( this.comparator );

            return checksum === arr?.length ? arr || pArr : pArr;
        }
    }

    /**
     * Returns an array with all specified filters applied
     * @param pArr an array to filter
     * @param pFilters one or more functions that return true if the element should be included in the resulting array
     * @returns {*[]} a new array with the specified filters applied
     */
    const chainFilters = function( pArr, ...pFilters )
    {
        let arr = [].concat( ...(pArr || []) );

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
     * Returns an array transformed by each of the specified mapping functions
     * @param pArr an array to map as per the specified functions
     * @param pMappers one or more functions that return a new element to be included in the resulting array
     * @returns {*[]} a new array with the specified mappings applied
     */
    const chainMappers = function( pArr, ...pMappers )
    {
        let arr = [].concat( ...(pArr || []) );

        let mappers = [].concat( ...(pMappers || [Mappers.IDENTITY]) );

        for( const mapper of mappers )
        {
            arr = arr.map( mapper );
        }

        return arr;
    };

    const DEFAULT_POPULATED_ARRAY_OPTIONS =
        {
            minimumLength: 1,
            acceptArrayLike: false,
            acceptObjects: false
        };
    /**
     * Returns true if the specified object is an array and has at least one element
     * @param pArr (array or indexed object -- that is, something with a length property and the ability to address members via an integer key)
     * @param pOptions
     * @returns {boolean}
     */
    const isPopulatedArray = function( pArr, pOptions = DEFAULT_POPULATED_ARRAY_OPTIONS )
    {
        const minLength = Math.max( 1, asInt( asString( pOptions?.minimumLength, true ) || 1 ) );

        const arr = !((_ud === typeof pArr) || (null === pArr)) ? (pArr || []) : [];

        if ( true === pOptions?.acceptArrayLike )
        {
            const isIndexedObject = (isArray( pArr )) || Object.hasOwn( arr, "length" );

            return isIndexedObject && (minLength <= (arr?.length || 0));
        }

        if ( true === pOptions?.acceptObjects && isObject( pArr ) )
        {
            return (Object.keys( pArr )?.length || 0) >= minLength;
        }

        return (isArray( pArr )) && pArr.length >= minLength;
    };

    /**
     * Returns the first array specified that has a length > 0
     * or a zero-length array if none of the candidates are arrays with a length > 0
     *
     * @param{Array<Array|any>} pCandidates an array of values, each expected to be an Array
     *
     * @returns {Array} the first array specified that has a length > 0
     * or a zero-length array if none of the candidates are arrays with a length > 0
     */
    const firstPopulatedArray = function( ...pCandidates )
    {
        // filter the arguments so the resulting array is either empty or holds at least one array matching the filter,
        // where the filter matches only elements that are arrays with one or more elements
        let candidates = (pCandidates || []).filter( Predicates.makeMatchesAllFilter( Predicates.IS_ARRAY, Predicates.IS_POPULATED_OBJECT ) );

        // if any of the candidates matched the filter, return the first of these, otherwise, return an empty array
        return isPopulatedArray( candidates ) ? candidates[0] : [];
    };

    /**
     * Returns the last array specified that has a length > 0
     * or a zero-length array if none of the candidates are arrays with a length > 0
     *
     * @param{Array<Array|any>} pCandidates an array of values, each expected to be an Array
     *
     * @returns {Array} the last array specified that has a length > 0
     * or a zero-length array if none of the candidates are arrays with a length > 0
     */
    const lastPopulatedArray = function( ...pCandidates )
    {
        // filter the arguments so the resulting array is either empty or holds at least one array matching the filter,
        // where the filter matches only elements that are arrays with one or more elements
        let candidates = (pCandidates || []).filter( Predicates.makeMatchesAllFilter( Predicates.IS_ARRAY, Predicates.IS_POPULATED_OBJECT ) );

        // if any of the candidates matched the filter, return the first of these, otherwise, return an empty array
        return isPopulatedArray( candidates ) ? candidates[candidates.length - 1] : [];
    };

    function _createFilters( ...pArgs )
    {
        let args = varargs( ...pArgs );

        let filters = [];

        for( let arg of args )
        {
            if ( Predicates.IS_PREDICATE( arg ) || (isFunction( arg ) && arg?.length > 0) )
            {
                filters.push( arg );
            }
            else if ( Predicates.IS_REGEXP( arg ) )
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
        }

        return filters.filter( Predicates.IS_FUNCTION );
    }

    const createExclusiveFilter = function( ...pArgs )
    {
        const filters = _createFilters( ...pArgs );

        return Predicates.makeMatchesAllFilter( filters );
    };

    const createInclusiveFilter = function( ...pArgs )
    {
        const filters = _createFilters( ...pArgs );

        return Predicates.makeMatchesAnyFilter( filters );
    };

    const firstMatchedValue = function( pMatcher, ...pArr )
    {
        let matcher = createExclusiveFilter( pMatcher );

        let arr = varargs( ...pArr ).filter( matcher );

        return (arr?.length || 0) > 0 ? arr[0] : null;
    };

    const firstNumericValue = function( ...pArr )
    {
        return firstMatchedValue( Predicates.IS_NUMERIC, ...pArr );
    };

    /**
     * Returns a copy of an array with duplicate elements removed
     * @param pArr {...any} an array or one or more values to treat as an array
     * @returns {Array} a copy of the array with duplicates removed
     */
    const unique = function( ...pArr )
    {
        let arr = varargs( ...pArr );
        return [...(new Set( arr ))];
    };

    /**
     * This function returns an array ordered according to either the comparator specified --
     * -- OR --
     * If the second argument is a string,
     * the array elements are assumed to be objects
     * that will ordered by the value of the property of the specified name
     *
     * @param pArr
     * @param pComparator
     * @returns {*[]}
     */
    const sortArray = function( pArr, pComparator )
    {
        let arr = [].concat( ...(pArr || []) );

        let opts = { comparator: pComparator || "compareTo" };

        if ( _fun === typeof pComparator )
        {
            opts.comparator = pComparator;
        }

        if ( _str === typeof opts?.comparator && "true" === opts?.comparator )
        {
            opts.comparator = true;
        }

        if ( _bool === typeof opts?.comparator )
        {
            opts.comparator = opts.comparator ? "compareTo" : "toString";
        }

        const comparator = ((_fun === typeof opts?.comparator) ? opts?.comparator : function( pElemA, pElemB, pProperty )
        {
            let property = asString( asString( pProperty ) || asString( opts?.comparator ) || "compareTo" );

            if ( property )
            {
                let a = pElemA?.[pProperty] || pElemB?.[pProperty] || pElemA?.compareTo;
                let b = pElemB?.[pProperty] || pElemA?.[pProperty] || pElemB?.compareTo;

                if ( _fun === typeof a )
                {
                    a = a.apply( pElemA || pElemB || $scope(), [pElemB, opts] );
                }
                else
                {
                    a = pElemA;
                }

                if ( _fun === typeof b )
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
     * Returns an array with any elements that are null, undefined, or NaN removed
     * @param {any} pArr - should be an array, but can be anything, as we will force it to be an array before pruning
     * @param {boolean} pRejectNaN - (optional) when specified as true, numeric array elements that are NaN or not finite are also removed
     * @param {...string} pRejectedTypes one or more types to exclude from the returned array
     * @returns {Array} an array with no null or undefined elements, potentially an empty array
     */
    const pruneArray = function( pArr, pRejectNaN = true, ...pRejectedTypes )
    {
        // force the input argument to be an array
        let arr = asArray( pArr, { "sanitize": true } );

        // this is the array we will return, so we do not modify the input argument
        let pruned = [].concat( arr ).filter( Predicates.IS_NOT_NULL );

        const rejectedTypes = varargs( ...pRejectedTypes );

        if ( rejectedTypes && rejectedTypes.length )
        {
            pruned = pruned.filter( e => !rejectedTypes.includes( typeof e ) );
        }

        if ( pRejectNaN && !(rejectedTypes.includes( _num ) && rejectedTypes.includes( _big )) )
        {
            pruned = pruned.filter( e => !([_num, _big].includes( typeof e )) || !(isNaN( e ) || !isFinite( e )) );
        }

        // always return an array to avoid null-pointer exceptions
        return pruned || [];
    };

    /**
     * Returns true if the specified array has at least the specified number of elements (default=1)
     * @param pArr {*[]} an array
     * @param pMinimum {number} @default 1
     * @returns {boolean}
     */
    const hasElements = function( pArr, pMinimum )
    {
        let minimum = asInt( pMinimum || 1, 1 ) || 1;
        return (isArray( pArr ) && (pArr?.length || 0) >= minimum);
    };

    /**
     * Returns true if the specified array is empty or null or undefined
     * @param pArr
     * @returns {boolean}
     */
    const isEmptyArray = function( pArr )
    {
        return (isArray( pArr ) && (pArr?.length || 0) <= 0);
    };

    /**
     * Returns the length of the specified array (or string if the second argument is true)
     * If the specified array is null or undefined, returns 0
     * @param pArr an array (or string if the second argument is true) whose length is to be returned
     * @param pAllowStringArg if true, the first argument can be a string whose length will be returned
     * @returns {number} the length of the array (or string, when the second argument is true)
     */
    const arrLength = function( pArr, pAllowStringArg = false )
    {
        if ( isArray( pArr ) || pAllowStringArg )
        {
            return asInt( (pArr?.length || 0), 0 );
        }

        return 0;
    };

    /**
     * Returns true if the length of the specified array (or string, if the third argument is true) is greater than the specified minimum
     * @param pArr
     * @param pMinLength
     * @param pAllowStringArg
     * @returns {boolean}
     */
    const arrLenGt = function( pArr, pMinLength, pAllowStringArg = false )
    {
        const minLength = asInt( pMinLength, 0 ) || 0;

        const len = arrLength( pArr, pAllowStringArg ) || 0;

        return len > minLength;
    };

    /**
     * Returns true if the length of the specified array (or string, if the third argument is true) is greater than or equal to the specified minimum
     * @param pArr
     * @param pMinLength
     * @param pAllowStringArg
     * @returns {boolean}
     */
    const arrLenGtEq = function( pArr, pMinLength, pAllowStringArg = false )
    {
        const minLength = Math.max( 0, Math.max( 0, asInt( pMinLength, 0 ) || 0 ) - 1 );

        return arrLenGt( pArr, minLength, pAllowStringArg );
    };

    /**
     * Returns true if the length of the specified array (or string, if the third argument is true) is less than the specified value
     * @param pArr
     * @param pMaxLength
     * @param pAllowStringArg
     * @returns {boolean}
     */
    const arrLenLt = function( pArr, pMaxLength, pAllowStringArg = false )
    {
        const maxLength = asInt( pMaxLength, 0 ) || 0;

        const len = arrLength( pArr, pAllowStringArg ) || 0;

        return len < maxLength;
    };

    /**
     * Returns true if the length of the specified array (or string, if the third argument is true) is less than or equal to the specified value
     * @param pArr
     * @param pMaxLength
     * @param pAllowStringArg
     * @returns {boolean}
     */
    const arrLenLtEq = function( pArr, pMaxLength, pAllowStringArg = false )
    {
        const maxLength = Math.max( 0, Math.max( 0, asInt( pMaxLength, 0 ) || 0 ) + 1 );

        return arrLenLt( pArr, maxLength, pAllowStringArg );
    };

    /**
     * Returns a deep clone of the specified array.
     * Note that this uses structuredClone, so functions will be omitted
     * @param pArr {*[]} an array to deep-clone
     * @returns {*[]} a new array populated with copies of the elements of the original array
     */
    const copyArray = function( pArr )
    {
        let arr = asArray( pArr || [] );

        let clone = [].concat( ...arr );

        try
        {
            clone = structuredClone( arr ) || clone;
        }
        catch( ex )
        {
            // functions cannot be cloned
            clone = arr.filter( e => !isFunction( e ) );

            try
            {
                clone = structuredClone( clone ) || clone;
            }
            catch( ex2 )
            {
                // functions cannot be cloned
                clone = arr.filter( e => !isFunction( e ) );
            }
        }

        return [].concat( ...clone );
    };

    /**
     * Returns true if the two arrays contain the same elements in the same order
     *
     * @param pArrA the first array
     * @param pArrB the second array
     *
     * @param pTrim (optional) argument to control whether to trim strings prior to comparison
     *              if true, elements of each array that are of type 'string' are compared without regard to leading or trailing whitespace
     *              otherwise, elements of type 'string' are compared for exact match
     *              THE DEFAULT IS TRUE. YOU MUST EXPLICITLY PASS false TO DISABLE THE BEHAVIOR
     *
     * @param pComparator if a valid comparison function is supplied, both arrays will be sorted before checking for equality
     * @returns {boolean} if the 2 arrays contain the same elements in the same order (before or after a potential sort)
     */
    const arraysEqual = function( pArrA, pArrB, pTrim = true, pComparator = null )
    {
        let strip = (false !== pTrim);

        let arrA = asArray( pArrA || [] );
        let arrB = asArray( pArrB || [] );

        if ( !arrA.length === arrB.length )
        {
            return false;
        }

        let comparator = Predicates.IS_COMPARATOR( pTrim ) ? pTrim : Predicates.IS_COMPARATOR( pComparator ) ? pComparator : null;

        if ( Predicates.IS_COMPARATOR( comparator ) )
        {
            arrA = arrA.sort( comparator );
            arrB = arrB.sort( comparator );
        }

        const strA = arrA.map( e => asString( e, strip ).replace( /\//g, "_slash_" ) ).join( "/" );
        const strB = arrB.map( e => asString( e, strip ).replace( /\//g, "_slash_" ) ).join( "/" );

        return strA === strB && ((arrA?.length || 0) === (arrB?.length || 0));
    };

    /**
     * Returns true if the array includes any of the values specified
     * @param pArr {*[]} an array to search
     * @param pSearchFor {...any} one or more values for which to search
     * @returns {boolean} true if the array includes any of the specified values
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
     * @param pArr {any} a value from which to extract a scalar value
     * @param pFromEnd {boolean} specify true to search from the end of the value
     * @param pDepth {number} USED INTERNALLY TO PREVENT INFINITE RECURSION OR STACK OVERFLOW; DO NOT PASS THIS VALUE FROM CONSUMER CODE
     * @returns {*} a scalar value (that is, a number, string, or boolean value) if one can be found within 6 levels of recursion
     */
    const extractScalar = function( pArr, pFromEnd = false, pDepth = 0 )
    {
        let arr = isArray( pArr ) ? asArray( pArr ) : (isObject( pArr ) && !isNull( pArr ) ? Object.values( pArr ) : (isEmptyString( pArr ) ? [pArr] : (isNonNullValue( pArr ) ? [pArr] : [])));

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
     */
    const RANGE_INCREMENT_OPTIONS =
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
     * @param pNum
     * @returns {number}
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
     * @param pNums {...number}
     * @returns {number}
     * @private
     */
    const _findSmallestExponent = function( ...pNums )
    {
        return Math.min( ...(varargs( ...pNums )).map( _findExponent ) );
    };

    /**
     * Calculates the increment used to map the current value to the next value to return
     * @param pValue {number|string} the number or string from which to calculate the increment used by the range function
     * @param pOptions {Object} an object defining the options for the range function, such as inclusive versus exclusive and how to calculate the increment
     * @returns {{increment: (number|number), power: (number|number)}|{increment: *, power: (number|number)}|{increment: number, power: (number|number)}}
     * @private
     */
    const _calculateIncrement = function( pValue, pOptions = DEFAULT_RANGE_OPTIONS )
    {
        const options = populateOptions( pOptions, DEFAULT_RANGE_OPTIONS );

        const rule = options.increment_rule || RANGE_INCREMENT_OPTIONS.DERIVE;

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
            case RANGE_INCREMENT_OPTIONS.SEQUENCE_LENGTH:
                return { increment: sequenceLength, power };

            case RANGE_INCREMENT_OPTIONS.SEQUENCE_PLUS_LAST_SKIP:
                return { increment: sequenceLength + (sequenceLength > 1 ? _calculateLastSkip() : 0) + 1, power };

            case RANGE_INCREMENT_OPTIONS.DERIVE:
            case RANGE_INCREMENT_OPTIONS.INCREMENT:
            default:
                return { increment: Math.pow( 10, power ), power };
        }
    };

    /**
     * This object defines the default options for the range function
     * @type {{inclusive: boolean, increment_rule: number}}
     */
    const DEFAULT_RANGE_OPTIONS =
        {
            inclusive: false,
            increment_rule: RANGE_INCREMENT_OPTIONS.INCREMENT,
        };

    /**
     * This object defines the default options for the range function when it is used to produce a numeric sequence
     * @type {{inclusive: boolean, increment_rule: number}}
     */
    const DEFAULT_NUMERIC_RANGE_OPTIONS =
        {
            ...DEFAULT_RANGE_OPTIONS
        };

    /**
     * This object defines the default options for the range function when it is used to produce a character sequence
     * @type {{inclusive: boolean, increment_rule: number}}
     */
    const DEFAULT_CHARACTER_RANGE_OPTIONS =
        {
            inclusive: true,
            increment_rule: RANGE_INCREMENT_OPTIONS.SEQUENCE_LENGTH,
        };

    /**
     * Returns an iterable that produces values from pFrom to pTo (exclusive by default).
     * The iterable is "lazy",
     * so you can generate extremely large collections of values
     * without consuming the memory the entire collection would require.
     *
     * @param pFrom {number|string} the first value the iterable's iterator should return
     * @param pTo {number|string} the value at which to stop returning values.
     * @param pOptions {Object} an object to specify whether the range is inclusive or exclusive of the 'to' value
     *                          and to define how to increment value to produce the next value in the sequence
     * @returns {{[Symbol.iterator](): Generator<*, void, *>}|{[Symbol.iterator]: (function(): {done: boolean}), value}}
     * @throws IllegalArgumentError if the from and to arguments are not the same type or compatible types (such as number and string, for example)
     *                              or if the values cannot be coerced to the same type
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
         * @param pBounds {[number|string]} an array composed of the from and to values
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
     * @param pArrA the first array
     * @param pArrB the second array
     *
     * @param pTrim (optional) argument to control whether to trim strings prior to comparison
     *              if true, elements of each array that are of type 'string' are compared without regard to leading or trailing whitespace
     *              otherwise, elements of type 'string' are compared for exact match
     *              THE DEFAULT IS TRUE. YOU MUST EXPLICITLY PASS false TO DISABLE THE BEHAVIOR
     *
     * @returns {boolean}
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
     * @param pArrA the first array
     * @param pArrB the second array
     * @param pUnique (optional) parameter to control how to treat duplicated elements
     *                if true, the returned array contains only the unique elements found in the 2 arrays
     *                otherwise, the returned array contains all elements found in the 2 arrays, including any that are duplicated
     * @returns {Array}
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
     * This is the same as calling superset with true as the third argument
     *
     * @param pArrA the first array
     * @param pArrB the second array
     * @returns {Array}
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
                return new Set( union( this, pArr ) );
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
     * @param pArrA the first array
     * @param pArrB the second array
     * @param pUnique (optional) argument to control how to treat duplicates
     *                if true, removes duplicates, returning an array containing only the unique values common to both arrays
     *                otherwise, returned array may contain duplicates
     *
     * @returns {*}
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
     * @param pArrA {[any]} the first array
     * @param pArrB {[any]} the second array
     *
     * @param pUnique {boolean} specify true to remove duplicates from the returned collection
     * @returns {*}
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
     *
     * @param pArr {*[]} an array to modify
     * @param pElem {any} the element to push onto the array
     * @param pLimit {number} the maximum length to which to allow the array to grow, defaults to 100
     * @returns {*[]} the same array with the specified element added and a length that is less than or equal to the limit specified
     *
     * @see BoundedQueue
     * @see AsyncBoundedQueue
     */
    const enQueue = function( pArr, pElem, pLimit = 100 )
    {
        let arr = pArr || [];

        const value = pElem || _mt_str;

        const limit = Math.min( Math.max( 1, asInt( pLimit, ((arr?.length || 2) - 1) ) ), 10_000 );

        const numElements = arr.push( value );

        if ( numElements >= limit )
        {
            arr.shift();
        }

        return arr;
    };

    /** The maximum limit that can be specified for the size of a bounded queue */
    const MAX_QUEUE_SIZE = 32_768;

    /**
     * This class provides a queue (a FIFO data structure) with a limited size.
     *
     * When an element is pushed into the queue (enqueued),
     * the limit is enforced by evicting the oldest element.
     *
     * Do not use this class if every element MUST be processed,
     * unless you can guarantee the size will not be exceeded.
     *
     * Common use cases might include writing messages to a remote log,
     * where writing each message separately would impact performance.
     */
    class BoundedQueue
    {
        constructor( pSize, pArr = [] )
        {
            this._arr = [];

            const desiredLimit = Math.min( Math.max( 1, asInt( pSize, (pArr?.length || pArr?.size) ) ), 65_536 );

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

                this._arr = pArr._arr || [];
            }
            else
            {
                this._arr = [].concat( ...(asArray( pArr ) || []) ) || [];

                this._limit = desiredLimit;
            }
        }

        static get [Symbol.species]()
        {
            return this;
        }

        enQueue( pElem )
        {
            let state = { exceededBounds: false, evicted: null, size: this._arr.length, limit: this._limit };

            if ( pElem )
            {
                this._arr.push( pElem );

                if ( this._arr.length > this._limit )
                {
                    let evicted = this._arr.shift();

                    state.exceededBounds = true;
                    state.evicted = evicted;
                }
            }

            state.size = this._arr.length;

            return lock( state );
        }

        push( pElem )
        {
            const result = this.enQueue( pElem );

            return result?.size || this.size;
        }

        get size()
        {
            return this._arr.length;
        }

        get limit()
        {
            return this._limit;
        }

        isQueued( pElem )
        {
            return this._arr.includes( pElem );
        }

        includes( pElem )
        {
            return this.isQueued( pElem );
        }

        toArray()
        {
            return [].concat( ...(this._arr || []) );
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
                return this._arr.shift();
            }
            throw new Error( "The queue is empty" );
        }

        peek()
        {
            if ( this.size > 0 )
            {
                return this._arr[0];
            }
            return null;
        }

        get state()
        {
            return {
                exceededBounds: (this.size > this.limit),
                evicted: null,
                size: this._arr.length,
                limit: this._limit,
                next: this.peek()
            };
        }

        dequeue()
        {
            return this.take();
        }

        pop()
        {
            return this._arr.pop();
        }

        flush()
        {
            const arr = this.toArray();

            this._arr.length = 0;

            this._arr = [];

            return arr;
        }

        clear()
        {
            this._arr = [];
        }

        shrink( pNewLimit, pEvictNewest )
        {
            const limit = Math.min( Math.max( 1, asInt( pNewLimit, this._arr?.length ) ), 65_536 );

            if ( limit > this._limit )
            {
                this.extend( limit );
            }

            let evicted = [];

            let exceeds = this.size > limit;

            while ( this.size > limit && this.size > 0 )
            {
                evicted.push( pEvictNewest ? this.pop() : this.take() );
            }

            this._limit = limit;

            return {
                exceededBounds: exceeds,
                evicted: ([].concat( evicted )),
                size: this.size,
                limit: this._limit,
                next: this.peek()
            };
        }

        extend( pNewLimit, ...pElems )
        {
            const limit = Math.min( Math.max( 1, asInt( pNewLimit, this._arr?.length ) ), MAX_QUEUE_SIZE );

            this._limit = Math.max( limit, this._limit );

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
    }

    BoundedQueue.create = function( pLimit = 100, ...pArr )
    {
        const limit = Math.min( Math.max( 1, asInt( pLimit, (pArr?.length || pArr?.size) ) ), MAX_QUEUE_SIZE );

        const arr = isArray( pArr ) ? varargs( pArr ) : ((null != pArr && pArr instanceof BoundedQueue) ? pArr : asArray( pArr ));

        return new BoundedQueue( limit, arr );
    };

    /**
     * This is an asynchronous implementation of BoundedQueue
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
            return super.limit;
        }

        async getLimit()
        {
            return this.limit;
        }

        async isQueued( pElem )
        {
            return super.isQueued( pElem );
        }

        async includes( pElem )
        {
            return super.includes( pElem );
        }

        async toArray()
        {
            return super.toArray();
        }

        async canTake()
        {
            return super.canTake();
        }

        async isEmpty()
        {
            return super.isEmpty();
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
    }

    AsyncBoundedQueue.create = function( pLimit = 100, ...pArr )
    {
        const limit = Math.min( Math.max( 1, asInt( pLimit, (pArr?.length || pArr?.size) ) ), MAX_QUEUE_SIZE );

        const arr = isArray( pArr ) ? varargs( pArr ) : ((null != pArr && pArr instanceof BoundedQueue) ? pArr : asArray( pArr ));

        return new AsyncBoundedQueue( limit, arr );
    };

    /**
     * Returns true if there is a non-null element at the specified index
     * @param pArr the array to check for the element at the specified index
     * @param pIndex the index at which to check for a non-null element
     * @returns {boolean} true if there is a non-null element at the specified index
     */
    const hasEntry = function( pArr, pIndex )
    {
        const arr = asArray( pArr || [] ) || [];
        const index = [_num, _big].includes( typeof pIndex ) ? (0 + pIndex) : Number.MAX_SAFE_INTEGER;

        return (index >= 0) && (arr.length > index) && (_ud !== typeof arr[index]);
    };

    const hasElementAt = hasEntry;

    /**
     * Returns the element at the specified index
     * or the specified default value
     * if no element exists at the specified index
     *
     * @param pArr
     * @param pIdx
     * @param pDefault
     * @returns {*}
     */
    const at = function( pArr, pIdx, pDefault )
    {
        const arr = asArray( pArr ) || [];

        const idx = asInt( pIdx );

        const dflt = (_ud === typeof pDefault) ? null : pDefault;

        return ((arr?.length || 0) > idx) ? arr[idx] : dflt;
    };

    const toNonEmptyStrings = function( ...pArr )
    {
        let arr = varargs( ...pArr );
        return TransformerChain.TO_NON_EMPTY_STRINGS.transform( arr );
    };

    const toNonBlankStrings = function( ...pArr )
    {
        let arr = varargs( ...pArr );
        return TransformerChain.TO_NON_BLANK_STRINGS.transform( arr );
    };

    const toTrimmedNonEmptyStrings = function( ...pArr )
    {
        let arr = varargs( ...pArr );
        return TransformerChain.TRIMMED_NON_EMPTY_STRINGS.transform( arr );
    };

    const toTrimmedNonBlankStrings = function( ...pArr )
    {
        let arr = varargs( ...pArr );
        return TransformerChain.TRIMMED_NON_BLANK_STRINGS.transform( arr );
    };

    const toKeys = function( pArr, pAsStrings = false )
    {
        let arr = asArray( pArr || [] ) || [];

        arr = arr.map( ( e, i ) => i );

        return !!pAsStrings ? arr.map( e => asString( _mt_str + e ) ) : arr;
    };

    /**
     * This is the exported module.
     */
    let mod =
        {
            dependencies,
            ARRAY_METHODS,
            varargs,
            immutableVarArgs,
            asArray,
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
            Predicates: lock( Predicates ),
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
            RANGE_INCREMENT_OPTIONS,
            DEFAULT_RANGE_OPTIONS,
            DEFAULT_NUMERIC_RANGE_OPTIONS,
            DEFAULT_CHARACTER_RANGE_OPTIONS,
            range,
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

    mod = modulePrototype.extend( mod );

    return mod.expose( mod, INTERNAL_NAME, (_ud !== typeof module ? module : mod) ) || mod;

}());
