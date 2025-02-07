/**
 * Provides functionality similar to Java's SimpleDateFormat.
 * @see https://docs.oracle.com/javase/8/docs/api/java/text/SimpleDateFormat.html
 *
 * This module exposes methods for formatting Date objects as strings.
 */

const core = require( "@toolbocks/core" );

const { constants, typeUtils, stringUtils, arrayUtils, localeUtils } = core;

const tokenSetUtils = require( "./DateFormatTokenSet.cjs" );

const {
    _ud = "undefined",
    $scope = core?.$scope || constants?.$scope || function()
    {
        return (_ud === typeof self ? ((_ud === typeof global) ? ((_ud === typeof globalThis ? {} : globalThis)) : (global || {})) : (self || {}));
    }
} = constants;

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
            localeUtils
        };

    const { _mt_str, _mt_chr, lock, classes } = constants;

    const { ModulePrototype } = classes;

    const modulePrototype = new ModulePrototype( "DateFormatter", INTERNAL_NAME );

    const { isNull, isDate, isNumeric, isString, isArray, isObject, isNonNullObject } = typeUtils;

    const { asString, asInt } = stringUtils;

    const { includesAny } = arrayUtils;

    const { classes: TokenSetClasses, getDefaultTokenSet, SUPPORTED_INTL_OPTIONS } = tokenSetUtils;

    const { TokenSet, Token } = TokenSetClasses;

    const { resolveLocale, isSameLocale } = localeUtils;

    const DEFAULT_LOCALE = lock( new Intl.Locale( "en-US" ) );

    const DEFAULT_TOKEN_SET = lock( getDefaultTokenSet() );

    const DEFAULT_FORMAT = "MM/dd/yyyy hh:mm:ss";

    const resolveDate = ( pDate ) => isDate( pDate ) ? pDate : isNumeric( pDate ) ? new Date( asInt( pDate ) ) : new Date();

    class DateFormatter
    {
        #locale = DEFAULT_LOCALE;
        #tokenSet = DEFAULT_TOKEN_SET;

        #pattern = DEFAULT_FORMAT;
        #options = null;

        #useIntlDateFormat = false;

        constructor( pFormat = DEFAULT_FORMAT, pLocale = DEFAULT_LOCALE, pTokenSet = DEFAULT_TOKEN_SET )
        {
            this.#locale = lock( resolveLocale( pLocale, pTokenSet ) );

            this.#tokenSet = lock( (pTokenSet instanceof TokenSet) ? pTokenSet : getDefaultTokenSet( this.#locale ) );

            this.#pattern = isString( pFormat ) ? asString( pFormat ) : isNonNullObject( pFormat ) ? pFormat?.pattern : DEFAULT_FORMAT;

            this.#options = isString( pFormat ) ?
                { pattern: pFormat, locale: this.#locale, tokenSet: this.#tokenSet } :
                            (isNonNullObject( pFormat ) ? (isArray( pFormat ) ? [...pFormat] : { ...pFormat }) :
                                { pattern: DEFAULT_FORMAT, locale: this.#locale, tokenSet: this.#tokenSet });

            this.#useIntlDateFormat = !isString( pFormat ) &&
                                      isNonNullObject( pFormat ) &&
                                      (includesAny( Object.keys( pFormat || {} ),
                                                    ["dateStyle", "timeStyle", ...SUPPORTED_INTL_OPTIONS] ));
        }

        static get [Symbol.species]()
        {
            return this;
        }

        /**
         *
         * @returns {Readonly<Intl.Locale>}
         */
        get locale()
        {
            return lock( resolveLocale( this.#locale ) );
        }

        get tokenSet()
        {
            this.#tokenSet = lock( (this.#tokenSet instanceof TokenSet) ? this.#tokenSet : getDefaultTokenSet( this.locale ) );
            if ( !isSameLocale( this.#tokenSet.locale, this.#locale ) )
            {
                this.#tokenSet = new TokenSet( this.locale, this.#tokenSet.options );
            }
            return lock( this.#tokenSet || getDefaultTokenSet( this.locale ) );
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

            return characters.join( _mt_chr );
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

            return lock( obj );
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
            return lock( Object.assign( {}, this.#options ) );
        }

        resolveTokenSet( pTokenSet )
        {
            if ( pTokenSet instanceof TokenSet )
            {
                return lock( pTokenSet );
            }
            return this.tokenSet;
        }

        processFormat( pFormat, pTokenSet )
        {
            const pattern = (isString( pFormat ) ? pFormat || this.pattern : (isNonNullObject( pFormat ) ? pFormat?.pattern || this.pattern : _mt_str)) || this.pattern;

            let arr = (asString( pattern ) || DEFAULT_FORMAT).split( _mt_chr );

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

                return format.join( _mt_str );
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

    let mod =
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

    mod = modulePrototype.extend( mod );

    return mod.expose( mod, INTERNAL_NAME, (_ud !== typeof module ? module : mod) ) || mod;

}());
