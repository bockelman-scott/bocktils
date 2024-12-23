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
        toBinary,
        isClass
    } = typeUtils;

    const { asString, asInt, asFloat } = stringUtils;

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

        const num = isNanOrInfinite( pNum ) ? NaN : asFloat( pNum );

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

    class RoundingMode
    {
        #input;
        #sign;
        #precision;

        factor;
        raised;

        #precalculated = null;

        constructor( pNum, pPrecision )
        {
            this.#input = resolveNullOrNaN( pNum );

            if ( 0 === this.#input )
            {
                // rounding 0 to any precision is just 0;
                this.#precalculated = 0;
                this.#sign = 1;
            }
            else
            {
                this.#sign = Math.sign( this.#input );

                this.#precision = resolveNullOrNaN( asInt( pPrecision ) );

                if ( 0 === this.#precision && isInteger( this.input ) )
                {
                    this.#precalculated = parseInt( this.input );
                }

                this.factor = 10 ** this.precision;
                this.raised = this.applyFactor();
            }
        }

        get input()
        {
            return this.#input;
        }

        get sign()
        {
            return this.#sign || Math.sign( this.input );
        }

        get precision()
        {
            return this.#precision;
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

        removeFactor( pValue )
        {
            return quotient( pValue, this.factor );
        }

        get precalculated()
        {
            return this.#precalculated;
        }

        _round( pValue )
        {
            return Math.round( pValue );
        }

        round()
        {
            if ( null !== this.#precalculated )
            {
                return this.#precalculated;
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
            const num = Math.abs( resolveNullOrNaN( pValue ) );
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

    let mod =
        {
            classes:
                {
                    RoundingMode
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
            quotient,
            ROUNDING_MODE,
            round
        };

    mod = modulePrototype.extend( mod );

    return mod.expose( mod, INTERNAL_NAME, (_ud !== typeof module ? module : mod) ) || mod;
}());
