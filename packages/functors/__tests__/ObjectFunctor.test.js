const objectFunctorUtils = require( "../src/ObjectFunctor.cjs" );

const { classes } = objectFunctorUtils;

const { ObjectFunctor } = classes;

describe( "ObjectFunctor", () =>
{
    const obj =
        {
            a:
                {
                    b:
                        {
                            c:
                                {
                                    d: 4
                                }
                        }
                },
            b: {
                c:
                    {
                        d: 4
                    }
            },
            c:
                {
                    d: 4
                },
            d: 4,
            e: "abc",
            f: true,
            g: Symbol.for( "TEST" ),
            h: BigInt( 12 ),
            i: null,
            j: function( pArg ) { return pArg; }
        };

    test( "Construction",
          () =>
          {
              const functor = new ObjectFunctor( obj );

              // i will be omitted, because "i" is null
              expect( functor.length ).toEqual( 9 );

          } );
} );
