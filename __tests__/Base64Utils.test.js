// no need to require jest here... run this test from the console using 'npx jest'
// let jester = require( "jest" );
// jester.run( __filename );

/** import the module we are testing */
const base64Utils = require( "../src/Base64Utils.cjs" );

let stringUtils = base64Utils.dependencies.stringUtils;

const invalidContent = "UEsDBBQAAAAIAHmT+liwmYcqjAIAALsEAAAYAFsARmlsZV8yMDI0MDcyNl8xODI3NTAwNzcwTlU2AE5VQ1gYAEYAaQBsAGUAXwAyADAAMgA0ADAANwAyADYAXwAxADgAMgA3ADUAMAAwADcANwAwAHVwHQABBY9V7EZpbGVfMjAyNDA3MjZfMTgyNzUwMDc3MKVUW4+iMBT+K30+yZqeXmjxDQGVjTosmBlnHjYhI6tkVTZIZjMv/e3bllHn8rhNaKDAdzunzcoIKAVyHZ+enp4gRBQiCMPwtoScU8mYEm9LTFDFAkDNFPy0CJKinSlFGSIDCjmMzayEeXwDu2EAo+//R4EKNgMI3TAmImbKNWiuHCR+fDGZr+0Chh9V38Yg4CNBPDerJYJAYJCUK1K2v/q/VVeDGyK4STR5WkAWQ5pkZFmdql3dwToFHlBlr4DLAYdanId0skwuAFdnZr4ABEsPaPLiHiYZ5JsYkDFeUkS28QBaWoC4OtYtSepTXx1I+ad+bqpDc+7PHnOzAVSUhjJUjJsVBxVQTh5GZNV2/Z5EL/XIrAQUzUvdkWnb1ecesgXYj6g0RTqFNAPNmNZaMeEXZtKFGfl7OgGG3yhlkuur5WNzeCXl8bXf186zolqqkAqtB8kKmNMhlCQPREorouydhEU166rTrh7oJZMuAmZDYHYy5aSwrQC5DY8q7wzizANmLqj0eV9bB11T2Ti6Q+vNLzMIQ02tdqlMspxBogHDILA9IGDpf84LS5Eemr4m0fbYnGxuXdU37ckz5BnQAFkw8oqRU2olz5vdrjmdSbF1qvOq+02KZnvRTQPtk5k+wuouTpwHbikYB2ryaG35Pe+P+Ivo9tCcKscjUWpXoXS7fSXn3tcn3jfP1a4dOAKBNzuhoIJJmJp4sXTuNBMamSiH9rWztEYQx5MxwiPE9noc6uCifauSL9mlWzQihgID6vsuTz/33Ze6OzRlq3pB+2W2xcwe85RMk44XZHeBsju0+dFbO+u4PvObDAJOvc9hFzQQz7FJUpUxDcb3czS61FdyaYLI3g3bFi/gFQSwECLQAUAAAACAB5k/pYsJmHKowCAAC7BAAAGACBAAAAAAAAAAAAAAAAAAAARmlsZV8yMDI0MDcyNl8xODI3NTAwNzcwTlU4AE5VQ1gYAAAARgBpAGwAZQBfADIAMAAyADQAMAA3ADIANgBfADEAOAAyADcANQAwADAANwA3ADAACgAgAAAAAAABABgAP+AibrPf2gGBQiVus9/aAT/gIm6z39oBdXAdAAEFj1XsRmlsZV8yMDI0MDcyNl8xODI3NTAwNzcwUEsFBgAAAAABAAEAxwAAAB0DAAAAAA==";

test( "validEncodings are [\"ascii\", \"utf8\", \"utf-8\", \"utf16le\", \"utf-16le\", \"ucs2\", \"ucs-2\", \"base64\", \"base64url\", \"latin1\", \"binary\", \"hex\"]",
      () =>
      {
          expect( base64Utils.validEncodings ).toEqual( ["ascii", "utf8", "utf-8", "utf16le", "utf-16le", "ucs2", "ucs-2", "base64", "base64url", "latin1", "binary", "hex"] );
      } );

test( "isValidBase64 returns true for valid Base64 content",
      () =>
      {
          expect( base64Utils.isValidBase64( invalidContent ) ).toBe( false );
      } );

test( "cleanBase64 returns valid Base64 content",
      () =>
      {
          expect( base64Utils.isValidBase64( invalidContent ) ).toBe( false );

          expect( base64Utils.isValidBase64( base64Utils.cleanBase64( invalidContent ) ) ).toBe( true );
      } );

function readFile( path )
{
    const fs = require( "fs" );
    return fs.readFileSync( path );
}

function streamFile( pPath )
{
    const fs = require( "fs" );
    return fs.createReadStream( pPath );
}

function processStream( pPath, pOnData, pOnEnd )
{
    const stream = streamFile( pPath );

    stream.on( "data", pOnData );

    stream.on( "end", pOnEnd );

    stream.on( "error", console.error );

    stream.on( "end", stream.close );
}

// uncomment to test this case; it is a long-running test
/*
test( "toBase64 returns expected Base64 content",
      () =>
      {
          const startTime = new Date();

          const startMillis = startTime.getTime();

          const timeout = 60_000;

          console.log( "Starting long running test", startTime );

          const zipFileName = "../__test_data__/zip_files/All_Bones.zip";
          const zipFilePath = stringUtils.toAbsolutePath( zipFileName, __dirname );
          const zipContents = readFile( zipFilePath );

          const base64Text = base64Utils.toBase64( zipContents );

          expect( base64Utils.isValidBase64( base64Text ) ).toBe( true );

          const bytes = base64Utils.toBytes( base64Text );

          expect( bytes ).toEqual( zipContents );

          const base64FileName = "../__test_data__/base64/all_bones_mp3_zip.data";
          const base64FilePath = stringUtils.toAbsolutePath( base64FileName, __dirname );

          const stream = streamFile( base64FilePath );

          let index = 0;

          stream.on( "data", ( chunk ) =>
          {
              const data = chunk.toString();

              const len = data?.length;

              expect( data ).toEqual( base64Text.slice( index, len ) );

              index += len;

              console.log( "Running long duration test...(streaming test content from index",
                           index, "to", index + len, ")" );

              const currentTime = new Date();
              const currentMillis = currentTime.getTime();

              if ( (currentMillis - startMillis) > timeout )
              {
                  stream.close();
              }
          } );

          stream.on( "end", () =>
          {
              const endTime = new Date();
              const endMillis = endTime.getTime();

              const duration = ( endMillis - startMillis );

              console.log( "Ending long running test, duration", duration, "milliseconds"  );
          } );

      } );
*/

test( "round trip of test to base64 and back to text returns original text",
      () =>
      {
          const str = `This is a string to be encoded as base 64.
                      We can also encode binary files, but this is a simple test of the round trip functionality.'`;

          let base64Text = base64Utils.toBase64( str );

          let text = base64Utils.toString( base64Text );

          expect( text ).toEqual( str );
      } );
