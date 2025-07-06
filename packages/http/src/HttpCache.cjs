// noinspection AiaStyle

/**
 * @fileOverview
 * This module defines a facade and/or substitute for the Web CacheStorage API<br>
 * <br>
 *
 * @module HttpStorage
 *
 * @author Scott Bockelman
 * @license MIT
 */

// requires the core modules
const core = require( "@toolbocks/core" );

const { constants, typeUtils, stringUtils, arrayUtils } = core;

const httpRequest = require( "./HttpRequest.cjs" );
const httpResponse = require( "./HttpResponse.cjs" );

const fetchUtils = require( "./FetchUtils.cjs" );

const {
    _ud = "undefined", $scope = constants?.$scope || function()
    {
        return (_ud === typeof self ? ((_ud === typeof global) ? {} : (global || {})) : (self || {}));
    }
} = constants;

// noinspection FunctionTooLongJS
(function exposeModule()
{
    const INTERNAL_NAME = "__BOCK__HTTP_CACHE_STORAGE__";

    if ( $scope() && (null != $scope()[INTERNAL_NAME]) )
    {
        return $scope()[INTERNAL_NAME];
    }

    /**
     * This is a dictionary of this module's dependencies.
     * <br>
     * It is exported as a property of this module,
     * allowing us to just import this module<br>
     * and then import or use the other utilities<br>
     * as properties of this module.
     * <br>
     * @dict
     * @type {Object}
     * @alias module:ArrayUtils#dependencies
     */
    const dependencies =
        {
            constants,
            typeUtils,
            stringUtils,
            arrayUtils
        };

    const {
        _mt_str,
        _underscore,
        no_op,
        populateOptions,
        classes,
        asyncAttempt
    } = constants;

    const { ToolBocksModule, ModuleEvent } = classes;


    const modName = "HttpCache";

    const modulePrototype = new ToolBocksModule( modName, INTERNAL_NAME );

    const { isNull, isFunction } = typeUtils;

    const { asString, asInt } = stringUtils;

    const { asArray, asArgs } = arrayUtils;

    const {
        HttpRequest,
        cloneRequest = function( pRequest ) { return isNull( pRequest ) ? null : isFunction( pRequest?.clone ) ? pRequest.clone() : pRequest; }
    } = httpRequest;

    const {
        HttpResponse,
        cloneResponse = function( pResponse ) { return isNull( pResponse ) ? null : isFunction( pResponse?.clone ) ? pResponse.clone() : pResponse; }
    } = httpResponse;

    const { Fetcher } = fetchUtils;

    const executionEnvironment = modulePrototype.executionEnvironment;

    const _isNode = executionEnvironment.isNode();

    const isCache = ( pObject ) => ( !isNull( pObject ) &&
                                     isFunction( pObject?.add ) &&
                                     isFunction( pObject?.addAll ) &&
                                     isFunction( pObject?.delete ) &&
                                     isFunction( pObject?.keys ) &&
                                     isFunction( pObject?.match ) &&
                                     isFunction( pObject?.matchAll &&
                                     isFunction( pObject?.put ) ));

    /**
     * Returns true if the specified object implements the CacheStorage interface.<br>
     * <br>
     *
     * @param {Object} pObject The object to evaluate
     * @returns {boolean} true if the object implements the 5 methods expected (open, match, keys, has, and delete)
     */
    const isCacheStorage = ( pObject ) => ( !isNull( pObject ) &&
                                            (isFunction( pObject?.delete ) &&
                                            isFunction( pObject?.has ) &&
                                            isFunction( pObject?.keys ) &&
                                            isFunction( pObject?.match ) &&
                                            isFunction( pObject?.open )));


    const isBackingStore = ( pObject ) => ( !isNull( pObject ) &&
                                            isFunction( pObject?.set ) &&
                                            isFunction( pObject?.get ));

    class HttpCache extends EventTarget
    {
        #map = new Map();

        #cache = null;

        #options;

        constructor( pBackingStore, pOptions )
        {
            super();

            this.#options = populateOptions( pOptions, {} );

            if ( isCache( pBackingStore ) )
            {
                this.#cache = pBackingStore;
            }
            else if ( isBackingStore( pBackingStore ) )
            {
                this.#map = pBackingStore;
            }
        }

        async add( pRequest )
        {
            const me = this;

            const req = cloneRequest( pRequest );

            const func = isCache( this.#cache ) ?
                         (async() => (me || this).#cache.add( req ).then( () => (me || this).#map.set( req, cloneResponse( (me || this).match( req ) ) ) )) :
                         (async() => Fetcher.fetch( req ).then( ( response ) => (me || this).#map.set( req, cloneResponse( response ) ) ));

            return asyncAttempt( func );
        }

        async addAll( ...pRequest )
        {
            const me = this;

            const requests = asArgs( ...pRequest ).map( e => cloneRequest( e ) );

            const func = isCache( this.#cache ) ?
                         (async() => (me || this).#cache.addAll( requests )) :
                         (async() => Fetcher.fetchAll( requests ).then( ( responses ) => responses.forEach( ( response, index ) => (me || this).#map.set( cloneRequest( requests[index] ), cloneResponse( response ) ) ) ));

            return asyncAttempt( func );
        }

        async delete( pRequest, pOptions )
        {
            const me = this;

            const req = cloneRequest( pRequest );

            let removed = this.#map.delete( req );

            if ( isCache( this.#cache ) )
            {
                removed = await asyncAttempt( async() => (me || this).#cache.delete( req, pOptions ) );
            }

            this.dispatchEvent( new ModuleEvent( "cachedItemRemoved", { removed: [req] } ) );

            return removed;
        }

        async keys()
        {
            const me = this;

            let keys = [...(asArray( this.#map.keys() || [] ))];

            if ( isCache( this.#cache ) )
            {
                const requests = await asyncAttempt( async() => (me || this).#cache.keys() );
                keys = keys.concat( requests ).flat();
            }

            return [...keys];
        }

        async match( pRequest, pOptions )
        {
            const me = this;

            let response = cloneResponse( this.#map.get( pRequest ) );

            if ( isCache( this.#cache ) )
            {
                const cached = await asyncAttempt( async() => (me || this).#cache.match( pRequest, pOptions ) );
                response = cloneResponse( !isNull( cached ) && cached.ok ? cached || response : !isNull( response ) && response.ok ? response : null );
            }

            return !isNull( response ) && response.ok ? cloneResponse( response ) : null;
        }

        async matchAll( pRequest, pOptions )
        {
            const me = this;

            let returned = [];

            const req = cloneRequest( pRequest );

            let response = cloneResponse( this.#map.get( req ) );

            if ( isCache( this.#cache ) )
            {
                const cached = await asyncAttempt( async() => (me || this).#cache.matchAll( req, pOptions ) );

                if ( !isNull( cached ) )
                {
                    returned.push( ...(cached.filter( e => !isNull( e ) && e.ok ).map( e => cloneResponse( e ) )) );
                }
                else if ( !isNull( response ) && response.ok )
                {
                    returned.push( cloneResponse( response ) );
                }
            }

            return [...returned].map( e => cloneResponse( e ) );
        }

        async put( pRequest, pResponse, pOptions )
        {
            const me = this;

            const req = cloneRequest( pRequest );
            const res = cloneResponse( pResponse );

            this.#map.set( req, res );

            if ( isCache( this.#cache ) )
            {
                await asyncAttempt( async() => (me || this).#cache.put( req, cloneResponse( res ), pOptions ) );
            }
        }
    }

    HttpCache.getInstance = function( pBackingStore, pOptions )
    {
        if ( pBackingStore instanceof HttpCache )
        {
            return pBackingStore;
        }
        return new HttpCache( pBackingStore, pOptions );
    };


    /**
     * @typedef {Object} CacheStorageOptions An object to manage the collection of caches specific to a version of an application or library
     *
     * @property {string} cachePrefix The string with which all cache names belonging to this instance will start.
     * @property {number} version The version of the caches to be considered current. Older caches may be purged.
     *
     * @property {boolean} shouldRemoveObsoleteCaches - A flag indicating whether obsolete caches
     *                                                  should be removed automatically.<br>
     *                                                   <br>
     * @property {Array.<String>} preserveCaches - An array of cache names to preserve by copying to the new version.<br>
     *                                             This can be useful if the application maintains one or more caches of values that rarely change.<br>
     *                                             <br>
     *
     * @property {Array.<String|Request>} preserveKeys An array of Requests (or URL strings) specifying key/values
     *                                                  to be copied from a prior cache to a new cache
     *                                                  when obsolete caches are removed.<br>
     *
     *
     * */

    const DEFAULT_CACHE_NAME = "Default";

    /**
     * The default prefix by which we recognize our own caches.<br>
     * <br>
     * A prefix should uniquely identify those caches
     * that belong to a specific application or library.<br>
     * <br>
     * @constant {string} DEFAULT_CACHE_PREFIX
     * @type {string}
     */
    const DEFAULT_CACHE_PREFIX = "ToolBocksCache_";

    /**
     * Represents the default version number of the caches used by an application or library.<br>
     * <br>
     * Caches should be versioned
     * such that updates to an application or library
     * that invalidate previously cached values can be purged.<br>
     * <br>
     *
     * @constant {number} DEFAULT_VERSION
     * @type {number}
     */
    const DEFAULT_VERSION = 1;

    /**
     * This is the default value indicating whether to delete obsolete caches.<br>
     * <br>
     * @constant DEFAULT_REMOVE_OBSOLETE_CACHES
     * @type {boolean}
     */
    const DEFAULT_REMOVE_OBSOLETE_CACHES = true;

    /**
     * A constant object representing the default options for cache storage configuration.
     *
     * @type CacheStorageOptions
     *
     * @property {string} cachePrefix - The prefix used for naming caches.
     *
     * @property {string} version - The version identifier for the cache storage.
     *
     * @property {boolean} shouldRemoveObsoleteCaches - A flag indicating whether obsolete caches
     *                                            should be removed automatically.<br>
     *                                            <br>
     * @property {Array.<String>} preservCaches - An array of cache names to preserve by copying to the new version.<br>
     *                                            This can be useful if the application maintains one or more caches of values that rarely change.<br>
     *                                            <br>
     *
     * @property {Array.<String|Request>} preserveKeys An array of Requests (or URL strings) specifying key/values
     *                                                 to be copied from a prior cache to a new cache
     *                                                 when obsolete caches are removed.<br>
     */
    const DEFAULT_CACHE_STORAGE_OPTIONS =
        {
            cachePrefix: DEFAULT_CACHE_PREFIX,
            version: DEFAULT_VERSION,
            shouldRemoveObsoleteCaches: DEFAULT_REMOVE_OBSOLETE_CACHES,
            preserveCaches: [],
            preserveKeys: []
        };

    /**
     * This class wraps or provides a substitute for the Web Cache API CacheStorage interface.<br>
     * <br>
     * If the 'caches' object is available in the execution environment,
     * it can be passed to the constructor, making the instance returned a wrapper or proxy
     * for the native CacheStorage.<br>
     * <br>
     * If the execution environment does not support CacheStorage, or you just want to ignore it,
     * an instance of this class can be used anywhere you would normally use 'caches'
     *
     * @class
     */
    class HttpCacheStorage extends EventTarget
    {
        #options;

        #map = new Map();
        #cacheStorage = null;

        #cachePrefix;
        #version;
        #shouldRemoveObsoleteCaches;
        #preserveCaches = [];
        #preserveKeys = [];

        #removeOnCopy = {};

        constructor( pBackingStore, pOptions )
        {
            super();

            this.#options = populateOptions( pOptions, DEFAULT_CACHE_STORAGE_OPTIONS );

            if ( isCacheStorage( pBackingStore ) )
            {
                this.#cacheStorage = pBackingStore;
            }
            else if ( isBackingStore( pBackingStore ) )
            {
                this.#map = pBackingStore;
            }

            this.#cachePrefix = asString( this.#options.cachePrefix, true ) || DEFAULT_CACHE_PREFIX;

            this.#version = Math.max( 1, asInt( this.#options.version ) || DEFAULT_VERSION );

            this.#shouldRemoveObsoleteCaches = !!this.#options.shouldRemoveObsoleteCaches;

            this.#preserveCaches.push( ...(asArray( this.#options.preserveCaches || [] )) );

            this.#preserveKeys.push( ...(asArray( this.#options.preserveKeys || [] )) );

            const me = this;

            if ( this.#shouldRemoveObsoleteCaches )
            {
                setTimeout( () => me.removeObsoleteCaches(), 250 );
            }
        }

        get options()
        {
            return populateOptions( this.#options || {}, DEFAULT_CACHE_STORAGE_OPTIONS );
        }

        get cachePrefix()
        {
            return asString( this.#cachePrefix, true ) || DEFAULT_CACHE_PREFIX;
        }

        get version()
        {
            return Math.max( 1, asInt( this.#version ) || DEFAULT_VERSION );
        }

        get shouldRemoveObsoleteCaches()
        {
            return !!this.#shouldRemoveObsoleteCaches;
        }

        get preserveKeys()
        {
            return [...(asArray( this.#preserveKeys || [] ))];
        }

        get preserveCaches()
        {
            return [...(asArray( this.#preserveCaches || [] ))];
        }

        static generateCacheName( pCacheName = DEFAULT_CACHE_NAME, pPrefix = DEFAULT_CACHE_PREFIX, pVersion = DEFAULT_VERSION )
        {
            let cacheName = asString( pCacheName, true ) || DEFAULT_CACHE_NAME;
            let prefix = (asString( pPrefix, true ) || DEFAULT_CACHE_PREFIX);
            let version = Math.max( 1, asInt( pVersion ) || DEFAULT_VERSION );

            // remove the prefix
            cacheName = cacheName.replace( prefix + _underscore, _mt_str );
            cacheName = cacheName.replace( prefix, _mt_str );

            // remove any stray underscores from the start
            cacheName = cacheName.replace( /^_+/, _mt_str );

            // remove the version
            cacheName = cacheName.replace( /_\d+$/, _mt_str );

            // remove any stray underscores from the end
            cacheName = cacheName.replace( /_+$/, _mt_str );

            // remove any stray underscores from the start
            prefix = prefix.replace( /^_+/, _mt_str );

            // remove any stray underscores from the end
            prefix = prefix.replace( /_+$/, _mt_str );

            return `${prefix}_${cacheName}_${version}`;
        }

        calculateCacheName( pCacheName )
        {
            return HttpCacheStorage.generateCacheName( pCacheName, this.cachePrefix, this.version );
        }

        static calculateBaseName( pCacheName )
        {
            const cacheName = asString( pCacheName, true ) || _mt_str;
            const parts = cacheName.split( /_/ );
            return parts.length > 2 ? parts[1] : cacheName.includes( _underscore ) ? parts.length > 0 ? parts[0] : cacheName : cacheName;
        }

        static calculatePrefix( pCacheName )
        {
            const cacheName = asString( pCacheName, true ) || _mt_str;
            const parts = cacheName.split( /_/ );
            return parts.length > 1 ? parts[0] : _mt_str;
        }

        isOwnedCache( pCacheName )
        {
            const cacheName = asString( pCacheName, true ) || _mt_str;
            const prefix = HttpCacheStorage.calculatePrefix( cacheName );
            return asString( prefix, true ).replace( /_+$/, _mt_str ) === asString( this.cachePrefix, true ).replace( /_+$/, _mt_str );
        }

        static calculateVersion( pCacheName )
        {
            const cacheName = asString( pCacheName, true ) || _mt_str;
            const matches = cacheName.match( /_\d+$/ );
            return asInt( matches && matches.length ? matches[0].replace( /_/, _mt_str ) : DEFAULT_VERSION ) || DEFAULT_VERSION;
        }

        isPriorVersion( pCacheName )
        {
            const cacheName = asString( pCacheName, true ) || DEFAULT_CACHE_NAME;
            const version = HttpCacheStorage.calculateVersion( cacheName );
            return version < this.version;
        }

        async removeObsoleteCaches()
        {
            const me = this;

            const keys = await asyncAttempt( async() => (me || this).keys() );

            const preserveCaches = [...(this.preserveCaches || [])].map( e => HttpCacheStorage.calculateBaseName( e ) );

            const removedCaches = [];

            keys.forEach( (async( pCacheName ) =>
            {
                if ( me.isOwnedCache( pCacheName ) && me.isPriorVersion( pCacheName ) )
                {
                    const baseName = HttpCacheStorage.calculateBaseName( pCacheName );

                    let removeCache = !preserveCaches.includes( baseName );

                    if ( removeCache && (me.preserveKeys.length <= 0) )
                    {
                        if ( await asyncAttempt( async() => me.delete( pCacheName ) ) )
                        {
                            removedCaches.push( pCacheName );

                            delete me.#removeOnCopy[baseName];
                        }
                    }
                    else
                    {
                        me.#removeOnCopy[baseName] = [...(me.preserveKeys)];
                    }
                }
            }).then( no_op ).catch( ( error ) => modulePrototype.handleError( error, me.removeObsoleteCaches, keys, preserveCaches, me.preserveKeys ) ) );

            this.dispatchEvent( new ModuleEvent( "cacheRemoved", { removedCaches } ) );

            return removedCaches;
        }

        async delete( pCacheName )
        {
            const cacheName = HttpCacheStorage.generateCacheName( HttpCacheStorage.calculateBaseName( pCacheName ), HttpCacheStorage.calculatePrefix( pCacheName ), HttpCacheStorage.calculateVersion( pCacheName ) );

            let removed = false;

            if ( this.isOwnedCache( cacheName ) && this.isPriorVersion( cacheName ) )
            {
                removed = await asyncAttempt( async() => (!isNull( this.#cacheStorage ) ? await this.#cacheStorage?.delete( cacheName ) : this.#map.delete( cacheName )) );
            }

            if ( removed )
            {
                this.#map.delete( cacheName );

                this.dispatchEvent( new ModuleEvent( "cacheRemoved", { removedCaches: [cacheName] } ) );
            }

            return removed;
        }

        async has( pCacheName )
        {
            const cacheName = HttpCacheStorage.generateCacheName( HttpCacheStorage.calculateBaseName( pCacheName ), HttpCacheStorage.calculatePrefix( pCacheName ), HttpCacheStorage.calculateVersion( pCacheName ) );
            return await asyncAttempt( async() => (!isNull( this.#cacheStorage ) ? await this.#cacheStorage?.has( cacheName ) : this.#map.has( cacheName )) );
        }

        async keys()
        {
            return await asyncAttempt( async() => (!isNull( this.#cacheStorage ) ? await this.#cacheStorage?.keys() : this.#map.keys()) );
        }

        async match( pRequest, pOptions )
        {
            const me = this;

            const keys = await asyncAttempt( async() => (me || this).keys() );

            for( const key of keys )
            {
                const cache = await asyncAttempt( async() => (me || this).open( key ) );

                const response = cache.match( pRequest, pOptions );

                if ( !isNull( response ) && response.ok )
                {
                    return cloneResponse( response );
                }
            }

            return null;
        }

        async copyAndRemove( pCacheName, pCurrentCache, pKeysToPreserve )
        {
            const me = this;

            const baseName = HttpCacheStorage.calculateBaseName( pCacheName );

            const currentCache = isCache( pCurrentCache ? pCurrentCache : null ) || await this.open( HttpCacheStorage.generateCacheName( baseName, (me || this).cachePrefix, (me || this).version ) );

            const keysToPreserve = asArray( pKeysToPreserve || (me || this).#removeOnCopy[baseName] );

            for( let i = (this.version - 1); i > 0; i-- )
            {
                const cacheName = HttpCacheStorage.generateCacheName( baseName, this.cachePrefix, i );

                this.open( cacheName ).then( async( pCache ) =>
                                             {
                                                 if ( pCache && isFunction( pCache.match ) )
                                                 {
                                                     for( let key of keysToPreserve )
                                                     {
                                                         asyncAttempt( async() => currentCache.put( key, await pCache.match( key ) ) );
                                                     }
                                                 }
                                             } );

            }

            setTimeout( () => delete (me || this).#removeOnCopy[baseName], 250 );
        }

        async open( pCacheName )
        {
            const baseName = HttpCacheStorage.calculateBaseName( pCacheName );

            const prefix = HttpCacheStorage.calculatePrefix( pCacheName );

            const version = HttpCacheStorage.calculateVersion( pCacheName );

            const cacheName = HttpCacheStorage.generateCacheName( baseName, prefix, version );

            let cache = await asyncAttempt( async() => (!isNull( this.#cacheStorage ) ? await this.#cacheStorage?.open( cacheName ) : this.#map.get( cacheName )) );

            const httpCache = HttpCache.getInstance( cache, this.options );

            this.#map.set( cacheName, httpCache );

            if ( this.version === version && !isNull( this.#removeOnCopy[baseName] ) )
            {
                const me = this;
                setTimeout( () => me.copyAndRemove( pCacheName, httpCache, this.#removeOnCopy[baseName] ), 250 );
            }

            return httpCache;
        }
    }

    class HttpCacheStorageManager extends HttpCacheStorage
    {
        constructor( pCacheStorage, pOptions = DEFAULT_CACHE_STORAGE_OPTIONS )
        {
            super( pCacheStorage, pOptions );
        }
    }

    let mod =
        {
            dependencies,
            classes:
                {
                    HttpCache,
                    HttpCacheStorage,
                    HttpCacheStorageManager,
                },
            HttpCache,
            HttpCacheStorage,
            HttpCacheStorageManager,
            DEFAULT_CACHE_NAME,
            DEFAULT_CACHE_PREFIX,
            DEFAULT_VERSION,
            DEFAULT_REMOVE_OBSOLETE_CACHES,
            DEFAULT_CACHE_STORAGE_OPTIONS,
        };

    mod = modulePrototype.extend( mod );

    return mod.expose( mod, INTERNAL_NAME, (_ud !== typeof module ? module : mod) ) || mod;

}());
