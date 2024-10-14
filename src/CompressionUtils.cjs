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
 * This statement imports the common utils modules:
 * Constants, TypeUtils, StringUtils, ArrayUtils, ObjectUtils, and JsonUtils
 */
const utils = require( "./CommonUtils.cjs" );

/**
 * Establish separate constants for each of the common utilities imported
 * @see ../src/CommonUtils.cjs
 */
const constants = utils?.constants || require( "./Constants.cjs" );
const typeUtils = utils?.typeUtils || require( "./TypeUtils.cjs" );
const stringUtils = utils?.stringUtils || require( "./StringUtils.cjs" );
const arrayUtils = utils?.arrayUtils || require( "./ArrayUtils.cjs" );
const objectUtils = utils?.objectUtils || require( "./ObjectUtils.cjs" );

const admZip = require( "adm-zip" );

const zLib = require( "zlib" );

const _ud = constants?._ud || "undefined";

const $scope = constants?.$scope || function()
{
    return (_ud === typeof self ? ((_ud === typeof global) ? ((_ud === typeof globalThis ? {} : globalThis)) : (global || {})) : (self || {}));
};

(function exposeModule()
{
    let _mt_str = constants._mt_str;
    let _str = constants._str;
    let _num = constants._num;
    let _big = constants._big;
    let _bool = constants._bool;
    let _obj = constants._obj;

    let asString = stringUtils.asString;
    let isBlank = stringUtils.isBlank;
    let lcase = stringUtils.lcase;

    let isFunction = typeUtils.isFunction;

    /**
     * This statement makes all the values exposed by the imported modules local variables in the current scope.
     */
    utils.importUtilities( this, constants, stringUtils, arrayUtils, objectUtils );

    const INTERNAL_NAME = "__BOCK__COMPRESSION_UTILS__";

    if ( $scope() && (null != $scope()[INTERNAL_NAME]) )
    {
        return $scope()[INTERNAL_NAME];
    }

    const BYTES_PER_MEGABYTE = 1_048_576;

    const MAX_ENTRIES_ALLOWED = 100;

    const MAX_SIZE_ALLOWED = (25 * BYTES_PER_MEGABYTE);

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

    ArchiveDataHeader.fromDataHeader = function( pHeader )
    {
        return new ArchiveDataHeader( pHeader );
    };

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

        }

        loadFromBinary( pBuffer )
        {

        }

        dataHeaderToBinary()
        {

        }

        entryHeaderToBinary()
        {

        }

        toString()
        {

        }

    }

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
     * This is a wrapper around a zip entry, so that consumer code does not rely on a specific library's implementation.
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

            return Buffer.alloc( 0 );
        }

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

            return Buffer.alloc( 0 );
        }

        setData( pData )
        {
            if ( this.zipEntry && (isFunction( this.zipEntry.setData )) )
            {
                this.zipEntry.setData( pData );
            }

            if ( this.implementation && (isFunction( this.implementation.setData )) )
            {
                this.implementation.setData( pData );
            }
        }

        resolveEncoding( pEncoding )
        {
            return pEncoding || "utf-8";
        }

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

            return _mt_str;
        }

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
                            console.error( ex );
                        }
                    }
                    return obj || {};

                default:
                    return new Uint8Array( buffer );
            }
        }

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

            return _mt_str;
        }

        packHeader()
        {
            if ( this.zipEntry && (isFunction( this.zipEntry.packHeader )) )
            {
                return this.zipEntry.packHeader();
            }

            if ( this.implementation && (isFunction( this.implementation.packHeader )) )
            {
                return this.implementation.packHeader();
            }

            return {};
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

    ArchiveEntry.fromZipEntry = function( pZipEntry )
    {
        return new ArchiveEntry( pZipEntry, pZipEntry );
    };

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
            console.warn( ex.message );
        }

        return count;
    };

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
            console.warn( ex.message );

            let archive = repair( pArchive );

        }

        return entries;
    };

    const getEntry = function( pArchive, pName )
    {
        let archiver, entry, archiveEntry = null;

        try
        {
            archiver = new admZip( pArchive );

            entry = archiver.getEntry( asString( pName ) );
        }
        catch( ex )
        {
            console.error( ex.message );
        }

        if ( entry )
        {
            try
            {
                archiveEntry = ArchiveEntry.fromZipEntry( entry );
            }
            catch( ex )
            {
                console.error( ex.message );
            }
        }

        return archiveEntry || entry;
    };

    const testZipFileIntegrity = function( pArchive )
    {

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

    const decompressBuffer = function( pBuffer )
    {
        if ( isSafeArchive( pBuffer ) )
        {
            return zLib.unzipSync( pBuffer );
        }

        return Buffer.alloc( 0 );
    };

    const decompressTypedArray = function( pByteArray )
    {
        const buffer = Buffer.from( pByteArray );

        if ( isSafeArchive( buffer ) )
        {
            return decompressBuffer( buffer );
        }

        return Buffer.alloc( 0 );
    };

    // onSuccess(Buffer buffer);
    // onFail(String error);
    // onItemStart(String fileName);
    // onItemEnd(String fileName);

    class ZipListener
    {
        constructor( pZip, pOnSuccessCallback, pOnFailCallback )
        {
            this._zip = pZip;
            this._onSuccess = pOnSuccessCallback || function() {};
            this._onFailure = pOnFailCallback || function() {};

            this.unzip();
        }

        unzip( pZip )
        {
            const zip = pZip || this._zip;

            if ( zip )
            {
                return zip.toBuffer( this._onSuccess, this._onFailure );
            }

            return Buffer.alloc( 0 );
        }
    }

    const mod =
        {
            dependencies:
                {
                    constants,
                    typeUtils,
                    stringUtils,
                    arrayUtils,
                    objectUtils,
                    admZip,
                    zLib,
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
            forEach
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
