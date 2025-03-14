const core = require( "@toolbocks/core" );

const { moduleUtils, constants, typeUtils, stringUtils, arrayUtils } = core;

const objectFunctorUtils = require( "./src/ObjectFunctor.cjs" );

const { ObjectFunctor } = objectFunctorUtils;

const iteratorUtils = require( "./src/IteratorUtils.cjs" );

/** define a variable for typeof undefined **/
const { _ud = "undefined", classes } = constants;

/**
 * This function returns the host environment scope (Browser window, Node.js global, or Worker self)
 */
const $scope = constants?.$scope || function()
{
    return (_ud === typeof self ? ((_ud === typeof global) ? {} : (global || {})) : (self || {}));
};

/**
 * This is the Immediately Invoked Function Expression (IIFE) that builds and returns the module
 */
(function exposeModule()
{
    // defines a key we can use to store this module in global scope
    const INTERNAL_NAME = "__BOCK__FUNCTOR_UTILS__";

    // if we've already executed this code, just return the module
    if ( $scope() && (null != $scope()[INTERNAL_NAME]) )
    {
        return $scope()[INTERNAL_NAME];
    }

    const dependencies =
        {
            moduleUtils,
            constants,
            typeUtils,
            stringUtils,
            arrayUtils,
            ObjectFunctor,
            iteratorUtils
        };

    const modName = "FunctorUtils";

    const { ToolBocksModule } = moduleUtils;

    const toolBocksModule = new ToolBocksModule( modName, INTERNAL_NAME );

    let mod =
        {
            dependencies,
            ObjectFunctor,
            iteratorUtils,
        };

    mod = toolBocksModule.extend( mod );

    return mod.expose( mod, INTERNAL_NAME, (_ud !== typeof module ? module : mod) ) || mod;

}());
