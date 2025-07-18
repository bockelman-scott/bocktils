const core = require( "@toolbocks/core" );

const jsonUtils = require( "@toolbocks/json" );

const objectUtils = require( "./ObjectUtils.cjs" );

const entityUtils = require( "./EntityUtils.cjs" );

const { moduleUtils, constants, typeUtils, stringUtils, arrayUtils, localeUtils, NumberParser, guidUtils } = core;

const { _ud = "undefined" } = constants;

const $scope = constants?.$scope || function()
{
    return (_ud === typeof self ? ((_ud === typeof global) ? ((_ud === typeof globalThis ? {} : globalThis)) : (global || {})) : (self || {}));
};

(function exposeModule()
{
    const INTERNAL_NAME = "__BOCK__COMMON_UTILITIES__";

    if ( $scope() && (null != $scope()[INTERNAL_NAME]) )
    {
        return $scope()[INTERNAL_NAME];
    }

    const { ModuleEvent, ToolBocksModule } = moduleUtils;

    if ( _ud === typeof CustomEvent )
    {
        CustomEvent = ModuleEvent;
    }

    const modulePrototype = new ToolBocksModule( "CommonUtils", INTERNAL_NAME );

    let mod =
        {
            constants,
            typeUtils,
            stringUtils,
            arrayUtils,
            localeUtils,
            NumberParser,
            guidUtils,
            objectUtils,
            entityUtils,
            jsonUtils,
            dependencies:
                {
                    constants,
                    typeUtils,
                    stringUtils,
                    arrayUtils,
                    localeUtils,
                    guidUtils,
                    objectUtils,
                    entityUtils,
                    jsonUtils,
                }
        };

    mod = modulePrototype.extend( mod );

    return mod.expose( mod, INTERNAL_NAME, (_ud !== typeof module ? module : mod) ) || mod;
}());
