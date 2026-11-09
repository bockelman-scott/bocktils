// noinspection JSCheckFunctionSignatures

const moduleUtils = require( "./_ToolBocksModule.cjs" );
const constants = require( "./Constants.cjs" );
const typeUtils = require( "./TypeUtils.cjs" );
const stringUtils = require( "./StringUtils.cjs" );
const localeUtils = require( "./LocaleUtils.cjs" );

const { _ud = "undefined", $scope = moduleUtils.$scope } = constants;

(function exposeModule()
{
    const INTERNAL_NAME = "__BOCK__NUMBER_PARSER__";

    if ( $scope() && (null != $scope()[INTERNAL_NAME]) )
    {
        return $scope()[INTERNAL_NAME];
    }

    const { ToolBocksModule, attempt, lock } = moduleUtils;

    const { _mt, _spc, _dot, _comma, _minus, _latin = "latn", S_ERROR } = constants;

    const
        {
            isNull,
            isObject,
            isNonNullObject,
            isNumber,
            isString,
            isHex,
            isOctal,
            isBinary,
            isDecimal,
            isNanOrInfinite
        } = typeUtils;

    const { asString, asFloat, lcase, isBlank } = stringUtils;

    const { resolveLocale } = localeUtils;

    const dependencies =
        {
            moduleUtils,
            constants,
            typeUtils,
            stringUtils,
            localeUtils
        };

    const modName = "NumberParser";

    const toolBocksModule = new ToolBocksModule( modName, INTERNAL_NAME );

    const calculateErrorSourceName = function( pModule = modName, pFunction )
    {
        return toolBocksModule.calculateErrorSourceName( pModule, pFunction );
    };

    const getReForDec = function( pDecimalSeparator )
    {
        const decimalSeparator = asString( pDecimalSeparator );

        if ( decimalSeparator.charCodeAt( 0 ) > 127 )
        {
            // substitute a space for now...
            return _spc;
        }
        return (_dot === decimalSeparator ? "\\." : decimalSeparator);
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
                this.#locale = resolveLocale( pLocale );
            }
            else if ( pLocale instanceof Intl.NumberFormat )
            {
                this.#numberFormat = pLocale;
                this.#options = Object.assign( {}, this.#numberFormat.resolvedOptions() || pOptions || {} );
                this.#locale = resolveLocale( this.#options.locale );
            }

            if ( pOptions && isObject( pOptions ) )
            {
                if ( pOptions instanceof Intl.NumberFormat )
                {
                    this.#numberFormat = pOptions;
                    this.#options = Object.assign( {}, this.#numberFormat.resolvedOptions() || pOptions || {} );
                    this.#locale = resolveLocale( this.#options.locale || pLocale ) || this.#locale;
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

        static get [Symbol.species]()
        {
            return this;
        }

        get locale()
        {
            return resolveLocale( this.#locale );
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
            return (isNull( pNumberingSystem ) || isBlank( pNumberingSystem ) || _latin === lcase( pNumberingSystem ));
        }

        get separators()
        {
            if ( this._separators && Object.keys( this._separators || {} ).length )
            {
                return lock( this._separators );
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

            s = s.replace( /\d/g, _mt );

            let minusSign = s.slice( 0, 1 );

            let grpSeparator = s[s.length - 1];

            if ( minusSign === grpSeparator )
            {
                minusSign = _minus === minusSign ? minusSign : _mt;
                grpSeparator = _minus === grpSeparator ? _mt : grpSeparator;
            }

            this._separators =
                {
                    decimalSeparator: decSeparator,
                    groupingSeparator: grpSeparator,
                    negativeSign: minusSign
                };

            return lock( this._separators );
        }

        get decimalSeparator()
        {
            return asString( this.separators?.decimalSeparator, true ) || _dot;
        }

        get groupingSeparator()
        {
            return asString( this.separators?.groupingSeparator, true ) || _comma;
        }

        get negativeSign()
        {
            return asString( this.separators?.negativeSign, true ) || _minus;
        }

        parse( pString )
        {
            const numberFormatter = this.numberFormat;

            if ( isNumber( pString ) )
            {
                const formatted = numberFormatter.format( pString );
                return this.parse( asString( formatted ) );
            }

            let s = asString( pString, true );

            const numberingSystem = numberFormatter.numberingSystem || _latin;

            if ( !this.isSupportedNumberingSystem( numberingSystem ) )
            {
                const msg = `NumberParser does not support numbering systems other than '${_latin}'`;

                toolBocksModule.reportError( new Error( msg ), msg, S_ERROR, calculateErrorSourceName( modName, "parse" ), pString );

                let n = 0;

                try
                {
                    n = parseFloat( pString );
                }
                catch( ex )
                {
                    // ignore this one, since we just reported the root cause
                }

                return n;
            }

            // remove leading zeroes, unless the value appears to be a hexadecimal or octal value
            if ( isDecimal( s ) )
            {
                s = s.replace( /^0+/, _mt );
            }

            const rxDecimalPoint = getReForDec( this.decimalSeparator );

            // remove any character that is not a digit, the decimal separator or a minus sign (or if hex, x, or octal, o)
            const re = new RegExp( "[^E\\d" + (isHex( s ) ? "x" : _mt) + (isOctal( s ) ? "o" : _mt) + (isBinary( s ) ? "b" : _mt) + rxDecimalPoint + this.negativeSign + "]", "gi" );

            s = s.replace( re, _mt );

            // switch to the internal numeric format expected by parseFloat
            const re2 = new RegExp( rxDecimalPoint, "g" );

            s = s.replace( re2, _dot );

            let num = 0;

            try
            {
                num = parseFloat( asString( s, true ) );
            }
            catch( ex )
            {
                toolBocksModule.reportError( new Error( ex ), ex.message, S_ERROR, calculateErrorSourceName( modName, "parse->parseFloat" ), pString, s );
            }

            if ( isNaN( num ) )
            {
                return 0;
            }

            return num;
        }

        percentToDecimal( pValue )
        {
            const num = this.parse( pValue );
            if ( !isNanOrInfinite( num ) )
            {
                return asFloat( num / 100.00 );
            }
            return 0;
        }

        decimalToPercent( pValue )
        {
            const num = this.parse( pValue );
            if ( !isNanOrInfinite( num ) )
            {
                return asFloat( num * 100.00 );
            }
            return 0;
        }
    }

    NumberParser.fromNumberFormat = function( pNumberFormat )
    {
        if ( pNumberFormat instanceof Intl.NumberFormat )
        {
            return new NumberParser( pNumberFormat, pNumberFormat.resolvedOptions() );
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

    function pctToDec( pValue, pLocale = "en_US" )
    {
        if ( isNumber( pValue ) && !isNanOrInfinite( pValue ) )
        {
            return asFloat( pValue / 100.00 );
        }

        const numberParser = attempt( () => new NumberParser( pLocale ) );

        if ( isNonNullObject( numberParser ) )
        {
            return numberParser.percentToDecimal( pValue );
        }

        return asFloat( (asFloat( pValue ) / 100.00) );
    }

    function decToPct( pValue, pLocale = "en_US" )
    {
        if ( isNumber( pValue ) && !isNanOrInfinite( pValue ) )
        {
            return asFloat( pValue * 100.00 );
        }

        const numberParser = attempt( () => new NumberParser( pLocale ) );

        if ( isNonNullObject( numberParser ) )
        {
            return numberParser.decimalToPercent( pValue );
        }

        return asFloat( (asFloat( pValue ) * 100.00) );
    }

    let mod =
        {
            dependencies,
            classes:
                {
                    NumberParser
                },
            NumberParser,
            pctToDec,
            decToPct
        };

    mod = toolBocksModule.extend( mod );

    return mod.expose( mod, INTERNAL_NAME, (_ud !== typeof module ? module : mod) ) || mod;

}());
