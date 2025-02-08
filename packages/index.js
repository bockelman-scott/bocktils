const core = require( "@toolbocks/core" );
const commonUtils = require( "@toolbocks/common" );
const jsonUtils = require( "@toolbocks/json" );
const dateUtils = require( "@toolbocks/dates" );
const base64Utils = require( "@toolbocks/base64" );
const compressionUtils = require( "@toolbocks/compression" );
const eventUtils = require( "@toolbocks/events" );
const functorUtils = require( "@toolbocks/functors" );
const mathUtils = require( "@toolbocks/math" );
const regexUtils = require( "@toolbocks/regex" );

const { constants, typeUtils, stringUtils, arrayUtils, localeUtils, NumberParser, guidUtils, } = core;

/** define a variable for typeof undefined **/
const { _ud = "undefined" } = constants;

/**
 * This function returns the host environment scope (Browser window, Node.js global, or Worker self)
 */
const $scope = constants?.$scope || function()
{
    return (_ud === typeof self ? ((_ud === typeof global) ? (_ud === typeof globalThis ? {} : globalThis || {}) : (global || (_ud === typeof globalThis ? {} : globalThis || {}) || {})) : (self || (_ud === typeof globalThis ? {} : globalThis || {})));
};

/**
 * This is the Immediately Invoked Function Expression (IIFE) that builds and returns the module
 */
(function exposeModule()
{
    // defines a key we can use to store this module in global scope
    const INTERNAL_NAME = "__BOCK__COMPLETE__";

    // if we've already executed this code, just return the module
    if ( $scope() && (null != $scope()[INTERNAL_NAME]) )
    {
        return $scope()[INTERNAL_NAME];
    }

    const modName = "ToolBocks";

    let { classes } = constants;

    const { ToolBocksModule } = classes;

    const { funcUtils, objectUtils } = commonUtils;

    const dependencies =
        {
            constants,
            typeUtils,
            stringUtils,
            arrayUtils,
            localeUtils,
            NumberParser,
            guidUtils,
            objectUtils,
            funcUtils,
            jsonUtils,
            dateUtils,
            base64Utils,
            compressionUtils,
            eventUtils,
            functorUtils,
            mathUtils,
            regexUtils
        };

    const modulePrototype = new ToolBocksModule( modName, INTERNAL_NAME );

    let mod =
        {
            dependencies,
            constants,
            typeUtils,
            stringUtils,
            arrayUtils,
            localeUtils,
            NumberParser,
            guidUtils,
            objectUtils,
            funcUtils,
            jsonUtils,
            dateUtils,
            base64Utils,
            compressionUtils,
            eventUtils,
            functorUtils,
            mathUtils,
            regexUtils
        }

    mod = modulePrototype.extend( mod );

    return mod.expose( mod, INTERNAL_NAME, (_ud !== typeof module ? module : mod) ) || mod;

}());
