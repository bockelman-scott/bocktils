(function exposeModule()
{
    const MIN_CACHE_CAPACITY = 8;
    const DEFAULT_CACHE_CAPACITY = 4_096;
    const MAX_CACHE_CAPACITY = 32_767;

    const core = require( "@toolbocks/core" );

    const datesModule = require( "@toolbocks/dates" );

    const jsonUtils = require( "@toolbocks/json" );

    const logUtils = require( "@toolbocks/logging" );

    const { moduleUtils, constants, typeUtils, stringUtils, arrayUtils } = core;

    const
        {
            ToolBocksModule,
            ObjectEntry,
            Visitor,
            __Error,
            konsole,
            objectKeys,
            readProperty,
            dereference,
            attempt,
            attemptSilent,
            no_op,
            lock,
            $ln
        } = moduleUtils;

    const { _ud = "undefined", _mt, _str, _num, _big, _symbol, $scope } = constants;

    const
        {
            isNull,
            isNonNullObject,
            isNonNullValue,
            isFunction,
            isClass,
            isIterable,
            isMap,
            isBoolean,
            isBoolCompatible,
            isNumber,
            isBigInt,
            isString,
            isWeakRef,
            getClassName,
            clamp = moduleUtils.clamp,
            toObjectLiteral,
        } = typeUtils;

    const { asString, asInt, asFloat, toBool, isBlank, isJsonObject, isSymbol } = stringUtils;

    const { asArray } = arrayUtils;

    const { ONE_MINUTE, ONE_HOUR, ONE_WEEK } = datesModule;

    const { asObject, asJson } = jsonUtils;

    const { SimpleLogger, SourcedSimpleLogger } = logUtils;

    // defines a key we can use to store this module in global scope
    const INTERNAL_NAME = "__BOCK_CACHE_UTILS__";

    // if we've already executed this code, just return the module
    if ( $scope() && (null != $scope()[INTERNAL_NAME]) )
    {
        return $scope()[INTERNAL_NAME];
    }

    const DEFAULT_LOGGER = new SimpleLogger( konsole );
    const LOGGER = SourcedSimpleLogger.adapt( DEFAULT_LOGGER, "ToolBocks/Cache", {} );

    const MIN_CACHE_EXPIRATION = ONE_MINUTE;
    const MAX_CACHE_EXPIRATION = (ONE_WEEK * 4);

    const MISSING_VALUE = lock( {} );

    class CacheException extends __Error
    {
        constructor( pMsgOrErr, pOptions = {}, ...pArgs )
        {
            super( pMsgOrErr, pOptions, ...pArgs );
        }
    }

    const createKey = function( pKey )
    {
        if ( isNull( pKey ) )
        {
            throw new CacheException( `null as a cache key is not supported`, { detail: pKey }, pKey );
        }

        if ( (isString( pKey ) && !isBlank( pKey )) || [_num, _big, _symbol].includes( typeof pKey ) )
        {
            return (isNumber( pKey ) && asInt( pKey ) > 0) ? asInt( pKey ) : asString( pKey, true );
        }

        if ( isFunction( pKey ) )
        {
            if ( isClass( pKey ) )
            {
                return createKey( getClassName( pKey ) );
            }

            let key = attempt( () => pKey.call( pKey, pKey ) );
            return createKey( key ?? pKey?.name );
        }

        if ( isNonNullObject( pKey ) )
        {
            let key = dereference( pKey );
            if ( key instanceof CacheEntry )
            {
                return createKey( key?.key ?? key?.cacheKey ?? key?.id );
            }

            if ( isFunction( key.valueOf ) )
            {
                key = asString( key.valueOf(), true );
            }

            return asString( key, true );
        }
    };

    class CacheEntry
    {
        #key;
        #value;

        constructor( pValue, pKey = (pValue?.cacheKey ?? pValue?.id) )
        {
            let key = createKey( pKey ?? (isNonNullObject( pValue ) ? (pValue?.cacheKey ?? pValue?.id ?? pValue?.key) : pValue) );

            const value = unwrapValue( isNull( pValue ) ? MISSING_VALUE : pValue );
            this.#value = new WeakRef( value );

            key = createKey( key ?? ((isNonNullObject( value )) ? (value?.cacheKey ?? value?.id ?? value?.key) : this.#value) );

            this.#key = asString( key, true );
        }

        get value()
        {
            if ( !(isNull( this.#value ) || (MISSING_VALUE === this.#value)) )
            {
                const value = unwrapValue( this.#value );
                if ( !(isNull( value ) || (MISSING_VALUE === value)) )
                {
                    return lock( dereference( value ) );
                }
            }
            return null;
        }

        get key()
        {
            return createKey( isNonNullObject( this.#key ) ? dereference( this.#key ) : this.#key );
        }

        [Symbol.toPrimitive]()
        {
            const val = this.value;

            if ( isNonNullObject( val ) )
            {
                let value = dereference( val );

                if ( isFunction( value.valueOf ) )
                {
                    return value.valueOf() || (isFunction( value.toString ) ? value.toString() : asString( value ?? val ));
                }
                else
                {
                    return attempt( () => asJson( toObjectLiteral( value ) ) ) ?? asString( value );
                }
            }
            else if ( [_num, _big].includes( typeof val ) )
            {
                if ( isBigInt( val ) )
                {
                    const s = asString( val, true ).replace( /n$/, _mt ).replaceAll( /\D/g, _mt );
                    const n = attemptSilent( () => asInt( s ) );
                    if ( isNumber( n ) && !isNaN( n ) && isFinite( n ) )
                    {
                        return n;
                    }
                    return s;
                }
                return asFloat( val );
            }
            else if ( isBoolean( val ) || isBoolCompatible( val ) )
            {
                return toBool( val );
            }
            else if ( isSymbol( val ) )
            {
                return String( val );
            }

            return val;
        }

        [Symbol.toStringTag]()
        {
            return `[object ${getClassName( this )}::${this.key}=${this.value}]`;
        }

        equals( pOther )
        {
            if ( isNull( pOther ) )
            {
                return false;
            }

            if ( pOther === this )
            {
                return true;
            }

            if ( isNonNullObject( pOther ) || isJsonObject( pOther ) )
            {
                const other = dereference( asObject( pOther ?? {} ) );
                const key = dereference( other.key ?? createKey( other?.cacheKey ?? other?.id ?? other?.key ?? other?.value?.key ?? other ) );
                return (other === this) || (key === this.key);
            }

            const otherKey = createKey( pOther );
            return (otherKey === this.key);
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
            this.#expirationDate = isNull( super.value ) ? this.#cachedDate : asInt( asInt( this.#cachedDate ) + clamp( asInt( pTimeToLive ?? ONE_HOUR, ONE_HOUR ), MIN_CACHE_EXPIRATION, MAX_CACHE_EXPIRATION ) );
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

        get expired()
        {
            return this.isExpired();
        }

        [Symbol.toStringTag]()
        {
            return `[object ${getClassName( this )}::${this.key}=${this.value}:: expires: ${this.expirationDate}]`;
        }
    }

    const unwrapValue = function( pValue )
    {
        let value = isNonNullObject( pValue ) || isJsonObject( pValue ) ? asObject( pValue ) : pValue;

        while ( isNonNullObject( value ) && isWeakRef( value ) )
        {
            value = dereference( value );

            while ( isNonNullObject( value ) && value instanceof CacheEntry )
            {
                if ( value instanceof ExpiringCacheEntry && value.expired )
                {
                    value = null;
                    break;
                }

                value = dereference( value.value );

                if ( isWeakRef( value ) )
                {
                    value = dereference( value );
                }
            }
        }

        while ( isNonNullObject( value ) && value instanceof CacheEntry )
        {
            if ( value instanceof ExpiringCacheEntry && value.expired )
            {
                value = null;
                break;
            }

            value = dereference( value.value );

            while ( isNonNullObject( value ) && isWeakRef( value ) )
            {
                value = dereference( value );

                if ( isNonNullObject( value ) && value instanceof CacheEntry )
                {
                    if ( value instanceof ExpiringCacheEntry && value.expired )
                    {
                        value = null;
                        break;
                    }

                    value = dereference( value.value );
                }
            }
        }

        return value;
    };

    CacheEntry.create = function( pValue, pKey, pTimeToLive = -1 )
    {
        let value = unwrapValue( pValue );
        let key = createKey( pKey ?? value?.cacheKey ?? value?.id );
        let ttl = clamp( asInt( pTimeToLive ), 0, MAX_CACHE_EXPIRATION );

        if ( ttl >= MIN_CACHE_EXPIRATION )
        {
            return new ExpiringCacheEntry( value, key, ttl );
        }

        return new CacheEntry( value, key );
    };

    ExpiringCacheEntry.create = CacheEntry.create;

    let NEXT_CACHE_ID = 0;

    const nextCacheId = ( pClass ) =>
    {
        const className = asString( getClassName( pClass ) );

        let id = ++NEXT_CACHE_ID;

        if ( id >= 10_000 )
        {
            NEXT_CACHE_ID = 0;
            id = ++NEXT_CACHE_ID;
        }

        return `${className}_${id}`;
    };

    class __BoundedCache extends Map
    {
        #limit = DEFAULT_CACHE_CAPACITY;

        #logger = LOGGER;

        /**
         * Creates a new BoundedCache, which is an extension of Map
         * that will evict older entries to avoid growing beyond the configured limit.
         *
         * @param {number} pLimit - the greatest number of entries this cache will hold
         *
         * @param {Iterable} [pInitialEntries]
         */
        constructor( pLimit = DEFAULT_CACHE_CAPACITY, pInitialEntries = null )
        {
            super();

            /**
             * The bounds must be >= 10 and <= 10,000
             */
            this.#limit = clamp( asInt( pLimit, DEFAULT_CACHE_CAPACITY ), MIN_CACHE_CAPACITY, MAX_CACHE_CAPACITY );

            this.#logger = SourcedSimpleLogger.adapt( DEFAULT_LOGGER, this );

            if ( !isNull( pInitialEntries ) && isIterable( pInitialEntries ) )
            {
                attempt( () => this.addAll( pInitialEntries, false ) );
            }
        }

        get logger()
        {
            return ToolBocksModule.resolveLogger( this.#logger, LOGGER, ToolBocksModule.getGlobalLogger(), konsole );
        }

        resolveKey( pKey )
        {
            return createKey( pKey );
        }

        isSupportedKey( pKey )
        {
            return !isNull( pKey ) && [_str, _num, _big, _symbol].includes( typeof pKey ) && !isBlank( asString( pKey, true ) );
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
            return super.delete( key ) || super.delete( pKey );
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

            if ( !this.isSupportedKey( key ) )
            {
                return null;
            }

            const v = super.get( key );

            if ( !isNull( v ) )
            {
                let obj = dereference( v );

                if ( isNonNullObject( obj ) )
                {
                    if ( obj instanceof CacheEntry )
                    {
                        if ( obj instanceof ExpiringCacheEntry && obj.expired )
                        {
                            // if the key holds an expired value, remove it
                            attempt( () => this.delete( key ) );
                            return null;
                        }

                        let value = dereference( obj.value );

                        if ( isNull( value ) )
                        {
                            // if the key holds a 'dead' ref or null value, remove it
                            attempt( () => this.delete( key ) );
                            return null;
                        }

                        value = unwrapValue( value );

                        if ( isNull( value ) )
                        {
                            attempt( () => this.delete( key ) );
                            return null;
                        }

                        return lock( value );
                    }

                    return lock( unwrapValue( obj ) );
                }
                else if ( isNonNullValue( obj ) )
                {
                    return obj;
                }

                // if the key holds a 'dead' ref or null value, remove it
                attempt( () => this.delete( key ) );
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
             * If we reach this statement,
             * we are storing WeakRef objects,
             * so we have to retrieve the value,
             * dereference it
             * and return true if the dereferenced value is not undefined (or null)
             */
            const ref = super.get( key );

            if ( !isNull( ref ) )
            {
                const value = unwrapValue( dereference( ref ) );

                if ( isNull( value ) )
                {
                    attempt( () => this.delete( key ) );
                    return false;
                }

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
            let key = this.resolveKey( pKey );

            if ( !this.isSupportedKey( key ) )
            {
                return false;
            }

            let value = pValue ?? this.get( key );

            // by deleting the entry and then re-setting it,
            // we move a potentially existing entry to the end of the collection,
            // so we will not remove it prematurely
            attempt( () => this.delete( key ) );

            // we do not support storing null
            if ( isNonNullValue( value ) )
            {
                value = unwrapValue( value );

                // then we freeze (lock) the object
                // cached objects must be immutable
                if ( isNonNullValue( value ) )
                {
                    if ( value instanceof CacheEntry )
                    {
                        value = dereference( value.value );
                    }

                    value = dereference( value ) ?? value;

                    value = isNonNullObject( value ) ? lock( dereference( value ) ) : value;

                    // we wrap the value in a new WeakRef
                    value = isNonNullObject( value ) ? new WeakRef( lock( value ) ) : value;

                    // if this cache is at capacity
                    if ( this.size >= this.limit )
                    {
                        // we delete the oldest 'living' entry
                        // (which we assume to be identified by the first entry in the iterator)
                        const oldestKey = this.keys().next()?.value;

                        if ( !isNull( oldestKey ) )
                        {
                            attempt( () => this.delete( oldestKey ) );
                            attemptSilent( () => this.delete( createKey( oldestKey, this ) ) );
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
                    super.set( key, new WeakRef( new CacheEntry( value, key ) ) );
                }
            }
        }

        addAll( ...pEntries )
        {
            const entries = asArray( pEntries );

            for( let entry of entries )
            {
                const key = ObjectEntry.getKey( entry );
                const value = ObjectEntry.getValue( entry );

                this.set( key, value );
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
            const entries = super.entries();

            for( const [key, val] of entries )
            {
                // dereference the value (in case we are configured to use WeakRef)
                let value = isNonNullObject( val ) ? dereference( val ) : val;

                if ( isNonNullObject( value ) )
                {
                    if ( value instanceof ExpiringCacheEntry && value.expired )
                    {
                        attempt( () => this.delete( key ) );
                        continue;
                    }
                }

                value = unwrapValue( value );

                // If it's a WeakRef that has been garbage collected or an expired entry,
                // we delete the entry and move on
                if ( isNull( value ) )
                {
                    attempt( () => this.delete( key ) );
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

            try
            {
                for( let entry of this.entries() )
                {
                    attempt( () => cb( entry ) );
                }
            }
            catch( ex )
            {
                throw new CacheException( ex,
                                          {
                                              detail:
                                                  {
                                                      callback: pCallback,
                                                      cache: this
                                                  }
                                          }, pThis, pCallback, callback, cb );
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
                if ( isNull( dereference( val ) ) )
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
                // unwrap the value
                let value = unwrapValue( val );

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
            return new __BoundedCache( this.limit, new Map( this.entries() ).entries() );
        }

        toLiteral()
        {
            const obj =
                {
                    maxSize: this.limit || this.maxSize,
                    map: toObjectLiteral( new Map( this.entries() ) )
                };
            return lock( obj );
        }

        toJSON()
        {
            const literal = this.toLiteral();
            return attempt( () => asJson( literal ) );
        }
    }

    class BaseCache
    {
        #id;

        #map;

        #logger = LOGGER;

        constructor( pMaxSize = -1 )
        {
            this.#id = nextCacheId( this );

            this.#map = this._resolveMap( pMaxSize );

            this.#logger = ToolBocksModule.resolveLogger( DEFAULT_LOGGER, LOGGER, ToolBocksModule.getGlobalLogger(), konsole );
            this.#logger = SourcedSimpleLogger.adapt( this.#logger, this );
        }

        get id()
        {
            this.#id = this.#id || nextCacheId( this );
            return this.#id;
        }

        get logger()
        {
            return ToolBocksModule.resolveLogger( this.#logger, DEFAULT_LOGGER, LOGGER, ToolBocksModule.getGlobalLogger(), konsole );
        }

        _resolveMap( pMaxSize = -1 )
        {
            return this.#map ?? new __BoundedCache( pMaxSize );
        }

        _createKey( pKey )
        {
            return createKey( pKey );
        }

        _createCacheEntry( pKey, pValue )
        {
            return new CacheEntry.create( pValue, pKey );
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
            attempt( () => this.clear() );

            return this;
        }

        isSupportedKey( pKey )
        {
            return isFunction( this.#map?.isSupportedKey ) ? this.#map.isSupportedKey( pKey ) : ([_str, _num, _big, _symbol].includes( typeof pKey ) && !isBlank( asString( pKey, true ) ));
        }

        cacheValue( pKey, pValue, pTimeToLive = -1 )
        {
            if ( !this.isSupportedKey( pKey ) )
            {
                throw new CacheException( `Invalid Key, ${pKey}` );
            }

            if ( !isNull( pValue ) )
            {
                const value = unwrapValue( pValue );

                const cachedValue = CacheEntry.create( value, pKey, (asInt( pTimeToLive, -1 ) || -1) );

                const key = this._createKey( pKey ?? cachedValue?.key );

                if ( !isNull( cachedValue ) )
                {
                    this.#map.set( key, cachedValue );
                }
            }
        }

        put( pKey, pValue, pTimeToLive = -1 )
        {
            this.cacheValue( pKey, pValue, pTimeToLive );
        }

        set( pKey, pValue, pTimeToLive = -1 )
        {
            this.cacheValue( pKey, pValue, pTimeToLive );
        }

        get( pKey )
        {
            const key = this._createKey( pKey, this );

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
                    return dereference( cachedValue instanceof CacheEntry ? cachedValue.value ?? cachedValue : cachedValue );
                }
            }

            return cachedValue;
        }

        delete( pKey )
        {
            const key = this._createKey( pKey, this );
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
            if ( isFunction( this.#map.clear ) )
            {
                this.#map.clear();
            }

            const keys = isFunction( this.#map.keys ) ? this.#map.keys() : attempt( () => objectKeys( this.#map ) );

            for( let key of keys )
            {
                attempt( () => this.#map.delete( key ) );
            }

            return this.isEmpty();
        }

        equals( pOther )
        {
            if ( isNonNullObject( pOther ) || isJsonObject( pOther ) )
            {
                const other = asObject( pOther );
                return ((other.id === this.id) && getClassName( other ) === getClassName( this )) && (this.size === other.size);
            }
            return false;
        }

        toLiteral()
        {
            const obj =
                {
                    id: this.id,
                    mapClass: getClassName( this.#map ),
                    map: toObjectLiteral( this.asMap() )
                };

            return lock( obj );
        }

        toJSON()
        {
            const literal = this.toLiteral();
            return attempt( () => asJson( literal ) );
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
            for( const [key, val] of this.#map.entries() )
            {
                // dereference the value (in case we are configured to use WeakRef)
                let value = isNonNullObject( val ) ? dereference( val ) : val;

                if ( value instanceof CacheEntry )
                {
                    if ( value instanceof ExpiringCacheEntry && value.expired )
                    {
                        continue;
                    }
                    value = dereference( value.value );
                }

                // If it's a WeakRef that has been garbage collected, we ignore and move on
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
         * Returns an iterator of the valid entries in this cache
         * @returns {Generator<[K, V][0], void, *>}
         */
        * keys()
        {
            for( const [key, val] of this.entries() )
            {
                if ( isNull( dereference( val ) ) )
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
                const v = dereference( (val ?? this.get( key )) ) || dereference( this.get( key ) );

                const value = isNonNullObject( v ) ? dereference( v ) : v;

                // If it's a WeakRef that has been garbage collected, we ignore and move on
                if ( isNull( value ) )
                {
                    continue;
                }

                // yield the value (always ensuring that it is immutable)
                yield lock( dereference( value ) );
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

    class BoundedCache extends BaseCache
    {
        #maxSize = DEFAULT_CACHE_CAPACITY;

        constructor( pMaxSize = DEFAULT_CACHE_CAPACITY )
        {
            super( pMaxSize || DEFAULT_CACHE_CAPACITY );
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

            return new __BoundedCache( capacity );
        }

        _createKey( pKey )
        {
            return super._createKey( pKey );
        }

        _createCacheEntry( pKey, pValue )
        {
            return super._createCacheEntry( pKey, pValue );
        }

        cacheValue( pKey, pValue, pTimeToLive = -1 )
        {
            super.cacheValue( pKey, pValue, pTimeToLive );
        }

        put( pKey, pValue, pTimeToLive = -1 )
        {
            super.put( pKey, pValue, pTimeToLive );
        }

        set( pKey, pValue, pTimeToLive = -1 )
        {
            super.set( pKey, pValue, pTimeToLive );
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

        async init( ...pArgs )
        {
            return super.init( ...pArgs );
        }

        async dispose( ...pArgs )
        {
            return super.dispose( ...pArgs );
        }

        toLiteral()
        {
            const obj = { ...(asObject( super.toLiteral() )) };

            obj.maxSize = this.maxSize || this.limit;

            return lock( obj );
        }
    }

    class ExpiringCache extends BoundedCache
    {
        #ttl = ONE_HOUR;

        #timer;

        constructor( pMaxSize = DEFAULT_CACHE_CAPACITY, pTimeToLive = ONE_HOUR )
        {
            super( asInt( pMaxSize || DEFAULT_CACHE_CAPACITY ) );

            const me = this;

            this.#ttl = clamp( asInt( pTimeToLive ), MIN_CACHE_EXPIRATION, MAX_CACHE_EXPIRATION );

            const sweep = function( pThis )
            {
                const thiz = pThis ?? me ?? this;

                try
                {
                    let keys = isFunction( thiz.keys ) ? asArray( thiz.keys() ?? thiz.asMap()?.keys() ) : isFunction( thiz.asMap ) ? asArray( thiz.asMap()?.keys() ?? thiz ) : asArray( thiz.keys ?? asArray( this ) );

                    for( let key of keys )
                    {
                        const k = dereference( key ) ?? key;

                        const v = attempt( () => thiz.get( k ) );

                        if ( isNull( v ) || isNull( dereference( v ) ) || v.expired || (dereference( v ).expired) )
                        {
                            attempt( () => thiz.delete( k ) || thiz.delete( createKey( k, this ) ) );
                        }
                    }
                }
                catch( ex )
                {
                    const logger = ToolBocksModule.resolveLogger( thiz.logger, DEFAULT_LOGGER, ToolBocksModule.getGlobalLogger(), konsole );
                    logger.error( `An error occurred while 'sweeping' an ExpiringCache`, ex.message, ex );
                }
            }.bind( me ?? this );

            this.#timer = attempt( () => setInterval( sweep, (ONE_MINUTE * 20), me ?? this ) );

            // do not prevent the event loop from terminating just because this time is active
            if ( isFunction( this.#timer.unref ) )
            {
                attempt( () => this.#timer.unref() );
            }
        }

        get ttl()
        {
            return clamp( asInt( this.#ttl ), MIN_CACHE_EXPIRATION, MAX_CACHE_EXPIRATION );
        }

        async dispose( ...pArgs )
        {
            attempt( () => this.clear() );
            attempt( () => clearInterval( this.#timer ) );

            return super.dispose( ...pArgs );
        }

        _createCacheEntry( pKey, pValue )
        {
            return new ExpiringCacheEntry( pValue, pKey, this.ttl );
        }

        get( pKey )
        {
            const k = createKey( isNonNullObject( pKey ) ? dereference( pKey ) : pKey );

            let value = super.get( k ) ?? super.get( pKey );

            if ( isNonNullObject( value ) )
            {
                value = dereference( value );

                if ( value instanceof ExpiringCacheEntry || isFunction( value.isExpired ) )
                {
                    if ( value.isExpired() || value.expired )
                    {
                        attempt( () => super.delete( k ) );
                        attemptSilent( () => super.delete( pKey ) );
                        return null;
                    }
                }

                if ( value instanceof CacheEntry )
                {
                    value = dereference( value.value ?? value );
                    if ( isNull( value ) )
                    {
                        attempt( () => super.delete( k ) );
                        attemptSilent( () => super.delete( pKey ) );
                        return null;
                    }
                }

                value = unwrapValue( value );

                if ( isNull( value ) )
                {
                    attempt( () => super.delete( k ) );
                    attemptSilent( () => super.delete( pKey ) );
                }
            }

            return unwrapValue( value );
        }
    }

    const mod =
        {
            MIN_CACHE_CAPACITY,
            DEFAULT_CACHE_CAPACITY,
            MAX_CACHE_CAPACITY,
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
                    CacheEntry,
                    ExpiringCacheEntry,
                    BaseCache,
                    __BoundedCache,
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
