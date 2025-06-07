/**
 * This statement imports the core modules:
 * Constants, TypeUtils, StringUtils, and ArrayUtils
 */
const core = require( "@toolbocks/core" );

/**
 * Establish separate constants for each of the common utilities imported
 */
const { moduleUtils, constants, typeUtils, stringUtils, arrayUtils } = core;

const { _ud = "undefined", $scope } = constants;

// noinspection OverlyComplexFunctionJS,FunctionTooLongJS
(function exposeModule()
{
    const INTERNAL_NAME = "__BOCK__BUFFER_UTILS__";

    let scp = $scope();

    if ( scp && (null != scp[INTERNAL_NAME]) )
    {
        return scp[INTERNAL_NAME];
    }

    const { _mt_str } = constants;

    const {
        ToolBocksModule,
        lock,
        objectEntries,
        objectKeys,
        objectValues,
        populateOptions,
        attempt
    } = moduleUtils;

    const modName = "BufferUtils";

    const toolBocksModule = new ToolBocksModule( modName, INTERNAL_NAME );

    const executionEnvironment = toolBocksModule.executionEnvironment;

    const _isNode = executionEnvironment.isNode();

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
        const buffer = scp.Buffer || (_ud !== typeof Buffer ? Buffer : { from: () => null });
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
            toolBocksModule.handleError( ex, exposeModule, "node:buffer" );
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

                TextEncoder = nodeUtil?.TextEncoder || scp.TextEncoder;
                TextDecoder = nodeUtil?.TextDecoder || scp.TextDecoder;

                scp.TextEncoder = scp.TextEncoder || TextEncoder;
                scp.TextDecoder = scp.TextDecoder || TextDecoder;

                TextEncoderDefined = isTextEncoderDefined();
                TextDecoderDefined = isTextDecoderDefined();
            }
            catch( ex )
            {
                toolBocksModule.handleError( ex, exposeModule, "node:util TextEncoder/TextDecoder" );
            }
        }
    }

    if ( _ud === typeof ReadableStream )
    {
        ReadableStream = scp.ReadableStream || attempt( () => (_isNode ? require( "stream" ).Readable : ReadableStream) );
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
        Buffer = scp?.Buffer || nodeBuffer.Buffer || Uint8Array,
        Blob = scp?.Blob || Uint8Array,
        File = scp?.File,
        atob = scp?.atob,
        btoa = scp?.btoa,
        BlobOptions = scp?.BlobOptions || { type: "application/octet-stream" },
        FileOptions = scp?.FileOptions || { type: "application/octet-stream" },
        isAscii = scp?.isAscii,
        isUtf8 = scp?.isUtf8,
        SlowBuffer = scp?.SlowBuffer || Uint8Array,
        transcode = scp?.transcode || Uint8Array.prototype.transcode,
        TranscodeEncoding = scp?.TranscodeEncoding || utf8,
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

    function isBuffer( pObject )
    {
        return isArray( pObject ) || isTypedArray( pObject ) || (BufferDefined && pObject instanceof Buffer);
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
            TranscodeEncoding,
            isBuffer
        };

        objectEntries( mod ).forEach( ( [key, value] ) =>
                                      {
                                          if ( _ud === typeof scp[key] )
                                          {
                                              scp[key] = value;
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
                return (isTextDecoderDefined()) ? new TextDecoder().decode( this.uInt8Array ) : String.fromCharCode.apply( String, this.uInt8Array );
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

                if ( TextDecoderDefined && encoding === utf8 )
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

        isBuffer = function( pObject )
        {
            return isArray( pObject ) || isTypedArray( pObject ) || (pObject instanceof __Buffer) || (_ud !== Buffer && pObject instanceof Buffer);
        };

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
            TranscodeEncoding,
            isBuffer
        };
    }

    if ( !isBufferDefined() )
    {
        Buffer = mod.Buffer || mod.__Buffer;
        scp.Buffer = scp.Buffer || Buffer;
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
            btoa: BTOA_DEFINED ? btoa || scp.btoa : ( pString ) => Buffer.from( pString ).toString( base64 ),
            atob: ATOB_DEFINED ? atob || scp.atob : ( pString ) => Buffer.from( pString, base64 ).toString(),
            TextEncoder: TextEncoderDefined ? TextEncoder || scp.TextEncoder : {},
            TextDecoder: TextDecoderDefined ? TextDecoder || scp.TextDecoder : {},
            File: File || scp.File,
            Blob: Blob || scp.Blob,
            BlobOptions: BlobOptions || scp.BlobOptions,
            FileOptions: FileOptions || scp.FileOptions,
            isAscii: isAscii || scp.isAscii,
            isUtf8: isUtf8 || scp.isUtf8,
            SlowBuffer: SlowBuffer || scp.SlowBuffer,
            transcode: transcode || scp.transcode,
            TranscodeEncoding: TranscodeEncoding || scp.TranscodeEncoding,
            ReadableStream: (_ud !== typeof ReadableStream) && isFunction( ReadableStream ) ? ReadableStream : scp.ReadableStream,
            arrayFromBuffer,
            typedArrayFromBuffer,
            isBlob,
            isFile
        };

    mod = { ...mod, ...more };

    mod.Buffer = mod.Buffer || scp.Buffer || Buffer;

    scp = null;

    mod = toolBocksModule.extend( mod );

    return mod.expose( mod, INTERNAL_NAME, (_ud !== typeof module ? module : mod) ) || mod;

}());
