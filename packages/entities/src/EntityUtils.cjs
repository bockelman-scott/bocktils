// noinspection JSUnresolvedReference

/**
 * This module defines and exposes useful superclasses
 * and objects as well as functions useful for handling classes and entities.
 *
 */

const core = require( "@toolbocks/core" );

const jsonUtils = require( "@toolbocks/json" );

const { moduleUtils, constants, typeUtils, stringUtils, arrayUtils } = core;

const { _ud = "undefined", $scope } = constants;

// noinspection FunctionTooLongJS,OverlyComplexFunctionJS
(function exposeModule()
{
    const INTERNAL_NAME = "__BOCK__ENTITIES__";

    if ( $scope() && (null != $scope()[INTERNAL_NAME]) )
    {
        return $scope()[INTERNAL_NAME];
    }

    const
        {
            ToolBocksModule,
            OBJECT_REGISTRY = $scope()["__BOCK_OBJECT_REGISTRY__"],
            ObjectEntry,
            populateOptions,
            objectEntries,
            objectValues,
            getProperty,
            isWritable,
            populateProperties,
            overwriteProperties,
            lock,
            localCopy,
            resolveEvent,
            attempt,
            asyncAttempt,
            attemptSilent,
            detectCycles,
            $ln,
            no_op
        } = moduleUtils;

    const { _dot, S_ERROR, _validTypes } = constants;

    const
        {
            isNull,
            isNullOrNaN,
            isNonNullValue,
            isBoolean,
            isString,
            isNumeric,
            isObject,
            isNonNullObject,
            isClass,
            getClass,
            getClassName,
            isError,
            isArray,
            isLikeArray,
            isMap,
            isFunction,
            isTypedArray,
            isArrayBuffer,
            isSharedArrayBuffer,
            isDataView,
            areSameType,
            isReadOnly,
            areCompatibleTypes,
            toObjectLiteral,
            toDecimal,
            asObject
        } = typeUtils;

    const { asString, asInt, isBlank, lcase, ucase, toBool } = stringUtils;

    const { asArray, AsyncBoundedQueue } = arrayUtils;

    const { asJson, parseJson } = jsonUtils;

    const modName = "BockEntities";

    const toolBocksModule = new ToolBocksModule( modName, INTERNAL_NAME );

    const DEFAULT_SAME_OBJECT_OPTIONS =
        {
            strict: false,
            caseSensitive: true,
            type: null,
            numericThreshold: 0.000000001,
            ignored_properties: []
        };

    function identical( pObjA, pObjB )
    {
        if ( isNonNullObject( pObjA ) && isNonNullObject( pObjB ) )
        {
            return (pObjB === pObjA) || (OBJECT_REGISTRY.getGuid( pObjB ) === OBJECT_REGISTRY.getGuid( pObjA ));
        }
        return false;
    }

    const _compareNumbers = function( pFirst, pSecond )
    {
        if ( isNonNullValue( pFirst ) && isNumeric( pFirst ) )
        {
            if ( isNonNullValue( pSecond ) && isNumeric( pSecond ) )
            {
                const first = attempt( () => toDecimal( pFirst ) );

                const second = attempt( () => toDecimal( pSecond ) );

                const diff = attempt( () => (first - second) );

                return !isNullOrNaN( diff ) ? diff : Number.MAX_VALUE;
            }
            return Number.MIN_VALUE;
        }
        return Number.MAX_VALUE;
    };

    const _strictType = function( pType, pFirst, pSecond )
    {
        let type = isString( pType ) ? asString( pType, true ) : (isClass( pType ) ? pType : asString( typeof type, true ));

        if ( isString( type ) &&
             _validTypes.includes( lcase( type ) ) &&
             (typeof pFirst !== type || typeof pSecond !== type) )
        {
            return false;
        }
        return !isClass( type ) || ((pFirst instanceof type) && (pSecond instanceof type));
    };

    const _sameString = function( pFirst, pSecond, pOptions )
    {
        const options = { ...DEFAULT_SAME_OBJECT_OPTIONS, ...(pOptions || {}) };

        const caseSensitive = !!options.caseSensitive;
        const strict = !!options.strict;

        let first = asString( pFirst, !strict );
        let second = asString( pSecond, !strict );

        first = false === caseSensitive ? ucase( first ) : first;
        second = false === caseSensitive ? ucase( second ) : second;

        return first === second;
    };

    const _sameArray = function( pFirst, pSecond, pOptions, pStack = [] )
    {
        const stack = asArray( pStack || [] );

        if ( detectCycles( stack, 5, 5 ) )
        {
            const error = new Error( `Entered an infinite loop at ${stack.join( _dot )}` );
            toolBocksModule.reportError( error,
                                         `iterating a cyclically-connected graph`,
                                         S_ERROR,
                                         modName + "::_sameArray::detectCycles",
                                         stack );
            return false;
        }

        if ( $ln( pFirst ) !== $ln( pSecond ) )
        {
            return false;
        }

        const options = { ...DEFAULT_SAME_OBJECT_OPTIONS, ...(pOptions || {}) };

        const first = [...(pFirst || [])].sort();
        const second = [...(pSecond || [])].sort();

        let result = true;

        for( let i = first.length; i--; )
        {
            if ( !same( first[i], second[i], options, stack.concat( asString( i ) ) ) )
            {
                result = false;
                break;
            }
        }

        // we only trust a positive result,
        // since we cannot rely on the elements to be properly sortable
        if ( result )
        {
            return true;
        }
    };

    const _sameObject = function( pFirst, pSecond, pOptions, pStack = [] )
    {
        const stack = asArray( pStack || [] );

        if ( detectCycles( stack, 5, 5 ) )
        {
            const error = new Error( `Entered an infinite loop at ${stack.join( _dot )}` );
            toolBocksModule.reportError( error,
                                         `iterating a cyclically-connected graph`,
                                         S_ERROR,
                                         modName + "::_sameObject::detectCycles", stack );
            return false;
        }

        const options = { ...DEFAULT_SAME_OBJECT_OPTIONS, ...(pOptions || {}) };

        const ignored = asArray( options.ignored_properties || [] ) || [];

        if ( isLikeArray( pFirst ) &&
             isLikeArray( pSecond ) &&
             _sameArray( pFirst, pSecond, options ) )
        {
            return true;
        }

        for( let p in pFirst )
        {
            if ( ignored.includes( p ) )
            {
                continue;
            }
            if ( !same( getProperty( pFirst, p ), getProperty( pSecond, p ), options, stack.concat( p ) ) )
            {
                return false;
            }
        }

        for( let p in pSecond )
        {
            if ( ignored.includes( p ) )
            {
                continue;
            }
            if ( !same( getProperty( pSecond, p ), getProperty( pFirst, p ), options, stack.concat( p ) ) )
            {
                return false;
            }
        }

        const firstID = asString( OBJECT_REGISTRY.getGuid( pFirst ) );
        const secondID = asString( OBJECT_REGISTRY.getGuid( pSecond ) );

        if ( !(isBlank( firstID ) || isBlank( secondID )) && same( firstID, secondID, options, stack ) )
        {
            return true;
        }

        const jsonFirst = asString( attempt( () => asJson( pFirst ) ), true );
        const jsonSecond = asString( attempt( () => asJson( pSecond ) ), true );

        return !!same( jsonFirst, jsonSecond, options, stack );
    };

    /**
     * Returns true if the 2 arguments represent the same object graph
     * or the same non-object value.
     *
     * Basically a deep ==, not limited to ===
     * @param {any} pFirst the first object or value
     * @param {any} pSecond the other object or value
     * @param {Object} pOptions an object with properties describing how compare the values
     * @param {Array.<*>} pStack USED INTERNALLY WHEN CALLED RECURSIVELY -- do not pass a value
     * @returns true if the 2 arguments represent the same object graph or the same value
     */
    const same = function( pFirst, pSecond, pOptions = DEFAULT_SAME_OBJECT_OPTIONS, pStack = [] )
    {
        if ( pFirst === pSecond || (isNull( pFirst ) && isNull( pSecond )) )
        {
            return true;
        }

        const options = { ...DEFAULT_SAME_OBJECT_OPTIONS, ...(pOptions || {}) };

        const strict = !!options.strict;
        const type = options.type;

        if ( (strict && ((typeof pFirst !== typeof pSecond) || !_strictType( type, pFirst, pSecond ))) ||
             !areCompatibleTypes( pFirst, pSecond ) )
        {
            return false;
        }

        if ( isNonNullObject( pFirst ) && isNonNullObject( pSecond ) )
        {
            const stack = asArray( pStack || [] );

            if ( detectCycles( stack, 5, 5 ) )
            {
                const error = new Error( `Entered an infinite loop at ${stack.join( _dot )}` );
                toolBocksModule.reportError( error,
                                             `iterating a cyclically-connected graph`,
                                             S_ERROR,
                                             modName + "::same::detectCycles", stack );
                return false;
            }

            return _sameObject( pFirst, pSecond, options, stack );
        }

        const numericThreshold = toDecimal( options.numericThreshold || 0.000000001 );

        if ( isNumeric( pFirst ) && isNumeric( pSecond ) )
        {
            const diff = Math.abs( _compareNumbers( pFirst, pSecond ) );

            return ( !isNullOrNaN( diff ) &&
                     diff > Number.MIN_VALUE &&
                     diff < Number.MAX_VALUE &&
                     diff < numericThreshold);
        }

        if ( isString( pFirst ) || isString( pSecond ) )
        {
            return _sameString( pFirst, pSecond, options );
        }

        if ( isBoolean( pFirst ) || isBoolean( pSecond ) )
        {
            return toBool( pFirst ) === toBool( pSecond );
        }

        if ( isFunction( pFirst ) )
        {
            return (isFunction( pSecond )) && asString( pFirst.toString(), true ) === asString( pSecond.toString(), true );
        }

        return false;
    };

    class BockEntity
    {
        // this allows each of our Entities, if necessary, to behave like an EventTarget, if required
        #__eventTarget = new EventTarget();

        // used rarely to shuttle temporary values between methods
        // attributes are not included in equality comparisons or persisted.
        // to save memory, we avoid instantiating a new Map until we need one.
        #attributes; // = new Map();

        constructor()
        {
        }

        static get [Symbol.species]()
        {
            return this;
        }

        static from( pSource )
        {
            let species = this[Symbol.species];
            let obj = new species();
            let source = asObject( pSource ) || attempt( () => asJson( pSource ) ) || {};
            return populateProperties( obj, source );
        }

        setAttribute( pName, pValue )
        {
            const key = asString( pName, true );

            if ( !isBlank( key ) )
            {
                this.#attributes = !isNull( this.#attributes ) && isMap( this.#attributes ) ? this.#attributes : new Map();

                if ( isNull( pValue ) )
                {
                    this.#attributes.delete( key );
                }
                else
                {
                    this.#attributes.set( key, pValue );
                }

                return new Map( objectEntries( this.#attributes ) );
            }

            return null;
        }

        getAttribute( pName )
        {
            const key = asString( pName, true );

            if ( !isBlank( key ) )
            {
                this.#attributes = !isNull( this.#attributes ) && isMap( this.#attributes ) ? this.#attributes : new Map();

                return this.#attributes.get( key );
            }

            return null;
        }

        hasAttribute( pName )
        {
            const key = asString( pName, true );

            if ( !isBlank( key ) )
            {
                this.#attributes = !isNull( this.#attributes ) && isMap( this.#attributes ) ? this.#attributes : new Map();

                return this.#attributes.has( key );
            }

            return false;
        }

        toObjectLiteral( pOptions )
        {
            return toObjectLiteral( this, pOptions );
        }

        toJson( pOptions )
        {
            return attempt( () => asJson( this.toObjectLiteral( pOptions ) ) );
        }

        isIdentical( pOther )
        {
            return (pOther === this) || (OBJECT_REGISTRY.getGuid( pOther ) === OBJECT_REGISTRY.getGuid( this ));
        }

        /**
         * Dispatches an event for which there may be a listener.
         *
         * @param {Event} pEvt - The event to be dispatched. Prefer dispatching instances of ModuleEvent.
         * @return {boolean} Returns true if the event was successfully dispatched, otherwise false.
         */
        dispatchEvent( pEvt )
        {
            return this.#__eventTarget.dispatchEvent( pEvt );
        }

        /**
         * Adds an event listener to this instance.
         *
         * @param {string} pEvt - The name of the event to listen for.
         * @param {Function|Object} pHandler - The callback function to execute when the event is triggered or an Object with a handleEvent method
         * @param {Object|boolean} [pOptions] - Optional parameters that define characteristics about the event listener,
         * such as whether it is captured in the capturing phase, is one-time, or is passive.
         * @return {void} Does not return a value.
         */
        addEventListener( pEvt, pHandler, pOptions )
        {
            this.#__eventTarget.addEventListener( pEvt, pHandler, pOptions );
        }

        /**
         * Removes the specified event listener from this instance.
         *
         * @param {string} pEvt - The name of the event to remove the listener from.
         * @param {Function|Object} pHandler - The event handler function or object to remove.
         * @param {Object|boolean} [pOptions] - An object or a boolean indicating the options with which the listener was added.
         * @return {void} - Does not return any value.
         */
        removeEventListener( pEvt, pHandler, pOptions )
        {
            this.#__eventTarget.removeEventListener( pEvt, pHandler, pOptions );
        }

        toString()
        {
            let s = attempt( () => asJson( this ) );

            if ( !isBlank( s ) )
            {
                return s;
            }

            return `${getClassName( this )}::${OBJECT_REGISTRY.getGuid( this )}`;
        }

        [Symbol.toPrimitive]()
        {
            return this.toString();
        }

        equals( pOther )
        {
            if ( this.isIdentical( pOther ) )
            {
                return true;
            }

            return same( this, pOther, true, getClass( this ) );
        }

        clone()
        {
            const species = this.constructor[Symbol.species] || this.constructor;
            return isFunction( species.from ) ? species.from( this ) : new species( this );
        }

        get cloneable()
        {
            return isFunction( this["clone"] );
        }
    }

    class BockIdentified extends BockEntity
    {
        #id = 0;

        constructor( pId )
        {
            super();
            this.#id = asInt( pId );
        }

        get id()
        {
            // noinspection JSUnresolvedReference
            return asInt( this.#id || this.Id );
        }

        equals( pOther )
        {
            if ( this.isIdentical( pOther ) )
            {
                return true;
            }

            if ( asInt( pOther?.id ) === this.id && getClass( pOther ) === getClass( this ) )
            {
                return true;
            }

            return same( this, pOther, { strict: true, type: getClass( this ) } );
        }

        static from( pObject )
        {
            const source = asObject( pObject ) || {};
            const instance = new BockIdentified( source?.id || source.Id );
            return populateProperties( instance, source );
        }
    }

    class BockNamed extends BockIdentified
    {
        #name;

        constructor( pId, pName )
        {
            super( pId );
            this.#name = asString( pName, true );
        }

        get name()
        {
            return asString( this.#name, true );
        }

        equals( pOther )
        {
            if ( super.equals( pOther ) )
            {
                return asString( pOther?.name, true ) === asString( this.name, true );
            }
            return false;
        }

        static from( pObject )
        {
            const source = asObject( pObject ) || {};

            const instance = new BockNamed( source?.id || source?.Id,
                                            source?.name || source?.Name );

            return populateProperties( instance, source );
        }
    }

    class BockDescribed extends BockNamed
    {
        #code;
        #description;

        constructor( pId, pName, pCode, pDescription )
        {
            super( pId, pName );
            this.#code = asString( pCode, true );
            this.#description = asString( pDescription, true );
        }

        get code()
        {
            return asString( this.#code, true );
        }

        get description()
        {
            return asString( this.#description || this.code ) || asString( this.code );
        }

        equals( pOther )
        {
            if ( super.equals( pOther ) )
            {
                return asString( pOther?.code, true ) === asString( this.code, true ) && asString( pOther?.description, true ) === asString( this.description, true );
            }
            return false;
        }

        static from( pObject )
        {
            const source = asObject( pObject ) || {};

            const instance = new BockDescribed( source?.id || source?.Id,
                                                source?.name || source?.Name,
                                                source?.code || source?.Code,
                                                source?.description || source?.Description );

            return populateProperties( instance, source );
        }
    }

    /**
     * Represents a dependency in the system, implementing the INamed interface.
     *
     * The Dependency class is used to define entities or components
     * that can be 'injected' into RequestHandlers or Services
     *
     * @class
     * @augments BockNamed
     * @extends BockNamed
     *
     * @class
     *
     * @param {string} pId - The unique identifier for the dependency.
     * @param {string} pName - The name of the dependency.
     */
    class Dependency extends BockNamed
    {
        #component;
        #options;

        /**
         * Constructs an instance of the class with the provided id, name, component, and options.
         *
         * @param {string|number} pId                The unique identifier for the instance.
         * @param {string} pName                     The name of the instance.
         * @param {Object|function} pComponent       The component represented by this instance.
         * @param {Object} [pOptions={}]             Optional component-specific parameters
         *                                           to configure the instance.
         *
         * @return {Object} An instance of the class.
         */
        constructor( pId, pName, pComponent, pOptions = {} )
        {
            super( pId, pName );

            this.#component = isNonNullObject( pComponent ) || isClass( pComponent ) ? pComponent : this;

            this.#options = populateOptions( pOptions || {}, {} );
        }

        get options()
        {
            return populateOptions( {}, this.#options || {} );
        }

        // subclasses may need to clone or create a component to return
        get component()
        {
            if ( isNonNullObject( this.#component ) )
            {
                if ( isFunction( this.#component.clone ) )
                {
                    return this.#component.clone( this.options );
                }
                return this.#component;
            }
            else if ( isClass( this.#component ) )
            {
                return new this.#component( this.options );
            }

            return this.#component;
        }

        clone()
        {
            return new Dependency( this.id, this.name, this.component, this.options );
        }

        async start( ...pArgs )
        {
            let comp = this.component;
            if ( isFunction( comp?.start ) )
            {
                return await asyncAttempt( async() => comp.start( ...pArgs ) );
            }
            else if ( isFunction( comp?.init ) )
            {
                return await asyncAttempt( async() => comp.init( ...pArgs ) );
            }
            return this;
        }

        async init( ...pArgs )
        {
            return await this.start( ...pArgs );
        }

        async stop( ...pArgs )
        {
            let comp = this.component;
            if ( isFunction( comp?.stop ) )
            {
                return await asyncAttempt( async() => comp.stop( ...pArgs ) );
            }
            return this;
        }

        async connect( ...pArgs )
        {
            let comp = this.component;
            if ( isFunction( comp?.connect ) )
            {
                return await asyncAttempt( async() => comp.connect( ...pArgs ) );
            }
            return this;
        }

        async disconnect( ...pArgs )
        {
            let comp = this.component;
            if ( isFunction( comp?.disconnect ) )
            {
                return await asyncAttempt( async() => comp.disconnect( ...pArgs ) );
            }
            return this;
        }
    }

    class Dependencies
    {
        #mapById = new Map();
        #mapByName = new Map();

        constructor( ...pDependencies )
        {
            const dependencies = asArray( pDependencies || [] ).filter( e => isNonNullObject( e ) && e instanceof Dependency );

            for( let dependency of dependencies )
            {
                this.#mapById.set( dependency.id, dependency );
                this.#mapByName.set( dependency.name, dependency );
            }
        }

        getDependency( pKey )
        {
            if ( isNumeric( pKey ) )
            {
                return this.#mapById.get( asInt( pKey ) ) || this.#mapByName.get( asString( pKey, true ) );
            }
            return this.#mapByName.get( asString( pKey, true ) );
        }

        getComponent( pKey )
        {
            const dependency = this.getDependency( pKey );
            return dependency.component || dependency;
        }

        clone()
        {
            let values = [...(asArray( objectValues( this.#mapById ) || [] ) || [])];

            values = values.filter( e => isNonNullObject( e ) && e instanceof Dependency );

            values = values.map( e => e.clone() );

            return new Dependencies( ...values );
        }

        async startAll( ...pArgs )
        {
            let values = [...(asArray( objectValues( this.#mapById ) || [] ) || [])];
            for( const dependency of values )
            {
                await asyncAttempt( async() => dependency.start( ...pArgs ) );
            }
            return this;
        }

        async stopAll( ...pArgs )
        {
            let values = [...(asArray( objectValues( this.#mapById ) || [] ) || [])];
            for( const dependency of values )
            {
                await asyncAttempt( async() => dependency.stop( ...pArgs ) );
            }
            return this;
        }

        async disconnectAll( ...pArgs )
        {
            let values = [...(asArray( objectValues( this.#mapById ) || [] ) || [])];
            for( const dependency of values )
            {
                await asyncAttempt( async() => dependency.disconnect( ...pArgs ) );
            }
            return this;
        }
    }

    Dependencies.resolveDependencies = function( pDependencies )
    {
        if ( isNonNullObject( pDependencies ) )
        {
            if ( pDependencies instanceof Dependencies )
            {
                return pDependencies;
            }
            else
            {
                return new Dependencies( ...(asArray( pDependencies || [] )).filter( e => isNonNullObject( e ) && e instanceof Dependency ) );
            }
        }
        else
        {
            return new Dependencies();
        }
    };

    let mod =
        {
            classes:
                {
                    BockEntity,
                    BockIdentified,
                    BockNamed,
                    BockDescribed,
                    Dependency,
                    Dependencies
                },
            BockEntity,
            BockIdentified,
            BockNamed,
            BockDescribed,
            Dependency,
            Dependencies,
            asObject,
            identical,
            same
        };

    mod = toolBocksModule.extend( mod );

    return mod.expose( mod, INTERNAL_NAME, (_ud !== typeof module ? module : mod) ) || mod;

}());
