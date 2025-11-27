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
            isArray,
            isFunction,
            isClass,
            isIterable,
            getClass,
            getClassName,
            toIterable
        } = typeUtils;

    const { asString, asInt } = stringUtils;

    const { asArray, includesAll, Filters } = arrayUtils;

    const { TYPES, Collection } = collectionModule;

    const modName = "BockCollectionUtils_PropertyAccessMap";

    let toolBocksModule = new ToolBocksModule( modName, INTERNAL_NAME );


    /**
     * This class behaves like a Map as well as an ObjectLiteral.
     *
     */
    class PropertyAccessMap extends Map
    {
        constructor( pEntries )
        {
            // Call the parent Map constructor to initialize the map's data
            super( isArray( pEntries ) ? pEntries : isNonNullObject( pEntries ) ? objectEntries( pEntries ) : [[]] );

            // Define the custom behavior for the proxy
            const handler =
                {
                    // handles [] or . property access
                    get: ( target, property, receiver ) =>
                    {
                        // first, we check if the property exists on the target or its prototype
                        const value = target[property];

                        if ( isFunction( value ) )
                        {
                            // if it's a function (like 'entries', 'keys', 'values', 'get', 'set', or 'clear', for example),
                            // we have bind to the target (the Map instance) to bypass the "incompatible receiver" error.
                            // this forces the 'this' context inside the native method to be the *target* object,
                            // which has the required internal slots.
                            return value.bind( target );
                        }

                        // check for non-function properties (like 'size')
                        if ( property in target )
                        {
                            return value;
                        }

                        // otherwise, we assume it's a Map key lookup
                        return target.get( property );
                    },

                    // handles property assignment via [] or . syntax
                    set: ( target, property, value ) =>
                    {
                        target.set( property, value );

                        return true;
                    },

                    deleteProperty: ( target, property ) =>
                    {
                        return target.delete( property );
                    },

                    // Handle the 'in' operator (e.g., 'key' in myMap)
                    has: ( target, property ) =>
                    {
                        return target.has( property );
                    }

                };

            // return a new Proxy of the current instance,
            // using our custom handler.
            return new Proxy( this, handler );
        }
    }

    class TypedMap extends PropertyAccessMap
    {
        #type = TYPES.Any;
    }

}());