/**
 * Provides functionality similar to Java's SimpleDateFormat.
 * @see https://docs.oracle.com/javase/8/docs/api/java/text/SimpleDateFormat.html
 *
 * This module exposes methods for parsing strings as Date objects.
 */

/**
 * Import core dependencies
 * @type {{}}
 */
const core = require( "@toolbocks/core" );

/**
 * Establish separate constants for each of the common utilities imported
 * @see ../src/CoreUtils.cjs
 */
const { moduleUtils, constants, typeUtils, stringUtils, arrayUtils, localeUtils } = core;

const dateUtils = require( "./DateUtils.cjs" );

const tokenSetUtils = require( "./DateFormatTokenSet.cjs" );

const dateFormatUtils = require( "./DateFormatter.cjs" );

const { _ud = "undefined", $scope } = constants;

// noinspection FunctionTooLongJS
(function exposeModule()
{
    const INTERNAL_NAME = "__BOCK__DATE_PARSER__";

    if ( $scope() && (null != $scope()[INTERNAL_NAME]) )
    {
        return $scope()[INTERNAL_NAME];
    }

    const dependencies =
        {
            moduleUtils,
            constants,
            typeUtils,
            stringUtils,
            localeUtils,
            dateUtils,
            dateFormatUtils
        };

    const { ToolBocksModule, mergeOptions } = moduleUtils;

    const { _mt_str, _str, _num, _obj, no_op, _hyphen, _minus, _underscore, _colon } = constants;

    const {
        isNull,
        isString,
        isDate,
        isNumber,
        isNumeric,
        isNanOrInfinite,
        isValidDateOrNumeric,
        isArray,
        isLikeArray,
        isNonNullObject,
        firstMatchingType,
        clamp
    } = typeUtils;

    const {
        asInt,
        asString,
        lcase,
        ucase,
        isBlank,
        toUnixPath,
        leftOf,
        rightOf,
        rightOfLast
    } = stringUtils;

    const { asArray, flatArgs, includesAny } = arrayUtils;

    const { resolveLocale, isSameLocale } = localeUtils;

    const {
        resolveDate,
        DATE_PARTS,
        DateBuffer,
        numDaysInMonth,
        calculateNthOccurrenceOfDay,
        merge = moduleUtils.merge,
        rxTz = () => /((GMT|UTC)([+-])?(\d{1,2})?:?(\d{2})?)|(((\w+ )*)(Time)?$)/gd,
        Now = () => new Date()
    } = dateUtils;

    const { classes: TokenSetClasses, getDefaultTokenSet, SUPPORTED_INTL_OPTIONS } = tokenSetUtils;

    const { TokenSet, TokenLiteral } = TokenSetClasses;

    const { classes: DateFormatterClasses } = dateFormatUtils;

    const DateFormatter = DateFormatterClasses.DateFormatter;

    const modName = "DateParser";

    const modulePrototype = new ToolBocksModule( modName, INTERNAL_NAME );

    const resolveFormatter = function( pFormat, pLocale, pOptions )
    {
        const formatter = firstMatchingType( DateFormatter, pFormat, pLocale, pOptions );

        if ( isNull( formatter ) )
        {
            if ( isNonNullObject( pFormat ) && (includesAny( Object.keys( pFormat || {} ), ["dateStyle", "timeStyle", ...SUPPORTED_INTL_OPTIONS] )) )
            {
                return new DateFormatter( pFormat || pOptions, resolveLocale( pLocale, pOptions, pFormat ) );
            }
        }

        return formatter || new DateFormatter( isString( pFormat ) ? pFormat : pFormat?.pattern || pOptions?.pattern || (isString( pOptions ) ? pOptions : null), resolveLocale( pLocale, pOptions, pFormat ) );
    };

    const resolveOptions = function( ...pOptions )
    {
        let options = null;

        let candidates = [...(pOptions || [{}])].filter( e => isNonNullObject( e ) );

        for( const candidate of candidates )
        {
            options = (candidate instanceof DateFormatter) ? candidate.options || candidate : candidate;
            if ( isNonNullObject( options ) && Object.keys( options || {} ).includes( "locale" ) )
            {
                break;
            }
        }

        return options || {};
    };

    const resolveFormatPattern = function( ...pFormat )
    {
        let candidates = flatArgs( ...pFormat ).filter( e => isString( e ) || isNonNullObject( e ) );

        let pattern = _mt_str;

        for( const candidate of candidates )
        {
            switch ( typeof candidate )
            {
                case _str:
                case _num:
                    pattern = asString( candidate );
                    break;

                case _obj:
                    pattern = candidate?.pattern;
                    break;
            }

            if ( !isBlank( pattern ) )
            {
                break;
            }
        }

        return pattern;
    };

    const DEFAULT_TIME_ZONE_DATA_LOCATION = "../time_zone_data/US-TimeZones.properties";

    class TimeChange
    {
        #year;
        #date;

        #delta;
        #utcOffset;

        constructor( pYear, pDate, pDelta, pUtcOffset )
        {

        }
    }

    class TimeZone
    {
        #name;
        #abbreviation;
        #utcOffset;
        #localOffset;

        #timeChanges = {};

        constructor( pName, pAbbreviation, pUtcOffset, pLocalOffset, pTimeChanges )
        {
            if ( arguments.length < 2 )
            {
                const timeZone = TimeZone.parse( pName );

                this.#name = timeZone.#name;
                this.#abbreviation = timeZone.#abbreviation;
                this.#utcOffset = timeZone.#utcOffset;
                this.#localOffset = timeZone.#localOffset;
                this.#timeChanges = isNonNullObject( timeZone.#timeChanges ) ? timeZone.#timeChanges : {};
            }
            else
            {
                this.#name = asString( pName, true );
                this.#abbreviation = asString( pAbbreviation, true );
                this.#utcOffset = asInt( pUtcOffset );
                this.#localOffset = asInt( pLocalOffset );
                this.#timeChanges = isNonNullObject( pTimeChanges ) ? pTimeChanges : {};
            }
        }

        get regExp()
        {
            return rxTz();
        }

        static parseDateOrString( pDateOrString )
        {
            const str = asString( isString( pDateOrString ) ? asString( pDateOrString, true ) : isDate( pDateOrString ) ? resolveDate( pDateOrString ).toString() : _mt_str, true );

            const date = resolveDate( pDateOrString ) || Now();

            let dateString = isDate( date ) ? date.toString() : str;

            let matches = rxTz().exec( str ) || rxTz().exec( dateString );

            if ( null === matches || matches.length < 2 )
            {
                matches = rxTz().exec( dateString ) || rxTz().exec( str );
            }

            return matches;
        }

        static parse( pDateOrString )
        {
            let matches = isValidDateOrNumeric( pDateOrString ) || isString( pDateOrString ) ? this.parseDateOrString( pDateOrString ) : isArray( pDateOrString ) || isLikeArray( pDateOrString ) ? pDateOrString : [];

            if ( null !== matches && matches.length > 0 )
            {
                const matched = asString( matches[0], true ) || _mt_str;

                const gmtPhrase = matches.length > 1 ? matches[1] : asString( matched, true );

                const gmt = matches.length > 2 ? matches[2] : ucase( asString( matched, true ).replace( /[\d:;+-]/g, _mt_str ) );

                const gmtOperator = matches.length > 3 ? matches[3] : matched;

                const gmtHours = matches.length > 4 ? matches[4] : asInt( leftOf( rightOf( asString( matched, true ), (gmtOperator || _hyphen) ), _colon ).replace( /\D+/g, _mt_str ).replace( /^0+/, _mt_str ) );

                const gmtMinutes = matches.length > 5 ? matches[5] : asInt( rightOfLast( asString( matched, true ), _colon ).replace( /\D+/g, _mt_str ).replace( /^0+/, _mt_str ) );

                const tzPhrase = matches.length > 6 ? matches[6] || matches[7] : asString( matched, true );

                let gmtOffset = asInt( gmtHours ) + gmtMinutes > 0 ? asInt( 60 / gmtMinutes ) : 0;

                if ( ([_minus, _hyphen].includes( gmtOperator )) )
                {
                    gmtOffset = -1 * gmtOffset;
                }

                let localOffset = (Now().getTimezoneOffset() / 60) - gmtOffset;

                return new TimeZone( tzPhrase, gmtPhrase, gmtOffset, localOffset );
            }
        }

        calculateTimeChanges( pTimezone )
        {

            return {};
        }

        static loadTimeZoneDataFromJson( pJson )
        {
            const json = JSON.parse( pJson );
            // TimeZone.DATA = merge( json, TimeZone.DATA );

        }

        static loadTimeZoneDataFromProperties( pContents )
        {
            const lines = asString( pContents, true ).split( "\n" ).map( line => line.trim() ).filter( line => !isBlank( line ) && !line.startsWith( "#" ) );

            for( const line of lines )
            {
                let entry = asString( line, true );
                if ( !isBlank( entry ) )
                {
                    const kv = entry.split( "=" );

                    let key = asString( kv[0], true );
                    let value = asString( kv[1] || _mt_str, true );

                    const parts = value.split( "|" );

                    const abbr = parts[0];

                    const utcOffset = asString( parts[1], true ).split( _colon );
                    const utcOffsetHours = asInt( utcOffset[0] );
                    const utcOffsetMinutes = asInt( utcOffset[1] );

                    TimeZone.DATA[key.replaceAll( / /g, _underscore )] =
                        {
                            abbr,
                            utcOffset: utcOffsetHours + _colon + utcOffsetMinutes,
                            utcOffsetHours,
                            utcOffsetMinutes
                        };
                }
            }

            return TimeZone.DATA;
        }

        static async fetchTimeZoneData( pPath )
        {
            let dataLocation = asString( pPath, true );

            let contents = _mt_str;

            const executionEnvironment = modulePrototype.executionEnvironment;

            if ( /https?:\/\//.test( dataLocation ) )
            {
                const response = await fetch( dataLocation );
                contents = await response.text();
            }
            else
            {
                let currentDirectory;

                /*## environment-specific:node start ##*/
                if ( executionEnvironment.isNode() )
                {
                    const fsAsync = require( "node:fs/promises" );
                    const path = require( "node:path" );

                    currentDirectory = path.dirname( __filename );

                    let filePath = path.resolve( currentDirectory, toUnixPath( dataLocation ) );

                    contents = asString( await fsAsync.readFile( filePath, { encoding: "utf-8" } ), true );
                }
                /*## environment-specific:node end ##*/
                else if ( executionEnvironment.isDeno() )
                {
                    // TODO
                }
            }

            return contents;
        }

        static async loadTimeZoneData( pPath )
        {
            let dataLocation = asString( pPath, true );

            if ( isBlank( dataLocation ) )
            {
                dataLocation = DEFAULT_TIME_ZONE_DATA_LOCATION;
            }

            let contents = await TimeZone.fetchTimeZoneData( dataLocation );

            if ( isString( contents ) && !isBlank( contents ) )
            {
                if ( contents.startsWith( "{" ) )
                {
                    TimeZone.loadTimeZoneDataFromJson( contents );
                }
                else
                {
                    TimeZone.loadTimeZoneDataFromProperties( contents );
                }
            }

            return TimeZone.DATA;
        }
    }

    TimeZone.DATA = {};

    const deriveFormat = function( pDateString, pLocale )
    {

    };

    /**
     * Class to parse a string as a number, according to the Locale and Intl.NumberFormat Options specified
     * Instances can be created with an existing Intl.NumberFormat
     * or with a Locale and an object to specify the options for an Intl.NumberFormat that will be created
     */
    class DateParser
    {
        #locale;
        #options;

        #pattern;
        #tokenSet;

        #dateFormatter;

        #pivotYear = 65;

        /**
         * Creates an instance of this class to parse strings as numbers.
         *
         * @param {string|DateFormatter|object} pFormat can be either a string defining the expected format
         *                                              of dates to be parsed
         *
         *                                              or an instance of DateFormatter
         *
         *                                              or an object defining the options
         *                                              of an instance of Intl.DateTimeFormat
         *                                              that would produce values parseable
         *                                              by this instance of DateParser
         *
         * @param {Intl.Locale|string|DateFormatter|{locale:(Intl.Locale|string)}} pLocale can be either a locale string,
         *                                                                                 an Intl.Locale,
         *                                                                                 an instance of DateFormatter,
         *                                                                                 or an object
         *                                                                                 with a locale property
         *
         * @param {TokenSet} [pTokenSet=DEFAULT_TOKEN_SET] an instance of TokenSet
         *                                                 defining the format pattern symbols
         *                                                 used in the format argument
         *
         * @param {object|DateFormatter} pOptions can be either an object describing DateFormatter options
         *                                        or an instance of DateFormatter
         */
        constructor( pFormat, pLocale, pTokenSet, pOptions )
        {
            this.#dateFormatter = resolveFormatter( pFormat, pLocale, pOptions );

            this.#options = resolveOptions( pOptions, pFormat, pTokenSet, pLocale );

            this.#pattern = resolveFormatPattern( pFormat, this.#dateFormatter, pOptions );

            this.#locale = resolveLocale( pLocale, this.#options, pOptions, this.#dateFormatter, pTokenSet, pFormat );

            this.#tokenSet = (pTokenSet instanceof TokenSet) ? pTokenSet : this.#dateFormatter?.tokenSet || getDefaultTokenSet( this.#locale );
            this.#tokenSet = !isSameLocale( this.#locale, this.#tokenSet.locale ) ? this.#tokenSet.cloneForLocale( this.#locale ) : this.#tokenSet;

            this.#options = mergeOptions( this.#options, this.#dateFormatter?.options, this.#tokenSet?.options, pOptions || {} );
        }

        static get [Symbol.species]()
        {
            return this;
        }

        get locale()
        {
            return resolveLocale( this.#locale, this.#dateFormatter, this.#tokenSet, this.#options );
        }

        get options()
        {
            return mergeOptions( {}, this.#options, this.#dateFormatter?.options || {}, this.#tokenSet?.options || {} );
        }

        get pattern()
        {
            if ( isNull( this.#pattern ) || isBlank( asString( this.#pattern, true ) ) )
            {
                this.#pattern = this.#dateFormatter?.pattern;
            }

            return this.#pattern;
        }

        isPattern( pString )
        {
            if ( isString( pString ) && this.pattern === pString )
            {
                return true;
            }

            if ( isNumeric( pString ) )
            {
                return isNumber( this.pattern ) || !/\D/.test( this.pattern );
            }

            return false;
        }

        get tokenSet()
        {
            this.#tokenSet = (this.#tokenSet instanceof TokenSet) ? this.#tokenSet : this.#dateFormatter?.tokenSet || getDefaultTokenSet( this.locale );
            this.#tokenSet = this.#tokenSet || getDefaultTokenSet( this.locale );

            if ( !isSameLocale( this.locale, this.#tokenSet?.locale ) )
            {
                this.#tokenSet = this.#tokenSet.cloneForLocale( this.locale );
            }

            return this.#tokenSet || this.#dateFormatter?.tokenSet || getDefaultTokenSet( this.locale );
        }

        get supportedTokens()
        {
            return this.tokenSet?.supportedTokens;
        }

        get dateFormatter()
        {
            this.#dateFormatter = !(this.#dateFormatter instanceof DateFormatter) ? new DateFormatter( (this.pattern || this.options), this.locale, this.tokenSet ) : this.#dateFormatter;
            return this.#dateFormatter;
        }

        get pivotYear()
        {
            return clamp( asInt( this.#pivotYear ), 0, 99 );
        }

        set pivotYear( pValue )
        {
            this.#pivotYear = clamp( asInt( pValue ), 0, 99 );
        }

        isSupportedNumberingSystem( pNumberingSystem )
        {
            return (isNull( pNumberingSystem ) || isBlank( pNumberingSystem ) || "latn" === lcase( pNumberingSystem ));
        }

        getTokens( pPattern )
        {
            const format = isBlank( asString( pPattern ) ) ? this.pattern : asString( pPattern );

            return this.tokenSet.fromPattern( format );
        }

        getLiterals( pTokens )
        {
            const tokens = !isNull( pTokens ) && isArray( pTokens ) ? asArray( pTokens ) : this.getTokens();

            let literals = tokens.filter( token => token instanceof TokenLiteral ).map( e => asString( e.characters ).slice( 0, 1 ) );

            return [].concat( literals ).flat();
        }

        getMonthNumber( pString )
        {
            return this.tokenSet.getMonthNumber( pString );
        }

        getDayNumber( pString )
        {
            return this.tokenSet.getDayNumber( pString );
        }

        getSegments( pString, pLiterals )
        {
            let s = asString( pString );

            const literals = !isNull( pLiterals ) && isArray( pLiterals ) ? asArray( pLiterals ) : this.getLiterals( this.getTokens() );

            let segments = [];

            const characters = s.split( _mt_str );

            let elem = _mt_str;

            for( let i = 0, n = characters.length; i < n; i++ )
            {
                const char = characters[i];

                if ( literals.includes( char ) )
                {
                    if ( _mt_str !== elem )
                    {
                        segments.push( elem );
                        elem = _mt_str;
                    }
                    segments.push( char );
                }
                else if ( _mt_str === elem || !literals.includes( char ) )
                {
                    elem += char;
                }
                else
                {
                    segments.push( elem );
                    elem = char;
                }
            }

            if ( _mt_str !== elem )
            {
                segments.push( elem );
            }

            return segments;
        }

        parse( pString )
        {
            if ( isDate( pString ) || (isNumber( pString ) && !isNanOrInfinite( pString ) && !this.isPattern( pString )) )
            {
                return new Date( pString );
            }

            const s = asString( pString );

            const tokens = this.getTokens();

            const literals = this.getLiterals( tokens );

            const segments = this.getSegments( s, literals );

            let buffer = new DateBuffer();

            for( let i = 0, n = segments.length; i < n; i++ )
            {
                const segment = segments[i];

                const token = tokens[i] || this.tokenSet.getToken( segment ) || new TokenLiteral( segment );

                buffer = mergeOptions( (token.parse( segment, buffer ) || buffer), buffer );
            }

            const currentDate = new Date();

            let timeZone = buffer[DATE_PARTS.TIME_ZONE];
            let utcOffset = buffer[DATE_PARTS.UTC_OFFSET];

            let year = buffer[DATE_PARTS.YEAR];
            (year === -1) ? currentDate.getFullYear() : year;

            let month = clamp( buffer[DATE_PARTS.MONTH], 0, 11 );

            let dayOfWeek = buffer[DATE_PARTS.DAY_OF_WEEK];

            let dayOfMonth = buffer[DATE_PARTS.DAY_OF_MONTH];
            dayOfMonth = dayOfMonth < 1 ? calculateNthOccurrenceOfDay( year, month, 0, (dayOfWeek < 0 ? currentDate.getDay() : dayOfWeek) ) : dayOfMonth;

            let hours = buffer[DATE_PARTS.HOUR];
            let minutes = buffer[DATE_PARTS.MINUTE];
            let seconds = buffer[DATE_PARTS.SECOND];
            let milliseconds = buffer[DATE_PARTS.MILLISECOND];

            let maxHour = clamp( buffer.maxHour, 23, 24 );

            let adjustedForPm = buffer.adjustedForPm;
            let adjustHoursForPm = buffer.adjustHoursForPm && !adjustedForPm;

            if ( adjustHoursForPm )
            {
                hours += 12;

                adjustedForPm = buffer.adjustedForPm = true;
                adjustHoursForPm = buffer.adjustHoursForPm = false;
            }

            if ( hours > maxHour )
            {
                dayOfMonth += 1;
                hours -= (maxHour - hours);
            }

            if ( dayOfMonth > numDaysInMonth( year, month ) )
            {
                dayOfMonth = 1;
                month += 1;
            }

            if ( month > 11 )
            {
                year += 1;
                month = 0;
            }

            return new Date( year, clamp( month, 0, 11 ), clamp( dayOfMonth, 1, 31 ), clamp( hours, 0, 23 ), clamp( minutes, 0, 59 ), clamp( seconds, 0, 59 ), clamp( milliseconds, 0, 999 ) );
        }
    }

    DateParser.fromDateFormatter = function( pDateFormatter )
    {
        if ( pDateFormatter instanceof DateFormatter )
        {
            return new DateParser( pDateFormatter, pDateFormatter.locale, pDateFormatter.tokenSet, pDateFormatter.options );
        }
        throw new Error( "DateParser.fromDateTimeFormat requires an instance of DateFormatter" );
    };

    DateParser.fromPattern = function( pFormat, pLocale, pTokenSet, pOptions )
    {
        if ( isString( pLocale ) || pLocale instanceof Intl.Locale )
        {
            return new DateParser( pFormat, pLocale, pTokenSet, pOptions || {} );
        }
        throw new Error( "DateParser.fromLocale requires an instance of Intl.Locale or a string representing a Locale" );
    };

    let mod =
        {
            dependencies,
            classes:
                {
                    TimeChange,
                    TimeZone,
                    DateParser
                },
            TimeChange,
            TimeZone,
            DateParser,
            parse: function( pString, pFormat, pLocale, pTokenSet, pOptions )
            {
                const parser = new DateParser( pFormat, pLocale, pTokenSet, pOptions );

                return parser.parse( pString );
            }
        };

    mod = modulePrototype.extend( mod );

    TimeZone.loadTimeZoneData( DEFAULT_TIME_ZONE_DATA_LOCATION ).then( no_op ).catch( no_op );

    return mod.expose( mod, INTERNAL_NAME, (_ud !== typeof module ? module : mod) ) || mod;
}());
