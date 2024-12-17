const constants = require( "./Constants.cjs" );
const typeUtils = require( "./TypeUtils.cjs" );
const stringUtils = require( "./StringUtils.cjs" );
const arrayUtils = require( "./ArrayUtils.cjs" );
const localeUtils = require( "./LocaleUtils.cjs" );
const numberParser = require( "./NumberParser.cjs" );
const guidUtils = require( "./GUIDUtils.cjs" );

const { _ud = "undefined" } = constants;

const $scope = constants?.$scope || function()
{
    return (_ud === typeof self ? ((_ud === typeof global) ? ((_ud === typeof globalThis ? {} : globalThis)) : (global || {})) : (self || {}));
};

(function exposeModule()
{
    const INTERNAL_NAME = "__BOCK__CORE_UTILITIES__";

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

    const { NumberParser } = numberParser;

    const modulePrototype = new ModulePrototype( "CoreUtils", INTERNAL_NAME );

    let mod =
        {
            constants,
            typeUtils,
            stringUtils,
            arrayUtils,
            localeUtils,
            NumberParser,
            guidUtils,
            dependencies:
                {
                    constants,
                    typeUtils,
                    stringUtils,
                    arrayUtils,
                    localeUtils,
                    numberParser,
                    guidUtils
                }
        };

    mod = modulePrototype.extend( mod );

    return mod.expose( mod, INTERNAL_NAME, (_ud !== typeof module ? module : mod) ) || mod;

}());
