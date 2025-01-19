/**
 * Provides functionality related to
 * parsing and formatting numbers and dates,
 * sorting strings and numbers
 * and other functionality
 * specific to a particular Locale
 */
const constants = require( "./Constants.cjs" );
const typeUtils = require( "./TypeUtils.cjs" );
const stringUtils = require( "./StringUtils.cjs" );
const arrayUtils = require( "./ArrayUtils.cjs" );

const { _ud = "undefined" } = constants;

const $scope = constants.$scope || function()
{
    return (_ud === typeof self ? ((_ud === typeof global) ? ((_ud === typeof globalThis ? {} : globalThis)) : (global || {})) : (self || {}));
};

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

    // Capture the dependencies for re-export with this module
    const dependencies =
        {
            constants,
            typeUtils,
            stringUtils,
            arrayUtils
        };

    // Create local aliases for values imported from other modules
    const {
        _mt_str,
        _dot,
        _hyphen,
        _underscore,
        _str,
        _num,
        _big,
        _bool,
        _obj,
        _fun,
        _symbol,
        S_WARN,
        S_ERROR,
        lock,
        classes
    } = constants;

    const { isDefined, isNull, isString, isObject, isArray, isFunction } = typeUtils;

    const
        {
            asString,
            isBlank,
            lcase,
            DEFAULT_NUMBER_SYMBOLS,
            deriveDecimalSymbols,
            calculateDecimalSymbols,
            toCanonicalNumericFormat
        } = stringUtils;

    const { varargs, asArray } = arrayUtils;

    const modName = "LocaleUtils";

    const { ModulePrototype } = classes;

    const modulePrototype = new ModulePrototype( modName, INTERNAL_NAME );

    const calculateErrorSourceName = function( pModule = modName, pFunction )
    {
        return modulePrototype.calculateErrorSourceName( pModule, pFunction );
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
        let locale;

        try
        {
            locale = (pLocale instanceof Intl.Locale) ? pLocale : (isString( pLocale ) && !isBlank( pLocale )) ? new Intl.Locale( pLocale.replace( /_/g, "-" ) ) : DEFAULT_LOCALE;
        }
        catch( ex )
        {
            modulePrototype.reportError( ex, (pLocale + " is not a supported locale specifier"), S_WARN, calculateErrorSourceName( modName, "resolveLocale" ), pLocale );

            locale = DEFAULT_LOCALE;
        }

        return lock( locale || DEFAULT_LOCALE );
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
            modulePrototype.reportError( ex, ex.message, S_ERROR, calculateErrorSourceName( modName, "getWeekData" ), locale );
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

            arr = pExcludeWhitespace ? arr.filter( arrayUtils.Filters.NON_BLANK ) : arr;

            return lock( arr );
        }

        let splitArg = "word" === pGranularity ? /\b/ : _mt_str;

        let arr = str.split( splitArg );

        arr = pExcludeWhitespace ? arr.filter( arrayUtils.Filters.NON_BLANK ) : arr;

        arr = pExcludePunctuation ? arr.filter( e => /[\w\s]+/.test( e ) ) : arr;

        return lock( arr );
    };

    class ResourceKey
    {
        #components = [];

        #mappingFunction;

        constructor( ...pComponents )
        {
            const me = this;

            const arr = asArray( varargs( ...pComponents ) ).flat();

            this.#mappingFunction = function( e )
            {
                if ( isObject( e ) )
                {
                    if ( e instanceof me.constructor )
                    {
                        return e.components;
                    }
                    if ( isArray( e ) )
                    {
                        return e.map( me.#mappingFunction );
                    }
                }

                if ( !isNull( e ) )
                {
                    switch ( typeof e )
                    {
                        case _str:
                            return asString( e ).split( _dot ).map( e => asString( e ).trim() );

                        case _num:
                        case _big:
                        case _bool:
                            return asString( e );

                        case _symbol:
                            const s = e.toString().replace( /^Symbol\s*\(\s*/, _mt_str ).replace( /\s*\)$/, _mt_str );
                            return asString( s ).split( _dot ).map( e => asString( e ).trim() );

                        case _fun:
                            return asString( e.name || e ).trim().split( _dot ).map( e => asString( e ).trim() );

                        default:
                            return asString( e ).split( _dot ).map( e => asString( e ).trim() );
                    }
                }
                return "~~null_key~~";
            };

            this.#components = arr.map( this.#mappingFunction ).flat();
        }

        get components()
        {
            return [...asArray( this.#components )].map( this.#mappingFunction ).flat();
        }

        toString()
        {
            return this.components.join( _dot );
        }

        [Symbol.toStringTag]()
        {
            return this.toString();
        }

        [Symbol.toPrimitive]( pHint )
        {
            return this.toString();
        }

        equals( pKey )
        {
            if ( pKey instanceof this.constructor )
            {
                return this.toString() === pKey.toString();
            }

            if ( isString( pKey ) )
            {
                return this.toString() === asString( pKey, true ).toString();
            }

            if ( isArray( pKey ) )
            {
                return this.toString() === new this.constructor( ...pKey ).toString();
            }

            return false;
        }
    }

    class Resource
    {
        #key;
        #value;
        #defaultValue;
        #description;

        constructor( pKey, pValue, pDefaultValue, pDescription )
        {
            this.#key = new ResourceKey( pKey );
            this.#value = pValue || pDefaultValue;
            this.#defaultValue = pDefaultValue || pValue;
            this.#description = asString( pDescription || pDefaultValue || pValue );
        }

        get key()
        {
            return new ResourceKey( this.#key );
        }

        get value()
        {
            return this.#value || this.#defaultValue;
        }

        get defaultValue()
        {
            return this.#defaultValue || this.#value;
        }

        get description()
        {
            return this.#description || this.#defaultValue || this.#value;
        }

        toString()
        {
            return this.key.toString() + "=" + asString( this.value || this.defaultValue || this.description );
        }

        [Symbol.toStringTag]()
        {
            return this.toString();
        }

        [Symbol.toPrimitive]( pHint )
        {
            return asString( this.value || this.defaultValue || this.description );
        }
    }

    Resource.from = function( pObject )
    {
        const elem = !isNull( pObject ) ? pObject : ["~~null_key~~", _mt_str, _mt_str, _mt_str];

        if ( isArray( elem ) && elem.length >= 2 && elem.length <= 4 )
        {
            return new Resource( ...elem );
        }
        else if ( isString( elem ) )
        {
            return Resource.from( elem.split( "=" ) );
        }
        else if ( isObject( elem ) )
        {
            if ( elem instanceof Resource )
            {
                return elem;
            }
            const arr = [asString( elem.key ), elem.value, elem.defaultValue, asString( elem.description )];
            return Resource.from( ...arr );
        }
        return null;
    };

    class ResourceMap
    {
        #locale;
        #localeCode;

        #resources = {};

        constructor( pLocale, ...pResources )
        {
            this.#locale = resolveLocale( pLocale ) || DEFAULT_LOCALE;
            this.#localeCode = this.#locale?.baseName || DEFAULT_LOCALE_STRING;

            const me = this;

            let arr = asArray( varargs( ...pResources ) );

            arr = arr.filter( e => !isNull( e ) ).map( e => (isObject( e ) && (e instanceof me.constructor/* || e instanceof me*/)) ? e.resources : e );

            for( let elem of arr )
            {
                if ( !isNull( elem ) )
                {
                    const rsrc = (elem instanceof Resource) ? elem : Resource.from( elem );

                    if ( !isNull( rsrc ) && rsrc instanceof Resource )
                    {
                        const s = elem.key.toString();

                        this.#resources[s] = elem;

                        if ( s.includes( _dot ) )
                        {
                            let obj = this.#resources;

                            const keys = s.split( _dot );

                            while ( keys.length > 1 && null != obj )
                            {
                                let key = keys.shift();

                                obj[key] = obj[key] || {};

                                const remaining = keys.length > 0 ? keys.join( _dot ) : null;

                                if ( remaining )
                                {
                                    obj[key][remaining] = obj[key][remaining] || elem;
                                }

                                obj = obj[key];
                            }
                        }
                    }
                }
            }
        }

        get locale()
        {
            return this.#locale || DEFAULT_LOCALE;
        }

        get localeCode()
        {
            return this.#localeCode || this.#locale?.baseName || DEFAULT_LOCALE_STRING;
        }

        get resources()
        {
            return lock( this.#resources );
        }

        get entries()
        {
            return lock( Object.entries( this.resources ) );
        }

        get keys()
        {
            return lock( Object.keys( this.resources ) );
        }

        getResource( pKey )
        {
            const key = new ResourceKey( pKey );

            const s = key.toString();

            let obj = this.resources[s];

            if ( !isNull( obj ) && obj instanceof Resource )
            {
                return obj;
            }

            let keys = s.split( _dot );

            obj = this.resources;

            while ( keys.length > 0 && null != obj )
            {
                let key = keys.shift();

                obj = obj[key];

                if ( !isNull( obj ) && obj instanceof Resource )
                {
                    break;
                }
            }

            return obj;
        }

        get( pKey )
        {
            let resource = this.getResource( pKey );

            if ( !isNull( resource ) && resource instanceof Resource )
            {
                return resource.value || resource.defaultValue || resource;
            }

            const s = asString( pKey, true );

            let keys = s.split( _dot );

            let obj = this.resources;

            while ( keys.length > 0 && null != obj )
            {
                let key = keys.shift();
                obj = obj[key];
            }

            if ( isNull( obj ) )
            {
                return asString( pKey, true );
            }

            return obj?.value || obj?.defaultValue || obj;
        }
    }

    class ResourceBundle
    {
        #resourceMaps = {};
        #resources = {};

        constructor( ...pResourceMaps )
        {
            let arr = asArray( varargs( ...pResourceMaps ) ).filter( e => !isNull( e ) ).map( e => (e instanceof ResourceMap) ? e : ((e instanceof Resource) ? new ResourceMap( DEFAULT_LOCALE, e ) : null) );

            arr = arr.filter( e => !isNull( e ) && e instanceof ResourceMap );

            for( let rsrcMap of arr )
            {
                if ( isNull( rsrcMap ) || !(rsrcMap instanceof ResourceMap) )
                {
                    continue;
                }

                const locale = resolveLocale( rsrcMap.locale );
                const localeCode = rsrcMap.localeCode || locale?.baseName || DEFAULT_LOCALE_STRING;

                // language ["-" script] ["-" region] *("-" variant)
                const localeParts = localeCode.split( _hyphen );

                const language = localeParts.length > 0 ? localeParts[0] : null;
                const script = localeParts.length > 1 ? localeParts[1] : _mt_str;
                const region = localeParts.length > 2 ? localeParts[2] : _mt_str;
                const variant = localeParts.length > 3 ? localeParts[3] : _mt_str;

                if ( isNull( language ) )
                {
                    continue;
                }

                let map = this.#resourceMaps[language] || [];
                map.push( rsrcMap );

                const resources = { ...(rsrcMap.resources || {}) };

                let resourcesByLanguage = this.#resources[language] || resources;
                resourcesByLanguage[language] = resources;

                const langScriptKey = language + _hyphen + script;
                const langRegionKey = language + _hyphen + region;
                const langVariantKey = language + _hyphen + variant;

                const langRegionVariantKey = language + _hyphen + region + _hyphen + variant;
                const langScriptVariantKey = language + _hyphen + script + _hyphen + variant;
                const langScriptRegionKey = language + _hyphen + script + _hyphen + region;
                const langScriptRegionVariantKey = language + _hyphen + script + _hyphen + region + _hyphen + variant;

                if ( !isBlank( variant ) )
                {
                    let resourcesByVariant = this.#resources[langVariantKey] || resources;
                    resourcesByVariant[langVariantKey] = { ...resourcesByVariant, ...resources };
                    this.#resources[langVariantKey] = resourcesByVariant;
                }

                if ( !isBlank( region ) )
                {
                    let resourcesByRegion = this.#resources[langRegionKey] || resources;
                    resourcesByRegion[langRegionKey] = { ...resourcesByRegion, ...resources };
                    this.#resources[langRegionKey] = resourcesByRegion;

                    if ( !isBlank( variant ) )
                    {
                        let resourcesByRegionVariant = this.#resources[langRegionVariantKey] || resources;
                        resourcesByRegionVariant[langRegionVariantKey] = { ...resourcesByRegionVariant, ...resources };
                        this.#resources[langRegionVariantKey] = resourcesByRegionVariant;
                    }
                }

                if ( !isBlank( script ) )
                {
                    let resourcesByScript = this.#resources[langScriptKey] || resources;
                    resourcesByScript[langScriptKey] = { ...resourcesByScript, ...resources };
                    this.#resources[langScriptKey] = resourcesByScript;

                    if ( !isBlank( variant ) )
                    {
                        let resourcesByScriptVariant = this.#resources[langScriptVariantKey] || resources;
                        resourcesByScriptVariant[langScriptVariantKey] = { ...resourcesByScriptVariant, ...resources };
                        this.#resources[langScriptVariantKey] = resourcesByScriptVariant;
                    }

                    if ( !isBlank( region ) )
                    {
                        let resourcesByRegion = this.#resources[langScriptRegionKey] || resources;
                        resourcesByRegion[langScriptRegionKey] = { ...resourcesByRegion, ...resources };
                        this.#resources[langScriptRegionKey] = resourcesByRegion;

                        if ( !isBlank( variant ) )
                        {
                            let resourcesByVariant = this.#resources[langScriptRegionVariantKey] || resources;
                            resourcesByVariant[langScriptRegionVariantKey] = { ...resourcesByVariant, ...resources };
                            this.#resources[langScriptRegionVariantKey] = resourcesByVariant;
                        }
                    }
                }
            }
        }

        get resourceMaps()
        {
            return { ...this.#resourceMaps };
        }

        get resources()
        {
            return { ...this.#resources };
        }

        getResource( pLocale, pKey )
        {
            const locale = resolveLocale( pLocale );
        }

        get( pLocale, pKey )
        {

        }
    }

    let mod =
        {
            dependencies,
            classes:
                {
                    ResourceKey,
                    Resource,
                    ResourceMap,
                    ResourceBundle
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
            },

            DEFAULT_NUMBER_SYMBOLS,
            deriveDecimalSymbols,
            calculateDecimalSymbols,
            toCanonicalNumericFormat
        };

    mod = modulePrototype.extend( mod );

    return mod.expose( mod, INTERNAL_NAME, (_ud !== typeof module ? module : mod) ) || mod;

}());
