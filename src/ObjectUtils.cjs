/**
 *
 * This module exposes useful methods for working with objects, collections of objects, and classes.
 * Dependencies: Constants, TypeUtils, StringUtils, ArrayUtils, and GUIDUtils
 */
const constants = require( "./Constants.cjs" );
const typeUtils = require( "./TypeUtils.cjs" );
const stringUtils = require( "./StringUtils.cjs" );
const arrayUtils = require( "./ArrayUtils.cjs" );

const guidUtils = require( "./GUIDUtils.cjs" );

/** create an alias for console **/
const konsole = console || {};

/** define a variable for typeof undefined **/
const _ud = constants?._ud || "undefined";

/**
 * This function returns the host environment scope (Browser window, Node.js global, or Worker self)
 */
const $scope = constants?.$scope || function()
{
    return (_ud === typeof self ? ((_ud === typeof global) ? {} : (global || {})) : (self || {}));
};

/**
 * This is the Immediately Invoked Function Expression (IIFE) that builds and returns the module
 */
(function exposeModule()
{
    const me = exposeModule;

    // explicitly define several variables that are imported from the dependencies
    // this is done to help IDEs that cannot infer what is in scope otherwise
    let
        {
            _mt_str = constants?._mt_str || "",
            _mt_chr = constants?._mt_chr || "",
            _dblqt = constants?._dblqt || "\"",
            _colon = constants?._colon || ":",
            _dot = constants?._dot || ".",
            _spc = constants?._spc || " ",
            _str = constants?._str || "string",
            _fun = constants?._fun || "function",
            _obj = constants?._obj || "object",
            _num = constants?._num || "number",
            _big = constants?._big || "bigint",
            _bool = constants?._bool || "boolean",
            _symbol = constants?._symbol || "symbol",
            _underscore = constants?._underscore || "_",
            ignore = function() {},
            IllegalArgumentError = constants?.IllegalArgumentError || Error,
            IterationCap = constants?.IterationCap,
            BUILTIN_TYPES = constants.BUILTIN_TYPES || [],
            REG_EXP_DOT = constants?.REG_EXP_DOT || /\./,
            REG_EXP_LEADING_DOT = constants?.REG_EXP_LEADING_DOT || /^\./,
            REG_EXP_TRAILING_DOT = constants?.REG_EXP_TRAILING_DOT || /\.$/,

            asArray = arrayUtils?.asArray || function( pArr ) { return Array.isArray( pArr ) ? pArr : [pArr]; },
            pruneArray = arrayUtils?.pruneArray || function( pArr ) { return asArray( pArr ).filter( e => !(_ud === typeof e || null === e) ); },
            unique = arrayUtils?.unique || function( pArr ) { return [...(new Set( asArray( pArr ) ))]; },
            hasElementAt = arrayUtils?.hasElementAt || function( pArr, pIndex ) {return asArray( pArr )?.length > asInt( pIndex );},

            AsyncFunction = ((async function() {}).constructor),

            EMPTY_ARRAY = Object.freeze( [] ),
            EMPTY_OBJECT = Object.freeze( {} ),

        } = constants || {};

    // explicitly define several variables that are imported from the dependencies
    // this is done to help IDEs that cannot infer what is in scope otherwise
    let
        {
            isString = typeUtils.isString,
            isUndefined = typeUtils.isUndefined,
            isDefined = typeUtils.isDefined,
            isNull = typeUtils.isNull,
            isNotNull = typeUtils.isNotNull,
            isObject = typeUtils.isObject,
            isCustomObject = typeUtils.isCustomObject,
            isNonNullObject = typeUtils.isNonNullObject,
            isFunction = typeUtils.isFunction,
            isAsyncFunction = typeUtils.isAsyncFunction,
            isNumber = typeUtils.isNumber,
            isNumeric = typeUtils.isNumeric,
            isZero = typeUtils.isZero,
            isBoolean = typeUtils.isBoolean,
            isArray = typeUtils.isArray,
            isMap = typeUtils.isMap,
            isSet = typeUtils.isSet,
            isDate = typeUtils.isDate,
            isRegExp = typeUtils.isRegExp,
            isClass = typeUtils.isClass,
            isUserDefinedClass = typeUtils.isUserDefinedClass,
            isListedClass = typeUtils.isListedClass,
            isInstanceOfUserDefinedClass = typeUtils.isInstanceOfUserDefinedClass,
            isInstanceOfListedClass = typeUtils.isInstanceOfListedClass,
            isSymbol = typeUtils.isSymbol,
            isType = typeUtils.isType,
            instanceOfAny = typeUtils.instanceOfAny

        } = typeUtils || {};

    // explicitly define several variables that are imported from the dependencies
    // this is done to help IDEs that cannot infer what is in scope otherwise
    let
        {
            asString = stringUtils?.asString || function( s ) { return (_mt_str + s).trim(); },
            isBlank = stringUtils?.isBlank || function( s ) { return _mt_str === asString( s ).trim(); },
            asKey = stringUtils.asKey || function( s ) { return (constants._dblqt + asString( s, true ).trim() + constants._dblqt); },
            lcase = stringUtils?.lcase || function( s ) { return asString( s ).toLowerCase(); },
            ucase = stringUtils?.ucase || function( s ) { return asString( s ).toUpperCase(); },
            isValidNumber = stringUtils?.isValidNumber || function( n ) { return !(/[^_\d.]+/.test( asString( n ) )); },
            asInt = stringUtils?.asInt || function( s ) { return parseInt( asString( s ).replace( /\..*/, _mt_str ).replace( /\D/g, _mt_str ) ); },
            evaluateBoolean = stringUtils.evaluateBoolean,
            toBool = stringUtils.toBool
        } = stringUtils || {};

    /**
     * An array of the names of the methods exposed by Array
     * @type {string[]}
     */
    let ARRAY_METHODS = arrayUtils.ARRAY_METHODS;

    // Make the functions and properties of the imported modules local variables and functions.
    constants.importUtilities( (this || me), constants, typeUtils, stringUtils, arrayUtils );

    // defines a key we can use to store this module in global scope
    const INTERNAL_NAME = "__BOCK__OBJECT_UTILS__";

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
            stringUtils,
            arrayUtils,
            guidUtils
        };

    /**
     * Defines the maximum length of a branch of an object graph that will be cloned when copying an object.
     * example:
     *          cloning this ->  {a: { b: { c: {d: {e: { f: {g: "exceeds maximum"} } } } } } }
     *          returns this ->  {a: { b: { c: {d: {e: { f: null } } } } } }
     * @type {number}
     */
    const MAX_CLONE_DEPTH = 6;

    /**
     * Defines the maximum length of a branch of an object graph that will be assigned when using ObjectUtils.assign
     * ObjectUtils assign perform a DEEP Object::assign for each property of the source that is an object.
     * example:
     *          cloning this ->  {a: { b: { c: {d: {e: { f: {g: "exceeds maximum"} } } } } } }
     *          returns this ->  {a: { b: { c: {d: {e: { f: null } } } } } }
     * @type {number}
     */
    const MAX_ASSIGN_DEPTH = 6;

    /**
     * An array of the names of the methods exposed by Object
     * @type {string[]}
     */
    const OBJECT_METHODS =
        [
            "constructor",
            "prototype",
            "__proto__",
            "hasOwnProperty",
            "isPrototypeOf",
            "propertyIsEnumerable",
            "toString",
            "valueOf",
            "toLocaleString",
            "__defineGetter__",
            "__defineSetter__",
            "__lookupGetter__",
            "__lookupSetter__",
            "isIdenticalTo",
            "equals"
        ];

    /**
     * An array of property names that are never included in calls to getProperties, getKeys, getValues, or getEntries
     * @type {Readonly<string[]>}
     */
    const ALWAYS_EXCLUDED = Object.freeze( ["uniqueObjectId",
                                            "instantiationTimestamp",
                                            "_uniqueObjectId",
                                            "_instantiationTimestamp",
                                           ] );


    /**
     * An array of property names that are excluded in calls to getProperties, getKeys, getValues, or getEntries
     * @type {string[]}
     */
    const EXCLUDED_PROPERTIES = [].concat( OBJECT_METHODS ).concat( ARRAY_METHODS ).concat( ALWAYS_EXCLUDED );

    // does nothing, on purpose
    const no_op = function() {};

    // a filter to return only strings containing at least one non-whitespace character
    const NON_BLANK_STRINGS = e => (_str === typeof e && _mt_str !== e.trim());

    /**
     * An array of the Number constants
     * @type {string[]}
     */
    const NumberProperties = ["EPSILON",
                              "MAX_SAFE_INTEGER",
                              "MAX_VALUE",
                              "MIN_SAFE_INTEGER",
                              "MIN_VALUE",
                              "NaN",
                              "NEGATIVE_INFINITY",
                              "POSITIVE_INFINITY"];

    /**
     * This function attempts to detect potential infinite loops.
     * The first argument is an array that holds strings indicative of some operation or step that has been called recursively
     * The second argument is the number of contiguous operations that, if repeated as a sequence, might indicate an infinite loop
     * The third argument is the number of times a sequence of contiguous operations must be found before being considered to be in an infinite loop
     *
     * Example: ["a", "b", "c", "d", "e", "b", "c", "a", "b", "c", "d", "a", "b", "c", "d"] - starts to repeat at index 7, and repeats 2 times
     *
     * @param {Array<string>} pStack an array of operations or paths representing a sequence of function calls or elements processed
     * @param {Number} pRunLength the number of contiguous elements to consider a sequence
     * @param {Number} pMaxRepetitions the maximum number of times a sequence of run-length operations can appear before being considered a repeating/infinite loop
     * @returns true if cycling
     */
    const detectCycles = function( pStack, pRunLength = 5, pMaxRepetitions = 3 )
    {
        /**
         * The list of operations to evaluate
         */
        const _stack = [].concat( pStack || [] );

        /**
         * The length of a single sequence
         */
        let runLength = stringUtils.asInt( pRunLength || 3 );

        /**
         * The maximum number of times a sequence can repeat before this function will return true
         */
        let maxRepeats = stringUtils.asInt( pMaxRepetitions || 3 );

        // if the list of operations
        // isn't even as long as it would have to be
        // to contain > maximum repetitions, return false
        if ( _stack.length < (runLength * maxRepeats) )
        {
            return false;
        }

        // an array to hold the sequences
        let runs = [];

        /**
         * Using a nested loop algorithm...
         *
         * To account for the possibility
         * that there is a repeating sequence that is LONGER than the runLength specified,
         * we have an outer loop that increases the runLength by 1
         *
         * In the next-most inner loop,
         * we stagger the start index into the array by 1
         * each time we iterate the next-most-outer loop
         *
         * Within the innermost loop,
         * we get the number of elements for each sequence
         * and create a string we can compare to other sequences
         * then compare and count repetitions, returning true if we reach or exceed
         * the maximum number of repetitions of a sequence
         */
        while ( runLength <= _stack.length / maxRepeats )
        {
            for( let j = 0, m = _stack.length; j < m; j++ )
            {
                for( let i = 0, n = _stack.length; i < n; i += runLength )
                {
                    let start = i + j;

                    runs.push( asString( (_stack.slice( start, Math.min( start + runLength, _stack.length ) ).join( "*" )), true ) );
                }

                if ( runs.length < maxRepeats )
                {
                    return false;
                }

                let repetitions = 1; // the first instance counts

                for( let i = 0, n = runs.length - 1; i < n; i++ )
                {
                    repetitions += ((runs[i] === runs[i + 1]) ? 1 : 0);
                }

                if ( repetitions >= maxRepeats )
                {
                    return true;
                }

                runs.length = 0;
            }

            runLength += 1;
        }

        return false;
    };

    /**
     * Returns true if the specified value is an object with no meaningful properties.
     * Returns false if the specified value is null or undefined.
     * If the second argument is true, will also return true for empty or whitespace-only strings
     * @param pObject the value to evaluate
     * @param pTreatStringsAsObjects a boolean value that indicates whether to return true for empty strings
     * @returns {boolean} true if the specified value is an object with no meaningful properties
     */
    const isEmptyObject = function( pObject, pTreatStringsAsObjects = false )
    {
        if ( (isObject( pObject ) && !isNull( pObject )) || (isString( pObject ) && !!pTreatStringsAsObjects) )
        {
            return (pTreatStringsAsObjects ? ((_str === typeof pObject && _mt_str === pObject.trim())) : false) ||
                   !isNonNullObject( pObject, !!!pTreatStringsAsObjects ) ||
                   (isObject( pObject ) && !isPopulated( pObject ));
        }
        return false;
    };

    /**
     * Returns true if the specified value is either null or an object with no meaningful properties.
     * If the second argument is true, will also return true for empty or whitespace-only strings
     * @param pObject the value to evaluate
     * @param pTreatStringsAsObjects a boolean value that indicates whether to return true for empty strings
     * @returns {boolean} true if the specified value is null or an object with no meaningful properties
     */
    const isNullOrEmpty = function( pObject, pTreatStringsAsObjects = false )
    {
        if ( isObject( pObject ) || (isString( pObject ) && !!pTreatStringsAsObjects) )
        {
            return isNull( pObject ) || isEmptyObject( pObject, pTreatStringsAsObjects );
        }
        return false;
    };

    /**
     * Returns true if the specified object is either null, undefined, or a number that is not valid or not finite.
     * If the second argument is true, will also return true for empty or whitespace-only strings
     * @param pObject the value to evaluate
     * @param pTreatStringsAsObjects a boolean value that indicates whether to return true for empty strings
     * @returns {boolean} true if the value is null, undefined, or NaN (or one of the Infinity values)
     */
    const isNullOrNaN = function( pObject, pTreatStringsAsObjects = false )
    {
        return isNull( pObject, !pTreatStringsAsObjects ) || (isNumber( pObject ) && (isNaN( pObject ) || !isFinite( pObject )));
    };

    /**
     * Returns true if the specified (expected) value is null, undefined, NaN, or empty.
     * If the second argument is true, will also return true for empty or whitespace-only strings
     * @param pObject the value to evaluate
     * @param pTreatStringsAsObjects a boolean to indicate whether to return true for empty strings
     * @returns {boolean} if the specified (expected) value is null, undefined, NaN, or empty
     *
     * Note: this is useful in validating the expected arguments to a function
     */
    const isMissing = function( pObject, pTreatStringsAsObjects = false )
    {
        return isNull( pObject, !pTreatStringsAsObjects ) ||
               isNullOrEmpty( pObject, pTreatStringsAsObjects ) ||
               isNullOrNaN( pObject );
    };

    /**
     * Returns the name of the class of which the specified object is an instance
     * or the name of the class if the specified value *is* a class (function)
     * @param pObject an instance of some class or a function that is a class
     * @returns {string} the name of the class of which the object is an instance or the name of the class if the object is a class function
     */
    const getClassName = function( pObject )
    {
        const obj = pObject || {};

        let name = _mt_str;

        if ( obj )
        {
            if ( isClass( obj ) )
            {
                name = asString( obj.name || asString( obj.constructor ) );
            }

            if ( isBlank( name ) )
            {
                name = asString( obj?.constructor?.name || obj?.prototype?.constructor?.name || obj?.prototype?.name );
            }
        }

        return name;
    };

    /**
     * Returns the class (function) of which the specified object is an instance
     * or the class itself if the specified value *is* a class (function)
     * @param pObject an instance of some class or a function that is a class
     * @param pOptions an object to pass options to the isClass method of TypeUtils
     * @returns {string} the class of which the object is an instance or the class itself if the object is a class function
     */
    const getClass = function( pObject, pOptions = { strict: true } )
    {
        const options = Object.assign( {}, pOptions || {} );

        const obj = pObject || {};

        let clazz = isClass( obj, options ) ? obj : obj?.constructor || obj?.prototype?.constructor || obj?.prototype || obj?.__proto__;

        if ( isClass( clazz, options ) )
        {
            return clazz;
        }

        if ( obj )
        {
            if ( isClass( obj, options?.strict ) )
            {
                clazz = obj;
            }

            if ( isClass( clazz, options?.strict ) )
            {
                return clazz;
            }

            let _class = clazz;

            const loopCap = new IterationCap( 5 );

            // the IterationCap object will return reached when iterations exceed the cap,
            // so ignore the linter warnings
            // noinspection LoopStatementThatDoesntLoopJS
            while ( !isClass( _class, options?.strict ) && !loopCap.reached )
            {
                const tries = loopCap.iterations;

                switch ( tries )
                {
                    case 0:
                    case 1:
                        _class = (obj.constructor || obj?.prototype?.constructor) || _class;
                        break;

                    case 2:
                        _class = (obj?.prototype?.constructor || isClass( obj?.prototype, options?.strict ) ? obj?.prototype : _class);
                        break;

                    case 3:
                        _class = isClass( obj?.prototype, options?.strict ) ? obj?.prototype : _class;
                        break;

                    case 4:
                        _class = isClass( obj?.__proto__, options?.strict ) ? obj?.__proto__ : _class;
                        break;

                    default:
                        break;
                }
            }

            return (isClass( _class, options?.strict ) ? _class : (isClass( clazz, options?.strict ) ? clazz : (isClass( clazz ) ? clazz : Object))) || Object;
        }

        return clazz;
    };

    /**
     * Returns a new object with the same properties that is also an instance of the specified class
     * @param pObject an object from which to create the new instance
     * @param pClass the class to use for the new object
     * @returns {*} a new object with the same properties that is also an instance of the specified class
     */
    const convertToInstanceOf = function( pObject, pClass )
    {
        const clazz = isClass( pClass ) ? pClass : getClass( pClass || pObject ) || getClass( pObject );

        let object = Object.assign( {}, pObject || {} );

        object.__proto__ = clazz.prototype;

        let newObject = new clazz();

        Object.assign( newObject, object );

        return newObject;
    };

    /**
     * This function returns a unique identifier that can be assigned to an an object in its constructor.
     * It is useful for debugging when an object is unintentionally aliased or copied.
     * @param pObject the object to which to assign the uniqueId
     * @param pClass the class of the object
     * @param pTimestamp a number derived from a valid Date, defaults to NOW
     * @returns {string} a unique string identifying the specific instance of the object
     */
    const generateUniqueObjectId = function( pObject, pClass, pTimestamp = new Date() )
    {
        let uniqueId = pObject?.uniqueObjectId || pObject?._uniqueObjectId;

        if ( isBlank( asString( uniqueId, true ) ) )
        {
            const clazz = isClass( pClass ) ? pClass : getClass( pClass || pObject ) || getClass( pObject );

            if ( pObject && isObject( pObject ) )
            {
                if ( clazz && isClass( clazz ) )
                {
                    if ( pTimestamp && pTimestamp > 0 )
                    {
                        const tsString = asString( pTimestamp, true );

                        let newUid = _mt_str;

                        const guid = guidUtils.guid();

                        for( let i = 0, j = 0, n = guid?.length; i < n; i++, j++ )
                        {
                            const char = guid.charAt( i );

                            newUid += (char + (tsString?.length > j ? tsString.charAt( j ) : guid.charAt( j - 1 )));
                        }

                        const alphas = "ZYXWVUTSRQPONMLKJIHGFEDCBA";

                        newUid += ((asString( pClass?.name, true ) + alphas) || alphas).slice( asInt( tsString.charAt( tsString.length - 4 ) ), 1 );

                        uniqueId = asString( newUid, true );
                    }
                }
            }
        }

        return asString( uniqueId, true );
    };

    /**
     * This class wraps the 2-element arrays returned from Object.entries,
     * so we can treat them like objects with a key and a value property instead of an array.
     * This class extends Array, so it retains all of the functionality normally available for Object entries
     */
    class ObjectEntry extends Array
    {
        #key;
        #value;
        #type;

        constructor( ...pArgs )
        {
            super( ...pArgs );

            this.#key = _mt_str;
            this.#value = null;

            if ( isArray( pArgs ) )
            {
                const args = asArray( pArgs );

                this.#key = (args?.length || 0) > 0 ? args[0] : this[0] || _mt_str;
                this.#value = (args?.length || 0) > 1 ? args[1] || this[1] : this[1];
            }

            this.#type = typeof this.#value;

            Object.defineProperty( this,
                                   "uniqueObjectId",
                                   {
                                       configurable: false,
                                       enumerable: false,
                                       writable: false,
                                       value: generateUniqueObjectId( this, this.constructor, new Date().getTime() )
                                   } );
        }

        get key()
        {
            return this.#key || (this.length > 0 ? this[0] : _mt_str);
        }

        get value()
        {
            return this.#value;
        }

        get type()
        {
            return this.#type;
        }

        /**
         * Returns true if the value property of this entry is null or undefined
         * @returns {*}
         */
        isEmpty()
        {
            return isEmptyValue( this.value );
        }

        /**
         * Returns true if this entry has a string key and a defined/non-null value
         * @returns {*|boolean}
         */
        isValid()
        {
            return isString( this.key ) && !(_ud === typeof this.value || null === this.value);
        }
    }

    /**
     * Defines a constant for an invalid entry
     * @type {Readonly<ObjectEntry>}
     */
    ObjectEntry.INVALID_ENTRY = Object.freeze( new ObjectEntry() );

    /**
     * Returns true if the specified value(s) represent a valid ObjectEntry
     * @param pEntry an ObjectEntry -- or -- a string representing the key for the entry
     * @param pValue (optional) the value property of the entry (or omitted if the first argument is an instance of ObjectEntry)
     * @returns {boolean} true if the specified value(s) represent a valid ObjectEntry
     */
    const isValidEntry = function( pEntry, pValue = undefined )
    {
        let entry = (isString( pEntry ) ? new ObjectEntry( pEntry, pValue ) : (isObject( pEntry ) && pEntry instanceof ObjectEntry) ? pEntry : ObjectEntry.INVALID_ENTRY);

        const key = asString( entry?.key || asString( pEntry, true ), true );

        const value = entry?.value;

        return !isBlank( key ) && !(_ud === typeof value || null === value);
    };

    /**
     * Returns an array of the unique property keys of the objects specified,
     * including those inherited from their prototype or superclass
     * @param pObject one or more objects whose keys will be returned
     * @returns {Readonly<*[]>|*[]} an array of the unique property keys of the objects specified
     */
    const getKeys = function( ...pObject )
    {
        // filter out empty objects and non-objects
        let objects = [].concat( asArray( pObject ) || [] ).filter( arrayUtils.Filters.IS_POPULATED_OBJECT );

        // return an empty array if there are no objects left after applying the filter
        if ( null == objects || ((objects?.length || 0) <= 0) )
        {
            return Object.freeze( [] );
        }

        let keys = [];

        for( let object of objects )
        {
            let obj = isObject( object ) ? object : {};

            keys = keys.concat( (Object.keys( obj || {} ) || []) );

            let proto = obj?.prototype;

            const iterationCap = new IterationCap( 10 );

            while ( null != proto && proto !== Object && proto !== obj && !iterationCap.reached )
            {
                keys = keys.concat( getKeys( proto ) ).map( e => asString( e, true ) ).filter( NON_BLANK_STRINGS );

                obj = proto;

                proto = proto?.__proto__ || proto?.prototype;
            }

            keys = unique( pruneArray( keys ) ).filter( e => !EXCLUDED_PROPERTIES.includes( e ) );
        }

        return Object.freeze( unique( pruneArray( keys || [] ) ) );
    };

    /**
     * Returns the names of any properties declared as #private in an object's class.
     * This is done by parsing the source of the class function to find accessor methods.
     * Therefore, write-only properties,
     * or properties defined via Object::defineProperty are not (necessarily) returned
     * @param pObject an object from which to collect the names of properties declared private
     * @returns {string[]}
     * @private
     */
    const _getPrivateProperties = function( pObject )
    {
        let properties = [];

        let clazz = getClass( pObject );

        let source = isClass( clazz ) ? Function.prototype.toString.call( clazz || {} ) : (pObject || (function() {})).toString();

        let rx = /(get +(\w+)\( *\))|(#(\w)[;\r\n,])/;

        let matches = rx.exec( source );

        while ( matches && matches?.length > 2 && source?.length > 4 )
        {
            let match = matches[2];

            properties.push( match );

            source = source.slice( matches.index + match.length + 4 );

            matches = rx.exec( source );
        }

        return [].concat( (properties || []).filter( e => !EXCLUDED_PROPERTIES.includes( e ) ) || [] );
    };

    /**
     * Returns an array of the unique property names of the objects specified,
     * including those inherited from their prototype or superclass
     * @param pObject one or more objects whose keys will be returned
     * @returns {Readonly<*[]>|*[]} an array of the unique property names of the objects specified
     */
    const getProperties = function( ...pObject )
    {
        let objects = [].concat( asArray( pObject ) || [] ).filter( arrayUtils.Filters.IS_OBJECT );

        if ( null == objects || ((objects?.length || 0) <= 0) )
        {
            return [];
        }

        let keys = [].concat( getKeys( ...pObject ) || [] );

        let properties = [].concat( unique( pruneArray( keys ) ) );

        for( let object of objects )
        {
            let propertyNames = Object.getOwnPropertyNames( object || {} );

            propertyNames = propertyNames.concat( _getPrivateProperties( object ) || [] );
            propertyNames = propertyNames.filter( e => !e.startsWith( "__" ) );

            const proto = object?.__proto__ || object?.prototype;

            if ( null != proto && !(([object].concat( BUILTIN_TYPES )).includes( proto )) )
            {
                propertyNames = propertyNames.concat( getProperties( proto ) ).map( e => asString( e, true ) ).filter( NON_BLANK_STRINGS );
                propertyNames = propertyNames.filter( e => !e.startsWith( "__" ) );
            }

            properties = unique( properties.concat( propertyNames || [] ) );
        }

        properties = properties.filter( NON_BLANK_STRINGS ).map( e => asString( e, true ).trim() );
        properties = properties.filter( e => !EXCLUDED_PROPERTIES.includes( e ) );

        return Object.freeze( unique( pruneArray( properties ) ) );
    };


    /**
     * Returns an array of the unique property values of the objects specified,
     * including those inherited from their prototype or superclass
     * @param pObject one or more objects whose values will be returned
     * @returns {Readonly<*[]>|*[]} an array of the unique property values of the objects specified
     */
    const getValues = function( ...pObject )
    {
        let objects = [].concat( asArray( pObject ) || [] ).filter( arrayUtils.Filters.IS_OBJECT );

        if ( null == objects || ((objects?.length || 0) <= 0) )
        {
            return [];
        }

        let values = [];

        for( let object of objects )
        {
            const properties = getProperties( object );

            for( let property of properties )
            {
                try
                {
                    const value = object[property] || getProperty( object, property );

                    if ( !(_ud === typeof value || null === value || isClass( value )) )
                    {
                        values.push( value );
                    }
                }
                catch( ex )
                {
                    // ignore
                }
            }
        }

        return Object.freeze( unique( pruneArray( values || [] ) ) );
    };


    /**
     * Returns an array of the entries of the objects specified,
     * including those inherited from their prototype or superclass.
     *
     * This is the null-safe equivalent of calling Object::entries on each object and concatenating the results.
     *
     * @param pObject one or more objects whose entries will be returned
     * @returns {Readonly<*[]>|*[]} an array of the entries of the objects specified
     */
    const getEntries = function( ...pObject )
    {
        let objects = [].concat( asArray( pObject ) || [] ).filter( arrayUtils.Filters.IS_OBJECT );

        if ( null == objects || ((objects?.length || 0) <= 0) )
        {
            return [];
        }

        let entries = [];

        for( let object of objects )
        {
            const properties = getProperties( object );

            for( let property of properties )
            {
                const value = object[property] || getProperty( object, property );

                if ( !(_ud === typeof value || null === value) )
                {
                    entries.push( [property, value] );
                }
            }

            entries = entries.filter( e => isArray( e ) && ((e?.length || 0) > 1) );
        }

        entries = ((entries || []).filter( e => isArray( e ) && ((e?.length || 0) > 1) ));

        entries = entries.map( entry => new ObjectEntry( ...entry ) );

        return Object.freeze( entries );
    };

    /**
     * Returns true if the object has no properties
     * whose value is a scalar or an object with properties that satisfy the same conditions
     * @param pObject an object to evaluate
     * @param pOptions an object to define whether (and how deep) to recursively check for valid properties
     * @returns {boolean} true if the object has no populated properties
     */
    const hasNoProperties = function( pObject, pOptions = { recursive: true } )
    {
        const options = Object.assign( {}, pOptions || { recursive: true } );

        const shallow = false === options.recursive;

        if ( _ud === typeof pObject || _obj !== typeof pObject || null === pObject )
        {
            return true;
        }

        const arr = getProperties( pObject );

        if ( shallow )
        {
            return (arr?.length || 0) <= 0;
        }

        let result = true;

        for( let propertyName of arr )
        {
            let value = getProperty( pObject, propertyName );

            if ( !isEmptyValue( value, { recursive: !shallow } ) )
            {
                result = false;
                break;
            }
        }

        return result;
    };

    /**
     * Returns true if the specified value is
     * undefined,
     * null,
     * a string containing only whitespace characters,
     * an object with no properties,
     * or an array with no non-empty elements.
     *
     * CAUTION: there is a potential to enter an infinite loop if an empty object graph is self-referential (RARE)
     *
     * @param pValue a value to evaluate
     * @param pOptions an object to define options related to recursion
     * @returns {boolean|*} true if the value is "empty"
     */
    const isEmptyValue = function( pValue, pOptions = { recursive: true } )
    {
        const options = Object.assign( {}, pOptions || { recursive: true } );

        return _ud === typeof pValue ||
               null === pValue ||
               isBlank( asString( pValue, true ) ) ||
               (isObject( pValue ) && hasNoProperties( pValue, options )) ||
               (isArray( pValue ) && ((pValue?.length || 0) <= 0 || hasNoProperties( pValue, options )));
    };

    const DEFAULT_IS_POPULATED_OPTIONS = { validTypes: [_obj], minimumKeys: 1, acceptArrays: false };

    /**
     * Returns true if the specified value is
     *
     * an object with at least n non-empty properties
     * (where n is the value specified in the options argument or 1)
     * and (optionally) having the specified keys
     *
     * or
     *
     *  DEPENDING ON VALUES PASSED IN THE OPTIONS ARGUMENT:
     *
     *  an array with at least n non-null, non-empty elements
     *  (where n is the value specified in the options argument or 1) or
     *
     *
     *  a valid number or
     *  a boolean or
     *  a function or
     *  a non-empty string
     *
     * @param pObject a value to evaluate
     * @param pOptions an object defining optional characteristics the value must satisfy
     *                 validTypes: an array of types to accept (defaults to ["object"]
     *                 minimumKeys: an integer defining how many properties an object must have
     *                              (or elements a pruned array must have)
     *                              defaults to 1
     *                 acceptArrays: whether to return true if the evaluated value is an array
     *                               defaults to false
     * @returns {*|boolean}
     */
    const isPopulated = function( pObject, pOptions = DEFAULT_IS_POPULATED_OPTIONS )
    {

        let opts = Object.assign( {}, (pOptions || DEFAULT_IS_POPULATED_OPTIONS) );

        const validTypes = [_obj].concat( ...(opts.validTypes || EMPTY_ARRAY) );

        if ( _ud === typeof pObject || null === pObject || !(validTypes.includes( typeof pObject )) )
        {
            return false;
        }

        const minimumKeys = Math.max( 1, (opts.minimumKeys || 1) );

        let mandatoryKeys = [].concat( ...(opts?.manadatoryKeys || [opts?.mandatoryKey || _mt_str]) );
        mandatoryKeys = (mandatoryKeys && mandatoryKeys.length > 0) ? mandatoryKeys.filter( NON_BLANK_STRINGS ) : EMPTY_ARRAY;

        switch ( typeof pObject )
        {
            case _obj:
                if ( isArray( pObject ) )
                {
                    return opts?.acceptArrays && arrayUtils.pruneArray( pObject || [] ).length >= minimumKeys;
                }

                if ( hasNoProperties( pObject ) )
                {
                    return false;
                }

                if ( getProperties( pObject ).length >= minimumKeys )
                {
                    let populated = true;

                    if ( mandatoryKeys && mandatoryKeys.length > 0 )
                    {
                        for( const key of mandatoryKeys )
                        {
                            if ( !isBlank( key ) && !(key in pObject) )
                            {
                                populated = false;
                                break;
                            }
                        }
                    }

                    return populated;
                }
                break;

            case _fun:
                return true;

            case _str:
                return _mt_str !== pObject && pObject.length >= minimumKeys;

            case _bool:
                return true;

            case _num:
            case _big:
                return isValidNumber( pObject );

            default:
                return pObject;
        }

        return false;
    };

    /**
     * Returns true if the specified value is a non-null object with at least one key
     * @param pObject
     * @returns {*|boolean}
     */
    const isValidObject = function( pObject )
    {
        return isNonNullObject( pObject ) && getKeys( pObject ).length > 0;
    };

    /**
     * Returns the first value specified that is a valid object
     * @param pObject
     * @returns {null}
     */
    const firstValidObject = function( ...pObject )
    {
        let object = null;

        let objects = asArray( pObject || [] );

        if ( null == objects || (objects?.length || 0) <= 0 )
        {
            return object;
        }

        while ( (null === object || !isValidObject( object )) && objects.length > 0 )
        {
            object = objects.shift();
        }

        return object;
    };


    /**
     * Returns the first value specified that is a populated object, as per the criteria
     * @param pCriteria an object to pass options to the isPopulated function used internally
     * @param pObject one or more values that might be populated objects
     * @returns {object} the first object satisfying the criteria
     * @see isPopulated
     */
    const firstPopulatedObject = function( pCriteria, ...pObject )
    {
        const options = Object.assign( {}, pCriteria || {} );

        let object = null;

        let objects = asArray( pObject || [] );

        if ( null == objects || (objects?.length || 0) <= 0 )
        {
            return object;
        }

        while ( (null === object || !isPopulated( object, options )) && objects.length > 0 )
        {
            object = objects.shift();
        }

        if ( null !== object && isPopulated( object, options ) )
        {
            return object;
        }

        return null;
    };

    /**
     * Returns the value of a property compensating for a naming convention
     * by which class members are prefixed with an _ (underscore)
     * and using the regular name for the setter/getter pair
     * or for read-only properties
     * @param {Object} pObject
     * @param {String} pPropertyName
     * @returns
     */
    const getProperty = function( pObject, pPropertyName )
    {
        // convert anything that could have been passed as a property name into something we can process
        let prop = (asString( _str === typeof pPropertyName ? pPropertyName : (isValidObject( pPropertyName ) ? (Array.isArray( pPropertyName ) ? pPropertyName.join( _dot ) : _mt_str) : _mt_str) )).trim();

        // if there is missing or blank property name,
        // anonymous properties either do not exist or are not supported
        if ( isBlank( prop ) )
        {
            return undefined;
        }

        // convert the object passed into an object we can interrogate
        let obj = isObject( pObject ) ? (isArray( pObject ) ? pObject || EMPTY_ARRAY : pObject || EMPTY_OBJECT) : pObject;

        switch ( typeof obj )
        {
            case _ud:
                return undefined;

            case _num:
            case _big:
                if ( NumberProperties.includes( ucase( prop ) ) )
                {
                    return Number[ucase( prop )];
                }
                return obj;

            case _str:
                if ( lcase( prop ) === "length" )
                {
                    return obj?.length || 0;
                }
                return obj;

            case _bool:
                return obj;

            case _fun:
                if ( ["length", "name", "prototype"].includes( lcase( prop ) ) || obj[prop] )
                {
                    return obj[prop];
                }
                return obj;

            default:
                break;
        }

        if ( isArray( obj ) && (/^\d+$/.test( prop ) || ["length"].includes( prop )) )
        {
            return obj[stringUtils.asInt( prop )];
        }

        // trim the property name again...
        let propertyName = prop.trim();

        // the regular expression is used to convert array bracket access into dot property access
        const rx = /\[\d+]/g;

        // convert something like arr[0][0][0] into arr.0.0.0,
        // taking advantage of the fact that arrays are really just objects whose properties look like integers
        propertyName = rx.test( propertyName ) ? propertyName.replace( /\[(\d+)]/g, ".$1" ) : propertyName;

        // remove any leading or trailing dots, because those would be missing or empty property names
        propertyName = propertyName.replace( REG_EXP_LEADING_DOT, _mt_str ).replace( REG_EXP_TRAILING_DOT, _mt_str );

        let propertyValue = obj[propertyName];

        // this statement accounts for a convention of using _ as a prefix for the private property name
        if ( null === propertyValue || _ud === typeof propertyValue )
        {
            propertyValue = obj["_" + propertyName];
        }

        // if this is a normal property name (not a path like a.b.c or a[0][1][2]) and we have a value, we return it
        let found = !propertyName.includes( _dot ) && ((null !== propertyValue && (_ud !== typeof propertyValue)) || isNumber( propertyValue ) || isBoolean( propertyValue ));

        if ( found )
        {
            return propertyValue;
        }

        if ( !propertyName.includes( _dot ) )
        {
            let propertyDescriptor = Object.getOwnPropertyDescriptor( obj, propertyName );

            let accessorMethod = (_ud !== typeof propertyDescriptor && null != propertyDescriptor) ? propertyDescriptor?.get : null;

            propertyValue = (_ud !== typeof propertyDescriptor && null != propertyDescriptor) ? propertyDescriptor?.value : undefined;

            if ( accessorMethod )
            {
                try
                {
                    let value = accessorMethod.call( obj ) || propertyValue;

                    if ( value || (([_num, _big].includes( typeof value ) || isNumber( value )) && 0 === value) || (isString( value )) )
                    {
                        propertyValue = value;
                        found = true;
                    }
                }
                catch( ex )
                {
                    // ignore, we'll try other means of getting the value
                }
            }
        }

        if ( !found )
        {
            let accessor = obj["get" + stringUtils.toProperCase( propertyName ).replace( /\.\w+/g, _mt_str )];

            if ( _fun === typeof accessor )
            {
                propertyValue = accessor.call( obj ) || propertyValue;
            }

            if ( !(_ud === typeof propertyValue || null === propertyValue) )
            {
                return propertyValue;
            }

            if ( propertyName.includes( _dot ) )
            {
                let keys = propertyName.split( REG_EXP_DOT );

                while ( (_obj === typeof obj) && keys?.length )
                {
                    let key = keys.shift();
                    obj = obj[key] || obj["_" + key] || getProperty( obj, key );
                    found = (_obj !== typeof obj) && (asString( obj )?.length || 0) > 0;
                }
            }
        }

        let returnValue = found ? obj : (obj[propertyName]);

        return (!(_ud === typeof returnValue || null === returnValue) ? returnValue : _mt_str);
    };

    /**
     * Returns true if the specified object has the specified property
     * @param pObject the object to check for the existence of the property
     * @param pName the property name/key for which to check
     * @param pOnlyOwn boolean indicating whether to climb the prototype chain
     * @param pStrict boolean to indicate whether to check for _pName as a property
     * @returns {boolean|boolean|*} true if the specified object has the specified property
     */
    const hasProperty = function( pObject, pName, pOnlyOwn = false, pStrict = false )
    {
        if ( isMissing( pObject ) )
        {
            return false;
        }

        const name = asString( pName, true );

        if ( Object.hasOwn( pObject, name ) || ( !!!pStrict && Object.hasOwn( pObject, ("_" + name) )) )
        {
            return true;
        }

        if ( !!!pOnlyOwn )
        {
            if ( name in pObject || ( !!!pStrict && (("_" + name) in pObject)) )
            {
                return true;
            }
        }

        if ( name.includes( _dot ) || (name.includes( "[" ) && name.includes( "]" )) )
        {
            const rx = /\[\d+]/g;

            // convert something like arr[0][0][0] into arr.0.0.0,
            // taking advantage of the fact that arrays are really just objects whose properties look like integers
            let propertyName = rx.test( name ) ? name.replace( /\[(\d+)]/g, ".$1" ) : name;

            propertyName = propertyName.replace( REG_EXP_LEADING_DOT, _mt_str ).replace( REG_EXP_TRAILING_DOT, _mt_str );

            let path = propertyName.split( REG_EXP_DOT ) || [propertyName];

            let obj = pObject || EMPTY_OBJECT;

            for( let i = 0, n = path.length - 1; i < n; i++ )
            {
                obj = getProperty( obj, path[i] );

                if ( isMissing( obj ) )
                {
                    return false;
                }
            }

            return hasProperty( obj, path[path.length - 1], pOnlyOwn, pStrict );
        }

        return false;
    };

    /**
     * If possible, changes the value of the specified property to the specified value
     * @param pObject the object whose property is to be updated
     * @param pPropertyPath the proerty name or path to the property to change
     * @param pValue the value to assign to the specified property
     * @param pOptions options to control subtle behavior for edge cases
     * @returns {*} the value of the object property
     */
    const setProperty = function( pObject, pPropertyPath, pValue, pOptions )
    {
        const options = Object.freeze( Object.assign( {}, pOptions || {} ) );

        const prop = (asString( _str === typeof pPropertyPath ?
                                pPropertyPath :
                                (isValidObject( pPropertyPath ) ?
                                 (Array.isArray( pPropertyPath ) ?
                                  pPropertyPath.join( _dot ) :
                                  _mt_str) :
                                 _mt_str) ));

        let propertyName = asString( prop, true ).trim();

        if ( isBlank( propertyName ) )
        {
            return null;
        }

        const rx = /\[\d+]/g;

        // convert something like arr[0][0][0] into arr.0.0.0,
        // taking advantage of the fact that arrays are really just objects whose properties look like integers
        propertyName = rx.test( propertyName ) ? propertyName.replace( /\[(\d+)]/g, ".$1" ) : propertyName;

        propertyName = propertyName.replace( REG_EXP_LEADING_DOT, _mt_str ).replace( REG_EXP_TRAILING_DOT, _mt_str );

        switch ( typeof pObject )
        {
            case _ud:
                throw new IllegalArgumentError( " an object is required" );

            case _str:
            case _num:
            case _big:
            case _bool:
            case _symbol:
                return pObject;

            case _obj:

                let obj = pObject || {};

                if ( propertyName.includes( _dot ) )
                {
                    let keys = propertyName.split( _dot ) || [propertyName];

                    while ( keys.length )
                    {
                        let p = keys.shift();

                        obj = obj[p] || obj["_" + p];

                        if ( options.createIfMissing )
                        {
                            obj = obj || {};
                        }

                        if ( (null !== obj && _ud !== typeof obj) )
                        {
                            return setProperty( obj, keys.join( _dot ), pValue );
                        }
                    }
                }
                else if ( !Object.isFrozen( obj ) )
                {
                    let rx = /^_+/;

                    let nm = (asString( propertyName, true )).replace( rx, _mt_str );

                    try
                    {
                        obj[nm] = pValue;
                    }
                    catch( ex )
                    {
                        konsole.warn( constants.S_ERR_PREFIX, "setting", nm, ex );

                        try
                        {
                            obj["_" + nm] = pValue;
                        }
                        catch( e )
                        {
                            konsole.warn( constants.S_ERR_PREFIX, "setting", "_" + nm, e );
                        }
                    }
                }

                break;

            case _fun:

                try
                {
                    let rtnValue = pObject.call( $scope() );
                    if ( rtnValue )
                    {
                        return setProperty( rtnValue, pPropertyPath, pValue, options );
                    }
                }
                catch( ex )
                {
                    konsole.warn( ex.message );
                }
        }

        return pObject?.[prop];
    };

    /**
     * Returns true if the objects are actually the exact same object
     *
     * @param pSelf the first object
     * @param pOther the other object
     * @returns {boolean}
     */
    const identical = function( pSelf, pOther )
    {
        return (pOther === pSelf) || (isNullOrEmpty( pSelf ) && isNullOrEmpty( pOther ));
    };

    /**
     * Returns true if the 2 arguments represent the same object graph or the same number or other data type.
     *
     * Basically a deep ==, not limited to ===
     * @param {any} pFirst the first object
     * @param {any} pSecond the other object
     * @param pStrict boolean to indicate whether both objects have to have the same type or class, defaults to false
     * @param pClass (optional) the type or class both arguments must be to be considered the same if pStrict is true
     * @returns true if the 2 arguments represent the same object graph or the same number or other data type
     */
    const same = function( pFirst, pSecond, pStrict = false, pClass = null )
    {
        if ( pFirst === pSecond || (isNull( pFirst ) && isNull( pSecond )) )
        {
            return true;
        }

        if ( [_num, _big].includes( typeof pFirst ) || [_num, _big].includes( typeof pSecond ) )
        {
            const first = parseFloat( pFirst );

            const second = parseFloat( pSecond );

            const diff = Math.abs( first - second );

            return (first === second) || ( !isNaN( diff ) && diff < 0.000000001);
        }

        if ( isString( pFirst ) && isString( pSecond ) )
        {
            if ( pStrict )
            {
                return pFirst === pSecond;
            }

            return asString( pFirst, true ) === asString( pSecond, true );
        }

        if ( _obj === typeof pFirst )
        {
            if ( Array.isArray( pFirst ) )
            {
                if ( _obj === typeof pSecond && Array.isArray( pSecond ) )
                {
                    if ( pFirst.length !== pSecond.length )
                    {
                        return false;
                    }

                    const first = [].concat( pFirst || [] ).sort();
                    const second = [].concat( pSecond || [] ).sort();

                    let result = true;

                    for( let i = first.length; i--; )
                    {
                        if ( !same( first[i], second[i] ) )
                        {
                            result = false;
                            break;
                        }
                    }

                    // we only trust a positive result, since we cannot rely on the elements to be properly sortable
                    if ( result )
                    {
                        return true;
                    }
                }
            }

            if ( _obj === typeof pSecond )
            {
                for( let p in pFirst )
                {
                    if ( !same( getProperty( pFirst, p ), getProperty( pSecond, p ) ) )
                    {
                        return false;
                    }
                }

                for( let p in pSecond )
                {
                    if ( !same( getProperty( pSecond, p ), getProperty( pFirst, p ) ) )
                    {
                        return false;
                    }
                }

                return (pStrict) ? (pClass) ? (pFirst instanceof pClass && pSecond instanceof pClass) : (pFirst.constructor === pSecond.constructor) : true;
            }

            return false;
        }

        if ( _fun === typeof pFirst )
        {
            return (_fun === typeof pSecond) && asString( pFirst.toString(), true ) === asString( pSecond.toString(), true );
        }

        try
        {
            const jsonFirst = JSON.stringify( pFirst );
            const jsonSecond = JSON.stringify( pSecond );

            if ( same( jsonFirst, jsonSecond, pStrict, String ) )
            {
                return true;
            }
        }
        catch( ex )
        {
            konsole.error( "An error occurred while comparing 2 objects", ex.message );
        }

        return false;
    };

    const canCompare = function( pObject, pStrict, pClass )
    {
        return !isNull( pObject ) && ( !(pStrict && pClass) || pObject instanceof pClass);
    };

    Object.prototype.isIdenticalTo = function( pOther, pStrict, pClass )
    {
        return canCompare( pOther, pStrict, pClass ) && (identical( this, pOther ));
    };

    Object.prototype.equals = function( pObject )
    {
        return same( this, pObject, true, getClass( this ) );
    };

    const arrayToObject = function( pArr, pKeyProperty )
    {
        let arr = arrayUtils.asArray( pArr || [] ) || [];

        let keyProperty = asString( pKeyProperty, true );

        let useKeyProperty = !isBlank( keyProperty );

        if ( 1 === arr.length && (isObject( arr[0] ) && !isArray( arr[0] )) )
        {
            if ( useKeyProperty )
            {
                let value = arr[0] || {};
                let key = value[keyProperty];

                let obj = {};
                obj[key] = value;

                return obj || { [keyProperty]: value };
            }
            return arr[0];
        }

        let obj = {};

        let key = constants._mt_str;
        let value = constants._mt_str;

        for( let i = 0, n = arr.length; i < n; i++ )
        {
            let elem = arr[i];

            switch ( typeof elem )
            {
                case _ud:
                    break;

                case _str:
                case _num:
                case _big:
                case _bool:
                    key = stringUtils.asString( i, true );
                    value = elem;
                    break;

                case _fun:
                    key = asKey( asString( elem.name, true ).trim() || asString( Function.prototype.toString.call( elem ), true ).trim() ) || ("Function_" + asString( i ));

                    if ( key in obj )
                    {
                        key = ("Function_" + asString( i ));
                    }

                    value = elem;

                    break;

                case _obj:
                    if ( isArray( obj ) )
                    {
                        key = "Array_" + asString( i );
                        value = arrayToObject( elem, keyProperty );
                    }
                    else
                    {
                        key = (useKeyProperty ? elem[keyProperty] : (elem?.id || elem?.key || ("Object_" + asString( i ))));
                        key = asString( key, true ) || asString( (elem?.id || elem?.name || elem?.key || ("Object_" + asString( i ))), true );

                        value = elem;
                    }
                    break;
            }

            obj[key] = obj[key] || value;
        }

        return obj;
    };

    /**
     * Returns the first candidate object that has a method named pFunctionName
     * @param pFunctionName the name of the method the object must implement to be returned
     * @param pCandidates one or more objects that might implement the specified method
     * @returns {object} the leftmost object that implements the specified method
     */
    const findImplementor = function( pFunctionName, ...pCandidates )
    {
        let methodNames = asArray( pFunctionName || [] );

        const candidates = asArray( [].concat( pCandidates || [] ) ).flat( Infinity );

        let implementor = null;

        for( const methodName of methodNames )
        {
            while ( (null == implementor || _fun !== typeof implementor[methodName]) && candidates.length )
            {
                implementor = candidates.shift();

                if ( implementor && _fun === typeof implementor[methodName] )
                {
                    break;
                }
            }

            if ( implementor && _fun === typeof implementor[methodName] )
            {
                return implementor;
            }
        }

        return null;
    };

    /**
     * Returns an array of objects that implement one or more of the method(s) specified
     * @param pMethodNames an array of strings that are method names (or a string that is a method name)
     * @param pCandidates one or more objects, the subset of which to return if the object implements one or more of the specified methid(s)
     * @returns {*[]}  an array of objects that implement one or more of the method(s) specified
     */
    const collectImplementors = function( pMethodNames, ...pCandidates )
    {
        let methodNames = asArray( pMethodNames || [] );

        const arr = (asArray( pCandidates || [] ) || []).filter( arrayUtils.Filters.IS_OBJECT );

        const implementors = [];

        for( const methodName of methodNames )
        {
            for( const candidate of arr )
            {
                if ( null == candidate )
                {
                    continue;
                }

                let type = typeof candidate[methodName];

                if ( _fun === type )
                {
                    implementors.push( candidate );
                }
            }
        }

        return implementors;
    };

    /**
     * Returns an object with the same structure or type with all values replaced with the default for that type.
     * For primitive types, returns the default value for that type (examples: 0, false, "")
     * For arrays, returns an array of the same length, filled with nulls
     * For an object, returns a new object with the same structure with all values populated with an emptyClone of that value
     * @param pAny an object or primitive for which to return an empty clone or default value
     * @param pTypeHint a string describing the type of the first argument
     * @param pThis an object to which to bind any functions being empty-cloned
     * @returns {{}|undefined|number|string|*[]|unknown|(function(...[*]): *)|boolean} an object with the same structure or type with all values replaced with the default for that type
     */
    const emptyClone = function( pAny, pTypeHint, pThis = null )
    {
        let typeHint = (pTypeHint ? (_str === typeof pTypeHint ? pTypeHint : typeof pTypeHint) : undefined);

        let type = (pAny ? typeof pAny || typeHint : typeHint);

        if ( _ud === type )
        {
            type = typeHint || _ud;
        }

        switch ( type )
        {
            case _str:
                return _mt_str;

            case _num:
            case _big:
                return 0;

            case _bool:
                return false;

            case _obj:
                if ( isArray( pAny ) )
                {
                    return [].fill( null, 0, pAny.length );
                }

                let obj = {};

                let entries = getEntries( pAny );

                for( let entry of entries )
                {
                    if ( entry )
                    {
                        let key = entry.key || entry[0];
                        let value = entry.value || entry[1];

                        obj[key] = emptyClone( value, typeof value, obj );
                    }
                }

                return Object.assign( {}, obj );

            case _ud:
                return undefined;

            case _symbol:
                return pAny;

            case _fun:
                return function( ...pArgs )
                {
                    return pAny.call( pThis || this || pAny, ...pArgs );
                };

            default:
                return {};
        }
    };

    /**
     * Returns a new object that is a deep copy of the specified argument
     * @param pObject an object to clone
     * @param pOmitFunctions boolean indicating whether to return an object with or without its methods preserved
     * @param pStack the paths previously traversed to detect an infinite cycle; used internally
     * @returns {object} a new object that is a deep copy of the specified argument
     */
    const clone = function( pObject, pOmitFunctions = false, pStack = [] )
    {
        let obj = Object.assign( {}, pObject || {} );

        let twin = Object.assign( {}, obj );

        const stack = asArray( pStack || [] );

        if ( stack.length > MAX_CLONE_DEPTH || detectCycles( stack, 3, 3 ) )
        {
            return Object.assign( {}, twin );
        }

        const entries = getEntries( obj );

        let methods = {};

        for( let entry of entries )
        {
            const propertyName = entry.key || entry[0];

            const value = entry.value || entry[1];

            switch ( typeof value )
            {
                case _fun:
                    try
                    {
                        if ( !isClass( value ) )
                        {
                            value.bind( methods );
                            methods[propertyName] = value;

                            twin[propertyName] = null;
                            delete twin[propertyName];
                        }
                    }
                    catch( ex )
                    {
                        konsole.warn( ex.message );
                    }
                    break;

                case _obj:

                    stack.push( propertyName );

                    try
                    {
                        twin[propertyName] = (_fun === typeof value?.clone) ?
                                             value.clone() :
                                             clone( value, pOmitFunctions, stack );
                    }
                    catch( ex )
                    {
                        twin[propertyName] = Object.assign( (twin[propertyName] || {}), (value || {}) );
                    }
                    finally
                    {
                        stack.pop();
                    }

                    break;

                default:
                    twin[propertyName] = value;
                    break;
            }
        }

        try
        {
            twin = structuredClone( Object.assign( {}, twin ) );
        }
        catch( ex )
        {
            const msg = asString( ex.message );

            if ( !msg.includes( "could not be cloned" ) )
            {
                konsole.warn( msg );
            }
        }

        if ( pOmitFunctions )
        {
            return twin || Object.assign( {}, obj );
        }

        for( let entry of getEntries( methods ) )
        {
            const value = entry.value || entry[1];

            if ( _fun === typeof value && !isClass( value ) )
            {
                const propertyName = entry.key || entry[0];

                try
                {
                    value.bind( twin );
                    twin[propertyName] = value;
                }
                catch( ex )
                {
                    konsole.warn( ex.message );
                }
            }
        }

        return twin || Object.assign( {}, obj );
    };

    /**
     * Creates a clone of the specified object that can be transferred to a worker or service worker
     * @param pObject the object to clone
     * @param pOptions options to control the cloning
     * @returns {unknown} a new object that can be transferred to a worker or service worker
     */
    const toStructuredCloneableObject = function( pObject, pOptions )
    {
        let options = Object.assign( {}, (pOptions || { freeze: false, omitFunctions: true }) );

        let obj = clone( pObject, options?.omitFunctions );

        let toTransfer = [].concat( ...(options?.transfer || []) );

        return _ud === typeof structuredClone ? obj : toTransfer?.length ? structuredClone( obj, { transfer: toTransfer } ) : structuredClone( obj );
    };

    /**
     * Returns the SAME object with each of the subsequent objects properties assigned to it
     * @param pObject the object to modify
     * @param pDefault one or more objects to assign to the first object
     * @returns {{}|{}} the original object modified by assigning the subsequent objects to it
     */
    const ingest = function( pObject, ...pDefault )
    {
        let defaults = [].concat( asArray( pDefault || [{}] ) || [{}] ).filter( arrayUtils.Filters.IS_POPULATED_OBJECT );

        pObject = isObject( pObject ) ? pObject || {} : {};

        for( let i = 0, n = defaults.length; i < n; i++ )
        {
            let source = defaults[i];

            pObject = assign( pObject, source );
        }

        return pObject;
    };

    /**
     * Returns a new object with any properties of the second object
     * copied to the first object, without overwriting existing properties
     *
     * @param pObject the object into which to assign properties of the second object
     * @param pObjectB the object from which to assign values to a copy of the first object
     * @param pOptions (optional) an object with properties to control the subtle behaviors
     * such as special handling of properties whose value is an array, Map, or Set
     * @param pStack --- do not pass this argument, it is used to detect cycles and infinite loops
     * and is only passed to recursive calls from within the function itself
     */
    const augment = function( pObject, pObjectB, pOptions, pStack = [] )
    {
        const options = Object.assign( {}, pOptions || {} );

        const _stack = pStack || [];

        // start by creating a shallow copy of each object
        let objA = Object.assign( {}, pObject || pObject || {} );

        const objB = Object.freeze( Object.assign( {}, pObjectB || pObject || {} ) );

        if ( detectCycles( _stack, 3, 3 ) )
        {
            return Object.assign( objA, objB );
        }

        const entries = getEntries( objB );

        for( let i = 0, n = entries.length; i < n; i++ )
        {
            const entry = entries[i];

            const key = asString( entry?.key || entry[0] );

            if ( isBlank( key ) || EXCLUDED_PROPERTIES.includes( key ) )
            {
                continue;
            }

            _stack.push( key );

            let value = entry?.value || entry[1];

            if ( !isBlank( key ) && !(_ud === typeof value || null === value) )
            {
                let valueA = null;

                try
                {
                    valueA = objA[key];
                }
                catch( ex )
                {
                    konsole.warn( constants.S_ERR_PREFIX, "accessing", key, ex );
                }

                if ( _ud === typeof valueA || null == valueA )
                {
                    try
                    {
                        objA[key] = value;
                    }
                    catch( ex )
                    {
                        konsole.warn( constants.S_ERR_PREFIX, "modifying", key, ex );
                    }
                }
                else if ( isArray( valueA ) && isArray( value ) )
                {
                    try
                    {
                        objA[key] = valueA;
                    }
                    catch( ex )
                    {
                        konsole.warn( constants.S_ERR_PREFIX, "modifying", key, ex );
                    }

                    let arrB = value || [];

                    try
                    {
                        valueA = objA[key] || [];
                    }
                    catch( ex )
                    {
                        konsole.warn( constants.S_ERR_PREFIX, "accessing", key, ex );
                    }

                    value = arrB || [];

                    if ( value.length > valueA.length && options.appendToArrays )
                    {
                        for( let i = valueA.length, n = value.length; i < n; i++ )
                        {
                            if ( i >= valueA.length )
                            {
                                valueA.push( (value[i]) );
                            }
                        }
                    }

                    try
                    {
                        objA[key] = [].concat( valueA );
                    }
                    catch( ex )
                    {
                        konsole.warn( constants.S_ERR_PREFIX, "modifying", key, ex );
                    }
                }
                else if ( (valueA instanceof Map) && (value instanceof Map) && options.addMissingMapEntries )
                {
                    value.forEach( ( val, key ) =>
                                   {
                                       if ( !(valueA.has( key )) )
                                       {
                                           valueA.set( key, val );
                                       }
                                   } );
                }
                else if ( (valueA instanceof Set) && (value instanceof Set) && (options.appendToSets || options.unionOfSets) )
                {
                    if ( _fun === typeof valueA.union )
                    {
                        objA[key] = valueA.union( value );
                    }
                    else
                    {
                        value.forEach( ( val ) =>
                                       {
                                           if ( !(valueA.has( val )) )
                                           {
                                               valueA.add( (val) );
                                           }
                                       } );
                    }
                }
                else if ( (_obj === typeof valueA && _obj === typeof value) && (false !== options.recursive) && !isDate( valueA ) )
                {
                    const classA = getClass( valueA );

                    const classB = getClass( value );

                    const classesAreCompatible = ((classA === classB) || (valueA instanceof classB) || (value instanceof classA));

                    if ( classesAreCompatible || true === options.mergeUnmatchedClasses )
                    {
                        _stack.push( key );

                        objA[key] = augment( objA[key], (value), options, _stack );

                        _stack.pop();
                    }
                }
            }
        }

        return objA;
    };

    /**
     * Returns a new object with the properties of the first replaced with the properties of the second
     * but with any properties unique to the first object preserved
     * and any properties unique to the second, ignored
     * @param pTarget
     * @param pSource
     * @param pVisited
     * @param pPath
     */
    const populate = function( pTarget, pSource, pVisited = new Set(), pPath = [] )
    {
        const visited = pVisited || new Set();

        const path = asArray( pPath ) || [];

        // start by creating a shallow copy of each object
        let objA = Object.assign( {}, pTarget || pSource || {} );

        const objB = Object.assign( {}, pSource || pTarget || {} );

        if ( detectCycles( path, 5, 2 ) || (10 < (path?.length || 0)) )
        {
            return objA;
        }

        const objAProperties = getProperties( objA ) || [];

        const entries = getEntries( objB ) || [];

        for( let i = 0, n = entries.length; i < n; i++ )
        {
            const entry = entries[i];

            const key = entry.key || "~$~";

            if ( EXCLUDED_PROPERTIES.includes( key ) || "~$~" === key )
            {
                continue;
            }

            if ( key.startsWith( "~$~" ) || !(objAProperties.includes( key ) || key in objA) )
            {
                continue;
            }

            const value = entry.value;

            if ( isValidEntry( entry ) )
            {
                let valueA = objA[key];

                if ( isObject( valueA ) )
                {
                    if ( visited.has( value ) && (value === objA[key]) )
                    {
                        continue;
                    }
                    visited.add( value );
                }

                path.push( key );

                objA[key] = ((isObject( value )) ? populate( valueA, value, visited, path ) : (value));

                path.pop();
            }
        }

        return objA;
    };

    const DEFAULT_PRUNING_OPTIONS =
        {
            removeEmptyObjects: true,
            removeEmptyArrays: true,
            removeEmptyStrings: false,
            removeFunctions: false,
            pruneArrays: false
        };

    /**
     * Returns a new object based on the specified object but with all 'empty' nodes removed, recursively
     * @param pObject an object to 'prune'
     * @param pOptions options to control what is pruned
     * @param pStack - INTERNALLY USED TO PREVENT INFINITE LOOPS
     * @returns {unknown} a new object with empty nodes removed
     */
    const pruneObject = function( pObject, pOptions = DEFAULT_PRUNING_OPTIONS, pStack )
    {
        const options = Object.assign( {}, pOptions || {} );

        let obj = assign( {}, pObject || {} );

        const keys = getKeys( obj );
        const propertyNames = getProperties( obj );

        let properties = unique( pruneArray( [].concat( keys ).concat( propertyNames ) ) );
        properties = properties.map( e => asString( e, true ) ).filter( arrayUtils.Filters.NON_BLANK );

        let stack = [].concat( arrayUtils.asArray( pStack || [] ) );

        if ( detectCycles( stack, 3, 3 ) )
        {
            return obj;
        }

        for( let i = properties?.length || 0; i--; )
        {
            const propertyName = properties[i];

            let value = null;

            try
            {
                value = obj[propertyName] || getProperty( obj, propertyName );
            }
            catch( ex )
            {
                konsole.warn( ex );
            }

            switch ( typeof value )
            {
                case _ud:
                    obj = removeProperty( obj, propertyName, options );
                    break;

                case _str:
                    if ( isBlank( value ) && options.removeEmptyStrings )
                    {
                        obj = removeProperty( obj, propertyName, options );
                    }
                    else
                    {
                        setProperty( obj, propertyName, value || obj[propertyName] || getProperty( obj, propertyName ) );
                    }
                    break;

                case _num:
                case _big:
                    if ( isNaN( value ) || !isFinite( value ) )
                    {
                        obj = removeProperty( obj, propertyName, options );
                    }
                    else
                    {
                        setProperty( obj, propertyName, value || obj[propertyName] || getProperty( obj, propertyName ) );
                    }
                    break;

                case _bool:
                    setProperty( obj, propertyName, value || obj[propertyName] || getProperty( obj, propertyName ) );
                    break;

                case _fun:
                    if ( options.removeFunctions )
                    {
                        obj = removeProperty( obj, propertyName, options );
                    }
                    else
                    {
                        setProperty( obj, propertyName, value || obj[propertyName] || getProperty( obj, propertyName ) );
                    }
                    break;

                default:
                    if ( options.removeEmptyObjects )
                    {
                        if ( _ud === typeof value || null === value || isEmptyValue( value ) )
                        {
                            obj = removeProperty( obj, propertyName, options );
                        }
                        else
                        {
                            setProperty( obj, propertyName, value || obj[propertyName] || getProperty( obj, propertyName ) );
                        }
                    }
                    else if ( (isObject( value ) && Array.isArray( value )) )
                    {
                        if ( options.pruneArrays )
                        {
                            value = arrayUtils.pruneArray( value );
                        }

                        if ( options.removeEmptyArrays && value?.length <= 0 )
                        {
                            obj = removeProperty( obj, propertyName, options );
                        }
                        else
                        {
                            setProperty( obj, propertyName, value || obj[propertyName] || getProperty( obj, propertyName ) );
                        }
                    }
                    else if ( (isObject( value ) && !Array.isArray( value )) )
                    {
                        stack.push( propertyName );

                        try
                        {
                            value = pruneObject( value, options );
                            setProperty( obj, propertyName, value );
                        }
                        catch( ex )
                        {
                            konsole.warn( ex );
                        }
                        finally
                        {
                            stack.pop();
                        }
                    }
                    else
                    {
                        setProperty( obj, propertyName, value || obj[propertyName] || getProperty( obj, propertyName ) );
                    }

                    break;
            }
        }

        return obj;
    };

    /**
     * Returns an object literal based on the specified object.
     * That is, this erases the class or prototype information and just returns a POJO of the object's current state
     * @param pObject object from which to construct an object literal
     * @returns {*} a new object with no class or prototype affiliation
     */
    const toLiteral = function( pObject )
    {
        let literal = {};

        if ( pObject instanceof Map )
        {
            let _map = {};

            for( let entry of pObject.entries() )
            {
                _map[entry[0]] = entry[1];
            }

            literal = Object.assign( {}, _map );
        }
        else if ( pObject instanceof Set )
        {
            literal = [].concat( [...pObject] ).map( e => toLiteral( e ) );
        }
        else
        {
            switch ( typeof pObject )
            {
                case _ud:
                    literal = undefined;
                    break;

                case _str:
                case _num:
                case _big:
                case _bool:
                case _fun:
                case _symbol:

                    literal = pObject;
                    break;

                default:
                    literal = assign( {}, pObject || {} );
                    break;
            }
        }

        if ( null !== literal )
        {
            try
            {
                literal.prototype = null;
                literal.__proto__ = null;
            }
            catch( e )
            {
                konsole.warn( ex );
            }

            try
            {
                literal.constructor = null;
            }
            catch( ex )
            {
                konsole.warn( ex );
            }
        }

        return literal;
    };

    /**
     * Removes the specified property and returns the modified object
     *
     * @param pObject the object to modify
     * @param pPropertyName the property to delete, or remove
     * @param pOptions
     * @returns {*} the same object with the specified properties removed
     */
    const removeProperty = function( pObject, pPropertyName, pOptions = { assumeUnderscoresConvention: true } )
    {
        if ( !isObject( pObject ) || Object.isFrozen( pObject ) || Object.isSealed( pObject ) )
        {
            return pObject;
        }

        let propertyName = pPropertyName;

        switch ( typeof pPropertyName )
        {
            case _ud:
                return pObject;

            case _num:
            case _big:
                if ( isArray( pObject ) )
                {
                    return pObject.splice( pPropertyName, 1 );
                }
                break;

            case _str:
                propertyName = asString( pPropertyName, true );
                break;

            default:
                return pObject;
        }

        if ( isBlank( propertyName ) )
        {
            return pObject;
        }

        const options = Object.assign( {}, pOptions || { assumeUnderscoresConvention: true } );

        let prefixes = [];

        if ( options?.assumeUnderscoresConvention )
        {
            prefixes.push( _underscore );
        }

        for( let prefix of (options?.prefixes || []) )
        {
            prefixes.push( prefix );
        }

        try
        {
            delete pObject[propertyName];
        }
        catch( ex )
        {
            konsole.error( ex.message );
        }

        for( let prefix of prefixes )
        {
            try
            {
                delete pObject[prefix + propertyName];
            }
            catch( ex )
            {
                konsole.error( ex.message );
            }
        }

        return pObject;
    };

    /**
     * Removes the specified properties and returns the modified object
     * @param pObject an object to modify (by removing the specified properties)
     * @param pPropertyNames
     * @returns {object} the modified object (without the specified properties)
     */
    const removeProperties = function( pObject, ...pPropertyNames )
    {
        let obj = pObject || {};

        const propertyNames = unique( pruneArray( [].concat( asArray( pPropertyNames || [] ) ) ) );

        for( let i = 0, n = propertyNames.length; i < n; i++ )
        {
            const propertyName = asString( propertyNames[i], true ).trim();

            if ( !isBlank( propertyName ) )
            {
                try
                {
                    obj = removeProperty( obj, propertyName );
                }
                catch( ex )
                {
                    konsole.warn( ex.message );
                }
            }
        }

        return obj;
    };

    /**
     * Performs a 'deep' Object.assign of the properties of the source to the target.
     * Returns the modified target unless the specified target is frozen, in which case, a new object is returned
     * @param pTarget the object to which to assign the properties of the source
     * @param pSource an object from which to assign properties to the target
     * @param pStack INTERNALLY USED TO PREVENT INFINITE LOOPS
     * @returns {object} an object (potentially the original target) with the source properties assigned
     */
    const assign = function( pTarget, pSource, pStack = [] )
    {
        let target = pTarget || {};
        let source = pSource || {};

        if ( target === source )
        {
            return pTarget;
        }

        if ( Object.isFrozen( pTarget ) )
        {
            target = Object.assign( {}, target || pTarget || {} );
        }

        pTarget = Object.assign( target, source );

        const stack = pStack || [];

        if ( stack.length > MAX_ASSIGN_DEPTH || detectCycles( stack, 4, 4 ) )
        {
            return clone( pTarget, false, stack );
        }

        const entries = getEntries( target );

        entries.forEach( entry =>
                         {
                             let property = entry.key || entry[0];
                             let value = entry.value || entry[1];

                             if ( isObject( value ) )
                             {
                                 stack.push( property );

                                 try
                                 {
                                     value = assign( (pTarget[property] || {}), (value || {}), stack );

                                     pTarget[property] = Object.assign( {}, value || {} );
                                 }
                                 catch( ex )
                                 {
                                     pTarget[property] = Object.assign( {}, (value || {}) );
                                 }
                                 finally
                                 {
                                     stack.pop();
                                 }
                             }
                             else
                             {
                                 pTarget[property] = value;
                             }
                         } );

        return pTarget || target || source;
    };

    /**
     * Returns an object whose keys are the values of the specified object's properties
     * and whose values are the keys pointing to those values in the original
     * @param pObject an object from which to build a new object that swaps values and keys for each property
     * @returns {object}
     */
    const invertProperties = function( pObject )
    {
        let obj = {};

        const entries = getEntries( pObject );

        for( let entry of entries )
        {
            if ( (_ud === typeof entry[1] || null === entry[1] || [_fun, _symbol].includes( typeof entry[1] )) )
            {
                continue;
            }

            let key = asString( entry[1], true );

            if ( isBlank( key ) )
            {
                continue;
            }

            let value = asString( entry[0], true );

            if ( isBlank( value ) )
            {
                continue;
            }

            key = asString( key, true ).replaceAll( /(-|\s)(\w)/g,
                                                    ( match, group1, group2 ) =>
                                                    {
                                                        return group1 + group2.toUpperCase();
                                                    } ).replaceAll( /\s/g, _mt_str ).replaceAll( /[^A-Za-z0-9]/g, _mt_str );

            obj[key] = asString( value ).replaceAll( /\s/g, _mt_str ).replaceAll( /[^A-Za-z0-9]/g, _mt_str );
        }

        return obj;
    };

    const mod =
        {
            dependencies,
            classes: { IterationCap, ObjectEntry },
            ALWAYS_EXCLUDED,
            no_op,
            instanceOfAny,
            isObject,
            isString,
            isNumber,
            isZero,
            isBoolean,
            isNumeric,
            isUndefined,
            isNull,
            isNonNullObject,
            isArray,
            isEmptyObject,
            isNullOrEmpty,
            isNullOrNaN,
            isMissing,
            isFunction,
            isAsyncFunction,
            isClass,
            isUserDefinedClass,
            isListedClass,
            isInstanceOfUserDefinedClass,
            isInstanceOfListedClass,
            isDate,
            getClass,
            getClassName,
            convertToInstanceOf,
            isValidEntry,
            getKeys,
            getEntries,
            getValues,
            getProperties,
            isEmptyValue,
            hasNoProperties,
            isPopulated,
            isPopulatedObject: isPopulated,
            pruneObject,
            prune: pruneObject,
            IterationCap,
            ObjectEntry,
            generateUniqueObjectId,
            isValidObject,
            firstValidObject,
            firstPopulatedObject,
            identical,
            getProperty,
            hasProperty,
            setProperty,
            same,
            findImplementor,
            collectImplementors,
            emptyClone,
            copy: clone,
            clone,
            toStructuredCloneableObject,
            toLiteral,
            arrayToObject,
            evaluateBoolean,
            toBool,
            augment,
            assign,
            ingest,
            populateObject: populate,
            detectCycles,
            removeProperty,
            removeProperties,
            invertProperties
        };

    if ( _ud !== typeof module )
    {
        module.exports = Object.freeze( mod );
    }

    if ( $scope() )
    {
        $scope()[INTERNAL_NAME] = Object.freeze( mod );
    }

    return Object.freeze( mod );

}());
