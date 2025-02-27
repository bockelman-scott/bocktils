/**
 *
 * This module exposes useful methods for working with objects, collections of objects, and classes.
 * Dependencies: Constants, TypeUtils, StringUtils, ArrayUtils, and GUIDUtils
 */
const core = require( "../../core/src/CoreUtils.cjs" );

const { constants, typeUtils, stringUtils, arrayUtils, guidUtils } = core;

const {
    _ud = "undefined", $scope = constants?.$scope || function()
    {
        return (_ud === typeof self ? ((_ud === typeof global) ? ((_ud === typeof globalThis ? {} : globalThis)) : (global || {})) : (self || {}));
    }
} = constants;

/**
 * This is the Immediately Invoked Function Expression (IIFE) that builds and returns the module
 */
(function exposeModule()
{
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

    let
        {
            _str,
            _fun,
            _obj,
            _num,
            _big,
            _bool,
            _symbol,

            _mt_str,
            _dot,
            _spc,
            _comma,
            _underscore,
            _semicolon,
            ignore,
            IllegalArgumentError,
            IterationCap,
            BUILTIN_TYPES,
            REG_EXP_DOT,
            REG_EXP_LEADING_DOT,
            REG_EXP_TRAILING_DOT,
            S_ERROR,
            S_WARN,
            S_TRACE,
            no_op,
            bracketsToDots,
            populateOptions,
            funcToString,
            lock,
            deepFreeze,
            ObjectEntry,
            objectEntries,
            localCopy,
            immutableCopy,
            classes,
            EMPTY_ARRAY = Object.freeze( [] ),
            EMPTY_OBJECT = Object.freeze( {} )
        } = constants;

    const { ModuleEvent, ToolBocksModule } = classes;

    const modName = "ObjectUtils";

    let modulePrototype = new ToolBocksModule( modName, INTERNAL_NAME );

    let
        {
            isString,
            isUndefined,
            isDefined,
            isNull,
            isNotNull,
            isNonNullValue,
            isObject,
            isCustomObject,
            isNonNullObject,
            isValidObject,
            isPopulated,
            isFunction,
            isAsyncFunction,
            isNumber,
            isNumeric,
            isZero,
            isNanOrInfinite,
            isNullOrNaN,
            isBoolean,
            isArray,
            isMap,
            isSet,
            isDate,
            isRegExp,
            isClass,
            isUserDefinedClass,
            isListedClass,
            isInstanceOfUserDefinedClass,
            isInstanceOfListedClass,
            isSymbol,
            isType,
            instanceOfAny,
            getClassName,
            getClass,
            isReadOnly,
            JS_TYPES,
            VALID_TYPES,
            VisitedSet,
            defaultFor,
            areSameType,
            firstValidObject,
            firstPopulatedObject,
            toObjectLiteral,
            estimateBytesForType,
            BYTES_PER_TYPE
        } = typeUtils;

    let
        {
            asString,
            isBlank,
            asKey,
            lcase,
            ucase,
            isValidNumber,
            asInt,
            evaluateBoolean,
            toBool,
            toProperCase,
            leftOfLast,
            rightOf,
            getFunctionSource
        } = stringUtils;

    let
        {
            ARRAY_METHODS,
            Filters,
            Mappers,
            asArray,
            pruneArray,
            unique,
            toNonBlankStrings,
            toTrimmedNonBlankStrings,
            toKeys,
            varargs,
            immutableVarArgs
        } = arrayUtils;

    const S_GUID = "GUID";

    const S_LENGTH = "length";

    if ( isUndefined( CustomEvent ) )
    {
        CustomEvent = ModuleEvent;
    }

    /*const uniqueObjectId = Symbol.for( "__BOCK__UNIQUE_OBJECT_ID__" );

     try
     {
     Object.defineProperty( Object.prototype,
     uniqueObjectId,
     {
     get: function()
     {
     this.__unique_object_id__ = this.__unique_object_id__ || guidUtils.guid();
     return this.__unique_object_id__;
     },
     set: no_op
     } );

     Object.prototype.getUniqueObjectInstanceId = function()
     {
     return this[uniqueObjectId];
     };

     Object.defineProperty( Object.prototype,
     S_GUID,
     {
     get: function()
     {
     return this[uniqueObjectId];
     },
     set: no_op
     } );
     }
     catch( ex )
     {
     // objects won't have a uniqueObjectId unless they already do
     }*/

    /**
     * Defines the maximum length of a branch of an object graph that will be cloned when copying an object.
     * example:
     *          cloning this ->  {a: { b: { c: {d: {e: { f: {g: "exceeds maximum"} } } } } } }
     *          returns this ->  {a: { b: { c: {d: {e: { f: null } } } } } }
     * @type {number}
     */
    const MAX_CLONE_DEPTH = 6;

    /**
     * Defines the maximum length of a branch of an object graph that will be assigned when using ObjectUtils::assign
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
    const OBJECT_METHODS = lock( [S_LENGTH, "isIdenticalTo", "equals", S_GUID, "getUniqueObjectInstanceId"].concat( [].concat( Object.getOwnPropertyNames( Object.prototype ).filter( e => isFunction( {}[e] ) ) ) ) );

    /**
     * An array of property names that are never included in calls to getProperties, getKeys, getValues, or getEntries
     * @type {Readonly<string[]>}
     */
    const ALWAYS_EXCLUDED = lock( [S_GUID, "getUniqueObjectInstanceId", "__unique_object_id__"] );

    /**
     * An array of property names that are excluded in calls to getProperties, getKeys, getValues, or getEntries
     * @type {string[]}
     */
    const EXCLUDED_PROPERTIES = lock( [].concat( OBJECT_METHODS ).concat( ARRAY_METHODS ).concat( ALWAYS_EXCLUDED ) );

    // a filter to return only strings containing at least one non-whitespace character
    const NON_BLANK_STRINGS = Filters.NON_BLANK;

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

    const DEFAULT_RECURSION_OPTIONS = { recursive: true, depth: 0, maxDepth: 10 };

    const asNew = function( pObject )
    {
        return Object.assign( {}, isNonNullObject( pObject ) ? pObject : isNonNullValue( pObject ) ? [pObject] : {} );
    };

    class ExploredSet extends VisitedSet
    {
        constructor( ...pValues )
        {
            super( (( a, b ) => same( a, b ) || a === b), ...pValues );
        }

        static get [Symbol.species]()
        {
            return this;
        }
    }

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
     * @param pOnDetected {function} (optional) function to call when a cycle has been detected, defaults to a no-op
     * @returns true if cycling
     */
    const detectCycles = function( pStack, pRunLength = 5, pMaxRepetitions = 3, pOnDetected = no_op )
    {
        /**
         * The list of operations to evaluate
         */
        const _stack = [].concat( asArray( pStack || [] ) );

        /**
         * The length of a single sequence
         */
        let runLength = asInt( pRunLength || 3 );

        /**
         * The maximum number of times a sequence can repeat before this function will return true
         */
        let maxRepeats = asInt( pMaxRepetitions || 3 );

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
                    if ( isFunction( pOnDetected ) )
                    {
                        try
                        {
                            pOnDetected( _stack, runs, repetitions, runLength, maxRepeats );
                        }
                        catch( ex )
                        {
                            modulePrototype.reportError( ex, `executing cycle detection callback`, S_ERROR, "detectCycles" );
                        }
                    }

                    try
                    {
                        modulePrototype.dispatchEvent( new CustomEvent( "infiniteLoop",
                                                                        {
                                                                            _stack,
                                                                            runs,
                                                                            repetitions,
                                                                            runLength,
                                                                            maxRepeats
                                                                        } ) );
                    }
                    catch( ex )
                    {
                        // ignored
                    }

                    return true;
                }

                runs.length = 0;
            }

            runLength += 1;
        }

        return false;
    };

    const rxFunctionSignature = lock( /^(\(?\s*((async(\s+))?\s*function))\s*?([$_\w]+[$_\w]*)?\s*\((\s*(([$_\w]+[$_\w]*\s*,?)\s*)*(\.{3}([$_\w]+[$_\w]*\s*,?)*\s*)*)(?<!,\s*)\)/ );

    const extractFunctionData = function( pFunction )
    {
        let s = isFunction( pFunction ) || isString( pFunction ) ? getFunctionSource( pFunction ) : _mt_str;

        let rx = new RegExp( rxFunctionSignature );

        let body = asString( s.replace( rx, _mt_str ), true );

        body = asString( leftOfLast( rightOf( body, "{" ), "}" ), true );

        const matches = rx.exec( s );

        let params = asArray( (matches && matches.length >= 7) ? asArray( asString( matches[6], true ).split( "," ) ) : [] );

        params = params.map( e => asString( e, true ) ).filter( Filters.NON_BLANK );

        return { body, params };
    };

    const extractFunctionBody = function( pFunction )
    {
        const { body } = extractFunctionData( pFunction );
        return body;
    };

    const extractFunctionParameters = function( pFunction )
    {
        const { params } = extractFunctionData( pFunction );
        return params;
    };

    class LimitedRecursiveFunction extends Function
    {
        #count;
        #limit;

        #f;
        #arguments;

        #original;

        constructor( pFunction, pLimit, ...pArgs )
        {
            super( extractFunctionParameters( pFunction ).join( ", " ), extractFunctionBody( pFunction ) );

            this.#f = isFunction( pFunction ) ? ((pFunction instanceof this.constructor) ? pFunction?.original || pFunction : pFunction) : no_op;

            this.#limit = Math.min( 32, asInt( pLimit, 12 ) );

            this.#count = Math.max( 0, asInt( (pFunction instanceof this.constructor) ? pFunction?.count : asInt( pFunction?.callCount ), 0 ) );

            this.#arguments = [].concat( ...(asArray( pArgs )) );

            this.#original = (pFunction instanceof this.constructor) ? pFunction?.original || this.#f : this.#f;
        }

        get count()
        {
            return Math.max( 0, Math.max( asInt( this.#count ), asInt( this.original?.callCount ) ) );
        }

        get callCount()
        {
            return this.count;
        }

        incrementCount()
        {
            return ++this.#count;
        }

        get limit()
        {
            return Math.min( 32, asInt( this.#limit, 12 ) );
        }

        get exhausted()
        {
            return this.count > this.limit;
        }

        get executable()
        {
            return this.#f || this;
        }

        get arguments()
        {
            return this.#arguments;
        }

        get original()
        {
            let original = this.#original;
            while ( isFunction( original ) && original instanceof this.constructor )
            {
                original = original?.original;
            }
            return original || this.executable;
        }

        apply( thisArg, argArray )
        {
            if ( !this.exhausted )
            {
                const args = [].concat( ...(asArray( argArray || this.arguments )) );

                this.incrementCount();

                let returnValue = null;

                try
                {
                    returnValue = this.executable.apply( thisArg || this, args );
                }
                catch( ex )
                {
                    modulePrototype.reportError( ex, "applying function", S_WARN, "LimitedRecursiveFunction::apply" );
                }

                return returnValue;
            }
        }

        call( thisArg, ...argArray )
        {
            if ( !this.exhausted )
            {
                const args = [].concat( ...(asArray( argArray || this.arguments )) );

                this.incrementCount();

                let returnValue = null;

                try
                {
                    this.executable.call( thisArg || this, ...args );
                }
                catch( ex )
                {
                    modulePrototype.reportError( ex, "calling function", S_WARN, "LimitedRecursiveFunction::call" );
                }

                return returnValue;
            }
        }

        bind( thisArg, ...argArray )
        {
            return super.bind( thisArg || this, ...argArray );
        }

        toString()
        {
            return funcToString.call( this.executable, this.executable );
        }
    }

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
            return (pTreatStringsAsObjects ? ((isString( pObject ) && _mt_str === pObject.trim())) : false) ||
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
     * Returns a new object with the same properties that is also an instance of the specified class
     * @param pObject an object from which to create the new instance
     * @param pClass the class to use for the new object
     * @returns {*} a new object with the same properties that is also an instance of the specified class
     */
    const convertToInstanceOf = function( pObject, pClass )
    {
        const clazz = isClass( pClass ) ? pClass : getClass( pClass || pObject ) || getClass( pObject );

        let object = asNew( pObject || {} );

        object.__proto__ = clazz.prototype;

        let newObject = new clazz();

        Object.assign( newObject, object );

        return newObject;
    };

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

        return !isBlank( key ) && isNonNullValue( entry?.value );
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
        let objects = [].concat( varargs( ...pObject ) ).filter( Filters.IS_OBJECT );

        // return an empty array if there are no objects left after applying the filter
        if ( null == objects || ((objects?.length || 0) <= 0) )
        {
            return lock( [] );
        }

        let keys = [];

        for( let object of objects )
        {
            let obj = (isObject( object ) || (object instanceof String)) ? object : {};

            keys = (obj instanceof Map) ? keys.concat( ...(obj.keys()) ) : (obj instanceof String) ? keys.concat( ...(toKeys( obj.valueOf().split( _mt_str ), true )) ) : keys.concat( ...(Object.keys( obj || {} ) || []) );

            let proto = obj?.prototype;

            const iterationCap = new IterationCap( 10 );

            while ( null != proto && proto !== Object && proto !== obj && !iterationCap.reached )
            {
                keys = keys.concat( ...(getKeys( proto )) ).map( Mappers.TRIMMED ).filter( NON_BLANK_STRINGS );

                obj = proto;

                proto = proto?.__proto__ || proto?.prototype;
            }

            keys = keys.map( e => asString( e, true ) ).filter( NON_BLANK_STRINGS );

            keys = unique( pruneArray( keys ) ).filter( e => !EXCLUDED_PROPERTIES.includes( e ) );
        }

        return lock( unique( pruneArray( keys ) ) );
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

        if ( isNull( pObject ) )
        {
            return properties;
        }

        let clazz = getClass( pObject );

        let source = _mt_str;

        try
        {
            source = isClass( clazz ) ? funcToString.call( clazz || {} ) : (isFunction( pObject.toString ) ? (pObject).toString() : _mt_str);
        }
        catch( ex )
        {
            // attempts to call toString on *some* built-in classes throw an exception instead of just returning "function() { [native code] }"
        }

        let rx = /(get +(\w+)\( *\))|(#(\w)[;\r\n,])/;

        let matches = rx.exec( source );

        while ( matches && matches?.length > 2 && source?.length > 4 )
        {
            let match = matches[2];

            properties.push( match );

            source = source.slice( matches.index + match.length + 4 );

            matches = rx.exec( source );
        }

        return [].concat( ...(properties || []).filter( e => !EXCLUDED_PROPERTIES.includes( e ) ) );
    };

    /**
     * Returns an array of the unique property names of the objects specified,
     * including those inherited from their prototype or superclass
     * @param pObject one or more objects whose keys will be returned
     * @returns {Readonly<*[]>|*[]} an array of the unique property names of the objects specified
     */
    const getProperties = function( ...pObject )
    {
        let objects = [].concat( varargs( ...pObject ) ).filter( Filters.IS_OBJECT );

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

        properties = properties.map( e => asString( e, true ) ).filter( NON_BLANK_STRINGS );
        properties = properties.filter( e => !EXCLUDED_PROPERTIES.includes( e ) );

        return lock( unique( pruneArray( properties ) ) );
    };

    /**
     * Returns an array of the unique property values of the objects specified,
     * including those inherited from their prototype or superclass
     * @param pObject one or more objects whose values will be returned
     * @returns {Readonly<*[]>|*[]} an array of the unique property values of the objects specified
     */
    const getValues = function( ...pObject )
    {
        let objects = [].concat( varargs( ...pObject ) ).filter( Filters.IS_OBJECT );

        if ( null == objects || ((objects?.length || 0) <= 0) )
        {
            return [];
        }

        let values = [];

        for( let object of objects )
        {
            if ( object instanceof Map )
            {
                values = (values.concat( ...(object.values() || []) ));
            }
            else if ( object instanceof Set || isArray( object ) )
            {
                values = (values.concat( ...object ));
            }
            else
            {
                const properties = getProperties( object );

                for( let property of properties )
                {
                    try
                    {
                        const value = object[property] || getProperty( object, property );

                        if ( isNonNullValue( value ) )
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
        }

        return lock( unique( pruneArray( values ) ) );
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
        let objects = [].concat( varargs( ...pObject ) ).filter( Filters.IS_OBJECT );

        if ( null == objects || ((objects?.length || 0) <= 0) )
        {
            return [];
        }

        let entries = [];

        for( let object of objects )
        {
            entries.push( ...(objectEntries( object )) );
        }

        entries = ((entries || []).filter( e => isArray( e ) && ((e?.length || 0) > 1) ));

        entries = entries.map( entry => new ObjectEntry( ...entry ) );

        return lock( entries );
    };

    const foldEntries = function( pObject, pVisited, pStack )
    {
        if ( !isObject( pObject ) || isNull( pObject ) )
        {
            return pObject;
        }

        let visited = pVisited || new ExploredSet();

        let stack = pStack || [];

        let result = { ...pObject };

        if ( detectCycles( stack, 5, 5 ) || visited.has( pObject ) )
        {
            return result;
        }

        const entries = Object.entries( pObject );

        for( let entry of entries )
        {
            if ( isNull( entry ) || !isArray( entry ) || ((entry?.length || 0) < 2) )
            {
                continue;
            }

            let key = entry[0];
            let value = entry[1];

            if ( entry instanceof ObjectEntry )
            {
                key = entry.key || key;
                value = entry.value || value;
            }

            if ( value instanceof ObjectEntry )
            {
                visited.add( value );
                stack.push( key );

                value = foldEntries( value );
            }

            if ( isArray( pObject ) )
            {
                key = asInt( key );
            }

            result[key] = value;
        }

        return result;
    };

    /**
     * Returns true if the object has no properties
     * whose value is a scalar or an object with properties that satisfy the same conditions
     * @param pObject an object to evaluate
     * @param pOptions an object to define whether (and how deep) to recursively check for valid properties
     * @returns {boolean} true if the object has no populated properties
     */
    const hasNoProperties = function( pObject, pOptions = { recursive: true, depth: 0, maxDepth: 10 } )
    {
        const options = asNew( pOptions || { recursive: true, depth: 0, maxDepth: 10 } );

        const shallow = false === options.recursive;
        const maxDepth = asInt( options.maxDepth, 10 );

        let depth = asInt( options.depth );

        if ( !isObject( pObject ) || isNull( pObject ) )
        {
            return true;
        }

        const arr = getProperties( pObject );

        if ( shallow || depth >= maxDepth )
        {
            return (arr?.length || 0) <= 0;
        }

        let result = true;

        for( let propertyName of arr )
        {
            let value = getProperty( pObject, propertyName );

            if ( !isEmptyValue( value, { recursive: !shallow, depth: depth + 1, maxDepth } ) )
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
     * @returns {boolean} true if the value is "empty"
     */
    const isEmptyValue = function( pValue, pOptions = DEFAULT_RECURSION_OPTIONS )
    {
        if ( isNull( pValue ) ||
             (isString( pValue ) && isBlank( asString( pValue, true ) )) ||
             (isArray( pValue ) && ((pValue?.length || 0) <= 0)) )
        {
            return true;
        }

        const options = populateOptions( pOptions, DEFAULT_RECURSION_OPTIONS );

        const shallow = false === options.recursive;
        const maxDepth = asInt( options.maxDepth, 10 );

        let depth = asInt( options.depth );

        if ( isObject( pValue ) )
        {
            if ( isNull( pValue ) )
            {
                return true;
            }

            if ( isArray( pValue ) )
            {
                if ( (pValue?.length || 0) <= 0 )
                {
                    return true;
                }

                if ( shallow || depth > maxDepth )
                {
                    return false;
                }

                for( let i = pValue.length; i--; )
                {
                    if ( !isEmptyValue( pValue[i], { recursive: !shallow, depth: depth + 1, maxDepth } ) )
                    {
                        return false;
                    }
                }

                return true;
            }

            const properties = getProperties( pValue );

            if ( null == properties || properties?.length <= 0 )
            {
                return true;
            }

            if ( shallow || depth > maxDepth )
            {
                return false;
            }

            for( let property of properties )
            {
                if ( !isEmptyValue( pValue[property], { recursive: !shallow, depth: depth + 1, maxDepth } ) )
                {
                    return false;
                }
            }

            return true;
        }

        return false;
    };

    const tracePathTo = function( pNode, pRoot, pPath = [], pStack = [], pVisited = [] )
    {
        let stack = asArray( pStack || [] );

        if ( detectCycles( stack, 5, 5 ) )
        {
            modulePrototype.reportError( new Error( `Entered an infinite loop at ${stack.join( _dot )}` ), `iterating a cyclically-connected graph`, S_ERROR, (modName + "::detectCycles"), stack );
            return [];
        }

        let paths = isString( pPath ) ? [...(pPath.split( _dot ).flat())] : isArray( pPath ) ? pPath || [] : [];

        if ( identical( pNode, pRoot ) )
        {
            return paths;
        }

        let target = isNull( pNode ) ? (_mt_str === pNode ? pNode : (isNull( pRoot ) ? null : pRoot)) : pNode;

        if ( identical( target, pRoot ) )
        {
            return paths;
        }

        let root = isNull( pRoot ) ? $scope() : (isPopulated( pRoot ) || isFunction( pRoot )) ? pRoot : $scope();

        if ( isNull( target ) || root === target )
        {
            return paths;
        }

        const scope = $scope();

        const visited = asArray( pVisited || [] );

        let found = false;

        const predicate = entry =>
        {
            return entry.value !== root &&
                   entry.value !== scope &&
                   !visited.includes( entry.value )
                   && isPopulated( entry.value,
                                   {
                                       minimumKeys: 1,
                                       acceptArrays: true,
                                       validTypes: [_obj, _num, _big, _str, _bool]
                                   } );
        };

        if ( root === scope || root === target )
        {
            return paths;
        }

        const entries = getEntries( root ).filter( predicate );

        for( let entry of entries )
        {
            let key = asString( entry.key || entry[0] );

            let value = entry.value || entry[1];

            if ( isNull( value ) )
            {
                continue;
            }

            visited.push( value );

            if ( value === target || same( value, target ) )
            {
                paths.push( key );
                found = true;
                break;
            }

            if ( isPopulated( value ) )
            {
                let result = tracePathTo( target, value, paths.concat( key ), stack.concat( key ), visited );

                if ( (result?.length || 0) > 0 )
                {
                    paths = asArray( result ).map( e => isString( e ) ? e.split( _dot ) : e ).flat();
                    found = true;
                    break;
                }
            }
        }

        if ( found )
        {
            return paths;
        }

        return (found ? paths : []);
    };

    const findNode = function( pRoot, ...pPaths )
    {
        let paths = toNonBlankStrings( ...pPaths );

        let node = pRoot || $scope();

        while ( isPopulated( node ) && paths.length )
        {
            const property = paths.shift();

            if ( isBlank( property ) )
            {
                continue;
            }

            node = node?.[property];
        }

        return (paths.length <= 0) ? node : null;
    };

    let findRoot = function( pScope, pCurrent, ...pPath )
    {
        findRoot.callCount = asInt( findRoot.callCount ) + 1;

        let scope = pScope || $scope();

        let path = toTrimmedNonBlankStrings( ...pPath );

        let node = scope;

        let root = (node === pCurrent || same( node, pCurrent )) ? node : null;

        if ( null == path || (path?.length || 0) <= 0 )
        {
            const pathTo = tracePathTo( pCurrent, scope );

            path = asArray( pathTo );
        }

        if ( null == path || (path?.length || 0) <= 0 )
        {
            findRoot.callCount = 0;

            return root;
        }

        if ( path[0] in scope )
        {
            let keys = [].concat( ...(asArray( path )) );

            node = scope;

            while ( keys.length && !isNull( node ) )
            {
                node = node?.[keys.shift()];
            }

            if ( node === pCurrent || same( node, pCurrent ) )
            {
                findRoot.callCount = 0;

                return scope;
            }
        }
        else
        {
            let scp = scope || root || $scope();

            const original = findRoot instanceof LimitedRecursiveFunction ? findRoot.original : findRoot;

            findRoot = findRoot instanceof LimitedRecursiveFunction ? findRoot : new LimitedRecursiveFunction( findRoot, 20 );

            if ( isNonNullObject( scp ) )
            {
                let props = Object.keys( scp );

                props = unique( props.filter( e => null != e && !isFunction( scp[e] ) && isPopulated( scp[e] ) && !(/^on\w+$|^\w+bar(s?)$|\w+storage|console|Socket/i.test( e )) && (scp[e] !== globalThis) && Object.keys( scp[e] || {} )?.length > 0 ) );

                for( let prop of props )
                {
                    let node = scp;

                    try
                    {
                        node = scp[prop];

                        if ( isPopulated( node ) && asInt( findRoot.callCount ) < 20 )
                        {
                            root = findRoot.call( node, node, pCurrent, ...pPath );

                            if ( isPopulated( root ) )
                            {
                                break;
                            }
                        }
                    }
                    catch( ex )
                    {
                        modulePrototype.reportError( ex, "trying to find the root node", S_ERROR, "LimitedRecursiveFunction::apply" );
                    }
                }
            }

            findRoot = findRoot.original || original;
        }

        this.callCount = Math.max( 0, asInt( findRoot.callCount ) - 1 );

        return root;
    };

    /**
     * Returns the value of the property specified.
     * Uses several techniques to find the property.
     * @param {object} pObject the object from which to return the value of the specified property
     * @param {string} pPropertyName the name of the property to retrieve
     * @returns the value of the property specified, if at all possible
     */
    const getProperty = function( pObject, pPropertyName )
    {
        // convert anything that could have been passed as a property name into something we can process
        let prop = (asString( isString( pPropertyName ) ? pPropertyName : (isValidObject( pPropertyName ) ? (isArray( pPropertyName ) ? asArray( pPropertyName ).join( _dot ) : _mt_str) : _mt_str) )).trim();

        // convert any private property names into the name of their potential accessor
        prop = asString( prop, true ).replace( /^#+/, _mt_str );

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
                if ( lcase( prop ) === S_LENGTH )
                {
                    return obj?.length || 0;
                }
                return obj;

            case _bool:
                return obj;

            case _fun:
                if ( [S_LENGTH, "name", "prototype"].includes( lcase( prop ) ) || obj[prop] )
                {
                    return obj[prop];
                }
                return obj;

            default:
                break;
        }

        if ( isArray( obj ) && (/^\d+$/.test( prop ) || [S_LENGTH].includes( prop )) )
        {
            return obj[prop] || obj[asInt( prop )];
        }

        let propertyName = bracketsToDots( asString( prop.trim() ) );

        let propertyValue = obj[propertyName];

        function isFound( pValue )
        {
            return isNonNullValue( pValue ) || isFunction( pValue );
        }

        // this statement accounts for an older convention of using _ as a prefix for the "private" property name
        if ( !isFound( propertyValue ) )
        {
            propertyValue = obj["_" + propertyName];
        }

        // if this is a normal property name (not a path like a.b.c or a[0][1][2]) and we have a value, we return it
        let found = !propertyName.includes( _dot ) && isFound( propertyValue );

        if ( found )
        {
            return propertyValue;
        }

        if ( !propertyName.includes( _dot ) )
        {
            const propertyDescriptor = Object.getOwnPropertyDescriptor( obj, propertyName ) || Object.getOwnPropertyDescriptor( obj, ("#" + propertyName) );

            if ( !isNull( propertyDescriptor ) )
            {
                let accessorMethod = propertyDescriptor?.get;

                propertyValue = propertyDescriptor?.value;

                if ( !isFound( propertyValue ) && isFunction( accessorMethod ) )
                {
                    try
                    {
                        let value = accessorMethod.call( obj ) || propertyValue;

                        if ( isFound( value ) )
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
        }

        if ( !found )
        {
            let accessor = obj["get" + toProperCase( propertyName ).replace( /\.\w+/g, _mt_str )];

            if ( isFunction( accessor ) )
            {
                propertyValue = accessor.call( obj ) || propertyValue;
            }

            if ( isFound( propertyValue ) )
            {
                return propertyValue;
            }

            if ( propertyName.includes( _dot ) )
            {
                let keys = propertyName.split( REG_EXP_DOT );

                while ( (isObject( obj )) && keys?.length )
                {
                    let key = keys.shift();
                    obj = obj[key] || obj["_" + key] || getProperty( obj, key );
                    found = isFound( obj ) && keys.length <= 0;
                }
            }
        }

        let returnValue = found ? obj : (obj[propertyName]);

        return isFound( returnValue ) ? returnValue : _mt_str;
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
            let propertyName = bracketsToDots( name );

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
     * @param pPropertyPath the property name or path to the property to change
     * @param pValue the value to assign to the specified property
     * @param pOptions options to control subtle behavior for edge cases
     * @returns {*} the value of the object property
     */
    const setProperty = function( pObject, pPropertyPath, pValue, pOptions )
    {
        const options = lock( asNew( pOptions || {} ) );

        const prop = (asString( isString( pPropertyPath ) ?
                                pPropertyPath :
                                (isValidObject( pPropertyPath ) ?
                                 (isArray( pPropertyPath ) ?
                                  pPropertyPath.join( _dot ) :
                                  _mt_str) :
                                 _mt_str) ));

        let propertyName = asString( prop, true );

        if ( isBlank( propertyName ) )
        {
            return null;
        }

        propertyName = bracketsToDots( asString( propertyName, true ) );

        const errorSource = modName + "::setProperty";

        switch ( typeof pObject )
        {
            case _ud:
                const errMsg = "an object is required";
                modulePrototype.reportError( new IllegalArgumentError( errMsg ), errMsg, S_ERROR, errorSource, propertyName );
                return pObject;

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

                        if ( !isNull( obj ) && isObject( obj ) )
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
                        modulePrototype.reportError( ex, `setting the property, ${nm}`, S_WARN, errorSource, obj, nm );

                        try
                        {
                            obj["_" + nm] = pValue;
                        }
                        catch( e )
                        {
                            modulePrototype.reportError( e, `setting the property, _${nm}`, S_WARN, errorSource, obj, nm );
                        }
                    }

                    if ( isFunction( pValue ) )
                    {
                        try
                        {
                            pValue.bind( obj );
                        }
                        catch( ex )
                        {
                            modulePrototype.reportError( ex, `binding function, ${nm}, to object`, S_WARN, errorSource, obj );
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
                    modulePrototype.reportError( ex, `setting the property, ${pPropertyPath}`, S_WARN, "setProperty" );
                }
        }

        return pObject?.[prop];
    };

    const canCompareObject = function( pObject, pStrict, pClass )
    {
        return !isNull( pObject ) && ( !(pStrict && pClass) || pObject instanceof pClass);
    };

    const canCompare = function( pValueA, pValueB, ...pTypes )
    {
        if ( isNonNullValue( pValueA ) && pValueA === pValueB )
        {
            return true;
        }

        const sameType = areSameType( pValueA, pValueB ) || ([_num, _big, _str].includes( typeof pValueA ) && [_num, _big, _str].includes( typeof pValueB ));

        let types = asArray( ...(pTypes || ([typeof pValueA, typeof pValueB].filter( e => VALID_TYPES.includes( e ) || isClass( e ) ))) );

        if ( sameType && types.length )
        {
            types = types.filter( e => (e === typeof pValueA) || ((isClass( e ) && (pValueA instanceof e) && (pValueB instanceof e))) );
            return types.length > 0;
        }

        return types.length <= 0;
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
     * @param pCaseSensitive (optional) if false, strings encountered are compared without regard to uppercase or lowercase characters
     * @param pStack USED INTERNALLY WHEN CALLING RECURSIVELY -- do not pass a value
     * @returns true if the 2 arguments represent the same object graph or the same number or other data type
     */
    const same = function( pFirst, pSecond, pStrict = false, pClass = null, pCaseSensitive = true, pStack = [] )
    {
        if ( pFirst === pSecond || (isNull( pFirst ) && isNull( pSecond )) )
        {
            return true;
        }

        if ( !canCompare( pFirst, pSecond ) )
        {
            return false;
        }

        const errorSource = modName + "::same";

        if ( isNumeric( pFirst ) )
        {
            if ( isNumeric( pSecond ) )
            {
                try
                {
                    const first = parseFloat( pFirst );

                    const second = parseFloat( pSecond );

                    const diff = Math.abs( first - second );

                    return (first === second) || ( !isNaN( diff ) && diff < 0.000000001);
                }
                catch( ex )
                {
                    modulePrototype.reportError( ex, `comparing objects`, S_WARN, errorSource );
                }

                return false;
            }

            return false;
        }

        if ( isString( pFirst ) && isString( pSecond ) )
        {
            if ( pStrict )
            {
                return pFirst === pSecond || (false === pCaseSensitive && ucase( asString( pFirst ) ) === ucase( asString( pSecond ) ));
            }

            const options = false === pCaseSensitive ? { transformations: [function( s ) { return ucase( s ); }] } : {};

            return asString( pFirst, true, options ) === asString( pSecond, true, options );
        }

        if ( isBoolean( pFirst ) && isBoolean( pSecond ) )
        {
            return pFirst === pSecond;
        }

        if ( isFunction( pFirst ) )
        {
            return (isFunction( pSecond )) && asString( pFirst.toString(), true ) === asString( pSecond.toString(), true );
        }

        const stack = asArray( pStack || [] );

        if ( detectCycles( stack, 5, 5 ) )
        {
            modulePrototype.reportError( new Error( `Entered an infinite loop at ${stack.join( _dot )}` ), `iterating a cyclically-connected graph`, S_ERROR, modName + "::detectCycles", stack );
            return false;
        }

        if ( isNonNullObject( pFirst ) )
        {
            if ( isArray( pFirst ) )
            {
                if ( isNonNullObject( pSecond ) && isArray( pSecond ) )
                {
                    if ( (pFirst?.length || 0) !== (pSecond?.length || 0) )
                    {
                        return false;
                    }

                    const first = [].concat( ...(pFirst || []) ).sort();
                    const second = [].concat( ...(pSecond || []) ).sort();

                    let result = true;

                    for( let i = first.length; i--; )
                    {
                        if ( !same( first[i], second[i], pStrict, null, pCaseSensitive, stack.concat( asString( i ) ) ) )
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

            if ( isNonNullObject( pSecond ) )
            {
                for( let p in pFirst )
                {
                    if ( !same( getProperty( pFirst, p ), getProperty( pSecond, p ), pStrict, null, pCaseSensitive, stack.concat( p ) ) )
                    {
                        return false;
                    }
                }

                for( let p in pSecond )
                {
                    if ( !same( getProperty( pSecond, p ), getProperty( pFirst, p ), pStrict, null, pCaseSensitive, stack.concat( p ) ) )
                    {
                        return false;
                    }
                }

                return !!pStrict || (((pClass) ? (pFirst instanceof pClass && pSecond instanceof pClass) : ((null === pFirst.constructor && null === pSecond.constructor) || (pFirst.constructor === pSecond.constructor))));
            }

            return false;
        }

        const firstID = asString( pFirst?.getUniqueObjectInstanceId() || pFirst?.GUID );
        const secondID = asString( pSecond?.getUniqueObjectInstanceId() || pSecond?.GUID );

        if ( !(isBlank( firstID ) || isBlank( secondID )) && same( firstID, secondID, pStrict, String, true, stack ) )
        {
            return true;
        }

        try
        {
            const jsonFirst = asString( pFirst );
            const jsonSecond = asString( pSecond );

            if ( same( jsonFirst, jsonSecond, pStrict, String, pCaseSensitive, stack ) )
            {
                return true;
            }
        }
        catch( ex )
        {
            modulePrototype.reportError( ex, `comparing 2 objects`, S_WARN, errorSource );
        }

        return false;
    };

    Object.prototype.isIdenticalTo = function( pOther, pStrict, pClass )
    {
        return canCompareObject( pOther, pStrict, pClass ) && (identical( this, pOther ));
    };

    Object.prototype.equals = function( pObject )
    {
        return same( this, pObject, true, getClass( this ) );
    };

    const arrayToObject = function( pArr, pKeyProperty = _mt_str )
    {
        let arr = asArray( pArr );

        let keyProperty = asString( pKeyProperty, true );

        let useKeyProperty = !isBlank( keyProperty );

        if ( 1 === arr?.length && (isObject( arr[0] ) && !isArray( arr[0] )) )
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

        let key = _mt_str;
        let value = _mt_str;

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
                    key = asString( i, true );
                    value = elem;
                    break;

                case _fun:
                    key = asKey( asString( elem.name, true ).trim() || asString( funcToString.call( elem ), true ).trim() ) || ("Function_" + asString( i ));

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
     * @param pFunctionName {string|[string]} the name of the method the object must implement to be returned
     * @param pCandidates {...object} one or more objects that might implement the specified method
     * @returns {object} the leftmost object that implements the specified method
     */
    const findImplementor = function( pFunctionName, ...pCandidates )
    {
        let methodNames = asArray( pFunctionName || [] );

        const candidates = asArray( [].concat( varargs( ...pCandidates ) ) ).flat( Infinity );

        let implementor = null;

        for( const methodName of methodNames )
        {
            while ( (null == implementor || !isFunction( implementor[methodName] )) && candidates.length )
            {
                implementor = candidates.shift();

                if ( implementor && isFunction( implementor[methodName] ) )
                {
                    break;
                }
            }

            if ( implementor && isFunction( implementor[methodName] ) )
            {
                return implementor;
            }
        }

        return null;
    };

    /**
     * Returns an array of objects that implement one or more of the method(s) specified
     * @param pMethodNames {string|[string]} an array of strings that are method names (or a string that is a method name)
     * @param pCandidates {...object} one or more objects, the subset of which to return if the object implements one or more of the specified method(s)
     * @returns {*[]}  an array of objects that implement one or more of the method(s) specified
     */
    const collectImplementors = function( pMethodNames, ...pCandidates )
    {
        let methodNames = asArray( pMethodNames || [] );

        const arr = (varargs( ...pCandidates )).filter( Filters.IS_OBJECT );

        const implementors = [];

        for( const methodName of methodNames )
        {
            for( const candidate of arr )
            {
                if ( null == candidate )
                {
                    continue;
                }

                if ( isFunction( candidate[methodName] ) )
                {
                    implementors.push( candidate );
                }
            }
        }

        return implementors;
    };

    function getTypeHint( pTypeHint, pValue )
    {
        let type = lcase( asString( pTypeHint || typeof pValue ) );
        return JS_TYPES.includes( type ) ? type : typeof pValue;
    }

    /**
     * Returns an object with the same structure or type with all values replaced with the default for that type.
     * For primitive types, returns the default value for that type (examples: 0, false, "")
     * For arrays, returns an array with each element mapped to an emptyClone
     * For an object, returns a new object with the same structure
     * with all values populated with an emptyClone of that value
     * @param pAny {any} an object or primitive for which to return an empty clone or default value
     * @param pTypeHint {string} a string describing the type of the first argument
     * @param pThis {object} an object to which to bind any functions being cloned
     *
     * @param pStack {[string]} USED INTERNALLY TO PREVENT INFINITE RECURSION; DO NOT PASS A VALUE FROM CLIENT CODE
     * @returns {{}|undefined|number|string|*[]|unknown|(function(...[*]): *)|boolean} an object with the same structure or type with all values replaced with the default for that type
     */
    const emptyClone = function( pAny, pTypeHint, pThis = null, pStack = [] )
    {
        const stack = asArray( pStack || [] );

        let type = getTypeHint( pTypeHint, pAny );

        switch ( type )
        {
            case _ud:
                return undefined;

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
                    if ( detectCycles( stack, 3, 3 ) )
                    {
                        let arr = [].fill( null, 0, pAny.length );
                        pAny.forEach( ( e, i ) =>
                                      {
                                          arr[i] = defaultFor( typeof e );
                                      } );
                        return arr;
                    }

                    return [].concat( asArray( pAny ).map( (( e, i ) => emptyClone( e, typeof e, pAny, stack.concat( ("array[" + i + "]") ) )) ) );
                }

                let obj = {};

                let entries = getEntries( pAny );

                if ( detectCycles( stack, 3, 3 ) )
                {
                    entries.forEach( entry =>
                                     {
                                         obj[entry.key || entry[0]] = defaultFor( typeof (entry.value || entry[1]) );
                                     } );

                    return obj;
                }

                stack.push( pAny );

                try
                {
                    for( let entry of entries )
                    {
                        if ( entry )
                        {
                            let key = entry.key || entry[0];
                            let value = entry.value || entry[1];

                            obj[key] = emptyClone( value, typeof value, obj, stack.concat( key ) );
                        }
                    }
                }
                finally
                {
                    stack.pop();
                }

                return asNew( obj );

            case _symbol:
                return pAny;

            case _fun:
                return function( ...pArgs )
                {
                    let result = null;

                    try
                    {
                        result = pAny.call( (pThis || this || pAny), ...pArgs );
                    }
                    catch( ex )
                    {
                        modulePrototype.reportError( ex, `executing a function while generating an empty clone`, S_WARN, modName + "::emptyClone" );
                    }

                    return result;
                };

            default:
                return {};
        }
    };

    const DEFAULT_CLONE_OPTIONS =
        {
            omitFunctions: false,
            freeze: false,
            maxDepth: MAX_CLONE_DEPTH
        };

    const DEFAULT_ASSIGN_OPTIONS =
        {
            maxDepth: MAX_ASSIGN_DEPTH,
            omitFunctions: DEFAULT_CLONE_OPTIONS.omitFunctions,
            freeze: DEFAULT_CLONE_OPTIONS.freeze,
        };

    /**
     * Returns a new object that is a deep copy of the specified argument
     *
     * @param pObject {object|[any]} an object or array to clone
     * @param pOptions {object} an object specifying how to handle null values, undefined values and whether to return a mutable or immutable copy
     *
     * boolean indicating whether to return an object with or without its methods preserved
     *
     * @param pStack the paths previously traversed to detect an infinite cycle; used internally (DO NOT PASS A VALUE FROM CLIENT CODE)
     *
     * @returns {object} a new object that is a deep copy of the specified argument
     */
    const clone = function( pObject, pOptions = DEFAULT_CLONE_OPTIONS, pStack = [] )
    {
        const options = populateOptions( pOptions, DEFAULT_CLONE_OPTIONS );

        const omitFunctions = true === options?.omitFunctions;
        const freeze = true === options?.freeze;
        const maxDepth = Math.max( 1, Math.min( 32, asInt( options?.maxDepth, MAX_CLONE_DEPTH ) ) );

        if ( !isObject( pObject ) )
        {
            return isNull( pObject ) ? null : (freeze ? lock( pObject ) : pObject);
        }

        const stack = asArray( pStack || [] );


        let obj = isArray( pObject ) ? [].concat( pObject ).map( e => clone( e, options, stack ) ) : asNew( pObject || {} );

        let twin = isArray( obj ) ? [].concat( obj ).map( e => clone( e, options, stack ) ) : asNew( obj || {} );


        if ( stack.length > maxDepth || detectCycles( stack, 3, 3 ) )
        {
            return isArray( twin ) ? [...twin] : asNew( twin );
        }

        const entries = getEntries( obj );

        let methods = {};

        const errorSource = modName + "::clone";

        for( let entry of entries )
        {
            const propertyName = entry.key || entry[0];

            const value = entry.value || entry[1];

            let copy = value || obj[propertyName];

            switch ( typeof copy )
            {
                case _fun:
                    try
                    {
                        if ( !isClass( copy ) )
                        {
                            value.bind( methods );
                            methods[propertyName] = copy;

                            twin[propertyName] = null;
                            delete twin[propertyName];
                        }
                    }
                    catch( ex )
                    {
                        modulePrototype.reportError( ex, `cloning an object`, S_WARN, errorSource );
                    }
                    break;

                case _obj:

                    try
                    {
                        copy = (isFunction( copy?.clone )) ?
                               copy.clone() :
                               clone( copy, options, stack.concat( propertyName ) );

                        twin[propertyName] = freeze ? lock( copy ) : copy;
                    }
                    catch( ex )
                    {
                        modulePrototype.reportError( ex, `cloning an object`, S_TRACE, errorSource );

                        try
                        {
                            twin[propertyName] = Object.assign( (twin[propertyName] || {}), ((freeze ? lock( value ) : value) || {}) );
                        }
                        catch( ex2 )
                        {
                            modulePrototype.reportError( ex2, `cloning an object`, S_ERROR, errorSource );
                        }
                    }

                    break;

                default:
                    twin[propertyName] = freeze ? lock( copy ) : copy;
                    break;
            }
        }

        if ( omitFunctions )
        {
            const returnValue = twin || asNew( obj );

            return freeze ? lock( returnValue ) : returnValue;
        }

        for( let entry of getEntries( methods ) )
        {
            const value = entry.value || entry[1];

            if ( isFunction( value ) && !isClass( value ) )
            {
                const propertyName = entry.key || entry[0];

                try
                {
                    twin[propertyName] = value;
                    value.bind( twin );
                }
                catch( ex )
                {
                    modulePrototype.reportError( ex, `binding ${propertyName} while cloning an object`, S_WARN, errorSource );
                }
            }
        }

        const returnValue = twin || asNew( obj );

        return freeze ? lock( returnValue ) : returnValue;
    };

    /**
     * Creates a clone of the specified object that can be transferred to a worker or service worker
     * @param pObject the object to clone
     * @param pOptions options to control the cloning
     * @returns {unknown} a new object that can be transferred to a worker or service worker
     */
    const toStructuredCloneableObject = function( pObject, pOptions )
    {
        let options = asNew( (pOptions || { freeze: false, omitFunctions: true }) );

        let obj = clone( pObject, options );

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
        let defaults = [].concat( varargs( pDefault ) ).filter( Filters.IS_POPULATED_OBJECT );

        pObject = isObject( pObject ) ? pObject || {} : {};

        for( let i = 0, n = defaults.length; i < n; i++ )
        {
            let source = defaults[i];

            pObject = assign( pObject, source );
        }

        return pObject;
    };

    const DEFAULT_AUGMENT_OPTIONS =
        {
            recursive: true,
            appendToArrays: false,
            addMissingMapEntries: false,
            appendToSets: false,
            mergeUnmatchedClasses: false
        };

    function _accessor( pObject, pKey, pDefault )
    {
        let obj = isObject( pObject ) && !isNull( pObject ) ? pObject : {};

        let key = asString( pKey );

        let value = null;

        const errorSource = modName + "::_accessor";

        try
        {
            value = getProperty( obj, key ) || obj[key];
        }
        catch( ex )
        {
            modulePrototype.reportError( ex, `accessing property, ${key}`, S_WARN, errorSource );
        }

        if ( !isNonNullValue( value ) )
        {
            try
            {
                obj[key] = pDefault;

                value = pDefault;
            }
            catch( ex )
            {
                modulePrototype.reportError( ex, `assigning ${pDefault} to property, ${key}`, S_WARN, errorSource );
            }
        }

        if ( isArray( obj[key] ) )
        {
            try
            {
                obj[key] = [].concat( obj[key] );
            }
            catch( ex )
            {
                modulePrototype.reportError( ex, `modifying an array for property, ${key}`, S_WARN, errorSource );
            }
        }

        return value;
    }

    const addMissing = function( pTarget, pSource, pOptions = { copy: false, freeze: false }, pClass )
    {
        const proceed = (pClass === Set) ? (isSet( pTarget ) && isSet( pSource )) : (pClass === Map) ? (isMap( pTarget ) && isMap( pSource )) : false;

        if ( proceed )
        {
            const options = populateOptions( pOptions, { copy: false } );

            let target = true === options.copy ? clone( pTarget ) : pTarget;

            if ( isReadOnly( target ) )
            {
                return target;
            }

            if ( isFunction( target.union ) )
            {
                target = target.union( pSource );
                return target;
            }

            pSource.forEach( ( val, key ) =>
                             {
                                 const k = key || val;
                                 if ( !(target.has( k )) )
                                 {
                                     try
                                     {
                                         if ( pClass === Map )
                                         {
                                             target.set( k, val );
                                         }
                                         else
                                         {
                                             target.add( val );
                                         }
                                     }
                                     catch( ex )
                                     {
                                         const msg = (pClass === Set) ? `modifying a Set, attempting to add value: ${val}` : `modifying map entry, ${key}`;
                                         modulePrototype.reportError( ex, msg, S_WARN, (modName + "::addMissing" + ((pClass === Set) ? "Values" : "Elements")), val, k );
                                     }
                                 }
                             } );
        }

        return pTarget;
    };

    const addMissingEntries = function( pTarget, pSource, pOptions = { copy: false, freeze: false } )
    {
        return addMissing( pTarget, pSource, pOptions, Map );
    };

    const addMissingElements = function( pTarget, pSource, pOptions = { copy: false, freeze: false } )
    {
        return addMissing( pTarget, pSource, pOptions, Set );
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
    const augment = function( pObject, pObjectB, pOptions = DEFAULT_AUGMENT_OPTIONS, pStack = [] )
    {
        const options = populateOptions( pOptions, DEFAULT_AUGMENT_OPTIONS );

        const _stack = asArray( pStack || [] );

        // start by creating a shallow copy of each object
        let objA = asNew( pObject || pObjectB || {} );

        const objB = lock( asNew( pObjectB || pObject || {} ) );

        if ( detectCycles( _stack, 3, 3 ) )
        {
            return Object.assign( objA, objB );
        }

        const entries = getEntries( objB );

        for( let i = 0, n = entries.length; i < n; i++ )
        {
            const entry = entries[i];

            const key = asString( entry?.key || entry[0] ) || "~!~";
            const value = entry?.value || entry[1] || getProperty( objB, key );

            if ( isBlank( key ) || EXCLUDED_PROPERTIES.includes( key ) || isNull( value ) )
            {
                continue;
            }

            _stack.push( key );

            let valueA = _accessor( objA, key, value );

            if ( isArray( valueA ) && isArray( value ) )
            {
                if ( options.appendToArrays )
                {
                    try
                    {
                        objA[key] = unique( [].concat( valueA ).concat( value ) );
                    }
                    catch( ex )
                    {
                        modulePrototype.reportError( ex, `modifying key, ${key}`, S_WARN, modName + "::augment" );
                    }
                }
            }
            else if ( (valueA instanceof Map) && (value instanceof Map) && options.addMissingMapEntries )
            {
                objA[key] = addMissingEntries( valueA, value );
            }
            else if ( (valueA instanceof Set) && (value instanceof Set) && (options.appendToSets || options.unionOfSets) )
            {
                objA[key] = addMissingElements( valueA, value );
            }
            else if ( (isObject( valueA ) && isObject( value )) && (false !== options.recursive) && !isDate( valueA ) )
            {
                const classA = getClass( valueA );

                const classB = getClass( value );

                const classesAreCompatible = ((classA === classB) || (valueA instanceof classB) || (value instanceof classA));

                if ( classesAreCompatible || true === options.mergeUnmatchedClasses )
                {
                    objA[key] = augment( objA[key], (value), options, _stack.concat( key ) );
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

        const path = asArray( pPath );

        // start by creating a shallow copy of each object
        let objA = asNew( pTarget || pSource || {} );

        const objB = asNew( pSource || pTarget || {} );

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

                objA[key] = ((isObject( value )) ? populate( valueA, value, visited, path.concat( key ) ) : (value));
            }
        }

        return objA;
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

        const options = asNew( pOptions || { assumeUnderscoresConvention: true } );

        let prefixes = [];

        if ( options?.assumeUnderscoresConvention )
        {
            prefixes.push( _underscore );
        }

        for( let prefix of (options?.prefixes || []) )
        {
            prefixes.push( prefix );
        }

        const errorSource = modName + "::removeProperty";

        try
        {
            delete pObject[propertyName];
        }
        catch( ex )
        {
            modulePrototype.reportError( ex, `deleting property, ${propertyName}`, S_WARN, errorSource );
        }

        for( let prefix of prefixes )
        {
            try
            {
                delete pObject[prefix + propertyName];
            }
            catch( ex )
            {
                modulePrototype.reportError( ex, `deleting property, ${prefix}${propertyName}`, S_WARN, errorSource );
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

        const propertyNames = unique( pruneArray( [].concat( varargs( ...pPropertyNames ) ) ) );

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
                    modulePrototype.reportError( ex, `deleting property, ${propertyName}`, S_WARN, modName + "::removeProperties" );
                }
            }
        }

        return obj;
    };

    const DEFAULT_PRUNING_OPTIONS =
        {
            removeEmptyObjects: true,
            removeEmptyArrays: true,
            removeEmptyStrings: false,
            removeFunctions: false,
            pruneArrays: false,
            trimStrings: false
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
        const options = populateOptions( pOptions, DEFAULT_PRUNING_OPTIONS || {} );

        let stack = [].concat( asArray( pStack ) );

        if ( detectCycles( stack, 3, 3 ) )
        {
            return pObject;
        }

        if ( !isObject( pObject ) )
        {
            switch ( typeof pObject )
            {
                case _ud:
                    return null;

                case _str:
                    let str = asString( pObject, options.trimStrings );
                    return (options.removeEmptyStrings ? isBlank( str ) ? null : str : str);

                case _num:
                case _big:
                    if ( isValidNumber( pObject ) )
                    {
                        return pObject;
                    }
                    return null;

                default:
                    return pObject;
            }
        }

        if ( isArray( pObject ) )
        {
            return options.pruneArrays ? pruneArray( pObject ) : pObject;
        }

        let obj = assign( defaultFor( pObject ) || {}, pObject || {} );

        const keys = getKeys( obj );
        const propertyNames = getProperties( obj );

        let properties = unique( pruneArray( [].concat( keys ).concat( propertyNames ) ) );
        properties = properties.map( e => asString( e, true ) ).filter( Filters.NON_BLANK );

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
                modulePrototype.reportError( ex, `accessing property, ${propertyName}`, S_WARN, modName + "::pruneObject" );
            }

            switch ( typeof value )
            {
                case _ud:
                    obj = removeProperty( obj, propertyName, options );
                    break;

                case _str:
                    value = asString( value, options.trimStrings );

                    setProperty( obj, propertyName, value );

                    if ( isBlank( value ) && options.removeEmptyStrings )
                    {
                        obj = removeProperty( obj, propertyName, options );
                    }

                    break;

                case _num:
                case _big:
                    if ( isNaN( value ) || !isFinite( value ) )
                    {
                        obj = removeProperty( obj, propertyName, options );
                    }
                    break;

                case _bool:
                    break;

                case _fun:
                    if ( options.removeFunctions )
                    {
                        obj = removeProperty( obj, propertyName, options );
                    }
                    break;

                case _obj:
                    if ( isArray( value ) )
                    {
                        if ( options.pruneArrays )
                        {
                            value = pruneArray( value );
                            setProperty( obj, propertyName, value );
                        }

                        if ( options.removeEmptyArrays && value?.length <= 0 )
                        {
                            obj = removeProperty( obj, propertyName, options );
                        }
                    }
                    else
                    {
                        try
                        {
                            value = pruneObject( value, options, stack.concat( propertyName ) );
                            setProperty( obj, propertyName, value );
                        }
                        catch( ex )
                        {
                            modulePrototype.reportError( ex, `setting property, ${propertyName}`, S_WARN, modName + "::pruneObject" );
                        }

                        if ( options.removeEmptyObjects )
                        {
                            if ( isNull( value ) || isEmptyValue( value ) )
                            {
                                obj = removeProperty( obj, propertyName, options );
                            }
                        }
                    }
                    break;

                default:
                    break;
            }
        }

        return obj;
    };
    /*

     const DEFAULT_LITERAL_OPTIONS =
     {
     removeFunctions: true
     };
     */

    /**
     * Returns an object literal based on the specified object.
     * That is, this erases the class or prototype information
     * and just returns a POJO of the object's current state
     * @param pObject object from which to construct an object literal
     * @param pOptions
     * @param pStack
     * @returns {*} a new object with no class or prototype affiliation
     */
    /*
     const toLiteral = function( pObject, pOptions = DEFAULT_LITERAL_OPTIONS, pStack = [] )
     {
     const options = populateOptions( pOptions, DEFAULT_LITERAL_OPTIONS );

     let literal = {};

     if ( isFunction( pObject ) )
     {
     return (options.removeFunctions ? undefined : pObject);
     }

     if ( isNullOrEmpty( pObject ) )
     {
     return emptyClone( pObject, _obj );
     }

     const stack = asArray( pStack || [] );

     if ( detectCycles( stack, 3, 3 ) )
     {
     return assign( (emptyClone( pObject, _obj ) || {}), pObject || {} );
     }

     if ( pObject instanceof Map )
     {
     let _map = {};

     for( let entry of pObject.entries() )
     {
     let key = asString( entry[0] );
     _map[key] = toLiteral( entry[1], options, stack.concat( key ) );
     }

     literal = asNew( _map );
     }
     else if ( pObject instanceof Set )
     {
     literal = [].concat( [...pObject] ).map( ( e, i ) => toLiteral( e, options, stack.concat( i ) ) );
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

     literal = pObject;
     break;

     case _fun:

     if ( options.removeFunctions )
     {
     literal = undefined;
     }
     break;

     case _symbol:

     literal = pObject;
     break;

     case _obj:
     if ( isArray( pObject ) )
     {
     literal = [...pObject].map( ( e, i ) => toLiteral( e, options, stack.concat( i ) ) );
     }
     else
     {
     literal = emptyClone( pObject, _obj ) || {};

     let entries = [...(getEntries( pObject ))];

     getProperties( pObject ).forEach( ( key, i ) =>
     {
     const properties = [key, toLiteral( pObject[key], options, stack.concat( i ) )];
     if ( properties && properties.length > 1 && isString( properties[0] ) && !isNull( properties[1] ) )
     {
     entries.push( properties );
     }
     } );

     for( let entry of entries )
     {
     let key = entry.key || entry[0];
     let value = entry.value || entry[1];

     if ( !isBlank( key ) )
     {
     let literalValue = toLiteral( value, options, stack.concat( key ) );

     let remove = isNull( literalValue );

     if ( !options.prune || !isEmptyValue( literalValue ) )
     {
     if ( !options.removeFunctions || !(isFunction( literalValue )) )
     {
     setProperty( literal, key, literalValue );
     }
     else
     {
     remove = true;
     }
     }

     if ( remove )
     {
     removeProperty( literal, key );
     }
     }
     }
     }

     break;

     default:
     break;
     }
     }

     if ( null !== literal && isObject( literal ) )
     {
     const errorSource = modName + "::toLiteral";

     try
     {
     literal.prototype = Object.prototype;
     literal.__proto__ = Object.prototype;
     }
     catch( ex )
     {
     modulePrototype.reportError( ex, `resetting prototype`, S_WARN, errorSource );
     }

     try
     {
     literal.constructor = null;
     }
     catch( ex )
     {
     modulePrototype.reportError( ex, `removing constructor`, S_WARN, errorSource );
     }

     if ( options.prune )
     {
     literal = pruneObject( literal, options );
     }
     }

     return literal;
     };
     */

    /**
     * Performs a 'deep' Object.assign of the properties of the source to the target.
     * Returns the modified target unless the specified target is frozen, in which case, a new object is returned
     * @param pTarget the object to which to assign the properties of the source
     * @param pSource an object from which to assign properties to the target
     * @param pOptions
     * @param pStack INTERNALLY USED TO PREVENT INFINITE LOOPS
     * @returns {object} an object (potentially the original target) with the source properties assigned
     */
    const assign = function( pTarget, pSource, pOptions = DEFAULT_ASSIGN_OPTIONS, pStack = [] )
    {
        let target = pTarget || {};
        let source = pSource || {};

        const options = populateOptions( pOptions, DEFAULT_ASSIGN_OPTIONS );

        const freeze = !!options?.freeze;
        const omitFunctions = !!options?.omitFunctions;
        const maxDepth = Math.max( 1, Math.min( 32, asInt( options?.maxDepth, MAX_ASSIGN_DEPTH ) ) );

        if ( target === source || !isObject( target ) )
        {
            return freeze ? lock( target ) : target;
        }

        if ( isReadOnly( target ) )
        {
            if ( isArray( target ) )
            {
                target = [].concat( asArray( target || pTarget ) );
            }
            else
            {
                target = asNew( target || pTarget || {} );
            }
        }

        if ( !isReadOnly( pTarget ) )
        {
            pTarget = Object.assign( pTarget, Object.assign( target, source ) );
            target = pTarget;
        }

        const stack = asArray( pStack || [] );

        if ( stack.length > maxDepth || detectCycles( stack, 4, 4 ) )
        {
            return clone( target, options, stack );
        }

        const entries = getEntries( target );

        for( let entry of entries )
        {
            let property = entry.key || entry[0];
            let value = entry.value || entry[1];

            if ( isFunction( value ) && omitFunctions )
            {
                continue;
            }

            if ( isObject( value ) )
            {
                try
                {
                    value = assign( (target[property] || defaultFor( value ) || {}), (value || {}), options, stack.concat( property ) );

                    value = freeze ? lock( value ) : value;

                    if ( !isReadOnly( pTarget ) )
                    {
                        pTarget[property] = Object.assign( (pTarget[property] || defaultFor( value ) || {}), (value || {}) );
                    }
                }
                catch( ex )
                {
                    modulePrototype.reportError( ex, ex.message, S_ERROR, modName + "::assign", target, source, property, value );
                }
            }
            else
            {
                value = freeze ? lock( value ) : value;

                target[property] = value;

                if ( !isReadOnly( pTarget ) )
                {
                    pTarget[property] = value;
                }
            }
        }

        const result = (isReadOnly( pTarget ) ? target : pTarget) || target || pTarget || source;

        return freeze ? lock( result ) : result;
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
            if ( (isNull( entry[1] ) || [_fun, _symbol].includes( typeof entry[1] )) )
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

    const estimateObjectSize = function( pObject, pStack = [] )
    {
        const explored = new ExploredSet(); // To prevent infinite recursion on circular objects

        let obj = isNonNullObject( pObject ) ? pObject : {};

        const objList = [obj];

        const stack = asArray( pStack || [] );

        let bytes = 0;

        while ( objList.length )
        {
            const value = objList.pop();

            if ( isNonNullObject( value ) )
            {
                if ( explored.has( value ) )
                {
                    continue;
                }

                explored.add( value );

                const entries = getEntries( value );

                for( let entry of entries )
                {
                    const key = entry.key || entry[0];

                    stack.push( key );

                    const value = entry.value || entry[1];

                    objList.push( value );

                    bytes += 8; // an extra 8 bytes for the object itself
                }
            }
            else if ( [_symbol, _fun].includes( typeof value ) )
            {
                bytes += 8; // arbitrary guess for the size of a 'handle'
            }
            else
            {
                bytes += BYTES_PER_TYPE[typeof value];
            }

            if ( detectCycles( stack, 3, 3 ) )
            {
                break;
            }
        }
        return bytes;
    };

    /////
    const CLASS_SYMBOL =
        {
            ID: Symbol( "_bock_id" ),
            NAME: Symbol( "_bock_name" ),
            DESCRIPTION: Symbol( "_bock_description" ),
        };

    class Identified
    {
        constructor( pId )
        {
            this[CLASS_SYMBOL.ID] = pId;
        }

        get id()
        {
            return this[CLASS_SYMBOL.ID];
        }
    }

    class Identifiable extends Identified
    {
        constructor( pId )
        {
            super( pId );
        }

        set id( pId )
        {
            this[CLASS_SYMBOL.ID] = pId;
        }
    }

    class Named extends Identified
    {
        constructor( pId, pName )
        {
            super( pId );
            this[CLASS_SYMBOL.NAME] = pName;
        }

        get name()
        {
            return this[CLASS_SYMBOL.NAME];
        }
    }

    class Nameable extends Named
    {
        #identifiable;

        constructor( pId, pName )
        {
            super( pId, pName );
            this.#identifiable = new Identifiable( pId );
        }

        get id()
        {
            return this.#identifiable.id;
        }

        set id( pId )
        {
            this.#identifiable.id = pId;
        }

        set name( pName )
        {
            this[CLASS_SYMBOL.NAME] = pName;
        }
    }

    class Described extends Named
    {
        constructor( pId, pName, pDescription )
        {
            super( pId, pName );

            this[CLASS_SYMBOL.DESCRIPTION] = pDescription;
        }

        get description()
        {
            return this[CLASS_SYMBOL.DESCRIPTION];
        }
    }

    class Describable extends Described
    {
        #identifiable;
        #nameable;

        constructor( pId, pName, pDescription )
        {
            super( pId, pName, pDescription );

            this.#identifiable = new Identifiable( pId );
            this.#nameable = new Nameable( pId, pName );
        }

        set description( pDescription )
        {
            this[CLASS_SYMBOL.DESCRIPTION] = pDescription;
        }

        set name( pName )
        {
            this.#nameable.name = pName;
        }

        get name()
        {
            return this.#nameable.name;
        }

        set id( pId )
        {
            this.#identifiable.id = pId;
        }

        get id()
        {
            return this.#identifiable.id;
        }
    }

    class MergeRule extends Described
    {
        constructor( pId, pName, pDescription )
        {
            super( pId, pName, pDescription );
        }

        resolveTarget( pObject, pKey )
        {
            const obj = isNonNullObj( pObject ) ? pObject || {} : {};
            const key = isString( pKey ) || isNum( pKey ) || isSymbol( pKey ) ? pKey : String( pKey || _mt_str );
            return { obj, key };
        }

        equals( pOther )
        {
            return isNonNullObj( pOther ) &&
                   this.id === pOther?.id &&
                   this.name === pOther?.name;
        }
    }

    MergeRule.resolveRule = ( pRulesMap, pId, pName ) => (pRulesMap || {})[pId || _mt_str] || (pRulesMap || {})[pName || pId || _mt_str];

    class MergeDirection extends MergeRule
    {
        constructor( pId, pName, pDescription )
        {
            super( pId, pName, pDescription );
        }

        order( ...pObjects )
        {
            const objects = [...(pObjects || [])];
            return (this === MergeDirection.LEFT_TO_RIGHT || "ltr" === this[CLASS_SYMBOL.ID]) ? objects : objects.reverse();
        }

        equals( pOther )
        {
            return (pOther instanceof this.constructor) && super.equals( pOther );
        }
    }

    MergeDirection.LEFT_TO_RIGHT = new MergeDirection( "ltr", "LeftToRight", "Merge the leftmost objects into the rightmost object" );
    MergeDirection.RIGHT_TO_LEFT = new MergeDirection( "rtl", "RightToLeft", "Merge the rightmost objects into the leftmost object" );

    MergeDirection.LTR = MergeDirection.LEFT_TO_RIGHT;
    MergeDirection.RTL = MergeDirection.RIGHT_TO_LEFT;

    MergeDirection.DEFAULT = MergeDirection.LEFT_TO_RIGHT;

    MergeDirection.resolveDirection = ( pDirection ) =>
    {
        if ( pDirection instanceof MergeDirection )
        {
            return pDirection;
        }

        if ( isString( pDirection ) )
        {
            const key = String( pDirection || _mt_str ).trim().toUpperCase();

            if ( ["LTR", "RTL", "LEFT_TO_RIGHT", "RIGHT_TO_LEFT"].includes( key ) )
            {
                return MergeDirection.resolveDirection( MergeDirection[key] );
            }
        }

        return MergeDirection.DEFAULT;
    };

    class MergeStringsRule extends MergeRule
    {
        #separator = (_comma + _spc);
        #replacement = (_semicolon + _spc);

        constructor( pId, pName, pDescription, pSeparator, pReplacement )
        {
            super( pId, pName, pDescription );

            this.#separator = isString( pSeparator ) ? pSeparator || _mt_str : this.#separator;
            this.#replacement = isString( pReplacement ) ? pReplacement || _mt_str : this.#replacement;
        }

        get separator()
        {
            return String( this.#separator );
        }

        set separator( pSeparator )
        {
            this.#separator = isString( pSeparator ) ? pSeparator || _mt_str : this.#separator;
        }

        get replacement()
        {
            return String( this.#replacement );
        }

        set replacement( pReplacement )
        {
            this.#replacement = isString( pReplacement ) ? pReplacement || _mt_str : this.#replacement;
        }

        equals( pOther )
        {
            return (pOther instanceof this.constructor) && super.equals( pOther );
        }

        mergeStrings( ...pStrings )
        {
            const strings = [...(pStrings || [])].filter( isString );

            let value = strings;

            if ( strings.length <= 0 )
            {
                return _mt_str;
            }

            switch ( this[CLASS_SYMBOL.ID] )
            {
                case "concat":
                    value = (strings.map( e => e.includes( this.separator ) ? e.replaceAll( this.separator, this.replacement ) : e ).join( this.separator ));
                    break;

                case "split":
                    value = [...new Set( strings )];
                    break;

                case "onn":
                    value = strings.filter( e => !isNull( e ) && e.trim().length > 0 );
                // do not break;
                // fall through

                case "ow":
                    value = strings[0] || _mt_str;
                    break;
            }

            return value;
        }
    }

    MergeStringsRule.CONCAT = new MergeStringsRule( "concatenate", "concatenate", "Concatenate strings into a single string, separated by a comma" );
    MergeStringsRule.SPLIT = new MergeStringsRule( "split", "split", "Convert strings into an array of strings, storing unique elements from each object" );
    MergeStringsRule.OVERWRITE = new MergeStringsRule( "ow", "overwrite", "Replace the value of the target object with the value of the source object" );
    MergeStringsRule.OVERWRITE_NON_NULL = new MergeStringsRule( "onn", "overwrite_non_null", "Replace the value of the target object with the value of the source object if it is not null or empty" );

    MergeStringsRule.RULES =
        {
            "concatenate": MergeStringsRule.CONCAT,
            "split": MergeStringsRule.SPLIT,
            "ow": MergeStringsRule.OVERWRITE,
            "overwrite": MergeStringsRule.OVERWRITE,

            "onn": MergeStringsRule.OVERWRITE_NON_NULL,
            "overwrite_non_null": MergeStringsRule.OVERWRITE_NON_NULL,

            DEFAULT: MergeStringsRule.OVERWRITE_NON_NULL,
        };

    MergeStringsRule.DEFAULT = MergeStringsRule.RULES.DEFAULT;

    MergeStringsRule.resolveRule = ( pId, pName ) => MergeRule.resolveRule( MergeStringsRule.RULES, pId, pName ) || MergeStringsRule.DEFAULT;

    class MergeNumbersRule extends MergeRule
    {
        #operator = function( pA, pB ) { return pA; };

        constructor( pId, pName, pDescription, pOperator )
        {
            super( pId, pName, pDescription );
            this.#operator = isFunction( pOperator ) && pOperator.length === 2 ? pOperator : this.#operator;
        }

        get operator()
        {
            return isFunction( this.#operator ) ? this.#operator : function( pA, pB ) { return pA; };
        }

        mergeNumbers( ...pNumbers )
        {
            let value = 0;

            const numbers = [...(pNumbers || [])].filter( isNumeric ).map( e => parseFloat( e ) ).filter( e => !isNaN( e ) || !isFinite( e ) );

            while ( numbers.length > 1 )
            {
                value = this.operator.call( this, numbers.shift(), numbers.shift() );
            }

            while ( numbers.length > 0 )
            {
                value = this.operator.call( this, value, numbers.shift() );
            }

            return value;
        }
    }

    MergeNumbersRule.REPLACE = new MergeNumbersRule( "ow", "overwrite", "set the target value to the the source value", function( a, b ) { return a; } );
    MergeNumbersRule.PRESERVE = new MergeNumbersRule( "keep", "preserve", "leave the target value as-is; ignore the source value", function( a, b ) { return b; } );

    MergeNumbersRule.ADD = new MergeNumbersRule( "+", "add", "set the target value to the sum of the source value and the target value", function( a, b ) { return a + b; } );
    MergeNumbersRule.SUBTRACT = new MergeNumbersRule( "-", "subtract", "set the target value to the difference of the source value and the target value", function( a, b ) { return a - b; } );
    MergeNumbersRule.MULTIPLY = new MergeNumbersRule( "*", "multiply", "set the target value to the product of the source value and the target value", function( a, b ) { return a * b; } );
    MergeNumbersRule.DIVIDE = new MergeNumbersRule( "/", "divide", "set the target value to the quotient of the source value and the target value", function( a, b ) { return a / b; } );

    MergeNumbersRule.DEFAULT = MergeNumbersRule.REPLACE;

    class MergeArraysRule extends MergeRule
    {
        constructor( pId, pName, pDescription )
        {
            super( pId, pName, pDescription );
        }

        equals( pOther )
        {
            return (pOther instanceof this.constructor) && super.equals( pOther );
        }

        mergeArrays( ...pArrays )
        {
            let arr = [...(pArrays || [])].map( e => isArray( e ) ? e : isNull( e ) ? [] : [e] );

            switch ( this[CLASS_SYMBOL.ID] )
            {
                case "concat":
                    arr = arr.flat();
                    break;

                case "unique":
                    arr = [...new Set( arr.flat() )];
                    break;

                case "onn":
                    arr = arr.filter( e => !isNull( e ) && e.length > 0 );
                // do not break;
                // fall through

                case "ow":
                    arr = arr[0];
                    break;

                case "elements":
                    break;
            }

            return [...arr];
        }
    }

    MergeArraysRule.CONCAT = new MergeArraysRule( "concat", "concatenate", "Concatenate arrays into a single array" );
    MergeArraysRule.UNIQUE = new MergeArraysRule( "unique", "concat_unique", "Concatenate arrays into a single array, preserving only unique elements" );
    MergeArraysRule.OVERWRITE = new MergeArraysRule( "ow", "overwrite", "Replace the value of the target object with the value of the source object" );
    MergeArraysRule.OVERWRITE_NON_NULL = new MergeArraysRule( "onn", "overwrite_non_null", "Replace the value of the target object with the value of the source object if it is not null or empty" );
    MergeArraysRule.MERGE_ELEMENTS = new MergeArraysRule( "elements", "merge_elements", "Merge the elements of the source arrays into the target array" );

    MergeArraysRule.RULES =
        {
            "concat": MergeArraysRule.CONCAT,
            "concatenate": MergeArraysRule.CONCAT,

            "unique": MergeArraysRule.UNIQUE,
            "concat_unique": MergeArraysRule.UNIQUE,

            "ow": MergeArraysRule.OVERWRITE,
            "overwrite": MergeArraysRule.OVERWRITE,

            "onn": MergeArraysRule.OVERWRITE_NON_NULL,
            "overwrite_non_null": MergeArraysRule.OVERWRITE_NON_NULL,

            "elements": MergeArraysRule.MERGE_ELEMENTS,
            "merge_elements": MergeArraysRule.MERGE_ELEMENTS,

            DEFAULT: MergeArraysRule.OVERWRITE_NON_NULL
        };

    MergeArraysRule.DEFAULT = MergeArraysRule.RULES.DEFAULT;

    MergeArraysRule.resolveRule = ( pId, pName ) => MergeRule.resolveRule( MergeArraysRule.RULES, pId, pName ) || MergeArraysRule.DEFAULT;

    class Recursion extends EventTarget
    {
        #id;
        #stack;
        #visited;
        #depth;

        constructor( pId, pVisited, pStack, pDepth )
        {
            super();

            this.#id = pId || Recursion.nextId();

            this.#stack = pStack || [];
            this.#visited = pVisited || new Set();
            this.#depth = pDepth || 0;
        }

        get id()
        {
            return this.#id;
        }

        get stack()
        {
            return this.#stack || [];
        }

        get visited()
        {
            return this.#visited;
        }

        get depth()
        {
            return this.#depth;
        }

        asObject()
        {
            return {
                id: this.#id,
                stack: this.#stack,
                visited: this.#visited,
                depth: this.#depth,
            };
        }

        isInfiniteLoop( pObject )
        {
            return detectCycles( this.stack ) || this.depth > MAX_STACK_SIZE;
        }

        update( pObject, pKey )
        {
            this.#stack.push( pKey );
            this.#visited.add( pObject );
            this.#depth++;

            return this;
        }

        popKey()
        {
            return this.#stack.pop();
        }

        equals( pOther )
        {
            return (pOther instanceof this.constructor) && pOther?.id === this.id;
        }
    }

    Recursion._ID = 1;
    Recursion.nextId = () =>
    {
        const id = Recursion._ID++;

        if ( id > 999_999_999 )
        {
            Recursion._ID = 1;
        }

        return id;
    };

    Recursion.start = ( pVisited, pStack, pDepth ) => new Recursion( Recursion.nextId(), pVisited, pStack, pDepth );

    class ObjectMerger extends EventTarget
    {
        #options;

        #direction = MergeDirection.LEFT_TO_RIGHT;

        #arrayRule = MergeArraysRule.DEFAULT;
        #stringRule = MergeStringsRule.DEFAULT;
        #numberRule = MergeNumbersRule.DEFAULT;

        #recursions = new Map();

        constructor( pDirection, pArrayRule, pStringRule, pNumberRule, pOptions )
        {
            super();

            this.#options = pOptions || {};

            this.#direction = this.resolveDirection( pDirection );

            this.#arrayRule = this.resolveArrayRule( pArrayRule );
            this.#stringRule = this.resolveStringRule( pStringRule );
            this.#numberRule = this.resolveNumberRule( pNumberRule );
        }

        resolveRule( pRule )
        {
            if ( isNonNullObj( pRule ) )
            {
                if ( pRule instanceof MergeRule )
                {
                    return pRule;
                }
            }
            return null;
        }

        resolveStringRule( pStringRule )
        {
            const rule = this.resolveRule( pStringRule );

            if ( rule instanceof MergeStringsRule )
            {
                return rule;
            }

            if ( isString( pStringRule ) )
            {
                return MergeStringsRule.resolveRule( pStringRule );
            }

            return MergeStringsRule.RULES.DEFAULT;
        }

        resolveArrayRule( pArrayRule )
        {
            const rule = this.resolveRule( pArrayRule );

            if ( rule instanceof MergeArraysRule )
            {
                return rule;
            }

            if ( isString( pArrayRule ) )
            {
                return MergeArraysRule.resolveRule( pArrayRule );
            }

            return MergeArraysRule.RULES.DEFAULT;
        }

        resolveNumberRule( pNumberRule )
        {
            const rule = this.resolveRule( pNumberRule );

            if ( rule instanceof MergeNumbersRule )
            {
                return rule;
            }

            if ( isString( pNumberRule ) )
            {
                switch ( pNumberRule.trim().toLowerCase() )
                {
                    case "+":
                    case "add":
                        return MergeNumbersRule.ADD;

                    case "-":
                    case "subtract":
                        return MergeNumbersRule.SUBTRACT;

                    case "*":
                    case "multiply":
                        return MergeNumbersRule.MULTIPLY;

                    case "/":
                    case "divide":
                        return MergeNumbersRule.DIVIDE;

                    case "ow":
                    case "overwrite":
                        return MergeNumbersRule.REPLACE;

                    case "keep":
                    case "preserve":
                        return MergeNumbersRule.PRESERVE;
                }
            }
            return MergeNumbersRule.DEFAULT;
        }

        resolveDirection( pDirection )
        {
            return MergeDirection.resolveDirection( pDirection ) || MergeDirection.DEFAULT;
        }

        get direction()
        {
            return this.resolveDirection( this.#direction );
        }

        get arrayRule()
        {
            return this.resolveArrayRule( this.#arrayRule );
        }

        get stringRule()
        {
            return this.resolveStringRule( this.#stringRule );
        }

        get numberRule()
        {
            return this.resolveNumberRule( this.#numberRule );
        }

        merge( ...pObjects )
        {
            let obj = null;

            const objects = this.direction.order( ...([...(pObjects || [])]) );

            const numObjects = objects.length;

            const recursion = this.resolveRecursion();
            this.#recursions.set( recursion.id, recursion );

            let key = 0;

            while ( objects.length && !recursion.isInfiniteLoop( obj ) && key < numObjects )
            {
                const left = obj || objects.shift();
                const right = objects.shift() || {};

                obj = this.mergeLtr( left, right, recursion.update( obj, String( key ) ) ) || right;

                key += 1;
            }

            this.#recursions.delete( recursion.id );

            return obj;
        }

        mergeLtr( pObjectA, pObjectB, pRecursion )
        {
            const me = this;

            const left = isNonNullObj( pObjectA ) ? { ...pObjectA } : null;
            const right = isNonNullObj( pObjectB ) ? { ...pObjectB } : null;

            if ( isNonNullObj( right ) && isNonNullObj( left ) )
            {
                const recursion = this.resolveRecursion( pRecursion );

                const entries = objectEntries( left );

                while ( entries.length && !recursion.isInfiniteLoop( left ) )
                {
                    const entry = entries.shift();

                    const key = ObjectEntry.getKey( entry );
                    const value = ObjectEntry.getValue( entry );

                    right[key] = attempt( () => (me || this).mergeValues( value, right[key], recursion.update( left, key ) ) );

                    recursion.popKey();
                }
            }

            return right || left;
        }

        mergeRtl( pObjectA, pObjectB, pRecursion )
        {
            return this.mergeLtr( pObjectB, pObjectA, pRecursion );
        }

        mergeStrings( pObjectA, pObjectB )
        {
            return this.stringRule.mergeStrings( pObjectA, pObjectB );
        }

        mergeNumbers( pObjectA, pObjectB )
        {
            return this.numberRule.mergeNumbers( pObjectA, pObjectB );
        }

        mergeArrays( pObjectA, pObjectB, pRecursion )
        {
            if ( this.arrayRule.equals( MergeArraysRule.MERGE_ELEMENTS ) )
            {

            }

            return this.arrayRule.mergeArrays( pObjectA, pObjectB );
        }

        mergeValues( pValueA, pValueB, pRecursion )
        {
            const me = this;

            const recursion = this.resolveRecursion( pRecursion );

            if ( isNull( pValueB ) )
            {
                return pValueA;
            }

            if ( isNull( pValueA ) )
            {
                return pValueB;
            }

            if ( isArray( pValueA ) || isArray( pValueB ) )
            {
                const valueA = isArray( pValueA ) ? [...pValueA] : [pValueA];
                const valueB = isArray( pValueB ) ? [...pValueB] : [pValueB];

                return attempt( () => me.mergeArrays( valueA, valueB, recursion ) );
            }

            if ( isNonNullObj( pValueA ) || isNonNullObj( pValueB ) )
            {
                return attempt( () => (me || this).mergeLtr( pValueA, pValueB, recursion ) );
            }

            if ( isNumeric( pValueA ) && isNumeric( pValueB ) )
            {
                let value = attempt( () => (me || this).mergeNumbers( pValueA, pValueB ) );

                if ( !isNaN( value ) && isFinite( value ) )
                {
                    return value;
                }
            }

            if ( isString( pValueA ) || isString( pValueB ) )
            {
                return attempt( () => (me || this).mergeStrings( String( pValueA ), String( pValueB ), recursion ) );
            }

            return pValueA;
        }

        resolveRecursion( pRecursion )
        {
            let recur = (pRecursion instanceof Recursion) ? pRecursion : this.#recursions.get( pRecursion );

            if ( recur instanceof Recursion )
            {
                return recur;
            }

            if ( this.#recursions.size )
            {
                const values = [...this.#recursions.values()].sort( ( a, b ) => (a[OBJECT_CREATED] || 0) - (b[OBJECT_CREATED] || 0) );
                recur = values[0];
            }

            recur = (recur instanceof Recursion) ? recur : Recursion.start();

            this.#recursions.set( recur.id, recur );

            return recur;
        }
    }

    /////

    const mergeJson = function( ...pObjects )
    {
        const objects = filteredArgs( _isValidInput, ...pObjects ).map( _toObject ).filter( isNonNullObject );

        return (objects.length > 1) ? mergeOptions( objects[0], ...objects.slice( 1 ) ) : (objects[0] || {});
    };

    const JSON_MERGE_OPTIONS =
        {
            mappers: [],
            filters: [],
            returnJson: false
        };

    class JsonMerger
    {
        #options;

        #mappers = [];
        #filters = [];

        #returnJson = false;

        constructor( pFilters, pMappers, pOptions = JSON_MERGE_OPTIONS )
        {
            this.#options = { ...pOptions || {} };

            this.#filters = this.initializeFilters( pFilters, asArray( this.#options.filters ) );
            this.#mappers = this.initializeMappers( pMappers, asArray( this.#options.mappers ) );

            this.#returnJson = !!this.#options.returnJson;
        }

        get options()
        {
            return populateOptions( this.#options, {} );
        }

        get mappers()
        {
            return [...(asArray( this.#mappers ))];
        }

        get filters()
        {
            return [...(asArray( this.#filters ))];
        }

        initializeFilters( ...pFilters )
        {
            const filters = flatArgs( ...pFilters || [] );
            return filters.filter( Filters.IS_FILTER );
        }

        addFilter( pFilter )
        {
            if ( Filters.IS_FILTER( pFilter ) )
            {
                this.#filters.push( pFilter );
            }
        }

        initializeMappers( ...pMappers )
        {
            const mappers = flatArgs( ...pMappers || [] );
            return mappers.filter( Filters.IS_MAPPER );
        }

        addMapper( pMapper )
        {
            if ( Filters.IS_MAPPER( pMapper ) )
            {
                this.#mappers.push( pMapper );
            }
        }

        get returnJson()
        {
            return !!this.#returnJson;
        }

        _skip( pObject, pStack )
        {
            return !isNonNullObject( pObject ) || !isPopulated( pObject ) || detectCycles( asArray( pStack || [] ), 5, 3 );
        }

        _processEntries( pObject, pCallback, pVisited = new VisitedSet(), pStack = [] )
        {
            const visited = pVisited || new VisitedSet();

            const stack = pStack || [];

            let result = {}; // { ...pObject };

            if ( this._skip( pObject, stack ) )
            {
                return result;
            }

            const callback = isFunction( pCallback ) ? pCallback : function( pEntry ) { return pEntry; };

            const entries = objectEntries( pObject );

            for( const entry of entries )
            {
                let key = entry.key || entry[0];
                let value = entry.value || entry[1];

                const updatedEntry = attempt( () => callback( entry, key, value ) );

                value = updatedEntry?.value || updatedEntry?.[1];

                key = updatedEntry?.key || updatedEntry?.[0] || key;

                if ( !isBlank( key ) && isNonNullValue( value ) )
                {
                    result[key] = value;
                }

                const child = result[key];

                if ( isNonNullObject( child ) && (child instanceof ObjectEntry) && !visited.has( child ) )
                {
                    visited.add( child );
                    result[key] = this._processEntries( child, callback, visited, stack.concat( key ) );
                }
            }

            return ObjectEntry.toObject( ObjectEntry.unwrapValues( result ) );
        }

        _filterEntries( pObject, pFilter, pVisited = new VisitedSet(), pStack = [] )
        {
            const filter = Filters.IS_FILTER( pFilter ) ? pFilter : Filters.IDENTITY;

            const callback = ( entry ) =>
            {
                if ( entry instanceof ObjectEntry )
                {
                    return (entry.meetsCriteria( filter ) ? entry : null);
                }
                return (filter( entry ) ? entry : null);
            };

            return this._processEntries( pObject, callback, pVisited, pStack );
        }

        _mapEntries( pObject, pMapper, pVisited = new VisitedSet(), pStack = [] )
        {
            const mapper = Filters.IS_MAPPER( pMapper ) ? pMapper : Mappers.IDENTITY;

            const callback = ( entry ) => entry instanceof ObjectEntry ? entry.map( mapper ) : mapper( entry );

            return this._processEntries( pObject, callback, pVisited, pStack );
        }

        merge( ...pObjects )
        {
            const merged = mergeJson( ...pObjects );

            let result = { ...merged };

            for( const mapper of this.#mappers )
            {
                result = this._mapEntries( result, mapper );
            }

            for( const filter of this.#filters )
            {
                result = this._filterEntries( result, filter );
            }

            return this.returnJson ? asJson( result ) : result;
        }
    }

    let mod =
        {
            dependencies,
            guidUtils,
            classes: { IterationCap, ObjectEntry, ExploredSet },
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
            foldEntries,
            getValues,
            getProperties,
            isEmptyValue,
            hasNoProperties,
            isValidObject,
            firstValidObject,
            firstPopulatedObject,
            isPopulated,
            isPopulatedObject: isPopulated,
            toObjectLiteral,
            toLiteral: toObjectLiteral,
            pruneObject,
            prune: pruneObject,
            ExploredSet,
            IterationCap,
            ObjectEntry,
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
            arrayToObject,
            evaluateBoolean,
            toBool,
            augment,
            assign,
            ingest,
            populateObject: populate,
            detectCycles,
            extractFunctionData,
            extractFunctionBody,
            extractFunctionParameters,
            removeProperty,
            removeProperties,
            invertProperties,
            findNode,
            tracePathTo,
            findRoot,
            lock,
            deepFreeze,
            estimateObjectSize,
        };

    mod = modulePrototype.extend( mod );

    return mod.expose( mod, INTERNAL_NAME, (_ud !== typeof module ? module : mod) ) || mod;

}());
