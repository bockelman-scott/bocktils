const fs = require( "fs" );

/** import the dependencies **/
const constants = require( "../src/Constants.cjs" );

/** import the utilities we are testing */
const stringUtils = require( "../src/StringUtils.cjs" );

const
    {
        asString,
        isBlank,
        asProperCaseName,
        normalizeName,
        formatPhoneNumber
    } = stringUtils;

describe( "Fix Person Names", () =>
{
    let testData1 = fs.readFileSync( "C:\\Projects\\bocktils\\test_data\\names\\names_1.txt", "utf-8" );
    let testData2 = fs.readFileSync( "C:\\Projects\\bocktils\\test_data\\names\\names_2.txt", "utf-8" );
    let testData3 = fs.readFileSync( "C:\\Projects\\bocktils\\test_data\\names\\names_3.txt", "utf-8" );

    testData1 = testData1.replaceAll( /(\r\n)+/g, "\n" );
    testData2 = testData2.replaceAll( /(\r\n)+/g, "\n" );
    testData3 = testData3.replaceAll( /(\r\n)+/g, "\n" );

    let test_data_1, test_data_2, test_data_3;

    let names_1 = [], names_2 = [], names_3 = [];
    let out_1 = [], out_2 = [], out_3 = [];

    test_data_1 = testData1.split( /(\r?\n)/g );
    for( let line of test_data_1 )
    {
        if ( !isBlank( line ) )
        {
            const names = line.split( /\|/g );
            names_1.push( { "firstName": names[0], "lastName": names[1] } );
        }
    }

    test_data_2 = testData2.split( /(\r?\n)/g );
    for( let line of test_data_2 )
    {
        if ( !isBlank( line ) )
        {
            const names = line.split( /\|/g );
            names_2.push( { "firstName": names[0], "lastName": names[1] } );
        }
    }

    test_data_3 = testData3.split( /(\r?\n)/g );
    for( let line of test_data_3 )
    {
        if ( !isBlank( line ) )
        {
            const names = line.split( /\|/g );
            names_3.push( { "firstName": names[0], "lastName": names[1] } );
        }
    }

    test( "asProperCase - 1", async() =>
          {
              out_1.length = 0;

              for( let obj of names_1 )
              {
                  const first = asProperCaseName( obj["firstName"] );
                  const last = asProperCaseName( obj["lastName"] );

                  out_1.push( { first, last, fromFirst: obj["firstName"], fromLast: obj["lastName"] } );
              }

              let out = "";

              for( let o of out_1 )
              {
                  out += o["first"] + "|" + o["last"] + "::" + o["fromFirst"] + "|" + o["fromLast"] + "\n";
              }

              console.log( out );

          }, 600_000
    );

    test( "asProperCase - 2", async() =>
          {
              out_2.length = 0;

              for( let obj of names_2 )
              {
                  const first = asProperCaseName( obj["firstName"] );
                  const last = asProperCaseName( obj["lastName"] );

                  out_2.push( { first, last, fromFirst: obj["firstName"], fromLast: obj["lastName"] } );
              }

              let out = "";

              for( let o of out_2 )
              {
                  out += o["first"] + "|" + o["last"] + "::" + o["fromFirst"] + "|" + o["fromLast"] + "\n";
              }

              console.log( out );

          }, 600_000
    );

    test( "asProperCase - 3", async() =>
          {
              out_3.length = 0;

              for( let obj of names_3 )
              {
                  const first = asProperCaseName( obj["firstName"] );
                  const last = asProperCaseName( obj["lastName"] );

                  out_3.push( { first, last, fromFirst: obj["firstName"], fromLast: obj["lastName"] } );
              }

              let out = "";

              for( let o of out_3 )
              {
                  out += o["first"] + "|" + o["last"] + "::" + o["fromFirst"] + "|" + o["fromLast"] + "\n";
              }

              console.log( out );

          }, 600_000
    );


    test( "normalizeName - 1", async() =>
          {
              out_1.length = 0;

              for( let obj of names_1 )
              {
                  const normalized = normalizeName( obj["firstName"], obj["lastName"] );

                  out_1.push( {
                                  "first": normalized.first,
                                  last: normalized.last,
                                  fromFirst: obj["firstName"],
                                  fromLast: obj["lastName"]
                              } );
              }

              let out = "";

              for( let o of out_1 )
              {
                  out += o["first"] + "|" + o["last"] + "::" + o["fromFirst"] + "|" + o["fromLast"] + "\n";
              }

              console.log( out );

          }, 600_000
    );

    test( "normalizeName - 2", async() =>
          {
              out_2.length = 0;

              for( let obj of names_2 )
              {
                  const normalized = normalizeName( obj["firstName"], obj["lastName"] );

                  out_2.push( {
                                  "first": normalized.first,
                                  last: normalized.last,
                                  fromFirst: obj["firstName"],
                                  fromLast: obj["lastName"]
                              } );
              }

              let out = "";

              for( let o of out_2 )
              {
                  out += o["first"] + "|" + o["last"] + "::" + o["fromFirst"] + "|" + o["fromLast"] + "\n";
              }

              console.log( out );

          }, 600_000
    );

    test( "normalizeName - 3", async() =>
          {
              out_3.length = 0;

              for( let obj of names_3 )
              {
                  const normalized = normalizeName( obj["firstName"], obj["lastName"] );

                  out_3.push( {
                                  "first": normalized.first,
                                  last: normalized.last,
                                  fromFirst: obj["firstName"],
                                  fromLast: obj["lastName"]
                              } );
              }

              let out = "";

              for( let o of out_3 )
              {
                  out += o["first"] + "|" + o["last"] + "::" + o["fromFirst"] + "|" + o["fromLast"] + "\n";
              }

              console.log( out );

          }, 600_000
    );

} );
