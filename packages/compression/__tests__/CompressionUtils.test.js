const core = require( "@toolbocks/core" );

const { typeUtils, arrayUtils, stringUtils } = core;

const fs = require( "node:fs" );
const fsAsync = require( "node:fs/promises" );

/** import the module we are testing */
const zipUtils = require( "../src/CompressionUtils.cjs" );
const path = require( "node:path" );

const { toAbsolutePath } = stringUtils;

const { isObject, isTypedArray } = typeUtils;

const {
    arrayFromBuffer,
    typedArrayFromBuffer,
    isFile,
    isDirectory,
    removeExtension,
    replaceExtension,
    pkUnZip,
    pkZip,
    pipeToCompressedFile,
    pipeToUncompressedFile,
    isEmptyArchive,
    isSafeArchive,
    getEntryCount,
    getEntries,
    getEntry,
    calculateTotalUncompressedSize,
    CompressionOptions,
    PKZIP_OPTIONS,
    GZIP_OPTIONS,
    DEFLATE_OPTIONS,
    INFLATE_OPTIONS,
    BROTLI_OPTIONS,
} = zipUtils;

const utf8 = "utf-8";


const currentDirectory = path.dirname( __filename );

const projectRootDirectory = path.resolve( currentDirectory, "../../../" );

const testDataDir = path.resolve( projectRootDirectory, "test_data" );

const zippedFilesDir = path.resolve( testDataDir, "zip_files" );

const unzippedFilesDir = path.resolve( testDataDir, "unzipped_files" );

const textFilesDir = path.resolve( testDataDir, "text_files" );

const edi_1011 = `ISA*00*          *00*          *ZZ*911446999      *ZZ*133052274      *240725*1509*^*00501*000015911*0*P*:~GS*HC*911446999*133052274*20240725*1509*1382*X*005010X224A2~ST*837*0001*005010X224A2~BHT*0019*00*                    15911*20240725*1509*CH~NM1*41*2*DSN Software*****46*911446999~PER*IC*EDI Manager*TE*3607360635~NM1*40*2*WEBMD*****46*133052274~HL*1**20*1~PRV*BI*PXC*1223S0112X~NM1*85*2*Cameo Dental Specialists*****XX*1700959723~N3*7603 W. North Ave.~N4*River Forest*IL*60305~REF*EI*822888724~REF*G5*000A~REF*0B*21-002993~PER*IC*Alissa Pullos*TE*7085790488~NM1*87*2~N3*475 W 55th St~N4*LaGrange*IL*60525~HL*2*1*22*1~SBR*P**0170684******CI~NM1*IL*1*Leitch*Patrick****MI*W266336614~DMG*D8*19810429*M~NM1*PR*2*Aetna*****PI*60054~N3*Po Box 981106~N4*Lexington*KY*40512~REF*FY*NOCD~HL*3*2*23*0~PAT*01~NM1*QC*1*Sugai*Hisako~N3*7771 Van Buren St~N4*Forest Park*IL*60130~DMG*D8*19780129*F~CLM*2358338135S15911*515***11:B:1*Y*A*Y*Y~NM1*82*1*Pullos*Alissa****XX*1043607872~PRV*PE*PXC*1223S0112X~REF*0B*21-002993~NM1*77*2*Pullos*****XX*1700959723~N3*7603 W. North Ave.~N4*River Forest*IL*60305~LX*1~SV3*AD:D3432*515.00****1~TOO*JP*9~DTP*472*D8*20240717~SE*43*0001~GE*1*1382~IEA*1*000015911~`;

describe( "arrayFromBuffer", () =>
{
    const buffer = Buffer.from( [0xAB, 0xCD, 0xEF] );
    const array = [0xAB, 0xCD, 0xEF];
    const uintArray = Uint8Array.from( [0xAB, 0xCD, 0xEF] );

    const s = "0xAB, 0xCD, 0xEF";
    const s2 = ["0xAB", "0xCD", "0xEF"];

    test( "arrayFromBuffer from a Buffer",
          () =>
          {
              const arr = arrayFromBuffer( buffer );

              expect( arr?.length ).toEqual( 3 );

              expect( arr[0] ).toEqual( 0xAB );
              expect( arr[1] ).toEqual( 0xCD );
              expect( arr[2] ).toEqual( 0xEF );

              expect( isTypedArray( arr ) ).toBe( true );
          } );

    test( "arrayFromBuffer from an Array",
          () =>
          {
              let arr = arrayFromBuffer( array );

              expect( arr?.length ).toEqual( 3 );

              expect( arr[0] ).toEqual( 0xAB );
              expect( arr[1] ).toEqual( 0xCD );
              expect( arr[2] ).toEqual( 0xEF );

              expect( isTypedArray( arr ) ).toBe( true );


              arr = arrayFromBuffer( uintArray );

              expect( arr?.length ).toEqual( 3 );

              expect( arr[0] ).toEqual( 0xAB );
              expect( arr[1] ).toEqual( 0xCD );
              expect( arr[2] ).toEqual( 0xEF );

              expect( isTypedArray( arr ) ).toBe( true );
          } );

    test( "arrayFromBuffer from a String or an Array of Strings",
          () =>
          {
              let arr = arrayFromBuffer( s );

              expect( arr?.length ).toEqual( 3 );

              expect( arr[0] ).toEqual( 0xAB );
              expect( arr[1] ).toEqual( 0xCD );
              expect( arr[2] ).toEqual( 0xEF );

              expect( isTypedArray( arr ) ).toBe( true );


              arr = arrayFromBuffer( s2 );

              expect( arr?.length ).toEqual( 3 );

              expect( arr[0] ).toEqual( 0xAB );
              expect( arr[1] ).toEqual( 0xCD );
              expect( arr[2] ).toEqual( 0xEF );

              expect( isTypedArray( arr ) ).toBe( true );
          } );
} );

describe( "typedArrayFromBuffer", () =>
{
    const buffer = Buffer.from( [0xAB, 0xCD, 0xEF] );
    const array = [0xAB, 0xCD, 0xEF];
    const uintArray = Uint8Array.from( [0xAB, 0xCD, 0xEF] );

    const s = "0xAB, 0xCD, 0xEF";
    const s2 = ["0xAB", "0xCD", "0xEF"];

    test( "typedArrayFromBuffer from a Buffer",
          () =>
          {
              const arr = typedArrayFromBuffer( buffer, Uint16Array );

              expect( arr?.length ).toEqual( 3 );

              expect( arr[0] ).toEqual( 0xAB );
              expect( arr[1] ).toEqual( 0xCD );
              expect( arr[2] ).toEqual( 0xEF );

              expect( isTypedArray( arr ) ).toBe( true );
              expect( arr instanceof Uint16Array ).toBe( true );
          } );

    test( "typedArrayFromBuffer from an Array",
          () =>
          {
              let arr = typedArrayFromBuffer( array, Uint16Array );

              expect( arr?.length ).toEqual( 3 );

              expect( arr[0] ).toEqual( 0xAB );
              expect( arr[1] ).toEqual( 0xCD );
              expect( arr[2] ).toEqual( 0xEF );

              expect( isTypedArray( arr ) ).toBe( true );
              expect( arr instanceof Uint16Array ).toBe( true );

              arr = typedArrayFromBuffer( uintArray, Uint16Array );

              expect( arr?.length ).toEqual( 3 );

              expect( arr[0] ).toEqual( 0xAB );
              expect( arr[1] ).toEqual( 0xCD );
              expect( arr[2] ).toEqual( 0xEF );

              expect( isTypedArray( arr ) ).toBe( true );
              expect( arr instanceof Uint16Array ).toBe( true );
          } );

    test( "typedArrayFromBuffer from a String or an Array of Strings",
          () =>
          {
              let arr = typedArrayFromBuffer( s, Uint16Array );

              expect( arr?.length ).toEqual( 3 );

              expect( arr[0] ).toEqual( 0xAB );
              expect( arr[1] ).toEqual( 0xCD );
              expect( arr[2] ).toEqual( 0xEF );

              expect( isTypedArray( arr ) ).toBe( true );
              expect( arr instanceof Uint16Array ).toBe( true );


              arr = typedArrayFromBuffer( s2, Uint16Array );

              expect( arr?.length ).toEqual( 3 );

              expect( arr[0] ).toEqual( 0xAB );
              expect( arr[1] ).toEqual( 0xCD );
              expect( arr[2] ).toEqual( 0xEF );

              expect( isTypedArray( arr ) ).toBe( true );
              expect( arr instanceof Uint16Array ).toBe( true );
          } );
} );

describe( "isFile", () =>
{
    const zipDirName = `${zippedFilesDir}`;
    const zipFileName = `${zippedFilesDir}/empty.zip`;

    test( "isFile",
          async() =>
          {
              const dirIsFile = await isFile( zipDirName );
              expect( dirIsFile ).toBe( false );

              const fileIsFile = await isFile( zipFileName );
              expect( fileIsFile ).toBe( true );
          } );
} );

describe( "isDirectory", () =>
{
    const zipDirName = `${zippedFilesDir}`;
    const zipFileName = `${zippedFilesDir}/empty.zip`;

    test( "isDirectory",
          async() =>
          {
              const dirIsDir = await isDirectory( zipDirName );
              expect( dirIsDir ).toBe( true );

              const fileIsDir = await isDirectory( zipFileName );
              expect( fileIsDir ).toBe( false );
          } );
} );

describe( "removeExtension / replaceExtension", () =>
{
    const zipFileName = `${zippedFilesDir}/empty.zip`;

    test( "removeExtension",
          () =>
          {
              expect( path.basename( removeExtension( zipFileName ) ) ).toEqual( "empty" );
          } );

    test( "removeExtension",
          () =>
          {
              expect( path.basename( removeExtension( "a.b.txt" ) ) ).toEqual( "a.b" );
          } );

    test( "replaceExtension",
          () =>
          {
              expect( path.basename( replaceExtension( zipFileName, ".gz" ) ) ).toEqual( "empty.gz" );
          } );

    test( "replaceExtension",
          () =>
          {
              expect( path.basename( replaceExtension( zipFileName, ".gz.br" ) ) ).toEqual( "empty.gz.br" );
          } );

    test( "replaceExtension",
          () =>
          {
              expect( path.basename( replaceExtension( "a.b.txt", ".zip" ) ) ).toEqual( "a.b.zip" );
          } );

} );

describe( "PKZIP_CLASSES", () =>
{
    const { PKZIP_CLASSES } = zipUtils.classes;

    test( "PKZIP_CLASSES",
          () =>
          {
              expect( isObject( PKZIP_CLASSES ) ).toBe( true );
              expect( Object.entries( PKZIP_CLASSES ).length ).toEqual( 15 );
          } );
} );


describe( "PasswordProtection", () =>
{
    const { PasswordProtection } = zipUtils;

    let pwd = "jabberwocky";
    let salt = "himalayan pink";
    let encoding = "utf-8";

    test( "PasswordProtection",
          () =>
          {
              expect( PasswordProtection ).toEqual( zipUtils.classes.PasswordProtection );

              const protectedPassword = PasswordProtection.encrypt( pwd, salt, encoding );

              expect( protectedPassword instanceof PasswordProtection ).toBe( true );

              const decrypted = protectedPassword.decrypt();

              expect( decrypted ).toEqual( pwd );

              const persisted = protectedPassword.storable;

              const retrieved = PasswordProtection.fromStorable( persisted );

              const rPwd = retrieved.decrypt();

              expect( rPwd ).toEqual( pwd );
          } );


    test( "PasswordProtection for more complex passwords and salts",
          () =>
          {
              let pwd = "?6%2bMG5mS/LG&v_63k4ay6fpP.v-8W";
              let salt = "2:pXcQarbfSfT2F$:!eRS6kB.nT.tJ5";
              let encoding = "utf-8";

              const protectedPassword = PasswordProtection.encrypt( pwd, salt, encoding );

              expect( protectedPassword instanceof PasswordProtection ).toBe( true );

              const decrypted = protectedPassword.decrypt();

              expect( decrypted ).toEqual( pwd );

              const persisted = protectedPassword.storable;

              const retrieved = PasswordProtection.fromStorable( persisted );

              const rPwd = retrieved.decrypt();

              expect( rPwd ).toEqual( pwd );
          } );
} );


describe( "pkUnZip", () =>
{
    test( "unzip 1011.zip",
          async() =>
          {
              const zipFilePath = path.resolve( zippedFilesDir + "/1011.zip" );
              const outputPath = path.resolve( unzippedFilesDir );

              await pkUnZip( zipFilePath, outputPath );

              const entries = await fsAsync.readdir( outputPath, { withFileTypes: true } );

              let found = false;

              for( const entry of entries )
              {
                  if ( entry && entry.isFile() && entry.name === "1011.edi" )
                  {
                      found = true;
                      break;
                  }
              }

              expect( found ).toBe( true );

              let contents = await fsAsync.readFile( path.resolve( outputPath + "/1011.edi" ), { encoding: utf8 } );

              expect( contents ).toEqual( edi_1011 );

              await fsAsync.unlink( path.resolve( outputPath + "/1011.edi" ) );
          } );
} );

describe( "pkZip", () =>
{
    test( "zip text_01.txt",
          async() =>
          {
              const inputPath = path.resolve( textFilesDir + "/text_1.txt" );
              const outputPath = path.resolve( zippedFilesDir );

              const originalContents = await fsAsync.readFile( inputPath, { encoding: utf8 } );

              await pkZip( inputPath, outputPath );

              const entries = await fsAsync.readdir( outputPath, { withFileTypes: true } );

              let found = false;

              for( const entry of entries )
              {
                  if ( entry && entry.isFile() && entry.name === "text_1.zip" )
                  {
                      found = true;
                      break;
                  }
              }

              expect( found ).toBe( true );

              await pkUnZip( path.resolve( outputPath + "/text_1.zip" ), unzippedFilesDir );

              const contents = await fsAsync.readFile( path.resolve( unzippedFilesDir + "/text_1.txt" ), { encoding: utf8 } );

              expect( contents ).toEqual( originalContents );

              await fsAsync.unlink( path.resolve( outputPath + "/text_1.zip" ) );
              await fsAsync.unlink( path.resolve( unzippedFilesDir + "/text_1.txt" ) );
          } );
} );

describe( "pipeToCompressedFile", () =>
{
    test( "pipe it to GZIP",
          async() =>
          {
              const zippedFileName = "text_1.gz";
              const unzippedFileName = "text_1.txt";

              const inputPath = path.resolve( textFilesDir, unzippedFileName );
              const outputPath = path.resolve( zippedFilesDir );

              const originalContents = await fsAsync.readFile( inputPath, { encoding: utf8 } );

              let compressionOptions = CompressionOptions.DEFAULT;

              let compressedFilePath = await pipeToCompressedFile( inputPath, outputPath, compressionOptions );

              const entries = await fsAsync.readdir( outputPath, { withFileTypes: true } );

              let found = false;

              for( const entry of entries )
              {
                  if ( entry && entry.isFile() && entry.name === zippedFileName )
                  {
                      found = true;
                      break;
                  }
              }

              expect( found ).toBe( true );

              let uncompressedFilePath = await pipeToUncompressedFile( compressedFilePath, unzippedFilesDir, compressionOptions );

              const contents = await fsAsync.readFile( uncompressedFilePath, { encoding: utf8 } );

              expect( contents ).toEqual( originalContents );

              await fsAsync.unlink( compressedFilePath );
              await fsAsync.unlink( uncompressedFilePath );
          } );

    test( "pipe it to DEFLATE",
          async() =>
          {
              const zippedFileName = "text_1.z";
              const unzippedFileName = "text_1.txt";

              const inputPath = path.resolve( textFilesDir, unzippedFileName );
              const outputPath = path.resolve( zippedFilesDir );

              const originalContents = await fsAsync.readFile( inputPath, { encoding: utf8 } );

              let compressionOptions = CompressionOptions.DEFLATE;

              let compressedFilePath = await pipeToCompressedFile( inputPath, outputPath, compressionOptions );

              const entries = await fsAsync.readdir( outputPath, { withFileTypes: true } );

              let found = false;

              for( const entry of entries )
              {
                  if ( entry && entry.isFile() && entry.name === zippedFileName )
                  {
                      found = true;
                      break;
                  }
              }

              expect( found ).toBe( true );

              let uncompressedFilePath = await pipeToUncompressedFile( compressedFilePath, unzippedFilesDir, compressionOptions );

              const contents = await fsAsync.readFile( uncompressedFilePath, { encoding: utf8 } );

              expect( contents ).toEqual( originalContents );

              await fsAsync.unlink( compressedFilePath );
              await fsAsync.unlink( uncompressedFilePath );
          } );

} );


describe( "Test Archive Files", () =>
{
    test( "empty.zip is an empty archive",
          () =>
          {
              const zipFileName = `${testDataDir}/zip_files/empty.zip`;
              const zipFilePath = toAbsolutePath( zipFileName, __dirname );
              const zipContents = fs.readFileSync( zipFilePath );

              expect( isEmptyArchive( zipContents ) ).toBe( true );
          } );

    test( "980.zip is not an empty archive",
          () =>
          {
              const zipFileName = `${testDataDir}/zip_files/980.zip`;
              const zipFilePath = toAbsolutePath( zipFileName, __dirname );
              const zipContents = fs.readFileSync( zipFilePath );

              expect( isEmptyArchive( zipContents ) ).toBe( false );
          } );

    test( "980.zip is a safe archive",
          () =>
          {
              const zipFileName = `${testDataDir}/zip_files/980.zip`;
              const zipFilePath = toAbsolutePath( zipFileName, __dirname );
              const zipContents = fs.readFileSync( zipFilePath );

              expect( isSafeArchive( zipContents ) ).toBe( true );
          } );

    test( "980.zip has one zip entry",
          () =>
          {
              const zipFileName = `${testDataDir}/zip_files/980.zip`;
              const zipFilePath = toAbsolutePath( zipFileName, __dirname );
              const zipContents = fs.readFileSync( zipFilePath );

              expect( getEntryCount( zipContents ) ).toEqual( 1 );
          } );

    test( "1027.zip has 4 zip entries",
          () =>
          {
              const zipFileName = `${testDataDir}/zip_files/1027.zip`;
              const zipFilePath = toAbsolutePath( zipFileName, __dirname );
              const zipContents = fs.readFileSync( zipFilePath );

              expect( getEntryCount( zipContents ) ).toEqual( 4 );
          } );

    test( "1027.zip entries are the expected entries",
          () =>
          {
              const zipFileName = `${testDataDir}/zip_files/1027.zip`;
              const zipFilePath = toAbsolutePath( zipFileName, __dirname );
              const zipContents = fs.readFileSync( zipFilePath );

              const entries = getEntries( zipContents );

              expect( entries?.length ).toEqual( 4 );

              const names = entries.map( entry => entry?.name );

              expect( names?.length ).toEqual( 4 );

              expect( names.includes( "1027.edi" ) ).toBe( true );
              expect( names.includes( "1022.edi" ) ).toBe( true );
              expect( names.includes( "1018.edi" ) ).toBe( true );
              expect( names.includes( "1015.edi" ) ).toBe( true );

              expect( names.includes( "1028.edi" ) ).toBe( false );
          } );

    test( "getEntry - by name - from 1027.zip returns the correct entry",
          () =>
          {
              const zipFileName = `${testDataDir}/zip_files/1027.zip`;
              const zipFilePath = toAbsolutePath( zipFileName, __dirname );
              const zipContents = fs.readFileSync( zipFilePath );

              const entry = getEntry( zipContents, "1015.edi" );

              expect( entry?.name ).toEqual( "1015.edi" );

              expect( "object" === typeof entry?.header ).toBe( true );

              const hdr = entry?.header || {};

              expect( hdr?.compressedSize ).toEqual( 667 );
          } );

    test( "1011.zip decompresses to edi_1011",
          () =>
          {
              const zipFileName = `${testDataDir}/zip_files/1011.zip`;
              const zipFilePath = toAbsolutePath( zipFileName, __dirname );
              const zipContents = fs.readFileSync( zipFilePath );

              const entries = getEntries( zipContents );

              const data = entries[0].getData();

              const content = data.toString( utf8 );

              expect( content ).toEqual( edi_1011 );

              expect( entries[0].getDataAs( "string" ) ).toEqual( edi_1011 );
          } );


    test( "1027.zip uncompressed total size is 5,152",
          () =>
          {
              const zipFileName = `${zippedFilesDir}/1027.zip`;
              const zipFilePath = toAbsolutePath( zipFileName, __dirname );
              const zipContents = fs.readFileSync( zipFilePath );

              const size = calculateTotalUncompressedSize( zipContents );

              expect( size ).toEqual( 5_152 );
          } );
} );

