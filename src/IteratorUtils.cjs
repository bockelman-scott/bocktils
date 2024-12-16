/** import dependencies **/

const core = require( "./CoreUtils.cjs" );

const { constants, typeUtils, stringUtils, arrayUtils } = core;

/** define a variable for typeof undefined **/
const { _ud = "undefined" } = constants;

/**
 * This function returns the host environment scope (Browser window, Node.js global, or Worker self)
 */
const $scope = constants?.$scope || function()
{
    return (_ud === typeof self ? ((_ud === typeof global) ? ((_ud === typeof globalThis ? {} : globalThis)) : (global || {})) : (self || {}));
};

(function exposeModule()
{
    // defines a key we can use to store this module in global scope
    const INTERNAL_NAME = "__BOCK__ITERATOR_UTILS__";

    // if we've already executed this code, just return the module
    if ( $scope() && (null != $scope()[INTERNAL_NAME]) )
    {
        return $scope()[INTERNAL_NAME];
    }

    /**
     * An array of this module's dependencies
     * which are re-exported with this module,
     * so if you want to, you can just import the leaf module
     * and then use the other utilities as properties of that module
     */
    const dependencies =
        {
            constants,
            typeUtils,
            stringUtils,
            arrayUtils
        };

    /**
     * Create local variables for the imported values and functions we use.
     */
    const {
        _mt_str,
        _dot,
        _str,
        _fun,
        _obj,
        _num,
        _big,
        _bool,
        _symbol,
        S_WARN,
        ignore,
        AsyncFunction,
        EMPTY_ARRAY,
        populateOptions,
        localCopy,
        immutableCopy,
        lock,
        IllegalArgumentError,
        classes
    } = constants;

    const {
        isNull,
        isString,
        isEmptyString,
        isNumber,
        isInteger,
        isFloat,
        isBigInt,
        isNumeric,
        isZero,
        isOctal,
        isHex,
        isDecimal,
        isNanOrInfinite,
        toDecimal,
        toHex,
        toOctal,
        toBinary
    } = typeUtils;

    const { asInt, asFloat } = stringUtils;

    const { ModuleEvent, ModulePrototype } = classes;

    if ( _ud === typeof CustomEvent )
    {
        CustomEvent = ModuleEvent;
    }

    const modName = "IteratorUtils";

    const modulePrototype = new ModulePrototype( modName, INTERNAL_NAME );

    let mod =
        {
            dependencies
        };

    mod = modulePrototype.extend( mod );

    return mod.expose( mod, INTERNAL_NAME, (_ud !== typeof module ? module : mod) ) || mod;
}());
