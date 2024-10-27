
/**
 * Provides functionality similar to Java's SimpleDateFormat.
 * @see https://docs.oracle.com/javase/8/docs/api/java/text/SimpleDateFormat.html
 *
 * This module exposes methods for formatting Date objects as strings.
 */

const utils = require( "./CommonUtils.cjs" );

const tokenSet = require( "./DateFormatTokenSet.cjs" );

const dependencies = tokenSet.dependencies;

const constants = dependencies?.constants || utils.constants || require( "./Constants.cjs" );
const typeUtils = dependencies?.typeUtils || utils.typeUtils || require( "./TypeUtils.cjs" );
const stringUtils = dependencies?.stringUtils || utils.stringUtils || require( "./StringUtils.cjs" );
const arrayUtils = dependencies?.arrayUtils || utils.arrayUtils || require( "./ArrayUtils.cjs" );
const objectUtils = dependencies?.objectUtils || utils.objectUtils || require( "./ObjectUtils.cjs" );

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
            objectUtils
        };

    let isDate = typeUtils.isDate;
    let isNumber = typeUtils.isNumber;

    constants.importUtilities( this, constants, typeUtils, stringUtils, arrayUtils, objectUtils );

    const INTERNAL_NAME = "__BOCK__DATE_FORMATTER__";

    if ( $scope() && (null != $scope()[INTERNAL_NAME]) )
    {
        return $scope()[INTERNAL_NAME];
    }

    const DEFAULT_FORMAT = "MM/dd/yyyy hh:mm:ss";

    const resolveDate = function( pDate )
    {
        return isDate( pDate ) ? pDate : isNumber( pDate ) ? new Date( pDate ) : new Date();
    };

    const processFormat = function( pFormat = DEFAULT_FORMAT, pTokenSet = tokenSet.getDefaultTokenSet() )
    {
        let arr = (asString( pFormat ) || DEFAULT_FORMAT).split( constants._mt_chr );

        const tokenSet = pTokenSet || tokenSet.getDefaultTokenSet();

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

    const format = function( pDate, pFormat = DEFAULT_FORMAT, pTokenSet = tokenSet.getDefaultTokenSet() )
    {
        const date = resolveDate( pDate );

        let format = processFormat( pFormat, pTokenSet );

        format = format.map( e => e.format( date ) );

        return format.join( constants._mt_str );
    };

    const mod =
        {
            dependencies,
            format,
            resolveDate
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

