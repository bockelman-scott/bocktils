/**
 * Provides functionality similar to Java's SimpleDateFormat.
 * @see https://docs.oracle.com/javase/8/docs/api/java/text/SimpleDateFormat.html
 *
 * This module exposes methods for formatting Date objects as strings.
 */

const utils = require( "./CommonUtils.cjs" );

const tokenSetUtils = require( "./DateFormatTokenSet.cjs" );

const dependencies = tokenSetUtils.dependencies;

const constants = dependencies?.constants;
const typeUtils = dependencies?.typeUtils;
const stringUtils = dependencies?.stringUtils;
const arrayUtils = dependencies?.arrayUtils;
const objectUtils = dependencies?.objectUtils;

const localeUtils = require( "./LocaleUtils.cjs" );

const _ud = constants?._ud || "undefined";

const $scope = utils?.$scope || function()
{
    return (_ud === typeof self ? ((_ud === typeof global) ? ((_ud === typeof globalThis ? {} : globalThis)) : (global || {})) : (self || {}));
};

(function exposeModule()
{
    const INTERNAL_NAME = "__BOCK__DATE_FORMATTER__";

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
            objectUtils,
            localeUtils
        };

    let _mt_str = constants._mt_str;

    let { isNull, isDate, isNumber, isString, isObject } = typeUtils;

    let { asString } = stringUtils;

    const TokenSet = tokenSetUtils.classes.TokenSet;

    const Token = tokenSetUtils.classes.Token;

    const DEFAULT_LOCALE = Object.freeze( new Intl.Locale( "en-US" ) );

    const DEFAULT_TOKEN_SET = Object.freeze( tokenSetUtils.getDefaultTokenSet() );

    const DEFAULT_FORMAT = "MM/dd/yyyy hh:mm:ss";

    const resolveDate = function( pDate )
    {
        return isDate( pDate ) ? pDate : isNumber( pDate ) ? new Date( pDate ) : new Date();
    };

    const resolveLocale = localeUtils.resolveLocale;

    class DateFormatter
    {
        #locale = DEFAULT_LOCALE;
        #tokenSet = DEFAULT_TOKEN_SET;

        #pattern = DEFAULT_FORMAT;
        #options = null;

        #useIntlDateFormat = false;

        constructor( pFormat = DEFAULT_FORMAT, pLocale = DEFAULT_LOCALE, pTokenSet = DEFAULT_TOKEN_SET )
        {
            this.#locale = Object.freeze( resolveLocale( pLocale ) );

            this.#tokenSet = Object.freeze( (pTokenSet instanceof TokenSet) ? pTokenSet : tokenSetUtils.getDefaultTokenSet( resolveLocale( pLocale ) ) );

            this.#pattern = isString( pFormat ) ? asString( pFormat ) : isObject( pFormat ) ? null : DEFAULT_FORMAT;

            this.#options = isString( pFormat ) ? null : isObject( pFormat ) ? Object.assign( {}, pFormat ) : null;

            this.#useIntlDateFormat = isObject( pFormat ) && (arrayUtils.includesAny( Object.keys( pFormat ), ["dateStyle", "timeStyle"] ) || arrayUtils.includesAny( Object.keys( pFormat ), tokenSetUtils.SUPPORTED_INTL_OPTIONS ));
        }

        /**
         *
         * @returns {Readonly<Intl.Locale>}
         */
        get locale()
        {
            return Object.freeze( resolveLocale( this.#locale ) );
        }

        get tokenSet()
        {
            this.#tokenSet = Object.freeze( (this.#tokenSet instanceof TokenSet) ? this.#tokenSet : tokenSetUtils.getDefaultTokenSet( this.locale ) );
            if ( !localeUtils.isSameLocale( this.#tokenSet.locale, this.#locale ) )
            {
                this.#tokenSet = new TokenSet( this.locale, this.#tokenSet.options );
            }
            return this.#tokenSet || tokenSetUtils.getDefaultTokenSet( this.locale );
        }

        get useIntlDateFormat()
        {
            return !!this.#useIntlDateFormat;
        }

        convertOptionsToPattern( pOptions, pTokenSet )
        {
            let tokenSet = this.resolveTokenSet( pTokenSet || this.tokenSet ) || this.tokenSet;

            const tokens = tokenSet.fromOptions( pOptions );

            const characters = tokens.map( token => token.characters );

            return characters.join( constants._mt_chr );
        }

        /**
         * Returns an object suitable for using to construct an instance of Intl.DateFormat
         *
         * @param pPattern {string} a date format pattern, such as "MM/dd/yyyy hh:mm:ss a"
         * @param pTokenSet {TokenSet} the token set to use to interpret the date format
         * @returns {Readonly<{}>} an object suitable for using to construct an instance of Intl.DateFormat
         */
        convertPatternToOptions( pPattern, pTokenSet )
        {
            let tokenSet = this.resolveTokenSet( pTokenSet || this.tokenSet ) || this.tokenSet;

            const tokens = this.processFormat( pPattern, tokenSet );

            const options = tokens.map( token => token.toOption() );

            let obj = {};

            for( let option of options )
            {
                obj = Object.assign( obj, option );
            }

            return Object.freeze( obj );
        }

        get pattern()
        {
            if ( isNull( this.#pattern ) || (_mt_str === asString( this.#pattern, true )) )
            {
                this.#pattern = this.convertOptionsToPattern( this.#options, this.tokenSet );
            }
            return asString( this.#pattern ) || DEFAULT_FORMAT;
        }

        get options()
        {
            if ( isNull( this.#options ) )
            {
                this.#options = this.convertPatternToOptions( this.#pattern, this.tokenSet );
            }
            return Object.freeze( Object.assign( {}, this.#options ) );
        }

        resolveTokenSet( pTokenSet )
        {
            if ( pTokenSet instanceof TokenSet )
            {
                return Object.freeze( pTokenSet );
            }
            return this.tokenSet;
        }

        processFormat( pFormat, pTokenSet )
        {
            const pattern = pFormat || this.pattern;

            let arr = (asString( pattern ) || DEFAULT_FORMAT).split( constants._mt_chr );

            const tokenSet = this.resolveTokenSet( pTokenSet );

            let format = [];

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
                    format.push( elem );
                    elem = char;
                }
            }

            if ( _mt_str !== elem )
            {
                format.push( elem );
            }

            format = format.map( e => tokenSet.getToken( e ) ).filter( e => e instanceof Token );

            return format;
        }

        format( pDate )
        {
            const date = resolveDate( pDate );

            if ( !this.useIntlDateFormat )
            {
                let format = this.processFormat( this.pattern, this.tokenSet );

                format = format.map( e => e.format( date ) );

                return format.join( constants._mt_str );
            }

            if ( isObject( this.options ) )
            {
                const options = Object.assign( {}, this.options || {} );

                const dateTimeFormat = new Intl.DateTimeFormat( this.locale.baseName, options );

                return dateTimeFormat.format( date );
            }

            return date.toLocaleString( [this.locale, DEFAULT_LOCALE] );
        }
    }

    const mod =
        {
            dependencies,
            resolveDate,
            resolveLocale,
            DEFAULT_LOCALE,
            DEFAULT_TOKEN_SET,
            DEFAULT_FORMAT,
            DateFormatter,
            classes: { DateFormatter }
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

