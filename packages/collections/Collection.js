// noinspection JSCheckFunctionSignatures

/**
 * @fileOverview
 * @author Scott Bockelman
 * @license MIT
 */

/* import dependencies */
const core = require( "@toolbocks/core" );

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
    const INTERNAL_NAME = "__BOCK_COLLECTION_UTILS_COLLECTION_";

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

    const modName = "BockCollectionUtils_Collection";

    let toolBocksModule = new ToolBocksModule( modName, INTERNAL_NAME );

    const TYPES =
        lock( {
                  ANY: "*",
                  [_str]: _str,
                  [_num]: _num,
                  [_big]: _big,
                  [_bool]: _bool,
                  [_fun]: _fun,
                  [_symbol]: _symbol
              } );

    function calculateType( pType = "*" )
    {
        let type = TYPES.ANY;

        switch ( typeof pType )
        {
            case _ud:
                return TYPES.ANY;

            case _str:
                type = asString( pType, true );
                return JS_TYPES.includes( type ) ? type : TYPES.ANY;

            case _fun:
                if ( isClass( pType ) )
                {
                    type = pType;
                    return type;
                }
                type = _fun;
                break;

            case _obj:
                if ( isArray( pType ) )
                {
                    type = Array;
                    break;
                }
                return getClass( pType ) || TYPES.ANY;

            default:
                return type;
        }

        return type;
    }

    /**
     * Determines if two items are equal using a hierarchy of checks:
     * 1. Strict equality (===).
     * 2. Custom `equals(other)` method.
     * 3. Custom `compareTo(other)` method returning 0.
     *
     * @param {*} e - The element in the collection.
     * @param {*} item - The item to compare against.
     * @returns {boolean} True if the elements are considered equal, false otherwise.
     */
    const _isEqual = ( e, item ) =>
    {
        // 1. Strict Equality (standard JavaScript check)
        if ( e === item )
        {
            return true;
        }

        // 2. Custom equals() method check
        if ( isFunction( e?.equals ) )
        {
            return e.equals( item );
        }

        // 3. Custom compareTo() method check
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
    class Collection
    {
        /**
         * Internal delegate allowing instances of this class to behave like an EventTarget
         */
        #eventTarget = new EventTarget();

        /**
         * This property can be used to restrict the types of items that can be stored in this collection.
         * The property can be any of the valid JavaScript types or a JavaScript class.
         * This is similar to creating a Generic collection Java, e.g., new Collection<T> where T is some type
         * @type {string|function}
         */
        #type = TYPES.ANY;

        /**
         * The internal array holding the items in this collection.
         *
         * *** This is never exposed or returned directly, however...
         * Unless a mapping function that either clones
         * or constructs new elements
         * is passed to methods that return or iterate the items in this collection,
         * the elements themselves may be modified. ***
         * @type {Array<*>}
         */
        #arr = [];

        #eventsEnabled = true;

        constructor( pType = TYPES.ANY, pCollection = null )
        {
            this.#type = calculateType( pType || "*" );

            this.disableEvents();

            if ( isIterable( pCollection ) )
            {
                this.addAll( ...(pCollection) );
            }
            else if ( isNonNullObject( pCollection ) && pCollection instanceof getClass( this ) )
            {
                this.addAll( ...(asArray( pCollection.toArray() )) );
            }

            this.enableEvents();
        }

        enableEvents()
        {
            this.#eventsEnabled = true;
        }

        disableEvents()
        {
            this.#eventsEnabled = true;
        }

        /**
         * Returns the type or class of items this collection stores and can accept.
         * @returns {string|Function} the Type of elements this collection can store
         */
        get type()
        {
            return this.#type || TYPES.ANY;
        }

        /**
         * Throws an IllegalArgumentError
         * when an attempt is made to add an item to this collection
         * that is not an instance of the class or type this collection supports.
         * @param pItem the item that cannot be added to this collection
         * @private
         */
        _throwTypeMismatchError( pItem )
        {
            let msg = isClass( this.type ) ? `This collection only accepts objects that are instances of ${getClassName( this.type )}` : `This collection only accepts ${this.type}s`;

            const error = new IllegalArgumentError( msg,
                                                    {
                                                        item: pItem,
                                                        type: typeof pItem,
                                                        "class": getClassName( pItem )
                                                    } );

            if ( this.#eventsEnabled )
            {
                this.dispatchEvent( new ModuleEvent( "error",
                                                     {
                                                         error: error,
                                                         item: pItem,
                                                         type: typeof pItem,
                                                         collection: this
                                                     } ) );
            }

            throw error;
        }

        /**
         * Returns the number of items currently held in this collection.
         *
         * @return {number} The number of elements held in this collection.
         *                  Defaults to 0 if the array is not defined.
         */
        get size()
        {
            return asInt( $ln( this.#arr || [] ) );
        }

        /**
         * Returns an array of the elements in this collection.
         * If a mapping function is provided,
         * the mapping function is applied to each element of the array before it is returned.
         *
         * @param {Function} [pMappingFunction] - An optional mapping function to transform
         *                                        each element of the array.
         * @return {Array} - The resulting array after applying the optional mapping function
         *                   or directly converting the internal data structure to an array.
         */
        toArray( pMappingFunction )
        {
            let arr = [...(asArray( this.#arr || [] ))];

            if ( Filters.IS_MAPPER( pMappingFunction ) )
            {
                arr = arr.map( pMappingFunction );
            }

            return asArray( arr );
        }

        /**
         * Converts the current collection to a Set, ensuring unique elements based on
         * the Collection's custom `contains` logic (which checks for `equals` or `compareTo`).
         *
         * @param {Function} [pMappingFunction] - A mapping function to apply to each element
         * before adding it to the final Set.
         *
         * @return {Set} A new Set containing the unique elements from the collection,
         * optionally transformed by the specified mapping function.
         */
        toSet( pMappingFunction )
        {
            let uniqueItems = [];

            let tempCollection = new (this.constructor || getClass( this ))( this.type );

            for( let elem of this.toArray() )
            {
                if ( !tempCollection.contains( elem ) )
                {
                    uniqueItems.push( elem );
                    tempCollection.add( elem );
                }
            }

            if ( Filters.IS_MAPPER( pMappingFunction ) )
            {
                uniqueItems = uniqueItems.map( pMappingFunction );
            }

            return new Set( uniqueItems );
        }

        /**
         * Converts the current collection of elements into a Map,
         * where each element is keyed by a specified property.
         *
         * @param {string} pKeyProperty - The property name to be used as the key for the Map. Defaults to "id".
         *
         * @return {Map} A Map where each element is keyed by the specified property or a default identifier.
         */
        toMap( pKeyProperty = "id" )
        {
            const map = new Map();

            let keyProperty = asString( pKeyProperty, true ) || "id";

            for( let elem of this.toArray() )
            {
                if ( isNonNullObject( elem ) )
                {
                    const key = asString( elem[keyProperty] || elem["instanceId"] || asString( elem ), true );

                    if ( !map.has( key ) )
                    {
                        map.set( key, elem );
                    }
                }
            }

            return map;
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

            if ( isClass( this.type ) && (isNonNullObject( pItem ) && pItem instanceof this.type) )
            {
                this.#arr.push( pItem );
            }
            else if ( TYPES.ANY === this.type || (this.type === (typeof pItem)) )
            {
                this.#arr.push( pItem );
            }
            else
            {
                this._throwTypeMismatchError( pItem );
            }

            if ( this.size > currentSize && this.#eventsEnabled )
            {
                this.dispatchEvent( new ModuleEvent( "ItemAdded", { item: pItem, collection: this } ) );
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

            let items = asArray( pItems );

            if ( isIterable( items ) )
            {
                let arr = [];

                arr.push( ...([...(asArray( items ))]) );

                if ( TYPES.ANY === this.type )
                {
                    this.#arr.push( ...(asArray( arr )) );
                }
                else
                {
                    if ( isClass( this.type ) )
                    {
                        arr = arr.filter( e => isNonNullObject( e ) && e instanceof this.type );
                    }
                    else
                    {
                        arr = arr.filter( e => (this.type === (typeof e)) );
                    }

                    this.#arr.push( ...(asArray( arr )) );
                }
            }

            if ( this.size > currentSize && this.#eventsEnabled )
            {
                this.dispatchEvent( new ModuleEvent( "ItemsAdded", { collection: this } ) );
            }

            return this.size > currentSize;
        }

        /**
         * Removes all the elements from this collection,
         * resetting it to an empty state.
         *
         * @return {void} No return value.
         */
        clear()
        {
            this.#arr = [];

            if ( this.#eventsEnabled )
            {
                this.dispatchEvent( new ModuleEvent( "Cleared", { collection: this } ) );
            }
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
            return this.#arr.includes( pItem ) || this.#arr.some( e => _isEqual( e, pItem ) );
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

            if ( includesAll( this.#arr, [...items] ) )
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

        isCompatibleWith( pOther )
        {
            if ( isNonNullObject( pOther ) )
            {
                return this.type === pOther.type ||
                       ((isClass( this.type ) && isClass( pOther.type )) &&
                        (this.type instanceof pOther.type || pOther.type instanceof this.type));
            }
            return false;
        }

        /**
         * Compares the current instance with another object to determine equality.
         * Another object is equal to this collection if it is an instance of this class or a subclass of this class
         * and contains the same number of elements, each of which evaluates to being equal to an element in this collection.
         *
         * @param {Object} pOther - The object to compare with the current instance.
         * @return {boolean}        Returns true if the given object is equal to the current instance, otherwise false.
         */
        equals( pOther )
        {
            if ( isNonNullObject( pOther ) && pOther instanceof getClass( this ) )
            {
                if ( this.size === pOther.size )
                {
                    if ( this.isCompatibleWith( pOther ) )
                    {
                        return pOther.containsAll( ...(asArray( this.toArray() )) ) && this.containsAll( ...(asArray( pOther.toArray() )) );
                    }
                }
            }
            return false;
        }

        /**
         * Checks if the collection is empty.
         *
         * @return {boolean} Returns true if the collection is empty; otherwise, returns false.
         */
        isEmpty()
        {
            return this.size <= 0;
        }

        /**
         * Provides an iterator for the object,
         * enabling its use in for...of loops
         * and other iterable contexts.
         *
         * @return {Iterator} An iterator object that iterates over the elements of the collection.
         */
        [Symbol.iterator]()
        {
            return toIterable( this.toArray() );
        }

        /**
         * Returns an asynchronous iterator for the object.
         * This method allows the object to be consumed using `for-await-of` loops,
         * where each iteration yields a value from the asynchronous iterable created
         * from the object's contents.
         *
         * @return {AsyncIterableIterator<*>} An asynchronous iterable iterator created
         * from the object's data.
         */
        [Symbol.asyncIterator]()
        {
            return toIterable( this.toArray(), true );
        }

        /**
         * Creates and returns an iterator for the current object.
         *
         * @return {Iterator} An iterator that allows iteration over the elements of the object.
         */
        iterator()
        {
            return toIterable( this.toArray(), true );
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

            const index = this.#arr.findIndex( e => _isEqual( e, pItem ) );

            if ( index > -1 )
            {
                this.#arr.splice( index, 1 );
            }

            if ( this.size < currentSize && this.#eventsEnabled )
            {
                this.dispatchEvent( new ModuleEvent( "ItemRemoved", { item: pItem, collection: this } ) );
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

            // Create a new array that includes ONLY elements NOT contained in toRemove
            const newArr = this.#arr.filter( e => !toRemove.some( item => _isEqual( e, item ) ) );

            if ( newArr.length < currentSize )
            {
                this.#arr = newArr;

                if ( this.#eventsEnabled )
                {
                    this.dispatchEvent( new ModuleEvent( "ItemsRemoved", { collection: this } ) );
                }

                return true;
            }

            return false;
        }

        /**
         * Removes elements from a collection based on the provided predicate, or filter, function.
         * Items are removed if they satisfy the predicate condition.
         *
         * @param {Function} pPredicate A predicate function used to test each element.
         *                              It should return true for elements that need to be removed.
         *
         * @return {boolean} Returns true of one or more items were removed
         */
        removeIf( pPredicate )
        {
            const currentSize = this.size;

            if ( !Filters.IS_FILTER( pPredicate ) )
            {
                return false;
            }

            const newArr = this.#arr.filter( e => !pPredicate( e ) );

            if ( newArr.length < currentSize )
            {
                this.#arr = newArr;
            }

            if ( this.size < currentSize && this.#eventsEnabled )
            {
                this.dispatchEvent( new ModuleEvent( "ItemsRemoved", { collection: this } ) );
            }

            return this.size < currentSize;
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

            const newArr = this.#arr.filter( e => toRetain.some( item => _isEqual( e, item ) ) );

            if ( newArr.length !== currentSize )
            {
                this.#arr = newArr;
            }

            if ( this.size !== currentSize && this.#eventsEnabled )
            {
                this.dispatchEvent( new ModuleEvent( "ItemsRetained", { collection: this } ) );
            }

            return this.size !== currentSize;
        }

        _replace( ...pItems )
        {
            this.disableEvents();

            this.clear();

            let results = this.addAll( ...pItems );

            this.enableEvents();

            return results;
        }

        _replaceCollection( pCollection )
        {
            this.disableEvents();

            this.clear();

            let results = this.addAll( ...(asArray( pCollection.toArray() )) );

            this.enableEvents();

            return results;
        }

        /**
         * An asynchronous generator method that yields each item in the current collection,
         * introducing a small delay before yielding each item.
         *
         * @return {AsyncGenerator<*>} An asynchronous generator that yields items from the collection,
         * with a 10ms delay between each yield.
         */
        async* values()
        {
            const me = this;

            for( const item of this )
            {
                await sleep( 10 );

                if ( this.#eventsEnabled )
                {
                    this.dispatchEvent( new ModuleEvent( "YieldedValue", { item: item, collection: me } ) );
                }

                yield item;
            }
        }

        /**
         * Creates and returns a readable stream from the iterable values of the current instance.
         *
         * @protected
         *
         * @return {Readable} A readable stream object in object mode, emitting the values of the current instance.
         */
        _getNodeStream()
        {
            const { Readable } = require( "stream" );
            return Readable.from( this.values(), { objectMode: true } );
        }

        /**
         * Creates and returns a ReadableStream instance which streams values from an iterator.
         *
         * The stream pulls data from the internal iterator on each request. If the iterator is
         * exhausted, it signals the end of the stream. If canceled, it dispatches a "StreamCancelled"
         * event with the provided reason and source.
         *
         * @protected
         *
         * @return {ReadableStream} A ReadableStream instance providing the values from the iterator.
         */
        _getWebStream()
        {
            const me = this;

            const iterator = this.values();

            return new ReadableStream( {
                                           async pull( controller )
                                           {
                                               const { value, done } = await iterator.next();

                                               if ( this.#eventsEnabled )
                                               {
                                                   me.dispatchEvent( new ModuleEvent( "YieldedValue",
                                                                                      {
                                                                                          item: value,
                                                                                          source: this,
                                                                                          collection: me
                                                                                      } ) );
                                               }

                                               if ( done )
                                               {
                                                   controller.close();
                                               }
                                               else
                                               {
                                                   controller.enqueue( value );
                                               }
                                           },
                                           cancel( pReason )
                                           {
                                               if ( this.#eventsEnabled )
                                               {
                                                   me.dispatchEvent( new ModuleEvent( "StreamCancelled",
                                                                                      {
                                                                                          reason: asString( pReason ),
                                                                                          source: this,
                                                                                          collection: me
                                                                                      } ) );
                                               }
                                           }
                                       } );
        }

        /**
         * Provides a platform-specific stream implementation based on the execution environment.
         *
         * This method checks the current environment to determine whether Node.js streams
         * or Web streams are supported and returns the appropriate stream object.
         *
         * @return {Object} A Node.js stream if running in a Node.js environment, a Web ReadableStream
         *                  if running in a web environment, or throws an error if neither is supported.
         *
         * @throws {Error} If the execution environment does not support either Node.js streams or Web streams.
         */
        stream()
        {
            if ( _ud !== typeof process && process.versions && process.versions.node )
            {
                return this._getNodeStream();
            }
            else if ( _ud !== typeof ReadableStream )
            {
                return this._getWebStream();
            }
            else
            {
                throw new Error( "This execution environment does not support streams" );
            }
        }

        /**
         * Emits an event for which an event handler may or may not be listening.
         *
         * @param {Event} pEvt - The event object to be dispatched.
         * @return {boolean} Returns true if the event is not canceled; otherwise, false.
         */
        dispatchEvent( pEvt )
        {
            if ( this.#eventsEnabled )
            {
                this.#eventTarget.dispatchEvent( pEvt );
            }
        }

        /**
         * Adds an event listener to this collection for the specified event type.
         *
         * @param {string} pEventType - The type of the event to listen for (e.g., 'ItemAdded', 'ItemRemoved').
         * @param {Function} pHandler - The callback function to be executed when the event occurs.
         * @param {Object|boolean} [pOptions] - An optional parameter specifying characteristics about the event listener.
         * @return {void} This method does not return a value.
         */
        addEventListener( pEventType, pHandler, pOptions )
        {
            this.#eventTarget.addEventListener( pEventType, pHandler, pOptions );
        }

        /**
         * Removes an event listener from this collection for the specified event.
         *
         * @param {string} pEventType - The type of the event to stop listening for (e.g., 'ItemAdded', 'ItemRemoved').
         * @param {Function} pHandler - The function to be removed from the event's listener list.
         * @param {Object|boolean} [pOptions] - Optional options object or boolean specifying characteristics such as capturing.
         * @return {void} This method does not return a value.
         */
        removeEventListener( pEventType, pHandler, pOptions )
        {
            this.#eventTarget.removeEventListener( pEventType, pHandler, pOptions );
        }
    }

    Collection.EVENTS =
        {
            ERROR: "error",
            ITEM_ADDED: "ItemAdded",
            MULTIPLE_ITEMS_ADDED: "ItemsAdded",
            CLEARED: "Cleared",
            ITEM_REMOVED: "ItemRemoved",
            MULTIPLE_ITEMS_REMOVED: "ItemsRemoved",
            MULTIPLE_ITEMS_RETAINED: "ItemsRetained",
            YIELDED_VALUE: "YieldedValue",
            STREAM_CANCELLED: "StreamCancelled"
        };

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
                    Collection
                },
            TYPES,
            Collection
        };

    mod = toolBocksModule.extend( mod );

    return mod.expose( mod, INTERNAL_NAME, (_ud !== typeof module ? module : mod) ) || mod;

}());
