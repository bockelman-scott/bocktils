const utils = require( "./CommonUtils.cjs" );

/**
 * Establish separate constants for each of the common utilities imported
 * @see ../utils/CommonUtils.cjs
 */
const constants = utils?.constants || require( "./Constants.cjs" );
const typeUtils = utils?.typeUtils || require( "./TypeUtils.cjs" );
const stringUtils = utils?.stringUtils || require( "./StringUtils.cjs" );
const arrayUtils = utils?.arrayUtils || require( "./ArrayUtils.cjs" );
const objectUtils = utils?.objectUtils || require( "./ObjectUtils.cjs" );

const konsole = console || {};

const _ud = constants?._ud || "undefined";

const $scope = utils?.$scope || function()
{
    return (_ud === typeof self ? ((_ud === typeof global) ? ((_ud === typeof globalThis ? {} : globalThis)) : (global || {})) : (self || {}));
};

(function exposeDateUtils()
{
    let
        {
            _mt_str = constants._mt_str || "",
            _mt_chr = constants._mt_chr || "",
            _num = constants._num || "number",
            _big = constants._big || "bigint",
            _str = constants._str || "string",
            _spc = constants._spc || " ",
            asString = stringUtils.asString || function( s ) { return (_mt_str + s).trim(); },
            isNumber = objectUtils.isNumber || function( s ) { return [_num, _big].includes( typeof s ) || /[\d.,]/.test( s ); },
            isString = objectUtils.isString || function( s ) { return _str === typeof s; },
            ucase = stringUtils.ucase || function( s ) { return asString( s, true ).toUpperCase(); },
            asInt = stringUtils.asInt || function( s ) { return isNumber( s ) ? parseInt( s, 10 ) : 0; },
            asFloat = stringUtils.asFloat || function( s ) { return isNumber( s ) ? parseFloat( s ) : 0; },
            isDate = objectUtils.isDate || function( pVal ) { return pVal instanceof Date; }
        } = utils;

    utils.importUtilities( this, constants, stringUtils, arrayUtils, objectUtils );

    const INTERNAL_NAME = "__BOCK__DATE_UTILS__";

    if ( $scope() && (null != $scope()[INTERNAL_NAME]) )
    {
        return $scope()[INTERNAL_NAME];
    }

    const MILLISECOND = 1;
    const MILLIS_PER_SECOND = (1_000 * MILLISECOND);
    const MILLIS_PER_MINUTE = (60 * MILLIS_PER_SECOND);
    const MILLIS_PER_HOUR = (60 * MILLIS_PER_MINUTE);
    const MILLIS_PER_DAY = (24 * MILLIS_PER_HOUR);
    const MILLIS_PER_WEEK = (7 * MILLIS_PER_DAY);
    const MILLIS_PER_YEAR = Math.floor( 365.25 * MILLIS_PER_DAY );

    const MILLIS_PER =
        {
            SECOND: MILLIS_PER_SECOND,
            MINUTE: MILLIS_PER_MINUTE,
            HOUR: MILLIS_PER_HOUR,
            DAY: MILLIS_PER_DAY,
            WEEK: MILLIS_PER_WEEK,
            YEAR: MILLIS_PER_YEAR
        };

    const ONE_MINUTE = MILLIS_PER_MINUTE;
    const TWO_MINUTES = MILLIS_PER_MINUTE * 2;
    const FIVE_MINUTES = MILLIS_PER_MINUTE * 5;
    const TEN_MINUTES = MILLIS_PER_MINUTE * 10;
    const TWENTY_MINUTES = MILLIS_PER_MINUTE * 20;
    const THIRTY_MINUTES = MILLIS_PER_MINUTE * 30;
    const FORTY_FIVE_MINUTES = MILLIS_PER_MINUTE * 45;

    const ONE_HOUR = MILLIS_PER_HOUR;
    const TWO_HOURS = MILLIS_PER_HOUR * 2;
    const SIX_HOURS = MILLIS_PER_HOUR * 6;
    const EIGHT_HOURS = MILLIS_PER_HOUR * 8;
    const TWELVE_HOURS = MILLIS_PER_HOUR * 12;

    const ONE_DAY = MILLIS_PER_DAY;

    const calculateMillisPer = function( pNum, pInterval )
    {
        const interval = isNumber( pInterval ) ? pInterval : (isString( pInterval ) ? MILLIS_PER[ucase( asString( pInterval ) )] : MILLISECOND);

        const FIVE_THOUSAND_YEARS = 5_000 * MILLIS_PER_YEAR;

        let num = isNumber( pNum ) && !isNaN( pNum ) && isFinite( pNum ) ? Math.min( pNum, FIVE_THOUSAND_YEARS ) : asFloat( asString( pNum ) );

        num = isNumber( num ) && !isNaN( num ) && isFinite( num ) ? Math.min( num, FIVE_THOUSAND_YEARS ) : 1;

        return Math.floor( num * interval );
    };

    const correctCentury = function( pYear )
    {
        let year = asInt( asString( pYear ).trim() );

        if ( year <= 0 )
        {
            year = new Date().getFullYear();
        }
        else if ( year < 100 )
        {
            year = (2000 + year);
        }
        else if ( year < 1000 )
        {
            const s = ("2" + asString( year ).padStart( 3, "0" ));
            year = parseInt( s );
        }

        return year;
    };

    const parseDateWithoutSeparator = function( pDateString, pFormat )
    {
        const str = asString( pDateString ).trim();

        // noinspection SpellCheckingInspection
        const format = ucase( asString( pFormat ) || "MMDDYYYY" );

        let fmt = format.split( _mt_chr );

        let tokens =
            {
                "M": {},
                "D": {},
                "Y": {}
            };

        let token = {};

        for( let i = 0, n = fmt.length; i < n; i++ )
        {
            let c = ucase( asString( fmt[i] ).trim() );

            token = tokens[c];

            token.position = i;
            token.length = 1;

            let m = i;

            while ( c === fmt[++m] && i < n )
            {
                token.length += 1;
            }

            i += (token.length - 1);
        }

        token = tokens["Y"];
        let year = asInt( str.slice( token.position, token.position + token.length ) );
        year = correctCentury( year );

        token = tokens["M"];
        let month = asInt( str.slice( token.position, token.position + token.length ) );
        month -= 1; // months are 0-based on the Date constructor

        token = tokens["D"];
        let day = asInt( str.slice( token.position, token.position + token.length ) );

        return new Date( year, month, day );
    };

    const parseDate = function( pDateString, pFormat )
    {
        const str = asString( pDateString ).trim();

        const format = asString( pFormat ) || "MM/DD/YYYY";

        const rx = /([\/. -])/g;

        let separators = [];

        let matches = rx.exec( format );

        if ( matches && matches.length > 1 )
        {
            // first element matches the entire string

            for( let i = 1, n = matches.length; i < n; i++ )
            {
                separators.push( asString( matches[i] ).trim() );
            }
        }

        if ( separators.length <= 0 )
        {
            return parseDateWithoutSeparator( str, format );
        }

        let year = 0;
        let month = 0;
        let day = 0;

        const formatParts = format.split( rx );

        for( let i = 0, n = formatParts.length; i < n; i++ )
        {
            let part = ucase( asString( formatParts[i] ).trim() );

            let pos = format.indexOf( part );
            let len = part.length;
            let val = asInt( str.slice( pos, pos + len ) );

            switch ( part )
            {
                case "MM":
                case "M":
                    month = asInt( val || 0, 0 );
                    break;

                case "DD":
                case "D":
                    day = asInt( val || 0, 0 );
                    break;

                case "YYYY":
                case "YY":
                case "Y":
                    year = asInt( (val || new Date().getFullYear()), 2000 );
                    break;
            }
        }

        year = correctCentury( year );
        month -= 1; // months are 0-based on the Date constructor

        return new Date( year, month, day );
    };

    const parseTime = function( pTimeString, pFormat )
    {
        // TODO:
        return _mt_str;
    };

    const parseDateTime = function( pDateTimeString, pFormat )
    {
        if ( isDate( pDateTimeString ) )
        {
            return pDateTimeString;
        }

        // TODO:
        // separate the format into date and time parts

        let date = parseDate( pDateTimeString, pFormat );
        let time = parseTime( pDateTimeString, pFormat );

        // set the time portion of the data to the time and return it;

        return asString( date ).trim() + _spc + asString( time ).trim();
    };

    const formatDate = function( pDate, pFormat )
    {
        switch ( pFormat )
        {
            case _ud:
                return pDate.toLocaleString();

            case "YYYY-MM-DD":
            case "yyyy-mm-dd":
                return asString( pDate.getFullYear(), true ) + "-" + asString( (pDate.getMonth() + 1), true ).padStart( 2, "0" ) + asString( pDate.getDate(), true ).padStart( 2, "0" );

            default:
                // TODO:  my old logic
                return pDate.toLocaleString();
        }
    };

    try
    {
        Date.parse = parseDate;
    }
    catch( ex )
    {
        // never mind, this environment does not allow extending built-ins
    }

    const mod =
        {
            formatDate,
            parseDate,
            parseTime,
            parseDateTime,
            parse: parseDateTime,
            MILLIS_PER,
            calculateMillisPer,
            ONE_MINUTE,
            TWO_MINUTES,
            FIVE_MINUTES,
            TEN_MINUTES,
            TWENTY_MINUTES,
            THIRTY_MINUTES,
            FORTY_FIVE_MINUTES,
            ONE_HOUR,
            TWO_HOURS,
            SIX_HOURS,
            EIGHT_HOURS,
            TWELVE_HOURS,
            ONE_DAY
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
