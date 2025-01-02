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
        S_ERROR,
        S_WARN,
        IllegalArgumentError,
        reportError,
        calculateErrorSourceName,
        lock,
        populateOptions,
        IterationCap
    } = constants;

    const { isNumber, isNumeric, isInteger, isFloat, isIterable, toIterable } = typeUtils;

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
        round
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
     * @property {number} [precision=5] The number of decimals to which to round<br>
     *                                  the values to be distributed and each entry of a distribution<br>
     * @property {RoundingMode} [roundingMode=ROUNDING_MODE.HALF_EVEN] The rounding mode to use<br>
     *                                                                 when rounding values that exceed the specified precision
     *
     * @property {RedistributionOption} [redistributionOption=DEFAULT_REDISTRIBUTION_OPTION] Defines how to allocate remaining values resulting from rounding errors
     *
     * @property {number} [allowedRecursions=3] The number of times the function can call itself to improve accuracy
     */

    /**
     * These are the default distribution options
     * @type {DistributionOptions}
     */
    const DEFAULT_DISTRIBUTION_OPTIONS =
        {
            precision: 5,
            roundingMode: ROUNDING_MODE.HALF_EVEN,
            redistributionOption: DEFAULT_REDISTRIBUTION_OPTION,
            allowedRecursions: 3
        };

    /**
     * @typedef {Object} ErrorInfo
     *
     * @property {Array<*>} parameters An array of the arguments passed to the function reporting an error
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

    function ErrorInfo( pParameters, pOptions, pSum, pRemainder, pPreciseRemainder, pCount )
    {
        return {
            parameters: asArray( pParameters ),
            options: Object.assign( {}, pOptions || {} ),
            sum: resolveNullOrNaN( pSum ),
            remainder: resolveNullOrNaN( pRemainder ),
            preciseRemainder: resolveNullOrNaN( pPreciseRemainder ),
            count: resolveNullOrNaN( pCount )
        };
    }

    function updateErrorInfo( pErrorInfo, pNewValues )
    {
        const newValues = Object.assign( pNewValues || {} );
        Object.entries( newValues ).forEach( ( [key, value] ) =>
                                             {
                                                 pErrorInfo[key] = value;
                                             } );

        return pErrorInfo;
    }


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

        const indices = asArray( distribution.keys() );

        let sign = isNumeric( pSign ) ? asInt( pSign ) : 1;

        if ( Math.abs( sign ) > 1 )
        {
            sign = Math.sign( sign );
        }

        const options = populateOptions( pOptions, DEFAULT_DISTRIBUTION_OPTIONS );

        const redistributionOption = options.redistributionOption;

        const distributionOption = ucase( options.name || redistributionOption.name );

        if ( "IGNORE" === distributionOption )
        {
            return distribution;
        }

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
     * @param {DistributionOptions} pOptions The DistributionOptions defining
     *                                       how to allocate the total across the entries
     *                                       and how to resolve unallocated amounts due
     *                                       to accumulated rounding errors
     */
    const generateEvenDistribution = function( pTotal, pIterable, pNumEntries, pOptions = DEFAULT_DISTRIBUTION_OPTIONS )
    {
        const options = populateOptions( pOptions, DEFAULT_DISTRIBUTION_OPTIONS );

        let total = isNumeric( pTotal ) ? asFloat( pTotal ) : 0;

        const iterable = !isIterable( pIterable ) ? toIterable( pIterable || {} ) : pIterable || {};

        const numEntries = isNumeric( pNumEntries ) ? asInt( pNumEntries ) : 0;

        let canContinue = true;

        const errorSourceName = calculateErrorSourceName( modulePrototype, generateEvenDistribution );

        const errorInfo = new ErrorInfo( [pTotal, pIterable, pNumEntries], options, 0, 0, 0, 0 );

        if ( isNanOrInfinite( total ) || isZero( total ) )
        {
            const error = new IllegalArgumentError( ERROR_INVALID_TOTAL );

            reportError.call( modulePrototype, error, ERROR_INVALID_TOTAL, S_ERROR, errorSourceName, errorInfo );

            canContinue = false;
        }

        if ( isNanOrInfinite( numEntries ) || numEntries < 1 || !isInteger( numEntries ) )
        {
            reportError.call( modulePrototype, new IllegalArgumentError( ERROR_INVALID_NUM_ENTRIES ), ERROR_INVALID_NUM_ENTRIES, S_ERROR, errorSourceName, errorInfo );

            canContinue = false;
        }

        if ( !isIterable( iterable ) )
        {
            reportError.call( modulePrototype, new IllegalArgumentError( ERROR_INVALID_ITERABLE ), ERROR_INVALID_ITERABLE, S_ERROR, errorSourceName, errorInfo );

            canContinue = false;
        }

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

        updateErrorInfo( errorInfo,
                         {
                             sum: summation,
                             remainder: remainder,
                             preciseRemainder: preciseRemainder,
                             count: count
                         } );

        if ( count < numEntries )
        {
            reportError.call( modulePrototype, new IllegalArgumentError( WARNING_UNEXPECTED_NUMBER_OF_ENTRIES ), WARNING_UNEXPECTED_NUMBER_OF_ENTRIES, S_WARN, errorSourceName, errorInfo );
        }

        if ( 0 - preciseRemainder > 0.00000000000005 )
        {
            reportError.call( modulePrototype, new IllegalArgumentError( WARNING_UNALLOCATED_AMOUNT ), WARNING_UNALLOCATED_AMOUNT, S_WARN, errorSourceName, errorInfo );
        }

        if ( (summation !== total || remainder !== 0) )
        {
            function recalculate()
            {
                const newRemainder = recalculateRemainder( distribution, total, originalTotal );

                remainder = newRemainder.remainder;
                preciseRemainder = newRemainder.preciseRemainder;
                summation = newRemainder.summation;

                updateErrorInfo( errorInfo,
                                 {
                                     sum: summation,
                                     remainder: remainder,
                                     preciseRemainder: preciseRemainder
                                 } );
            }

            const allowedRecursions = options.allowedRecursions;

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

                recalculate();
            }

            recursions = 0;

            while ( (summation !== total || remainder !== 0) && recursions++ < allowedRecursions )
            {
                const newOptions = Object.assign( {}, options );
                newOptions.precision = asInt( precision ) + 1;
                newOptions.allowedRecursions = asInt( allowedRecursions ) - 1;

                distribution = generateEvenDistribution( total, distribution.keys(), numEntries, newOptions );

                recalculate();
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

    /**
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
     * @param {number} pTotal
     * @param {Map<*,number>} pSegments
     * @param {Iterable} pIterable
     * @param {number} pNumEntries
     * @param {DistributionOptions} pOptions
     */
    const generateDistributionFromSegments = function( pTotal, pSegments, pIterable, pNumEntries, pOptions = DEFAULT_DISTRIBUTION_OPTIONS )
    {
        const iterable = !isIterable( pIterable ) ? toIterable( pIterable || {} ) : pIterable || {};

        const numEntries = isNumeric( pNumEntries ) ? asInt( pNumEntries ) : 0;

        let total = isNumeric( pTotal ) ? asFloat( pTotal ) : 0;

        const options = populateOptions( pOptions, DEFAULT_DISTRIBUTION_OPTIONS );

        let distribution = new Map();

        const errorSourceName = calculateErrorSourceName( modulePrototype, generateDistributionFromSegments );

        const errorInfo = new ErrorInfo( [pTotal, pIterable, pNumEntries], options, 0, 0, 0, 0 );

        if ( isNanOrInfinite( total ) || isZero( total ) )
        {
            reportError.call( modulePrototype, new IllegalArgumentError( ERROR_INVALID_TOTAL ), ERROR_INVALID_TOTAL, S_ERROR, errorSourceName, errorInfo );
            return distribution;
        }

        if ( isNanOrInfinite( numEntries ) || numEntries < 1 || !isInteger( numEntries ) )
        {
            reportError.call( modulePrototype, new IllegalArgumentError( ERROR_INVALID_NUM_ENTRIES ), ERROR_INVALID_NUM_ENTRIES, S_ERROR, errorSourceName, errorInfo );
            return distribution;
        }

        if ( !isIterable( iterable ) )
        {
            reportError.call( modulePrototype, new IllegalArgumentError( ERROR_INVALID_ITERABLE ), ERROR_INVALID_ITERABLE, S_ERROR, errorSourceName, errorInfo );
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

        let segments = asArray( pSegments.values() );

        const keysPerSegment = numKeysPerSegment( segments, numEntries );

        let totalPercentage = asArray( segments ).reduce( ( accumulator, value ) => accumulator + asFloat( value ), 0 );

        if ( totalPercentage > 1 )
        {
            segments = segments.map( e => quotient( asFloat( e ), 100, roundingOptions ) );
        }

        let summation = 0;

        let remainder = total;
        let preciseRemainder = originalTotal;

        let weights = [];

        let curSegment = 0;

        let count = 0;

        let segmentCount = 0;
        let segmentBoundary = keysPerSegment[curSegment];
        let segment = segments[curSegment];

        for( const key of iterable )
        {
            if ( segmentCount > segmentBoundary )
            {
                curSegment++;
                segmentBoundary = keysPerSegment[curSegment];
                segment = segments[curSegment];
                segmentCount = 0;
            }

            if ( curSegment >= segments.length || count >= numEntries )
            {
                break;
            }

            const percentage = quotient( segment, segmentBoundary, roundingOptions );

            const value = product( total, percentage, roundingOptions );

            distribution.set( key, (sign * value) );

            summation += value;

            remainder -= value;
            preciseRemainder -= value;

            weights.push( quotient( value, total ) );

            count++;
        }

        updateErrorInfo( errorInfo,
                         {
                             sum: summation,
                             remainder: remainder,
                             preciseRemainder: preciseRemainder,
                             count: count
                         } );

        if ( count < numEntries )
        {
            reportError.call( modulePrototype, new IllegalArgumentError( WARNING_UNEXPECTED_NUMBER_OF_ENTRIES ), WARNING_UNEXPECTED_NUMBER_OF_ENTRIES, S_WARN, errorSourceName, errorInfo );
        }

        if ( 0 - preciseRemainder > 0.00000000000005 )
        {
            reportError.call( modulePrototype, new IllegalArgumentError( WARNING_UNALLOCATED_AMOUNT ), WARNING_UNALLOCATED_AMOUNT, S_WARN, errorSourceName, errorInfo );
        }

        if ( (summation !== total || remainder !== 0) )
        {
            function recalculate()
            {
                const newRemainder = recalculateRemainder( distribution, total, originalTotal );

                remainder = newRemainder.remainder;
                preciseRemainder = newRemainder.preciseRemainder;
                summation = newRemainder.summation;

                updateErrorInfo( errorInfo,
                                 {
                                     sum: summation,
                                     remainder: remainder,
                                     preciseRemainder: preciseRemainder
                                 } );
            }

            const allowedRecursions = options.allowedRecursions;

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

                recalculate();
            }

            recursions = 0;

            while ( (summation !== total || remainder !== 0) && recursions++ < allowedRecursions )
            {
                const newOptions = Object.assign( {}, options );
                newOptions.precision = asInt( precision ) + 1;
                newOptions.allowedRecursions = asInt( allowedRecursions ) - 1;

                distribution = generateDistributionFromSegments( total, segments, distribution.keys(), numEntries, newOptions );

                recalculate();
            }
        }

        return distribution;
    };

    let mod =
        {
            generateEvenDistribution,
            generateEvenDistributionAsync,
            generateDistributionFromSegments,
            DEFAULT_DISTRIBUTION_OPTIONS,
            REDISTRIBUTION_OPTIONS,
            DEFAULT_REDISTRIBUTION_OPTION,
            numKeysPerSegment
        };

    mod = modulePrototype.extend( mod );

    return mod.expose( mod, INTERNAL_NAME, (_ud !== typeof module ? module : mod) ) || mod;

}());