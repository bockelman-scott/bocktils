/**
 * Provides functionality related to
 * parsing and formatting numbers and dates,
 * sorting strings and numbers
 * and other functionality
 * specific to a particular Locale
 */
const moduleUtils = require( "./_ToolBocksModule.cjs" );

const constants = require( "./Constants.cjs" );
const typeUtils = require( "./TypeUtils.cjs" );
const stringUtils = require( "./StringUtils.cjs" );
const arrayUtils = require( "./ArrayUtils.cjs" );

const {
    _ud = "undefined",
    $scope = function()
    {
        return (_ud === typeof self ? ((_ud === typeof global) ? ((_ud === typeof globalThis ? {} : globalThis)) : (global || {})) : (self || {}));
    }
} = constants;

// noinspection FunctionTooLongJS
(function exposeModule()
{
    // define a key under which we can cache this module in the global scope
    const INTERNAL_NAME = "__BOCK__LOCALE_UTILS__";

    // if this module has already been built and is available in the global scope,
    // just return that instance of this module
    if ( $scope() && (null != $scope()[INTERNAL_NAME]) )
    {
        return $scope()[INTERNAL_NAME];
    }

    const {
        ToolBocksModule,
        lock,
        objectValues,
        runtimeLocaleString,
        getRuntimeLocale,
        getMessagesLocale
    } = moduleUtils;

    // Create local aliases for values imported from other modules
    const {
        _mt_str,
        _hyphen,
        _str,
        _num,
        _big,
        _bool,
        _obj,
        _fun,
        S_WARN,
        S_ERROR,
    } = constants;

    const {
        isDefined,
        isNull,
        isString,
        isNumeric,
        isObject,
        isArray,
        isFunction,
        isDate,
        isMap,
    } = typeUtils;

    const
        {
            asString,
            asFloat,
            isBlank,
            lcase,
            DEFAULT_NUMBER_SYMBOLS,
            deriveDecimalSymbols,
            calculateDecimalSymbols,
            toCanonicalNumericFormat
        } = stringUtils;

    const { asArray, flatArgs, unique, Filters } = arrayUtils;

    // Capture the dependencies for re-export with this module
    const dependencies =
        {
            moduleUtils,
            constants,
            typeUtils,
            stringUtils,
            arrayUtils
        };

    const modName = "LocaleUtils";

    const toolBocksModule = new ToolBocksModule( modName, INTERNAL_NAME );

    const calculateErrorSourceName = function( pModule = modName, pFunction )
    {
        return toolBocksModule.calculateErrorSourceName( pModule, pFunction );
    };

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
    const DEFAULTS = lock(
        {
            LOCALE_STRING: DEFAULT_LOCALE_STRING,
            LANGUAGE: "en",
            MONTH_NAMES: lock( ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"] ),
            MONTH_NAMES_SHORT: lock( ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] ),
            MONTH_LETTERS: lock( ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"] ),
            DAY_NAMES: lock( ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] ),
            DAY_NAMES_SHORT: lock( ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] ),
            DAY_LETTERS: lock( ["S", "M", "T", "W", "R", "F", "Sa"] ),
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
    const SAMPLE_MONTH_DATES = DEFAULTS.MONTH_NAMES.map( ( e, i ) => new Date( 2024, i, 1, 12, 0, 0, 0 ) );

    // local variable used to generate locale-specific day names. abbreviations, and single-letter values.
    // Note that we use September 2024 because September 2024 starts on a Sunday
    const SAMPLE_DAY_DATES = DEFAULTS.DAY_NAMES.map( ( e, i ) => new Date( 2024, 8, (i + 1), 12, 0, 0, 0 ) );

    // local variable used to generate locale-specific AM/PM strings
    const AM_PM_DATES = [new Date( 2024, 0, 1, 8, 0, 0, 0 ), new Date( 2024, 0, 1, 20, 0, 0, 0 )];

    // Intl.Locale object representing the default locale
    const DEFAULT_LOCALE = new Intl.Locale( DEFAULT_LOCALE_STRING );

    const isLocale = ( pValue ) => (pValue instanceof Intl.Locale) || (isString( pValue ) && !isBlank( pValue ) && (/^[A-Z]{2}$|^[A-Z]{2}(-[^\d\\\/ \s]+)+$/i).test( pValue ));

    /**
     * Returns an Intl.Locale object corresponding to the first valid locale string or Intl.Locale specified
     * or the runtime locale if no valid arguments are provided
     *
     * @param {...(string|Intl.Locale|{locale:(string|Intl.Locale)})} pLocales one or more strings representing a Locale
     * or instances of Intl.Locale
     * or an object with a locale property
     * that is either a string representing a Locale
     * or an Intl.Locale
     *
     * @returns {Readonly<Intl.Locale>} An Intl.Locale object
     *                                  corresponding to the first valid
     *                                  locale string or Intl.Locale specified
     *                                  or the runtime locale if no valid arguments are provided
     */
    const resolveLocale = function( ...pLocales )
    {
        let locale = null;

        let locales = flatArgs( pLocales ).filter( e => !isNull( e ) );

        locales = locales.map( e => isString( e ) ? e.replaceAll( /_/g, _hyphen ) : e ).filter( isLocale );

        for( let elem of locales )
        {
            try
            {
                locale = (elem instanceof Intl.Locale) ? elem : (isString( elem ) && !isBlank( elem )) ? new Intl.Locale( asString( elem ).replace( /_/g, "-" ).trim() ) : resolveLocale( elem?.locale );
            }
            catch( ex )
            {
                toolBocksModule.reportError( ex, (elem + " is not a supported locale or locale specifier"), S_WARN, calculateErrorSourceName( modName, "resolveLocale" ), elem );
            }

            if ( locale instanceof Intl.Locale )
            {
                break;
            }
        }

        return lock( locale || getRuntimeLocale() );
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
     * Returns true if the specified locale is the runtime locale
     * @param pLocale {string|Intl.Locale} the locale to test
     * @returns {boolean} true if the specified locale is the runtime locale
     */
    function isRuntimeLocale( pLocale )
    {
        if ( isString( pLocale ) )
        {
            return lcase( runtimeLocaleString() ) === lcase( pLocale );
        }

        let locale = resolveLocale( pLocale );

        return locale === getRuntimeLocale() || asString( locale?.baseName ).startsWith( runtimeLocaleString() );
    }

    /**
     * Returns true if the specified locales represent the same Locale.
     *
     * @param pLocaleA the first locale to compare to the second locale
     * @param pLocaleB the locale to compare to the first locale
     * @param pMinimize (optional) specify true to compare only the language component of the locales
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

        return localeA === localeB || localeA?.baseName === localeB?.baseName;
    }

    /**
     * Returns true if the specified locales (or locale strings) represent the same <i>language</i>.
     * <br>
     * <br>
     * Compares the base language of the provided locales.
     * <br>
     *
     * @param {string|Intl.Locale} pLocaleA - The first locale to compare.
     * @param {string|Intl.Locale} pLocaleB - The second locale to compare.
     *
     * @return {boolean} Returns true if the base language of both locales is the same, otherwise false.
     */
    function isSameLanguage( pLocaleA, pLocaleB )
    {
        let localeA = resolveLocale( pLocaleA );
        let localeB = resolveLocale( pLocaleB );

        if ( isSameLocale( localeA, localeB ) )
        {
            return true;
        }

        const languageA = lcase( asString( localeA?.language, true ) || asString( asString( localeA?.baseName ).split( _hyphen )[0] ) );
        const languageB = lcase( asString( localeB?.language, true ) || asString( asString( localeB?.baseName ).split( _hyphen )[0] ) );

        return languageA === languageB;
    }

    /**
     * Returns true if the specified locales (or locale strings) represent the same <i>region</i>.
     * <br>
     * <br>
     * Compares the region, if specified of the provided locales.
     * <br>
     *
     * @param {string|Intl.Locale} pLocaleA - The first locale to compare.
     * @param {string|Intl.Locale} pLocaleB - The second locale to compare.
     *
     * @return {boolean} Returns true if the region of both locales is the same, otherwise false.
     */
    function isSameRegion( pLocaleA, pLocaleB )
    {
        let localeA = resolveLocale( pLocaleA );
        let localeB = resolveLocale( pLocaleB );

        if ( isSameLocale( localeA, localeB ) )
        {
            return true;
        }

        const regionA = lcase( asString( localeA?.region, true ) || asString( asString( localeA?.baseName ).split( _hyphen )[1] ) );
        const regionB = lcase( asString( localeB?.region, true ) || asString( asString( localeB?.baseName ).split( _hyphen )[1] ) );

        return regionA === regionB;
    }

    /**
     * Returns true if the specified locale uses the default language.
     * <br>
     * <br>
     *
     * @function
     * @param {string|Intl.Locale} pLocale - The locale to be evaluated
     *
     * @returns {boolean} - Returns true if the specified locale uses the default language
     *
     */
    const isDefaultLanguage = ( pLocale ) => isDefaultLocale( pLocale ) || isSameLanguage( DEFAULT_LOCALE, pLocale );


    /**
     * Returns true if the specified locale uses the same language as the runtime locale.
     * <br>
     * <br>
     *
     * @function
     * @param {string|Intl.Locale} pLocale - The locale to be evaluated
     *
     * @returns {boolean} - Returns true if the specified locale uses the same language as the runtime
     *
     */
    const isRuntimeLanguage = ( pLocale ) => isRuntimeLocale( pLocale ) || isSameLanguage( getRuntimeLocale(), pLocale );

    /**
     * Returns an array of month names or abbreviations,
     * formatted according to the specified locale and format.
     *
     * @function getMonthDisplayValues
     *
     * @param {string|Intl.Locale} pLocale - The Intl.Locale or locale identifier (e.g., "en-US")
     *                                       to be used for formatting month names.
     *
     * @param {string} pFormat - The desired format for the month names.
     *                           Possible values include "long", "short", or "narrow".
     *
     * @returns {string[]} An array containing month names or abbreviations
     *                     formatted according to the specified locale and format.
     */
    const getMonthDisplayValues = function( pLocale, pFormat )
    {
        const locale = resolveLocale( pLocale ) || DEFAULT_LOCALE;

        if ( isDefaultLocale( locale ) )
        {
            const format = lcase( pFormat );

            return FORMAT_LONG === format ? DEFAULTS.MONTH_NAMES : FORMAT_SHORT === format ? DEFAULTS.MONTH_NAMES_SHORT : DEFAULTS.MONTH_LETTERS;
        }

        const dateTimeFormat = new Intl.DateTimeFormat( locale.baseName, { month: pFormat } );

        return SAMPLE_MONTH_DATES.map( date => asString( dateTimeFormat.format( date ).replace( /\d+/g, _mt_str ), true ) );
    };

    /**
     * Returns an array of the full names of the months for a given locale.
     * <br>
     * <br>
     * The elements of the array are in chronological order and indexed according to the value return by Date.getMonth
     *
     *
     * @function
     *
     * @param {string|Intl.Locale} pLocale - An instance of Intl.Locale or a locale string
     *                                       with a BCP 47 language tag representing the locale.
     *
     * @returns {Array<string>} An array containing the full names of the months for the specified locale.
     */
    const getMonthNames = ( pLocale ) => getMonthDisplayValues( pLocale, FORMAT_LONG );

    /**
     * Returns the full name of the month represented by the specified date for the specified locale.
     * <br>
     * <br>
     *
     * @function
     *
     * @param {Date} pDate - The date from which to extract the month
     *
     * @param {string|Intl.Locale} pLocale - An instance of Intl.Locale or a locale string
     *                                       with a BCP 47 language tag representing the locale.
     *
     * @returns {Array<string>} The full name of the month of the date for the specified locale.
     */
    const getMonthName = ( pDate, pLocale ) => isDate( pDate ) ? asArray( getMonthNames( resolveLocale( pLocale ) ) )[pDate.getMonth()] : isLocale( pDate ) ? getMonthNames( pDate, pLocale ) : _mt_str;

    /**
     * Returns an array of abbreviated month names for a given locale.
     * <br>
     * Also known as the "short" names of the months.
     * <br>
     *
     * @param {string|Intl.Locale} pLocale - The locale or locale identifier (e.g., "en-US") to determine the month abbreviations.
     *
     * @returns {string[]} An array of abbreviated month names, formatted according to the specified locale.
     */
    const getMonthAbbreviations = ( pLocale ) => getMonthDisplayValues( pLocale, FORMAT_SHORT );

    /**
     * Returns the short name of the month represented by the specified date for the specified locale.
     * <br>
     * <br>
     *
     * @function
     *
     * @param {Date} pDate - The date from which to extract the month
     *
     * @param {string|Intl.Locale} pLocale - An instance of Intl.Locale or a locale string
     *                                       with a BCP 47 language tag representing the locale.
     *
     * @returns {Array<string>} The short name of the month of the date for the specified locale.
     */
    const getMonthAbbr = ( pDate, pLocale ) => isDate( pDate ) ? asArray( getMonthAbbreviations( resolveLocale( pLocale ) ) )[pDate.getMonth()] : isLocale( pDate ) ? getMonthAbbreviations( pDate, pLocale ) : _mt_str;

    /**
     * Returns an array of 1 or 2 character month signifiers for a given locale.
     * <br>
     * Also known as the "narrow" names of the months.
     * <br>
     *
     * @param {string|Intl.Locale} pLocale - The locale or locale identifier (e.g., "en-US") to determine the month signifiers.
     *
     * @returns {string[]} An array of one or two character month signifiers, formatted according to the specified locale.
     */
    const getMonthLetters = ( pLocale ) => getMonthDisplayValues( pLocale, FORMAT_NARROW );

    /**
     * Returns the "narrow" name of the month represented by the specified date for the specified locale.
     * <br>
     * <br>
     * This is typically a 1 or 2 character string
     *
     * @function
     *
     * @param {Date} pDate - The date from which to extract the month
     *
     * @param {string|Intl.Locale} pLocale - An instance of Intl.Locale or a locale string
     *                                       with a BCP 47 language tag representing the locale.
     *
     * @returns {Array<string>} The narrow name of the month of the date for the specified locale.
     */
    const getMonthLtr = ( pDate, pLocale ) => isDate( pDate ) ? asArray( getMonthLetters( resolveLocale( pLocale ) ) )[pDate.getMonth()] : isLocale( pDate ) ? getMonthLetters( pDate, pLocale ) : _mt_str;

    const getDayDisplayValues = function( pLocale, pFormat )
    {
        const locale = resolveLocale( pLocale );

        if ( isDefaultLocale( locale ) )
        {
            const format = lcase( pFormat );

            return FORMAT_LONG === format ? DEFAULTS.DAY_NAMES : FORMAT_SHORT === format ? DEFAULTS.DAY_NAMES_SHORT : DEFAULTS.DAY_LETTERS;
        }

        const dateTimeFormat = new Intl.DateTimeFormat( locale.baseName, { weekday: pFormat } );

        return SAMPLE_DAY_DATES.map( date => asString( dateTimeFormat.format( date ), true ) );
    };

    const getDayNames = ( pLocale ) => isDate( pLocale ) ? getDayName( pLocale ) : getDayDisplayValues( pLocale, FORMAT_LONG );

    const getDayName = ( pDate, pLocale ) => isDate( pDate ) ? asArray( getDayNames( resolveLocale( pLocale ) ) )[pDate.getDay()] : isLocale( pDate ) ? getDayNames( pDate, pLocale ) : _mt_str;

    const getDayAbbreviations = ( pLocale ) => getDayDisplayValues( pLocale, FORMAT_SHORT );

    const getDayAbbr = ( pDate, pLocale ) => isDate( pDate ) ? asArray( getDayAbbreviations( pLocale ) )[pDate.getDay()] : _mt_str;

    const getDayLetters = ( pLocale ) => getDayDisplayValues( pLocale, FORMAT_NARROW );

    const getDayLtr = ( pDate, pLocale ) => isDate( pDate ) ? asArray( getDayLetters( pLocale ) )[pDate.getDay()] : _mt_str;

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
            eras.push( lock(
                {
                    start: era.start,
                    end: era.end,
                    name: asString( dfShort.format( era.start || era.end ) ).replace( /[\d\/\\]/g, _mt_str ).trim(),
                    longName: asString( dfLong.format( era.start || era.end ) ).replace( /[\d\/\\]/g, _mt_str ).trim()
                } ) );
        }

        return lock( eras );
    };

    const getAmPmStrings = function( pLocale )
    {
        const locale = resolveLocale( pLocale );

        if ( isDefaultLocale( locale ) )
        {
            return lock( ["AM", "PM"] );
        }

        const dateTimeFormat = new Intl.DateTimeFormat( locale.baseName || pLocale,
                                                        {
                                                            timeStyle: "short",
                                                            hourCycle: "h12"
                                                        } );

        return AM_PM_DATES.map( e => asString( dateTimeFormat.format( e ) ).replace( /(0?8|20)[: ]?(00)([: ]?(00))?/, _mt_str ).trim() );
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
            toolBocksModule.reportError( ex, ex.message, S_ERROR, calculateErrorSourceName( modName, "getWeekData" ), locale );
        }

        if ( weekData )
        {
            weekData.firstDay = [0, 7].includes( weekData.firstDay ) ? 0 : weekData.firstDay;
            weekData.weekend = asArray( weekData.weekend ).map( e => 7 === e ? 0 : e );
        }

        return lock( weekData );
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
                arr = arr.filter( e => e.isWordLike || !/\s+/.test( e.segment ) );
            }

            if ( pExcludePunctuation )
            {
                arr = arr.filter( e => e.isWordLike || /\s+/.test( e.segment ) );
            }

            arr = arr.map( ( e ) => asString( e?.segment ) );

            arr = pExcludeWhitespace ? arr.filter( Filters.NON_BLANK ) : arr;

            return lock( arr );
        }

        let splitArg = "word" === pGranularity ? /\b/ : _mt_str;

        let arr = str.split( splitArg );

        arr = pExcludeWhitespace ? arr.filter( Filters.NON_BLANK ) : arr;

        arr = pExcludePunctuation ? arr.filter( e => /[\w\s]+/.test( e ) ) : arr;

        return lock( arr );
    };

    function parseLocale( pLocale )
    {
        const locale = resolveLocale( pLocale );
        const localeCode = locale?.baseName || DEFAULT_LOCALE_STRING;

        // language ["-" script] ["-" region] *("-" variant)
        const localeParts = localeCode.split( _hyphen );

        const language = locale?.language || (localeParts.length > 0 ? localeParts[0] : DEFAULTS.LANGUAGE);
        const script = locale?.script || (localeParts.length > 1 ? localeParts[1] : _mt_str);
        const region = locale?.region || (localeParts.length > 2 ? localeParts[2] : _mt_str);

        const variant = localeParts.length > 3 ? localeParts[3] : _mt_str;

        return { locale, localeCode, language, script, region, variant };
    }


    function buildLocaleKeyPermutations( pLocale )
    {
        const { localeCode, language, script, region, variant } = parseLocale( pLocale );

        let keys = [localeCode];

        if ( !isNull( language ) )
        {
            const langScriptKey = !isBlank( script ) ? language + _hyphen + script : _mt_str;
            const langRegionKey = !isBlank( region ) ? language + _hyphen + region : _mt_str;
            const langVariantKey = !isBlank( variant ) ? language + _hyphen + variant : _mt_str;

            const langRegionVariantKey = !(isBlank( region ) || isBlank( variant )) ? language + _hyphen + region + _hyphen + variant : _mt_str;
            const langScriptVariantKey = !(isBlank( script ) || isBlank( variant )) ? language + _hyphen + script + _hyphen + variant : _mt_str;
            const langScriptRegionKey = !(isBlank( script ) || isBlank( region )) ? language + _hyphen + script + _hyphen + region : _mt_str;
            const langScriptRegionVariantKey = !(isBlank( script ) || isBlank( region ) || isBlank( variant )) ? language + _hyphen + script + _hyphen + region + _hyphen + variant : _mt_str;

            keys =
                [
                    localeCode,
                    language,
                    region,
                    langRegionKey,
                    langVariantKey,
                    langRegionVariantKey,
                    langScriptKey,
                    langScriptRegionKey,
                    langScriptVariantKey,
                    langScriptRegionVariantKey
                ];
        }

        return unique( keys.filter( e => isString( e ) && !isBlank( e ) ) );
    }

    class LocaleResourcesBase
    {
        constructor()
        {

        }

        /**
         * The Symbol.species accessor property is a 'well-known' Symbol
         * we can use to return our constructor to external consumers.
         *
         * @return {Function} The constructor function of this class.
         */
        static get [Symbol.species]()
        {
            return this;
        }

        parseLocale( pLocale )
        {
            return parseLocale( pLocale );
        }

        buildLocaleKeyPermutations( pLocale )
        {
            return buildLocaleKeyPermutations( pLocale );
        }

        initializeMap( pMap )
        {
            let property = isMap( pMap ) ? pMap || new Map() : isString( pMap ) ? this[pMap] || {} : {};
            this[pMap] = this[pMap] || property;
            return this[pMap];
        }

        initializeMapEntry( pMap, pMapKey, pInitialValue )
        {
            const map = isObject( pMap ) ? pMap || {} : isString( pMap ) ? this.initializeMap( pMap ) || {} : {};

            if ( isString( pMapKey ) && !isBlank( pMapKey ) )
            {
                map[pMapKey] = map[pMapKey] || pInitialValue;
                return map[pMapKey];
            }
        }

        appendMapEntry( pMap, pKey, pValue )
        {
            const initializeMap = ( map ) => isString( map ) ? this.initializeMap( map ) || {} : {};

            const mergeObjects = ( target, source ) => isArray( target ) ? target.concat( source ) : { ...target, ...source };

            // Initialize the map
            const map = isObject( pMap ) ? pMap : initializeMap( pMap );

            // Validate key
            if ( !isString( pKey ) || isBlank( pKey ) )
            {
                return null;
            }

            // Set default entry if not present
            map[pKey] = map[pKey] || pValue;

            // Process entry based on type
            const entryType = typeof (map[pKey] || pValue);
            switch ( entryType )
            {
                case _num:
                case _big:
                case _str:
                    map[pKey] += isString( map[pKey] ) ? asString( pValue ) : isNumeric( pValue ) ? asFloat( pValue ) : 0;
                    break;
                case _bool:
                case _fun:
                    map[pKey] = map[pKey] || pValue;
                    break;
                case _obj:
                    if ( !isNull( map[pKey] ) )
                    {
                        map[pKey] = mergeObjects( map[pKey], pValue );
                    }
                    break;
            }
            return map[pKey];
        }

        /**
         * Returns a copy of this instance as a new object.
         *
         * @returns {LocaleResourcesBase} A copy of this instance as a new object.
         */
        clone()
        {
            return new (this.constructor[Symbol.species] || this.constructor)( ...(objectValues( this )) );
        }
    }

    let mod =
        {
            dependencies,
            classes:
                {
                    LocaleResourcesBase
                },
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
            isLocale,
            resolveLocale,
            isDefaultLocale,
            isDefaultLanguage,
            isRuntimeLocale,
            isRuntimeLanguage,
            isSameLocale,
            isSameLanguage,
            isSameRegion,
            getMonthNames,
            getNameOfMonth: getMonthName,
            getMonthAbbreviations,
            getAbbrOfMonth: getMonthAbbr,
            getMonthShortNames: getMonthAbbreviations,
            getMonthLetters,
            getMonthLtr,
            getDayNames,
            getNameOfDay: getDayName,
            getDayAbbreviations,
            getAbbrOfDay: getDayAbbr,
            getDayShortNames: getDayAbbreviations,
            getDayLetters,
            getDayLtr,
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
            },

            DEFAULT_NUMBER_SYMBOLS,
            deriveDecimalSymbols,
            calculateDecimalSymbols,
            toCanonicalNumericFormat,
            LocaleResourcesBase,
            parseLocale,
            buildLocaleKeyPermutations
        };

    mod = toolBocksModule.extend( mod );

    return mod.expose( mod, INTERNAL_NAME, (_ud !== typeof module ? module : mod) ) || mod;

}());
