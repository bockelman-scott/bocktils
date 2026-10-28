// noinspection JSUnusedLocalSymbols


(function exposeModule()
{
    const core = require( "@toolbocks/core" );
    const collectionUtils = require( "@toolbocks/collections" );
    const datesModule = require( "@toolbocks/dates" );
    const jsonUtils = require( "@toolbocks/json" );
    const logUtils = require( "@toolbocks/logging" );

    const { moduleUtils, constants, typeUtils, stringUtils, arrayUtils, guidUtils } = core;

    const
        {
            ToolBocksModule,
            ModuleEvent,
            ObjectEntry,
            ObjectRegistry,
            OBJECT_REGISTRY = ToolBocksModule.OBJECT_REGISTRY || ObjectRegistry.DEFAULT_INSTANCE,
            __Error,
            IllegalArgumentError,
            IllegalStateError,
            CASE_SENSITIVE_COLLATOR,
            CASE_INSENSITIVE_COLLATOR,
            getCollator,
            resolveError,
            attempt,
            attemptSilent,
            asyncAttempt,
            lock,
            dereference,
            sleep,
            propertyDescriptors,
            readProperty,
            setProperty,
            objectEntries,
            detectCycles,
            resolveEvent,
            $ln,
            no_op = function( e ) {return e;},
            calculateEstimatedTimeRemaining,
            calculatePercentComplete,
            formatElapsedTime,
            calculateElapsedTime,
            getLastError
        } = moduleUtils;

    const { BUILTIN_TYPE_NAMES, NODE_JS_EXIT_CODES, _ud, _mt, _str, _num, _big, _bool } = constants;

    const
        {
            isNull,
            isObject,
            isArray,
            isIterable,
            isNonNullObject,
            isScalar,
            isMap,
            isFunction,
            isString,
            isUUID,
            isNumeric,
            isBoolean,
            isRegExp,
            isDate,
            isError,
            isClass,
            getClass,
            getClassName,
            hasProperty,
            ResolvedSet,
            toObjectLiteral,
            delegateTo,
            clamp = moduleUtils.clamp,
            toRegExp
        } = typeUtils;

    const
        {
            asString,
            asInt,
            asFloat,
            toBool,
            isBlank,
            isJsonArray,
            isJsonObject,
            isFilePath,
            toUnixPath,
            _lct
        } = stringUtils;

    const { asArray } = arrayUtils;

    const { asObject, asJson, parseJson } = jsonUtils;

    const { SimpleLogger, SourcedSimpleLogger } = logUtils;

    const RESERVED_KEYS = lock( ["class", "constructor", "prototype", "__proto__", "attributes"] );
    const TRANSIENT_PROPERTIES = ["lastAccessed"];

    /**
     * The default options for computing whether two objects are equal based on their properties.
     */
    const DEFAULT_EQUALITY_OPTIONS =
        lock( {
                  /**
                   * These are properties to be ignored when evaluating the equality of two objects.
                   * We assume these properties have already been checked
                   */
                  ignoredProperties: ["attributes", "instanceId"],
                  /**
                   * whether string properties should be compared with respect to case or not
                   */
                  caseSensitive: true,
                  /**
                   * whether string properties should be trimmed before comparison
                   */
                  ignoreWhitespace: true,
                  /**
                   * whether all scalar values should be compared as strings
                   */
                  coerceScalarsToString: false,
                  /**
                   * The largest difference allowed between two floating point values before they are considered unequal.
                   * Necessary to avoid/ignore the idiosyncrasies of floating-point representations in base-2
                   */
                  numericTolerance: 0.00001,
                  /**
                   * This is the maximum depth of property path traversal and recursive comparison to perform.
                   * If we exceed this depth, we consider the objects UNEQUAL
                   */
                  maxDepth: 8
              } );

    const EVENTS =
        {
            ERROR: "error",
            ATTRIBUTE_CHANGED: "attributeChanged",
            ATTRIBUTE_DELETED: "attributeDeleted",
            PROGRESS: "progress",
            COMPLETED: "completed"
        };

    const DEFAULT_LOGGER = new SimpleLogger( console );

    /**
     * Returns true if the specified value is a property that can be copied from one object to another.
     *
     * @param {String|Symbol} pKey the value to evaluate
     *
     * @returns {boolean}
     */
    function isValidKey( pKey )
    {
        const key = asString( pKey, true );

        if ( RESERVED_KEYS.includes( key ) ||
             TRANSIENT_PROPERTIES.includes( key ) ||
             (key.startsWith( "#" ) || key.startsWith( "[[" )) )
        {
            return false;
        }

        return !/^__\w+__$/.test( key );
    }

    /**
     * Evaluates two objects for equality by comparing their properties, values, and structure recursively.
     * Supports deep comparisons while preventing infinite recursion with cycle detection.
     *
     * @param {Object} pObjectA The first object to be evaluated.
     * @param {Object} pObjectB The second object to be evaluated.
     * @param {Object} pOptions An optional object containing comparison options.
     * @param {ResolvedSet} [pVisited=new ResolvedSet()] A set used to track visited objects to prevent infinite recursion.
     * @param {Array} [pStack=[]] An array used for stack tracking during recursive calls and cycle detection.
     * @param pDepth
     * @return {Boolean} Returns true if the objects are considered semantically equal, otherwise false.
     */
    function evaluateEntriesForEquality( pObjectA, pObjectB, pOptions, pVisited = new ResolvedSet(), pStack = [], pDepth = 0 )
    {
        let options = { ...DEFAULT_EQUALITY_OPTIONS, ...(asObject( pOptions || {} )) };

        let object = dereference( asObject( pObjectA ) );
        let other = dereference( asObject( pObjectB ) );

        let visited = pVisited || new ResolvedSet();

        // if we have already seen these values, skip the comparisons, they were equal
        if ( visited.has( object ) && visited.has( other ) )
        {
            return true;
        }

        let entries = objectEntries( object );
        let otherEntries = objectEntries( other );

        let numericTolerance = clamp( asFloat( options.numericTolerance, DEFAULT_EQUALITY_OPTIONS.numericTolerance ) ?? DEFAULT_EQUALITY_OPTIONS.numericTolerance, 0, 0.1 );

        let ignored = asArray( options.ignoredProperties ?? [] );

        if ( $ln( ignored ) > 0 )
        {
            let notIgnored = e => !(ignored.includes( ObjectEntry.getKey( e ) || e[0] ));

            entries = entries.filter( notIgnored );
            otherEntries = otherEntries.filter( notIgnored );
        }

        // if the objects do not have the same number of properties,
        // we consider these objects to be non-equivalent
        if ( $ln( entries ) !== $ln( otherEntries ) )
        {
            return false;
        }

        // if they have the same number of properties,
        // we need to determine if they have the same property names,
        // so we get the property names/keys of the other object...
        const otherKeys = otherEntries.map( e => ObjectEntry.getKey( e ) || e[0] );

        // and filter out any of our properties that do not appear in that collection
        entries = entries.filter( entry =>
                                  {
                                      const key = asString( ObjectEntry.getKey( entry ) || entry[0], true );
                                      return otherKeys.includes( key );
                                  } );

        // if the filtered set of property names is a different length
        // as the property names in the other object,
        // we will consider the objects to be different
        if ( $ln( entries ) !== $ln( otherKeys ) )
        {
            return false;
        }

        // now we have to perform the same filtering of the other object's properties
        // to see if they match the first object
        const keys = entries.map( e => ObjectEntry.getKey( e ) || e[0] );

        // so we filter out any of the other object's properties
        // that do not appear in our collection of property keys
        otherEntries = otherEntries.filter( entry =>
                                            {
                                                const key = asString( ObjectEntry.getKey( entry ) || entry[0], true );
                                                return keys.includes( key );
                                            } );

        // if the filtered set of property names is a different length
        // as the property names in the first object,
        // we will consider the objects to be different
        if ( $ln( otherEntries ) !== $ln( keys ) )
        {
            return false;
        }

        // If we still have not returned from this method, the objects might be semantically equal.
        // Now, we have to recursively compare each of the matching properties.
        // Since we know that both the first object and the other object have the same set of property keys,
        // we can iterate either set of entries.

        // we start by assuming equality and look for a contradiction
        let result = true;

        // to avoid infinite recursion or stack overflow,
        // we use the detectCycles function, which requires the stack array
        let stack = asArray( pStack || [] );

        // we also limit comparison to the maximum depth indicated in the options
        const maxDepth = clamp( asInt( options.maxDepth, DEFAULT_EQUALITY_OPTIONS.maxDepth ), 2, DEFAULT_EQUALITY_OPTIONS.maxDepth * 2 );

        const depth = asInt( pDepth, 0 );

        // if we are in an infinite loop or have exceeded the maximum depth, we return false
        if ( depth > maxDepth || detectCycles( stack, 5, 3 ) )
        {
            return false;
        }

        for( let entry of entries )
        {
            // the property name
            const key = asString( ObjectEntry.getKey( entry ) || entry[0], true );

            // the property value
            const value = ObjectEntry.getValue( entry ) || entry[1];

            // the other object's value for this property
            const otherValue = readProperty( other, key );

            const typeOfValue = typeof value;
            const typeOfOther = typeof otherValue;

            // if the values are of different type, check our options
            if ( typeOfValue !== typeOfOther )
            {
                const scalarTypes = [_str, _num, _big, _bool];

                const bothTypesAreScalar = scalarTypes.includes( typeOfValue ) && scalarTypes.includes( typeOfOther );

                if ( !bothTypesAreScalar || !toBool( options.coerceScalarsToString ) )
                {
                    result = false;
                    break;
                }

                if ( bothTypesAreScalar )
                {
                    const collator = (toBool( options.caseSensitive )) ? CASE_SENSITIVE_COLLATOR : CASE_INSENSITIVE_COLLATOR;

                    const s1 = asString( value, options.ignoreWhitespace );
                    const s2 = asString( otherValue, options.ignoreWhitespace );

                    if ( !(s1 === s2 || (0 === collator.compare( s1, s2 ))) )
                    {
                        result = false;
                        break;
                    }
                }
            }

            // if the values are both objects, we may need to recursively call this function
            if ( isObject( value ) && isObject( otherValue ) )
            {
                // if one is null but not the other, they're different
                if ( (isNull( value ) && !isNull( otherValue )) || ( !isNull( value ) && isNull( otherValue )) )
                {
                    result = false;
                    break;
                }

                // since arrays are also considered objects, we compare to see if one value is an array while the other is not
                if ( (isArray( value ) && !isArray( otherValue )) || ( !isArray( value ) && isArray( otherValue )) )
                {
                    result = false;
                    break;
                }

                // if both values are arrays, we might be able to short-circuit
                if ( isArray( value ) && isArray( otherValue ) )
                {
                    if ( ($ln( value ) !== $ln( otherValue )) )
                    {
                        result = false;
                        break;
                    }

                    if ( !(evaluateEntriesForEquality( value, otherValue, options, visited, [...stack, key], (1 + depth) )) )
                    {
                        result = false;
                        break;
                    }
                }

                // avoid infinite recursion if one of the objects references the other or itself
                if ( value === otherValue ||
                     (isFunction( value.equals ) && value.equals( otherValue )) ||
                     (isFunction( otherValue.equals ) && otherValue.equals( value )) )
                {
                    visited.add( value );
                    visited.add( otherValue );
                }
                else
                {
                    result = evaluateEntriesForEquality( value, otherValue, options, visited, [...stack, key], (1 + depth) );
                }
            }
            else if ( isNumeric( value ) && isNumeric( otherValue ) )
            {
                let a = asFloat( value );
                let b = asFloat( otherValue );

                let delta = Math.abs( a - b );

                if ( delta > asFloat( numericTolerance ) )
                {
                    result = false;
                    break;
                }
            }
            else if ( isString( value ) || isString( otherValue ) )
            {
                if ( toBool( options.coerceScalarsToString ) || (isString( value ) && isString( otherValue )) )
                {
                    let s1 = asString( value, toBool( options.ignoreWhitespace ) );
                    let s2 = asString( otherValue, toBool( options.ignoreWhitespace ) );

                    let collator = (toBool( options.caseSensitive )) ? CASE_SENSITIVE_COLLATOR : CASE_INSENSITIVE_COLLATOR;

                    if ( !(s1 === s2 || 0 === collator.compare( s1, s2 )) )
                    {
                        result = false;
                        break;
                    }
                }
                else
                {
                    result = false;
                    break;
                }
            }
            else if ( isBoolean( value ) && isBoolean( otherValue ) )
            {
                let comparison = (true === value) ? (true === otherValue) : (false === otherValue);
                if ( !comparison )
                {
                    result = false;
                    break;
                }
            }
        }

        if ( result )
        {
            if ( isNonNullObject( object ) )
            {
                visited.add( object );
            }

            if ( isNonNullObject( other ) )
            {
                visited.add( other );
            }
        }

        return result;
    }

    const areEqual = function( pObjectA, pObjectB )
    {
        if ( isNull( pObjectA ) )
        {
            return isNull( pObjectB );
        }

        if ( isNonNullObject( pObjectA ) && isNonNullObject( pObjectB ) )
        {
            // if the two objects have the same instance ID, they are actually the same object
            if ( pObjectA === pObjectB || (hasProperty( pObjectA, "instanceId" ) && pObjectA?.instanceId === pObjectB?.instanceId) )
            {
                return true;
            }
            return attempt( () => evaluateEntriesForEquality( pObjectA, pObjectB, { ...DEFAULT_EQUALITY_OPTIONS } ) );
        }
        else if ( isNonNullObject( pObjectA ) || isNonNullObject( pObjectB ) )
        {
            return false;
        }

        if ( isNumeric( pObjectA ) && isNumeric( pObjectB ) )
        {
            let a = asFloat( pObjectA );
            let b = asFloat( pObjectB );

            return a === b || (Math.abs( a - b ) < 0.00000001);
        }

        return pObjectB === pObjectA;
    };

    /**
     * The 'root' class/prototype for all classes defined for applications in a Domain Model.
     *
     * This is inspired by the Java 'Object' class which provides methods and properties
     * developers can count on being available on any object in their applications.
     *
     * Specifically, all objects derived from ToolBocksObject will have the following properties and methods:
     * METHODS: equals(), toString(), addEventListener(), removeEventListener(), dispatchEvent(), clone()
     * PROPERTIES:
     *
     * @class
     */
    class ToolBocksObject
    {
        // this allows each of our classes, if necessary, to behave like an EventTarget, if required
        #zTarget = new EventTarget();

        // attributes is a map of generic properties.
        // IT SHOULD BE USED RARELY!
        // It can be used to shuttle temporary values between methods or across layers.
        // Common use cases might include attaching resolved or calculated parameters read from a Request.

        // To save memory, we do not instantiate a new Map until we actually need one.
        #attributes; // = new Map();

        /**
         * No-args constructor to allow unrestricted extension
         */
        constructor( ...pArgs )
        {
            const me = this;

            const args = asArray( pArgs ?? [] ).filter( e => isNonNullObject( e ) );

            if ( $ln( args ) > 0 )
            {
                attempt( () => (me ?? this)._handleConstructorArgs( (me ?? this), args ) );
            }
        }

        _handleConstructorArgs( pThis = this, pArgs )
        {
            const thiz = pThis ?? this;

            if ( isNull( pArgs ) || !isArray( pArgs ) )
            {
                return this;
            }

            const args = isArray( pArgs ) ? asArray( pArgs ).filter( isNonNullObject ) : [];

            for( const arg of args )
            {
                if ( isNonNullObject( arg ) )
                {
                    const entries = isMap( arg ) || isFunction( arg?.entries ) ?
                                    (arg.entries() ?? objectEntries( arg )) :
                                    (Object.entries( arg ) ?? objectEntries( arg ));

                    entries.forEach( entry =>
                                     {
                                         const key = asString( ObjectEntry.getKey( entry ) || entry[0], true );

                                         const value = attemptSilent( () => ObjectEntry.getValue( entry ) ?? entry[1] ?? arg[key] );

                                         if ( !(isBlank( key ) || isNull( value )) )
                                         {
                                             attempt( () => thiz.setAttribute( key, value ) );
                                             if ( isError( getLastError() ) )
                                             {
                                                 console.log( `!!!! KEY: ${key}, VALUE: ${value} !!!` );
                                             }
                                         }
                                     } );
                }
            }

            return this;
        }

        /**
         * Returns the class/constructor.
         *
         * Can be used to clone objects.
         *
         * Subclasses should override this static method.
         *
         * It is possible to return a value other than 'this'
         * to achieve certain kinds of strategy patterns
         * or subclass-specific cloning patterns.
         *
         * @returns {ToolBocksObject}
         */
        static get [Symbol.species]()
        {
            return this;
        }

        /**
         * Returns an iterator of any attributes attached to the object.
         * Attributes should not be treated as 'first-class' properties.
         * Attributes should not be persisted when an instance is stored.
         *
         * @returns {*|ArrayIterator<[number, *]>}
         */
        get attributes()
        {
            if ( isNull( this.#attributes ) )
            {
                return [].entries();
            }

            return isMap( this.#attributes ) ? this.#attributes.entries() : (isNonNullObject( this.#attributes ) ? objectEntries( this.#attributes ) : [].entries());
        }

        /**
         * Sets the specified attribute name to the provided value.
         * If the provided value is null, the attribute is removed.
         *
         * Returns true if the operation successfully modifies the attributes
         *
         * @param {string} pName - The name of the attribute to set or remove.
         * @param {*} pValue - The value to set for the attribute; if null, the attribute is removed.
         *
         * @return {boolean} Returns true if the attribute is successfully created, updated, or removed
         */
        setAttribute( pName, pValue )
        {
            const key = asString( pName, true );

            if ( Object.hasOwn( this, key ) )
            {
                attempt( () => this[key] = this[key] ?? pValue );
                if ( !isError( getLastError() ) )
                {
                    return true;
                }
            }

            const attributesInitialized = !isNull( this.#attributes ) && isMap( this.#attributes );

            if ( !isBlank( key ) )
            {
                const oldValue = attributesInitialized ? attempt( () => this.#attributes.get( key ) ) : null;

                if ( isNull( pValue ) && attributesInitialized )
                {
                    if ( this.#attributes.delete( key ) )
                    {
                        this.dispatchEvent( new ModuleEvent( EVENTS.ATTRIBUTE_DELETED,
                                                             {
                                                                 detail:
                                                                     {
                                                                         target: this,
                                                                         property: key,
                                                                         oldValue: oldValue ?? null,
                                                                         timestamp: Date.now()
                                                                     }
                                                             } ) );
                    }
                }
                else
                {
                    this.#attributes = !attributesInitialized ? new Map() : this.#attributes;

                    this.#attributes.set( key, pValue );

                    this.dispatchEvent( new ModuleEvent( EVENTS.ATTRIBUTE_CHANGED,
                                                         {
                                                             detail:
                                                                 {
                                                                     target: this,
                                                                     property: key,
                                                                     oldValue: oldValue ?? null,
                                                                     newValue: pValue ?? null,
                                                                     timestamp: Date.now()
                                                                 }
                                                         } ) );
                }
                return true;
            }

            return false;
        }

        /**
         * Retrieves the value of the specified attribute
         *
         * @param {string} pName - The name, or key, of the attribute to retrieve.
         *                         Must be a string containing at least one non-whitespace character.
         *
         * @param pTryProperties
         * @return {*} The value of the specified attribute if it exists,
         *             or null if the attribute does not exist
         *             or the name/key is not a non-blank string.
         *
         *             (Decision: Returning null instead of throwing IllegalArgumentError when the name is empty)
         *
         */
        getAttribute( pName, pTryProperties = false )
        {
            const key = asString( pName, true );

            let value = null;

            if ( !isBlank( key ) )
            {
                if ( !isNull( this.#attributes ) && isMap( this.#attributes ) )
                {
                    value = attempt( () => this.#attributes.get( key ) ) ?? readProperty( this.#attributes, key );
                    value = value ?? (pTryProperties ? this[key] : value);
                }

                if ( isNull( value ) && pTryProperties && (hasProperty( this, key ) || (key in this)) )
                {
                    value = value ?? (pTryProperties ? attempt( () => readProperty( this, key ) ?? this[key] ) : value);
                }
            }

            if ( isNonNullObject( value ) )
            {
                value = dereference( value );
            }

            if ( isNonNullObject( value ) || isArray( value ) )
            {
                return lock( value );
            }

            return value;
        }

        /**
         * Returns true if the specified name is associated with a non-null value.
         *
         * @param {string} pName - The name of the attribute to check.
         * @param pTryProperties
         * @return {boolean} Returns true if the attribute exists, otherwise false.
         */
        hasAttribute( pName, pTryProperties = false )
        {
            const key = asString( pName, true );

            if ( (isNull( this.#attributes ) || !isMap( this.#attributes )) )
            {
                if ( pTryProperties )
                {
                    return (hasProperty( this, key ) || (key in this));
                }
                return false;
            }

            if ( !isBlank( key ) )
            {
                let has = hasProperty( this.#attributes, key ) || this.#attributes.has( key );
                has = has || (pTryProperties && (hasProperty( this, key ) || (key in this)));
                return has;
            }

            return false;
        }

        /**
         * Dispatches an event for which there may be a listener.
         *
         * @param {Event} pEvt - The event to be dispatched. Prefer dispatching instances of ModuleEvent.
         * @return {boolean} Returns true if the event was successfully dispatched, otherwise false.
         */
        dispatchEvent( pEvt )
        {
            return this.#zTarget.dispatchEvent( resolveEvent( pEvt ) );
        }

        /**
         * Adds an event listener to this instance.
         *
         * @param {string} pEventName - The name of the event to listen for.
         * @param {Function|Object} pHandler - The callback function to execute when the event is triggered or an Object with a handleEvent method
         * @param {Object|boolean} [pOptions] - Optional parameters that define characteristics about the event listener,
         * such as whether it is captured in the capturing phase, is one-time, or is passive.
         * @return {void} Does not return a value.
         */
        addEventListener( pEventName, pHandler, pOptions )
        {
            this.#zTarget.addEventListener( pEventName, pHandler, pOptions );
        }

        /**
         * Removes the specified event listener from this instance.
         *
         * @param {string} pEventName - The name of the event to remove the listener from.
         * @param {Function|Object} pHandler - The event handler function or object to remove.
         * @param {Object|boolean} [pOptions] - An object or a boolean indicating the options with which the listener was added.
         * @return {void} - Does not return any value.
         */
        removeEventListener( pEventName, pHandler, pOptions )
        {
            this.#zTarget.removeEventListener( pEventName, pHandler, pOptions );
        }

        /**
         * Returns the unique ID of this specific instance IN MEMORY.
         *
         * This can be useful for debugging when the issue stems from an unintended aliasing of an object.
         *
         * @returns {String} returns a string in the form of a UUID
         *                   that uniquely identifies this instance __as it exists in memory__.
         *
         * NOTE: THIS IS NOT A VALUE TO BE USED FOR PERSISTENCE.
         * THIS VALUE IS VALID ONLY AS LONG AS THIS OBJECT REMAINS REACHABLE IN SCOPE.
         */
        get instanceId()
        {
            if ( isNonNullObject( OBJECT_REGISTRY ) )
            {
                return OBJECT_REGISTRY.getGuid( this );
            }

            return guidUtils.uuid();
        }

        // noinspection GrazieStyle
        /**
         * Returns true if the other value
         * is an object with the same properties
         * with the same values as this object
         */
        equals( pOther )
        {
            // if the other value is null or not an object, it is not equal to this object
            if ( isNull( pOther ) || !isObject( pOther ) )
            {
                return false;
            }

            // if the other value has the same instance ID, it is actually *this* object
            if ( pOther === this || pOther.instanceId === this.instanceId )
            {
                return true;
            }

            // if the other object is an instance of this class or compatible subclass,
            // we perform a deeper comparison
            // subclasses should override equals and NOT call super.equals()
            // unless they know it will not traverse to this root class (or this is the behavior they want)
            if ( pOther instanceof (getClass( this ) || this.constructor) )
            {
                // If we have not returned yet, we compare the properties of the other object to our properties.
                // NOTE the passing of the ResolvedSet as well as an empty array,
                // each of which plays a role in preventing infinite recursion
                // if either object contains cyclic references
                return attempt( () => evaluateEntriesForEquality( this, pOther, {}, new ResolvedSet(), [] ) );
            }

            return false;
        }

        /**
         * Returns a value < 0 if this object should occur or appear before the other object,
         * a value > 0 if this object should occur or appear after the other object,
         * or 0 if this object and the other object occur or appear at the same position.
         *
         * @param pOther another object to which to compare this instance
         *
         * @returns {number}
         */
        compareTo( pOther )
        {
            // subclasses should override this method if they need to be comparable
            throw new NotImplementedError( `Objects of class, ${getClassName( this )}, are not Comparable` );
        }

        /**
         * Sets or writes this instance's attributes to the specified object.
         *
         * If the specified object supports a setAttribute method,
         * attributes will be added using the method.
         *
         * Otherwise, an 'attributes' property of the object will be created if necessary
         * and populated with the attributes of this instance.
         *
         * @param {Object} pObject the object to populate
         *
         * @returns {Object} the populated object
         *
         * @protected
         */
        _populateAttributes( pObject )
        {
            const obj = asObject( pObject ?? {} ) ?? {};

            if ( this === obj )
            {
                return obj;
            }

            if ( this.attributes )
            {
                try
                {
                    for( const [key, value] of this.attributes )
                    {
                        if ( !(isBlank( key ) || isNull( value )) )
                        {
                            const val = isNonNullObject( value ) ? isFunction( value.toLiteral ) ? value.toLiteral( false ) : toObjectLiteral( value ) : value;

                            if ( !isNull( val ) )
                            {
                                if ( isFunction( obj.setAttribute ) )
                                {
                                    attempt( () => obj.setAttribute( key, val ) );
                                }
                                else
                                {
                                    obj.attributes = obj.attributes ?? {};
                                    if ( isNonNullObject( obj.attributes ) )
                                    {
                                        if ( isMap( obj.attributes ) || isFunction( obj.attributes["set"] ) )
                                        {
                                            const v = isFunction( obj.attributes["get"] ) ? obj.attributes.get( key ) ?? val : obj.attributes[key] ?? val;
                                            attempt( () => obj.attributes.set( key, v ?? val ) );
                                        }
                                        else
                                        {
                                            attempt( () => obj.attributes[key] = (obj.attributes[key] ?? val) );
                                        }
                                        if ( isError( getLastError() ) )
                                        {
                                            attemptSilent( () => obj.attributes[key] = (obj.attributes[key] ?? val) );
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                catch( ex )
                {
                    // ignored
                }
            }

            return obj;
        }

        /**
         * Adds the specified attributes to this instance.
         *
         * @param {Iterable|Object} pAttributes a collection of iterable attributes
         *                                      or an object with an iterable property named 'attributes'
         *                                      or an object whose entries will be iterated and used
         *                                      to add attributes to this instance.
         *
         * @param {boolean} [pAddProperties=false] when true, added attributes are also created as properties of the object if it is not frozen
         *
         * @returns {ToolBocksObject}
         *
         * @protected
         */
        _addAttributes( pAttributes, pAddProperties = false )
        {
            const attrs = asObject( readProperty( pAttributes, "attributes" ) ?? pAttributes ?? this.attributes );

            const entries = (isFunction( attrs?.entries ) ? attrs.entries() : isIterable( attrs ) ? attrs : objectEntries( attrs ));

            const addProps = toBool( pAddProperties );

            if ( !isNull( entries ) && isIterable( entries ) )
            {
                try
                {
                    for( const [key, value] of entries )
                    {
                        // note, we do not allow 'deletion' of attributes via this method
                        if ( !(isBlank( key ) || isNull( value )) )
                        {
                            attempt( () => this.setAttribute( key, value ) );
                            if ( addProps )
                            {
                                attemptSilent( () => this[key] = this[key] || value );
                            }
                        }
                    }
                }
                catch( ex )
                {
                    attemptSilent( () => this.dispatchEvent( new ModuleEvent( "error", { detail: ex }, ex ) ) );
                }
            }

            return this;
        }

        /**
         * Returns a JavaScript object without a prototype or constructor,
         * with the same properties as this instance,
         * but one of its methods or type-information.
         *
         * @returns {object}
         */
        toLiteral( pOmitFunctions = false )
        {
            let obj = toObjectLiteral( this,
                                       {
                                           respectToLiteralMethod: false,
                                           maxDepth: 8,
                                           omitFunctions: toBool( pOmitFunctions )
                                       } );

            obj = attempt( () => this._populateAttributes( obj ) ) ?? obj;

            return obj;
        }

        /**
         * Returns a JSON string representation of this instance.
         *
         * This method is called by the language feature JSON.stringify method
         * if it is present.
         *
         * By providing an implementation, we can control how our objects are represented in JSON.
         *
         * Override as necessary; often it is enough to override toLiteral
         *
         * @returns {String} a JSON string representation of this instance
         */
        toJSON()
        {
            const literal = (attempt( () => this.toLiteral( true ) ) ??
                             attempt( () => toObjectLiteral( this,
                                                             {
                                                                 respectToLiteralMethod: false,
                                                                 maxDepth: 8,
                                                                 omitFunctions: true
                                                             } ) )
                             ?? this);

            return attempt( () => asJson( literal ?? this ) ) || attempt( () => JSON.stringify( literal ?? this ) );
        }

        /**
         * Returns a string representation of this instance.
         * By default, we convert the object to JSON and return the resulting string.
         * Therefore, it is almost never a good idea to rely on this method for anything other than debugging.
         *
         * If this instance cannot be successfully converted to JSON,
         * we return a string with the format: CLASS_NAME::instanceId
         *
         * @returns {string}
         */
        toString()
        {
            // avoid returning something consumer code may come to depend upon
            return `${getClassName( this )}::${this.instanceId}`;
        }

        /**
         * A method that JavaScript itself calls to convert an object to a primitive value.
         * This method customizes the behavior of an object when used in operations expecting a primitive value,
         * such as string concatenation or arithmetic operations.
         *
         * @param {string} pHint - A string value indicating the preferred type of the result.
         *                         It can be one of "string", "number", or "default".
         *                         This parameter is supplied to be compatible with the ECMAScript spec,
         *                         but in most cases, it is ignored.
         *
         * @return {string|number} The primitive value representation of the object.
         */
        [Symbol.toPrimitive]( pHint )
        {
            return `${getClassName( this )}::${this.instanceId}`;
        }

        [Symbol.toStringTag]()
        {
            return `[object ${getClassName( this )}]`;
        }

        // noinspection JSUnusedGlobalSymbols
        /**
         * Returns true if this object defines a 'clone' method
         *
         * @returns {boolean}
         */
        get cloneable()
        {
            return isFunction( this["clone"] );
        }

        /**
         * The default clone method should be overridden
         * @returns {ToolBocksObject|*}
         */
        clone()
        {
            // preserve the class of the clone
            const proto = Object.getPrototypeOf( this ) ?? getClass( this );

            // create a new object using our prototype, so it is an instance of 'this' class (that is, the subclass on which clone is invoked)
            const clone = Object.create( proto );

            // get all property descriptors for the current class (and its super classes, by passing 'true' as the second argument)
            const descriptors = propertyDescriptors( proto, true );

            // iterate the PropertyDescriptors, defining the corresponding property on the clone
            objectEntries( descriptors ).forEach( entry =>
                                                  {
                                                      const key = ObjectEntry.getKey( entry );
                                                      const descriptor = ObjectEntry.getValue( entry );

                                                      // Filter out system keys / private slots
                                                      if ( isValidKey( key ) )
                                                      {
                                                          // get the value currently set for this property of the object being cloned,
                                                          // or if it is undefined or null, set it to the value of the descriptor (if there is one)
                                                          const value = attempt( () => readProperty( this, key ) ?? descriptor.value );

                                                          // if the value is neither null nor a function, check for mutability
                                                          // by checking for the existence of a 'set' function or a true value for the descriptor's writable property.
                                                          // if the property is mutable, use the property mutator to set this value of the clone
                                                          // Note: the ToolBocks 'setProperty' function is versatile enough to set the property value if it is writable
                                                          if ( !(isNull( value ) || isFunction( value )) )
                                                          {
                                                              if ( descriptor.set || descriptor.writable )
                                                              {
                                                                  attempt( () => setProperty( clone, key, value ) );
                                                              }
                                                              else
                                                              {
                                                                  // If the property is immutable,
                                                                  // force-define it on the new instance
                                                                  // to mirror the class's read-only intent.
                                                                  Object.defineProperty( clone,
                                                                                         key,
                                                                                         {
                                                                                             value: value,
                                                                                             writable: false,
                                                                                             enumerable: true,
                                                                                             configurable: false
                                                                                         } );
                                                              }
                                                          }
                                                      }
                                                  } );

            return clone;

        }
    }

    ToolBocksObject.EVENTS = EVENTS;

    /**
     * This is a very generic function for creating a new instance of a class.
     *
     * This should only be used as a last resort or to accelerate development
     * when the time required to define a new class,
     * write a proper factory or factory method,
     * or otherwise complete the development,
     * would unnecessarily slow progress on a feature.
     *
     * @param pData
     * @param pClass
     * @returns {ToolBocksObject|*}
     */
    ToolBocksObject.from = function( pData, pClass = ToolBocksObject )
    {
        const data = dereference( asObject( pData ?? {} ) );

        if ( isNonNullObject( data ) )
        {
            let klass = isClass( pClass ) ? pClass : getClass( data );
            klass = BUILTIN_TYPE_NAMES.includes( getClassName( klass ?? data ) ) ? ToolBocksObject : klass;

            if ( isClass( klass ) )
            {
                if ( klass !== ToolBocksObject && isFunction( klass.from ) )
                {
                    const currentFunction = ToolBocksObject.from;

                    if ( klass.from !== currentFunction )
                    {
                        const instance = attempt( () => klass.from( data ) );
                        if ( isNonNullObject( instance ) && (instance instanceof ToolBocksObject || isFunction( instance._addAttributes )) )
                        {
                            attempt( () => instance._addAttributes( data?.attributes ) );
                        }
                        if ( isNonNullObject( instance ) )
                        {
                            return instance;
                        }
                    }
                }

                const properties = [];

                const descriptors = propertyDescriptors( klass.prototype, true );

                const newInstance = Object.create( klass.prototype ?? klass );

                objectEntries( descriptors ).forEach( entry =>
                                                      {
                                                          const key = ObjectEntry.getKey( entry );
                                                          const descriptor = ObjectEntry.getValue( entry );

                                                          // Filter out system keys / private slots
                                                          if ( isValidKey( key ) )
                                                          {
                                                              properties.push( key );

                                                              const value = attempt( () => readProperty( data, key ) ?? descriptor.value );

                                                              if ( !(isNull( value ) || isFunction( value )) )
                                                              {
                                                                  if ( descriptor.set || descriptor.writable )
                                                                  {
                                                                      attempt( () => setProperty( newInstance, key, value ) );
                                                                  }
                                                                  else
                                                                  {
                                                                      // If the property is immutable,
                                                                      // force-define it on the new instance
                                                                      // to mirror the class's read-only intent.
                                                                      Object.defineProperty( newInstance,
                                                                                             key,
                                                                                             {
                                                                                                 value: value,
                                                                                                 writable: false,
                                                                                                 enumerable: true,
                                                                                                 configurable: false
                                                                                             } );
                                                                  }
                                                              }
                                                          }
                                                      } );

                let entries = Object.entries( data ) ?? objectEntries( data );

                for( let entry of entries )
                {
                    let key = asString( ObjectEntry.getKey( entry ) || entry[0], true );

                    if ( isBlank( key ) || properties.includes( key ) )
                    {
                        continue;
                    }

                    let value = ObjectEntry.getValue( entry ) ?? entry[1];

                    if ( "attributes" === key )
                    {
                        const entries = isIterable( value ) ? value : attempt( () => objectEntries( value ) );
                        for( const [key, value] of entries )
                        {
                            attempt( () => newInstance.setAttribute( key, value ) );
                        }
                    }
                    else if ( !isNull( value ) && isNull( readProperty( newInstance, key ) ) )
                    {
                        attempt( () => newInstance.setAttribute( key, value ) );
                    }
                }

                return newInstance;
            }
        }
    };

    ToolBocksObject.evaluateEntriesForEquality = function( pObjectA, pObjectB, pOptions )
    {
        let same = attempt( () => evaluateEntriesForEquality( pObjectA, pObjectB, pOptions ) );
    };

    ToolBocksObject.areEqual = function( pObjA, pObjB )
    {
        return attempt( () => areEqual( pObjA, pObjB ) );
    };

    const mod =
        lock( {
                  classes:
                      {
                          ToolBocksObject
                      },
                  ToolBocksObject,
                  evaluateEntriesForEquality,
                  areEqual
              } );

    if ( _ud !== typeof module )
    {
        module.exports = lock( mod );
    }

    return lock( mod );

}());
