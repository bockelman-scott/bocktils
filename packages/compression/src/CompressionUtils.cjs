/**
 * This module provides some convenience methods for working with compressed (zipped) data.
 *
 * The most common use case is probably to read a zip file from the file system or from a memory buffer.
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

/**
 * Import adm-zip dependency
 */
const admZip = require( "adm-zip" );

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

    const { _mt_str, _str, _num, _big, _bool, _obj, S_ERROR, no_op, lock, classes } = constants;

    const { ModuleEvent, ModulePrototype } = classes;

    const { isString, isNumber, isNumeric, isObject, isFunction } = typeUtils;

    const { asString, asInt, isBlank, lcase } = stringUtils;

    if ( _ud === typeof CustomEvent )
    {
        CustomEvent = ModuleEvent;
    }

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
         * @returns {Buffer|*|Buffer}
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
         * @returns {Promise<*|Buffer|void|Buffer>}
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
         * @returns {string}
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
                    return buffer.toString( this.resolveEncoding( pEncoding ) );

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
            archiver = new admZip( pArchive );

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
     * @param pArchive {Buffer|Array} a Buffer or an array of bytes representing an archive
     * @param pPassword {string} (optional) password required to access the contents of the archive
     * @returns {*[]} an array of ArchiveEntry objects found in the specified archive
     */
    const getEntries = function( pArchive, pPassword )
    {
        let archiver;

        let entries = [];

        try
        {
            archiver = new admZip( pArchive );

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
                archiver = new admZip( pArchive );
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

    const forEach = function( pArchive, pCallback )
    {
        let entries = getEntries( pArchive );

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

    const calculateTotalUncompressedSize = function( pBuffer )
    {
        let totalUncompressedSize = 0;

        const entries = getEntries( pBuffer );

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

    // onSuccess(Buffer buffer);
    // onFail(String error);
    // onItemStart(String fileName);
    // onItemEnd(String fileName);

    class ZipListener
    {
        #zip;
        #onSuccess;
        #onFailure;

        constructor( pZip, pOnSuccessCallback, pOnFailCallback )
        {
            this.#zip = pZip;
            this.#onSuccess = isFunction( pOnSuccessCallback ) ? pOnSuccessCallback || no_op : no_op;
            this.#onFailure = isFunction( pOnFailCallback ) ? pOnFailCallback || no_op : no_op;

            this.unzip();
        }

        unzip( pZip )
        {
            const zip = pZip || this.#zip;

            if ( zip )
            {
                const buffer = zip.toBuffer( this.#onSuccess, this.#onFailure );

                modulePrototype.dispatchEvent( new CustomEvent( "unzipped", buffer ) );

                return buffer || ZERO_LENGTH_BUFFER;
            }

            return ZERO_LENGTH_BUFFER;
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
                    admZip
                },
            isEmptyArchive,
            isSafeArchive,
            exceedsMaxEntries,
            exceedsMaxSize,
            calculateTotalUncompressedSize,
            isPotentialZipBomb,
            getEntryCount,
            getEntries,
            getEntry
        };

    mod = modulePrototype.extend( mod );

    return mod.expose( mod, INTERNAL_NAME, (_ud !== typeof module ? module : mod) ) || mod;

}());
