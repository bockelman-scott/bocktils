// noinspection JSCheckFunctionSignatures

/**
 * @fileOverview
 * @author Scott Bockelman
 * @license MIT
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
    const INTERNAL_NAME = "__BOCK_COLLECTION_UTILS__";

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

    const modName = "BockCollectionUtils_SortedSet";

    let toolBocksModule = new ToolBocksModule( modName, INTERNAL_NAME );

    /**
     * Determines if two items are equal using a hierarchy of checks:
     * 1. Strict equality (===).
     * 2. Custom `equals(other)` method.
     * 3. Custom `compareTo(other)` method returning 0.
     *
     * @param {*} e - The element in the collection.
     * @param {*} item - The item to compare against.
     * @param comparator
     * @returns {boolean} True if the elements are considered equal, false otherwise.
     */
    const _isEqual = ( e, item, comparator ) =>
    {
        // use comparator if it exists, fallback to compareTo,
        // then if that is undefined, use equals,
        // finally resort === only if functions are not defined

        if ( isFunction( e?.compareTo ) )
        {
            return 0 === e.compareTo( item );
        }

        return false;
    };

    /**
     * Represents a generic collection of items, with support for type enforcement.
     *
     * The class contains various methods to interact with and manipulate the collection,
     * such as adding, removing, checking for containment, type validation, and generating
     * iterable streams.
     *
     * This class is inspired by java.util.collections#Collection
     * @class
     */
    class SortedSet extends Collection
    {
        #comparator;

        constructor( pType = TYPES.ANY, pCollection = null, pComparator = null )
        {
            super( pType, pCollection );

            let arr = this.toArray();

            // adjust array as per comparator

            super._replace( ...arr );
        }

        /**
         * Adds an item to the collection if it matches the specified type or class and is not null.
         *
         * @param {*} pItem -   The item to be added to the collection.
         *                      It must match the specified type or class of the collection.
         *
         * @return {boolean}    Returns `true` if the item was successfully added to the collection, otherwise `false`.
         *                      Throws an error if the item type does not match and cannot be added.
         */
        add( pItem )
        {
            if ( isNull( pItem ) )
            {
                return false;
            }

            const currentSize = this.size;

            let arr = this.toArray();

            // push if comparator does not return 0, sort according to comparator, remove and addAll

            super._replace( ...arr );

            return this.size > currentSize;
        }

        /**
         * Adds all provided items to the current collection if they meet the type criteria.
         * If the collection accepts any type, all items are added.
         * Otherwise, items are filtered based on the specified type.
         *
         * @param {...*} pItems -   The items to be added to the collection. Can be a single item or an iterable.
         * @return {boolean} -      Returns true if the collection size increased, otherwise false.
         */
        addAll( ...pItems )
        {
            const currentSize = this.size;

            let items = asArray( pItems );

            // push if comparator does not return 0, sort according to comparator, remove and addAll

            super._replace( ...items );

            return this.size > currentSize;
        }

        /**
         * Checks if a given item exists within the internal array, either by direct comparison
         * or using custom equality/comparison methods (equals or compareTo).
         *
         * @param {any} pItem - The item to check for existence in the array.
         * @return {boolean}    Returns true if the item exists in the array; otherwise, false.
         */
        contains( pItem )
        {

        }

        /**
         * Checks if all the specified items are present in the current object.
         *
         * @param {...any} pItems - one or more items to check for.
         *
         * @return {boolean}        Returns true if all specified items are present, otherwise false.
         */
        containsAll( ...pItems )
        {
            const items = asArray( pItems );

            const arr = this.toArray();

            if ( includesAll( arr, [...items] ) )
            {
                return true;
            }

            for( let elem of items )
            {
                if ( !this.contains( elem ) )
                {
                    return false;
                }
            }

            return true;
        }

        /**
         * Removes the specified item.
         *
         * @param {Object} pItem - The item to be removed.
         *
         * @return {boolean} Returns true if the item was removed
         */
        remove( pItem )
        {
            const currentSize = this.size;

            let arr = this.toArray();

            const index = arr.findIndex( e => _isEqual( e, pItem ) );

            if ( index > -1 )
            {
                arr.splice( index, 1 );

                super._replace( ...arr );
            }

            return this.size < currentSize;
        }

        /**
         * Removes all specified items from this collection.
         *
         * @param {...*} pItems - The items to be removed.
         *
         * @return {boolean} Returns true if one or more items were removed
         */
        removeAll( ...pItems )
        {
            const currentSize = this.size;

            const toRemove = asArray( pItems );

            let arr = this.toArray();

            // Create a new array that includes ONLY elements NOT contained in toRemove
            const newArr = arr.filter( e => !toRemove.some( item => _isEqual( e, item ) ) );

            if ( newArr.length < currentSize )
            {
                arr = newArr;

                return super._replace( ...arr );
            }

            return false;
        }

        /**
         * Retains only the elements in the collection that are contained in the specified items.
         * All elements not in the provided items will be removed from the collection.
         *
         * @param {...any} pItems - The items to be retained in the collection.
         *                          Multiple items can be provided as arguments.
         *
         * @return {boolean} Returns true if the size of the collection has changed
         */
        retainAll( ...pItems )
        {
            const currentSize = this.size;

            const toRetain = asArray( pItems || [] );

            let arr = this.toArray();

            const newArr = arr.filter( e => toRetain.some( item => _isEqual( e, item ) ) );

            if ( newArr.length !== currentSize )
            {
                arr = newArr;

                return super._replace( ...arr );
            }

            return this.size !== currentSize;
        }
    }

    let mod =
        {
            dependencies:
                {
                    moduleUtils,
                    constants,
                    typeUtils,
                    stringUtils,
                    arrayUtils
                },
            classes:
                {
                    Collection,
                    SortedSet
                },
            Collection,
            SortedSet
        };

    mod = toolBocksModule.extend( mod );

    return mod.expose( mod, INTERNAL_NAME, (_ud !== typeof module ? module : mod) ) || mod;

}());
