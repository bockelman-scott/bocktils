/**
 * This file defines a module that exposes a class that can be used or extended
 * to provide a Map that also allows values to be accessed using property accessor syntax.
 *
 * That is, even though the object is a Map, you can still use . or [] to access values.
 *
 * This combines the best of both worlds with respect to JavaScript Literal Objects and JavaScript Maps.
 *
 */

/* import dependencies */
const core = require( "@toolbocks/core" );

const jsonUtils = require( "@toolbocks/json" );

const collectionModule = require( "./Collection.js" );

const { constants } = core;

/* define a variable for typeof undefined */
const { _ud = "undefined", $scope } = constants;

// noinspection FunctionTooLongJS
/**
 * This module is constructed by an Immediately Invoked Function Expression (IIFE).
 * see: <a href="https://developer.mozilla.org/en-US/docs/Glossary/IIFE">MDN: IIFE</a> for more information on this design pattern
 */
(function exposeModule()
{
    // defines a key we can use to store this module in global scope
    const INTERNAL_NAME = "__BOCK_COLLECTION_UTILS_MAPS_";

    // if we've already executed this code, just return the module
    if ( $scope() && (null != $scope()[INTERNAL_NAME]) )
    {
        return $scope()[INTERNAL_NAME];
    }

    const { moduleUtils, constants, typeUtils, stringUtils, arrayUtils } = core;

    const
        {
            ModuleEvent,
            ToolBocksModule,
            IllegalArgumentError,
            ObjectEntry,
            objectEntries,
            objectKeys,
            objectValues,
            attempt,
            asyncAttempt,
            dereference,
            sleep,
            lock,
            deepLock,
            $ln
        } = moduleUtils;

    const { _mt, _str, _num, _big, _bool, _obj, _fun, _symbol } = constants;

    const
        {
            JS_TYPES,
            isNull,
            isNonNullObject,
            isNonNullValue,
            isString,
            isNumeric,
            isArray,
            isDate,
            isFunction,
            isAsyncFunction,
            isClass,
            isIterable,
            isType,
            isMap,
            getClass,
            getClassName,
            toIterable,
            castTo,
            clamp = moduleUtils.clamp
        } = typeUtils;

    const { asString, asInt, asFloat, isBlank } = stringUtils;

    const { asArray, includesAll, Filters, Comparators } = arrayUtils;

    const { asJson } = jsonUtils;

    const { TYPES, Collection } = collectionModule;

    const modName = "BockCollectionUtils_Maps";

    let toolBocksModule = new ToolBocksModule( modName, INTERNAL_NAME );


    /**
     * This class behaves like a Map as well as an ObjectLiteral.
     * That is, you can use dot(.) or brackets([]) syntax to access values.
     */
    class PropertyAccessMap extends Map
    {
        constructor( pEntries, ...pExcludedProperties )
        {
            // Call the parent Map constructor to initialize the map's data
            super( isArray( pEntries ) ? pEntries : isNonNullObject( pEntries ) ? objectEntries( pEntries ) : [[]] );

            const me = this;

            const excludedProperties = asArray( pExcludedProperties );

            // Define the custom behavior for the proxy
            const handler =
                {
                    // handles [] or . property access
                    get: ( target, property, receiver ) =>
                    {
                        const instance = target || me;

                        // first, we check if the property exists on the target or its prototype
                        const value = instance[property] || me[property];

                        if ( isFunction( value ) )
                        {
                            // if it's a function (like 'entries', 'keys', 'values', 'get', 'set', or 'clear', for example),
                            // we have bind to the target (the Map instance) to bypass the "incompatible receiver" error.
                            // this forces the 'this' context inside the native method to be the *target* object,
                            // which has the required internal slots.
                            return value.bind( instance || me );
                        }

                        // check for non-function properties (like 'size')
                        if ( property in target || excludedProperties.includes( property ) )
                        {
                            return value;
                        }

                        // otherwise, we assume it's a Map key lookup
                        return attempt( () => target.get( property ) || me.get( property ) );
                    },

                    // handles property assignment via [] or . syntax
                    set: ( target, property, value ) =>
                    {
                        const instance = target || me;

                        if ( property in instance || excludedProperties.includes( property ) )
                        {
                            attempt( () => instance[property] = value );
                        }

                        attempt( () => instance.set( property, value ) );
                        attempt( () => me.set( property, value ) );

                        return true;
                    },

                    deleteProperty: ( target, property ) =>
                    {
                        const instance = target || me;

                        if ( !(property in instance || excludedProperties.includes( property )) )
                        {
                            return instance.delete( property );
                        }
                    },

                    // Handle the 'in' operator (e.g., 'key' in myMap)
                    has: ( target, property ) =>
                    {
                        const instance = target || me;

                        return (property in instance) || instance.has( property ) || attempt( () => me.has( property ) );
                    }
                };

            // return a new Proxy of the current instance,
            // using our custom handler.
            return new Proxy( this, handler );
        }

        acceptVisitor( pVisitor )
        {
            if ( (isNonNullObject( pVisitor ) && isFunction( pVisitor.visit )) || isFunction( pVisitor ) )
            {
                let visit = isNonNullObject( pVisitor ) ? pVisitor.visit.bind( pVisitor ) : pVisitor.bind( this );

                if ( isAsyncFunction( visit ) )
                {
                    const original = visit;

                    visit = async function( entry )
                    {
                        return await original( entry );
                    }.bind( pVisitor );

                    return this.acceptAsyncVisitor( visit );
                }

                let entries = this.entries();

                for( let entry of entries )
                {
                    let stop = visit( entry );

                    if ( stop )
                    {
                        break;
                    }
                }
            }
        }

        async acceptAsyncVisitor( pVisitor )
        {
            if ( (isNonNullObject( pVisitor ) && isFunction( pVisitor.visit )) || isFunction( pVisitor ) )
            {
                let visit = isNonNullObject( pVisitor ) ? pVisitor.visit.bind( pVisitor ) : pVisitor.bind( this );

                let entries = this.entries();

                for( let entry of entries )
                {
                    let stop = await asyncAttempt( async() => await visit( entry ) );

                    if ( stop )
                    {
                        break;
                    }
                }
            }
        }
    }

    class TypedMap extends PropertyAccessMap
    {
        #keyType = TYPES.ANY;
        #valueType = TYPES.ANY;

        constructor( pEntries, K, V, ...pExcludedProperties )
        {
            super( pEntries, ...pExcludedProperties );

            const me = this;

            this.#keyType = K;
            this.#valueType = V;

            let entries = [...(asArray( attempt( () => [...(me.entries())] ) || attempt( () => objectEntries( me ) ) || [] ))];

            if ( $ln( entries ) )
            {
                attempt( () => entries.forEach( entry =>
                                                {
                                                    let key = ObjectEntry.getKey( entry );
                                                    let value = ObjectEntry.getValue( entry );

                                                    if ( !isType( key, K ) || !isType( value, V ) )
                                                    {
                                                        attempt( () => me.delete( key ) );
                                                    }
                                                } ) );
            }
        }

        delete( key )
        {
            if ( isType( key, this.#keyType ) )
            {
                return super.delete( key );
            }
            return false;
        }

        get( key )
        {
            if ( isType( key, this.#keyType ) )
            {
                let value = attempt( () => super.get( key ) );

                if ( isType( value, this.#valueType ) )
                {
                    return value;
                }

                return null;
            }

            return null;
        }

        has( key )
        {
            if ( isType( key, this.#keyType ) )
            {
                return super.has( key );
            }
            return false;
        }

        set( key, value )
        {
            if ( isType( key, this.#keyType ) && isType( value, this.#valueType ) )
            {
                if ( super.set( key, value ) )
                {
                    return this;
                }
            }

            throw new IllegalArgumentError( `This map only accepts <K,V> entries of <${this.#keyType}, ${this.#valueType}>`,
                                            {
                                                key,
                                                value,
                                                K: this.#keyType,
                                                V: this.#valueType
                                            }, key, value, this.#keyType, this.#valueType );
        }
    }

    const DEFAULT_COMPARATOR = ( a, b ) =>
    {
        let comp = 0;

        if ( isNonNullObject( a ) && isNonNullObject( b ) )
        {
            if ( isDate( a ) && isDate( b ) )
            {
                return Comparators.CREATE_DEFAULT( _num )( a.getTime() || a, b.getTime() || b );
            }

            if ( isFunction( a.compareTo ) )
            {
                return attempt( () => a.compareTo( b ) );
            }
            else if ( isFunction( b.compareTo ) )
            {
                return attempt( () => -(b.compareTo( a )) );
            }
            else
            {
                let classA = getClass( a );
                let classB = getClass( b );

                if ( isClass( classA ) && isFunction( classA.compare ) )
                {
                    return classA.compare( a, b );
                }

                if ( isClass( classB ) && isFunction( classB.compare ) )
                {
                    return classB.compare( a, b );
                }
            }

            if ( isFunction( a.valueOf ) || isFunction( b.valueOf ) )
            {
                let aa = isFunction( a.valueOf ) ? a.valueOf() : castTo( a, typeof b );
                let bb = isFunction( b.valueOf ) ? b.valueOf() : castTo( b, typeof aa || typeof a );

                comp = Comparators.CREATE_DEFAULT( typeof aa || typeof bb )( aa || a, bb || b );

                if ( 0 !== comp )
                {
                    return comp;
                }
            }

            let otherProperties = ["intValue", "floatValue", "id", "name"];

            for( let prop of otherProperties )
            {
                if ( 0 !== comp )
                {
                    break;
                }

                if ( isFunction( a[prop] ) || isNonNullValue( a[prop] ) )
                {
                    if ( isFunction( b[prop] ) || isNonNullValue( b[prop] ) )
                    {
                        let aa = isFunction( a[prop] ) ? attempt( () => a[prop].call( a ) ) : a[prop];
                        let bb = isFunction( b[prop] ) ? attempt( () => b[prop].call( b ) ) : b[prop];

                        comp = Comparators.CREATE_DEFAULT( typeof aa || typeof bb )( aa || a, bb || b );
                    }
                }
            }

            if ( 0 !== comp )
            {
                return comp;
            }

            let aa = asString( a ) || asJson( a );
            let bb = asString( b ) || asJson( b );

            comp = aa < bb ? -1 : aa > bb ? 1 : 0;

            if ( 0 !== comp )
            {
                return comp;
            }
        }

        if ( isNumeric( a ) && isNumeric( b ) )
        {
            comp = asInt( Math.ceil( asFloat( a ) - asFloat( b ) ) );
            if ( 0 !== comp )
            {
                return comp;
            }
        }

        return a < b ? -1 : a > b ? 1 : 0;
    };

    class TreeMap extends TypedMap
    {
        #comparator;

        constructor( pEntries, K, V, comparator, ...pExcludedProperties )
        {
            super( pEntries, K, V, ...pExcludedProperties );

            this.#comparator = (isNull( comparator ) || !Comparators.isComparator( comparator )) ? DEFAULT_COMPARATOR : comparator;

            this.#sortEntries();
        }

        #sortEntries()
        {
            const me = this;

            let entries = objectEntries( me || this );

            if ( entries && $ln( entries ) > 0 )
            {
                let comparator = me.comparator || function( a, b )
                {
                    let func = (me.#comparator?.compare || me.#comparator).bind( me );
                    return func( a, b );
                };

                this.clear();

                entries = entries.sort( ( a, b ) => comparator( ObjectEntry.getKey( a ), ObjectEntry.getKey( b ) ) );

                entries.forEach( entry => attempt( () => me.set( ObjectEntry.getKey( entry ), ObjectEntry.getValue( entry ) ) ) );
            }
        }

        get comparator()
        {
            const me = this;

            return function( a, b )
            {
                let func = (me.#comparator?.compare || me.#comparator).bind( me );
                return func( a, b );
            };
        }

        entries()
        {
            const me = this;

            const comparator = this.comparator;

            let entries = attempt( () => objectEntries( me || this ) || super.entries() );

            entries = entries.sort( ( a, b ) => comparator( ObjectEntry.getKey( a ), ObjectEntry.getKey( b ) ) );

            return entries;
        }

        keys()
        {
            const me = this;

            const comparator = (me || this).comparator;

            let keys = attempt( () => objectKeys( me ) || super.keys() );

            keys = keys.sort( ( a, b ) => comparator( a, b ) );

            return asArray( keys );
        }

        values()
        {
            const entries = this.entries();
            return entries.map( e => ObjectEntry.getValue( e ) ) || super.values();
        }

        [Symbol.iterator]()
        {
            return this.entries();
        }
    }

    class ValueOrderedMap extends TypedMap
    {
        #comparator;

        constructor( pEntries, K, V, comparator, ...pExcludedProperties )
        {
            super( pEntries, K, V, ...pExcludedProperties );

            this.#comparator = (isNull( comparator ) || !Comparators.isComparator( comparator )) ? DEFAULT_COMPARATOR : comparator;

            this.#sortEntries();
        }

        #sortEntries()
        {
            const me = this;

            let entries = objectEntries( me || this );

            if ( entries && $ln( entries ) > 0 )
            {
                let comparator = me.comparator || function( a, b )
                {
                    let func = (me.#comparator?.compare || me.#comparator).bind( me );
                    return func( a, b );
                };

                this.clear();

                entries = entries.sort( ( a, b ) => comparator( ObjectEntry.getValue( a ), ObjectEntry.getValue( b ) ) );

                entries.forEach( entry => attempt( () => me.set( ObjectEntry.getKey( entry ), ObjectEntry.getValue( entry ) ) ) );
            }
        }

        get comparator()
        {
            const me = this;

            return function( a, b )
            {
                let func = (me.#comparator?.compare || me.#comparator).bind( me );
                return func( a, b );
            };
        }

        entries()
        {
            const me = this;

            const comparator = this.comparator;

            let entries = attempt( () => objectEntries( me || this ) || super.entries() );

            entries = entries.sort( ( a, b ) => comparator( ObjectEntry.getValue( a ), ObjectEntry.getValue( b ) ) );

            return entries;
        }

        keys()
        {
            const entries = this.entries();
            return entries.map( e => ObjectEntry.getKey( e ) ) || asArray( super.values() ).sort( this.comparator );
        }

        values()
        {
            const entries = this.entries();
            return entries.map( e => ObjectEntry.getValue( e ) ) || asArray( super.values() ).sort( this.comparator );
        }

        [Symbol.iterator]()
        {
            return this.entries();
        }
    }

    class BoundedMap extends Map
    {
        #map;

        #limit = 1_024;

        #useWeakRef = false;

        constructor( pMap, pLimit = 1_024, pUseWeakRef = false )
        {
            super();

            this.#map = isMap( pMap ) ? new Map( pMap.entries() ) : isNonNullObject( pMap ) ? new Map( Object.entries( pMap ) ) : new Map();

            this.#limit = clamp( asInt( pLimit, 1_024 ), 128, 4_096 );

            this.#useWeakRef = !!(pUseWeakRef);
        }

        /**
         * Returns the upper bound limit of the size of this cache
         * @returns {number}
         */
        get limit()
        {
            return clamp( asInt( this.#limit, 1_024 ), 128, 4_096 );
        }

        /**
         * @inheritDoc
         */
        clear()
        {
            super.clear();
            this.#map.clear();
        }

        /**
         * @inheritDoc
         */
        delete( key )
        {
            super.delete( key );
            return this.#map.delete( key );
        }

        /**
         * @inheritDoc
         */
        get( pKey )
        {
            const key = isNull( pKey ) ? _mt : pKey;

            /*
             * Empty keys are not supported
             */
            if ( isNull( pKey ) || (isString( key ) && isBlank( key )) )
            {
                return null;
            }

            let v = this.#map.get( key ) ?? super.get( key );

            if ( !isNull( v ) )
            {
                switch ( typeof v )
                {
                    case _ud:
                        return null;

                    case _obj:
                        v = dereference( v );

                        if ( isNonNullObject( v ) )
                        {
                            v = lock( v );
                        }

                        break;

                    default:
                        break;
                }

                return v;
            }

            return null;
        }

        has( pKey )
        {
            const key = isNull( pKey ) ? _mt : pKey;

            /*
             * Empty keys are not supported
             */
            if ( isNull( pKey ) || (isString( key ) && isBlank( key )) )
            {
                return false;
            }

            /*
             * If we don't have anything, even an empty WeakRef,
             * we return false
             */
            if ( !(this.#map.has( key ) || super.has( key )) )
            {
                return false;
            }

            /*
             * If we have an entry for the specified key,
             * (which we can assume by reaching this statement),
             * and we are not storing WeakRef objects,
             * we return true
             */
            if ( !this.#useWeakRef )
            {
                return true;
            }

            const ref = this.get( key );

            if ( isNonNullObject( ref ) )
            {
                /*
                 * If we reach this statement,
                 * we may be storing WeakRef objects,
                 * so we have to retrieve the value,
                 * dereference it
                 * and return true if the dereferenced value is not undefined (or null)
                 */
                if ( isNonNullObject( dereference( ref ) ) )
                {
                    return true;
                }
                else
                {
                    /*
                     * if we found a WeakRef whose object has been garbage-collected,
                     * we remove the entry
                     *
                     * we do this here and in other accessors and mutators
                     * as a 'lazy' healing technique
                     */
                    this.delete( key );
                }
            }
            else if ( !isNull( ref ) )
            {
                return true;
            }

            return false;
        }

        set( pKey, pValue )
        {
            const key = isNull( pKey ) ? _mt : pKey;

            /*
             * Empty keys are not supported
             */
            if ( isNull( pKey ) || (isString( key ) && isBlank( key )) )
            {
                return false;
            }

            let value = pValue ?? this.get( key );

            // by deleting the entry and then re-setting it,
            // we move a potentially existing entry to the end of the collection,
            // so we will not remove it prematurely
            this.delete( key );

            // we do not support storing null
            if ( isNonNullObject( value ) )
            {
                // if the object passed in is a WeakRef,
                // we dereference it first,
                value = dereference( value );

                // then we freeze (lock) the object
                // cached objects must be immutable
                if ( isNonNullObject( value ) )
                {
                    value = deepLock( value );

                    // if this cache is configured to hold WeakRefs,
                    // we wrap the value in a new WeakRef
                    value = this.#useWeakRef ? new WeakRef( value ) : value;
                }
            }

            // if this cache is at capacity
            if ( this.size >= this.limit )
            {
                // we delete the oldest 'living' entry
                // (which we assume to be identified by the first entry in the iterator)
                const oldestKey = this.keys().next()?.value;

                if ( !(isNull( oldestKey ) || isBlank( oldestKey )) )
                {
                    this.delete( oldestKey );
                }
                else
                {
                    // if our size >= our limit, but our iterator is empty,
                    // that means ALL of our entries are 'dead'
                    // (WeakRef wrappers whose payload has been garbage collected)
                    // so we call clear() to recover
                    this.clear();
                }
            }

            // add the entry
            if ( !isNull( value ) )
            {
                return this.#map.set( key, lock( value ) );
            }

            return false;
        }

        /**
         *  Returns an iterator of the 'live' entries held in the cache.
         *
         *  We are overridding the superclass method with a generator function
         *  to avoid loading all entries into memory
         *  and to facilitate skipping over 'dead' entries.
         */
        * entries()
        {
            // We use super.entries() to get the raw Map iterator
            for( const [key, val] of this.#map.entries() )
            {
                // dereference the value (in case we are configured to use WeakRef)
                let value = isNonNullObject( val ) ? dereference( val ) : val;

                // If it's a WeakRef that has been garbage collected, or it is null, we ignore and move on
                if ( isNull( value ) )
                {
                    continue;
                }

                /*
                 * yield the entry wrapped in our ObjectEntry structure.
                 *
                 * note that ObjectEntry extends Array, so consumers can use this method
                 * exactly as they would the method of the superclass
                 */
                yield lock( new ObjectEntry( key, lock( value ), this ) );
            }
        }

        /**
         * @inheritDoc
         */
        [Symbol.iterator]()
        {
            return this.entries();
        }

        /**
         * Executes the provided function or calls specified Vistor's visit method
         * once for each 'live' entry in the collection (in insertion order)
         *
         * @param {function|Visitor} pCallback a function to call for each valid entry
         *                                     or a Visitor whose visit method will be called for each entry
         * @param {Object} [pThis=undefined]   an object to which to bind the provided function
         *                                     so that 'this' within the function refers to that object
         */
        forEach( pCallback, pThis )
        {
            // Ensure we have a function,
            // wrapping a Visitor in an arrow function
            // that calls the visit method as a function bound to the Visitor
            let callback = isFunction( pCallback ) ?
                           pCallback :
                           ((isNonNullObject( pCallback ) && pCallback instanceof Visitor) ?
                            ( entry ) => pCallback.visit.call( pCallback, entry ) :
                            no_op);

            // declare a locale variable
            // so we can wrap the function again
            // to capture this closure as its scope
            let cb = callback;

            if ( isNonNullObject( pThis ) )
            {
                const me = this;
                cb = function( pEntry )
                {
                    callback.call( pThis ?? me, pEntry );
                }.bind( pThis ?? this );
            }

            for( let entry of this.entries() )
            {
                attempt( () => cb( entry ) );
            }
        }

        /**
         * Returns an iterator of the valid entries in this cache
         * @returns {Generator<[K, V][0], void, *>}
         */
        * keys()
        {
            for( const [key, val] of this.entries() )
            {
                if ( isNull( val ) || (isNonNullObject( val ) && (this.#useWeakRef && isNull( dereference( val ) ))) )
                {
                    // do not return "dead" keys
                    continue;
                }

                yield key;
            }
        }

        /**
         * Returns an iterator of the valid objects held in this cache
         * @returns {Generator<*, void, *>}
         */
        * values()
        {
            for( let val of this.#map.values() )
            {
                // dereference the value (in case we are configured to use WeakRef)
                let value = isNonNullObject( val ) ? dereference( val ) : val;

                // If it's a WeakRef that has been garbage collected, or it is null, we ignore and move on
                if ( isNull( value ) )
                {
                    continue;
                }

                // yield the value (always ensuring that it is immutable)
                yield lock( value );
            }
        }
    }


    let mod =
        {
            TYPES,
            dependencies:
                {
                    moduleUtils,
                    constants,
                    typeUtils,
                    stringUtils,
                    arrayUtils,
                    jsonUtils,
                    collectionModule
                },
            classes:
                {
                    Collection,
                    PropertyAccessMap,
                    TreeMap,
                    ValueOrderedMap,
                    BoundedMap
                },
            PropertyAccessMap,
            TreeMap,
            ValueOrderedMap,
            BoundedMap
        };

    mod = toolBocksModule.extend( mod );

    return mod.expose( mod, INTERNAL_NAME, (_ud !== typeof module ? module : mod) ) || mod;

}());
