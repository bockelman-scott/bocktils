const fs = require( "node:fs" );
const fsAsync = require( "node:fs/promises" );
const path = require( "node:path" );


/** import the module we are testing */
const base64Utils = require( "../src/Base64Utils.cjs" );

const { isValidBase64, cleanBase64, encode, decode, toBytes, toText } = base64Utils;

const invalidContent = "UEsDBBQAAAAIAHmT+liwm YcqjAIAALsEAAAYAFsARmlsZV8yMDI0MDcyNl8xODI3NTAwNzcwTlU2AE5VQ1gYAEYAaQBsAGUAXwAyADAAMgA0ADAANwAyADYAXwAxADgAMgA3ADUAMAAwADcANwAwAHVwHQABBY9V7EZpbGVfMjAyNDA3MjZfMTgyNzUwMDc3MKVUW4+iMBT+K30+yZqeXmjxDQGVjTosmBlnHjYhI6tkVTZIZjMv/e3bllHn8rhNaKDAdzunzcoIKAVyHZ+enp4gRBQiCMPwtoScU8mYEm9LTFDFAkDNFPy0CJKinSlFGSIDCjmMzayEeXwDu2EAo+//R4EKNgMI3TAmImbKNWiuHCR+fDGZr+0Chh9V38Yg4CNBPDerJYJAYJCUK1K2v/q/VVeDGyK4STR5WkAWQ5pkZFmdql3dwToFHlBlr4DLAYdanId0skwuAFdnZr4ABEsPaPLiHiYZ5JsYkDFeUkS28QBaWoC4OtYtSepTXx1I+ad+bqpDc+7PHnOzAVSUhjJUjJsVBxVQTh5GZNV2/Z5EL/XIrAQUzUvdkWnb1ecesgXYj6g0RTqFNAPNmNZaMeEXZtKFGfl7OgGG3yhlkuur5WNzeCXl8bXf186zolqqkAqtB8kKmNMhlCQPREorouydhEU166rTrh7oJZMuAmZDYHYy5aSwrQC5DY8q7wzizANmLqj0eV9bB11T2Ti6Q+vNLzMIQ02tdqlMspxBogHDILA9IGDpf84LS5Eemr4m0fbYnGxuXdU37ckz5BnQAFkw8oqRU2olz5vdrjmdSbF1qvOq+02KZnvRTQPtk5k+wuouTpwHbikYB2ryaG35Pe+P+Ivo9tCcKscjUWpXoXS7fSXn3tcn3jfP1a4dOAKBNzuhoIJJmJp4sXTuNBMamSiH9rWztEYQx5MxwiPE9noc6uCifauSL9mlWzQihgID6vsuTz/33Ze6OzRlq3pB+2W2xcwe85RMk44XZHeBsju0+dFbO+u4PvObDAJOvc9hFzQQz7FJUpUxDcb3czS61FdyaYLI3g3bFi/gFQSwECLQAUAAAACAB5k/pYsJmHKowCAAC7BAAAGACBAAAAAAAAAAAAAAAAAAAARmlsZV8yMDI0MDcyNl8xODI3NTAwNzcwTlU4AE5VQ1gYAAAARgBpAGwAZQBfADIAMAAyADQAMAA3ADIANgBfADEAOAAyADcANQAwADAANwA3ADAACgAgAAAAAAABABgAP+AibrPf2gGBQiVus9/aAT/gIm6z39oBdXAdAAEFj1XsRmlsZV8yMDI0MDcyNl8xODI3NTAwNzcwUEsFBgAAAAABAAEAxwAAAB0DAAAAAA==";

const currentDirectory = path.dirname( __filename );

const projectRootDirectory = path.resolve( currentDirectory, "../../../" );

const testDataDir = path.resolve( projectRootDirectory, "test_data" );

const testFilePath = path.resolve( testDataDir, "test.png" );

const largeTestFilePath = path.resolve( testDataDir, "tree-frog-video.mp4" );

test( "encode/decode a binary file",
      async() =>
      {
          // const start = Date.now();

          const data = await fsAsync.readFile( testFilePath );

          const base64Text = encode( data );

          // console.log( `Base64 text length: ${base64Text.length}` );


          const decoded = decode( base64Text );

          expect( decoded.length ).toEqual( data.length );

          await fsAsync.writeFile( path.resolve( testDataDir, "test_decoded.png" ), Buffer.from( decoded ) );

          let encoded = encode( decoded );

          expect( encoded ).toEqual( base64Text );

          /*
           const end = Date.now();

           console.log( `Time to encode/decode a small binary file: ${end - start} ms` );
           */
      }, 60_000 );

/*
 test( "encode/decode a very large binary file",
 async() =>
 {
 const start = Date.now();

 const data = await fsAsync.readFile( largeTestFilePath );

 const base64Text = encode( data );

 console.log( `Base64 text length: ${base64Text.length}` );


 const decoded = decode( base64Text );

 expect( decoded.length ).toEqual( data.length );

 await fsAsync.writeFile( path.resolve( testDataDir, "large_test_decoded.mp4" ), Buffer.from( decoded ) );

 let encoded = encode( decoded );

 expect( encoded ).toEqual( base64Text );


 const end = Date.now();

 console.log( `Time to encode/decode a large binary file: ${end - start} ms` );

 expect( true ).toBe( true );

 }, 1_250_000 );
 */


test( "isValidBase64 returns false for invalid Base64 content",
      () =>
      {
          expect( isValidBase64( invalidContent ) ).toBe( false );
      } );

test( "cleanBase64 returns valid Base64 content",
      () =>
      {
          expect( isValidBase64( invalidContent ) ).toBe( false );

          const cleaned = cleanBase64( invalidContent );

          expect( isValidBase64( cleaned ) ).toBe( true );
      } );

test( "round trip of test to base64 and back to text returns original text",
      () =>
      {
          const str = `This is a string to be encoded as base 64.
                      
                      We can also encode binary files, but this is a simple test of the round trip functionality.`;

          // const str = "Base64y";

          let base64Text = encode( str );

          let text = toText( base64Text );

          expect( text ).toEqual( str );
      } );

