/**
 * This statement imports the core modules:
 * Constants, TypeUtils, StringUtils, and ArrayUtils
 */
const core = require( "@toolbocks/core" );

/**
 * Establish separate constants for each of the common utilities imported
 */
const { constants, typeUtils, stringUtils, arrayUtils } = core;

const {
    _ud = "undefined",
    $scope = function()
    {
        return (_ud === typeof self ? ((_ud === typeof global) ? {} : (global || {})) : (self || {}));
    }
} = constants;

(function exposeModule()
{
    const INTERNAL_NAME = "__BOCK__BUFFER_UTILS__";

    if ( $scope() && (null != $scope()[INTERNAL_NAME]) )
    {
        return $scope()[INTERNAL_NAME];
    }

    const {
        _mt_str,
        lock,
        classes
    } = constants;

    const { ModuleEvent, ModulePrototype } = classes;

    if ( _ud === typeof CustomEvent )
    {
        CustomEvent = ModuleEvent;
    }

    const modName = "BufferUtils";

    const modulePrototype = new ModulePrototype( modName, INTERNAL_NAME );

    const {
        isUndefined,
        isDefined,
        isNull,
        isString,
        isNumber,
        isFunction,
        isArray,
        isTypedArray
    } = typeUtils;

    const { asString } = stringUtils;

    const { flatArgs, asArray } = arrayUtils;

    const base64 = "base64";

    const utf8 = "utf-8";

    const DEFAULT_TEXT_ENCODING = utf8;

    const validEncodings = lock( ["ascii", "utf8", utf8, "utf16le", "utf-16le", "ucs2", "ucs-2", base64, "base64url", "latin1", "binary", "hex"] );

    const BufferDefined = (_ud !== typeof Buffer && isFunction( Buffer?.isBuffer ) && Buffer.isBuffer( Buffer.from( [0x62, 0x75, 0x66, 0x66, 0x65, 0x72] ) ));

    const TextEncoderDefined = (_ud !== typeof TextEncoder);

    const BTOA_DEFINED = (_ud !== typeof btoa) && isFunction( btoa );

    const ATOB_DEFINED = (_ud !== typeof atob) && isFunction( atob );

    function resolveEncoding( pEncoding )
    {
        if ( isString( pEncoding ) && validEncodings.includes( pEncoding ) )
        {
            return pEncoding;
        }
        return DEFAULT_TEXT_ENCODING;
    }

    if ( BufferDefined )
    {
        let mod = {
            Buffer,
            resolveEncoding,
            TextEncoderDefined,
            BTOA_DEFINED,
            ATOB_DEFINED,
            btoa: BTOA_DEFINED ? btoa : ( pString ) => Buffer.from( pString ).toString( base64 ),
            atob: ATOB_DEFINED ? atob : ( pString ) => Buffer.from( pString, base64 ).toString(),
            BufferDefined,
            TextEncoder: TextEncoderDefined ? TextEncoder : {},
        };

        mod = modulePrototype.extend( mod );

        return mod.expose( mod, INTERNAL_NAME, (_ud !== typeof module ? module : mod) ) || mod;
    }
    else
    {
        function resolveArguments( ...pArgs )
        {
            const args = flatArgs( ...pArgs ).filter( ( arg ) => (isDefined( arg )) );

            return [...args];
        }

        class Buffer extends Uint8Array
        {
            #uInt8Array;

            #text;

            #arrayBuffer;

            #byteOffset;

            #byteLength;

            constructor( pArg1, pArg2, pArg3 )
            {
                super( resolveArguments( ...(asArray( [pArg1, pArg2, pArg3] )) )[0],
                       resolveArguments( ...(asArray( [pArg1, pArg2, pArg3] )) )[1],
                       resolveArguments( ...(asArray( [pArg1, pArg2, pArg3] )) )[2] );

                this.#uInt8Array = new Uint8Array( this );

                if ( pArg1 instanceof ArrayBuffer )
                {
                    this.#arrayBuffer = pArg1;
                }
                else if ( isTypedArray( pArg1 ) )
                {
                    this.#arrayBuffer = pArg1.buffer;
                }
                else
                {
                    this.#arrayBuffer = new Uint8Array( pArg1 ).buffer;
                }

                if ( isString( pArg1 ) )
                {
                    this.#text = pArg1;
                }

                if ( isNumber( pArg2 ) )
                {
                    this.#byteOffset = pArg2;
                }

                if ( isNumber( pArg3 ) )
                {
                    this.#byteLength = pArg3;
                }
            }

            get text()
            {
                if ( TextEncoderDefined )
                {
                    return new TextDecoder().decode( this.#uInt8Array );
                }
                else
                {
                    return String.fromCharCode.apply( null, this.#uInt8Array );
                }
            }

            write( pString, pEncoding )
            {
                const encoding = resolveEncoding( pEncoding );

                if ( TextEncoderDefined && encoding === utf8 )
                {
                    this.#uInt8Array = new TextEncoder().encode( asString( pString ) );
                }
                else
                {
                    this.#uInt8Array = new Uint8Array( asArray( pString.split( _mt_str ) ).map( e => e.charCodeAt( 0 ) ) );
                }
                return this.#uInt8Array.length;
            }

            toString( pEncoding, pStart, pEnd )
            {
                const encoding = resolveEncoding( pEncoding );

                if ( TextEncoderDefined && encoding === utf8 )
                {
                    return new TextDecoder().decode( this.#uInt8Array );
                }
                else
                {
                    return String.fromCharCode.apply( null, this.#uInt8Array );
                }
            }

            slice( pStart, pEnd )
            {
                return this.#uInt8Array.slice( pStart, pEnd );
            }

            equals( pOther )
            {
                if ( this === pOther )
                {
                    return true;
                }

                if ( isNull( pOther ) )
                {
                    return false;
                }

                return super.equals( pOther ) || (this.toString() === pOther.toString());
            }

            reverse()
            {
                return this.#uInt8Array.reverse();
            }

            fill( pValue, pOffset, pEnd, pEncoding )
            {
                return this.#uInt8Array.fill( pValue, pOffset, pEnd );
            }

            indexOf( pValue, pStart, pEncoding )
            {
                return this.#uInt8Array.indexOf( pValue, pStart );
            }

            lastIndexOf( pValue, pStart, pEncoding )
            {
                return this.#uInt8Array.lastIndexOf( pValue, pStart );
            }

            includes( pValue, pStart, pEncoding )
            {
                return this.#uInt8Array.includes( pValue, pStart );
            }

            copyWithin( pTarget, pStart, pEnd )
            {
                return this.#uInt8Array.copyWithin( pTarget, pStart, pEnd );
            }

            every( pPredicate, pThis )
            {
                return this.#uInt8Array.every( pPredicate, pThis );
            }

            filter( pPredicate, pThis )
            {
                return this.#uInt8Array.filter( pPredicate, pThis );
            }

            find( pPredicate, pThis )
            {
                return this.#uInt8Array.find( pPredicate, pThis );
            }

            findIndex( pPredicate, pThis )
            {
                return this.#uInt8Array.findIndex( pPredicate, pThis );
            }

            forEach( pCallback, pThis )
            {
                this.#uInt8Array.forEach( pCallback, pThis );
            }

            join( pSeparator )
            {
                return this.#uInt8Array.join( pSeparator );
            }

            map( pCallback, pThis )
            {
                return this.#uInt8Array.map( pCallback, pThis );
            }

            reduce( pCallback )
            {
                return this.#uInt8Array.reduce( pCallback );
            }

            reduceRight( pCallback )
            {
                return this.#uInt8Array.reduceRight( pCallback );
            }

            set( pArr, pOffset )
            {
                this.#uInt8Array.set( pArr, pOffset );
            }

            some( pPredicate, pThis )
            {
                return this.#uInt8Array.some( pPredicate, pThis );
            }

            sort( pComparator )
            {
                return this.#uInt8Array.sort( pComparator );
            }

            toLocaleString()
            {
                return this.#uInt8Array.toLocaleString();
            }

            valueOf()
            {
                return this.#uInt8Array.valueOf();
            }

            [Symbol.iterator]()
            {
                return this.#uInt8Array[Symbol.iterator]();
            }

            entries()
            {
                return this.#uInt8Array.entries();
            }

            keys()
            {
                return this.#uInt8Array.keys();
            }

            values()
            {
                return this.#uInt8Array.values();
            }

            at( pIndex )
            {
                return this.#uInt8Array.at( pIndex );
            }
        }

        Buffer.from = function( pIn, pEncoding )
        {
            if ( isString( pIn ) )
            {
                let uint8Array;

                if ( TextEncoderDefined )
                {
                    uint8Array = new TextEncoder().encode( asString( pIn ) );
                }
                else
                {
                    uint8Array = new Uint8Array( asArray( asString( pIn ).split( _mt_str ) ).map( e => e.charCodeAt( 0 ) ) );
                }

                return new Buffer( uint8Array );
            }
            else if ( isArray( pIn ) )
            {
                return new Buffer( pIn );
            }
        };

        Buffer.alloc = function( pSize, pFill, pEncoding )
        {
            return new Buffer( pSize );
        };

        Buffer.concat = function( pArr )
        {
            let arr = asArray( pArr );

            let buffers = [];

            for( let a of arr )
            {
                buffers = buffers.concat( ...(new Uint8Array( a )) );
            }

            return new Buffer( new Uint8Array( buffers ) );
        };

        Buffer.copyBytesFrom = function( pSource, pSourceOffset, pTarget, pTargetOffset, pLength )
        {
            return new Buffer( pSource.buffer || pSource, pSourceOffset, pLength );
        };

        let mod =
            {
                Buffer,
                resolveEncoding,
                TextEncoderDefined,
                BTOA_DEFINED,
                ATOB_DEFINED,
                btoa: BTOA_DEFINED ? btoa : ( pString ) => Buffer.from( pString ).toString( base64 ),
                atob: ATOB_DEFINED ? atob : ( pString ) => Buffer.from( pString, base64 ).toString(),
                BufferDefined,
                TextEncoder: TextEncoderDefined ? TextEncoder : {},
            };

        mod = modulePrototype.extend( mod );

        return mod.expose( mod, INTERNAL_NAME, (_ud !== typeof module ? module : mod) ) || mod;
    }

}());
