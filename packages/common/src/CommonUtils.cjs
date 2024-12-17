const core = require( "../../core/src/CoreUtils.cjs" );

const funcUtils = require( "./FunctionUtils.cjs" );

const objectUtils = require( "./ObjectUtils.cjs" );

const jsonUtils = require( "../../json/src/JsonUtils.cjs" );

const { constants, typeUtils, stringUtils, arrayUtils, localeUtils, NumberParser, guidUtils } = core;

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

    const { classes } = constants;

    const { ModuleEvent, ModulePrototype } = classes;

    if ( _ud === typeof CustomEvent )
    {
        CustomEvent = ModuleEvent;
    }

    const modulePrototype = new ModulePrototype( "CommonUtils", INTERNAL_NAME );

    let mod =
        {
            constants,
            typeUtils,
            stringUtils,
            arrayUtils,
            localeUtils,
            NumberParser,
            guidUtils,
            funcUtils,
            objectUtils,
            jsonUtils,
            dependencies:
                {
                    constants,
                    typeUtils,
                    stringUtils,
                    arrayUtils,
                    localeUtils,
                    guidUtils,
                    funcUtils,
                    objectUtils,
                    jsonUtils,
                }
        };

    mod = modulePrototype.extend( mod );

    return mod.expose( mod, INTERNAL_NAME, (_ud !== typeof module ? module : mod) ) || mod;

}());
