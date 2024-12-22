const core = require( "@toolbocks/core" );

const { constants, typeUtils, stringUtils, arrayUtils } = core;

/* define a variable for typeof undefined **/
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
    const INTERNAL_NAME = "__BOCK__MATH_UTILS__";

    // if we've already executed this code, just return the module
    if ( $scope() && (null != $scope()[INTERNAL_NAME]) )
    {
        return $scope()[INTERNAL_NAME];
    }

    /**
     * This is a dictionary of this module's dependencies.
     * <br>
     * It is exported as a property of this module,
     * allowing us to just import a leaf module
     * and then use the other utilities as properties of that module.
     * <br>
     * @dict
     * @type {Object}
     */
    const dependencies =
        {
            constants,
            typeUtils,
            stringUtils,
            arrayUtils
        };

    /*
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

    /**
     * This is the error message used when a non-numeric argument is passed to a method expecting a number.
     * @const
     * @type {string}
     */
    const ERROR_MSG_NON_NUMERIC = "This function requires a numeric argument";

    /**
     * This is the error message used when division by zero is detected.
     * @const
     * @type {string}
     */
    const ERROR_MSG_DIVISION_BY_ZERO = "Division by Zero Detected.  Returning Default Quotient";

    /**
     * This is the name of this module
     * @const
     * @type {string}
     */
    const modName = "MathUtils";

    /**
     * This is the object that is returned from this function.
     * <br>
     * This object is the MathUtils module.<br>
     * <br>
     * The functions defined in this file are added to the module before it is exported and returned.
     * <br>
     * @type {ModulePrototype}
     * @module MathUtils
     */
    const modulePrototype = new ModulePrototype( modName, INTERNAL_NAME );

    /**
     * Returns a valid number regardless of its argument.<br>
     * <br>
     * If the argument specified is a number<br>
     * (or a string that can be coerced to a number),<br>
     * and that number is not NaN or Infinity,<br>
     * that number is returned unmodified.<br>
     * <br>
     * If the argument specified is not numeric or is NaN or Infinity,<br>
     * the specified default is returned (subject to the same criteria).<br>
     * <br>
     * If the default specified is also NaN or Infinity,<br>
     * this function returns zero (0).<br>
     * @param {number|string} pNum A number or string that can be converted into a number
     * @param {number|string} pDefault A number or string that can be converted into a number to be returned if the first argument is NaN or Infinity
     * @returns {number} A valid number that is neither NaN nor Infinity
     */
    const resolveNullOrNaN = function( pNum, pDefault = 0 )
    {
        const me = this;

        if ( !isNumeric( pNum ) )
        {
            modulePrototype.reportError( new IllegalArgumentError( ERROR_MSG_NON_NUMERIC ), ERROR_MSG_NON_NUMERIC, S_WARN, modulePrototype.calculateErrorSourceName( modName, me ) );

            return resolveNullOrNaN( pDefault, 0 );
        }

        const num = isNaN( pNum ) || !isFinite( pNum ) ? NaN : asFloat( pNum );

        if ( !isNanOrInfinite( num ) )
        {
            return num;
        }

        return resolveNullOrNaN( pDefault, 0 );
    };

    /**
     * Returns true if the specified argument<br>
     * is greater than (or equal to, if inclusive is true) the lower bound<br>
     * and less than (or equal to, if inclusive is true) the upper bound.<br>
     * <br>
     * The default for inclusive is true.<br>
     * <br>
     * @param {number|string} pNum A number (or string that can be converted into a number) to evaluate
     * @param {number|string} pLowerBound A number (or string that can be converted into a number) that the first argument must be greater than or equal to
     * @param {number|string} pUpperBound A number (or string that can be converted into a number) that the first argument must be less than or equal to
     * @param {boolean} [pInclusive=true] A boolean indicating whether the number must be strictly greater than the lower bound and less than the upper bound or can also be equal to either
     * @returns {boolean} true if the specified value is greater than or equal to the lower bound and less than or equal to the upper bound
     */
    const isBetween = function( pNum, pLowerBound, pUpperBound, pInclusive = true )
    {
        const num = resolveNullOrNaN( pNum );

        const lower = resolveNullOrNaN( pLowerBound );
        const upper = resolveNullOrNaN( pUpperBound );

        const inclusive = !!pInclusive;

        return inclusive ? ((num >= lower) && (num <= upper)) : ((num > lower) && (num < upper));
    };

    /**
     * @typedef DivisionOptions
     * @property {number} byZero The value to return if the divisor is zero (0)
     * @property {number} [defaultDividend=1] The value to use as the dividend, or numerator, when the specified value is NaN or Infinity
     * @property {number} [defaultDivisor=1] The value to use as the divisor, or denominator, when the specified value is NaN or Infinity
     * @property {number} [defaultQuotient=0] The value to return if the result is NaN or Infinity
     */

    const DEFAULT_OPTIONS_DIVISION =
        {
            byZero: Infinity,
            defaultDividend: 1,
            defaultDivisor: 1,
            defaultQuotient: 0,
        };

    /**
     * Returns a valid result of dividing the first argument by the second,<br>
     * handling division by zero or invalid arguments<br>
     * as defined by the options specified.<br>
     * <br>
     * @see {@link DivisionOptions}
     *
     * @param {number|string} pDividend A number which will be divided by the second argument
     *
     * @param {number|string} pDivisor  A number which will be used as the divisor, or denominator.<br>
     *                                  That is, this is the value by which the dividend will be divided.<br>
     *
     * @param {DivisionOptions|object} pOptions An object providing one or more of the properties<br>
     *                                          defined in the DivisionOptions type definition<br>
     *                                          to define how to handle Null, NaN, or Infinity<br>
     *                                          or attempted division by zero.<br>
     *
     * @returns {number} The result of dividing the first argument by the second,<br>
     *                   gracefully handling invalid arguments or attempted division by zero (0)
     */
    const quotient = function( pDividend, pDivisor, pOptions = DEFAULT_OPTIONS_DIVISION )
    {
        const me = this;

        const options = populateOptions( pOptions, DEFAULT_OPTIONS_DIVISION );

        const dividend = resolveNullOrNaN( pDividend, resolveNullOrNaN( options.defaultDividend ) );

        if ( isZero( dividend ) )
        {
            return 0;
        }

        const divisor = resolveNullOrNaN( pDivisor, resolveNullOrNaN( options.defaultDivisor ) );

        if ( isZero( divisor ) )
        {
            modulePrototype.reportError( new IllegalArgumentError( ERROR_MSG_DIVISION_BY_ZERO ), ERROR_MSG_DIVISION_BY_ZERO, S_WARN, modulePrototype.calculateErrorSourceName( modName, me ) );

            return resolveNullOrNaN( options.byZero, resolveNullOrNaN( options.defaultQuotient, 0 ) );
        }

        if ( 1 === divisor )
        {
            return resolveNullOrNaN( dividend, resolveNullOrNaN( options.defaultDividend ) );
        }

        return resolveNullOrNaN( dividend / divisor, resolveNullOrNaN( options.defaultQuotient ) );
    };



    let mod =
        {
            dependencies,
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
            quotient,

        };

    mod = modulePrototype.extend( mod );

    return mod.expose( mod, INTERNAL_NAME, (_ud !== typeof module ? module : mod) ) || mod;
}());
