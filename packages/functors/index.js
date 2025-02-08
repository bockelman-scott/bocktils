const commonUtils = require( "@toolbocks/common" );

const { constants, typeUtils, stringUtils, arrayUtils, objectUtils } = commonUtils;

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
            constants,
            typeUtils,
            stringUtils,
            arrayUtils,
            objectUtils,
            ObjectFunctor,
            iteratorUtils
        };

    const modName = "FunctorUtils";

    const { ToolBocksModule } = classes;

    const modulePrototype = new ToolBocksModule( modName, INTERNAL_NAME );

    let mod =
        {
            dependencies,
            ObjectFunctor,
            iteratorUtils,
        };

    mod = modulePrototype.extend( mod );

    return mod.expose( mod, INTERNAL_NAME, (_ud !== typeof module ? module : mod) ) || mod;

}());
