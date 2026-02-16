const moduleUtils = require( "./src/_ToolBocksModule.cjs" );
const constants = require( "./src/Constants.cjs" );
const typeUtils = require( "./src/TypeUtils.cjs" );
const stringUtils = require( "./src/StringUtils.cjs" );
const arrayUtils = require( "./src/ArrayUtils.cjs" );
const localeUtils = require( "./src/LocaleUtils.cjs" );
const numberParser = require( "./src/NumberParser.cjs" );
const guidUtils = require( "./src/GUIDUtils.cjs" );
const functionUtils = require( "./src/FunctionUtils.cjs" );

const { _ud = "undefined", $scope } = constants;

(function exposeModule()
{
    const INTERNAL_NAME = "__BOCK__CORE_UTILITIES__";

    if ( $scope() && (null != $scope()[INTERNAL_NAME]) )
    {
        return $scope()[INTERNAL_NAME];
    }

    const { ModuleEvent, ToolBocksModule } = moduleUtils;

    if ( _ud === typeof CustomEvent )
    {
        CustomEvent = ModuleEvent;
    }

    const { NumberParser } = numberParser;

    const toolBocksModule = new ToolBocksModule( "CoreUtils", INTERNAL_NAME );

    let mod =
        {
            moduleUtils,
            constants,
            typeUtils,
            stringUtils,
            arrayUtils,
            localeUtils,
            NumberParser,
            guidUtils,
            functionUtils,
            dependencies:
                {
                    moduleUtils,
                    constants,
                    typeUtils,
                    stringUtils,
                    arrayUtils,
                    localeUtils,
                    numberParser,
                    guidUtils,
                    functionUtils
                }
        };

    mod = toolBocksModule.extend( mod );

    return mod.expose( mod, INTERNAL_NAME, (_ud !== typeof module ? module : mod) ) || mod;

}());
