/**
 * Provides functionality similar to Java's SimpleDateFormat.
 * @see https://docs.oracle.com/javase/8/docs/api/java/text/SimpleDateFormat.html
 *
 * This module exposes methods for parsing strings as Date objects.
 */

const constants = require( "./Constants.cjs" );
const typeUtils = require( "./TypeUtils.cjs" );
const stringUtils = require( "./StringUtils.cjs" );
const arrayUtils = require( "./ArrayUtils.cjs" );

const localeUtils = require( "./LocaleUtils.cjs" );

const dateUtils = require( "./DateUtils.cjs" );

const tokenSetUtils = require( "./DateFormatTokenSet.cjs" );

const dateFormatUtils = require( "./DateFormatter.cjs" );

const _ud = constants?._ud || "undefined";

const $scope = function()
{
    return (_ud === typeof self ? ((_ud === typeof global) ? ((_ud === typeof globalThis ? {} : globalThis)) : (global || {})) : (self || {}));
};

(function exposeModule()
{
    const INTERNAL_NAME = "__BOCK__DATE_PARSER__";

    if ( $scope() && (null != $scope()[INTERNAL_NAME]) )
    {
        return $scope()[INTERNAL_NAME];
    }

    const dependencies =
        {
            constants,
            typeUtils,
            stringUtils,
            localeUtils,
            dateUtils,
            dateFormatUtils
        };

    const _mt_str = constants._mt_str;

    const { isString, isDate, isNumber, isObject, isNull, isArray } = typeUtils;

    const { asInt, asString, lcase, isBlank } = stringUtils;

    const asArray = arrayUtils.asArray;


    const TokenSet = tokenSetUtils.classes.TokenSet;
    const TokenLiteral = tokenSetUtils.classes.TokenLiteral;

    const DateFormatter = dateFormatUtils.classes.DateFormatter;

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
         * @param pFormat {string|object} can be either a string defining the expected format of dates to be parsed
         *                                or an object defining the options of an instance of Intl.DateTimeFormat
         *                                that would produce values parseable by this instance of DateParser
         *
         * @param pLocale {Intl.Locale|string|DateFormatter} can be either a locale string, an Intl.Locale, or an instance of DateFormatter
         * @param pTokenSet {TokenSet} (optional) an instance of TokenSet defining the format pattern symbols used in the format argument
         * @param pOptions {object|DateFormatter} can be either an object describing DateFormatter options or an instance of DateFormatter
         */
        constructor( pFormat, pLocale, pTokenSet, pOptions )
        {
            if ( isString( pFormat ) )
            {
                this.#pattern = pFormat;
            }
            else if ( isObject( pFormat ) )
            {
                if ( pFormat instanceof DateFormatter )
                {
                    this.#dateFormatter = pFormat;
                    this.#options = Object.assign( {}, this.#dateFormatter.options || pOptions || {} );
                    this.#locale = localeUtils.resolveLocale( this.#options?.locale || pLocale ) || this.#locale;
                }
                else
                {
                    this.#options = Object.assign( {}, pOptions || {} );
                }
            }

            if ( pLocale instanceof Intl.Locale || isString( pLocale ) )
            {
                this.#locale = localeUtils.resolveLocale( pLocale );
            }
            else if ( pLocale instanceof DateFormatter )
            {
                this.#dateFormatter = pLocale;
                this.#options = Object.assign( {}, this.#dateFormatter.options || pOptions || {} );
                this.#locale = localeUtils.resolveLocale( this.#options?.locale );
            }

            if ( pOptions && isObject( pOptions ) )
            {
                if ( pOptions instanceof DateFormatter )
                {
                    this.#dateFormatter = pOptions;
                    this.#options = Object.assign( {}, this.#dateFormatter.options || pOptions || {} );
                    this.#locale = localeUtils.resolveLocale( this.#options.locale || pLocale ) || this.#locale;
                }
                else
                {
                    this.#options = Object.assign( {}, pOptions || {} );
                }
            }

            if ( isNull( this.#dateFormatter ) || !(this.#dateFormatter instanceof DateFormatter) )
            {
                this.#dateFormatter = new DateFormatter( this.#locale, this.#options || {} );
            }

            this.#locale = (this.#locale instanceof Intl.Locale) ? this.#locale : this.#dateFormatter?.locale || localeUtils.resolveLocale( localeUtils.DEFAULT_LOCALE_STRING );

            this.#tokenSet = (pTokenSet instanceof TokenSet) ? pTokenSet : this.#dateFormatter?.tokenSet;

            this.#tokenSet = (this.#tokenSet instanceof TokenSet) ? this.#tokenSet : tokenSetUtils.getDefaultTokenSet( this.#locale );

            if ( isNull( this.#options ) || !isObject( this.#options ) || Object.keys( this.#options ).length <= 0 )
            {
                this.#options = Object.assign( {}, this.#dateFormatter?.options || this.#tokenSet?.options || {} );
            }
        }

        get locale()
        {
            return localeUtils.resolveLocale( this.#locale || this.#dateFormatter?.locale );
        }

        get options()
        {
            return Object.assign( {}, this.#options || this.#dateFormatter?.options || {} );
        }

        get pattern()
        {
            if ( isNull( this.#pattern ) || isBlank( asString( this.#pattern, true ) ) )
            {
                this.#pattern = this.#dateFormatter?.pattern;
            }

            return this.#pattern;
        }

        get tokenSet()
        {
            this.#tokenSet = (this.#tokenSet instanceof TokenSet) ? this.#tokenSet : this.#dateFormatter?.tokenSet || tokenSetUtils.getDefaultTokenSet( this.locale );
            this.#tokenSet = this.#tokenSet || tokenSetUtils.getDefaultTokenSet( this.locale );

            if ( this.locale?.baseName !== this.#tokenSet?.locale?.baseName )
            {
                this.#tokenSet = this.#tokenSet.cloneForLocale( this.locale );
            }

            return this.#tokenSet || this.#dateFormatter?.tokenSet || tokenSetUtils.getDefaultTokenSet( this.locale );
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
            return Math.max( 0, asInt( this.#pivotYear ) );
        }

        set pivotYear( pValue )
        {
            this.#pivotYear = Math.max( 0, asInt( pValue ) );
        }

        isSupportedNumberingSystem( pNumberingSystem )
        {
            return (isNull( pNumberingSystem ) || isBlank( pNumberingSystem ) || "latn" === lcase( pNumberingSystem ));
        }

        /*

         isPatternCompatibleWith( pString )
         {
         let s = _mt_str + asString( pString );

         let rx = /(\d+|[^ \\\/.,:;-]+)([ \\\/.,:;-]*?)+/;

         let elements = [];

         let matches = rx.exec( s );

         while ( null != matches && matches.length )
         {
         s = s.replace( new RegExp( "^" + matches[0] ), _mt_str );

         elements.push( ...(matches.slice( 1 )) );

         matches = rx.exec( s );
         }

         elements = elements.flat();

         let rxString = _mt_str;

         for( let i = 0, n = elements.length; i < n; i++ )
         {
         const elem = elements[i];

         if ( /[\d+]/.test( elem ) )
         {
         rxString += "(y+|M{1,2}|L{1,2}|d+|D+|u+|h+|H+|k+|K+|m+|s+|S+)";
         }
         else if ( /[ \\\/.,:;-]+/.test( elem ) )
         {
         rxString += "([ \\\\\\/.,:;-]+)";
         }
         else if ( /\w+/.test( elem ) )
         {
         rxString += "(G+|E+|a+|M{3,}|L{3,})";
         }
         }

         const regExp = new RegExp( rxString );

         return (regExp.test( this.pattern ));
         }

         */
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
            if ( isDate( pString ) || isNumber( pString ) )
            {
                return new Date( pString );
            }

            const s = asString( pString );

            /*
             let compatible = this.isPatternCompatibleWith( s );

             if ( !compatible )
             {
             console.warn( "Date String,", s, "does not seem to match specified format pattern:", this.pattern );
             }
             */

            const tokens = this.getTokens();

            const literals = this.getLiterals( tokens );

            const segments = this.getSegments( s, literals );

            let year = -1;
            let month = -1;
            let dayOfMonth = -1;
            let day = -1;
            let hours = -1;
            let minutes = -1;
            let seconds = -1;
            let milliseconds = -1;

            let adjustHoursForPm = false;

            function adjustHours( pHours )
            {
                let hrs = asInt( pHours );

                if ( hrs >= 0 && hrs < 12 )
                {
                    hrs += 12;
                }

                return Math.min( 23, hrs );
            }

            for( let i = 0, n = segments.length; i < n; i++ )
            {
                let num = -1;

                let tokenLength = 1;

                const token = tokens[i];
                const segment = segments[i];

                const tokenClass = typeUtils.getClassName( token );

                switch ( tokenClass )
                {
                    case "TokenLiteral":
                        break;

                    case "TokenYear":
                        num = asInt( segment );

                        if ( num > 0 )
                        {
                            if ( num < 100 )
                            {
                                num += (num > this.pivotYear ? 1900 : 2000);
                            }
                        }

                        year = num;

                        break;

                    case "TokenMonth":
                        tokenLength = token.characters.length;
                        if ( tokenLength > 2 )
                        {
                            month = Math.min( 11, Math.max( 0, this.getMonthNumber( segment ) ) );
                        }
                        else
                        {
                            month = Math.min( 11, Math.max( 0, asInt( segment.replace( /^0+/, _mt_str ) ) - 1 ) );
                        }

                        break;

                    case "TokenMonthDay":

                        dayOfMonth = asInt( segment.replace( /^0+/, _mt_str ) );

                        break;

                    case "TokenHour":
                        const tokenCharacter = token.characters.slice( 0, 1 );

                        switch ( tokenCharacter )
                        {
                            case "H":
                                hours = asInt( segment.replace( /^0+/, _mt_str ) );
                                break;
                            // return new TokenHour( pCharacters, 0, 23 );

                            case "h":
                                num = asInt( segment.replace( /^0+/, _mt_str ) );
                                num = 12 === num ? 0 : num > 12 ? num - 12 : num;
                                hours = num;

                                break;
                            // return new TokenHour( pCharacters, 1, 12 );

                            case "K":
                                num = asInt( segment.replace( /^0+/, _mt_str ) );
                                num = 12 === num ? 0 : num > 11 ? num - 12 : num;
                                hours = num;

                                break;
                            // return new TokenHour( pCharacters, 0, 11 );

                            case "k":
                                num = asInt( segment.replace( /^0+/, _mt_str ) );
                                num = 24 === num ? 0 : num;
                                hours = num;

                                break;
                            // return new TokenHour( pCharacters, 1, 24 );

                        }

                        if ( adjustHoursForPm )
                        {
                            hours = adjustHours( hours );
                            adjustHoursForPm = false;
                        }

                        break;

                    case "TokenMinute":
                        minutes = asInt( segment.replace( /^0+/, _mt_str ) );
                        break;

                    case "TokenSecond":
                        seconds = asInt( segment.replace( /^0+/, _mt_str ) );
                        break;

                    case "TokenMillisecond":
                        milliseconds = asInt( segment.replace( /^0+/, _mt_str ) );
                        break;

                    case "TokenAmPm":
                        if ( asString( segment, true ) === asString( this.tokenSet.pmString, true ) )
                        {
                            if ( hours >= 0 && hours < 12 )
                            {
                                hours += 12;
                            }
                            else if ( hours < 0 )
                            {
                                adjustHoursForPm = true;
                            }
                        }

                        break;

                    case "TokenDayName":

                        tokenLength = token.characters.length;
                        if ( tokenLength > 2 )
                        {
                            day = Math.min( 6, Math.max( 0, this.getDayNumber( segment ) ) );
                        }
                        else
                        {
                            day = asInt( segment.replace( /^0+/, _mt_str ) );
                        }

                        break;
                }
            }

            const currentDate = new Date();

            year = year < 0 ? currentDate.getFullYear() : year;
            month = month < 0 ? currentDate.getMonth() : month;
            dayOfMonth = dayOfMonth < 1 ? dateUtils.calculateNthOccurrenceOfDay( year, month, 0, (day < 0 ? currentDate.getDay() : day) ) : dayOfMonth;

            hours = Math.min( 23, Math.max( 0, hours ) );
            minutes = Math.min( 59, Math.max( 0, minutes ) );
            seconds = Math.min( 59, Math.max( 0, seconds ) );
            milliseconds = Math.min( 999, Math.max( 0, milliseconds ) );

            return new Date( year, month, dayOfMonth, hours, minutes, seconds, milliseconds );
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

    const mod =
        {
            dependencies,
            classes:
                {
                    DateParser
                },
            DateParser,
            parse: function( pString, pFormat, pLocale, pTokenSet, pOptions )
            {
                const parser = new DateParser( pFormat, pLocale, pTokenSet, pOptions );

                return parser.parse( pString );
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
