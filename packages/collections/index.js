// noinspection JSCheckFunctionSignatures

/**
 * @fileOverview
 * @author Scott Bockelman
 * @license MIT
 */

// noinspection FunctionTooLongJS
/**
 * This module is constructed by an Immediately Invoked Function Expression (IIFE).
 * see: <a href="https://developer.mozilla.org/en-US/docs/Glossary/IIFE">MDN: IIFE</a> for more information on this design pattern
 */
(function exposeModule()
{
    const core = require( "@toolbocks/core" );

    const datesModule = require( "@toolbocks/dates" );

    const collectionModule = require( "./Collection.js" );
    const mapsModule = require( "./Maps.js" );
    const sortedSetModule = require( "./SortedSet.js" );
    const entityGenerator = require( "./EntityGenerator.js" );
    const cacheModule = require( "./Cache.js" );

    const { moduleUtils, constants, typeUtils, stringUtils, arrayUtils } = core;

    const { ToolBocksModule } = moduleUtils;

    const { TYPES, Collection } = collectionModule;

    const { SortedSet } = sortedSetModule;

    const { PropertyAccessMap, TreeMap, ValueOrderedMap, BoundedMap } = mapsModule;

    const { EntityGenerator, AsyncEntityGenerator, PaginatedEntityGenerator } = entityGenerator;

    const { BoundedCache, ExpiringCache, createKey } = cacheModule;

    /* define a variable for typeof undefined */
    const { _ud = "undefined", $scope } = constants;

    // defines a key we can use to store this module in global scope
    const INTERNAL_NAME = "__BOCK_COLLECTION_UTILS__";

    // if we've already executed this code, just return the module
    if ( $scope() && (null != $scope()[INTERNAL_NAME]) )
    {
        return $scope()[INTERNAL_NAME];
    }

    const modName = "BockCollectionUtils";

    let toolBocksModule = new ToolBocksModule( modName, INTERNAL_NAME );

    let mod =
        {
            dependencies:
                {
                    moduleUtils,
                    constants,
                    typeUtils,
                    stringUtils,
                    arrayUtils,
                    collectionModule,
                    mapsModule,
                    sortedSetModule,
                    entityGenerator,
                    cacheModule
                },
            classes:
                {
                    Collection,
                    SortedSet,
                    PropertyAccessMap,
                    TreeMap,
                    ValueOrderedMap,
                    BoundedMap,
                    EntityGenerator,
                    AsyncEntityGenerator,
                    PaginatedEntityGenerator,
                    BoundedCache,
                    ExpiringCache
                },
            TYPES,
            Collection,
            SortedSet,
            PropertyAccessMap,
            TreeMap,
            ValueOrderedMap,
            BoundedMap,
            EntityGenerator,
            AsyncEntityGenerator,
            PaginatedEntityGenerator,
            BoundedCache,
            ExpiringCache,
            createKey
        };

    mod = toolBocksModule.extend( mod );

    return mod.expose( mod, INTERNAL_NAME, (_ud !== typeof module ? module : mod) ) || mod;

}());
