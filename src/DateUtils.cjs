const utils = require( "./CommonUtils.cjs" );

/**
 * Establish separate constants for each of the common utilities imported
 * @see ../src/CommonUtils.cjs
 */
const constants = utils?.constants || require( "./Constants.cjs" );
const typeUtils = utils?.typeUtils || require( "./TypeUtils.cjs" );
const stringUtils = utils?.stringUtils || require( "./StringUtils.cjs" );
const arrayUtils = utils?.arrayUtils || require( "./ArrayUtils.cjs" );
const objectUtils = utils?.objectUtils || require( "./ObjectUtils.cjs" );
const funcUtils = utils?.funcUtils || require( "./FunctionUtils.cjs" );

const _ud = constants?._ud || "undefined";

const $scope = utils?.$scope || function()
{
    return (_ud === typeof self ? ((_ud === typeof global) ? ((_ud === typeof globalThis ? {} : globalThis)) : (global || {})) : (self || {}));
};

(function exposeModule()
{
    const me = exposeModule;

    const dependencies =
        {
            constants,
            typeUtils,
            stringUtils,
            arrayUtils,
            objectUtils
        };

    let isDate = typeUtils.isDate;
    let isNumber = typeUtils.isNumber;
    let isFunction = typeUtils.isFunction;

    let TriState = typeUtils.TriState;

    let asString = stringUtils.asString;
    let asInt = stringUtils.asInt;
    let toBool = stringUtils.toBool;

    let asArray = arrayUtils.asArray;

    let attempt = funcUtils.attempt;

    constants.importUtilities( this, constants, typeUtils, stringUtils, arrayUtils, objectUtils );

    const INTERNAL_NAME = "__BOCK__DATE_UTILS__";

    if ( $scope() && (null != $scope()[INTERNAL_NAME]) )
    {
        return $scope()[INTERNAL_NAME];
    }

    const UNIT = Object.freeze(
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
            DAY_OF_WEEK:11
        } );

    const DateConstants = Object.freeze(
        {
            Months: Object.freeze(
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
            Days: Object.freeze(
                {
                    SUNDAY: 0,
                    MONDAY: 1,
                    TUESDAY: 2,
                    WEDNESDAY: 3,
                    THURSDAY: 4,
                    FRIDAY: 5,
                    SATURDAY: 6
                } ),
            Occurrence: Object.freeze(
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
            Direction: Object.freeze(
                {
                    FUTURE: 0,
                    PAST: -1
                } ),
            Units: Object.freeze( UNIT ),
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

    const MILLIS_PER = Object.freeze(
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
                    return Object.freeze( date );
                };

            case UNIT.HOUR:
                return function( pDate )
                {
                    let date = new Date( pDate );
                    date.setHours( date.getHours() + increment );
                    return Object.freeze( date );
                };

            case UNIT.DAY:
                return function( pDate )
                {
                    let date = new Date( pDate );
                    date.setDate( date.getDate() + increment );
                    return Object.freeze( date );
                };

            case UNIT.WEEK:
                return function( pDate )
                {
                    let date = new Date( pDate );
                    date.setDate( date.getDate() + (DateConstants.DAYS_PER_WEEK * increment) );
                    return Object.freeze( date );
                };

            case UNIT.YEAR:
                return function( pDate )
                {
                    let date = new Date( pDate );
                    date.setFullYear( date.getFullYear() + increment );
                    return Object.freeze( date );
                };

            case UNIT.MONTH:
                return function( pDate )
                {
                    let date = new Date( pDate );
                    date.setMonth( date.getMonth() + increment );
                    return Object.freeze( date );
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
                    return Object.freeze( date );
                };

        }

        return function( pDate )
        {
            return Object.freeze( new Date( pDate.getTime() + millis ) );
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

        get year()
        {
            return this.#year;
        }

        set year( value )
        {
            this.#year = value;
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
            return Object.freeze( month );
        }
    }

    const MONTHS_DATA = Object.freeze(
        {
            JANUARY: Object.freeze( new Month( "January", 0, 31 ) ),
            FEBRUARY: Object.freeze( new February( "February", 1 ) ),
            MARCH: Object.freeze( new Month( "March", 2, 31 ) ),
            APRIL: Object.freeze( new Month( "April", 3, 30 ) ),
            MAY: Object.freeze( new Month( "May", 4, 31 ) ),
            JUNE: Object.freeze( new Month( "June", 5, 30 ) ),
            JULY: Object.freeze( new Month( "July", 6, 31 ) ),
            AUGUST: Object.freeze( new Month( "August", 7, 31 ) ),
            SEPTEMBER: Object.freeze( new Month( "September", 8, 30 ) ),
            OCTOBER: Object.freeze( new Month( "October", 9, 31 ) ),
            NOVEMBER: Object.freeze( new Month( "November", 10, 30 ) ),
            DECEMBER: Object.freeze( new Month( "December", 11, 31 ) )
        } );

    const months = Object.freeze( objectUtils.getEntries( MONTHS_DATA ) );

    const isValidDateArgument = function( pDate )
    {
        return isDate( pDate ) || isNumber( pDate );
    };

    const toTimestamp = function( pDate, pDefault = Date.now() )
    {
        return isDate( pDate ) ? pDate.getTime() : isNumber( pDate ) ? Math.floor( pDate ) : pDefault || Date.now();
    };

    const transform = function( pDate, pFunction )
    {
        let result = { returnValue: pDate, exceptions: [] };

        if ( isFunction( pFunction ) )
        {
            result = attempt( pFunction, pDate );
        }

        return result?.exceptions?.length > 0 ? pDate : result.returnValue;
    };

    const _shortCircuit = function( pDateA, pDateB )
    {
        let state = new TriState();

        const validA = isValidDateArgument( pDateA );

        if ( !isValidDateArgument( pDateB ) )
        {
            state.returnValue = validA;
            state.hasReturnValue = true;
        }
        else if ( !validA )
        {
            state.returnValue = false;
            state.hasReturnValue = true;
        }
        else
        {
            state.returnValue = null;
            state.hasReturnValue = false;
        }

        return state;
    };

    const _compare = function( pDateA, pDateB, pTransformerFunction )
    {
        const dateA = isValidDateArgument( pDateA ) ? transform( pDateA, pTransformerFunction ) : null;
        const dateB = isValidDateArgument( pDateB ) ? transform( pDateB, pTransformerFunction ) : null;

        const tsA = toTimestamp( dateA, Number.MAX_VALUE );
        const tsB = toTimestamp( dateB, Number.MIN_VALUE );

        return tsA - tsB;
    };

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

            return Object.freeze( date );
        }

        return pDate;
    };

    const sortDates = function( ...pDates )
    {
        let dates = [].concat( asArray( pDates || [] ) || [] );

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
        const state = _shortCircuit( pDateA, pDateB );

        if ( state.hasReturnValue )
        {
            return state.returnValue;
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
        const state = _shortCircuit( pDateA, pDateB );

        if ( state.hasReturnValue )
        {
            return state.returnValue;
        }

        const comp = _compare( pDateA, pDateB, pTransformerFunction );

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
        const state = _shortCircuit( pDateA, pDateB );

        if ( state.hasReturnValue )
        {
            return state.returnValue;
        }

        const comp = _compare( pDateA, pDateB, pTransformerFunction );

        return comp === 0;
    };

    const earliest = function( ...pDates )
    {
        const dates = sortDates( ...pDates );

        return (dates?.length || 0) > 0 ? Object.freeze( new Date( dates[0] ) ) : null;
    };

    const latest = function( ...pDates )
    {
        const dates = sortDates( ...pDates );

        return (dates?.length || 0) > 0 ? Object.freeze( new Date( dates[dates.length - 1] ) ) : null;
    };

    const numDaysInMonth = function( pMonth, pYear )
    {
        const year = isNumber( pYear ) ? asInt( pYear ) : new Date().getFullYear();

        let arr = months.map( ( entry ) => entry.value );

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

            return Object.freeze( date );
        }

        return pDate;
    };

    const toMidnight = function( pDate )
    {
        if ( isValidDateArgument( pDate ) )
        {
            let date = new Date( pDate );

            date = _setFields( date, date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0, 0 );

            return Object.freeze( date );
        }

        return pDate;
    };

    const lastInstant = function( pDate )
    {
        if ( isValidDateArgument( pDate ) )
        {
            let date = new Date( pDate );

            date = _setFields( date, date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999 );

            return Object.freeze( date );
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

        return Object.freeze( new Date( date ) );
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

        return Object.freeze( new Date( date ) );
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

                return funcUtils.op_true;
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

                return funcUtils.op_true;
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

                return funcUtils.op_false;
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

        return Object.freeze( occurrences.map( e => Object.freeze( e ) ) );
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

        calculateDate( pYear )
        {
            if ( this.#exactDate )
            {
                return Object.freeze( new Date( pYear, this.#month, this.#date ) );
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
    }

    class HolidayRelativeDefinition extends HolidayDefinition
    {
        constructor( pMonth, pOccurrence, pWeekday )
        {
            super( false, pMonth, 0, pOccurrence, pWeekday );
        }
    }


    class Holiday
    {
        #name;
        #definition;

        #mondayRule;

        constructor( pName, pDefinition, pMondayRule = function( pDate ) { return pDate; } )
        {
            this.#name = asString( pName );
            this.#definition = Object.freeze( pDefinition );
            this.#mondayRule = pMondayRule;
        }

        get name()
        {
            return asString( this.#name );
        }

        get definition()
        {
            return Object.freeze( this.#definition );
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

            return Object.freeze( date || pDate );
        }

        generate( pStartDate, pEndDate )
        {
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
                    let date = this.#definition.calculateDate( year );

                    date = this._applyMondayRule( date );

                    dates.push( date );
                }

                dates = dates.filter( date => isDate( date ) && (toTimestamp( date ) > toTimestamp( toMidnight( pStartDate ) )) && (toTimestamp( date ) <= toTimestamp( lastInstant( endDate ) )) );
            }

            return dates.map( e => Object.freeze( e ) );
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

    const HOLIDAYS = Object.freeze(
        {
            USA: Object.freeze(
                [
                    Object.freeze( new Holiday( "New Year's Day", new HolidayExactDateDefinition( DateConstants.Months.JANUARY, 1 ), Holiday.MondayRules.DEFAULT ) ),
                    Object.freeze( new Holiday( "Martin Luther King, Jr. Day", new HolidayRelativeDefinition( DateConstants.Months.JANUARY, DateConstants.Occurrence.THIRD, DateConstants.Days.MONDAY ), Holiday.MondayRules.DEFAULT ) ),
                    Object.freeze( new Holiday( "President’s Day", new HolidayRelativeDefinition( DateConstants.Months.FEBRUARY, DateConstants.Occurrence.THIRD, DateConstants.Days.MONDAY ), Holiday.MondayRules.DEFAULT ) ),
                    Object.freeze( new Holiday( "Memorial Day", new HolidayRelativeDefinition( DateConstants.Months.MAY, DateConstants.Occurrence.LAST, DateConstants.Days.MONDAY ), Holiday.MondayRules.DEFAULT ) ),
                    Object.freeze( new Holiday( "Independence Day", new HolidayExactDateDefinition( DateConstants.Months.JULY, 4 ), Holiday.MondayRules.INDEPENDENCE_DAY ) ),
                    Object.freeze( new Holiday( "Labor Day", new HolidayRelativeDefinition( DateConstants.Months.SEPTEMBER, DateConstants.Occurrence.FIRST, DateConstants.Days.MONDAY ), Holiday.MondayRules.DEFAULT ) ),
                    Object.freeze( new Holiday( "Columbus Day", new HolidayRelativeDefinition( DateConstants.Months.OCTOBER, DateConstants.Occurrence.SECOND, DateConstants.Days.MONDAY ), Holiday.MondayRules.DEFAULT ) ),
                    Object.freeze( new Holiday( "Veteran’s Day", new HolidayExactDateDefinition( DateConstants.Months.NOVEMBER, 11 ), Holiday.MondayRules.DEFAULT ) ),
                    Object.freeze( new Holiday( "Thanksgiving", new HolidayRelativeDefinition( DateConstants.Months.NOVEMBER, DateConstants.Occurrence.FOURTH, DateConstants.Days.THURSDAY ), Holiday.MondayRules.NULL_RULE ) ),
                    Object.freeze( new Holiday( "Christmas", new HolidayExactDateDefinition( DateConstants.Months.DECEMBER, 25 ), Holiday.MondayRules.NULL_RULE ) )
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
            newDate = new Date( toNoon( newDate ) );

            // add the days
            newDate.setDate( newDate.getDate() + numDays );

            // restore the hours, minutes, seconds, and milliseconds
            newDate = _setFields( newDate, newDate.getFullYear(), newDate.getMonth(), newDate.getDate(), hour, minute, second, millis );

            return Object.freeze( newDate );
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

            // const startDate = avoidWeekend( pDate, sign );
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

                const loopCap = new objectUtils.IterationCap( Math.max( numWeeks, 12 ) );

                while ( holidays?.length > 0 && !loopCap.reached )
                {
                    let tempDate = toMidnight( date );

                    date = avoidWeekend( addDays( date, (sign * holidays.length) ), sign );

                    holidays = _processHolidays( pHolidays, tempDate, lastInstant( date ) );
                }
            }

            date = _setFields( date, date.getFullYear(), date.getMonth(), date.getDate(), hour, minute, second, millis );

            return Object.freeze( date );
        }

        return pDate;
    };

    /**
     * Returns an array of dates representing holidays that fall on a weekday
     * given array of holidays and/or dates.
     *
     * @param pHolidays {Array<Holiday|Date>} an array of elements that are with Dates or Holidays
     * @param pStartDate the first potential date to return in the calculated holidays
     * @param pEndDate the last potential date to return in the calculated holidays
     * @returns {Array<Date>} an array of dates representing holidays that fall on a weekday
     * @private
     */
    function _processHolidays( pHolidays, pStartDate, pEndDate )
    {
        let holidays = asArray( pHolidays || [] ) || [];

        holidays = holidays.map( e => isDate( e ) ? e : e instanceof Holiday ? e.generate( pStartDate, pEndDate ) : null ).flat();

        holidays = arrayUtils.pruneArray( holidays );

        return holidays.filter( DateFilters.WEEKDAYS ).filter( DateFilters.between( toMidnight( pStartDate ), lastInstant( pEndDate ) ) );
    }

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

    const mod =
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
                    February
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
            isValidDateArgument,
            isLeapYear,
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
            workDaysBetween
        };

    if ( _ud !== typeof module )
    {
        module.exports = Object.freeze( mod );
    }

    if ( $scope() )
    {
        $scope()[INTERNAL_NAME] = Object.freeze( mod );
    }

    return Object.freeze( mod );

}());
