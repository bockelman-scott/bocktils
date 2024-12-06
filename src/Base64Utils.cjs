/**
 * This statement imports the common utils modules:
 * Constants, TypeUtils, StringUtils, ArrayUtils, ObjectUtils, and JsonUtils
 */
const utils = require( "./CommonUtils.cjs" );

/**
 * Establish separate constants for each of the common utilities imported
 * @see ../src/CommonUtils.cjs
 */
const constants = utils?.constants || require( "./Constants.cjs" );

const typeUtils = utils?.typeUtils || require( "./TypeUtils.cjs" );
const stringUtils = utils?.stringUtils || require( "./StringUtils.cjs" );
const arrayUtils = utils?.arrayUtils || require( "./ArrayUtils.cjs" );
const objectUtils = utils?.objectUtils || require( "./ObjectUtils.cjs" );

const _ud = constants?._ud || "undefined";

const $scope = constants?.$scope || function()
{
    return (_ud === typeof self ? ((_ud === typeof global) ? {} : (global || {})) : (self || {}));
};

(function exposeModule()
{
    const INTERNAL_NAME = "__BOCK__BASE64_UTILS__";

    if ( $scope() && (null != $scope()[INTERNAL_NAME]) )
    {
        return $scope()[INTERNAL_NAME];
    }

    let _mt_str = constants._mt_str;

    let { asString, lcase } = stringUtils;

    let asArray = arrayUtils.asArray;

    const base64 = "base64";

    const utf8 = "utf-8";

    const DEFAULT_TEXT_ENCODING = utf8;

    const validEncodings = Object.freeze( ["ascii", "utf8", utf8, "utf16le", "utf-16le", "ucs2", "ucs-2", base64, "base64url", "latin1", "binary", "hex"] );

    const DEFAULT_BASE64_OPTIONS = Object.freeze( { replacements: [[/ /g, "+"], [/ /, "+"]] } );

    /**
     * Returns a valid base64 encoded string by replacing spaces with '+'
     * and ensuring that the number of characters is a multiple of 4
     * @param pStr {string} a base64 encoded value
     * @param pOptions {object} optional object to specify the replacement characters
     * @returns {string} a valid base64 encoded value
     */
    const cleanBase64 = function( pStr, pOptions = DEFAULT_BASE64_OPTIONS )
    {
        let options = Object.assign( {}, DEFAULT_BASE64_OPTIONS );
        options = Object.assign( options, pOptions || {} );

        let replacements = (asArray( options.replacements || [[/ /g, "+"], [/ /, "+"]] ) || [[/ /g, "+"], [/ /, "+"]]).filter( e => Array.isArray( e ) && 2 === e.length );

        replacements = ((replacements?.length || 0) <= 0) || asArray( replacements[0] || [] ).length !== 2 ? [[/ /g, "+"]] : replacements;

        let str = asString( pStr, true ).replaceAll( /[\r\n]+/g, _mt_str );

        str = asString( str, true ).replaceAll( new RegExp( "\\\\r|\\\\n", "g" ), _mt_str );

        for( let i = 0, n = replacements.length; i < n; i++ )
        {
            const replacement = replacements[i];

            const searchExpression = replacement[0] || / /g;

            const replaceString = replacement[1] || "+";

            str = str.replace( searchExpression, replaceString );
        }

        let loopCap = new objectUtils.IterationCap( 8 );

        while ( str.length % 4 !== 0 && str.endsWith( "=" ) && !loopCap.reached )
        {
            str = str.slice( 0, str.length - 1 );
        }

        while ( str.length % 4 !== 0 )
        {
            str += "=";
        }

        return str.trim();
    };

    /**
     * Returns true if the specified string is valid base64 encoded content
     * @param pStr {string} a string to evaluate
     * @returns {boolean} true if the specified string is valid base64 encoded content
     */
    const isValidBase64 = function( pStr )
    {
        const str = asString( pStr );

        return (0 === ((str?.length || 0) % 4)) && !(/[ \r\n]/.test( str ));
    };

    function resolveEncoding( pEncoding )
    {
        let encoding = lcase( asString( pEncoding, true ) );
        return validEncodings.includes( encoding ) ? encoding : utf8;
    }

    /**
     * Returns a Buffer of bytes corresponding to the content encoded in base 64
     * @param pStr {string} a base64 encoded value
     * @param pOptions {object} (optional) an object specifying the options
     * to use when cleaning/validating the base 64 string
     * @returns {Buffer} a Buffer of bytes corresponding to the content encoded in base 64
     */
    function toBytes( pStr, pOptions = DEFAULT_BASE64_OPTIONS )
    {
        const str = cleanBase64( asString( pStr, true ), pOptions );

        return Buffer.from( str, base64 );
    }

    /**
     * Returns a base64 encoded string corresponding to the Array-like argument pBytes
     * @param pBytes {Array|Buffer|ArrayBuffer|SharedArrayBuffer|string} an array-like value to encode
     * @returns {string} a base64 encoded string corresponding to the Array-like argument pBytes
     */
    function toBase64( pBytes )
    {
        let bytes = pBytes || [];

        const buffer = Buffer.from( bytes );

        return cleanBase64( buffer.toString( base64 ) );
    }

    function toString( pBase64Text, pEncoding = DEFAULT_TEXT_ENCODING )
    {
        const str = typeUtils.isString( pBase64Text ) ? cleanBase64( asString( pBase64Text, true ) ) : toBase64( pBase64Text, pEncoding );

        const buffer = Buffer.from( str, base64 );

        return buffer.toString( resolveEncoding( pEncoding ) );
    }

    const mod =
        {
            dependencies:
                {
                    constants,
                    stringUtils,
                    arrayUtils,
                    objectUtils
                },
            validEncodings,
            toBase64,
            toBytes,
            toString,
            isValidBase64,
            cleanBase64
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
