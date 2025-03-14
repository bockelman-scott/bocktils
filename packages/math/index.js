const core = require( "@toolbocks/core" );

/**
 * Establish separate constants for each of the common utilities imported
 * @see ../src/CoreUtils.cjs
 */
const { moduleUtils, constants, typeUtils, stringUtils, arrayUtils } = core;

const mathUtils = require( "./src/MathUtils.cjs" );

const distributionUtils = require( "./src/DistributionUtils.cjs" );

const { _ud = "undefined" } = constants;

const $scope = core?.$scope || constants?.$scope || function()
{
    return (_ud === typeof self ? ((_ud === typeof global) ? ((_ud === typeof globalThis ? {} : globalThis)) : (global || {})) : (self || {}));
};

(function exposeModule()
{
    const INTERNAL_NAME = "__BOCK__MATH_PACKAGE__";

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
            mathUtils,
            distributionUtils
        };

    const { ToolBocksModule } = moduleUtils;

    const modName = "MathPackage";

    const toolBocksModule = new ToolBocksModule( modName, INTERNAL_NAME );

    const {
        RoundingMode = mathUtils?.classes?.RoundingMode,
        Rational = mathUtils?.classes?.Rational,
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
        toBinary,
        asInt,
        asFloat,
        resolveNullOrNaN,
        isBetween,
        toSignificantDigits,
        product,
        quotient,
        sum,
        difference,
        ROUNDING_MODE,
        round,
        gcd,
        greatestCommonFactor,
        smallestCommonFactor,
        logN,
        calculatePower,
        DEFAULT_RATIONAL_OPTIONS,
        DEFAULT_DIVISION_OPTIONS
    } = mathUtils;

    let mod =
        {
            MathUtils: mathUtils,
            DistributionUtils: distributionUtils,
            dependencies,
            RoundingMode,
            Rational,
            ROUNDING_MODE,
            DEFAULT_RATIONAL_OPTIONS,
            DEFAULT_DIVISION_OPTIONS,
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
            toBinary,
            asInt,
            asFloat,
            resolveNullOrNaN,
            isBetween,
            toSignificantDigits,
            product,
            quotient,
            sum,
            difference,
            round,
            gcd,
            greatestCommonFactor,
            smallestCommonFactor,
            logN,
            calculatePower
        };

    mod = toolBocksModule.extend( mod );

    return mod.expose( mod, INTERNAL_NAME, (_ud !== typeof module ? module : mod) ) || mod;

}());