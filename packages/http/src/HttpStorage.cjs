/**
 * @fileOverview
 * This module defines a facade and/or substitute for the Web Storage API<br>
 * <br>
 *
 * @module HttpStorage
 *
 * @author Scott Bockelman
 * @license MIT
 */

// requires the core modules
const core = require( "@toolbocks/core" );

const { constants } = core;

const { _ud = "undefined", $scope } = constants;

// noinspection FunctionTooLongJS
(function exposeModule()
{
    const INTERNAL_NAME = "__BOCK__HTTP_STORAGE__";

    if ( $scope() && (null != $scope()[INTERNAL_NAME]) )
    {
        return $scope()[INTERNAL_NAME];
    }

    // import the specific modules from @toolbocks/core that are necessary for this module
    const { moduleUtils, constants, typeUtils, stringUtils, arrayUtils } = core;

    // import the classes, variables, and function defined in moduleUtils that are used in this module
    const
        {
            ModuleEvent,
            ToolBocksModule,
            ObjectEntry,
            IterationCap,
            populateOptions,
            attempt,
            asyncAttempt,
            resolveError,
            getLastError,
            lock,
            localCopy,
            objectEntries,
            mergeObjects,
            sleep,
            no_op,
            $ln,
        } = moduleUtils;

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

    const { _mt_str, _asterisk, S_ERROR } = constants;

    const modName = "HttpStorage";

    const modulePrototype = new ToolBocksModule( modName, INTERNAL_NAME );

    const { isNull, isObject, isFunction } = typeUtils;

    const { asString, asInt } = stringUtils;

    const { asArray } = arrayUtils;

    const executionEnvironment = modulePrototype.executionEnvironment;

    const _isNode = executionEnvironment.isNode();

    /**
     * Constructs an object to configure a storage event.
     *
     * @function buildStorageEventOptions
     * @param {string} pKey             The key associated with the storage event. The default is an empty string if not provided.
     * @param {string} pNewValue        The new value associated with the storage event. The default is an empty string if not provided.
     * @param {string} pOldValue        The old value associated with the storage event. The default is an empty string if not provided.
     * @param {string} pUrl             The URL of the document storing the associated data. The default is an empty string if not provided.
     * @param {Object} pStorageArea     The storage object (e.g., localStorage or sessionStorage) associated with the event.
     *                                  The default is an empty object if not provided.
     *
     * @returns {Object} An object containing the specified storage event options.
     */
    const buildStorageEventOptions = ( pKey = _mt_str, pNewValue = _mt_str, pOldValue = _mt_str, pUrl = _mt_str, pStorageArea = {} ) =>
    {
        return {
            key: pKey || _mt_str,
            value: localCopy( pNewValue || _mt_str ) || _mt_str,
            oldValue: localCopy( pOldValue || _mt_str ) || _mt_str,
            url: pUrl || _mt_str,
            storageArea: pStorageArea || {}
        };
    };

    /**
     * Resolves and returns the storage event options by populating the provided options
     * with the default storage event options.
     *
     * @function resolveStorageEventOptions
     * @param {Object} pOptions - The user-defined configuration options to be resolved.
     * @returns {Object} A merged object containing the resolved storage event options.
     */
    const resolveStorageEventOptions = ( pOptions ) =>
    {
        return { ...(buildStorageEventOptions() || {}), ...(pOptions || {}) };
    };

    /**
     * Provides a stand-in for StorageEvent in execution environments where it is not defined.<br>
     * Extends the ToolBocksModuleEvent for consistency across the library.<br>
     * @class
     * @extends ModuleEvent
     */
    class HttpStorageEvent extends ModuleEvent
    {
        #key;
        #newValue;
        #oldValue;
        #url;
        #storageArea;

        constructor( pKey, pOptions )
        {
            super( "storage", resolveStorageEventOptions( pOptions ), resolveStorageEventOptions( pOptions ) );

            const options = resolveStorageEventOptions( pOptions );

            this.#key = asString( pKey ) || asString( options?.key ) || _mt_str;
            this.#newValue = localCopy( (options?.newValue) || _mt_str ) || _mt_str;
            this.#oldValue = localCopy( (options?.oldValue) || _mt_str ) || _mt_str;
            this.#url = asString( options?.url ) || _mt_str;
            this.#storageArea = options?.storageArea || {};
        }
    }

    const isStorageObject = ( pObject ) => ( !isNull( pObject ) &&
                                             isObject( pObject ) &&
                                             isFunction( pObject?.clear ) &&
                                             isFunction( pObject?.getItem ) &&
                                             isFunction( pObject?.key ) &&
                                             isFunction( pObject?.removeItem ) &&
                                             isFunction( pObject?.setItem ));

    /**
     * The HttpStorage class is a custom implementation of the Web Storage API, 'Storage' interface.<br>
     * Use it exactly as you would use either localStorage or sessionStorage in a browser environment.<br>
     *
     * This class extends EventTarget to support event handling for storage changes.
     *
     * @class
     */
    class HttpStorage extends EventTarget
    {
        #map = new Map();

        #backingStore;

        constructor( pBackingStore )
        {
            super();

            this.#backingStore = isStorageObject( pBackingStore ) ? pBackingStore : null;
        }

        #notMe( pObject )
        {
            return (pObject !== this);
        }

        get length()
        {
            return this.#map.size || (this.#backingStore?.length || 0);
        }

        clear()
        {
            if ( this.length > 0 )
            {
                // noinspection JSUnusedLocalSymbols
                this.#map.entries().forEach( ( [key, value] ) =>
                                             {
                                                 this.removeItem( key );
                                             } );
            }

            this.#map.clear();

            if ( this.#backingStore && this.#notMe( this.#backingStore ) )
            {
                this.#backingStore.clear();
            }
        }

        getItem( pKey )
        {
            const me = this;

            const backingStore = !isNull( this.#backingStore ) && this.#notMe( this.#backingStore ) ? this.#backingStore : null;

            const key = asString( pKey );

            const value = this.#map.get( key ) || (!isNull( backingStore ) ? attempt( () => ((backingStore || (me || this).#backingStore)?.getItem( key ) || null) ) || null : null);

            return localCopy( value );
        }

        key( pNum )
        {
            const idx = asInt( pNum );

            if ( idx < this.length )
            {
                const backingStore = !isNull( this.#backingStore ) && this.#notMe( this.#backingStore ) ? this.#backingStore : null;

                return asArray( this.#map.keys() )[idx] || (!isNull( backingStore ) ? (backingStore?.key( idx ) || null) : null);
            }

            return null;
        }

        removeItem( pKey )
        {
            const key = asString( pKey );

            const oldValue = localCopy( this.getItem( key ) ) || _mt_str;

            const wasRemoved = this.#map.delete( key );

            if ( wasRemoved )
            {
                const storageEvent = new HttpStorageEvent( key, buildStorageEventOptions( key, _mt_str, oldValue, _mt_str, this ) );

                this.dispatchEvent( storageEvent );

                if ( this.#backingStore && this.#notMe( this.#backingStore ) )
                {
                    this.#backingStore.removeItem( key );
                }
            }
        }

        setItem( pKey, pValue )
        {
            const key = asString( pKey );

            const oldValue = localCopy( this.getItem( key ) ) || _mt_str;

            const me = this;
            const map = this.#map;

            const newValue = localCopy( pValue );

            attempt( () => (map || (me || this)?.#map).set( key, newValue ) );

            if ( this.#backingStore && this.#notMe( this.#backingStore ) )
            {
                const backingStore = !isNull( this.#backingStore ) && this.#notMe( this.#backingStore ) ? this.#backingStore : null;

                attempt( () => (backingStore || (me || this)?.#backingStore)?.setItem( key, newValue ) );
            }

            const item = localCopy( this.getItem( key ) ) || _mt_str;

            if ( item === newValue )
            {
                const storageEvent = new HttpStorageEvent( key, buildStorageEventOptions( key, newValue, oldValue, _mt_str, this ) );
                this.dispatchEvent( storageEvent );
            }
            else
            {
                const error = new Error( "Could not store value, check storage quota" );
                modulePrototype.reportError( error, error.message, S_ERROR, this.setItem, [pKey, pValue] );
            }
        }

        entries()
        {
            return [...(this.#map.entries())];
        }

        keys()
        {
            return [...(this.#map.keys())];
        }

        values()
        {
            return [...(this.#map.values())];
        }

        addEventListener( pType, pListener, pOptions )
        {
            super.addEventListener( pType, pListener, pOptions );
        }

        dispatchEvent( pEvent )
        {
            super.dispatchEvent( pEvent );
        }

        removeEventListener( pType, pListener, pOptions )
        {
            super.removeEventListener( pType, pListener, pOptions );
        }
    }

    /**
     * HttpLocalStorage extends HttpStorage
     * to specifically behave like a browser's localStorage mechanism
     * but also allows using a custom backing store in environments in which localStorage is not defined.
     *
     * In a browser environment (or any other environment defining a global localStorage object)
     * that localStorage will be used as the default storage mechanism.
     *
     * However, even in a browser environment,
     * it is possible to provide an alternative backing store
     * which will be used instead.
     *
     * Constructor Details:
     * - It accepts a backing store instance `pBackingStore` which must pass the `isStorageObject` check.
     * - If `pBackingStore` is invalid or not provided, it falls back to the localStorage API
     *   if it is available in the runtime environment.
     *
     * This class is useful for storing and retrieving data in an HTTP-like storage
     * system, with localStorage as its underlying storage.
     *
     * @extends HttpStorage
     *
     * @class
     */
    class HttpLocalStorage extends HttpStorage
    {
        constructor( pBackingStore )
        {
            super( (isStorageObject( pBackingStore ) ? pBackingStore : null) || (_ud !== typeof localStorage ? localStorage : null) );
        }
    }

    /**
     * HttpLocalStorage extends HttpStorage
     * to specifically behave like a browser's sessionStorage mechanism
     * but also allows using a custom backing store in environments in which sessionStorage is not defined.
     *
     * In a browser environment (or any other environment defining a global sessionStorage object)
     * that sessionStorage will be used as the default storage mechanism.
     *
     * However, even in a browser environment,
     * it is possible to provide an alternative backing store
     * which will be used instead.
     *
     * Constructor Details:
     * - It accepts a backing store instance `pBackingStore` which must pass the `isStorageObject` check.
     * - If `pBackingStore` is invalid or not provided, it falls back to the sessionStorage API
     *   if it is available in the runtime environment.
     *
     * If a custom backing store is provided and is a valid storage object, it will use that
     * backing store instead of the default `sessionStorage`.
     *
     * This class also ensures cleanup of the session data
     * when the session ends (e.g., process exit signals in Node.js).
     *
     * @class
     *
     * @extends HttpStorage
     */
    class HttpSessionStorage extends HttpStorage
    {
        constructor( pBackingStore )
        {
            super( (isStorageObject( pBackingStore ) ? pBackingStore : null) || (_ud !== typeof sessionStorage ? sessionStorage : null) );

            if ( _isNode && null != process )
            {
                const me = this;

                process.on( "beforeExit", () => (me || this).endSession() );

                process.on( "exit", () => (me || this).endSession() );
                process.on( "SIGINT", () => (me || this).endSession() );
                process.on( "SIGTERM", () => (me || this).endSession() );
            }
        }

        endSession()
        {
            try
            {
                this.clear();

                if ( _ud !== typeof sessionStorage && this !== sessionStorage )
                {
                    sessionStorage.clear();
                }

                const storageEvent = new HttpStorageEvent( _asterisk, buildStorageEventOptions( _asterisk, _mt_str, _mt_str, _mt_str, this ) );

                this.dispatchEvent( storageEvent );
            }
            catch( ignored )
            {
                //ignored
            }
        }
    }

    // noinspection JSUnresolvedReference
    if ( _ud === typeof StorageEvent )
    {
        // noinspection JSUnresolvedReference
        $scope().StorageEvent = $scope().StorageEvent || HttpStorageEvent;
    }

    if ( _ud === typeof localStorage )
    {
        $scope().localStorage = $scope().localStorage || new HttpLocalStorage();
    }

    if ( _ud === typeof sessionStorage )
    {
        $scope().sessionStorage = $scope().sessionStorage || new HttpSessionStorage();
    }

    let mod =
        {
            dependencies,
            classes:
                {
                    HttpStorage,
                    HttpLocalStorage,
                    HttpSessionStorage,
                    HttpStorageEvent
                },
            HttpStorage,
            HttpLocalStorage,
            HttpSessionStorage,
            HttpStorageEvent,
            sessionStorage: $scope().sessionStorage || new HttpSessionStorage(),
            localStorage: $scope().localStorage || new HttpLocalStorage()
        };

    mod = modulePrototype.extend( mod );

    return mod.expose( mod, INTERNAL_NAME, (_ud !== typeof module ? module : mod) ) || mod;

}());
