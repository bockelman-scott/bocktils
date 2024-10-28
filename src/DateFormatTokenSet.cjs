/**
 * This module exposes the default formatting/parsing tokens to be used by DateFormatter or DateParser.
 * You can define your own token set to use in place of the default if desired.
 */

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

const dateUtils = require( "./DateUtils.cjs" );

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
            objectUtils,
            dateUtils
        };

    let isNull = typeUtils.isNull;
    let isDate = typeUtils.isDate;
    let isNumber = typeUtils.isNumber;

    let asString = stringUtils.asString;
    let asInt = stringUtils.asInt;

    let asArray = arrayUtils.asArray;

    constants.importUtilities( this, constants, typeUtils, stringUtils, arrayUtils, objectUtils );

    const INTERNAL_NAME = "__BOCK__DATE_FORMAT_TOKEN_SET__";

    if ( $scope() && (null != $scope()[INTERNAL_NAME]) )
    {
        return $scope()[INTERNAL_NAME];
    }

    const dateConstants = dateUtils.DateConstants;

    const MONTHS = dateConstants.Months;
    const DAYS = dateConstants.Days;
    const OCCURRENCE = dateConstants.Occurrence;

    class TimeZone
    {
        #standardOffset;
        #name;
        #abbreviation;

        #skipAheadDate;
        #fallbackDate;

        constructor( pStandardOffset, pName, pAbbreviation, pSkipAheadDate, pFallbackDate )
        {
            this.#standardOffset = pStandardOffset;
            this.#name = pName;
            this.#abbreviation = pAbbreviation;

            this.#skipAheadDate = isDate( pSkipAheadDate ) ? new Date( pSkipAheadDate ) : null;
            this.#fallbackDate = isDate( pFallbackDate ) ? new Date( pFallbackDate ) : null;
        }

        get standardOffset()
        {
            return this.#standardOffset;
        }

        get name()
        {
            return this.#name;
        }

        get abbreviation()
        {
            return this.#abbreviation;
        }

        get skipAheadDate()
        {
            return isDate( this.#skipAheadDate ) ? this.#skipAheadDate : null;
        }

        get fallbackDate()
        {
            return isDate( this.#fallbackDate ) ? new Date( this.#fallbackDate ) : null;
        }
    }

    const TIME_ZONES =
        [];

    const ERAS =
        [
            { start: new Date( 0, 0, 0, 0, 0, 0 ), end: null, name: "AD" },
            { start: null, end: new Date( new Date( 0, 0, 0, 0, 0, 0 ).getTime() - 1 ), name: "BC" },
        ];

    const MONTH_NAMES = Object.freeze( ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"] );

    const MONTH_NAMES_SHORT = Object.freeze( ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] );

    const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

    const DAY_NAMES_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    const DAY_LETTERS = ["S", "M", "T", "W", "R", "F", "Sa"];

    const REPETITION_RULES =
        {
            NONE: -32,
            PAD: 0,
            REPEAT: 2,
            VARY_FORMAT: 4
        };

    const DEFINED_TOKENS =
        [
            { "G": "Era designator" },
            { "y": "Year" },
            { "Y": "Week year" },
            { "M": "Month in year (context sensitive)" },
            { "L": "Month in year (standalone form)" },
            { "d": "Day in month" },
            { "E": "Day name in week" },
            { "u": "Day number of week (1 = Monday, ..., 7 = Sunday)" },
            { "a": "Am/pm marker" },
            { "H": "Hour in day (0-23)" },
            { "h": "Hour in am/pm (1-12)" },
            { "K": "Hour in am/pm (0-11)" },
            { "k": "Hour in day (1-24)" },
            { "m": "Minute in hour" },
            { "s": "Second in minute" },
            { "S": "Millisecond" }
        ];

    const SUPPORTED_TOKENS = ([].concat( DEFINED_TOKENS ).map( e => Object.keys( e ).flat() ).flat());

    const resolveDate = function( pDate )
    {
        return isDate( pDate ) ? pDate : isNumber( pDate ) ? new Date( pDate ) : new Date();
    };

    /**
     * Common Week Numbering Systems:
     *
     * ISO 8601:
     * This is the most widely used system.
     * It defines the first week of the year as the week that contains the first Thursday of the year.
     * This means that the first week of a year may start in the previous year.
     *
     * US Week Numbering:
     * This system defines the first week of the year as the first week that has at least 4 days in the new year.
     */

    class WeekNumberingSystem
    {
        #firstDayOfWeek;

        constructor( pFirstDayOfWeek )
        {
            this.#firstDayOfWeek = pFirstDayOfWeek || DAYS.MONDAY;
        }

        calculateWeekInYear( pDate )
        {
            const date = resolveDate( pDate );

            // the first week of the year is the week that contains the first Thursday of the year
            const firstThursday = dateUtils.calculateNthOccurrenceOfDay( date.getFullYear(), MONTHS.JANUARY, OCCURRENCE.FIRST, DAYS.THURSDAY );

            const startOfWeek = dateUtils.subtractDays( firstThursday, ((6 - DAYS.THURSDAY) + this.firstDayOfWeek) );

            const days = dateUtils.daysBetween( startOfWeek, date ) + this.firstDayOfWeek;

            return Math.floor( days / dateConstants.DAYS_PER_WEEK ) + 1;
        }

        calculateWeekInMonth( pDate )
        {
            /**
             * Determine the first day of the month: This is the first day of the specified month.
             *
             * Determine the first day of the week containing the first day of the month:
             * This is the first day of the week (usually Sunday or Monday, depending on the locale) that is on or before the first day of the month.
             *
             * Calculate the difference in days between the first day of the month and the given date:
             * This gives you the number of days that have passed in the month.
             *
             * Divide the number of days by 7 and round up: This gives you the week number within the month.
             */

            const date = new Date( resolveDate( pDate ) );

            const startOfMonth = dateUtils.startOfMonth( date );

            const startOfWeek = dateUtils.subtractDays( startOfMonth, ((6 - startOfMonth.getDay()) + this.firstDayOfWeek) );

            const days = dateUtils.daysBetween( startOfWeek, date );

            return Math.ceil( days / dateConstants.DAYS_PER_WEEK );
        }

        get firstDayOfWeek()
        {
            return this.#firstDayOfWeek;
        }

        set firstDayOfWeek( value )
        {
            this.#firstDayOfWeek = value;
        }
    }

    class ISO8601_WeekNumberingSystem extends WeekNumberingSystem
    {
        constructor( pFirstDayOfWeek )
        {
            super( pFirstDayOfWeek );
        }
    }

    class US_WeekNumberingSystem extends WeekNumberingSystem
    {
        constructor()
        {
            super( DAYS.MONDAY );
        }
    }

    class Token
    {
        #characters;

        #repetitionRule;

        constructor( pCharacters, pRepetitionRule = REPETITION_RULES.REPEAT )
        {
            this.#characters = asString( pCharacters );
            this.#repetitionRule = pRepetitionRule;
        }

        get characters()
        {
            return asString( this.#characters );
        }

        get repetitionRule()
        {
            return this.#repetitionRule;
        }

        resolveDate( pDate )
        {
            return isDate( pDate ) ? pDate : isNumber( pDate ) ? new Date( pDate ) : new Date();
        }

        /**
         * Returns the portion of the date relevant to this token
         * @param pDate
         * @returns {number|string} the portion of the date relevant to this token
         */
        getValue( pDate )
        {
            // subclasses must define
            throw new Error( "Not Implemented" );
        }

        /**
         * Returns a string representation of the portion of a date corresponding to this token
         * @param pDate
         * @return {string} a string representation of the portion of a date corresponding to this token
         */
        format( pDate )
        {
            // subclasses must define
            throw new Error( "Not Implemented" );
        }
    }

    class TokenLiteral extends Token
    {
        constructor( pCharacters, pRepetitionRule )
        {
            super( pCharacters, pRepetitionRule );
        }

        format( pDate )
        {
            return asString( this.characters );
        }
    }

    class TokenNumber extends Token
    {
        #minValue = 0;
        #maxValue = 0;

        constructor( pCharacters, pMinValue, pMaxValue, pRepetitionRule = REPETITION_RULES.PAD )
        {
            super( pCharacters, pRepetitionRule );

            this.#minValue = pMinValue;
            this.#maxValue = pMaxValue;
        }

        get minValue()
        {
            return this.#minValue;
        }

        get maxValue()
        {
            return this.#maxValue;
        }

        formatNumber( pNumber, pLength )
        {
            const s = asString( pNumber );

            if ( this.repetitionRule === REPETITION_RULES.PAD )
            {
                const len = Math.max( asInt( pLength, asString( this.characters ).length ), s.length );

                return s.padStart( len, "0" );
            }

            return s;
        }

        /**
         * Returns the portion of the date relevant to this token
         * @param pDate
         * @returns {number|string} the portion of the date relevant to this token
         */
        getValue( pDate )
        {
            // subclasses must define
            throw new Error( "Not Implemented" );
        }

        format( pDate )
        {
            const date = this.resolveDate( pDate );

            let value = this.getValue( date );

            if ( this.minValue > value )
            {
                value += this.minValue;
            }

            if ( value > this.maxValue )
            {
                value -= this.maxValue;
            }

            return this.formatNumber( value, asString( this.characters ).length );
        }
    }

    class TokenEra extends Token
    {
        #eras = [].concat( ERAS );

        constructor( pCharacters, pEras = ERAS )
        {
            super( pCharacters, REPETITION_RULES.NONE );

            this.#eras = [].concat( pEras || ERAS );
        }

        get eras()
        {
            return [].concat( this.#eras || ERAS );
        }

        getValue( pDate )
        {
            const date = this.resolveDate( pDate );

            let eras = [].concat( this.eras );

            eras = eras.sort( ( a, b ) =>
                              {
                                  let comp = 0;

                                  if ( isNull( a.start ) )
                                  {
                                      if ( isNull( b.start ) )
                                      {
                                          comp = 0;
                                      }
                                      else
                                      {
                                          comp = -1;
                                      }
                                  }
                                  else if ( isNull( b.start ) )
                                  {
                                      comp = 1;
                                  }
                                  else
                                  {
                                      comp = a.start < b.start ? -1 : a.start > b.start ? 1 : 0;
                                  }

                                  if ( 0 === comp )
                                  {
                                      if ( isNull( a.end ) )
                                      {
                                          if ( isNull( b.end ) )
                                          {
                                              comp = 0;
                                          }
                                          else
                                          {
                                              comp = -1;
                                          }
                                      }
                                      else if ( isNull( b.end ) )
                                      {
                                          comp = 1;
                                      }
                                      else
                                      {
                                          comp = a.end < b.end ? -1 : a.end > b.end ? 1 : 0;
                                      }
                                  }

                                  return comp;
                              } );

            let value = constants._mt_str;

            for( let era of eras )
            {
                if ( isNull( era.start ) )
                {
                    if ( isNull( era.end ) )
                    {
                        continue;
                    }

                    if ( date <= era.end )
                    {
                        value = asString( era.name );
                        break;
                    }
                }
                else
                {
                    if ( date >= era.start )
                    {
                        if ( isNull( era.end ) || date <= era.end )
                        {
                            value = asString( era.name );
                        }
                    }
                }
            }

            return value;
        }

        format( pDate )
        {
            return this.getValue( pDate );
        }
    }

    class TokenAmPm extends Token
    {
        #am;
        #pm;

        constructor( pCharacters, pAmString = "AM", pPmString = "PM" )
        {
            super( asString( pCharacters ) || "a", REPETITION_RULES.NONE );

            this.#am = (asString( pAmString ) || "AM");
            this.#pm = (asString( pPmString ) || "PM");
        }

        getValue( pDate )
        {
            const date = this.resolveDate( pDate );

            return date.getHours();
        }

        format( pDate )
        {
            const value = this.getValue( pDate );

            return (value >= 11 ? this.#pm : this.#am);
        }

    }

    class TokenYear extends Token
    {
        constructor( pCharacters, pRepetitionRule )
        {
            super( pCharacters, pRepetitionRule );
        }

        getValue( pDate )
        {
            const date = this.resolveDate( pDate );

            return date.getFullYear();
        }

        format( pDate )
        {
            const year = this.getValue( pDate );

            let s = asString( year );

            if ( this.characters.length === 2 )
            {
                return s.slice( -2 );
            }

            return s;
        }
    }

    class TokenMonth extends Token
    {
        #names;
        #abbreviations;

        constructor( pCharacters, pMonthNames, pMonthAbbreviations )
        {
            super( pCharacters, REPETITION_RULES.VARY_FORMAT );

            this.#names = [].concat( asArray( pMonthNames || MONTH_NAMES ) );
            this.#abbreviations = [].concat( asArray( pMonthAbbreviations || this.#names.map( e => e.slice( 0, 3 ) ) || MONTH_NAMES_SHORT ) );
        }

        get names()
        {
            return this.#names;
        }

        get abbreviations()
        {
            return this.#abbreviations;
        }

        getValue( pDate )
        {
            const date = this.resolveDate( pDate );

            return date.getMonth();
        }

        format( pDate )
        {
            const value = asInt( this.getValue( pDate ) );

            const len = this.characters.length;

            if ( len >= 4 )
            {
                return this.names[value];
            }

            if ( len >= 3 )
            {
                return this.abbreviations[value];
            }

            return asString( value + 1 ).padStart( len, "0" );
        }
    }

    class TokenWeek extends Token
    {
        #numberingScheme;

        constructor( pCharacters, pWeekNumberingSystem, pFirstDayOfWeek, pRepetitionRule = REPETITION_RULES.PAD )
        {
            super( pCharacters, pRepetitionRule );

            this.#numberingScheme = pWeekNumberingSystem || new ISO8601_WeekNumberingSystem( pFirstDayOfWeek );
        }

        getValue( pDate )
        {
            const date = this.resolveDate( pDate );

            const symbol = this.characters.slice( 0, 1 );

            if ( "w" === symbol )
            {
                return this.#numberingScheme.calculateWeekInYear( date );
            }
            else if ( "W" === symbol )
            {
                return this.#numberingScheme.calculateWeekInMonth( date );
            }

            return 0;
        }

        format( pDate )
        {
            let value = asString( this.getValue( pDate ) );

            if ( REPETITION_RULES.PAD === this.repetitionRule )
            {
                value = value.padStart( this.characters.length, "0" );
            }

            return value;
        }

    }

    class TokenMonthDay extends Token
    {
        constructor( pCharacters, pRepetitionRule = REPETITION_RULES.PAD )
        {
            super( pCharacters, pRepetitionRule );
        }

        getValue( pDate )
        {
            const date = this.resolveDate( pDate );

            return date.getDate();
        }

        format( pDate )
        {
            const value = this.getValue( pDate );

            let s = asString( value );

            if ( REPETITION_RULES.PAD === this.repetitionRule )
            {
                s = s.padStart( Math.min( this.characters.length, 2 ), "0" );
            }

            return s;
        }

    }

    class TokenDayInYear extends Token
    {
        constructor( pCharacters, pRepetitionRule = REPETITION_RULES.PAD )
        {
            super( pCharacters, pRepetitionRule );
        }

        getValue( pDate )
        {
            const date = this.resolveDate( pDate );

            const year = date.getFullYear();

            const first = new Date( year, 0, 0 );

            return dateUtils.daysBetween( first, date );
        }

        format( pDate )
        {
            let s = asString( this.getValue( pDate ) );

            if ( REPETITION_RULES.PAD === this.repetitionRule )
            {
                s = s.padStart( this.characters.length, "0" );
            }

            return s;
        }
    }

    class TokenOccurrenceOfDayInMonth extends Token
    {
        constructor( pCharacters, pRepetitionRule = REPETITION_RULES.PAD )
        {
            super( pCharacters, pRepetitionRule );
        }

        getValue( pDate )
        {
            const date = dateUtils.toNoon( this.resolveDate( pDate ) );

            const dayNum = date.getDay();

            let occurrences = dateUtils.calculateOccurrencesOf( date.getFullYear(), date.getMonth(), dayNum );

            occurrences = occurrences.map( e => dateUtils.toNoon( e ).getTime() );

            const index = occurrences.indexOf( date.getTime() );

            return index + 1;
        }

        format( pDate )
        {
            let s = asString( this.getValue( pDate ) );

            if ( REPETITION_RULES.PAD === this.repetitionRule )
            {
                s = s.padStart( this.characters.length, "0" );
            }

            return s;
        }
    }

    class TokenDayName extends Token
    {
        #dayNames = [].concat( DAY_NAMES );
        #dayAbbreviations = [].concat( DAY_NAMES_SHORT );
        #dayLetters = [].concat( DAY_LETTERS );

        constructor( pCharacters, pDayNames = DAY_NAMES, pNameAbbreviations = DAY_NAMES_SHORT, pDayLetters = DAY_LETTERS )
        {
            super( pCharacters );

            this.#dayNames = [].concat( pDayNames || DAY_NAMES );
            this.#dayAbbreviations = [].concat( pNameAbbreviations || DAY_NAMES_SHORT );
            this.#dayLetters = [].concat( pDayLetters || DAY_LETTERS );
        }

        get dayNames()
        {
            return [].concat( this.#dayNames || DAY_NAMES );
        }

        get dayAbbreviations()
        {
            return [].concat( this.#dayAbbreviations || DAY_NAMES_SHORT );
        }

        get dayLetters()
        {
            return [].concat( this.#dayLetters || DAY_LETTERS );
        }

        getValue( pDate )
        {
            const date = this.resolveDate( pDate );

            return date.getDay();
        }

        format( pDate )
        {
            let index = asInt( this.getValue( pDate ) );

            const len = this.characters.length;

            let names;

            if ( len >= 4 )
            {
                names = this.dayNames;
            }
            else if ( len >= 3 )
            {
                names = this.dayAbbreviations;
            }
            else
            {
                names = this.dayLetters;
            }

            return asString( names[index] );
        }
    }

    class TokenDayNumber extends TokenNumber
    {
        constructor( pCharacters, pRepetitionRule = REPETITION_RULES.PAD )
        {
            super( pCharacters, 1, 7, pRepetitionRule );
        }

        getValue( pDate )
        {
            const date = this.resolveDate( pDate );

            return date.getDay();
        }

        format( pDate )
        {
            const dayNum = this.getValue( pDate );

            let s = asString( dayNum );

            if ( 0 === dayNum )
            {
                s = "7";
            }

            if ( REPETITION_RULES.PAD === this.repetitionRule )
            {
                s = s.padStart( Math.min( this.characters.length, 2 ), "0" );
            }

            return s;
        }
    }

    class TokenHour extends TokenNumber
    {
        constructor( pCharacters, pMinValue, pMaxValue, pRepetitionRule = REPETITION_RULES.PAD )
        {
            super( pCharacters, pMinValue, pMaxValue, pRepetitionRule );
        }

        getValue( pDate )
        {
            const date = this.resolveDate( pDate );

            return date.getHours(); // return a value between 0-23
        }

        format( pDate )
        {
            let value = this.getValue( pDate );

            if ( value < this.minValue )
            {
                value = this.maxValue;
            }

            if ( value > this.maxValue )
            {
                value = this.minValue + (value - this.maxValue - 1);
            }

            return asString( super.formatNumber( value, this.characters.length ) );
        }
    }

    class TokenMinute extends TokenNumber
    {
        constructor( pCharacter )
        {
            super( pCharacter, 0, 59 );
        }

        getValue( pDate )
        {
            const date = this.resolveDate( pDate );

            return date.getMinutes(); // return a value between 0-59
        }
    }

    class TokenSecond extends TokenMinute
    {
        constructor( pCharacter )
        {
            super( pCharacter );
        }

        getValue( pDate )
        {
            const date = this.resolveDate( pDate );

            return date.getSeconds(); // return a value between 0-59
        }
    }

    class TokenMillisecond extends TokenNumber
    {
        constructor( pCharacter )
        {
            super( pCharacter, 0, 999 );
        }

        getValue( pDate )
        {
            const date = this.resolveDate( pDate );

            return date.getMilliseconds(); // return a value between 0-59
        }
    }

    class TokenTimeZone extends Token
    {

    }

    class TokenGeneralTimeZone extends TokenTimeZone
    {

    }

    class TokenRfc822TimeZone extends TokenTimeZone
    {

    }

    class TokenIso8601TimeZone extends TokenTimeZone
    {

    }


    class TokenSet
    {
        #monthNames;
        #monthAbbreviations;

        #dayNames;
        #dayAbbreviations;
        #dayLetters;

        #amString;
        #pmString;

        #eras;

        #weekNumberingSystem;
        #firstDayOfWeek = DAYS.MONDAY;

        constructor( pMonthNames = MONTH_NAMES,
                     pMonthAbbreviations = MONTH_NAMES_SHORT,
                     pDayNames = DAY_NAMES,
                     pDayAbbreviations = DAY_NAMES_SHORT,
                     pDayLetters = DAY_LETTERS,
                     pEras = ERAS,
                     pAmString = "AM",
                     pPmString = "PM",
                     pWeekNumberingSystem = new ISO8601_WeekNumberingSystem(),
                     pFirstDayOfWeek = DAYS.MONDAY )
        {
            this.#monthNames = [].concat( pMonthNames || MONTH_NAMES );
            this.#monthAbbreviations = [].concat( pMonthAbbreviations || MONTH_NAMES_SHORT );

            this.#dayNames = [].concat( pDayNames || DAY_NAMES );
            this.#dayAbbreviations = [].concat( pDayAbbreviations || DAY_NAMES_SHORT );
            this.#dayLetters = [].concat( pDayLetters || DAY_LETTERS );

            this.#eras = [].concat( pEras || ERAS );

            this.#amString = pAmString;
            this.#pmString = pPmString;

            this.#weekNumberingSystem = pWeekNumberingSystem || new ISO8601_WeekNumberingSystem();

            this.#firstDayOfWeek = Math.min( 6, 0 === pFirstDayOfWeek ? 0 : pFirstDayOfWeek || DAYS.MONDAY );

            this.#weekNumberingSystem.firstDayOfWeek = this.#firstDayOfWeek;
        }

        get monthNames()
        {
            return [].concat( this.#monthNames || MONTH_NAMES );
        }

        get monthAbbreviations()
        {
            return [].concat( this.#monthAbbreviations || MONTH_NAMES_SHORT );
        }

        get dayNames()
        {
            return [].concat( this.#dayNames || DAY_NAMES );
        }

        get dayAbbreviations()
        {
            return [].concat( this.#dayAbbreviations || DAY_NAMES_SHORT );
        }

        get dayLetters()
        {
            return [].concat( this.#dayLetters || DAY_LETTERS );
        }

        get eras()
        {
            return [].concat( this.#eras || ERAS );
        }

        get amString()
        {
            return this.#amString;
        }

        get pmString()
        {
            return this.#pmString;
        }

        get weekNumberingSystem()
        {
            return Object.freeze( this.#weekNumberingSystem || new ISO8601_WeekNumberingSystem( this.firstDayOfWeek ) );
        }

        get firstDayOfWeek()
        {
            return this.#firstDayOfWeek;
        }

        getToken( pCharacters )
        {
            let char = asString( pCharacters ).slice( 0, 1 );

            if( !SUPPORTED_TOKENS.includes(char) )
            {
                return new TokenLiteral( pCharacters );
            }

            switch ( char )
            {
                case "G":
                    return new TokenEra( pCharacters, this.eras );

                case "y":
                case "Y":
                    return new TokenYear( pCharacters );

                case "M":
                case "L":
                    return new TokenMonth( pCharacters, this.monthNames, this.monthAbbreviations );

                case "w":
                case "W":
                    return new TokenWeek( pCharacters, this.weekNumberingSystem, this.firstDayOfWeek );

                case "D":
                    return new TokenDayInYear( pCharacters );

                case "d":
                    return new TokenMonthDay( pCharacters );

                case "F":
                    return new TokenOccurrenceOfDayInMonth( pCharacters );

                case "E":
                    return new TokenDayName( pCharacters );

                case "u":
                    return new TokenDayNumber( pCharacters );

                case "a":
                    return new TokenAmPm( pCharacters );

                case "H":
                    return new TokenHour( pCharacters, 0, 23 );

                case "h":
                    return new TokenHour( pCharacters, 1, 12 );

                case "K":
                    return new TokenHour( pCharacters, 0, 11 );

                case "k":
                    return new TokenHour( pCharacters, 1, 24 );

                case "m":
                    return new TokenMinute( pCharacters );

                case "s":
                    return new TokenSecond( pCharacters );

                case "S":
                    return new TokenMillisecond( pCharacters );

                case "z":
                    break;

                case "Z":
                    break;

                case "X":
                    break;

                default:
                    return new TokenLiteral( pCharacters );
            }
        }
    }

    const mod =
        {
            dependencies,
            classes:
                {
                    TimeZone,
                    WeekNumberingSystem,
                    ISO8601_WeekNumberingSystem,
                    US_WeekNumberingSystem,
                    Token,
                    TokenLiteral,
                    TokenNumber,
                    TokenEra,
                    TokenAmPm,
                    TokenYear,
                    TokenMonth,
                    TokenWeek,
                    TokenMonthDay,
                    TokenDayInYear,
                    TokenDayName,
                    TokenDayNumber,
                    TokenOccurrenceOfDayInMonth,
                    TokenHour,
                    TokenMinute,
                    TokenSecond,
                    TokenMillisecond,
                    TokenTimeZone,
                    TokenGeneralTimeZone,
                    TokenRfc822TimeZone,
                    TokenIso8601TimeZone,
                    TokenSet
                },
            DEFINED_TOKENS,
            SUPPORTED_TOKENS,
            TIME_ZONES,
            ERAS,
            MONTH_NAMES,
            MONTH_NAMES_SHORT,
            DAY_NAMES,
            DAY_NAMES_SHORT,
            DAY_LETTERS,
            REPETITION_RULES,
            getDefaultTokenSet: function()
            {
                return new TokenSet();
            },
            buildTokenSet: function( pMonthNames = MONTH_NAMES,
                                     pMonthAbbreviations = MONTH_NAMES_SHORT,
                                     pDayNames = DAY_NAMES,
                                     pDayAbbreviations = DAY_NAMES_SHORT,
                                     pDayLetters = DAY_LETTERS,
                                     pEras = ERAS,
                                     pAmString = "AM",
                                     pPmString = "PM",
                                     pWeekNumberingSystem = new ISO8601_WeekNumberingSystem(),
                                     pFirstDayOfWeek = DAYS.MONDAY )
            {
                return new TokenSet( pMonthNames,
                                     pMonthAbbreviations,
                                     pDayNames,
                                     pDayAbbreviations,
                                     pDayLetters,
                                     pEras,
                                     pAmString,
                                     pPmString,
                                     pWeekNumberingSystem,
                                     pFirstDayOfWeek );
            }
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

