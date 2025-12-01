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
    const INTERNAL_NAME = "__BOCK_COLLECTION_UTILS_SORTED_SET_";

    // if we've already executed this code, just return the module
    if ( $scope() && (null != $scope()[INTERNAL_NAME]) )
    {
        return $scope()[INTERNAL_NAME];
    }

    const { moduleUtils, constants, typeUtils, stringUtils, arrayUtils } = core;

    const
        {
            OBJECT_REGISTRY = $scope()["__BOCK_OBJECT_REGISTRY__"],
            ModuleEvent,
            ToolBocksModule,
            IllegalArgumentError,
            attempt,
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
            isArray,
            isFunction,
            isClass,
            isIterable,
            getClass,
            getClassName,
            toIterable
        } = typeUtils;

    const { asString, asInt } = stringUtils;

    const { asArray, includesAll, Filters, Comparators } = arrayUtils;

    const { TYPES, Collection } = collectionModule;

    const modName = "BockCollectionUtils_SortedSet";

    let toolBocksModule = new ToolBocksModule( modName, INTERNAL_NAME );

    /**
     * Determines if two items are equal using a comparator
     *
     * @param {*} e - The element in the collection.
     * @param {*} item - The item to compare against.
     * @param {Comparator|function} comparator - The function to use to compare the values
     * @returns {boolean} True if the elements are considered equal, false otherwise.
     */
    const _isEqual = ( e, item, comparator ) =>
    {
        // use comparator if it exists
        if ( Filters.IS_COMPARATOR( comparator ) || Comparators.isComparator( comparator ) )
        {
            if ( isFunction( comparator?.compare ) )
            {
                return 0 === comparator.compare( e, item );
            }

            return 0 === comparator( e, item );
        }

        // fallback to compareTo
        if ( isFunction( e?.compareTo ) )
        {
            return 0 === e.compareTo( item );
        }

        // fallback to equals
        if ( isFunction( e?.equals ) )
        {
            return e.equals( item );
        }
        else if ( isFunction( item?.equals ) )
        {
            return item.equals( e );
        }
        else if ( isNonNullObject( e ) && isNonNullObject( item ) )
        {
            return OBJECT_REGISTRY.areEqual( e, item );
        }

        return e === item;
    };

    const DEFAULT_COMPARATOR = function( a, b )
    {
        let comp = 0;

        if ( Comparators.isComparable( a ) )
        {
            comp = attempt( () => a.compareTo( b ) );
        }
        else if ( Comparators.isComparable( b ) )
        {
            comp = (0 - (attempt( () => b.compareTo( a ) )));
        }
        else
        {
            comp = (a < b) ? -1 : ((a > b) ? 1 : 0);
        }

        return comp;
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
        #comparator = DEFAULT_COMPARATOR;

        constructor( pType = TYPES.ANY, pCollection = null, pComparator = DEFAULT_COMPARATOR )
        {
            super( pType, pCollection );

            this.#comparator = Comparators.isComparator( pComparator ) ? pComparator : DEFAULT_COMPARATOR;

            if ( isNonNullObject( this.#comparator ) && Comparators.isComparator( this.#comparator.compare ) )
            {
                let func = (this.#comparator.compare || this.#comparator).bind( this.#comparator );

                this.#comparator = ( a, b ) => func( a, b );
            }

            let arr = this.toArray();

            arr = arr.sort( this.#comparator );

            super._replace( ...arr );
        }

        get comparator()
        {
            let func = Comparators.isComparator( this.#comparator ) ? this.#comparator : DEFAULT_COMPARATOR;

            if ( isNonNullObject( func ) && Comparators.isComparator( func.compare ) )
            {
                func = this.#comparator.compare.bind( this.#comparator );
                return ( a, b ) => func.compare( a, b );
            }

            return func;
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

            let exists = arr.find( e => _isEqual( e, pItem ) );

            if ( null === exists || _ud === typeof exists )
            {
                arr.push( pItem );

                arr = arr.sort( this.comparator );

                super._replace( ...arr );
            }

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

            const items = asArray( pItems );

            let arr = [...(this.toArray())];

            items.forEach( item =>
                           {
                               let exists = arr.find( e => _isEqual( e, item ) );
                               if ( null === exists || _ud === typeof exists )
                               {
                                   arr.push( item );
                               }
                           } );

            if ( $ln( arr ) > currentSize )
            {
                arr = arr.sort( this.comparator );

                super._replace( ...arr );
            }

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
            const arr = this.toArray();

            const exists = arr.find( e => _isEqual( e, pItem ) );

            return !(null === exists || _ud === typeof exists);
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

            for( const elem of items )
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

                arr = arr.sort( this.comparator );

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

                arr = arr.sort( this.comparator );

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

                arr = arr.sort( this.comparator );

                return super._replace( ...arr );
            }

            return this.size !== currentSize;
        }

        first()
        {
            let arr = this.toArray();

            arr = arr.sort( this.comparator );

            return $ln( arr ) > 0 ? arr[0] : null;
        }

        headSet( pToElement )
        {
            if ( isNonNullValue( pToElement ) )
            {
                let arr = this.toArray();

                const comparator = this.comparator;

                arr = arr.sort( comparator );

                arr = arr.filter( e => (comparator( e, pToElement ) < 0) );

                return new SortedSet( this.type, arr, comparator );
            }

            return this;
        }

        last()
        {
            let arr = this.toArray();

            const comparator = this.comparator;

            arr = arr.sort( comparator );

            return $ln( arr ) > 0 ? arr.slice( -1 ) : null;
        }

        subSet( pFromElement, pToElement )
        {
            let from = isNonNullValue( pFromElement ) ? pFromElement : this.first();
            let to = isNonNullValue( pToElement ) ? pToElement : this.last();

            let arr = [...(asArray( this.toArray() ))];

            arr = arr.sort( this.comparator );

            let comparator = this.comparator;

            arr = arr.filter( e => comparator( e, from ) >= 0 && comparator( e, to ) < 0 );

            arr = arr.sort( this.comparator );

            return new SortedSet( this.type, arr, comparator );
        }

        tailSet( pFromElement )
        {

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
