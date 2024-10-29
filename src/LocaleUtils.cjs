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
    const me = exposeModule;

    const dependencies =
        {
            constants,
            typeUtils,
            stringUtils,
            arrayUtils,
            objectUtils
        };

    let _mt_str = constants._mt_str;

    let isNull = typeUtils.isNull;
    let isDate = typeUtils.isDate;
    let isNumber = typeUtils.isNumber;
    let isString = typeUtils.isString;
    let isObject = typeUtils.isObject;
    let isFunction = typeUtils.isFunction;

    let asString = stringUtils.asString;
    let isBlank = stringUtils.isBlank;
    let lcase = stringUtils.lcase;

    constants.importUtilities( this, constants, typeUtils, stringUtils, arrayUtils, objectUtils );

    const INTERNAL_NAME = "__BOCK__LOCALE_UTILS__";

    if ( $scope() && (null != $scope()[INTERNAL_NAME]) )
    {
        return $scope()[INTERNAL_NAME];
    }

    const DEFAULT_LOCALE_STRING = "en-US";

    const FORMAT_LONG = "long";
    const FORMAT_SHORT = "short";
    const FORMAT_NARROW = "narrow";

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
                        start: new Date( 0, 0, 0, 0, 0, 0 ),
                        end: null,
                        name: "AD",
                        longName: "Anno Domini"
                    },
                    {
                        start: null,
                        end: new Date( new Date( 0, 0, 0, 0, 0, 0 ).getTime() - 1 ),
                        name: "BC",
                        longName: "Before Common Era"
                    },
                ],
            FORMATS:
                {
                    LONG: FORMAT_LONG,
                    SHORT: FORMAT_SHORT,
                    NARROW: FORMAT_NARROW
                }
        } );

    const sampleMonthDates = DEFAULTS.MONTH_NAMES.map( ( e, i ) => new Date( 2024, i, 1, 12, 0, 0, 0 ) );

    // September 2024 starts on a Sunday
    const sampleDayDates = DEFAULTS.DAY_NAMES.map( ( e, i ) => new Date( 2024, 8, (i + 1), 12, 0, 0, 0 ) );

    const amPmDates = [new Date( 2024, 0, 1, 8, 0, 0, 0 ), new Date( 2024, 0, 1, 20, 0, 0, 0 )];

    const DEFAULT_LOCALE = new Intl.Locale( DEFAULT_LOCALE_STRING );

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

    function isDefaultLocale( pLocale )
    {
        if ( isString( pLocale ) )
        {
            return lcase( DEFAULT_LOCALE_STRING ) === lcase( pLocale );
        }

        let locale = resolveLocale( pLocale );

        return locale === DEFAULT_LOCALE || locale.baseName === DEFAULT_LOCALE_STRING;
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
        return getMonthDisplayValues( pLocale, FORMAT_LONG );
    };

    const getDayAbbreviations = function( pLocale )
    {
        return getMonthDisplayValues( pLocale, FORMAT_SHORT );
    };

    const getDayLetters = function( pLocale )
    {
        return getMonthDisplayValues( pLocale, FORMAT_NARROW );
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
            eras.push( {
                           start: era.start,
                           end: era.end,
                           name: dfShort.format( era.start || era.end ),
                           longName: dfLong.format( era.start || era.end )
                       } );
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

        const dateTimeFormat = new Intl.DateTimeFormat( locale.baseName || pLocale, {
            timeStyle: "short",
            hourCycle: "h12"
        } );

        return amPmDates.map( e => asString( dateTimeFormat.format( e ) ).replace( /(0?8|20)[: ]?(00)([: ]?(00))?/, _mt_str ) );
    };

    const getWeekData = function( pLocale )
    {
        const locale = resolveLocale( pLocale );

        let weekData = null;

        try
        {
            if ( isFunction( locale.getWeekInfo ) )
            {
                weekData = locale.getWeekInfo() || locale.weekInfo;
            }
            else
            {
                weekData = locale.weekInfo || weekData;
            }
        }
        catch( ex )
        {
            console.error( ex );
        }

        return weekData;
    };

    const getFirstDayOfWeek = function( pLocale )
    {
        let firstDay = 1;

        const locale = resolveLocale( pLocale );

        const weekData = getWeekData( locale );

        if ( weekData )
        {
            firstDay = (7 === weekData.firstDay ? 0 : weekData.firstDay || 1);
        }

        return firstDay;
    };

    const mod =
        {
            DEFAULT_LOCALE_STRING,
            DEFAULTS,
            FORMATS:
                {
                    LONG: FORMAT_LONG,
                    SHORT: FORMAT_SHORT,
                    NARROW: FORMAT_NARROW
                },
            resolveLocale,
            isDefaultLocale,
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
            getFirstDayOfWeek

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