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
const { _ud = "undefined", $scope } = constants;

// noinspection FunctionTooLongJS
/**
 * This module is constructed by an Immediately Invoked Function Expression (IIFE).
 * see: <a href="https://developer.mozilla.org/en-US/docs/Glossary/IIFE">MDN: IIFE</a> for more information on this design pattern
 */
(function exposeModule()
{
    // defines a key we can use to store this module in global scope
    const INTERNAL_NAME = "__BOCK_COLLECTION_UTILS_ENTITY_GEN_";

    // if we've already executed this code, just return the module
    if ( $scope() && (null != $scope()[INTERNAL_NAME]) )
    {
        return $scope()[INTERNAL_NAME];
    }

    const { moduleUtils, constants, typeUtils, stringUtils, arrayUtils } = core;

    const { ToolBocksModule, ModuleEvent, attempt, asyncAttempt, sleep, lock, no_op, $ln } = moduleUtils;

    const { isNull, isObject, isNonNullObject, isFunction, clamp = moduleUtils.clamp } = typeUtils;

    const { asInt } = stringUtils;

    const { asArray } = arrayUtils;

    const { TYPES, Collection } = collectionModule;

    const modName = "BockCollectionUtils_EntityGenerator";

    let toolBocksModule = new ToolBocksModule( modName, INTERNAL_NAME );


    async function passThrough( pId )
    {
        return Promise.resolve( new Number( asInt( pId ) ) );
    }

    /**
     * Couples a collection of entity IDs with a function to fetch each entity
     * and return them one at a time to a consumer using "for await of"
     *
     * This is intended to provide iteration over a collection
     * without loading all the entities into memory first.
     *
     * Can be configured to apply its own internal throttling if necessary or desired.
     *
     * @class
     */
    class EntityGenerator extends EventTarget
    {
        /**
         * Holds the collection of entity ID values
         *
         * @type {Array.<number>}
         */
        #ids = [];

        /**
         * The function to retrieve an entity by its ID.
         * It is expected to be an asynchronous function, but that is not enforced.
         *
         * @type {AsyncFunction|Function}
         */
        #fetchEntityFunction;

        /**
         * An object specifying rate limits in terms of allowed requests per second, minute, hour, and/or day.
         * @type {{SECOND: number, MINUTE: number}}
         */
        #fetchesPer = { SECOND: 0, MINUTE: 0 };

        constructor( pIds = [], pFetchEntityFunction = passThrough, pFetchesPer = { SECOND: 0, MINUTE: 0 } )
        {
            super();

            // we do not hold a strong reference to the array specified
            // there are several reasons for this, the most fundamental of which is that it would violate encapsulation
            // but also because it allows us to fully control and own the array
            this.#ids.push( ...(asArray( pIds ?? [] )) );

            // if no function has been supplied, we use a default which returns each ID as an Object
            this.#fetchEntityFunction = isFunction( pFetchEntityFunction ) ? pFetchEntityFunction : passThrough;

            this.#fetchesPer = { ...(this.#fetchesPer), ...(pFetchesPer ?? {}) };
        }

        get ids()
        {
            return lock( asArray( this.#ids ?? [] ) );
        }

        _addIds( ...pIds )
        {
            this.#ids.push( ...(asArray( pIds ?? [] )) );
        }

        get size()
        {
            return $ln( this.ids );
        }

        get fetchEntityFunction()
        {
            return (async( pId ) => await (this.#fetchEntityFunction ?? no_op)( pId ));
        }

        get numFetchesPerSecond()
        {
            return clamp( asInt( this.#fetchesPer["SECOND"], 0 ) || 0, 0, 1_000 );
        }

        get numFetchesPerMinute()
        {
            return clamp( asInt( this.#fetchesPer["MINUTE"], 0 ) || 0, 0, 3_600 );
        }

        get numFetchesPerHour()
        {
            const defaultFetches = this.numFetchesPerMinute * 60;

            return clamp( asInt( this.#fetchesPer["HOUR"], defaultFetches ) || defaultFetches, Math.floor( defaultFetches / 3 ), defaultFetches * 10 );
        }

        get numFetchesPerDay()
        {
            const defaultFetches = this.numFetchesPerHour * 24;

            return clamp( asInt( this.#fetchesPer["DAY"], defaultFetches ) || defaultFetches, Math.floor( defaultFetches / 3 ), defaultFetches * 10 );
        }

        calculateDelay()
        {
            let perSecond = this.numFetchesPerSecond;
            let perMinute = this.numFetchesPerMinute;
            let perHour = this.numFetchesPerHour || asInt( perMinute * 60 );
            let perDay = this.numFetchesPerDay || asInt( perHour * 24 );

            if ( perSecond <= 0 && perMinute <= 0 )
            {
                return 0;
            }

            let millisPerSecond = 1_000;
            let millisPerMinute = 60 * millisPerSecond;
            let millisPerHour = 60 * millisPerMinute;
            let millisPerDay = 24 * millisPerHour;

            let lowerBound = Math.floor( millisPerSecond / perSecond );
            let upperBound = Math.floor( millisPerMinute / perMinute );

            return clamp( Math.max( lowerBound, upperBound ), 0, Math.floor( millisPerDay / Math.max( 1, perDay ) ) * 2 );
        }

        [Symbol.asyncIterator]()
        {
            let index = 0;

            const ids = asArray( this.#ids ?? [] );

            const fetchEntity = this.#fetchEntityFunction ?? passThrough;

            const delay = asInt( this.calculateDelay() );

            // Return the iterator object
            return {
                async next()
                {
                    if ( index >= ids.length )
                    {
                        return { value: undefined, done: true };
                    }

                    if ( delay > 0 )
                    {
                        await asyncAttempt( async() => await sleep( Math.max( 16, delay ) ) );
                    }

                    try
                    {
                        let currentId = ids[index++];

                        let entity = await asyncAttempt( async() => await fetchEntity( currentId ) );

                        if ( isNonNullObject( entity ) )
                        {
                            return { value: entity, done: false };
                        }
                        else
                        {
                            let tries = 0;

                            while ( (isNull( entity ) || !isObject( entity )) && (tries++ < 3) )
                            {
                                await sleep( 64 * (1 + tries) );
                                entity = await asyncAttempt( async() => await fetchEntity( currentId ) );
                            }

                            if ( isNonNullObject( entity ) )
                            {
                                attempt( () => this.dispatchEvent( new ModuleEvent( "NextEntity",
                                                                                    {
                                                                                        detail: currentId,
                                                                                        entity,
                                                                                        target: this
                                                                                    }, currentId, entity, this ) ) );
                                return { value: entity, done: false };
                            }
                            else
                            {
                                if ( index < (ids.length - 1) )
                                {
                                    attempt( () => this.dispatchEvent( new ModuleEvent( "FetchFailed",
                                                                                        {
                                                                                            detail: currentId,
                                                                                            target: this
                                                                                        }, currentId, this ) ) );

                                    currentId = ids[index++];

                                    entity = await asyncAttempt( async() => await fetchEntity( currentId ) );

                                    if ( isNonNullObject( entity ) )
                                    {
                                        attempt( () => this.dispatchEvent( new ModuleEvent( "NextEntity",
                                                                                            {
                                                                                                detail: currentId,
                                                                                                entity,
                                                                                                target: this
                                                                                            }, currentId, entity, this ) ) );
                                        return { value: entity, done: false };
                                    }
                                }
                            }
                        }
                    }
                    catch( error )
                    {
                        attempt( () => this.dispatchEvent( new ModuleEvent( "error",
                                                                            {
                                                                                error,
                                                                                target: this
                                                                            }, error, this ) ) );

                        throw new Error( `Could not fetch entity for ID at index ${index - 1}: ${error.message}`, error );
                    }
                }
            };
        }
    }

    /**
     * An implementation of EntityGenerator that uses a Generator to provide the async iterator.
     *
     * @class
     */
    class AsyncEntityGenerator extends EntityGenerator
    {
        constructor( pIds = [], pFetchEntityFunction = no_op, pFetchesPer = { SECOND: 0, MINUTE: 0 } )
        {
            super( pIds, pFetchEntityFunction, pFetchesPer );
        }

        async* [Symbol.asyncIterator]()
        {
            const delay = asInt( this.calculateDelay() );

            const arr = [...asArray( this.ids ?? [] )];

            while ( $ln( arr ) > 0 )
            {
                if ( delay > 0 )
                {
                    await asyncAttempt( async() => await sleep( Math.max( 16, delay ) ) );
                }

                let id = arr.shift();

                try
                {
                    let entity = await asyncAttempt( async() => await this.fetchEntityFunction( id ) );

                    if ( isNonNullObject( entity ) )
                    {
                        attempt( () => this.dispatchEvent( new ModuleEvent( "NextEntity",
                                                                            {
                                                                                detail: id,
                                                                                entity,
                                                                                target: this
                                                                            }, id, entity, this ) ) );
                        yield entity;
                    }
                    else
                    {
                        let tries = 0;

                        while ( (isNull( entity ) || !isObject( entity )) && (tries++ < 3) )
                        {
                            await sleep( 64 * (1 + tries) );
                            entity = await asyncAttempt( async() => await this.fetchEntityFunction( id ) );
                        }

                        if ( isNonNullObject( entity ) )
                        {
                            attempt( () => this.dispatchEvent( new ModuleEvent( "NextEntity",
                                                                                {
                                                                                    detail: id,
                                                                                    entity,
                                                                                    target: this,
                                                                                    retries: tries
                                                                                }, id, entity, tries, this ) ) );
                            yield entity;
                        }
                        else
                        {
                            if ( $ln( arr ) > 0 )
                            {
                                await sleep( delay );

                                id = arr.shift();
                                entity = await asyncAttempt( async() => await this.fetchEntityFunction( id ) );
                            }

                            if ( isNonNullObject( entity ) )
                            {
                                attempt( () => this.dispatchEvent( new ModuleEvent( "NextEntity",
                                                                                    {
                                                                                        detail: id,
                                                                                        entity,
                                                                                        target: this
                                                                                    }, id, entity, this ) ) );
                            }

                            yield entity;
                        }
                    }
                }
                catch( error )
                {
                    attempt( () => this.dispatchEvent( new ModuleEvent( "error",
                                                                        {
                                                                            error,
                                                                            id,
                                                                            target: this
                                                                        }, error, id, this ) ) );

                    throw new Error( `Could not fetch entity for ID, ${id}: ${error.message}`, error );
                }
            }
        }
    }


    class PaginatedEntityGenerator
    {
        // TODO: see C:\Projects\BrysonApps\paginated_iterator_example.js
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
                    EntityGenerator,
                    AsyncEntityGenerator,
                    PaginatedEntityGenerator
                },
            Collection,
            EntityGenerator,
            AsyncEntityGenerator,
            PaginatedEntityGenerator
        };

    mod = toolBocksModule.extend( mod );

    return mod.expose( mod, INTERNAL_NAME, (_ud !== typeof module ? module : mod) ) || mod;

}());
