const core = require( "@toolbocks/core" );

/**
 * Establish separate constants for each of the utilities imported
 * @see ../src/CoreUtils.cjs
 */
const { constants, typeUtils, stringUtils, arrayUtils, localeUtils } = core;

const {
    _ud = "undefined",
    $scope = (core?.$scope || constants?.$scope || function()
    {
        return (_ud === typeof self ? ((_ud === typeof global) ? ((_ud === typeof globalThis ? {} : globalThis)) : (global || {})) : (self || {}));
    })
} = constants;

// noinspection FunctionTooLongJS
(function exposeModule()
{
    const INTERNAL_NAME = "__BOCK__DATE_UTILS__";

    if ( $scope() && (null != $scope()[INTERNAL_NAME]) )
    {
        return $scope()[INTERNAL_NAME];
    }

    const dependencies =
        {
            constants,
            typeUtils,
            stringUtils,
            arrayUtils
        };

    const {
        classes,
        _mt_str,
        lock,
        populateOptions,
        mergeOptions,
        merge,
        IterationCap,
        IllegalArgumentError,
        no_op,
        op_false,
        objectEntries,
        attemptMethod
    } = constants;

    const {
        Result,
        isNull,
        isString,
        isDate,
        isNumber,
        isNumeric,
        isFunction,
        isNonNullObject,
        isValidDateOrNumeric,
        isValidDateInstance,
        clamp
    } = typeUtils;

    const {
        asString,
        isBlank,
        asInt,
        toBool,
        ucase
    } = stringUtils;

    const { asArray, varargs, Filters } = arrayUtils;

    const { resolveLocale, getNameOfDay, getAbbrOfDay, getNameOfMonth, getAbbrOfMonth } = localeUtils;

    const { ToolBocksModule } = classes;

    const modName = "DateUtils";

    const modulePrototype = new ToolBocksModule( modName, INTERNAL_NAME );

    const Now = () => new Date();

    const rxTz = () => /((GMT|UTC)([+-])?(\d{1,2})?:?(\d{2})?)|(((\w+ )*)(Time)?$)/gd;

    let resolveDate = ( pDate ) => isDate( pDate ) ? pDate : isNumeric( pDate ) ? new Date( asInt( pDate ) ) : Now();

    const DATE_PARTS =
        {
            ERA: "era",
            YEAR: "year",
            MONTH: "month",
            MONTH_NAME: "monthName",
            MONTH_ABBR: "monthAbbr",
            DAY: "date",
            DAY_OF_WEEK: "day",
            DAY_OF_MONTH: "dayOfMonth",
            DAY_OF_YEAR: "dayOfYear",
            DAY_NAME: "dayName",
            DAY_ABBR: "dayAbbr",
            WEEK: "week",
            WORK_WEEK: "workWeek",
            WEEK_OF_YEAR: "weekOfYear",
            WEEK_OF_MONTH: "weekOfMonth",
            HOUR: "hour",
            AM_PM: "amPm",
            HOUR_OF_DAY_12: "hourOfDay12",
            HOUR_OF_DAY_24: "hourOfDay24",
            MINUTE: "minute",
            SECOND: "second",
            MILLISECOND: "millisecond",
            TIME_ZONE: "timeZone",
            UTC_OFFSET: "utcOffset"
        };

    class DateBuffer
    {
        // noinspection OverlyComplexFunctionJS
        constructor( pDate, pLocale )
        {
            this.initializeDefaults();

            const date = isValidDateOrNumeric( pDate ) ? resolveDate( pDate ) : null;

            if ( isDate( date ) )
            {
                this.initialize( date, pLocale );
            }

            this.adjustHoursForPm = false;
            this.adjustHoursForCycle = false;

            this.adjustedForPm = false;
            this.adjustedForCycle = false;

            this.minHour = 0;
            this.maxHour = 23;
        }

        merge( pBuffer )
        {
            const source = isDate( pBuffer ) ? DateBuffer.fromDate( pBuffer ) : isNull( pBuffer ) ? {} : pBuffer;

            const keys = Object.keys( DATE_PARTS );

            for( const key of keys )
            {
                const value = source[key];

                if ( (isString( value ) && !isBlank( value )) || (isNumber( value ) && value >= 0) )
                {
                    this[key] = value;
                }
            }

            this.adjustedForPm = source.adjustedForPm || this.adjustedForPm;
            this.adjustedForCycle = source.adjustedForCycle || this.adjustedForCycle;

            this.adjustHoursForPm = (source.adjustHoursForPm || this.adjustHoursForPm) && !this.adjustedForPm;
            this.adjustHoursForCycle = (source.adjustHoursForCycle || this.adjustHoursForCycle) && !this.adjustedForCycle;

            return this;
        }

        toDate()
        {
            const { year, month } = this._yearMonth();

            return new Date( year,
                             month,
                             clamp( this[DATE_PARTS.DAY], 1, 31 ),
                             clamp( this[DATE_PARTS.HOUR], 0, 23 ),
                             clamp( this[DATE_PARTS.MINUTE], 0, 59 ),
                             clamp( this[DATE_PARTS.SECOND], 0, 59 ),
                             clamp( this[DATE_PARTS.MILLISECOND], 0, 999 ) );
        }

        toUTCDate()
        {
            const { year, month } = this._yearMonth();

            return Date.UTC( year,
                             month,
                             clamp( this[DATE_PARTS.DAY], 1, 31 ),
                             clamp( this[DATE_PARTS.HOUR], 0, 23 ),
                             clamp( this[DATE_PARTS.MINUTE], 0, 59 ),
                             clamp( this[DATE_PARTS.SECOND], 0, 59 ),
                             clamp( this[DATE_PARTS.MILLISECOND], 0, 999 ) );
        }

        _yearMonth()
        {
            const currentDate = Now();

            let year = this[DATE_PARTS.YEAR];
            year = clamp( (year < 0 ? currentDate.getFullYear() : year), 1, 9999 );

            let month = this[DATE_PARTS.MONTH];
            month = clamp( (month < 0 ? currentDate.getMonth() : month), 0, 11 );

            return { year, month };
        }

        initializeDefaults()
        {
            this[DATE_PARTS.YEAR] = -1;

            this[DATE_PARTS.MONTH] = -1;
            this[DATE_PARTS.MONTH_NAME] = _mt_str;
            this[DATE_PARTS.MONTH_ABBR] = _mt_str;

            this[DATE_PARTS.DAY] = -1;
            this[DATE_PARTS.DAY_OF_WEEK] = -1;
            this[DATE_PARTS.DAY_OF_MONTH] = -1;
            this[DATE_PARTS.DAY_OF_YEAR] = -1;
            this[DATE_PARTS.DAY_NAME] = _mt_str;
            this[DATE_PARTS.DAY_ABBR] = _mt_str;

            this[DATE_PARTS.HOUR] = -1;
            this[DATE_PARTS.HOUR_OF_DAY_12] = -1;
            this[DATE_PARTS.HOUR_OF_DAY_24] = -1;

            this[DATE_PARTS.MINUTE] = -1;

            this[DATE_PARTS.SECOND] = -1;

            this[DATE_PARTS.MILLISECOND] = -1;

            this[DATE_PARTS.UTC_OFFSET] = 0;

            this[DATE_PARTS.TIME_ZONE] = null;

            this[DATE_PARTS.AM_PM] = _mt_str;
        }

        initialize( pDate, pLocale )
        {
            if ( !isDate( pDate ) )
            {
                this.initializeDefaults();
            }

            const locale = resolveLocale( pLocale );

            this[DATE_PARTS.YEAR] = date.getFullYear();

            this[DATE_PARTS.MONTH] = date.getMonth();
            this[DATE_PARTS.MONTH_NAME] = getNameOfMonth( date, locale );
            this[DATE_PARTS.MONTH_ABBR] = getAbbrOfMonth( date, locale );

            this[DATE_PARTS.DAY] = date.getDate();
            this[DATE_PARTS.DAY_OF_WEEK] = date.getDay();
            this[DATE_PARTS.DAY_OF_MONTH] = date.getDate();
            this[DATE_PARTS.DAY_OF_YEAR] = daysBetween( new Date( date.getFullYear(), 0, 0 ), date );
            this[DATE_PARTS.DAY_NAME] = getNameOfDay( date, locale );
            this[DATE_PARTS.DAY_ABBR] = getAbbrOfDay( date, locale );

            this[DATE_PARTS.HOUR] = date.getHours();
            this[DATE_PARTS.HOUR_OF_DAY_12] = (date.getHours() % 12) || 12;
            this[DATE_PARTS.HOUR_OF_DAY_24] = date.getHours() + 1;

            this[DATE_PARTS.MINUTE] = date.getMinutes();

            this[DATE_PARTS.SECOND] = date.getSeconds();

            this[DATE_PARTS.MILLISECOND] = date.getMilliseconds();

            this[DATE_PARTS.UTC_OFFSET] = (date.getTimezoneOffset() / 60);

            this[DATE_PARTS.TIME_ZONE] = null;

            this[DATE_PARTS.AM_PM] = date.getHours() >= 11 ? "PM" : "AM";
        }
    }

    DateBuffer.isBuffer = ( pBuffer ) => (pBuffer instanceof DateBuffer);

    DateBuffer.fromDate = function( pDate, pLocale )
    {
        return new DateBuffer( pDate, pLocale );
    };

    DateBuffer.fromBuffer = function( pBuffer )
    {
        const source = isNull( pBuffer ) ? {} : pBuffer;

        const buffer = new DateBuffer();

        const keys = Object.keys( DATE_PARTS );

        for( const key of keys )
        {
            buffer[key] = source[key] || (/_/.test( key ) && !(/hour/i).test( key ) ? _mt_str : -1);
        }

        buffer.adjustedForPm = source.adjustedForPm || buffer.adjustedForPm;
        buffer.adjustedForCycle = source.adjustedForCycle || buffer.adjustedForCycle;

        buffer.adjustHoursForPm = (source.adjustHoursForPm || buffer.adjustHoursForPm) && !buffer.adjustedForPm;
        buffer.adjustHoursForCycle = (source.adjustHoursForCycle || buffer.adjustHoursForCycle) && !buffer.adjustedForCycle;

        return buffer;
    };

    DateBuffer.fromObject = ( pObject ) => DateBuffer.fromBuffer( pObject );

    function isFormatter( pFormatter )
    {
        return !isNull( pFormatter ) && isNonNullObject( pFormatter ) && isFunction( pFormatter?.format );
    }

    function isCalculator( pCalculator )
    {
        return !isNull( pCalculator ) && isNonNullObject( pCalculator ) && isFunction( pCalculator?.calculate );
    }

    resolveDate = ( pDate ) => isDate( pDate ) ? pDate : isNumeric( pDate ) ? new Date( asInt( pDate ) ) : DateBuffer.isBuffer( pDate ) ? pDate.toDate() : Now();

    class DatePart
    {
        #name;
        #defaultFormatToken;
        #calculator;
        #formatter;

        constructor( pName, pDefaultToken, pCalculator, pFormatter )
        {
            this.#name = asString( pName, true );

            this.#defaultFormatToken = asString( pDefaultToken, true );

            this.#calculator = isFunction( pCalculator ) ? pCalculator.bind( this ) : isFunction( pCalculator?.calculate ) ? pCalculator.calculate.bind( this ) : no_op;

            this.#formatter = isFunction( pFormatter ) ? pFormatter.bind( this ) : isFunction( pFormatter?.format ) ? pFormatter.format.bind( this ) : no_op;
        }

        get name()
        {
            return asString( this.#name, true );
        }

        get defaultFormatToken()
        {
            return asString( this.#defaultFormatToken, true );
        }

        get calculator()
        {
            const calculator = this.#calculator;

            return isFunction( calculator ) ? calculator.bind( this ) : isCalculator( calculator ) ? calculator.calculate.bind( this ) : () => _mt_str;
        }

        get formatter()
        {
            let formatter = this.#formatter;

            formatter = isFunction( formatter ) ? formatter.bind( this ) : isFormatter( formatter ) ? formatter.format.bind( this ) : null;

            if ( isNull( formatter ) )
            {
                const len = clamp( this.defaultFormatToken?.length, 1, 4 );
                formatter = ( pDate, pLocale ) => asString( this.calculate( pDate, this.calculator, pLocale ) ).padStart( len, "0" );
            }

            return formatter.bind( this );
        }

        static get [Symbol.species]()
        {
            return this;
        }

        equals( pOther )
        {
            if ( isNull( pOther ) )
            {
                return false;
            }

            const otherName = pOther instanceof this.constructor ? pOther?.name : isString( pOther ) ? asString( pOther, true ) : _mt_str;

            return ucase( this.name ) === ucase( otherName );
        }

        calculate( pDate, pCalculator, pLocale )
        {
            const calculator = isCalculator( pCalculator ) ? pCalculator : this.calculator;

            return isFunction( calculator ) ? attemptMethod( this, calculator, resolveDate( pDate ), pLocale ) : _mt_str;
        }

        format( pDate, pLocale, pFormatter )
        {
            const formatter = isFormatter( pFormatter ) ? pFormatter : this.formatter;

            const locale = resolveLocale( pLocale );

            return isFunction( formatter ) ? attemptMethod( this, formatter, resolveDate( pDate ), locale ) : _mt_str;
        }
    }

    const AD_START = new Date( 1, 0, 1, 0, 0, 0, 0 );

    DatePart.ERA = new DatePart( DATE_PARTS.ERA, "G", ( pDate ) => resolveDate( pDate ) > AD_START ? "AD" : "BC" );
    DatePart.YEAR = new DatePart( DATE_PARTS.YEAR, "yyyy", ( pDate ) => resolveDate( pDate ).getFullYear() );
    DatePart.MONTH = new DatePart( DATE_PARTS.MONTH, "MM", ( pDate ) => resolveDate( pDate ).getMonth(), ( pDate ) => asString( resolveDate( pDate ).getMonth() + 1 ).padStart( 2, "0" ) );
    DatePart.DAY = new DatePart( DATE_PARTS.DAY, "dd", ( pDate ) => resolveDate( pDate ).getDate() );
    DatePart.HOUR = new DatePart( DATE_PARTS.HOUR, "hh", ( pDate ) => resolveDate( pDate ).getHours() );
    DatePart.MINUTE = new DatePart( DATE_PARTS.MINUTE, "mm", ( pDate ) => resolveDate( pDate ).getMinutes() );
    DatePart.SECOND = new DatePart( DATE_PARTS.SECOND, "ss", ( pDate ) => resolveDate( pDate ).getSeconds() );
    DatePart.MILLISECOND = new DatePart( DATE_PARTS.MILLISECOND, "SS", ( pDate ) => resolveDate( pDate ).getMilliseconds() );
    DatePart.WEEK_OF_YEAR = new DatePart( DATE_PARTS.WEEK_OF_YEAR, "ww" );
    DatePart.WEEK_OF_MONTH = new DatePart( DATE_PARTS.WEEK_OF_MONTH, "WW" );
    DatePart.DAY_OF_YEAR = new DatePart( DATE_PARTS.DAY_OF_YEAR, "DD", ( pDate ) =>
    {
        const date = resolveDate( pDate );
        return daysBetween( new Date( date.getFullYear(), 0, 0 ), date );
    } );
    DatePart.DAY_OF_WEEK = new DatePart( DATE_PARTS.DAY_OF_WEEK, "E", ( pDate ) => resolveDate( pDate ).getDay() );
    DatePart.AM_PM = new DatePart( DATE_PARTS.AM_PM, "a", ( pDate ) => resolveDate( pDate ).getHours() >= 11 ? "PM" : "AM" );
    DatePart.TIME_ZONE = new DatePart( DATE_PARTS.TIME_ZONE, "z", ( pDate ) =>
    {
        const matches = (/(\([\w ]+\))/i).exec( resolveDate( pDate ).toString() );
        return matches && matches.length > 1 ? matches[1] : _mt_str;
    } );

    const MILLISECONDS_PER_SECOND = 1_000;
    const SECONDS_PER_MINUTE = 60;
    const MINUTES_PER_HOUR = 60;
    const HOURS_PER_DAY = 24;
    const DAYS_PER_WEEK = 7;
    const DAYS_PER_WORK_WEEK = 5;

    const MILLIS_PER_SECOND = MILLISECONDS_PER_SECOND;
    const MILLIS_PER_MINUTE = (SECONDS_PER_MINUTE * MILLIS_PER_SECOND);
    const MILLIS_PER_HOUR = (MINUTES_PER_HOUR * MILLIS_PER_MINUTE);
    const MILLIS_PER_DAY = (HOURS_PER_DAY * MILLIS_PER_HOUR);
    const MILLIS_PER_WEEK = (DAYS_PER_WEEK * MILLIS_PER_DAY);
    const MILLIS_PER_YEAR = Math.floor( 365.25 * MILLIS_PER_DAY );

    const MILLIS_PER = lock(
        {
            SECOND: MILLIS_PER_SECOND,
            MINUTE: MILLIS_PER_MINUTE,
            HOUR: MILLIS_PER_HOUR,
            DAY: MILLIS_PER_DAY,
            WEEK: MILLIS_PER_WEEK,
            YEAR: MILLIS_PER_YEAR,
            DECADE: (10 * MILLIS_PER_YEAR)
        } );

    const ONE_MINUTE = MILLIS_PER_MINUTE;
    const TWO_MINUTES = MILLIS_PER_MINUTE * 2;
    const FIVE_MINUTES = MILLIS_PER_MINUTE * 5;
    const TEN_MINUTES = MILLIS_PER_MINUTE * 10;
    const TWENTY_MINUTES = MILLIS_PER_MINUTE * 20;
    const THIRTY_MINUTES = MILLIS_PER_MINUTE * 30;
    const FORTY_FIVE_MINUTES = MILLIS_PER_MINUTE * 45;

    const ONE_HOUR = MILLIS_PER_HOUR;
    const TWO_HOURS = MILLIS_PER_HOUR * 2;
    const SIX_HOURS = MILLIS_PER_HOUR * 6;
    const EIGHT_HOURS = MILLIS_PER_HOUR * 8;
    const TWELVE_HOURS = MILLIS_PER_HOUR * 12;

    const ONE_DAY = MILLIS_PER_DAY;

    const Months = lock(
        {
            JANUARY: 0,
            FEBRUARY: 1,
            MARCH: 2,
            APRIL: 3,
            MAY: 4,
            JUNE: 5,
            JULY: 6,
            AUGUST: 7,
            SEPTEMBER: 8,
            OCTOBER: 9,
            NOVEMBER: 10,
            DECEMBER: 11
        } );

    const Days = lock(
        {
            SUNDAY: 0,
            MONDAY: 1,
            TUESDAY: 2,
            WEDNESDAY: 3,
            THURSDAY: 4,
            FRIDAY: 5,
            SATURDAY: 6
        } );

    const Occurrence = lock(
        {
            LAST: -1,
            FIRST: 0,
            SECOND: 1,
            THIRD: 2,
            FOURTH: 3,
            FIFTH: 4,
            SIXTH: 5,
            SEVENTH: 6,
            EIGHTH: 7,
            NINTH: 8,
            TENTH: 9
        } );

    const Direction = lock(
        {
            FUTURE: 0,
            PAST: -1
        } );

    class TimeUnit
    {
        #id;
        #name;
        #multiplier;
        #accessorName;
        #mutatorName;

        #minimumValue = 0;

        // noinspection OverlyComplexFunctionJS
        constructor( pId, pName, pMultiplier, pAccessor, pMutator, pMinimumValue = 0 )
        {
            this.#id = pId;
            this.#name = pName;
            this.#multiplier = pMultiplier;
            this.#accessorName = pAccessor || "getTime";
            this.#mutatorName = pMutator || "setTime";

            this.#minimumValue = asInt( pMinimumValue, 0 );
        }

        static get [Symbol.species]()
        {
            return this;
        }

        get id()
        {
            return asInt( this.#id );
        }

        get name()
        {
            return asString( this.#name, true );
        }

        get multiplier()
        {
            return asInt( this.#multiplier );
        }

        get accessorName()
        {
            return asString( this.#accessorName, true );
        }

        get mutatorName()
        {
            return asString( this.#mutatorName, true );
        }

        getAccessor()
        {
            return Date.prototype[this.accessorName] || function() { return 0; };
        }

        getMutator()
        {
            return Date.prototype[this.mutatorName] || no_op;
        }

        get minimumValue()
        {
            return asInt( this.#minimumValue );
        }

        resolveMultiplier( pOther )
        {
            const other = resolveUnit( pOther );

            if ( other === this )
            {
                return this.multiplier;
            }

            return other?.multiplier || asInt( other );
        }

        lessThan( pOther )
        {
            return this.multiplier < this.resolveMultiplier( pOther );
        }

        greaterThan( pOther )
        {
            return this.multiplier > this.resolveMultiplier( pOther );
        }

        compareTo( pOther )
        {
            return this.lessThan( pOther ) ? -1 : this.greaterThan( pOther ) ? 1 : 0;
        }

        update( pDate, pAdjustment )
        {
            const date = resolveDate( pDate );

            const mutator = this.getMutator();
            const accessor = this.getAccessor();

            return new Date( mutator.call( date, (accessor.call( date ) + asInt( pAdjustment )) ) );
        }

        adjust( pDate, pAdjustment = 0 )
        {
            let adjustment = asInt( pAdjustment, 1 );

            adjustment *= (this.lessThan( TIME_UNITS.MINUTE ) ? this.multiplier : 1);

            adjustment *= ((/week/i).test( this.name ) ? DAYS_PER_WEEK : 1);

            return this.update( pDate, adjustment );
        }

        increment( pDate, pAdjustment = 1 )
        {
            return this.adjust( pDate, Math.max( asInt( pAdjustment, 1 ), 1 ) );
        }

        decrement( pDate, pAdjustment = -1 )
        {
            return this.adjust( pDate, Math.min( asInt( pAdjustment, -1 ), -1 ) );
        }

        startsFor( pDate )
        {
            let date = new Date( resolveDate( pDate ) );

            if ( ((/week/i).test( this.name )) )
            {
                const day = date.getDay();

                const adjustment = (/work/i).test( this.name ) ? 1 : 0;

                date = new Date( toNoon( date ) );
                date.setDate( (date.getDate() - day) + adjustment );
                date = toMidnight( date );
            }
            else
            {
                const entries = objectEntries( TIME_UNITS );

                for( const [key, value] of entries )
                {
                    if ( (/week|decade/i).test( key ) || (/week|decade/i).test( value?.name ) )
                    {
                        continue;
                    }

                    if ( this.greaterThan( value ) )
                    {
                        const mutator = value.getMutator();
                        modulePrototype.attempt( () => mutator.call( date, asInt( value.minimumValue ) ) );
                    }
                }
            }

            return lock( date );
        }

        endsFor( pDate )
        {
            let date = new Date( resolveDate( pDate ) );

            date = new Date( this.startsFor( date ) );

            if ( ((/week/i).test( this.name )) )
            {
                const adjustment = (/work/i).test( this.name ) ? 5 : 7;

                date.setDate( date.getDate() + adjustment );
                date.setMilliseconds( date.getMilliseconds() - 1 );
                return lock( date );
            }
            else
            {
                date = this.increment( date, 1 );
            }

            date.setMilliseconds( date.getMilliseconds() - 1 );

            return lock( date );
        }

        equals( pOther )
        {
            const other = resolveUnit( pOther );
            return this.id === other.id || this.name === other.name || this.multiplier === other.multiplier;
        }
    }

    class Decade extends TimeUnit
    {
        constructor( pId, pName, pMultiplier, pAccessor, pMutator )
        {
            super( pId, pName, pMultiplier, pAccessor, pMutator );
        }

        static get [Symbol.species]()
        {
            return this;
        }

        update( pDate, pAdjustment )
        {
            let date = resolveDate( pDate );

            let adjustment = asInt( pAdjustment );

            date.setFullYear( date.getFullYear() + (10 - (date.getFullYear() % 10)) );

            if ( adjustment < 0 )
            {
                date.setFullYear( date.getFullYear() + (2 * adjustment) );
            }

            return lock( date );
        }

        startsFor( pDate )
        {
            let date = new Date( resolveDate( pDate ) );

            date.setFullYear( date.getFullYear() - (date.getFullYear() % 10) );

            date.setMonth( 0 );
            date.setDate( 1 );
            date.setHours( 0 );
            date.setMinutes( 0 );
            date.setSeconds( 0 );
            date.setMilliseconds( 0 );

            return lock( date );
        }
    }

    const TIME_UNITS = lock(
        {
            MILLISECOND: lock( new TimeUnit( 1, DATE_PARTS.MILLISECOND, 1, "getMilliseconds", "setMilliseconds" ) ),
            SECOND: lock( new TimeUnit( 2, DATE_PARTS.SECOND, MILLIS_PER.SECOND, "getSeconds", "setSeconds" ) ),
            MINUTE: lock( new TimeUnit( 3, DATE_PARTS.MINUTE, MILLIS_PER.MINUTE, "getMinutes", "setMinutes" ) ),
            HOUR: lock( new TimeUnit( 4, DATE_PARTS.HOUR, MILLIS_PER.HOUR, "getHours", "setHours" ) ),
            DAY: lock( new TimeUnit( 5, DATE_PARTS.DAY, MILLIS_PER.DAY, "getDate", "setDate", 1 ) ),
            WEEK: lock( new TimeUnit( 6, DATE_PARTS.WEEK, MILLIS_PER.WEEK, "getDate", "setDate", 1 ) ),
            WORK_WEEK: lock( new TimeUnit( 7, DATE_PARTS.WORK_WEEK, MILLIS_PER.WEEK, "getDate", "setDate", 1 ) ),
            MONTH: lock( new TimeUnit( 8, DATE_PARTS.MONTH, 2_592_000_000, "getMonth", "setMonth" ) ),
            YEAR: lock( new TimeUnit( 9, DATE_PARTS.YEAR, MILLIS_PER.YEAR, "getFullYear", "setFullYear" ) ),
            DECADE: lock( new Decade( 10, "Decade", MILLIS_PER.DECADE, "getFullYear", "setFullYear" ) )
        } );

    const TIME_UNITS_BY_ID =
        {
            // populated by code
        };

    const TIME_UNITS_BY_NAME =
        {
            // populated by code
        };

    // populates TIME_UNITS_BY_ID and TIME_UNITS_BY_NAME
    objectEntries( TIME_UNITS ).forEach( ( [key, value] ) =>
                                         {
                                             TIME_UNITS_BY_ID[value.id] = value;
                                             TIME_UNITS_BY_NAME[value.name] = value;
                                             TimeUnit[value.name] = value;
                                         } );

    const resolveUnit = ( pUnit ) =>
        isNull( pUnit ) ? new TimeUnit( 0, "NULL UNIT", 0, "getMilliseconds", "setMilliseconds", 0 ) :
        pUnit instanceof TimeUnit ? pUnit :
        isString( pUnit ) ? TIME_UNITS_BY_NAME[pUnit] || TIME_UNITS[ucase( pUnit )] || TIME_UNITS[ucase( pUnit.replace( /s$/i, _mt_str ) )] :
        isNumber( pUnit ) && pUnit < 1_000 ? TIME_UNITS_BY_ID[pUnit] : new TimeUnit( pUnit, asString( pUnit ), pUnit, "getTime", "setTime", 0 );

    const DateConstants = lock(
        {
            Months,
            Days,
            Occurrence,
            Direction,
            DATE_PARTS,
            DatePart,
            Units: lock( TIME_UNITS ),
            UnitNames: lock( Object.keys( TIME_UNITS_BY_NAME ) ),
            TimeUnits: lock( TIME_UNITS ),
            TimeUnit,
            MILLISECONDS_PER_SECOND,
            SECONDS_PER_MINUTE,
            MINUTES_PER_HOUR,
            HOURS_PER_DAY,
            DAYS_PER_WEEK,
            DAYS_PER_WORK_WEEK,
            MILLIS_PER,
            ONE_MINUTE,
            TWO_MINUTES,
            FIVE_MINUTES,
            TEN_MINUTES,
            TWENTY_MINUTES,
            THIRTY_MINUTES,
            FORTY_FIVE_MINUTES,
            ONE_HOUR,
            TWO_HOURS,
            SIX_HOURS,
            EIGHT_HOURS,
            TWELVE_HOURS,
            ONE_DAY
        } );

    const isLeapYear = ( pYear ) => (((0 === (pYear % 4)) && ((0 !== (pYear % 100)) || (0 === (pYear % 400)))));

    class Month
    {
        #index = 0;
        #name;
        #abbreviation;
        #days;

        constructor( pName, pIndex, pDays )
        {
            this.#index = clamp( asInt( pIndex ), 0, 11 );
            this.#name = stringUtils.toProperCase( stringUtils.asString( pName, true ) );
            this.#days = clamp( asInt( pDays ), 28, 31 );
        }

        static get [Symbol.species]()
        {
            return this;
        }

        get index()
        {
            return this.#index;
        }

        get name()
        {
            return this.#name;
        }

        get abbreviation()
        {
            return this.#abbreviation;
        }

        get days()
        {
            return this.#days;
        }

        clone( pYear )
        {
            return this;
        }
    }

    class February extends Month
    {
        #year;

        constructor( pName, pIndex )
        {
            super( pName, pIndex, 28 );

            this.#year = Now().getFullYear();
        }

        static get [Symbol.species]()
        {
            return this;
        }

        get year()
        {
            return this.#year;
        }

        set year( pValue )
        {
            this.#year = pValue;
        }

        get days()
        {
            if ( isLeapYear( this.year ) )
            {
                return 29;
            }
            return super.days;
        }

        clone( pYear )
        {
            let month = new February( this.name, this.index );
            month.year = pYear;
            return lock( month );
        }
    }

    const MONTHS_DATA = lock(
        {
            JANUARY: lock( new Month( "January", 0, 31 ) ),
            FEBRUARY: lock( new February( "February", 1 ) ),
            MARCH: lock( new Month( "March", 2, 31 ) ),
            APRIL: lock( new Month( "April", 3, 30 ) ),
            MAY: lock( new Month( "May", 4, 31 ) ),
            JUNE: lock( new Month( "June", 5, 30 ) ),
            JULY: lock( new Month( "July", 6, 31 ) ),
            AUGUST: lock( new Month( "August", 7, 31 ) ),
            SEPTEMBER: lock( new Month( "September", 8, 30 ) ),
            OCTOBER: lock( new Month( "October", 9, 31 ) ),
            NOVEMBER: lock( new Month( "November", 10, 30 ) ),
            DECEMBER: lock( new Month( "December", 11, 31 ) )
        } );

    const months = lock( Object.entries( MONTHS_DATA ) );

    const isValidDateArgument = ( pDate ) => isValidDateInstance( pDate ) || isNumber( pDate );

    const validateArguments = ( pDateA, pDateB ) => isValidDateArgument( pDateA ) && isValidDateArgument( pDateB );

    const toTimestamp = ( pDate, pDefault = Date.now() ) => isDate( pDate ) ? pDate.getTime() : isNumber( pDate ) ? Math.floor( pDate ) : pDefault || Date.now();

    const transform = function( pDate, pFunction )
    {
        let errors = !isValidDateArgument( pDate ) ? [new IllegalArgumentError( "Cannot transform an invalid date" )] : [];

        if ( !(isFunction( pFunction ) && pFunction?.length >= 1) )
        {
            errors.push( new IllegalArgumentError( "The second argument to transform must be a function with at least one parameter" ) );
        }

        return (isFunction( pFunction ) ? modulePrototype.attempt( pFunction, pDate ) : new Result( pDate, errors ));
    };

    const _compare = function( pDateA, pDateB, pTransformerFunction )
    {
        const resultA = transform( pDateA, pTransformerFunction );
        const resultB = transform( pDateB, pTransformerFunction );

        const dateA = resultA.hasErrors() ? pDateA : resultA.returnValue;
        const dateB = resultB.hasErrors() ? pDateB : resultB.returnValue;

        const tsA = toTimestamp( dateA, Number.MAX_VALUE );
        const tsB = toTimestamp( dateB, Number.MIN_VALUE );

        return tsA - tsB;
    };

    const resolveFullYear = ( pYear ) =>
    {
        const year = asInt( pYear );
        return (year < 100 ? (year < 50 ? year + 1900 : year + 2000) : year < 1_000 ? year + 1000 : year);
    };

    // noinspection OverlyComplexFunctionJS
    const _setFields = function( pDate, pYear, pMonth, pDay, pHours, pMinutes, pSeconds, pMilliseconds )
    {
        if ( isValidDateArgument( pDate ) )
        {
            const year = resolveFullYear( asInt( pYear, pDate.getFullYear() ) );
            const month = clamp( asInt( pMonth, pDate.getMonth() ), 0, 11 );
            const day = clamp( asInt( pDay, pDate.getDate() ), 1, numDaysInMonth( month, year ) );

            const hour = clamp( asInt( pHours, pDate.getHours() ), 0, 23 );
            const minutes = clamp( asInt( pMinutes, pDate.getMinutes() ), 0, 59 );
            const seconds = clamp( asInt( pSeconds, pDate.getSeconds() ), 0, 59 );
            const milliseconds = clamp( asInt( pMilliseconds, pDate.getMilliseconds() ), 0, 999 );

            const date = new Date( pDate );

            date.setFullYear( year );
            date.setMonth( month );
            date.setDate( day );
            date.setHours( hour );
            date.setMinutes( minutes );
            date.setSeconds( seconds );
            date.setMilliseconds( milliseconds );

            return lock( date );
        }

        return pDate;
    };

    const sortDates = function( ...pDates )
    {
        let dates = [].concat( varargs( ...pDates ) );

        dates = dates.filter( isValidDateArgument ).map( ( date ) => toTimestamp( date, Number.MAX_VALUE ) );

        dates = dates.sort( ( a, b ) => a - b );

        return [].concat( dates.map( ( date ) => new Date( +date ) ) );
    };

    /**
     * Returns true if the first date is earlier than the second date.
     *
     * If either argument is not a valid date or a number, returns false.
     *
     * @param pDateA a date to compare to another date
     * @param pDateB a date to which to compare the first date
     * @param pTransformerFunction (optional) function to call on each argument before comparison
     *
     * @returns true if the first date is earlier than the second date
     */
    const before = ( pDateA, pDateB, pTransformerFunction ) =>
        ((validateArguments( pDateA, pDateB )) && _compare( pDateA, pDateB, pTransformerFunction ) < 0);

    /**
     * Returns true if the first date is later than the second date.
     *
     * If either argument is not a valid date or a number, returns false.
     * *
     * @param pDateA a date to compare to another date
     * @param pDateB a date to which to compare the first date
     * @param pTransformerFunction (optional) function to call on each argument before comparison
     *
     * @returns true if the first date is later than the second date, false otherwise
     */
    const after = ( pDateA, pDateB, pTransformerFunction ) =>
        ((validateArguments( pDateA, pDateB )) && _compare( pDateA, pDateB, pTransformerFunction ) > 0);

    /**
     * Returns true if the first date is the same date as the second date.
     *
     * If either argument is not a valid date or a number, returns false.
     * *
     * @param pDateA a date to compare to another date
     * @param pDateB a date to which to compare the first date
     * @param pTransformerFunction (optional) function to call on each argument before comparison
     *                             For example, you could convert both dates to noon,
     *                             if you just want to know if it is the same DAY
     *
     * @returns true if the first date is the same as the second date, false otherwise
     */
    const equal = ( pDateA, pDateB, pTransformerFunction ) =>
        ((validateArguments( pDateA, pDateB )) && _compare( pDateA, pDateB, pTransformerFunction ) === 0);

    const earliest = function( ...pDates )
    {
        const dates = sortDates( ...pDates );
        return (dates?.length || 0) > 0 ? lock( new Date( dates[0] ) ) : null;
    };

    const latest = function( ...pDates )
    {
        const dates = sortDates( ...pDates );
        return (dates?.length || 0) > 0 ? lock( new Date( dates[dates.length - 1] ) ) : null;
    };

    const numDaysInMonth = function( pMonth, pYear )
    {
        const year = isNumber( pYear ) ? asInt( pYear ) : Now().getFullYear();

        let arr = months.map( ( entry ) => entry[1] );

        arr = arr.map( ( month ) => month.clone( year ) );

        let days = arr.map( ( month ) => month.days );

        return days[pMonth];
    };

    const numDaysInYear = function( pYear )
    {
        const year = resolveFullYear( isDate( pYear ) ? pYear.getFullYear() : (isNumeric( pYear ) ? asInt( pYear ) : Now().getFullYear()) );
        return (isLeapYear( year )) ? 366 : 365;
    };

    const toYear = function( pDate, pYear = Now().getFullYear() )
    {
        if ( isValidDateArgument( pDate ) )
        {
            let date = new Date( pDate );
            date = _setFields( date, resolveFullYear( pYear ), 0, 1, 0, 0, 0, 0 );
            return lock( date );
        }
        return pDate;
    };

    const toMonthDay = function( pDate, pDayNum = 1 )
    {
        if ( isValidDateArgument( pDate ) )
        {
            let date = new Date( pDate );
            const month = date.getMonth();
            const daysInMonth = numDaysInMonth( month, date.getFullYear() );
            date = _setFields( date, date.getFullYear(), month, Math.max( 1, Math.min( daysInMonth, asInt( pDayNum ) ) ), 0, 0, 0, 0, 0 );
            return lock( date );
        }
        return pDate;
    };

    const toWeekDay = function( pDate, pWeekDay = 0 )
    {
        if ( isValidDateArgument( pDate ) )
        {
            let date = new Date( pDate );
            const day = date.getDay();
            date = _setFields( date, date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0, 0 );
            date.setDate( date.getDate() + (asInt( pWeekDay ) - day) );
            return lock( date );
        }
        return pDate;
    };

    const toHour = function( pDate, pHour = 0 )
    {
        if ( isValidDateArgument( pDate ) )
        {
            let date = new Date( pDate );
            date = _setFields( date, date.getFullYear(), date.getMonth(), date.getDate(), asInt( pHour ), 0, 0, 0, 0 );
            return lock( date );
        }
        return pDate;
    };

    const toMinute = function( pDate, pMinute = 0 )
    {
        if ( isValidDateArgument( pDate ) )
        {
            let date = new Date( pDate );
            date = _setFields( date, date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), asInt( pMinute ), 0, 0, 0 );
            return lock( date );
        }
        return pDate;
    };

    const toSecond = function( pDate, pSecond = 0 )
    {
        if ( isValidDateArgument( pDate ) )
        {
            let date = new Date( pDate );
            date = _setFields( date, date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes(), asInt( pSecond ), 0, 0 );
            return lock( date );
        }
        return pDate;
    };

    const toMillisecond = function( pDate, pMillisecond = 0 )
    {
        if ( isValidDateArgument( pDate ) )
        {
            let date = new Date( pDate );
            date = _setFields( date, date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds(), asInt( pMillisecond ), 0 );
            return lock( date );
        }
        return pDate;
    };

    const toNoon = ( pDate ) => toHour( pDate, 12 );

    const toMidnight = ( pDate ) => toHour( pDate, 0 );

    const lastInstant = ( pDate ) => toMillisecond( toSecond( toMinute( toHour( pDate, 23 ), 59 ), 59 ), 999 );

    const startOfWeek = ( pDate ) => TIME_UNITS.WEEK.startsFor( pDate );

    const startOfDecade = ( pDate ) => TIME_UNITS.DECADE.startsFor( pDate );

    const startOfYear = ( pDate ) => TIME_UNITS.YEAR.startsFor( pDate );

    const startOfMonth = ( pDate ) => TIME_UNITS.MONTH.startsFor( pDate );

    const startOfDay = ( pDate ) => TIME_UNITS.DAY.startsFor( pDate );

    const startOfHour = ( pDate ) => TIME_UNITS.HOUR.startsFor( pDate );

    const startOfMinute = ( pDate ) => TIME_UNITS.MINUTE.startsFor( pDate );

    const startOfSecond = ( pDate ) => TIME_UNITS.SECOND.startsFor( pDate );


    const endOfWeek = ( pDate ) => TIME_UNITS.WEEK.endsFor( pDate );

    const endOfDecade = ( pDate ) => TIME_UNITS.DECADE.endsFor( pDate );

    const endOfYear = ( pDate ) => TIME_UNITS.YEAR.endsFor( pDate );

    const endOfMonth = ( pDate ) => TIME_UNITS.MONTH.endsFor( pDate );

    const endOfDay = ( pDate ) => TIME_UNITS.DAY.endsFor( pDate );

    const endOfHour = ( pDate ) => TIME_UNITS.HOUR.endsFor( pDate );

    const endOfMinute = ( pDate ) => TIME_UNITS.MINUTE.endsFor( pDate );

    const endOfSecond = ( pDate ) => TIME_UNITS.SECOND.endsFor( pDate );

    const DateFilters =
        {
            WEEKDAYS: ( e ) => isDate( e ) && ![Days.SUNDAY, Days.SATURDAY].includes( e.getDay() ),
            WEEKENDS: ( e ) => isDate( e ) && [Days.SUNDAY, Days.SATURDAY].includes( e.getDay() ),

            SUNDAYS: ( e ) => isDate( e ) && (Days.SUNDAY === e.getDay()),
            MONDAYS: ( e ) => isDate( e ) && (Days.MONDAY === e.getDay()),
            TUESDAYS: ( e ) => isDate( e ) && (Days.TUESDAY === e.getDay()),
            WEDNESDAYS: ( e ) => isDate( e ) && (Days.WEDNESDAY === e.getDay()),
            THURSDAYS: ( e ) => isDate( e ) && (Days.THURSDAY === e.getDay()),
            FRIDAYS: ( e ) => isDate( e ) && (Days.FRIDAY === e.getDay()),
            SATURDAYS: ( e ) => isDate( e ) && (Days.SATURDAY === e.getDay()),

            FIRST_OF_MONTH: ( e ) => isDate( e ) && (1 === e.getDate()),
            LAST_OF_MONTH: ( e ) => isDate( e ) && (numDaysInMonth( e.getMonth(), e.getFullYear() ) === e.getDate()),

            laterThan: ( pDate ) => ( e ) => after( e, pDate ),

            earlierThan: ( pDate ) => ( e ) => before( e, pDate ),

            between: function( pStartDate, pEndDate )
            {
                if ( isValidDateArgument( pStartDate ) && isValidDateArgument( pEndDate ) )
                {
                    const startDate = new Date( earliest( pStartDate, pEndDate ) );
                    const endDate = new Date( latest( pStartDate, pEndDate ) );

                    return ( e ) => isDate( e ) && e > startDate && e <= endDate;
                }

                return op_false;
            }
        };

    const calculateOccurrencesOf = function( pYear, pMonth, pDay )
    {
        const year = asInt( pYear );
        const month = asInt( pMonth );

        const dayNumber = 0 === pDay ? 0 : asInt( pDay, Days.MONDAY );

        let startDate = new Date( year, month, 1, 0, 0, 0, 0 );

        const day = startDate.getDay();

        if ( day < dayNumber )
        {
            startDate.setDate( startDate.getDate() + (dayNumber - day) );
        }
        else if ( day > dayNumber )
        {
            startDate.setDate( startDate.getDate() + ((6 + dayNumber + 1) - day) );
        }

        let occurrences = [];

        for( let i = 0; i <= 6; i++ )
        {
            const date = new Date( startDate );

            date.setDate( startDate.getDate() + (i * DAYS_PER_WEEK) );

            if ( date.getMonth() === month )
            {
                occurrences.push( date );
            }
            else
            {
                break;
            }
        }

        occurrences = occurrences.filter( e => isDate( e ) && (e.getMonth() === month) );

        return lock( occurrences.map( e => lock( e ) ) );
    };

    const calculateNthOccurrenceOfDay = function( pYear, pMonth, pOccurrence, pDay )
    {
        const occurrence = asInt( pOccurrence );

        const occurrences = calculateOccurrencesOf( pYear, pMonth, pDay );

        return occurrence >= 0 ? occurrences[occurrence] : occurrences[occurrences.length + occurrence];
    };

    /**
     * Instances of this class define the rules for calculating the date a holiday is observed.
     * Holidays can be defined as happening on a specific date
     * or
     * as the nth occurrence of a certain day, such as Monday
     */
    class HolidayDefinition
    {
        #exactDate = false;
        #month;
        #date;
        #occurrence = 0; // captures the part of a rules like 2nd Monday of, for example
        #weekday = 1; // captures the weekday for the associated ordinal

        /**
         * Constructs a HolidayDefinition,
         * which is used to calculate the date the holiday occurs in a specific year.
         *
         * @param pUseExactDate {boolean} specify true if the holiday always occurs on a specific date
         * @param pMonth {number} the Months value for the month in which the holiday occurs
         * @param pDate {number} the calendar day of the holiday, for example 25 for Christmas
         * @param pOccurrence {number} the Occurrence indicating which occurrence of weekday
         * to use to calculate the date of the associated Holiday, if exactDate is false
         * @param pWeekday {number} the Days value indicating the day of the week
         * to use to calculate the date of the associated Holiday, if useExactDate is false
         */
        constructor( pUseExactDate, pMonth, pDate, pOccurrence, pWeekday )
        {
            this.#exactDate = toBool( pUseExactDate );

            this.#month = asInt( pMonth );
            this.#date = asInt( pDate );

            this.#occurrence = asInt( pOccurrence );
            this.#weekday = asInt( pWeekday );
        }

        static get [Symbol.species]()
        {
            return this;
        }

        calculateDate( pYear )
        {
            if ( this.#exactDate )
            {
                return lock( new Date( pYear, this.#month, this.#date ) );
            }

            return calculateNthOccurrenceOfDay( pYear, this.#month, this.#occurrence, this.#weekday );
        }
    }

    class HolidayExactDateDefinition extends HolidayDefinition
    {
        constructor( pMonth, pDate )
        {
            super( true, pMonth, pDate, -1, -1 );
        }

        static get [Symbol.species]()
        {
            return this;
        }
    }

    class HolidayRelativeDefinition extends HolidayDefinition
    {
        constructor( pMonth, pOccurrence, pWeekday )
        {
            super( false, pMonth, 0, pOccurrence, pWeekday );
        }

        static get [Symbol.species]()
        {
            return this;
        }
    }

    class Holiday
    {
        #name;
        #definition;
        #mondayRule;

        #cache;

        constructor( pName, pDefinition, pMondayRule = function( pDate ) { return pDate; } )
        {
            this.#name = asString( pName );
            this.#definition = lock( pDefinition );
            this.#mondayRule = pMondayRule;
            this.#cache = new Map();
        }

        static get [Symbol.species]()
        {
            return this;
        }

        get name()
        {
            return asString( this.#name );
        }

        get definition()
        {
            return lock( this.#definition );
        }

        _applyMondayRule( pDate )
        {
            let date = isValidDateArgument( pDate ) ? new Date( pDate ) : null;

            if ( isFunction( this.#mondayRule ) )
            {
                try
                {
                    date = this.#mondayRule( date );
                }
                catch( ex )
                {
                    modulePrototype.handleError( ex, "Holiday._applyMondayRule", this, date );

                    date = isDate( date ) ? date : pDate;
                }
            }

            return lock( date || pDate );
        }

        generate( pStartDate, pEndDate )
        {
            let cache = this.#cache || new Map();

            let dates = [];

            let startDate;
            let endDate;

            if ( isValidDateArgument( pStartDate ) )
            {
                startDate = new Date( pStartDate );

                const startYear = startDate.getFullYear();
                const startMonth = startDate.getMonth();

                startDate = new Date( startYear, startMonth, 1, 0, 0, 0, 0 );

                endDate = isValidDateArgument( pEndDate ) ? new Date( pEndDate ) : _setFields( new Date( startDate ), startYear + 12 );

                for( let year = startYear, stopYear = endDate.getFullYear(); year <= stopYear; year++ )
                {
                    let date = cache.get( year ) || this.#definition.calculateDate( year );

                    date = this._applyMondayRule( date );

                    dates.push( date );

                    cache.set( year, date );
                }

                dates = dates.filter( date => isDate( date ) && (toTimestamp( date ) > toTimestamp( toMidnight( pStartDate ) )) && (toTimestamp( date ) <= toTimestamp( lastInstant( endDate ) )) );
            }

            return dates.map( e => lock( e ) );
        }
    }

    const _defaultMondayRule = function( pDate )
    {
        if ( isValidDateArgument( pDate ) )
        {
            const weekday = pDate.getDay();

            switch ( weekday )
            {
                case Days.SUNDAY:
                    return avoidWeekend( pDate );

                case Days.SATURDAY:
                    return subtractDays( pDate, 1 );

                default:
                    return new Date( pDate );
            }
        }

        return pDate;
    };

    Holiday.MondayRules =
        {
            /**
             * For most U.S. Federal Holidays,
             *
             * If the holiday falls on a Saturday,
             * it is observed on the preceding Friday.
             *
             * If it falls on a Sunday,
             * it is observed on the following Monday.
             *
             * This is known as the "Monday Rule."
             *
             * @param pDate
             */
            DEFAULT: _defaultMondayRule,
            FOLLOWING_MONDAY: function( pDate )
            {
                if ( isValidDateArgument( pDate ) )
                {
                    return avoidWeekend( pDate );
                }
                return pDate;
            },
            PRIOR_FRIDAY: function( pDate )
            {
                if ( isValidDateArgument( pDate ) )
                {
                    const map = { [Days.SUNDAY]: 2, [Days.SATURDAY]: 1 };

                    const weekday = pDate.getDay();

                    return subtractDays( pDate, map[weekday] || 0 );
                }
                return pDate;
            },
            INDEPENDENCE_DAY: function( pDate )
            {
                let date = _defaultMondayRule( pDate );

                // if date is a holiday, previous thursday?

                return date;
            },
            NULL_RULE: function( pDate )
            {
                return pDate;
            }
        };

    /**
     * Holiday	Date	Details
     * New Year’s Day	January 1	Marks the beginning of Gregorian calendar year
     * Martin Luther King, Jr. Day	3rd Monday in January	Honors Dr. Martin Luther King Jr.
     * President’s Day	3rd Monday in February	Honors George Washington – Officially named George Washington’s birthday
     * Memorial Day	Last Monday in May	Honors men and women who died while serving in the military
     * Independence Day	July 4	Celebrates the signing of the Declaration of Independence
     * Labor Day	1st Monday in September	Honors the American workforce
     * Columbus Day	2nd Monday in October	Honors Christopher Columbus
     * Veteran’s Day	November 11	Honors all United States Armed Forces veterans
     * Thanksgiving	4th Thursday in November	A celebration that gives thanks for the Autumn harvest
     * Christmas Day	December 25	A celebration of the birth of Christ
     */

    const HOLIDAYS = lock(
        {
            USA: lock(
                [
                    lock( new Holiday( "New Year's Day", new HolidayExactDateDefinition( Months.JANUARY, 1 ), Holiday.MondayRules.DEFAULT ) ),
                    lock( new Holiday( "Martin Luther King, Jr. Day", new HolidayRelativeDefinition( Months.JANUARY, Occurrence.THIRD, Days.MONDAY ), Holiday.MondayRules.DEFAULT ) ),
                    lock( new Holiday( "President’s Day", new HolidayRelativeDefinition( Months.FEBRUARY, Occurrence.THIRD, Days.MONDAY ), Holiday.MondayRules.DEFAULT ) ),
                    lock( new Holiday( "Memorial Day", new HolidayRelativeDefinition( Months.MAY, Occurrence.LAST, Days.MONDAY ), Holiday.MondayRules.DEFAULT ) ),
                    lock( new Holiday( "Independence Day", new HolidayExactDateDefinition( Months.JULY, 4 ), Holiday.MondayRules.INDEPENDENCE_DAY ) ),
                    lock( new Holiday( "Labor Day", new HolidayRelativeDefinition( Months.SEPTEMBER, Occurrence.FIRST, Days.MONDAY ), Holiday.MondayRules.DEFAULT ) ),
                    lock( new Holiday( "Columbus Day", new HolidayRelativeDefinition( Months.OCTOBER, Occurrence.SECOND, Days.MONDAY ), Holiday.MondayRules.DEFAULT ) ),
                    lock( new Holiday( "Veteran’s Day", new HolidayExactDateDefinition( Months.NOVEMBER, 11 ), Holiday.MondayRules.DEFAULT ) ),
                    lock( new Holiday( "Thanksgiving", new HolidayRelativeDefinition( Months.NOVEMBER, Occurrence.FOURTH, Days.THURSDAY ), Holiday.MondayRules.NULL_RULE ) ),
                    lock( new Holiday( "Christmas", new HolidayExactDateDefinition( Months.DECEMBER, 25 ), Holiday.MondayRules.NULL_RULE ) )
                ] )
        } );

    const generateHolidays = function( pStartDate, pEndDate, pHolidays )
    {
        let holidays = [].concat( pHolidays || [] ).filter( e => e instanceof Holiday );

        let dates = [];

        for( let holiday of holidays )
        {
            dates = dates.concat( holiday.generate( pStartDate, pEndDate ) );
        }

        return sortDates( ...dates );
    };

    const daysBetween = function( pStartDate, pEndDate )
    {
        const start = toTimestamp( toNoon( pStartDate ) );
        const end = toTimestamp( toNoon( pEndDate ) );

        let days = ((end - start) * 1_000) / (MILLIS_PER_DAY * 1_000);

        // accounting for DST
        const decimalPortion = days - Math.trunc( days );

        if ( decimalPortion > (23 / 24.25) )
        {
            days += decimalPortion;
        }

        return (Math.floor( days ));
    };

    const _weekdaysBetween = function( pStartDate, pEndDate )
    {
        let start = toNoon( pStartDate );
        const startDay = start.getDay();

        if ( startDay > 5 )
        {
            start = addDays( start, 1 );
        }

        const end = avoidWeekend( lastInstant( pEndDate ), Direction.PAST );

        const days = daysBetween( start, end );

        const weeks = Math.floor( days / DAYS_PER_WEEK );

        let extraDays = Math.abs( days ) % DAYS_PER_WEEK;

        return (weeks * DAYS_PER_WORK_WEEK) + extraDays;
    };

    const daysRemainingIn = function( pUnit, pDate )
    {
        let date = isDate( pDate ) ? new Date( pDate ) : Now();

        const day = date.getDay();

        const unit = resolveUnit( pUnit );

        let remaining = 0;

        switch ( unit )
        {
            case TIME_UNITS.WEEK:
                remaining = Math.abs( day - 6 );
                break;

            case TIME_UNITS.WORK_WEEK:
                remaining = (day < DAYS_PER_WORK_WEEK ? (day - DAYS_PER_WORK_WEEK) : 0);
                break;

            case TIME_UNITS.DECADE:
                remaining = daysBetween( date, endOfDecade( date ) );
                break;

            case TIME_UNITS.YEAR:
                remaining = daysBetween( date, endOfYear( date ) );
                break;

            case TIME_UNITS.MONTH:
                remaining = daysBetween( date, endOfMonth( date ) );
                break;

            case TIME_UNITS.DAY:
            case TIME_UNITS.HOUR:
            case TIME_UNITS.MINUTE:
            case TIME_UNITS.SECOND:
            case TIME_UNITS.MILLISECOND:

            default:
                remaining = 0;

                break;
        }

        return remaining;
    };

    const addDays = function( pDate, pNumDays )
    {
        let numDays = isNumber( pNumDays ) ? asInt( pNumDays ) : 0;

        if ( 0 === numDays )
        {
            return pDate;
        }

        if ( isValidDateArgument( pDate ) )
        {
            let newDate = new Date( pDate );

            const hour = newDate.getHours();
            const minute = newDate.getMinutes();
            const second = newDate.getSeconds();
            const millis = newDate.getMilliseconds();

            // convert as noon to avoid some potential DST side effects
            newDate = toNoon( newDate );

            // add the days
            newDate.setDate( newDate.getDate() + numDays );

            // restore the hours, minutes, seconds, and milliseconds
            newDate = _setFields( newDate, newDate.getFullYear(), newDate.getMonth(), newDate.getDate(), hour, minute, second, millis );

            return lock( newDate );
        }
    };

    const subtractDays = function( pDate, pNumDays )
    {
        const numDays = isNumber( pNumDays ) ? asInt( pNumDays ) : 0;

        if ( 0 === numDays )
        {
            return pDate;
        }

        return addDays( pDate, -(numDays) );
    };

    const addWeeks = function( pDate, pNumWeeks )
    {
        if ( isValidDateArgument( pDate ) )
        {
            const numWeeks = isNumber( pNumWeeks ) ? asInt( pNumWeeks ) : 0;

            return addDays( pDate, (numWeeks * DAYS_PER_WEEK) );
        }
    };

    const subtractWeeks = ( pDate, pNumWeeks ) => addWeeks( pDate, -(isNumber( pNumWeeks ) ? asInt( pNumWeeks ) : 0) );

    const isWeekend = ( pDate ) => isValidDateArgument( pDate ) && [Days.SATURDAY, Days.SUNDAY].includes( pDate.getDay() );

    const avoidWeekend = function( pDate, pDirection = Direction.FUTURE )
    {
        if ( isValidDateArgument( pDate ) )
        {
            let date = new Date( pDate );

            const direction = asInt( pDirection, 0 );

            const map = direction >= 0 ?
                {
                    [Days.SUNDAY]: 1,
                    [Days.SATURDAY]: 2
                } :
                {
                    [Days.SUNDAY]: -2,
                    [Days.SATURDAY]: -1
                };

            const weekday = date.getDay();

            return addDays( date, asInt( map[weekday] || 0, 0 ) );
        }

        return pDate;
    };

    const addWorkdays = function( pDate, pNumDays, pHolidays = [] )
    {
        // unless the specified date is a Sunday, move to start of the next week
        // add days in increments of 7, subtracting 5 from the specified number of days
        if ( isValidDateArgument( pDate ) )
        {
            const numDays = asInt( pNumDays );

            const sign = numDays < 0 ? -1 : 1;

            let startDate = new Date( pDate );

            const hour = startDate.getHours();
            const minute = startDate.getMinutes();
            const second = startDate.getSeconds();
            const millis = startDate.getMilliseconds();

            let date = toNoon( startDate );

            const numWeeks = sign * (Math.floor( Math.abs( numDays ) / DAYS_PER_WORK_WEEK ));

            const extraDays = (sign * (Math.abs( numDays ) % DAYS_PER_WORK_WEEK));

            date = addWeeks( date, numWeeks );
            date = addDays( date, extraDays );
            date = avoidWeekend( date, sign );

            if ( (pHolidays?.length || 0) > 0 )
            {
                let holidays = _processHolidays( pHolidays, startDate, date );

                const loopCap = new IterationCap( Math.max( numWeeks, 12 ) );

                while ( holidays?.length > 0 && !loopCap.reached )
                {
                    let tempDate = toMidnight( date );

                    date = avoidWeekend( addDays( date, (sign * holidays.length) ), sign );

                    holidays = _processHolidays( pHolidays, tempDate, lastInstant( date ) );
                }
            }

            date = _setFields( date, date.getFullYear(), date.getMonth(), date.getDate(), hour, minute, second, millis );

            return lock( date );
        }

        return pDate;
    };

    /**
     * Returns an array of dates representing holidays that fall on a weekday
     * given an array of holidays and/or dates.
     *
     * @param pHolidays {Array<Holiday|Date>} an array of elements that are with Dates or Holidays
     * @param pStartDate the first potential date to return in the calculated holidays
     * @param pEndDate the last potential date to return in the calculated holidays
     * @returns {Array<Date>} an array of dates representing holidays that fall on a weekday
     * @private
     */
    function _processHolidays( pHolidays, pStartDate, pEndDate )
    {
        let holidays = asArray( pHolidays || [] );

        holidays = holidays.map( e => isDate( e ) ? e : e instanceof Holiday ? e.generate( pStartDate, pEndDate ) : null ).flat();

        holidays = arrayUtils.pruneArray( holidays );

        return holidays.filter( DateFilters.WEEKDAYS ).filter( DateFilters.between( toMidnight( pStartDate ), lastInstant( pEndDate ) ) );
    }

    const isHoliday = function( pDate, pHolidays = HOLIDAYS.USA )
    {
        if ( isValidDateArgument( pDate ) )
        {
            let holidays = asArray( pHolidays || HOLIDAYS.USA );

            holidays = holidays.map( e => isDate( e ) ? e : e instanceof Holiday ? e.generate( pDate, addDays( pDate, 366 ) ) : null ).flat();

            holidays = arrayUtils.pruneArray( holidays ).map( toNoon );

            return holidays.includes( toNoon( pDate ) );
        }

        return false;
    };

    /**
     * Returns the number of working days (excludes weekends and any defined holidays)
     * between the start date and the end date.
     *
     * @param pStartDate {Date} the date from which to start the calculation
     * @param pEndDate {Date} the last date to include
     * @param pHolidays {Array<Date|Holiday>}
     * @returns {number} the number of working days between the specified dates
     */
    const workDaysBetween = function( pStartDate, pEndDate, pHolidays = [] )
    {
        if ( isValidDateArgument( pStartDate ) && isValidDateArgument( pEndDate ) )
        {
            let sign = 1;

            let startDate = new Date( pStartDate );

            let endDate = new Date( pEndDate );

            if ( startDate > endDate )
            {
                sign = -1;

                startDate = new Date( pEndDate );
                endDate = new Date( pStartDate );
            }

            startDate = toNoon( startDate );

            endDate = lastInstant( endDate );

            let days = _weekdaysBetween( startDate, endDate );

            let holidays = _processHolidays( pHolidays, startDate, endDate );

            return (days - (holidays?.length || 0)) * sign;
        }

        return 0;
    };

    const DATES_ITERABLE_OPTIONS =
        {
            interval: 1,
            includeWeekends: false,
            includeHolidays: true,
            maxDates: 10_000,
            exitCriteria: ( pDate, pEndDate, pIterations ) => pIterations >= this.maxDates || isValidDateArgument( pEndDate ) && pDate >= pEndDate,
            holidays: HOLIDAYS.USA
        };

    const DATES_ITERABLE_WORKDAY_OPTIONS =
        {
            ...DATES_ITERABLE_OPTIONS,
        };
    DATES_ITERABLE_WORKDAY_OPTIONS.includeHolidays = false;

    class DatesIterable
    {
        #startDate;
        #endDate;

        #options;

        #interval = 1;
        #maxDates = 10_000;

        #includeWeekends = false;
        #includeHolidays = false;

        #holidays = [];

        #iterations = 0;

        #mappers = [];
        #filters = [];

        #exitCriteria = ( pDate, pEndDate, pIterations, pMaxIterations ) =>
        {
            return asInt( pIterations ) >= asInt( pMaxIterations ) || (isValidDateArgument( pEndDate ) && pDate >= pEndDate);
        };

        constructor( pStartDate, pEndDate, pOptions = DATES_ITERABLE_OPTIONS )
        {
            this.#startDate = lock( isValidDateArgument( pStartDate ) ? new Date( pStartDate ) : Now() );
            this.#endDate = isValidDateArgument( pEndDate ) ? lock( new Date( pEndDate ) ) : null;

            this.#options = lock( populateOptions( pOptions, DATES_ITERABLE_OPTIONS ) );

            this.#interval = Math.max( 1, asInt( this.#options.interval ) );
            this.#maxDates = Math.min( 32_000, asInt( this.#options.maxDates ) || this.#maxDates );

            this.#includeWeekends = !!this.#options.includeWeekends;
            this.#includeHolidays = !!this.#options.includeHolidays;

            this.#holidays = asArray( this.#options.holidays || HOLIDAYS.USA );

            this.#exitCriteria = isFunction( this.#options.exitCriteria ) ? this.#options.exitCriteria || this.#exitCriteria : this.#exitCriteria;

            this.#iterations = 0;
        }

        get startDate()
        {
            return isValidDateArgument( this.#startDate ) ? this.#startDate : Now();
        }

        get endDate()
        {
            return isValidDateArgument( this.#endDate ) ? this.#endDate : null;
        }

        get iterations()
        {
            return this.#iterations;
        }

        get options()
        {
            return this.#options;
        }

        get maxDates()
        {
            return asInt( this.#maxDates ) || asInt( DATES_ITERABLE_OPTIONS.maxDates );
        }

        get interval()
        {
            return Math.max( asInt( this.#interval ), 1 );
        }

        get includeWeekends()
        {
            return true === this.#includeWeekends;
        }

        get includeHolidays()
        {
            return true === this.#includeHolidays;
        }

        get holidays()
        {
            return asArray( this.#holidays || HOLIDAYS.USA );
        }

        /**
         *
         * @returns {function(pDate:Date,pEndDate:Date,pIterations:number,pMaxIterations:number):boolean}
         */
        get exitCriteria()
        {
            if ( isFunction( this.#exitCriteria ) )
            {
                return this.#exitCriteria;
            }
            return ( pDate, pEndDate, pIterations, pMaxIterations ) => pIterations >= pMaxIterations || (isValidDateArgument( pEndDate ) && pDate >= pEndDate);
        }

        map( ...pFunctions )
        {
            this.#mappers = asArray( varargs( ...pFunctions ) ).filter( Filters.IS_FUNCTION ) || [];
        }

        filter( ...pFunctions )
        {
            this.#filters = asArray( varargs( ...pFunctions ) ).filter( Filters.IS_FUNCTION ) || [];
        }

        get mappers()
        {
            return asArray( this.#mappers ).filter( Filters.IS_FUNCTION ) || [];
        }

        get filters()
        {
            return asArray( this.#filters ).filter( Filters.IS_FUNCTION ) || [];
        }

        * [Symbol.iterator]()
        {
            const iterable = this;

            const start = this.startDate;
            const end = this.endDate;

            const interval = asInt( this.interval );
            const maxDates = asInt( iterable.maxDates );

            const includeWeekends = this.includeWeekends;
            const includeHolidays = this.includeHolidays;
            const holidays = this.holidays;

            const mappers = asArray( this.mappers ) || [];
            const filters = asArray( this.filters ) || [];

            const exitCriteria = this.exitCriteria;

            let date = new Date( start );

            function generateNextDate( pCurrentDate, pInterval = interval )
            {
                date = (iterable.iterations <= 0) ? start || pCurrentDate : addDays( pCurrentDate, pInterval );

                if ( !includeWeekends && isWeekend( date ) )
                {
                    date = avoidWeekend( date );
                }

                if ( !includeHolidays )
                {
                    while ( isHoliday( date, holidays ) )
                    {
                        date = !includeWeekends ? avoidWeekend( addDays( date, 1 ) ) : addDays( date, 1 );
                    }
                }

                for( const mapper of mappers )
                {
                    date = mapper( date );
                }

                return isValidDateArgument( end ) ? ((null != date && date <= end) ? date : null) : date;
            }

            while ( !exitCriteria( date, end, this.iterations, maxDates ) )
            {
                date = generateNextDate( date );

                this.#iterations += (null === date) ? 0 : 1;

                const iterations = this.iterations;

                if ( null != date && iterations < 32_000 )
                {
                    for( const filter of filters )
                    {
                        while ( null != date && !filter( date ) && !exitCriteria( date, end, iterations, maxDates ) )
                        {
                            date = generateNextDate( date, 1 );
                        }
                    }

                    if ( null === date )
                    {
                        break;
                    }

                    yield date;
                }
                else
                {
                    break;
                }
            }
        }
    }

    const getWeekdays = ( pStartDate, pEndDate, pOptions = DATES_ITERABLE_OPTIONS ) => new DatesIterable( pStartDate, pEndDate, pOptions );

    const getBusinessDays = ( pStartDate, pEndDate, pOptions = DATES_ITERABLE_WORKDAY_OPTIONS ) => new DatesIterable( pStartDate, pEndDate, pOptions );

    let mod =
        {
            dependencies,
            DateConstants,
            classes:
                {
                    DatePart,
                    TimeUnit,
                    DateBuffer,
                    Holiday,
                    HolidayDefinition,
                    HolidayExactDateDefinition,
                    HolidayRelativeDefinition,
                    Month,
                    February,
                    DatesIterable
                },
            DateFilters,
            MILLIS_PER,
            ONE_MINUTE,
            TWO_MINUTES,
            FIVE_MINUTES,
            TEN_MINUTES,
            TWENTY_MINUTES,
            THIRTY_MINUTES,
            FORTY_FIVE_MINUTES,
            ONE_HOUR,
            TWO_HOURS,
            SIX_HOURS,
            EIGHT_HOURS,
            TWELVE_HOURS,
            ONE_DAY,
            TIME_UNITS,
            TIME_UNITS_BY_ID,
            TIME_UNITS_BY_NAME,
            HOLIDAYS,
            US_HOLIDAYS: HOLIDAYS.USA,
            DATE_PARTS,
            DatePart,
            TimeUnit,
            DateBuffer,
            isDate,
            isValidDateArgument,
            resolveDate,
            isLeapYear,
            isWeekend,
            isHoliday,
            numDaysInMonth,
            numDaysInYear,
            calculateOccurrencesOf,
            calculateNthOccurrenceOfDay,
            startOfYear,
            startOfMonth,
            startOfDay,
            startOfWeek,
            startOfHour,
            startOfMinute,
            startOfDecade,
            endOfYear,
            endOfMonth,
            endOfDay,
            endOfWeek,
            endOfHour,
            endOfMinute,
            endOfDecade,
            avoidWeekend,
            generateHolidays,
            addDays,
            addWorkdays,
            addWeeks,
            subtractDays,
            subtractWeeks,
            toNoon,
            toMidnight,
            firstInstant: toMidnight,
            lastInstant,
            before,
            after,
            equal,
            sortDates,
            earliest,
            latest,
            daysBetween,
            workDaysBetween,
            getWeekdays,
            getBusinessDays,
            daysRemainingIn,
            mergeOptions,
            merge,
            Now,
            rxTz
        };

    mod = modulePrototype.extend( mod );

    return mod.expose( mod, INTERNAL_NAME, (_ud !== typeof module ? module : mod) ) || mod;

}());
