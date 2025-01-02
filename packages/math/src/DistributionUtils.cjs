const core = require( "@toolbocks/core" );

const mathUtils = require( "./MathUtils.cjs" );

const { constants, typeUtils, stringUtils, arrayUtils } = (core || mathUtils?.dependencies);

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
    const INTERNAL_NAME = "__BOCK__DISTRIBUTION_UTILS__";

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
            arrayUtils,
            mathUtils
        };

    const {
        classes,
        _mt_str,
        S_ERROR,
        S_WARN,
        __Error,
        IllegalArgumentError,
        reportError,
        calculateErrorSourceName,
        lock,
        populateOptions,
        IterationCap
    } = constants;

    const {
        isNull,
        isArray,
        isObject,
        isFunction,
        isMap,
        isSet,
        isNumber,
        isNumeric,
        isInteger,
        isFloat,
        isIterable,
        toIterable,
        isNonNullObject
    } = typeUtils;

    const { ucase } = stringUtils;

    const { asArray, lastMatchedValue, firstMatchedValue } = arrayUtils;

    const {
        classes: MathUtilsClasses,
        ROUNDING_MODE,
        resolveNullOrNaN,
        asInt,
        asFloat,
        isNanOrInfinite,
        isZero,
        product,
        quotient,
        round,
        percentToDecimal,
    } = mathUtils;

    const { RoundingMode } = MathUtilsClasses;

    const { ModulePrototype } = classes;

    /**
     * This is the name of this module
     * @const
     * @type {string}
     */
    const modName = "DistributionUtils";

    /**
     * This is the object that is returned from this function.
     * <br>
     * This object is the DistributionUtils module.<br>
     * <br>
     * The functions defined in this file are added to the module before it is exported and returned.
     * <br>
     * @type {ModulePrototype}
     */
    const modulePrototype = new ModulePrototype( modName, INTERNAL_NAME );

    const ERROR_INVALID_TOTAL = "The value to distribute must be a number greater than or less than zero.";
    const ERROR_INVALID_ITERABLE = "The iterable object must be an iterable object.";
    const ERROR_INVALID_NUM_ENTRIES = "The number of entries must be a number greater than zero.";

    const WARNING_UNEXPECTED_NUMBER_OF_ENTRIES = "The number of distribution entries is less than the number of entries expected.";
    const WARNING_UNALLOCATED_AMOUNT = "Unallocated amount due to rounding errors.";
    const WARNING_CANNOT_TRANSFORM = "Cannot transform the distribution according to the specified options.";

    /**
     * @typedef {Object} RedistributionOption Defines how to handle any unallocated amount due to rounding errors
     *
     * @property {string} name The name and identifier for this RedistributionOption
     *
     * @property [ignore=false] When true, any amount that could not be distributed is ignored
     *
     * @property [index=-1] The index of the distribution into which to allocate the undistributed amount<br>
     *                      If this value is less than 0, the other properties of this option will determine how to unallocated amount is spread<br>
     *                      If this value is greater than or equal to the number of entries in the distribution,<br>
     *                      the unallocated amount will be added to the last entry in the distribution
     *
     * @property [byWeightedAverage=false] If true, any unallocated amount that has not been allocated as per the index property
     *                                     is allocated by spreading it across the distribution according to the relative percentages of each entry to the total,<br>
     *                                     Otherwise, the unallocated amount is spread evently across the distribution
     *
     */

    /**
     * These are the predefined strategies for handling unallocated amounts due to rounding errors
     * @namespace REDISTRIBUTION_OPTIONS
     * @dict
     * @const
     * @readonly
     * @type {{}}
     */
    const REDISTRIBUTION_OPTIONS = lock(
        {
            /**
             * Unallocated amounts are ignored
             * @type {RedistributionOption}
             */
            IGNORE:
                {
                    name: "IGNORE",
                    ignore: true,
                    index: -1,
                    byWeightedAverage: false,
                },
            /**
             * Any unallocated amount is added to the last entry
             * @type {RedistributionOption}
             */
            LAST_ENTRY:
                {
                    name: "LAST_ENTRY",
                    ignore: false,
                    index: Number.MAX_SAFE_INTEGER,
                    byWeightedAverage: false,
                },
            /**
             * Any unallocated amount is added to the first entry
             * @type {RedistributionOption}
             */
            FIRST_ENTRY:
                {
                    name: "FIRST_ENTRY",
                    ignore: false,
                    index: 0,
                    byWeightedAverage: false,
                },
            /**
             * Any unallocated amount is redistributed across the distribution according to the relative percentage of the total of each entry
             * @type {RedistributionOption}
             */
            WEIGHTED_AVERAGE:
                {
                    name: "WEIGHTED_AVERAGE",
                    ignore: false,
                    index: -1,
                    byWeightedAverage: true,
                }
        } );

    /**
     * This object defines the default options for handling unallocated amounts to be distributed
     *
     * @constant {REDISTRIBUTION_OPTIONS} DEFAULT_REDISTRIBUTION_OPTION
     */
    const DEFAULT_REDISTRIBUTION_OPTION = REDISTRIBUTION_OPTIONS.LAST_ENTRY;

    /**
     * @typedef {Object} DistributionOptions
     *
     * @property {number} [precision=6] The number of decimals to which to round<br>
     *                                  the values to be distributed and each entry of a distribution<br>
     * @property {RoundingMode} [roundingMode=ROUNDING_MODE.HALF_EVEN] The rounding mode to use<br>
     *                                                                 when rounding values that exceed the specified precision
     *
     * @property {RedistributionOption} [redistributionOption=DEFAULT_REDISTRIBUTION_OPTION] Defines how to allocate remaining values resulting from rounding errors
     *
     * @property {number} [allowedRecursions=3] The number of times the function can call itself to improve accuracy
     *
     * @property {Iterable|Array} [iterable=null] Used if no iterable is passed to a function taking an iterable
     *
     * @property {Map<*,number>|Array<number>|Set<number>|Object} [modelDistribution=null] A distribution to weight the distribution generated
     *
     * @property {number} [expectedEntries=0] The expected number of entries in the resulting distribution
     *
     */

    /**
     * These are the default distribution options.<br>
     * @namespace DEFAULT_DISTRIBUTION_OPTIONS
     * @type {DistributionOptions}
     */
    const DEFAULT_DISTRIBUTION_OPTIONS =
        {
            precision: 6,
            roundingMode: ROUNDING_MODE.HALF_EVEN,
            redistributionOption: DEFAULT_REDISTRIBUTION_OPTION,
            allowedRecursions: 3,

            iterable: null,
            modelDistribution: null,
            expectedEntries: 0,
        };

    /**
     * @typedef {Object} ErrorInfo
     *
     * @property {Array<*>} parameters An array of the arguments passed to the function reporting an error
     *
     * @property {string} [source=""] The name of the module and function reporting the error
     *
     * @property {Object|DistributionOptions} options The options passed to the function reporting an error
     *
     * @property {number} sum The currently calculated sum of the entries of a distribution
     *
     * @property {number} remainder The current value remaining to be allocated at the time error is encountered
     *
     * @property {number} preciseRemainder The current un-rounded value remaining to be allocated at the time the error is encountered
     *
     * @property {number} count The size of the distribution being generated at the time the error is encountered
     *
     */

    /**
     * Constructs an error information object with the provided parameters.
     * @constructs ErrorInfo
     * @param {Array|any} pParameters - The parameters to be processed and included in the error info.
     * @param {string} pSource
     * @param {Object} pOptions - Optional configurations to include in the error info.
     * @param {number} pSum - The sum value to include in the error info.
     * @param {number} pRemainder - The remainder value to include in the error info.
     * @param {number} pPreciseRemainder - The precise remainder value to include in the error info.
     * @param {number} pCount - The count value to include in the error info.
     *
     * @return {ErrorInfo} An object containing resolved and processed error information: parameters, options, sum, remainder, preciseRemainder, and count.
     *
     * @private
     */
    function ErrorInfo( pParameters, pSource, pOptions, pSum, pRemainder, pPreciseRemainder, pCount )
    {
        return {
            parameters: asArray( pParameters ),
            source: pSource || _mt_str,
            options: Object.assign( {}, pOptions || {} ),
            sum: resolveNullOrNaN( pSum || 0 ),
            remainder: resolveNullOrNaN( pRemainder || 0 ),
            preciseRemainder: resolveNullOrNaN( pPreciseRemainder || 0 ),
            count: resolveNullOrNaN( pCount || 0 ),
            update: function( pNewValues )
            {
                const newValues = Object.assign( pNewValues || {} );
                Object.entries( newValues ).forEach( ( [key, value] ) =>
                                                     {
                                                         this[key] = value;
                                                     } );

                return this;
            }
        };
    }

    ErrorInfo.prototype.update = function( pNewValues )
    {
        const newValues = Object.assign( pNewValues || {} );
        Object.entries( newValues ).forEach( ( [key, value] ) =>
                                             {
                                                 this[key] = value;
                                             } );

        return this;
    };

    /**
     * Updates the provided error information object with new values.
     *
     * @param {ErrorInfo|{parameters, source:string, options: DistributionOptions, sum, remainder, preciseRemainder, count}} pErrorInfo - The error information object to update.
     * @param {Object} pNewValues - The object containing new key-value pairs to add or update in the error information.
     *
     * @return {ErrorInfo} The updated error information object.
     *
     * @private
     */
    function updateErrorInfo( pErrorInfo, pNewValues )
    {
        const newValues = Object.assign( pNewValues || {} );

        return isFunction( pErrorInfo.update ) ?
               pErrorInfo.update( newValues ) :
               new ErrorInfo( newValues.parameters || pErrorInfo?.parameters || [],
                              newValues.source || pErrorInfo?.source || _mt_str,
                              newValues.options || pErrorInfo?.options || {},
                              newValues?.sum || pErrorInfo?.sum || 0,
                              newValues.remainder || pErrorInfo?.remainder || 0,
                              newValues.preciseRemainder || pErrorInfo?.preciseRemainder || 0,
                              newValues.count || pErrorInfo.count || 0 );
    }

    /**
     * Resolves the sign of the provided value or deduces it from the sum of the distribution values.
     * <br>
     * <br>
     *
     * @param {number} pSign The sign value to resolve (can be 0, -1, or 1);<br>
     *                       if not numeric, it defaults to 0 and is calculated based on the distribution.<br>
     * @param {Map} pDistribution The distribution map used to calculate the sign when no valid `pSign` is provided.
     *
     * @returns {number} Returns the sign (-1, 0, or 1) deduced from the `pSign` or `pDistribution`.
     */
    function resolveSign( pSign, pDistribution )
    {
        let sign = isNumeric( pSign ) ? asInt( pSign ) : 0;

        if ( 0 === sign )
        {
            const value = asArray( pDistribution.values() ).reduce( ( accumulator, value ) => accumulator + asFloat( value ), 0 );

            sign = Math.sign( value );
        }

        if ( Math.abs( sign ) > 1 )
        {
            sign = Math.sign( sign );
        }

        return 0 === sign ? 1 : sign;
    }

    function resolveIterable( pIterable, options )
    {
        let iterable = isIterable( pIterable ) ? pIterable || options.iterable : options.iterable;

        return !isIterable( iterable ) ? toIterable( iterable || {} ) : iterable || {};
    }

    function resolveExpectedEntries( pNumEntries, pIterable, pOptions = DEFAULT_DISTRIBUTION_OPTIONS )
    {
        const options = populateOptions( pOptions, DEFAULT_DISTRIBUTION_OPTIONS );

        let numEntries = isNumeric( pNumEntries ) ? asInt( pNumEntries ) : 0;

        if ( numEntries <= 0 )
        {
            const iterable = resolveIterable( pIterable, options );

            numEntries = resolveNullOrNaN( iterable.size || iterable.length );
        }

        if ( numEntries <= 0 )
        {
            const modelDistribution = options.modelDistribution;
            if ( modelDistribution )
            {
                numEntries = resolveNullOrNaN( modelDistribution.size || modelDistribution.length );
            }
        }

        return Math.max( 1, numEntries );
    }

    function resolveModelDistribution( pModelDistribution, options )
    {
        let modelDistribution = isMap( pModelDistribution ) ||
                                isSet( pModelDistribution ) ||
                                isArray( pModelDistribution ) ||
                                isNonNullObject( pModelDistribution ) ?
                                pModelDistribution || options.modelDistribution :
                                options.modelDistribution;

        if ( isMap( modelDistribution ) ||
             isSet( modelDistribution ) ||
             isArray( modelDistribution ) ||
             isNonNullObject( modelDistribution ) )
        {
            if ( modelDistribution.size || modelDistribution.length || Object.keys( modelDistribution ).length )
            {
                return modelDistribution;
            }
        }

        return null;
    }

    /**
     * Returns true if the specified value is not NaN, infinite, or zero.<br>
     * <br>
     * Also emits an error event if it is not.<br>
     *
     * @param {number} pTotal - The value to be validated.
     * @param {string} pSourceName - The name of the source for error reporting.
     * @param {ErrorInfo} pErrorInfo - Additional error context or metadata.
     *
     * @return {boolean} Returns true if the total is valid, false otherwise.
     */
    function isValidTotal( pTotal, pSourceName, pErrorInfo )
    {
        if ( isNanOrInfinite( pTotal ) || isZero( pTotal ) )
        {
            const error = new IllegalArgumentError( ERROR_INVALID_TOTAL );

            reportError.call( modulePrototype, error, ERROR_INVALID_TOTAL, S_ERROR, pSourceName, pErrorInfo );

            return false;
        }
        return true;
    }

    /**
     * Returns true if the specified number of entries<br>
     * is a valid integer greater than or equal to 1.<br>
     * Also emits an error event if it is not.<br>
     *
     * @param {number} pNumEntries - The number of entries to validate.
     * @param {string} pErrorSourceName - The source name to be used for the error report in case of invalid input.
     * @param {ErrorInfo} pErrorInfo - Additional information to be included in the error report.
     *
     * @return {boolean} Returns true if the number of entries is valid, otherwise returns false.
     */
    function isValidNumberOfEntries( pNumEntries, pErrorSourceName, pErrorInfo )
    {
        if ( isNanOrInfinite( pNumEntries ) || pNumEntries < 1 || !isInteger( pNumEntries ) )
        {
            reportError.call( modulePrototype, new IllegalArgumentError( ERROR_INVALID_NUM_ENTRIES ), ERROR_INVALID_NUM_ENTRIES, S_ERROR, pErrorSourceName, pErrorInfo );

            return false;
        }
        return true;
    }

    /**
     * Returns true if the specified value is a valid iterable<br>
     * Also emits an error event if it is not.<br>
     * <br>
     *
     * @param {any} pIterable The item to be checked for iterable validity.
     * @param {string} pErrorSourceName The name of the error source for reporting purposes.
     * @param {ErrorInfo} pErrorInfo Additional information to include in the error report.
     * @return {boolean} Returns true if the parameter is a valid iterable, otherwise false.
     */
    function isValidIterable( pIterable, pErrorSourceName, pErrorInfo )
    {
        if ( !isIterable( pIterable ) )
        {
            reportError.call( modulePrototype, new IllegalArgumentError( ERROR_INVALID_ITERABLE ), ERROR_INVALID_ITERABLE, S_ERROR, pErrorSourceName, pErrorInfo );

            return false;
        }
        return true;
    }

    /**
     * Recalculates and returns the summation, remainder, and precise remainder for the specified distribution.
     *
     * @param {Map} pDistribution - A map containing the distribution values. Defaults to an empty Map if null or undefined.
     * @param {number} pTotal - The total value, which overrides the summation if provided. Defaults to the summation of the distribution values if null or NaN.
     * @param {number} pOriginalTotal - The original total value, used to calculate the precise remainder. Defaults to the value of `pTotal` if null or NaN.
     *
     * @return {Object} An object containing the following properties:
     *                  - `summation` (number): The sum of all values in the distribution.
     *                  - `remainder` (number): The difference between the summation and `pTotal`.
     *                  - `preciseRemainder` (number): The difference between the summation and `pOriginalTotal`.
     *
     * @private
     */
    function recalculateRemainder( pDistribution, pTotal, pOriginalTotal )
    {
        const distribution = pDistribution || new Map();

        const summation = asArray( distribution.values() ).reduce( ( accumulator, value ) => accumulator + asFloat( value ), 0 );

        const total = resolveNullOrNaN( pTotal, summation );

        const originalTotal = resolveNullOrNaN( pOriginalTotal, total );

        const remainder = summation - total;

        const preciseRemainder = summation - originalTotal;

        return {
            summation: summation,
            remainder: remainder,
            preciseRemainder: preciseRemainder,
        };
    }

    /*
     if ( count < numEntries )
     {
     reportError.call( modulePrototype, new IllegalArgumentError( WARNING_UNEXPECTED_NUMBER_OF_ENTRIES ), WARNING_UNEXPECTED_NUMBER_OF_ENTRIES, S_WARN, errorSourceName, errorInfo );
     }

     if ( 0 - preciseRemainder > 0.00000000000005 )
     {
     reportError.call( modulePrototype, new IllegalArgumentError( WARNING_UNALLOCATED_AMOUNT ), WARNING_UNALLOCATED_AMOUNT, S_WARN, errorSourceName, errorInfo );
     }

     */

    /**
     * @typedef {Object} ReconciliationValues The values to pass to the reconciliation function
     *
     * @property {Map<*,number>} distribution
     * @property {number} remainder
     * @property {number} sign
     * @property {DistributionFunction} distributionFunction
     * @property {Map<*,number>} [modelDistribution=null]
     * @property {number} [total]
     * @property {number} [summation]
     * @property {ErrorInfo|{parameters, source:string, options: DistributionOptions, sum, remainder, preciseRemainder, count}} [errorInfo]
     * @property {number} [count]
     * @property {number} [expectedEntries=0]
     * @property {number} [originalTotal]
     * @property {number} [preciseRemainder]
     * @property {Array<number>} [weights=[]]
     *
     */

    function buildReconciliationValues( pDistribution,
                                        remainder,
                                        sign,
                                        distributionFunction,
                                        modelDistribution,
                                        total,
                                        summation,
                                        errorInfo,
                                        count,
                                        expectedEntries,
                                        originalTotal,
                                        preciseRemainder,
                                        weights )
    {
        let distribution = pDistribution || new Map();

        let distributionTotal = asArray( pDistribution.values() ).reduce( ( accumulator, value ) => accumulator + asFloat( value ), 0 );

        let errorSourceName = calculateErrorSourceName( modName, distributionFunction || reconcile );

        return {
            distribution: distribution,
            remainder: remainder || ((total || distributionTotal) - (summation || distributionTotal)),
            sign: resolveSign( sign, pDistribution ),
            distributionFunction: isFunction( distributionFunction ) ? distributionFunction : isNull( modelDistribution ) ? generateEvenDistribution : transformDistribution,
            modelDistribution: resolveModelDistribution( modelDistribution, DEFAULT_DISTRIBUTION_OPTIONS ),
            total: total || distributionTotal,
            summation: summation || distributionTotal,
            errorInfo: errorInfo || new ErrorInfo( [...arguments], errorSourceName, {}, summation, remainder, preciseRemainder, count ),
            count: count || distribution?.size,
            originalTotal: originalTotal || total || distributionTotal,
            expectedEntries: expectedEntries || count || distribution?.size,
            weights: weights || []
        };
    }

    /**
     *
     * @param {ReconciliationValues} pReconciliationValues
     * @param {DistributionOptions} pOptions
     * @returns {Map<*,number>}
     */
    function reconcile( pReconciliationValues, pOptions )
    {
        const options = populateOptions( pOptions, DEFAULT_DISTRIBUTION_OPTIONS );

        const reconciliationValues = Object.assign( {}, pReconciliationValues || {} );

        let distribution = reconciliationValues.distribution || new Map();

        let distributionTotal = asArray( distribution.values() ).reduce( ( accumulator, value ) => accumulator + asFloat( value ), 0 );

        let total = reconciliationValues.total || distributionTotal;
        let originalTotal = reconciliationValues.originalTotal || total;

        let summation = reconciliationValues.summation || distributionTotal;

        let remainder = reconciliationValues.remainder || (total - summation);
        let preciseRemainder = reconciliationValues.preciseRemainder || (originalTotal - summation);

        let count = reconciliationValues.count || distribution.size;

        let distributionFunction = reconciliationValues.distributionFunction || generateEvenDistribution;

        let errorSourceName = calculateErrorSourceName( modName, distributionFunction || reconcile );

        let errorInfo = reconciliationValues.errorInfo || new ErrorInfo( [reconciliationValues, distribution, total, originalTotal, summation, remainder, preciseRemainder, count], errorSourceName, options, summation, remainder, preciseRemainder, count );

        const weights = asArray( reconciliationValues.weights || [] );

        const sign = resolveSign( reconciliationValues.sign, distribution );

        const numEntries = resolveExpectedEntries( reconciliationValues.expectedEntries || count, options );

        const modelDistribution = resolveModelDistribution( reconciliationValues.modelDistribution, options );

        const allowedRecursions = options.allowedRecursions;

        const precision = options.precision;

        if ( (summation !== total || remainder !== 0) )
        {
            function recalculate( pDistribution )
            {
                const distribution = pDistribution || new Map();

                const newRemainder = recalculateRemainder( distribution, total, originalTotal );

                remainder = newRemainder.remainder;
                preciseRemainder = newRemainder.preciseRemainder;
                summation = newRemainder.summation;

                updateErrorInfo( errorInfo,
                                 {
                                     sum: summation,
                                     remainder: remainder,
                                     preciseRemainder: preciseRemainder,
                                     count: count
                                 } );
            }

            let recursions = 0;

            while ( (summation !== total || remainder !== 0) && recursions++ < allowedRecursions )
            {
                const redistributionOption = options.redistributionOption;

                if ( redistributionOption === REDISTRIBUTION_OPTIONS.IGNORE )
                {
                    reportError.call( modulePrototype, new IllegalArgumentError( WARNING_UNALLOCATED_AMOUNT ), WARNING_UNALLOCATED_AMOUNT, S_WARN, errorSourceName, errorInfo );

                    return distribution;
                }

                distribution = distributeRemainder( distribution, weights, remainder, sign, options );

                recalculate( distribution );
            }

            recursions = 0;

            while ( (summation !== total || remainder !== 0) && recursions++ < allowedRecursions )
            {
                const newOptions = Object.assign( {}, options );
                newOptions.precision = asInt( precision ) + 1;
                newOptions.allowedRecursions = asInt( allowedRecursions ) - 1;

                distribution = distributionFunction.call( modulePrototype, total, distribution.keys(), numEntries, modelDistribution, newOptions );

                recalculate( distribution );
            }
        }

        return distribution;
    }

    /**
     *
     * @param {Map} pDistribution The Map of entries to adjust
     * @param {Array<number>} pWeights An array of the percentage of the total <br>
     *                                 allocated to the distribution entry at that index
     * @param {number} [pRemainder=0] The remainder to be distributed
     * @param {number} [pSign=1] The sign (-1 or +1) of the total
     * @param {DistributionOptions} pOptions The DistributionOptions defining
     *                                       how to allocate the total across the entries
     *                                       and how to resolve unallocated amounts due
     *                                       to accumulated rounding errors
     */
    const distributeRemainder = function( pDistribution, pWeights, pRemainder, pSign, pOptions = DEFAULT_DISTRIBUTION_OPTIONS )
    {
        const distribution = pDistribution || new Map();

        let remainder = isNumeric( pRemainder ) ? asFloat( pRemainder ) : 0;

        if ( 0 === remainder )
        {
            return distribution;
        }

        const options = populateOptions( pOptions, DEFAULT_DISTRIBUTION_OPTIONS );

        const redistributionOption = options.redistributionOption;

        const distributionOption = ucase( options.name || redistributionOption.name );

        if ( "IGNORE" === distributionOption )
        {
            return distribution;
        }

        const indices = asArray( distribution.keys() );

        let sign = resolveSign( pSign, distribution );

        if ( indices.length <= 0 )
        {
            distribution.set( null, remainder * sign );

            return distribution;
        }

        let key = "LAST_ENTRY" === distributionOption ? lastMatchedValue( e => e !== 0, indices ) : "FIRST_ENTRY" === distributionOption ? firstMatchedValue( e => 0 !== e, indices ) : null;

        if ( key )
        {
            let value = Math.abs( asFloat( distribution.get( key ) || 0 ) );

            value += remainder;

            value = round( value, asInt( options.precision ), options.roundingMode );

            distribution.set( key, value * sign );

            return distribution;
        }

        const weights = asArray( pWeights );

        const iterationCap = new IterationCap( distribution.size * 10 );

        while ( remainder !== 0 && !iterationCap.reached )
        {
            for( let i = 0, n = weights.length; i < n; i++ )
            {
                const weighted = round( remainder * weights[i], asInt( options.precision ), options.roundingMode );

                if ( 0 === weighted )
                {
                    continue;
                }

                const key = indices[i];

                let value = Math.abs( asFloat( distribution.get( key ) || 0 ) );

                value += weighted;

                distribution.set( key, value * sign );

                remainder -= weighted;

                if ( remainder === 0 )
                {
                    break;
                }
            }
        }

        return distribution;
    };

    /**
     * @typedef {function(number, Iterable, number, Iterable, DistributionOptions )} DistributionFunction
     *
     *
     */


    /**
     * Returns a Map whose keys are the elements of the iterable object specified
     * and whose values are the percentage of the total for that elements.<br>
     * <br>
     * Because we assume the iterable could be asynchronous or "lazy",
     * the third argument specifies how many entries we expect in the returned Map.<br>
     * <br>
     * Typical use cases include spreading a dollar amount across dates.<br>
     *
     * @param {number} pTotal The total amount to spread evenly across the entries of the returned Map
     * @param {Object} pIterable An object that supports the "for..of" iteration
     * @param {number} pNumEntries The number of entries expected in the returned Map
     * @param  pModelDistribution A distribution to weight the distribution generated<br>
     *                            If provided, this method will call transformDistribution with this argument before returning<br>
     * @param {DistributionOptions} pOptions The DistributionOptions defining
     *                                       how to allocate the total across the entries
     *                                       and how to resolve unallocated amounts due
     *                                       to accumulated rounding errors
     *
     * @type DistributionFunction
     */
    const generateEvenDistribution = function( pTotal, pIterable, pNumEntries, pModelDistribution, pOptions = DEFAULT_DISTRIBUTION_OPTIONS )
    {
        const options = populateOptions( pOptions, DEFAULT_DISTRIBUTION_OPTIONS );

        let total = isNumeric( pTotal ) ? asFloat( pTotal ) : 0;

        const iterable = resolveIterable( pIterable, options );

        const numEntries = resolveExpectedEntries( pNumEntries, iterable, options );

        const errorSourceName = calculateErrorSourceName( modName, generateEvenDistribution );

        const errorInfo = new ErrorInfo( [...arguments], errorSourceName, options, 0, 0, 0, 0 );

        let canContinue = isValidTotal( total, errorSourceName, errorInfo );
        canContinue &= isValidNumberOfEntries( numEntries, errorSourceName, errorInfo );
        canContinue &= isValidIterable( iterable, errorSourceName, errorInfo );

        let distribution = new Map();

        if ( !canContinue )
        {
            return distribution;
        }

        const sign = Math.sign( total );

        const originalTotal = Math.abs( total );

        const precision = asInt( options.precision );

        const roundingMode = options.roundingMode;

        total = round( originalTotal, precision, roundingMode );

        const roundingOptions =
            {
                limitToSignificantDigits: true,
                significantDigits: precision
            };

        // Calculate the even distribution value for each entry
        const value = round( quotient( total, numEntries, roundingOptions ), precision, roundingMode );

        let summation = 0;
        let count = 0;

        let remainder = total;
        let preciseRemainder = originalTotal;

        let weights = [];

        for( const key of iterable )
        {
            if ( count >= numEntries )
            {
                break; // Stop once the expected number of entries is processed
            }

            distribution.set( key, (sign * value) );

            summation += value;

            remainder -= value;
            preciseRemainder -= value;

            weights.push( quotient( value, total ) );

            count++;
        }

        if ( count < numEntries )
        {
            reportError.call( modulePrototype, new IllegalArgumentError( WARNING_UNEXPECTED_NUMBER_OF_ENTRIES ), WARNING_UNEXPECTED_NUMBER_OF_ENTRIES, S_WARN, errorSourceName, errorInfo.update( {
                                                                                                                                                                                                      sum: summation,
                                                                                                                                                                                                      remainder: remainder,
                                                                                                                                                                                                      preciseRemainder: preciseRemainder,
                                                                                                                                                                                                      count: count
                                                                                                                                                                                                  } ) );
        }

        if ( 0 - preciseRemainder > 0.00000000000005 )
        {
            reportError.call( modulePrototype, new IllegalArgumentError( WARNING_UNALLOCATED_AMOUNT ), WARNING_UNALLOCATED_AMOUNT, S_WARN, errorSourceName, errorInfo.update( {
                                                                                                                                                                                  sum: summation,
                                                                                                                                                                                  remainder: remainder,
                                                                                                                                                                                  preciseRemainder: preciseRemainder,
                                                                                                                                                                                  count: count
                                                                                                                                                                              } ) );
        }

        if ( (summation !== total || remainder !== 0) )
        {
            const reconciliationValues = buildReconciliationValues( distribution, remainder, sign, generateEvenDistribution, null, total, summation, errorInfo, count, numEntries, originalTotal, preciseRemainder, weights );
            distribution = reconcile( reconciliationValues, options );
        }

        let modelDistribution = resolveModelDistribution( pModelDistribution, options );

        if ( modelDistribution )
        {
            try
            {
                distribution = transformDistribution( total, distribution, modelDistribution, options );
            }
            catch( ex )
            {
                reportError.call( modulePrototype, new __Error( WARNING_CANNOT_TRANSFORM ), WARNING_CANNOT_TRANSFORM, S_WARN, errorSourceName, errorInfo );
            }
        }

        return distribution;
    };

    const generateEvenDistributionAsync = async function( pTotal, pIterable, pNumEntries, pOptions = DEFAULT_DISTRIBUTION_OPTIONS )
    {
        return generateEvenDistribution( pTotal, pIterable, pNumEntries, pOptions );
    };

    function numKeysPerSegment( pSegments, pNumEntries )
    {
        const numEntries = isNumeric( pNumEntries ) ? asInt( pNumEntries ) : 0;

        const segments = asArray( pSegments?.values() || pSegments || [] );

        const sortedSegments = segments.map( ( e, i ) => [e, i] ).sort( ( a, b ) => b[0] - a[0] );

        const perSegment = quotient( numEntries, segments.length );

        const mapped = segments.map( ( e, i ) => [i, e, perSegment] );

        while ( mapped.some( e => !isInteger( e[2] ) ) && sortedSegments.length > 0 )
        {
            let idx = sortedSegments[0][1];

            const integer = round( mapped[idx][2], 0, ROUNDING_MODE.TRUNC ) + 1;

            mapped[idx][2] = integer;

            let diff = integer - perSegment;

            idx = sortedSegments[sortedSegments.length - 1][1];

            const adjusted = mapped[idx][2] - diff;

            mapped[idx][2] = adjusted;

            if ( isInteger( adjusted ) )
            {
                sortedSegments.splice( idx, 1 );
            }

            sortedSegments.splice( 0, 1 );
        }

        return mapped.map( e => e[2] );
    }

    function distributionToArray( pDistribution )
    {
        if ( isArray( pDistribution ) )
        {
            return asArray( pDistribution );
        }
        else if ( isMap( pDistribution ) || isSet( pDistribution ) )
        {
            return asArray( [...pDistribution.values()] );
        }
        else if ( isObject( pDistribution ) )
        {
            return asArray( Object.values( pDistribution ) );
        }
        else if ( isIterable( pDistribution ) )
        {
            asArray( pDistribution );
        }
        else if ( isFunction( pDistribution ) )
        {
            let result = [];

            try
            {
                result = pDistribution();
            }
            catch( ex )
            {
                const errorSourceName = calculateErrorSourceName( modName, distributionToArray );
                reportError.call( modulePrototype, ex, ex.message, S_ERROR, errorSourceName, new ErrorInfo( [pDistribution], errorSourceName, DEFAULT_DISTRIBUTION_OPTIONS, 0, 0, 0, 0 ) );
            }

            return result;
        }
        else if ( isNumber( pDistribution ) )
        {
            return [pDistribution];
        }

        return pDistribution;
    }


    /**
     * Transforms one distribution to another.<br>
     * <br>
     *
     * Given a total numeric value,
     * a Map of Percentages by key,
     * an iterable of keys,
     * and a number of entries to generate,
     * returns a Map by the keys of the iterable
     * distributing the total according to the percentages of the segments.
     *
     * An example would be a distribution of subject enrollment by quartile, such as
     * the enrollment of 100 subjects
     * where 30% enroll in the first quartile,
     * 20% enroll in the second quartile,
     * 40% enroll in the third quartile,
     * and 10% enroll in the fourth quartile
     * distributing across dates representing the first day of the week for 23 weeks.
     *
     * @param {number} pTotal The total value to be redistributed
     * @param {Map<*,number>} pModelDistribution The distribution, a Map (or map-like object) or an array whose values are percentages that total 100%
     * @param {Iterable} pIterable An iterable defining the keys of the desired distribution
     * @param {number} pNumEntries The number of entries expected in the returned distribution
     * @param {DistributionOptions} pOptions The DistributionOptions defining
     *                                       how to allocate the total across the entries
     *                                       and how to resolve unallocated amounts due
     *                                       to accumulated rounding errors
     *
     * @type DistributionFunction
     */
    const transformDistribution = function( pTotal, pIterable, pNumEntries, pModelDistribution, pOptions = DEFAULT_DISTRIBUTION_OPTIONS )
    {
        const options = populateOptions( pOptions, DEFAULT_DISTRIBUTION_OPTIONS );

        let iterable = resolveIterable( pIterable, options );

        const numEntries = resolveExpectedEntries( pNumEntries, iterable, options );

        let total = resolveNullOrNaN( isNumeric( pTotal ) ? asFloat( pTotal ) : 0 );

        let distribution = new Map();

        const errorSourceName = calculateErrorSourceName( modulePrototype, transformDistribution );

        const errorInfo = new ErrorInfo( [...arguments], errorSourceName, options, 0, 0, 0, 0 );

        let canContinue = isValidTotal( total, errorSourceName, errorInfo );
        canContinue &= isValidNumberOfEntries( numEntries, errorSourceName, errorInfo );
        canContinue &= isValidIterable( iterable, errorSourceName, errorInfo );

        if ( !canContinue )
        {
            return distribution;
        }

        const sign = Math.sign( total );

        const originalTotal = Math.abs( total );

        const precision = asInt( options.precision );
        const roundingMode = options.roundingMode;

        total = round( originalTotal, precision, roundingMode );

        const roundingOptions = {
            limitToSignificantDigits: true,
            significantDigits: precision
        };

        let segments = distributionToArray( pModelDistribution );

        const keysPerSegment = numKeysPerSegment( segments, numEntries );

        segments = percentToDecimal( ...segments );

        let summation = 0;

        let remainder = total;
        let preciseRemainder = originalTotal;

        let weights = [];

        let curSegment = 0;

        let count = 0;

        let segmentCount = 1;
        let segmentBoundary = keysPerSegment[curSegment];
        let segmentPct = segments[curSegment];

        for( const key of iterable )
        {
            if ( segmentCount > segmentBoundary )
            {
                curSegment++;
                segmentBoundary = keysPerSegment[curSegment];
                segmentPct = segments[curSegment];
                segmentCount = 1;
            }

            if ( curSegment >= segments.length || count >= numEntries )
            {
                break;
            }

            const productResult = product( total, segmentPct );
            const value = quotient( productResult, segmentBoundary, roundingOptions );

            distribution.set( key, (sign * value) );

            summation += value;

            remainder -= value;
            preciseRemainder -= value;

            weights.push( quotient( value, total ) );

            segmentCount++;
            count++;
        }

        if ( count < numEntries )
        {
            reportError.call( modulePrototype, new Error( WARNING_UNEXPECTED_NUMBER_OF_ENTRIES ), WARNING_UNEXPECTED_NUMBER_OF_ENTRIES, S_WARN, errorSourceName, errorInfo.update( {
                                                                                                                                                                                       sum: summation,
                                                                                                                                                                                       remainder: remainder,
                                                                                                                                                                                       preciseRemainder: preciseRemainder,
                                                                                                                                                                                       count: count
                                                                                                                                                                                   } ) );
        }

        if ( 0 - preciseRemainder > 0.00000000000005 )
        {
            reportError.call( modulePrototype, new Error( WARNING_UNALLOCATED_AMOUNT ), WARNING_UNALLOCATED_AMOUNT, S_WARN, errorSourceName, errorInfo.update( {
                                                                                                                                                                   sum: summation,
                                                                                                                                                                   remainder: remainder,
                                                                                                                                                                   preciseRemainder: preciseRemainder,
                                                                                                                                                                   count: count
                                                                                                                                                               } ) );
        }

        if ( (summation !== total || remainder !== 0) )
        {
            const reconciliationValues = buildReconciliationValues( distribution, remainder, sign, transformDistribution, segments, total, summation, errorInfo, count, numEntries, originalTotal, preciseRemainder, weights );
            distribution = reconcile( reconciliationValues, options );
        }

        return distribution;
    };

    let mod =
        {
            generateEvenDistribution,
            generateEvenDistributionAsync,
            transformDistribution,
            DEFAULT_DISTRIBUTION_OPTIONS,
            REDISTRIBUTION_OPTIONS,
            DEFAULT_REDISTRIBUTION_OPTION,
            numKeysPerSegment
        };

    mod = modulePrototype.extend( mod );

    return mod.expose( mod, INTERNAL_NAME, (_ud !== typeof module ? module : mod) ) || mod;

}());