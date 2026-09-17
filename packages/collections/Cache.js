(function exposeModule()
{
    const MIN_CACHE_CAPACITY = 8;
    const DEFAULT_CACHE_CAPACITY = 4_096;
    const MAX_CACHE_CAPACITY = 32_767;

    const HASH_ALGORITHM = "sha256";

    const core = require( "@toolbocks/core" );

    const datesModule = require( "@toolbocks/dates" );

    const jsonUtils = require( "@toolbocks/json" );

    const { moduleUtils, constants, typeUtils, stringUtils, arrayUtils, guidUtils } = core;

    const
        {
            ObjectEntry,
            Visitor,
            __Error,
            readProperty,
            dereference,
            attempt,
            attemptSilent,
            no_op,
            lock,
            deepLock,
            $ln
        } = moduleUtils;

    const { _ud = "undefined", _mt, $scope, _num, _big } = constants;

    const
        {
            isNull,
            isObject,
            isNonNullObject,
            isNonNullValue,
            isFunction,
            isIterable,
            isMap,
            isWeakMap,
            isBool,
            isNumber,
            isBigInt,
            getClass,
            getClassName,
            clamp = moduleUtils.clamp,
            toObjectLiteral,
        } = typeUtils;

    const { asString, asInt, asFloat, toBool, isJsonObject, isSymbol } = stringUtils;

    const { asArray } = arrayUtils;

    const { ONE_MINUTE, ONE_HOUR, ONE_WEEK } = datesModule;

    const { asObject, asJson } = jsonUtils;

    // defines a key we can use to store this module in global scope
    const INTERNAL_NAME = "__BOCK_CACHE_UTILS__";

    // if we've already executed this code, just return the module
    if ( $scope() && (null != $scope()[INTERNAL_NAME]) )
    {
        return $scope()[INTERNAL_NAME];
    }

    const MIN_CACHE_EXPIRATION = ONE_MINUTE;
    const MAX_CACHE_EXPIRATION = (ONE_WEEK * 4);


    class CacheException extends __Error
    {
        constructor( pMsgOrErr, pOptions = {}, ...pArgs )
        {
            super( pMsgOrErr, pOptions, ...pArgs );
        }
    }

    const MISSING_VALUE = lock( {} );

    class CacheKey
    {
        #key;
        #hash;

        constructor( pKey )
        {
            this.#key = isNonNullObject( pKey ) && pKey instanceof this.constructor ? pKey.key : asString( isNull( pKey ) ? Date.now() : pKey );
            this.#hash = isNonNullObject( pKey ) && pKey instanceof this.constructor ? pKey.hash || guidUtils.hashSync( this.#key, "sha256" ) : guidUtils.hashSync( asString( this.#key ), "sha256" );
        }

        get key()
        {
            return asString( this.#key );
        }

        get hash()
        {
            return asString( this.#hash || guidUtils.hashSync( this.key, HASH_ALGORITHM ) );
        }

        toLiteral()
        {
            return { key: this.key, hash: this.hash || guidUtils.hashSync( this.key, HASH_ALGORITHM ) };
        }

        toJSON()
        {
            const literal = this.toLiteral();
            return attempt( () => asJson( literal ) ) || attempt( () => JSON.stringify( literal ) ) || attempt( () => asJson( this ) );
        }

        toString()
        {
            return `${asString( this.key )}::${this.hash}}`;
        }

        [Symbol.toPrimitive]()
        {
            return this.toString();
        }

        [Symbol.toStringTag]()
        {
            const s = this.toString();
            return `[object ${getClassName( this )}::${s}]`;
        }

        equals( pOther )
        {
            if ( isNull( pOther ) )
            {
                return false;
            }

            const other = isObject( pOther ) || isJsonObject( pOther ) ? asObject( pOther ?? createKey( pOther ) ) ?? createKey( pOther ) : createKey( pOther );

            return other === this || (other.key === this.key && other.hash === this.hash) || asString( other, true ) === asString( this, true );
        }
    }

    const createKey = function( pKey )
    {
        if ( isNull( pKey ) )
        {
            throw new CacheException( `Invalid Key, ${pKey}` );
        }

        if ( isNonNullObject( pKey ) )
        {
            const key = dereference( pKey );
            if ( !isNull( key ) )
            {
                if ( key instanceof CacheKey || pKey instanceof CacheKey )
                {
                    return lock( key ?? pKey );
                }
                return new CacheKey( asString( key ) );
            }
        }

        return new CacheKey( pKey );
    };

    class CacheEntry
    {
        #key;
        #value;

        constructor( pValue, pKey = (pValue?.cacheKey ?? pValue?.id) )
        {
            this.#value = isNull( pValue ) ? MISSING_VALUE : isNonNullObject( pValue ) ? lock( pValue ) : pValue;
            this.#key = createKey( pKey ?? ((isNonNullObject( pValue )) ? (pValue?.cacheKey ?? pValue?.id) : pValue) );
        }

        get value()
        {
            if ( !(isNull( this.#value ) || (MISSING_VALUE === this.#value)) )
            {
                return this.#value;
            }
            return null;
        }

        get key()
        {
            return this.#key;
        }

        [Symbol.toPrimitive]()
        {
            const val = this.value;

            if ( isNonNullObject( val ) )
            {
                if ( isFunction( val.valueOf ) )
                {
                    return val.valueOf();
                }
                else
                {
                    return attempt( () => asJson( toObjectLiteral( val ) ) ) ?? asString( val );
                }
            }
            else if ( [_num, _big].includes( typeof val ) )
            {
                if ( isBigInt( val ) )
                {
                    const s = asString( val ).replace( /n$/, _mt );
                    const n = attempt( () => asInt( s ) );
                    if ( isNumber( n ) && !isNaN( n ) && isFinite( n ) )
                    {
                        return n;
                    }
                    return s;
                }
                return asFloat( val );
            }
            else if ( isBool( val ) )
            {
                return toBool( val );
            }
            else if ( isSymbol( val ) )
            {
                return String( val );
            }

            return asString( val, true );
        }

        [Symbol.toStringTag]()
        {
            return `[object ${getClassName( this )}::${this.key}=${this.value}]`;
        }
    }

    class ExpiringCacheEntry extends CacheEntry
    {
        #cachedDate = Date.now();
        #expirationDate = asInt( Date.now() + ONE_HOUR );

        constructor( pValue, pKey, pTimeToLive = ONE_HOUR )
        {
            super( pValue, pKey );
            this.#cachedDate = Date.now();
            this.#expirationDate = isNull( pValue ) ? this.#cachedDate : asInt( asInt( this.#cachedDate ) + clamp( asInt( pTimeToLive ?? ONE_HOUR, ONE_HOUR ), MIN_CACHE_EXPIRATION, MAX_CACHE_EXPIRATION ) );
        }

        get value()
        {
            if ( !this.isExpired() )
            {
                return super.value;
            }
        }

        // noinspection JSUnusedGlobalSymbols
        get cachedDate()
        {
            return new Date( this.#cachedDate );
        }

        get expirationDate()
        {
            return new Date( this.#expirationDate );
        }

        isExpired()
        {
            return (asInt( Date.now() ) >= asInt( this.#expirationDate ));
        }

        [Symbol.toStringTag]()
        {
            return `[object ${getClassName( this )}::${this.key}=${this.value}:: expires: ${this.expirationDate}]`;
        }
    }

    class BaseCache
    {
        #useWeakRef = false;
        #useWeakMap = false;

        #map;

        constructor( pUseWeakRef = false, pUseWeakMap = false, pMaxSize = -1 )
        {
            this.#useWeakRef = toBool( pUseWeakRef );
            this.#useWeakMap = toBool( pUseWeakMap );

            this.#map = this._resolveMap( pMaxSize );
        }

        get useWeakRef()
        {
            return toBool( this.#useWeakRef );
        }

        get useWeakMap()
        {
            return toBool( this.#useWeakMap );
        }

        _resolveMap( pMaxSize = -1 )
        {
            if ( isNull( this.#map ) )
            {
                if ( this.useWeakMap )
                {
                    return new WeakMap();
                }
                return new Map();
            }
            return this.#map ?? (this.useWeakMap ? new WeakMap : new Map());
        }

        _createKey( pKey )
        {
            return createKey( pKey );
        }

        _createCacheEntry( pKey, pValue )
        {
            return new CacheEntry( pValue, pKey );
        }

        // noinspection JSUnusedLocalSymbols
        async init( ...pArgs )
        {
            // no op

            return this;
        }

        // noinspection JSUnusedGlobalSymbols,JSUnusedLocalSymbols
        async dispose( ...pArgs )
        {
            this.clear();

            return this;
        }

        cacheValue( pKey, pValue )
        {
            let key = pKey ?? ((isNonNullObject( pValue )) ? (pValue?.cacheKey ?? pValue?.id) : pValue);

            if ( isNull( key ) )
            {
                throw new CacheException( `Invalid Key, ${pKey}` );
            }

            if ( this.useWeakMap )
            {
                key = this._createKey( key );
            }

            let value = pValue;

            if ( this.useWeakRef && isNonNullObject( value ) )
            {
                value = dereference( value ) ?? this.get( key );
                value = new WeakRef( value );
            }

            if ( !isNull( value ) )
            {
                this.#map.set( key, this._createCacheEntry( key, value ) );
            }
        }

        put( pKey, pValue )
        {
            this.cacheValue( pKey, pValue );
        }

        set( pKey, pValue )
        {
            this.cacheValue( pKey, pValue );
        }

        get( pKey )
        {
            const key = this._createKey( pKey );

            const cachedValue = this.#map.get( key );

            if ( isNonNullObject( cachedValue ) )
            {
                if ( cachedValue instanceof ExpiringCacheEntry )
                {
                    if ( !cachedValue.isExpired() )
                    {
                        return dereference( cachedValue.value );
                    }
                    return null;
                }
                else
                {
                    return cachedValue.value ?? cachedValue;
                }
            }

            return cachedValue;
        }

        delete( pKey )
        {
            const key = this._createKey( pKey );
            return this.#map.delete( key ) || this.#map.delete( pKey );
        }

        get size()
        {
            return isMap( this.#map ) ? this.#map.size : $ln( this.#map ?? {} );
        }

        isEmpty()
        {
            return this.size <= 0;
        }

        clear()
        {
            return isFunction( this.#map.clear ) ? this.#map.clear() : attempt( () => this._clearWeakMap() );
        }

        _clearWeakMap()
        {
            if ( isNull( this.#map ) || isWeakMap( this.#map ) )
            {
                this.#map = isNonNullObject( this.#map ) ? attempt( () => (new (getClass( this.#map ))()) ) ?? new WeakMap() : new WeakMap();
                return this.#map;
            }
            else if ( isMap( this.#map ) || isFunction( this.#map.clear ) )
            {
                this.#map.clear();
                return this.#map;
            }

            this.#map = isNonNullObject( this.#map ) ? attempt( () => (new (getClass( this.#map ))()) ) ?? new WeakMap() : new WeakMap();
        }

        /**
         *  Returns an iterator of the 'live' entries held in the cache.
         *
         *  We are overriding the superclass method with a generator function
         *  to avoid loading all entries into memory
         *  and to facilitate skipping over 'dead' entries.
         */
        * entries()
        {
            if ( this.useWeakMap )
            {
                // TODO
                return [].entries();
            }
            else
            {
                // We use super.entries() to get the raw Map iterator
                for( const [key, val] of this.#map.entries() )
                {
                    // dereference the value (in case we are configured to use WeakRef)
                    let value = isNonNullObject( val ) ? dereference( val ) : val;

                    // If it's a WeakRef that has been garbage collected, we ignore and move on
                    if ( this.useWeakRef && isNull( value ) )
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
        }

        /**
         * @inheritDoc
         */
        [Symbol.iterator]()
        {
            return this.entries();
        }

        /**
         * Returns an iterator of the valid entries in this cache
         * @returns {Generator<[K, V][0], void, *>}
         */
        * keys()
        {
            for( const [key, val] of this.entries() )
            {
                if ( this.useWeakRef && isNull( dereference( val ) ) )
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
            for( let [key, val] of this.entries() )
            {
                // dereference the value (in case we are configured to use WeakRef)
                const v = dereference( (val ?? this.get( key )) ) || this.get( key );

                const value = isNonNullObject( v ) ? dereference( v ) : v;

                // If it's a WeakRef that has been garbage collected, we ignore and move on
                if ( isNull( value ) )
                {
                    continue;
                }

                // yield the value (always ensuring that it is immutable)
                yield lock( value );
            }
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
                }.bind( pThis ?? me );
            }

            for( let entry of this.entries() )
            {
                cb( entry );
            }
        }

        asMap()
        {
            return new Map( this.entries() );
        }
    }

    class __BoundedCache extends Map
    {
        #limit = DEFAULT_CACHE_CAPACITY;
        #useWeakRef = false;

        /**
         * Creates a new BoundedCache, which is an extension of Map
         * that will evict older entries to avoid growing beyond the configured limit.
         *
         * @param {number} pLimit - the greatest number of entries this cache will hold
         *
         * @param {boolean} pUseWeakRef - Set this to true to store objects in this cache wrapped in WeakRef
         *                                This allows the objects to be garbage collected if no other scope
         *                                holds a string reference to the object.
         * @param pInitialEntries
         */
        constructor( pLimit = DEFAULT_CACHE_CAPACITY, pUseWeakRef = false, pInitialEntries = null )
        {
            super();

            /**
             * The bounds must be >= 10 and <= 10,000
             */
            this.#limit = clamp( asInt( pLimit, DEFAULT_CACHE_CAPACITY ), MIN_CACHE_CAPACITY, MAX_CACHE_CAPACITY );

            /**
             * Allows objects held in this cache to be garbage collected
             * @type {boolean}
             */
            this.#useWeakRef = !!(pUseWeakRef);

            if ( !isNull( pInitialEntries ) && isIterable( pInitialEntries ) )
            {
                attempt( () => this.addAll( pInitialEntries, false ) );
            }
        }

        get useWeakRef()
        {
            return this.#useWeakRef;
        }

        // noinspection JSUnusedGlobalSymbols
        get useWeakMap()
        {
            return false;
        }

        resolveKey( pKey )
        {
            return createKey( pKey );
        }

        isSupportedKey( pKey )
        {
            const key = this.resolveKey( pKey );
            return (isNonNullObject( key ));
        }

        /**
         * Returns the upper bound limit of the size of this cache
         * @returns {number}
         */
        get limit()
        {
            return clamp( asInt( this.#limit, DEFAULT_CACHE_CAPACITY ), MIN_CACHE_CAPACITY, MAX_CACHE_CAPACITY );
        }

        get maxSize()
        {
            return this.limit;
        }

        isEmpty()
        {
            return asInt( this.size ) <= 0;
        }

        /**
         * @inheritDoc
         */
        clear()
        {
            super.clear();
        }

        /**
         * @inheritDoc
         */
        delete( pKey )
        {
            const key = this.resolveKey( pKey );
            return super.delete( key );
        }

        // noinspection JSUnusedLocalSymbols
        async init( ...pArgs )
        {
            // no op

            return this;
        }

        // noinspection JSUnusedGlobalSymbols,JSUnusedLocalSymbols
        async dispose( ...pArgs )
        {
            this.clear();

            return this;
        }

        /**
         * @inheritDoc
         */
        get( pKey )
        {
            const key = this.resolveKey( pKey );

            /*
             * Keys have to be Objects
             */
            if ( !this.isSupportedKey( key ) )
            {
                return null;
            }

            const v = super.get( key );

            if ( !isNull( v ) )
            {
                let obj = dereference( v );

                if ( isNonNullValue( obj ) )
                {
                    return isNonNullObject( obj ) ? lock( obj ) : obj;
                }

                // if the key holds a 'dead' ref or null value, remove it
                this.delete( key );
            }

            return null;
        }

        /**
         * Returns true if this cache contains an object (that has not been garbage collected)
         * associated with the specified key
         *
         * @param {String} pKey the string value with which an object in this cache may be associated
         * @returns {boolean} true if this cache contains an object (that has not been garbage collected) associated with the specified key
         */
        has( pKey )
        {
            // objects are stored using string or integer keys
            const key = this.resolveKey( pKey );

            if ( !this.isSupportedKey( key ) )
            {
                return false;
            }

            /*
             * If we don't have anything, even an empty WeakRef,
             * we return false
             */
            if ( !(super.has( key )) )
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
                // we know that super.has returned true, otherwise we would already have returned false
                return true;
            }

            /*
             * If we reach this statement,
             * we are storing WeakRef objects,
             * so we have to retrieve the value,
             * dereference it
             * and return true if the dereferenced value is not undefined (or null)
             */
            const ref = super.get( key );
            if ( !isNull( ref ) && isNonNullObject( dereference( ref ) ) )
            {
                return true;
            }

            /*
             * if we found a WeakRef whose object has been garbage-collected,
             * we remove the entry
             *
             * we do this here and in other accessors and mutators
             * as a 'lazily' healing technique
             */
            attempt( () => this.delete( key ) );

            return false;
        }

        /**
         * Adds a new entry to the cache.
         * If the entry already exists,
         * the entry is moved to the end of the collection,
         * so it is less likely to be a candidate for removal
         * if the cache reaches capacity (exceeds the limit specified when the cache was constructed)
         *
         * @param {string} pKey the key with which the cached object can be retrieved
         * @param {Object} pValue the object to store in the cache associated with the specified key
         */
        set( pKey, pValue )
        {
            // keys must be strings or integers
            let key = this.resolveKey( pKey );

            if ( !this.isSupportedKey( key ) )
            {
                return;
            }

            let value = pValue ?? this.get( key );

            // by deleting the entry and then re-setting it,
            // we move a potentially existing entry to the end of the collection,
            // so we will not remove it prematurely
            attempt( () => this.delete( key ) );

            // we do not support storing null
            if ( isNonNullValue( value ) )
            {
                // if the object passed in is a WeakRef,
                // we dereference it first,
                value = isNonNullObject( value ) ? dereference( value ) : value;

                // then we freeze (lock) the object
                // cached objects must be immutable
                if ( isNonNullValue( value ) )
                {
                    value = isNonNullObject( value ) ? deepLock( value ) : value;

                    // if this cache is configured to hold WeakRefs,
                    // we wrap the value in a new WeakRef
                    value = (isNonNullObject( value ) && this.#useWeakRef) ? new WeakRef( value ) : value;

                    // if this cache is at capacity
                    if ( this.size >= this.limit )
                    {
                        // we delete the oldest 'living' entry
                        // (which we assume to be identified by the first entry in the iterator)
                        const oldestKey = this.keys().next()?.value;

                        if ( !(isNull( oldestKey ) || this.isSupportedKey( oldestKey )) )
                        {
                            attempt( () => this.delete( oldestKey ) );
                        }
                        else
                        {
                            // if our size >= our limit, but our iterator is empty,
                            // that means ALL of our entries are 'dead'
                            // (WeakRef wrappers whose payload has been garbage collected),
                            // so we call clear() to recover
                            super.clear();
                        }
                    }

                    // add the entry
                    super.set( key, lock( value ) );
                }
            }
        }

        /**
         *  Returns an iterator of the 'live' entries held in the cache.
         *
         *  We are overriding the superclass method with a generator function
         *  to avoid loading all entries into memory
         *  and to facilitate skipping over 'dead' entries.
         */
        * entries()
        {
            // We use super.entries() to get the raw Map iterator
            for( const [key, val] of super.entries() )
            {
                // dereference the value (in case we are configured to use WeakRef)
                let value = isNonNullObject( val ) ? dereference( val ) : val;

                // If it's a WeakRef that has been garbage collected, we ignore and move on
                if ( this.useWeakRef && isNull( value ) )
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
                }.bind( pThis ?? me );
            }

            for( let entry of this.entries() )
            {
                cb( entry );
            }
        }

        /**
         * Returns an iterator of the valid entries in this cache
         * @returns {Generator<[K, V][0], void, *>}
         */
        * keys()
        {
            for( const [key, val] of super.entries() )
            {
                if ( this.useWeakRef && isNull( dereference( val ) ) )
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
            for( let val of super.values() )
            {
                // dereference the value (in case we are configured to use WeakRef)
                let value = isNonNullObject( val ) ? dereference( val ) : val;

                // If it's a WeakRef that has been garbage collected, we ignore and move on
                if ( isNull( value ) )
                {
                    continue;
                }

                // yield the value (always ensuring that it is immutable)
                yield lock( value );
            }
        }

        clone()
        {
            return new __BoundedCache( this.limit, this.useWeakRef, new Map( this.entries() ).entries() );
        }
    }

    class __BoundedWeakCache extends WeakMap
    {
        #limit = DEFAULT_CACHE_CAPACITY;
        #useWeakRef = false;

        #keys = [];

        /**
         * Creates a new BoundedCache, which is an extension of WeakMap
         * that will evict older entries to avoid growing beyond the configured limit.
         *
         * @param {number} pLimit - the greatest number of entries this cache will hold
         *
         * @param {boolean} pUseWeakRef - Set this to true to store objects in this cache wrapped in WeakRef
         *                                This allows the objects to be garbage collected if no other scope
         *                                holds a string reference to the object.
         */
        constructor( pLimit = DEFAULT_CACHE_CAPACITY, pUseWeakRef = false )
        {
            super();

            /**
             * The bounds must be >= 10 and <= 10,000
             */
            this.#limit = clamp( asInt( pLimit, DEFAULT_CACHE_CAPACITY ), MIN_CACHE_CAPACITY, MAX_CACHE_CAPACITY );

            /**
             * Allows objects held in this cache to be garbage collected
             * @type {boolean}
             */
            this.#useWeakRef = !!(pUseWeakRef);
        }

        get useWeakRef()
        {
            return this.#useWeakRef;
        }

        // noinspection JSUnusedGlobalSymbols
        get useWeakMap()
        {
            return true;
        }

        resolveKey( pKey )
        {
            return createKey( pKey );
        }

        isSupportedKey( pKey )
        {
            const key = this.resolveKey( pKey );
            return (isNonNullObject( key ));
        }

        /**
         * Returns the upper bound limit of the size of this cache
         * @returns {number}
         */
        get limit()
        {
            return clamp( asInt( this.#limit, DEFAULT_CACHE_CAPACITY ), MIN_CACHE_CAPACITY, MAX_CACHE_CAPACITY );
        }

        get maxSize()
        {
            return this.limit;
        }

        get size()
        {
            return asInt( $ln( this.#keys ) );
        }

        isEmpty()
        {
            return asInt( $ln( this.#keys ) ) <= 0;
        }

        /**
         * @inheritDoc
         */
        clear()
        {
            let keys = [...(asArray( this.#keys ))];

            for( let i = 0, n = $ln( keys ); i < n; i++ )
            {
                const key = keys[i];

                attempt( () => super.delete( key ) );

                this.#keys[i] = null;
            }

            this.#keys = asArray( this.#keys ?? [] ).filter( e => !isNull( e ) );
        }

        delete( pKey )
        {
            const key = this.resolveKey( pKey );

            const existingKey = this.#keys.find( e => e === key || e.equals( key ) );

            const result = super.delete( key );

            if ( existingKey )
            {
                const index = this.#keys.findIndex( e => e.equals( existingKey ) || (e === key || e.equals( key )) );
                if ( index >= 0 )
                {
                    this.#keys.splice( index, 1 );
                }
            }

            return result;
        }

        // noinspection JSUnusedLocalSymbols
        async init( ...pArgs )
        {
            // no op

            return this;
        }

        // noinspection JSUnusedGlobalSymbols,JSUnusedLocalSymbols
        async dispose( ...pArgs )
        {
            this.clear();

            return this;
        }

        /**
         * @inheritDoc
         */
        get( pKey )
        {
            const key = this.resolveKey( pKey );

            /*
             * Keys have to be Objects
             */
            if ( !this.isSupportedKey( key ) )
            {
                return null;
            }

            const v = super.get( key );

            if ( !isNull( v ) )
            {
                let obj = dereference( v );

                if ( isNonNullValue( obj ) )
                {
                    return isNonNullObject( obj ) ? lock( obj ) : obj;
                }

                // if the key holds a 'dead' ref or null value, remove it
                this.delete( key );
            }

            return null;
        }

        /**
         * Returns true if this cache contains an object (that has not been garbage collected)
         * associated with the specified key
         *
         * @param {String} pKey the string value with which an object in this cache may be associated
         * @returns {boolean} true if this cache contains an object (that has not been garbage collected) associated with the specified key
         */
        has( pKey )
        {
            // objects are stored using string or integer keys
            const key = this.resolveKey( pKey );

            if ( !this.isSupportedKey( key ) )
            {
                return false;
            }

            /*
             * If we don't have anything, even an empty WeakRef,
             * we return false
             */
            if ( !(super.has( key )) )
            {
                return false;
            }

            /*
             * If we have an entry for the specified key,
             * (which we can assume by reaching this statement),
             * and we are not storing WeakRef objects,
             * we return true
             */
            if ( !this.useWeakRef )
            {
                // we know that super.has returned true, otherwise we would already have returned false
                return true;
            }

            /*
             * If we reach this statement,
             * we are storing WeakRef objects,
             * so we have to retrieve the value,
             * dereference it
             * and return true if the dereferenced value is not undefined (or null)
             */
            const ref = super.get( key );
            if ( !isNull( ref ) && isNonNullObject( dereference( ref ) ) )
            {
                return true;
            }

            /*
             * if we found a WeakRef whose object has been garbage-collected,
             * we remove the entry
             *
             * we do this here and in other accessors and mutators
             * as a 'lazily' healing technique
             */
            attempt( () => this.delete( key ) );

            return false;
        }

        /**
         * Adds a new entry to the cache.
         * If the entry already exists,
         * the entry is moved to the end of the collection,
         * so it is less likely to be a candidate for removal
         * if the cache reaches capacity (exceeds the limit specified when the cache was constructed)
         *
         * @param {string} pKey the key with which the cached object can be retrieved
         * @param {Object} pValue the object to store in the cache associated with the specified key
         */
        set( pKey, pValue )
        {
            // keys must be strings or integers
            let key = this.resolveKey( pKey );

            if ( !this.isSupportedKey( key ) )
            {
                return;
            }

            let value = pValue ?? this.get( key );

            // by deleting the entry and then re-setting it,
            // we move a potentially existing entry to the end of the collection,
            // so we will not remove it prematurely
            attempt( () => this.delete( key ) );

            // we do not support storing null
            if ( isNonNullValue( value ) )
            {
                // if the object passed in is a WeakRef,
                // we dereference it first,
                value = isNonNullObject( value ) ? dereference( value ) : value;

                // then we freeze (lock) the object
                // cached objects must be immutable
                if ( isNonNullValue( value ) )
                {
                    value = isNonNullObject( value ) ? deepLock( value ) : value;

                    // if this cache is configured to hold WeakRefs,
                    // we wrap the value in a new WeakRef
                    value = (isNonNullObject( value ) && this.#useWeakRef) ? new WeakRef( value ) : value;

                    // if this cache is at capacity
                    if ( this.size >= this.limit )
                    {
                        // we delete the oldest 'living' entry
                        // (which we assume to be identified by the first entry in the iterator)
                        const oldestKey = this.keys().next()?.value;

                        if ( !(isNull( oldestKey ) || this.isSupportedKey( oldestKey )) )
                        {
                            attempt( () => this.delete( oldestKey ) );
                        }
                        else
                        {
                            // if our size >= our limit, but our iterator is empty,
                            // that means ALL of our entries are 'dead'
                            // (WeakRef wrappers whose payload has been garbage collected),
                            // so we call clear() to recover
                            this.clear();
                        }
                    }

                    // add the entry
                    super.set( key, lock( value ) );

                    this.#keys.push( key );
                }
            }
        }

        /**
         *  Returns an iterator of the 'live' entries held in the cache.
         *
         *  We are overriding the superclass method with a generator function
         *  to avoid loading all entries into memory
         *  and to facilitate skipping over 'dead' entries.
         */
        * entries()
        {
            const keys = [...(asArray( this.#keys ?? [] ))];

            // We use super.entries() to get the raw Map iterator
            for( const key of keys )
            {
                const val = this.get( key );

                // dereference the value (in case we are configured to use WeakRef)
                const value = isNonNullObject( val ) ? dereference( val ) : val;

                // If it's a WeakRef that has been garbage collected, we ignore and move on
                if ( this.useWeakRef && isNull( value ) )
                {
                    this.delete( key );
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
                }.bind( pThis ?? me );
            }

            for( let entry of this.entries() )
            {
                cb( entry );
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
                if ( this.useWeakRef && isNull( dereference( val ) ) )
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
            for( const [key, val] of this.entries() )
            {
                // dereference the value (in case we are configured to use WeakRef)
                let value = isNonNullObject( (val ?? this.get( key )) ) ? dereference( (val ?? this.get( key )) ) : (val ?? this.get( key ));

                // If it's a WeakRef that has been garbage collected, we ignore and move on
                if ( isNull( value ) )
                {
                    continue;
                }

                // yield the value (always ensuring that it is immutable)
                yield lock( value );
            }
        }
    }

    class BoundedCache extends BaseCache
    {
        #maxSize = DEFAULT_CACHE_CAPACITY;

        constructor( pMaxSize = DEFAULT_CACHE_CAPACITY, pUseWeakRef = false, pUseWeakMap = false )
        {
            super( pUseWeakRef, pUseWeakMap, pMaxSize || DEFAULT_CACHE_CAPACITY );
            this.#maxSize = clamp( asInt( pMaxSize ) || DEFAULT_CACHE_CAPACITY, MIN_CACHE_CAPACITY, MAX_CACHE_CAPACITY );
        }

        get maxSize()
        {
            return asInt( this.#maxSize );
        }

        get limit()
        {
            return this.maxSize;
        }

        _resolveMap( pMaxSize = attemptSilent( () => readProperty( this, "max_size", "limit" ) ) )
        {
            const capacity = asInt( pMaxSize || attemptSilent( () => readProperty( this, "max_size", "limit" ) ) || this.maxSize );

            const withWeakRef = toBool( this.useWeakRef ?? attemptSilent( () => readProperty( this, "use_weak_ref", "useWeakRef" ) ) );
            const withWeakMap = toBool( this.useWeakMap ?? attemptSilent( () => readProperty( this, "use_weak_map", "useWeakMap" ) ) );

            if ( withWeakMap )
            {
                return new __BoundedWeakCache( capacity, withWeakRef );
            }
            return new __BoundedCache( capacity, withWeakRef );
        }

        get useWeakRef()
        {
            return super.useWeakRef;
        }

        get useWeakMap()
        {
            return super.useWeakMap;
        }

        _createKey( pKey )
        {
            return super._createKey( pKey );
        }

        _createCacheEntry( pKey, pValue )
        {
            return super._createCacheEntry( pKey, pValue );
        }

        cacheValue( pKey, pValue )
        {
            super.cacheValue( pKey, pValue );
        }

        put( pKey, pValue )
        {
            super.put( pKey, pValue );
        }

        set( pKey, pValue )
        {
            super.set( pKey, pValue );
        }

        get( pKey )
        {
            return super.get( pKey );
        }

        delete( pKey )
        {
            return super.delete( pKey );
        }

        get size()
        {
            return super.size;
        }

        isEmpty()
        {
            return super.isEmpty();
        }

        clear()
        {
            return super.clear();
        }
    }

    class ExpiringCache extends BoundedCache
    {
        #ttl = ONE_HOUR;

        constructor( pMaxSize = DEFAULT_CACHE_CAPACITY, pTimeToLive = ONE_HOUR, pUseWeakRef = false, pUseWeakMap = false )
        {
            super( asInt( pMaxSize || DEFAULT_CACHE_CAPACITY ), pUseWeakRef, pUseWeakMap );
            this.#ttl = clamp( asInt( pTimeToLive ), MIN_CACHE_EXPIRATION, MAX_CACHE_EXPIRATION );
        }

        get ttl()
        {
            return clamp( asInt( this.#ttl ), MIN_CACHE_EXPIRATION, MAX_CACHE_EXPIRATION );
        }

        _createCacheEntry( pKey, pValue )
        {
            return new ExpiringCacheEntry( pValue, pKey, this.ttl );
        }

        get( pKey )
        {
            let value = super.get( pKey );

            if ( isNonNullObject( value ) )
            {
                value = dereference( value );

                if ( value instanceof ExpiringCacheEntry || isFunction( value.isExpired ) )
                {
                    if ( value.isExpired() || value.expired )
                    {
                        super.delete( pKey );
                        return null;
                    }
                }

                if ( value instanceof CacheEntry )
                {
                    return dereference( value.value ?? value ) ?? value;
                }
            }

            return value;
        }
    }

    const mod =
        {
            dependencies:
                {
                    core,
                    moduleUtils,
                    datesModule,
                    jsonUtils
                },
            classes:
                {
                    CacheException,
                    CacheKey,
                    CacheEntry,
                    ExpiringCacheEntry,
                    BaseCache,
                    __BoundedCache,
                    __BoundedWeakCache,
                    BoundedCache,
                    ExpiringCache
                },
            BoundedCache,
            ExpiringCache,
            createKey
        };

    if ( _ud !== typeof module )
    {
        module.exports = lock( mod );
    }

    return lock( mod );

}());
