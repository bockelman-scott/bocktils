const fs = require( "fs" );

const moduleUtils = require( "../src/_ToolBocksModule.cjs" );

const constants = require( "../src/Constants.cjs" );

/** import the utilities we are testing */
const stringUtils = require( "../src/StringUtils.cjs" );

const { attempt, asyncAttempt, $ln } = moduleUtils;

const
    {
        asInt,
        asString,
        isBlank,
        asProperCaseName,
        normalizeName,
        formatPhoneNumber
    } = stringUtils;

const NUM_TEST_FILES = 4;

const ENCODING = "utf-8";

function configureTestData( pNumFiles, pEncoding = ENCODING )
{
    let numFiles = asInt( pNumFiles, NUM_TEST_FILES );

    let encoding = asString( pEncoding, true ) || ENCODING;

    // an array of arrays of objects structured as { firstName, lastName }
    let contents = [];

    for( let i = 0, n = numFiles; i < n; i++ )
    {
        let filename = `C:\\Projects\\bocktils\\test_data\\names\\names_${i + 1}.txt`;

        let content = fs.readFileSync( filename, encoding );

        content = content.replaceAll( /(\r\n)+/g, "\n" );

        let lines = content.split( /\n+/ );

        let names = [];

        for( let line of lines )
        {
            if ( !isBlank( line ) )
            {
                const parts = line.split( /\|/g );
                if ( 2 === $ln( parts ) )
                {
                    names.push( { "firstName": parts[0], "lastName": parts[1] } );
                }
            }
        }

        contents.push( names );
    }

    return contents;
}

describe( "Proper Case Names", () =>
{
    test( "asProperCase for Mc and Mac", () =>
    {
        let s = "mcalister";

        expect( asProperCaseName( s ) ).toEqual( "McAlister" );

        s = "Macmillan";

        expect( asProperCaseName( s ) ).toEqual( "MacMillan" );

        s = "mccoy";

        expect( asProperCaseName( s ) ).toEqual( "McCoy" );

        s = "maca";

        expect( asProperCaseName( s ) ).toEqual( "Maca" );

        s = "mcadams";

        expect( asProperCaseName( s ) ).toEqual( "McAdams" );

        s = "machio";

        expect( asProperCaseName( s ) ).toEqual( "Machio" );
    } );

    test( "asProperCase for O'Leary or O'Neil", () =>
    {
        let s = "o'neil";

        expect( asProperCaseName( s ) ).toEqual( "O'Neil" );

        s = "o'reilly";

        expect( asProperCaseName( s ) ).toEqual( "O'Reilly" );

        s = "o'leaRy";

        expect( asProperCaseName( s ) ).toEqual( "O'Leary" );
    } );

    test( "asProperCase for General Suffix", () =>
    {
        let s = "Williams iIi";

        expect( asProperCaseName( s ) ).toEqual( "Williams III" );

        s = "Reynolds iv";

        expect( asProperCaseName( s ) ).toEqual( "Reynolds IV" );

        s = "Henry viiI";

        expect( asProperCaseName( s ) ).toEqual( "Henry VIII" );
    } );

    test( "asProperCase for Mr. or Ms. or Mrs.", () =>
    {
        let s = "MR. MAnn";

        expect( asProperCaseName( s ) ).toEqual( "Mann" );

        s = "Ms. gloria";

        expect( asProperCaseName( s ) ).toEqual( "Gloria" );

        s = "Mrs. del gato";

        expect( asProperCaseName( s ) ).toEqual( "Del Gato" );
    } );


    let testData = configureTestData( NUM_TEST_FILES, ENCODING );

    let outData = [];

    test( "asProperCase", async() =>
          {
              for( let i = 0, n = NUM_TEST_FILES; i < n; i++ )
              {
                  let namesData = testData[i];

                  outData.length = 0;

                  for( let obj of namesData )
                  {
                      const first = asProperCaseName( obj["firstName"] );
                      const last = asProperCaseName( obj["lastName"] );

                      outData.push( { first, last, fromFirst: obj["firstName"], fromLast: obj["lastName"] } );
                  }

                  let out = "FIRST_NAME|LAST_NAME||INPUT_1|INPUT_2\n";

                  for( let o of outData )
                  {
                      out += o["first"] + "|" + o["last"] + "||" + o["fromFirst"] + "|" + o["fromLast"] + "\n";
                  }

                  let filename = `C:\\Projects\\bocktils\\test_data\\names\\propercase_names_${i + 1}.txt`;

                  fs.writeFileSync( filename, out, ENCODING );

                  // console.log( out );
              }

          }, 600_000
    );
} );

describe( "Normalize Names", () =>
{
    let testData = configureTestData( NUM_TEST_FILES, ENCODING );

    let outData = [];

    test( "normalizeName", async() =>
          {
              for( let i = 0, n = NUM_TEST_FILES; i < n; i++ )
              {
                  let namesData = testData[i];

                  outData.length = 0;

                  for( let obj of namesData )
                  {
                      const normalized = normalizeName( obj["firstName"], obj["lastName"] );

                      outData.push( {
                                        first: normalized.first,
                                        last: normalized.last,
                                        fromFirst: obj["firstName"],
                                        fromLast: obj["lastName"],
                                        nameContainsEmail: normalized.nameContainsEmail,
                                        nameContainsAddress: normalized.nameContainsAddress
                                    } );
                  }

                  let out = "FIRST_NAME|LAST_NAME||INPUT_1|INPUT_2||CONTAINS_EMAIL|CONTAINS_ADDRESS\n";

                  for( let o of outData )
                  {
                      out += o["first"] + "|" + o["last"] + "||" + o["fromFirst"] + "|" + o["fromLast"] + "||" + o["nameContainsEmail"] + "|" + o["nameContainsAddress"] + "\n";
                  }

                  let filename = `C:\\Projects\\bocktils\\test_data\\names\\normalized_names_${i + 1}.txt`;

                  fs.writeFileSync( filename, out, ENCODING );

                  // console.log( out );
              }

          }, 600_000
    );

} );
