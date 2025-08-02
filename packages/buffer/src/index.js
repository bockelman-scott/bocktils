/**
 * This statement imports the core modules:
 * Constants, TypeUtils, StringUtils, and ArrayUtils
 */
const core = require( "@toolbocks/core" );

/**
 * This statement imports our safer JSON functions,
 * which can handle cyclic dependencies and internal $ref
 */
const jsonUtils = require( "@toolbocks/json" );

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
        ModuleEvent,
        ToolBocksModule,
        ObjectEntry,
        objectEntries,
        objectKeys,
        objectValues,
        resolveError,
        populateOptions,
        attempt,
        asyncAttempt,
        sleep,
        lock,
        $ln
    } = moduleUtils;

    const modName = "BufferUtils";

    const toolBocksModule = new ToolBocksModule( modName, INTERNAL_NAME );

    const executionEnvironment = toolBocksModule.executionEnvironment;

    const _isNode = executionEnvironment.isNode();

    const {
        isDefined,
        isNull,
        isNonNullObject,
        isScalar,
        isString,
        isNumber,
        isFunction,
        isArray,
        isTypedArray,
        toDecimal,
        clamp = moduleUtils?.clamp
    } = typeUtils;

    const { asString, asInt, lcase, isJson } = stringUtils;

    const { flatArgs, asArray, Mappers, Filters } = arrayUtils;

    const { asJson, parseJson } = jsonUtils;

    const base64 = "base64";

    const UTF_8 = "utf-8";

    const DEFAULT_TEXT_ENCODING = UTF_8;

    const VALID_ENCODINGS = lock( ["ascii", "utf8", UTF_8, "utf16le", "utf-16le", "ucs2", "ucs-2", base64, "base64url", "latin1", "binary", "hex"] );

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
        Buffer = scp?.Buffer || (_ud !== typeof Buffer ? Buffer : nodeBuffer.Buffer) || nodeBuffer.Buffer || Uint8Array,
        Blob = scp?.Blob || Uint8Array,
        File = scp?.File || Blob,
        atob = scp?.atob,
        btoa = scp?.btoa,
        BlobOptions = scp?.BlobOptions || { type: "application/octet-stream" },
        FileOptions = scp?.FileOptions || { type: "application/octet-stream" },
        isAscii = scp?.isAscii,
        isUtf8 = scp?.isUtf8,
        SlowBuffer = scp?.SlowBuffer || Uint8Array,
        transcode = scp?.transcode || Uint8Array.prototype.transcode,
        TranscodeEncoding = scp?.TranscodeEncoding || UTF_8,
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

    function isTypedBuffer( pObject )
    {
        return isTypedArray( pObject ) || (BufferDefined && pObject instanceof Buffer);
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

                if ( TextEncoderDefined && encoding === UTF_8 )
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

                if ( TextDecoderDefined && encoding === UTF_8 )
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


    const MIN_STREAMING_CHUNK_SIZE = 256;
    const MAX_STREAMING_CHUNK_SIZE = (1_024 * 1_000);
    const DEFAULT_STREAMING_CHUNK_SIZE = 1_024;

    const MIN_STREAMING_DELAY_MILLISECONDS = 0; // no delay beyond what is experienced doe to backpressure
    const MAX_STREAMING_DELAY_MILLISECONDS = 5_000; // this is a more than adequate delay for 99% of use cases, excessive even
    const DEFAULT_STREAMING_DELAY_MILLISECONDS = 0; // no throttling by default

    const DEFAULT_STREAMING_OPTIONS =
        {
            chunkSize: DEFAULT_STREAMING_CHUNK_SIZE,
            delayMs: DEFAULT_STREAMING_DELAY_MILLISECONDS
        };

    /**
     * @class Streamer
     * @description Provides a static method to convert various JavaScript data types
     * into a ReadableStream, compatible across Node.js, Deno, browser windows, and Web Workers.
     */
    class Streamer
    {
        #options;

        #chunkSize;
        #delayMs;

        constructor( pOptions = DEFAULT_STREAMING_OPTIONS )
        {
            this.#options = populateOptions( pOptions || {}, DEFAULT_STREAMING_OPTIONS );

            this.#chunkSize = clamp( asInt( this.#options.chunkSize, DEFAULT_STREAMING_CHUNK_SIZE ), MIN_STREAMING_CHUNK_SIZE, MAX_STREAMING_CHUNK_SIZE );

            this.#delayMs = clamp( asInt( this.#options.delayMs, DEFAULT_STREAMING_DELAY_MILLISECONDS ), MIN_STREAMING_DELAY_MILLISECONDS, MAX_STREAMING_DELAY_MILLISECONDS );
        }

        get chunkSize()
        {
            return clamp( asInt( this.#chunkSize, DEFAULT_STREAMING_CHUNK_SIZE ), MIN_STREAMING_CHUNK_SIZE, MAX_STREAMING_CHUNK_SIZE );
        }

        get delayMs()
        {
            return clamp( asInt( this.#delayMs, DEFAULT_STREAMING_DELAY_MILLISECONDS ), MIN_STREAMING_DELAY_MILLISECONDS, MAX_STREAMING_DELAY_MILLISECONDS );
        }

        static _encodeData( pValue )
        {
            let encodedData;

            const encoder = new TextEncoder();

            if ( isString( pValue ) || isScalar( pValue ) )
            {
                // If the value is a string, encode it directly to UTF-8 bytes.
                encodedData = encoder.encode( asString( pValue ) );
            }
            else if ( pValue instanceof ArrayBuffer || (_ud !== typeof Buffer && pValue instanceof Buffer) )
            {
                // If it's an ArrayBuffer, or (as in Node.js or Deno, a Buffer),
                // we create a Uint8Array view.
                encodedData = new Uint8Array( pValue );
            }
            else if ( pValue instanceof Uint8Array )
            {
                // If it's already a Uint8Array, use it directly.
                encodedData = pValue;
            }
            else if ( isNonNullObject( pValue ) )
            {
                // For plain objects and arrays, stringify them to JSON first,
                // then encode the JSON string.
                encodedData = encoder.encode( asJson( pValue ) );
            }
            else
            {
                encodedData = encoder.encode( _mt_str );
            }

            return encodedData;
        }

        _streamToSingleChunkedStream( pValue )
        {
            if ( !(pValue instanceof ReadableStream) )
            {
                return this.asSingleChunkStream( pValue );
            }

            const me = this;

            return new ReadableStream( {
                                           async start( controller )
                                           {
                                               let encodedData;

                                               if ( pValue instanceof ReadableStream )
                                               {
                                                   // If the value is already a ReadableStream, consume it fully first.
                                                   // This buffers the entire content into memory.
                                                   const reader = attempt( () => pValue.getReader() );

                                                   const chunks = [];

                                                   let totalLength = 0;

                                                   try
                                                   {
                                                       while ( true )
                                                       {
                                                           const
                                                               {
                                                                   done,
                                                                   value: chunk
                                                               } = await asyncAttempt( async() => await reader.read() );

                                                           if ( done )
                                                           {
                                                               break;
                                                           }

                                                           chunks.push( chunk );

                                                           totalLength += $ln( chunk );
                                                       }
                                                   }
                                                   catch( readError )
                                                   {
                                                       controller.error( new Error( `Error reading from input ReadableStream: ${readError.message}` ) );

                                                       toolBocksModule.handleError( resolveError( readError ), me._streamToSingleChunkedStream, chunks, pValue );

                                                       return;
                                                   }
                                                   finally
                                                   {
                                                       attempt( () => reader.releaseLock() );
                                                   }

                                                   // Concatenate all chunks into a single Uint8Array
                                                   encodedData = new Uint8Array( totalLength );

                                                   let offset = 0;

                                                   for( const chunk of chunks )
                                                   {
                                                       encodedData.set( chunk, offset );

                                                       offset += chunk.length;
                                                   }
                                               }

                                               // Enqueue the single, potentially buffered, chunk
                                               if ( encodedData )
                                               {
                                                   controller.enqueue( encodedData );
                                               }

                                               controller.close();
                                           },

                                           /**
                                            * The `cancel` method is called if the consumer cancels the stream.
                                            * If the original value was a ReadableStream, attempt to cancel it.
                                            * @param {any} pReason The reason for cancellation.
                                            */
                                           async cancel( pReason )
                                           {
                                               if ( pValue instanceof ReadableStream )
                                               {
                                                   // Attempt to cancel the underlying source stream
                                                   await asyncAttempt( async() => await pValue.cancel( pReason ).catch( e => console.error( "Error cancelling source stream:", e ) ) );

                                                   const event = new ModuleEvent( "StreamCancelled", { reason: pReason } );
                                                   toolBocksModule.dispatchEvent( event );
                                               }
                                           }
                                       } );
        }

        /**
         * Converts a given value into a ReadableStream.
         * The stream will contain the value encoded as UTF-8 bytes.
         *
         * @param {any} pValue The value to render as a ReadableStream.
         * Can be a string, Buffer (Node.js/Deno), Object literal,
         * Array, ArrayBuffer, Uint8Array, or any other primitive.
         *
         * @returns {ReadableStream} A ReadableStream that emits the encoded bytes of the input value.
         */
        asSingleChunkStream( pValue )
        {
            let encodedData = null;

            try
            {
                if ( pValue instanceof ReadableStream )
                {
                    return this._streamToSingleChunkedStream( pValue );
                }

                encodedData = Streamer._encodeData( pValue );
            }
            catch( ex )
            {
                console.error( "Streamer: Failed to encode value:", ex );

                return new ReadableStream( {
                                               start( controller )
                                               {
                                                   controller.error( new Error( `Failed to encode value for streaming: ${ex.message}` ) );
                                               }
                                           } );
            }

            // Create a new ReadableStream.
            // The 'start' method is called immediately when the stream is consumed.
            return new ReadableStream( {
                                           start( controller )
                                           {
                                               // If there's encoded data, enqueue it into the stream.
                                               if ( encodedData )
                                               {
                                                   controller.enqueue( encodedData );
                                               }
                                               // Close the stream immediately after enqueuing the single chunk of data.
                                               controller.close();
                                           }
                                       } );
        }

        asChunkedStream( pValue, pChunkSize = this.chunkSize, pDelayMs = this.delayMs )
        {
            if ( pValue instanceof ReadableStream )
            {
                return this._streamAsChunkedStream( pValue, pChunkSize, pDelayMs );
            }

            let encodedData = attempt( () => Streamer._encodeData( pValue ) );

            const chunkSize = clamp( asInt( pChunkSize, this.chunkSize ), MIN_STREAMING_CHUNK_SIZE, MAX_STREAMING_CHUNK_SIZE );
            const delayMs = clamp( asInt( pDelayMs, this.delayMs ), MIN_STREAMING_DELAY_MILLISECONDS, MAX_STREAMING_DELAY_MILLISECONDS );

            let offset = 0; // Keep track of the current position in the encoded data

            return new ReadableStream( {
                                           start( controller )
                                           {
                                               offset = Math.min( offset, $ln( encodedData ) );
                                           },

                                           /**
                                            * The `pull` method is called repeatedly
                                            * by the stream's internal queueing
                                            * mechanism whenever it's ready to accept more data.
                                            *
                                            * It is implemented here as an async function,
                                            * allowing for a configured delay.
                                            * @param {ReadableStreamDefaultController} controller
                                            */
                                           async pull( controller )
                                           {
                                               const dataLength = $ln( encodedData );

                                               if ( offset < dataLength )
                                               {
                                                   // Calculate the end of the current chunk
                                                   const end = Math.min( offset + chunkSize, dataLength );

                                                   // Extract the chunk
                                                   const chunk = encodedData.slice( offset, end );

                                                   // Enqueue the chunk
                                                   controller.enqueue( chunk );

                                                   // Update the offset for the next pull call
                                                   offset = end;

                                                   // If a delay is specified, wait before allowing the next pull call
                                                   if ( delayMs > 0 )
                                                   {
                                                       await asyncAttempt( async() => await sleep( delayMs ) );
                                                   }
                                               }
                                               else
                                               {
                                                   // If all data has been enqueued, close the stream
                                                   controller.close();
                                               }
                                           },

                                           cancel( pReason )
                                           {
                                               const event = new ModuleEvent( "StreamCancelled", { reason: pReason } );
                                               toolBocksModule.dispatchEvent( event );
                                           }
                                       } );
        }

        _streamAsChunkedStream( pValue, pChunkSize = this.chunkSize, pDelayMs = this.delayMs )
        {
            if ( !(pValue instanceof ReadableStream) )
            {
                return this.asChunkedStream( pValue, pChunkSize, pDelayMs );
            }

            const chunkSize = clamp( asInt( pChunkSize, this.chunkSize ), MIN_STREAMING_CHUNK_SIZE, MAX_STREAMING_CHUNK_SIZE );
            const delayMs = clamp( asInt( pDelayMs, this.delayMs ), MIN_STREAMING_DELAY_MILLISECONDS, MAX_STREAMING_DELAY_MILLISECONDS );

            // Variables for internal buffering when input is a ReadableStream
            let sourceReader = null;
            let internalBuffer = new Uint8Array( 0 );
            let bufferOffset = 0;
            let sourceStreamDone = false;

            const me = this;

            return new ReadableStream( {
                                           /**
                                            * The `start` method is called exactly once when the stream is constructed.
                                            * It initializes the source of data.
                                            * @param {ReadableStreamDefaultController} controller
                                            */
                                           async start( controller )
                                           {
                                               if ( pValue instanceof ReadableStream )
                                               {
                                                   sourceReader = attempt( () => pValue.getReader() );
                                               }
                                           },

                                           /**
                                            * The `pull` method is called repeatedly by the stream's internal queueing
                                            * mechanism whenever it's ready to accept more data.
                                            * It can be an async function, allowing for delays and reading from source streams.
                                            * @param {ReadableStreamDefaultController} controller
                                            */
                                           async pull( controller )
                                           {
                                               // If the source is another ReadableStream, keep pulling from it until
                                               // we have enough data in our internal buffer to form a chunk, or the source is exhausted.
                                               if ( sourceReader && !sourceStreamDone )
                                               {
                                                   // While we don't have enough data for a chunk AND the source isn't done
                                                   while ( (($ln( internalBuffer ) - bufferOffset) < chunkSize) && !sourceStreamDone )
                                                   {
                                                       try
                                                       {
                                                           const
                                                               {
                                                                   done,
                                                                   value: newChunk
                                                               } = await asyncAttempt( async() => await sourceReader.read() );

                                                           if ( done )
                                                           {
                                                               sourceStreamDone = true;
                                                               break;
                                                           }

                                                           // Append newChunk to internalBuffer
                                                           const tempBuffer = new Uint8Array( ($ln( internalBuffer ) - bufferOffset) + $ln( newChunk ) );
                                                           tempBuffer.set( internalBuffer.slice( bufferOffset ) ); // Copy unread part
                                                           tempBuffer.set( newChunk, ($ln( internalBuffer ) - bufferOffset) ); // Append new chunk
                                                           internalBuffer = tempBuffer;
                                                           bufferOffset = 0; // Reset offset as buffer is now compacted
                                                       }
                                                       catch( readError )
                                                       {
                                                           controller.error( new Error( `Error reading from input ReadableStream during pull: ${readError.message}` ) );

                                                           sourceStreamDone = true; // Mark source as done due to error

                                                           toolBocksModule.handleError( resolveError( readError ), me._streamAsChunkedStream, pValue );

                                                           return;
                                                       }
                                                   }
                                               }

                                               // Now, try to enqueue a chunk from the internal buffer
                                               if ( ($ln( internalBuffer ) - bufferOffset) > 0 )
                                               {
                                                   const bytesAvailable = ($ln( internalBuffer ) - bufferOffset);
                                                   const bytesToEnqueue = Math.min( chunkSize, bytesAvailable );
                                                   const chunk = internalBuffer.slice( bufferOffset, bufferOffset + bytesToEnqueue );

                                                   controller.enqueue( chunk );
                                                   bufferOffset += bytesToEnqueue;

                                                   if ( delayMs > 0 )
                                                   {
                                                       await asyncAttempt( async() => await sleep( delayMs ) );
                                                   }
                                               }
                                               else if ( sourceStreamDone )
                                               {
                                                   // If the internal buffer is empty AND the source stream is done, close the output stream
                                                   controller.close();
                                               }
                                           },

                                           /**
                                            * The `cancel` method is called if the consumer cancels the stream.
                                            * If the original value was a ReadableStream, attempt to cancel it.
                                            * @param {any} pReason The reason for cancellation.
                                            */
                                           async cancel( pReason )
                                           {
                                               if ( sourceReader )
                                               {
                                                   await asyncAttempt( async() => await sourceReader.cancel( pReason ).catch( e => toolBocksModule.handleError( resolveError( e ), me._streamAsChunkedStream, this.cancel ) ) );

                                                   const event = new ModuleEvent( "StreamCancelled", { reason: pReason } );
                                                   toolBocksModule.dispatchEvent( event );
                                               }
                                           }
                                       } );
        }

        #processCharacterChunks( pChunks, pDecoder, pParseJson )
        {
            let chunks = asArray( pChunks || [] ).filter( isNonNullObject ).filter( e => isTypedArray( e ) || e instanceof ArrayBuffer || isTypedBuffer( e ) );

            let decoder = pDecoder || new TextDecoder();

            let s = chunks.map( chunk => decoder.decode( chunk ) ).join( "" );
            s += decoder.decode();

            // If the content is JSON and pParseJson is true,
            // we will convert the result into an object
            if ( pParseJson && isJson( s ) )
            {
                try
                {
                    return parseJson( s );
                }
                catch( error )
                {
                    toolBocksModule.handleError( error, "Streamer.readStream", chunks, s );
                    return s;
                }
            }
            return s;
        }

        /**
         * Reads a stream, converting its contents into either an object, string, or Uni8Array (or Buffer, if defined).
         * The second argument specified what kind of data we expect to find in the stream (binary versus text)
         * The third argument specified whether to parse a string that is expected to be JSON into an object.
         * @param pStream
         * @param pContentType
         * @param pParseJson
         * @returns {Promise<Object|String|Uint8Array>}
         */
        async readStream( pStream, pContentType, pParseJson = true )
        {
            let stream = pStream instanceof ReadableStream ? pStream : this.asChunkedStream( pStream );

            let contentType = lcase( asString( pContentType, true ) );

            // Determine whether we expect the stream to contain character data.
            const isCharacterData = /(text\/.*|application\/(json|javascript|xml|xhtml\+xml)|charset=)/i.test( contentType );

            let totalLength = 0;

            const chunks = [];

            try
            {
                for await ( const chunk of stream )
                {
                    chunks.push( chunk );
                    totalLength += chunk.length;
                }

                // For character data, we will need the TextDecoder
                if ( isCharacterData )
                {
                    // Extract the character set from the content type, defaulting to 'utf-8' if not found.
                    const charsetMatch = contentType.match( /charset=([^;]+)/i );
                    const charset = $ln( charsetMatch ) > 1 ? charsetMatch[1] : "utf-8";

                    let decoder = new TextDecoder( charset );

                    return attempt( () => this.#processCharacterChunks( chunks, decoder, !!pParseJson ) );
                }
                else
                {
                    // otherwise, we treat the chunks as binary data.
                    // Combine all Uint8Array chunks into a single one.
                    // We use a traditional loop here for better performance,
                    // avoiding the creation of a new array on each iteration,
                    // which is inefficient for large binary streams.

                    const uint8Array = new Uint8Array( totalLength );

                    let offset = 0;

                    for( const chunk of chunks )
                    {
                        uint8Array.set( chunk, offset );
                        offset += chunk.length;
                    }

                    return uint8Array;
                }
            }
            catch( error )
            {
                toolBocksModule.handleError( error, "Streamer.readStream", chunks );
                throw error;
            }
        }
    }

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
            isFile,
            toReadableStream: function( pValue )
            {
                return new Streamer().asSingleChunkStream( pValue );
            },
            toThrottledReadableStream: function( pValue, pChunkSize, pDelayMs )
            {
                const streamer = new Streamer( { chunkSize: asInt( pChunkSize ), delayMs: asInt( pDelayMs ) } );
                return streamer.asChunkedStream( pValue, pChunkSize, pDelayMs );
            },
            readStream: async function( pStream, pContentType, pParseJson )
            {
                const streamer = new Streamer( {
                                                   chunkSize: DEFAULT_STREAMING_CHUNK_SIZE,
                                                   delayMs: asInt( DEFAULT_STREAMING_DELAY_MILLISECONDS )
                                               } );
                return streamer.readStream( pStream, pContentType, pParseJson );
            },
            Streamer
        };

    mod = { ...mod, ...more };

    mod.Buffer = mod.Buffer || scp.Buffer || Buffer;

    scp = null;

    mod = toolBocksModule.extend( mod );

    return mod.expose( mod, INTERNAL_NAME, (_ud !== typeof module ? module : mod) ) || mod;

}());
