// noinspection JSUnresolvedReference

/**
 * This module defines and exposes useful superclasses
 * and objects as well as functions useful for handling classes and entities.
 *
 */

/**
 * This statement imports the core modules:
 * Constants, TypeUtils, StringUtils, and ArrayUtils
 */
const core = require( "@toolbocks/core" );

const jsonUtils = require( "@toolbocks/json" );

const { moduleUtils, constants, typeUtils, stringUtils, arrayUtils } = core;

const {
    _ud = "undefined", $scope = constants?.$scope || function()
    {
        return (_ud === typeof self ? ((_ud === typeof global) ? {} : (global || {})) : (self || {}));
    }
} = constants;

// noinspection FunctionTooLongJS,OverlyComplexFunctionJS
(function exposeModule()
{
    const INTERNAL_NAME = "__BOCK__ENTITIES__";

    if ( $scope() && (null != $scope()[INTERNAL_NAME]) )
    {
        return $scope()[INTERNAL_NAME];
    }

    const {
        ToolBocksModule,
        OBJECT_REGISTRY = $scope()["__BOCK_OBJECT_REGISTRY__"],
        populateOptions,
        objectEntries,
        getProperty,
        isWritable,
        lock,
        localCopy,
        resolveEvent,
        attempt,
        asyncAttempt,
        detectCycles,
        $ln,
        no_op
    } = moduleUtils;

    const {
        _dot,
        S_ERROR,
        _validTypes
    } = constants;

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
            areCompatibleTypes,
            toObjectLiteral,
            toDecimal,
            asObject
        } = typeUtils;


    const { asString, asInt, isBlank, lcase, ucase, toBool } = stringUtils;

    const { asArray, AsyncBoundedQueue } = arrayUtils;

    const { asJson, parseJson } = jsonUtils;

    const modName = "EntityUtils";

    const toolBocksModule = new ToolBocksModule( modName, INTERNAL_NAME );

    const DEFAULT_SAME_OBJECT_OPTIONS =
        {
            strict: false,
            caseSensitive: true,
            type: null,
            numericThreshold: 0.000000001
        };

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
        const options = populateOptions( pOptions || {}, DEFAULT_SAME_OBJECT_OPTIONS );

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

        const options = populateOptions( pOptions || {}, DEFAULT_SAME_OBJECT_OPTIONS );

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

        const options = populateOptions( pOptions || {}, DEFAULT_SAME_OBJECT_OPTIONS );

        if ( isLikeArray( pFirst ) &&
             isLikeArray( pSecond ) &&
             _sameArray( pFirst, pSecond, options ) )
        {
            return true;
        }

        for( let p in pFirst )
        {
            if ( !same( getProperty( pFirst, p ), getProperty( pSecond, p ), options, stack.concat( p ) ) )
            {
                return false;
            }
        }

        for( let p in pSecond )
        {
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

        const options = populateOptions( pOptions || {}, DEFAULT_SAME_OBJECT_OPTIONS );

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

    try
    {
        Object.prototype.equals = function( pObject )
        {
            return same( this, pObject, true, getClass( this ) );
        };
    }
    catch( ex )
    {
        toolBocksModule.reportError( ex, ex.message, S_ERROR, modName + ":: ASSIGN::Object.prototype.equals", this );
    }

    function populateProperties( pTarget, pSource, ...pOmit )
    {
        let target = pTarget || {};
        let source = pSource || {};

        let skip = [...(asArray( pOmit || [] ) || [])];

        objectEntries( source ).forEach( entry =>
                                         {
                                             let prop = entry.key;
                                             let value = entry.value;

                                             if ( ( !skip.includes( prop ) || isNull( target[prop] )) && isWritable( target, prop ) )
                                             {
                                                 target[prop] = target[prop] || (isLikeArray( value ) ? [...(asArray( value || [] ) || [])] : value) || target[prop];
                                             }
                                         } );
        return target;
    }

    function overwriteProperties( pTarget, pSource, ...pOmit )
    {
        let target = pTarget || {};
        let source = pSource || {};

        let skip = [...(asArray( pOmit || [] ) || [])];

        objectEntries( source ).forEach( entry =>
                                         {
                                             let prop = entry.key;
                                             let value = entry.value;

                                             if ( !skip.includes( prop ) && isWritable( target, prop ) )
                                             {
                                                 target[prop] = (isLikeArray( value ) ? [...(asArray( value || [] ) || [])] : value) || target[prop];
                                             }
                                         } );

        return target;
    }

    class MemorySink
    {
        constructor()
        {

        }

        save( pEntity )
        {

        }

        update( pEntity )
        {

        }

        delete( pEntity )
        {

        }
    }

    class EventBroker extends EventTarget
    {
        #listeners = [];

        constructor()
        {
            super();

            if ( EventBroker.instance )
            {
                return EventBroker.instance; // Ensure singleton
            }

            EventBroker.instance = this;
        }

        resolveListener( pListener )
        {
            if ( isNull( pListener ) )
            {
                return no_op;
            }

            const handlerFunction = isFunction( pListener ) ? pListener : null;

            const handlerObject = isNonNullObject( pListener ) && isFunction( pListener?.handleEvent ) ? pListener : null;

            return handlerFunction || handlerObject || no_op;
        }

        addEventListener( pType, pListener, pOptions )
        {
            let type = asString( pType, true );

            let listener = this.resolveListener( pListener );

            let options = populateOptions( pOptions, { capture: false, once: false, passive: false, signal: null } );

            this.#listeners.push( { target: this, type, listener, options } );

            super.addEventListener( pType, pListener, pOptions );
        }

        dispatchEvent( pEvent, pData, pSource )
        {
            const evt = resolveEvent( pEvent, pData );
            evt.target = evt.target || pSource;
            return super.dispatchEvent( evt );
        }

        removeEventListener( pType, pListener, pOptions )
        {
            let type = asString( pType, true );

            let listener = this.resolveListener( pListener );

            let options = populateOptions( pOptions, { capture: false, once: false, passive: false, signal: null } );

            let obj = { target: this, type, listener, options };

            this.#listeners = this.#listeners.filter( e => !(e.target === this && e.type === type && e.listener === listener && same( e.options, options )) && !same( e, obj ) );

            super.removeEventListener( type, listener, options );
        }
    }

    class EventPublisher
    {
        #broker;
        #queue;
        #storageHandler;

        #timer;

        constructor( pEventBroker, pQueueSize, pStorageHandler )
        {
            this.#broker = pEventBroker || new EventBroker();
            this.#queue = new AsyncBoundedQueue( pQueueSize );
            this.#storageHandler = pStorageHandler || new MemorySink();
        }

        async publish( pEvent, pData, pSource )
        {
            this.#broker.dispatchEvent( pEvent, pData, pSource );
        }

        async subscribe( pType, pListener, pOptions )
        {
            this.#broker.addEventListener( pType, pListener, pOptions );
        }

        async unsubscribe( pType, pListener, pOptions )
        {
            this.#broker.removeEventListener( pType, pListener, pOptions );
        }

        async enqueue( pEvent, pData, pSource )
        {
            const evt = resolveEvent( pEvent, pData );
            this.#queue.enQueue( evt );

            if ( isNull( this.#timer ) )
            {
                const me = this;

                const func = asyncAttempt( async() =>
                                           {

                                           } );

                this.#timer = setInterval( func, 100 );
            }
        }

        async _processQueuedEvents()
        {

        }
    }


    class BockEntity
    {
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

        toObjectLiteral()
        {
            return toObjectLiteral( this );
        }

        toJson()
        {
            return attempt( () => asJson( this.toObjectLiteral() ) );
        }

        isIdentical( pOther )
        {
            return (pOther === this) || (OBJECT_REGISTRY.getGuid( pOther ) === OBJECT_REGISTRY.getGuid( this ));
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
            const species = this.constructor[Symbol.species];
            return species.from( this );
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

    let mod =
        {
            classes:
                {
                    BockEntity,
                    BockIdentified,
                    BockNamed,
                    BockDescribed
                },
            BockEntity,
            BockIdentified,
            BockNamed,
            BockDescribed,
            populateProperties,
            overwriteProperties,
            asObject,
            same
        };

    mod = toolBocksModule.extend( mod );

    return mod.expose( mod, INTERNAL_NAME, (_ud !== typeof module ? module : mod) ) || mod;

}());
