/**
 * Provides functionality similar to Java's SimpleDateFormat.
 * @see https://docs.oracle.com/javase/8/docs/api/java/text/SimpleDateFormat.html
 *
 * This module exposes methods for formatting Date objects as strings.
 */

const utils = require( "./CommonUtils.cjs" );

const tokenSetUtils = require( "./DateFormatTokenSet.cjs" );

const dependencies = tokenSetUtils.dependencies;

const constants = dependencies?.constants || utils.constants || require( "./Constants.cjs" );
const typeUtils = dependencies?.typeUtils || utils.typeUtils || require( "./TypeUtils.cjs" );
const stringUtils = dependencies?.stringUtils || utils.stringUtils || require( "./StringUtils.cjs" );
const arrayUtils = dependencies?.arrayUtils || utils.arrayUtils || require( "./ArrayUtils.cjs" );
const objectUtils = dependencies?.objectUtils || utils.objectUtils || require( "./ObjectUtils.cjs" );

const localeUtils = require( "./LocaleUtils.cjs" );

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
            objectUtils,
            localeUtils
        };

    let _mt_str = constants._mt_str;

    let isNull = typeUtils.isNull;
    let isDate = typeUtils.isDate;
    let isNumber = typeUtils.isNumber;
    let isString = typeUtils.isString;
    let isObject = typeUtils.isObject;

    let asString = stringUtils.asString;
    let isBlank = stringUtils.isBlank;

    constants.importUtilities( this, constants, typeUtils, stringUtils, arrayUtils, objectUtils );

    const INTERNAL_NAME = "__BOCK__DATE_FORMATTER__";

    if ( $scope() && (null != $scope()[INTERNAL_NAME]) )
    {
        return $scope()[INTERNAL_NAME];
    }

    const TokenSet = tokenSetUtils.classes.TokenSet;

    const DEFAULT_LOCALE = Object.freeze( new Intl.Locale( "en-US" ) );

    const DEFAULT_TOKEN_SET = Object.freeze( tokenSetUtils.getDefaultTokenSet() );

    const DEFAULT_FORMAT = "MM/dd/yyyy hh:mm:ss";

    const resolveDate = function( pDate )
    {
        return isDate( pDate ) ? pDate : isNumber( pDate ) ? new Date( pDate ) : new Date();
    };

    const resolveLocale = localeUtils.resolveLocale;

    const processFormat = function( pFormat = DEFAULT_FORMAT, pTokenSet = DEFAULT_TOKEN_SET )
    {
        let arr = (asString( pFormat ) || DEFAULT_FORMAT).split( constants._mt_chr );

        const tokenSet = pTokenSet || DEFAULT_TOKEN_SET;

        let format = [];

        let elem = constants._mt_str;

        for( let i = 0, len = arr.length; i < len; i++ )
        {
            const char = arr.charAt( i );

            if ( char === elem.slice( -1 ) )
            {
                elem += char;
            }
            else
            {
                format.push( elem );
                elem = constants._mt_str;
            }
        }

        format.map( e => tokenSet.getToken( e ) );

        return format;
    };

    const format = function( pDate, pFormat = DEFAULT_FORMAT, pTokenSet = DEFAULT_TOKEN_SET )
    {
        const date = resolveDate( pDate );

        let format = processFormat( pFormat, pTokenSet );

        format = format.map( e => e.format( date ) );

        return format.join( constants._mt_str );
    };

    const convertOptionsToPattern = function( pOptions, pTokenSet = DEFAULT_TOKEN_SET )
    {

    };

    const convertPatternToOptions = function( pPattern, pTokenSet = DEFAULT_TOKEN_SET )
    {

    };

    class DateFormatter
    {
        #locale = DEFAULT_LOCALE;
        #tokenSet = DEFAULT_TOKEN_SET;

        #pattern = DEFAULT_FORMAT;
        #options = null;

        constructor( pFormat = DEFAULT_FORMAT, pLocale = DEFAULT_LOCALE, pTokenSet = DEFAULT_TOKEN_SET )
        {
            this.#locale = Object.freeze( resolveLocale( pLocale ) );

            this.#tokenSet = Object.freeze( (pTokenSet instanceof TokenSet) ? pTokenSet : tokenSetUtils.getDefaultTokenSet( resolveLocale( pLocale ) ) );

            this.#pattern = isString( pFormat ) ? asString( pFormat ) : isObject( pFormat ) ? null : DEFAULT_FORMAT;

            this.#options = isString( pFormat ) ? null : isObject( pFormat ) ? Object.assign( {}, pFormat ) : null;
        }

        get locale()
        {
            return Object.freeze( resolveLocale( this.#locale ) );
        }

        get tokenSet()
        {
            return Object.freeze( (this.#tokenSet instanceof TokenSet) ? this.#tokenSet : tokenSetUtils.getDefaultTokenSet( this.locale ) );
        }

        get pattern()
        {
            if ( isNull( this.#pattern ) || (_mt_str === asString( this.#pattern, true )) )
            {
                this.#pattern = convertOptionsToPattern( this.#options, this.tokenSet );
            }
            return asString( this.#pattern );
        }

        get options()
        {
            if ( isNull( this.#options ) )
            {
                this.#options = convertPatternToOptions( this.#pattern, this.tokenSet );
            }
            return Object.freeze( Object.assign( {}, this.#options ) );
        }

        resolveLocale( pLocale )
        {
            return (isNull( pLocale ) || (isString( pLocale ) && isBlank( pLocale ))) ? this.locale : resolveLocale( pLocale );
        }

        resolveTokenSet( pTokenSet )
        {
            if ( pTokenSet instanceof TokenSet )
            {
                return Object.freeze( pTokenSet );
            }
            return this.tokenSet;
        }

        format( pDate, pFormat = _mt_str, pLocale = _mt_str, pTokenSet = null )
        {
            const date = resolveDate( pDate );

            const locale = this.resolveLocale( pLocale );

            const tokenSet = this.resolveTokenSet( pTokenSet );


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

