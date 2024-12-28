/**
 * @fileOverview
 *
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
     * This is the error message used when a non-numeric argument is passed to a method expecting a number.
     * @const
     * @type {string}
     * @alias module:MathUtils#ERROR_MSG_NON_NUMERIC
     * @private
     */
    const ERROR_MSG_NON_NUMERIC = "This function requires a numeric argument";

    /**
     * This is the error message used when division by zero is detected.
     * @const
     * @type {string}
     * @alias module:MathUtils#ERROR_MSG_DIVISION_BY_ZERO
     * @private
     */
    const ERROR_MSG_DIVISION_BY_ZERO = "Division by Zero Detected.  Returning Default Quotient";

    /**
     * The maximum value used to reduce inaccuracies in division, multiplication, addition, and subtraction of floating-point values
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
     * @returns {number|bigint} A valid number that is neither NaN nor Infinity
     *
     * @alias module:MathUtils.resolveNullOrNaN
     */
    const resolveNullOrNaN = function( pNum, pDefault = 0 )
    {
        if ( !isNumeric( pNum ) )
        {
            modulePrototype.reportError( new IllegalArgumentError( ERROR_MSG_NON_NUMERIC ), ERROR_MSG_NON_NUMERIC, S_WARN, modulePrototype.calculateErrorSourceName( modName, resolveNullOrNaN ) );

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

    function decimalExpansion( pScientificNotation )
    {
        const sNum = lcase( asString( pScientificNotation, true ) );

        const parts = sNum.split( /[eE]/i );

        let coefficient = parseFloat( parts[0] );

        let exponent = parseInt( (parts.length > 1 ? parts[1] : 0), 10 );

        coefficient = isBigInt( coefficient ) || isBigInt( exponent ) ? BigInt( coefficient ) : coefficient;
        exponent = isBigInt( coefficient ) || isBigInt( exponent ) ? BigInt( exponent ) : exponent;

        return (coefficient * (10 ** exponent)).toFixed( Math.abs( exponent ) ); // Negative exponent
    }

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

        return { int: parseInt( s ), exp, original: num };
    }

    function _integers( ...pNum )
    {
        const nums = asArray( pNum ).map( toDecimal ).filter( e => !isNanOrInfinite( e ) );

        // const signs = nums.map( e => Math.sign( e ) );

        const integers = nums.map( e => integerInfo( e ) );

        integers.forEach( ( e, i ) => isBigInt( e.int ) ? e.int = BigInt( e.int ) : e.int );

        return integers;
    }

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
     *
     * @alias module:MathUtils.quotient
     */
    const quotient = function( pDividend, pDivisor, pOptions = DEFAULT_OPTIONS_DIVISION )
    {
        const me = quotient;

        const options = populateOptions( pOptions, DEFAULT_OPTIONS_DIVISION );

        let dividend = resolveNullOrNaN( pDividend, resolveNullOrNaN( options.defaultDividend ) );

        if ( isZero( dividend ) )
        {
            return 0;
        }

        let divisor = resolveNullOrNaN( pDivisor, resolveNullOrNaN( options.defaultDivisor ) );

        if ( isZero( divisor ) )
        {
            modulePrototype.reportError( new IllegalArgumentError( ERROR_MSG_DIVISION_BY_ZERO ), ERROR_MSG_DIVISION_BY_ZERO, S_WARN, modulePrototype.calculateErrorSourceName( modName, me ) );

            return resolveNullOrNaN( options.byZero, resolveNullOrNaN( options.defaultQuotient, 0 ) );
        }

        if ( 1 === divisor )
        {
            return resolveNullOrNaN( dividend, resolveNullOrNaN( options.defaultDividend ) );
        }

        const integers = _integers( dividend, divisor );

        dividend = (integers[0]?.int || 0) * (isBigInt( (integers[0]?.int || 0) ) ? BigInt( MAX_FACTOR ) : MAX_FACTOR);
        divisor = isBigInt( dividend ) ? (BigInt( (integers[1]?.int || 1) )) : (integers[1]?.int || 1);

        const maxFactor = (isBigInt( dividend ) || isBigInt( divisor )) ? BigInt( MAX_FACTOR ) : MAX_FACTOR;

        return resolveNullOrNaN( (dividend / divisor) / maxFactor, resolveNullOrNaN( options.defaultQuotient ) );
    };

    /**
     * Returns a valid result of multiplying the first argument by the second,<br>
     * using integers to reduce floating-point inaccuracies
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
         * A rounding mode describes how to resolve values that are equidistant between 2 potential return values.<br>
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

        get useBigInt()
        {
            return this.#useBigInt;
        }

        get input()
        {
            return this.#useBigInt && isInteger( this.#input ) ? BigInt( this.#input ) : this.#input;
        }

        get sign()
        {
            return this.#useBigInt ? BigInt( this.#sign || Math.sign( this.input ) ) : this.#sign || Math.sign( this.input );
        }

        get precision()
        {
            return this.#useBigInt ? BigInt( this.#precision ) : this.#precision;
        }

        applyFactor()
        {
            const input = this.input;

            if ( isNanOrInfinite( input ) )
            {
                return input;
            }

            return this.#useBigInt && isInteger( input ) ? (BigInt( input ) * BigInt( this.factor )) : (input * this.factor);
        }

        removeFactor( pValue )
        {
            let value = resolveNullOrNaN( pValue );
            value = this.#useBigInt && isInteger( value ) ? BigInt( value ) : value;
            return quotient( value, this.factor );
        }

        get precalculated()
        {
            return this.#useBigInt && isInteger( this.#precalculated ) ? BigInt( this.#precalculated ) : this.#precalculated;
        }

        _round( pValue )
        {
            let value = resolveNullOrNaN( pValue );
            value = this.#useBigInt && isInteger( value ) ? BigInt( value ) : value;
            return Math.round( value );
        }

        round()
        {
            if ( null !== this.#precalculated )
            {
                return this.useBigInt ? BigInt( this.#precalculated ) : this.#precalculated;
            }
            return this.removeFactor( this._round( this.raised ) );
        }
    }

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

    class HalfUp extends RoundingMode
    {
        constructor( pNum, pPrecision )
        {
            super( pNum, pPrecision );
        }

        _round( pValue )
        {
            // half up is the default JavaScript behavior
            return super._round( pValue );
        }
    }

    class HalfDown extends RoundingMode
    {
        constructor( pNum, pPrecision )
        {
            super( pNum, pPrecision );
        }

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

    class ExtendedRoundingMode extends RoundingMode
    {
        factor;
        #scale_down;

        raised;
        #intForm = null;

        constructor( pNum, pPrecision )
        {
            super( pNum, pPrecision );

            if ( null === this.precalculated )
            {
                this.factor = (10 ** (this.precision + 1));

                this.raised = this.applyFactor();

                this.#scale_down = (10 ** (this.precision - 1));

                this.#intForm = this.intForm;
            }
        }

        applyFactor()
        {
            const input = this.input;

            if ( isNanOrInfinite( input ) )
            {
                return input;
            }

            return input * this.factor;
        }

        get scaleDown()
        {
            return this.#scale_down;
        }

        get intForm()
        {
            if ( null === this.#intForm )
            {
                let scale = this.scaleDown;

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

        isHalfway()
        {
            const n = Math.abs( this.intForm );
            return n % 5 === 0 && n % 10 !== 0;
        }

        isNextPowerEven()
        {
            const n = Math.abs( this.intForm );
            return (((n - 5) / 10) % 2) === 0;
        }
    }

    class HalfEven extends ExtendedRoundingMode
    {
        constructor( pNum, pPrecision )
        {
            super( pNum, pPrecision );
        }

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

    class HalfEvenTowardsInfinity extends HalfEven
    {
        constructor( pNum, pPrecision )
        {
            super( pNum, pPrecision );
        }

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

    class HalfTowardsInfinity extends ExtendedRoundingMode
    {
        constructor( pNum, pPrecision )
        {
            super( pNum, pPrecision );
        }

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

    class HalfAwayFromZero extends ExtendedRoundingMode
    {
        constructor( pNum, pPrecision )
        {
            super( pNum, pPrecision );
        }

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

    class HalfOdd extends ExtendedRoundingMode
    {
        constructor( pNum, pPrecision )
        {
            super( pNum, pPrecision );
        }

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

    const round = function( pNum, pDecimalPlaces, pRoundingMode )
    {
        const roundingMode = isClass( pRoundingMode ) ? pRoundingMode : HalfUp;
        const mode = new roundingMode( pNum, pDecimalPlaces, pRoundingMode );
        return mode.round();
    };

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

            modulePrototype.reportError( new IllegalArgumentError( msg ), msg, S_WARN, modulePrototype.calculateErrorSourceName( modName, me ) );

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

    const DEFAULT_RATIONAL_OPTIONS =
        {};

    class Rational extends Number
    {
        #numerator;
        #denominator;
        #commonFactor;

        #options;

        constructor( pNumerator, pDenominator = 1, pOptions = DEFAULT_RATIONAL_OPTIONS )
        {
            super( quotient( pNumerator, 0 === pDenominator ? 1 : pDenominator ) );

            this.#options = populateOptions( pOptions, DEFAULT_RATIONAL_OPTIONS );

            const integers = _integers( pNumerator, pDenominator );

            let numerator = integers[0].int;
            let denominator = integers[1].int;

            if ( 0 === denominator )
            {
                throw new IllegalArgumentError( "Denominator cannot be 0" );
            }

            this.#commonFactor = smallestCommonFactor( numerator, denominator );

            this.#numerator = Math.round( numerator / this.#commonFactor );
            this.#denominator = Math.round( denominator / this.#commonFactor );
        }

        static get [Symbol.species]()
        {
            return this;
        }

        get numerator()
        {
            return asInt( this.#numerator );
        }

        get denominator()
        {
            return asInt( this.#denominator );
        }

        get commonFactor()
        {
            return asInt( this.#commonFactor );
        }

        toString()
        {
            if ( 1 === this.denominator || this.isZero() )
            {
                return asString( this.numerator );
            }

            return asString( this.numerator ) + "/" + asString( this.denominator );
        }

        [Symbol.toStringTag]()
        {
            return this.toString();
        }

        valueOf()
        {
            return quotient( this.numerator, this.denominator );
        }

        static fromDecimal( pDecimal, pLargestDenominator = 1024 )
        {
            const me = Rational.fromDecimal;

            let num = toDecimal( resolveNullOrNaN( pDecimal ) );

            if( isZero( num ) )
            {
                return new Rational( 0, 1 );
            }

            if ( isNanOrInfinite( num ) )
            {
                const msg = ERROR_MSG_NON_NUMERIC;
                modulePrototype.reportError( new IllegalArgumentError( msg ), msg, S_WARN, modulePrototype.calculateErrorSourceName( modName, me ) );
            }

            const maxDenominator = Math.min( resolveNullOrNaN( pLargestDenominator, 1024 ), 32_768 );

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

            return new Rational( asInt( closestNumerator ), asInt( closestDenominator ) );
        }

        static nearestRational( pNum, pRational )
        {
            let num = resolveNullOrNaN( pNum );

            let rational = pRational instanceof this[Symbol.species] ? pRational : Rational.fromDecimal( toDecimal( pRational( pRational ) ) );

            const msg = "The second argument must be a valid Rational object or a valid decimal value";

            if ( isNull( rational ) )
            {
                modulePrototype.reportError( new IllegalArgumentError( msg ), msg, S_WARN, modulePrototype.calculateErrorSourceName( modName, Rational.nearestRational ) );
                return new Rational( 0, 1 );
            }

            const numerator = asInt( resolveNullOrNaN( rational.numerator, 0 ) );
            const denominator = asInt( resolveNullOrNaN( rational.denominator, 1 ) );

            if ( isNanOrInfinite( numerator ) || isNanOrInfinite( denominator ) || 0 === denominator )
            {
                modulePrototype.reportError( new IllegalArgumentError( msg ), msg, S_WARN, modulePrototype.calculateErrorSourceName( modName, Rational.nearestRational ) );
                return new Rational( 0, 1 );
            }

            // Calculate the target value in terms of the denominator
            const targetNumerator = Math.round( num * denominator );

            // Return the closest rational number as a string
            return new Rational( targetNumerator, denominator );
        }

        nearest( pNum )
        {
            return Rational.nearestRational( pNum, this );
        }

        isZero()
        {
            return 0 === Math.abs( this.numerator );
        }

        reciprocal()
        {
            return new Rational( this.denominator, this.numerator );
        }

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

            const thisRational = new Rational( thisNumerator, newDenominator );
            const otherRational = new Rational( otherNumerator, newDenominator );

            return thisRational.add( otherRational );
        }

        subtract( pNum )
        {
            return this.add( -pNum );
        }

        multiply( pNum )
        {
            const other = pNum instanceof this.constructor ? pNum : Rational.fromDecimal( toDecimal( pNum ) );

            return new Rational( this.numerator * other.numerator, this.denominator * other.denominator );
        }

        divide( pNum )
        {
            return this.reciprocal().multiply( pNum );
        }


    }

    let mod =
        {
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
            toSignificantDigits,
            product,
            quotient,
            ROUNDING_MODE,
            round,
            gcd,
            greatestCommonFactor,
            smallestCommonFactor,
        };

    mod = modulePrototype.extend( mod );

    return mod.expose( mod, INTERNAL_NAME, (_ud !== typeof module ? module : mod) ) || mod;
}());
