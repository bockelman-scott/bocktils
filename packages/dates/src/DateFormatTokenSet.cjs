/**
 * This module exposes the default formatting/parsing tokens to be used by DateFormatter or DateParser.
 * You can define your own token set to use in place of the default if desired.
 */

const core = require( "../../core/src/CoreUtils.cjs" );

/**
 * Establish separate constants for each of the common utilities imported
 * @see ../src/CoreUtils.cjs
 */
const { constants, typeUtils, stringUtils, arrayUtils, localeUtils } = core;

const dateUtils = require( "./DateUtils.cjs" );

const { _ud = "undefined" } = constants;

const $scope = core?.$scope || constants?.$scope || function()
{
    return (_ud === typeof self ? ((_ud === typeof global) ? ((_ud === typeof globalThis ? {} : globalThis)) : (global || {})) : (self || {}));
};

(function exposeModule()
{
    const INTERNAL_NAME = "__BOCK__DATE_FORMAT_TOKEN_SET__";

    if ( $scope() && (null != $scope()[INTERNAL_NAME]) )
    {
        return $scope()[INTERNAL_NAME];
    }

    const dependencies =
        {
            constants,
            typeUtils,
            stringUtils,
            arrayUtils,
            localeUtils,
            dateUtils
        };

    const { _mt_str, populateOptions, lock, classes } = constants;

    const { isNull, isDate, isNumber } = typeUtils;

    const { asString, asInt, lcase } = stringUtils;

    const asArray = arrayUtils.asArray;

    const {
        DEFAULTS: LOCALE_DEFAULTS,
        DEFAULT_LOCALE_STRING,
        resolveLocale,
        getMonthNames,
        getMonthAbbreviations,
        getDayNames,
        getDayAbbreviations,
        getDayLetters,
        getEras,
        getAmPmStrings,
        getFirstDayOfWeek,
        FORMATS,
    } = localeUtils;

    const { ModuleEvent, ModulePrototype } = classes;

    if ( _ud === typeof CustomEvent )
    {
        CustomEvent = ModuleEvent;
    }

    const modulePrototype = new ModulePrototype( "DateFormatTokenSet", INTERNAL_NAME );

    const
        {
            DateConstants,
            calculateOccurrencesOf,
            calculateNthOccurrenceOfDay,
            subtractDays,
            daysBetween,
            startOfMonth,
            toNoon
        } = dateUtils;

    const dateConstants = lock( DateConstants );

    const MONTHS = dateConstants.Months;
    const DAYS = dateConstants.Days;
    const OCCURRENCE = dateConstants.Occurrence;
    const UNITS = dateConstants.Units;

    const DEFAULT_LOCALE = new Intl.Locale( DEFAULT_LOCALE_STRING );

    const ERAS =
        [
            { start: new Date( 0, 0, 0, 0, 0, 0 ), end: null, name: "AD", longName: "Anno Domini" },
            {
                start: null,
                end: new Date( new Date( 0, 0, 0, 0, 0, 0 ).getTime() - 1 ),
                name: "BC",
                longName: "Before Common Era"
            },
        ];

    const MONTH_NAMES = lock( [].concat( LOCALE_DEFAULTS.MONTH_NAMES || getMonthNames( DEFAULT_LOCALE ) ) );

    const MONTH_NAMES_SHORT = lock( [].concat( LOCALE_DEFAULTS.MONTH_NAMES_SHORT || getMonthAbbreviations( DEFAULT_LOCALE ) ) );

    const DAY_NAMES = lock( [].concat( LOCALE_DEFAULTS.DAY_NAMES || getDayNames( DEFAULT_LOCALE ) ) );

    const DAY_NAMES_SHORT = lock( [].concat( LOCALE_DEFAULTS.DAY_NAMES_SHORT || getDayAbbreviations( DEFAULT_LOCALE ) ) );

    const DAY_LETTERS = lock( [].concat( LOCALE_DEFAULTS.DAY_LETTERS || getDayLetters( DEFAULT_LOCALE ) ) );

    const REPETITION_RULES = lock(
        {
            NONE: -32,
            PAD: 0,
            REPEAT: 2,
            VARY_FORMAT: 4
        } );

    const DEFINED_TOKENS = lock(
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
        ] );

    const DEFINED_INTL_OPTIONS = lock(
        {
            weekday: lock(
                {
                    character: "E",
                    [FORMATS.LONG]: 4,
                    [FORMATS.SHORT]: 3,
                    [FORMATS.NARROW]: 1
                } ),
            era: lock(
                {
                    character: "G",
                    [FORMATS.LONG]: 4,
                    [FORMATS.SHORT]: 3,
                    [FORMATS.NARROW]: 1
                } ),
            year: lock(
                {
                    character: "y",
                    [FORMATS.LONG]: 4,
                    [FORMATS.NUMERIC]: 3,
                    [FORMATS.TWO_DIGIT]: 2
                } ),
            month: lock(
                {
                    character: "M",
                    [FORMATS.NUMERIC]: 1,
                    [FORMATS.TWO_DIGIT]: 2,
                    [FORMATS.LONG]: 4,
                    [FORMATS.SHORT]: 3,
                    [FORMATS.NARROW]: 1
                } ),
            day: lock(
                {
                    character: "d",
                    [FORMATS.NUMERIC]: 1,
                    [FORMATS.TWO_DIGIT]: 2,
                    [FORMATS.LONG]: 4,
                    [FORMATS.SHORT]: 3,
                    [FORMATS.NARROW]: 1
                } ),
            hour: lock(
                {
                    character: "h",
                    getCharacter: function( pHourCycle )
                    {
                        const cycle = lcase( asString( pHourCycle, true ) || "h12" );

                        switch ( cycle )
                        {
                            case "h12":
                                return "h";

                            case "h11":
                                return "K";
                            case "h23":
                                return "H";
                            case "h24":
                                return "k";
                        }
                    },
                    [FORMATS.NUMERIC]: 1,
                    [FORMATS.TWO_DIGIT]: 2,
                    [FORMATS.LONG]: 4,
                    [FORMATS.SHORT]: 3,
                    [FORMATS.NARROW]: 1
                } ),
            minute: lock(
                {
                    character: "m",
                    [FORMATS.NUMERIC]: 1,
                    [FORMATS.TWO_DIGIT]: 2,
                    [FORMATS.LONG]: 4,
                    [FORMATS.SHORT]: 3,
                    [FORMATS.NARROW]: 1
                } ),
            second: lock(
                {
                    character: "s",
                    [FORMATS.NUMERIC]: 1,
                    [FORMATS.TWO_DIGIT]: 2,
                    [FORMATS.LONG]: 4,
                    [FORMATS.SHORT]: 3,
                    [FORMATS.NARROW]: 1
                } ),
            fractionalSecondDigits: lock(
                {
                    character: "S",
                    [FORMATS.NUMERIC]: 1,
                    [FORMATS.TWO_DIGIT]: 2,
                    [FORMATS.LONG]: 3,
                    [FORMATS.SHORT]: 3,
                    [FORMATS.NARROW]: 1
                } ),
            dayPeriod: lock(
                {
                    character: "a",
                    [FORMATS.NUMERIC]: 1,
                    [FORMATS.TWO_DIGIT]: 2,
                    [FORMATS.LONG]: 4,
                    [FORMATS.SHORT]: 2,
                    [FORMATS.NARROW]: 1
                } )
        } );

    const SUPPORTED_INTL_OPTIONS = lock( Object.keys( DEFINED_INTL_OPTIONS ) );

    const SUPPORTED_TOKENS = lock( [].concat( DEFINED_TOKENS ).map( e => Object.keys( e ).flat() ).flat() );

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

        static get [Symbol.species]()
        {
            return this;
        }

        calculateWeekInYear( pDate )
        {
            const date = resolveDate( pDate );

            // the first week of the year is the week that contains the first Thursday of the year
            const firstThursday = calculateNthOccurrenceOfDay( date.getFullYear(), MONTHS.JANUARY, OCCURRENCE.FIRST, DAYS.THURSDAY );

            const startOfWeek = subtractDays( firstThursday, ((6 - DAYS.THURSDAY) + this.firstDayOfWeek) );

            const days = daysBetween( startOfWeek, date ) + this.firstDayOfWeek;

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

            const monthStart = startOfMonth( date );

            const startOfWeek = subtractDays( monthStart, ((6 - monthStart.getDay()) + this.firstDayOfWeek) );

            const days = daysBetween( startOfWeek, date );

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

        static get [Symbol.species]()
        {
            return this;
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

        resolveLocale( pLocale )
        {
            return resolveLocale( pLocale );
        }

        /**
         * Returns the portion of the date relevant to this token
         * @param pDate {Date} a date from which to calculate the specified portion
         * @param pLocale {Intl.Locale|string} the locale to use, if relevant
         * @returns {number|string} the portion of the date relevant to this token
         */
        getValue( pDate, pLocale )
        {
            // subclasses must define
            throw new Error( "Not Implemented" );
        }

        /**
         * Returns a string representation of the portion of a date corresponding to this token
         * @param pDate {Date|number} a date to format as a string
         * @param pLocale {Intl.Locale|string} the Locale to use when formatting the string
         * @return {string} a string representation of the portion of a date corresponding to this token
         */
        format( pDate, pLocale )
        {
            // subclasses must define
            throw new Error( "Not Implemented" );
        }

        /**
         * Returns the string that produced this token
         * @returns {string} the string that produced this token
         */
        toPattern()
        {
            return this.characters;
        }

        /**
         * Returns an object compatible with Intl.DateFormat
         * @return {object} an object compatible with Intl.DateFormat
         */
        toOption()
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

        static get [Symbol.species]()
        {
            return this;
        }

        format( pDate, pLocale )
        {
            return asString( this.characters );
        }

        toOption()
        {
            return {};
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

        static get [Symbol.species]()
        {
            return this;
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
         * @param pLocale
         * @returns {number|string} the portion of the date relevant to this token
         */
        getValue( pDate, pLocale )
        {
            // subclasses must define
            throw new Error( "Not Implemented" );
        }

        format( pDate, pLocale )
        {
            const date = this.resolveDate( pDate );

            const locale = this.resolveLocale( pLocale );

            let value = this.getValue( date, locale );

            if ( this.minValue > value )
            {
                value = this.minValue;
            }

            if ( value > this.maxValue )
            {
                value = this.minValue + (value - this.maxValue);
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

        static get [Symbol.species]()
        {
            return this;
        }

        get eras()
        {
            return [].concat( this.#eras || ERAS );
        }

        toPattern()
        {
            return super.toPattern();
        }

        toOption()
        {
            let opt = { era: FORMATS.SHORT };

            if ( this.characters.length > 2 )
            {
                opt.era = FORMATS.LONG;
            }

            return lock( opt );
        }

        getValue( pDate, pLocale )
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

        format( pDate, pLocale )
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

        static get [Symbol.species]()
        {
            return this;
        }

        toPattern()
        {
            return super.toPattern();
        }

        toOption()
        {
            const opt =
                {
                    timeStyle: "short",
                    hourCycle: "h12"
                };

            return lock( opt );
        }

        getValue( pDate, pLocale )
        {
            const date = this.resolveDate( pDate );

            return date.getHours();
        }

        format( pDate, pLocale )
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

        static get [Symbol.species]()
        {
            return this;
        }

        toPattern()
        {
            return asString( super.toPattern() ).slice( 0, 4 );
        }

        toOption()
        {
            const opt = { year: FORMATS.NUMERIC };

            if ( 2 === this.characters.length )
            {
                opt.year = FORMATS.SHORT;
            }

            return lock( opt );
        }

        getValue( pDate, pLocale )
        {
            const date = this.resolveDate( pDate );

            return date.getFullYear();
        }

        format( pDate, pLocale )
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

        static get [Symbol.species]()
        {
            return this;
        }

        get names()
        {
            return this.#names;
        }

        get abbreviations()
        {
            return this.#abbreviations;
        }

        toPattern()
        {
            return asString( super.toPattern() ).slice( 0, 4 );
        }

        toOption()
        {
            const opt = { month: FORMATS.TWO_DIGIT };

            switch ( this.characters.length )
            {
                case 0:
                case 1:
                    opt.month = FORMATS.NUMERIC;
                    break;

                case 2:
                    break;

                case 3:
                    opt.month = FORMATS.SHORT;
                    break;

                default:
                    opt.month = FORMATS.LONG;
                    break;
            }

            return lock( opt );
        }

        getValue( pDate, pLocale )
        {
            const date = this.resolveDate( pDate );

            return date.getMonth();
        }

        format( pDate, pLocale )
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

        static get [Symbol.species]()
        {
            return this;
        }

        toPattern()
        {
            return asString( super.toPattern() ).slice( 0, 2 );
        }

        toOption()
        {
            return {};
        }

        getValue( pDate, pLocale )
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

        format( pDate, pLocale )
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

        static get [Symbol.species]()
        {
            return this;
        }

        toPattern()
        {
            return asString( super.toPattern() ).slice( 0, 2 );
        }

        toOption()
        {
            const opt = { day: FORMATS.TWO_DIGIT };

            if ( this.characters.length < 2 )
            {
                opt.day = FORMATS.NUMERIC;
            }

            return lock( opt );
        }

        getValue( pDate, pLocale )
        {
            const date = this.resolveDate( pDate );

            return date.getDate();
        }

        format( pDate, pLocale )
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

        static get [Symbol.species]()
        {
            return this;
        }

        toPattern()
        {
            return super.toPattern();
        }

        toOption()
        {
            return {};
        }

        getValue( pDate, pLocale )
        {
            const date = this.resolveDate( pDate );

            const year = date.getFullYear();

            const first = new Date( year, 0, 0 );

            return daysBetween( first, date );
        }

        format( pDate, pLocale )
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

        static get [Symbol.species]()
        {
            return this;
        }

        toPattern()
        {
            return super.toPattern();
        }

        toOption()
        {
            return {};
        }

        getValue( pDate, pLocale )
        {
            const date = toNoon( this.resolveDate( pDate ) );

            const dayNum = date.getDay();

            let occurrences = calculateOccurrencesOf( date.getFullYear(), date.getMonth(), dayNum );

            occurrences = occurrences.map( e => toNoon( e ).getTime() );

            const index = occurrences.indexOf( date.getTime() );

            return index + 1;
        }

        format( pDate, pLocale )
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

        static get [Symbol.species]()
        {
            return this;
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

        toPattern()
        {
            return asString( super.toPattern() ).slice( 0, 4 );
        }

        toOption()
        {
            const opt = { weekday: FORMATS.LONG };

            switch ( this.characters.length )
            {
                case 0:
                case 1:
                case 2:
                    opt.weekday = FORMATS.NARROW;
                    break;

                case 3:
                    opt.weekday = FORMATS.SHORT;
                    break;

                default:
                    break;
            }

            return lock( opt );
        }

        getValue( pDate, pLocale )
        {
            const date = this.resolveDate( pDate );

            return date.getDay();
        }

        format( pDate, pLocale )
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

        static get [Symbol.species]()
        {
            return this;
        }

        toPattern()
        {
            return super.toPattern();
        }

        toOption()
        {
            return {};
        }

        getValue( pDate, pLocale )
        {
            const date = this.resolveDate( pDate );

            return date.getDay();
        }

        format( pDate, pLocale )
        {
            const dayNum = this.getValue( pDate );

            let s = asString( dayNum );

            if ( DAYS.SUNDAY === dayNum )
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

        static get [Symbol.species]()
        {
            return this;
        }

        toPattern()
        {
            return asString( super.toPattern() ).slice( 0, 2 );
        }

        toOption()
        {
            const opt = { hour: FORMATS.TWO_DIGIT };

            if ( this.characters.length < 2 )
            {
                opt.hour = FORMATS.NUMERIC;
            }

            return lock( opt );
        }

        getValue( pDate, pLocale )
        {
            const date = this.resolveDate( pDate );

            return date.getHours(); // return a value between 0-23
        }

        format( pDate, pLocale )
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

        static get [Symbol.species]()
        {
            return this;
        }

        toPattern()
        {
            return asString( super.toPattern() ).slice( 0, 2 );
        }

        toOption()
        {
            const opt = { minute: FORMATS.TWO_DIGIT };

            if ( this.characters.length < 2 )
            {
                opt.minute = FORMATS.NUMERIC;
            }

            return lock( opt );
        }

        getValue( pDate, pLocale )
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

        static get [Symbol.species]()
        {
            return this;
        }

        toPattern()
        {
            return asString( super.toPattern() ).slice( 0, 2 );
        }

        toOption()
        {
            const opt = { second: FORMATS.TWO_DIGIT };

            if ( this.characters.length < 2 )
            {
                opt.second = FORMATS.NUMERIC;
            }

            return lock( opt );
        }

        getValue( pDate, pLocale )
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

        static get [Symbol.species]()
        {
            return this;
        }

        toPattern()
        {
            return asString( super.toPattern() ).slice( 0, 3 );
        }

        toOption()
        {
            const opt = { fractionalSecondDigits: this.characters.length };

            return lock( opt );
        }

        getValue( pDate, pLocale )
        {
            const date = this.resolveDate( pDate );

            return date.getMilliseconds(); // return a value between 0-59
        }
    }

    class TokenTimeZone extends Token
    {
        constructor( pCharacters, pRepetitionRule )
        {
            super( pCharacters, pRepetitionRule );
        }

        static get [Symbol.species]()
        {
            return this;
        }

        toPattern()
        {
            return asString( super.toPattern() ).slice( 0, 4 );
        }

        toOption()
        {
            const opt = { timeZoneName: "longOffset" };

            // TODO

            return lock( opt );
        }
    }

    class TokenGeneralTimeZone extends TokenTimeZone
    {
        constructor( pCharacters, pRepetitionRule )
        {
            super( pCharacters, pRepetitionRule );
        }

        static get [Symbol.species]()
        {
            return this;
        }
    }

    class TokenRfc822TimeZone extends TokenTimeZone
    {
        constructor( pCharacters, pRepetitionRule )
        {
            super( pCharacters, pRepetitionRule );
        }

        static get [Symbol.species]()
        {
            return this;
        }
    }

    class TokenIso8601TimeZone extends TokenTimeZone
    {
        constructor( pCharacters, pRepetitionRule )
        {
            super( pCharacters, pRepetitionRule );
        }

        static get [Symbol.species]()
        {
            return this;
        }
    }

    const DEFAULT_OPTIONS = lock(
        {
            monthNames: MONTH_NAMES,
            monthAbbreviations: MONTH_NAMES_SHORT,
            dayNames: DAY_NAMES,
            dayAbbreviations: DAY_NAMES_SHORT,
            dayLetters: DAY_LETTERS,
            eras: ERAS,
            amString: "AM",
            pmString: "PM",
            weekNumberingSystem: new ISO8601_WeekNumberingSystem(),
            firstDayOfWeek: DAYS.MONDAY
        } );

    class TokenSet
    {
        #locale = DEFAULT_LOCALE;
        #options = DEFAULT_OPTIONS;

        #monthNames = MONTH_NAMES;
        #monthAbbreviations = MONTH_NAMES_SHORT;

        #dayNames = DAY_NAMES;
        #dayAbbreviations = DAY_NAMES_SHORT;
        #dayLetters = DAY_LETTERS;

        #amString = "AM";
        #pmString = "PM";

        #eras = ERAS;

        #weekNumberingSystem = new ISO8601_WeekNumberingSystem();
        #firstDayOfWeek = DAYS.MONDAY;

        #hourCycle;

        constructor( pLocale = DEFAULT_LOCALE, pOptions = {} )
        {
            this.#locale = resolveLocale( pLocale );

            this.#options = Object.assign( {}, pOptions || {} );

            this.#monthNames = [].concat( this.#options?.monthNames || getMonthNames( this.#locale ) || MONTH_NAMES );
            this.#monthAbbreviations = [].concat( this.#options?.monthAbbreviations || getMonthAbbreviations( this.#locale ) || MONTH_NAMES_SHORT );

            this.#dayNames = [].concat( this.#options?.dayNames || getDayNames( this.#locale ) || DAY_NAMES );
            this.#dayAbbreviations = [].concat( this.#options?.dayAbbreviations || getDayAbbreviations( this.#locale ) || DAY_NAMES_SHORT );
            this.#dayLetters = [].concat( this.#options?.dayLetters || getDayLetters( this.#locale ) || DAY_LETTERS );

            this.#eras = [].concat( this.#options?.eras || getEras( this.#locale ) || ERAS );

            this.#amString = this.#options?.amString || ((getAmPmStrings( this.#locale ) || [_mt_str])[0]) || "AM";
            this.#pmString = this.#options?.pmString || ((getAmPmStrings( this.#locale ) || [_mt_str])[1]) || "PM";

            this.#weekNumberingSystem = this.#options?.weekNumberingSystem || new ISO8601_WeekNumberingSystem();

            this.#firstDayOfWeek = (DAYS.SUNDAY === this.#options.firstDayOfWeek || 7 === this.#options.firstDayOfWeek ? DAYS.SUNDAY : (this.#options.firstDayOfWeek || getFirstDayOfWeek( this.#locale ) || DAYS.MONDAY));

            this.#weekNumberingSystem.firstDayOfWeek = this.#firstDayOfWeek;

            this.#hourCycle = this.#locale?.hourCycle;
        }

        static get [Symbol.species]()
        {
            return this;
        }

        cloneForLocale( pLocale )
        {
            let locale = resolveLocale( pLocale || this.#locale ) || this.#locale;

            if ( locale?.baseName !== this.locale?.baseName )
            {
                return new TokenSet( locale, this.options );
            }

            return this;
        }

        get locale()
        {
            return lock( resolveLocale( this.#locale ) || DEFAULT_LOCALE );
        }

        get options()
        {
            return lock( this.#options || DEFAULT_OPTIONS );
        }

        get monthNames()
        {
            return [].concat( this.#monthNames || getMonthNames( this.locale ) || MONTH_NAMES );
        }

        get monthAbbreviations()
        {
            return [].concat( this.#monthAbbreviations || getMonthAbbreviations( this.locale ) || MONTH_NAMES_SHORT );
        }

        get dayNames()
        {
            return [].concat( this.#dayNames || getDayNames( this.locale ) || DAY_NAMES );
        }

        get dayAbbreviations()
        {
            return [].concat( this.#dayAbbreviations || getDayAbbreviations( this.locale ) || DAY_NAMES_SHORT );
        }

        get dayLetters()
        {
            return [].concat( this.#dayLetters || getDayLetters( this.locale ) || DAY_LETTERS );
        }

        get eras()
        {
            return [].concat( this.#eras || getEras( this.locale ) || ERAS );
        }

        get hourCycle()
        {
            return this.#hourCycle;
        }

        get amString()
        {
            return this.#amString || getAmPmStrings( this.locale )[0] || "AM";
        }

        get pmString()
        {
            return this.#pmString || getAmPmStrings( this.locale )[1] || "PM";
        }

        get weekNumberingSystem()
        {
            return lock( this.#weekNumberingSystem || new ISO8601_WeekNumberingSystem( this.firstDayOfWeek ) );
        }

        get firstDayOfWeek()
        {
            return this.#firstDayOfWeek;
        }

        get tokenDefinitions()
        {
            return lock( DEFINED_TOKENS );
        }

        get supportedTokens()
        {
            return lock( SUPPORTED_TOKENS );
        }

        getIndexOf( pUnit, pValue )
        {
            let index = -1;

            const value = asString( pValue );

            switch ( pUnit )
            {
                case UNITS.MONTH:
                    for( let i = 0; i < 4 && index < 0; i++ )
                    {
                        switch ( i )
                        {
                            case 0:
                                index = this.monthNames.indexOf( value );

                                if ( index < 0 )
                                {
                                    index = this.monthNames.map( e => lcase( e ) ).indexOf( lcase( value ) );
                                }

                                break;

                            case 1:
                                index = this.monthAbbreviations.indexOf( value );

                                if ( index < 0 )
                                {
                                    index = this.monthAbbreviations.map( e => lcase( e ) ).indexOf( lcase( value ) );
                                }
                                break;

                            case 2:
                                index = MONTH_NAMES.indexOf( value );

                                if ( index < 0 )
                                {
                                    index = MONTH_NAMES.map( e => lcase( e ) ).indexOf( lcase( value ) );
                                }
                                break;

                            case 3:
                                index = MONTH_NAMES_SHORT.indexOf( value );
                                if ( index < 0 )
                                {
                                    index = MONTH_NAMES_SHORT.map( e => lcase( e ) ).indexOf( lcase( value ) );
                                }
                                break;

                            default:
                                break;
                        }
                    }
                    break;

                case UNITS.DAY_OF_WEEK:
                    for( let i = 0; i < 6 && index < 0; i++ )
                    {
                        switch ( i )
                        {
                            case 0:
                                index = this.dayNames.indexOf( value );
                                if ( index < 0 )
                                {
                                    index = this.dayNames.map( e => lcase( e ) ).indexOf( lcase( value ) );
                                }
                                break;

                            case 1:
                                index = this.dayAbbreviations.indexOf( value );
                                if ( index < 0 )
                                {
                                    index = this.dayAbbreviations.map( e => lcase( e ) ).indexOf( lcase( value ) );
                                }
                                break;

                            case 2:
                                index = this.dayLetters.indexOf( value );
                                if ( index < 0 )
                                {
                                    index = this.dayLetters.map( e => lcase( e ) ).indexOf( lcase( value ) );
                                }
                                break;

                            case 3:
                                index = DAY_NAMES.indexOf( value );
                                if ( index < 0 )
                                {
                                    index = DAY_NAMES.map( e => lcase( e ) ).indexOf( lcase( value ) );
                                }
                                break;

                            case 4:
                                index = DAY_NAMES_SHORT.indexOf( value );
                                if ( index < 0 )
                                {
                                    index = DAY_NAMES_SHORT.map( e => lcase( e ) ).indexOf( lcase( value ) );
                                }
                                break;

                            case 5:
                                index = DAY_LETTERS.indexOf( value );
                                if ( index < 0 )
                                {
                                    index = DAY_LETTERS.map( e => lcase( e ) ).indexOf( lcase( value ) );
                                }
                                break;

                            default:
                                break;
                        }
                    }
                    break;
            }

            return index;
        }

        getMonthNumber( pString )
        {
            return this.getIndexOf( UNITS.MONTH, pString );
        }

        getDayNumber( pString )
        {
            return this.getIndexOf( UNITS.DAY_OF_WEEK, pString );
        }

        getToken( pCharacters )
        {
            let char = asString( pCharacters ).slice( 0, 1 );

            if ( !SUPPORTED_TOKENS.includes( char ) )
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
                    return new TokenDayName( pCharacters, this.dayNames, this.dayAbbreviations, this.dayLetters );

                case "u":
                    return new TokenDayNumber( pCharacters );

                case "a":
                    return new TokenAmPm( pCharacters, this.amString, this.pmString );

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

        fromPattern( pFormat )
        {
            const pattern = asString( pFormat );

            let arr = pattern.split( constants._mt_chr );

            let tokens = [];

            let elem = _mt_str;

            for( let i = 0, len = arr.length; i < len; i++ )
            {
                const char = arr[i];

                if ( _mt_str === elem || char === elem.slice( -1 ) )
                {
                    elem += char;
                }
                else
                {
                    tokens.push( elem );
                    elem = char;
                }
            }

            if ( _mt_str !== elem )
            {
                tokens.push( elem );
            }

            const me = this;

            const mapper = function( e )
            {
                return me.getToken( e );
            };

            tokens = tokens.map( mapper ).filter( e => e instanceof Token );

            return tokens;
        }

        /**
         * Returns an array of Tokens corresponding to the Intl.DateFormat option/value specified
         *
         * @param pOptions {object} an object defining one or more of
         * the Date-time component options compatible with Intl.DateFormat
         * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat#date-time_component_options
         *
         * @return {Array<Token>} an array of Tokens corresponding to the Intl.DateFormat option/value specified
         *
         * NOTE: style shortcuts are not supported
         */
        fromOptions( pOptions )
        {
            const options = populateOptions( pOptions );

            const tokens = [];

            const entries = Object.entries( options );

            for( let entry of entries )
            {
                const key = asString( entry.key || entry[0] );

                let value = entry.value || entry[1];
                value = isNumber( value ) ? asInt( value ) : asString( value, true );

                const option = DEFINED_INTL_OPTIONS[key];

                if ( option )
                {
                    let char = _mt_str;
                    let repetitions = isNumber( value ) ? value : asInt( option[value] );

                    switch ( key )
                    {
                        case "hour":
                            char = option.getCharacter( asString( options["hourCycle"] || this.hourCycle || "h12" ) );
                            break;

                        default:
                            char = option.character;
                            break;
                    }

                    tokens.push( this.getToken( asString( char ).repeat( repetitions ) ) );
                }
            }

            let results = [];

            for( let i = 0, n = tokens.length - 1; i < n; i++ )
            {
                const left = tokens[i];
                const right = tokens[i + 1];

                results.push( left );

                if ( left.characters.length > 2 || ["E"].includes( left.characters[0] ) || ["h", "H", "K", "k", "G", "a"].includes( right.characters[0] ) )
                {
                    results.push( new TokenLiteral( constants._spc ) );
                }
                else if ( ["L", "M", "D", "d", "y"].includes( left.characters[0] ) )
                {
                    if ( ["L", "M", "D", "d", "y"].includes( right.characters[0] ) )
                    {
                        results.push( new TokenLiteral( constants._slash ) );
                    }
                }
                else if ( ["h", "H", "K", "k", "m", "s", "S"].includes( left.characters[0] ) )
                {
                    if ( ["h", "H", "K", "k", "m", "s", "S"].includes( right.characters[0] ) )
                    {
                        results.push( new TokenLiteral( constants._colon ) );
                    }
                }
            }

            results.push( tokens[tokens.length - 1] );

            return lock( results );
        };
    }

    let mod =
        {
            dependencies,
            classes:
                {
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
            DEFAULT_LOCALE,
            DEFAULT_OPTIONS: lock( Object.assign( {}, DEFAULT_OPTIONS ) ),
            DEFINED_TOKENS,
            SUPPORTED_TOKENS,
            DEFINED_INTL_OPTIONS,
            SUPPORTED_INTL_OPTIONS,
            ERAS,
            MONTH_NAMES,
            MONTH_NAMES_SHORT,
            DAY_NAMES,
            DAY_NAMES_SHORT,
            DAY_LETTERS,
            FORMATS,
            REPETITION_RULES,
            getDefaultTokenSet: function( pLocale = DEFAULT_LOCALE )
            {
                const locale = resolveLocale( pLocale );

                const baseName = asString( locale.baseName, true ) || "en-US";

                if ( lcase( asString( baseName ) ).startsWith( "en-us" ) )
                {
                    return new TokenSet();
                }

            },
            buildTokenSet: function( pLocale, pOptions )
            {
                return new TokenSet( pLocale, pOptions );
            },
            DateConstants: dateConstants
        };

    mod = modulePrototype.extend( mod );

    return mod.expose( mod, INTERNAL_NAME, (_ud !== typeof module ? module : mod) ) || mod;

}());
