/**
 * Provides functionality related to
 * parsing and formatting numbers and dates,
 * sorting strings and numbers
 * and other functionality
 * specific to a particular Locale
 */

const utils = require( "./CommonUtils.cjs" );

const constants = utils?.constants || require( "./Constants.cjs" );
const typeUtils = utils?.typeUtils || require( "./TypeUtils.cjs" );
const stringUtils = utils?.stringUtils || require( "./StringUtils.cjs" );
const arrayUtils = utils?.arrayUtils || require( "./ArrayUtils.cjs" );
const objectUtils = utils?.objectUtils || require( "./ObjectUtils.cjs" );

const _ud = constants?._ud || "undefined";

const $scope = utils?.$scope || function()
{
    return (_ud === typeof self ? ((_ud === typeof global) ? ((_ud === typeof globalThis ? {} : globalThis)) : (global || {})) : (self || {}));
};

(function exposeModule()
{
    // Capture the dependencies for re-export with this module
    const dependencies =
        {
            constants,
            typeUtils,
            stringUtils,
            arrayUtils,
            objectUtils
        };

    // Create local aliases for values imported from other modules
    let _mt_str = constants._mt_str;

    let isDefined = typeUtils.isDefined;
    let isString = typeUtils.isString;
    let isFunction = typeUtils.isFunction;

    let asString = stringUtils.asString;
    let isBlank = stringUtils.isBlank;
    let lcase = stringUtils.lcase;

    // Make all functions imported from other modules locally available in this module
    constants.importUtilities( this, constants, typeUtils, stringUtils, arrayUtils, objectUtils );

    // define a key under which we can cache this module in the global scope
    const INTERNAL_NAME = "__BOCK__LOCALE_UTILS__";

    // if this module has already been built and is available in the global scope,
    // just return that instance of this module
    if ( $scope() && (null != $scope()[INTERNAL_NAME]) )
    {
        return $scope()[INTERNAL_NAME];
    }

    // The locale assumed if no Locale is provided to this module's functions
    const DEFAULT_LOCALE_STRING = "en-US";

    // defines constants to be used with Intl.DateFormat functionality
    const FORMAT_LONG = "long";
    const FORMAT_SHORT = "short";
    const FORMAT_NARROW = "narrow";

    const FORMAT_2DIGIT = "2-digit";
    const FORMAT_NUMERIC = "numeric";

    // TODO: figure out how to actually get the first instant of A.D
    let START_AD = new Date( 1, 0, 1, 0, 0, 0, 0 );
    START_AD.setFullYear( START_AD.getFullYear() - 1900 );

    let END_AD = new Date( START_AD.getTime() - 1 );
    END_AD.setFullYear( START_AD.getFullYear() - 2 );
    END_AD.setDate( START_AD.getDate() - 1 );
    // END TODO

    /**
     * Defines the default values for date-related functionality.
     * Used when the locale is the default locale or no values are available for a specified locale
     */
    const DEFAULTS = Object.freeze(
        {
            LOCALE_STRING: DEFAULT_LOCALE_STRING,
            MONTH_NAMES: Object.freeze( ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"] ),
            MONTH_NAMES_SHORT: Object.freeze( ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] ),
            MONTH_LETTERS: Object.freeze( ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"] ),
            DAY_NAMES: Object.freeze( ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] ),
            DAY_NAMES_SHORT: Object.freeze( ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] ),
            DAY_LETTERS: Object.freeze( ["S", "M", "T", "W", "R", "F", "Sa"] ),
            ERAS:
                [
                    {
                        start: START_AD,
                        end: null,
                        name: "AD",
                        longName: "Anno Domini"
                    },
                    {
                        start: null,
                        end: END_AD,
                        name: "BC",
                        longName: "Before Common Era"
                    },
                ],
            FORMATS:
                {
                    LONG: FORMAT_LONG,
                    SHORT: FORMAT_SHORT,
                    NARROW: FORMAT_NARROW,
                    TWO_DIGIT: FORMAT_2DIGIT,
                    NUMERIC: FORMAT_NUMERIC
                }
        } );

    // local variable used to generate locale-specific month names and abbreviations
    const sampleMonthDates = DEFAULTS.MONTH_NAMES.map( ( e, i ) => new Date( 2024, i, 1, 12, 0, 0, 0 ) );

    // local variable used to generate locale-specific day names. abbreviations, and single-letter values.
    // Note that we use September 2024 because September 2024 starts on a Sunday
    const sampleDayDates = DEFAULTS.DAY_NAMES.map( ( e, i ) => new Date( 2024, 8, (i + 1), 12, 0, 0, 0 ) );

    // local variable used to generate locale-specific AM/PM strings
    const amPmDates = [new Date( 2024, 0, 1, 8, 0, 0, 0 ), new Date( 2024, 0, 1, 20, 0, 0, 0 )];

    // Intl.Locale object representing the default locale
    const DEFAULT_LOCALE = new Intl.Locale( DEFAULT_LOCALE_STRING );

    /**
     * Returns an Intl.Locale object corresponding to the specified locale string or Intl.Locale
     * @param pLocale {string|Intl.Locale} a string representing a Locale or an instance of Intl.Locale
     * @returns {Readonly<Intl.Locale>} An Intl.Locale object corresponding to the specified locale string or Intl.Locale
     */
    const resolveLocale = function( pLocale )
    {
        let locale = DEFAULT_LOCALE;

        try
        {
            locale = (pLocale instanceof Intl.Locale) ? pLocale : (isString( pLocale ) && !isBlank( pLocale )) ? new Intl.Locale( pLocale.replace( /_/g, "-" ) ) : DEFAULT_LOCALE;
        }
        catch( ex )
        {
            console.error( pLocale, "is not a supported locale specifier", ex );
            locale = DEFAULT_LOCALE;
        }

        return Object.freeze( locale || DEFAULT_LOCALE );
    };

    /**
     * Returns true if the specified locale is the default locale (en-US)
     * @param pLocale {string|Intl.Locale} the locale to test
     * @returns {boolean} true if the specified locale is the default locale (en-US)
     */
    function isDefaultLocale( pLocale )
    {
        if ( isString( pLocale ) )
        {
            return lcase( DEFAULT_LOCALE_STRING ) === lcase( pLocale );
        }

        let locale = resolveLocale( pLocale );

        return locale === DEFAULT_LOCALE || asString( locale?.baseName ).startsWith( DEFAULT_LOCALE_STRING );
    }

    /**
     * Returns true if the specified locales represent the same Locale.
     *
     * @param pLocaleA the first locale to compare to the second locale
     * @param pLocaleB the locale to compare to the first locale
     * @param pMinimize (optional) specify true to compare only the language component  of the locales
     * @returns {boolean} true if the specified locales represent the same Locale
     */
    function isSameLocale( pLocaleA, pLocaleB, pMinimize = false )
    {
        let localeA = resolveLocale( pLocaleA );
        let localeB = resolveLocale( pLocaleB );

        if ( true === pMinimize )
        {
            localeA = localeA.minimize();
            localeB = localeB.minimize();
        }

        return localeA === localeB || localeA.baseName === localeB.baseName;
    }

    function isSameLanguage( pLocaleA, pLocaleB )
    {
        let localeA = resolveLocale( pLocaleA );
        let localeB = resolveLocale( pLocaleB );

        if ( isSameLocale( localeA, localeB ) )
        {
            return true;
        }

        return asString( asString( localeA?.baseName ).split( constants._hyphen )[0] ) === asString( asString( localeB?.baseName ).split( constants._hyphen )[0] );
    }

    function isDefaultLanguage( pLocale )
    {
        return isDefaultLocale( pLocale ) || isSameLanguage( DEFAULT_LOCALE, pLocale );
    }

    const getMonthDisplayValues = function( pLocale, pFormat )
    {
        const locale = resolveLocale( pLocale ) || DEFAULT_LOCALE;

        if ( isDefaultLocale( locale ) )
        {
            const format = lcase( pFormat );

            return FORMAT_LONG === format ? DEFAULTS.MONTH_NAMES : FORMAT_SHORT === format ? DEFAULTS.MONTH_NAMES_SHORT : DEFAULTS.MONTH_LETTERS;
        }

        const dateTimeFormat = new Intl.DateTimeFormat( locale.baseName, { month: pFormat } );

        return sampleMonthDates.map( date => asString( dateTimeFormat.format( date ).replace( /\d+/g, _mt_str ), true ) );
    };

    const getMonthNames = function( pLocale )
    {
        return getMonthDisplayValues( pLocale, FORMAT_LONG );
    };

    const getMonthAbbreviations = function( pLocale )
    {
        return getMonthDisplayValues( pLocale, FORMAT_SHORT );
    };

    const getMonthLetters = function( pLocale )
    {
        return getMonthDisplayValues( pLocale, FORMAT_NARROW );
    };

    const getDayDisplayValues = function( pLocale, pFormat )
    {
        const locale = resolveLocale( pLocale );

        if ( isDefaultLocale( locale ) )
        {
            const format = lcase( pFormat );

            return FORMAT_LONG === format ? DEFAULTS.DAY_NAMES : FORMAT_SHORT === format ? DEFAULTS.DAY_NAMES_SHORT : DEFAULTS.DAY_LETTERS;
        }

        const dateTimeFormat = new Intl.DateTimeFormat( locale.baseName, { weekday: pFormat } );

        return sampleDayDates.map( date => asString( dateTimeFormat.format( date ), true ) );
    };

    const getDayNames = function( pLocale )
    {
        return getDayDisplayValues( pLocale, FORMAT_LONG );
    };

    const getDayAbbreviations = function( pLocale )
    {
        return getDayDisplayValues( pLocale, FORMAT_SHORT );
    };

    const getDayLetters = function( pLocale )
    {
        return getDayDisplayValues( pLocale, FORMAT_NARROW );
    };

    const getEras = function( pLocale )
    {
        const locale = resolveLocale( pLocale );

        if ( isDefaultLocale( locale ) )
        {
            return DEFAULTS.ERAS;
        }

        const dfLong = new Intl.DateTimeFormat( locale.baseName || pLocale, { era: "long" } );

        const dfShort = new Intl.DateTimeFormat( locale.baseName || pLocale, { era: "short" } );

        let eras = [];

        for( let era of DEFAULTS.ERAS )
        {
            eras.push( Object.freeze(
                {
                    start: era.start,
                    end: era.end,
                    name: asString( dfShort.format( era.start || era.end ) ).replace( /[\d\/\\]/g, _mt_str ).trim(),
                    longName: asString( dfLong.format( era.start || era.end ) ).replace( /[\d\/\\]/g, _mt_str ).trim()
                } ) );
        }

        return Object.freeze( eras );
    };

    const getAmPmStrings = function( pLocale )
    {
        const locale = resolveLocale( pLocale );

        if ( isDefaultLocale( locale ) )
        {
            return Object.freeze( ["AM", "PM"] );
        }

        const dateTimeFormat = new Intl.DateTimeFormat( locale.baseName || pLocale,
                                                        {
                                                            timeStyle: "short",
                                                            hourCycle: "h12"
                                                        } );

        return amPmDates.map( e => asString( dateTimeFormat.format( e ) ).replace( /(0?8|20)[: ]?(00)([: ]?(00))?/, _mt_str ).trim() );
    };

    const getWeekData = function( pLocale )
    {
        const locale = resolveLocale( pLocale );

        let weekData = {};

        try
        {
            if ( isFunction( locale.getWeekInfo ) )
            {
                weekData = Object.assign( locale.getWeekInfo() || locale.weekInfo || {} );
            }
            else
            {
                weekData = Object.assign( locale.weekInfo || weekData || {} );
            }
        }
        catch( ex )
        {
            console.error( ex );
        }

        if ( weekData )
        {
            weekData.firstDay = [0, 7].includes( weekData.firstDay ) ? 0 : weekData.firstDay;
            weekData.weekend = asArray( weekData.weekend ).map( e => 7 === e ? 0 : e );
        }

        return Object.freeze( weekData );
    };

    const getFirstDayOfWeek = function( pLocale )
    {
        let firstDay = 1;

        const locale = resolveLocale( pLocale );

        const weekData = getWeekData( locale );

        if ( weekData )
        {
            firstDay = ((7 === weekData.firstDay || 0 === weekData.firstDay) ? 0 : weekData.firstDay || 1);
        }

        return firstDay;
    };

    const getSegments = function( pString, pLocale, pGranularity, pExcludeWhitespace = true, pExcludePunctuation = false )
    {
        const str = asString( pString );

        if ( isBlank( str ) )
        {
            return pExcludeWhitespace ? [] : [str];
        }

        const locale = resolveLocale( pLocale || DEFAULT_LOCALE );

        if ( isDefined( Intl.Segmenter ) )
        {
            const segmenter = new Intl.Segmenter( locale?.baseName || DEFAULT_LOCALE_STRING, { granularity: pGranularity } );

            const segments = segmenter.segment( str );

            let arr = Array.from( segments );

            if ( pExcludeWhitespace )
            {
                //  /["'`,.:;?/\\{}\[\]=+()*&^%$#@!~_。-]/
                arr = arr.filter( e => e.isWordLike || !/\s+/.test( e.segment ) );
            }

            if ( pExcludePunctuation )
            {
                //  /["'`,.:;?/\\{}\[\]=+()*&^%$#@!~_。-]/
                arr = arr.filter( e => e.isWordLike || /\s+/.test( e.segment ) );
            }

            arr = arr.map( ( e ) => asString( e?.segment ) );

            arr = pExcludeWhitespace ? arr.filter( arrayUtils.Filters.NON_BLANK ) : arr;

            return Object.freeze( arr );
        }

        let splitArg = "word" === pGranularity ? /\b/ : _mt_str;

        let arr = str.split( splitArg );

        arr = pExcludeWhitespace ? arr.filter( arrayUtils.Filters.NON_BLANK ) : arr;

        arr = pExcludePunctuation ? arr.filter( e => /[\w\s]+/.test( e ) ) : arr;

        return Object.freeze( arr );
    };

    const mod =
        {
            dependencies,
            DEFAULT_LOCALE_STRING,
            DEFAULTS,
            FORMATS:
                {
                    LONG: FORMAT_LONG,
                    SHORT: FORMAT_SHORT,
                    NARROW: FORMAT_NARROW,
                    TWO_DIGIT: FORMAT_2DIGIT,
                    NUMERIC: FORMAT_NUMERIC,
                },
            resolveLocale,
            isDefaultLocale,
            isDefaultLanguage,
            isSameLocale,
            isSameLanguage,
            getMonthNames,
            getMonthAbbreviations,
            getMonthShortNames: getMonthAbbreviations,
            getMonthLetters,
            getDayNames,
            getDayAbbreviations,
            getDayShortNames: getDayAbbreviations,
            getDayLetters,
            getEras,
            getAmPmStrings,
            getWeekData,
            getFirstDayOfWeek,

            getWords: function( pString, pLocale, pExcludeWhitespace = true, pExcludePunctuation = false )
            {
                return getSegments( asString( pString ), pLocale, "word", pExcludeWhitespace, pExcludePunctuation );
            },

            getCharacters: function( pString, pLocale, pExcludeWhitespace = true, pExcludePunctuation = false )
            {
                return getSegments( asString( pString ), pLocale, "grapheme", pExcludePunctuation, pExcludePunctuation );
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
