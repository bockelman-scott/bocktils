const core = require( "../../core/src/CoreUtils.cjs" );

/**
 * Establish separate constants for each of the common utilities imported
 * @see ../src/CommonUtils.cjs
 */
const { constants, typeUtils, stringUtils, arrayUtils } = core;

const { _ud = "undefined" } = constants;

const $scope = core?.$scope || constants?.$scope || function()
{
    return (_ud === typeof self ? ((_ud === typeof global) ? ((_ud === typeof globalThis ? {} : globalThis)) : (global || {})) : (self || {}));
};

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
        lock,
        populateOptions,
        IterationCap,
        IllegalArgumentError,
        no_op,
        op_true,
        op_false
    } = constants;

    const { Result, isDate, isNumber, isFunction, isValidDateInstance } = typeUtils;

    const { asString, asInt, toBool } = stringUtils;

    const { asArray, varargs, Filters } = arrayUtils;

    const { ModuleEvent, ModulePrototype } = classes;

    if ( _ud === typeof CustomEvent )
    {
        CustomEvent = ModuleEvent;
    }

    const modName = "DateUtils";

    const modulePrototype = new ModulePrototype( modName, INTERNAL_NAME );

    const UNIT = lock(
        {
            MILLISECOND: 1,
            SECOND: 2,
            MINUTE: 3,
            HOUR: 4,
            DAY: 5,
            WEEK: 6,
            WORK_WEEK: 7,
            MONTH: 8,
            YEAR: 9,
            DECADE: 10,
            DAY_OF_WEEK: 11
        } );

    const DateConstants = lock(
        {
            Months: lock(
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
                } ),
            Days: lock(
                {
                    SUNDAY: 0,
                    MONDAY: 1,
                    TUESDAY: 2,
                    WEDNESDAY: 3,
                    THURSDAY: 4,
                    FRIDAY: 5,
                    SATURDAY: 6
                } ),
            Occurrence: lock(
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
                } ),
            Direction: lock(
                {
                    FUTURE: 0,
                    PAST: -1
                } ),
            Units: lock( UNIT ),
            MILLISECONDS_PER_SECOND: 1_000,
            SECONDS_PER_MINUTE: 60,
            MINUTES_PER_HOUR: 60,
            HOURS_PER_DAY: 24,
            DAYS_PER_WEEK: 7,
            DAYS_PER_WORK_WEEK: 5
        } );

    const MILLISECOND = 1;
    const MILLIS_PER_SECOND = DateConstants.MILLISECONDS_PER_SECOND;
    const MILLIS_PER_MINUTE = (DateConstants.SECONDS_PER_MINUTE * MILLIS_PER_SECOND);
    const MILLIS_PER_HOUR = (DateConstants.MINUTES_PER_HOUR * MILLIS_PER_MINUTE);
    const MILLIS_PER_DAY = (DateConstants.HOURS_PER_DAY * MILLIS_PER_HOUR);
    const MILLIS_PER_WEEK = (DateConstants.DAYS_PER_WEEK * MILLIS_PER_DAY);
    const MILLIS_PER_YEAR = Math.floor( 365.25 * MILLIS_PER_DAY );

    const MILLIS_PER = lock(
        {
            SECOND: MILLIS_PER_SECOND,
            MINUTE: MILLIS_PER_MINUTE,
            HOUR: MILLIS_PER_HOUR,
            DAY: MILLIS_PER_DAY,
            WEEK: MILLIS_PER_WEEK,
            YEAR: MILLIS_PER_YEAR
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

    /**
     * Returns a function that will add or subtract one unit to the specified date
     *
     * @param pUnit one of the UNIT constants
     * @param pDecrement {boolean} pass true to returns a function that subtracts one unit instead
     */
    const incrementer = function( pUnit, pDecrement = false )
    {
        let millis = 0;

        let increment = true === pDecrement ? -1 : 1;

        switch ( pUnit )
        {
            case UNIT.MILLISECOND:
                millis = MILLISECOND;
                break;

            case UNIT.SECOND:
                millis = MILLIS_PER_SECOND;
                break;

            case UNIT.MINUTE:
                return function( pDate )
                {
                    let date = new Date( pDate );
                    date.setMinutes( date.getMinutes() + increment );
                    return lock( date );
                };

            case UNIT.HOUR:
                return function( pDate )
                {
                    let date = new Date( pDate );
                    date.setHours( date.getHours() + increment );
                    return lock( date );
                };

            case UNIT.DAY:
                return function( pDate )
                {
                    let date = new Date( pDate );
                    date.setDate( date.getDate() + increment );
                    return lock( date );
                };

            case UNIT.WEEK:
                return function( pDate )
                {
                    let date = new Date( pDate );
                    date.setDate( date.getDate() + (DateConstants.DAYS_PER_WEEK * increment) );
                    return lock( date );
                };

            case UNIT.YEAR:
                return function( pDate )
                {
                    let date = new Date( pDate );
                    date.setFullYear( date.getFullYear() + increment );
                    return lock( date );
                };

            case UNIT.MONTH:
                return function( pDate )
                {
                    let date = new Date( pDate );
                    date.setMonth( date.getMonth() + increment );
                    return lock( date );
                };

            case UNIT.DECADE:
                return function( pDate )
                {
                    let date = new Date( pDate );
                    date.setFullYear( date.getFullYear() + (10 - (date.getFullYear() % 10)) );
                    if ( true === pDecrement )
                    {
                        date.setFullYear( date.getFullYear() + (2 * increment) );
                    }
                    return lock( date );
                };

        }

        return function( pDate )
        {
            return lock( new Date( pDate.getTime() + millis ) );
        };
    };

    const isLeapYear = function( pYear )
    {
        return (((0 === (pYear % 4)) && ((0 !== (pYear % 100)) || (0 === (pYear % 400)))));
    };

    class Month
    {
        #index = 0;
        #name;
        #abbreviation;
        #days;

        constructor( pName, pIndex, pDays )
        {
            this.#index = Math.max( 0, Math.min( 11, asInt( pIndex ) ) );
            this.#name = stringUtils.toProperCase( stringUtils.asString( pName, true ) );
            this.#days = Math.max( 28, Math.min( 31, asInt( pDays ) ) );
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

            this.#year = new Date().getFullYear();
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

    const isValidDateArgument = function( pDate )
    {
        return isValidDateInstance( pDate ) || isNumber( pDate );
    };

    const validateArguments = ( pDateA, pDateB ) => isValidDateArgument( pDateA ) && isValidDateArgument( pDateB );

    const toTimestamp = function( pDate, pDefault = Date.now() )
    {
        return isDate( pDate ) ? pDate.getTime() : isNumber( pDate ) ? Math.floor( pDate ) : pDefault || Date.now();
    };

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

    // noinspection OverlyComplexFunctionJS
    const _setFields = function( pDate, pYear, pMonth, pDay, pHours, pMinutes, pSeconds, pMilliseconds )
    {
        if ( isValidDateArgument( pDate ) )
        {
            const year = asInt( pYear, pDate.getFullYear() );
            const month = asInt( pMonth, pDate.getMonth() );
            const day = asInt( pDay, pDate.getDate() );

            const hour = asInt( pHours, pDate.getHours() );
            const minutes = asInt( pMinutes, pDate.getMinutes() );
            const seconds = asInt( pSeconds, pDate.getSeconds() );
            const milliseconds = asInt( pMilliseconds, pDate.getMilliseconds() );

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
     * If the first argument is not a date or a number, returns false.
     * If the second argument is omitted or not a date or a number, returns true.
     *
     * @param pDateA a date to compare to another date
     * @param pDateB a date to which to compare pDateA
     * @param pTransformerFunction (optional) function to call on each argument before comparison
     */
    const before = function( pDateA, pDateB, pTransformerFunction )
    {
        if ( !validateArguments( pDateA, pDateB ) )
        {
            return false;
        }

        const comp = _compare( pDateA, pDateB, pTransformerFunction );

        return comp < 0;
    };

    /**
     * Returns true if the first date is later than the second date.
     *
     * If the first argument is not a date or a number, returns false.
     * If the second argument is omitted or not a date or a number, returns true.
     *
     * @param pDateA a date to compare to another date
     * @param pDateB a date to which to compare pDateA
     * @param pTransformerFunction (optional) function to call on each argument before comparison
     */
    const after = function( pDateA, pDateB, pTransformerFunction )
    {
        let dateA = isValidDateArgument( pDateA ) ? pDateA : new Date();
        let dateB = isValidDateArgument( pDateB ) ? pDateB : new Date();

        const comp = _compare( dateA, dateB, pTransformerFunction );

        return comp > 0;
    };

    /**
     * Returns true if the first date is the same date as the second date.
     *
     * If the first argument is not a date or a number, returns false.
     * If the second argument is omitted or not a date or a number, returns true.
     *
     * @param pDateA a date to compare to another date
     * @param pDateB a date to which to compare pDateA
     * @param pTransformerFunction (optional) function to call on each argument before comparison
     *                             For example, you could convert both dates to noon,
     *                             if you just want to know if it is the same DAY
     */
    const equal = function( pDateA, pDateB, pTransformerFunction )
    {
        if ( !validateArguments( pDateA, pDateB ) )
        {
            return false;
        }

        const comp = _compare( pDateA, pDateB, pTransformerFunction );

        return comp === 0;
    };

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
        const year = isNumber( pYear ) ? asInt( pYear ) : new Date().getFullYear();

        let arr = months.map( ( entry ) => entry[1] );

        arr = arr.map( ( month ) => month.clone( year ) );

        let days = arr.map( ( month ) => month.days );

        return days[pMonth];
    };

    const numDaysInYear = function( pYear )
    {
        const year = isNumber( pYear ) ? asInt( pYear ) : new Date().getFullYear();

        return (isLeapYear( year )) ? 366 : 365;
    };

    const toNoon = function( pDate )
    {
        if ( isValidDateArgument( pDate ) )
        {
            let date = new Date( pDate );

            date = _setFields( date, date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0, 0, 0 );

            return lock( date );
        }

        return pDate;
    };

    const toMidnight = function( pDate )
    {
        if ( isValidDateArgument( pDate ) )
        {
            let date = new Date( pDate );

            date = _setFields( date, date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0, 0 );

            return lock( date );
        }

        return pDate;
    };

    const lastInstant = function( pDate )
    {
        if ( isValidDateArgument( pDate ) )
        {
            let date = new Date( pDate );

            date = _setFields( date, date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999 );

            return lock( date );
        }

        return pDate;
    };

    /**
     * Returns a date representing the start of the period specified in which the date occurs.
     *
     * @param pUnit one of the UNIT constants or a string matches the key of one of the unit constants
     * @param pDate the date for which to return the start of the specified period (unit)
     */
    const getStartOf = function( pUnit, pDate )
    {
        let date = isDate( pDate ) ? new Date( pDate ) : new Date();

        const day = date.getDay();

        const unit = isNumber( pUnit ) ? pUnit : UNIT[stringUtils.asString( pUnit ).toUpperCase()];

        switch ( unit )
        {
            case UNIT.WEEK:
                date = new Date( toNoon( date ) );
                date.setDate( date.getDate() - day );
                date = toMidnight( date );

                break;

            case UNIT.WORK_WEEK:
                date = new Date( toNoon( date ) );
                date.setDate( (date.getDate() - day) + 1 );
                date = toMidnight( date );
                break;

            case UNIT.DECADE:
                date = new Date( toNoon( date ) );
                date.setFullYear( date.getFullYear() - (date.getFullYear() % 10) );
            //fallthrough

            case UNIT.YEAR:
                date.setMonth( 0 );
            // fallthrough

            case UNIT.MONTH:
                date.setDate( 1 );
            //fallthrough

            case UNIT.DAY:
                date.setHours( 0 );
            //fallthrough

            case UNIT.HOUR:
                date.setMinutes( 0 );
            //fallthrough

            case UNIT.MINUTE:
                date.setSeconds( 0 );
            // fallthrough

            case UNIT.SECOND:
                date.setMilliseconds( 0 );
            // fallthrough

            case UNIT.MILLISECOND:
                date.setMilliseconds( 0 );
        }

        return lock( new Date( date ) );
    };

    const startOfWeek = function( pDate )
    {
        return getStartOf( UNIT.WEEK, pDate );
    };

    const startOfDecade = function( pDate )
    {
        return getStartOf( UNIT.DECADE, pDate );
    };

    const startOfYear = function( pDate )
    {
        return getStartOf( UNIT.YEAR, pDate );
    };

    const startOfMonth = function( pDate )
    {
        return getStartOf( UNIT.MONTH, pDate );
    };

    const startOfDay = function( pDate )
    {
        return getStartOf( UNIT.DAY, pDate );
    };

    const startOfHour = function( pDate )
    {
        return getStartOf( UNIT.HOUR, pDate );
    };

    const startOfMinute = function( pDate )
    {
        return getStartOf( UNIT.MINUTE, pDate );
    };

    const startOfSecond = function( pDate )
    {
        return getStartOf( UNIT.SECOND, pDate );
    };

    /**
     * Returns a date representing the last millisecond of the specified period in which the date occurs
     *
     * @param pUnit
     * @param pDate
     *
     * @returns {Date}
     */
    const getEndOf = function( pUnit, pDate )
    {
        let date = isDate( pDate ) ? new Date( pDate ) : new Date();

        const unit = isNumber( pUnit ) ? pUnit : UNIT[stringUtils.asString( pUnit ).toUpperCase()];

        switch ( unit )
        {
            case UNIT.WEEK:
                date = new Date( getStartOf( unit, date ) );
                date.setDate( date.getDate() + 6 );
                return getEndOf( UNIT.DAY, date );

            case UNIT.WORK_WEEK:
                date = new Date( getStartOf( unit, date ) );
                date.setDate( date.getDate() + 4 );
                return getEndOf( UNIT.DAY, date );

            default:
                const increment = incrementer( unit );
                const next = increment( date );
                date = getStartOf( unit, next );
                break;
        }

        date.setMilliseconds( date.getMilliseconds() - 1 );

        return lock( new Date( date ) );
    };

    const endOfWeek = function( pDate )
    {
        return getEndOf( UNIT.WEEK, pDate );
    };

    const endOfDecade = function( pDate )
    {
        return getEndOf( UNIT.DECADE, pDate );
    };

    const endOfYear = function( pDate )
    {
        return getEndOf( UNIT.YEAR, pDate );
    };

    const endOfMonth = function( pDate )
    {
        return getEndOf( UNIT.MONTH, pDate );
    };

    const endOfDay = function( pDate )
    {
        return getEndOf( UNIT.DAY, pDate );
    };

    const endOfHour = function( pDate )
    {
        return getEndOf( UNIT.HOUR, pDate );
    };

    const endOfMinute = function( pDate )
    {
        return getEndOf( UNIT.MINUTE, pDate );
    };

    const endOfSecond = function( pDate )
    {
        return getEndOf( UNIT.SECOND, pDate );
    };

    const DateFilters =
        {
            WEEKDAYS: ( e ) => isDate( e ) && ![DateConstants.Days.SUNDAY, DateConstants.Days.SATURDAY].includes( e.getDay() ),
            WEEKENDS: ( e ) => isDate( e ) && [DateConstants.Days.SUNDAY, DateConstants.Days.SATURDAY].includes( e.getDay() ),

            SUNDAYS: ( e ) => isDate( e ) && (DateConstants.Days.SUNDAY === e.getDay()),
            MONDAYS: ( e ) => isDate( e ) && (DateConstants.Days.MONDAY === e.getDay()),
            TUESDAYS: ( e ) => isDate( e ) && (DateConstants.Days.TUESDAY === e.getDay()),
            WEDNESDAYS: ( e ) => isDate( e ) && (DateConstants.Days.WEDNESDAY === e.getDay()),
            THURSDAYS: ( e ) => isDate( e ) && (DateConstants.Days.THURSDAY === e.getDay()),
            FRIDAYS: ( e ) => isDate( e ) && (DateConstants.Days.FRIDAY === e.getDay()),
            SATURDAYS: ( e ) => isDate( e ) && (DateConstants.Days.SATURDAY === e.getDay()),

            FIRST_OF_MONTH: ( e ) => isDate( e ) && (1 === e.getDate()),
            LAST_OF_MONTH: ( e ) => isDate( e ) && (numDaysInMonth( e.getMonth(), e.getFullYear() ) === e.getDate()),

            laterThan: function( pDate )
            {
                if ( isValidDateArgument( pDate ) )
                {
                    const date = new Date( pDate );

                    return function( e )
                    {
                        return isDate( e ) && e > date;
                    };
                }

                return op_true;
            },

            earlierThan: function( pDate )
            {
                if ( isValidDateArgument( pDate ) )
                {
                    const date = new Date( pDate );

                    return function( e )
                    {
                        return isDate( e ) && e < date;
                    };
                }

                return op_true;
            },

            between: function( pStartDate, pEndDate )
            {
                if ( isValidDateArgument( pStartDate ) && isValidDateArgument( pEndDate ) )
                {
                    let startDate = new Date( earliest( pStartDate, pEndDate ) );
                    let endDate = new Date( latest( pStartDate, pEndDate ) );

                    return function( e )
                    {
                        return isDate( e ) && e > startDate && e <= endDate;
                    };
                }

                return op_false;
            }

        };

    const calculateOccurrencesOf = function( pYear, pMonth, pDay )
    {
        const year = asInt( pYear );
        const month = asInt( pMonth );

        const dayNumber = 0 === pDay ? 0 : asInt( pDay, DateConstants.Days.MONDAY );

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

            date.setDate( startDate.getDate() + (i * DateConstants.DAYS_PER_WEEK) );

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
         * @param pMonth {number} the DateConstants.Months value for the month in which the holiday occurs
         * @param pDate {number} the calendar day of the holiday, for example 25 for Christmas
         * @param pOccurrence {number} the DateConstants.Occurrence indicating which occurrence of weekday
         * to use to calculate the date of the associated Holiday, if exactDate is false
         * @param pWeekday {number} the DateConstants.Days value indicating the day of the week
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
                case DateConstants.Days.SUNDAY:
                    return avoidWeekend( pDate );

                case DateConstants.Days.SATURDAY:
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
                    const map = { [DateConstants.Days.SUNDAY]: 2, [DateConstants.Days.SATURDAY]: 1 };

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
                    lock( new Holiday( "New Year's Day", new HolidayExactDateDefinition( DateConstants.Months.JANUARY, 1 ), Holiday.MondayRules.DEFAULT ) ),
                    lock( new Holiday( "Martin Luther King, Jr. Day", new HolidayRelativeDefinition( DateConstants.Months.JANUARY, DateConstants.Occurrence.THIRD, DateConstants.Days.MONDAY ), Holiday.MondayRules.DEFAULT ) ),
                    lock( new Holiday( "President’s Day", new HolidayRelativeDefinition( DateConstants.Months.FEBRUARY, DateConstants.Occurrence.THIRD, DateConstants.Days.MONDAY ), Holiday.MondayRules.DEFAULT ) ),
                    lock( new Holiday( "Memorial Day", new HolidayRelativeDefinition( DateConstants.Months.MAY, DateConstants.Occurrence.LAST, DateConstants.Days.MONDAY ), Holiday.MondayRules.DEFAULT ) ),
                    lock( new Holiday( "Independence Day", new HolidayExactDateDefinition( DateConstants.Months.JULY, 4 ), Holiday.MondayRules.INDEPENDENCE_DAY ) ),
                    lock( new Holiday( "Labor Day", new HolidayRelativeDefinition( DateConstants.Months.SEPTEMBER, DateConstants.Occurrence.FIRST, DateConstants.Days.MONDAY ), Holiday.MondayRules.DEFAULT ) ),
                    lock( new Holiday( "Columbus Day", new HolidayRelativeDefinition( DateConstants.Months.OCTOBER, DateConstants.Occurrence.SECOND, DateConstants.Days.MONDAY ), Holiday.MondayRules.DEFAULT ) ),
                    lock( new Holiday( "Veteran’s Day", new HolidayExactDateDefinition( DateConstants.Months.NOVEMBER, 11 ), Holiday.MondayRules.DEFAULT ) ),
                    lock( new Holiday( "Thanksgiving", new HolidayRelativeDefinition( DateConstants.Months.NOVEMBER, DateConstants.Occurrence.FOURTH, DateConstants.Days.THURSDAY ), Holiday.MondayRules.NULL_RULE ) ),
                    lock( new Holiday( "Christmas", new HolidayExactDateDefinition( DateConstants.Months.DECEMBER, 25 ), Holiday.MondayRules.NULL_RULE ) )
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

        const end = avoidWeekend( lastInstant( pEndDate ), DateConstants.Direction.PAST );
        const endDay = end.getDay();

        const days = daysBetween( start, end );

        const weeks = Math.floor( days / DateConstants.DAYS_PER_WEEK );

        let extraDays = Math.abs( days ) % DateConstants.DAYS_PER_WEEK;

        return (weeks * DateConstants.DAYS_PER_WORK_WEEK) + extraDays;
    };

    const daysRemainingIn = function( pUnit, pDate )
    {
        let date = isDate( pDate ) ? new Date( pDate ) : new Date();

        const day = date.getDay();

        const unit = isNumber( pUnit ) ? pUnit : UNIT[stringUtils.asString( pUnit ).toUpperCase()];

        let remaining = 0;

        switch ( unit )
        {
            case UNIT.WEEK:
                remaining = Math.abs( day - 6 );
                break;

            case UNIT.WORK_WEEK:
                remaining = (day < DateConstants.DAYS_PER_WORK_WEEK ? (day - DateConstants.DAYS_PER_WORK_WEEK) : 0);
                break;

            case UNIT.DECADE:
                remaining = daysBetween( date, endOfDecade( date ) );
                break;


            case UNIT.YEAR:
                remaining = daysBetween( date, endOfYear( date ) );
                break;

            case UNIT.MONTH:
                remaining = daysBetween( date, endOfMonth( date ) );
                break;

            case UNIT.DAY:
            case UNIT.HOUR:
            case UNIT.MINUTE:
            case UNIT.SECOND:
            case UNIT.MILLISECOND:

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

            return addDays( pDate, (numWeeks * DateConstants.DAYS_PER_WEEK) );
        }
    };

    const subtractWeeks = function( pDate, pNumWeeks )
    {
        const numWeeks = isNumber( pNumWeeks ) ? asInt( pNumWeeks ) : 0;
        return addWeeks( pDate, -(numWeeks) );
    };

    const isWeekend = function( pDate )
    {
        return isValidDateArgument( pDate ) && [DateConstants.Days.SATURDAY, DateConstants.Days.SUNDAY].includes( pDate.getDay() );
    };

    const avoidWeekend = function( pDate, pDirection = DateConstants.Direction.FUTURE )
    {
        if ( isValidDateArgument( pDate ) )
        {
            let date = new Date( pDate );

            const direction = asInt( pDirection, 0 );

            const map = direction >= 0 ?
                {
                    [DateConstants.Days.SUNDAY]: 1,
                    [DateConstants.Days.SATURDAY]: 2
                } :
                {
                    [DateConstants.Days.SUNDAY]: -2,
                    [DateConstants.Days.SATURDAY]: -1
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
            const startDay = startDate.getDay();

            const hour = startDate.getHours();
            const minute = startDate.getMinutes();
            const second = startDate.getSeconds();
            const millis = startDate.getMilliseconds();

            let date = toNoon( startDate );

            const numWeeks = sign * (Math.floor( Math.abs( numDays ) / DateConstants.DAYS_PER_WORK_WEEK ));

            const extraDays = (sign * (Math.abs( numDays ) % DateConstants.DAYS_PER_WORK_WEEK));

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
            exitCriteria: function( pDate, pEndDate, pIterations )
            {
                return pIterations >= this.maxDates || isValidDateArgument( pEndDate ) && pDate >= pEndDate;
            },
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
            this.#startDate = lock( isValidDateArgument( pStartDate ) ? new Date( pStartDate ) : new Date() );
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
            return isValidDateArgument( this.#startDate ) ? this.#startDate : new Date();
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
         * @returns {function():boolean}
         */
        get exitCriteria()
        {
            return isFunction( this.#exitCriteria ) ? this.#exitCriteria : ( pDate, pEndDate, pIterations, pMaxIterations ) =>
            {
                return pIterations >= pMaxIterations || (isValidDateArgument( pEndDate ) && pDate >= pEndDate);
            };
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
            const maxDates = this.maxDates;

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

    const getWeekdays = function( pStartDate, pEndDate, pOptions = DATES_ITERABLE_OPTIONS )
    {
        return new DatesIterable( pStartDate, pEndDate, pOptions );
    };

    const getBusinessDays = function( pStartDate, pEndDate, pOptions = DATES_ITERABLE_WORKDAY_OPTIONS )
    {
        return new DatesIterable( pStartDate, pEndDate, pOptions );
    };

    let mod =
        {
            dependencies,
            DateConstants,
            classes:
                {
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
            UNIT,
            HOLIDAYS,
            US_HOLIDAYS: HOLIDAYS.USA,
            isDate,
            isValidDateArgument,
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
            getBusinessDays
        };

    mod = modulePrototype.extend( mod );

    return mod.expose( mod, INTERNAL_NAME, (_ud !== typeof module ? module : mod) ) || mod;

}());
