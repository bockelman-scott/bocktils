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
    $scope = constants?.$scope || function()
    {
        return (_ud === typeof self ? ((_ud === typeof global) ? {} : (global || {})) : (self || {}));
    }
} = constants;

// noinspection OverlyComplexFunctionJS,FunctionTooLongJS
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
        objectEntries,
        objectKeys,
        objectValues,
        populateOptions,
        attempt,
        classes
    } = constants;

    const { ToolBocksModule } = classes;

    const modName = "BufferUtils";

    const modulePrototype = new ToolBocksModule( modName, INTERNAL_NAME );

    const executionEnvironment = modulePrototype.executionEnvironment;

    const _isNode = executionEnvironment.isNode();
    const _isDeno = executionEnvironment.isDeno();
    const _isBrowser = executionEnvironment.isBrowser();

    const {
        isDefined,
        isNull,
        isString,
        isNumber,
        isFunction,
        isArray,
        isTypedArray,
        toDecimal
    } = typeUtils;

    const { asString, asInt } = stringUtils;

    const { flatArgs, asArray, Mappers, Filters } = arrayUtils;

    const base64 = "base64";

    const utf8 = "utf-8";

    const DEFAULT_TEXT_ENCODING = utf8;

    const VALID_ENCODINGS = lock( ["ascii", "utf8", utf8, "utf16le", "utf-16le", "ucs2", "ucs-2", base64, "base64url", "latin1", "binary", "hex"] );

    function isBufferDefined()
    {
        if ( _isNode )
        {
            return true;
        }
        const buffer = $scope().Buffer;
        return (_ud !== typeof buffer && isFunction( buffer?.isBuffer ) && buffer.isBuffer( buffer.from( [0x62, 0x75, 0x66, 0x66, 0x65, 0x72] ) ));
    }

    let BufferDefined = isBufferDefined();

    let nodeBuffer = {};

    if ( !BufferDefined && isDefined( require ) && isFunction( require ) )
    {
        try
        {
            nodeBuffer = require( "node:buffer" );
        }
        catch( ex )
        {
            modulePrototype.handleError( ex, exposeModule, "node:buffer" );
        }
    }

    function isTextEncoderDefined()
    {
        return (_ud !== typeof TextEncoder);
    }

    function isTextDecoderDefined()
    {
        return (_ud !== typeof TextDecoder);
    }

    let TextEncoderDefined = isTextEncoderDefined();
    let TextDecoderDefined = isTextDecoderDefined();

    if ( !TextEncoderDefined || !TextDecoderDefined )
    {
        if ( isDefined( require ) && isFunction( require ) )
        {
            try
            {
                const nodeUtil = require( "node:util" );

                TextEncoder = nodeUtil?.TextEncoder || $scope().TextEncoder;
                TextDecoder = nodeUtil?.TextDecoder || $scope().TextDecoder;

                $scope().TextEncoder = $scope().TextEncoder || TextEncoder;
                $scope().TextDecoder = $scope().TextDecoder || TextDecoder;

                TextEncoderDefined = isTextEncoderDefined();
                TextDecoderDefined = isTextDecoderDefined();
            }
            catch( ex )
            {
                modulePrototype.handleError( ex, exposeModule, "node:util TextEncoder/TextDecoder" );
            }
        }
    }

    if ( _ud === typeof ReadableStream )
    {
        ReadableStream = $scope().ReadableStream || attempt( () => (_isNode ? require( "stream" ).Readable : ReadableStream) );
    }

    function resolveEncoding( pEncoding )
    {
        if ( isString( pEncoding ) && VALID_ENCODINGS.includes( pEncoding ) )
        {
            return pEncoding;
        }
        return DEFAULT_TEXT_ENCODING;
    }

    let mod;

    let {
        Buffer = $scope()?.Buffer || nodeBuffer.Buffer || Uint8Array,
        Blob = $scope()?.Blob || Uint8Array,
        File = $scope()?.File,
        atob = $scope()?.atob,
        btoa = $scope()?.btoa,
        BlobOptions = $scope()?.BlobOptions || { type: "application/octet-stream" },
        FileOptions = $scope()?.FileOptions || { type: "application/octet-stream" },
        isAscii = $scope()?.isAscii,
        isUtf8 = $scope()?.isUtf8,
        SlowBuffer = $scope()?.SlowBuffer || Uint8Array,
        transcode = $scope()?.transcode || Uint8Array.prototype.transcode,
        TranscodeEncoding = $scope()?.TranscodeEncoding || utf8,
    } = nodeBuffer || {};

    BufferDefined = (_ud !== typeof Buffer) && isBufferDefined();

    const BTOA_DEFINED = (_ud !== typeof btoa) && isFunction( btoa );
    const ATOB_DEFINED = (_ud !== typeof atob) && isFunction( atob );

    if ( _ud === typeof File || isNull( File ) || !isFunction( File ) )
    {
        File = function( pData, pFileName, pOptions )
        {
            const options = populateOptions( pOptions, FileOptions );

            this.data = pData;
            this.fileName = pFileName;
            this.type = options?.type;
            this.modified = options?.lastModified || Date.now();
            this.endings = options?.endings || "native";
        };

        File.prototype.name = function()
        {
            return this.fileName;
        };

        File.prototype.lastModified = function()
        {
            return this.modified;
        };
    }

    if ( BufferDefined )
    {
        mod = {
            Buffer,
            Blob,
            File,
            atob,
            btoa,
            BlobOptions,
            FileOptions,
            isAscii,
            isUtf8,
            SlowBuffer,
            transcode,
            TranscodeEncoding
        };

        objectEntries( mod ).forEach( ( [key, value] ) =>
                                      {
                                          if ( _ud !== typeof $scope()[key] )
                                          {
                                              $scope()[key] = value;
                                          }
                                      } );
    }
    else
    {
        function resolveArguments( ...pArgs )
        {
            const args = flatArgs( ...pArgs ).filter( ( arg ) => (isDefined( arg )) );

            return [...args];
        }

        class __Buffer extends Uint8Array
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

            get uInt8Array()
            {
                return this.#uInt8Array || this;
            }

            get byteOffset()
            {
                return this.#byteOffset || this.uInt8Array.byteOffset || 0;
            }

            get byteLength()
            {
                return this.#byteLength || this.uInt8Array.byteLength || 0;
            }

            get text()
            {
                return this.decode();
            }

            decode()
            {
                return (isTextEncoderDefined()) ? new TextDecoder().decode( this.uInt8Array ) : String.fromCharCode.apply( String, this.uInt8Array );
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
                    this.#uInt8Array = new Uint8Array( asArray( asString( pString ).split( _mt_str ) ).map( e => e.charCodeAt( 0 ) ) );
                }

                return this.uInt8Array.length;
            }

            toString( pEncoding, pStart, pEnd )
            {
                const encoding = resolveEncoding( pEncoding );

                if ( TextEncoderDefined && encoding === utf8 )
                {
                    return new TextDecoder().decode( this.uInt8Array );
                }
                else
                {
                    return String.fromCharCode.apply( String, this.uInt8Array );
                }
            }

            slice( pStart, pEnd )
            {
                return this.uInt8Array.slice( pStart, pEnd );
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
                return this.uInt8Array.reverse();
            }

            fill( pValue, pOffset, pEnd, pEncoding )
            {
                return this.#uInt8Array.fill( pValue, pOffset, pEnd );
            }

            indexOf( pValue, pStart, pEncoding )
            {
                return this.uInt8Array.indexOf( pValue, pStart );
            }

            lastIndexOf( pValue, pStart, pEncoding )
            {
                return this.uInt8Array.lastIndexOf( pValue, pStart );
            }

            includes( pValue, pStart, pEncoding )
            {
                return this.uInt8Array.includes( pValue, pStart );
            }

            copyWithin( pTarget, pStart, pEnd )
            {
                return this.#uInt8Array.copyWithin( pTarget, pStart, pEnd );
            }

            every( pPredicate, pThis )
            {
                return this.uInt8Array.every( Filters.resolve( pPredicate ), pThis );
            }

            filter( pPredicate, pThis )
            {
                return this.uInt8Array.filter( Filters.resolve( pPredicate ), pThis );
            }

            find( pPredicate, pThis )
            {
                return this.uInt8Array.find( Filters.resolve( pPredicate ), pThis );
            }

            findIndex( pPredicate, pThis )
            {
                return this.uInt8Array.findIndex( Filters.resolve( pPredicate ), pThis );
            }

            forEach( pCallback, pThis )
            {
                if ( isFunction( pCallback ) )
                {
                    this.uInt8Array.forEach( pCallback, pThis );
                }
            }

            join( pSeparator )
            {
                return this.uInt8Array.join( pSeparator );
            }

            map( pCallback, pThis )
            {
                if ( isFunction( pCallback ) )
                {
                    return this.uInt8Array.map( pCallback, pThis );
                }
            }

            reduce( pCallback )
            {
                if ( isFunction( pCallback ) )
                {
                    return this.uInt8Array.reduce( pCallback );
                }
            }

            reduceRight( pCallback )
            {
                if ( isFunction( pCallback ) )
                {
                    return this.uInt8Array.reduceRight( pCallback );
                }
            }

            set( pArr, pOffset )
            {
                this.#uInt8Array.set( pArr, asInt( pOffset ) );
            }

            some( pPredicate, pThis )
            {
                return this.uInt8Array.some( Filters.resolve( pPredicate ), pThis );
            }

            sort( pComparator )
            {
                if ( isFunction( pComparator ) )
                {
                    return this.#uInt8Array.sort( pComparator );
                }
            }

            toLocaleString()
            {
                return this.uInt8Array.toLocaleString();
            }

            valueOf()
            {
                return this.uInt8Array.valueOf();
            }

            [Symbol.iterator]()
            {
                return this.uInt8Array[Symbol.iterator]();
            }

            entries()
            {
                return isFunction( this.uInt8Array?.entries ) ? this.uInt8Array.entries() : objectEntries( this.uInt8Array );
            }

            keys()
            {
                return isFunction( this.uInt8Array?.keys ) ? this.uInt8Array.keys() : objectKeys( this.uInt8Array );
            }

            values()
            {
                return isFunction( this.uInt8Array?.values ) ? this.uInt8Array.values() : objectValues( this.uInt8Array );
            }

            at( pIndex )
            {
                return this.uInt8Array.at( asInt( pIndex ) );
            }
        }

        __Buffer.from = function( pIn, pEncoding )
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

                return new __Buffer( uint8Array );
            }
            else if ( isArray( pIn ) )
            {
                return new __Buffer( pIn );
            }
        };

        __Buffer.alloc = function( pSize, pFill, pEncoding )
        {
            const buffer = new __Buffer( asInt( pSize ) );

            if ( isDefined( pFill ) )
            {
                buffer.fill( pFill, 0, pSize, pEncoding );
            }

            return buffer;
        };

        __Buffer.concat = function( pArr )
        {
            let arr = asArray( pArr );

            let buffers = [];

            for( let a of arr )
            {
                buffers = buffers.concat( ...(new Uint8Array( a )) );
            }

            return new __Buffer( new Uint8Array( buffers ) );
        };

        __Buffer.copyBytesFrom = function( pSource, pSourceOffset, pTarget, pTargetOffset, pLength )
        {
            return new __Buffer( pSource.buffer || pSource, asInt( pSourceOffset ), asInt( pLength ) );
        };

        if ( _ud === typeof Buffer )
        {
            Buffer = __Buffer;
        }

        mod = {
            Buffer,
            __Buffer,
            Blob,
            File,
            atob,
            btoa,
            BlobOptions,
            FileOptions,
            isAscii,
            isUtf8,
            SlowBuffer,
            transcode,
            TranscodeEncoding
        };
    }

    if ( !isBufferDefined() )
    {
        Buffer = mod.Buffer || mod.__Buffer;
        $scope().Buffer = $scope().Buffer || Buffer;
    }

    /**
     * Converts the input buffer or array-like object into an array.
     *
     * @param {Buffer|Array|TypedArray|any} pBuffer - The input data which can be a buffer, array, typed array, or any other object.
     * @return {Uint8Array<number>} An byte array representation of the input, or the input itself if it does not match the expected types.
     */
    function arrayFromBuffer( pBuffer )
    {
        const arr = asArray( pBuffer, { splitOn: /[^\d.ABCDEFx ]/gi } ).map( Mappers.TRIMMED ).map( toDecimal );
        return new Uint8Array( arr );
    }

    /**
     * Creates a typed array from a given buffer or array-like object.
     *
     * @param {Buffer|Array|TypedArray} pBuffer - The input buffer, array, or typed array to transform into a typed array.
     * @param {Function|*} [pArrayClass=Uint8Array] - The constructor for the target typed array class. Defaults to Uint8Array if not provided.
     * @return {TypedArray} A new typed array instance created from the input buffer or array-like object.
     */
    function typedArrayFromBuffer( pBuffer, pArrayClass = Uint8Array )
    {
        const ArrayClass = pArrayClass || Uint8Array;
        return isBufferDefined() ? (pBuffer instanceof Buffer ? new ArrayClass( pBuffer ) : isArray( pBuffer ) || isTypedArray( pBuffer ) ? new ArrayClass( pBuffer ) : new ArrayClass( arrayFromBuffer( pBuffer ) )) : arrayFromBuffer( pBuffer );
    }

    const isBlob = ( pValue ) => (_ud !== typeof Blob && pValue instanceof Blob);
    const isFile = ( pValue ) => (_ud !== typeof File && pValue instanceof File);

    const more =
        {
            BufferDefined,
            TextEncoderDefined,
            TextDecoderDefined,
            BTOA_DEFINED,
            ATOB_DEFINED,
            btoa: BTOA_DEFINED ? btoa || $scope().btoa : ( pString ) => Buffer.from( pString ).toString( base64 ),
            atob: ATOB_DEFINED ? atob || $scope().atob : ( pString ) => Buffer.from( pString, base64 ).toString(),
            TextEncoder: TextEncoderDefined ? TextEncoder || $scope().TextEncoder : {},
            TextDecoder: TextDecoderDefined ? TextDecoder || $scope().TextDecoder : {},
            File: File || $scope().File,
            Blob: Blob || $scope().Blob,
            BlobOptions: BlobOptions || $scope().BlobOptions,
            FileOptions: FileOptions || $scope().FileOptions,
            isAscii: isAscii || $scope().isAscii,
            isUtf8: isUtf8 || $scope().isUtf8,
            SlowBuffer: SlowBuffer || $scope().SlowBuffer,
            transcode: transcode || $scope().transcode,
            TranscodeEncoding: TranscodeEncoding || $scope().TranscodeEncoding,
            ReadableStream: (_ud !== typeof ReadableStream) && isFunction( ReadableStream ) ? ReadableStream : $scope().ReadableStream,
            arrayFromBuffer,
            typedArrayFromBuffer,
            isBlob,
            isFile
        };

    mod = { ...mod, ...more };

    mod.Buffer = mod.Buffer || $scope().Buffer || Buffer;

    mod = modulePrototype.extend( mod );

    return mod.expose( mod, INTERNAL_NAME, (_ud !== typeof module ? module : mod) ) || mod;

}());
