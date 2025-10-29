// noinspection JSCheckFunctionSignatures

/**
 * @fileOverview
 * @author Scott Bockelman
 * @license MIT
 */

/* import dependencies */
const core = require( "@toolbocks/core" );

const collectionModule = require( "./Collection.js" );
const sortedSetModule = require( "./SortedSet.js" );

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

    const { TYPES, Collection } = collectionModule;

    const { SortedSet } = sortedSetModule;

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
                    sortedSetModule
                },
            classes:
                {
                    Collection,
                    SortedSet
                },
            TYPES,
            Collection,
            SortedSet
        };

    mod = toolBocksModule.extend( mod );

    return mod.expose( mod, INTERNAL_NAME, (_ud !== typeof module ? module : mod) ) || mod;

}());
