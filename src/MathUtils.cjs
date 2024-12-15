/** import dependencies **/
const constants = require( "./Constants.cjs" );
const typeUtils = require( "./TypeUtils.cjs" );
const stringUtils = require( "./StringUtils.cjs" );

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
    const INTERNAL_NAME = "__BOCK__NUMBER_UTILS__";

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
            stringUtils
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
    } = typeUtils;

    const { asInt } = stringUtils;

    const { ModuleEvent, ModulePrototype } = classes;

    if ( _ud === typeof CustomEvent )
    {
        CustomEvent = ModuleEvent;
    }

    const modName = "NumberUtils";

    const modulePrototype = new ModulePrototype( modName, INTERNAL_NAME );



}());


function decimalToBinary( num )
{
    if ( num === 0 )
    {
        return "0";
    }

    let binary = "";
    let integerPart = Math.floor( num );
    let fractionalPart = num - integerPart;

    // Integer part conversion
    while ( integerPart > 0 )
    {
        binary = (integerPart % 2) + binary;
        integerPart = Math.floor( integerPart / 2 );
    }

    // Fractional part conversion
    binary += ".";
    while ( fractionalPart > 0 )
    {
        if ( binary.length > 32 )
        { // Adjust precision as needed
            break;
        }
        fractionalPart *= 2;
        binary += Math.floor( fractionalPart );
        fractionalPart -= Math.floor( fractionalPart );
    }

    return binary;
}