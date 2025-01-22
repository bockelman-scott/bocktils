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

const {
    _ud = "undefined",
    $scope = function()
    {
        return (_ud === typeof self ? ((_ud === typeof global) ? ((_ud === typeof globalThis ? {} : globalThis)) : (global || {})) : (self || {}));
    }
} = constants;

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
        _spc,
        _dot,
        _hyphen,
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

    const { isDefined, isNull, isString, isNumeric, isObject, isArray, isFunction } = typeUtils;

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

    const { varargs, asArray, flatArgs, unique, Filters } = arrayUtils;

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

        return asString( asString( localeA?.baseName ).split( _hyphen )[0] ) === asString( asString( localeB?.baseName ).split( _hyphen )[0] );
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

            arr = pExcludeWhitespace ? arr.filter( Filters.NON_BLANK ) : arr;

            return lock( arr );
        }

        let splitArg = "word" === pGranularity ? /\b/ : _mt_str;

        let arr = str.split( splitArg );

        arr = pExcludeWhitespace ? arr.filter( Filters.NON_BLANK ) : arr;

        arr = pExcludePunctuation ? arr.filter( e => /[\w\s]+/.test( e ) ) : arr;

        return lock( arr );
    };

    class LocaleResourcesBase
    {
        constructor()
        {

        }

        parseLocale( pLocale )
        {
            const locale = resolveLocale( pLocale );
            const localeCode = locale?.baseName || DEFAULT_LOCALE_STRING;

            // language ["-" script] ["-" region] *("-" variant)
            const localeParts = localeCode.split( _hyphen );

            const language = localeParts.length > 0 ? localeParts[0] : null;
            const script = localeParts.length > 1 ? localeParts[1] : _mt_str;
            const region = localeParts.length > 2 ? localeParts[2] : _mt_str;
            const variant = localeParts.length > 3 ? localeParts[3] : _mt_str;

            return { locale, localeCode, language, script, region, variant };
        }

        buildLocaleKeyPermutations( pLocale )
        {
            const { localeCode, language, script, region, variant } = this.parseLocale( pLocale );

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
                        langScriptRegionVariantKey,
                        langRegionVariantKey,
                        langRegionKey,
                        langScriptRegionKey,
                        langScriptVariantKey,
                        langVariantKey,
                        langScriptKey,
                        language,
                        region
                    ];
            }

            return unique( keys.filter( e => isString( e ) && !isBlank( e ) ) );
        }

        initializeMap( pMap )
        {
            let property = isObject( pMap ) ? pMap || {} : isString( pMap ) ? this[pMap] || {} : {};
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

        appendMapEntry( pMap, pMapKey, pValue )
        {
            const map = isObject( pMap ) ? pMap || {} : isString( pMap ) ? this.initializeMap( pMap ) || {} : {};

            if ( !isString( pMapKey ) || isBlank( pMapKey ) )
            {
                return null;
            }

            map[pMapKey] = map[pMapKey] || pValue;

            switch ( typeof (map[pMapKey] || pValue) )
            {
                case _num:
                case _big:
                case _str:
                    map[pMapKey] = map[pMapKey] + ((isString( map[pMapKey] ) ? asString( pValue ) : isNumeric( pValue ) ? asFloat( pValue ) : 0));
                    break;

                case _bool:
                case _fun:
                    map[pMapKey] = map[pMapKey] || pValue;
                    break;

                case _obj:
                    if ( !isNull( map[pMapKey] ) )
                    {
                        if ( isArray( map[pMapKey] ) )
                        {
                            map[pMapKey] = map[pMapKey].concat( pValue );
                        }
                        else
                        {
                            map[pMapKey] = { ...map[pMapKey], ...pValue };
                        }
                    }
            }

            return map[pMapKey];
        }
    }

    class ResourceKey extends LocaleResourcesBase
    {
        #components = [];

        #mappingFunction;

        #defaultValue = _mt_str;

        constructor( ...pComponents )
        {
            super();

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

        get defaultValue()
        {
            return asString( this.#defaultValue );
        }

        set defaultValue( pValue )
        {
            this.#defaultValue = asString( pValue );
        }

        toString()
        {
            return this.components.join( _dot );
        }

        [Symbol.toStringTag]()
        {
            return this.toString();
        }

        [Symbol.toPrimitive]()
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

    class Resource extends LocaleResourcesBase
    {
        #key;
        #value;
        #defaultValue;
        #description;

        #backedBy;

        constructor( pKey, pValue, pDefaultValue, pDescription )
        {
            super();

            const isResourceKey = pKey instanceof this.constructor;

            this.#key = isResourceKey ? pKey.key || new ResourceKey( pKey ) : new ResourceKey( pKey );
            this.#value = pValue || (isResourceKey ? pKey.value || pValue : pValue) || pDefaultValue;
            this.#defaultValue = pDefaultValue || (isResourceKey ? pKey.defaultValue || pDefaultValue : this.#key.defaultValue || pValue) || pValue;
            this.#description = asString( pDescription || (isResourceKey ? pKey.description || pDescription : pDescription) || pDefaultValue || pValue );

            this.#backedBy = isResourceKey ? pKey : null;
        }

        get key()
        {
            return new ResourceKey( this.#key || this.#backedBy?.key );
        }

        get value()
        {
            return this.#value || this.#defaultValue || this.#backedBy?.value;
        }

        get defaultValue()
        {
            return this.#defaultValue || this.#value || this.#backedBy?.defaultValue;
        }

        get description()
        {
            return this.#description || this.#backedBy?.description || this.#defaultValue || this.#value;
        }

        toString()
        {
            return this.key.toString() + "=" + asString( this.value || this.defaultValue || this.description );
        }

        [Symbol.toStringTag]()
        {
            return this.toString();
        }

        [Symbol.toPrimitive]()
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

    const PARTS_OF_SPEECH =
        {
            NOUN: "noun",
            VERB: "verb",
            ADJECTIVE: "adjective",
            ADVERB: "adverb",
            PHRASE: "phrase",
            MESSAGE: "message"
        };

    class GrammarResource extends Resource
    {
        #defaultResource;
        #partOfSpeech;
        #forms;

        #antonym;

        constructor( pKey, pValue, pDefaultValue, pDescription, pPartOfSpeech, pForms )
        {
            super( (pKey instanceof Resource ? pKey.key || pKey : pKey) || pKey,
                   (pKey instanceof Resource ? pKey.value || pValue : pValue) || pValue,
                   (pKey instanceof Resource ? pKey.defaultValue || pDefaultValue : pDefaultValue) || pDefaultValue,
                   (pKey instanceof Resource ? pKey.description || pDescription : pDescription) || pDescription );

            this.#defaultResource = (pKey instanceof Resource ? pKey : this) || this;

            this.#partOfSpeech = pPartOfSpeech || "phrase";

            this.#forms = pForms || {};
        }

        get partOfSpeech()
        {
            return this.#partOfSpeech || "phrase";
        }

        get forms()
        {
            return this.#forms;
        }

        get defaultForm()
        {
            switch ( this.partOfSpeech )
            {
                case PARTS_OF_SPEECH.NOUN:
                    return "singular";

                case PARTS_OF_SPEECH.VERB:
                    return "base_form";

                case PARTS_OF_SPEECH.ADJECTIVE:
                    return "positive";

                case PARTS_OF_SPEECH.ADVERB:
                    return "positive";

                case PARTS_OF_SPEECH.PHRASE:
                    return "singular";

                case PARTS_OF_SPEECH.MESSAGE:
                    return "singular";

                default:
                    return "singular";
            }
        }

        getForm( pForm )
        {
            const form = asString( pForm || this.defaultForm ).toLowerCase();
            return this.forms[form] || this.value || this.#defaultResource.value;
        }

        getAntonym()
        {
            return this.#antonym;
        }

        setAntonym( pKey, pValue, pDefaultValue, pDescription, pPartOfSpeech, pForms )
        {
            this.#antonym = pKey instanceof Resource || pKey instanceof this.constructor ? pKey : new GrammarResource( pKey, pValue, pDefaultValue, pDescription, pPartOfSpeech, pForms );
        }
    }

    class NounForms
    {
        singular;
        plural;
        zero;
        one;
        two;
        few;
        many;
        gerund;

        constructor( pSingular, pPlural, pZero, pOne, pTwo, pFew, pMany, pGerund )
        {
            this.singular = asString( pSingular || pOne, true );
            this.plural = asString( pPlural || pMany, true );
            this.zero = asString( pZero || this.plural, true );
            this.one = asString( pOne || this.singular, true );
            this.two = asString( pTwo || this.plural, true );
            this.few = asString( pFew || this.plural, true );
            this.many = asString( pMany || this.plural, true );
            this.gerund = asString( pGerund || (this.singular + "ing"), true );
        }
    }

    class NounResource extends GrammarResource
    {
        constructor( pKey, pValue, pDefaultValue, pDescription, pNounForms )
        {
            super( pKey, pValue, pDefaultValue, pDescription, PARTS_OF_SPEECH.NOUN, pNounForms );
        }

        get defaultForm()
        {
            return "singular";
        }
    }

    class VerbForms
    {
        infinitive;
        base_form;
        base_form_plural;
        present_tense;
        past_tense;
        nominalization;
        agent;
        adj;
        adv;

        constructor( pInfinitive, pBase, pBasePlural, pPresent, pPast, pNominalization, pAdjective, pAdverb, pAgent )
        {
            this.infinitive = asString( pInfinitive, true );
            this.base_form = asString( pBase, true );
            this.base_form_plural = asString( pBasePlural || this.base_form, true );
            this.present_tense = asString( pPresent || this.base_form, true );
            this.past_tense = asString( pPast || this.present_tense, true );
            this.nominalization = asString( pNominalization, true );
            this.agent = asString( pAgent || (this.nominalization + "er"), true );
            this.adj = asString( pAdjective, true );
            this.adv = asString( pAdverb, true );
        }
    }

    class VerbResource extends GrammarResource
    {
        constructor( pKey, pValue, pDefaultValue, pDescription, pVerbForms )
        {
            super( pKey, pValue, pDefaultValue, pDescription, PARTS_OF_SPEECH.VERB, pVerbForms );
        }

        get defaultForm()
        {
            return "base_form";
        }
    }

    class AdjectiveForms
    {
        positive;
        negative;
        comparative;
        superlative;

        constructor( pPositive, pNegative, pComparative, pSuperlative )
        {
            this.positive = asString( pPositive, true );
            this.negative = asString( pNegative, true );
            this.comparative = asString( pComparative || this.positive, true );
            this.superlative = asString( pSuperlative || this.positive, true );
        }
    }

    class AdjectiveResource extends GrammarResource
    {
        constructor( pKey, pValue, pDefaultValue, pDescription, pAdjectiveForms )
        {
            super( pKey, pValue, pDefaultValue, pDescription, PARTS_OF_SPEECH.ADJECTIVE, pAdjectiveForms );
        }

        get defaultForm()
        {
            return "positive";
        }
    }

    class PhraseResource extends GrammarResource
    {
        #resources;

        constructor( pKey, pValue, pDefaultValue, pDescription, ...pResources )
        {
            super( pKey, pValue, pDefaultValue, pDescription, PARTS_OF_SPEECH.PHRASE );

            this.#resources = flatArgs( ...pResources );
        }

        get resources()
        {
            return asArray( this.#resources ).flat().filter( e => !isNull( e ) && e instanceof Resource );
        }

        getString( ...pForms )
        {
            const forms = flatArgs( ...pForms ).map( asString ).filter( e => !isBlank( e ) );

            const resources = asArray( this.resources );

            let phrase = _mt_str;

            for( let i = 0, n = resources.length; i < n; i++ )
            {
                const part = asString( resources[i].getForm( forms[i] || forms[forms.length - 1] ), true );

                phrase += (_spc + part);
            }

            return phrase;
        }
    }

    PhraseResource.from = function( pKey, ...pResources )
    {
        const args = flatArgs( pResources ).filter( e => !isNull( e ) && e instanceof Resource || e instanceof GrammarResource );

        let value = _mt_str;
        let defaultValue = _mt_str;

        for( let arg of args )
        {
            value += (_spc + asString( arg.value || arg.defaultValue, true ));
            defaultValue += (_spc + asString( arg.defaultValue || arg.value, true ));
        }

        return new PhraseResource( pKey, value, defaultValue, _mt_str, ...args );
    };

    class MessageResource extends PhraseResource
    {
        constructor( pKey, pValue, pDefaultValue, pDescription, ...pResources )
        {
            super( pKey, pValue, pDefaultValue, pDescription, ...pResources );
        }
    }

    MessageResource.from = function( pKey, ...pResources )
    {
        const pr = PhraseResource.from( pKey, ...pResources );

        return new MessageResource( pr?.key || pKey, pr?.value, pr?.defaultValue, pr?.description, ...(flatArgs( ...pr.resources )) );
    };

    class ResourceMap extends LocaleResourcesBase
    {
        #locale;
        #localeCode;

        #resources = {};

        constructor( pLocale, ...pResources )
        {
            super();

            this.#locale = resolveLocale( pLocale ) || DEFAULT_LOCALE;
            this.#localeCode = this.#locale?.baseName || DEFAULT_LOCALE_STRING;

            const me = this;

            let arr = asArray( varargs( ...pResources ) );

            const mapper = e => (isObject( e ) && (e instanceof me.constructor)) ? e.resources : e;

            arr = arr.filter( e => !isNull( e ) ).map( mapper ).flat();

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

    class ResourceCollection extends ResourceMap
    {
        #defaultMap;

        #defaultResources = {};

        constructor( pLocale, pDefaultMap, ...pResources )
        {
            super( pLocale, ...pResources );

            this.#defaultMap = pDefaultMap instanceof ResourceMap ? pDefaultMap : new ResourceMap( DEFAULT_LOCALE, ...pDefaultMap );

            this.#defaultResources = this.#defaultMap?.resources || { ...pResources };
        }

        get defaultMap()
        {
            return this.#defaultMap || this;
        }

        get resources()
        {
            return { ...(this.#defaultResources || this.defaultMap.resources), ...super.resources };
        }

        get entries()
        {
            const defaultEntries = this.defaultMap.entries();
            const superEntries = super.entries();

            return unique( [
                               ...defaultEntries,
                               ...superEntries
                           ].flat() );
        }

        get keys()
        {
            const defaultKeys = this.defaultMap.keys();
            const superKeys = super.keys();

            return unique( [
                               ...defaultKeys,
                               ...superKeys
                           ].flat() );
        }

        getResource( pKey )
        {
            const resource = super.getResource( pKey );

            if ( isNull( resource ) )
            {
                return this.defaultMap.getResource( pKey );
            }

            return resource;
        }

        get( pKey )
        {
            const resource = this.getResource( pKey );
            if ( !isNull( resource ) && resource instanceof Resource )
            {
                return resource.value || resource.defaultValue || resource;
            }
            return resource?.value || resource?.defaultValue || resource || asString( pKey, true );
        }
    }

    class ResourceBundle extends LocaleResourcesBase
    {
        #resourceMaps = {};
        #resources = {};

        constructor( ...pResourceMaps )
        {
            super();

            let arrMaps = asArray( varargs( ...pResourceMaps ) ).filter( e => !isNull( e ) ).map( e => (e instanceof ResourceMap) ? e : ((e instanceof Resource) ? new ResourceMap( DEFAULT_LOCALE, e ) : null) );

            arrMaps = arrMaps.filter( e => !isNull( e ) && e instanceof ResourceMap );

            for( let rsrcMap of arrMaps )
            {
                if ( isNull( rsrcMap ) || !(rsrcMap instanceof ResourceMap) )
                {
                    continue;
                }

                const resources = { ...(rsrcMap.resources || {}) };

                if ( Object.keys( resources ).length <= 0 )
                {
                    continue;
                }

                const keys = this.buildLocaleKeyPermutations( rsrcMap.locale );

                for( let key of keys )
                {
                    let map = this.initializeMapEntry( this.#resourceMaps, key, [] );
                    map.push( rsrcMap );

                    this.appendMapEntry( this.#resources, key, resources );
                }
            }
        }

        get resourceMaps()
        {
            return { ...(this.#resourceMaps || {}) };
        }

        getResourceMaps( pLocale )
        {
            const locale = resolveLocale( pLocale );

            const keys = this.buildLocaleKeyPermutations( locale );

            const maps = this.resourceMaps;

            const arr = [];

            for( let key of keys )
            {
                const a = maps[key];
                if ( a && a.length > 0 )
                {
                    arr.push( a );
                }
            }

            return arr.flat();
        }

        get resources()
        {
            return { ...this.#resources };
        }

        getResource( pLocale, pKey )
        {
            const locale = resolveLocale( pLocale );

            const maps = this.getResourceMaps( locale );

            let resource = null;

            for( let map of maps )
            {
                resource = map.getResource( pKey );
                if ( !isNull( resource ) && resource instanceof Resource )
                {
                    break;
                }
            }

            return resource;
        }

        get( pLocale, pKey )
        {
            const locale = resolveLocale( pLocale );

            let resource = this.getResource( locale, pKey );

            if ( !isNull( resource ) && resource instanceof Resource )
            {
                return resource.value || resource.defaultValue || resource;
            }

            let value = null;

            const s = asString( pKey, true );

            const localeKeys = this.buildLocaleKeyPermutations( locale ) || [];

            for( let localeKey of localeKeys )
            {
                let obj = this.resources[localeKey];

                if ( isNull( obj ) )
                {
                    continue;
                }

                let resourceKeys = s.split( _dot );

                while ( resourceKeys.length > 0 && null != obj )
                {
                    let key = resourceKeys.shift();
                    obj = obj[key];
                }

                if ( !isNull( obj ) )
                {
                    value = obj?.value || obj?.defaultValue;
                }

                if ( _ud !== typeof value && null !== value )
                {
                    break;
                }
            }

            return value || asString( pKey, true );
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
                    ResourceCollection,
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
