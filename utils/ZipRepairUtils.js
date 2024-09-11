const fs = require( "fs" );
const fsAsync = require( "fs/promises" );

const utils = require( "./CommonUtils.js" );

let constants = utils.constants;
let stringUtils = utils.stringUtils;
let arrayUtils = utils.arrayUtils;
let objectUtils = utils.objectUtils;

const zlib = require( "zlib" );

/**
 * The PkZip format uses little-endian byte ordering
 *
 * @type {string}
 */
const ENDIANESS = "LE";

const ZIP_CENTRAL_DIRECTORY_FILE_HEADER_BYTES = [0x50, 0x4b, 0x01, 0x02]; // 0x02014b50;

const ZIP_CENTRAL_DIRECTORY_FILE_HEADER = Buffer.from( ZIP_CENTRAL_DIRECTORY_FILE_HEADER_BYTES );

const CENTRAL_DIRECTORY_FILE_HEADER_ARRAY = Uint8Array.from( ZIP_CENTRAL_DIRECTORY_FILE_HEADER_BYTES );

const ZIP_HEADER_BYTES = Object.freeze( [0x50, 0x4b, 0x03, 0x04] ); // 0x04034b50

const ZIP_HEADER_SIGNATURE = Buffer.from( ZIP_HEADER_BYTES );

const ZIP_HEADER_SIGNATURE_ARRAY = Uint8Array.from( ZIP_HEADER_BYTES );

const LOCAL_FILE_HEADER_LENGTH = 30; // * minimum; may be longer

const LOCAL_FILE_HEADER_OFFSETS =
    {
        "signature":
            {
                offset: 0,
                length: 4,
                description: "Local file header signature = 0x04034b50 (PK♥♦ or \"PK\\3\\4\")"
            },
        "version":
            {
                offset: 4,
                length: 2,
                description: "Version required to extract (minimum)"
            },
        "bit_flag":
            {
                offset: 6,
                length: 2,
                description: "General purpose bit flag"
            },
        "method":
            {
                offset: 8,
                length: 2,
                description: "Compression method; e.g. none = 0, DEFLATE = 8 (or \"\\0x08\\0x00\")"
            },
        "last_modified_time":
            {
                offset: 10,
                length: 2,
                description: "Last modified time"
            },
        "last_modified_date":
            {
                offset: 12,
                length: 2,
                description: "Last modified time"
            },
        "crc":
            {
                offset: 14,
                length: 4,
                description: "CRC-32 of uncompressed data"
            },
        "compressed_size":
            {
                offset: 18,
                length: 4,
                description: "Compressed size (or 0xffffffff for ZIP64)"
            },
        "uncompressed_size":
            {
                offset: 22,
                length: 4,
                description: "Uncompressed size (or 0xffffffff for ZIP64)"
            },
        "file_name_length":
            {
                offset: 26,
                length: 2,
                description: "Length of the filename stored at offset 30"
            },
        "extra":
            {
                offset: 28,
                length: 2,
                description: "extra field length (beyond 30 + filename length"
            },
        "filename":
            {
                offset: 30,
                length: -1,
                description: "file name; note that the length of this header is defined at offset 26"
            },
        "extra_field":
            {
                offset: -1,
                length: -1,
                description: "extra data stored beyond the filename; note that both its start offset and length are dependent upon data found at offsets 26 and 28"
            }
    };

const CENTRAL_DIRECTORY_OFFSETS =
    {
        "signature":
            {
                offset: 0,
                length: 4,
                description: "Local file header signature = 0x04034b50 (PK♥♦ or \"PK\\3\\4\")"
            },
        "version_made_by":
            {
                offset: 4,
                length: 2,
                description: "Version used to create the archive"
            },
        "version_required":
            {
                offset: 6,
                length: 2,
                description: "Version required to extract (minimum)"
            },
        "bit_flag":
            {
                offset: 8,
                length: 2,
                description: "General purpose bit flag"
            },
        "method":
            {
                offset: 10,
                length: 2,
                description: "Compression method; e.g. none = 0, DEFLATE = 8 (or \"\\0x08\\0x00\")"
            },
        "last_modified_time":
            {
                offset: 12,
                length: 2,
                description: "Last modified time"
            },
        "last_modified_date":
            {
                offset: 14,
                length: 2,
                description: "Last modified time"
            },
        "crc":
            {
                offset: 16,
                length: 4,
                description: "CRC-32 of uncompressed data"
            },
        "compressed_size":
            {
                offset: 20,
                length: 4,
                description: "Compressed size (or 0xffffffff for ZIP64)"
            },
        "uncompressed_size":
            {
                offset: 24,
                length: 4,
                description: "Uncompressed size (or 0xffffffff for ZIP64)"
            },
        "file_name_length":
            {
                offset: 28,
                length: 2,
                description: "Length of the filename stored at offset 30"
            },
        "extra":
            {
                offset: 30,
                length: 2,
                description: "extra field length (beyond 30 + filename length"
            },
        "file_comment_length":
            {
                offset: 32,
                length: 2,
                description: "length of the file comment(s)"
            },
        "disk_number":
            {
                offset: 34,
                length: 2,
                description: "disk number where file starts; legacy value for the days of floppy discs"
            },
        "file_attributes_internal":
            {
                offset: 36,
                length: 2,
                description: ""
            },
        "file_attributes_external":
            {
                offset: 38,
                length: 4,
                description: ""
            },
        "relative_offset":
            {
                offset: 42,
                length: 4,
                description: "Relative offset of local file header (or 0xffffffff for ZIP64)"
            }
    };

const END_OF_CENTRAL_DIRECTORY_OFFSETS =
    {
        "signature":
            {
                offset: 0,
                length: 4,
                description: "End of central directory signature = 0x06054b50"
            },
        "disk_number":
            {
                offset: 4,
                length: 2,
                description: "Number of this disk (or 0xffff for ZIP64)"
            },
        "central_directory_disk_number":
            {
                offset: 6,
                length: 2,
                description: "Disk where central directory starts (or 0xffff for ZIP64)"
            },
        "central_directory_num_records_on_disk":
            {
                offset: 8,
                length: 2,
                description: "Number of central directory records on this disk (or 0xffff for ZIP64)"
            },
        "central_directory_total_records":
            {
                offset: 10,
                length: 2,
                description: "Total number of central directory records (or 0xffff for ZIP64)"
            },
        "central_directory_size":
            {
                offset: 12,
                length: 4,
                description: "Size of central directory (bytes) (or 0xffffffff for ZIP64)"
            },
        "central_directory_offset":
            {
                offset: 16,
                length: 4,
                description: "Offset of start of central directory, relative to start of archive (or 0xffffffff for ZIP64)"
            }
    };


/**
 * Returns an object with the header start positions and the headers for the zip file data
 *
 * @param pData a buffer of binary data
 * @returns {{headers: *[],positions:[number]}}
 */
function extractHeaders( pData )
{
    const headersInfo = { headers: [], positions: [] };

    const buffer = new Uint8Array( pData );

    for( let i = 0, n = ((buffer?.length || 0) - 3); i < n; i++ )
    {
        const byteRun = buffer.slice( i, i + 4 );

        if ( arrayUtils.arraysEqual( byteRun, ZIP_HEADER_SIGNATURE ) )
        {
            headersInfo.headers.push( byteRun );
            headersInfo.positions.push( i );
        }
    }

    return headersInfo;
}

class ZipFileEntry
{
    constructor( pData, pPosition )
    {
        this.buffer = Uint8Array.from( pData ) || new Uint8Array( pData );
        this.byteStartPosition = asInt( pPosition, 0 );

        let offset = this.byteStartPosition + LOCAL_FILE_HEADER_OFFSETS.signature.offset;
        let stopByte = offset + LOCAL_FILE_HEADER_OFFSETS.signature.length;

        this.signature = Uint8Array.prototype.slice.call( this.buffer, offset, stopByte );

        offset = stopByte;
        stopByte = offset + LOCAL_FILE_HEADER_OFFSETS.version.length;

        this.version = Uint8Array.prototype.slice.call( this.buffer, offset, stopByte );

        offset = stopByte;
        stopByte = offset + LOCAL_FILE_HEADER_OFFSETS.bit_flag.length;

        this.bit_flag = Uint8Array.prototype.slice.call( this.buffer, offset, stopByte );

        offset = stopByte;
        stopByte = offset + LOCAL_FILE_HEADER_OFFSETS.method.length;

        this.method = Uint8Array.prototype.slice.call( this.buffer, offset, stopByte );

        offset = stopByte;
        stopByte = offset + LOCAL_FILE_HEADER_OFFSETS.last_modified_time.length;

        this.last_modified_time = Uint8Array.prototype.slice.call( this.buffer, offset, stopByte );

        offset = stopByte;
        stopByte = offset + LOCAL_FILE_HEADER_OFFSETS.last_modified_date.length;

        this.last_modified_date = Uint8Array.prototype.slice.call( this.buffer, offset, stopByte );

        offset = stopByte;
        stopByte = offset + LOCAL_FILE_HEADER_OFFSETS.crc.length;

        this.crc = Uint8Array.prototype.slice.call( this.buffer, offset, stopByte );

        offset = stopByte;
        stopByte = offset + LOCAL_FILE_HEADER_OFFSETS.compressed_size.length;

        this.compressed_size = Uint8Array.prototype.slice.call( this.buffer, offset, stopByte );

        offset = stopByte;
        stopByte = offset + LOCAL_FILE_HEADER_OFFSETS.uncompressed_size.length;

        this.uncompressed_size = Uint8Array.prototype.slice.call( this.buffer, offset, stopByte );

        offset = stopByte;
        stopByte = offset + LOCAL_FILE_HEADER_OFFSETS.file_name_length.length;

        this.file_name_length = Uint8Array.prototype.slice.call( this.buffer, offset, stopByte );

        offset = stopByte;
        stopByte = offset + LOCAL_FILE_HEADER_OFFSETS.extra.length;

        this.extra = Uint8Array.prototype.slice.call( this.buffer, offset, stopByte );

        offset = stopByte;
        stopByte = offset + (this.file_name_length);

        this.filename = Uint8Array.prototype.slice.call( this.buffer, offset, stopByte );

        offset = stopByte;
        stopByte = offset + this.extra;

        this.extra_field = Uint8Array.prototype.slice.call( this.buffer, offset, stopByte );

        this.length = stopByte - this.byteStartPosition;
    }
}

function extractEntries( pData, pHeadersInfo )
{
    const buffer = Uint8Array.from( pData ) || new Uint8Array( pData ) || Buffer.from( pData );

    const headersInfo = pHeadersInfo || { positions: [] };

    const entries = [];

    const positions = headersInfo.positions;

    for( let i = 0, n = positions?.length || 0; i < n; i++ )
    {
        const zipFileEntry = Object.freeze( new ZipFileEntry( buffer, positions[i] ) );
        entries.push( zipFileEntry );
    }

    return Object.freeze( entries );
}

function extractEntryAtOffset( pData, pOffset )
{
    let buffer = new Uint8Array( pData );

    if ( buffer.length < LOCAL_FILE_HEADER_LENGTH )
    {
        return { status: "error", message: "Incomplete local file header." };
    }

    const offset = asInt( pOffset, 0 );

    buffer = Uint8Array.prototype.slice.call( buffer, offset, offset + LOCAL_FILE_HEADER_LENGTH );

    const signature = Uint8Array.prototype.slice.call( buffer, 0, 4 );

    if ( !arrayUtils.arraysEqual( signature, Buffer.from( ZIP_HEADER_BYTES ) ) )
    {
        return { status: "error", message: "Invalid local file header signature." };
    }

    const [
        version, flag, compression, modTime, modDate, crc32, compressedSize, uncompressedSize, filenameLength, extraLength
    ] = buffer.slice( 4 );

    const filename = buffer.slice( LOCAL_FILE_HEADER_LENGTH, LOCAL_FILE_HEADER_LENGTH + filenameLength ).toString( "utf-8" );
    const extraField = buffer.slice( LOCAL_FILE_HEADER_LENGTH + filenameLength, LOCAL_FILE_HEADER_LENGTH + filenameLength + extraLength );

    const compressedData = fs.readFileSync( filePath, {
        start: pOffset + LOCAL_FILE_HEADER_LENGTH + filenameLength + extraLength,
        end: pOffset + LOCAL_FILE_HEADER_LENGTH + filenameLength + extraLength + compressedSize.readUInt32LE()
    } );

    return {
        status: "success",
        filename,
        compressedSize: compressedSize.readUInt32LE(),
        uncompressedSize: uncompressedSize.readUInt32LE(),
        compressedData,
    };
}

// Function to decompress data (similar logic)
function decompressData( compressedData )
{
    try
    {
        const decompressedData = zlib.inflateSync( compressedData );
        return { status: "success", data: decompressedData };
    }
    catch( error )
    {
        return { status: "error", message: error.message };
    }
}

// Function to unzip a file (modified logic for Node.js)
async function unzipFile( filePath, extractTo )
{
    try
    {
        const headers = extractHeaders( filePath );
        if ( !headers.localFileHeaders.length )
        {
            return { status: "error", message: "No valid local file headers found." };
        }

        for( const offset of headers.localFileHeaders )
        {
            const fileData = extractEntryAtOffset( filePath, offset );
            if ( fileData.status === "success" )
            {
                const decompressionResult = decompressData( fileData.compressedData );
                if ( decompressionResult.status === "success" )
                {
                    const decompressedFilePath = path.join( extractTo, fileData.filename );
                    await fs.promises.writeFile( decompressedFilePath, decompressionResult.data );
                    console.log( `Successfully extracted file to ${decompressedFilePath}` );
                }
                else
                {
                    console.error( decompressionResult.message );
                }
            }
            else
            {
                console.error( fileData.message );
            }
        }

        return { status: "success", message: "Files extracted successfully." };
    }
    catch( error )
    {
        console.error( error.message );
        return { status: "error", message: error.message };
    }
}

// Example usage (similar logic)
const filePath = "TestFailedPayload.zip";
const extractTo = "extracted_files";

await fs.promises.mkdir( extractTo, { recursive: true } );

const result = await unzipFile( filePath, extractTo );
console.log( result );
