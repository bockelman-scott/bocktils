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
    const detectCycles = function( pStack, pRunLength, pMaxRepetitions )
    {
        /**
         * The list of operations to evaluate
         */
        const _stack = [].concat( pStack || [] );

        /**
         * The length of a single sequence
         */
        let runLength = (pRunLength || 3);

        /**
         * The maximum number of times a sequence can repeat before this function will return true
         */
        let maxRepeats = (pMaxRepetitions || 2);

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

            if ( this.length < 2 )
            {
                this[0] = this[0] || _mt_str;
                this[1] = this[1] || null;
            }

            if ( isArray( pArgs ) )
            {
                const args = asArray( pArgs );

                this.#key = (args?.length || 0) > 0 ? args[0] : this[0] || _mt_str;
                this.#value = (args?.length || 0) > 1 ? args[1] : this[1] || _mt_str;
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
            return this.#value || (this.length > 1 ? this[1] : null);
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
            return obj[prop];
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

        // this statement accounts for a convention of using _ as the private property name, but will use the getter if it exists or the private property is null or false
        let propertyValue = obj[propertyName] || obj["_" + propertyName];

        // if this is a normal property name (not a path like a.b.c or a[0][1][2]) and we have a value, we return it
        let found = !propertyName.includes( _dot ) && ((null !== propertyValue && (_ud !== typeof propertyValue)) || isNumber( propertyValue ));

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
                    let value = accessorMethod.call( obj );

                    if ( value || (([_num, _big].includes( typeof value ) || isNumber( value )) && 0 === value) || (isString( value ) && isBlank( value )) )
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
                propertyValue = accessor.call( obj );
            }

            if ( !(_ud === typeof propertyValue || null === propertyValue) )
            {
                if ( propertyValue || (isNumber( propertyValue ) && 0 === propertyValue) || (isString( propertyValue ) && isBlank( propertyValue )) )
                {
                    return propertyValue;
                }
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

        return found ? obj : (obj[propertyName] || _mt_str);
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

        let propertyName = asString( prop ).trim();

        if ( isBlank( propertyName ) )
        {
            return pValue;
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
                break;

            case _obj:

                let obj = pObject || {};

                if ( propertyName.includes( _dot ) )
                {
                    let keys = propertyName.split( _dot ) || [propertyName];

                    while ( keys.length )
                    {
                        let p = keys.shift();

                        obj = obj["_" + p] || obj[p];

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

                    let nm = ("_" + asString( propertyName, true ).replace( rx, _mt_str ));

                    try
                    {
                        obj[nm] = pValue;
                    }
                    catch( ex )
                    {
                        konsole.warn( constants.S_ERR_PREFIX, "setting", nm, ex );
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

        return pValue;
    };

    const identical = function( pSelf, pOther, pCheckUniqueObjectId = false )
    {
        let is = (pOther === pSelf) || (isNullOrEmpty( pSelf ) && isNullOrEmpty( pOther ));

        return is && ( !!!pCheckUniqueObjectId || pOther?.uniqueObjectId === pSelf?.uniqueObjectId);
    };

    /**
     * Returns true if the 2 arguments represent the same object graph or the same number or other data type.
     * Basically a deep ==, not limited to ===
     * @param {any} pFirst
     * @param {any} pSecond
     * @param pStrict
     * @param pClass
     * @returns
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
        return canCompare( pOther, pStrict, pClass ) && (identical( this, pOther ) || same( this, pOther, pStrict, pClass ));
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

                return obj || { key: value };
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

    const findImplementor = function( pFunctionNames, ...pCandidates )
    {
        let methodNames = asArray( pFunctionNames || [] );

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

    const collectImplementors = function( pMethodNames, ...pCandidates )
    {
        let methodNames = asArray( pMethodNames || [] );

        const arr = asArray( pCandidates || [] ) || [];

        const implementors = [];

        for( const methodName of methodNames )
        {
            for( const candidate of arr )
            {
                if ( !isMissing( candidate ) && _fun === typeof candidate[methodName] )
                {
                    implementors.push( candidate );
                }
            }
        }

        return implementors;
    };


    const emptyClone = function( pAny, pTypeHint )
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
                return 0;

            case _bool:
                return false;

            case _obj:
                if ( isArray( pAny ) )
                {
                    return [].fill( null, 0, pAny.length );
                }
                return {};

            case _ud:
                return undefined;

            default:
                return {};
        }
    };

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

    const toStructuredCloneableObject = function( pObject, pOptions )
    {
        let options = Object.assign( {}, (pOptions || { freeze: false, omitFunctions: true }) );

        let obj = clone( pObject, options?.omitFunctions );

        let toTransfer = [].concat( ...(options?.transfer || []) );

        return _ud === typeof structuredClone ? obj : toTransfer?.length ? structuredClone( obj, { transfer: toTransfer } ) : structuredClone( obj );
    };

    const ingest = function( pObject, ...pDefault )
    {
        let defaults = asArray( pDefault || [{}] ) || [{}];

        let newObj = pObject || {};

        newObj = Object.assign( (newObj || {}), pObject || {} );

        for( let i = 0, n = defaults.length; i < n; i++ )
        {
            newObj = Object.assign( newObj, defaults[i] );
        }

        return newObj;
    };

    const safeIngest = function( pObject, ...pDefault )
    {
        const options =
            {
                appendToArrays: true,
                addMissingMapEntries: true,
                appendToSets: true,
                mergeUnmatchedClasses: true
            };
        let defaults = asArray( pDefault || [{}] ) || [{}];

        let newObj = pObject || {};

        newObj = augment( (newObj || {}), pObject || {}, options );

        for( let i = 0, n = defaults.length; i < n; i++ )
        {
            newObj = augment( newObj, defaults[i], options );
        }

        return newObj;
    };

    const printObject = function( pObject, pCurrentDepth )
    {
        let obj = pObject || {};

        let depth = Math.max( asInt( pCurrentDepth ) || 0, 0 );

        let out = _mt_str;

        let indent = (depth > 0) ? ("\t".repeat( depth )) : "";

        switch ( typeof obj )
        {
            case _ud:
                out += "undefined";
                break;

            case _num:
            case _big:
                out += obj;
                break;

            case _str:
                out += (_dblqt + obj + _dblqt);
                break;

            case _bool:
                out += (obj ? "true" : "false");
                break;

            case _fun:
                // skip
                break;

            case _obj:
                if ( isArray( obj ) )
                {
                    out += "[";

                    if ( (obj?.length || 0) > 0 )
                    {
                        for( let i = 0, n = obj.length; i < n; i++ )
                        {
                            let elem = obj[i];
                            out += printObject( elem, depth + 1 );
                            out += (i < (n - 1)) ? "," : "";
                        }
                    }

                    out += "]";
                }
                else if ( isPopulated( obj ) )
                {
                    out += ("\n{" + "\n");

                    out += indent;

                    for( let prop in obj )
                    {
                        out += (indent + (_dblqt + asString( prop ) + _dblqt));
                        out += ": ";
                        out += printObject( obj[prop], depth + 1 );
                        out += ",\n";
                    }

                    out += indent + ("\n" + "}" + "\n");
                }
                else
                {
                    out += "{}";
                }
                break;
        }

        return out;
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
     * Returns a new object with the superset of properties from each object specified
     *
     * @param pObjectA the first object, into which the second object's properties will be merged
     * @param pObjectB the second object, from which properties will be merged with those of the first object
     *                 the role of first and second object might swap as per the options specified, @see #pOptions
     *
     * @param pOptions an object specifying exactly how the 2 objects will be merged
     *                 {
     *                     preserveLeft: (boolean) if true, the 'left' object's properties will not be overwritten with the 'right' object's values
     *                     preserveRight: (boolean) if true, the 'right' object's properties will not be overwritten with the 'left' object's values
     *                     accumulate: (boolean) if true, numeric properties will be added together and represent the sum of values in the resulting object
     *                     concatenate: (boolean) if true, string properties will be concatenated (with an optional separator) in the resulting object
     *                     xor: (boolean) if true, boolean properties will be evaluated to true only in the case that exactly only one of them is true (exclusive or)
     *                     nand: (boolean) if true, boolean values will be evaluated as !( a && b ) where a is the value from one object and b is the value from the other
     *                     intersection: (boolean) if true, the resulting object will have only those properties present in both the first and second object
     *                     disjunction: (boolean) if true, only those properties unique to one or the other of the objects will be present in the resulting object
     *                     joinLeft: (boolean) if true, the merge is of the second object into the first, making the first object the 'left' object
     *                     joinRight: (boolean) if true, the merge is of the first object into the second, making the first object the 'right' object
     *                 }
     */
    const merge = function( pObjectA, pObjectB, pOptions )
    {
        // TODO: implement when needed

        const options = Object.assign( {}, pOptions || {} );

        const objA = Object.assign( {}, pObjectA || pObjectB || {} );
        const objB = Object.assign( {}, pObjectB || pObjectA || {} );

        const leftObj = options.joinLeft ? objA : objB;
        const rightObj = options.joinLeft ? objB : objA;

        for( let [key, value] of Object.entries( rightObj ) )
        {

        }

        return Object.assign( objA, Object.assign( objB, objA ) );
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

    const updateObject = function( pTarget, pSource, pOptions, pVisited, pPath )
    {
        const options = Object.assign( {}, pOptions || pSource || { skip: /^\$/ } );

        const skip = options.skip || /^\$/;

        const maxDepth = options.maxDepth || 5;

        const maxCycles = Math.min( Math.max( 2, options.maxCycles || 2 ), 8 );

        const cycleLength = Math.min( 2 * maxDepth, Math.max( options.cycleLength || 4, 2 ) );

        const visited = pVisited || new Set();

        const path = asArray( pPath ) || [];

        let objA = pTarget || {};

        const objB = pSource || objA;

        if ( detectCycles( path, cycleLength, maxCycles ) || (maxDepth < (path?.length || 0)) )
        {
            return objA;
        }

        let objAProperties = unique( [].concat( Object.getOwnPropertyNames( objA ) ).concat( Object.keys( objA ) ).filter( e => !(e.startsWith( "_" )) ) );

        let objBProperties = unique( [].concat( Object.getOwnPropertyNames( objB ) ).concat( Object.keys( objB ) ).filter( e => !(e.startsWith( "_" )) ) );

        objBProperties = unique( [].concat( objBProperties.concat( Object.entries( objB._doc || objB ) || [] ) ).filter( e => objAProperties.includes( e ) ) );

        objBProperties = unique( [].concat( objBProperties ).concat( objBProperties ) );

        for( let i = 0, n = objBProperties.length; i < n; i++ )
        {
            let propertyName = objBProperties[i];

            if ( skip.test( propertyName ) || (EXCLUDED_PROPERTIES.includes( propertyName )) )
            {
                continue;
            }

            const value = objB[propertyName] || objB["_" + propertyName];

            if ( isValidEntry( propertyName, value ) )
            {
                let valueA = objA[propertyName] || objA["_" + propertyName];

                if ( isObject( value ) && visited.has( value ) && (value === valueA) )
                {
                    continue;
                }

                if ( isObject( value ) )
                {
                    visited.add( value );
                }

                path.push( propertyName );

                setProperty( objA, propertyName, ((_obj === typeof value) ? updateObject( valueA, value, options, visited, path ) : value) );

                path.pop();
            }
        }

        return objA;
    };

    const getPublicPropertyNames = function( pObject )
    {
        const keys = [].concat( Object.keys( pObject ) );
        const propertyNames = [].concat( Object.getOwnPropertyNames( pObject ) );

        let properties = [].concat( keys ).concat( propertyNames );

        properties = properties.map( e => asString( e, true ).replace( /^_+/, _mt_str ) ).filter( e => !(["uniqueObjectId", "instantiationTimestamp", "_uniqueObjectId", "_instantiationTimestamp"].includes( e )) );

        return properties;
    };

    const pruneObject = function( pObject, pOptions )
    {
        const options = Object.assign( {}, pOptions || {} );

        let obj = pObject || {};

        const keys = Object.keys( obj );
        const propertyNames = Object.getOwnPropertyNames( obj );
        const getters = getPublicPropertyNames( obj );

        let properties = unique( pruneArray( [].concat( keys ).concat( propertyNames ).concat( getters ) ) );
        properties = properties.map( e => asString( e, true ) ).filter( arrayUtils.Filters.NON_BLANK );

        if ( options?.publicOnly )
        {
            obj = assignPublic( (Array.isArray( pObject ) ? [] : {}), obj, options );
        }

        let removed = [];

        if ( options.removeEmptyStrings )
        {
            for( let i = properties?.length || 0; i--; )
            {
                const propertyName = properties[i];

                let value = obj[propertyName];

                if ( (_str === typeof value && isBlank( value )) )
                {
                    obj = removeProperty( obj, propertyName, options );
                    removed.push( propertyName );
                }
                else if ( (isObject( value ) && !Array.isArray( value )) && options.deep )
                {
                    value = pruneObject( value, options );
                    obj[propertyName] = value;
                }
                else if ( Array.isArray( value ) )
                {
                    value = value.filter( e => _str !== typeof e || !isBlank( e ) );
                    obj[propertyName] = value;
                }
            }
        }

        properties = properties.filter( e => !(removed.includes( e )) );

        if ( options.removeEmptyObjects )
        {
            for( let i = properties?.length || 0; i--; )
            {
                const propertyName = properties[i];

                let value = obj[propertyName] || getProperty( obj, propertyName );

                if ( _ud === typeof value || null === value )
                {
                    obj = removeProperty( obj, propertyName, options );
                    removed.push( propertyName );
                }
                else if ( (_obj === typeof value && Array.isArray( value ) && value?.length <= 0) )
                {
                    if ( options.removeEmptyArrays )
                    {
                        obj = removeProperty( obj, propertyName, options );
                        removed.push( propertyName );
                    }
                }
                else if ( (isObject( value ) && !Array.isArray( value )) && options.deep )
                {
                    value = pruneObject( value, options );
                    obj[propertyName] = value;
                }
                else
                {
                    obj[propertyName] = value;
                }
            }
        }

        return obj;
    };

    const defaultAssignOptions =
        Object.freeze( {
                           included: [],
                           excluded: ["_", "instantiationTimestamp", "uniqueObjectId"],
                           publicOnly: true,
                           privateOnly: false,
                           deep: true,
                           depth: 0,
                           stack: []
                       } );

    /**
     * Similar to Object::assign, but assigns the publicly accessible names as properties to the returned POJO
     *
     * @param pTarget
     * @param pSource
     * @param pOptions
     */
    const assignPublic = function( pTarget,
                                   pSource,
                                   pOptions = defaultAssignOptions )
    {
        const defaultOptions =
            {
                included: [],
                excluded: ["_", "instantiationTimestamp", "uniqueObjectId"],
                publicOnly: true,
                privateOnly: false,
                deep: true,
                depth: 0,
                stack: []
            };

        let options = Object.assign( {}, defaultAssignOptions || {} );
        options = Object.assign( options, defaultOptions || {} );
        options = Object.assign( options, pOptions || defaultOptions );
        options.deep = (false !== pOptions?.deep) && (false !== options?.deep);

        const included = [].concat( options.included || [] ).flat();

        let excluded = ([].concat( options.excluded || options.transientProperties ).flat()).filter( e => !included.includes( e ) );

        const publicOnly = false !== options.publicOnly || excluded.includes( "_" );

        const deep = (false !== options?.deep) || false;

        let source = isObject( pSource ) || Array.isArray( pSource ) ? pSource : Array.isArray( pTarget ) ? [] : pSource;
        let target = isObject( pTarget ) || Array.isArray( pTarget ) ? pTarget : Array.isArray( pSource ) ? [] : source;

        if ( target?.transientProperties )
        {
            excluded = unique( pruneArray( excluded.concat( target?.transientProperties || [] ) ) );
        }

        if ( source?.transientProperties )
        {
            excluded = unique( pruneArray( excluded.concat( source?.transientProperties || [] ) ) );
        }

        if ( !(isObject( target ) || Array.isArray( target )) || null === target )
        {
            return target || source;
        }

        if ( !(isObject( source ) || Array.isArray( source )) || null === source )
        {
            return target || source;
        }

        if ( (options?.depth || 0) > 17 || detectCycles( options?.stack || [], 3, 4 ) )
        {
            return target || pTarget;
        }

        if ( Array.isArray( target ) && Array.isArray( source ) )
        {
            for( let i = 0, n = Math.max( source?.length, target?.length ); i < n; i++ )
            {
                if ( arrayUtils.arrLenGt( source, i ) )
                {
                    let value = source[i] || (arrayUtils.arrLenGt( target, i ) ? target[i] : null);

                    if ( (isObject( value ) || Array.isArray( value )) && deep )
                    {
                        if ( null === value )
                        {
                            continue;
                        }

                        const opts = Object.assign( {}, options );

                        opts.depth += 1;

                        opts.stack.push( i );

                        value = assignPublic( Array.isArray( value ) ? [] : {}, value, opts );

                        opts.stack.pop();
                    }

                    target[i] = value;
                }
            }

            return pruneArray( target || source );
        }

        const keys = Object.keys( source );
        const propertyNames = Object.getOwnPropertyNames( source );
        const getters = getPublicPropertyNames( source );

        let properties = unique( ([].concat( keys ).
                                     concat( propertyNames ).
                                     concat( included ).
                                     concat( getters )).
                                     flat().
                                     map( e => asString( e, true ).trim() ).
                                     filter( e => !excluded.includes( e ) ) );

        for( let i = properties.length; i--; )
        {
            let propertyName = properties[i];

            propertyName = (_str === typeof propertyName) ? asString( propertyName, true ) : ([_num, _big].includes( typeof propertyName ) ? propertyName : _mt_str);

            if ( isBlank( asString( propertyName, true ) ) || (excluded.includes( propertyName ) || excluded.includes( asString( propertyName, true ) )) )
            {
                continue;
            }

            let value = (source[propertyName] || getProperty( source, propertyName )) || (target[propertyName] || getProperty( target, propertyName ));

            if ( (isObject( value ) || Array.isArray( value )) && deep )
            {
                if ( null === value )
                {
                    continue;
                }

                const opts = Object.assign( {}, options );

                opts.depth += 1;

                opts.stack.push( propertyName );

                value = assignPublic( Array.isArray( value ) ? [] : {}, value, opts );

                opts.stack.pop();
            }

            const name = publicOnly ? propertyName.replace( /^_+/, _mt_str ) : propertyName;

            target[name] = value || target[name];
        }

        return target || Object.assign( target, source );
    };

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
            literal = [].concat( [...pObject] );
        }
        else
        {
            literal = Object.assign( {}, pObject || {} );
        }

        return literal;
    };

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
                    obj = removeProperty( obj, propertyName, { "assumeUnderscoreConvention": true } );
                }
                catch( ex )
                {
                    konsole.warn( ex.message );
                }
            }
        }

        return obj;
    };

    const assign = function( pTarget, pSource, pStack = [] )
    {
        let target = pTarget || {};
        let source = pSource || {};

        if ( target === source )
        {
            return Object.assign( {}, source || target );
        }

        target = Object.assign( target, source );

        const stack = pStack || [];

        if ( stack.length > MAX_ASSIGN_DEPTH || detectCycles( stack, 4, 4 ) )
        {
            return clone( target, false, stack );
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
                                     value = assign( (target[property] || {}), (value || {}), stack );

                                     target[property] = Object.assign( {}, value || {} );
                                 }
                                 catch( ex )
                                 {
                                     target[property] = Object.assign( {}, (value || {}) );
                                 }
                                 finally
                                 {
                                     stack.pop();
                                 }
                             }
                             else
                             {
                                 target[property] = value;
                             }
                         } );

        return Object.assign( {}, target || source );
    };

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
            getPublicPropertyNames,
            isEmptyValue,
            hasNoProperties,
            isPopulated,
            isPopulatedObject: isPopulated,
            pruneObject,
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
            printObject,
            evaluateBoolean,
            toBool,
            safeAssign: augment,
            deepAssign: assign,
            assignPublic,
            ingest,
            safeIngest,
            populateObject: populate,
            updateObject,
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