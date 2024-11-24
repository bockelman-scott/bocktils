/** import the utilities to test **/
const jsonUtils = require( "../src/JsonInterpolationUtils.cjs" );

const objectUtils = jsonUtils.dependencies.objectUtils;

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
              expect( objectUtils.same( objParsed, obj2 ) ).toBe( false );

              expect( jsonUtils.asJson( objParsed ) ).toEqual( json );

              /*let json = jsonUtils.asJson( objA );

               let obj = jsonUtils.parseJson( json );

               let json2 = jsonUtils.asJson( obj );

               let obj2 = jsonUtils.parseJson( json2 );

               let json3 = jsonUtils.asJson( obj2 );

               let obj3 = jsonUtils.parseJson( json3 );

               expect( objectUtils.same( obj, obj2 ) ).toBe( true );

               expect( objectUtils.same( obj2, obj3 ) ).toBe( true );

               expect( json2 ).toEqual( json3 );*/
          } );
} );
