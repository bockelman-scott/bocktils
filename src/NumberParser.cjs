const constants = require( "./Constants.cjs" );
const typeUtils = require( "./TypeUtils.cjs" );
const stringUtils = require( "./StringUtils.cjs" );

const localeUtils = require( "./LocaleUtils.cjs" );

const _ud = constants?._ud || "undefined";

const $scope = function()
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
            localeUtils
        };

    let _mt_str = constants._mt_str;

    let isString = typeUtils.isString;
    let isNumber = typeUtils.isNumber;
    let isObject = typeUtils.isObject;
    let isNull = typeUtils.isNull;

    let asInt = stringUtils.asInt;
    let asFloat = stringUtils.asFloat;
    let asString = stringUtils.asString;

    let lcase = stringUtils.lcase;
    let isBlank = stringUtils.isBlank;

    constants.importUtilities( this, constants, typeUtils, stringUtils );

    const INTERNAL_NAME = "__BOCK__NUMBER_PARSER__";

    if ( $scope() && (null != $scope()[INTERNAL_NAME]) )
    {
        return $scope()[INTERNAL_NAME];
    }

    const getReForDec = function( pDecimalSeparator )
    {
        const decimalSeparator = asString( pDecimalSeparator );

        if ( decimalSeparator.charCodeAt( 0 ) > 127 )
        {
            // substitute a space for now...
            return " ";
        }
        return ("." === decimalSeparator ? "\\." : decimalSeparator);
    };

    const getReForGrp = function( pGroupingSeparator )
    {
        const groupingSeparator = asString( pGroupingSeparator );

        if ( groupingSeparator.charCodeAt( 0 ) > 127 )
        {
            // substitute a space for now...
            return " ";
        }
        return ("." === groupingSeparator ? "\\." : groupingSeparator);
    };

    /**
     * Class to parse a string as a number, according to the Locale and Intl.NumberFormat Options specified
     * Instances can be created with an existing Intl.NumberFormat
     * or with a Locale and an object to specify the options for an Intl.NumberFormat that will be created
     */
    class NumberParser
    {
        #locale;
        #options;

        #numberFormat;

        /**
         * Creates an instance of this class to parse strings as numbers.
         *
         * @param pLocale {Intl.Locale|string|Intl.NumberFormat} can be either a locale string, an Intl.Locale, or an Intl.NumberFormat
         * @param pOptions {object|Intl.NumberFormat} can be either an object describing Intl.NumberFormat options or an instance of Intl.NumberFormat
         */
        constructor( pLocale, pOptions )
        {
            if ( pLocale instanceof Intl.Locale || isString( pLocale ) )
            {
                this.#locale = localeUtils.resolveLocale( pLocale );
            }
            else if ( pLocale instanceof Intl.NumberFormat )
            {
                this.#numberFormat = pLocale;
                this.#options = Object.assign( {}, this.#numberFormat.resolvedOptions() || pOptions || {} );
                this.#locale = localeUtils.resolveLocale( this.#options.locale );
            }

            if ( pOptions && isObject( pOptions ) )
            {
                if ( pOptions instanceof Intl.NumberFormat )
                {
                    this.#numberFormat = pOptions;
                    this.#options = Object.assign( {}, this.#numberFormat.resolvedOptions() || pOptions || {} );
                    this.#locale = localeUtils.resolveLocale( this.#options.locale || pLocale ) || this.#locale;
                }
                else
                {
                    this.#options = Object.assign( {}, pOptions || {} );
                }
            }

            if ( isNull( this.#numberFormat ) || !(this.#numberFormat instanceof Intl.NumberFormat) )
            {
                this.#numberFormat = new Intl.NumberFormat( this.#locale, this.#options || {} );
            }
        }

        get locale()
        {
            return localeUtils.resolveLocale( this.#locale );
        }

        get options()
        {
            return Object.assign( {}, this.#options || this.#numberFormat?.resolvedOptions() || {} );
        }

        get numberFormat()
        {
            this.#numberFormat = (this.#numberFormat instanceof Intl.NumberFormat) ? this.#numberFormat : new Intl.NumberFormat( this.#locale, this.#options || {} );

            return this.#numberFormat;
        }

        isSupportedNumberingSystem( pNumberingSystem )
        {
            return (isNull( pNumberingSystem ) || isBlank( pNumberingSystem ) || "latn" === lcase( pNumberingSystem ));
        }

        get separators()
        {
            if ( this._separators && Object.keys( this._separators ).length )
            {
                return Object.freeze( this._separators );
            }

            const num = -123456.789;

            const formatter = new Intl.NumberFormat( this.locale?.baseName,
                                                     {
                                                         style: "decimal",
                                                         notation: "standard",
                                                         minimumIntegerDigits: 1,
                                                         minimumFractionDigits: 3,
                                                         useGrouping: true
                                                     } );

            let s = formatter.format( num );

            const indexOfDecimalPoint = s.indexOf( "789" ) - 1;

            const decSeparator = s[indexOfDecimalPoint];

            s = s.slice( 0, indexOfDecimalPoint );

            s = s.replace( /\d/g, "" );

            let minusSign = s.slice( 0, 1 );

            let grpSeparator = s[s.length - 1];

            if ( minusSign === grpSeparator )
            {
                minusSign = "-" === minusSign ? minusSign : "";
                grpSeparator = "-" === grpSeparator ? "" : grpSeparator;
            }

            this._separators =
                {
                    decimalSeparator: decSeparator,
                    groupingSeparator: grpSeparator,
                    negativeSign: minusSign
                };

            return Object.freeze( this._separators );
        }

        get decimalSeparator()
        {
            return asString( this.separators?.decimalSeparator, true ) || ".";
        }

        get groupingSeparator()
        {
            return asString( this.separators?.groupingSeparator, true ) || "";
        }

        get negativeSign()
        {
            return asString( this.separators?.negativeSign, true ) || "-";
        }

        parse( pString )
        {
            const numberFormatter = this.numberFormat;

            if ( isNumber( pString ) )
            {
                const formatted = numberFormatter.format( pString );
                return this.parse( asString( formatted ) );
            }

            const numberingSystem = numberFormatter.numberingSystem;

            if ( !this.isSupportedNumberingSystem( numberingSystem ) )
            {
                throw new Error( "NumberParser does not support numbering systems other than 'latn'" );
            }

            let s = asString( pString, true );

            s = s.replace( /^0+/, "" );

            const re = new RegExp( "[^E\\d" + getReForDec( this.decimalSeparator ) + this.negativeSign + "]", "g" );

            s = s.replace( re, "" );

            // temporarily switch to the internal numeric format expected by parseFloat

            const re2 = new RegExp( getReForDec( this.decimalSeparator ), "g" );

            s = s.replace( re2, "." );

            let num = parseFloat( asString( s, true ) );

            if ( isNaN( num ) )
            {
                return 0;
            }

            return num;
        }
    }

    NumberParser.fromNumberFormat = function( pNumberFormat )
    {
        if ( pNumberFormat instanceof Intl.NumberFormat )
        {
            return new NumberParser( pNumberFormat );
        }
        throw new Error( "NumberParser.fromNumberFormat requires an instance of Intl.NumberFormat" );
    };

    NumberParser.fromLocale = function( pLocale, pOptions )
    {
        if ( isString( pLocale ) || pLocale instanceof Intl.Locale )
        {
            return new NumberParser( pLocale, pOptions || {} );
        }
        throw new Error( "NumberParser.fromLocale requires an instance of Intl.Locale or a string representing a Locale" );
    };

    const mod =
        {
            dependencies,
            classes:
                {
                    NumberParser
                },
            NumberParser,
            parse: function( pString, pLocale, pOptions )
            {
                const parser = new NumberParser( pLocale, pOptions );

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
