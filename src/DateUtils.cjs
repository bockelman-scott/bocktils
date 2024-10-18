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

    let asInt = stringUtils.asInt;

    let asArray = arrayUtils.asArray;

    let attempt = funcUtils.attempt;

    constants.importUtilities( this, constants, typeUtils, stringUtils, arrayUtils, objectUtils );

    const INTERNAL_NAME = "__BOCK__DATE_UTILS__";

    if ( $scope() && (null != $scope()[INTERNAL_NAME]) )
    {
        return $scope()[INTERNAL_NAME];
    }

    const MILLISECOND = 1;
    const MILLIS_PER_SECOND = (1_000 * MILLISECOND);
    const MILLIS_PER_MINUTE = (60 * MILLIS_PER_SECOND);
    const MILLIS_PER_HOUR = (60 * MILLIS_PER_MINUTE);
    const MILLIS_PER_DAY = (24 * MILLIS_PER_HOUR);
    const MILLIS_PER_WEEK = (7 * MILLIS_PER_DAY);
    const MILLIS_PER_YEAR = Math.floor( 365.25 * MILLIS_PER_DAY );

    const MILLIS_PER =
        {
            SECOND: MILLIS_PER_SECOND,
            MINUTE: MILLIS_PER_MINUTE,
            HOUR: MILLIS_PER_HOUR,
            DAY: MILLIS_PER_DAY,
            WEEK: MILLIS_PER_WEEK,
            YEAR: MILLIS_PER_YEAR
        };

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

    const UNIT =
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
            DECADE: 10
        };

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
                    return date;
                };

            case UNIT.HOUR:
                return function( pDate )
                {
                    let date = new Date( pDate );
                    date.setHours( date.getHours() + increment );
                    return date;
                };

            case UNIT.DAY:
                return function( pDate )
                {
                    let date = new Date( pDate );
                    date.setDate( date.getDate() + increment );
                    return date;
                };

            case UNIT.WEEK:
                return function( pDate )
                {
                    let date = new Date( pDate );
                    date.setDate( date.getDate() + (7 * increment) );
                    return date;
                };

            case UNIT.YEAR:
                return function( pDate )
                {
                    let date = new Date( pDate );
                    date.setFullYear( date.getFullYear() + increment );
                    return date;
                };

            case UNIT.MONTH:
                return function( pDate )
                {
                    let date = new Date( pDate );
                    date.setMonth( date.getMonth() + increment );
                    return date;
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
                    return date;
                };

        }

        return function( pDate )
        {
            return new Date( pDate.getTime() + millis );
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

    const _setFields = function( pDateA, pYear, pMonth, pDay, pHours, pMinutes, pSeconds )
    {
        if ( isValidDateArgument( pDateA ) )
        {
            const year = asInt( pYear, pDateA.getFullYear() );
            const month = asInt( pMonth );
            const day = asInt( pDay );

            const hour = asInt( pHours );
            const minutes = asInt( pMinutes );
            const seconds = asInt( pSeconds );

            const date = new Date( pDateA );

            date.setFullYear( year );
            date.setMonth( month );
            date.setDate( day );
            date.setHours( hour );
            date.setMinutes( minutes );
            date.setSeconds( seconds );

            return date;
        }

        return pDateA;
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

    /**
     * Returns a date representing the start of the period specified in which the date occurs.
     *
     * @param pUnit one of the UNIT constants or a string matches the key of one of the unit constants
     * @param pDate the date for which to return the start of the specified period (unit)
     */
    const getStartOf = function( pUnit, pDate )
    {
        const date = isDate( pDate ) ? new Date( pDate ) : new Date();

        const day = date.getDay();

        const unit = isNumber( pUnit ) ? pUnit : UNIT[stringUtils.asString( pUnit ).toUpperCase()];

        switch ( unit )
        {
            case UNIT.WEEK:
                date.setDate( date.getDate() - day );
                break;

            case UNIT.WORK_WEEK:
                date.setDate( (date.getDate() - day) + 1 );
                break;

            case UNIT.DECADE:
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

        return new Date( date );
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
                date = getStartOf( unit, date );
                date.setDate( date.getDate() + 6 );
                return date;

            case UNIT.WORK_WEEK:
                date = getStartOf( unit, date );
                date.setDate( date.getDate() + 4 );
                return date;

            default:
                const increment = incrementer( unit );
                const next = increment( date );
                date = getStartOf( unit, next );
                break;
        }

        date.setMilliseconds( date.getMilliseconds() - 1 );

        return new Date( date );
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

    const daysBetween = function( pStartDate, pEndDate )
    {
        const start = toTimestamp( toNoon( pStartDate ) );
        const end = toTimestamp( toNoon( pEndDate ) );

        return Math.floor( ((end - start) * 1000) / (MILLIS_PER_DAY * 1000) );
    };

    const addDays = function( pDate, pNumDays )
    {
        if ( isValidDateArgument( pDate ) )
        {
            const ts = toTimestamp( pDate );

            const newDate = new Date( ts );

            const numDays = isNumber( pNumDays ) ? asInt( pNumDays ) : 0;

            newDate.setDate( newDate.getDate() + numDays );

            return newDate;
        }
    };

    const subtractDays = function( pDate, pNumDays )
    {
        const numDays = isNumber( pNumDays ) ? asInt( pNumDays ) : 0;
        return addDays( pDate, -(numDays) );
    };

    const addWeeks = function( pDate, pNumWeeks )
    {
        if ( isValidDateArgument( pDate ) )
        {
            const numWeeks = isNumber( pNumWeeks ) ? asInt( pNumWeeks ) : 0;

            return addDays( pDate, (numWeeks * 7) );
        }
    };

    const subtractWeeks = function( pDate, pNumWeeks )
    {
        const numWeeks = isNumber( pNumWeeks ) ? asInt( pNumWeeks ) : 0;
        return addWeeks( pDate, -(numWeeks) );
    };

    const toNoon = function( pDateA )
    {
        if ( isValidDateArgument( pDateA ) )
        {
            let date = new Date( pDateA );

            date = _setFields( date, date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0, 0, 0 );

            return date;
        }

        return pDateA;
    };

    const toMidnight = function( pDateA )
    {
        if ( isValidDateArgument( pDateA ) )
        {
            let date = new Date( pDateA );

            date = _setFields( date, date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0, 0 );

            return date;
        }

        return pDateA;
    };

    const avoidWeekend = function( pDate )
    {
        if ( isValidDateArgument( pDate ) )
        {
            let date = new Date( pDate );

            const map = { 0: 1, 6: 2 };

            const weekday = date.getDay();

            return addDays( date, asInt( map[weekday] || 0, 0 ) );
        }

        return pDate;
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

    const sortDates = function( ...pDates )
    {
        let dates = [].concat( asArray( pDates || [] ) || [] );

        dates = dates.filter( isValidDateArgument ).map( ( date ) => toTimestamp( date, Number.MAX_VALUE ) );

        dates = dates.sort( ( a, b ) => a - b );

        return [].concat( dates.map( ( date ) => new Date( +date ) ) );
    };

    const earliest = function( ...pDates )
    {
        const dates = sortDates( ...pDates );

        return (dates?.length || 0) > 0 ? new Date( dates[0] ) : null;
    };

    const latest = function( ...pDates )
    {
        const dates = sortDates( ...pDates );

        return (dates?.length || 0) > 0 ? new Date( dates[dates.length - 1] ) : null;
    };

    const mod =
        {
            dependencies,
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
            isLeapYear,
            numDaysInMonth,
            numDaysInYear,
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
            addDays,
            addWeeks,
            subtractDays,
            subtractWeeks,
            toNoon,
            toMidnight,
            before,
            after,
            equal,
            earliest,
            latest,
            daysBetween
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
