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
            sleep,
            lock,
            $ln
        } = moduleUtils;

    const { _str, _num, _big, _bool, _obj, _fun, _symbol } = constants;

    const
        {
            JS_TYPES,
            isNull,
            isNonNullObject,
            isNonNullValue,
            isNumeric,
            isArray,
            isDate,
            isFunction,
            isAsyncFunction,
            isClass,
            isIterable,
            isType,
            getClass,
            getClassName,
            toIterable,
            castTo
        } = typeUtils;

    const { asString, asInt, asFloat } = stringUtils;

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
        constructor( pEntries )
        {
            // Call the parent Map constructor to initialize the map's data
            super( isArray( pEntries ) ? pEntries : isNonNullObject( pEntries ) ? objectEntries( pEntries ) : [[]] );

            const me = this;

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
                        if ( property in target )
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

                        attempt( () => instance.set( property, value ) );
                        attempt( () => me.set( property, value ) );

                        return true;
                    },

                    deleteProperty: ( target, property ) =>
                    {
                        const instance = target || me;

                        return instance.delete( property );
                    },

                    // Handle the 'in' operator (e.g., 'key' in myMap)
                    has: ( target, property ) =>
                    {
                        const instance = target || me;

                        return instance.has( property ) || attempt( () => me.has( property ) );
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

        constructor( pEntries, K, V )
        {
            super( pEntries );

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

        constructor( pEntries, K, V, comparator )
        {
            super( pEntries, K, V );

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

        constructor( pEntries, K, V, comparator )
        {
            super( pEntries, K, V );

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
                    ValueOrderedMap
                },
            PropertyAccessMap,
            TreeMap,
            ValueOrderedMap
        };

    mod = toolBocksModule.extend( mod );

    return mod.expose( mod, INTERNAL_NAME, (_ud !== typeof module ? module : mod) ) || mod;

}());
