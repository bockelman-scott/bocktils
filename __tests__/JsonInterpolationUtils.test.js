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
        node_0: "${(@var;@base:root):objA.node_0}"
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
/*
              let json = jsonUtils.asJson( objA );

              let obj = jsonUtils.parseJson( json );

              expect( objectUtils.same( objA, obj ) ).toBe( true );
*/
          } );
} );
