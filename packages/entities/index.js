// noinspection JSUnresolvedReference

/**
 * This module defines and exposes useful superclasses
 * and objects as well as functions useful for handling classes and entities.
 *
 */

/**
 * This statement imports the core modules:
 * Constants, TypeUtils, StringUtils, and ArrayUtils
 */
const core = require( "@toolbocks/core" );

const entityUtils = require( "./src/EntityUtils.cjs" );

const { moduleUtils, constants, typeUtils, stringUtils, arrayUtils } = core;

const {
    _ud = "undefined", $scope = constants?.$scope || function()
    {
        return (_ud === typeof self ? ((_ud === typeof global) ? {} : (global || {})) : (self || {}));
    }
} = constants;

// noinspection FunctionTooLongJS,OverlyComplexFunctionJS
(function exposeModule()
{
    const INTERNAL_NAME = "__BOCK__ENTITY_UTILS__";

    if ( $scope() && (null != $scope()[INTERNAL_NAME]) )
    {
        return $scope()[INTERNAL_NAME];
    }

    const
        {
            BockEntity,
            BockIdentified,
            BockNamed,
            BockDescribed,
            asObject,
            identical,
            same
        } = entityUtils;

    const { ToolBocksModule, OBJECT_REGISTRY = $scope()["__BOCK_OBJECT_REGISTRY__"] } = moduleUtils;

    const modName = "EntityUtils";

    const toolBocksModule = new ToolBocksModule( modName, INTERNAL_NAME );

    let mod =
        {
            dependencies:
                {
                    core,
                    moduleUtils,
                    constants,
                    typeUtils,
                    stringUtils,
                    arrayUtils
                },
            classes:
                {
                    BockEntity,
                    BockIdentified,
                    BockNamed,
                    BockDescribed
                },
            OBJECT_REGISTRY,
            BockEntity,
            BockIdentified,
            BockNamed,
            BockDescribed,
            same,
            identical
        };

    mod = toolBocksModule.extend( mod );

    return mod.expose( mod, INTERNAL_NAME, (_ud !== typeof module ? module : mod) ) || mod;

}());