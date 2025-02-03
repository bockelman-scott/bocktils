/**
 * This module exposes the default formatting/parsing tokens to be used by DateFormatter or DateParser.
 * You can define your own token set to use in place of the default if desired.
 */

const core = require( "@toolbocks/core" );

/**
 * Establish separate constants for each of the common utilities imported
 * @see ../src/CoreUtils.cjs
 */
const { constants, typeUtils, stringUtils, arrayUtils, localeUtils } = core;

const dateUtils = require( "./DateUtils.cjs" );

const {
    _ud = "undefined",
    $scope = core?.$scope || constants?.$scope || function()
    {
        return (_ud === typeof self ? ((_ud === typeof global) ? ((_ud === typeof globalThis ? {} : globalThis)) : (global || {})) : (self || {}));
    }
} = constants;

// noinspection FunctionTooLongJS
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

    const {
        classes,
        _mt_str,
        _spc,
        _colon,
        _slash,
        _hyphen,
        populateOptions,
        mergeOptions,
        merge,
        lock,
        COMPARE_EQUAL,
        compareNullable
    } = constants;

    const { isNull, isString, isNumber, clamp } = typeUtils;

    const { asString, isBlank, asInt, asFloat, lcase, ucase, leftOf, rightOf, rightOfLast, leftOfLast } = stringUtils;

    const { asArray } = arrayUtils;

    const {
        DEFAULTS: LOCALE_DEFAULTS,
        DEFAULT_LOCALE_STRING,
        isSameLocale,
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

    const { ModulePrototype } = classes;

    const modName = "DateFormatTokenSet";

    const modulePrototype = new ModulePrototype( modName, INTERNAL_NAME );

    const
        {
            resolveDate,
            DateConstants,
            DatePart,
            calculateOccurrencesOf,
            calculateNthOccurrenceOfDay,
            subtractDays,
            daysBetween,
            startOfMonth,
            toNoon,
            DateBuffer,
            addDays
        } = dateUtils;

    const dateConstants = lock( DateConstants );

    const { DATE_PARTS, Months, Days, Occurrence } = dateConstants;

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
            this.#firstDayOfWeek = pFirstDayOfWeek || Days.MONDAY;
        }

        static get [Symbol.species]()
        {
            return this;
        }

        calculateWeekInYear( pDate )
        {
            const date = resolveDate( pDate );

            // the first week of the year is the week that contains the first Thursday of the year
            const firstThursday = calculateNthOccurrenceOfDay( date.getFullYear(), Months.JANUARY, Occurrence.FIRST, Days.THURSDAY );

            const startOfWeek = subtractDays( firstThursday, ((6 - Days.THURSDAY) + this.firstDayOfWeek) );

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

        set firstDayOfWeek( pValue )
        {
            this.#firstDayOfWeek = pValue;
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
            super( Days.MONDAY );
        }
    }

    class Token
    {
        #characters;

        #repetitionRule;

        #parentSet;

        constructor( pCharacters, pRepetitionRule = REPETITION_RULES.REPEAT, pParentSet = null )
        {
            this.#characters = asString( pCharacters );
            this.#repetitionRule = pRepetitionRule;
            this.#parentSet = pParentSet;
        }

        get parentSet()
        {
            return this.#parentSet;
        }

        set parentSet( pTokenSet )
        {
            this.#parentSet = pTokenSet instanceof TokenSet ? pTokenSet : this.#parentSet;
        }

        static get [Symbol.species]()
        {
            return this;
        }

        get characters()
        {
            return asString( this.#characters );
        }

        get firstCharacter()
        {
            return this.characters.charAt( 0 );
        }

        get repetitionRule()
        {
            return this.#repetitionRule;
        }

        resolveDate( pDate )
        {
            return resolveDate( pDate );
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

        parse( pSegment, pBuffer )
        {
            return pBuffer;
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
         * @return {object|null} an object compatible with Intl.DateFormat
         */
        toOption()
        {
            // subclasses must define
            throw new Error( "Not Implemented" );
        }

        get comparator()
        {
            return ( a, b ) => 0;
        }

        getMonthNumber( pString )
        {
            if ( this.parentSet )
            {
                return this.parentSet.getMonthNumber( pString );
            }
        }

        getDayNumber( pString )
        {
            if ( this.parentSet )
            {
                return this.parentSet.getDayNumber( pString );
            }
        }
    }

    class TokenLiteral extends Token
    {
        constructor( pCharacters, pRepetitionRule, pParentSet = null )
        {
            super( pCharacters, pRepetitionRule, pParentSet );
        }

        static get [Symbol.species]()
        {
            return this;
        }

        format( pDate, pLocale )
        {
            return asString( this.characters );
        }

        parse( pSegment, pBuffer )
        {
            return pBuffer;
        }

        toOption()
        {
            return {};
        }

        get comparator()
        {
            return ( a, b ) =>
            {
                if ( a instanceof this.constructor )
                {
                    if ( b instanceof this.constructor )
                    {
                        return compareNullable( a.characters, b.characters );
                    }
                    if ( isString( b ) || isNumber( b ) )
                    {
                        return compareNullable( a.characters, asString( b ) );
                    }
                    return 0;
                }
                else if ( isString( a ) || isNumber( a ) )
                {
                    if ( b instanceof this.constructor )
                    {
                        return compareNullable( asString( a ), b.characters );
                    }
                    return compareNullable( asString( a ), asString( b ) );
                }
            };
        }
    }

    class TokenNumber extends Token
    {
        #minValue = 0;
        #maxValue = 0;

        constructor( pCharacters, pMinValue, pMaxValue, pRepetitionRule = REPETITION_RULES.PAD, pParentSet = null )
        {
            super( pCharacters, pRepetitionRule, pParentSet );

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

        parse( pSegment, pBuffer )
        {
            return pBuffer;
        }

        get comparator()
        {
            return ( a, b ) =>
            {
                const aa = asFloat( a );
                const bb = asFloat( b );

                return aa < bb ? -1 : aa > bb ? 1 : 0;
            };
        }
    }

    class TokenEra extends Token
    {
        #eras = [].concat( ERAS );

        constructor( pCharacters, pEras = ERAS, pParentSet = null )
        {
            super( pCharacters, REPETITION_RULES.NONE, pParentSet );

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

        get comparator()
        {
            return ( a, b ) =>
            {
                let comp = compareNullable( a?.start, b?.start );

                if ( comp === COMPARE_EQUAL )
                {
                    comp = compareNullable( a?.end, b?.end );
                }

                return COMPARE_EQUAL === comp ? a < b ? -1 : a > b ? 1 : 0 : comp;
            };
        }

        getValue( pDate, pLocale )
        {
            const date = this.resolveDate( pDate );

            let eras = [].concat( this.eras );

            eras = eras.sort( this.comparator );

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

            return value || DatePart.ERA.calculate( date );
        }

        format( pDate, pLocale )
        {
            return this.getValue( pDate );
        }

        parse( pSegment, pBuffer )
        {
            const segment = asString( pSegment, true );
            const buffer = pBuffer || { [DATE_PARTS.ERA]: segment };
            buffer[DATE_PARTS.ERA] = segment;
        }
    }

    class TokenAmPm extends Token
    {
        #am;
        #pm;

        constructor( pCharacters, pAmString = "AM", pPmString = "PM", pParentSet = null )
        {
            super( asString( pCharacters ) || "a", REPETITION_RULES.NONE, pParentSet );

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

        parse( pSegment, pBuffer )
        {
            let buffer = pBuffer ||
                {
                    [DATE_PARTS.HOUR]: -1,
                    adjustHoursForPm: false,
                    adjustHoursForCycle: false,
                    adjustedForPm: false,
                    adjustedForCycle: false
                };

            const segment = asString( pSegment, true );

            if ( !isBlank( segment ) && (this.#pm === segment || ucase( this.#pm ) === ucase( segment )) )
            {
                const hours = buffer[DATE_PARTS.HOUR];

                if ( hours < buffer.maxHour )
                {
                    buffer.adjustHoursForPm = true;
                }
            }

            return buffer;
        }

        get comparator()
        {
            return ( a, b ) =>
            {
                return compareNullable( a, b );
            };
        }
    }

    class TokenYear extends Token
    {
        #pivotYear;

        constructor( pCharacters, pRepetitionRule, pPivotYear = 75, pParentSet = null )
        {
            super( pCharacters, pRepetitionRule, pParentSet );

            this.#pivotYear = clamp( asInt( pPivotYear ), 0, 99 );
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

        parse( pSegment, pBuffer )
        {
            let buffer = pBuffer ||
                {
                    [DATE_PARTS.YEAR]: -1
                };

            let segment = asString( pSegment ).replace( /^0+/, _mt_str );

            let num = asInt( segment );

            buffer[DATE_PARTS.YEAR] = ((num > 0 && num < 100) ? num + (num > this.pivotYear ? 1900 : 2000) : num);

            return buffer;
        }

        get comparator()
        {
            return ( a, b ) =>
            {
                let comp = compareNullable( a, b );

                if ( COMPARE_EQUAL === comp )
                {
                    const aa = asInt( a );
                    const bb = asInt( b );
                    return aa < bb ? -1 : aa > bb ? 1 : 0;
                }

                return comp;
            };
        }
    }

    class TokenMonth extends TokenNumber
    {
        #names;
        #abbreviations;

        constructor( pCharacters, pMonthNames, pMonthAbbreviations, pParentSet = null )
        {
            super( pCharacters, 0, 11, REPETITION_RULES.VARY_FORMAT, pParentSet );

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

        parse( pSegment, pBuffer )
        {
            let buffer = pBuffer ||
                {
                    [DATE_PARTS.MONTH]: -1
                };

            const segment = asString( pSegment ).replace( /^0+/, _mt_str );

            buffer[DATE_PARTS.MONTH] = (this.characters.length > 2) ? this.getMonthNumber( segment ) : (asInt( segment ) - 1);

            return buffer;
        }
    }

    class TokenWeek extends TokenNumber
    {
        #numberingScheme;

        constructor( pCharacters, pWeekNumberingSystem, pFirstDayOfWeek, pRepetitionRule = REPETITION_RULES.PAD, pParentSet = null )
        {
            super( pCharacters, 1, 52, pRepetitionRule, pParentSet );

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

        parse( pSegment, pBuffer )
        {
            return pBuffer || { [DATE_PARTS.WEEK]: -1 };
        }
    }

    class TokenMonthDay extends TokenNumber
    {
        constructor( pCharacters, pRepetitionRule = REPETITION_RULES.PAD, pParentSet = null )
        {
            super( pCharacters, 1, 31, pRepetitionRule, pParentSet );
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

        parse( pSegment, pBuffer )
        {
            let buffer = pBuffer ||
                {
                    [DATE_PARTS.DAY]: -1,
                    [DATE_PARTS.DAY_OF_MONTH]: -1
                };

            let dayOfMonth = asInt( pSegment.replace( /^0+/, _mt_str ) );

            buffer[DATE_PARTS.DAY] = Math.max( dayOfMonth, 1 );
            buffer[DATE_PARTS.DAY_OF_MONTH] = Math.max( dayOfMonth, 1 );

            return buffer;
        }
    }

    class TokenDayInYear extends TokenNumber
    {
        constructor( pCharacters, pRepetitionRule = REPETITION_RULES.PAD, pParentSet = null )
        {
            super( pCharacters, 1, 366, pRepetitionRule, pParentSet );
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

        parse( pSegment, pBuffer )
        {
            const buffer = pBuffer ||
                {
                    [DATE_PARTS.DAY]: -1,
                    [DATE_PARTS.DAY_OF_YEAR]: -1
                };

            const dayOfYear = asInt( pSegment.replace( /^0+/, _mt_str ) );

            let date = DateBuffer.isBuffer( buffer ) ? buffer.toDate() : new Date();

            date = new Date( date.getFullYear(), 0, 0 );

            date = addDays( date, dayOfYear );

            const fromDate = DateBuffer.fromDate( date, this.parentSet?.locale );

            return DateBuffer.isBuffer( buffer ) ? buffer.merge( fromDate ) : fromDate;
        }
    }

    class TokenOccurrenceOfDayInMonth extends TokenNumber
    {
        constructor( pCharacters, pRepetitionRule = REPETITION_RULES.PAD, pParentSet = null )
        {
            super( pCharacters, 1, 5, pRepetitionRule, pParentSet );
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

        parse( pSegment, pBuffer )
        {
            return pBuffer || { [DATE_PARTS.DAY]: -1, [DATE_PARTS.DAY_OF_MONTH]: -1 };
        }
    }

    class TokenDayName extends Token
    {
        #dayNames = [].concat( DAY_NAMES );
        #dayAbbreviations = [].concat( DAY_NAMES_SHORT );
        #dayLetters = [].concat( DAY_LETTERS );

        constructor( pCharacters, pDayNames = DAY_NAMES, pNameAbbreviations = DAY_NAMES_SHORT, pDayLetters = DAY_LETTERS, pParentSet = null )
        {
            super( pCharacters, REPETITION_RULES.REPEAT, pParentSet );

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

        parse( pSegment, pBuffer )
        {
            const buffer = pBuffer ||
                {
                    [DATE_PARTS.DAY_OF_WEEK]: -1
                };

            const segment = asString( pSegment, true ).replace( /^0+/, _mt_str );

            let day = clamp( this.getDayNumber( segment ), 0, 6 );

            buffer[DATE_PARTS.DAY_OF_WEEK] = clamp( day, 0, 6 );

            return buffer;
        }
    }

    class TokenDayNumber extends TokenNumber
    {
        constructor( pCharacters, pRepetitionRule = REPETITION_RULES.PAD, pParentSet = null )
        {
            super( pCharacters, 1, 7, pRepetitionRule, pParentSet );
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

            if ( Days.SUNDAY === dayNum )
            {
                s = "7";
            }

            if ( REPETITION_RULES.PAD === this.repetitionRule )
            {
                s = s.padStart( Math.min( this.characters.length, 2 ), "0" );
            }

            return s;
        }

        parse( pSegment, pBuffer )
        {
            const buffer = pBuffer ||
                {
                    [DATE_PARTS.DAY_OF_WEEK]: -1
                };

            const segment = pSegment.replace( /^0+/, _mt_str );

            let day = (this.characters.length > 2) ? clamp( this.getDayNumber( pSegment ), 0, 6 ) : asInt( segment ) - 1;

            buffer[DATE_PARTS.DAY_OF_WEEK] = clamp( day, 0, 6 );

            return buffer;
        }
    }

    class TokenHour extends TokenNumber
    {
        #minHour;
        #maxHour;

        #adjustHoursForPm;

        #hourCycle;

        constructor( pCharacters, pMinValue, pMaxValue, pRepetitionRule = REPETITION_RULES.PAD, pParentSet = null )
        {
            super( pCharacters, pMinValue, pMaxValue, pRepetitionRule, pParentSet );

            this.#minHour = pMinValue;
            this.#maxHour = pMaxValue;

            /*
             H	Hour in day (0-23)	Number	0
             k	Hour in day (1-24)	Number	24
             K	Hour in am/pm (0-11)	Number	0
             h	Hour in am/pm (1-12)	Number	12
             */

            switch ( this.firstCharacter )
            {
                case "h":
                    this.#hourCycle = "h12";
                    this.#minHour = 1;
                    this.#maxHour = 12;
                    this.#adjustHoursForPm = true;
                    break;

                case "K":
                    this.#hourCycle = "h11";
                    this.#minHour = 0;
                    this.#maxHour = 11;
                    this.#adjustHoursForPm = true;
                    break;

                case "k":
                    this.#hourCycle = "h24";
                    this.#minHour = 1;
                    this.#maxHour = 24;
                    this.#adjustHoursForPm = false;
                    break;

                case "H":
                    this.#hourCycle = "h23";
                    this.#minHour = 0;
                    this.#maxHour = 23;
                    this.#adjustHoursForPm = false;
                    break;

                default:
                    this.#hourCycle = "h12";
                    this.#minHour = 1;
                    this.#maxHour = 12;
                    this.#adjustHoursForPm = true;
                    break;
            }
        }

        static get [Symbol.species]()
        {
            return this;
        }

        get minHour()
        {
            return asInt( this.#minHour );
        }

        get maxHour()
        {
            return asInt( this.#maxHour );
        }

        get hourCycle()
        {
            return this.#hourCycle;
        }

        toPattern()
        {
            return asString( super.toPattern() ).slice( 0, 2 );
        }

        toOption()
        {
            const opt = { hour: FORMATS.TWO_DIGIT, hourCycle: this.hourCycle };

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

        parse( pSegment, pBuffer )
        {
            const buffer = pBuffer || { [DATE_PARTS.HOUR]: -1 };

            buffer.minHour = this.minHour;
            buffer.maxHour = this.maxHour;

            let hour = asInt( asString( pSegment ).replace( /^0+/, _mt_str ) );

            if ( [12, 24].includes( this.maxHour ) && hour > this.maxHour )
            {
                hour -= 1;

                buffer.minHour = 0;
                buffer.maxHour = 23;

                buffer.adjustedForCycle = true;
                buffer.adjustHoursForCycle = false;
            }

            buffer[DATE_PARTS.HOUR] = hour;

            return buffer;
        }
    }

    class TokenMinute extends TokenNumber
    {
        constructor( pCharacter, pParentSet = null )
        {
            super( pCharacter, 0, 59, REPETITION_RULES.PAD, pParentSet );
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

        parse( pSegment, pBuffer )
        {
            const buffer = pBuffer || { [DATE_PARTS.MINUTE]: -1 };

            let minute = asInt( asString( pSegment, true ).replace( /^0+/, _mt_str ) );

            buffer[DATE_PARTS.MINUTE] = clamp( minute, 0, 59 );

            return buffer;
        }
    }

    class TokenSecond extends TokenMinute
    {
        constructor( pCharacter, pParentSet = null )
        {
            super( pCharacter, pParentSet );
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

        parse( pSegment, pBuffer )
        {
            const buffer = pBuffer || { [DATE_PARTS.SECOND]: -1 };

            let second = asInt( asString( pSegment, true ).replace( /^0+/, _mt_str ) );

            buffer[DATE_PARTS.SECOND] = clamp( second, 0, 59 );

            return buffer;
        }
    }

    class TokenMillisecond extends TokenNumber
    {
        constructor( pCharacter, pParentSet = null )
        {
            super( pCharacter, 0, 999, REPETITION_RULES.PAD, pParentSet );
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

        parse( pSegment, pBuffer )
        {
            const buffer = pBuffer || { [DATE_PARTS.MILLISECOND]: -1 };

            let minute = asInt( asString( pSegment, true ).replace( /^0+/, _mt_str ) );

            buffer[DATE_PARTS.MILLISECOND] = clamp( minute, 0, 999 );

            return buffer;
        }
    }

    class TokenTimeZone extends Token
    {
        constructor( pCharacters, pRepetitionRule, pParentSet = null )
        {
            super( pCharacters, pRepetitionRule, pParentSet );
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

        parse( pSegment, pBuffer )
        {
            const rxTz = () => /((GMT|UTC)([+-])?(\d{1,2})?:?(\d{2})?)|(((\w+ )*)(Time)?$)/gd;

            const buffer = pBuffer || { [DATE_PARTS.TIME_ZONE]: _mt_str };

            const segment = asString( pSegment, true );

            let dateString = segment;

            if ( DateBuffer.isBuffer( buffer ) )
            {
                try
                {
                    const date = buffer.toDate();


                    dateString = date.toString();
                }
                catch( ignored )
                {
                    dateString = dateString || segment;
                }
            }

            if ( !(isString( segment ) || isString( dateString )) || (isBlank( segment ) && isBlank( dateString )) )
            {
                return buffer;
            }

            let matched = _mt_str;
            let gmtPhrase = _mt_str;
            let gmt = _mt_str;
            let gmtOperator = _mt_str;
            let gmtHours = _mt_str;
            let gmtMinutes = _mt_str;

            let tzPhrase = _mt_str;

            let matches = rxTz().exec( segment ) || rxTz().exec( dateString );

            if ( null === matches || matches.length < 2 )
            {
                matches = rxTz().exec( dateString ) || rxTz().exec( segment );
            }

            if ( null !== matches && matches.length > 0 )
            {
                matched = asString( matches[0], true );
                gmtPhrase = matches.length > 1 ? matches[1] : asString( matched, true );
                gmt = matches.length > 2 ? matches[2] : ucase( asString( matched, true ).replace( /[\d:;+-]/g, _mt_str ) );
                gmtOperator = matches.length > 3 ? matches[3] : matched;
                gmtHours = matches.length > 4 ? matches[4] : asInt( leftOf( rightOf( asString( matched, true ), (gmtOperator || _hyphen) ), _colon ).replace( /\D+/g, _mt_str ).replace( /^0+/, _mt_str ) );
                gmtMinutes = matches.length > 5 ? matches[5] : asInt( rightOfLast( asString( matched, true ), _colon ).replace( /\D+/g, _mt_str ).replace( /^0+/, _mt_str ) );
                tzPhrase = matches.length > 6 ? matches[6] || matches[7] : asString( matched, true );
            }

            return buffer;
        }
    }

    class TokenGeneralTimeZone extends TokenTimeZone
    {
        constructor( pCharacters, pRepetitionRule, pParentSet = null )
        {
            super( pCharacters, pRepetitionRule, pParentSet );
        }

        static get [Symbol.species]()
        {
            return this;
        }
    }

    class TokenRfc822TimeZone extends TokenTimeZone
    {
        constructor( pCharacters, pRepetitionRule, pParentSet = null )
        {
            super( pCharacters, pRepetitionRule, pParentSet );
        }

        static get [Symbol.species]()
        {
            return this;
        }
    }

    class TokenIso8601TimeZone extends TokenTimeZone
    {
        constructor( pCharacters, pRepetitionRule, pParentSet = null )
        {
            super( pCharacters, pRepetitionRule, pParentSet );
        }

        static get [Symbol.species]()
        {
            return this;
        }
    }

    const TOKEN_FACTORY =
        {
            G: ( chars, context ) => new TokenEra( chars, context.eras ),
            y: ( chars, context ) => new TokenYear( chars, REPETITION_RULES.PAD, context.pivotYear, context ),
            Y: ( chars, context ) => new TokenYear( chars, REPETITION_RULES.PAD, context.pivotYear, context ),
            M: ( chars, context ) => new TokenMonth( chars, context.monthNames, context.monthAbbreviations, context ),
            L: ( chars, context ) => new TokenMonth( chars, context.monthNames, context.monthAbbreviations, context ),
            w: ( chars, context ) => new TokenWeek( chars, context.weekNumberingSystem, context.firstDayOfWeek, context.repetitionRule, context ),
            W: ( chars, context ) => new TokenWeek( chars, context.weekNumberingSystem, context.firstDayOfWeek, context.repetitionRule, context ),
            D: ( chars, context ) => new TokenDayInYear( chars, REPETITION_RULES.PAD, context ),
            d: ( chars, context ) => new TokenMonthDay( chars, REPETITION_RULES.PAD, context ),
            F: ( chars, context ) => new TokenOccurrenceOfDayInMonth( chars, REPETITION_RULES.PAD, context ),
            E: ( chars, context ) => new TokenDayName( chars, context.dayNames, context.dayAbbreviations, context.dayLetters, context ),
            u: ( chars, context ) => new TokenDayNumber( chars, REPETITION_RULES.PAD, context ),
            a: ( chars, context ) => new TokenAmPm( chars, context.amString, context.pmString, context ),
            H: ( chars, context ) => new TokenHour( chars, 0, 23, REPETITION_RULES.PAD, context ),
            h: ( chars, context ) => new TokenHour( chars, 1, 12, REPETITION_RULES.PAD, context ),
            K: ( chars, context ) => new TokenHour( chars, 0, 11, REPETITION_RULES.PAD, context ),
            k: ( chars, context ) => new TokenHour( chars, 1, 24, REPETITION_RULES.PAD, context ),
            m: ( chars, context ) => new TokenMinute( chars, context ),
            s: ( chars, context ) => new TokenSecond( chars, context ),
            S: ( chars, context ) => new TokenMillisecond( chars, context ),
        };


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
            firstDayOfWeek: Days.MONDAY,
            pivotYear: 75,
            tokenFactory: TOKEN_FACTORY
        } );

    class TokenSet
    {
        #locale = DEFAULT_LOCALE;
        #options = DEFAULT_OPTIONS;

        #pivotYear = 75;

        #monthNames = MONTH_NAMES;
        #monthAbbreviations = MONTH_NAMES_SHORT;

        #dayNames = DAY_NAMES;
        #dayAbbreviations = DAY_NAMES_SHORT;
        #dayLetters = DAY_LETTERS;

        #datePartCollections = new Map();

        #amString = "AM";
        #pmString = "PM";

        #eras = ERAS;

        #weekNumberingSystem = new ISO8601_WeekNumberingSystem();
        #firstDayOfWeek = Days.MONDAY;

        #hourCycle;

        #tokenFactory = TOKEN_FACTORY;

        constructor( pLocale = DEFAULT_LOCALE, pOptions = DEFAULT_OPTIONS )
        {
            this.#locale = resolveLocale( pLocale );

            const localeOptions = { ...(this.getLocaleOptions( this.#locale ) || pOptions || {}) } || {};

            this.#options = mergeOptions( localeOptions, pOptions, DEFAULT_OPTIONS );

            this.#monthNames = [].concat( this.#options?.monthNames || getMonthNames( this.#locale ) || MONTH_NAMES );
            this.#monthAbbreviations = [].concat( this.#options?.monthAbbreviations || getMonthAbbreviations( this.#locale ) || MONTH_NAMES_SHORT );

            this.#datePartCollections.set( DATE_PARTS.MONTH, [this.#monthNames, this.#monthAbbreviations, MONTH_NAMES, MONTH_NAMES_SHORT] );

            this.#dayNames = [].concat( this.#options?.dayNames || getDayNames( this.#locale ) || DAY_NAMES );
            this.#dayAbbreviations = [].concat( this.#options?.dayAbbreviations || getDayAbbreviations( this.#locale ) || DAY_NAMES_SHORT );
            this.#dayLetters = [].concat( this.#options?.dayLetters || getDayLetters( this.#locale ) || DAY_LETTERS );

            this.#datePartCollections.set( DATE_PARTS.DAY_OF_WEEK, [this.#dayNames, this.#dayAbbreviations, this.#dayLetters, DAY_NAMES, DAY_NAMES_SHORT, DAY_LETTERS] );

            this.#eras = [].concat( this.#options?.eras || getEras( this.#locale ) || ERAS );

            this.#amString = this.#options?.amString || ((getAmPmStrings( this.#locale ) || [_mt_str])[0]) || "AM";
            this.#pmString = this.#options?.pmString || ((getAmPmStrings( this.#locale ) || [_mt_str])[1]) || "PM";

            this.#weekNumberingSystem = this.#options?.weekNumberingSystem || new ISO8601_WeekNumberingSystem();

            this.#firstDayOfWeek = (Days.SUNDAY === this.#options.firstDayOfWeek || 7 === this.#options.firstDayOfWeek ? Days.SUNDAY : (this.#options.firstDayOfWeek || getFirstDayOfWeek( this.#locale ) || Days.MONDAY));

            this.#weekNumberingSystem.firstDayOfWeek = this.#firstDayOfWeek;

            this.#hourCycle = this.#locale?.hourCycle;

            this.#pivotYear = this.#options?.pivotYear || 75;

            this.#tokenFactory = this.#options?.tokenFactory || TOKEN_FACTORY;
        }

        getLocaleOptions( pLocale = DEFAULT_LOCALE )
        {
            const locale = resolveLocale( pLocale );

            if ( isSameLocale( DEFAULT_LOCALE, locale ) )
            {
                return {};
            }

            return {
                monthNames: getMonthNames( locale ),
                monthAbbreviations: getMonthAbbreviations( locale ),
                dayNames: getDayNames( locale ),
                dayAbbreviations: getDayAbbreviations( locale ),
                dayLetters: getDayLetters( locale ),
                eras: getEras( locale ),
                amString: asArray( getAmPmStrings( locale ) )[0],
                pmString: asArray( getAmPmStrings( locale ) )[1],
                firstDayOfWeek: getFirstDayOfWeek( locale )
            };
        }

        static get [Symbol.species]()
        {
            return this;
        }

        get locale()
        {
            return lock( resolveLocale( this.#locale ) || DEFAULT_LOCALE );
        }

        cloneForLocale( pLocale )
        {
            let locale = resolveLocale( pLocale || this.locale ) || this.locale;

            return new TokenSet( locale, this.options ) || this;
        }

        clone()
        {
            return this.cloneForLocale( this.locale );
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

        get pivotYear()
        {
            return this.#pivotYear;
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

        get datePartCollections()
        {
            return lock( new Map( this.#datePartCollections ) );
        }

        getIndexOf( pDatePart, pValue )
        {
            let index = -1;

            const value = asString( pValue );

            const datePartCollections = this.datePartCollections;

            const arrays = asArray( datePartCollections.get( pDatePart ) );

            for( const arr of arrays )
            {
                index = arr.indexOf( value );
                if ( index >= 0 )
                {
                    break;
                }
                index = arr.map( e => lcase( e ) ).indexOf( lcase( value ) );
                if ( index >= 0 )
                {
                    break;
                }
            }

            return index;
        }

        getMonthNumber( pString )
        {
            return this.getIndexOf( DATE_PARTS.MONTH, pString );
        }

        getDayNumber( pString )
        {
            return this.getIndexOf( DATE_PARTS.DAY_OF_WEEK, pString );
        }

        get tokenFactory()
        {
            return this.#tokenFactory || TOKEN_FACTORY;
        }

        getToken( pCharacters )
        {
            let token = null;

            const firstChar = asString( pCharacters ).slice( 0, 1 );

            if ( SUPPORTED_TOKENS.includes( firstChar ) )
            {
                const factory = this.tokenFactory || TOKEN_FACTORY;

                const tokenBuilder = factory[firstChar];

                if ( tokenBuilder )
                {
                    token = tokenBuilder( pCharacters, this );
                }
            }

            if ( null === token || isNull( token ) )
            {
                token = new TokenLiteral( pCharacters, REPETITION_RULES.NONE, this );
            }

            token.parentSet = this;

            return token;
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
                    results.push( new TokenLiteral( _spc ) );
                }
                else if ( ["L", "M", "D", "d", "y"].includes( left.characters[0] ) )
                {
                    if ( ["L", "M", "D", "d", "y"].includes( right.characters[0] ) )
                    {
                        results.push( new TokenLiteral( _slash ) );
                    }
                }
                else if ( ["h", "H", "K", "k", "m", "s", "S"].includes( left.characters[0] ) )
                {
                    if ( ["h", "H", "K", "k", "m", "s", "S"].includes( right.characters[0] ) )
                    {
                        results.push( new TokenLiteral( _colon ) );
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
            DateConstants: dateConstants,
            DATE_PARTS,
            merge
        };

    mod = modulePrototype.extend( mod );

    return mod.expose( mod, INTERNAL_NAME, (_ud !== typeof module ? module : mod) ) || mod;

}());
