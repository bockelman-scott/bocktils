/**
 * This statement imports the core modules:
 * Constants, TypeUtils, StringUtils, and ArrayUtils
 */
const core = require( "@toolbocks/core" );

/**
 * Establish separate constants for each of the common utilities imported
 * @see ../src/CommonUtils.cjs
 */
const { constants, typeUtils, stringUtils, arrayUtils } = core;

const { _ud = "undefined" } = constants;

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

    const DEBUG = false;

    const {
        _mt_str,
        _rxNullTerminator,
        _slash,
        _underscore,
        _comma,
        S_ERROR,
        _ALPHABET_ENGLISH_UCASE,
        _ALPHABET_ENGLISH_LCASE,
        _DIGIT_CHARACTERS,
        IterationCap,
        populateOptions,
        lock,
        classes
    } = constants;

    const { ModuleEvent, ModulePrototype } = classes;

    if ( _ud === typeof CustomEvent )
    {
        CustomEvent = ModuleEvent;
    }

    const modName = "Base64Utils";

    const modulePrototype = new ModulePrototype( modName, INTERNAL_NAME );

    const { isNull, isString, isEmptyString, isNumber, isIterable, isFunction } = typeUtils;

    const { asString, asInt, ucase, lcase } = stringUtils;

    const { asArray } = arrayUtils;

    const base64 = "base64";

    const utf8 = "utf-8";

    const DEFAULT_TEXT_ENCODING = utf8;

    const validEncodings = lock( ["ascii", "utf8", utf8, "utf16le", "utf-16le", "ucs2", "ucs-2", base64, "base64url", "latin1", "binary", "hex"] );

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
     * Returns true if the specified string is valid base64 encoded content
     * @param pString {string} a string to evaluate
     * @param pRfcSpec
     * @returns {boolean} true if the specified string is valid base64 encoded content
     */
    const isValidBase64 = function( pString, pRfcSpec = DEFAULT_VARIANT )
    {
        const str = asString( pString );

        const rx = makeBlackList( pRfcSpec );

        if ( !rx.test( str ) )
        {
            return (requiresPadding( pRfcSpec ) ? 0 === str?.length % 4 : !isEmptyString( str ));
        }

        return false;
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

        let str = asString( pStr, true ).replaceAll( /[\r\n]+/g, _mt_str );

        str = asString( str, true ).replaceAll( new RegExp( "\\\\r|\\\\n", "g" ), _mt_str );

        for( let i = 0, n = replacements.length; i < n; i++ )
        {
            const replacement = replacements[i];

            const searchExpression = replacement[0] || / /g;

            const replaceString = replacement[1] || DEFAULT_CHAR_62;

            str = str.replace( searchExpression, replaceString );
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

    function resolveEncoding( pEncoding )
    {
        let encoding = lcase( asString( pEncoding, true ) );
        return validEncodings.includes( encoding ) ? encoding : utf8;
    }

    const bufferToTypedArray = function( pBuffer )
    {
        let typedArray = [];

        try
        {
            typedArray = new Uint8Array( pBuffer );
        }
        catch( ex )
        {
            modulePrototype.reportError( ex, ex.message, S_ERROR, modName + "::bufferToTypedArray", pBuffer );

            if ( pBuffer instanceof Uint8Array )
            {
                return pBuffer;
            }

            if ( isIterable( pBuffer ) )
            {
                typedArray = [...pBuffer];
            }
        }

        return typedArray;
    };

    const typedArrayToBuffer = function( pArray )
    {
        if ( isBufferDefined() )
        {
            return Buffer.from( pArray );
        }

        throw new Error( "Buffer is undefined in this execution context" );
    };

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

    function encode( pData, pSpec = DEFAULT_VARIANT )
    {
        if ( isString( pData ) && isBToADefined() )
        {
            return cleanBase64( btoa( pData ) );
        }

        const data = toBytes( pData );

        if ( isBufferDefined() )
        {
            const buffer = Buffer.from( data || [] );
            return cleanBase64( buffer.toString( base64 ) );
        }

        let s = _mt_str;


        const lookup = getBase64Alphabet( pSpec ).split( _mt_str );

        for( let i = 0, n = data.length; i < n; i += 3 )
        {
            let byte_block_1 = (data[i] << 16);
            let byte_block_2 = (i < (n + 1)) ? (data[i + 1] << 8) : 0;
            let byte_block_3 = (i < (n + 2)) ? (data[i + 2]) : 0;

            byte_block_1 = Math.max( 0, !isNaN( byte_block_1 ) ? byte_block_1 || 0 : 0 );
            byte_block_2 = Math.max( 0, !isNaN( byte_block_2 ) ? byte_block_2 || 0 : 0 );
            byte_block_3 = Math.max( 0, !isNaN( byte_block_3 ) ? byte_block_3 || 0 : 0 );

            let three_byte_block = (byte_block_1 + byte_block_2 + byte_block_3);

            for( let k = 0; k < 4; k++ )
            {
                const key = (three_byte_block >> ((3 - k) * 6)) & 0x3F;

                s += isNumber( key ) ? lookup[key] : lookup[0];
            }
        }

        if ( requiresPadding( pSpec ) )
        {
            while ( s.length % 4 !== 0 )
            {
                s += DEFAULT_PADDING_CHAR;
            }
        }

        return asString( s, true );
    }


    const toBinary = function( pBase64, pSpec = DEFAULT_VARIANT )
    {
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
        }

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
            const buffer = Buffer.from( str, base64 );

            let result = buffer.toString( encoding );

            result = result.replace( _rxNullTerminator, _mt_str );

            return asString( result, true );
        }
        else if ( isAToBDefined() )
        {
            return atob( str );
        }

        const data = toBinary( str );

        return data.map( e => String.fromCharCode( e ) ).join( _mt_str ).replace( _rxNullTerminator, _mt_str );
    }


    let mod =
        {
            dependencies:
                {
                    constants,
                    stringUtils,
                    arrayUtils
                },
            isValidBase64,
            cleanBase64,
            encode,
            toBase64: encode,
            toText,
            toBinary
        };

    mod = modulePrototype.extend( mod );

    return mod.expose( mod, INTERNAL_NAME, (_ud !== typeof module ? module : mod) ) || mod;

}());
