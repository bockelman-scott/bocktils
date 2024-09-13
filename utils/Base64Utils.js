const constants = require( "./Constants.js" );
const stringUtils = require( "./StringUtils.js" );
const arrayUtils = require( "./ArrayUtils.js" );
const objectUtils = require( "./ObjectUtils.js" );

const _ud = constants?._ud || "undefined";

const $scope = constants?.$scope || function()
{
    return (_ud === typeof self ? ((_ud === typeof global) ? {} : (global || {})) : (self || {}));
};

(function exposeBase64Utils()
{
    /**
     * This statement makes all the values exposed by the imported modules local variables in the current scope.
     */
    constants.importUtilities( this, constants, stringUtils, arrayUtils, objectUtils );

    const INTERNAL_NAME = "__BOCK__BASE64_UTILS__";

    if ( $scope() && (null != $scope()[INTERNAL_NAME]) )
    {
        return $scope()[INTERNAL_NAME];
    }

    const validEncodings = Object.freeze( ["ascii", "utf8", "utf-8", "utf16le", "utf-16le", "ucs2", "ucs-2", "base64", "base64url", "latin1", "binary", "hex"] );

    const cleanBase64 = function( pStr, pOptions )
    {
        const options = Object.assign( { replacements: [[/ /g, "+"],[/ /,"+"]] }, pOptions || {} );

        let replacements = (asArray( options.replacements || [[/ /g,"+"],[/ /, "+"]] ) || [[/ /g, "+"],[/ /,"+"]]).filter( e => Array.isArray( e ) && 2 === e.length );

        replacements = ((replacements?.length || 0) <= 0) || asArray( replacements[0] || [] ).length !== 2 ? [[/ /g, "+"]] : replacements;

        let str = asString( pStr, true ).replaceAll( /[\r\n]+/g, _mt_str );

        str = asString( str, true ).replaceAll( new RegExp("\\\\r|\\\\n", "g"), _mt_str );

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

    const isValidBase64 = function( pStr )
    {
        const str = asString( pStr );

        return (0 === ((str?.length || 0) % 4)) && !(/[ \r\n]/.test( str ));
    };

    function toBytes( pStr, pOptions )
    {
        const str = cleanBase64( asString( pStr, true ), pOptions );

        return Buffer.from( str, "base64" );
    }

    function toText( pBytes, pEncoding )
    {
        const buffer = Buffer.from( pBytes );

        let encoding = asString( pEncoding, true ).toLowerCase();

        encoding = validEncodings.includes( encoding ) ? encoding : "utf-8";

        return buffer.toString( encoding );
    }

    function bufferToTypedArray( pBuffer )
    {
        return new Uint8Array( pBuffer );
    }

    function typedArrayToBuffer( pArray )
    {
        return Buffer.from( pArray );
    }

    class Base64Base
    {
        constructor( pStr, pBytes, pEncoding )
        {
            this._text = cleanBase64( stringUtils.asString( pStr, true ) );
            this._bytes = pBytes || new Uint8Array( this.toBinary( this._text ) );

            let encoding = stringUtils.asString( pEncoding, true ).toLowerCase();
            encoding = validEncodings.includes( encoding ) ? encoding : "utf-8";

            this._encoding = encoding;
        }

        clean( pStr, pOptions )
        {
            let str = (_str === typeof pStr) ? (pStr.replaceAll( /[\r\n]/g, _mt_str )) : pStr;

            str = stringUtils.asString( str, true ) || this._text || constants._mt_str;

            return cleanBase64( str, pOptions );
        }

        isValid( pStr )
        {
            const str = stringUtils.asString( pStr, false ) || this._text || constants._mt_str;
            return isValidBase64( str );
        }

        toBinary( pStr, pOptions )
        {
            const str = this.clean( stringUtils.asString( pStr, true ) || this._text || constants._mt_str, pOptions );
            return toBytes( str );
        }

        toBuffer( pStr )
        {
            const str = this.clean( stringUtils.asString( pStr, true ) || this._text || constants._mt_str );
            return typedArrayToBuffer( this.toBinary( str ) );
        }

        fromBuffer( pBuffer )
        {
            return bufferToTypedArray( pBuffer );
        }

        toBase64( pBytes, pEncoding )
        {
            const bytes = pBytes || this._bytes || new Uint8Array( this.toBinary( this._text ) );

            let encoding = lcase( asString( asString( (pEncoding) || asString( this._encoding ) ), true ) );

            encoding = validEncodings.includes( encoding ) ? encoding : "utf-8";

            return this.clean( toText( bytes, encoding ) );
        }
    }

    /**
     * This class supports converting binary data into Base64
     */
    class Base64Encoder extends Base64Base
    {
        constructor( pBytes )
        {
            super( constants._mt_str, pBytes, "ascii" );
        }

        encode()
        {
            return this.toBase64( this._bytes, this._encoding );
        }
    }

    /**
     * This class supports converting Base64 encoded data (strings) into bytes
     */
    class Base64Decoder extends Base64Base
    {
        constructor( pStr, pBytes, pEncoding )
        {
            super( pStr, pBytes, (pEncoding || "ascii") );
        }

        decode()
        {
            return this.toBinary();
        }
    }

    const mod =
        {
            classes: { Base64Encoder, Base64Decoder },
            Base64Encoder,
            Base64Decoder,
            validEncodings,
            toText,
            toBytes,
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
