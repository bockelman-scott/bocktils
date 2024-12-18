// no need to require jest here... run this test from the console using 'npx jest'
// let jester = require( "jest" );
// jester.run( __filename );

const core = require( "@toolbocks/core" );

const { stringUtils } = core;

const fs = require( "fs" );

/** import the module we are testing */
const zipUtils = require( "../src/CompressionUtils.cjs" );

const { toAbsolutePath } = stringUtils;

const { isEmptyArchive, isSafeArchive, getEntryCount, getEntries, getEntry, calculateTotalUncompressedSize } = zipUtils;

const utf8 = "utf-8";

const testDataDir = "../../../test_data";

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

const edi_1011 = `ISA*00*          *00*          *ZZ*911446999      *ZZ*133052274      *240725*1509*^*00501*000015911*0*P*:~GS*HC*911446999*133052274*20240725*1509*1382*X*005010X224A2~ST*837*0001*005010X224A2~BHT*0019*00*                    15911*20240725*1509*CH~NM1*41*2*DSN Software*****46*911446999~PER*IC*EDI Manager*TE*3607360635~NM1*40*2*WEBMD*****46*133052274~HL*1**20*1~PRV*BI*PXC*1223S0112X~NM1*85*2*Cameo Dental Specialists*****XX*1700959723~N3*7603 W. North Ave.~N4*River Forest*IL*60305~REF*EI*822888724~REF*G5*000A~REF*0B*21-002993~PER*IC*Alissa Pullos*TE*7085790488~NM1*87*2~N3*475 W 55th St~N4*LaGrange*IL*60525~HL*2*1*22*1~SBR*P**0170684******CI~NM1*IL*1*Leitch*Patrick****MI*W266336614~DMG*D8*19810429*M~NM1*PR*2*Aetna*****PI*60054~N3*Po Box 981106~N4*Lexington*KY*40512~REF*FY*NOCD~HL*3*2*23*0~PAT*01~NM1*QC*1*Sugai*Hisako~N3*7771 Van Buren St~N4*Forest Park*IL*60130~DMG*D8*19780129*F~CLM*2358338135S15911*515***11:B:1*Y*A*Y*Y~NM1*82*1*Pullos*Alissa****XX*1043607872~PRV*PE*PXC*1223S0112X~REF*0B*21-002993~NM1*77*2*Pullos*****XX*1700959723~N3*7603 W. North Ave.~N4*River Forest*IL*60305~LX*1~SV3*AD:D3432*515.00****1~TOO*JP*9~DTP*472*D8*20240717~SE*43*0001~GE*1*1382~IEA*1*000015911~`;


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
          const zipFileName = `${testDataDir}/zip_files/1027.zip`;
          const zipFilePath = toAbsolutePath( zipFileName, __dirname );
          const zipContents = fs.readFileSync( zipFilePath );

          const size = calculateTotalUncompressedSize( zipContents );

          expect( size ).toEqual( 5_152 );
      } );

