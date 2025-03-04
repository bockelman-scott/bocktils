/**
 * This module provides some convenience methods for working with compressed (zipped) data.
 *
 * The most common use case is to read a zip file from the file system or from a memory buffer.
 *
 * Example - from File:
 *
 *           // read the file into a Buffer
 *           const zipContents = fs.readFileSync( zipFilePath );
 *
 *           // get the entries of the archive (pkzip stores archives as a collection of entries)
 *           const entries = zipUtils.getEntries( zipContents );
 *
 *           // read the first entry into a Buffer
 *           const data = entries[0].getData();
 *
 *           // do something with the buffer... such as convert it to a string, for example
 *           const str = data.toString("utf-8");
 *
 *  For more example usage and features, see CompressionUtils.test.js in the __tests__ directory.
 *
 *  @dependencies adm-zip, zlib, and the common utilities provided in this package
 */

/**
 * This statement imports the core utils modules:
 * Constants, TypeUtils, StringUtils, and ArrayUtils
 */
const core = require( "@toolbocks/core" );

/**
 * Establish separate constants for each of the common utilities imported
 * @see ../src/CoreUtils.cjs
 */
const { moduleUtils, constants, typeUtils, stringUtils, arrayUtils } = core;

const bufferUtils = require( "@toolbocks/buffer" );

const base64Utils = require( "@toolbocks/base64" );

const fileUtils = require( "@toolbocks/files" );

/**
 * Import adm-zip dependency
 */
const admZip = require( "adm-zip" );

const fs = require( "node:fs" );

const { pipeline } = require( "node:stream/promises" );
const { Readable } = require( "node:stream" );

const zlib = require( "node:zlib" );
const crypto = require( "node:crypto" );

const { _ud = "undefined", $scope } = constants;

(function exposeModule()
{
    const INTERNAL_NAME = "__BOCK__COMPRESSION_UTILS__";

    if ( $scope() && (null != $scope()[INTERNAL_NAME]) )
    {
        return $scope()[INTERNAL_NAME];
    }

    const {
        ToolBocksModule,
        populateOptions,
        no_op,
        lock,
        resolveError,
        attempt,
        asyncAttempt
    } = moduleUtils;

    const {
        _mt_str,
        _dot,
        _str,
        _num,
        _big,
        _bool,
        _obj,
        S_ERROR,
        S_WARN
    } = constants;

    const {
        isNull,
        isString,
        isNumeric,
        isObject,
        isNonNullObject,
        isFunction,
        isArray,
        isTypedArray,
        toDecimal,
        toBits
    } = typeUtils;

    const { asString, asInt, isBlank, lcase, ucase, toBool } = stringUtils;

    const { varargs, asArray, Filters } = arrayUtils;

    const {
        isFile,
        isDirectory,
        resolvePath,
        removeExtension,
        replaceExtension,
        lstat,
        exists,
        readFile,
        writeFile,
        opendir,
        makeDirectory,
        asyncMakeDirectory,
        removeDirectory,
        asyncRemoveDirectory,
        readLink,
        link,
        unlink,
        asyncLink,
        isSymbolicLink,
        resolveDirectoryPath,
        extractPathSeparator,
        getFilePathData,
        getFileName,
        getDirectoryName,
        getFileExtension,

    } = fileUtils || $scope();

    const {
        File,
        arrayFromBuffer,
        typedArrayFromBuffer
    } = bufferUtils || $scope();

    if ( _ud === typeof Buffer )
    {
        Buffer = bufferUtils.Buffer || $scope().Buffer;
    }

    function isBuffer( pPath )
    {
        return isArray( pPath ) || isTypedArray( pPath ) || pPath instanceof Buffer;
    }

    const { encode, decode } = base64Utils;

    const modName = "CompressionUtils";

    const toolbocksModule = new ToolBocksModule( modName, INTERNAL_NAME );

    const ZERO_LENGTH_BUFFER = lock( Buffer.alloc( 0 ) );

    /**
     * The actual number of bytes in a megabyte
     * @type {number}
     */
    const BYTES_PER_MEGABYTE = 1_048_576;

    /**
     * The maximum number of entries an archive may have before we consider it potentially unsafe
     * @type {number}
     */
    const MAX_ENTRIES_ALLOWED = 100;

    /**
     * The largest uncompressed size supported for an archive
     * @type {number}
     */
    const MAX_SIZE_ALLOWED = (25 * BYTES_PER_MEGABYTE);

    const PKZIP_CLASSES = (function()
    {
        /**
         * This class represents the PkZip internal header for an archive
         */
        class ArchiveDataHeader
        {
            constructor( pOptions, pImpl )
            {
                const options = Object.assign( {}, pOptions || {} );

                this.implementation = pImpl || options.dataHeader || options;

                this.dataHeader = options.dataHeader || options;

                this.version = options.version || this.dataHeader?.version;
                this.flags = options.flags || this.dataHeader?.flags;
                this.method = options.method || this.dataHeader?.method;
                this.time = options.time || this.dataHeader?.time;
                this.crc = options.crc || this.dataHeader?.crc;
                this.compressedSize = options.compressedSize || this.dataHeader?.compressedSize;
                this.size = options.size || this.dataHeader?.size;
                this.fnameLen = options.fnameLen || this.dataHeader?.fnameLen;
                this.extraLen = options.extraLen || this.dataHeader?.extraLen;
            }
        }

        /**
         * This static factory method returns a new instance of ArchiveDataHeader
         * for the specified portion of the PkZip archive
         * @param pHeader
         * @returns {ArchiveDataHeader}
         */
        ArchiveDataHeader.fromDataHeader = function( pHeader )
        {
            return new ArchiveDataHeader( pHeader );
        };

        /**
         * This class represents the PkZip internal header for an archive Entry
         *
         * @class
         */
        class ArchiveEntryHeader
        {
            constructor( pOptions, pImpl )
            {
                const options = Object.assign( {}, pOptions || {} );

                this.implementation = pImpl || options.header || options;

                this.header = options.header || options;

                this.made = options.made || this.header?.made;
                this.version = options.version || this.header?.version;
                this.flags = options.flags || this.header?.flags;
                this.method = options.method || this.header?.method;
                this.time = options.time || this.header?.time;
                this.crc = options.crc || this.header?.crc;
                this.compressedSize = options.compressedSize || this.header?.compressedSize;
                this.size = options.size || this.header?.size;
                this.fileNameLength = options.fileNameLength || this.header?.fileNameLength;
                this.extraLength = options.extraLength || this.header?.extraLength;
                this.commentLength = options.commentLength || this.header?.commentLength;
                this.diskNumStart = options.diskNumStart || this.header?.diskNumStart;
                this.inAttr = options.inAttr || this.header?.inAttr;

                this.attr = options.attr || this.header?.attr;
                this.offset = options.offset || this.header?.offset;

                this.encripted = options.encripted || options.encrypted || this.header?.encripted || this.header?.encrypted;
                this.entryHeaderSize = options.entryHeaderSize || this.header?.entryHeaderSize;
                this.realDataOffset = options.realDataOffset || this.header?.realDataOffset;

                this.dataHeader = ArchiveDataHeader.fromDataHeader( options.dataHeader || this.header?.dataHeader );
            }

            loadDataHeaderFromBinary( pBuffer )
            {
                // TODO: if necessary or desired in a future release
            }

            loadFromBinary( pBuffer )
            {
                // TODO: if necessary or desired in a future release
            }

            dataHeaderToBinary()
            {
                // TODO: if necessary or desired in a future release
            }

            entryHeaderToBinary()
            {
                // TODO: if necessary or desired in a future release
            }

            toString()
            {
                // TODO: if necessary or desired in a future release
            }

        }

        /**
         * This static factory method returns a new instance of ArchiveEntryHeader
         * for the specified portion of the PkZip archive
         * @param pHeader
         * @returns {ArchiveEntryHeader}
         */
        ArchiveEntryHeader.fromHeader = function( pHeader )
        {
            return new ArchiveEntryHeader( pHeader );
        };

        class CentralDirectory
        {
            constructor( pOptions, pImpl )
            {

            }
        }

        CentralDirectory.from = function( pOptions, pImpl )
        {

        };

        /**
         * This is a wrapper around a zip entry,
         * so that consumer code does not rely on a specific library's implementation.
         * Note that even this module uses both AdmZip and zLib and could change in the future.
         * Consumers of this module should not need to know what libraries are being used.
         */
        class ArchiveEntry
        {
            constructor( pOptions, pImpl )
            {
                const options = Object.assign( {}, pOptions || {} );

                this.implementation = pImpl || options.zipEntry || options;

                this.zipEntry = options.zipEntry || this.implementation || options;

                this.name = asString( options.name || this.zipEntry?.name );

                this.header = ArchiveEntryHeader.fromHeader( options?.header || options );

                this.isDirectory = options.isDirectory || this.zipEntry.isDirectory;

                this.comment = asString( options.comment || this.zipEntry.comment );

                this.extra = options.extra || this.zipEntry.extra;
            }

            /**
             * Returns a Buffer containing the bytes of the still-compressed data
             * @returns {Buffer|Uint8Array}
             */
            getCompressedData()
            {
                if ( this.zipEntry && (isFunction( this.zipEntry.getCompressedData )) )
                {
                    return this.zipEntry.getCompressedData();
                }

                if ( this.implementation && (isFunction( this.implementation.getCompressedData )) )
                {
                    return this.implementation.getCompressedData();
                }

                return ZERO_LENGTH_BUFFER;
            }

            /**
             * Returns a Promise for a Buffer containing the bytes of the still-compressed data
             * @param pCallback
             * @returns {Promise<Buffer|Uint8Array>}
             */
            async getCompressedDataAsync( pCallback )
            {
                if ( this.zipEntry && (isFunction( this.zipEntry.getCompressedDataAsync )) )
                {
                    return await this.zipEntry.getCompressedDataAsync( pCallback );
                }

                if ( this.implementation && (isFunction( this.implementation.getCompressedDataAsync )) )
                {
                    return await this.implementation.getCompressedDataAsync( pCallback );
                }

                return ZERO_LENGTH_BUFFER;
            }

            /**
             * Returns either the specified encoding, if is valid or the default encoding, utf-8
             * @param pEncoding the encoding to use for converting a buffer from one format to another
             * @returns {BufferEncoding}
             */
            resolveEncoding( pEncoding )
            {
                return lcase( pEncoding || "utf-8" );
            }

            /**
             * Returns a Buffer of the uncompressed bytes for this entry
             * @returns {Buffer}
             */
            getData()
            {
                if ( this.zipEntry && (isFunction( this.zipEntry.getData )) )
                {
                    return this.zipEntry.getData();
                }

                if ( this.implementation && (isFunction( this.implementation.getData )) )
                {
                    return this.implementation.getData();
                }

                return ZERO_LENGTH_BUFFER;
            }

            /**
             * Returns the uncompressed content of this entry as the specified data type, if possible.
             * Particularly useful if unzipping text files,
             * as you can specify "string" and the character encoding expected,
             * and the method will return that string
             *
             * If called without arguments, returns a new Uint8Array of the uncompressed bytes
             *
             * @param pType {string} the data type to return
             * @param pEncoding the character encoding to use if the specified type is "string"
             * (or a scalar type that requires a temporary string: see implementation)
             *
             * @returns {Uint8Array|number|{}|{}|boolean|string}
             */
            getDataAs( pType, pEncoding = "utf-8" )
            {
                const buffer = this.getData();

                switch ( lcase( pType ) )
                {
                    case _str:
                        return buffer.toString( this.resolveEncoding( pEncoding ) || "utf-8" );

                    case _num:
                    case _big:
                        return stringUtils.asFloat( this.getDataAs( _str, this.resolveEncoding( pEncoding ) ) );

                    case _bool:
                        return stringUtils.toBool( this.getDataAs( _str, this.resolveEncoding( pEncoding ) ) );

                    case _obj:
                        let obj = {};

                        let json = this.getDataAs( _str, this.resolveEncoding( pEncoding ) );

                        if ( stringUtils.isValidJson( json ) )
                        {
                            try
                            {
                                obj = JSON.parse( json );
                            }
                            catch( ex )
                            {
                                toolbocksModule.reportError( ex, "parsing JSON data", S_ERROR, modName + "::getDataAs" );
                            }
                        }
                        return obj || {};

                    default:
                        return new Uint8Array( buffer );
                }
            }

            /**
             * Returns a Promise for a Buffer of the uncompressed bytes for this entry
             * @returns {Promise<Buffer>}
             */
            async getDataAsync( pCallback )
            {
                if ( this.zipEntry && (isFunction( this.zipEntry.getDataAsync )) )
                {
                    return await this.zipEntry.getDataAsync( pCallback );
                }

                if ( this.implementation && (isFunction( this.implementation.getDataAsync )) )
                {
                    return await this.implementation.getDataAsync( pCallback );
                }

                return ZERO_LENGTH_BUFFER;
            }

            toString()
            {
                if ( this.zipEntry && (isFunction( this.zipEntry.toString )) )
                {
                    return this.zipEntry.toString();
                }

                if ( this.implementation && (isFunction( this.implementation.toString )) )
                {
                    return this.implementation.toString();
                }

                return Object.toString.call( this.zipEntry || this );
            }
        }

        /**
         * Static factory method for creating an instance of ArchiveEntry
         * @param pZipEntry
         * @returns {ArchiveEntry}
         */
        ArchiveEntry.fromZipEntry = function( pZipEntry )
        {
            return new ArchiveEntry( pZipEntry, pZipEntry );
        };

        /**
         * Returns the number of entries in the archive
         * @param pArchive a Buffer or a TypedArray of bytes representing an archive
         * @returns {number} the number of entries in the archive
         */
        const getEntryCount = function( pArchive )
        {
            let archiver;

            let count = 0;

            try
            {
                archiver = new admZip( pArchive, { fs: fs } );

                count = archiver.getEntryCount() || 0;
            }
            catch( ex )
            {
                toolbocksModule.reportError( ex, "counting archive entries", S_ERROR, modName + "::getEntryCount" );
            }

            return count;
        };

        /**
         * Returns an array of ArchiveEntry objects found in the specified archive
         * @param pArchive {Buffer|Array|string} a Buffer or an array of bytes representing an archive
         * @param pPassword {string} (optional) password required to access the contents of the archive
         * @returns {*[]} an array of ArchiveEntry objects found in the specified archive
         */
        const getEntries = function( pArchive, pPassword )
        {
            let archiver;

            let entries = [];

            try
            {
                archiver = new admZip( pArchive, { input: pArchive, password: pPassword, fs: fs } );

                entries = [].concat( ((isBlank( asString( pPassword ) ) ? archiver.getEntries() : archiver.getEntries( pPassword )) || []) );

                entries = entries.map( e => ArchiveEntry.fromZipEntry( e ) );
            }
            catch( ex )
            {
                toolbocksModule.reportError( ex, "getting the archive entries", S_ERROR, modName + "::getEntries" );

                let archive = repair( pArchive );

            }

            return entries;
        };

        /**
         * Returns an instance of ArchiveEntry representing the named entry (or the entry at the specified index)
         * @param pArchive {Buffer|Array|string} a Buffer or an array of bytes representing an archive
         * @param pName {string|number} The file name of the entry to return or the index of the entry to return
         * @param pPassword {string} (optional) password required to access the contents of the archive
         * @returns {ArchiveEntry} an instance of ArchiveEntry representing the named entry (or the entry at the specified index)
         */
        const getEntry = function( pArchive, pName, pPassword = _mt_str )
        {
            let archiver, entry, archiveEntry = null;

            const name = isString( pName ) ? asString( pName ) : isNumeric( pName ) ? asInt( pName ) : 0;

            if ( isString( name ) )
            {
                try
                {
                    archiver = new admZip( pArchive, { input: pArchive, password: pPassword, name: name, fs: fs } );
                    entry = archiver.getEntry( name );
                }
                catch( ex )
                {
                    toolbocksModule.reportError( ex, "getting the archive entry, '" + name + "'", S_ERROR, modName + "::getEntry" );
                }
            }
            else
            {
                const entries = getEntries( pArchive, pPassword );
                entry = entries?.length > name ? entries[name] : null;
            }

            if ( entry )
            {
                try
                {
                    archiveEntry = ArchiveEntry.fromZipEntry( entry );
                }
                catch( ex )
                {
                    toolbocksModule.reportError( ex, "getting the archive entry, '" + name + "'", S_ERROR, modName + "::getEntry" );
                }
            }

            return archiveEntry || entry;
        };

        const repair = function( pArchive )
        {

        };

        const forEach = function( pArchive, pPassword, pCallback )
        {
            let entries = getEntries( pArchive, pPassword );

            if ( entries )
            {
                entries.forEach( pCallback );
            }
        };

        const isEmptyArchive = function( pBuffer )
        {
            if ( _ud === typeof pBuffer || null === pBuffer || pBuffer?.length <= 22 )
            {
                return true;
            }

            const entryCount = getEntryCount( pBuffer );

            return entryCount <= 0 || pBuffer?.length <= 22;
        };

        const exceedsMaxEntries = function( pBuffer )
        {
            if ( !isEmptyArchive( pBuffer ) )
            {
                const entryCount = getEntryCount( pBuffer );

                return entryCount > MAX_ENTRIES_ALLOWED;
            }

            return false;
        };

        const calculateTotalUncompressedSize = function( pBuffer, pPassword )
        {
            let totalUncompressedSize = 0;

            const entries = getEntries( pBuffer, pPassword );

            if ( entries && entries.length )
            {
                for( let i = 0, n = entries.length; i < n; i++ )
                {
                    let entry = entries[i];

                    if ( entry )
                    {
                        let hdr = entry?.header;

                        if ( hdr )
                        {
                            let size = Math.max( stringUtils.asInt( hdr?.size, 0 ), 0 );

                            totalUncompressedSize += size;
                        }
                    }
                }
            }

            return totalUncompressedSize;
        };

        const exceedsMaxSize = function( pBuffer )
        {
            let totalUncompressedSize = calculateTotalUncompressedSize( pBuffer );

            return totalUncompressedSize > MAX_SIZE_ALLOWED;
        };

        const isPotentialZipBomb = function( pBuffer )
        {
            if ( exceedsMaxSize( pBuffer ) )
            {
                return (calculateTotalUncompressedSize( pBuffer ) > (1_000 * BYTES_PER_MEGABYTE));
            }

            return false;
        };

        const isSafeArchive = function( pBuffer )
        {
            if ( isEmptyArchive( pBuffer ) )
            {
                throw new Error( "The archive is empty" );
            }

            if ( exceedsMaxEntries( pBuffer ) )
            {
                throw new Error( "The archive contains more than the maximum allowed entries (" + MAX_ENTRIES_ALLOWED + ")" );
            }

            if ( exceedsMaxSize( pBuffer ) )
            {
                throw new Error( "The total size of the uncompressed data exceeds the limit of " + MAX_SIZE_ALLOWED );
            }

            if ( isPotentialZipBomb( pBuffer ) )
            {
                throw new Error( "The buffer appears to contain a \"ZIP BOMB\", that is, the zip when inflated would be over 1,000 times the maximum allowed size of " + MAX_SIZE_ALLOWED + " bytes" );
            }

            return true;
        };

        return {
            ArchiveEntry,
            ArchiveEntryHeader,
            ArchiveDataHeader,
            CentralDirectory,
            getEntryCount,
            getEntries,
            getEntry,
            repair,
            forEach,
            isEmptyArchive,
            exceedsMaxEntries,
            calculateTotalUncompressedSize,
            exceedsMaxSize,
            isSafeArchive,
            isPotentialZipBomb
        };
    }());

    const {
        ArchiveEntry,
        ArchiveEntryHeader,
        ArchiveDataHeader,
        CentralDirectory,
        getEntryCount,
        getEntries,
        getEntry,
        repair,
        forEach,
        isEmptyArchive,
        exceedsMaxEntries,
        calculateTotalUncompressedSize,
        exceedsMaxSize,
        isSafeArchive,
        isPotentialZipBomb
    } = PKZIP_CLASSES;

    function _resolveInputOutput( pInputPath, pOutputPath )
    {
        const inputPath = isString( pInputPath ) ? resolvePath( asString( pInputPath, true ) ) : isBuffer( pInputPath ) ? Buffer.from( pInputPath ) : asArray( pInputPath );
        const outputPath = isString( pOutputPath ) ? resolvePath( asString( pOutputPath, true ) ) : isBuffer( pOutputPath ) ? Buffer.from( pOutputPath ) : asArray( pOutputPath );

        return { inputPath, outputPath };
    }

    const CIPHER = "aes-256-cbc";
    const KEY_LENGTH = 32;
    const VECTOR_LENGTH = 16;

    const DEFAULT_ENCODING = "utf-8";

    class PasswordProtection
    {
        #encryptedPassword = null;
        #initializationVector = null;
        #salt = null;
        #key = null;

        #inputEncoding = "utf-8";
        #outputEncoding = "utf-8";

        constructor( encryptedPassword, initializationVector, salt, key, inputEncoding, outputEncoding )
        {
            this.#encryptedPassword = arrayFromBuffer( encryptedPassword );
            this.#initializationVector = arrayFromBuffer( initializationVector );
            this.#salt = arrayFromBuffer( salt );
            this.#key = arrayFromBuffer( key );

            this.#inputEncoding = isString( encryptedPassword ) ? inputEncoding || DEFAULT_ENCODING : null;
            this.#outputEncoding = isString( outputEncoding ) ? outputEncoding || DEFAULT_ENCODING : null;
        }

        #update( decipher )
        {
            if ( isString( this.#encryptedPassword ) )
            {
                return decipher.update( this.#encryptedPassword, this.#inputEncoding || DEFAULT_ENCODING );
            }
            else if ( isArray( this.#encryptedPassword ) )
            {
                return decipher.update( new Uint8Array( this.#encryptedPassword ) );
            }
            return decipher.update( this.#encryptedPassword );
        }

        /**
         *
         * @returns {string}
         */
        decrypt()
        {
            const decipher = crypto.createDecipheriv( CIPHER, arrayFromBuffer( this.#key ), arrayFromBuffer( this.#initializationVector ) );
            let decrypted = this.#update( decipher );
            decrypted = Buffer.concat( [decrypted, decipher.final()] );
            return decrypted.toString( "utf-8" );
        }

        static encrypt( pPassword, pSalt, pInputEncoding, pOutputEncoding )
        {
            const pwd = Buffer.from( pPassword, pInputEncoding );
            const salt = Buffer.from( pSalt, pInputEncoding );

            const options =
                {
                    N: 2 ** 14,
                    r: 8,
                    p: 1
                };

            const key = crypto.scryptSync( pwd, salt, KEY_LENGTH, options );

            const iv = crypto.randomBytes( VECTOR_LENGTH ); // Generate a random IV for each encryption

            const cipher = crypto.createCipheriv( CIPHER, key, iv );

            let encrypted = cipher.update( pwd );

            encrypted = Buffer.concat( [encrypted, cipher.final()] );

            return new PasswordProtection( encrypted, iv, salt, key, pInputEncoding, pOutputEncoding );
        }

        serialize()
        {
            const rx = /=+$/;

            const pwd = encode( this.#encryptedPassword ).replace( rx, _mt_str );
            const pwdLen = pwd.length;

            const iv = encode( this.#initializationVector ).replace( rx, _mt_str );
            const ivLen = iv.length;

            const salt = encode( this.#salt ).replace( rx, _mt_str );
            const saltLen = salt.length;

            const key = encode( this.#key ).replace( rx, _mt_str );
            const keyLen = key.length;

            const iptEnc = encode( this.#inputEncoding ).replace( rx, _mt_str );
            const iptEncLen = iptEnc.length;

            const outEnc = encode( this.#outputEncoding ).replace( rx, _mt_str );
            const outEncLen = outEnc.length;

            const preamble = (toBits( pwdLen, 16 ) +
                              toBits( ivLen, 16 ) +
                              toBits( saltLen, 16 ) +
                              toBits( keyLen, 16 ) +
                              toBits( iptEncLen, 8 ) +
                              toBits( outEncLen, 8 ));

            let encoded = (pwd + iv + salt + key + iptEnc + outEnc).trim();

            while ( encoded.length % 4 !== 0 )
            {
                encoded += "=";
            }

            const s = preamble + encoded;

            return asString( s, true );
        }

        static deserialize( pSerialized )
        {
            const s = pSerialized;

            const preamble = s.slice( 0, 80 );

            const pwdLen = toDecimal( "0b" + preamble.slice( 0, 16 ) );
            const ivLen = toDecimal( "0b" + preamble.slice( 16, 32 ) );
            const saltLen = toDecimal( "0b" + preamble.slice( 32, 48 ) );
            const keyLen = toDecimal( "0b" + preamble.slice( 48, 64 ) );

            const iptEncLen = toDecimal( "0b" + preamble.slice( 64, 72 ) );
            const outEncLen = toDecimal( "0b" + preamble.slice( 72, 80 ) );

            function decodeBase64( pStr )
            {
                let str = asString( pStr, true );

                while ( str.length % 4 !== 0 )
                {
                    str += "=";
                }

                return decode( str );
            }

            const encoded = s.slice( 80, s.length );

            let startIdx = 0;

            const pwd = decodeBase64( encoded.slice( startIdx, startIdx + pwdLen ) );
            startIdx += pwdLen;

            const iv = decodeBase64( encoded.slice( startIdx, startIdx + ivLen ) );
            startIdx += ivLen;

            const salt = decodeBase64( encoded.slice( startIdx, startIdx + saltLen ) );
            startIdx += saltLen;

            const key = decodeBase64( encoded.slice( startIdx, startIdx + keyLen ) );
            startIdx += keyLen;

            const iptEnc = decodeBase64( encoded.slice( startIdx, startIdx + iptEncLen ) );
            startIdx += iptEncLen;

            const outEnc = decodeBase64( encoded.slice( startIdx, startIdx + outEncLen ) );

            return new PasswordProtection( pwd, iv, salt, key, iptEnc, outEnc );
        }
    }

    const PKZIP_OPTIONS = lock(
        {
            archiver: admZip,
            reviver: admZip,

            extension: ".zip",

            encoding: DEFAULT_ENCODING,

            overwrite: false,
            keepOriginalPermission: false,

            zipPath: _mt_str,
            zipName: _mt_str,

            filter: Filters.IDENTITY,

            comment: _mt_str
        } );

    const GZIP_OPTIONS = lock(
        {
            archiver: zlib.createGzip,
            reviver: zlib.createGunzip,
            extension: ".gz",

            encoding: DEFAULT_ENCODING,

            filter: Filters.IDENTITY
        } );

    const DEFLATE_OPTIONS = lock(
        {
            archiver: zlib.createDeflate,
            reviver: zlib.createInflate,
            extension: ".z",

            encoding: DEFAULT_ENCODING,

            filter: Filters.IDENTITY
        } );

    const INFLATE_OPTIONS = lock(
        {
            archiver: zlib.createDeflate,
            reviver: zlib.createInflate,
            extension: ".z",

            encoding: DEFAULT_ENCODING,

            filter: Filters.IDENTITY
        } );

    const BROTLI_OPTIONS = lock(
        {
            archiver: zlib.createBrotliCompress,
            reviver: zlib.createBrotliDecompress,
            extension: ".br",

            encoding: DEFAULT_ENCODING,

            filter: Filters.IDENTITY
        } );

    /**
     * Represents configuration options for a compression operation.
     *
     * @class
     */
    class CompressionOptions
    {
        constructor( pFormatSpecificOptions )
        {
            this.options = isNonNullObject( pFormatSpecificOptions ) ? pFormatSpecificOptions : GZIP_OPTIONS;

            this.archiver = this.options.archiver || GZIP_OPTIONS.archiver;
            this.reviver = this.options.reviver || GZIP_OPTIONS.reviver;

            this.extension = this.options.extension || GZIP_OPTIONS.extension;
            this.encoding = this.options.encoding || GZIP_OPTIONS.encoding;

            this.filter = this.options.filter || GZIP_OPTIONS.filter;
        }

        clone()
        {
            return lock( new CompressionOptions( this.options ) );
        }
    }

    CompressionOptions.PKZIP = lock( new CompressionOptions( PKZIP_OPTIONS ) );
    CompressionOptions.GZIP = lock( new CompressionOptions( GZIP_OPTIONS ) );
    CompressionOptions.DEFLATE = lock( new CompressionOptions( DEFLATE_OPTIONS ) );
    CompressionOptions.INFLATE = lock( new CompressionOptions( INFLATE_OPTIONS ) );
    CompressionOptions.BROTLI = lock( new CompressionOptions( BROTLI_OPTIONS ) );

    CompressionOptions.DEFAULT = lock( CompressionOptions.GZIP );

    const PIPE = lock(
        {
            FILE: 1,
            BUFFER: 2,
            DIRECTORY: 3,
        } );

    CompressionOptions.calculatePipe = async function( pInput, pOutput )
    {
        const { inputPath, outputPath } = _resolveInputOutput( pInput, pOutput );

        let leftSide = 0;
        let rightSide = 0;

        if ( isString( inputPath ) )
        {
            leftSide = isBuffer( inputPath ) ? PIPE.BUFFER : await isFile( inputPath ) ? PIPE.FILE : await isDirectory( inputPath ) ? PIPE.DIRECTORY : 0;
        }

        if ( isString( outputPath ) )
        {
            rightSide = isBuffer( outputPath ) ? PIPE.BUFFER : await isDirectory( outputPath ) ? PIPE.DIRECTORY : await isFile( outputPath ) ? PIPE.FILE : 0;
        }

        return {
            inputPath,
            outputPath,
            leftSide,
            rightSide
        };
    };

    /**
     * @typedef {function((string|Uint8Array<number>), (string|Uint8Array<number>), (CompressionOptions)): (Uint8Array<number>|string|boolean|void)} CompressionFunction A function that can compress or decompress an archive
     *
     * @param {string|Uint8Array<number>} pInputPath The file path, directory path, or byte array to compress or decompress an archive, file, or directory
     * @param {string|Uint8Array<number>} pOutputPath The file path, directory path, or byte array into which to compress or decompress an archive, file, or directory
     * @param {CompressionOptions} pOptions An instance of the CompressionOptions class
     *                                      (or an object with the same properties)
     *                                      defining an optional password-protection mechanism,
     *                                      whether to delete the source once compressed or decompressed,
     *                                      and optional callback functions to execute on error or on success
     *
     * @return {Uint8Array<number>|string|boolean|void} May return any of the following types of response:
     *                                                  The output array if provided,
     *                                                  the file path of the resulting archive
     *                                                  or resulting decompressed file(s),
     *                                                  a boolean indicating failure or success,
     *                                                  or void... no return type at all.
     *                                                  This depends greatly on the format and capabilities of third-party libraries
     *
     */


    let SUPPORTED_FORMATS = {};

    /**
     * Represents a compression format, encapsulating its name, file signatures,
     * compression and decompression functions, as well as related options.
     */
    class CompressionFormat
    {
        static #CACHE = new Map();

        /**
         * Constructs an instance of the CompressionFormat class.
         *
         * @param {string} pName The name of the compression format.
         * @param {Array} pSignatures An array of signatures associated with the compression format.
         * @param {Function} pDecompressionFunction The function used for decompression. If not provided, a default is used.
         * @param {Function} pCompressionFunction The function used for compression. If not provided, a default is used.
         * @param {CompressionOptions|Object} [pOptions=CompressionOptions.DEFAULT] Optional settings for compression and decompression. Defaults to CompressionOptions.DEFAULT.
         *
         * @return {CompressionFormat} An instance of the CompressionFormat class.
         */
        constructor( pName,
                     pSignatures,
                     pDecompressionFunction,
                     pCompressionFunction,
                     pOptions = CompressionOptions.DEFAULT )
        {
            const options = lock( populateOptions( pOptions || {}, CompressionOptions.DEFAULT ) );

            this.compressionOptions = lock( options || CompressionOptions.DEFAULT );

            this.name = ucase( asString( pName, true ) );
            this.signatures = lock( asArray( pSignatures ) );

            const decompressionFunction = isFunction( pDecompressionFunction ) ? pDecompressionFunction : options.decompressionFunction;
            const compressionFunction = isFunction( pCompressionFunction ) ? pCompressionFunction : options.compressionFunction;

            this.extension = options.extension || CompressionOptions.DEFAULT.extension;
            this.encoding = options.encoding || CompressionOptions.DEFAULT.encoding;

            this.decompressionFunction = isFunction( decompressionFunction ) ? decompressionFunction.bind( this ) : (".zip" === this.extension ? pkUnZip : pipeToUncompressedFile);
            this.compressionFunction = isFunction( compressionFunction ) ? compressionFunction.bind( this ) : (".zip" === this.extension ? pkZip : pipeToCompressedFile);

            CompressionFormat.#CACHE.set( ucase( asString( this.name, true ) ), this );
        }

        async decompress( pInputPath, pOutputPath, pOptions )
        {
            return this.decompressionFunction.call( this,
                                                    pInputPath,
                                                    pOutputPath,
                                                    populateOptions( pOptions, this.compressionOptions ) );
        }

        async compress( pInputPath, pOutputPath, pOptions )
        {
            return this.compressionFunction.call( this,
                                                  pInputPath,
                                                  pOutputPath,
                                                  populateOptions( pOptions, this.compressionOptions ) );
        }

        equals( pOther )
        {
            return ucase( asString( this.name, true ) ) === ucase( asString( (pOther instanceof this.constructor ? pOther.name || pOther : pOther), true ) );
        }

        clone()
        {
            return new this.constructor( this.name, this.signatures, this.decompressionFunction, this.compressionFunction, this.compressionOptions );
        }

        static getInstance( pName )
        {
            return isString( pName ) ? CompressionFormat.#CACHE.get( ucase( asString( pName, true ) ) ) : null;
        }

        static fromBuffer( pBuffer )
        {
            if ( isString( pBuffer ) )
            {
                return CompressionFormat.getInstance( ucase( asString( pBuffer, true ) ) );
            }

            const buffer = [...(asArray( arrayFromBuffer( pBuffer ) ))];

            const signature = buffer.slice( 0, 4 );

            if ( signature.length < 2 )
            {
                const msg = "The specified buffer is too small to be a valid archive";

                toolbocksModule.reportError( new IllegalArgumentError( msg, { buffer: pBuffer } ), S_ERROR, modName + "::fromBuffer", pBuffer );

                return SUPPORTED_FORMATS.UNSUPPORTED;
            }

            return FORMAT_BY_SIGNATURE.get( JSON.stringify( signature ) ) || SUPPORTED_FORMATS.UNSUPPORTED;
        }

        static async fromFile( pFilePath )
        {
            const buffer = await readFile( pFilePath );
            return CompressionFormat.fromBuffer( buffer );
        }
    }

    SUPPORTED_FORMATS =
        {
            GZIP: lock( new CompressionFormat( "GZIP", [[0x1F, 0x8B]], pipeToUncompressedFile, pipeToCompressedFile, CompressionOptions.GZIP ) ),
            PKZIP: lock( new CompressionFormat( "PKZIP", [[0x50, 0x4B, 0x03, 0x04]], pkUnZip, pkZip, CompressionOptions.PKZIP ) ),
            ZLIB: lock( new CompressionFormat( "ZLIB", [[0x78, 0x9C], [0x78, 0xDA], [0x78, 0x5E], [0x78, 0x01]], pipeToUncompressedFile, pipeToCompressedFile, CompressionOptions.DEFLATE ) ),
            DEFLATE: lock( new CompressionFormat( "DEFLATE", [[0x78, 0x9C], [0x78, 0xDA], [0x78, 0x5E], [0x78, 0x01]], pipeToUncompressedFile, pipeToCompressedFile, CompressionOptions.DEFLATE ) ),
            BROTLI: lock( new CompressionFormat( "BROTLI", [[0xEB, 0xAF, 0x28, 0xCF], [0x1F, 0x9D]], pipeToUncompressedFile, pipeToCompressedFile, CompressionOptions.BROTLI ) ),
            UNSUPPORTED: lock( new CompressionFormat( "UNSUPPORTED", [], no_op, no_op, CompressionOptions.DEFAULT ) )
        };

    CompressionFormat.DEFAULT = SUPPORTED_FORMATS.GZIP;

    const FORMAT_BY_SIGNATURE = new Map();
    const FORMAT_BY_EXTENSION = new Map();

    Object.entries( SUPPORTED_FORMATS ).forEach( ( [name, format] ) =>
                                                 {
                                                     CompressionFormat[ucase( name )] = format;
                                                     format.signatures.forEach( sig => FORMAT_BY_SIGNATURE.set( JSON.stringify( sig ), format ) );
                                                     FORMAT_BY_EXTENSION.set( format.extension, format );
                                                 } );

    CompressionFormat.resolve = function( pFormat, pExtension )
    {
        if ( pFormat instanceof CompressionFormat )
        {
            return pFormat;
        }

        let instance = CompressionFormat.getInstance( pFormat );

        let tries = 0;

        while ( !(instance instanceof CompressionFormat) && tries < 5 )
        {
            if ( isString( pFormat ) && tries < 2 )
            {
                instance = CompressionFormat.getInstance( ucase( asString( pFormat, true ) ) ) || FORMAT_BY_EXTENSION.get( asString( pFormat, true ) );
            }
            else if ( isString( pExtension ) && !isBlank( pExtension ) && tries < 4 )
            {
                const extension = asString( pExtension, true );

                instance = FORMAT_BY_EXTENSION.get( extension ) || CompressionFormat.getInstance( ucase( extension ) );
            }
            else if ( isString( pFormat ) && !isBlank( pFormat ) && tries > 4 )
            {
                instance = CompressionFormat.fromFile( resolvePath( asString( pFormat, true ) ) );
                instance = instance || CompressionFormat.fromFile( resolvePath( asString( pExtension, true ) ) );
            }
            else if ( isObject( pFormat ) )
            {
                if ( isArray( pFormat ) || isTypedArray( pFormat ) )
                {
                    attempt( () => instance = CompressionFormat.fromBuffer( pFormat ) );
                }
            }
            tries++;
        }

        if ( instance instanceof CompressionFormat )
        {
            return instance;
        }

        return instance || CompressionFormat.DEFAULT;
    };

    CompressionFormat.addFormat = function( pName, pFormat, pOptions )
    {
        const name = ucase( asString( pName, true ) || pFormat?.name );

        if ( isBlank( name ) || (name in SUPPORTED_FORMATS) )
        {
            const error = new IllegalArgumentError( "The specified compression format name is invalid or already defined", { name: pName } );
            toolbocksModule.reportError( error, S_ERROR, modName + "::CompressionFormat::addFormat", pName, pFormat );
        }
        else
        {
            SUPPORTED_FORMATS[name] = SUPPORTED_FORMATS[name] || new CompressionFormat( name, pFormat.signatures, pFormat.decompressionFunction, pFormat.compressionFunction, pFormat.options || pOptions );
            SUPPORTED_FORMATS[name].signatures.forEach( sig => FORMAT_BY_SIGNATURE.set( JSON.stringify( sig ), SUPPORTED_FORMATS[name] ) );
            FORMAT_BY_EXTENSION.set( SUPPORTED_FORMATS[name].extension, SUPPORTED_FORMATS[name] );
        }
    };

    CompressionFormat.getFormatNames = function()
    {
        return [...(new Set( Object.keys( SUPPORTED_FORMATS ) || [] ))].filter( name => !isBlank( name ) && !["UNSUPPORTED", "DEFAULT"].includes( ucase( name ) ) );
    };

    CompressionFormat.getFormats = function( ...pFilter )
    {
        let arr = [...(new Set( Object.values( SUPPORTED_FORMATS ) || [] ))].filter( format => format instanceof CompressionFormat && !["UNSUPPORTED", "DEFAULT"].includes( ucase( format.name ) ) );

        asArray( varargs( ...pFilter ) ).forEach( filter => arr = arr.filter( filter ) );

        return arr;
    };

    /**
     *
     * @param pInputPath
     * @param pOutputPath
     * @param {CompressionOptions|Object} pOptions
     * @param pErrorSource
     */
    async function initializeArguments( pInputPath, pOutputPath, pOptions, pErrorSource )
    {
        const options = populateOptions( pOptions, CompressionOptions.DEFAULT );

        const errorSource = asString( pErrorSource || (modName + "::initializeArguments"), true );

        let {
            inputPath,
            outputPath,
            leftSide,
            rightSide
        } = await CompressionOptions.calculatePipe( pInputPath, pOutputPath );

        async function handleError( pError )
        {
            if ( pError instanceof Error )
            {
                const makeCallback = options?.errorCallback;

                const errorCallback = isFunction( makeCallback ) ? makeCallback( pError, inputPath ) : null;

                if ( isFunction( errorCallback ) )
                {
                    errorCallback.call( options, pError, inputPath ).then( no_op ).catch( ex => toolbocksModule.reportError( ex, "executing error callback", S_ERROR, errorSource, ex, inputPath ) );
                }

                toolbocksModule.reportError( pError, "decompressing file", S_ERROR, errorSource, inputPath, outputPath );
            }
        }

        async function handleSuccess( pOutput, pRecursive )
        {
            const makeCallback = options?.successCallback;

            const successCallback = isFunction( makeCallback ) ? makeCallback( inputPath, pRecursive ) : null;

            if ( isFunction( successCallback ) )
            {
                successCallback.call( options, inputPath, pOutput, pRecursive ).then( no_op ).catch( ex => toolbocksModule.reportError( ex, "executing success callback", S_ERROR, errorSource, ex, inputPath, pRecursive ) );
            }
        }

        return {
            inputPath,
            outputPath,
            leftSide,
            rightSide,
            handleError,
            handleSuccess,
            errorSource
        };
    }

    function getPkZipSpecificOptions( pFormatSpecificOptions )
    {
        const options = populateOptions( pFormatSpecificOptions || {}, PKZIP_OPTIONS );

        let zipPath = asString( options.zipPath, true );
        zipPath = isBlank( zipPath ) ? null : zipPath;

        let zipName = asString( options.zipName, true );
        zipName = isBlank( zipName ) ? null : zipName;

        const filter = Filters.IS_FILTER( options.filter ) ? options.filter : Filters.IDENTITY;

        let comment = asString( options.comment, true );
        comment = isBlank( comment ) ? null : comment;

        return { zipPath, zipName, filter, comment };
    }

    async function pkZipFileToDirectory( pInputPath, pOutputPath, pkZipper, pOptions, pPwd )
    {
        try
        {
            if ( !isBlank( pPwd ) )
            {
                pkZipper.extractAllTo( pOutputPath, pOptions?.overwrite, pOptions?.keepOriginalPermission, pPwd );
            }
            else
            {
                pkZipper.extractAllTo( pOutputPath, pOptions?.overwrite, pOptions?.keepOriginalPermission );
            }
        }
        catch( ex )
        {
            await isFunction( pOptions?.handleError ) ? pOptions.handleError( ex ) : toolbocksModule.reportError( ex, "extracting archive", S_ERROR, modName + "::pkZipFile", pInputPath, pOutputPath );
        }
    }

    async function pkZipFileToBuffer( pInputPath, pOutputPath, pPwd, pOptions )
    {
        let output = [];

        try
        {
            const buffer = isBuffer( pInputPath ) ? Buffer.from( pInputPath ) : await readFile( pInputPath );

            const entries = !isBlank( pPwd ) ? getEntries( buffer, pPwd ) : getEntries( buffer, _mt_str );

            if ( entries && entries.length )
            {
                for( const entry of entries )
                {
                    output.push( asArray( entry.getData() ) );
                }
            }
        }
        catch( ex )
        {
            await isFunction( pOptions?.handleError ) ? pOptions.handleError( ex ) : toolbocksModule.reportError( ex, "extracting archive", S_ERROR, modName + "::pkZipFile", pInputPath, pOutputPath );
        }

        return output;
    }

    const pkZipFile = async function( pInputPath, pOutputPath, pOutputType, pPwd, pOptions )
    {
        const options = populateOptions( pOptions, CompressionOptions.PKZIP );

        const format = await CompressionFormat.fromFile( pInputPath );

        if ( !SUPPORTED_FORMATS.PKZIP.equals( format ) )
        {
            return false;
        }

        const zip = new admZip( pInputPath, { fs: fs } );

        let outputPath = asString( pOutputPath, true );

        switch ( pOutputType )
        {
            case PIPE.FILE:
                outputPath = getDirectoryName( outputPath );
            // fallthrough

            case PIPE.DIRECTORY:
                await pkZipFileToDirectory( pInputPath, outputPath, zip, options, pPwd );
                break;

            case PIPE.BUFFER:
                outputPath = await pkZipFileToBuffer( pInputPath, outputPath, options );
                break;

            default:
                break;
        }

        return outputPath;
    };

    async function pkUnzipDirectory( pInputPath, pOutputPath, pOptions, pOnError )
    {
        let output = [pOutputPath];

        try
        {
            const dir = opendir( resolvePath( pInputPath ) );

            if ( dir )
            {
                for await( const dirent of dir )
                {
                    const ipt = resolvePath( dirent );

                    output.push( await pkUnZip( ipt, pOutputPath, pOptions ) );
                    output = output.flat();
                }
            }
        }
        catch( ex )
        {
            await isFunction( pOnError ) ? attempt( () => pOnError( ex ) ) : toolbocksModule.reportError( ex, "extracting archive", S_ERROR, modName + "::pkUnzipDirectory", pInputPath, pOutputPath );
        }
    }

    async function pkUnzipBufferToBuffer( pZipEntries )
    {
        let arr = [];

        for( const entry of pZipEntries )
        {
            arr.push( asArray( entry.getData() ) );
        }

        return Buffer.from( new Uint8Array( arr.flat() ) );
    }

    async function pkUnzipBuffer( pInput, pOutput, pOutputType, pPwd )
    {
        const buffer = isBuffer( pInput ) ? Buffer.from( pInput ) : await readFile( pInput );

        const entries = getEntries( buffer, pPwd );

        let output = pOutput;

        if ( entries && entries.length )
        {
            switch ( pOutputType )
            {
                case PIPE.FILE:
                    output = getDirectoryName( pOutput );
                // fallthrough

                case PIPE.DIRECTORY:

                    let n = 0;

                    for( const entry of entries )
                    {
                        const name = entry.name || ("zipEntry" + ((n++ > 0) ? ("_" + n) : ""));
                        const data = asArray( entry.getData() );
                        const outPath = resolvePath( [output, name] );
                        await writeFile( outPath, data ).catch( ex => toolbocksModule.reportError( ex, "writing file", S_ERROR, pkUnzipBuffer, outPath, data ) );
                    }

                    break;

                case PIPE.BUFFER:
                    output = await pkUnzipBufferToBuffer( entries );
                    break;
            }
        }

        return output;
    }

    /**
     * Extracts the contents of a compressed PKZIP file from the input path
     * and outputs the extracted files to the specified output path.<br>
     * <br>
     * Handles various input/output scenarios such as
     * file-to-directory,
     * file-to-file,
     * file-to-buffer,
     * buffer-to-directory,
     * buffer-to-file,
     * etc.<br>
     * <br>
     * @see {@link #PIPE}
     * @see {@link CompressionOptions.calculatePipe}
     *
     * Supports password-protected ZIP files and custom callbacks for error and success handling.
     *
     * @param {string|Buffer} pInputPath - The path or buffer of the ZIP file to be extracted.<br>
     *                                     It can be a file path, directory, or buffer.
     *
     * @param {string|Array} pOutputPath - The path or destination for the extracted contents.<br>
     *                                     It can be a directory, file, a buffer, or typed array.<br>
     *
     * @param {CompressionOptions|Object} pOptions - Configuration options for the unzipping process.<br>
     *                                               This includes properties for specifying
     *                                               whether to delete the source after successful extraction,
     *                                               an object that can handle an encrypted password for the archive,
     *                                               and functions to run onSuccess or onError.<br>
     *
     * @return {Promise<string|Array|boolean>} A Promise that resolves to the output path (file, directory, or buffer).<br>
     *                                         In some cases, the Promise does not resolve to a meaningful value<br>
     *                                         even though the operation was successful.<br>
     *
     * @type {CompressionFunction}
     */
    async function pkUnZip( pInputPath, pOutputPath, pOptions = CompressionOptions.PKZIP )
    {
        const errorSource = modName + "::pkUnZip";

        let {
            inputPath,
            outputPath,
            leftSide,
            rightSide,
            handleError,
            handleSuccess
        } = await initializeArguments( pInputPath, pOutputPath, pOptions, errorSource );

        let options = populateOptions( pOptions || {}, PKZIP_OPTIONS );

        let recursive = false;

        switch ( leftSide )
        {
            case PIPE.FILE:
                outputPath = pkZipFile( inputPath, outputPath, rightSide, options );
                break;

            case PIPE.DIRECTORY:

                recursive = true;

                outputPath = [outputPath];
                outputPath.push( await pkUnzipDirectory( inputPath, outputPath, options, handleError ) );
                outputPath = outputPath.flat();

                break;

            case PIPE.BUFFER:
                outputPath = await pkUnzipBuffer( inputPath, outputPath, rightSide, _mt_str );
                break;

            default:
                break;
        }

        await handleSuccess( recursive );

        return outputPath;
    }

    async function calculatePkZipSource( pInputPath, pSourceType, pOptions )
    {
        let zipper = new admZip( undefined, { fs: fs, password: _mt_str } );

        let { zipPath, zipName, filter, comment } = getPkZipSpecificOptions( pOptions );

        let recursive = false;

        switch ( pSourceType )
        {
            case PIPE.FILE:
                zipper.addLocalFile( pInputPath, zipPath, zipName, comment );
                break;

            case PIPE.DIRECTORY:
                zipper.addLocalFolder( pInputPath, zipPath, filter );
                recursive = true;
                break;

            case PIPE.BUFFER:
                let buffer = isTypedArray( pInputPath ) ? Buffer.copyBytesFrom( pInputPath ) : isBuffer( pInputPath ) ? Buffer.from( pInputPath ) : await readFile( pInputPath );

                zipper = new admZip( buffer, { fs: fs } );

                pInputPath = zipPath || zipName || "FromBuffer";

                break;

            default:
                break;
        }

        return { zipper, recursive };
    }

    /**
     * Compresses files or directories into a zip archive.
     *
     * @param {string|Buffer} pInputPath - The input path or buffer to be compressed. It can be a file, directory, or a buffer.
     * @param {string} pOutputPath - The output path where the resulting zip file should be saved.
     * @param {CompressionOptions} pOptions - The options for configuration. Includes format-specific options and additional parameters such as:
     *                             - `formatSpecificOptions.zipPath`: (string) Path within the zip archive where files should be placed.
     *                             - `formatSpecificOptions.zipName`: (string) Custom name for the files inside the zip.
     *                             - `formatSpecificOptions.filter`: (Filter) A filter to apply when processing files.
     *                             - `formatSpecificOptions.comment`: (string) Comment to include in the zip file.
     *                             - `formatSpecificOptions.keepOriginalPermission`: (boolean) Flag indicating whether to retain original file permissions.
     *                             - Other options provided for custom configuration.
     * @return {Promise<boolean|Buffer>} Returns a boolean indicating success or failure in case of file/directory output.
     *                                   Returns a buffer if the right output pipe is set to BUFFER.
     *
     * @type {CompressionFunction}
     */
    async function pkZip( pInputPath, pOutputPath, pOptions = CompressionOptions.PKZIP )
    {
        const errorSource = modName + "::pkZip";

        let {
            inputPath,
            outputPath,
            leftSide,
            rightSide,
            handleError,
            handleSuccess
        } = await initializeArguments( pInputPath, pOutputPath, pOptions, errorSource );

        let options = populateOptions( pOptions || {}, PKZIP_OPTIONS );

        let outputFilePath = isString( outputPath ) ? resolvePath( outputPath ) : outputPath;

        const extension = options?.extension || ".zip";

        let { zipper, recursive } = await calculatePkZipSource( inputPath, leftSide, options );

        switch ( rightSide )
        {
            case PIPE.FILE:
                outputFilePath = replaceExtension( outputFilePath, extension );
                break;

            case PIPE.DIRECTORY:
                if ( !(await isDirectory( outputFilePath )) )
                {
                    await asyncMakeDirectory( getDirectoryName( outputPath ), { recursive: true } );
                }

                outputFilePath = resolvePath( [outputPath, getFileName( replaceExtension( getFileName( inputPath ), extension ) )] );

                break;

            case PIPE.BUFFER:
                outputFilePath = zipper.toBuffer();
                await handleSuccess( recursive );
                return outputFilePath;
        }

        try
        {
            zipper.writeZip( outputFilePath, handleError, { password: _mt_str } );

            await handleSuccess( recursive );
        }
        catch( ex )
        {
            toolbocksModule.reportError( ex, "writing zip file", S_ERROR, modName + "::pkZip", pInputPath, pOutputPath, inputPath, outputPath );
            return false;
        }

        return outputFilePath;
    }

    async function streamToBuffer( pStream )
    {
        return new Promise( ( resolve, reject ) =>
                            {
                                const chunks = [];
                                pStream.on( "data", ( chunk ) => chunks.push( chunk ) );
                                pStream.on( "error", reject );
                                pStream.on( "end", () => resolve( Buffer.concat( chunks ) ) );
                            } );
    }

    async function handleZlibOperation( pArgsObject )
    {
        let {
            inputPath = pArgsObject?.inputPath,
            outputPath = pArgsObject?.outputPath,
            transformer = pArgsObject?.transformer,
            handleError = pArgsObject?.onError || pArgsObject?.handleError,
            handleSuccess = pArgsObject?.onSuccess || pArgsObject?.handleSuccess,
            recursive = pArgsObject?.recursive
        } = pArgsObject || {};

        if ( isBuffer( outputPath ) )
        {
            inputPath = isString( inputPath ) ? resolvePath( inputPath ) : isBuffer( inputPath ) ? Buffer.from( inputPath ) : await readFile( inputPath );
            inputPath = await isFile( inputPath ) ? await readFile( inputPath ) : inputPath;

            const stream = Readable.from( inputPath );
            await streamToBuffer( outputPath( stream ) );
        }
        else
        {
            const source = fs.createReadStream( inputPath );
            const destination = fs.createWriteStream( outputPath );

            try
            {
                await pipeline( source, transformer, destination );
            }
            catch( ex )
            {
                await handleError( ex );
                return null;
            }
        }

        await handleSuccess( recursive );

        return outputPath;
    }

    /**
     * Compresses a file from the specified input path and writes it to the specified output path.
     * This method pipelines the input file through a compression tool and writes the compressed output.
     *
     * @param {string|Uint8Array<number>} pInputPath - The path to the input file that needs to be compressed.
     * @param {string|Uint8Array<number>} pOutputPath - The path where the compressed file will be written.
     * @param {CompressionOptions} pOptions - The options object containing additional configuration for compression.
     * @return {Promise<boolean>} Returns a promise that resolves to `true` if the operation completes successfully.
     *
     * @type {CompressionFunction}
     */
    async function pipeToCompressedFile( pInputPath, pOutputPath, pOptions = CompressionOptions.DEFAULT )
    {
        const errorSource = modName + "::pipeToCompressedFile";

        let {
            inputPath,
            outputPath,
            leftSide,
            rightSide,
            handleError,
            handleSuccess
        } = await initializeArguments( pInputPath, pOutputPath, pOptions, errorSource );

        let options = populateOptions( pOptions, CompressionOptions.DEFAULT );

        let extension = options.extension || options.extension || ".gz";

        let zipper = options.archiver || options.compressionFunction || null;

        if ( zipper instanceof admZip || zipper === pkZip || (SUPPORTED_FORMATS.PKZIP.equals( CompressionFormat.resolve( outputPath, extension ) )) )
        {
            return pkZip( inputPath, outputPath, options );
        }

        if ( isFunction( zipper ) && !(zipper === pipeToCompressedFile) )
        {
            zipper = zipper() || zipper;
        }

        if ( zipper )
        {
            let recursive = PIPE.DIRECTORY === leftSide;

            if ( PIPE.FILE === rightSide )
            {
                outputPath = replaceExtension( outputPath, extension );
            }
            else if ( PIPE.DIRECTORY === rightSide )
            {
                outputPath = resolvePath( [outputPath, getFileName( replaceExtension( getFileName( inputPath ), extension ) )] );
            }
            else
            {
                outputPath = isBuffer( outputPath ) ? Buffer.from( outputPath ) : await readFile( outputPath );
            }

            return await handleZlibOperation( {
                                                  inputPath,
                                                  outputPath,
                                                  transformer: zipper,
                                                  handleError,
                                                  handleSuccess,
                                                  recursive
                                              } );
        }

        return null;
    }

    async function pipeToUncompressedFile( pInputPath, pOutputPath, pOptions = CompressionOptions.DEFAULT )
    {
        const errorSource = modName + "::pipeToUncompressedFile";

        let {
            inputPath,
            outputPath,
            leftSide,
            rightSide,
            handleError,
            handleSuccess
        } = await initializeArguments( pInputPath, pOutputPath, pOptions, errorSource );

        let options = populateOptions( pOptions, CompressionOptions.DEFAULT );

        let unzipper = options.reviver || options.decompressionFunction || null;

        if ( unzipper instanceof admZip || unzipper === pkUnZip || (SUPPORTED_FORMATS.PKZIP.equals( CompressionFormat.resolve( inputPath, options.extension ) )) )
        {
            return pkUnZip( inputPath, outputPath, options );
        }

        if ( isFunction( unzipper ) && !(unzipper === pipeToUncompressedFile) )
        {
            unzipper = unzipper() || unzipper;
        }

        if ( unzipper )
        {
            let recursive = PIPE.DIRECTORY === leftSide;

            if ( PIPE.DIRECTORY === rightSide || PIPE.FILE === rightSide )
            {
                outputPath = isString( inputPath ) ? resolvePath( [outputPath, getFileName( removeExtension( getFileName( inputPath ) ) )] ) : outputPath;
            }
            else
            {
                outputPath = isBuffer( outputPath ) ? Buffer.from( outputPath ) : await readFile( outputPath );
            }

            return await handleZlibOperation( {
                                                  inputPath,
                                                  outputPath,
                                                  transformer: unzipper,
                                                  handleError,
                                                  handleSuccess,
                                                  recursive
                                              } );
        }

        return null;
    }

    class ArchiverOptions extends CompressionOptions
    {
        constructor( pCompressionOptions = CompressionOptions.DEFAULT,
                     pCompressionFormat,
                     pDeleteSource,
                     pOnSuccess,
                     pOnError )
        {
            super( pCompressionOptions?.options || pCompressionOptions || CompressionOptions.DEFAULT?.options || CompressionOptions.DEFAULT || {} );

            this.compressionFormat = CompressionFormat.resolve( pCompressionFormat ) || CompressionFormat.DEFAULT;

            this.onSuccess = isFunction( pOnSuccess ) ? pOnSuccess : no_op;
            this.onError = isFunction( pOnError ) ? pOnError : no_op;

            this.deleteSource = !!pDeleteSource;
        }

        deleteFunction( pPath, pRecursive )
        {
            const me = this;

            const p = pPath;

            const recurse = pRecursive;

            const deleteIt = me.deleteSource;

            if ( deleteIt )
            {
                return async( pPath, pRecursive ) =>
                {
                    const target = pPath || p;

                    if ( isString( target ) && !isBlank( target ) )
                    {
                        const errorSource = modName + "CompressionOptions::deleteFunction";

                        const stats = await lstat( target );

                        if ( !isNull( stats ) )
                        {
                            if ( stats.isDirectory() )
                            {
                                return await asyncRemoveDirectory( target, { recursive: pRecursive || recurse } ).catch( ex => toolbocksModule.reportError( ex, "deleting directory", S_ERROR, errorSource, pPath, pRecursive ) );
                            }
                            else if ( stats.isSymbolicLink() )
                            {
                                try
                                {
                                    const realPath = await readlink( target, DEFAULT_ENCODING );
                                    const absolutePath = (resolvePath( realPath ));
                                    await unlink( absolutePath );
                                }
                                catch( ex )
                                {
                                    toolbocksModule.reportError( ex, "deleting symbolic link", S_ERROR, errorSource, pPath, pRecursive );
                                }
                            }
                        }

                        try
                        {
                            return await unlink( target );
                        }
                        catch( ex )
                        {
                            toolbocksModule.reportError( ex, "deleting file", S_ERROR, errorSource, pPath, pRecursive );
                        }
                    }
                };
            }
        }

        successCallback( pPath, pRecursive )
        {
            const me = this;

            const target = resolvePath( asString( pPath, true ) ) || pPath;

            const delFunc = (me || this).deleteFunction( target, pRecursive );

            return async( pPath, pRecursive ) =>
            {
                if ( isFunction( me || this ).onSuccess )
                {
                    await asyncAttempt( async() => await (me || this).onSuccess.call( (me || this), target, pRecursive ) );
                }

                await delFunc( target, pRecursive );
            };
        }

        errorCallback( pError, pPath = null )
        {
            const me = this;

            const error = resolveError( pError );

            const target = resolvePath( asString( pPath, true ) ) || pPath;

            return async( pError ) =>
            {
                const err = resolveError( pError, error );

                if ( err instanceof Error && isFunction( me || this ).onError )
                {
                    return attempt( () => (me || this).onError.call( (me || this), (err || error || pError), target ) );
                }
            };
        }

        clone()
        {
            return new this.constructor( this,
                                         this.compressionFormat,
                                         this.deleteSource,
                                         this.onSuccess,
                                         this.onError );
        }
    }

    const DEFAULT_ARCHIVER_OPTIONS = lock( (new ArchiverOptions( _mt_str )) );

    class Archiver
    {
        #options;

        #outputDirectory;
        #compressionFormat;

        #onSuccess;
        #onFailure;

        constructor( pOutputDirectory, pOptions = DEFAULT_ARCHIVER_OPTIONS )
        {
            const options = populateOptions( pOptions, DEFAULT_ARCHIVER_OPTIONS );

            this.#options = options;

            this.#outputDirectory = resolvePath( asString( pOutputDirectory, true ) );

            this.#compressionFormat = CompressionFormat.resolve( options.compressionFormat );

            this.#onSuccess = isFunction( options.onSuccess ) ? options.onSuccess || no_op : no_op;

            this.#onFailure = isFunction( options.onFailure ) ? options.onFailure || no_op : no_op;
        }

        get options()
        {
            return populateOptions( this.#options, DEFAULT_ARCHIVER_OPTIONS );
        }

        get outputDirectory()
        {
            return asString( this.#outputDirectory, true );
        }

        get compressionFormat()
        {
            return CompressionFormat.resolve( this.#compressionFormat ) || CompressionFormat.DEFAULT;
        }

        get compressionOptions()
        {
            return this.compressionFormat?.compressionOptions;
        }

        get extension()
        {
            return this.compressionOptions?.extension || this.compressionFormat?.extension || CompressionOptions.DEFAULT.extension || _mt_str;
        }

        get formatSpecificOptions()
        {
            return this.compressionOptions?.options || {};
        }

        get onSuccess()
        {
            return isFunction( this.#onSuccess ) ? this.#onSuccess : no_op;
        }

        get onFailure()
        {
            return isFunction( this.#onFailure ) ? this.#onFailure : no_op;
        }

        async checkFilePath( pFilePath )
        {
            try
            {
                let available = isString( pFilePath ) ? await exists( resolvePath( pFilePath ) ) : false;

                if ( !available && isString( pFilePath ) )
                {
                    const msg = "The specified file path does not exist or cannot be read: " + pFilePath;
                    toolbocksModule.reportError( new Error( msg ), msg, S_WARN, modName + "::Archiver::checkFilePath" );

                    if ( pFilePath.indexOf( _dot ) < 0 )
                    {
                        available = await this.createPath( pFilePath );
                    }
                }

                return toBool( available );
            }
            catch( ex )
            {
                const msg = "An error occurred while checking the existence of the specified file path: " + pFilePath;
                toolbocksModule.reportError( ex, msg, S_WARN, modName + "::Archiver::checkFilePath" );
            }

            return false;
        }

        async createPath( pPath )
        {
            try
            {
                let exists = isString( pPath ) ? await this.checkFilePath( pPath ) : false;

                if ( !exists && isString( pPath ) )
                {
                    let dirname = resolvePath( pPath );
                    if ( !isBlank( dirname ) )
                    {
                        exists = await this.checkFilePath( dirname );
                        if ( !exists )
                        {
                            await asyncMakeDirectory( dirname, { recursive: true } );
                            exists = await this.checkFilePath( dirname );
                        }
                    }
                }

                return toBool( exists );
            }
            catch( ex )
            {
                const msg = "An error occurred while creating the specified path: " + pPath;
                toolbocksModule.reportError( ex, msg, S_WARN, modName + "::Archiver::createPath" );
            }

            return false;
        }

        async resolveArguments( pFilePath, pDirectory, pOptions )
        {
            let filepath = isString( pFilePath ) ? pFilePath : asArray( pFilePath );

            let exists = isString( filepath ) ? await this.checkFilePath( filepath ) : !isNull( filepath );

            let outputPath = pDirectory || this.outputDirectory || getDirectoryName( filepath );

            if ( isString( outputPath ) )
            {
                exists &= await this.checkFilePath( outputPath );
            }

            const format = this.compressionFormat;

            const options = populateOptions( pOptions || {}, format.compressionOptions, CompressionOptions.DEFAULT );

            return { exists, filepath, outputPath, format, options };
        }

        async archive( pFilePath, pOptions )
        {
            const directory = (this.outputDirectory || (isString( pFilePath ) ? getDirectoryName( pFilePath ) : _mt_str)).trim();

            const {
                exists,
                filepath,
                outputPath,
                format,
                options
            } = await this.resolveArguments( pFilePath, directory, pOptions );

            if ( await isDirectory( filepath ) )
            {
                // archiving an entire directory is only supported with PkZip in this release
                return pkZip( filepath, outputPath, options );
            }

            if ( isArray( filepath ) && asArray( filepath ).some( file => isString( file ) ) )
            {
                // we assume that if any of the elements of the source buffer are strings,
                // it is an array of file paths, so we recursively call this method and return an array of the compressed file paths

                let compressedFiles = [];

                for( let file of asArray( filepath ) )
                {
                    try
                    {
                        const compressedFilePath = await this.archive( file, options );
                        compressedFiles.push( compressedFilePath );
                    }
                    catch( ex )
                    {
                        toolbocksModule.reportError( ex, `archiving ${asString( file )}`, S_ERROR, modName + "::Archiver::archive", file, options );
                    }
                }

                return compressedFiles;
            }

            if ( exists )
            {
                return await format.compress( filepath, outputPath, populateOptions( options, this.options ) );
            }

            return false;
        }

        async decompress( pCompressedFilePath, pOutputPath, pOptions )
        {
            let directory = pOutputPath || pOptions?.outputDirectory || pOptions?.outputPath || this.outputDirectory;

            if ( isString( directory ) )
            {
                if ( await isFile( directory ) )
                {
                    directory = getDirectoryName( directory );
                }
            }

            const {
                exists,
                filepath,
                outputPath,
                format,
                options
            } = await this.resolveArguments( pCompressedFilePath, directory, pOptions );

            if ( isArray( filepath ) && asArray( filepath ).some( file => isString( file ) ) )
            {
                // we assume that if any of the elements of the source buffer are strings,
                // it is an array of file paths, so we recursively call this method and return an array of the decompressed file paths

                let decompressedFiles = [];

                for( let file of asArray( filepath ) )
                {
                    try
                    {
                        const decompressedFilePath = await this.decompress( file, options );
                        decompressedFiles.push( decompressedFilePath );
                    }
                    catch( ex )
                    {
                        toolbocksModule.reportError( ex, `decompressing ${asString( file )}`, S_ERROR, modName + "::Archiver::archive", file, options );
                    }
                }

                return decompressedFiles;
            }

            if ( exists )
            {
                return await format.decompress( filepath, outputPath, populateOptions( options, this.options ) );
            }
            return false;
        }

        clone()
        {
            return new this.constructor( this.outputDirectory, this.options );
        }
    }

    let mod =
        {
            dependencies:
                {
                    constants,
                    typeUtils,
                    stringUtils,
                    arrayUtils,
                    base64Utils,
                    admZip,
                    zlib
                },
            classes:
                {
                    PKZIP_CLASSES,
                    ArchiveEntry,
                    CompressionOptions,
                    CompressionFormat,
                    PasswordProtection,
                    Archiver,
                    ArchiverOptions
                },
            isEmptyArchive,
            isSafeArchive,
            exceedsMaxEntries,
            exceedsMaxSize,
            calculateTotalUncompressedSize,
            isPotentialZipBomb,
            getEntryCount,
            getEntries,
            getEntry,
            arrayFromBuffer,
            typedArrayFromBuffer,
            isFile,
            isDirectory,
            removeExtension,
            replaceExtension,
            CompressionOptions,
            CompressionFormat,
            PasswordProtection,
            ArchiverOptions,
            Archiver,
            PKZIP_OPTIONS,
            GZIP_OPTIONS,
            DEFLATE_OPTIONS,
            INFLATE_OPTIONS,
            BROTLI_OPTIONS,
            DEFAULT_ARCHIVER_OPTIONS,
            SUPPORTED_FORMATS,
            FORMAT_BY_SIGNATURE,
            pkUnZip,
            pkZip,
            pipeToCompressedFile,
            pipeToUncompressedFile,
        };

    mod = toolbocksModule.extend( mod );

    return mod.expose( mod, INTERNAL_NAME, (_ud !== typeof module ? module : mod) ) || mod;

}());
