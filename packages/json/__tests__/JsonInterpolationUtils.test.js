const core = require( "@toolbocks/core" );

/** import the utilities to test **/
const jsonUtils = require( "../src/JsonUtils.cjs" );

const { dependencies, cherryPick, mergeJson, classes } = jsonUtils;

const { constants, typeUtils, stringUtils } = dependencies;

const { ObjectEntry } = constants;

const { isArray } = typeUtils;

const { asInt } = stringUtils;

const { JsonMerger } = classes;

const objA =
    {
        node_0:
            {
                value: "node-0",
                node_0_0:
                    {
                        value: "node-0-0",
                        extra: 0
                    },
                node_0_1:
                    {
                        node_0_1_0:
                            {
                                value: "node-0-1-0",
                                extra: 10
                            },
                        node_0_1_1:
                            {
                                value: "node-0-1-1",
                                extra: 11
                            }
                    }
            },
        node_1:
            {
                value: "node-1",
                extra: 123.456
            },
        node_2: "${(@path;@base:root):node_0}",
        node_3: "${(@path;@base:root):node_0.node_0_1.node_0_1_1}"
    };

objA.node_4 = objA;

const objB =
    {
        node_0: "${(@var;@base:global):objA.node_0}"
    };

const objC =
    {
        node_0: objB,
        node_1: objA
    };

objC.node_3 = objC;

const addresses =
    {
        "Apex41":
            {
                "address": "2760 S Highland Av",
                "city": "Lombard",
                "state": "IL",
                "zip": "60148"
            },
        "CityView":
            {
                "address": "1000 S Highland Av",
                "city": "Lombard",
                "state": "IL",
                "zip": "60148"
            },
        "TheVinery":
            {
                "address": "365 Vine Street",
                "city": "Glen Ellyn",
                "state": "IL",
                "zip": "60137"
            }
    };

const people =
    {
        "Apex41":
            {
                "name": "Scott Bockelman",
                "age": 32
            },
        "CityView":
            {
                "name": "Paul Davis",
                "age": 23
            },
        "TheVinery":
            {
                "name": "Jeffrey Woodward",
                "age": 25
            },
        "Prairie":
            {
                "name": "Cynthia Harris",
                "age": 37
            }
    };

describe( "JSON", () =>
{
    test( "JSON",
          () =>
          {
              let obj = { a: { b: { c: { d: 4 } } } };
              obj.e = obj.a;
              obj.f = obj.a.b;
              obj.g = obj.a.b.c;
              obj.h = obj.a.b.c.d;
              obj.i = 4;

              let json = jsonUtils.asJson( obj );
              expect( json ).toEqual( "{\"a\":{\"b\":{\"c\":{\"d\":4}}},\"e\":\"${(@path;@base:root):a}\",\"f\":\"${(@path;@base:root):a.b}\",\"g\":\"${(@path;@base:root):a.b.c}\",\"h\":4,\"i\":4}" );

              let objParsed = jsonUtils.parseJson( json );
              expect( objParsed ).toEqual( obj );

              let obj2 = {};
              json = jsonUtils.asJson( obj2 );
              expect( json ).toEqual( "{}" );

              objParsed = jsonUtils.parseJson( json );
              expect( objParsed ).toEqual( obj2 );

              obj2.child = obj2;
              json = jsonUtils.asJson( obj2 );
              expect( json ).toEqual( "{\"child\":\"${(@path;@base:root):^}\"}" );

              objParsed = jsonUtils.parseJson( json );
              // expect( objectUtils.same( objParsed, obj2 ) ).toBe( false );

              expect( jsonUtils.asJson( objParsed ) ).toEqual( json );

          } );
} );

describe( "cherryPick", () =>
{
    test( "cherryPick lets you pick a subset of an object",
          () =>
          {
              const picked = cherryPick( addresses, "Apex41.city", "TheVinery.address" );

              expect( picked ).toEqual( {
                                            "Apex41": { "city": "Lombard" },
                                            "TheVinery": { "address": "365 Vine Street" }
                                        } );

              console.log( picked );
          } );
} );


describe( "mergeJson", () =>
{
    test( "mergeJson lets you combine 2 objects",
          () =>
          {
              let merged = mergeJson( addresses, people );

              expect( Object.keys( addresses ).length ).toEqual( 3 );

              expect( Object.keys( people ).length ).toEqual( 4 );

              expect( Object.keys( merged ).length ).toEqual( 4 );

              expect( merged.Apex41.age ).toEqual( 32 );
          } );
} );

describe( "JsonMerger", () =>
{
    test( "JsonMerger is used to merge one or more JSON objects",
          () =>
          {
              const noArgs = new JsonMerger();

              let merged = noArgs.merge( addresses, people );

              expect( Object.keys( addresses ).length ).toEqual( 3 );

              expect( Object.keys( people ).length ).toEqual( 4 );

              expect( Object.keys( merged ).length ).toEqual( 4 );

              expect( merged.Apex41.age ).toEqual( 32 );
          } );

    test( "JsonMerger is used to filter the results of merging one or more JSON objects",
          () =>
          {
              const filter = function( pEntry )
              {
                  const entry = pEntry instanceof ObjectEntry ? pEntry : isArray( pEntry ) ? new ObjectEntry( pEntry ) : pEntry;

                  if ( "Lombard" === entry?.city && asInt( entry?.age ) > 25 )
                  {
                      return entry;
                  }

                  return null;
              };

              const filtering = new JsonMerger( [filter] );

              const merged = filtering.merge( addresses, people );

              console.log( merged );

              expect( Object.keys( addresses ).length ).toEqual( 3 );

              expect( Object.keys( people ).length ).toEqual( 4 );

              expect( Object.keys( merged ).length ).toEqual( 1 );

              expect( merged.Apex41.age ).toEqual( 32 );
          } );

    test( "JsonMerger is used to map the results of merging one or more JSON objects",
          () =>
          {
              const mapper = function( pEntry )
              {
                  let entry = pEntry instanceof ObjectEntry ? pEntry : isArray( pEntry ) ? new ObjectEntry( pEntry ) : pEntry;

                  if ( entry?.city )
                  {
                      entry.city = "Bloomington";
                  }
                  if ( entry?.state )
                  {
                      entry.state = "IN";
                  }
                  if ( entry?.zip )
                  {
                      entry.zip = "47405";
                  }

                  return entry;
              };

              const mapping = new JsonMerger( [], [mapper] );

              const merged = mapping.merge( addresses, people );

              console.log( merged );

              expect( Object.keys( addresses ).length ).toEqual( 3 );

              expect( Object.keys( people ).length ).toEqual( 4 );

              expect( Object.keys( merged ).length ).toEqual( 4 );

              expect( merged.Apex41.city ).toEqual( "Bloomington" );
              expect( merged.Apex41.state ).toEqual( "IN" );
              expect( merged.Apex41.zip ).toEqual( "47405" );
          } );
} );