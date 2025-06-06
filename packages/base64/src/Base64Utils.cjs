/**
 * This statement imports the core modules:
 * Constants, TypeUtils, StringUtils, and ArrayUtils
 */
const core = require( "@toolbocks/core" );

/**
 * Establish separate constants for each of the common utilities imported
 * @see ../src/CommonUtils.cjs
 */
const { moduleUtils, constants, typeUtils, stringUtils, arrayUtils } = core;

const {
    _ud = "undefined", $scope = constants?.$scope || function()
    {
        return (_ud === typeof self ? ((_ud === typeof global) ? {} : (global || {})) : (self || {}));
    }
} = constants;

// noinspection FunctionTooLongJS
(function exposeModule()
{
    const INTERNAL_NAME = "__BOCK__BASE64_UTILS__";

    if ( $scope() && (null != $scope()[INTERNAL_NAME]) )
    {
        return $scope()[INTERNAL_NAME];
    }

    const DEBUG = false;

    const {
        ToolBocksModule,
        IterationCap,
        populateOptions,
        lock,
        attempt
    } = moduleUtils;

    const {
        _mt_str,
        _rxNullTerminator,
        _slash,
        _underscore,
        _comma,
        _ALPHABET_ENGLISH_UCASE,
        _ALPHABET_ENGLISH_LCASE,
        _DIGIT_CHARACTERS
    } = constants;

    const { isNull, isString, isEmptyString, isFunction } = typeUtils;

    const { isBlank, asString, asInt, ucase, lcase } = stringUtils;

    const { asArray } = arrayUtils;


    const modName = "Base64Utils";

    const toolBocksModule = new ToolBocksModule( modName, INTERNAL_NAME );


    const BASE64 = "base64";

    const UTF8 = "utf-8";

    const DEFAULT_TEXT_ENCODING = UTF8;

    const validEncodings = lock( ["ascii", "utf8", UTF8, "utf16le", "utf-16le", "ucs2", "ucs-2", BASE64, "base64url", "latin1", "binary", "hex"] );

    const DEFAULT_CHAR_62 = "+";
    const DEFAULT_CHAR_63 = "/";
    const DEFAULT_PADDING_CHAR = "=";

    const PADDING =
        {
            OPTIONAL: 0,
            MANDATORY: 1,
            NONE: 99
        };

    const DEFAULT_BASE64_OPTIONS = lock(
        {
            replacements: [[/ /g, DEFAULT_CHAR_62], [/ /, DEFAULT_CHAR_62]],
            padding: PADDING.OPTIONAL,
            paddingCharacter: DEFAULT_PADDING_CHAR
        } );

    const DEFAULT_BASE64_ALPHABET =
        [
            _ALPHABET_ENGLISH_UCASE,
            _ALPHABET_ENGLISH_LCASE,
            _DIGIT_CHARACTERS,
            DEFAULT_CHAR_62,
            DEFAULT_CHAR_63,
            DEFAULT_PADDING_CHAR
        ].join( _mt_str );

    const SUPPORTED_VARIANTS = lock(
        {
            "4648": lock(
                {
                    alphabet: DEFAULT_BASE64_ALPHABET,
                    padding: PADDING.OPTIONAL
                } ),
            "4648_URL": lock(
                {
                    alphabet: DEFAULT_BASE64_ALPHABET.replace( _slash, _underscore ),
                    padding: PADDING.OPTIONAL
                } ),
            "1421": lock(
                {
                    alphabet: DEFAULT_BASE64_ALPHABET,
                    padding: PADDING.MANDATORY
                } ),
            "2045": lock(
                {
                    alphabet: DEFAULT_BASE64_ALPHABET,
                    padding: PADDING.MANDATORY
                } ),
            "2152": lock(
                {
                    alphabet: DEFAULT_BASE64_ALPHABET,
                    padding: PADDING.NONE
                } ),
            "3501": lock(
                {
                    alphabet: DEFAULT_BASE64_ALPHABET.replace( _slash, _comma ),
                    padding: PADDING.NONE
                } ),
            "4840": lock(
                {
                    alphabet: DEFAULT_BASE64_ALPHABET,
                    padding: PADDING.MANDATORY,
                    checksum: true
                } ),
            "UUENCODE": lock(
                {
                    alphabet: " !\"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_",
                    padding: PADDING.MANDATORY
                } )
        } );

    const DEFAULT_VARIANT = "4648";

    function getRfcVariantData( pRfcSpec )
    {
        const key = ucase( asString( pRfcSpec ).replace( /^RFC_/i, _mt_str ) );
        return SUPPORTED_VARIANTS[key] || SUPPORTED_VARIANTS[DEFAULT_VARIANT];
    }

    function getBase64Alphabet( pRfcSpec )
    {
        const data = getRfcVariantData( pRfcSpec );
        return data?.alphabet || DEFAULT_BASE64_ALPHABET;
    }

    function makeBlackList( pRfcSpec )
    {
        const data = getRfcVariantData( pRfcSpec );
        const alpha = getBase64Alphabet( data );

        return new RegExp( "[^" + alpha + "]" );
    }

    function requiresPadding( pRfcSpec )
    {
        const data = getRfcVariantData( pRfcSpec );
        const padding = data?.padding || PADDING.OPTIONAL;
        return PADDING.MANDATORY === padding;
    }


    const BufferDefined = (_ud !== typeof Buffer);
    const TextEncoderDefined = (_ud !== typeof TextEncoder);
    const BTOA_DEFINED = (_ud !== typeof btoa) && isFunction( btoa );
    const ATOB_DEFINED = (_ud !== typeof atob) && isFunction( atob );

    const isBufferDefined = function()
    {
        return !DEBUG && BufferDefined;
    };

    const isTextEncoderDefined = function()
    {
        return !DEBUG && TextEncoderDefined;
    };

    const isBToADefined = function()
    {
        return !DEBUG && BTOA_DEFINED;
    };

    const isAToBDefined = function()
    {
        return !DEBUG && ATOB_DEFINED;
    };

    /**
     * Returns a valid base64 encoded string by replacing spaces with '+'
     * and ensuring that the number of characters is a multiple of 4
     * @param pStr {string} a base64 encoded value
     * @param pOptions {object} optional object to specify the replacement characters
     * @returns {string} a valid base64 encoded value
     */
    const cleanBase64 = function( pStr, pOptions = DEFAULT_BASE64_OPTIONS )
    {
        let options = populateOptions( pOptions, DEFAULT_BASE64_OPTIONS );

        let replacements = (asArray( options.replacements || [[/ /g, "+"], [/ /, "+"]] ) || [[/ /g, "+"], [/ /, "+"]]).filter( e => Array.isArray( e ) && 2 === e.length );

        replacements = ((replacements?.length || 0) <= 0) || asArray( replacements[0] || [] ).length !== 2 ? [[/ /g, "+"]] : replacements;

        let str = asString( pStr, true ).replaceAll( /[\r\n]+/g, _mt_str ).trim();

        const rxDataProtocol = /^data:/;
        const rxPreamble = /^[^;]+;base64,/;

        // remove any preamble
        if ( str.startsWith( "data:" ) || rxDataProtocol.test( str ) )
        {
            str = asString( str.replace( rxDataProtocol, _mt_str ), true );
        }

        if ( rxPreamble.test( str ) )
        {
            str = str.replace( rxDataProtocol, _mt_str ).replace( rxPreamble, _mt_str ).trim();
        }

        str = asString( str, true ).replaceAll( new RegExp( "\\\\r|\\\\n", "g" ), _mt_str );

        for( let i = 0, n = replacements.length; i < n; i++ )
        {
            const replacement = replacements[i];

            const searchExpression = replacement[0] || / /g;

            const replaceString = replacement[1] || DEFAULT_CHAR_62;

            str = (searchExpression instanceof RegExp && searchExpression.global) ?
                  str.replaceAll( searchExpression, replaceString ) :
                  str.replace( searchExpression, replaceString );
        }

        if ( PADDING.MANDATORY === options.padding )
        {
            const paddingChar = options.paddingCharacter || "=";

            let loopCap = new IterationCap( 8 );

            while ( str.length % 4 !== 0 && str.endsWith( paddingChar ) && !loopCap.reached )
            {
                str = str.slice( 0, str.length - 1 );
            }

            while ( str.length % 4 !== 0 )
            {
                str += paddingChar;
            }
        }

        return str.trim();
    };

    /**
     * Returns true if the specified string is valid base64 encoded content
     * @param pString {string} a string to evaluate
     * @param pRfcSpec
     * @param pCleanPriorToTest
     * @returns {boolean} true if the specified string is valid base64 encoded content
     */
    const isValidBase64 = function( pString, pRfcSpec = DEFAULT_VARIANT, pCleanPriorToTest = false )
    {
        const str = asString( pString );

        const rx = makeBlackList( pRfcSpec );

        if ( !rx.test( str ) )
        {
            return (requiresPadding( pRfcSpec ) ? 0 === str?.length % 4 : !isBlank( str ));
        }

        if ( !!pCleanPriorToTest )
        {
            const cleaned = asString( attempt( () => cleanBase64( str ) ), true );

            if ( !rx.test( cleaned ) )
            {
                return (requiresPadding( pRfcSpec ) ? 0 === str?.length % 4 : !isBlank( str ));
            }
        }

        return false;
    };

    function resolveEncoding( pEncoding )
    {
        let encoding = lcase( asString( pEncoding, true ) );
        return validEncodings.includes( encoding ) ? encoding : UTF8;
    }

    function toBytes( pData )
    {
        if ( isString( pData ) )
        {
            if ( isBufferDefined() )
            {
                const str = cleanBase64( pData );
                return Buffer.from( str, "base64" );
            }

            if ( isTextEncoderDefined() )
            {
                return new TextEncoder().encode( asString( pData ) );
            }
            else
            {
                return new Uint8Array( asArray( pData.split( _mt_str ) ).map( e => e.charCodeAt( 0 ) ) );
            }
        }
        else if ( !isNull( pData ) )
        {
            return new Uint8Array( asArray( pData ) );
        }
    }

    function encode( pData, pVariant = DEFAULT_VARIANT )
    {
        if ( isString( pData ) && isBToADefined() )
        {
            return cleanBase64( btoa( pData ) );
        }

        const data = toBytes( pData );
        if ( isBufferDefined() )
        {
            return cleanBase64( Buffer.from( data || [] ).toString( BASE64 ) );
        }

        const lookupTable = getBase64Alphabet( pVariant ).split( _mt_str );

        let encodedString = _mt_str;

        for( let i = 0; i < data.length; i += 3 )
        {
            encodedString += processThreeBytes( data, i, lookupTable );
        }

        if ( requiresPadding( pVariant ) )
        {
            encodedString = addPadding( encodedString );
        }

        return asString( encodedString, true );
    }

    // Helper Functions
    function processThreeBytes( pData, pIndex, pLookupTable )
    {
        const index = asInt( pIndex );

        const firstByte = pData[index] << 16 || 0;
        const secondByte = pData[index + 1] ? pData[index + 1] << 8 : 0;
        const thirdByte = pData[index + 2] || 0;
        const threeByteBlock = firstByte + secondByte + thirdByte;

        let block = _mt_str;

        for( let k = 0; k < 4; k++ )
        {
            const key = (threeByteBlock >> ((3 - k) * 6)) & 0x3F;
            block += pLookupTable[key] || pLookupTable[0];
        }

        return block;
    }

    function addPadding( pEncodedString )
    {
        let encodedString = asString( pEncodedString, true );

        while ( encodedString.length % 4 !== 0 )
        {
            encodedString += DEFAULT_PADDING_CHAR;
        }

        return encodedString;
    }

    const decode = function( pBase64, pSpec = DEFAULT_VARIANT )
    {
        // const start = Date.now();

        if ( isNull( pBase64 ) || !isValidBase64( asString( pBase64, true ) ) )
        {
            return [];
        }

        const alphabet = getBase64Alphabet( pSpec ).split( _mt_str );

        const lookup = {};

        alphabet.forEach( ( e, i ) => lookup[e] = i );

        const input = cleanBase64( asString( pBase64, true ) );

        const inputLength = input.length;

        const matches = /(=+)$/.exec( input );

        const numPaddingChars = (matches && matches.length) ? matches[1]?.length : 0;

        let data = [];

        for( let i = 0, n = inputLength; i < n; i += 4 )
        {
            const chr_1 = input[i];
            const chr_2 = (i < (n + 1)) ? input[i + 1] : "A";
            const chr_3 = (i < (n + 2)) ? input[i + 2] : "A";
            const chr_4 = (i < (n + 3)) ? input[i + 3] : "A";

            const idx_1 = Math.max( 0, asInt( lookup[chr_1] ) << 18 );
            const idx_2 = Math.max( 0, asInt( lookup[chr_2] ) << 12 );
            const idx_3 = Math.max( 0, asInt( lookup[chr_3] ) << 6 );
            const idx_4 = Math.max( 0, asInt( lookup[chr_4] ) );

            const block = idx_1 + idx_2 + idx_3 + idx_4;

            for( let k = 0; k < 3; k++ )
            {
                data.push( (block >> ((2 - k) * 8)) & 0xFF );
            }

            /*
             if ( i % 1_000 === 0 )
             {
             console.log( "Still working...", i, "Time elapsed:", Date.now() - start, "ms" );
             }
             */
        }

        // const end = Date.now();

        // console.log( "Decoded in:", (end - start), "ms" );

        return numPaddingChars > 0 ? data.slice( 0, data.length - numPaddingChars ) : data;
    };

    function toText( pBase64, pEncoding = DEFAULT_TEXT_ENCODING )
    {
        let input = pBase64;

        if ( !isString( pBase64 ) )
        {
            input = encode( pBase64 );
        }

        if ( isNull( input ) || !isValidBase64( asString( input, true ) ) )
        {
            return _mt_str;
        }

        const str = isString( input ) ? cleanBase64( asString( input, true ) ) : encode( input );

        const encoding = resolveEncoding( pEncoding );

        if ( isBufferDefined() )
        {
            const buffer = Buffer.from( str, BASE64 );

            let result = buffer.toString( encoding );

            result = result.replace( _rxNullTerminator, _mt_str );

            return asString( result, true );
        }
        else if ( isAToBDefined() )
        {
            return atob( str );
        }

        const data = decode( str );

        return data.map( e => String.fromCharCode( e ) ).join( _mt_str ).replace( _rxNullTerminator, _mt_str );
    }

    let mod =
        {
            dependencies:
                {
                    moduleUtils,
                    constants,
                    stringUtils,
                    arrayUtils
                },
            SUPPORTED_VARIANTS,
            DEFAULT_VARIANT,
            isValidBase64,
            cleanBase64,
            encode,
            toBase64: encode,
            toText,
            decode,
            toBinary: decode
        };

    mod = toolBocksModule.extend( mod );

    return mod.expose( mod, INTERNAL_NAME, (_ud !== typeof module ? module : mod) ) || mod;

}());
