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

    const { ToolBocksObject } = require( "../../core/src/ToolBocksObject.cjs" );

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

    class BockEntity extends ToolBocksObject
    {
        constructor( ...pArgs )
        {
            super( ...pArgs );
        }

        static get [Symbol.species]()
        {
            return this;
        }

        static from( pSource )
        {
            const species = this[Symbol.species];

            const source = asObject( pSource );

            const args = asArray( [...this.attributes] );

            const instance = isClass( species ) ? new species( ...args ) : Object.create( species ?? {} );

            return attempt( () => populateProperties( instance, source ) ) ?? instance;
        }

        toLiteral( pOmitFunctions = false )
        {
            return super.toLiteral( pOmitFunctions );
        }

        toJson()
        {
            return attempt( () => asJson( this.toLiteral( true ) ) );
        }

        toJSON()
        {
            return attempt( () => asJson( this.toLiteral( true ) ) );
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
            return super.dispatchEvent( pEvt );
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
            super.addEventListener( pEvt, pHandler, pOptions );
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
            super.removeEventListener( pEvt, pHandler, pOptions );
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

        constructor( pId, ...pArgs )
        {
            super( ...pArgs );
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

        static from( pObject )
        {
            const species = this[Symbol.species];

            const source = asObject( pObject ) || {};

            const id = source?.id || readProperty( source, "id", "native", "native.id", "filevine_id.native" );

            const args = asArray( [...this.attributes] );

            const instance = (isClass( species ) ? attempt( () => new species( id, ...args ) ) : new BockIdentified( id, ...args )) ?? new BockIdentified( id, ...args );

            return attempt( () => populateProperties( instance, source ) ) ?? instance;
        }
    }

    class BockNamed extends BockIdentified
    {
        #name;

        constructor( pId, pName, ...pArgs )
        {
            super( pId, ...pArgs );
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

        static from( pObject )
        {
            const species = this[Symbol.species];

            const source = asObject( pObject ) || {};

            const id = source?.id || readProperty( source, "id", "native", "native.id", "filevine_id.native" );

            const name = source?.name || readProperty( source, "name", "full_name", "code", "description" );

            const args = asArray( [...this.attributes] );

            const instance = (isClass( species ) ? attempt( () => new species( id, name, ...args ) ) : new BockNamed( id, name, ...args )) ?? new BockNamed( id, name, ...args );

            return attempt( () => populateProperties( instance, source ) ) ?? instance;
        }
    }

    class BockDescribed extends BockNamed
    {
        #code;
        #description;

        constructor( pId, pName, pCode, pDescription, ...pArgs )
        {
            super( pId, pName, ...pArgs );
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

        static from( pObject )
        {
            const species = this[Symbol.species];

            const source = asObject( pObject ) || {};

            const id = source?.id || readProperty( source, "id", "native", "native.id", "filevine_id.native" );

            const name = source?.name || readProperty( source, "name", "full_name", "code", "description" );

            const code = source?.code || readProperty( source, "code", "abbreviation", "short_name", "short_description", "description" );

            const description = source?.description || readProperty( source, "description", "comment", "comments", "note", "notes", "explanation", "long_name" );

            const args = asArray( [...this.attributes] );


            const instance = (isClass( species ) ?
                              attempt( () => new species( id, name, code, description, ...args ) ) :
                              new BockDescribed( id, name, code, description, ...args )) ?? new BockDescribed( id, name, code, description, ...args );

            return attempt( () => populateProperties( instance, source ) ) ?? instance;
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
            asObject,
            identical,
            same
        };

    mod = toolBocksModule.extend( mod );

    return mod.expose( mod, INTERNAL_NAME, (_ud !== typeof module ? module : mod) ) || mod;

}());
