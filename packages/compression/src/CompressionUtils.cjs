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
const { constants, typeUtils, stringUtils, arrayUtils } = core;

const base64Utils = require( "@toolbocks/base64" );

/**
 * Import adm-zip dependency
 */
const admZip = require( "adm-zip" );

const fs = require( "node:fs" );
const fsAsync = require( "node:fs/promises" );
const { pipeline } = require( "node:stream/promises" );

const path = require( "node:path" );
const zlib = require( "node:zlib" );
const crypto = require( "node:crypto" );

const { _ud = "undefined" } = constants;

const $scope = constants?.$scope || function()
{
    return (_ud === typeof self ? ((_ud === typeof global) ? ((_ud === typeof globalThis ? {} : globalThis)) : (global || {})) : (self || {}));
};

(function exposeModule()
{
    const INTERNAL_NAME = "__BOCK__COMPRESSION_UTILS__";

    if ( $scope() && (null != $scope()[INTERNAL_NAME]) )
    {
        return $scope()[INTERNAL_NAME];
    }

    const {
        _mt_str,
        _dot,
        _str,
        _num,
        _big,
        _bool,
        _obj,
        resolveError,
        S_ERROR,
        S_WARN,
        populateOptions,
        mergeOptions,
        no_op,
        lock,
        classes
    } = constants;

    const { ModuleEvent, ModulePrototype } = classes;

    const {
        isNull,
        isString,
        isNumber,
        isNumeric,
        isObject,
        isFunction,
        isAsyncFunction,
        isArray,
        isTypedArray,
        isError,
        toDecimal,
        toBits
    } = typeUtils;

    const { asString, asInt, isBlank, lcase, ucase, toAbsolutePath } = stringUtils;

    const { varargs, asArray, Filters, Mappers } = arrayUtils;

    if ( _ud === typeof CustomEvent )
    {
        CustomEvent = ModuleEvent;
    }

    const { encode, decode } = base64Utils;

    const modName = "CompressionUtils";

    const modulePrototype = new ModulePrototype( modName, INTERNAL_NAME );

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
        return (pBuffer instanceof Buffer ? new ArrayClass( pBuffer ) : isArray( pBuffer ) || isTypedArray( pBuffer ) ? new ArrayClass( pBuffer ) : new ArrayClass( arrayFromBuffer( pBuffer ) ));
    }

    /**
     * Asynchronously checks if the given path is a file.
     *
     * @param {string} pPath - The path to check, provided as a string.
     * @return {Promise<boolean>} A promise that resolves to `true` if the path is a file, `false` otherwise.
     */
    async function isFile( pPath )
    {
        const filepath = path.normalize( path.resolve( asString( pPath, true ) ) );

        try
        {
            const stats = await fsAsync.stat( filepath );
            return stats?.isFile();
        }
        catch( ex )
        {
            modulePrototype.reportError( ex, "checking if path is a file or directory", S_ERROR, modName + "::isFile", "pPath:", pPath, "filepath:", filepath );
        }
        return false;
    }

    /**
     * Checks whether the specified path refers to a directory.
     *
     * @param {string} pPath - The path to check, normalized and resolved to an absolute path.
     * @return {Promise<boolean>} A promise that resolves to true if the path is a directory, otherwise false.
     */
    async function isDirectory( pPath )
    {
        const filepath = path.normalize( path.resolve( asString( pPath, true ) ) );

        try
        {
            const stats = await fsAsync.stat( filepath );
            return stats?.isDirectory();
        }
        catch( ex )
        {
            modulePrototype.reportError( ex, "checking if path is a file or directory", S_ERROR, modName + "::isDirectory", pPath );
        }
        return false;
    }

    /**
     * Removes the file extension from the given file path.
     *
     * @param {string} pPath - The file path from which the extension will be removed.
     * @return {string} The file path without the extension.
     */
    function removeExtension( pPath )
    {
        const filepath = path.resolve( asString( pPath, true ) );
        const ext = path.extname( filepath );
        return filepath.replace( ext, _mt_str ).replace( /\/$/, _mt_str ).replace( /\\$/, _mt_str ).replace( ext, _mt_str );
    }

    /**
     * Replaces the extension of a given file path with a new extension.
     *
     * @param {string} pPath - The file path whose extension needs to be replaced.
     * @param {string} pNewExtension - The new extension to be applied to the file path.
     * @return {string} The updated file path with the new extension.
     */
    function replaceExtension( pPath, pNewExtension )
    {
        const filepath = path.resolve( asString( pPath, true ) );
        const newExt = asString( pNewExtension, true ).replace( /^\.+/, _mt_str );
        const newFilename = removeExtension( filepath );
        return (newFilename + (_dot + newExt)).trim();
    }

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
         * @returns {ArchiveDataHeader}
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
                                modulePrototype.reportError( ex, "parsing JSON data", S_ERROR, modName + "::getDataAs" );
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
                modulePrototype.reportError( ex, "counting archive entries", S_ERROR, modName + "::getEntryCount" );
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
                modulePrototype.reportError( ex, "getting the archive entries", S_ERROR, modName + "::getEntries" );

                let archive = repair( pArchive );

            }

            return entries;
        };

        /**
         * Returns an instance of ArchiveEntry representing the named entry (or the entry at the specified index)
         * @param pArchive {Buffer|Array} a Buffer or an array of bytes representing an archive
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
                    modulePrototype.reportError( ex, "getting the archive entry, '" + name + "'", S_ERROR, modName + "::getEntry" );
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
                    modulePrototype.reportError( ex, "getting the archive entry, '" + name + "'", S_ERROR, modName + "::getEntry" );
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
        const inputPath = isString( pInputPath ) ? path.resolve( asString( pInputPath, true ) ) : asArray( pInputPath );
        const outputPath = isString( pOutputPath ) ? path.resolve( asString( pOutputPath, true ) ) : asArray( pOutputPath );

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

        static encrypt( pPassword, pSalt, inputEncoding, outputEncoding )
        {
            const pwd = Buffer.from( pPassword, inputEncoding );
            const salt = Buffer.from( pSalt, inputEncoding );

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

            return new PasswordProtection( encrypted, iv, salt, key, inputEncoding, outputEncoding );
        }

        get storable()
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

        static fromStorable( storable )
        {
            const s = storable;

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

    const PKZIP_OPTIONS =
        {
            archiver: admZip,
            reviver: admZip,

            extension: ".zip",

            overwrite: false,
            keepOriginalPermission: false,

            zipPath: _mt_str,
            zipName: _mt_str,

            filter: Filters.IDENTITY,

            comment: _mt_str
        };

    const GZIP_OPTIONS =
        {
            archiver: zlib.createGzip,
            reviver: zlib.createGunzip,
            extension: ".gz",

            filter: Filters.IDENTITY
        };

    const DEFLATE_OPTIONS =
        {
            archiver: zlib.createDeflate,
            reviver: zlib.createInflate,
            extension: ".z",

            filter: Filters.IDENTITY
        };

    const INFLATE_OPTIONS =
        {
            archiver: zlib.createDeflate,
            reviver: zlib.createInflate,
            extension: ".z",

            filter: Filters.IDENTITY
        };

    const BROTLI_OPTIONS =
        {
            archiver: zlib.createBrotliCompress,
            reviver: zlib.createBrotliDecompress,
            extension: ".br",

            filter: Filters.IDENTITY
        };

    /**
     * Represents configuration options for a compression operation.
     *
     * @class
     */
    class CompressionOptions
    {
        #deleteSource = false;
        #passwordProtection = null;
        #encoding = DEFAULT_ENCODING;
        #onError = null;
        #onSuccess = null;

        #formatSpecificOptions = {};

        constructor( pDeleteSource, pPasswordProtection, pEncoding, pOnError, pOnSuccess, pFormatSpecificOptions )
        {
            this.#deleteSource = !!pDeleteSource;
            this.#passwordProtection = pPasswordProtection instanceof PasswordProtection ? pPasswordProtection : null;
            this.#encoding = pEncoding;
            this.#onError = isFunction( pOnError ) ? pOnError : null;
            this.#onSuccess = isFunction( pOnSuccess ) ? pOnSuccess : null;

            this.#formatSpecificOptions = populateOptions( pFormatSpecificOptions || {}, GZIP_OPTIONS );
        }

        get deleteSource()
        {
            return this.#deleteSource;
        }

        get passwordProtection()
        {
            return this.#passwordProtection instanceof PasswordProtection ? this.#passwordProtection : null;
        }

        get encoding()
        {
            return this.#encoding;
        }

        get onError()
        {
            return isFunction( this.#onError ) ? this.#onError : null;
        }

        get onSuccess()
        {
            return isFunction( this.#onSuccess ) ? this.#onSuccess : null;
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
                    if ( !deleteIt )
                    {
                        return;
                    }
                    const target = pPath || p;

                    if ( isString( target ) && !isBlank( target ) )
                    {
                        const errorSource = modName + "CompressionOptions::deleteFunction";

                        const stats = await fsAsync.lstat( target );

                        if ( !isNull( stats ) )
                        {
                            if ( stats.isDirectory() )
                            {
                                return await fsAsync.rmdir( target, { recursive: pRecursive || recurse } ).catch( ex => modulePrototype.reportError( ex, "deleting directory", S_ERROR, errorSource, pPath, pRecursive ) );
                            }
                            else if ( stats.isSymbolicLink() )
                            {
                                try
                                {
                                    const realPath = await fsAsync.readlink( target, DEFAULT_ENCODING );
                                    const absolutePath = path.normalize( path.resolve( realPath ) );
                                    await fsAsync.unlink( absolutePath );
                                }
                                catch( ex )
                                {
                                    modulePrototype.reportError( ex, "deleting symbolic link", S_ERROR, errorSource, pPath, pRecursive );
                                }
                            }
                        }

                        try
                        {
                            return await fsAsync.unlink( target );
                        }
                        catch( ex )
                        {
                            modulePrototype.reportError( ex, "deleting file", S_ERROR, errorSource, pPath, pRecursive );
                        }
                    }
                };
            }
        }

        successCallback( pPath, pRecursive )
        {
            const me = this;

            const target = path.resolve( asString( pPath, true ) );

            const recursive = pRecursive;

            const delFunc = (me || this).deleteFunction( target );

            return async( pPath, pRecursive ) =>
            {
                const errorSource = modName + "CompressionOptions::successCallback";

                if ( isFunction( me || this ).onSuccess )
                {
                    try
                    {
                        await (me || this).onSuccess.call( (me || this), pPath || target, pRecursive || recursive );
                    }
                    catch( ex )
                    {
                        modulePrototype.reportError( ex, "executing error callback", S_ERROR, errorSource, ex, pPath || target, pRecursive || recursive );
                    }
                }

                await delFunc( pPath || target, pRecursive || recursive );
            };
        }

        errorCallback( pError, pPath = null )
        {
            const me = this;

            const error = resolveError( pError );

            const target = path.resolve( asString( pPath, true ) );

            return async( pError, pPath ) =>
            {
                const err = resolveError( pError, error );

                if ( err instanceof Error )
                {
                    if ( isFunction( me || this ).onError )
                    {
                        const errorSource = modName + "CompressionOptions::errorCallback";

                        try
                        {
                            await (me || this).onError.call( (me || this), (err || pError || error), pPath || target );
                        }
                        catch( ex )
                        {
                            modulePrototype.reportError( ex, "executing error callback", S_ERROR, errorSource, (err || pError || error), pPath || target );
                        }
                    }
                }
            };
        }

        get formatSpecificOptions()
        {
            return populateOptions( this.#formatSpecificOptions || {}, GZIP_OPTIONS );
        }

        get extension()
        {
            return this.formatSpecificOptions?.extension || _mt_str;
        }

        get archiver()
        {
            return this.formatSpecificOptions?.archiver || null;
        }

        get reviver()
        {
            return this.formatSpecificOptions?.reviver || null;
        }

        clone()
        {
            return new CompressionOptions( this.deleteSource, this.passwordProtection, this.encoding, this.onError, this.onSuccess, this.formatSpecificOptions );
        }
    }

    CompressionOptions.DEFAULT = new CompressionOptions( false, null, DEFAULT_ENCODING, null, null, GZIP_OPTIONS );
    CompressionOptions.PKZIP = new CompressionOptions( false, null, DEFAULT_ENCODING, null, null, PKZIP_OPTIONS );
    CompressionOptions.GZIP = new CompressionOptions( false, null, DEFAULT_ENCODING, null, null, GZIP_OPTIONS );
    CompressionOptions.DEFLATE = new CompressionOptions( false, null, DEFAULT_ENCODING, null, null, DEFLATE_OPTIONS );
    CompressionOptions.INFLATE = new CompressionOptions( false, null, DEFAULT_ENCODING, null, null, INFLATE_OPTIONS );
    CompressionOptions.BROTLI = new CompressionOptions( false, null, DEFAULT_ENCODING, null, null, BROTLI_OPTIONS );

    const PIPE =
        {
            FILE: 1,
            BUFFER: 2,
            DIRECTORY: 3,
        };

    function isBuffer( pPath )
    {
        return isArray( pPath ) || isTypedArray( pPath ) || pPath instanceof Buffer;
    }

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

    /**
     *
     * @param pInputPath
     * @param pOutputPath
     * @param {CompressionOptions|Object} pOptions
     * @param pErrorSource
     */
    async function initializeArguments( pInputPath, pOutputPath, pOptions, pErrorSource )
    {
        const options = mergeOptions( pOptions, CompressionOptions.DEFAULT );

        const errorSource = asString( pErrorSource || (modName + "::initializeArguments"), true );

        function resolvePassword()
        {
            const passwordProtection = options.passwordProtection;
            return (passwordProtection instanceof PasswordProtection) ? passwordProtection.decrypt() : _mt_str;
        }

        let {
            inputPath,
            outputPath,
            leftSide,
            rightSide
        } = await CompressionOptions.calculatePipe( pInputPath, pOutputPath );

        async function handleError( ex )
        {
            if ( ex instanceof Error )
            {
                const makeCallback = options?.errorCallback;

                const errorCallback = isFunction( makeCallback ) ? makeCallback( ex, inputPath ) : null;

                if ( isFunction( errorCallback ) )
                {
                    errorCallback.call( options, ex, inputPath ).then( no_op ).catch( ex => modulePrototype.reportError( ex, "executing error callback", S_ERROR, errorSource, ex, inputPath ) );
                }

                modulePrototype.reportError( ex, "unzipping file", S_ERROR, errorSource, inputPath, outputPath );
            }
        }

        async function handleSuccess( pRecursive )
        {
            const makeCallback = options?.successCallback;

            const successCallback = isFunction( makeCallback ) ? makeCallback( inputPath, pRecursive ) : null;

            if ( isFunction( successCallback ) )
            {
                successCallback.call( options, inputPath, pRecursive ).then( no_op ).catch( ex => modulePrototype.reportError( ex, "executing success callback", S_ERROR, errorSource, ex, inputPath, pRecursive ) );
            }
        }

        return {
            options,
            inputPath,
            outputPath,
            leftSide,
            rightSide,
            resolvePassword,
            handleError,
            handleSuccess,
            errorSource
        };
    }

    function getPkZipSpecificOptions( pFormatSpecificOptions )
    {
        const options = mergeOptions( pFormatSpecificOptions || {}, PKZIP_OPTIONS );

        let zipPath = asString( options.zipPath, true );
        zipPath = isBlank( zipPath ) ? null : zipPath;

        let zipName = asString( options.zipName, true );
        zipName = isBlank( zipName ) ? null : zipName;

        const filter = Filters.IS_FILTER( options.filter ) ? options.filter : Filters.IDENTITY;

        let comment = asString( options.comment, true );
        comment = isBlank( comment ) ? null : comment;

        return { zipPath, zipName, filter, comment };
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
            options,
            inputPath,
            outputPath,
            leftSide,
            rightSide,
            resolvePassword,
            handleError,
            handleSuccess
        } = await initializeArguments( pInputPath, pOutputPath, pOptions, errorSource );

        let formatSpecificOptions = populateOptions( options?.formatSpecificOptions || {}, PKZIP_OPTIONS );

        const overwrite = formatSpecificOptions.overwrite;
        const keepOriginalPermission = formatSpecificOptions.keepOriginalPermission;

        let recursive = false;

        switch ( leftSide )
        {
            case PIPE.FILE:

                const format = await CompressionFormat.fromFile( inputPath );

                if ( !CompressionFormat.SUPPORTED_FORMATS.PKZIP.equals( format ) )
                {
                    return false;
                }

                const zip = new admZip( inputPath, { fs: fs } );

                switch ( rightSide )
                {
                    case PIPE.FILE:
                        outputPath = path.dirname( outputPath );
                    // fallthrough

                    case PIPE.DIRECTORY:
                        try
                        {
                            const pwd = resolvePassword();

                            if ( !isBlank( pwd ) )
                            {
                                zip.extractAllTo( outputPath, overwrite, keepOriginalPermission, pwd );
                            }
                            else
                            {
                                zip.extractAllTo( outputPath, overwrite, keepOriginalPermission );
                            }
                        }
                        catch( ex )
                        {
                            await handleError( ex );
                        }
                        break;

                    case PIPE.BUFFER:

                        try
                        {
                            const buffer = isBuffer( inputPath ) ? Buffer.from( inputPath ) : await fsAsync.readFile( inputPath );

                            const entries = getEntries( buffer, resolvePassword() );

                            if ( entries && entries.length )
                            {
                                for( const entry of entries )
                                {
                                    outputPath.push( asArray( entry.getData() ) );
                                }
                                if ( 1 === entries.length )
                                {
                                    outputPath = outputPath[0];
                                }
                            }
                        }
                        catch( ex )
                        {
                            await handleError( ex );
                        }

                        break;

                    default:
                        break;
                }
                break;

            case PIPE.DIRECTORY:

                recursive = true;

                const dir = fsAsync.opendir( inputPath );

                if ( dir )
                {
                    for await( const dirent of dir )
                    {
                        const ipt = path.resolve( dirent.path, dirent.name );

                        await pkUnZip( ipt, outputPath, options );
                    }
                }
                break;

            case PIPE.BUFFER:

                const buffer = isBuffer( inputPath ) ? Buffer.from( inputPath ) : await fsAsync.readFile( inputPath );

                const entries = getEntries( buffer, resolvePassword() );

                if ( entries && entries.length )
                {
                    switch ( rightSide )
                    {
                        case PIPE.FILE:
                            outputPath = path.dirname( outputPath );
                        // fallthrough

                        case PIPE.DIRECTORY:

                            let n = 0;

                            for( const entry of entries )
                            {
                                const name = entry.name || ("zipEntry" + ((n++ > 0) ? ("_" + n) : ""));
                                const data = asArray( entry.getData() );
                                const outPath = path.resolve( outputPath, name );
                                await fsAsync.writeFile( outPath, data );
                            }

                            break;

                        case PIPE.BUFFER:

                            outputPath = isBuffer( outputPath ) ? outputPath : await isDirectory( outputPath ) ? Buffer.from( new Uint8Array( 0 ) ) : await fsAsync.readFile( outputPath );

                            for( const entry of entries )
                            {
                                outputPath.push( asArray( entry.getData() ) );
                            }
                            if ( 1 === entries.length )
                            {
                                outputPath = outputPath[0];
                            }

                            break;
                    }
                }

                await handleSuccess( recursive );

                break;

            default:
                break;
        }

        return outputPath;
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
            options,
            inputPath,
            outputPath,
            leftSide,
            rightSide,
            resolvePassword,
            handleError,
            handleSuccess
        } = await initializeArguments( pInputPath, pOutputPath, pOptions, errorSource );

        let formatSpecificOptions = populateOptions( options?.formatSpecificOptions || {}, PKZIP_OPTIONS );

        let { zipPath, zipName, filter, comment } = getPkZipSpecificOptions( formatSpecificOptions );

        let recursive = false;

        let outputFilePath = isString( outputPath ) ? path.normalize( path.resolve( outputPath ) ) : outputPath;

        const extension = ".zip";

        let zipper = new admZip( undefined, { fs: fs } );

        switch ( leftSide )
        {
            case PIPE.FILE:
                zipper.addLocalFile( inputPath, zipPath, zipName, comment );
                break;

            case PIPE.DIRECTORY:
                zipper.addLocalFolder( inputPath, zipPath, filter );
                recursive = true;
                break;

            case PIPE.BUFFER:
                let buffer = isTypedArray( inputPath ) ? Buffer.copyBytesFrom( inputPath ) : Buffer.from( inputPath );

                zipper = new admZip( buffer, { fs: fs } );

                inputPath = zipPath || zipName || "FromBuffer";

                break;

            default:
                break;
        }

        switch ( rightSide )
        {
            case PIPE.FILE:
                outputFilePath = replaceExtension( outputFilePath, extension );
                break;

            case PIPE.DIRECTORY:
                if ( !await isDirectory( outputFilePath ) )
                {
                    await fsAsync.mkdir( path.dirname( outputPath ), { recursive: true } );
                }
                outputFilePath = path.resolve( outputPath, path.basename( replaceExtension( path.basename( inputPath ), extension ) ) );
                break;

            case PIPE.BUFFER:
                outputFilePath = zipper.toBuffer();
                await handleSuccess( recursive );
                return outputFilePath;
        }

        try
        {
            zipper.writeZip( outputFilePath, handleError );

            await handleSuccess( recursive );
        }
        catch( ex )
        {
            modulePrototype.reportError( ex, "writing zip file", S_ERROR, modName + "::pkZip", pInputPath, pOutputPath, inputPath, outputPath );
            return false;
        }

        return outputFilePath;
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
            options,
            inputPath,
            outputPath,
            leftSide,
            rightSide,
            resolvePassword,
            handleError,
            handleSuccess
        } = await initializeArguments( pInputPath, pOutputPath, pOptions, errorSource );

        let formatSpecificOptions = mergeOptions( options?.formatSpecificOptions, options, CompressionOptions.DEFAULT );

        let extension = formatSpecificOptions.extension || options.extension || ".gz";

        let zipper = formatSpecificOptions.archiver || options.archiver || null;

        if ( zipper instanceof admZip || zipper === pkZip )
        {
            return pkZip( pInputPath, pOutputPath, options );
        }

        if ( isFunction( zipper ) )
        {
            zipper = zipper();
        }

        if ( zipper )
        {
            if ( PIPE.FILE === rightSide )
            {
                outputPath = replaceExtension( outputPath, extension );
            }
            else if ( PIPE.DIRECTORY === rightSide )
            {
                outputPath = path.resolve( outputPath, path.basename( replaceExtension( path.basename( inputPath ), extension ) ) );
            }
            else
            {
                outputPath = isBuffer( outputPath ) ? Buffer.from( outputPath ) : await fsAsync.readFile( outputPath );
            }

            const source = fs.createReadStream( inputPath );
            const destination = fs.createWriteStream( outputPath );

            let safeToDelete = false;

            try
            {
                await pipeline( source, zipper, destination );
                safeToDelete = true;
            }
            catch( ex )
            {
                await handleError( ex );
                return null;
            }

            if ( options?.deleteSource && safeToDelete )
            {
                try
                {
                    await fsAsync.unlink( inputPath );
                }
                catch( ex )
                {
                    modulePrototype.reportError( ex, "deleting source file(s)", S_ERROR, errorSource, pInputPath, pOutputPath, inputPath, outputPath );
                }
            }

            try
            {
                await handleSuccess();
            }
            catch( ex )
            {
                modulePrototype.reportError( ex, "executing onSuccess callback", S_ERROR, errorSource, pInputPath, pOutputPath, inputPath, outputPath );
            }

            return outputPath;
        }

        return null;
    }

    async function pipeToUncompressedFile( pInputPath, pOutputPath, pOptions = CompressionOptions.DEFAULT )
    {
        const errorSource = modName + "::pipeToUncompressedFile";

        let {
            options,
            inputPath,
            outputPath,
            leftSide,
            rightSide,
            resolvePassword,
            handleError,
            handleSuccess
        } = await initializeArguments( pInputPath, pOutputPath, pOptions, errorSource );

        let formatSpecificOptions = mergeOptions( options?.formatSpecificOptions, options, CompressionOptions.DEFAULT );

        let unzipper = formatSpecificOptions.reviver || options.reviver || null;

        if ( unzipper instanceof admZip || unzipper === pkUnZip )
        {
            return pkUnZip( pInputPath, pOutputPath, options );
        }

        if ( isFunction( unzipper ) )
        {
            unzipper = unzipper();
        }

        if ( unzipper )
        {
            if ( PIPE.DIRECTORY === rightSide || PIPE.FILE === rightSide )
            {
                outputPath = isString( inputPath ) ? path.resolve( outputPath, path.basename( removeExtension( path.basename( inputPath ) ) ) ) : outputPath;
            }
            else
            {
                outputPath = isBuffer( outputPath ) ? Buffer.from( outputPath ) : await fsAsync.readFile( outputPath );
            }

            const source = fs.createReadStream( inputPath );
            const destination = fs.createWriteStream( outputPath );

            let safeToDelete = false;

            try
            {
                await pipeline( source, unzipper, destination );
                safeToDelete = true;
            }
            catch( ex )
            {
                await handleError( ex );
                return null;
            }

            if ( options?.deleteSource && safeToDelete )
            {
                try
                {
                    await fsAsync.unlink( inputPath );
                }
                catch( ex )
                {
                    modulePrototype.reportError( ex, "deleting source file(s)", S_ERROR, errorSource, pInputPath, pOutputPath, inputPath, outputPath );
                }
            }

            try
            {
                await handleSuccess();
            }
            catch( ex )
            {
                modulePrototype.reportError( ex, "executing onSuccess callback", S_ERROR, errorSource, pInputPath, pOutputPath, inputPath, outputPath );
            }

            return outputPath;
        }

        return null;
    }

    /**
     * Represents a compression format, encapsulating its name, file signatures,
     * compression and decompression functions, as well as related options.
     */
    class CompressionFormat
    {
        #name;
        #signatures;
        #decompressionFunction;
        #compressionFunction;

        #compressionOptions;

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
        constructor( pName, pSignatures, pDecompressionFunction, pCompressionFunction, pOptions = CompressionOptions.DEFAULT )
        {
            const options = mergeOptions( pOptions, CompressionOptions.DEFAULT );

            this.#compressionOptions = options;

            this.#name = ucase( asString( pName, true ) );
            this.#signatures = asArray( pSignatures );

            const decompressionFunction = isFunction( pDecompressionFunction ) ? pDecompressionFunction : options.decompressionFunction;
            const compressionFunction = isFunction( pCompressionFunction ) ? pCompressionFunction : options.compressionFunction;

            this.#decompressionFunction = isFunction( decompressionFunction ) ? decompressionFunction.bind( this ) : no_op;
            this.#compressionFunction = isFunction( compressionFunction ) ? compressionFunction.bind( this ) : no_op;

            CompressionFormat.#CACHE.set( ucase( asString( this.#name, true ) ), this );
        }

        get name()
        {
            return this.#name;
        }

        get signatures()
        {
            return asArray( this.#signatures );
        }

        get compressionOptions()
        {
            return mergeOptions( this.#compressionOptions || {}, CompressionOptions.DEFAULT );
        }

        get formatSpecificOptions()
        {
            return this.compressionOptions?.formatSpecificOptions || GZIP_OPTIONS;
        }

        get extension()
        {
            return this.formatSpecificOptions?.extension || this.compressionOptions?.extension || GZIP_OPTIONS.extension || _mt_str;
        }

        get decompressionFunction()
        {
            return this.#decompressionFunction;
        }

        decompress( pInputPath, pOutputPath, pOptions )
        {
            this.decompressionFunction.call( this, pInputPath, pOutputPath, mergeOptions( (pOptions || this.compressionOptions), this.compressionOptions ) );
        }

        get compressionFunction()
        {
            return this.#compressionFunction;
        }

        compress( pInputPath, pOutputPath, pOptions )
        {
            this.compressionFunction.call( this, pInputPath, pOutputPath, mergeOptions( (pOptions || this.compressionOptions), this.compressionOptions ) );
        }

        equals( pOther )
        {
            if ( pOther instanceof this.constructor )
            {
                return ucase( asString( this.name, true ) === ucase( asString( pOther.name, true ) ) );
            }
            else if ( isString( pOther ) )
            {
                return ucase( asString( this.name, true ) === ucase( asString( pOther, true ) ) );
            }
            return false;
        }

        clone()
        {
            return new this.constructor( this.name, this.signatures, this.decompressionFunction, this.compressionFunction, this.compressionOptions );
        }

        static getInstance( pName )
        {
            return CompressionFormat.#CACHE.get( ucase( asString( pName, true ) ) );
        }

        static fromBuffer( pBuffer )
        {
            if ( isString( pBuffer ) )
            {
                return CompressionFormat.getInstance( ucase( asString( pBuffer, true ) ) );
            }

            const buffer = arrayFromBuffer( pBuffer );

            const signature = buffer.slice( 0, 4 );

            if ( signature.length < 2 )
            {
                const msg = "The specified buffer is too small to be a valid archive";

                modulePrototype.reportError( new IllegalArgumentError( msg, { buffer: pBuffer } ), S_ERROR, modName + "::fromBuffer", pBuffer );

                return SUPPORTED_FORMATS.UNSUPPORTED;
            }

            return FORMAT_BY_SIGNATURE.get( signature ) || SUPPORTED_FORMATS.UNSUPPORTED;
        }

        static async fromFile( pFilePath )
        {
            const buffer = await fsAsync.readFile( pFilePath );

            return CompressionFormat.fromBuffer( buffer );
        }
    }

    CompressionFormat.SUPPORTED_FORMATS =
        {
            GZIP: lock( new CompressionFormat( "GZIP", [[0x1F, 0x8B]], pipeToUncompressedFile, pipeToCompressedFile, CompressionOptions.GZIP ) ),
            PKZIP: lock( new CompressionFormat( "PKZIP", [[0x50, 0x4B, 0x03, 0x04]], pkUnZip, pkZip, CompressionOptions.PKZIP ) ),
            ZLIB: lock( new CompressionFormat( "ZLIB", [[0x78, 0x9C], [0x78, 0xDA], [0x78, 0x5E], [0x78, 0x01]], pipeToUncompressedFile, pipeToCompressedFile, CompressionOptions.DEFLATE ) ),
            DEFLATE: lock( new CompressionFormat( "DEFLATE", [[0x78, 0x9C], [0x78, 0xDA], [0x78, 0x5E], [0x78, 0x01]], pipeToUncompressedFile, pipeToCompressedFile, CompressionOptions.DEFLATE ) ),
            BROTLI: lock( new CompressionFormat( "BROTLI", [[0xEB, 0xAF, 0x28, 0xCF], [0x1F, 0x9D]], pipeToUncompressedFile, pipeToCompressedFile, CompressionOptions.BROTLI ) ),
            /*
             LZ4: new CompressionFormat( "LZ4", [[0x04, 0x22, 0x4D, 0x18]] ),
             LZ4HC: new CompressionFormat( "LZ4HC", [[0x04, 0x22, 0x4D, 0x18]] ),
             */
            UNSUPPORTED: lock( new CompressionFormat( "UNSUPPORTED", [], no_op, no_op, CompressionOptions.DEFAULT ) )
        };

    Object.entries( CompressionFormat.SUPPORTED_FORMATS ).forEach( ( [name, format] ) =>
                                                                   {
                                                                       CompressionFormat[ucase( name )] = format;
                                                                   } );

    CompressionFormat.DEFAULT = CompressionFormat.SUPPORTED_FORMATS.GZIP;

    const SUPPORTED_FORMATS = CompressionFormat.SUPPORTED_FORMATS;
    SUPPORTED_FORMATS.DEFAULT = CompressionFormat.DEFAULT;

    const FORMAT_BY_SIGNATURE = new Map();

    Object.entries( SUPPORTED_FORMATS ).forEach( ( [name, format] ) =>
                                                 {
                                                     format.signatures.forEach( sig => FORMAT_BY_SIGNATURE.set( sig, format ) );
                                                 } );

    CompressionFormat.resolve = function( pFormat, pExtension )
    {
        if ( isString( pFormat ) )
        {
            let instance = CompressionFormat.getInstance( ucase( asString( pFormat, true ) ) );

            if ( instance instanceof CompressionFormat )
            {
                return instance;
            }

            if ( isString( pExtension ) && !isBlank( pExtension ) )
            {
                const extension = asString( pExtension, true );

                const formats = CompressionFormat.getFormats();

                for( let format of formats )
                {
                    if ( format.extension === extension )
                    {
                        instance = format;
                        break;
                    }
                }
            }

            return instance || SUPPORTED_FORMATS.DEFAULT;
        }
        else if ( isObject( pFormat ) )
        {
            if ( pFormat instanceof CompressionFormat )
            {
                return pFormat;
            }

            if ( isArray( pFormat ) || isTypedArray( pFormat ) )
            {
                return CompressionFormat.fromBuffer( pFormat );
            }

            return CompressionFormat.DEFAULT;
        }
    };

    CompressionFormat.addFormat = function( pName, pFormat )
    {
        const name = ucase( asString( pName, true ) || pFormat?.name );

        if ( isBlank( name ) || name in CompressionFormat.SUPPORTED_FORMATS )
        {
            modulePrototype.reportError( new IllegalArgumentError( "The specified compression format name is invalid or already defined", { name: pName } ), S_ERROR, modName + "::CompressionFormat::addFormat", pName, pFormat );
        }
        else
        {
            CompressionFormat.SUPPORTED_FORMATS[name] = CompressionFormat.SUPPORTED_FORMATS[name] || new CompressionFormat( name, pFormat.signatures, pFormat.decompressionFunction, pFormat.compressionFunction );
        }
    };

    CompressionFormat.getFormatNames = function()
    {
        return [...(new Set( Object.keys( CompressionFormat.SUPPORTED_FORMATS ) || [] ))].filter( name => !isBlank( name ) && name !== "DEFAULT" );
    };

    CompressionFormat.getFormats = function( ...pFilter )
    {
        let arr = [...(new Set( Object.values( CompressionFormat.SUPPORTED_FORMATS ) || [] ))].filter( format => format instanceof CompressionFormat && !["UNSUPPORTED", "DEFAULT"].includes( format.name ) );

        asArray( varargs( ...pFilter ) ).forEach( filter => arr = arr.filter( filter ) );

        return arr;
    };

    class ArchiverOptions
    {
        #outputDirectory = _mt_str;
        #compressionFormat = SUPPORTED_FORMATS.DEFAULT;
        #compressionLevel = 6;

        #passwordProtection = null;

        #onSuccess = no_op;
        #onFailure = no_op;

        #deleteSource = true;

        constructor( pOutputDirectory, pCompressionFormat = CompressionFormat.DEFAULT, pCompressionLevel = 6, pPasswordProtection = null, pOnSuccess = no_op, pOnFailure = no_op, pDeleteSource = true )
        {
            this.#outputDirectory = (_mt_str + (pOutputDirectory || _mt_str)).trim();

            this.#compressionFormat = CompressionFormat.resolve( pCompressionFormat ) || CompressionFormat.DEFAULT;

            this.#compressionLevel = asInt( pCompressionLevel );

            this.#passwordProtection = isObject( pPasswordProtection ) && (pPasswordProtection instanceof PasswordProtection) ? pPasswordProtection : null;

            this.#onSuccess = pOnSuccess;
            this.#onFailure = pOnFailure;

            this.#deleteSource = !!pDeleteSource;
        }

        get outputDirectory()
        {
            return (this.#outputDirectory || _mt_str).trim();
        }

        get compressionFormat()
        {
            return this.#compressionFormat || CompressionFormat.DEFAULT;
        }

        set compressionFormat( pFormat )
        {
            this.#compressionFormat = CompressionFormat.resolve( pFormat ) || CompressionFormat.DEFAULT;
        }

        get compressionLevel()
        {
            return Math.min( Math.max( -1, asInt( this.#compressionLevel ) ), 9 );
        }

        set compressionLevel( pNumber )
        {
            this.#compressionLevel = Math.min( Math.max( -1, asInt( pNumber ) ), 9 );
        }

        get onSuccess()
        {
            return isFunction( this.#onSuccess ) ? this.#onSuccess : no_op;
        }

        set onSuccess( pFunction )
        {
            this.#onSuccess = isFunction( pFunction ) ? pFunction : no_op;
        }

        get onFailure()
        {
            return isFunction( this.#onFailure ) ? this.#onFailure : no_op;
        }

        set onFailure( pFunction )
        {
            this.#onFailure = isFunction( pFunction ) ? pFunction : no_op;
        }

        get deleteSource()
        {
            return !!this.#deleteSource;
        }

        set deleteSource( pBool )
        {
            this.#deleteSource = !!pBool;
        }

        get passwordProtection()
        {
            return this.#passwordProtection instanceof PasswordProtection ? this.#passwordProtection : null;
        }

        get compressionOptions()
        {
            return this.compressionFormat?.compressionOptions;
        }

        get formatSpecificOptions()
        {
            return this.compressionOptions?.formatSpecificOptions || {};
        }

        clone()
        {
            return new this.constructor( this.outputDirectory, this.compressionFormat, this.compressionLevel, this.passwordProtection, this.onSuccess, this.onFailure, this.deleteSource );
        }
    }

    const DEFAULT_ARCHIVER_OPTIONS = new ArchiverOptions( _mt_str );

    class Archiver
    {
        #options;

        #outputDirectory;
        #compressionFormat;
        #compressionLevel;

        #passwordProtection = null;

        #onSuccess;
        #onFailure;

        constructor( pOutputDirectory, pOptions = DEFAULT_ARCHIVER_OPTIONS )
        {
            const options = mergeOptions( pOptions || {}, new ArchiverOptions( pOutputDirectory ), DEFAULT_ARCHIVER_OPTIONS );

            this.#options = options;

            this.#outputDirectory = (_mt_str + (pOutputDirectory || _mt_str)).trim() || options.outputDirectory;

            this.#compressionFormat = CompressionFormat.resolve( options.compressionFormat );

            this.#compressionLevel = asInt( options.compressionLevel );

            this.#passwordProtection = isObject( options.passwordProtection ) && (options.passwordProtection instanceof PasswordProtection) ? options.passwordProtection : null;

            this.#onSuccess = isFunction( options.onSuccess ) ? options.onSuccess || no_op : no_op;

            this.#onFailure = isFunction( options.onFailure ) ? options.onFailure || no_op : no_op;
        }

        get options()
        {
            return mergeOptions( this.#options, DEFAULT_ARCHIVER_OPTIONS );
        }

        get outputDirectory()
        {
            return (this.#outputDirectory || _mt_str).trim() || this.options.outputDirectory;
        }

        get compressionFormat()
        {
            return CompressionFormat.resolve( this.#compressionFormat || this.options.compressionFormat ) || CompressionFormat.DEFAULT;
        }

        get compressionOptions()
        {
            return this.compressionFormat?.compressionOptions;
        }

        get formatSpecificOptions()
        {
            return this.compressionOptions?.formatSpecificOptions || {};
        }

        get compressionLevel()
        {
            return Math.min( Math.max( -1, asInt( this.#compressionLevel || this.options.compressionLevel ) ), 9 );
        }

        get onSuccess()
        {
            return isFunction( this.#onSuccess ) ? this.#onSuccess : no_op;
        }

        get onFailure()
        {
            return isFunction( this.#onFailure ) ? this.#onFailure : no_op;
        }

        get passwordProtection()
        {
            return this.#passwordProtection instanceof PasswordProtection ? this.#passwordProtection : null;
        }

        async checkFilePath( pFilepath )
        {
            let exists = await fsAsync.access( path.resolve( pFilepath ), fs.constants.W_OK | fs.constants.R_OK );

            if ( !exists )
            {
                const msg = "The specified file path does not exist or cannot be read: " + pFilepath;
                modulePrototype.reportError( new Error( msg ), msg, S_WARN, modName + "::Archiver::checkFilePath" );

                if ( pFilepath.indexOf( _dot ) < 0 )
                {
                    exists = await this.createPath( pFilepath );
                }
            }

            return exists;
        }

        async createPath( pPath )
        {
            let exists = await this.checkFilePath( pPath );

            if ( !exists )
            {
                let dirname = path.resolve( pPath );
                if ( !isBlank( dirname ) )
                {
                    exists = await this.checkFilePath( dirname );
                    if ( !exists )
                    {
                        await fsAsync.mkdir( dirname, { recursive: true } );
                        exists = await this.checkFilePath( dirname );
                    }
                }
            }

            return exists;
        }

        async archive( pFilepath, pOptions )
        {
            let filepath = isString( pFilepath ) ? pFilepath : asArray( pFilepath );

            const exists = isString( filepath ) ? await this.checkFilePath( filepath ) : !isNull( filepath );

            if ( !exists )
            {
                return false;
            }

            const directory = (this.#outputDirectory || path.dirname( filepath )).trim();

            const filename = (path.basename( pFilepath ).replace( /(\.\w)*/, _mt_str )).trim();

            let outputPath = (path.resolve( directory, filename )).trim();

            const format = this.compressionFormat;

            const options = mergeOptions( (pOptions || {}), format.compressionOptions );

            return await format.compress( filename, outputPath, mergeOptions( options, this.options ) );
        }

        async decompress( pFilepath, pOptions )
        {
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

    mod = modulePrototype.extend( mod );

    return mod.expose( mod, INTERNAL_NAME, (_ud !== typeof module ? module : mod) ) || mod;

}());
