/**
 * @fileOverview
 *
 * This module provides the most useful basic mathematical operations
 * often necessary in applications handling financial data or engineering specifications.<br>
 * <br>
 * This module exports an extensible rounding function
 * that allows you to plug in additional rounding modes
 * if the built-in modes do not fit your purpose.<br>
 * <br>
 * Built-in rounding modes include:<br>
 * <ul>
 *     <li>HalfUp</li>
 *     <li>HalfDown</li>
 *     <li>HalfEven</li>
 *     <li>HalfOdd</li>
 *     <li>HalfEvenTowardsInfinity</li>
 *     <li>HalfAwayFromZero</li>
 *     <li>HalfTowardsInfinity</li>
 *     <li>Trunc</li>
 * </ul>
 * <br>
 * Each of these rounding modes supports rounding to any precision (number of decimals) up to an including 2<sup>31</sup>
 * <br>
 * <br>
 * Other useful functions include:<br>
 * <ul>
 *     <li>
 *         resolveNullOrNaN - a function that is guaranteed to return a numeric value<br>
 *         regardless of the type of (or lack of) input
 *         <br>
 *     </li>
 *     <li>
 *         isBetween - a function that determines if a value falls between any two other values<br>
 *     </li>
 *     <li>
 *         calculatePower - a function that returns logN(x) where N can be any base<br>
 *     </li>
 *     <li>
 *         toSignificantDigits - a function that will round a value to the number of significant digits<br>
 *     </li>
 *     <li>
 *         decimalExpansion - a function that will return a string in decimal format<br>
 *         from a value specified using scientific notation<br>
 *     </li>
 *     <li>
 *         quotient - a function that will 'safely' divide any two values,<br>
 *         even if the divisor is 0<br><br>
 *         The value returned will be more accurate than using the / operator.
 *     </li>
 *    <li>
 *         product - a function that will multiply any number of values<br>
 *         The value returned will be more accurate than using the * operator.
 *     </li>
 *    <li>
 *         greatestCommonFactor - a function that will returns the greatest common factor of one or more numbers.<br>
 *     </li>
 *     <li>
 *         smallestCommonFactor - a function that will returns the smallest common factor shared by one or more numbers.<br>
 *     </li>
 *     <li>
 *         smallestCommonFactor - a function that will returns the smallest common factor shared by one or more numbers.<br>
 *     </li>
 * </ul>
 *
 *
 * @author Scott Bockelman
 * @license MIT
 * @module MathUtils
 */

const core = require( "@toolbocks/core" );

const { constants, typeUtils, stringUtils, arrayUtils } = core;

/* define a variable for typeof undefined **/
const { _ud = "undefined" } = constants;

/**
 * This function returns the host environment scope (Browser window, Node.js global, or Worker self)
 * @type {function():Object}
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
     * allowing us to just import this module<br>
     * and then use the other utilities as properties of this module.
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

    const { ModuleEvent, ModulePrototype } = classes;

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
        toBinary,
        isClass
    } = typeUtils;

    const { asString, asInt, asFloat, isValidNumber, lcase } = stringUtils;

    const { asArray, varargs } = arrayUtils;

    if ( _ud === typeof CustomEvent )
    {
        CustomEvent = ModuleEvent;
    }

    /**
     * This is the error message used when a non-numeric argument is passed
     * to a method expecting a number.
     *
     * @const
     * @type {string}
     * @alias module:MathUtils#ERROR_MSG_NON_NUMERIC
     * @private
     */
    const ERROR_MSG_NON_NUMERIC = "This function requires a numeric argument";

    /**
     * This is the error message used when division by zero is detected.
     *
     * @const
     * @type {string}
     * @alias module:MathUtils#ERROR_MSG_DIVISION_BY_ZERO
     * @private
     */
    const ERROR_MSG_DIVISION_BY_ZERO = "Division by Zero Detected.  Returning Default Quotient";

    /**
     * The maximum value used to reduce inaccuracies<br>
     * in division, multiplication, addition, and subtraction<br>
     * of floating-point values
     *
     * @type {number}
     * @private
     */
    const MAX_FACTOR = 10 ** 15;

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
     *
     * @param {number|string} pNum A number or string that can be converted into a number
     * @param {number|string} pDefault A number or string that can be converted into a number to be returned if the first argument is NaN or Infinity
     *
     * @returns {number} A valid number that is neither NaN nor Infinity
     *
     * @alias module:MathUtils.resolveNullOrNaN
     */
    const resolveNullOrNaN = function( pNum, pDefault = 0 )
    {
        if ( !isNumeric( pNum ) )
        {
            modulePrototype.reportError( new IllegalArgumentError( ERROR_MSG_NON_NUMERIC ), ERROR_MSG_NON_NUMERIC, S_WARN, modulePrototype.calculateErrorSourceName( modName, resolveNullOrNaN ), pNum );

            return resolveNullOrNaN( pDefault, 0 );
        }

        const num = (isString( pNum ) && !isDecimal( pNum )) ? asFloat( pNum ) : parseFloat( pNum );

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
     *
     * @param {number|string} pNum A number (or string that can be converted into a number) to evaluate
     * @param {number|string} pLowerBound A number (or string that can be converted into a number) that the first argument must be greater than or equal to
     * @param {number|string} pUpperBound A number (or string that can be converted into a number) that the first argument must be less than or equal to
     * @param {boolean} [pInclusive=true] A boolean indicating whether the number must be strictly greater than the lower bound and less than the upper bound or can also be equal to either
     *
     * @returns {boolean} true if the specified value is greater than or equal to the lower bound and less than or equal to the upper bound
     *
     * @alias module:MathUtils.isBetween
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
     * Calculates the power (logarithm base) of a given number relative to a specific base.<br>
     * <br>
     * The result is the ceiling value of the logarithm of the absolute value of the number.<br>
     * <br>
     * By default, the base is 10.
     *
     * @param {number|BigInt} pNum - The number for which the power is to be calculated.<br>
     *                               If the number is 0, returns 0.
     *
     * @param {number|BigInt} [pBase=10] - The base for the logarithmic calculation.<br>
     *                                     If not provided, defaults to 10.<br>
     *
     * @return {number} The calculated power as the ceiling value of the respective logarithm operation.
     *
     * @alias module:MathUtils.calculatePower
     */
    function calculatePower( pNum, pBase = 10 )
    {
        let num = resolveNullOrNaN( pNum );

        if ( 0 === num )
        {
            return 0;
        }

        let base = resolveNullOrNaN( pBase, 10 );

        if ( isBigInt( num ) || isBigInt( base ) )
        {
            base = BigInt( base );
            num = BigInt( num );
        }

        let log = Math.log10;

        switch ( base )
        {
            case 10:
                log = Math.log10;
                break;

            case Math.E:
                log = Math.log; // Natural logarithm (base e)
                break;

            case 2:
                log = Math.log2; // Logarithm base 2
                break;

            default:
                log = ( x ) => Math.log( x ) / Math.log( base ); // Generic logarithm base 'base'
                break;
        }

        return Math.ceil( log( Math.abs( num ) ) );
    }

    /**
     * Another name for calculatePower function.<br>
     * <br>
     * The result is the ceiling value of the logarithm of the absolute value of the number.<br>
     * <br>
     * By default, the base is 10.
     *
     * @param {number|BigInt} pNum - The number for which the power is to be calculated.<br>
     *                               If the number is 0, returns 0.
     * @param {number|BigInt} [pBase=10] - The base for the logarithmic calculation.<br>
     *                                     If not provided, defaults to 10.<br>
     *
     * @return {number} The calculated power as the ceiling value of the respective logarithm operation.
     *
     * @alias module:MathUtils.logN
     */
    const logN = calculatePower;

    /**
     * Returns a value adjusted to the specified number of significant digits.<br>
     * <br>
     *
     * @param {number|BigInt} pNum The number to adjust to significant digits.<br>
     *                             If null or not a number, defaults to 0.
     *
     * @param {number|BigInt} pSignificantDigits The number of significant digits to retain.<br>
     *                                           If null or invalid, defaults to the number of digits in the input number.
     *                                           <br>
     *
     * @return {number|BigInt} The number adjusted to the specified number of significant digits.
     *
     * @alias module:MathUtils.toSignificantDigits
     */
    function toSignificantDigits( pNum, pSignificantDigits )
    {
        let useBigInt = false;

        let num = resolveNullOrNaN( pNum );

        let power = calculatePower( num );

        if ( isBigInt( num ) || isBigInt( power ) )
        {
            num = BigInt( num );
            power = BigInt( power );
            useBigInt = true;
        }

        let significantDigits = resolveNullOrNaN( pSignificantDigits, power );
        significantDigits = Math.max( useBigInt ? 1n : 1, useBigInt ? BigInt( significantDigits ) : significantDigits );

        let factor = Math.pow( useBigInt ? 10n : 10, useBigInt ? BigInt( significantDigits ) - BigInt( power ) : significantDigits - power );

        return Math.round( num * factor ) / factor;
    }

    /**
     * Returns a number specified in scientific notation as its decimal expansion string.<br>
     * <br>
     *
     * @param {string|number} pScientificNotation - The number in scientific notation format,<br>
     *                                              either as a string or a number.<br>
     *
     * @return {string} The decimal expansion of the specified number as a string.<br>
     *
     * @alias module:MathUtils.decimalExpansion
     */
    function decimalExpansion( pScientificNotation )
    {
        const sNum = lcase( asString( pScientificNotation, true ) );

        const parts = sNum.split( /[eE]/i );

        let coefficient = parseFloat( parts[0] );

        let exponent = parseInt( (parts.length > 1 ? parts[1] : 0), 10 );

        coefficient = isBigInt( coefficient ) || isBigInt( exponent ) ? BigInt( coefficient ) : coefficient;
        exponent = isBigInt( coefficient ) || isBigInt( exponent ) ? BigInt( exponent ) : exponent;

        return (coefficient * (10 ** exponent)).toFixed( Math.abs( exponent ) );
    }

    /**
     * Converts a floating point value to an integer by multiplying by the power necessary<br>
     * and then returns detailed information about this integer representation of the specified value,<br>
     * including the resulting integer value, the exponent used to convert the specified value, and the original value.<br>
     *
     * @param {number|string} pNum - The number or numeric value,<br>
     *                               which can be a number or a string representation of a number<br>
     *
     * @return {Object} An object containing the resulting integer value (`int`),
     *                  exponential value (`exp`), and the original value (`original`).
     *
     * @private
     */
    function integerInfo( pNum )
    {
        const num = (isString( pNum ) && isDecimal( pNum )) ? pNum : resolveNullOrNaN( pNum );

        let s = asString( num ).replace( /n$/i, _mt_str ).trim();

        if ( isInteger( num, false ) )
        {
            return { int: num, exp: 0, original: num };
        }

        let dec = 0;
        let exp = 0;

        const matches = (/(\.)|(e-?(\d+))/i).exec( s );

        if ( matches )
        {
            if ( matches[2] && matches[3] )
            {
                return integerInfo( decimalExpansion( s ) );
            }

            const parts = s.split( matches[0] || _dot );

            let int = (parts.length > 0 ? parts[0] : _mt_str);

            const intParts = int.split( _dot );
            int = (intParts[0] || int).replace( /e-\d+$/, _mt_str );

            dec = (parts.length > 1 ? parts[1] : (intParts.length > 1 ? intParts[1] : "0")) || "0";

            exp = parseInt( matches[3] || dec.replace( /0+$/g, _mt_str ).length );

            s = asString( int, true ) + (dec.padEnd( exp, "0" ).slice( 0, exp ));
        }

        return {
            int: parseInt( s ),
            exp,
            original: num,
            useBigInt: (s.length >= (asString( Number.MAX_SAFE_INTEGER ).length + 1) || parseInt( s ) >= (2 ** 53) - 1)
        };
    }

    /**
     * Processes a series of numbers, validates them,<br>
     * and then converts them into integerInfo objects,<br>
     * <br>
     * The integerInfo objects encapsulate the result<br>
     * of multiplying a floating point value by powers of 10 until it is an integer<br>
     * <br>
     *
     * @param {...number} pNum - One or more numbers or an array of numbers to be processed.<br>
     *                           These numbers will be filtered, validated, and converted to integers<br>
     *                           for use in operations that produce more accurate results<br>
     *                           when handling integers than when handling floating-point values<br>
     *
     * @return {Array<Object>} Returns an array of objects representing the integer information of the valid specified numbers.
     */
    function _integers( ...pNum )
    {
        const nums = asArray( pNum ).map( toDecimal ).filter( e => !isNanOrInfinite( e ) );

        const integers = nums.map( e => integerInfo( e ) );

        integers.forEach( e => isBigInt( e.int ) ? e.int = BigInt( e.int ) : e.int );

        return integers;
    }

    /**
     * Calculates the maximum number of significant digits from a list of input numbers.
     *
     * @function
     *
     * @param {...number} pNum - One or more numeric values or an array of values<br>
     *                           from which the maximum number of significant digits will be calculated.<br>
     *
     * @returns {number} The maximum significant digits among the provided numbers,
     *                   or 0 if none are valid.
     */
    const calculateSignificantDigits = function( ...pNum )
    {
        const DEFAULT_EXPONENT = 0;

        const nums = asArray( pNum ).map( toDecimal ).filter( e => !isNanOrInfinite( e ) );

        const getSignificantDigitsInfo = ( num ) =>
        {
            const info = integerInfo( num ) || { original: num, exp: DEFAULT_EXPONENT };
            return (info.exp || DEFAULT_EXPONENT) + calculatePower( Math.ceil( info.original || 0 ) );
        };

        const info = nums.map( getSignificantDigitsInfo );

        return Math.abs( Math.max( ...info ) );
    };

    /**
     * @typedef DivisionOptions
     * @property {number} byZero The value to return if the divisor is zero (0)
     * @property {number} [defaultDividend=1] The value to use as the dividend, or numerator, when the specified value is NaN or Infinity
     * @property {number} [defaultDivisor=1] The value to use as the divisor, or denominator, when the specified value is NaN or Infinity
     * @property {number} [defaultQuotient=0] The value to return if the result is NaN or Infinity
     */

    /**
     * This object defines the default value for {@link DivisionOptions}
     * @type {{byZero: number, defaultDividend: number, defaultDivisor: number, defaultQuotient: number}}
     *
     * @alias module:MathUtils#DEFAULT_DIVISION_OPTIONS
     */
    const DEFAULT_DIVISION_OPTIONS =
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
     *
     * @alias module:MathUtils.quotient
     */
    const quotient = function( pDividend, pDivisor, pOptions = DEFAULT_DIVISION_OPTIONS )
    {
        const me = quotient;

        const options = populateOptions( pOptions, DEFAULT_DIVISION_OPTIONS );

        let dividend = resolveNullOrNaN( pDividend, resolveNullOrNaN( options.defaultDividend ) );

        if ( isZero( dividend ) )
        {
            return 0;
        }

        let divisor = resolveNullOrNaN( pDivisor, resolveNullOrNaN( options.defaultDivisor ) );

        if ( isZero( divisor ) )
        {
            modulePrototype.reportError( new IllegalArgumentError( ERROR_MSG_DIVISION_BY_ZERO ), ERROR_MSG_DIVISION_BY_ZERO, S_WARN, modulePrototype.calculateErrorSourceName( modName, me ), pDividend, pDivisor, pOptions );

            return resolveNullOrNaN( options.byZero, resolveNullOrNaN( options.defaultQuotient, 0 ) );
        }

        if ( 1 === divisor )
        {
            return resolveNullOrNaN( dividend, resolveNullOrNaN( options.defaultDividend ) );
        }

        const integers = _integers( dividend, divisor );

        dividend = (integers[0]?.int || 0) * (isBigInt( (integers[0]?.int || 0) ) ? BigInt( MAX_FACTOR ) : MAX_FACTOR);
        divisor = isBigInt( dividend ) ? (BigInt( (integers[1]?.int || 1n) )) : (integers[1]?.int || 1);

        const maxFactor = (isBigInt( dividend ) || isBigInt( divisor )) ? BigInt( MAX_FACTOR ) : MAX_FACTOR;

        return resolveNullOrNaN( (dividend / divisor) / maxFactor, resolveNullOrNaN( options.defaultQuotient ) );
    };

    /**
     * Returns a valid result of multiplying the first argument by the second,<br>
     * internally using integers to reduce floating-point inaccuracies<br>
     * <br>
     *
     * @alias module:MathUtils.product
     */
    const product = function( ...pMultiplicands )
    {
        let nums = asArray( pMultiplicands ).filter( isNumeric ).map( toDecimal ).filter( isValidNumber );

        if ( nums.length <= 0 || nums.some( e => isNanOrInfinite( e ) || 0 === e ) )
        {
            return 0;
        }

        let useBigInt = false;

        if ( nums.some( e => isBigInt( e ) ) && nums.every( e => isInteger( e ) || isBigInt( e ) ) )
        {
            useBigInt = true;
            nums = nums.map( e => BigInt( e ) );
        }

        let significantDecimals = useBigInt ? 0n : 0;

        let result = useBigInt ? 1n : 1;

        while ( (nums.length > 0) && (0 !== result) )
        {
            const num = nums.shift();

            const integers = _integers( result, num );

            const integer0 = integers[0];
            const integer1 = integers[1];

            let decimalPlaces = ((integer0?.exp || 0) + (integer1?.exp || 0));
            decimalPlaces = isBigInt( decimalPlaces ) || useBigInt ? BigInt( decimalPlaces ) : decimalPlaces;

            significantDecimals = Math.max( significantDecimals, decimalPlaces );

            result = (integer0?.int || 0);
            result = isBigInt( result ) || useBigInt ? BigInt( result ) : result;

            let a = (integer1.int || 0);
            a = isBigInt( a ) || useBigInt ? BigInt( a ) : a;

            let factor = (10 ** decimalPlaces);
            factor = isBigInt( factor ) || useBigInt ? BigInt( factor ) : factor;

            result = quotient( a * result, factor );
            result = isBigInt( result ) || useBigInt ? BigInt( result ) : result;

            result = toSignificantDigits( result, significantDecimals + calculatePower( Math.ceil( result ) ) + 1 );
            result = isBigInt( result ) || useBigInt ? BigInt( result ) : result;
        }

        return result;
    };

    /**
     * Returns the sum of the specified values,<br>
     * rounded to the appropriate number of significant digits determined from the values<br>
     *
     * @param {...number|string} pAddends - One or more numbers or numeric strings to be summed.<br>
     *
     * @returns {number} The sum of the valid numbers after filtering out invalid or infinite values,
     * ensuring the result maintains the appropriate number of significant digits.
     *
     * @alias module:MathUtils.sum
     */
    const sum = function( ...pAddends )
    {
        const nums = asArray( pAddends ).map( toDecimal ).filter( e => !isNanOrInfinite( e ) );

        const significantDigits = calculateSignificantDigits( ...nums );

        return toSignificantDigits( nums.reduce( ( a, b ) => a + b, 0 ), significantDigits );
    };

    /**
     * Computes the difference by subtracting one or more subtrahends from a given minuend.
     * Ensures the calculation respects significant digits for precision based on the inputs.
     *
     * @param {number} pMinuend - The number from which other numbers (subtrahends) are subtracted.
     * @param {...number} pSubtrahends - One or more numbers to be subtracted from the minuend.
     * @returns {number} The result of subtracting all subtrahends from the minuend, adjusted for significant digits.
     */
    const difference = function( pMinuend, ...pSubtrahends )
    {
        const minuend = resolveNullOrNaN( pMinuend );

        const nums = asArray( pSubtrahends ).map( toDecimal ).filter( e => !isNanOrInfinite( e ) );

        const significantDigits = calculateSignificantDigits( ...([...nums].concat( minuend )) );

        return toSignificantDigits( nums.reduce( ( a, b ) => a - b, minuend ), significantDigits );
    };

    /**
     * Instances of this class represent and implement<br>
     * the logic for a specific rounding mechanism<br>
     *
     * @class
     */
    class RoundingMode
    {
        #input;
        #sign;
        #precision;

        factor;
        raised;

        #precalculated = null;

        #useBigInt = false;

        /**
         * Constructs a new RoundingMode object.<br>
         * A rounding mode describes how to resolve values<br>
         * that are equidistant between 2 potential return values.<br>
         * <br>
         * @see <a href="https://en.wikipedia.org/wiki/Rounding">Rounding</a>
         * @constructor
         *
         * @param {number|string} pNum - A number, or the string representation of a number, to round to a specific precision
         * @param {number} pPrecision The  number of decimal places to which to round the specified value
         */
        constructor( pNum, pPrecision )
        {
            this.#input = resolveNullOrNaN( pNum );
            this.#useBigInt = isBigInt( this.#input );

            if ( 0 === this.#input )
            {
                // rounding 0 to any precision is just 0;
                this.#precalculated = this.#useBigInt ? 0n : 0;
                this.#sign = this.#useBigInt ? 1n : 1;
            }
            else
            {
                this.#sign = Math.sign( this.#input );
                this.#sign = this.#useBigInt ? BigInt( this.#sign ) : this.#sign;

                this.#precision = resolveNullOrNaN( asInt( pPrecision ) );
                this.#useBigInt = isBigInt( this.#precision );
                this.#precision = this.#useBigInt ? BigInt( this.#precision ) : this.#precision;

                if ( 0 === this.#precision && isInteger( this.input ) )
                {
                    this.#precalculated = parseInt( this.input );
                }

                this.factor = (this.#useBigInt ? 10n : 10) ** this.precision;
                this.raised = this.applyFactor();
                this.raised = this.#useBigInt && isInteger( this.raised ) ? BigInt( this.raised ) : this.raised;
            }
        }

        /**
         * Returns true if this instance requires the use of the BigInt data type to produce accurate results.<br>
         *
         * @return {boolean} true if this instance requires the use of the BigInt data type to produce accurate results
         */
        get useBigInt()
        {
            return this.#useBigInt;
        }

        /**
         * Returns the value to be rounded.<br>
         * <br>
         * If {@link #useBigInt} is true and the specified value is an integer,<br>
         * the method returns a BigInt; otherwise, it returns a number.<br>
         *
         * @return {number|bigint} The value to be rounded
         */
        get input()
        {
            return this.#useBigInt && isInteger( this.#input ) ? BigInt( this.#input ) : this.#input;
        }

        /**
         * Returns -1 if the value to be rounded is less than 0 or 1 if the value is >= 0<br>
         * If the value to be rounded is a BigInt, the returned value will be -1n or 1n<br>
         *
         * @return {number|BigInt} Returns 1 if the value to be rounded is a positive number,<br>
         * or -1 if the value to be rounded is a negative number<br>
         */
        get sign()
        {
            return this.#useBigInt ? BigInt( this.#sign || Math.sign( this.input ) ) : this.#sign || Math.sign( this.input );
        }

        /**
         * Returns the number of decimals to which to round the value.<br>
         * <br>
         * If {@link #useBigInt} is true and the value is an integer,<br>
         * BigInt arithmetic will be used; otherwise, standard numeric arithmetic applies.<br>
         *
         * @returns {number|bigint} The number of decimals to which to round the value.<br>
         */
        get precision()
        {
            return this.#useBigInt ? BigInt( this.#precision ) : this.#precision;
        }

        /**
         * Applies a factor to the input value, handling both integers and non-integers.
         * For integer inputs, optionally uses BigInt based on the configuration.
         *
         * @return {number|BigInt} The result of applying the factor to the input value.<br>
         * Returns the input itself if it is NaN or infinite.<br>
         * @protected
         */
        applyFactor()
        {
            const input = this.input;

            if ( isNanOrInfinite( input ) )
            {
                return input;
            }

            return this.#useBigInt && isInteger( input ) ? (BigInt( input ) * BigInt( this.factor )) : (input * this.factor);
        }

        /**
         * Divides a result by the factor used to avoid floating-point arithmetic
         * and returns the quotient.
         *
         * @param {number|BigInt} pValue The value to divide by the factor
         * @return {number|BigInt} The quotient after dividing by the factor.
         *
         * @protected
         */
        removeFactor( pValue )
        {
            let value = resolveNullOrNaN( pValue );
            value = this.#useBigInt && isInteger( value ) ? BigInt( value ) : value;
            return quotient( value, this.factor );
        }

        /**
         * Retrieves the precalculated value, if available,<br>
         * converted to a BigInt if the {@link #useBigInt} property is true<br>
         * and the value is an integer.
         *
         * @return {number|BigInt|null} The precalculated value, if available,<br>
         * as either a number or a BigInt, depending on the value of {@link #useBigInt}<br>
         * <br>
         * Returns null if the rounded value was not precalculated
         */
        get precalculated()
        {
            return this.#useBigInt && isInteger( this.#precalculated ) ? BigInt( this.#precalculated ) : this.#precalculated;
        }

        /**
         * Rounds the given value to the specified precision, using BigInt if applicable.<br>
         * <br>
         * This method is overridden by each subclass to implement a particular rounding rule.<br>
         *
         * @param {number|string} pValue - The value to be rounded, which can be a number or a string representation of a number.
         *
         * @return {number|BigInt} The rounded value, as a number or BigInt depending on the input and configuration.
         *
         * @protected
         */
        _round( pValue )
        {
            let value = resolveNullOrNaN( pValue );
            value = this.#useBigInt && isInteger( value ) ? BigInt( value ) : value;
            return Math.round( value );
        }

        /**
         * Rounds a number based on the (potentially overridden) internal implementation of {@link #_round} calculations<br>
         * <br>
         * Note that this method assumes that the _round method has applied a factor to avoid floating-point inaccuracies<br>
         * <br>
         *
         * @see {@link ExtendedRoundingMode}
         * @see {@link HalfEven}
         *
         * @return {number|BigInt} The rounded value
         */
        round()
        {
            if ( null !== this.#precalculated )
            {
                return this.useBigInt ? BigInt( this.#precalculated ) : this.#precalculated;
            }
            return this.removeFactor( this._round( this.raised ) );
        }
    }

    /**
     * This class is a subclass of {@link RoundingMode}<br>
     * that provides a specific rounding method.<br>
     * <br>
     * This class performs a truncation of a given number,<br>
     * discarding any fractional part of the number without rounding.
     *
     * @class
     * @extends RoundingMode
     */
    class Trunc extends RoundingMode
    {
        constructor( pNum, pPrecision )
        {
            super( pNum, pPrecision );
        }

        _round( pValue )
        {
            const num = resolveNullOrNaN( pValue );
            return Math.trunc( num );
        }
    }

    /**
     * The HalfUp class is a subclass of {@link RoundingMode}<br>
     * specific rounding mode that rounds a number to the nearest neighbor.<br>
     * <br>
     * If the number is equidistant from two possible rounded values, it will round up.<br>
     * <br>
     * This behavior is the default rounding mechanism in JavaScript.<br>
     * <br>
     *
     * @class
     * @extends RoundingMode
     */
    class HalfUp extends RoundingMode
    {
        /**
         * @constructor
         * @inheritDoc
         */
        constructor( pNum, pPrecision )
        {
            super( pNum, pPrecision );
        }

        /**
         * @inheritDoc
         * @protected
         */
        _round( pValue )
        {
            // half up is the default JavaScript behavior
            return super._round( pValue );
        }
    }

    /**
     * Represents a rounding mode where the value is rounded towards the nearest neighbor,<br>
     * <br>
     * If the number is equidistant from two possible rounded values, it will round down.<br>
     *
     * @class
     * @extends RoundingMode
     */
    class HalfDown extends RoundingMode
    {
        /**
         * @constructor
         * @inheritDoc
         */
        constructor( pNum, pPrecision )
        {
            super( pNum, pPrecision );
        }

        /**
         * @inheritDoc
         * @protected
         */
        _round( pValue )
        {
            let num = Math.abs( resolveNullOrNaN( pValue ) );
            if ( this.useBigInt && isInteger( num ) )
            {
                num = BigInt( num );
            }
            return this.sign * Math.floor( num );
        }
    }

    /**
     * The ExtendedRoundingMode class extends the behavior of the RoundingMode class<br>
     * by introducing additional functionality such as calculating and applying a scaling factor,<br>
     * used in intermediate calculations for rounding,<br>
     * and determining specific rounding scenarios.<br>
     * <br>
     * This class is designed to handle more complex rounding mechanisms<br>
     * by leveraging a calculated scaling factor<br>
     * and performing specific logic in cases of values that are equidistant from two possible results.<br>
     * <br>
     * <br>
     * Key functionality includes:<br>
     * <ul>
     *   <li>Scaling the input number by a factor for more precise intermediate computations</li>
     *   <li>Computing an integer-form representation of the input by applying a scaling factor</li>
     *   <li>Identifying specific rounding scenarios such as halfway cases<br>
     *   and whether the next-higher-power digit is even or odd</li>
     * </ul>
     * <br>
     * <br>
     * This class is intended to be treated as an 'abstract' class<br>
     * from which to derive subclasses that rely on its behavior<br>
     *
     * @class
     * @abstract
     * @extends RoundingMode
     */
    class ExtendedRoundingMode extends RoundingMode
    {
        /**
         * A calculated value by which to multiply the number to be rounded
         * to avoid floating-point inaccuracies
         * @type {number}
         */
        factor;

        /**
         * Another calculated value by which to multiply intermediate values
         * to avoid floating-point inaccuracies
         *
         * @type {number}
         */
        #scalingFactor;

        /**
         * The value calculated by multiplying the number to be rounded by the factor.<br>
         * @type {number}
         */
        raised;

        /**
         * A precalculated integer value used in intermediate calculations<br>
         * @type {number|null}
         */
        #intForm = null;

        /**
         * @constructor
         * @inheritDoc
         */
        constructor( pNum, pPrecision )
        {
            super( pNum, pPrecision );

            if ( null === this.precalculated )
            {
                // calculate a multiple of 10 that is one place-value greater than the specified precision
                this.factor = (10 ** (this.precision + 1));

                // multiply the number to be rounded by the factor
                this.raised = this.applyFactor();

                // calculate a multiple of 10 that is one place-value less than the specified precision
                this.#scalingFactor = (10 ** (this.precision - 1));

                // calculate an integer to use in rounding operations
                this.#intForm = this.intForm;
            }
        }

        /**
         * @inheritDoc
         */
        applyFactor()
        {
            const input = this.input;

            if ( isNanOrInfinite( input ) )
            {
                return input;
            }

            return input * this.factor;
        }

        /**
         * Returns the calculated scalingFactor
         * @returns {number} the calculated scalingFactor
         */
        get scalingFactor()
        {
            return this.#scalingFactor;
        }

        /**
         * Returns the integer representation of the scaled value.<br>
         * <br>
         * This value is computed using the absolute value of the {@link #raised} property,<br>
         * adjusted by the scaling factor.<br>
         * <br>
         * Internally caches the result for future retrievals.<br>
         *
         * @return {number} The integer derived by applying the scalingFactor.
         */
        get intForm()
        {
            if ( null === this.#intForm || isNanOrInfinite( this.#intForm ) )
            {
                let scale = this.scalingFactor;

                let raised = Math.abs( this.raised );

                if ( scale < 1 )
                {
                    const s = asString( raised );
                    const parts = s.split( _dot );
                    let dec = parts.length > 1 ? parts[1] : _mt_str;
                    dec = dec.replace( /0+$/, _mt_str );
                    scale = 10 ** dec.length;
                }

                scale = asInt( scale );

                this.#intForm = this.sign * (raised - (raised % scale) / scale);
            }

            return this.#intForm;
        }

        /**
         * Determines if the absolute value of the {@link #intForm}
         * is halfway between multiples of 10.<br>
         * This is true if it's divisible by 5, but not divisible by 10.<br>
         * <br>
         * This is used to determine if a specific rule should be used to calculate the rounded value<br>
         * <br>
         * @return {boolean} Returns true if the absolute value of {@link #intForm}
         * is divisible by 5 but not divisible by 10, otherwise false.<br>
         */
        isHalfway()
        {
            const n = Math.abs( this.intForm );
            return n % 5 === 0 && n % 10 !== 0;
        }

        /**
         * Determines if the number in the next-higher-power place is an even power of two.<br>
         * <br>
         * This is done by subtracting 5 from the absolute value of this.{@link #intForm}, dividing by 10,
         * and checking if the result can be divided by 2 with no remainder.<br>
         *
         * @return {boolean} Returns true if the next-higher-power digit is even, false if it odd
         */
        isNextPowerEven()
        {
            const n = Math.abs( this.intForm );
            return (((n - 5) / 10) % 2) === 0;
        }
    }

    /**
     * The HalfEven class is a subclass of {@link RoundingMode}<br>
     * that implements the half-to-even or "bankers' rounding" approach.<br>
     * <br>
     * It extends the {@link ExtendedRoundingMode} class to round numeric values
     * to the specified precision, resolving ties by rounding towards the nearest even number.<br>
     * <br>
     *
     * @class
     * @extends ExtendedRoundingMode
     */
    class HalfEven extends ExtendedRoundingMode
    {
        /**
         * @constructor
         * @inheritDoc
         */
        constructor( pNum, pPrecision )
        {
            super( pNum, pPrecision );
        }

        /**
         * @inheritDoc
         * @protected
         */
        _round( pValue )
        {
            let value = Math.abs( resolveNullOrNaN( pValue ) );
            if ( this.isHalfway() )
            {
                value = (this.isNextPowerEven() ? value - 5 : value + 5);
            }
            return this.sign * value;
        }
    }

    /**
     * This is a subclass of {@link HalfEven}<br>
     * that rounds towards infinity when the value is exactly halfway between two potential results.<br>
     * <br>
     *
     * @class
     * @extends HalfEven
     */
    class HalfEvenTowardsInfinity extends HalfEven
    {
        /**
         * @constructor
         * @inheritDoc
         */
        constructor( pNum, pPrecision )
        {
            super( pNum, pPrecision );
        }

        /**
         *
         * @inheritDoc
         * @protected
         */
        _round( pValue )
        {
            let value = resolveNullOrNaN( pValue );
            if ( this.isHalfway() )
            {
                value = (this.isNextPowerEven() ? value - 5 : value + 5);
            }
            return value;
        }
    }

    /**
     * This class is a subclass of {@link ExtendedRoundingMode}
     * that implements a specific rounding behavior that handles halfway values
     * by rounding them towards positive infinity<br>
     * <br>
     * This differs from {@link HalfUp} when rounding negative values<br>
     * Negative values that lie halfway between 2 potential return values are rounded 'up'<br>
     *
     * @class
     * @extends ExtendedRoundingMode
     */
    class HalfTowardsInfinity extends ExtendedRoundingMode
    {
        /**
         * @constructor
         * @inheritDoc
         */
        constructor( pNum, pPrecision )
        {
            super( pNum, pPrecision );
        }

        /**
         * @inheritDoc
         * @protected
         */
        _round( pValue )
        {
            let value = resolveNullOrNaN( pValue );
            if ( this.isHalfway() )
            {
                value += 5;
            }
            return value;
        }
    }

    /**
     * This class is a subclass of {@link RoundingMode}<br>
     * that implements a rounding mode that handles halfway values
     * by rounding them away from zero(0)<br>
     * <br>
     * This differs from {@link HalfTowardsInfinity} when rounding negative values<br>
     * Negative values that lie halfway between 2 potential return values are rounded 'down'<br>
     * <br>
     * @class
     * @extends ExtendedRoundingMode
     */
    class HalfAwayFromZero extends ExtendedRoundingMode
    {
        /**
         * @constructor
         * @inheritDoc
         */
        constructor( pNum, pPrecision )
        {
            super( pNum, pPrecision );
        }

        /**
         * @inheritDoc
         * @protected
         */
        _round( pValue )
        {
            let value = Math.abs( resolveNullOrNaN( pValue ) );
            if ( this.isHalfway() )
            {
                value += 5;
            }
            return this.sign * value;
        }
    }

    /**
     * This class is a subclass of {@link ExtendedRoundingMode}<br>
     * that implements a rounding mechanism where values at the halfway point<br>
     * are rounded based on whether the next power is even or odd.<br><br>
     * If the intermediate result is halfway between two potential return values,<br>
     * the value is rounded to the nearest <b>odd</b> number.<br>
     * <br>
     * This is the opposite of the {@link HalfEven} rounding mode/<br>
     *
     * @see {@link HalfEven}
     *
     * @class
     * @extends ExtendedRoundingMode
     */
    class HalfOdd extends ExtendedRoundingMode
    {
        /**
         * @constructor
         * @inheritDoc
         */
        constructor( pNum, pPrecision )
        {
            super( pNum, pPrecision );
        }

        /**
         * @inheritDoc
         * @protected
         */
        _round( pValue )
        {
            let value = Math.abs( resolveNullOrNaN( pValue ) );
            if ( this.isHalfway() )
            {
                value = (!this.isNextPowerEven() ? value - 5 : value + 5);
            }
            return this.sign * value;
        }
    }

    /**
     * @namespace
     * A set if constants representing available rounding modes.<br>
     * <br>
     * Properties:<br><br>
     * - `HALF_UP`: Rounding mode that rounds away from zero.<br>
     *    @see {@link HalfUp}<br>
     *    <br>
     * - `HALF_DOWN`: Rounding mode that rounds towards zero.<br>
     *    @see {@link HalfDown}<br>
     *    <br>
     * - `HALF_EVEN`: Rounding mode that rounds towards the nearest even number.<br>
     *    @see {@link HalfEven}<br>
     *    <br>
     * - `HALF_EVEN_TOWARDS_INFINITY`: A variant of HALF_EVEN that rounds towards positive infinity<br>
     *    @see {@link HalfEvenTowardsInfinity}<br>
     *    <br>
     * - `HALF_AWAY_FROM_ZERO`: Rounding mode that rounds away from zero.<br>
     *    @see {@link HalfAwayFromZero}<br>
     *    <br>
     * - `HALF_TOWARDS_INFINITY`: Rounding mode that rounds towards positive infinity.<br>
     *    @see {@link HalfTowardsInfinity}<br>
     *    <br>
     * - `HALF_ODD`: Rounding mode that rounds to the nearest odd number.<br>
     *    @see {@link HalfOdd}<br>
     *    <br>
     * - `TRUNC`: Rounding mode that truncates the value towards zero,<br>
     *    effectively discarding the fractional part.<br>
     *    @see {@link Trunc}<br>
     *
     *    @alias module:MathUtils#ROUNDING_MODE
     */
    const ROUNDING_MODE =
        {
            HALF_UP: HalfUp,
            HALF_DOWN: HalfDown,
            HALF_EVEN: HalfEven,
            HALF_EVEN_TOWARDS_INFINITY: HalfEvenTowardsInfinity,
            HALF_AWAY_FROM_ZERO: HalfAwayFromZero,
            HALF_TOWARDS_INFINITY: HalfTowardsInfinity,
            HALF_ODD: HalfOdd,
            TRUNC: Trunc
        };

    /**
     * Rounds a given number to a specified number of decimal places<br>
     * using the specified rounding mode.
     *
     * @see {@link RoundingMode}
     * @see {@link ROUNDING_MODE}
     *
     * @param {number} pNum - The number to be rounded.
     * @param {number} pDecimalPlaces - The number of decimal places to which to round the value.
     * @param {Function|Object} pRoundingMode - The rounding mode to apply.<br>
     *                                          If this is null or not a class,
     *                                          defaults to `HalfUp`.<br>
     *
     * @returns {number} - The number rounded to the specified number of decimal places using the rounding mode specified.
     */
    const round = function( pNum, pDecimalPlaces, pRoundingMode )
    {
        const roundingMode = isClass( pRoundingMode ) ? pRoundingMode : HalfUp;
        const mode = new roundingMode( pNum, pDecimalPlaces, pRoundingMode );
        return mode.round();
    };

    /**
     * Computes the greatest common divisor (GCD) of two numbers using the
     * Euclidean algorithm.<br>
     * <br>
     * The function accepts two arguments, which are verified to be numeric.<br>
     * If a provided argument is not numeric, it defaults to 0.<br>
     * The GCD is determined through iterative computation<br>
     * and returned as an absolute value.<br>
     *
     * @param {number|string} pNumA - The first number or numeric string.
     * @param {number|string} pNumB - The second number or numeric string.
     *
     * @returns {number} The greatest common divisor of the two numbers, or 0 if both inputs are invalid.
     *
     * @alias module:MathUtils.gcd
     */
    const gcd = function gcd( pNumA, pNumB )
    {
        let a = isNumeric( pNumA ) ? asInt( pNumA ) : 0;
        let b = isNumeric( pNumB ) ? asInt( pNumB ) : 0;

        while ( b )
        {
            [a, b] = [b, a % b];
        }

        return Math.abs( a );
    };

    /**
     * Calculates the greatest common factor (GCF) of one or more numbers.<br>
     * <br>
     * This function takes a variable number of arguments,<br>
     * converts them into an array of valid numbers, and determines their GCF.<br>
     * <br>
     * If no valid numbers are provided, an IllegalArgumentError is thrown.<br>
     *
     * @param {...number} pNumbers - One or more numbers, or an array of numbers,
     *                               for which the GCF will be calculated.
     *
     * @returns {number} The greatest common factor of the provided numbers.
     *
     * @throws {IllegalArgumentError} If no valid numbers are provided
     *
     * @alias module:MathUtils.greatestCommonFactor
     */
    const greatestCommonFactor = function( ...pNumbers )
    {
        let nums = asArray( pNumbers ).map( toDecimal ).filter( isValidNumber );

        if ( nums.length <= 0 )
        {
            const msg = "At least one valid number must be specified";
            throw new IllegalArgumentError( msg, { "numbers": pNumbers } );
        }

        let result = nums[0];

        for( let i = 1, n = nums.length; i < n; i++ )
        {
            result = gcd( result, nums[i] );
        }

        return result;
    };

    /**
     * Computes the smallest common factor, a.k.a. lowest common denominator,<br>
     * shared among the provided numbers.<br>
     * <br>
     *
     * This function accepts one or more numbers (or an array of numbers),<br>
     * removes invalid values, and calculates the greatest common divisor (GCD) of the remaining values.<br>
     * <br>
     * If the GCD is greater than or equal to 2,<br>
     * the function identifies and returns the smallest factor of the GCD.<br>
     * <br>
     * If no valid common divisor greater than 1 is found,<br>
     * the function emits an error event and returns 1.<br>
     * <br>
     * Key behaviors:<br><br>
     * - Converts input numbers to decimals for consistent evaluation.<br>
     * - Filters out invalid input values (e.g., non-numbers).<br>
     * - Reports an error if no common divisor greater than 1 is found<br>
     *   or if no valid numbers  are specified.<br>
     * <br>
     *
     * @param {...*} pNumbers - The numbers to evaluate for common divisors.<br>
     *                          Can include any type of values, but non-numeric and invalid values will be filtered out.<br>
     *
     * @returns {number} The smallest common factor greater than 1,<br>
     *                   or the greatest common divisor if no smaller factors exist.<br><br>
     *                   If no valid divisor is found, returns 1.<br>
     *
     * @alias module:MathUtils.smallestCommonFactor
     */
    const smallestCommonFactor = function( ...pNumbers )
    {
        const me = this;

        let nums = asArray( pNumbers ).map( toDecimal ).filter( isValidNumber );

        const greatestCommonDivisor = greatestCommonFactor( ...nums );

        if ( greatestCommonDivisor < 2 )
        {
            let msg;

            if ( 1 === greatestCommonDivisor )
            {
                msg = "No common divisor greater than 1 found.";
            }
            else if ( 0 === greatestCommonDivisor )
            {
                msg = "At least one divisor must be greater than 0";
            }

            modulePrototype.reportError( new IllegalArgumentError( msg ), msg, S_WARN, modulePrototype.calculateErrorSourceName( modName, me ), ...nums );

            return 1;
        }

        for( let i = 2; i <= Math.sqrt( greatestCommonDivisor ); i++ )
        {
            if ( greatestCommonDivisor % i === 0 )
            {
                return i;
            }
        }

        return greatestCommonDivisor;
    };

    /**
     * @typedef {Object} RationalOptions
     *
     * @property {number} [defaultDenominator=1] The value to use as the denominator, when the specified value is 0, NaN, or Infinity
     * @property {number} [defaultNumerator=1] The value to use as the numerator, when the specified value is NaN or Infinity
     * @property {number} [largestAllowedDenominator=16384] The largest value to allow for a denominator.<br>
     *                                                      Instances that would require a larger denominator<br>
     *                                                      are coerced to the nearest 1/(this_value).<br><br>
     *                                                      Adjusting this value facilitates a tradeoff between accuracy and performance.<br>
     *                                                      The smaller the value, the less accurate some values can be represented.<br>
     *                                                      The larger the value, improved accuracy comes at the cost of slightly higher computational time and costs.<br>
     */

    /**
     * @namespace
     * @type {RationalOptions}
     * This object defines the default options for constructing instances of Rational.<br>
     * @see {@link RationalOptions}
     * @alias module:MathUtils#DEFAULT_RATIONAL_OPTIONS
     */
    const DEFAULT_RATIONAL_OPTIONS =
        {
            defaultDenominator: 1,
            defaultNumerator: 1,
            largestAllowedDenominator: 16_384
        };

    /**
     * Represents a rational number as a fraction of two integers, numerator and denominator.<br>
     * <br>
     * This class extends the native {@link Number} class and provides additional methods for working
     * with rational numbers.<br>
     *
     * @class
     * @extends Number
     */
    class Rational extends Number
    {
        #numerator;
        #denominator;
        #commonFactor;

        #actualValue;
        #sign;

        #options;

        /**
         * Constructs a new Rational object with the specified numerator, denominator, and options.<br>
         * <br>
         * Ensures that the denominator is non-zero and calculates the simplified form of the rational number.<br>
         * <br>
         *
         * @param {number} pNumerator - The numerator of the rational number.<br>
         *                              If this is null, NaN, or not finite, a default numerator is used.<br>
         *
         * @param {number} [pDenominator=1] - The denominator of the rational number. Defaults to 1 if not provided.<br>
         *                                    If this is null, NaN, 0, or not finite, a default denominator is used.<br>
         *                                    Throws an error if the default denominator is also 0.<br>
         *
         * @param {RationalOptions} [pOptions=DEFAULT_RATIONAL_OPTIONS] - An object defining configuration parameters,
         *                                                                such as a default numerator, default denominator,
         *                                                                and the largest allowed denominator.<br>
         *
         * @return {Rational} A new Rational instance representing the reduced form of the value<br>
         *                    defined by the specified numerator and denominator.
         */
        constructor( pNumerator, pDenominator = 1, pOptions = DEFAULT_RATIONAL_OPTIONS )
        {
            super( quotient( resolveNullOrNaN( pNumerator, pOptions?.defaultNumerator ), (0 === pDenominator ? 1 : resolveNullOrNaN( pDenominator, pOptions?.defaultDenominator )) ) );

            this.#options = populateOptions( pOptions, DEFAULT_RATIONAL_OPTIONS );

            const actual = super.valueOf();

            this.#sign = Math.sign( actual );
            this.#sign = 0 === this.#sign ? 1 : this.#sign;

            const integers = _integers( resolveNullOrNaN( pNumerator, this.#options.defaultNumerator ),
                                        resolveNullOrNaN( pDenominator, this.#options.defaultDenominator ) );

            let numerator = Math.abs( integers[0].int );
            let denominator = Math.abs( integers[1].int );

            if ( 0 === denominator )
            {
                const msg = "Denominator cannot be 0";

                modulePrototype.reportError( new IllegalArgumentError( msg ), msg, S_WARN, modulePrototype.calculateErrorSourceName( modName, "Rational::new" ), pNumerator, pDenominator, pOptions );

                denominator = resolveNullOrNaN( this.#options.defaultDenominator, 1 );

                if ( 0 === denominator )
                {
                    throw new IllegalArgumentError( msg );
                }
            }

            const largestAllowedDenominator = resolveNullOrNaN( this.#options.largestAllowedDenominator, DEFAULT_RATIONAL_OPTIONS.largestAllowedDenominator );

            this.#commonFactor = gcd( numerator, denominator );
            this.#commonFactor = Math.min( this.#commonFactor, largestAllowedDenominator );

            while ( this.#commonFactor >= 2 && numerator > 1 && denominator > 1 && this.#commonFactor <= largestAllowedDenominator )
            {
                numerator = Math.abs( Math.round( numerator / this.#commonFactor ) );
                denominator = Math.abs( Math.round( denominator / this.#commonFactor ) );

                this.#commonFactor = gcd( numerator, denominator );
                this.#commonFactor = Math.min( this.#commonFactor, largestAllowedDenominator );
            }

            numerator = Math.abs( Math.round( numerator / this.#commonFactor ) );
            denominator = Math.abs( Math.round( denominator / this.#commonFactor ) );

            while ( denominator > largestAllowedDenominator && denominator > 1 && numerator > 0 )
            {
                numerator = Math.round( numerator / 2 );
                denominator = Math.round( denominator / 2 );

                if ( 0 === denominator )
                {
                    throw new IllegalArgumentError( "Cannot reduce denominator below 1 while adjusting to the largest allowed denominator." );
                }
            }

            this.#numerator = Math.abs( Math.round( numerator ) );
            this.#denominator = Math.abs( Math.round( denominator ) );

            if ( this.#numerator === this.#denominator )
            {
                this.#numerator = 1;
                this.#denominator = 1;
            }

            this.#actualValue = resolveNullOrNaN( actual, this.#numerator / this.#denominator );
        }

        /**
         * Retrieves the options used to create this instance<br>
         * @see {@link RationalOptions}
         *
         * @return {RationalOptions} The options object used to create this instance
         */
        get options()
        {
            return populateOptions( this.#options, DEFAULT_RATIONAL_OPTIONS );
        }

        /**
         * Returns -1 if this instance represents a value less than zero<br>
         * or 1 if this rational represents a value greater than or equal to zero<br>
         *
         * @returns {number} -1 if this instance represents a value less than zero<br>
         * or 1 if this rational represents a value greater than or equal to zero<br>
         */
        get sign()
        {
            return this.#sign;
        }

        /**
         * Returns the absolute difference between the actual decimal value
         * and the value represented by this instance.
         *
         * @return {number} The absolute value of the discrepancy<br>
         * between the decimal value and the value represented by this instance
         */
        get discrepancy()
        {
            return Math.abs( this.#actualValue - quotient( this.numerator, this.denominator ) );
        }

        /**
         * Returns the constructor of this class.
         *
         * @return {Function} The constructor function of this class.
         */
        static get [Symbol.species]()
        {
            return this;
        }

        /**
         * Returns the integer value of the numerator of this rational number<br>
         * <br>
         * @returns {number} the numerator of this rational number, if it is a fraction<br>
         * or the whole number value if it is not a fraction
         */
        get numerator()
        {
            return asInt( this.#numerator ) * this.sign;
        }

        /**
         * Returns the denominator of this fraction as an integer value.
         * <br>
         * @return {number} The integer value of the denominator.
         */
        get denominator()
        {
            return Math.abs( asInt( this.#denominator ) );
        }

        /**
         * Returns the {@link #smallestCommonFactor} shared by the numerator and denominator<br>
         * specified in the constructor of this instance.<br>
         * <br>
         * This value may be larger than the {@link #denominator} if the fraction was reduced to its simplest form<br>
         * or the specified denominator was larger than the largest allowed denominator specified in the options<br>
         *
         * @returns {number} the {@link #smallestCommonFactor} shared by the numerator and denominator
         */
        get commonFactor()
        {
            return Math.abs( asInt( this.#commonFactor ) );
        }

        /**
         * Returns the string representation of this number.<br>
         * If the denominator is 1, the string representation is "<i>{@link #numerator}</i>"<br>
         * Otherwise, the string representation is "<i>{@link #numerator}</i>/<i>{@link #denominator}</i>"
         *
         * @return {string} A string representation of the object,
         * either as a whole number or a fraction in the form "numerator/denominator".
         */
        toString()
        {
            if ( 1 === this.denominator || this.isZero() || (Math.abs( this.numerator ) === Math.abs( this.denominator )) )
            {
                return asString( this.numerator );
            }

            return asString( this.numerator ) + "/" + asString( this.denominator );
        }

        /**
         * Returns the string representation of this number when the value is coerced to a string.<br>
         * If the denominator is 1, the string representation is "<i>{@link #numerator}</i>"<br>
         * Otherwise, the string representation is "<i>{@link #numerator}</i>/<i>{@link #denominator}</i>"
         * <br>
         * @see {@link #toString}
         * <br>
         * @return {string} A string representation of the object,
         * either as a whole number or a fraction in the form "numerator/denominator".
         */
        [Symbol.toStringTag]()
        {
            return this.toString();
        }

        /**
         * Returns the numeric value of this object<br>
         * by calculating the quotient of its numerator and denominator.<br>
         * <br>
         * This is the value that is returned in contexts where this object is coerced to a number<br>
         * <br>
         * You should normally avoid using the JavaScript mathematical operators<br>
         * when working with these objects.<br>
         * Instead, use the add, subtract, multiply, and divide methods.<br>
         * <br>
         *
         * @return {number} The quotient of the numerator divided by the denominator.
         */
        valueOf()
        {
            return quotient( this.numerator, this.denominator );
        }

        /**
         * Returns the closest rational number to the specified value.<br>
         *
         * @param {number} pDecimal The value to approximate as a Rational number
         * @param {RationalOptions} pOptions An object that defines how to handle scenarios<br>
         *                                   such as Null, NaN, or Infinite values specified as arguments,<br>
         *                                   and the largest allowed denominator, or 'resolution' of the result.<br>
         *
         * @returns {Rational} the closest rational number to the specified value.
         */
        static fromDecimal( pDecimal, pOptions = DEFAULT_RATIONAL_OPTIONS )
        {
            const me = Rational.fromDecimal;

            let num = toDecimal( resolveNullOrNaN( pDecimal ) );

            if ( isZero( num ) )
            {
                return Rational.ZERO;
            }

            if ( isNanOrInfinite( num ) )
            {
                const msg = ERROR_MSG_NON_NUMERIC;
                modulePrototype.reportError( new IllegalArgumentError( msg ), msg, S_WARN, modulePrototype.calculateErrorSourceName( modName, me ), pDecimal, pOptions );
            }

            const options = populateOptions( pOptions, DEFAULT_RATIONAL_OPTIONS );

            const largestAllowedDenominator = resolveNullOrNaN( options.largestAllowedDenominator, DEFAULT_RATIONAL_OPTIONS.largestAllowedDenominator );

            const maxDenominator = Math.min( resolveNullOrNaN( largestAllowedDenominator, DEFAULT_RATIONAL_OPTIONS.largestAllowedDenominator || 1024 ), 32_768 );

            let closestNumerator = 0;
            let closestDenominator = 1;
            let minDifference = Infinity;

            for( let denominator = 1; denominator <= maxDenominator; denominator++ )
            {
                const numerator = Math.round( num * denominator );
                const rational = quotient( numerator, denominator );
                const difference = Math.abs( num - rational );

                if ( difference < minDifference )
                {
                    minDifference = difference;
                    closestNumerator = numerator;
                    closestDenominator = denominator;
                }

                if ( minDifference === 0 )
                {
                    break;
                }
            }

            return new Rational( asInt( closestNumerator ), asInt( closestDenominator ), options );
        }

        /**
         * Finds the nearest rational number representation of the specified value
         * compared to the current instance.
         *
         * @param {number} pNum - The number for which to return the nearest rational number.
         *
         * @return {Rational} The nearest rational representation of the given number in terms of this rational number.
         */
        nearest( pNum )
        {
            return Rational.nearestRational( pNum, this );
        }

        /**
         * Returns true if the value of the numerator is zero.
         *
         * @return {boolean} Returns true if the absolute value of the numerator is zero, otherwise false.
         */
        isZero()
        {
            return 0 === Math.abs( this.numerator );
        }

        /**
         * Returns the reciprocal of the current rational number.
         * The reciprocal of a rational number is obtained
         * by swapping its numerator and denominator.
         *
         * @return {Rational} A new Rational object that is the reciprocal
         * of the current rational number.
         */
        reciprocal()
        {
            if ( this.isZero() )
            {
                return Rational.ZERO;
            }
            return new Rational( Math.abs( this.denominator ) * this.sign, Math.abs( this.numerator ), this.options );
        }

        /**
         * Returns a new Rational number equal to the result of adding<br>
         * the nearest rational number to the specified number<br>
         * to the value of this rational number.<br>
         * <br>
         *
         * @param {number|Rational} pNum - The number or rational number to add.<br>
         *                                 If a number is passed, it will be converted to a Rational number.<br>
         *
         * @return {Rational} A new Rational instance representing the sum of the current rational number and the specified value.
         */
        add( pNum )
        {
            const other = pNum instanceof this.constructor ? pNum : Rational.fromDecimal( toDecimal( pNum ) );

            if ( this.denominator === other.denominator )
            {
                return new Rational( this.numerator + other.numerator, this.denominator );
            }

            if ( other.isZero() )
            {
                return this;
            }

            if ( this.isZero() )
            {
                return other;
            }

            const newDenominator = product( this.denominator, other.denominator );

            const thisNumerator = product( this.numerator, quotient( newDenominator, this.denominator ) );
            const otherNumerator = product( other.numerator, quotient( newDenominator, other.denominator ) );

            return new Rational( (thisNumerator + otherNumerator), newDenominator );
        }

        /**
         * Returns a new Rational number by subtracting<br>
         * the specified value from the current value<br>
         * <br>
         * This implementation adds the negated equivalent of the specified value.<br>
         * <br>
         *
         * @param {number} pNum - The number to subtract from this value
         * @return {number} A new Rational instance representing the result of subtracting the given number from this value.
         */
        subtract( pNum )
        {
            const other = pNum instanceof this.constructor ? pNum : Rational.fromDecimal( toDecimal( pNum ) );

            return this.add( other.negate() );
        }

        /**
         *
         * @returns {Rational}
         */
        negate()
        {
            return new Rational( -this.numerator, this.denominator, this.options );
        }

        /**
         * Returns a new Rational instance representing the product of this value and the specified values.<br>
         * <br>
         * The provided values can be instances of Rational or numbers.<br>
         * <br>
         * @param {...(number|Rational)} pNums - One or more values (or an array of values) to multiply by the current instance.<br>
         * Each can be either a number or an instance of the Rational class.<br>
         *
         * @return {object} A new Rational instance representing the product of the current instance and the specified value.
         */
        multiply( ...pNums )
        {
            let nums = asArray( pNums ).flat( Infinity ).map( n => Rational.from( toDecimal( n ) ) );

            let other = Rational.ONE;

            let result = this;

            switch ( nums.length )
            {
                case 0:
                    return result;

                case 1:
                    other = Rational.from( nums[0] );
                    return new Rational( this.numerator * other.numerator, this.denominator * other.denominator );

                default:
                    other = Rational.from( nums.shift() );
                    result = new Rational( this.numerator * other.numerator, this.denominator * other.denominator );
                    return result.multiply( ...nums );
            }
        }

        static from( pNum )
        {
            return pNum instanceof this.constructor ? pNum : Rational.fromDecimal( toDecimal( pNum ) );
        }

        /**
         * Returns a new Rational instance representing the result of dividing this value by the specified value.<br>
         * <br>
         * This implementation multiplies the reciprocal of the specified value by this value.<br>
         * <br>
         *
         * @param {number|Rational} pNum - The number by which to divide the current value.
         *
         * @return {number} A new Rational instance representing the result of the division.
         */
        divide( pNum )
        {
            const other = pNum instanceof this.constructor ? pNum : Rational.fromDecimal( toDecimal( pNum ) );

            return this.multiply( other.reciprocal() );
        }
    }

    /**
     * Returns the nearest Rational number
     * to a given decimal value in terms of the denominator of the second argument.<br>
     * <br>
     * The method computes the closest rational representation of the given decimal
     * by evaluating ratios of integers.<br>
     * <br>
     * We use a continued fraction algorithm to find
     * the approximated numerator and denominator values based on the resolution of the provided Rational.
     * <br>
     *
     * @function
     *
     * @param {number} pNum - The decimal value to approximate as a rational number.
     *
     * @param {number} pRational - A Rational number to define the desired resolution of the value.
     *
     * @returns {Object} An object representing the nearest Rational value.
     *
     */
    Rational.nearestRational = function( pNum, pRational )
    {
        let num = resolveNullOrNaN( pNum );

        let rational = pRational instanceof Rational ? pRational : Rational.fromDecimal( toDecimal( pRational ) );

        const msg = "The second argument must be a valid Rational object or a valid decimal value";

        if ( isNull( rational ) )
        {
            modulePrototype.reportError( new IllegalArgumentError( msg ), msg, S_WARN, modulePrototype.calculateErrorSourceName( modName, Rational.nearestRational ), pNum, pRational );
            return Rational.ZERO;
        }

        const numerator = asInt( resolveNullOrNaN( rational.numerator, 0 ) );
        const denominator = asInt( resolveNullOrNaN( rational.denominator, 1 ) );

        if ( isNanOrInfinite( numerator ) || isNanOrInfinite( denominator ) || 0 === denominator )
        {
            modulePrototype.reportError( new IllegalArgumentError( msg ), msg, S_WARN, modulePrototype.calculateErrorSourceName( modName, Rational.nearestRational ), pNum, pRational );
            return Rational.ZERO;
        }

        // Calculate the target value in terms of the denominator
        const targetNumerator = Math.round( num * denominator );

        // Return the closest rational number as a string
        return new Rational( targetNumerator, denominator );
    };

    /**
     * Constant value representing a Rational number equal to zero (0).<br>
     * @const
     * @alias module:MathUtils#classes#Rational#ZERO
     */
    Rational.ZERO = lock( new Rational( 0, 1 ) );

    /**
     * Constant value representing a Rational number equal to 1/16 (or 0.0625)<br>
     * @const
     * @alias module:MathUtils#classes#Rational#ONE_SIXTEENTH
     */
    Rational.ONE_SIXTEENTH = lock( new Rational( 1, 16 ) );

    /**
     * Constant value representing a Rational number equal to 1/13 (or 0.076923076923...)<br>
     * @const
     * @alias module:MathUtils#classes#Rational#ONE_THIRTEENTH
     */
    Rational.ONE_THIRTEENTH = lock( new Rational( 1, 13 ) );

    /**
     * Constant value representing a Rational number equal to 1/12 (or 0.08333333...)<br>
     * @const
     * @alias module:MathUtils#classes#Rational#ONE_TWELFTH
     */
    Rational.ONE_TWELFTH = lock( new Rational( 1, 12 ) );

    /**
     * Constant value representing a Rational number equal to 1/11 (or 0.09090909...)<br>
     * @const
     * @alias module:MathUtils#classes#Rational#ONE_ELEVENTH
     */
    Rational.ONE_ELEVENTH = lock( new Rational( 1, 11 ) );

    /**
     * Constant value representing a Rational number equal to 1/10 (or 0.1)<br>
     * @const
     * @alias module:MathUtils#classes#Rational#ONE_TENTH
     */
    Rational.ONE_TENTH = lock( new Rational( 1, 10 ) );

    /**
     * Constant value representing a Rational number equal to 1/9 (or 0.11111111...)<br>
     * @const
     * @alias module:MathUtils#classes#Rational#ONE_NINTH
     */
    Rational.ONE_NINTH = lock( new Rational( 1, 9 ) );

    /**
     * Constant value representing a Rational number equal to 1/8 (or 0.125)<br>
     * @const
     * @alias module:MathUtils#classes#Rational#ONE_EIGHTH
     */
    Rational.ONE_EIGHTH = lock( new Rational( 1, 8 ) );

    /**
     * Constant value representing a Rational number equal to 1/7 (or 0.142857...)<br>
     * @const
     * @alias module:MathUtils#classes#Rational#ONE_SEVENTH
     */
    Rational.ONE_SEVENTH = lock( new Rational( 1, 7 ) );

    /**
     * Constant value representing a Rational number equal to 1/5 (or 0.2)<br>
     * @const
     * @alias module:MathUtils#classes#Rational#ONE_FIFTH
     */
    Rational.ONE_FIFTH = lock( new Rational( 1, 5 ) );

    /**
     * Constant value representing a Rational number equal to 1/4 (or 0.25)<br>
     * @const
     * @alias module:MathUtils#classes#Rational#ONE_QUARTER
     */
    Rational.ONE_QUARTER = lock( new Rational( 1, 4 ) );

    /**
     * Constant value representing a Rational number equal to 1/3 (or 0.333333...)<br>
     * @const
     * @alias module:MathUtils#classes#Rational#ONE_THIRD
     */
    Rational.ONE_THIRD = lock( new Rational( 1, 3 ) );

    /**
     * Constant value representing a Rational number equal to 1/2 (or 0.5)<br>
     * @const
     * @alias module:MathUtils#classes#Rational#ONE_HALF
     */
    Rational.ONE_HALF = lock( new Rational( 1, 2 ) );


    /**
     * Constant value representing a Rational number equal to 1
     * <br>
     * @const
     * @alias module:MathUtils#classes#Rational#ONE
     */
    Rational.ONE = lock( new Rational( 1, 1 ) );

    /**
     * Constant value representing a Rational number equal to 2
     * <br>
     * @const
     * @alias module:MathUtils#classes#Rational#TWO
     */
    Rational.TWO = lock( new Rational( 2, 1 ) );

    /**
     * Constant value representing a Rational number equal to 3
     * <br>
     * @const
     * @alias module:MathUtils#classes#Rational#THREE
     */
    Rational.THREE = lock( new Rational( 3, 1 ) );

    /**
     * Constant value representing a Rational number equal to 5
     * <br>
     * @const
     * @alias module:MathUtils#classes#Rational#FIVE
     */
    Rational.FIVE = lock( new Rational( 5, 1 ) );

    /**
     * Constant value representing a Rational number equal to 7
     * <br>
     * @const
     * @alias module:MathUtils#classes#Rational#SEVEN
     */
    Rational.SEVEN = lock( new Rational( 7, 1 ) );

    /**
     * Constant value representing a Rational number equal to 9
     * <br>
     * @const
     * @alias module:MathUtils#classes#Rational#NINE
     */
    Rational.NINE = lock( new Rational( 9, 1 ) );

    /**
     * Constant value representing a Rational number equal to 10
     * <br>
     * @const
     * @alias module:MathUtils#classes#Rational#TEN
     */
    Rational.TEN = lock( new Rational( 10, 1 ) );

    let mod =
        {
            /**
             * The classes exported with this module.<br>
             * @alias module:MathUtils#classes
             */
            classes:
                {
                    RoundingMode,
                    Rational,
                },
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
            decimalExpansion,
            toSignificantDigits,
            product,
            quotient,
            sum,
            difference,
            ROUNDING_MODE,
            DEFAULT_RATIONAL_OPTIONS,
            DEFAULT_DIVISION_OPTIONS,
            round,
            gcd,
            greatestCommonFactor,
            smallestCommonFactor,
            logN,
            calculatePower

        };

    mod = modulePrototype.extend( mod );

    return mod.expose( mod, INTERNAL_NAME, (_ud !== typeof module ? module : mod) ) || mod;
}());
